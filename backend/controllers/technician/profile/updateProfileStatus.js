// backend/controllers/technician/profile/updateProfileStatus.js
const Technician = require('../../../models/Technician');

exports.updateProfileStatus = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (req.body.isAvailable !== undefined) technician.isAvailable = req.body.isAvailable;
    technician.lastActive = new Date();
    await technician.save();

    res.json({ success: true, message: 'Profile status updated', isAvailable: technician.isAvailable });
  } catch (error) {
    console.error('Update profile status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};