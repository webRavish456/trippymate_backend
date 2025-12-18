import Testimonial from "../../../models/TestimonialModel.js";

// Create Testimonial
export const addTestimonial = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      rating,
      title,
      testimonial,
      tripPackage,
      location,
      status,
    } = req.body;

    // Handle image from middleware
    let customerImage = '';
    if (req.imageUrls && req.imageUrls.customerImage) {
      customerImage = req.imageUrls.customerImage;
    } else if (req.fileUrl || req.imageUrl) {
      customerImage = req.fileUrl || req.imageUrl;
    } else if (req.body.customerImage) {
      customerImage = req.body.customerImage;
    }

    const newTestimonial = await Testimonial.create({
      customerName,
      customerEmail,
      customerImage,
      rating: parseInt(rating),
      title,
      testimonial,
      tripPackage: tripPackage || "",
      location: location || "",
      status: status || "pending",
    });

    return res.status(201).json({
      status: true,
      message: "Testimonial created successfully",
      data: newTestimonial,
    });
  } catch (err) {
    console.error("Error adding testimonial:", err);
    return res.status(500).json({
      status: false,
      message: "Error creating testimonial",
      error: err.message,
    });
  }
};

// Get All Testimonials
export const getAllTestimonials = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      featured,
      search 
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { testimonial: { $regex: search, $options: "i" } },
        { tripPackage: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const testimonials = await Testimonial.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalTestimonials = await Testimonial.countDocuments(filter);

    return res.status(200).json({
      status: true,
      message: "Testimonials retrieved successfully",
      data: testimonials,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTestimonials / limit),
        totalTestimonials,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching testimonials:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching testimonials",
      error: err.message,
    });
  }
};

// Get Testimonial By ID
export const getTestimonialById = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        status: false,
        message: "Testimonial not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Testimonial retrieved successfully",
      data: testimonial,
    });
  } catch (err) {
    console.error("Error fetching testimonial:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching testimonial",
      error: err.message,
    });
  }
};

// Update Testimonial
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTestimonial = await Testimonial.findById(id);

    if (!existingTestimonial) {
      return res.status(404).json({
        status: false,
        message: "Testimonial not found",
      });
    }

    const {
      customerName,
      customerEmail,
      rating,
      title,
      testimonial,
      tripPackage,
      location,
      status,
    } = req.body;

    let updateData = {};

    if (customerName) updateData.customerName = customerName;
    if (customerEmail) updateData.customerEmail = customerEmail;
    if (rating) updateData.rating = parseInt(rating);
    if (title) updateData.title = title;
    if (testimonial) updateData.testimonial = testimonial;
    if (tripPackage !== undefined) updateData.tripPackage = tripPackage;
    if (location !== undefined) updateData.location = location;
    if (status) updateData.status = status;

    // Handle image update from middleware
    if (req.imageUrls && req.imageUrls.customerImage) {
      updateData.customerImage = req.imageUrls.customerImage;
    } else if (req.fileUrl || req.imageUrl) {
      updateData.customerImage = req.fileUrl || req.imageUrl;
    } else if (req.body.customerImage) {
      updateData.customerImage = req.body.customerImage;
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: true,
      message: "Testimonial updated successfully",
      data: updatedTestimonial,
    });
  } catch (err) {
    console.error("Error updating testimonial:", err);
    return res.status(500).json({
      status: false,
      message: "Error updating testimonial",
      error: err.message,
    });
  }
};

// Delete Testimonial
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return res.status(404).json({
        status: false,
        message: "Testimonial not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Testimonial deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting testimonial:", err);
    return res.status(500).json({
      status: false,
      message: "Error deleting testimonial",
      error: err.message,
    });
  }
};

