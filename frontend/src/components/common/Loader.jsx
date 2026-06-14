/**
 * Loader Component
 * ================
 * 
 * Reusable loading spinner component
 */

import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );
};

export default Loader;