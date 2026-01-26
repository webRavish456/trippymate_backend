import Booking from "../../../models/BookingModel.js";
import Customer from "../../../models/CustomerModel.js";
import Packages from "../../../models/PackageModel.js";
import Vendor from "../../../models/VendorModel.js";
import moment from "moment-timezone";

// Get Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalPackages = await Packages.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalVendors = await Vendor.countDocuments();

    // Get active counts
    const activeUsers = await User.countDocuments({ status: "active" });
    const activeVendors = await Vendor.countDocuments({ status: "active" });

    // Get booking statistics
    const bookings = await Booking.find({})
      .populate("packageId")
      .populate("userId");

    // Calculate total revenue
    let totalRevenue = 0;
    bookings.forEach((booking) => {
      const adultPrice = booking.packageId?.price?.adult || booking.packageId?.price || 0;
      const childPrice = booking.packageId?.price?.child || booking.packageId?.price || 0;
      const infantPrice = booking.packageId?.price?.infant || 0;

      booking.guestDetails?.forEach((guest) => {
        if (guest.guestAge > 18) {
          totalRevenue += adultPrice;
        } else if (guest.guestAge >= 5) {
          totalRevenue += childPrice;
        } else {
          totalRevenue += infantPrice;
        }
      });
    });

    // Get recent bookings (last 5)
    const recentBookings = await Booking.find({})
      .populate("packageId", "title")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("status createdAt tripdate guestDetails");

    const formattedRecentBookings = recentBookings.map((booking) => ({
      _id: booking._id,
      packageName: booking.packageId?.title || "N/A",
      userName: booking.userId?.name || "N/A",
      status: booking.status,
      totalGuests: booking.guestDetails?.length || 0,
      createdAt: moment(booking.createdAt)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      tripDate: moment(booking.tripdate)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD"),
    }));

    // Get bookings by status
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
    const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

    return res.status(200).json({
      status: true,
      message: "Dashboard stats fetched successfully",
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalPackages,
          totalBookings,
          totalVendors,
          activeVendors,
          totalRevenue,
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
        },
        recentBookings: formattedRecentBookings,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error fetching dashboard stats",
      error: err.message,
    });
  }
};

export { getDashboardStats };
