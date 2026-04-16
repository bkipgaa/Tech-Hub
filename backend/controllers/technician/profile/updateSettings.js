// backend/controllers/technician/profile/updateSettings.js
const Technician = require('../../../models/Technician');

exports.updateSettings = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    technician.settings = { ...technician.settings, ...req.body };
    if (req.body.notifications) technician.settings.notifications = { ...technician.settings.notifications, ...req.body.notifications };

    await technician.save();
    res.json({ success: true, message: 'Settings updated successfully', settings: technician.settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};