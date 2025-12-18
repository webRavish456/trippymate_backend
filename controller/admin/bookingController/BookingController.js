import moment from "moment-timezone";
import Booking from "../../../models/BookingModel.js";
import Coupon from "../../../models/CouponModel.js";
import PromoCode from "../../../models/PromoCodeModel.js";

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

// Update Booking (for captain assignment)
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

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
