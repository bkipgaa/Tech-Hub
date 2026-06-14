/**
 * TechnicianCard.jsx
 * ===================
 * Reusable Technician Card Component with subscription plan display
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Wrench, Award, User, Crown, Zap, Globe, Briefcase } from 'lucide-react';

// Plan configuration
const planConfig = {
  free: { icon: User, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Free' },
  basic: { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Basic' },
  premium: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Premium' },
  business: { icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Business' },
  enterprise: { icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-100', label: 'Enterprise' },
  unlimited: { icon: Zap, color: 'text-red-500', bg: 'bg-red-100', label: 'Unlimited' },
  trial: { icon: Award, color: 'text-green-500', bg: 'bg-green-100', label: 'Trial' }
};

const TechnicianCard = ({ technician, distance, showDistance = true, onViewProfile }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(technician._id);
    } else {
      navigate(`/technician/${technician._id}`);
    }
  };

  // Get plan info from technician data (sent from backend)
  const plan = technician.subscriptionPlan || 'free';
  const planInfo = planConfig[plan] || planConfig.free;
  const PlanIcon = planInfo.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        
        {/* Profile Image */}
        <div className="flex-shrink-0">
          {technician.userId?.profileImage ? (
            <img 
              src={technician.userId.profileImage} 
              alt={`${technician.userId.firstName} ${technician.userId.lastName}`} 
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
              <span className="text-2xl text-white font-semibold">
                {technician.userId?.firstName?.[0]}{technician.userId?.lastName?.[0]}
              </span>
            </div>
          )}
        </div>
        
        {/* Technician Info */}
        <div className="flex-1 min-w-0">
          
          {/* Header Row: Name + Rating + Plan */}
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-800 hover:text-green-600 transition-colors duration-200 cursor-pointer">
                  {technician.userId?.firstName} {technician.userId?.lastName}
                </h3>
                {/* Plan Badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${planInfo.bg} ${planInfo.color}`}>
                  <PlanIcon className="w-3 h-3" />
                  {planInfo.label}
                </span>
                {/* Trial Badge */}
                {technician.isTrial && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <Award className="w-3 h-3" />
                    Trial
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{technician.profileHeadline}</p>
            </div>
            
            {/* Rating Badge */}
            <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-semibold text-sm text-gray-800">
                {technician.rating?.average?.toFixed(1) || 'New'}
              </span>
              <span className="text-gray-400 text-xs">({technician.rating?.count || 0})</span>
            </div>
          </div>
          
          {/* About Me */}
          <p className="text-gray-600 text-sm mt-2 line-clamp-2 leading-relaxed text-left">
            {technician.aboutMe || 'No description provided'}
          </p>
          
          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            
            {/* Distance */}
            {showDistance && distance && (
              <div className="flex items-center gap-1.5 text-xs bg-gray-50 px-2 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium text-gray-700">{distance} km away</span>
              </div>
            )}
            
            {/* Visibility Radius - NEW */}
            {technician.visibilityRadius && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Globe className="w-3.5 h-3.5" />
                <span>Visible up to {technician.visibilityRadius} km</span>
              </div>
            )}
            
            {/* Category */}
            <div className="flex items-center gap-1.5 text-xs">
              <Wrench className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600 font-medium hover:text-green-600 hover:underline transition-colors duration-200 cursor-pointer">
                {technician.category}
              </span>
            </div>
            
            {/* Verification Badge */}
            {technician.verificationStatus === 'verified' && (
              <div className="flex items-center gap-1 text-xs bg-green-50 px-2 py-0.5 rounded-full">
                <Award className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-700 font-medium">Verified</span>
              </div>
            )}
            
            {/* Pending Badge */}
            {technician.verificationStatus === 'pending' && (
              <div className="flex items-center gap-1 text-xs bg-yellow-50 px-2 py-0.5 rounded-full">
                <User className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-yellow-700 font-medium">Pending</span>
              </div>
            )}
          </div>
          
          {/* Skills Tags */}
          {technician.skills && technician.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {technician.skills.slice(0, 3).map((skill, idx) => (
                <span 
                  key={idx} 
                  className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-green-500 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  {skill.name}
                </span>
              ))}
              {technician.skills.length > 3 && (
                <span className="text-xs text-gray-400 px-2 py-1">
                  +{technician.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleViewProfile}
            className="w-full md:w-auto bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
          >
            View Profile
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default TechnicianCard;