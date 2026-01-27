import AdventurePost from "../../../models/AdventurePostModel.js";

// Get Active Adventure Posts (Public)
export const GetActiveAdventurePosts = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const adventurePosts = await AdventurePost.find({ status: 'active' })
      .select('title description image location order createdAt')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdventurePost.countDocuments({ status: 'active' });

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
    console.error("GetActiveAdventurePosts error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching adventure posts",
      error: error.message
    });
  }
};

// Get Adventure Posts for Homepage (Limited)
export const GetHomepageAdventurePosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const adventurePosts = await AdventurePost.find({ status: 'active' })
      .select('title description image location order createdAt')
      .sort({ order: 1, createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      status: true,
      message: "Adventure posts fetched successfully",
      data: adventurePosts
    });
  } catch (error) {
    console.error("GetHomepageAdventurePosts error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching adventure posts",
      error: error.message
    });
  }
};
