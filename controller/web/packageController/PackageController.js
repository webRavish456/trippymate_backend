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


// Get Popular Destinations
const GetPopularDestinations = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    // Get unique destinations with their package counts and images
    const popularDestinations = await Packages.aggregate([
      { $match: { status: "active", destination: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$destination",
          count: { $sum: 1 },
          // Get first package to extract image
          firstPackage: { $first: "$$ROOT" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: Number(limit) },
      {
        $project: {
          name: "$_id",
          count: 1,
          image: {
            $let: {
              vars: {
                firstImg: {
                  $cond: {
                    if: { 
                      $and: [
                        { $ne: ["$firstPackage.images", null] },
                        { $gt: [{ $size: { $ifNull: ["$firstPackage.images", []] } }, 0] }
                      ]
                    },
                    then: { $arrayElemAt: ["$firstPackage.images", 0] },
                    else: null
                  }
                }
              },
              in: {
                $cond: {
                  if: { $ne: ["$$firstImg", null] },
                  then: {
                    $cond: {
                      if: { $type: ["$$firstImg", "string"] },
                      then: "$$firstImg",
                      else: {
                        $cond: {
                          if: { $ne: ["$$firstImg.path", null] },
                          then: "$$firstImg.path",
                          else: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"
                        }
                      }
                    }
                  },
                  else: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"
                }
              }
            }
          }
        }
      }
    ]);

    // Format the response
    const formattedDestinations = popularDestinations.map(dest => ({
      name: dest.name,
      image: typeof dest.image === 'string' ? dest.image : (dest.image?.path || dest.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'),
      count: dest.count
    }));

    return res.status(200).json({
      status: true,
      message: "Popular destinations retrieved successfully",
      data: formattedDestinations
    });
  } catch (error) {
    console.error("Error fetching popular destinations:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch popular destinations",
      error: error.message
    });
  }
};

export { ShowPackages, GetPackageById, GetPopularDestinations }