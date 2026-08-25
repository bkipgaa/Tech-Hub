const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for portfolio images
const portfolioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'technicians/portfolio',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'mp4'],
    resource_type: 'auto', // handles images, videos, docs
  },
});

// Storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'technicians/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const uploadPortfolio = require('multer')({ storage: portfolioStorage });
const uploadProfile = require('multer')({ storage: profileStorage });

module.exports = { cloudinary, uploadPortfolio, uploadProfile };