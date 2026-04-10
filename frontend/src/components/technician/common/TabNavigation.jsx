import React from 'react';
import { 
  UserCheck, Wrench, Image, Award, 
  Calendar, Briefcase, Settings 
} from 'lucide-react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCheck },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'portfolio', label: 'Portfolio', icon: Image },
    { id: 'credentials', label: 'Credentials', icon: Award },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'business', label: 'Business', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="flex -mb-px space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;