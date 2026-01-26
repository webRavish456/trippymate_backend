import Packages from "../../../models/PackageModel.js";

//Admin Add Package Function start
const AddPackages = async (req, res) => {
  try {
    const {
      title,
      duration,
      source,
      destination,
      category,
      highlights,
      overview,
      inclusions,
      exclusions,
      itinerary,
      otherDetails,
      price,
      discount,
      status,
      totalSlots,
      destinations,
      customization,
    } = req.body;

    // Handle images from middleware
    let images = [];
    if (req.fileUrls && req.fileUrls.images) {
      images = req.fileUrls.images;
    } else if (req.body.images) {
      images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
    }

    // Handle documents from middleware
    let documents = [];
    if (req.fileUrls && req.fileUrls.documents) {
      documents = req.fileUrls.documents;
    } else if (req.body.documents) {
      documents = typeof req.body.documents === 'string' ? JSON.parse(req.body.documents) : req.body.documents;
    }

    // Parse JSON fields
    const parseJSON = (field) => {
      if (!field) return undefined;
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch (e) {
          return undefined;
        }
      }
      return field;
    };

    const parsedHighlights = parseJSON(highlights) || [];
    const parsedInclusions = parseJSON(inclusions) || [];
    const parsedExclusions = parseJSON(exclusions) || [];
    const parsedItinerary = parseJSON(itinerary) || [];
    const parsedPrice = parseJSON(price) || { adult: 0, child: 0, infant: 0 };
    const parsedDiscount = parseJSON(discount) || { percentage: 0 };
    const parsedDestinations = parseJSON(destinations) || [];
    const parsedCustomization = parseJSON(customization) || {
      carRentals: { available: false, options: [] },
      guides: { available: false, options: [] },
      extendedStays: { available: false, pricePerDay: 0, description: "" },
      mealPlans: { available: false, options: [] }
    };

    const newPackage = new Packages({
      title,
      duration,
      source,
      destination,
      category: category || "Other",
      totalSlots,
      destinations: parsedDestinations,
      highlights: parsedHighlights,
      overview: overview || "",
      itinerary: parsedItinerary,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      price: parsedPrice,
      discount: parsedDiscount,
      customization: parsedCustomization,
      images,
      documents,
      otherDetails: otherDetails || "",
      status: status || "active"
    });

    await newPackage.save();

    return res.status(200).json({
      status: true,
      message: "Package added successfully",
      data: newPackage
    });
  } catch (err) {
    console.error("Error adding package:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to add package",
      error: err.message
    });
  }
};

// Admin UPDATE PACKAGE Function Start
const UpdatePackages = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if package exists
    const existingPackage = await Packages.findById(id);
    if (!existingPackage) {
      return res.status(404).json({
        status: false,
        message: "Package not found",
      });
    }

    const {
      title,
      duration,
      source,
      destination,
      category,
      highlights,
      overview,
      inclusions,
      exclusions,
      itinerary,
      otherDetails,
      price,
      discount,
      destinations,
      totalSlots,
      status,
      customization,
    } = req.body;

    // Parse JSON fields
    const parseJSON = (field) => {
      if (!field) return undefined;
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch (e) {
          return undefined;
        }
      }
      return field;
    };

    let updateData = {};
    
    if (title) updateData.title = title;
    if (duration) updateData.duration = duration;
    if (source) updateData.source = source;
    if (destination) updateData.destination = destination;
    if (category) updateData.category = category;
    if (overview) updateData.overview = overview;
    if (otherDetails) updateData.otherDetails = otherDetails;
    if (totalSlots) updateData.totalSlots = totalSlots;
    if (status) updateData.status = status;

    if (highlights) {
      updateData.highlights = parseJSON(highlights) || [];
    }
    if (itinerary) {
      updateData.itinerary = parseJSON(itinerary) || [];
    }
    if (inclusions) {
      updateData.inclusions = parseJSON(inclusions) || [];
    }
    if (exclusions) {
      updateData.exclusions = parseJSON(exclusions) || [];
    }
    if (price) {
      updateData.price = parseJSON(price) || { adult: 0, child: 0, infant: 0 };
    }
    if (discount) {
      updateData.discount = parseJSON(discount) || { percentage: 0 };
    }
    if (destinations !== undefined) {
      updateData.destinations = parseJSON(destinations) || [];
    }
    if (overview) {
      updateData.overview = overview;
    }
    if (customization) {
      updateData.customization = parseJSON(customization) || {
        carRentals: { available: false, options: [] },
        guides: { available: false, options: [] },
        extendedStays: { available: false, pricePerDay: 0, description: "" },
        mealPlans: { available: false, options: [] }
      };
    }

    // Handle images from middleware
    if (req.fileUrls && req.fileUrls.images) {
      updateData.images = req.fileUrls.images;
    } else if (req.body.images) {
      updateData.images = parseJSON(req.body.images) || [];
    }

    // Handle documents from middleware
    if (req.fileUrls && req.fileUrls.documents) {
      updateData.documents = req.fileUrls.documents;
    } else if (req.body.documents) {
      updateData.documents = parseJSON(req.body.documents) || [];
    }

    const updatedPackage = await Packages.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (err) {
    console.error("Error updating package:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to update package",
      error: err.message,
    });
  }
};

// Admin DELETE PACKAGE function start
const DeletePackages = async (req, res) => {
  try {
    const { id } = req.params;

    const packageData = await Packages.findByIdAndDelete(id);

    if (!packageData) {
      return res.status(404).json({
        status: false,
        message: "Package not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Package deleted successfully",
      deletedPackage: {
        id: packageData._id,
        title: packageData.title
      }
    });
  } catch (err) {
    console.error("Error deleting package:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to delete package",
      error: err.message,
    });
  }
};

const ShowPackages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, destination } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } }
      ];
    }

    if (destination) {
      filter.destination = { $regex: destination, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const packages = await Packages.find(filter, "title duration source destination images category price status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalPackages = await Packages.countDocuments(filter);
    const totalPages = Math.ceil(totalPackages / Number(limit));

    return res.status(200).json({
      status: true,
      message: "Packages retrieved successfully",
      data: packages,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalPackages,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    });

  } catch (err) {
    console.error("Error fetching packages:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch packages",
      error: err.message
    });
  }
};

// GET SINGLE PACKAGE BY ID
const GetPackageById = async (req, res) => {
  try {
    const { id } = req.body;

    const packageData = await Packages.findById(id);

    if (!packageData) {
      return res.status(404).json({
        status: false,
        message: "Package not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Package retrieved successfully",
      data: packageData,
    });
  } catch (err) {
    console.error("Error fetching package:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch package",
      error: err.message,
    });
  }
};

// GET ALL PACKAGE CATEGORIES
const GetPackageCategories = async (req, res) => {
  try {
    // Get all distinct categories from database
    const categories = await Packages.distinct("category");
    
    // Define category colors mapping
    const categoryColors = {
      "adventure": { label: "Adventure", color: "bg-red-100 text-red-700 hover:bg-red-200" },
      "family": { label: "Family", color: "bg-green-100 text-green-700 hover:bg-green-200" },
      "honeymoon": { label: "Honeymoon", color: "bg-pink-100 text-pink-700 hover:bg-pink-200" },
      "holiday": { label: "Holiday", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
      "cultural": { label: "Cultural", color: "bg-orange-100 text-orange-700 hover:bg-orange-200" },
      "religious": { label: "Religious", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
      "wildlife": { label: "Wildlife", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
      "beach": { label: "Beach", color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200" },
      "hill-station": { label: "Hill Station", color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
      "weekend": { label: "Weekend Getaways", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
      "other": { label: "Other", color: "bg-gray-100 text-gray-700 hover:bg-gray-200" }
    };

    // Format categories with labels and colors
    const formattedCategories = categories
      .filter(cat => cat && cat !== "") // Remove empty/null values
      .map(cat => ({
        id: cat,
        label: categoryColors[cat]?.label || cat.charAt(0).toUpperCase() + cat.slice(1),
        color: categoryColors[cat]?.color || "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }));

    return res.status(200).json({
      status: true,
      message: "Categories retrieved successfully",
      data: formattedCategories,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch categories",
      error: err.message,
    });
  }
};

export { AddPackages, UpdatePackages, DeletePackages, ShowPackages, GetPackageById, GetPackageCategories };
