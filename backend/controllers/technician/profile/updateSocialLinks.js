// backend/controllers/technician/profile/updateSocialLinks.js
const Technician = require('../../../models/Technician');

exports.updateSocialLinks = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    technician.socialLinks = { ...technician.socialLinks, ...req.body };
    await technician.save();
    res.json({ success: true, message: 'Social links updated successfully', socialLinks: technician.socialLinks });
  } catch (error) {
    console.error('Update social links error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};