// backend/controllers/technician/profile/updateEducation.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateEducation = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    technician.education = req.body.education || [];
    await updateCompletionStats(technician);
    res.json({ success: true, message: 'Education updated successfully', education: technician.education });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};