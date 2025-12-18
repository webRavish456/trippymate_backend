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
    let folder = 'vendor';
    
    // Determine folder based on field name
    if (file.fieldname === 'companyLogo') {
      folder = 'vendor/logo';
    } else if (file.fieldname === 'businessProof') {
      folder = 'vendor/business-proof';
    } else if (file.fieldname === 'vendorGovernmentId') {
      folder = 'vendor/government-id';
    } else if (file.fieldname === 'aadhaarCard') {
      folder = 'vendor/aadhaar-card';
    } else if (file.fieldname === 'panCard') {
      folder = 'vendor/pan-card';
    } else if (file.fieldname === 'license') {
      folder = 'vendor/license';
    } else if (file.fieldname === 'gstCertificate') {
      folder = 'vendor/gst-certificate';
    } else if (file.fieldname === 'certificate') {
      folder = 'vendor/certificate';
    } else if (file.fieldname === 'otherDocument') {
      folder = 'vendor/other-documents';
    } else if (file.fieldname === 'image') {
      folder = 'vendor';
    }

    return {
      folder: folder,
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
  { name: 'image', maxCount: 1 },
  { name: 'companyLogo', maxCount: 1 },
  { name: 'businessProof', maxCount: 1 },
  { name: 'vendorGovernmentId', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'license', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'otherDocument', maxCount: 1 },
]);

const uploadVendor = (req, res, next) => {
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

    if (files?.['image']?.[0]) {
      imageUrls.image = files['image'][0].path;
    }

    if (files?.['companyLogo']?.[0]) {
      imageUrls.companyLogo = files['companyLogo'][0].path;
    }

    if (files?.['businessProof']?.[0]) {
      imageUrls.businessProof = files['businessProof'][0].path;
    }

    if (files?.['vendorGovernmentId']?.[0]) {
      imageUrls.vendorGovernmentId = files['vendorGovernmentId'][0].path;
    }

    if (files?.['aadhaarCard']?.[0]) {
      imageUrls.aadhaarCard = files['aadhaarCard'][0].path;
    }

    if (files?.['panCard']?.[0]) {
      imageUrls.panCard = files['panCard'][0].path;
    }

    if (files?.['license']?.[0]) {
      imageUrls.license = files['license'][0].path;
    }

    if (files?.['gstCertificate']?.[0]) {
      imageUrls.gstCertificate = files['gstCertificate'][0].path;
    }

    if (files?.['certificate']?.[0]) {
      imageUrls.certificate = files['certificate'][0].path;
    }

    if (files?.['otherDocument']?.[0]) {
      imageUrls.otherDocument = files['otherDocument'][0].path;
    }

    if (Object.keys(imageUrls).length > 0) {
      req.imageUrls = imageUrls;
    }

    next();
  });
};

export default uploadVendor

