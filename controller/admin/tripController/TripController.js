import Trip from "../../../models/TripModel.js";

// Create Trip
const createTrip = async (req, res) => {
  try {
    const {
      tripName,
      startDate,
      endDate,
      price,
      totalSeats,
      availableSeats,
      status,
      departureLocation,
      guide,
    } = req.body;

    // Handle image from middleware
    let image = '';
    if (req.imageUrls && req.imageUrls.image) {
      image = req.imageUrls.image;
    } else if (req.fileUrl || req.imageUrl) {
      image = req.fileUrl || req.imageUrl;
    } else if (req.body.image) {
      image = req.body.image;
    }

    const tripData = {
      tripName,
      startDate,
      endDate,
      price,
      totalSeats,
      availableSeats: availableSeats || totalSeats,
      status: status || "Open",
      departureLocation: departureLocation || "",
      guide: guide || "",
      image,
    };

    const newTrip = await Trip.create(tripData);

    return res.status(201).json({ 
      success: true, 
      message: "Trip created successfully", 
      data: newTrip 
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || "Failed to create trip" 
    });
  }
};

// Get All Trips
const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ startDate: 1 });
    return res.status(200).json({ 
      success: true, 
      count: trips.length, 
      data: trips 
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get Trip By ID
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        message: "Trip not found" 
      });
    }
    return res.status(200).json({ 
      success: true, 
      data: trip 
    });
  } catch (error) {
    console.error("Error fetching trip:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update Trip
const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTrip = await Trip.findById(id);
    
    if (!existingTrip) {
      return res.status(404).json({ 
        success: false, 
        message: "Trip not found" 
      });
    }

    const {
      tripName,
      startDate,
      endDate,
      price,
      totalSeats,
      availableSeats,
      status,
      departureLocation,
      guide,
    } = req.body;

    let updateData = {};

    if (tripName) updateData.tripName = tripName;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (price) updateData.price = price;
    if (totalSeats) updateData.totalSeats = totalSeats;
    if (availableSeats) updateData.availableSeats = availableSeats;
    if (status) updateData.status = status;
    if (departureLocation) updateData.departureLocation = departureLocation;
    if (guide) updateData.guide = guide;

    // Handle image update from middleware
    if (req.imageUrls && req.imageUrls.image) {
      updateData.image = req.imageUrls.image;
    } else if (req.fileUrl || req.imageUrl) {
      updateData.image = req.fileUrl || req.imageUrl;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({ 
      success: true, 
      message: "Trip updated successfully", 
      data: updatedTrip 
    });
  } catch (error) {
    console.error("Error updating trip:", error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || "Failed to update trip" 
    });
  }
};

// Delete Trip
const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findByIdAndDelete(id);
    
    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        message: "Trip not found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Trip deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to delete trip" 
    });
  }
};

export { createTrip, getAllTrips, getTripById, updateTrip, deleteTrip };
