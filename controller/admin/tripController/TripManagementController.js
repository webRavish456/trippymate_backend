import Slot from "../../../models/SlotModel.js";
import Booking from "../../../models/BookingModel.js";
import Packages from "../../../models/PackageModel.js";
import Customer from "../../../models/CustomerModel.js";
import moment from "moment-timezone";

// Get Active Trips with Slot Details
export const getActiveTripsWithSlots = async (req, res) => {
  try {
    const { startDate, endDate, packageId, destinationId } = req.query;

    // Build query for slots with upcoming trips
    const query = {
      status: { $in: ["available", "full"] },
    };

    // Date filter - show trips starting from today onwards
    if (startDate || endDate) {
      const start = startDate
        ? moment(startDate).startOf("day").toDate()
        : moment().startOf("day").toDate();
      const end = endDate
        ? moment(endDate).endOf("day").toDate()
        : moment().add(6, "months").endOf("day").toDate();

      query.tripDate = {
        $gte: start,
        $lte: end,
      };
    } else {
      // Default: Show trips from today onwards
      query.tripDate = {
        $gte: moment().startOf("day").toDate(),
      };
    }

    // Filter by package if provided
    if (packageId) {
      query.packageId = packageId;
    }

    // Filter by destination if provided
    if (destinationId) {
      query.destinationId = destinationId;
    }

    // Find all active slots
    const slots = await Slot.find(query)
      .populate("packageId", "title duration category packageType overview highlights")
      .populate("destinationId", "name title location")
      .populate("createdBy", "name email phone")
      .populate({
        path: "bookings",
        select: "userId guestDetails tripdate status paymentStatus",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      })
      .sort({ tripDate: 1, createdAt: 1 });

    // Group slots by trip date and package
    const tripsMap = new Map();

    slots.forEach((slot) => {
      const tripKey = `${slot.packageId?._id}_${moment(slot.tripDate).format("YYYY-MM-DD")}`;

      if (!tripsMap.has(tripKey)) {
        tripsMap.set(tripKey, {
          packageId: slot.packageId?._id,
          packageName: slot.packageId?.title || "N/A",
          packageDuration: slot.packageId?.duration || "N/A",
          packageCategory: slot.packageId?.category || "N/A",
          packageType: slot.packageId?.packageType || "N/A",
          tripDate: slot.tripDate,
          tripDateFormatted: moment(slot.tripDate).tz("Asia/Kolkata").format("DD MMM YYYY"),
          destinationId: slot.destinationId?._id || slot.destinationId,
          destinationName: slot.destinationName,
          destinationLocation: slot.destinationId?.location || "N/A",
          slots: [],
          totalSlots: 0,
          totalBookings: 0,
          totalParticipants: 0,
          totalCapacity: 0,
        });
      }

      const trip = tripsMap.get(tripKey);

      // Calculate participants from bookings
      let slotParticipants = 0;
      slot.bookings.forEach((booking) => {
        if (booking.paymentStatus === "completed" && booking.status === "Active") {
          slotParticipants += booking.guestDetails?.length || 0;
        }
      });

      trip.slots.push({
        slotId: slot._id,
        slotName: slot.slotName,
        createdBy: {
          _id: slot.createdBy?._id,
          name: slot.createdBy?.name || "N/A",
          email: slot.createdBy?.email || "N/A",
          phone: slot.createdBy?.phone || "N/A",
        },
        maxSlots: slot.maxSlots,
        currentBookings: slot.currentBookings,
        availableSlots: slot.maxSlots - slot.currentBookings,
        status: slot.status,
        participants: slotParticipants,
        bookings: slot.bookings.map((booking) => ({
          bookingId: booking._id,
          userId: booking.userId?._id,
          userName: booking.userId?.name || "N/A",
          userEmail: booking.userId?.email || "N/A",
          userPhone: booking.userId?.phone || "N/A",
          guestCount: booking.guestDetails?.length || 0,
          guestDetails: booking.guestDetails || [],
          bookingStatus: booking.status,
          paymentStatus: booking.paymentStatus,
        })),
        createdAt: moment(slot.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      });

      trip.totalSlots += 1;
      trip.totalBookings += slot.currentBookings;
      trip.totalParticipants += slotParticipants;
      trip.totalCapacity += slot.maxSlots;
    });

    // Convert map to array and format
    const trips = Array.from(tripsMap.values()).map((trip) => ({
      ...trip,
      daysUntilTrip: moment(trip.tripDate).diff(moment(), "days"),
      isUpcoming: moment(trip.tripDate).diff(moment(), "days") >= 0,
      availableCapacity: trip.totalCapacity - trip.totalParticipants,
    }));

    return res.status(200).json({
      status: true,
      message: "Active trips with slot details fetched successfully",
      data: trips,
      count: trips.length,
      summary: {
        totalTrips: trips.length,
        totalSlots: trips.reduce((sum, trip) => sum + trip.totalSlots, 0),
        totalParticipants: trips.reduce((sum, trip) => sum + trip.totalParticipants, 0),
        totalCapacity: trips.reduce((sum, trip) => sum + trip.totalCapacity, 0),
      },
    });
  } catch (error) {
    console.error("Get active trips with slots error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching active trips",
      error: error.message,
    });
  }
};

// Get Trip Details by Package and Date
export const getTripDetails = async (req, res) => {
  try {
    const { packageId, tripDate } = req.params;

    if (!packageId || !tripDate) {
      return res.status(400).json({
        status: false,
        message: "Package ID and Trip Date are required",
      });
    }

    const formattedTripDate = moment(tripDate).startOf("day").toDate();

    // Find all slots for this package and date
    const slots = await Slot.find({
      packageId,
      tripDate: {
        $gte: moment(formattedTripDate).startOf("day").toDate(),
        $lte: moment(formattedTripDate).endOf("day").toDate(),
      },
      status: { $in: ["available", "full"] },
    })
      .populate("packageId")
      .populate("destinationId")
      .populate("createdBy", "name email phone")
      .populate({
        path: "bookings",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      })
      .sort({ createdAt: 1 });

    if (slots.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No trips found for this package and date",
      });
    }

    // Format response
    const packageData = slots[0].packageId;
    const destinationData = slots[0].destinationId;

    const formattedSlots = slots.map((slot) => {
      let slotParticipants = 0;
      const activeBookings = slot.bookings.filter(
        (b) => b.paymentStatus === "completed" && b.status === "Active"
      );

      activeBookings.forEach((booking) => {
        slotParticipants += booking.guestDetails?.length || 0;
      });

      return {
        slotId: slot._id,
        slotName: slot.slotName,
        createdBy: {
          _id: slot.createdBy?._id,
          name: slot.createdBy?.name || "N/A",
          email: slot.createdBy?.email || "N/A",
          phone: slot.createdBy?.phone || "N/A",
        },
        maxSlots: slot.maxSlots,
        currentBookings: slot.currentBookings,
        availableSlots: slot.maxSlots - slot.currentBookings,
        status: slot.status,
        participants: slotParticipants,
        bookings: activeBookings.map((booking) => ({
          bookingId: booking._id,
          userId: booking.userId?._id,
          userName: booking.userId?.name || "N/A",
          userEmail: booking.userId?.email || "N/A",
          userPhone: booking.userId?.phone || "N/A",
          guestCount: booking.guestDetails?.length || 0,
          guestDetails: booking.guestDetails || [],
          bookingStatus: booking.status,
          paymentStatus: booking.paymentStatus,
        })),
        createdAt: moment(slot.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    const totalParticipants = formattedSlots.reduce(
      (sum, slot) => sum + slot.participants,
      0
    );
    const totalCapacity = formattedSlots.reduce(
      (sum, slot) => sum + slot.maxSlots,
      0
    );

    return res.status(200).json({
      status: true,
      message: "Trip details fetched successfully",
      data: {
        packageId: packageData?._id,
        packageName: packageData?.title || "N/A",
        packageDuration: packageData?.duration || "N/A",
        packageCategory: packageData?.category || "N/A",
        packageType: packageData?.packageType || "N/A",
        packageOverview: packageData?.overview || "",
        destinationId: destinationData?._id || slots[0].destinationId,
        destinationName: slots[0].destinationName,
        destinationLocation: destinationData?.location || "N/A",
        tripDate: moment(formattedTripDate).tz("Asia/Kolkata").format("YYYY-MM-DD"),
        tripDateFormatted: moment(formattedTripDate).tz("Asia/Kolkata").format("DD MMM YYYY"),
        daysUntilTrip: moment(formattedTripDate).diff(moment(), "days"),
        slots: formattedSlots,
        summary: {
          totalSlots: formattedSlots.length,
          totalParticipants,
          totalCapacity,
          availableCapacity: totalCapacity - totalParticipants,
        },
      },
    });
  } catch (error) {
    console.error("Get trip details error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching trip details",
      error: error.message,
    });
  }
};

