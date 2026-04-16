// backend/controllers/technician/profile/updateBusiness.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateBusiness = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (req.body.businessName !== undefined) technician.businessName = req.body.businessName;
    if (req.body.businessRegistrationNumber !== undefined) technician.businessRegistrationNumber = req.body.businessRegistrationNumber;

    await updateCompletionStats(technician);
    res.json({
      success: true,
      message: 'Business info updated successfully',
      data: { businessName: technician.businessName, businessRegistrationNumber: technician.businessRegistrationNumber }
    });
  } catch (error) {
    console.error('Update business info error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};