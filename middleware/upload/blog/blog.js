import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'blog',
      resource_type: 'auto',
      allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'jfif'],
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'authorImage', maxCount: 1 }
]);

const uploadBlog = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'error', message: 'File size too large. Max size is 10MB.' });
      }
      return res.status(500).json({ status: 'error', message: err.message });
    }

    // Handle multiple files
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        req.fileUrl = req.files.image[0].path;
        req.imageUrl = req.files.image[0].path; // For backward compatibility
        req.imageUrls = req.imageUrls || {};
        req.imageUrls.image = req.files.image[0].path;
      }
      if (req.files.authorImage && req.files.authorImage[0]) {
        req.imageUrls = req.imageUrls || {};
        req.imageUrls.authorImage = req.files.authorImage[0].path;
      }
    }

    // For backward compatibility with single file upload
    const file = req.file;
    if (file) {
      req.fileUrl = file.path;
      req.imageUrl = file.path;
    }

    next();
  });
};

export default uploadBlog;

