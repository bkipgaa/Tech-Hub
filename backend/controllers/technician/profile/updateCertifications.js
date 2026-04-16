// backend/controllers/technician/profile/updateCertifications.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateCertifications = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    technician.certifications = req.body.certifications || [];
    await updateCompletionStats(technician);
    res.json({ success: true, message: 'Certifications updated successfully', certifications: technician.certifications });
  } catch (error) {
    console.error('Update certifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};