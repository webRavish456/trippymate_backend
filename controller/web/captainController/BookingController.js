import CaptainAvailability from "../../../models/CaptainAvailabilityModel.js";
import Captain from "../../../models/CaptainModel.js";

// Book Captain
export const BookCaptain = async (req, res) => {
  try {
    const { captainId, startDate, endDate, destination, customerName, customerEmail, customerPhone, numberOfDays, specialRequirements } = req.body;

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
      return res.status(400).json({
        status: false,
        message: "Captain is not available for the selected dates. Please choose different dates."
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

    return res.status(201).json({
      status: true,
      message: "Captain booked successfully",
      data: {
        bookingReference: bookingReference,
        captainId,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        numberOfDays: numberOfDaysCalculated,
        destination: destination || 'Not specified'
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

