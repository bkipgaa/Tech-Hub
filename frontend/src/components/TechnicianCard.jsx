/**
 * TechnicianCard.jsx
 * ===================
 * Reusable Technician Card Component
 * 
 * Purpose:
 * - Displays technician information in a consistent card format
 * - Can be used across multiple pages (Search Results, Favorites, Recommended, etc.)
 * - Promotes code reusability and maintains UI consistency throughout the app
 * 
 * Usage Examples:
 * <TechnicianCard technician={techData} distance="5.2" showDistance={true} />
 * <TechnicianCard technician={techData} onViewProfile={customHandler} />
 * 
 * @component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Wrench, DollarSign, Award } from 'lucide-react';

const TechnicianCard = ({ technician, distance, showDistance = true, onViewProfile }) => {
  // Hook for programmatic navigation
  const navigate = useNavigate();

  /**
   * Handles the click event on "View Profile" button
   * If custom onViewProfile handler is provided, use it
   * Otherwise, navigate to the default technician profile page
   */
  const handleViewProfile = () => {
    if (onViewProfile) {
      // Use custom handler passed from parent component
      onViewProfile(technician._id);
    } else {
      // Default navigation to technician profile page
      navigate(`/technician/${technician._id}`);
    }
  };

  return (
    // Main card container with hover effects and shadow
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
      
      {/* Flex container for responsive layout - column on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row gap-5">
        
        {/* ========== LEFT SECTION: PROFILE IMAGE ========== */}
        <div className="flex-shrink-0">
          {/* Check if profile image exists in user data */}
          {technician.userId?.profileImage ? (
            // Display actual profile image
            <img 
              src={technician.userId.profileImage} 
              alt={`${technician.userId.firstName} ${technician.userId.lastName}`} 
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            // Fallback: Show initials if no profile image
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-500 font-semibold">
                {/* First letter of first name + first letter of last name */}
                {technician.userId?.firstName?.[0]}{technician.userId?.lastName?.[0]}
              </span>
            </div>
          )}
        </div>
        
        {/* ========== MIDDLE SECTION: TECHNICIAN DETAILS ========== */}
        <div className="flex-1">
          
          {/* Header Row: Name + Rating */}
          <div className="flex flex-wrap justify-between items-start gap-2">
            {/* Name and Headline */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 hover:text-green-600 transition-colors">
                {technician.userId?.firstName} {technician.userId?.lastName}
              </h3>
              <p className="text-sm text-gray-500">{technician.profileHeadline}</p>
            </div>
            
            {/* Rating Badge - Yellow background with star icon */}
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              {/* Display average rating (1 decimal) or 'New' if no ratings */}
              <span className="font-semibold text-sm">{technician.rating?.average?.toFixed(1) || 'New'}</span>
              {/* Show total review count */}
              <span className="text-gray-400 text-xs">({technician.rating?.count || 0})</span>
            </div>
          </div>
          
          {/* About Me / Description - Truncated to 2 lines */}
          <p className="text-gray-600 text-sm mt-2 line-clamp-2">{technician.aboutMe}</p>
          
          {/* Details Row: Distance, Price, Category, Verification Status */}
          <div className="flex flex-wrap gap-4 mt-3">
            
            {/* Distance from user (only shown if showDistance is true and distance exists) */}
            {showDistance && distance && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{distance} km away</span>
              </div>
            )}
            
            {/* Hourly Rate */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <DollarSign className="w-3 h-3" />
              <span>KES {technician.pricing?.hourlyRate || 0}/hour</span>
            </div>
            
            {/* Main Category (e.g., IT & Networking, Electrical Services) */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Wrench className="w-3 h-3" />
              <span>{technician.category}</span>
            </div>
            
            {/* Verification Badge - Only show if technician is verified */}
            {technician.verificationStatus === 'verified' && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Award className="w-3 h-3" />
                <span>Verified</span>
              </div>
            )}
          </div>
          
          {/* Skills Tags - Display top 3 skills with optional "more" indicator */}
          {technician.skills && technician.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {/* Show first 3 skills */}
              {technician.skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {skill.name}
                </span>
              ))}
              {/* If there are more than 3 skills, show +X more */}
              {technician.skills.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{technician.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* ========== RIGHT SECTION: ACTION BUTTON ========== */}
        <div className="flex-shrink-0">
          <button
            onClick={handleViewProfile}
            className="w-full md:w-auto bg-gray-800 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
          >
            View Profile
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default TechnicianCard;