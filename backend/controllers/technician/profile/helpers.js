// backend/controllers/technician/profile/helpers.js
const Technician = require('../../../models/Technician');

const calculateProfileCompletion = (technician) => {
  let completed = 0;
  const totalFields = 15;
  if (technician.aboutMe) completed++;
  if (technician.profileHeadline) completed++;
  if (technician.skills?.length > 0) completed++;
  if (technician.serviceCategories?.length > 0) completed++;
  if (technician.pricing?.hourlyRate > 0) completed++;
  if (technician.education?.length > 0) completed++;
  if (technician.certifications?.length > 0) completed++;
  if (technician.yearsOfExperience > 0) completed++;
  if (technician.experience?.length > 0) completed++;
  if (technician.portfolio?.length > 0) completed++;
  if (technician.address?.city) completed++;
  if (technician.languages?.length > 0) completed++;
  if (technician.businessName) completed++;
  if (technician.availability) completed++;
  return Math.round((completed / totalFields) * 100);
};

const updateCompletionStats = async (technician) => {
  technician.profileCompletionPercentage = calculateProfileCompletion(technician);
  technician.completedProfile = technician.profileCompletionPercentage >= 70;
  technician.lastActive = new Date();
  await technician.save();
  return technician;
};

module.exports = { calculateProfileCompletion, updateCompletionStats };