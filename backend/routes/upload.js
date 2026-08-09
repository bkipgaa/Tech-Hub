const express = require('express');
const router = express.Router();
const { uploadPortfolio, uploadProfile } = require('../config/cloudinary');
const auth = require('../middleware/auth'); // your auth middleware

// Upload portfolio image/video
router.post('/portfolio', auth, uploadPortfolio.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    mediaUrl: req.file.path,        // Cloudinary URL
    publicId: req.file.filename,    // For deletion later
    mediaType: req.file.mimetype.startsWith('video') ? 'video' 
             : req.file.mimetype === 'application/pdf' ? 'document' 
             : 'image'
  });
});

// Upload profile image
router.post('/profile-image', auth, uploadProfile.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    imageUrl: req.file.path,
    publicId: req.file.filename
  });
});

module.exports = router;