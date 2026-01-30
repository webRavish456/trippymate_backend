import Notification from '../../../models/NotificationModel.js';
import CommunityTrip from '../../../models/CommunityTripModel.js';
import Admin from '../../../models/AdminModel.js';
import { getIO } from '../../../socket/socketHandler.js';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

const emailTransporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
  : null;

async function sendJoinStatusEmail(toEmail, userName, tripTitle, approved) {
  if (!emailTransporter || !toEmail) return;
  const subject = approved
    ? `Your join request for "${tripTitle}" has been approved – Trippymate`
    : `Your join request for "${tripTitle}" was not approved – Trippymate`;
  const text = approved
    ? `Hello ${userName || 'there'},\n\nYour request to join the community trip "${tripTitle}" has been approved. You can view the trip and connect with other members in the app.\n\nBest regards,\nTrippymate Team`
    : `Hello ${userName || 'there'},\n\nYour request to join the community trip "${tripTitle}" was not approved this time. You can explore other community trips on Trippymate.\n\nBest regards,\nTrippymate Team`;
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject,
      text
    });
  } catch (err) {
    console.error('Join status email failed:', err);
  }
}

async function sendJoinStatusSms(phone, tripTitle, approved) {
  if (!phone || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) return;
  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const body = approved
      ? `Trippymate: Your request to join "${tripTitle}" has been approved. Check the app for details.`
      : `Trippymate: Your request to join "${tripTitle}" was not approved. Explore other trips on the app.`;
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: String(phone).replace(/\s/g, '')
    });
  } catch (err) {
    console.error('Join status SMS failed:', err);
  }
}

// Get all notifications for admin
const getAdminNotifications = async (req, res) => {
  try {

    let adminId = req.user?.id || req.user?._id || req.user?.adminId;
    
    console.log('Raw adminId from token:', adminId);
    console.log('req.user:', JSON.stringify(req.user, null, 2));
    
 
    if (!adminId && req.user?.email) {
      console.log('AdminId not in token, fetching by email:', req.user.email);
      const admin = await Admin.findOne({ email: req.user.email });
      if (admin) {
        adminId = admin._id;
        console.log('Found admin by email, adminId:', adminId);
      }
    }
    
    if (!adminId) {
      return res.status(401).json({
        status: false,
        message: "Admin ID not found in token"
      });
    }

 
    if (typeof adminId === 'string') {
      try {
        adminId = new mongoose.Types.ObjectId(adminId);
      } catch (e) {
        console.error('Invalid adminId format:', adminId);
        return res.status(400).json({
          status: false,
          message: "Invalid admin ID format"
        });
      }
    }

    const { limit = 50, unreadOnly = false } = req.query;

    const query = { adminId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    console.log('Notification query:', query);
    const notifications = await Notification.find(query)
      .populate('requestUserId', 'name email profileImage')
      .populate('tripId', 'title location startDate endDate')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    console.log(`Found ${notifications.length} notifications for admin ${adminId}`);
    const unreadCount = await Notification.countDocuments({ adminId, isRead: false });

    return res.status(200).json({
      status: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const adminId = req.user?.id || req.user?._id || req.user?.adminId;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, adminId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        status: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      status: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const adminId = req.user?.id || req.user?._id || req.user?.adminId;

    await Notification.updateMany(
      { adminId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      status: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      status: false,
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
};

// Approve community trip join request
const approveJoinRequest = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const adminId = req.user?.id || req.user?._id || req.user?.adminId;

    const notification = await Notification.findById(notificationId)
      .populate('tripId')
      .populate('requestUserId');

    if (!notification) {
      return res.status(404).json({
        status: false,
        message: "Notification not found"
      });
    }

    if (notification.adminId?.toString() !== adminId) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized"
      });
    }

    const trip = await CommunityTrip.findById(notification.tripId._id);
    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Trip not found"
      });
    }

    // Update member status to approved
    const member = trip.members.find(
      m => m.userId.toString() === notification.requestUserId._id.toString()
    );

    if (!member) {
      return res.status(404).json({
        status: false,
        message: "Member not found in trip"
      });
    }

    member.status = 'approved';
    await trip.save();

    // Mark notification as read and set action taken (hides Approve/Reject buttons)
    notification.isRead = true;
    notification.readAt = new Date();
    notification.actionTaken = 'approved';
    await notification.save();

    const requestUserId = notification.requestUserId._id || notification.requestUserId;
    const tripTitle = trip.title || 'Community Trip';
    const userName = notification.requestUserId?.name || notification.requestUserId?.email || 'User';
    const userEmail = notification.requestUserId?.email;
    const userPhone = notification.requestUserId?.phone;

    // Create in-app notification for the user who was approved
    const userNotif = await Notification.create({
      userId: requestUserId,
      type: 'join_request_approved',
      title: 'Join request approved',
      message: `Your request to join "${tripTitle}" has been approved.`,
      tripId: trip._id,
      isRead: false
    });

    // Send email and optional SMS to the user
    if (userEmail) {
      await sendJoinStatusEmail(userEmail, userName, tripTitle, true);
    }
    if (userPhone) {
      await sendJoinStatusSms(userPhone, tripTitle, true);
    }

    // Emit to user so frontend can update Joined/Pending state
    const io = getIO();
    if (io) {
      io.to(`admin:${adminId}`).emit('join-request-approved', {
        notificationId: notification._id,
        tripId: trip._id,
        userId: requestUserId
      });
      io.to(`user:${requestUserId.toString()}`).emit('join-request-status', {
        tripId: trip._id,
        status: 'approved',
        title: userNotif.title,
        message: userNotif.message
      });
    }

    return res.status(200).json({
      status: true,
      message: "Join request approved successfully",
      data: {
        trip,
        notification
      }
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    return res.status(500).json({
      status: false,
      message: "Error approving join request",
      error: error.message,
    });
  }
};

// Toggle favorite status
const toggleFavorite = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const adminId = req.user?.id || req.user?._id || req.user?.adminId;

    const notification = await Notification.findOne({ _id: notificationId, adminId });

    if (!notification) {
      return res.status(404).json({
        status: false,
        message: "Notification not found"
      });
    }

    notification.isFavorite = !notification.isFavorite;
    await notification.save();

    return res.status(200).json({
      status: true,
      message: notification.isFavorite ? "Notification marked as favorite" : "Notification removed from favorites",
      data: notification
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return res.status(500).json({
      status: false,
      message: "Error toggling favorite",
      error: error.message,
    });
  }
};

// Reject community trip join request
const rejectJoinRequest = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const adminId = req.user?.id || req.user?._id || req.user?.adminId;

    const notification = await Notification.findById(notificationId)
      .populate('tripId')
      .populate('requestUserId');

    if (!notification) {
      return res.status(404).json({
        status: false,
        message: "Notification not found"
      });
    }

    if (notification.adminId?.toString() !== adminId) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized"
      });
    }

    const trip = await CommunityTrip.findById(notification.tripId._id);
    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Trip not found"
      });
    }

    // Update member status to rejected
    const member = trip.members.find(
      m => m.userId.toString() === notification.requestUserId._id.toString()
    );

    if (member) {
      member.status = 'rejected';
      await trip.save();
    }

    // Mark notification as read and set action taken (hides Approve/Reject buttons)
    notification.isRead = true;
    notification.readAt = new Date();
    notification.actionTaken = 'rejected';
    await notification.save();

    const requestUserId = notification.requestUserId._id || notification.requestUserId;
    const tripTitle = trip.title || 'Community Trip';
    const userName = notification.requestUserId?.name || notification.requestUserId?.email || 'User';
    const userEmail = notification.requestUserId?.email;
    const userPhone = notification.requestUserId?.phone;

    // Create in-app notification for the user who was rejected
    const userNotif = await Notification.create({
      userId: requestUserId,
      type: 'join_request_rejected',
      title: 'Join request not approved',
      message: `Your request to join "${tripTitle}" was not approved.`,
      tripId: trip._id,
      isRead: false
    });

    // Send email and optional SMS to the user
    if (userEmail) {
      await sendJoinStatusEmail(userEmail, userName, tripTitle, false);
    }
    if (userPhone) {
      await sendJoinStatusSms(userPhone, tripTitle, false);
    }

    // Emit to user so frontend can update Pending state
    const io = getIO();
    if (io) {
      io.to(`admin:${adminId}`).emit('join-request-rejected', {
        notificationId: notification._id,
        tripId: trip._id,
        userId: requestUserId
      });
      io.to(`user:${requestUserId.toString()}`).emit('join-request-status', {
        tripId: trip._id,
        status: 'rejected',
        title: userNotif.title,
        message: userNotif.message
      });
    }

    return res.status(200).json({
      status: true,
      message: "Join request rejected successfully",
      data: {
        trip,
        notification
      }
    });
  } catch (error) {
    console.error("Error rejecting join request:", error);
    return res.status(500).json({
      status: false,
      message: "Error rejecting join request",
      error: error.message,
    });
  }
};

export {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  approveJoinRequest,
  rejectJoinRequest,
  toggleFavorite
};

