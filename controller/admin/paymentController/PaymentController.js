import Booking from "../../../models/BookingModel.js";
import Packages from "../../../models/PackageModel.js";
import Customer from "../../../models/CustomerModel.js";
import Coupon from "../../../models/CouponModel.js";
import PromoCode from "../../../models/PromoCodeModel.js";
import moment from "moment-timezone";

// Get All Payments (Bookings with Payment Details)
export const getAllPayments = async (req, res) => {
  try {
    const { status, paymentStatus, startDate, endDate, search } = req.query;

    // Build query
    const query = {};

    // Filter by booking status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = moment(startDate).startOf("day").toDate();
      }
      if (endDate) {
        query.createdAt.$lte = moment(endDate).endOf("day").toDate();
      }
    }

    // Fetch bookings with populated data
    let bookings = await Booking.find(query)
      .populate("userId", "name email phone address")
      .populate("packageId", "title duration category packageType")
      .populate("couponCode", "code title discountType discountValue")
      .populate("promoCode", "code title discountType discountValue")
      .populate("slotId", "slotName maxSlots currentBookings status")
      .sort({ createdAt: -1 });

    // Search filter (if provided)
    if (search) {
      const searchLower = search.toLowerCase();
      bookings = bookings.filter((booking) => {
        const userName = booking.userId?.name?.toLowerCase() || "";
        const userEmail = booking.userId?.email?.toLowerCase() || "";
        const packageName = booking.packageId?.title?.toLowerCase() || "";
        const paymentId = booking.paymentId?.toLowerCase() || "";
        const orderId = booking.orderId?.toLowerCase() || "";
        const bookingId = booking._id.toString().toLowerCase();

        return (
          userName.includes(searchLower) ||
          userEmail.includes(searchLower) ||
          packageName.includes(searchLower) ||
          paymentId.includes(searchLower) ||
          orderId.includes(searchLower) ||
          bookingId.includes(searchLower)
        );
      });
    }

    // Format payments data
    const payments = bookings.map((booking) => {
      const paymentId = booking.paymentId || null;
      const orderId = booking.orderId || null;
      const paymentStatus = booking.paymentStatus || "pending";
      const paymentMethod = booking.paymentMethod || "razorpay";
      const baseAmount = booking.baseAmount || 0;
      const discountAmount = booking.discountAmount || 0;
      const finalAmount = booking.finalAmount || 0;

      return {
        id: `PAY-${booking._id.toString().substring(0, 8).toUpperCase()}`,
        bookingId: booking._id,
        customerName: booking.userId?.name || "N/A",
        customerEmail: booking.userId?.email || "N/A",
        customerPhone: booking.userId?.phone || "N/A",
        customerAddress: booking.userId?.address || "N/A",
        packageId: booking.packageId?._id || booking.packageId,
        packageName: booking.packageId?.title || "N/A",
        packageDuration: booking.packageId?.duration || "N/A",
        packageCategory: booking.packageId?.category || "N/A",
        amount: finalAmount,
        baseAmount,
        discountAmount,
        finalAmount,
        status: paymentStatus === "completed" ? "paid" : paymentStatus === "failed" ? "failed" : "pending",
        paymentStatus,
        paymentDate: moment(booking.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
        paymentDateFormatted: moment(booking.createdAt).tz("Asia/Kolkata").format("DD MMM YYYY, hh:mm A"),
        paymentMethod,
        paymentId,
        orderId,
        transactionId: paymentId || orderId || `TXN-${booking._id.toString().substring(0, 8).toUpperCase()}`,
        bookingStatus: booking.status || "Active",
        tripDate: booking.tripdate
          ? moment(booking.tripdate).tz("Asia/Kolkata").format("YYYY-MM-DD")
          : null,
        tripDateFormatted: booking.tripdate
          ? moment(booking.tripdate).tz("Asia/Kolkata").format("DD MMM YYYY")
          : null,
        guestCount: booking.guestDetails?.length || 0,
        guestDetails: booking.guestDetails || [],
        couponCode: booking.couponCode
          ? {
              code: booking.couponCode.code,
              title: booking.couponCode.title,
              discountType: booking.couponCode.discountType,
              discountValue: booking.couponCode.discountValue,
            }
          : null,
        promoCode: booking.promoCode
          ? {
              code: booking.promoCode.code,
              title: booking.promoCode.title,
              discountType: booking.promoCode.discountType,
              discountValue: booking.promoCode.discountValue,
            }
          : null,
        slotId: booking.slotId?._id || booking.slotId,
        slotName: booking.slotId?.slotName || null,
        createdAt: moment(booking.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    // Calculate statistics
    const stats = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paid: payments.filter((p) => p.status === "paid").length,
      paidAmount: payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter((p) => p.status === "pending").length,
      pendingAmount: payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0),
      failed: payments.filter((p) => p.status === "failed").length,
      failedAmount: payments.filter((p) => p.status === "failed").reduce((sum, p) => sum + p.amount, 0),
      refunded: payments.filter((p) => p.paymentStatus === "refunded").length,
      refundedAmount: payments.filter((p) => p.paymentStatus === "refunded").reduce((sum, p) => sum + p.amount, 0),
    };

    return res.status(200).json({
      status: true,
      message: "Payments fetched successfully",
      data: payments,
      count: payments.length,
      stats,
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// Get Payment Statistics
export const getPaymentStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = moment(startDate).startOf("day").toDate();
      }
      if (endDate) {
        query.createdAt.$lte = moment(endDate).endOf("day").toDate();
      }
    }

    const bookings = await Booking.find(query);

    const stats = {
      total: bookings.length,
      totalAmount: bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0),
      paid: bookings.filter((b) => b.paymentStatus === "completed").length,
      paidAmount: bookings
        .filter((b) => b.paymentStatus === "completed")
        .reduce((sum, b) => sum + (b.finalAmount || 0), 0),
      pending: bookings.filter((b) => b.paymentStatus === "pending").length,
      pendingAmount: bookings
        .filter((b) => b.paymentStatus === "pending")
        .reduce((sum, b) => sum + (b.finalAmount || 0), 0),
      failed: bookings.filter((b) => b.paymentStatus === "failed").length,
      failedAmount: bookings
        .filter((b) => b.paymentStatus === "failed")
        .reduce((sum, b) => sum + (b.finalAmount || 0), 0),
      refunded: bookings.filter((b) => b.paymentStatus === "refunded").length,
      refundedAmount: bookings
        .filter((b) => b.paymentStatus === "refunded")
        .reduce((sum, b) => sum + (b.finalAmount || 0), 0),
    };

    return res.status(200).json({
      status: true,
      message: "Payment statistics fetched successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get payment statistics error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching payment statistics",
      error: error.message,
    });
  }
};

