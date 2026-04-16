const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateProfile = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Merge the incoming data with existing profile
    Object.assign(technician, req.body);
    technician.lastActive = new Date();

    await updateCompletionStats(technician);
    await technician.save();
    await technician.populate('userId', 'email firstName lastName phone profileImage');

    res.json({ success: true, message: 'Profile updated successfully', technician });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};