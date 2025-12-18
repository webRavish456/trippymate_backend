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

    const packages = await Packages.find(filter, "title duration source destination images")
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

export { AddPackages, UpdatePackages, DeletePackages, ShowPackages, GetPackageById };
