import CaptainAvailability from "../../../models/CaptainAvailabilityModel.js";
import Captain from "../../../models/CaptainModel.js";
import Booking from "../../../models/BookingModel.js";

// Book Captain
export const BookCaptain = async (req, res) => {
  try {
    const { captainId, startDate, endDate, destination, customerName, customerEmail, customerPhone, numberOfDays, specialRequirements, userId, amount, promoCode, couponCode } = req.body;

    if (!captainId || !startDate || !endDate || !customerName) {
      return res.status(400).json({
        status: false,
        message: "Captain ID, start date, end date, and customer name are required"
      });
    }

    // Check if captain exists
    const captain = await Captain.findById(captainId);
    if (!captain) {
      return res.status(404).json({
        status: false,
        message: "Captain not found"
      });
    }

    // Check if captain is available for the selected dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check for existing bookings or unavailability
    const existingBookings = await CaptainAvailability.find({
      captainId,
      date: { $gte: start, $lte: end },
      status: { $in: ['booked', 'unavailable'] }
    });

    if (existingBookings.length > 0) {
      // Get unique unavailable dates
      const unavailableDates = [...new Set(existingBookings.map(b => b.date.toISOString().split('T')[0]))].sort();
      
      return res.status(400).json({
        status: false,
        message: "Captain is not available for the selected dates. Please choose different dates.",
        unavailableDates: unavailableDates
      });
    }

    // Generate all dates in range
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    // Generate unique booking reference
    const bookingReference = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const numberOfDaysCalculated = dates.length;

    // Create availability records for all dates
    const bookingPromises = dates.map(async (date) => {
      const availability = new CaptainAvailability({
        captainId,
        date: date,
        status: 'booked',
        customerName: customerName,
        customerEmail: customerEmail || "",
        customerPhone: customerPhone || "",
        bookingReference: bookingReference,
        notes: `Destination: ${destination || 'Not specified'}, Days: ${numberOfDays || numberOfDaysCalculated}, Requirements: ${specialRequirements || 'None'}`,
        reason: destination ? `Booked for ${destination}` : "Booked"
      });
      return availability.save();
    });

    await Promise.all(bookingPromises);

    // Create Booking record if userId is provided (for showing in my-bookings)
    let bookingRecord = null;
    if (userId) {
      try {
        // Generate booking ID
        const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        // Create booking record (packageId is required but we'll use null and handle it in getUserBookings)
        bookingRecord = await Booking.create({
          packageId: null, // Captain bookings don't have packages
          userId: userId,
          captainId: captainId,
          status: "Active",
          tripdate: start,
          finalAmount: amount || 0,
          totalAmount: amount || 0,
          baseAmount: amount || 0,
          paymentStatus: "completed", // Assuming payment is completed when booking is created
          bookingId: bookingId,
          contactName: customerName,
          contactPhone: customerPhone,
          // Store booking details in guestDetails for compatibility
          guestDetails: [{
            guestName: customerName,
            tripDate: start,
            guestAddress: destination || '' // Store destination in guestAddress
          }]
        });
      } catch (bookingError) {
        console.error("Error creating booking record:", bookingError);
        // Don't fail the entire booking if Booking record creation fails
      }
    }

    return res.status(201).json({
      status: true,
      message: "Captain booked successfully",
      data: {
        bookingReference: bookingReference,
        captainId,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        numberOfDays: numberOfDaysCalculated,
        destination: destination || 'Not specified',
        bookingId: bookingRecord?._id?.toString() || null
      }
    });
  } catch (error) {
    console.error("BookCaptain error:", error);
    return res.status(500).json({
      status: false,
      message: "Error booking captain",
      error: error.message
    });
  }
};

