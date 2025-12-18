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
    let folder = 'community';
    
    // Determine folder based on field name
    if (file.fieldname === 'images') {
      folder = 'community/trips';
    } else if (file.fieldname === 'organizerImage') {
      folder = 'community/organizers';
    }

    return {
      folder: folder,
      resource_type: 'auto',
      allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'jfif'],
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'organizerImage', maxCount: 1 },
]);

const uploadCommunity = (req, res, next) => {
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

    if (files?.['images']) {
      imageUrls.images = files['images'].map(file => ({
        path: file.path,
        publicId: file.public_id,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    if (files?.['organizerImage']?.[0]) {
      imageUrls.organizerImage = {
        path: files['organizerImage'][0].path,
        publicId: files['organizerImage'][0].public_id,
        filename: files['organizerImage'][0].originalname,
        mimetype: files['organizerImage'][0].mimetype,
        size: files['organizerImage'][0].size
      };
    }

    if (Object.keys(imageUrls).length > 0) {
      req.imageUrls = imageUrls;
    }

    next();
  });
};

export default uploadCommunity;

