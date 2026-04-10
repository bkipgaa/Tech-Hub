// src/pages/BecomeTechnician.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wrench, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const BecomeTechnician = () => {
  const { user, becomeTechnician } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  // If already technician, redirect to create profile or dashboard
  if (user.role === 'technician') {
    navigate('/create-technician-profile');
    return null;
  }

  const handleBecomeTechnician = async () => {
    setLoading(true);
    setError('');
    
    const result = await becomeTechnician();
    
    setLoading(false);
    
    if (result.success) {
      setSuccess(true);
      // Redirect to create profile page after 2 seconds
      setTimeout(() => {
        navigate('/create-technician-profile');
      }, 2000);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Become a Technician</h1>
          <p className="text-gray-600 mt-2">
            Upgrade your account to start offering services and earning money
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-6 rounded text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <h3 className="text-xl font-bold mb-2">Success!</h3>
            <p>You are now a technician. Redirecting to profile creation...</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">What you'll get:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Create your professional technician profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Showcase your skills and experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Upload portfolio of your work</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Get hired by clients</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Earn money from your services</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your current role is <strong>{user.role}</strong>. 
                After upgrading, you'll be able to create your technician profile.
              </p>
            </div>

            <button
              onClick={handleBecomeTechnician}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-red-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Upgrading...</span>
                </>
              ) : (
                <>
                  <span>Upgrade to Technician</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={() => navigate(-1)}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BecomeTechnician;