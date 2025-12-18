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
    // Determine folder based on field name
    let folder = 'destinations/category';
    
    if (file.fieldname === 'images') {
      folder = 'destinations';
    } else if (file.fieldname === 'attractionImages') {
      folder = 'destinations/attractions';
    } else if (file.fieldname === 'hotelImages') {
      folder = 'destinations/hotels';
    } else if (file.fieldname === 'foodImages') {
      folder = 'destinations/food';
    } else if (file.fieldname === 'nearbyImages') {
      folder = 'destinations/nearby';
    } else if (file.fieldname === 'activityImages') {
      folder = 'destinations/activities';
    } else if (file.fieldname === 'eventImages') {
      folder = 'destinations/events';
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
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'attractionImages', maxCount: 20 },
  { name: 'hotelImages', maxCount: 20 },
  { name: 'foodImages', maxCount: 20 },
  { name: 'nearbyImages', maxCount: 20 },
  { name: 'activityImages', maxCount: 20 },
  { name: 'eventImages', maxCount: 20 },
]);

const uploadCategoryDestination = (req, res, next) => {
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

    // Process main category image (single)
    if (files?.['image']) {
      imageUrls.image = files['image'][0].path;
      // Also add to images array for backward compatibility
      if (!imageUrls.images) {
        imageUrls.images = [];
      }
      imageUrls.images.push(files['image'][0].path);
    }

    // Process main images (multiple) - for place images
    if (files?.['images']) {
      if (!imageUrls.images) {
        imageUrls.images = [];
      }
      imageUrls.images.push(...files['images'].map(file => file.path));
      // Also set single image if not already set
      if (!imageUrls.image && files['images'].length > 0) {
        imageUrls.image = files['images'][0].path;
      }
    }

    // Process attraction images
    if (files?.['attractionImages']) {
      imageUrls.attractionImages = files['attractionImages'].map(file => file.path);
    }

    // Process hotel images
    if (files?.['hotelImages']) {
      imageUrls.hotelImages = files['hotelImages'].map(file => file.path);
    }

    // Process food images
    if (files?.['foodImages']) {
      imageUrls.foodImages = files['foodImages'].map(file => file.path);
    }

    // Process nearby destination images
    if (files?.['nearbyImages']) {
      imageUrls.nearbyImages = files['nearbyImages'].map(file => file.path);
    }

    // Process activity images
    if (files?.['activityImages']) {
      imageUrls.activityImages = files['activityImages'].map(file => file.path);
    }

    // Process event images
    if (files?.['eventImages']) {
      imageUrls.eventImages = files['eventImages'].map(file => file.path);
    }

    if (Object.keys(imageUrls).length > 0) {
      req.imageUrls = imageUrls;
    }

    next();
  });
};

export default uploadCategoryDestination

