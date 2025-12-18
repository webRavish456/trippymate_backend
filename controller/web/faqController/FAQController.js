import FAQ from "../../../models/FAQModel.js";

// Get All Active FAQs for Web
const getAllFAQs = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { status: "active" };
    
    if (category) {
      filter.category = category;
    }

    const faqs = await FAQ.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: true,
      message: "FAQs retrieved successfully",
      data: faqs,
    });
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching FAQs",
      error: err.message,
    });
  }
};

// Get FAQs By Category
const getFAQsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const faqs = await FAQ.find({ 
      status: "active",
      category: category 
    })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: true,
      message: "FAQs retrieved successfully",
      data: faqs,
    });
  } catch (err) {
    console.error("Error fetching FAQs by category:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching FAQs",
      error: err.message,
    });
  }
};

export { getAllFAQs, getFAQsByCategory };

