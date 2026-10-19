/**
 * cloudinary.js
 * =============
 * Cloudinary configuration + Multer memory storage.
 * 
 * We use memoryStorage + manual uploads instead of multer-storage-cloudinary
 * because that library has broken API changes across versions and silently
 * fails to populate req.file.
 * 
 * Usage:
 *   const { upload, cloudinary } = require('../config/cloudinary');
 *   router.post('/upload', upload.single('media'), async (req, res) => {...})
 */

const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// ─── Cloudinary config ──────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ─── Multer: buffer files in memory (10 MB limit) ───────────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// ─── Helper: upload a buffer to Cloudinary ──────────────────
/**
 * Upload a buffer to Cloudinary using upload_stream.
 * @param {Buffer} buffer
 * @param {Object} options  { folder, resource_type, transformation }
 * @returns {Promise<Object>} Cloudinary result
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'technicians',
      resource_type: options.resource_type || 'auto',
      ...(options.transformation && { transformation: options.transformation }),
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

// ─── Convenience wrappers ───────────────────────────────────
// Photos are resized on upload (max 1920 px, automatic quality): a 5 MB phone
// photo is stored as roughly 0.3–0.6 MB and still looks sharp on any screen.
// Videos are capped at 1280 px wide; PDFs are stored as they are.
const uploadPortfolioToCloudinary = (buffer, mimetype = '') => {
  let transformation;
  if (mimetype.startsWith('image/')) {
    transformation = [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }];
  } else if (mimetype.startsWith('video/')) {
    transformation = [{ width: 1280, crop: 'limit', quality: 'auto' }];
  }
  return uploadBufferToCloudinary(buffer, {
    folder: 'technicians/portfolio',
    resource_type: 'auto',
    transformation,
  });
};

const uploadProfileToCloudinary = (buffer) =>
  uploadBufferToCloudinary(buffer, {
    folder: 'technicians/profiles',
    resource_type: 'image',
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  });

// Job-evidence photos: also ask Cloudinary for a perceptual hash (result.phash)
// so a photo reused on another booking can be spotted even after re-encoding.
const uploadEvidenceToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'bookings/evidence',
        resource_type: 'image',
        phash: true,
        transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

// Evidence photos only (JPEG/PNG/WebP), 10 MB
const evidenceUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.mimetype}`));
  },
});

module.exports = {
  evidenceUpload,
  uploadEvidenceToCloudinary,
  cloudinary,
  upload,
  uploadBufferToCloudinary,
  uploadPortfolioToCloudinary,
  uploadProfileToCloudinary,
};