import Packages from "../../../models/PackageModel.js";

const ShowPackages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, destination, destinationId, category, packageType, feature } = req.query;

    // Build filter object
    let filter = { status: "active" }; // Only show active packages

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } },
        { packageType: { $regex: search, $options: "i" } }
      ];
    }

    if (destination) {
      filter.destination = { $regex: destination, $options: "i" };
    }

    // Filter by destinationId (from destinations array)
    if (destinationId) {
      filter["destinations.destinationId"] = destinationId;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by packageType
    if (packageType) {
      filter.packageType = { $regex: packageType, $options: "i" };
    }

    // Filter by feature
    if (feature) {
      filter.features = { $in: [feature] };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch packages with all necessary fields
    const packages = await Packages.find(filter)
      .populate("destinations.destinationId", "name type image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalPackages = await Packages.countDocuments(filter);
    const totalPages = Math.ceil(totalPackages / Number(limit));

    // Get package count by category/type
    const packageCounts = await Packages.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$packageType",
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      status: true,
      message: "Packages retrieved successfully",
      data: packages,
      totalCount: totalPackages,
      packageCounts: packageCounts,
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


export { ShowPackages,GetPackageById }