// backend/controllers/technician/profile/updateLocation.js
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateLocation = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) return res.status(404).json({ success: false, message: 'Profile not found' });

    const coords = req.body.location?.coordinates;
    if (coords !== undefined) {
      const [lng, lat] = Array.isArray(coords) ? coords.map(Number) : [];
      const valid = Number.isFinite(lng) && Number.isFinite(lat) &&
        Math.abs(lng) <= 180 && Math.abs(lat) <= 90 && !(lng === 0 && lat === 0);
      if (!valid) return res.status(400).json({ success: false, message: 'Invalid location coordinates' });
    }

    // Merge onto plain copies; spreading the mongoose sub-objects directly is unreliable
    const current = technician.toObject();
    if (req.body.address) technician.address = { ...current.address, ...req.body.address };
    if (req.body.location) {
      technician.location = { ...current.location, ...req.body.location, type: 'Point' };
      if (coords !== undefined) technician.locationUpdatedAt = new Date();
    }
    if (req.body.serviceRadius !== undefined) technician.serviceRadius = req.body.serviceRadius;

    await updateCompletionStats(technician);
    await technician.populate('userId', 'email firstName lastName phone profileImage');
    // Full profile back, so the frontend can replace its copy in one go
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: technician
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};