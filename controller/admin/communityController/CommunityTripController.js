import CommunityTrip from '../../../models/CommunityTripModel.js';
import CommunityMessage from '../../../models/CommunityMessageModel.js';
import User from '../../../models/UserModel.js';

// Auto-delete messages when trip end date passes
const deleteExpiredTripMessages = async () => {
  try {
    const now = new Date();
    const expiredTrips = await CommunityTrip.find({
      endDate: { $lt: now },
      status: { $ne: 'cancelled' }
    });

    for (const trip of expiredTrips) {
      // Delete all messages for expired trips
      await CommunityMessage.deleteMany({ tripId: trip._id });
      
      // Update trip status to completed
      await CommunityTrip.findByIdAndUpdate(trip._id, {
        status: 'completed'
      });
    }

    if (expiredTrips.length > 0) {
      console.log(`Deleted messages for ${expiredTrips.length} expired trips`);
    }
  } catch (error) {
    console.error('Error deleting expired trip messages:', error);
  }
};

// Run cleanup every hour
setInterval(deleteExpiredTripMessages, 60 * 60 * 1000); // 1 hour

// Run on startup
deleteExpiredTripMessages();

// Create Community Trip
const createCommunityTrip = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      tripType,
      groupType,
      maxMembers,
      organizerId,
      organizerName,
      organizerRating,
      organizerVerified,
      price,
      currency,
      itinerary,
      inclusions,
      exclusions,
      importantNotes,
      images: imagesFromBody,
      organizerImage: organizerImageFromBody
    } = req.body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate || !location) {
      return res.status(400).json({
        status: false,
        message: "Title, description, dates, and location are required"
      });
    }

    // Get user info from token if it's a user request (not admin)
    let finalOrganizerId = organizerId;
    let finalOrganizerName = organizerName;
    let finalOrganizerRating = organizerRating || 0;
    let finalOrganizerVerified = organizerVerified || false;

    // If user is creating (from frontend), use their details
    if (req.user && (!req.user.role || req.user.role !== 'admin')) {
      // This is a user request, not admin
      finalOrganizerId = req.user.id || req.user._id || req.user.userId;
      const user = await User.findById(finalOrganizerId);
      if (user) {
        finalOrganizerName = user.name || user.email || 'User';
        finalOrganizerRating = user.rating || 0;
        finalOrganizerVerified = user.verified || false;
      } else {
        // If user not found, use token data
        finalOrganizerName = req.user.name || req.user.email || 'User';
      }
    } else if (req.user && req.user.role === 'admin') {
      // Admin panel request - set defaults if not provided
      if (!finalOrganizerId) {
        finalOrganizerId = req.user.id || req.user._id || null;
      }
      if (!finalOrganizerName) {
        finalOrganizerName = req.user.name || 'Admin';
      }
    } else {
      // No user token - set defaults
      if (!finalOrganizerId) {
        finalOrganizerId = null;
      }
      if (!finalOrganizerName) {
        finalOrganizerName = 'Admin';
      }
    }

    // Handle images from middleware or body (for JSON format with URLs)
    const images = [];
    if (req.imageUrls?.images) {
      // From file upload middleware
      images.push(...req.imageUrls.images);
    } else if (imagesFromBody) {
      // From JSON body (array of URLs)
      if (Array.isArray(imagesFromBody)) {
        imagesFromBody.forEach(imgUrl => {
          if (typeof imgUrl === 'string') {
            images.push({ path: imgUrl });
          } else if (imgUrl.path) {
            images.push(imgUrl);
          }
        });
      } else if (typeof imagesFromBody === 'string') {
        images.push({ path: imagesFromBody });
      }
    }

    // Handle organizer image from middleware or body
    let organizerImage = null;
    if (req.imageUrls?.organizerImage) {
      organizerImage = req.imageUrls.organizerImage;
    } else if (organizerImageFromBody) {
      if (typeof organizerImageFromBody === 'string') {
        organizerImage = { path: organizerImageFromBody };
      } else if (organizerImageFromBody.path) {
        organizerImage = organizerImageFromBody;
      }
    }

    // Parse JSON strings if they exist
    let parsedItinerary = [];
    if (itinerary) {
      try {
        parsedItinerary = typeof itinerary === 'string' ? JSON.parse(itinerary) : itinerary;
      } catch (e) {
        parsedItinerary = [];
      }
    }

    let parsedInclusions = [];
    if (inclusions) {
      try {
        parsedInclusions = typeof inclusions === 'string' ? JSON.parse(inclusions) : inclusions;
      } catch (e) {
        parsedInclusions = [];
      }
    }

    let parsedExclusions = [];
    if (exclusions) {
      try {
        parsedExclusions = typeof exclusions === 'string' ? JSON.parse(exclusions) : exclusions;
      } catch (e) {
        parsedExclusions = [];
      }
    }

    const tripData = {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      tripType: tripType || 'other',
      groupType: groupType || 'Mixed Group',
      maxMembers: maxMembers || 20,
      organizerId: finalOrganizerId,
      organizerName: finalOrganizerName,
      organizerRating: finalOrganizerRating,
      organizerVerified: finalOrganizerVerified,
      price: price || 0,
      currency: currency || 'INR',
      itinerary: parsedItinerary,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      importantNotes: importantNotes || '',
      images,
      organizerImage,
      status: 'upcoming',
      members: []
    };

    const newTrip = await CommunityTrip.create(tripData);

    return res.status(201).json({
      status: true,
      message: "Community trip created successfully",
      data: newTrip
    });

  } catch (error) {
    console.error("Error creating community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating community trip",
      error: error.message,
    });
  }
};

// Get All Community Trips
const getAllCommunityTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const totalTrips = await CommunityTrip.countDocuments(query);
    
    const trips = await CommunityTrip.find(query)
      .populate('organizerId', 'name email phone')
      .populate('members.userId', 'name email')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalTrips / limit);

    return res.status(200).json({
      status: true,
      message: "Community trips retrieved successfully",
      data: trips,
      pagination: {
        currentPage: page,
        totalPages,
        totalTrips,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching community trips:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching community trips",
      error: error.message,
    });
  }
};

// Get Community Trip by ID
const getCommunityTripById = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await CommunityTrip.findById(tripId)
      .populate('organizerId', 'name email phone')
      .populate('members.userId', 'name email phone');

    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community trip retrieved successfully",
      data: trip
    });
  } catch (error) {
    console.error("Error fetching community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching community trip",
      error: error.message,
    });
  }
};

// Update Community Trip
const updateCommunityTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    let data = req.body;

    // Parse JSON strings if they exist
    const jsonFields = ['itinerary', 'inclusions', 'exclusions']
    jsonFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        try {
          data[field] = JSON.parse(data[field])
        } catch (e) {
          // Keep as is if parsing fails
        }
      }
    })

    // Handle date fields
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    // Handle images from middleware
    if (req.imageUrls?.images) {
      data.images = req.imageUrls.images;
    }

    if (req.imageUrls?.organizerImage) {
      data.organizerImage = req.imageUrls.organizerImage;
    }

    const result = await CommunityTrip.findByIdAndUpdate(tripId, data, { new: true })
      .populate('organizerId', 'name email phone')
      .populate('members.userId', 'name email');

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community trip updated successfully",
      data: result
    });
  } catch (error) {
    console.error("Error updating community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating community trip",
      error: error.message,
    });
  }
};

// Delete Community Trip
const deleteCommunityTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Also delete all messages related to this trip
    await CommunityMessage.deleteMany({ tripId });

    const result = await CommunityTrip.findByIdAndDelete(tripId);

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community trip deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting community trip",
      error: error.message,
    });
  }
};

// Join Community Trip (User action)
const joinCommunityTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    const trip = await CommunityTrip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        status: false,
        message: "Community trip not found"
      });
    }

    // Check if user is already a member
    const existingMember = trip.members.find(m => m.userId.toString() === userId);
    if (existingMember) {
      return res.status(400).json({
        status: false,
        message: "User is already a member of this trip"
      });
    }

    // Check if trip is full
    const approvedMembers = trip.members.filter(m => m.status === 'approved').length;
    if (approvedMembers >= trip.maxMembers) {
      return res.status(400).json({
        status: false,
        message: "Trip is full"
      });
    }

    // Add member
    trip.members.push({
      userId,
      joinedAt: new Date(),
      status: 'pending'
    });

    await trip.save();

    return res.status(200).json({
      status: true,
      message: "Successfully joined the community trip",
      data: trip
    });
  } catch (error) {
    console.error("Error joining community trip:", error);
    return res.status(500).json({
      status: false,
      message: "Error joining community trip",
      error: error.message,
    });
  }
};


export {
  createCommunityTrip,
  getAllCommunityTrips,
  getCommunityTripById,
  updateCommunityTrip,
  deleteCommunityTrip,
  joinCommunityTrip
};

