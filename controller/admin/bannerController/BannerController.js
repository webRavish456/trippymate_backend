import Banner from "../../../models/BannerModel.js";

// Add Banner
export const AddBanner = async (req, res) => {
  try {
    const { title, description, image, link, position, order, status, validFrom, validUntil, width, height } = req.body;

    // Use uploaded image if available, otherwise use provided image URL
    const imageUrl = req.imageUrls?.image || image;

    if (!title || !imageUrl) {
      return res.status(400).json({
        status: false,
        message: "Title and image are required"
      });
    }

    const newBanner = new Banner({
      title,
      description: description || "",
      image: imageUrl,
      link: link || "",
      position: position || 'homepage',
      order: order || 0,
      width: width ? parseInt(width) : 1080,
      height: height ? parseInt(height) : 600,
      status: status || 'active',
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      createdBy: req.user?.id || req.user?._id || null
    });

    await newBanner.save();

    return res.status(201).json({
      status: true,
      message: "Banner created successfully",
      data: newBanner
    });
  } catch (error) {
    console.error("AddBanner error:", error);
    return res.status(500).json({
      status: false,
      message: "Error creating banner",
      error: error.message
    });
  }
};

// Get All Banners
export const GetAllBanners = async (req, res) => {
  try {
    const { status, position, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (position) query.position = position;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const banners = await Banner.find(query)
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Banner.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Banners fetched successfully",
      data: {
        banners,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("GetAllBanners error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching banners",
      error: error.message
    });
  }
};

// Get Banner By ID
export const GetBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id)
      .populate('createdBy', 'name email');

    if (!banner) {
      return res.status(404).json({
        status: false,
        message: "Banner not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Banner fetched successfully",
      data: banner
    });
  } catch (error) {
    console.error("GetBannerById error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching banner",
      error: error.message
    });
  }
};

// Update Banner
export const UpdateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Use uploaded image if available
    if (req.imageUrls?.image) {
      updateData.image = req.imageUrls.image;
    }

    if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
    if (updateData.validUntil) updateData.validUntil = new Date(updateData.validUntil);
    
    // Set default width and height if not provided
    if (!updateData.width) updateData.width = 1080;
    if (!updateData.height) updateData.height = 600;
    
    // Parse width and height as integers
    if (updateData.width) updateData.width = parseInt(updateData.width);
    if (updateData.height) updateData.height = parseInt(updateData.height);

    const banner = await Banner.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    if (!banner) {
      return res.status(404).json({
        status: false,
        message: "Banner not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Banner updated successfully",
      data: banner
    });
  } catch (error) {
    console.error("UpdateBanner error:", error);
    return res.status(500).json({
      status: false,
      message: "Error updating banner",
      error: error.message
    });
  }
};

// Delete Banner
export const DeleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({
        status: false,
        message: "Banner not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Banner deleted successfully"
    });
  } catch (error) {
    console.error("DeleteBanner error:", error);
    return res.status(500).json({
      status: false,
      message: "Error deleting banner",
      error: error.message
    });
  }
};

