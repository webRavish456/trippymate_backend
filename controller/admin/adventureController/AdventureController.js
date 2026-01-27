import AdventurePost from "../../../models/AdventurePostModel.js";

// Add Adventure Post
export const AddAdventurePost = async (req, res) => {
  try {
    const { title, description, image, location, status, order } = req.body;

    // Use uploaded image if available, otherwise use provided image URL
    const imageUrl = req.imageUrls?.image || image;

    if (!title || !imageUrl) {
      return res.status(400).json({
        status: false,
        message: "Title and image are required"
      });
    }

    const newAdventurePost = new AdventurePost({
      title,
      description: description || "",
      image: imageUrl,
      location: location || "",
      status: status || 'active',
      order: order || 0,
      createdBy: req.user?.id || req.user?._id || null
    });

    await newAdventurePost.save();

    return res.status(201).json({
      status: true,
      message: "Adventure post created successfully",
      data: newAdventurePost
    });
  } catch (error) {
    console.error("AddAdventurePost error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating adventure post",
      error: error.message
    });
  }
};

// Get All Adventure Posts
export const GetAllAdventurePosts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const adventurePosts = await AdventurePost.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdventurePost.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Adventure posts fetched successfully",
      data: {
        adventurePosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllAdventurePosts error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching adventure posts",
      error: error.message
    });
  }
};

// Get Adventure Post By ID
export const GetAdventurePostById = async (req, res) => {
  try {
    const { id } = req.params;

    const adventurePost = await AdventurePost.findById(id)
      .populate('createdBy', 'name email');

    if (!adventurePost) {
      return res.status(404).json({
        status: false,
        message: "Adventure post not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Adventure post fetched successfully",
      data: adventurePost
    });
  } catch (error) {
    console.error("GetAdventurePostById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching adventure post",
      error: error.message
    });
  }
};

// Update Adventure Post
export const UpdateAdventurePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, location, status } = req.body;

    // Use uploaded image if available, otherwise use provided image URL
    const imageUrl = req.imageUrls?.image || image;

    const updateData = {
      title,
      description: description || "",
      location: location || "",
      status: status || 'active'
    };

    // Only update image if provided
    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const adventurePost = await AdventurePost.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    if (!adventurePost) {
      return res.status(404).json({
        status: false,
        message: "Adventure post not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Adventure post updated successfully",
      data: adventurePost
    });
  } catch (error) {
    console.error("UpdateAdventurePost error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating adventure post",
      error: error.message
    });
  }
};

// Delete Adventure Post
export const DeleteAdventurePost = async (req, res) => {
  try {
    const { id } = req.params;

    const adventurePost = await AdventurePost.findByIdAndDelete(id);

    if (!adventurePost) {
      return res.status(404).json({
        status: false,
        message: "Adventure post not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Adventure post deleted successfully"
    });
  } catch (error) {
    console.error("DeleteAdventurePost error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting adventure post",
      error: error.message
    });
  }
};
