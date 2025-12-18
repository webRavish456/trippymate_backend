import Blog from "../../../models/BlogModel.js";
import Article from "../../../models/ArticleModel.js";
import Testimonial from "../../../models/TestimonialModel.js";

// Get All Published Blogs for Web
const getAllBlogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search,
      sectionType
    } = req.query;

    const filter = { status: "Published" };
    
    if (category && category !== 'all') {
      filter.category = { $regex: category, $options: "i" };
    }
    
    if (sectionType) {
      filter.sectionType = sectionType;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
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

// Get Blog By ID for Web
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

    if (blog.status !== "Published") {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    // Increment views
    blog.views = (blog.views || 0) + 1;
    await blog.save();

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

// Get Blog Categories with Counts
const getBlogCategories = async (req, res) => {
  try {
    const categories = await Blog.aggregate([
      { $match: { status: "Published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const allCount = await Blog.countDocuments({ status: "Published" });

    const categoryList = [
      { value: 'all', label: 'View all', count: allCount },
      ...categories.map(cat => ({
        value: cat._id?.toLowerCase() || 'other',
        label: cat._id || 'Other',
        count: cat.count
      }))
    ];

    return res.status(200).json({
      status: true,
      message: "Categories retrieved successfully",
      data: categoryList,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching categories",
      error: err.message,
    });
  }
};

// Get Featured Testimonials for Blog Page
const getFeaturedTestimonials = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const testimonials = await Testimonial.find({ 
      status: "approved"
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Transform testimonials to match blog page format
    const transformedTestimonials = testimonials.map(testimonial => ({
      id: testimonial._id,
      tag: 'TESTIMONIAL',
      title: testimonial.title || testimonial.testimonial.substring(0, 50) + '...',
      description: testimonial.testimonial,
      author: testimonial.customerName,
      authorImage: testimonial.customerImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      rating: testimonial.rating,
      location: testimonial.location || 'India'
    }));

    return res.status(200).json({
      status: true,
      message: "Testimonials retrieved successfully",
      data: transformedTestimonials,
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

// Get Main Blog Posts (for top section)
const getMainBlogPosts = async (req, res) => {
  try {
    const { limit = 9 } = req.query;

    const blogs = await Blog.find({ 
      status: "Published",
      sectionType: "main"
    })
      .sort({ publishedDate: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.status(200).json({
      status: true,
      message: "Main blog posts retrieved successfully",
      data: blogs,
    });
  } catch (err) {
    console.error("Error fetching main blog posts:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching main blog posts",
      error: err.message,
    });
  }
};

// Get Article Posts (for middle section)
const getArticlePosts = async (req, res) => {
  try {
    const { limit = 9 } = req.query;

    const articles = await Article.find({ 
      status: "Published"
    })
      .sort({ publishedDate: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.status(200).json({
      status: true,
      message: "Article posts retrieved successfully",
      data: articles,
    });
  } catch (err) {
    console.error("Error fetching article posts:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching article posts",
      error: err.message,
    });
  }
};

// Update Blog Like
const updateBlogLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    if (action === 'like') {
      blog.likes = (blog.likes || 0) + 1;
    } else if (action === 'unlike' && blog.likes > 0) {
      blog.likes = blog.likes - 1;
    }

    await blog.save();

    return res.status(200).json({
      status: true,
      message: "Blog like updated successfully",
      data: { likes: blog.likes },
    });
  } catch (err) {
    console.error("Error updating blog like:", err);
    return res.status(500).json({
      status: false,
      message: "Error updating blog like",
      error: err.message,
    });
  }
};

// Update Blog Share
const updateBlogShare = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    blog.shares = (blog.shares || 0) + 1;
    await blog.save();

    return res.status(200).json({
      status: true,
      message: "Blog share updated successfully",
      data: { shares: blog.shares },
    });
  } catch (err) {
    console.error("Error updating blog share:", err);
    return res.status(500).json({
      status: false,
      message: "Error updating blog share",
      error: err.message,
    });
  }
};

export { 
  getAllBlogs, 
  getBlogById, 
  getBlogCategories,
  getFeaturedTestimonials,
  getMainBlogPosts,
  getArticlePosts,
  updateBlogLike,
  updateBlogShare
};

