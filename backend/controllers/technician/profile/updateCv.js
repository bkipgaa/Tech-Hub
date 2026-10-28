// backend/controllers/technician/profile/updateCv.js
// The expert's CV: stored for their public profile, and read to fill in the
// profile sections that are still empty (the rest are left as they are).
const Technician = require('../../../models/Technician');
const { uploadCvToCloudinary } = require('../../../config/cloudinary');
const { deleteFromCloudinary } = require('../../../utils/cloudinaryHelpers');
const { parseCv } = require('../../../utils/cvParser');
const { updateCompletionStats } = require('./helpers');

const isEmpty = (v) => (Array.isArray(v) ? v.length === 0 : !v);

exports.uploadCv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Attach your CV (PDF or Word).' });

    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { buffer, mimetype, originalname } = req.file;
    const stored = await uploadCvToCloudinary(buffer, mimetype, req.user.userId);
    const oldPublicId = technician.cv?.publicId;

    technician.cv = {
      url: stored.secure_url,
      publicId: stored.public_id,
      fileName: String(originalname || 'CV').slice(0, 150),
      mimeType: mimetype,
      uploadedAt: new Date(),
    };

    // Reading the CV is a bonus: if it fails the CV is still saved
    const filled = [];
    try {
      const parsed = await parseCv(buffer, mimetype);
      for (const field of ['profileHeadline', 'aboutMe', 'skills', 'experience', 'education']) {
        if (isEmpty(technician[field]) && !isEmpty(parsed[field])) {
          technician[field] = parsed[field];
          filled.push(field);
        }
      }
      if (!technician.yearsOfExperience && parsed.yearsOfExperience) {
        technician.yearsOfExperience = parsed.yearsOfExperience;
        filled.push('yearsOfExperience');
      }
    } catch (err) {
      console.error('CV parse error:', err.message);
    }

    await updateCompletionStats(technician);
    if (oldPublicId && oldPublicId !== stored.public_id) await deleteFromCloudinary(oldPublicId, 'raw');

    res.json({ success: true, message: 'CV uploaded', cv: technician.cv, filled, data: technician });
  } catch (error) {
    console.error('Upload CV error:', error);
    res.status(500).json({ success: false, message: 'Could not upload your CV. Please try again.' });
  }
};

exports.deleteCv = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    const publicId = technician.cv?.publicId;
    technician.cv = undefined;
    await technician.save();
    await deleteFromCloudinary(publicId, 'raw');

    res.json({ success: true, message: 'CV removed' });
  } catch (error) {
    console.error('Delete CV error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
