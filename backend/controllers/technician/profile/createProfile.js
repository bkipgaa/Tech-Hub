// backend/controllers/technician/profile/createProfile.js
const User = require('../../../models/User');
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.createProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'technician') return res.status(403).json({ success: false, message: 'Please become a technician first' });

    const existing = await Technician.findOne({ userId: req.user.userId });
    if (existing) return res.status(400).json({ success: false, message: 'Profile already exists' });

    const technicianData = {
      userId: req.user.userId,
      aboutMe: req.body.aboutMe || '',
      profileHeadline: req.body.profileHeadline || '',
      skills: req.body.skills || [],
      category: req.body.category,
      serviceCategories: req.body.serviceCategories || [],
      pricing: {
        hourlyRate: req.body.pricing?.hourlyRate || 0,
        fixedPrice: req.body.pricing?.fixedPrice || 0,
        consultationFee: req.body.pricing?.consultationFee || 0,
        currency: req.body.pricing?.currency || 'KES',
        paymentMethods: req.body.pricing?.paymentMethods || ['Cash', 'M-Pesa']
      },
      education: req.body.education || [],
      certifications: req.body.certifications || [],
      yearsOfExperience: req.body.yearsOfExperience || 0,
      experience: req.body.experience || [],
      portfolio: req.body.portfolio || [],
      address: {
        street: req.body.address?.street || '',
        city: req.body.address?.city || '',
        state: req.body.address?.state || '',
        zipCode: req.body.address?.zipCode || '',
        country: req.body.address?.country || 'Kenya'
      },
      location: {
        type: 'Point',
        coordinates: req.body.location?.coordinates || [0, 0],
        formattedAddress: req.body.location?.formattedAddress || '',
        placeId: req.body.location?.placeId || ''
      },
      serviceRadius: req.body.serviceRadius || 10,
      languages: req.body.languages || [{ name: 'English', proficiency: 'Fluent' }],
      availability: req.body.availability || {
        monday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        tuesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        thursday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        friday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        saturday: { enabled: false, hours: [] },
        sunday: { enabled: false, hours: [] }
      },
      emergencyAvailable: req.body.emergencyAvailable || false,
      remoteServiceAvailable: req.body.remoteServiceAvailable || false,
      weekendAvailable: req.body.weekendAvailable || false,
      businessName: req.body.businessName || '',
      businessRegistrationNumber: req.body.businessRegistrationNumber || '',
      socialLinks: req.body.socialLinks || {},
      settings: {
        showEmail: req.body.settings?.showEmail || false,
        showPhone: req.body.settings?.showPhone !== undefined ? req.body.settings.showPhone : true,
        instantBooking: req.body.settings?.instantBooking !== undefined ? req.body.settings.instantBooking : true,
        requiresApproval: req.body.settings?.requiresApproval || false,
        autoAcceptJobs: req.body.settings?.autoAcceptJobs || false,
        jobReminders: req.body.settings?.jobReminders !== undefined ? req.body.settings.jobReminders : true,
        notifications: {
          email: req.body.settings?.notifications?.email !== undefined ? req.body.settings.notifications.email : true,
          sms: req.body.settings?.notifications?.sms !== undefined ? req.body.settings.notifications.sms : true,
          push: req.body.settings?.notifications?.push !== undefined ? req.body.settings.notifications.push : true
        }
      },
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
      lastActive: new Date()
    };

    if (!technicianData.category) return res.status(400).json({ success: false, message: 'Category is required' });
    if (!technicianData.address.city || !technicianData.address.state) return res.status(400).json({ success: false, message: 'City and state are required' });

    const technician = new Technician(technicianData);
    await technician.save();
    await updateCompletionStats(technician);
    await technician.populate('userId', 'email firstName lastName phone profileImage');

    res.status(201).json({ success: true, message: 'Technician profile created successfully', technician });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile creation', error: error.message });
  }
};