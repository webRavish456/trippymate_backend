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
      folder: 'review',
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
  { name: 'images', maxCount: 5 }, // Multiple images for review
  { name: 'photos', maxCount: 10 }, // Photos for feedback
]);

const uploadReview = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'error', message: 'File size too large. Max size is 10MB.' });
      }
      return res.status(500).json({ status: 'error', message: err.message });
    }

    const files = req.files;
    const imageUrls = {};

    // Process single image
    if (files?.['image']?.[0]) {
      imageUrls.image = files['image'][0].path;
    }

    // Process multiple images
    if (files?.['images']) {
      imageUrls.images = files['images'].map(file => file.path);
    }

    // Process photos for feedback
    if (files?.['photos']) {
      imageUrls.photos = files['photos'].map(file => ({
        filename: file.filename,
        path: file.path,
        publicId: file.publicId,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    if (Object.keys(imageUrls).length > 0) {
      req.imageUrls = imageUrls;
    }

    next();
  });
};

export default uploadReview

