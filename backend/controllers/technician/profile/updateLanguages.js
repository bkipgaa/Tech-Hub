// backend/controllers/technician/profile/updateLanguages.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateLanguages = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    technician.languages = req.body.languages || [];
    await updateCompletionStats(technician);
    res.json({ success: true, message: 'Languages updated successfully', languages: technician.languages });
  } catch (error) {
    console.error('Update languages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};