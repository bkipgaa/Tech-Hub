import React from 'react';

const ProfileCompletionBar = ({ percentage }) => {
  return (
    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-green-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Profile Completion</span>
        <span className="text-sm font-medium text-green-600">{percentage || 0}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-green-600 h-2.5 rounded-full" 
          style={{ width: `${percentage || 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProfileCompletionBar;