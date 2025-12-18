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
    let folder = 'packages';
    if (file.fieldname === 'images') {
      folder = 'packages/images';
    } else if (file.fieldname === 'documents') {
      folder = 'packages/documents';
    }

    return {
      folder: folder,
      resource_type: 'auto',
      allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'jfif', 'pdf', 'doc', 'docx'],
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'documents', maxCount: 5 },
]);

const uploadPackage = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'error', message: 'File size too large. Max size is 10MB.' });
      }
      return res.status(500).json({ status: 'error', message: err.message });
    }

    const files = req.files;
    const fileUrls = {};

    if (files?.['images']) {
      fileUrls.images = files['images'].map(file => file.path);
      if (files['images'].length > 0) {
        fileUrls.image = files['images'][0].path; // For backward compatibility
      }
    }

    if (files?.['documents']) {
      fileUrls.documents = files['documents'].map(file => file.path);
    }

    if (Object.keys(fileUrls).length > 0) {
      req.fileUrls = fileUrls;
    }

    next();
  });
};

export default uploadPackage;

