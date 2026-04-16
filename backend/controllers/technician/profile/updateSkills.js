// backend/controllers/technician/profile/updateSkills.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateSkills = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    technician.skills = req.body.skills || [];
    await updateCompletionStats(technician);
    res.json({ success: true, message: 'Skills updated successfully', skills: technician.skills });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};