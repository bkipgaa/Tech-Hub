// backend/controllers/technician/profile/updateLocation.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateLocation = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (req.body.address) technician.address = { ...technician.address, ...req.body.address };
    if (req.body.location) technician.location = { ...technician.location, ...req.body.location };
    if (req.body.serviceRadius !== undefined) technician.serviceRadius = req.body.serviceRadius;

    await updateCompletionStats(technician);
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: { address: technician.address, coordinates: technician.location.coordinates, serviceRadius: technician.serviceRadius }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};