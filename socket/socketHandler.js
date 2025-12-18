import jwt from 'jsonwebtoken';
import CommunityMessage from '../models/CommunityMessageModel.js';
import CommunityTrip from '../models/CommunityTripModel.js';
import Admin from '../models/AdminModel.js';
import User from '../models/UserModel.js';

export const setupSocketIO = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const secretKey = process.env.JWT_SECRET || 'secret';
      const decoded = jwt.verify(token, secretKey);
      
      // Attach user info to socket
      socket.userId = decoded.id || decoded._id;
      socket.userRole = decoded.role || 'user';
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join a trip room
    socket.on('join-trip', async (tripId) => {
      try {
        // Verify trip exists
        const trip = await CommunityTrip.findById(tripId);
        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        socket.join(`trip:${tripId}`);
        console.log(`User ${socket.userId} joined trip ${tripId}`);
        
        socket.emit('joined-trip', { tripId });
      } catch (error) {
        console.error('Error joining trip:', error);
        socket.emit('error', { message: 'Error joining trip' });
      }
    });

    // Leave a trip room
    socket.on('leave-trip', (tripId) => {
      socket.leave(`trip:${tripId}`);
      console.log(`User ${socket.userId} left trip ${tripId}`);
    });

    // Send a message
    socket.on('send-message', async (data) => {
      try {
        const { tripId, message, messageType, parentMessageId } = data;

        if (!tripId || !message) {
          socket.emit('error', { message: 'Trip ID and message are required' });
          return;
        }

        // Verify trip exists
        const trip = await CommunityTrip.findById(tripId);
        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        // Get user info
        let userName = 'Admin';
        let userImage = null;
        let userId = null;
        let adminId = null;

        if (socket.userRole === 'admin') {
          const admin = await Admin.findById(socket.userId);
          if (admin) {
            userName = admin.name || 'Admin';
            adminId = admin._id;
          }
        } else {
          const user = await User.findById(socket.userId);
          if (user) {
            userName = user.name || 'User';
            userImage = user.profileImage;
            userId = user._id;
          }
        }

        // Create message
        const messageData = {
          tripId,
          userId: userId || null,
          userName,
          userImage,
          message,
          messageType: messageType || 'general',
          parentMessageId: parentMessageId || null,
          isAdminReply: socket.userRole === 'admin',
          adminId: adminId || null
        };

        const newMessage = await CommunityMessage.create(messageData);

        // Populate user data
        await newMessage.populate('userId', 'name email');
        await newMessage.populate('adminId', 'name email');

        // Update trip message count
        await CommunityTrip.findByIdAndUpdate(tripId, {
          $inc: { messageCount: 1 }
        });

        // Emit to all users in the trip room
        io.to(`trip:${tripId}`).emit('new-message', newMessage);

        console.log(`Message sent in trip ${tripId} by ${userName}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Update message
    socket.on('update-message', async (data) => {
      try {
        const { messageId, message } = data;

        const updatedMessage = await CommunityMessage.findByIdAndUpdate(
          messageId,
          { message },
          { new: true }
        ).populate('userId', 'name email')
         .populate('adminId', 'name email');

        if (!updatedMessage) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Emit to all users in the trip room
        io.to(`trip:${updatedMessage.tripId}`).emit('message-updated', updatedMessage);
      } catch (error) {
        console.error('Error updating message:', error);
        socket.emit('error', { message: 'Error updating message' });
      }
    });

    // Delete message
    socket.on('delete-message', async (data) => {
      try {
        const { messageId } = data;

        const message = await CommunityMessage.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Delete all replies to this message
        await CommunityMessage.deleteMany({ parentMessageId: messageId });

        // Delete the message
        await CommunityMessage.findByIdAndDelete(messageId);

        // Update trip message count
        await CommunityTrip.findByIdAndUpdate(message.tripId, {
          $inc: { messageCount: -1 }
        });

        // Emit to all users in the trip room
        io.to(`trip:${message.tripId}`).emit('message-deleted', { messageId });

        console.log(`Message ${messageId} deleted`);
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Error deleting message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

