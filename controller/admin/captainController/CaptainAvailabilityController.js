import CaptainAvailability from "../../../models/CaptainAvailabilityModel.js";

// Add Availability
export const AddAvailability = async (req, res) => {
  try {
    const { captainId, date, status, reason, notes, customerName, customerEmail, customerPhone, bookingReference } = req.body;

    if (!captainId || !date) {
      return res.status(400).json({
        status: false,
        message: "Captain ID and date are required"
      });
    }

    // Check if availability already exists for this date
    const existing = await CaptainAvailability.findOne({
      captainId,
      date: new Date(date)
    });

    if (existing) {
      return res.status(400).json({
        status: false,
        message: "Availability for this date already exists"
      });
    }

    const newAvailability = new CaptainAvailability({
      captainId,
      date: new Date(date),
      status: status || 'available',
      reason: reason || "",
      notes: notes || "",
      customerName: customerName || "",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      bookingReference: bookingReference || ""
    });

    await newAvailability.save();

    return res.status(201).json({
      status: true,
      message: "Availability added successfully",
      data: newAvailability
    });
  } catch (error) {
    console.error("AddAvailability error:", error);
    return res.status(500).json({
      status: false,
      message: "Error adding availability",
      error: error.message
    });
  }
};

// Get Availability by Captain and Month
export const GetAvailabilityByCaptain = async (req, res) => {
  try {
    const { captainId } = req.params;
    const { year, month } = req.query;

    if (!captainId) {
      return res.status(400).json({
        status: false,
        message: "Captain ID is required"
      });
    }

    let query = { captainId };
    
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const availabilities = await CaptainAvailability.find(query)
      .sort({ date: 1 });

    return res.status(200).json({
      status: true,
      message: "Availability fetched successfully",
      data: availabilities
    });
  } catch (error) {
    console.error("GetAvailabilityByCaptain error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching availability",
      error: error.message
    });
  }
};

// Update Availability
export const UpdateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const availability = await CaptainAvailability.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!availability) {
      return res.status(404).json({
        status: false,
        message: "Availability not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Availability updated successfully",
      data: availability
    });
  } catch (error) {
    console.error("UpdateAvailability error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating availability",
      error: error.message
    });
  }
};

// Delete Availability
export const DeleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const availability = await CaptainAvailability.findByIdAndDelete(id);

    if (!availability) {
      return res.status(404).json({
        status: false,
        message: "Availability not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Availability deleted successfully"
    });
  } catch (error) {
    console.error("DeleteAvailability error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting availability",
      error: error.message
    });
  }
};

