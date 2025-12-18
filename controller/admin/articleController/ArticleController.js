import Article from "../../../models/ArticleModel.js";

// Create Article
const addArticle = async (req, res) => {
  try {
    const {
      title,
      description,
      author,
      authorImage,
      publishedDate,
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

    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Title is required",
      });
    }

    if (!image) {
      return res.status(400).json({
        status: false,
        message: "Featured image is required",
      });
    }

    const newArticle = await Article.create({
      title,
      description: description || '',
      author: author || '',
      authorImage: authorImageUrl,
      publishedDate: publishedDate || new Date(),
      image,
      status: "Published",
    });

    return res.status(201).json({
      status: true,
      message: "Article created successfully",
      data: newArticle,
    });
  } catch (err) {
    console.error("Error adding article:", err);
    return res.status(500).json({
      status: false,
      message: "Error creating article",
      error: err.message,
    });
  }
};

// Get All Articles
const getAllArticles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search 
    } = req.query;

    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const articles = await Article.find(filter)
      .sort({ publishedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalArticles = await Article.countDocuments(filter);

    return res.status(200).json({
      status: true,
      message: "Articles retrieved successfully",
      data: articles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalArticles / limit),
        totalArticles,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching articles:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching articles",
      error: err.message,
    });
  }
};

// Get Article By ID
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({
        status: false,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Article retrieved successfully",
      data: article,
    });
  } catch (err) {
    console.error("Error fetching article:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching article",
      error: err.message,
    });
  }
};

// Update Article
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const existingArticle = await Article.findById(id);

    if (!existingArticle) {
      return res.status(404).json({
        status: false,
        message: "Article not found",
      });
    }

    const {
      title,
      description,
      author,
      authorImage,
      publishedDate,
    } = req.body;

    let updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (author !== undefined) updateData.author = author;
    if (publishedDate) updateData.publishedDate = publishedDate;

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

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: true,
      message: "Article updated successfully",
      data: updatedArticle,
    });
  } catch (err) {
    console.error("Error updating article:", err);
    return res.status(500).json({
      status: false,
      message: "Error updating article",
      error: err.message,
    });
  }
};

// Delete Article
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByIdAndDelete(id);

    if (!article) {
      return res.status(404).json({
        status: false,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Article deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting article:", err);
    return res.status(500).json({
      status: false,
      message: "Error deleting article",
      error: err.message,
    });
  }
};

export { addArticle, getAllArticles, getArticleById, updateArticle, deleteArticle };

