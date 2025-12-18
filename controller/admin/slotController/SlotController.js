import Slot from "../../../models/SlotModel.js";
import Booking from "../../../models/BookingModel.js";
import Packages from "../../../models/PackageModel.js";
import User from "../../../models/UserModel.js";
import moment from "moment-timezone";

// Get Available Slots for a Package and Destination
export const getAvailableSlots = async (req, res) => {
  try {
    const { packageId, destinationId, tripDate } = req.query;

    if (!packageId || !destinationId || !tripDate) {
      return res.status(400).json({
        status: false,
        message: "Package ID, Destination ID, and Trip Date are required",
      });
    }

    // Format trip date to start of day for comparison
    const searchDate = moment(tripDate).startOf("day").toDate();
    const searchDateEnd = moment(tripDate).endOf("day").toDate();

    // Find available slots
    const slots = await Slot.find({
      packageId,
      destinationId,
      tripDate: {
        $gte: searchDate,
        $lte: searchDateEnd,
      },
      status: { $in: ["available", "full"] },
    })
      .populate("packageId", "title duration")
      .populate({
        path: "bookings",
        select: "userId guestDetails",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ createdAt: 1 });

    // Format slots with booking details
    const formattedSlots = slots.map((slot) => {
      const bookingDetails = slot.bookings.map((booking) => ({
        bookingId: booking._id,
        userName: booking.userId?.name || "N/A",
        userEmail: booking.userId?.email || "N/A",
        guestCount: booking.guestDetails?.length || 0,
        guests: booking.guestDetails || [],
      }));

      return {
        _id: slot._id,
        slotName: slot.slotName,
        packageId: slot.packageId?._id,
        packageName: slot.packageId?.title || "N/A",
        destinationId: slot.destinationId,
        destinationName: slot.destinationName,
        tripDate: moment(slot.tripDate).tz("Asia/Kolkata").format("YYYY-MM-DD"),
        maxSlots: slot.maxSlots,
        currentBookings: slot.currentBookings,
        availableSlots: slot.maxSlots - slot.currentBookings,
        status: slot.status,
        bookingDetails,
        createdAt: moment(slot.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Available slots fetched successfully",
      data: formattedSlots,
      count: formattedSlots.length,
    });
  } catch (error) {
    console.error("Get available slots error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching available slots",
      error: error.message,
    });
  }
};

// Get Slot Details by ID
export const getSlotById = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await Slot.findById(id)
      .populate("packageId", "title duration overview")
      .populate({
        path: "bookings",
        select: "userId guestDetails tripdate status paymentStatus",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      });

    if (!slot) {
      return res.status(404).json({
        status: false,
        message: "Slot not found",
      });
    }

    const bookingDetails = slot.bookings.map((booking) => ({
      bookingId: booking._id,
      userName: booking.userId?.name || "N/A",
      userEmail: booking.userId?.email || "N/A",
      userPhone: booking.userId?.phone || "N/A",
      guestCount: booking.guestDetails?.length || 0,
      guests: booking.guestDetails || [],
      tripDate: booking.tripdate ? moment(booking.tripdate).tz("Asia/Kolkata").format("YYYY-MM-DD") : null,
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
    }));

    return res.status(200).json({
      status: true,
      message: "Slot details fetched successfully",
      data: {
        _id: slot._id,
        slotName: slot.slotName,
        packageId: slot.packageId?._id,
        packageName: slot.packageId?.title || "N/A",
        packageDuration: slot.packageId?.duration || "N/A",
        destinationId: slot.destinationId,
        destinationName: slot.destinationName,
        tripDate: moment(slot.tripDate).tz("Asia/Kolkata").format("YYYY-MM-DD"),
        maxSlots: slot.maxSlots,
        currentBookings: slot.currentBookings,
        availableSlots: slot.maxSlots - slot.currentBookings,
        status: slot.status,
        bookingDetails,
        createdAt: moment(slot.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      },
    });
  } catch (error) {
    console.error("Get slot by ID error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching slot details",
      error: error.message,
    });
  }
};

// Get All Slots (Admin)
export const getAllSlots = async (req, res) => {
  try {
    const { packageId, destinationId, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (packageId) query.packageId = packageId;
    if (destinationId) query.destinationId = destinationId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const slots = await Slot.find(query)
      .populate("packageId", "title duration")
      .sort({ tripDate: 1, createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Slot.countDocuments(query);

    const formattedSlots = slots.map((slot) => ({
      _id: slot._id,
      slotName: slot.slotName,
      packageId: slot.packageId?._id,
      packageName: slot.packageId?.title || "N/A",
      destinationId: slot.destinationId,
      destinationName: slot.destinationName,
      tripDate: moment(slot.tripDate).tz("Asia/Kolkata").format("YYYY-MM-DD"),
      maxSlots: slot.maxSlots,
      currentBookings: slot.currentBookings,
      availableSlots: slot.maxSlots - slot.currentBookings,
      status: slot.status,
      createdAt: moment(slot.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
    }));

    return res.status(200).json({
      status: true,
      message: "Slots fetched successfully",
      data: formattedSlots,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSlots: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get all slots error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching slots",
      error: error.message,
    });
  }
};

// Remove Booking from Slot (when booking is cancelled)
export const removeBookingFromSlot = async (req, res) => {
  try {
    const { slotId, bookingId } = req.body;

    if (!slotId || !bookingId) {
      return res.status(400).json({
        status: false,
        message: "Slot ID and Booking ID are required",
      });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        status: false,
        message: "Slot not found",
      });
    }

    slot.removeBooking(bookingId);
    await slot.save();

    // Update booking to remove slotId
    await Booking.findByIdAndUpdate(bookingId, {
      $unset: { slotId: "" },
    });

    return res.status(200).json({
      status: true,
      message: "Booking removed from slot successfully",
      data: {
        slotId: slot._id,
        currentBookings: slot.currentBookings,
        availableSlots: slot.maxSlots - slot.currentBookings,
        status: slot.status,
      },
    });
  } catch (error) {
    console.error("Remove booking from slot error:", error);
    return res.status(500).json({
      status: false,
      message: "Error removing booking from slot",
      error: error.message,
    });
  }
};

// Update Slot (Admin only)
export const updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxSlots, status, slotName } = req.body;

    const slot = await Slot.findById(id);
    if (!slot) {
      return res.status(404).json({
        status: false,
        message: "Slot not found",
      });
    }

    if (maxSlots !== undefined) {
      if (maxSlots < slot.currentBookings) {
        return res.status(400).json({
          status: false,
          message: `Cannot set maxSlots to ${maxSlots} as current bookings (${slot.currentBookings}) exceed this limit`,
        });
      }
      slot.maxSlots = maxSlots;
      
      // Update status if needed
      if (slot.currentBookings >= maxSlots) {
        slot.status = "full";
      } else if (slot.status === "full" && slot.currentBookings < maxSlots) {
        slot.status = "available";
      }
    }

    if (status) {
      slot.status = status;
    }

    if (slotName) {
      slot.slotName = slotName;
    }

    await slot.save();

    return res.status(200).json({
      status: true,
      message: "Slot updated successfully",
      data: {
        _id: slot._id,
        slotName: slot.slotName,
        maxSlots: slot.maxSlots,
        currentBookings: slot.currentBookings,
        availableSlots: slot.maxSlots - slot.currentBookings,
        status: slot.status,
      },
    });
  } catch (error) {
    console.error("Update slot error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating slot",
      error: error.message,
    });
  }
};

