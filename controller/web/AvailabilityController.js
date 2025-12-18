import Packages from "../../models/PackageModel.js";
import Slot from "../../models/SlotModel.js";
import Booking from "../../models/BookingModel.js";
import Captain from "../../models/CaptainModel.js";
import moment from "moment-timezone";

// Check Package Availability
export const checkPackageAvailability = async (req, res) => {
  try {
    const { packageId, tripDate, guestCount } = req.query;

    if (!packageId || !tripDate) {
      return res.status(400).json({
        status: false,
        message: "Package ID and Trip Date are required",
      });
    }

    const packageData = await Packages.findById(packageId);
    if (!packageData) {
      return res.status(404).json({
        status: false,
        message: "Package not found",
      });
    }

    const formattedTripDate = moment(tripDate).startOf("day").toDate();
    const requestedGuestCount = parseInt(guestCount) || 1;

    // Check available slots for this package and date
    const availableSlots = await Slot.find({
      packageId,
      tripDate: {
        $gte: moment(formattedTripDate).startOf("day").toDate(),
        $lte: moment(formattedTripDate).endOf("day").toDate(),
      },
      status: { $in: ["available", "full"] },
    })
      .populate("bookings")
      .lean();

    let totalAvailableSlots = 0;
    let canAccommodate = false;

    availableSlots.forEach((slot) => {
      const activeBookings = slot.bookings.filter(
        (b) => b.paymentStatus === "completed" && b.status === "Active"
      );
      let slotParticipants = 0;
      activeBookings.forEach((booking) => {
        slotParticipants += booking.guestDetails?.length || 0;
      });
      const availableInSlot = slot.maxSlots - slotParticipants;
      totalAvailableSlots += availableInSlot;
    });

    canAccommodate = totalAvailableSlots >= requestedGuestCount;

    return res.status(200).json({
      status: true,
      message: "Package availability checked",
      data: {
        packageId: packageData._id,
        packageName: packageData.title,
        tripDate: moment(formattedTripDate).format("YYYY-MM-DD"),
        requestedGuestCount,
        totalAvailableSlots,
        canAccommodate,
        availableSlots: availableSlots.length,
        isAvailable: canAccommodate && packageData.status === "active",
      },
    });
  } catch (error) {
    console.error("Check package availability error:", error);
    return res.status(500).json({
      status: false,
      message: "Error checking package availability",
      error: error.message,
    });
  }
};

// Check Captain Availability
export const checkCaptainAvailability = async (req, res) => {
  try {
    const { captainId, tripDate, duration } = req.query;

    if (!captainId || !tripDate) {
      return res.status(400).json({
        status: false,
        message: "Captain ID and Trip Date are required",
      });
    }

    const captain = await Captain.findById(captainId);
    if (!captain) {
      return res.status(404).json({
        status: false,
        message: "Captain not found",
      });
    }

    // Check if captain is active
    if (captain.status !== "active") {
      return res.status(200).json({
        status: true,
        message: "Captain availability checked",
        data: {
          captainId: captain._id,
          captainName: captain.name,
          tripDate: moment(tripDate).format("YYYY-MM-DD"),
          isAvailable: false,
          reason: "Captain is not active",
        },
      });
    }

    const startDate = moment(tripDate).startOf("day").toDate();
    const days = duration ? parseInt(duration.split(" ")[0]) : 1;
    const endDate = moment(tripDate).add(days - 1, "days").endOf("day").toDate();

    // Check existing bookings for this captain in the date range
    const existingBookings = await Booking.find({
      captainId,
      status: "Active",
      paymentStatus: "completed",
      $or: [
        {
          tripdate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
        {
          tripdate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      ],
    }).lean();

    const isAvailable = existingBookings.length === 0;

    return res.status(200).json({
      status: true,
      message: "Captain availability checked",
      data: {
        captainId: captain._id,
        captainName: captain.name,
        tripDate: moment(tripDate).format("YYYY-MM-DD"),
        duration: days,
        endDate: moment(endDate).format("YYYY-MM-DD"),
        existingBookings: existingBookings.length,
        isAvailable,
        reason: isAvailable ? "Captain is available" : "Captain has existing bookings for this period",
      },
    });
  } catch (error) {
    console.error("Check captain availability error:", error);
    return res.status(500).json({
      status: false,
      message: "Error checking captain availability",
      error: error.message,
    });
  }
};

// Check Combined Availability (Package + Captain)
export const checkCombinedAvailability = async (req, res) => {
  try {
    const { packageId, captainId, tripDate, guestCount, duration } = req.query;

    if (!packageId || !tripDate) {
      return res.status(400).json({
        status: false,
        message: "Package ID and Trip Date are required",
      });
    }

    const packageData = await Packages.findById(packageId);
    if (!packageData) {
      return res.status(404).json({
        status: false,
        message: "Package not found",
      });
    }

    // Check package availability
    const formattedTripDate = moment(tripDate).startOf("day").toDate();
    const requestedGuestCount = parseInt(guestCount) || 1;

    const availableSlots = await Slot.find({
      packageId,
      tripDate: {
        $gte: moment(formattedTripDate).startOf("day").toDate(),
        $lte: moment(formattedTripDate).endOf("day").toDate(),
      },
      status: { $in: ["available", "full"] },
    })
      .populate("bookings")
      .lean();

    let totalAvailableSlots = 0;
    availableSlots.forEach((slot) => {
      const activeBookings = slot.bookings.filter(
        (b) => b.paymentStatus === "completed" && b.status === "Active"
      );
      let slotParticipants = 0;
      activeBookings.forEach((booking) => {
        slotParticipants += booking.guestDetails?.length || 0;
      });
      const availableInSlot = slot.maxSlots - slotParticipants;
      totalAvailableSlots += availableInSlot;
    });

    const packageAvailable = totalAvailableSlots >= requestedGuestCount && packageData.status === "active";

    // Check captain availability if captainId is provided
    let captainAvailable = true;
    let captainInfo = null;

    if (captainId) {
      const captain = await Captain.findById(captainId);
      if (!captain) {
        return res.status(404).json({
          status: false,
          message: "Captain not found",
        });
      }

      if (captain.status !== "active") {
        captainAvailable = false;
        captainInfo = {
          captainId: captain._id,
          captainName: captain.name,
          isAvailable: false,
          reason: "Captain is not active",
        };
      } else {
        const startDate = moment(tripDate).startOf("day").toDate();
        const days = duration ? parseInt(duration.split(" ")[0]) : packageData.duration ? parseInt(packageData.duration.split(" ")[0]) : 1;
        const endDate = moment(tripDate).add(days - 1, "days").endOf("day").toDate();

        const existingBookings = await Booking.find({
          captainId,
          status: "Active",
          paymentStatus: "completed",
          tripdate: {
            $gte: startDate,
            $lte: endDate,
          },
        }).lean();

        captainAvailable = existingBookings.length === 0;
        captainInfo = {
          captainId: captain._id,
          captainName: captain.name,
          isAvailable: captainAvailable,
          existingBookings: existingBookings.length,
          reason: captainAvailable ? "Captain is available" : "Captain has existing bookings for this period",
        };
      }
    }

    const overallAvailable = packageAvailable && captainAvailable;

    return res.status(200).json({
      status: true,
      message: "Combined availability checked",
      data: {
        packageId: packageData._id,
        packageName: packageData.title,
        packageAvailable,
        packageInfo: {
          totalAvailableSlots,
          requestedGuestCount,
          canAccommodate: packageAvailable,
        },
        captainInfo,
        tripDate: moment(formattedTripDate).format("YYYY-MM-DD"),
        overallAvailable,
        canBook: overallAvailable,
      },
    });
  } catch (error) {
    console.error("Check combined availability error:", error);
    return res.status(500).json({
      status: false,
      message: "Error checking availability",
      error: error.message,
    });
  }
};

