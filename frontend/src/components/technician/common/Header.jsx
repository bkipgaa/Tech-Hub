import React from 'react';
import { Star, Briefcase, CheckCircle } from 'lucide-react';

const Header = ({ technicianProfile }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Technician Dashboard</h1>
          <p className="text-gray-600">Manage your professional profile and services</p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-center border border-gray-200">
            <Star className="w-5 h-5 inline mb-1 text-yellow-500" />
            <p className="text-2xl font-bold text-gray-800">{technicianProfile.rating?.average?.toFixed(1) || '0.0'}</p>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-center border border-gray-200">
            <Briefcase className="w-5 h-5 inline mb-1 text-green-600" />
            <p className="text-2xl font-bold text-gray-800">{technicianProfile.statistics?.completedJobs || 0}</p>
            <p className="text-xs text-gray-600">Jobs Done</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-center border border-gray-200">
            <CheckCircle className="w-5 h-5 inline mb-1 text-green-600" />
            <p className="text-2xl font-bold text-gray-800">{technicianProfile.reviews?.length || 0}</p>
            <p className="text-xs text-gray-600">Reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;