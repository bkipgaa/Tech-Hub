// backend/controllers/technician/profile/deleteProfile.js
const Technician = require('../../../models/Technician');

exports.deleteProfile = async (req, res) => {
  try {
    const technician = await Technician.findOneAndDelete({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};