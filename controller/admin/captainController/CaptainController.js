import Captain from "../../../models/CaptainModel.js";

// Add Captain
export const AddCaptain = async (req, res) => {
  try {
    const { name, email, phone, address, experience, specialization, category, languages, rating, bio, status, bankDetails, price, badge } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        status: false,
        message: "Name, email, and phone are required"
      });
    }

    // Check if email already exists
    const existingCaptain = await Captain.findOne({ email });
    if (existingCaptain) {
      return res.status(400).json({
        status: false,
        message: "Captain with this email already exists"
      });
    }

    // Parse specialization, category, and languages if they are strings
    let parsedSpecialization = specialization;
    let parsedCategory = category;
    let parsedLanguages = languages;
    if (typeof specialization === 'string') {
      try {
        parsedSpecialization = JSON.parse(specialization);
      } catch (e) {
        parsedSpecialization = [];
      }
    }
    if (typeof category === 'string') {
      try {
        parsedCategory = JSON.parse(category);
      } catch (e) {
        parsedCategory = [];
      }
    }
    if (typeof languages === 'string') {
      try {
        parsedLanguages = JSON.parse(languages);
      } catch (e) {
        parsedLanguages = [];
      }
    }

    // Parse bankDetails if it's a string
    let parsedBankDetails = bankDetails;
    if (typeof bankDetails === 'string') {
      try {
        parsedBankDetails = JSON.parse(bankDetails);
      } catch (e) {
        parsedBankDetails = {};
      }
    }

    const newCaptain = new Captain({
      name,
      email,
      phone,
      address: address || "",
      location: address || "",
      experience: experience !== undefined && experience !== null && experience !== "" && experience !== "null" && experience !== "undefined" ? (typeof experience === 'string' ? parseInt(experience) : parseInt(experience)) : undefined,
      specialization: parsedSpecialization || [],
      category: parsedCategory || [],
      languages: parsedLanguages || [],
      rating: rating !== undefined && rating !== null && rating !== "" && rating !== "null" && rating !== "undefined" ? (typeof rating === 'string' ? parseFloat(rating) : parseFloat(rating)) : undefined,
      photos: req.fileUrls?.photos || [],
      profileImage: req.fileUrls?.profileImage || null,
      backgroundImage: req.fileUrls?.backgroundImage || null,
      documents: req.fileUrls?.documents || [],
      bio: bio || "",
      status: status || 'active',
      bankDetails: parsedBankDetails || {},
      price: price !== undefined && price !== null && price !== "" ? parseFloat(price) : undefined,
      badge: badge || "Local Expert",
      badgeColor: badgeColor || "yellow",
      createdBy: req.user?.id || req.user?._id || null
    });

    await newCaptain.save();

    return res.status(201).json({
      status: true,
      message: "Captain created successfully",
      data: newCaptain
    });
  } catch (error) {
    console.error("AddCaptain error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating captain",
      error: error.message
    });
  }
};

// Get All Captains
export const GetAllCaptains = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const captains = await Captain.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Captain.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Captains fetched successfully",
      data: {
        captains,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllCaptains error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching captains",
      error: error.message
    });
  }
};

// Get Captain By ID
export const GetCaptainById = async (req, res) => {
  try {
    const { id } = req.params;

    const captain = await Captain.findById(id)
      .populate('createdBy', 'name email');

    if (!captain) {
      return res.status(404).json({
        status: false,
        message: "Captain not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Captain fetched successfully",
      data: captain
    });
  } catch (error) {
    console.error("GetCaptainById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching captain",
      error: error.message
    });
  }
};

// Update Captain
export const UpdateCaptain = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingCaptain = await Captain.findOne({ 
        email: updateData.email,
        _id: { $ne: id }
      });
      if (existingCaptain) {
        return res.status(400).json({
          status: false,
          message: "Captain with this email already exists"
        });
      }
    }

    // Handle file uploads
    if (req.fileUrls?.photos) {
      const existingCaptain = await Captain.findById(id);
      const existingPhotos = existingCaptain?.photos || [];
      updateData.photos = [...existingPhotos, ...req.fileUrls.photos];
    }
    if (req.fileUrls?.documents) {
      const existingCaptain = await Captain.findById(id);
      const existingDocuments = existingCaptain?.documents || [];
      updateData.documents = [...existingDocuments, ...req.fileUrls.documents];
    }
    if (req.fileUrls?.profileImage) {
      updateData.profileImage = req.fileUrls.profileImage;
    }
    if (req.fileUrls?.backgroundImage) {
      updateData.backgroundImage = req.fileUrls.backgroundImage;
    }

    // Parse specialization, category, and languages if they are strings
    if (updateData.specialization && typeof updateData.specialization === 'string') {
      try {
        updateData.specialization = JSON.parse(updateData.specialization);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }
    if (updateData.category && typeof updateData.category === 'string') {
      try {
        updateData.category = JSON.parse(updateData.category);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }
    if (updateData.languages && typeof updateData.languages === 'string') {
      try {
        updateData.languages = JSON.parse(updateData.languages);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }

    // Handle experience and rating - allow null/empty
    if (updateData.experience !== undefined) {
      if (updateData.experience === "" || updateData.experience === null || updateData.experience === "null" || updateData.experience === "undefined") {
        updateData.experience = undefined;
      } else {
        const expValue = typeof updateData.experience === 'string' ? parseInt(updateData.experience) : updateData.experience;
        updateData.experience = isNaN(expValue) ? undefined : expValue;
      }
    }
    if (updateData.rating !== undefined) {
      if (updateData.rating === "" || updateData.rating === null || updateData.rating === "null" || updateData.rating === "undefined") {
        updateData.rating = undefined;
      } else {
        const ratingValue = typeof updateData.rating === 'string' ? parseFloat(updateData.rating) : updateData.rating;
        updateData.rating = isNaN(ratingValue) ? undefined : ratingValue;
      }
    }

    // Parse bankDetails if it's a string
    if (updateData.bankDetails && typeof updateData.bankDetails === 'string') {
      try {
        updateData.bankDetails = JSON.parse(updateData.bankDetails);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }

    const captain = await Captain.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    if (!captain) {
      return res.status(404).json({
        status: false,
        message: "Captain not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Captain updated successfully",
      data: captain
    });
  } catch (error) {
    console.error("UpdateCaptain error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating captain",
      error: error.message
    });
  }
};

// Delete Captain
export const DeleteCaptain = async (req, res) => {
  try {
    const { id } = req.params;

    const captain = await Captain.findByIdAndDelete(id);

    if (!captain) {
      return res.status(404).json({
        status: false,
        message: "Captain not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Captain deleted successfully"
    });
  } catch (error) {
    console.error("DeleteCaptain error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting captain",
      error: error.message
    });
  }
};

