import Captain from "../../../models/CaptainModel.js";
import CaptainAvailability from "../../../models/CaptainAvailabilityModel.js";

// Check Captain Availability
export const CheckCaptainAvailability = async (req, res) => {
  try {
    const { captainId, startDate, endDate } = req.query;

    if (!captainId || !startDate || !endDate) {
      return res.status(400).json({
        status: false,
        message: "Captain ID, start date, and end date are required"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get all unavailable dates in range
    const unavailableDates = await CaptainAvailability.find({
      captainId,
      date: { $gte: start, $lte: end },
      status: { $in: ['unavailable', 'booked'] }
    }).select('date status');

    const unavailableDateStrings = unavailableDates.map(av => 
      av.date.toISOString().split('T')[0]
    );

    return res.status(200).json({
      status: true,
      message: "Availability checked successfully",
      data: {
        isAvailable: unavailableDates.length === 0,
        unavailableDates: unavailableDateStrings
      }
    });
  } catch (error) {
    console.error("CheckCaptainAvailability error:", error);
    return res.status(500).json({
      status: false,
      message: "Error checking availability",
      error: error.message
    });
  }
};

// Get All Active Captains for Frontend (Public)
export const GetAllActiveCaptains = async (req, res) => {
  try {
    const { location, specialization, language, category, limit = 10, page = 1 } = req.query;
    
    // Build query - only active captains
    const query = { status: 'active' };
    
    // Filter by location if provided
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Filter by specialization if provided
    if (specialization) {
      query.specialization = { $in: [specialization] };
    }
    
    // Filter by language if provided
    if (language) {
      query.languages = { $in: [language] };
    }
    
    // Filter by category (traveler type) if provided
    if (category) {
      query.category = { $in: [category] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const captains = await Captain.find(query)
      .select('-bankDetails -documents -createdBy -email -phone') // Exclude sensitive data
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Captain.countDocuments(query);

    // Transform data for frontend
    const transformedCaptains = captains.map(captain => {
      return {
        id: captain._id,
        name: captain.name,
        location: captain.address || 'India',
        image: captain.profileImage || (captain.photos && captain.photos.length > 0 ? captain.photos[0] : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'),
        backgroundImage: captain.backgroundImage || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
        verified: captain.status === 'active',
        badge: captain.badge || 'Local Expert',
        badgeColor: captain.badgeColor || 'yellow',
        rating: captain.rating || 4.5,
        languages: captain.languages || [],
        expertise: captain.specialization || [],
        category: captain.category || [],
        price: captain.price || 999
      };
    });

    return res.status(200).json({
      status: true,
      message: "Captains fetched successfully",
      data: {
        captains: transformedCaptains,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllActiveCaptains error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching captains",
      error: error.message
    });
  }
};

// Get Captain By ID for Frontend (Public)
export const GetCaptainByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;

    const captain = await Captain.findById(id)
      .select('-bankDetails -documents -createdBy -email -phone'); // Exclude sensitive data

    if (!captain) {
      return res.status(404).json({
        status: false,
        message: "Captain not found"
      });
    }

    // Only return active captains
    if (captain.status !== 'active') {
      return res.status(404).json({
        status: false,
        message: "Captain not available"
      });
    }

    // Transform data for frontend
    const transformedCaptain = {
      id: captain._id,
      name: captain.name,
      location: captain.address || 'India',
      image: captain.profileImage || (captain.photos && captain.photos.length > 0 ? captain.photos[0] : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'),
      backgroundImage: captain.backgroundImage || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
      verified: captain.status === 'active',
      badge: captain.badge || 'Local Expert',
      badgeColor: captain.badgeColor || 'yellow',
      rating: captain.rating || 4.5,
      languages: captain.languages || [],
      expertise: captain.specialization || [],
      price: captain.price || 999,
      bio: captain.bio || '',
      experience: captain.experience,
      photos: captain.photos || []
    };

    return res.status(200).json({
      status: true,
      message: "Captain fetched successfully",
      data: transformedCaptain
    });
  } catch (error) {
    console.error("GetCaptainByIdPublic error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching captain",
      error: error.message
    });
  }
};

