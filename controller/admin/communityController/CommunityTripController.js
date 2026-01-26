import CommunityTrip from '../../../models/CommunityTripModel.js';
import CommunityMessage from '../../../models/CommunityMessageModel.js';
import Customer from '../../../models/CustomerModel.js';
import Notification from '../../../models/NotificationModel.js';
import Admin from '../../../models/AdminModel.js';
import { getIO } from '../../../socket/socketHandler.js';

// Auto-delete messages when trip end date passes
const deleteExpiredTripMessages = async () => {
  try {
    const now = new Date();
    const expiredTrips = await CommunityTrip.find({
      endDate: { $lt: now },
      status: { $ne: 'cancelled' }
    });

    for (const trip of expiredTrips) {
      // Delete all messages for expired trips
      await CommunityMessage.deleteMany({ tripId: trip._id });
      
      // Update trip status to completed
      await CommunityTrip.findByIdAndUpdate(trip._id, {
        status: 'completed'
      });
    }

    if (expiredTrips.length > 0) {
      console.log(`Deleted messages for ${expiredTrips.length} expired trips`);
    }
  } catch (error) {
    console.error('Error deleting expired trip messages:', error);
  }
};

// Run cleanup every hour
setInterval(deleteExpiredTripMessages, 60 * 60 * 1000); // 1 hour

// Run on startup
deleteExpiredTripMessages();

// Create Community Trip
const createCommunityTrip = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      tripType,
      groupType,
      maxMembers,
      organizerId,
      organizerName,
      organizerRating,
      organizerVerified,
      price,
      currency,
      itinerary,
      inclusions,
      exclusions,
      importantNotes,
      images: imagesFromBody,
      organizerImage: organizerImageFromBody
    } = req.body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate || !location) {
      return res.status(400).json({
        status: false,
        message: "Title, description, dates, and location are required"
      });
    }

    // Get user info from token if it's a user request (not admin)
    let finalOrganizerId = organizerId;
    let finalOrganizerName = organizerName;
    let finalOrganizerRating = organizerRating || 0;
    let finalOrganizerVerified = organizerVerified || false;

    // If user is creating (from frontend), use their details
    if (req.user && (!req.user.role || req.user.role !== 'admin')) {
      // This is a user request, not admin
      finalOrganizerId = req.user.id || req.user._id || req.user.userId;
      const user = await Customer.findById(finalOrganizerId);
      if (user) {
        finalOrganizerName = user.name || user.email || 'User';
        finalOrganizerRating = user.rating || 0;
        finalOrganizerVerified = user.verified || false;
      } else {
        // If user not found, use token data
        finalOrganizerName = req.user.name || req.user.email || 'User';
      }
    } else if (req.user && req.user.role === 'admin') {
      // Admin panel request - set defaults if not provided
      if (!finalOrganizerId) {
        finalOrganizerId = req.user.id || req.user._id || null;
      }
      if (!finalOrganizerName) {
        finalOrganizerName = req.user.name || 'Admin';
      }
    } else {
      // No user token - set defaults
      if (!finalOrganizerId) {
        finalOrganizerId = null;
      }
      if (!finalOrganizerName) {
        finalOrganizerName = 'Admin';
      }
    }

    // Handle images from middleware or body (for JSON format with URLs)
    const images = [];
    if (req.imageUrls?.images) {
      // From file upload middleware
      images.push(...req.imageUrls.images);
    } else if (imagesFromBody) {
      // From JSON body (array of URLs)
      if (Array.isArray(imagesFromBody)) {
        imagesFromBody.forEach(imgUrl => {
          if (typeof imgUrl === 'string') {
            images.push({ path: imgUrl });
          } else if (imgUrl.path) {
            images.push(imgUrl);
          }
        });
      } else if (typeof imagesFromBody === 'string') {
        images.push({ path: imagesFromBody });
      }
    }

    // Handle organizer image from middleware or body
    let organizerImage = null;
    if (req.imageUrls?.organizerImage) {
      organizerImage = req.imageUrls.organizerImage;
    } else if (organizerImageFromBody) {
      if (typeof organizerImageFromBody === 'string') {
        organizerImage = { path: organizerImageFromBody };
      } else if (organizerImageFromBody.path) {
        organizerImage = organizerImageFromBody;
      }
    }

    // Parse JSON strings if they exist
    let parsedItinerary = [];
    if (itinerary) {
      try {
        parsedItinerary = typeof itinerary === 'string' ? JSON.parse(itinerary) : itinerary;
      } catch (e) {
        parsedItinerary = [];
      }
    }

    let parsedInclusions = [];
    if (inclusions) {
      try {
        parsedInclusions = typeof inclusions === 'string' ? JSON.parse(inclusions) : inclusions;
      } catch (e) {
        parsedInclusions = [];
      }
    }

    let parsedExclusions = [];
    if (exclusions) {
      try {
        parsedExclusions = typeof exclusions === 'string' ? JSON.parse(exclusions) : exclusions;
      } catch (e) {
        parsedExclusions = [];
      }
    }

    // Determine approval status - user-created trips need approval, admin-created are auto-approved
    const isAdminRequest = req.user && req.user.role === 'admin';
    const approvalStatus = isAdminRequest ? 'approved' : 'pending';

    const tripData = {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      tripType: tripType || 'other',
      groupType: groupType || 'Mixed Group',
      maxMembers: maxMembers || 20,
      organizerId: finalOrganizerId,
      organizerName: finalOrganizerName,
      organizerRating: finalOrganizerRating,
      organizerVerified: finalOrganizerVerified,
      price: price || 0,
      currency: currency || 'INR',
      itinerary: parsedItinerary,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      importantNotes: importantNotes || '',
      images,
      organizerImage,
      status: 'upcoming',
      approvalStatus: approvalStatus,
      members: []
    };

    const newTrip = await CommunityTrip.create(tripData);

    // If user-created trip, create notification for admins
    if (!isAdminRequest && finalOrganizerId) {
      const admins = await Admin.find({});
      const user = await Customer.findById(finalOrganizerId);
      
      for (const admin of admins) {
        await Notification.create({
          adminId: admin._id,
          type: 'community_trip_creation_request',
          title: 'New Community Trip Request',
          message: `${user?.name || user?.email || 'A user'} wants to create a community trip: "${title}"`,
          tripId: newTrip._id,
          requestUserId: finalOrganizerId,
          isRead: false
        });
      }

      // Emit Socket.IO notification
      const io = getIO();
      if (io) {
        for (const admin of admins) {
          io.to(`admin:${admin._id.toString()}`).emit('admin-notification', {
            type: 'community_trip_creation_request',
            title: 'New Community Trip Request',
            message: `${user?.name || user?.email || 'A user'} wants to create a community trip: "${title}"`,
            tripId: newTrip._id,
            requestUserId: finalOrganizerId,
            createdAt: new Date()
          });
        }
      }
    }

    return res.status(201).json({
      status: true,
      message: isAdminRequest 
        ? "Community trip created successfully" 
        : "Community trip request submitted. Waiting for admin approval.",
      data: newTrip
    });

  } catch (error) {
    console.error("Error creating community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating community trip",
      error: error.message,
    });
  }
};

// Get All Community Trips
const getAllCommunityTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const isAdmin = req.user && req.user.role === 'admin';

    const query = {};
    if (status) {
      query.status = status;
    }
    
    // For non-admin users, only show approved trips
    // Also include trips without approvalStatus (legacy trips - treat as approved)
    if (!isAdmin) {
      query.$or = [
        { approvalStatus: 'approved' },
        { approvalStatus: { $exists: false } } // Legacy trips without approvalStatus
      ];
    }

    const totalTrips = await CommunityTrip.countDocuments(query);
    
    const trips = await CommunityTrip.find(query)
      .populate('organizerId', 'name email phone')
      .populate('members.userId', 'name email')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalTrips / limit);

    return res.status(200).json({
      status: true,
      message: "Community trips retrieved successfully",
      data: trips,
      pagination: {
        currentPage: page,
        totalPages,
        totalTrips,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching community trips:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching community trips",
      error: error.message,
    });
  }
};

// Get Community Trip by ID
const getCommunityTripById = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await CommunityTrip.findById(tripId)
      .populate('organizerId', 'name email phone')
      .populate('members.userId', 'name email phone');

    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community trip retrieved successfully",
      data: trip
    });
  } catch (error) {
    console.error("Error fetching community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching community trip",
      error: error.message,
    });
  }
};

// Update Community Trip
const updateCommunityTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    let data = req.body;

    // Parse JSON strings if they exist
    const jsonFields = ['itinerary', 'inclusions', 'exclusions']
    jsonFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        try {
          data[field] = JSON.parse(data[field])
        } catch (e) {
          // Keep as is if parsing fails
        }
      }
    })

    // Handle date fields
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    // Handle images from middleware
    if (req.imageUrls?.images) {
      data.images = req.imageUrls.images;
    }

    if (req.imageUrls?.organizerImage) {
      data.organizerImage = req.imageUrls.organizerImage;
    }

    const result = await CommunityTrip.findByIdAndUpdate(tripId, data, { new: true })
      .populate('organizerId', 'name email phone')
      .populate('members.userId', 'name email');

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community trip updated successfully",
      data: result
    });
  } catch (error) {
    console.error("Error updating community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating community trip",
      error: error.message,
    });
  }
};

// Delete Community Trip
const deleteCommunityTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Also delete all messages related to this trip
    await CommunityMessage.deleteMany({ tripId });

    const result = await CommunityTrip.findByIdAndDelete(tripId);

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community trip deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting community trip",
      error: error.message,
    });
  }
};

// Join Community Trip (User action)
const joinCommunityTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    // Get userId from token (req.user) or from body
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.body?.userId;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    const trip = await CommunityTrip.findById(tripId).populate('organizerId');

    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    // Check if user is already a member
    const existingMember = trip.members.find(m => m.userId.toString() === userId);
    if (existingMember) {
      return res.status(400).json({
        status: false,
        message: "User is already a member of this trip"
      });
    }

    // Check if trip is full
    const approvedMembers = trip.members.filter(m => m.status === 'approved').length;
    if (approvedMembers >= trip.maxMembers) {
      return res.status(400).json({
        status: false,
        message: "Trip is full"
      });
    }

    // Get user info
    const user = await Customer.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Add member
    trip.members.push({
      userId,
      joinedAt: new Date(),
      status: 'pending'
    });

    await trip.save();

    // Create notification for all admins
    const admins = await Admin.find({});
    console.log(`Creating notifications for ${admins.length} admins`);
    const notifications = [];

    for (const admin of admins) {
      const notification = await Notification.create({
        adminId: admin._id,
        type: 'community_trip_join_request',
        title: 'New Join Request',
        message: `${user.name || user.email} wants to join "${trip.title}"`,
        tripId: trip._id,
        requestUserId: userId,
        isRead: false
      });

      // Populate notification for better data
      await notification.populate('requestUserId', 'name email profileImage');
      await notification.populate('tripId', 'title location');

      notifications.push(notification);
      console.log(`Notification created for admin ${admin._id}: ${notification._id}`);
    }

    // Emit notification to all connected admin clients via Socket.IO
    const io = getIO();
    if (io) {
      console.log('Socket.IO instance found, emitting notifications');
      for (const notification of notifications) {
        const adminId = notification.adminId.toString();
        const populatedNotification = {
          _id: notification._id,
          type: 'community_trip_join_request',
          title: 'New Join Request',
          message: `${user.name || user.email} wants to join "${trip.title}"`,
          tripId: notification.tripId ? {
            _id: notification.tripId._id,
            title: notification.tripId.title,
            location: notification.tripId.location
          } : {
            _id: trip._id,
            title: trip.title,
            location: trip.location
          },
          requestUserId: notification.requestUserId ? {
            _id: notification.requestUserId._id,
            name: notification.requestUserId.name,
            email: notification.requestUserId.email,
            profileImage: notification.requestUserId.profileImage
          } : {
            _id: userId,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage
          },
          isRead: false,
          isFavorite: false,
          createdAt: notification.createdAt
        };
        
        console.log(`Emitting notification to admin room: admin:${adminId}`);
        io.to(`admin:${adminId}`).emit('admin-notification', populatedNotification);
      }
    } else {
      console.log('Socket.IO instance not found');
    }

    return res.status(200).json({
      status: true,
      message: "Join request submitted successfully. Waiting for admin approval.",
      data: trip
    });
  } catch (error) {
    console.error("Error joining community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error joining community trip",
      error: error.message,
    });
  }
};


// Approve Community Trip
const approveCommunityTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await CommunityTrip.findById(tripId).populate('organizerId');

    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    if (trip.approvalStatus === 'approved') {
      return res.status(400).json({
        status: false,
        message: "Trip is already approved"
      });
    }

    trip.approvalStatus = 'approved';
    await trip.save();

    // Send email notification to user
    if (trip.organizerId && trip.organizerId.email) {
      // TODO: Implement email sending
      console.log(`Sending approval email to ${trip.organizerId.email} for trip: ${trip.title}`);
    }

    // Update notification
    await Notification.updateMany(
      { tripId: trip._id, $or: [{ type: 'community_trip_join_request' }, { type: 'community_trip_creation_request' }] },
      { isRead: true, readAt: new Date() }
    );

    // Emit Socket.IO event
    const io = getIO();
    if (io && trip.organizerId) {
      io.to(`user:${trip.organizerId._id.toString()}`).emit('trip-approved', {
        tripId: trip._id,
        title: trip.title,
        message: `Your community trip "${trip.title}" has been approved!`
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community trip approved successfully",
      data: trip
    });
  } catch (error) {
    console.error("Error approving community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error approving community trip",
      error: error.message,
    });
  }
};

// Reject Community Trip
const rejectCommunityTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await CommunityTrip.findById(tripId).populate('organizerId');

    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    if (trip.approvalStatus === 'rejected') {
      return res.status(400).json({
        status: false,
        message: "Trip is already rejected"
      });
    }

    trip.approvalStatus = 'rejected';
    await trip.save();

    // Send email notification to user
    if (trip.organizerId && trip.organizerId.email) {
      // TODO: Implement email sending
      console.log(`Sending rejection email to ${trip.organizerId.email} for trip: ${trip.title}`);
    }

    // Update notification
    await Notification.updateMany(
      { tripId: trip._id, $or: [{ type: 'community_trip_join_request' }, { type: 'community_trip_creation_request' }] },
      { isRead: true, readAt: new Date() }
    );

    // Emit Socket.IO event
    const io = getIO();
    if (io && trip.organizerId) {
      io.to(`user:${trip.organizerId._id.toString()}`).emit('trip-rejected', {
        tripId: trip._id,
        title: trip.title,
        message: `Your community trip "${trip.title}" has been rejected.`
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community trip rejected successfully",
      data: trip
    });
  } catch (error) {
    console.error("Error rejecting community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error rejecting community trip",
      error: error.message,
    });
  }
};

export {
  createCommunityTrip,
  getAllCommunityTrips,
  getCommunityTripById,
  updateCommunityTrip,
  deleteCommunityTrip,
  joinCommunityTrip,
  approveCommunityTrip,
  rejectCommunityTrip
};

