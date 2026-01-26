import Banner from "../../../models/BannerModel.js";

// Get Active Banners for Public (Homepage) - No authentication required
export const GetActiveBanners = async (req, res) => {
  try {
    const { position = 'homepage' } = req.query;
    const now = new Date();
    
    // Query for active banners with valid dates
    const query = {
      status: 'active',
      position: position,
      $or: [
        { validFrom: null, validUntil: null }, // No date restrictions
        { validFrom: { $lte: now }, validUntil: null }, // Started, no end date
        { validFrom: null, validUntil: { $gte: now } }, // No start date, not expired
        { validFrom: { $lte: now }, validUntil: { $gte: now } } // Within date range
      ]
    };

    const banners = await Banner.find(query)
      .select('title description image link width height order position')
      .sort({ order: 1, createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      status: true,
      message: "Banners fetched successfully",
      data: banners
    });
  } catch (error) {
    console.error("GetActiveBanners error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching banners",
      error: error.message
    });
  }
};
