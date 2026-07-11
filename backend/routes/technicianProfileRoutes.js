const express = require('express');
const router = express.Router();

// ✅ CORRECT IMPORT
const { auth, authorize, requireTechnicianOrAdmin } = require('../middleware/auth');

// Import all controllers
const { createProfile } = require('../controllers/technician/profile/createProfile');
const { getProfile } = require('../controllers/technician/profile/getProfile');
const { deleteProfile } = require('../controllers/technician/profile/deleteProfile');
const { updateProfile } = require('../controllers/technician/profile/updateProfile');
const { updateAvailability } = require('../controllers/technician/profile/updateAvailability');
const { updateBasicInfo } = require('../controllers/technician/profile/updateBasicInfo');
const { updateBusiness } = require('../controllers/technician/profile/updateBusiness');
const { updateCertifications } = require('../controllers/technician/profile/updateCertifications');
const { updateEducation } = require('../controllers/technician/profile/updateEducation');
const { updateExperience } = require('../controllers/technician/profile/updateExperience');
const { updateLanguages } = require('../controllers/technician/profile/updateLanguages');
const { updateLocation } = require('../controllers/technician/profile/updateLocation');
const { updatePortfolio } = require('../controllers/technician/profile/updatePortfolio');
const { updatePricing } = require('../controllers/technician/profile/updatePricing');
const { updateProfileStatus } = require('../controllers/technician/profile/updateProfileStatus');
const { updateSettings } = require('../controllers/technician/profile/updateSettings');
const { updateSkills } = require('../controllers/technician/profile/updateSkills');
const { updateSocialLinks } = require('../controllers/technician/profile/updateSocialLinks');
const { getPublicProfile } = require('../controllers/technician/publicController');


// ==================== PUBLIC ROUTES ====================
// No authentication or only basic auth required
router.get('/public/:id', getPublicProfile);

// ==================== PROTECTED ROUTES ====================
// Create a protected router group
const protectedRouter = express.Router();

// Apply authentication AND role middleware to ALL routes in this group
protectedRouter.use(auth);
protectedRouter.use(requireTechnicianOrAdmin);

// Full profile operations - all require technician or admin role
protectedRouter.post('/create-profile', createProfile);  // Create profile
protectedRouter.get('/profile', getProfile);      // Get profile
protectedRouter.put('/profile', updateProfile);   // Update profile
protectedRouter.delete('/profile', deleteProfile); // Delete profile

// Section updates
protectedRouter.put('/profile/basic', updateBasicInfo);
protectedRouter.put('/profile/skills', updateSkills);
protectedRouter.put('/profile/languages', updateLanguages);
protectedRouter.put('/profile/location', updateLocation);
protectedRouter.put('/profile/pricing', updatePricing);
protectedRouter.put('/profile/education', updateEducation);
protectedRouter.put('/profile/certifications', updateCertifications);
protectedRouter.put('/profile/experience', updateExperience);
protectedRouter.put('/profile/portfolio', updatePortfolio);
protectedRouter.put('/profile/business', updateBusiness);
protectedRouter.put('/profile/social-links', updateSocialLinks);
protectedRouter.put('/profile/availability', updateAvailability);
protectedRouter.put('/profile/settings', updateSettings);
protectedRouter.put('/profile/status', updateProfileStatus);

// Mount the protected routes
router.use('/', protectedRouter);

module.exports = router;