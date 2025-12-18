import FAQ from "../../../models/FAQModel.js";

// Create FAQ
export const addFAQ = async (req, res) => {
  try {
    const {
      question,
      answer,
      category,
      order,
      status,
    } = req.body;

    const newFAQ = await FAQ.create({
      question,
      answer,
      category: category || "General",
      order: order || 0,
      status: status || "active",
    });

    return res.status(201).json({
      status: true,
      message: "FAQ created successfully",
      data: newFAQ,
    });
  } catch (err) {
    console.error("Error adding FAQ:", err);
    return res.status(500).json({
      status: false,
      message: "Error creating FAQ",
      error: err.message,
    });
  }
};

// Get All FAQs
export const getAllFAQs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      status,
      search 
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const faqs = await FAQ.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalFAQs = await FAQ.countDocuments(filter);

    return res.status(200).json({
      status: true,
      message: "FAQs retrieved successfully",
      data: faqs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFAQs / limit),
        totalFAQs,
        limit: parseInt(limit),
      },
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

// Get FAQ By ID
export const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id);

    if (!faq) {
      return res.status(404).json({
        status: false,
        message: "FAQ not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "FAQ retrieved successfully",
      data: faq,
    });
  } catch (err) {
    console.error("Error fetching FAQ:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching FAQ",
      error: err.message,
    });
  }
};

// Update FAQ
export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const existingFAQ = await FAQ.findById(id);

    if (!existingFAQ) {
      return res.status(404).json({
        status: false,
        message: "FAQ not found",
      });
    }

    const {
      question,
      answer,
      category,
      order,
      status,
    } = req.body;

    let updateData = {};

    if (question) updateData.question = question;
    if (answer) updateData.answer = answer;
    if (category) updateData.category = category;
    if (order !== undefined) updateData.order = parseInt(order);
    if (status) updateData.status = status;

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: true,
      message: "FAQ updated successfully",
      data: updatedFAQ,
    });
  } catch (err) {
    console.error("Error updating FAQ:", err);
    return res.status(500).json({
      status: false,
      message: "Error updating FAQ",
      error: err.message,
    });
  }
};

// Delete FAQ
export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return res.status(404).json({
        status: false,
        message: "FAQ not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "FAQ deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting FAQ:", err);
    return res.status(500).json({
      status: false,
      message: "Error deleting FAQ",
      error: err.message,
    });
  }
};

