/**
 * upload.js
 * =========
 * File upload routes using Multer (memory) + Cloudinary (manual upload).
 * 
 * Endpoints:
 *   POST /api/upload/portfolio       → portfolio media (image/video/pdf)
 *   POST /api/upload/profile-image   → profile picture
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  upload,
  uploadPortfolioToCloudinary,
  uploadProfileToCloudinary,
} = require('../config/cloudinary');

// ─── Portfolio upload ───────────────────────────────────────
router.post('/portfolio', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      console.warn('⚠️ No file uploaded — req.file is undefined');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Make sure to attach a file with field name "media".',
      });
    }

    console.log('📤 Uploading to Cloudinary:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferSize: req.file.buffer?.length,
    });

    const result = await uploadPortfolioToCloudinary(req.file.buffer);

    // Determine media type from Cloudinary result
    let mediaType = 'image';
    if (result.resource_type === 'video') mediaType = 'video';
    else if (result.resource_type === 'raw' || result.format === 'pdf') mediaType = 'document';

    res.json({
      success: true,
      mediaUrl: result.secure_url,
      publicId: result.public_id,
      mediaType,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error('❌ Portfolio upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
    });
  }
});

// ─── Profile image upload ───────────────────────────────────
router.post('/profile-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Use field name "image".',
      });
    }

    const result = await uploadProfileToCloudinary(req.file.buffer);

    res.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('❌ Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
    });
  }
});

// ─── Multer error handler ──────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 10MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  next(err);
});

module.exports = router;