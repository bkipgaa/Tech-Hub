// backend/controllers/technician/profile/updatePortfolio.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');
const { deleteRemovedPortfolioMedia } = require('../../../utils/cloudinaryHelpers');

// Keeps profiles focused on the best work and storage predictable
const MAX_PORTFOLIO_ITEMS = 20;

exports.updatePortfolio = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    const oldPortfolio = (technician.portfolio || []).map((p) => (p.toObject ? p.toObject() : p));
    const newPortfolio = req.body.portfolio || [];

    if (newPortfolio.length > MAX_PORTFOLIO_ITEMS && newPortfolio.length > oldPortfolio.length) {
      return res.status(400).json({
        success: false,
        message: `You can have up to ${MAX_PORTFOLIO_ITEMS} portfolio projects. Remove one to add another.`,
      });
    }

    technician.portfolio = newPortfolio;
    await updateCompletionStats(technician); // saves

    // Only after a successful save: free the storage of removed/replaced files
    await deleteRemovedPortfolioMedia(oldPortfolio, newPortfolio);

    // `data` keeps the frontend's profile (completion %, etc.) in sync
    res.json({ success: true, message: 'Portfolio updated successfully', portfolio: technician.portfolio, data: technician });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
