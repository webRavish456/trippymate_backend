import jwt from 'jsonwebtoken';
import CommunityMessage from '../models/CommunityMessageModel.js';
import CommunityTrip from '../models/CommunityTripModel.js';
import Admin from '../models/AdminModel.js';
import Customer from '../models/CustomerModel.js';
import Notification from '../models/NotificationModel.js';

// Store io instance globally
let globalIO = null;

export const setupSocketIO = (io) => {
  globalIO = io;
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
      // User tokens have 'userId', admin tokens have 'id' or '_id'
      socket.userId = decoded.userId || decoded.id || decoded._id;
      socket.userRole = decoded.role || 'user';
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}, Role: ${socket.userRole}`);

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

        // Check if trip is approved (for user-created trips)
        if (trip.approvalStatus && trip.approvalStatus !== 'approved') {
          socket.emit('error', { message: 'This trip is not approved yet' });
          return;
        }

        // Get user info
        let userName = 'Admin';
        let userImage = null;
        let userId = null;
        let adminId = null;
        let user = null; // Store user object for notifications

        const isAdmin = socket.userRole && String(socket.userRole).toLowerCase().includes('admin');
        if (isAdmin) {
          const admin = await Admin.findById(socket.userId);
          if (admin) {
            userName = admin.name || 'Admin';
            adminId = admin._id;
          } else {
            console.error(`Admin not found in database: ${socket.userId}`);
            socket.emit('error', { message: 'Admin not found' });
            return;
          }
        } else {
          if (!socket.userId) {
            console.error('socket.userId is missing for user message');
            socket.emit('error', { message: 'User authentication failed' });
            return;
          }
          
          user = await Customer.findById(socket.userId);
          if (!user) {
            console.error(`User not found in database: ${socket.userId}`);
            socket.emit('error', { message: 'User not found' });
            return;
          }
          userName = user.name || user.email || 'User';
          userImage = user.profilePicture || user.profileImage;
          userId = user._id;

          // Check if user is an approved member (for non-admin users)
          const isMember = trip.members.some(m => {
            const memberUserId = m.userId?.toString() || m.userId;
            return memberUserId === socket.userId?.toString() && m.status === 'approved';
          });
          
          // Also check if user is the organizer
          const isOrganizer = trip.organizerId?.toString() === socket.userId?.toString();
          
          if (!isMember && !isOrganizer) {
            socket.emit('error', { message: 'You must be an approved member to send messages' });
            return;
          }
        }

        // Create message
        const messageData = {
          tripId,
          userName,
          userImage: userImage || null,
          message,
          messageType: messageType || 'general',
          parentMessageId: parentMessageId || null,
          isAdminReply: isAdmin,
        };

        // Set userId or adminId based on role
        if (isAdmin) {
          messageData.adminId = adminId;
        } else {
          messageData.userId = userId;
        }

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

        // If message is from a user (not admin), create notification for admins
        if (socket.userRole !== 'admin' && userId) {
          try {
            const admins = await Admin.find({});
            for (const admin of admins) {
              const notification = await Notification.create({
                adminId: admin._id,
                type: 'community_trip_message',
                title: 'New Message in Community Trip',
                message: `${userName} sent a message in "${trip.title}"`,
                tripId: trip._id,
                requestUserId: userId,
                isRead: false
              });

              // Emit notification to admin
              io.to(`admin:${admin._id.toString()}`).emit('admin-notification', {
                _id: notification._id,
                type: 'community_trip_message',
                title: 'New Message in Community Trip',
                message: `${userName} sent a message in "${trip.title}"`,
                tripId: {
                  _id: trip._id,
                  title: trip.title,
                  location: trip.location
                },
                requestUserId: {
                  _id: userId,
                  name: userName,
                  email: user?.email || '',
                  profileImage: userImage
                },
                isRead: false,
                isFavorite: false,
                createdAt: notification.createdAt
              });
            }
          } catch (notifError) {
            console.error('Error creating message notification:', notifError);
            // Don't fail message sending if notification fails
          }
        }

        console.log(`Message sent in trip ${tripId} by ${userName}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { 
          message: error.message || 'Error sending message',
          error: error.toString()
        });
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

    // Handle community trip join request
    socket.on('request-join-trip', async (data) => {
      try {
        const { tripId } = data;

        if (!tripId) {
          socket.emit('error', { message: 'Trip ID is required' });
          return;
        }

        const userId = socket.userId;
        const trip = await CommunityTrip.findById(tripId).populate('organizerId');

        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        // Check if user is already a member
        const existingMember = trip.members.find(m => m.userId.toString() === userId);
        if (existingMember) {
          socket.emit('error', { message: 'You are already a member of this trip' });
          return;
        }

        // Check if trip is full
        const approvedMembers = trip.members.filter(m => m.status === 'approved').length;
        if (approvedMembers >= trip.maxMembers) {
          socket.emit('error', { message: 'Trip is full' });
          return;
        }

        // Get user info (frontend users are in Customer collection)
        const user = await Customer.findById(userId);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Add member with pending status
        trip.members.push({
          userId,
          joinedAt: new Date(),
          status: 'pending'
        });

        await trip.save();

        // Create notification for all admins
        const admins = await Admin.find({});
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

          notifications.push(notification);

          // Emit notification to admin if they're connected
          io.to(`admin:${admin._id}`).emit('admin-notification', {
            _id: notification._id,
            type: 'community_trip_join_request',
            title: 'New Join Request',
            message: `${user.name || user.email} wants to join "${trip.title}"`,
            tripId: trip._id,
            requestUserId: userId,
            userName: user.name || user.email,
            userEmail: user.email,
            userImage: user.profileImage,
            tripTitle: trip.title,
            tripLocation: trip.location,
            createdAt: notification.createdAt
          });
        }

        socket.emit('join-request-submitted', {
          message: 'Join request submitted successfully. Waiting for admin approval.',
          tripId: trip._id
        });

        console.log(`Join request created for trip ${tripId} by user ${userId}`);
      } catch (error) {
        console.error('Error handling join request:', error);
        socket.emit('error', { message: 'Error submitting join request' });
      }
    });

    // Admin joins admin room (role can be 'admin', 'Admin', 'Super Admin', etc.)
    socket.on('join-admin-room', () => {
      if (socket.userRole && String(socket.userRole).toLowerCase().includes('admin')) {
        socket.join(`admin:${socket.userId}`);
        console.log(`Admin ${socket.userId} joined admin room`);
      }
    });

    // User (customer) joins user room for booking/trip notifications
    socket.on('join-user-room', () => {
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        console.log(`User ${socket.userId} joined user room`);
      }
    });

    // Captain joins captain room for assignment notifications
    socket.on('join-captain-room', (captainId) => {
      const isAdminRole = socket.userRole && String(socket.userRole).toLowerCase().includes('admin');
      if (captainId && (isAdminRole || socket.userRole === 'captain')) {
        socket.join(`captain:${captainId}`);
        console.log(`Captain ${captainId} joined captain room`);
      }
    });

    // Vendor joins vendor room for booking notifications
    socket.on('join-vendor-room', (vendorId) => {
      const isAdminRole = socket.userRole && String(socket.userRole).toLowerCase().includes('admin');
      if (vendorId && (isAdminRole || socket.userRole === 'vendor')) {
        socket.join(`vendor:${vendorId}`);
        console.log(`Vendor ${vendorId} joined vendor room`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

// Export function to get io instance
export const getIO = () => globalIO;

