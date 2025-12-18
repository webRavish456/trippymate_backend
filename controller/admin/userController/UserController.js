import moment from "moment-timezone";
import User from "../../../models/UserModel.js";
import Booking from "../../../models/BookingModel.js";

// =======================
// Get Users with Total Spent, Bookings & Booking History
// =======================
const getUser = async (req, res) => {
  try {
    // 1️⃣ Fetch all users and their bookings (with packages)
    const users = await User.find();
    const bookings = await Booking.find({})
      .populate("packageId")
      .populate("userId");

    // 2️⃣ Create map for accumulating totals and storing booking history
    const userStats = {};

    bookings.forEach((booking) => {
      const userId = booking.userId?._id?.toString();
      if (!userId) return;

      // Safely extract package prices
      const adultPrice = booking.packageId?.price?.adult || booking.packageId?.price || 0;
      const childPrice = booking.packageId?.price?.child || booking.packageId?.price || 0;
      const infantPrice = booking.packageId?.price?.infant || 0;

      let bookingAmount = 0;
      booking.guestDetails?.forEach((guest) => {
        if (guest.guestAge > 18) {
          bookingAmount += adultPrice;
        } else if (guest.guestAge >= 5) {
          bookingAmount += childPrice;
        } else {
          bookingAmount += infantPrice;
        }
      });

      // Create booking record
      const bookingRecord = {
        bookingId: booking._id,
        packageName: booking.packageId?.title || "N/A",
        totalGuests: booking.guestDetails?.length || 0,
        totalAmount: bookingAmount,
        tripDate: moment(booking.tripdate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        status: booking.status,
        createdAt: moment(booking.createdAt)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
      };

      // Initialize user stats if not yet
      if (!userStats[userId]) {
        userStats[userId] = {
          totalBookings: 0,
          totalSpent: 0,
          bookingHistory: [],
        };
      }

      // Add data
      userStats[userId].totalBookings += 1;
      userStats[userId].totalSpent += bookingAmount;
      userStats[userId].bookingHistory.push(bookingRecord);
    });

    // 3️⃣ Combine user info with computed stats and booking history
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "N/A",
      status: user.status,
      createdAt: moment(user.createdAt)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: moment(user.updatedAt)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      totalBookings: userStats[user._id]?.totalBookings || 0,
      totalSpent: userStats[user._id]?.totalSpent || 0,
      bookingHistory: userStats[user._id]?.bookingHistory || [],
    }));

    return res.status(200).json({
      status: true,
      message: "User data fetched successfully",
      data: formattedUsers,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error fetching user data",
      error: err.message,
    });
  }
};

// =======================
// Update User Status
// =======================
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const userDetail = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!userDetail)
      return res.status(404).json({ status: false, message: "User not found" });

    return res.status(200).json({
      status: true,
      message: "Status changed successfully",
      data: userDetail,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error updating status",
      error: err.message,
    });
  }
};

export { getUser, updateUserStatus }
