/**
 * roleController.js
 * ========================
 * Auto-generated admin controller.
 * Replace this boilerplate with your implementation.
 */

exports.placeholder = async (req, res) => {
  try {
    res.json({ success: true, message: 'roleController placeholder working' });
  } catch (error) {
    console.error('roleController error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
