import Community from "../../../models/CommunityModel.js";

// Add Community
export const AddCommunity = async (req, res) => {
  try {
    const { title, description, image, type, author, status } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        status: false,
        message: "Title and description are required"
      });
    }

    const newCommunity = new Community({
      title,
      description,
      image: image || "",
      type: type || 'other',
      author: author || "",
      status: status || 'active',
      createdBy: req.user?.id || req.user?._id || null
    });

    await newCommunity.save();

    return res.status(201).json({
      status: true,
      message: "Community post created successfully",
      data: newCommunity
    });
  } catch (error) {
    console.error("AddCommunity error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating community post",
      error: error.message
    });
  }
};

// Get All Community Posts
export const GetAllCommunity = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Community.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Community.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Community posts fetched successfully",
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllCommunity error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching community posts",
      error: error.message
    });
  }
};

// Get Community By ID
export const GetCommunityById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Community.findById(id)
      .populate('createdBy', 'name email');

    if (!post) {
      return res.status(404).json({
        status: false,
        message: "Community post not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community post fetched successfully",
      data: post
    });
  } catch (error) {
    console.error("GetCommunityById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching community post",
      error: error.message
    });
  }
};

// Update Community
export const UpdateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const post = await Community.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    if (!post) {
      return res.status(404).json({
        status: false,
        message: "Community post not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community post updated successfully",
      data: post
    });
  } catch (error) {
    console.error("UpdateCommunity error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating community post",
      error: error.message
    });
  }
};

// Delete Community
export const DeleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Community.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({
        status: false,
        message: "Community post not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Community post deleted successfully"
    });
  } catch (error) {
    console.error("DeleteCommunity error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting community post",
      error: error.message
    });
  }
};

