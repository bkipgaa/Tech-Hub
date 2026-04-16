// backend/controllers/technician/profile/updatePricing.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updatePricing = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    technician.pricing = { ...technician.pricing, ...req.body };
    await updateCompletionStats(technician);
    res.json({ success: true, message: 'Pricing updated successfully', pricing: technician.pricing });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};