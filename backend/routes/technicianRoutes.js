const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import all technician controllers
const profileController = require('../controllers/technician/profileController');
const servicesController = require('../controllers/technician/servicesController');
const portfolioController = require('../controllers/technician/portfolioController');
const credentialsController = require('../controllers/technician/credentialsController');
const availabilityController = require('../controllers/technician/availabilityController');
const businessController = require('../controllers/technician/businessController');
const settingsController = require('../controllers/technician/settingsController');
const publicController = require('../controllers/technician/publicController');

/**
 * ====================================
 * PROFILE TAB ROUTES (Tab 1)
 * About Me, Profile Headline, Category, Skills, Languages, Location
 * ====================================
 */
// Create technician profile
router.post('/profile/create', auth, profileController.createProfile);

// Get technician profile
router.get('/profile/get', auth, profileController.getProfile);

// Update basic info (aboutMe, profileHeadline, category)
router.put('/profile/basic/update', auth, profileController.updateBasicInfo);

// Update skills
router.put('/profile/skills/update', auth, profileController.updateSkills);

// Update languages
router.put('/profile/languages/update', auth, profileController.updateLanguages);

// Update location
router.put('/profile/location/update', auth, profileController.updateLocation);

/**
 * ====================================
 * SERVICES TAB ROUTES (Tab 2)
 * Pricing, Payment Methods, Service Categories with sub-services
 * ====================================
 */
// Get all services (pricing and categories)
router.get('/services/get', auth, servicesController.getServices);

// Update pricing (hourlyRate, fixedPrice, consultationFee, currency, paymentMethods)
router.put('/services/pricing/update', auth, servicesController.updatePricing);

// Add service category
router.post('/services/category/add', auth, servicesController.addServiceCategory);

// Update service category
router.put('/services/category/:categoryId/update', auth, servicesController.updateServiceCategory);

// Remove service category
router.delete('/services/category/:categoryId/remove', auth, servicesController.removeServiceCategory);

// Add sub-service to category
router.post('/services/category/:categoryId/subservice/add', auth, servicesController.addSubService);

// Remove sub-service from category
router.delete('/services/category/:categoryId/subservice/:subIndex/remove', auth, servicesController.removeSubService);

/**
 * ====================================
 * PORTFOLIO TAB ROUTES (Tab 3)
 * Media Types, Tags, Featured Items
 * ====================================
 */
// Get portfolio items
router.get('/portfolio/get', auth, portfolioController.getPortfolio);

// Add portfolio item
router.post('/portfolio/item/add', auth, portfolioController.addPortfolioItem);

// Update portfolio item
router.put('/portfolio/item/:itemId/update', auth, portfolioController.updatePortfolioItem);

// Remove portfolio item
router.delete('/portfolio/item/:itemId/remove', auth, portfolioController.removePortfolioItem);

// Toggle featured status
router.patch('/portfolio/item/:itemId/feature/toggle', auth, portfolioController.toggleFeatured);

// Add tags to portfolio item
router.post('/portfolio/item/:itemId/tags/add', auth, portfolioController.addTags);

// Remove tag from portfolio item
router.delete('/portfolio/item/:itemId/tags/:tagIndex/remove', auth, portfolioController.removeTag);

/**
 * ====================================
 * CREDENTIALS TAB ROUTES (Tab 4)
 * Education, Certifications, Work Experience with Achievements
 * ====================================
 */
// ===== EDUCATION ROUTES =====
// Get education entries
router.get('/education/get', auth, credentialsController.getEducation);

// Add education entry
router.post('/education/add', auth, credentialsController.addEducation);

// Update education entry
router.put('/education/:eduId/update', auth, credentialsController.updateEducation);

// Remove education entry
router.delete('/education/:eduId/remove', auth, credentialsController.removeEducation);

// ===== CERTIFICATIONS ROUTES =====
// Get certifications
router.get('/certifications/get', auth, credentialsController.getCertifications);

// Add certification
router.post('/certifications/add', auth, credentialsController.addCertification);

// Update certification
router.put('/certifications/:certId/update', auth, credentialsController.updateCertification);

// Remove certification
router.delete('/certifications/:certId/remove', auth, credentialsController.removeCertification);

// ===== EXPERIENCE ROUTES =====
// Get experience entries
router.get('/experience/get', auth, credentialsController.getExperience);

// Add experience entry
router.post('/experience/add', auth, credentialsController.addExperience);

// Update experience entry
router.put('/experience/:expId/update', auth, credentialsController.updateExperience);

// Remove experience entry
router.delete('/experience/:expId/remove', auth, credentialsController.removeExperience);

// Update years of experience
router.put('/experience/years/update', auth, credentialsController.updateYearsOfExperience);

// ===== ACHIEVEMENTS ROUTES =====
// Add achievement to experience
router.post('/experience/:expId/achievement/add', auth, credentialsController.addAchievement);

// Remove achievement from experience
router.delete('/experience/:expId/achievement/:achievementIndex/remove', auth, credentialsController.removeAchievement);

/**
 * ====================================
 * AVAILABILITY TAB ROUTES (Tab 5)
 * Weekly Schedule, Time Slots, Availability Toggles
 * ====================================
 */
// Get availability settings
router.get('/availability/get', auth, availabilityController.getAvailability);

// Update full weekly schedule
router.put('/availability/schedule/update', auth, availabilityController.updateSchedule);

// Update specific day schedule
router.put('/availability/schedule/:day/update', auth, availabilityController.updateDaySchedule);

// Add time slot to day
router.post('/availability/schedule/:day/slot/add', auth, availabilityController.addTimeSlot);

// Remove time slot from day
router.delete('/availability/schedule/:day/slot/:slotIndex/remove', auth, availabilityController.removeTimeSlot);

// Update availability toggles (emergency, remote, weekend)
router.put('/availability/toggles/update', auth, availabilityController.updateAvailabilityToggles);

// Toggle overall availability status
router.patch('/availability/status/toggle', auth, availabilityController.toggleAvailability);

// Check availability for specific date/time
router.get('/availability/check', auth, availabilityController.checkAvailability);

/**
 * ====================================
 * BUSINESS TAB ROUTES (Tab 6)
 * Business Info, Insurance, Social Links
 * ====================================
 */
// Get business information
router.get('/business/get', auth, businessController.getBusinessInfo);

// Update business information (businessName, businessRegistrationNumber)
router.put('/business/info/update', auth, businessController.updateBusinessInfo);

// Update insurance information
router.put('/business/insurance/update', auth, businessController.updateInsuranceInfo);

// Update all social links at once
router.put('/business/social/update', auth, businessController.updateSocialLinks);

// Add specific social link
router.post('/business/social/add', auth, businessController.addSocialLink);

// Remove specific social link
router.delete('/business/social/:platform/remove', auth, businessController.removeSocialLink);

/**
 * ====================================
 * SETTINGS TAB ROUTES (Tab 7)
 * Privacy, Booking, Notification Settings
 * ====================================
 */
// Get all settings
router.get('/settings/get', auth, settingsController.getSettings);

// Update privacy settings (showEmail, showPhone)
router.put('/settings/privacy/update', auth, settingsController.updatePrivacySettings);

// Update booking settings (instantBooking, requiresApproval, autoAcceptJobs)
router.put('/settings/booking/update', auth, settingsController.updateBookingSettings);

// Update notification settings (email, sms, push, jobReminders)
router.put('/settings/notifications/update', auth, settingsController.updateNotificationSettings);

// Update all settings at once
router.put('/settings/update', auth, settingsController.updateAllSettings);

// Reset settings to default
router.post('/settings/reset', auth, settingsController.resetSettings);

/**
 * ====================================
 * PUBLIC ROUTES (Tab 8)
 * Public endpoints for viewing technician profiles
 * ====================================
 */
// Get technician by ID (public)
router.get('/public/:id', publicController.getTechnicianById);

// Search technicians with filters (public)
router.get('/public/search/list', publicController.searchTechnicians);

// Get nearby technicians (public)
router.get('/public/nearby/list', publicController.getNearbyTechnicians);

// Get technician statistics (public)
router.get('/public/:id/statistics', publicController.getTechnicianStatistics);

// Get featured technicians (public)
router.get('/public/featured/list', publicController.getFeaturedTechnicians);

// Get technicians by category (public)
router.get('/public/category/:category/list', publicController.getTechniciansByCategory);

module.exports = router;