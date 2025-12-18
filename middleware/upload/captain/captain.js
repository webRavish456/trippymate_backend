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
      folder: 'captain',
      resource_type: 'auto',
      allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'jfif', 'pdf'],
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'photos', maxCount: 10 },
  { name: 'documents', maxCount: 10 },
  { name: 'profileImage', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
]);

const uploadCaptain = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'error', message: 'File size too large. Max size is 10MB.' });
      }
      return res.status(500).json({ status: 'error', message: err.message });
    }

    const files = req.files;
    const fileUrls = {
      photos: [],
      documents: [],
      profileImage: null,
      backgroundImage: null
    };

    if (files?.['photos']) {
      fileUrls.photos = files['photos'].map(file => file.path);
    }

    if (files?.['documents']) {
      fileUrls.documents = files['documents'].map(file => file.path);
    }

    if (files?.['profileImage'] && files['profileImage'].length > 0) {
      fileUrls.profileImage = files['profileImage'][0].path;
    }

    if (files?.['backgroundImage'] && files['backgroundImage'].length > 0) {
      fileUrls.backgroundImage = files['backgroundImage'][0].path;
    }

    if (fileUrls.photos.length > 0 || fileUrls.documents.length > 0 || fileUrls.profileImage || fileUrls.backgroundImage) {
      req.fileUrls = fileUrls;
    }

    next();
  });
};

export default uploadCaptain

