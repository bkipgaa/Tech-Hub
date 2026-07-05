/**
 * helpers.js
 * ===========
 * Helper functions for technician profile management
 * Updated for three-level service hierarchy
 * 
 * @version 2.0.0
 * @author Weba-Hub Team
 */

const Technician = require('../../../models/Technician');

/**
 * Calculate profile completion percentage
 * Updated to include mainCategory and proper serviceCategories validation
 * 
 * @param {Object} technician - Technician document
 * @returns {number} Profile completion percentage (0-100)
 */
const calculateProfileCompletion = (technician) => {
  let completed = 0;
  const totalFields = 16; // Increased from 15 to include mainCategory
  
  // Basic Info
  if (technician.aboutMe && technician.aboutMe.length > 0) completed++;
  if (technician.profileHeadline && technician.profileHeadline.length > 0) completed++;
  
  // Level 1: Main Category (NEW)
  if (technician.mainCategory) completed++;
  
  // Level 2 & 3: Service Categories with Sub-Services (UPDATED)
  if (technician.serviceCategories && technician.serviceCategories.length > 0) {
    // Check if each category has at least one sub-service
    let hasValidCategories = true;
    for (const category of technician.serviceCategories) {
      if (!category.subServices || category.subServices.length === 0) {
        hasValidCategories = false;
        break;
      }
    }
    if (hasValidCategories) completed++;
  }
  
  // Skills
  if (technician.skills && technician.skills.length > 0) completed++;
  
  // Pricing
  if (technician.pricing?.hourlyRate > 0) completed++;
  
  // Education
  if (technician.education && technician.education.length > 0) completed++;
  
  // Certifications
  if (technician.certifications && technician.certifications.length > 0) completed++;
  
  // Years of Experience
  if (technician.yearsOfExperience > 0) completed++;
  
  // Work Experience
  if (technician.experience && technician.experience.length > 0) completed++;
  
  // Portfolio
  if (technician.portfolio && technician.portfolio.length > 0) completed++;
  
  // Location
  if (technician.address?.city) completed++;
  
  // Languages
  if (technician.languages && technician.languages.length > 0) completed++;
  
  // Business Name
  if (technician.businessName && technician.businessName.length > 0) completed++;
  
  // Availability - Check if at least one day is set
  if (technician.availability) {
    const hasAvailability = Object.values(technician.availability.toObject ? 
      technician.availability.toObject() : technician.availability)
      .some(day => day && day.enabled === true);
    if (hasAvailability) completed++;
  }
  
  // Social Links - Check if at least one social link is provided
  if (technician.socialLinks) {
    const hasSocialLinks = Object.values(technician.socialLinks.toObject ? 
      technician.socialLinks.toObject() : technician.socialLinks)
      .some(link => link && link.length > 0);
    if (hasSocialLinks) completed++;
  }
  
  // Calculate percentage (cap at 100%)
  const percentage = Math.min(Math.round((completed / totalFields) * 100), 100);
  return percentage;
};

/**
 * Update profile completion statistics
 * 
 * @param {Object} technician - Technician document
 * @returns {Promise<Object>} Updated technician document
 */
const updateCompletionStats = async (technician) => {
  technician.profileCompletionPercentage = calculateProfileCompletion(technician);
  technician.completedProfile = technician.profileCompletionPercentage >= 70;
  technician.lastActive = new Date();
  await technician.save();
  return technician;
};

/**
 * Get profile completion breakdown
 * Useful for showing users what's missing
 * 
 * @param {Object} technician - Technician document
 * @returns {Object} Completion breakdown by section
 */
const getProfileCompletionBreakdown = (technician) => {
  const breakdown = {
    aboutMe: { completed: !!(technician.aboutMe && technician.aboutMe.length > 0), required: true },
    profileHeadline: { completed: !!(technician.profileHeadline && technician.profileHeadline.length > 0), required: true },
    mainCategory: { completed: !!technician.mainCategory, required: true },
    serviceCategories: { 
      completed: !!(technician.serviceCategories && technician.serviceCategories.length > 0), 
      required: true 
    },
    skills: { completed: !!(technician.skills && technician.skills.length > 0), required: true },
    pricing: { completed: !!(technician.pricing?.hourlyRate > 0), required: true },
    education: { completed: !!(technician.education && technician.education.length > 0), required: false },
    certifications: { completed: !!(technician.certifications && technician.certifications.length > 0), required: false },
    yearsOfExperience: { completed: !!(technician.yearsOfExperience > 0), required: true },
    experience: { completed: !!(technician.experience && technician.experience.length > 0), required: false },
    portfolio: { completed: !!(technician.portfolio && technician.portfolio.length > 0), required: false },
    location: { completed: !!(technician.address?.city), required: true },
    languages: { completed: !!(technician.languages && technician.languages.length > 0), required: false },
    businessName: { completed: !!(technician.businessName && technician.businessName.length > 0), required: false },
    availability: { 
      completed: !!(technician.availability && 
        Object.values(technician.availability).some(day => day && day.enabled === true)), 
      required: false 
    },
    socialLinks: { 
      completed: !!(technician.socialLinks && 
        Object.values(technician.socialLinks).some(link => link && link.length > 0)), 
      required: false 
    }
  };
  
  return breakdown;
};

module.exports = { 
  calculateProfileCompletion, 
  updateCompletionStats,
  getProfileCompletionBreakdown 
};