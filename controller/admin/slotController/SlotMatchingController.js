import Slot from "../../../models/SlotModel.js";
import Booking from "../../../models/BookingModel.js";
import Packages from "../../../models/PackageModel.js";
import moment from "moment-timezone";

/**
 * Matching Algorithm for Slot Booking
 * Suggests tours with available group slots based on user preferences
 */

// Get Suggested Slots for Solo Travelers
export const getSuggestedSlots = async (req, res) => {
  try {
    const {
      destinationId,
      destinationName,
      packageId,
      preferredStartDate,
      preferredEndDate,
      maxPrice,
      minPrice,
      category,
      packageType,
      minAvailableSlots = 1, // Minimum available slots required
      limit = 10,
    } = req.query;

    const query = {
      status: "available",
    };

    // Build date range query
    if (preferredStartDate || preferredEndDate) {
      const startDate = preferredStartDate
        ? moment(preferredStartDate).startOf("day").toDate()
        : moment().startOf("day").toDate();
      const endDate = preferredEndDate
        ? moment(preferredEndDate).endOf("day").toDate()
        : moment().add(6, "months").endOf("day").toDate();

      query.tripDate = {
        $gte: startDate,
        $lte: endDate,
      };
    } else {
      // Default: Show slots from today onwards
      query.tripDate = {
        $gte: moment().startOf("day").toDate(),
      };
    }

    // Filter by destination if provided
    if (destinationId) {
      query.destinationId = destinationId;
    }
    if (destinationName) {
      query.destinationName = { $regex: destinationName, $options: "i" };
    }

    // Filter by package if provided
    if (packageId) {
      query.packageId = packageId;
    }

    // Find slots with available space
    let slots = await Slot.find(query)
      .populate("packageId")
      .populate({
        path: "bookings",
        select: "userId guestDetails",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ tripDate: 1, currentBookings: -1 }); // Sort by date and popularity

    // Filter slots with minimum available slots
    slots = slots.filter(
      (slot) => slot.maxSlots - slot.currentBookings >= minAvailableSlots
    );

    // Filter by package criteria if provided
    if (category || packageType || minPrice || maxPrice) {
      slots = slots.filter((slot) => {
        const packageData = slot.packageId;
        if (!packageData) return false;

        // Filter by category
        if (category && packageData.category !== category) {
          return false;
        }

        // Filter by package type
        if (packageType && packageData.packageType !== packageType) {
          return false;
        }

        // Filter by price range
        const packagePrice = packageData.price?.adult || packageData.price || 0;
        if (minPrice && packagePrice < parseFloat(minPrice)) {
          return false;
        }
        if (maxPrice && packagePrice > parseFloat(maxPrice)) {
          return false;
        }

        return true;
      });
    }

    // Calculate match score for each slot
    const scoredSlots = slots.map((slot) => {
      let matchScore = 0;
      const packageData = slot.packageId;

      // Base score: Available slots (more available = higher score)
      matchScore += (slot.maxSlots - slot.currentBookings) * 10;

      // Popularity score: More bookings = more popular
      matchScore += slot.currentBookings * 5;

      // Date proximity score: Closer dates get higher score
      if (preferredStartDate) {
        const daysDiff = Math.abs(
          moment(slot.tripDate).diff(moment(preferredStartDate), "days")
        );
        matchScore += Math.max(0, 30 - daysDiff); // Max 30 points for exact match
      } else {
        // Prefer upcoming trips
        const daysUntil = moment(slot.tripDate).diff(moment(), "days");
        if (daysUntil >= 0 && daysUntil <= 30) {
          matchScore += 20; // Bonus for trips in next 30 days
        }
      }

      // Destination match score
      if (destinationId && slot.destinationId.toString() === destinationId) {
        matchScore += 25;
      }
      if (destinationName && slot.destinationName.toLowerCase().includes(destinationName.toLowerCase())) {
        matchScore += 15;
      }

      // Package match score
      if (packageId && slot.packageId?._id.toString() === packageId) {
        matchScore += 20;
      }

      // Category match score
      if (category && packageData?.category === category) {
        matchScore += 15;
      }

      // Package type match score
      if (packageType && packageData?.packageType === packageType) {
        matchScore += 15;
      }

      return {
        slot,
        matchScore,
      };
    });

    // Sort by match score (highest first)
    scoredSlots.sort((a, b) => b.matchScore - a.matchScore);

    // Limit results
    const topSlots = scoredSlots.slice(0, parseInt(limit));

    // Format response
    const formattedSlots = topSlots.map(({ slot, matchScore }) => {
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
        packageDuration: slot.packageId?.duration || "N/A",
        packageCategory: slot.packageId?.category || "N/A",
        packageType: slot.packageId?.packageType || "N/A",
        packagePrice: slot.packageId?.price?.adult || slot.packageId?.price || 0,
        destinationId: slot.destinationId,
        destinationName: slot.destinationName,
        tripDate: moment(slot.tripDate).tz("Asia/Kolkata").format("YYYY-MM-DD"),
        maxSlots: slot.maxSlots,
        currentBookings: slot.currentBookings,
        availableSlots: slot.maxSlots - slot.currentBookings,
        status: slot.status,
        matchScore: Math.round(matchScore),
        bookingDetails,
        createdAt: moment(slot.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Suggested slots fetched successfully",
      data: formattedSlots,
      count: formattedSlots.length,
      filters: {
        destinationId: destinationId || null,
        destinationName: destinationName || null,
        packageId: packageId || null,
        preferredStartDate: preferredStartDate || null,
        preferredEndDate: preferredEndDate || null,
        category: category || null,
        packageType: packageType || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
      },
    });
  } catch (error) {
    console.error("Get suggested slots error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching suggested slots",
      error: error.message,
    });
  }
};

// Get Best Matching Slots for Solo Traveler
export const getBestMatchesForSoloTraveler = async (req, res) => {
  try {
    const {
      destinationId,
      destinationName,
      preferredStartDate,
      preferredEndDate,
      budget,
      category,
      packageType,
      travelStyle, // e.g., "adventure", "relaxation", "cultural"
    } = req.body;

    // Build base query
    const query = {
      status: "available",
    };

    // Date range
    if (preferredStartDate || preferredEndDate) {
      const startDate = preferredStartDate
        ? moment(preferredStartDate).startOf("day").toDate()
        : moment().startOf("day").toDate();
      const endDate = preferredEndDate
        ? moment(preferredEndDate).endOf("day").toDate()
        : moment().add(3, "months").endOf("day").toDate();

      query.tripDate = {
        $gte: startDate,
        $lte: endDate,
      };
    } else {
      query.tripDate = {
        $gte: moment().startOf("day").toDate(),
      };
    }

    // Destination filter
    if (destinationId) {
      query.destinationId = destinationId;
    }

    // Find all matching slots
    let slots = await Slot.find(query)
      .populate("packageId")
      .populate({
        path: "bookings",
        select: "userId guestDetails",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ tripDate: 1 });

    // Filter by available slots (at least 1 slot available)
    slots = slots.filter((slot) => slot.maxSlots - slot.currentBookings >= 1);

    // Advanced matching algorithm
    const matchedSlots = slots.map((slot) => {
      let matchScore = 0;
      const packageData = slot.packageId;
      if (!packageData) return null;

      // 1. Availability Score (40 points max)
      const availableSlots = slot.maxSlots - slot.currentBookings;
      matchScore += Math.min(40, availableSlots * 10);

      // 2. Date Match Score (30 points max)
      if (preferredStartDate) {
        const daysDiff = Math.abs(
          moment(slot.tripDate).diff(moment(preferredStartDate), "days")
        );
        if (daysDiff === 0) {
          matchScore += 30; // Perfect date match
        } else if (daysDiff <= 3) {
          matchScore += 25; // Within 3 days
        } else if (daysDiff <= 7) {
          matchScore += 20; // Within a week
        } else if (daysDiff <= 14) {
          matchScore += 15; // Within 2 weeks
        } else {
          matchScore += Math.max(0, 10 - daysDiff / 10); // Decreasing score
        }
      } else {
        // Prefer trips in next 2-4 weeks
        const daysUntil = moment(slot.tripDate).diff(moment(), "days");
        if (daysUntil >= 14 && daysUntil <= 28) {
          matchScore += 20;
        } else if (daysUntil >= 7 && daysUntil <= 14) {
          matchScore += 15;
        }
      }

      // 3. Destination Match Score (20 points max)
      if (destinationId && slot.destinationId.toString() === destinationId) {
        matchScore += 20;
      } else if (destinationName) {
        const nameMatch = slot.destinationName
          .toLowerCase()
          .includes(destinationName.toLowerCase());
        if (nameMatch) {
          matchScore += 15;
        }
      }

      // 4. Budget Match Score (20 points max)
      if (budget) {
        const packagePrice = packageData.price?.adult || packageData.price || 0;
        const priceDiff = Math.abs(packagePrice - parseFloat(budget));
        const percentageDiff = (priceDiff / parseFloat(budget)) * 100;

        if (percentageDiff <= 10) {
          matchScore += 20; // Within 10%
        } else if (percentageDiff <= 20) {
          matchScore += 15; // Within 20%
        } else if (percentageDiff <= 30) {
          matchScore += 10; // Within 30%
        } else if (percentageDiff <= 50) {
          matchScore += 5; // Within 50%
        }
      }

      // 5. Category Match Score (15 points max)
      if (category && packageData.category === category) {
        matchScore += 15;
      }

      // 6. Package Type Match Score (15 points max)
      if (packageType && packageData.packageType === packageType) {
        matchScore += 15;
      }

      // 7. Travel Style Match Score (10 points max)
      if (travelStyle && packageData.features) {
        const styleMatch = packageData.features.some((feature) =>
          feature.toLowerCase().includes(travelStyle.toLowerCase())
        );
        if (styleMatch) {
          matchScore += 10;
        }
      }

      // 8. Group Size Score (10 points max) - Prefer slots with some people but not full
      const occupancyRate = slot.currentBookings / slot.maxSlots;
      if (occupancyRate >= 0.3 && occupancyRate <= 0.7) {
        matchScore += 10; // Sweet spot: 30-70% full
      } else if (occupancyRate > 0 && occupancyRate < 0.3) {
        matchScore += 5; // New group forming
      }

      // 9. Recency Score (5 points max) - Prefer recently created slots
      const daysSinceCreation = moment().diff(moment(slot.createdAt), "days");
      if (daysSinceCreation <= 7) {
        matchScore += 5;
      } else if (daysSinceCreation <= 14) {
        matchScore += 3;
      }

      return {
        slot,
        matchScore: Math.round(matchScore),
      };
    })
      .filter((item) => item !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    // Get top 10 matches
    const topMatches = matchedSlots.slice(0, 10);

    // Format response
    const formattedMatches = topMatches.map(({ slot, matchScore }) => {
      const bookingDetails = slot.bookings.map((booking) => ({
        bookingId: booking._id,
        userName: booking.userId?.name || "N/A",
        userEmail: booking.userId?.email || "N/A",
        guestCount: booking.guestDetails?.length || 0,
        guests: booking.guestDetails || [],
      }));

      const packageData = slot.packageId;
      const packagePrice = packageData?.price?.adult || packageData?.price || 0;

      return {
        _id: slot._id,
        slotName: slot.slotName,
        packageId: packageData?._id,
        packageName: packageData?.title || "N/A",
        packageDuration: packageData?.duration || "N/A",
        packageCategory: packageData?.category || "N/A",
        packageType: packageData?.packageType || "N/A",
        packagePrice,
        packageOverview: packageData?.overview || "",
        packageHighlights: packageData?.highlights || [],
        destinationId: slot.destinationId,
        destinationName: slot.destinationName,
        tripDate: moment(slot.tripDate).tz("Asia/Kolkata").format("YYYY-MM-DD"),
        tripDateFormatted: moment(slot.tripDate).tz("Asia/Kolkata").format("DD MMM YYYY"),
        daysUntilTrip: moment(slot.tripDate).diff(moment(), "days"),
        maxSlots: slot.maxSlots,
        currentBookings: slot.currentBookings,
        availableSlots: slot.maxSlots - slot.currentBookings,
        occupancyRate: Math.round((slot.currentBookings / slot.maxSlots) * 100),
        status: slot.status,
        matchScore,
        matchPercentage: Math.min(100, Math.round((matchScore / 150) * 100)), // Out of max 150 points
        bookingDetails,
        groupSize: slot.currentBookings,
        isNewGroup: slot.currentBookings <= 2,
        isPopular: slot.currentBookings >= slot.maxSlots * 0.5,
        createdAt: moment(slot.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Best matching slots found",
      data: formattedMatches,
      count: formattedMatches.length,
      preferences: {
        destinationId: destinationId || null,
        destinationName: destinationName || null,
        preferredStartDate: preferredStartDate || null,
        preferredEndDate: preferredEndDate || null,
        budget: budget || null,
        category: category || null,
        packageType: packageType || null,
        travelStyle: travelStyle || null,
      },
    });
  } catch (error) {
    console.error("Get best matches error:", error);
    return res.status(500).json({
      status: false,
      message: "Error finding matching slots",
      error: error.message,
    });
  }
};

// Get Slots by Similar Preferences
export const getSimilarSlots = async (req, res) => {
  try {
    const { slotId } = req.params;

    const currentSlot = await Slot.findById(slotId).populate("packageId");
    if (!currentSlot) {
      return res.status(404).json({
        status: false,
        message: "Slot not found",
      });
    }

    const packageData = currentSlot.packageId;
    if (!packageData) {
      return res.status(404).json({
        status: false,
        message: "Package not found for this slot",
      });
    }

    // Find similar slots based on:
    // 1. Same destination
    // 2. Same category or package type
    // 3. Similar price range (±20%)
    // 4. Similar dates (±30 days)

    const packagePrice = packageData.price?.adult || packageData.price || 0;
    const priceRange = {
      min: packagePrice * 0.8,
      max: packagePrice * 1.2,
    };

    const dateRange = {
      start: moment(currentSlot.tripDate).subtract(30, "days").toDate(),
      end: moment(currentSlot.tripDate).add(30, "days").toDate(),
    };

    const similarSlots = await Slot.find({
      _id: { $ne: slotId }, // Exclude current slot
      status: "available",
      destinationId: currentSlot.destinationId,
      tripDate: {
        $gte: dateRange.start,
        $lte: dateRange.end,
      },
    })
      .populate("packageId")
      .populate({
        path: "bookings",
        select: "userId",
        populate: {
          path: "userId",
          select: "name email",
        },
      });

    // Filter by price and category/type
    const filteredSlots = similarSlots.filter((slot) => {
      const slotPackage = slot.packageId;
      if (!slotPackage) return false;

      const slotPrice = slotPackage.price?.adult || slotPackage.price || 0;
      if (slotPrice < priceRange.min || slotPrice > priceRange.max) {
        return false;
      }

      // Match category or package type
      if (
        slotPackage.category === packageData.category ||
        slotPackage.packageType === packageData.packageType
      ) {
        return true;
      }

      return false;
    });

    // Format response
    const formattedSlots = filteredSlots
      .slice(0, 5)
      .map((slot) => ({
        _id: slot._id,
        slotName: slot.slotName,
        packageName: slot.packageId?.title || "N/A",
        packagePrice: slot.packageId?.price?.adult || slot.packageId?.price || 0,
        destinationName: slot.destinationName,
        tripDate: moment(slot.tripDate).tz("Asia/Kolkata").format("YYYY-MM-DD"),
        availableSlots: slot.maxSlots - slot.currentBookings,
        currentBookings: slot.currentBookings,
      }));

    return res.status(200).json({
      status: true,
      message: "Similar slots found",
      data: formattedSlots,
      count: formattedSlots.length,
    });
  } catch (error) {
    console.error("Get similar slots error:", error);
    return res.status(500).json({
      status: false,
      message: "Error finding similar slots",
      error: error.message,
    });
  }
};

