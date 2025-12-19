import User from "../../models/UserModel.js";
import Booking from "../../models/BookingModel.js";
import Packages from "../../models/PackageModel.js";
import CaptainAvailability from "../../models/CaptainAvailabilityModel.js";
import mongoose from "mongoose";

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Get user stats
    const bookingsCount = await Booking.countDocuments({ userId: userId });
    const wishlistCount = user.wishlist?.length || 0;
    const reviewsCount = 0; // TODO: Add reviews model if needed
    
    // Count captain bookings (from Booking model where captainId exists)
    const captainBookingsFromPackages = await Booking.countDocuments({ 
      userId: userId,
      captainId: { $exists: true, $ne: null }
    });
    
    // Count direct captain bookings (from CaptainAvailability model)
    // Match by customerEmail or customerName (case-insensitive)
    // Group by bookingReference to count unique bookings, not individual dates
    const directCaptainBookingsData = await CaptainAvailability.find({
      $or: [
        { customerEmail: { $regex: new RegExp(`^${user.email}$`, 'i') } },
        { customerName: { $regex: new RegExp(`^${user.name}$`, 'i') } }
      ],
      status: 'booked',
      bookingReference: { $exists: true, $ne: null }
    }).distinct('bookingReference');
    
    const directCaptainBookings = directCaptainBookingsData.length;
    
    const totalCaptainBookings = captainBookingsFromPackages + directCaptainBookings;

    return res.status(200).json({
      status: true,
      message: "User profile retrieved successfully",
      data: {
        ...user.toObject(),
        stats: {
          trips: bookingsCount,
          wishlist: wishlistCount,
          reviews: reviewsCount,
          captainBookings: totalCaptainBookings
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching user profile",
      error: error.message
    });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    const updateData = req.body;
    
    // Remove sensitive fields
    delete updateData.password;
    delete updateData._id;
    delete updateData.__v;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating user profile",
      error: error.message
    });
  }
};

// Get User Bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    const { status } = req.query; // 'upcoming', 'completed', or undefined for all

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    let query = { userId: userId };

    // Filter by status if provided
    if (status === 'upcoming') {
      query.tripdate = { $gte: new Date() };
    } else if (status === 'completed') {
      query.tripdate = { $lt: new Date() };
    }

    const bookings = await Booking.find(query)
      .populate('packageId', 'title destination duration images price')
      .sort({ createdAt: -1 });

    // Transform bookings for frontend
    const transformedBookings = bookings.map(booking => {
      const packageData = booking.packageId || {};
      const tripDate = booking.tripdate || booking.tripDate || new Date();
      const isUpcoming = new Date(tripDate) >= new Date();
      
      return {
        id: booking._id.toString(),
        bookingId: booking.bookingId || booking._id.toString().substring(0, 8).toUpperCase(),
        packageName: packageData.title || 'Package',
        destination: packageData.destination || 'Unknown',
        tripDate: tripDate,
        duration: packageData.duration || 'N/A',
        guests: booking.guestDetails?.length || 0,
        totalAmount: booking.totalAmount || packageData.price || 0,
        status: isUpcoming ? 'confirmed' : 'completed',
        image: packageData.images?.[0]?.path || packageData.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        hasFeedback: booking.feedback ? true : false
      };
    });

    return res.status(200).json({
      status: true,
      message: "User bookings retrieved successfully",
      data: transformedBookings
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching user bookings",
      error: error.message
    });
  }
};

// Get Booking Details by ID
export const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    const booking = await Booking.findById(id)
      .populate('packageId');

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    // Verify booking belongs to user
    const bookingUserId = booking.userId?.toString() || booking.userId;
    if (bookingUserId !== userId.toString()) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized access to this booking"
      });
    }

    const packageData = booking.packageId || {};
    const tripDate = booking.tripdate || booking.tripDate || new Date();
    const isUpcoming = new Date(tripDate) >= new Date();

    const bookingDetails = {
      id: booking._id.toString(),
      bookingId: booking.bookingId || booking._id.toString().substring(0, 8).toUpperCase(),
      packageName: packageData.title || 'Package',
      destination: packageData.destination || 'Unknown',
      tripDate: tripDate,
      duration: packageData.duration || 'N/A',
      guests: booking.guestDetails?.length || 0,
      totalAmount: booking.totalAmount || packageData.price || 0,
      baseAmount: booking.baseAmount || booking.totalAmount || packageData.price || 0,
      discount: booking.discount || 0,
      couponCode: booking.couponCode || null,
      promoCode: booking.promoCode || null,
      status: isUpcoming ? 'confirmed' : 'completed',
      image: packageData.images?.[0]?.path || packageData.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      groups: booking.guestDetails ? [{
        groupId: 'G1',
        members: booking.guestDetails.map((guest, index) => ({
          name: guest.name || `Guest ${index + 1}`,
          age: guest.age || 0
        }))
      }] : [],
      contactDetails: {
        name: booking.contactName || '',
        phone: booking.contactPhone || '',
        address: booking.contactAddress || ''
      },
      guestDetails: booking.guestDetails || [],
      packageDetails: {
        overview: packageData.overview || packageData.description || '',
        highlights: packageData.highlights || [],
        inclusions: packageData.inclusions || []
      },
      hasFeedback: booking.feedback ? true : false
    };

    return res.status(200).json({
      status: true,
      message: "Booking details retrieved successfully",
      data: bookingDetails
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching booking details",
      error: error.message
    });
  }
};

