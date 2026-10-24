// backend/controllers/technician/profile/getProfile.js
const Technician = require('../../../models/Technician');

exports.getProfile = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId })
      .populate('userId', 'email firstName lastName phone profileImage');
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, technician });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// The public profile lives in ../publicController.js (field whitelist).