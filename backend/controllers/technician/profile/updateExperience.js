// backend/controllers/technician/profile/updateExperience.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateExperience = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (req.body.yearsOfExperience !== undefined) technician.yearsOfExperience = req.body.yearsOfExperience;
    if (req.body.experience) technician.experience = req.body.experience;

    await updateCompletionStats(technician);
    res.json({
      success: true,
      message: 'Experience updated successfully',
      data: { yearsOfExperience: technician.yearsOfExperience, experience: technician.experience }
    });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};