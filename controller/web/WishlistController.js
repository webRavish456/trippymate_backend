import User from "../../models/UserModel.js";
import Packages from "../../models/PackageModel.js";

// Get User Wishlist
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    const user = await User.findById(userId).select('wishlist');

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    const wishlistIds = user.wishlist || [];
    
    if (wishlistIds.length === 0) {
      return res.status(200).json({
        status: true,
        message: "Wishlist retrieved successfully",
        data: []
      });
    }

    // Fetch package details for wishlist items
    const packages = await Packages.find({ _id: { $in: wishlistIds } })
      .select('title destination duration images price category rating reviews');

    // Transform packages for frontend
    const wishlistItems = packages.map(pkg => {
      const addedDate = user.wishlistAddedDates?.[pkg._id.toString()] || new Date();
      
      return {
        id: pkg._id.toString(),
        packageName: pkg.title,
        destination: pkg.destination || 'Unknown',
        duration: pkg.duration || 'N/A',
        price: pkg.price?.adult || pkg.price || 0,
        originalPrice: pkg.originalPrice || pkg.price?.adult || pkg.price || 0,
        image: pkg.images?.[0]?.path || pkg.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        rating: pkg.rating || 0,
        reviews: pkg.reviews || 0,
        category: pkg.category || 'Travel',
        tripType: pkg.tripType || 'Group Trip',
        activities: pkg.activities || 'Travel Activities',
        addedDate: addedDate
      };
    });

    return res.status(200).json({
      status: true,
      message: "Wishlist retrieved successfully",
      data: wishlistItems
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching wishlist",
      error: error.message
    });
  }
};

// Add to Wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    const { packageId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    if (!packageId) {
      return res.status(400).json({
        status: false,
        message: "Package ID is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Check if package exists
    const packageExists = await Packages.findById(packageId);
    if (!packageExists) {
      return res.status(404).json({
        status: false,
        message: "Package not found"
      });
    }

    // Check if already in wishlist
    if (user.wishlist && user.wishlist.includes(packageId)) {
      return res.status(200).json({
        status: true,
        message: "Package already in wishlist",
        data: { added: false }
      });
    }

    // Add to wishlist
    if (!user.wishlist) {
      user.wishlist = [];
    }
    user.wishlist.push(packageId);

    // Track added date
    if (!user.wishlistAddedDates) {
      user.wishlistAddedDates = {};
    }
    user.wishlistAddedDates[packageId.toString()] = new Date();

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Added to wishlist successfully",
      data: { added: true }
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res.status(500).json({
      status: false,
      message: "Error adding to wishlist",
      error: error.message
    });
  }
};

// Remove from Wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    const { packageId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    if (!packageId) {
      return res.status(400).json({
        status: false,
        message: "Package ID is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(id => id.toString() !== packageId.toString());
    
    // Remove from added dates
    if (user.wishlistAddedDates) {
      delete user.wishlistAddedDates[packageId.toString()];
    }

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Removed from wishlist successfully",
      data: { removed: true }
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return res.status(500).json({
      status: false,
      message: "Error removing from wishlist",
      error: error.message
    });
  }
};

