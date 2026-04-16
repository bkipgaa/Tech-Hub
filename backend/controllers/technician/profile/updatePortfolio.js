// backend/controllers/technician/profile/updatePortfolio.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updatePortfolio = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    technician.portfolio = req.body.portfolio || [];
    await updateCompletionStats(technician);
    res.json({ success: true, message: 'Portfolio updated successfully', portfolio: technician.portfolio });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};