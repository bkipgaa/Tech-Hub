// backend/routes/technicianProfileRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');


// Full profile operations
const { createProfile } = require('../controllers/technician/profile/createProfile');
const { getProfile} = require('../controllers/technician/profile/getProfile');
const { deleteProfile } = require('../controllers/technician/profile/deleteProfile');
const { updateProfile } = require('../controllers/technician/profile/updateProfile');
const { getPublicProfile } = require('../controllers/technician/publicController');


// Section updates
const { updateBasicInfo } = require('../controllers/technician/profile/updateBasicInfo');
const { updateSkills } = require('../controllers/technician/profile/updateSkills');
const { updateLanguages } = require('../controllers/technician/profile/updateLanguages');
const { updateLocation } = require('../controllers/technician/profile/updateLocation');
const { updatePricing } = require('../controllers/technician/profile/updatePricing');
const { updateEducation } = require('../controllers/technician/profile/updateEducation');
const { updateCertifications } = require('../controllers/technician/profile/updateCertifications');
const { updateExperience } = require('../controllers/technician/profile/updateExperience');
const { updatePortfolio } = require('../controllers/technician/profile/updatePortfolio');
const { updateBusiness } = require('../controllers/technician/profile/updateBusiness');
const { updateSocialLinks } = require('../controllers/technician/profile/updateSocialLinks');
const { updateAvailability } = require('../controllers/technician/profile/updateAvailability');
const { updateSettings } = require('../controllers/technician/profile/updateSettings');
const { updateProfileStatus } = require('../controllers/technician/profile/updateProfileStatus');

router.get('/public/:id', getPublicProfile);

// All routes require authentication
router.use(protect);

// Full profile
router.post('/profile', createProfile);
router.get('/profile', getProfile);
router.delete('/profile', deleteProfile);
router.put('/profile', updateProfile);

// Section updates (PUT or PATCH)
router.put('/profile/basic', updateBasicInfo);
router.put('/profile/skills', updateSkills);
router.put('/profile/languages', updateLanguages);
router.put('/profile/location', updateLocation);
router.put('/profile/pricing', updatePricing);
router.put('/profile/education', updateEducation);
router.put('/profile/certifications', updateCertifications);
router.put('/profile/experience', updateExperience);
router.put('/profile/portfolio', updatePortfolio);
router.put('/profile/business', updateBusiness);
router.put('/profile/social-links', updateSocialLinks);
router.put('/profile/availability', updateAvailability);
router.put('/profile/settings', updateSettings);
router.put('/profile/status', updateProfileStatus);

module.exports = router;