// backend/controllers/technician/profile/updateBasicInfo.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateBasicInfo = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    const fields = ['aboutMe', 'profileHeadline', 'category'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) technician[field] = req.body[field];
    });

    await updateCompletionStats(technician);
    res.json({
      success: true,
      message: 'Basic information updated successfully',
      data: { aboutMe: technician.aboutMe, profileHeadline: technician.profileHeadline, category: technician.category }
    });
  } catch (error) {
    console.error('Update basic info error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};