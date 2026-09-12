/**
 * subscriptionAdminController.js
 * ========================
 * Auto-generated admin controller.
 * Replace this boilerplate with your implementation.
 */

exports.placeholder = async (req, res) => {
  try {
    res.json({ success: true, message: 'subscriptionAdminController placeholder working' });
  } catch (error) {
    console.error('subscriptionAdminController error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
