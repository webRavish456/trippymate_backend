import Blog from "../../../models/BlogModel.js";

// Helper function to parse tags
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      return JSON.parse(tags);
    } catch (e) {
      return tags.split(",").map(tag => tag.trim());
    }
  }
  return [];
};

// Create Blog
const addBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      description,
      category,
      author,
      authorImage,
      readTime,
      publishedDate,
      tags,
      status,
      sectionType,
      featured,
    } = req.body;

    // Handle image from middleware
    let image = '';
    if (req.imageUrls && req.imageUrls.image) {
      image = req.imageUrls.image;
    } else if (req.fileUrl || req.imageUrl) {
      image = req.fileUrl || req.imageUrl;
    } else if (req.body.image) {
      image = req.body.image;
    }

    // Handle authorImage from middleware
    let authorImageUrl = authorImage || '';
    if (req.imageUrls && req.imageUrls.authorImage) {
      authorImageUrl = req.imageUrls.authorImage;
    } else if (req.body.authorImage) {
      authorImageUrl = req.body.authorImage;
    }

    if (!image) {
      return res.status(400).json({
        status: false,
        message: "Image is required",
      });
    }

    const newBlog = await Blog.create({
      title,
      content,
      description: description || '',
      category: category || 'Travel',
      author: author || '',
      authorImage: authorImageUrl,
      readTime: readTime || '5 min read',
      publishedDate: publishedDate || new Date(),
      tags: parseTags(tags),
      image,
      status: status || "Published",
      sectionType: sectionType || 'main',
      featured: featured || false,
    });

    return res.status(201).json({
      status: true,
      message: "Blog created successfully",
      data: newBlog,
    });
  } catch (err) {
    console.error("Error adding blog:", err);
    return res.status(500).json({
      status: false,
      message: "Error creating blog",
      error: err.message,
    });
  }
};

// Get All Blogs
const getAllBlogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      author, 
      search,
      sectionType 
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (author) filter.author = author;
    if (sectionType) {
      filter.sectionType = sectionType;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(filter)
      .sort({ publishedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalBlogs = await Blog.countDocuments(filter);

    return res.status(200).json({
      status: true,
      message: "Blogs retrieved successfully",
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBlogs / limit),
        totalBlogs,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching blogs",
      error: err.message,
    });
  }
};

// Get Blog By ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Blog retrieved successfully",
      data: blog,
    });
  } catch (err) {
    console.error("Error fetching blog:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching blog",
      error: err.message,
    });
  }
};

// Update Blog
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBlog = await Blog.findById(id);

    if (!existingBlog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    const {
      title,
      content,
      description,
      category,
      author,
      authorImage,
      readTime,
      publishedDate,
      tags,
      status,
      sectionType,
      featured,
    } = req.body;

    let updateData = {};

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (author !== undefined) updateData.author = author;
    if (authorImage !== undefined) updateData.authorImage = authorImage;
    if (readTime) updateData.readTime = readTime;
    if (publishedDate) updateData.publishedDate = publishedDate;
    if (tags) updateData.tags = parseTags(tags);
    if (status) updateData.status = status;
    if (sectionType) updateData.sectionType = sectionType;
    if (featured !== undefined) updateData.featured = featured;

    // Handle image update from middleware
    if (req.imageUrls && req.imageUrls.image) {
      updateData.image = req.imageUrls.image;
    } else if (req.fileUrl || req.imageUrl) {
      updateData.image = req.fileUrl || req.imageUrl;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    // Handle authorImage update from middleware
    if (req.imageUrls && req.imageUrls.authorImage) {
      updateData.authorImage = req.imageUrls.authorImage;
    } else if (req.body.authorImage) {
      updateData.authorImage = req.body.authorImage;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (err) {
    console.error("Error updating blog:", err);
    return res.status(500).json({
      status: false,
      message: "Error updating blog",
      error: err.message,
    });
  }
};

// Delete Blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Blog deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting blog:", err);
    return res.status(500).json({
      status: false,
      message: "Error deleting blog",
      error: err.message,
    });
  }
};

// Get Blogs By Category
const getBlogsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ category })
      .sort({ publishedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalBlogs = await Blog.countDocuments({ category });

    return res.status(200).json({
      status: true,
      message: "Blogs retrieved successfully",
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBlogs / limit),
        totalBlogs,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching blogs by category:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching blogs",
      error: err.message,
    });
  }
};

export { addBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog, getBlogsByCategory };
