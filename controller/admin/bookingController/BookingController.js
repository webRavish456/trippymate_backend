import moment from "moment-timezone";
import Booking from "../../../models/BookingModel.js";
import Coupon from "../../../models/CouponModel.js";
import PromoCode from "../../../models/PromoCodeModel.js";
import UserReward from "../../../models/UserRewardModel.js";
import Notification from "../../../models/NotificationModel.js";
import Admin from "../../../models/AdminModel.js";
import { getIO } from "../../../socket/socketHandler.js";

const showBooking = async (req, res) => {
  try {
    const bookingDetail = await Booking.find({})
      .populate("userId")
      .populate("packageId")
      .populate("captainId", "name email phone");

    const formattedBookings = bookingDetail.map((booking) => {
      const guestCount = booking.guestDetails?.length || 0;

      // Extract package prices safely
      const adultPrice = booking.packageId?.price?.adult || booking.packageId?.price || 0;
      const childPrice = booking.packageId?.price?.child || booking.packageId?.price || 0;
      const infantPrice = booking.packageId?.price?.infant || 0;

      let totalAmount = 0;

      booking.guestDetails?.forEach((guest) => {
        if (guest.guestAge > 18) {
          totalAmount += adultPrice;
        } else if (guest.guestAge >= 5) {
          totalAmount += childPrice;
        } else {
          totalAmount += infantPrice;
        }
      });

      return {
        _id: booking._id,
        packageName: booking.packageId?.title || "N/A",
        packageId: booking.packageId?._id || booking.packageId,
        userName: booking.userId?.name || "N/A",
        totalGuests: guestCount,
        totalAmount,
        guestDetails: booking.guestDetails,
        status: booking.status,
        captainId: booking.captainId?._id || booking.captainId,
        assignedCaptain: booking.captainId ? {
          _id: booking.captainId._id,
          name: booking.captainId.name,
          email: booking.captainId.email
        } : null,
        createdAt: moment(booking.createdAt)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        tripdate: moment(booking.tripdate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      data: formattedBookings,
    });
  } catch (err) {
    return res.status(501).json({
      status: false,
      message: "Error occurred",
      error: err.message,
    });
  }
};

// Get Single Booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
      .populate("userId", "name email phone address")
      .populate("packageId")
      .populate("captainId", "name email phone")
      .populate("couponCode", "code title discountType discountValue")
      .populate("promoCode", "code title discountType discountValue");

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    const guestCount = booking.guestDetails?.length || 0;
    const adultPrice = booking.packageId?.price?.adult || booking.packageId?.price || 0;
    const childPrice = booking.packageId?.price?.child || booking.packageId?.price || 0;
    const infantPrice = booking.packageId?.price?.infant || 0;

    // Use stored amounts if available, otherwise calculate
    const baseAmount = booking.baseAmount || 0;
    const discountAmount = booking.discountAmount || 0;
    const finalAmount = booking.finalAmount || 0;

    return res.status(200).json({
      status: true,
      message: "Booking fetched successfully",
      data: {
        _id: booking._id,
        // Package Information
        packageName: booking.packageId?.title || "N/A",
        packageId: booking.packageId?._id || booking.packageId,
        packageDetails: booking.packageId || null,
        // User Information
        userName: booking.userId?.name || "N/A",
        userEmail: booking.userId?.email || "N/A",
        userPhone: booking.userId?.phone || "N/A",
        userAddress: booking.userId?.address || "N/A",
        userId: booking.userId?._id || booking.userId,
        // Guest Information
        totalGuests: guestCount,
        guestDetails: booking.guestDetails || [],
        // Pricing Information
        baseAmount: baseAmount || 0,
        discountAmount: discountAmount || 0,
        finalAmount: finalAmount || 0,
        adultPrice,
        childPrice,
        infantPrice,
        // Coupon/Promo Code Information
        couponCode: booking.couponCode ? {
          _id: booking.couponCode._id,
          code: booking.couponCode.code,
          title: booking.couponCode.title,
          discountType: booking.couponCode.discountType,
          discountValue: booking.couponCode.discountValue,
        } : null,
        promoCode: booking.promoCode ? {
          _id: booking.promoCode._id,
          code: booking.promoCode.code,
          title: booking.promoCode.title,
          discountType: booking.promoCode.discountType,
          discountValue: booking.promoCode.discountValue,
        } : null,
        // Payment Information
        paymentStatus: booking.paymentStatus || "pending",
        paymentId: booking.paymentId || null,
        orderId: booking.orderId || null,
        paymentMethod: booking.paymentMethod || null,
        // Captain Information
        captainId: booking.captainId?._id || booking.captainId,
        assignedCaptain: booking.captainId ? {
          _id: booking.captainId._id,
          name: booking.captainId.name,
          email: booking.captainId.email,
          phone: booking.captainId.phone,
        } : null,
        // Status and Dates
        status: booking.status,
        createdAt: moment(booking.createdAt)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment(booking.updatedAt)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        tripdate: booking.tripdate ? moment(booking.tripdate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss") : null,
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error occurred",
      error: err.message,
    });
  }
};

// Update Booking (for captain assignment, status change, etc.)
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const oldBooking = await Booking.findById(id).select("captainId status").lean();
    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("userId", "name email phone")
      .populate("packageId")
      .populate("captainId", "name email phone");

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    // When booking is marked Completed, create 1% reward for the user (if not already created)
    if (updateData.status === "Completed") {
      const existingReward = await UserReward.findOne({ bookingId: id });
      if (!existingReward && booking.userId && booking.finalAmount != null) {
        const rewardPercent = 1;
        const bookingAmount = Number(booking.finalAmount);
        const rewardAmount = Math.round((bookingAmount * rewardPercent) / 100);
        if (rewardAmount > 0) {
          await UserReward.create({
            userId: booking.userId._id || booking.userId,
            bookingId: booking._id,
            rewardPercent,
            bookingAmount,
            rewardAmount,
            status: "given"
          });
        }
      }

      // Notifications: trip completed — admin(s) and user
      const packageTitle = booking.packageId?.title || "Trip";
      const userName = booking.userId?.name || booking.userId?.email || "Customer";
      const admins = await Admin.find({}).lean();
      for (const admin of admins) {
        const notif = await Notification.create({
          adminId: admin._id,
          type: "trip_completed",
          title: "Trip Completed",
          message: `Trip completed for "${packageTitle}" — ${userName}. Booking ID: ${booking.bookingId || id}`,
          packageId: booking.packageId?._id || booking.packageId,
          bookingId: booking._id,
          userId: booking.userId?._id || booking.userId,
          isRead: false,
        });
        const io = getIO();
        if (io) {
          io.to(`admin:${admin._id.toString()}`).emit("admin-notification", {
            type: "trip_completed",
            title: notif.title,
            message: notif.message,
            bookingId: booking._id,
            _id: notif._id,
            createdAt: notif.createdAt,
          });
        }
      }
      if (booking.userId) {
        const uid = booking.userId._id || booking.userId;
        await Notification.create({
          userId: uid,
          type: "trip_completed",
          title: "Trip Completed",
          message: `Your trip "${packageTitle}" is completed. Thank you for traveling with us!`,
          packageId: booking.packageId?._id || booking.packageId,
          bookingId: booking._id,
          isRead: false,
        });
        const io = getIO();
        if (io) {
          io.to(`user:${uid.toString()}`).emit("user-notification", {
            type: "trip_completed",
            title: "Trip Completed",
            message: `Your trip "${packageTitle}" is completed. Thank you for traveling with us!`,
            bookingId: booking._id,
          });
        }
      }
    }

    // When captain is assigned to booking — notify the captain (only if newly set or changed)
    const previousCaptainId = oldBooking?.captainId?.toString?.() || oldBooking?.captainId || null;
    const newCaptainId = updateData.captainId?.toString?.() || updateData.captainId || null;
    if (newCaptainId && newCaptainId !== previousCaptainId) {
      const captainId = newCaptainId;
      const packageTitle = booking.packageId?.title || "Booking";
      const userName = booking.userId?.name || booking.userId?.email || "Customer";
      const notif = await Notification.create({
        captainId,
        type: "captain_assigned",
        title: "You have been assigned to a booking",
        message: `You are assigned to "${packageTitle}" for ${userName}. Booking ID: ${booking.bookingId || id}`,
        packageId: booking.packageId?._id || booking.packageId,
        bookingId: booking._id,
        userId: booking.userId?._id || booking.userId,
        isRead: false,
      });
      const io = getIO();
      if (io) {
        io.to(`captain:${captainId.toString()}`).emit("captain-notification", {
          type: "captain_assigned",
          title: notif.title,
          message: notif.message,
          bookingId: booking._id,
          _id: notif._id,
          createdAt: notif.createdAt,
        });
      }
    }

    return res.status(200).json({
      status: true,
      message: "Booking updated successfully",
      data: booking
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error occurred",
      error: err.message,
    });
  }
};

export { showBooking, getBookingById, updateBooking }
