import CommunityMessage from '../../../models/CommunityMessageModel.js';
import CommunityTrip from '../../../models/CommunityTripModel.js';

// Create Message
const createMessage = async (req, res) => {
  try {
    const { tripId, userId, userName, userImage, message, messageType, parentMessageId, isAdminReply, adminId } = req.body;

    if (!tripId || !message) {
      return res.status(400).json({
        status: false,
        message: "Trip ID and message are required"
      });
    }

    // Verify trip exists
    const trip = await CommunityTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    const messageData = {
      tripId,
      userId: userId || null,
      userName: userName || 'Admin',
      userImage: userImage || null,
      message,
      messageType: messageType || 'general',
      parentMessageId: parentMessageId || null,
      isAdminReply: isAdminReply || false,
      adminId: adminId || null
    };

    const newMessage = await CommunityMessage.create(messageData);

    // Update trip message count
    await CommunityTrip.findByIdAndUpdate(tripId, {
      $inc: { messageCount: 1 }
    });

    // Populate user data
    await newMessage.populate('userId', 'name email');
    await newMessage.populate('adminId', 'name email');

    return res.status(201).json({
      status: true,
      message: "Message created successfully",
      data: newMessage
    });

  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating message",
      error: error.message,
    });
  }
};

// Get Messages for a Trip
const getTripMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const messages = await CommunityMessage.find({ tripId })
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .populate('parentMessageId')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: true,
      message: "Messages retrieved successfully",
      data: messages
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
};

// Update Message
const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    const updatedMessage = await CommunityMessage.findByIdAndUpdate(
      messageId,
      { message },
      { new: true }
    ).populate('userId', 'name email')
     .populate('adminId', 'name email');

    if (!updatedMessage) {
      return res.status(404).json({
        status: false,
        message: "Message not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Message updated successfully",
      data: updatedMessage
    });
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating message",
      error: error.message,
    });
  }
};

// Delete Message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Also delete all replies to this message
    await CommunityMessage.deleteMany({ parentMessageId: messageId });

    const result = await CommunityMessage.findByIdAndDelete(messageId);

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Message not found"
      });
    }

    // Update trip message count
    await CommunityTrip.findByIdAndUpdate(result.tripId, {
      $inc: { messageCount: -1 }
    });

    return res.status(200).json({
      status: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting message",
      error: error.message,
    });
  }
};

export {
  createMessage,
  getTripMessages,
  updateMessage,
  deleteMessage
};

