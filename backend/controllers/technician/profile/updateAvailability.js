// backend/controllers/technician/profile/updateAvailability.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateAvailability = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (req.body.availability) technician.availability = req.body.availability;
    if (req.body.emergencyAvailable !== undefined) technician.emergencyAvailable = req.body.emergencyAvailable;
    if (req.body.remoteServiceAvailable !== undefined) technician.remoteServiceAvailable = req.body.remoteServiceAvailable;
    if (req.body.weekendAvailable !== undefined) technician.weekendAvailable = req.body.weekendAvailable;

    await updateCompletionStats(technician);
    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availability: technician.availability,
        emergencyAvailable: technician.emergencyAvailable,
        remoteServiceAvailable: technician.remoteServiceAvailable,
        weekendAvailable: technician.weekendAvailable
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};