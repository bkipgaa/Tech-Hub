/**
 * TechnicianProfile Component
 * ===========================
 * 
 * PURPOSE:
 * - Displays detailed information about a specific technician
 * - Shows profile, skills, services offered, pricing, location, and contact info
 * - Allows clients to view technician's full profile and contact them
 * 
 * FLOW:
 * 1. User clicks "View Profile" on a technician card
 * 2. Navigates to /technician/:id
 * 3. Fetches technician data from backend using the ID
 * 4. Displays full profile information
 * 5. User can contact technician (if contact info is shared)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Star, Wrench, Clock, DollarSign, Phone, Mail, 
  Calendar, Award, Languages, CheckCircle, MessageCircle, 
  PhoneCall, Briefcase, BookOpen, BadgeCheck, User, ArrowLeft  // ✅ Use BadgeCheck instead
} from 'lucide-react';
import api from '../services/api';

const TechnicianProfile = () => {
  const { id } = useParams();  // Get technician ID from URL
  const navigate = useNavigate();
  
  // State for technician data
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContact, setShowContact] = useState(false);

  /**
   * Fetch technician profile when component mounts or ID changes
   */
  useEffect(() => {
    fetchTechnicianProfile();
  }, [id]);

  /**
   * Fetch technician profile from backend
   */
  const fetchTechnicianProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/technician/public/${id}`);
      setTechnician(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load technician profile:', err);
      setError('Could not load technician profile. The technician may not exist.');
      setLoading(false);
    }
  };

  /**
   * Handle contact button click - reveals contact information
   */
  const handleContact = () => {
    setShowContact(true);
  };

  /**
   * Go back to previous page
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !technician) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p>{error || 'Technician not found'}</p>
          </div>
          <button
            onClick={handleGoBack}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search Results
        </button>

        {/* ========== PROFILE HEADER ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Cover Image Area */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 h-32"></div>
          
          <div className="px-6 pb-6">
            {/* Profile Image and Basic Info */}
            <div className="flex flex-col md:flex-row gap-6 -mt-16 mb-4">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {technician.userId?.profileImage ? (
                  <img 
                    src={technician.userId.profileImage} 
                    alt={`${technician.userId.firstName} ${technician.userId.lastName}`} 
                    className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center shadow-md">
                    <span className="text-4xl text-gray-500 font-semibold">
                      {technician.userId?.firstName?.[0]}{technician.userId?.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name and Rating */}
              <div className="flex-1 mt-4 md:mt-0">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                      {technician.userId?.firstName} {technician.userId?.lastName}
                    </h1>
                    <p className="text-gray-600 mt-1">{technician.profileHeadline}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-bold text-lg">{technician.rating?.average?.toFixed(1) || 'New'}</span>
                    <span className="text-gray-400 text-sm">({technician.rating?.count || 0} reviews)</span>
                  </div>
                </div>
                
                {/* Contact Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleContact}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Contact
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>
                
                {/* Contact Info (revealed when clicking Contact) */}
                {showContact && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Contact Information:</p>
                    <div className="space-y-2">
                      {technician.settings?.showPhone && technician.userId?.phone && (
                        <div className="flex items-center gap-2 text-gray-800">
                          <Phone className="w-4 h-4 text-green-600" />
                          <a href={`tel:${technician.userId.phone}`} className="hover:text-green-600">
                            {technician.userId.phone}
                          </a>
                        </div>
                      )}
                      {technician.settings?.showEmail && technician.userId?.email && (
                        <div className="flex items-center gap-2 text-gray-800">
                          <Mail className="w-4 h-4 text-green-600" />
                          <a href={`mailto:${technician.userId.email}`} className="hover:text-green-600">
                            {technician.userId.email}
                          </a>
                        </div>
                      )}
                      {!technician.settings?.showPhone && !technician.settings?.showEmail && (
                        <p className="text-sm text-gray-500">No contact information shared</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========== ABOUT SECTION ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            About
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {technician.aboutMe || 'No bio provided'}
          </p>
        </div>

        {/* ========== SKILLS SECTION ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Skills & Expertise
          </h2>
          <div className="flex flex-wrap gap-2">
            {technician.skills?.length > 0 ? (
              technician.skills.map((skill, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                  {skill.name} ({skill.level})
                  {skill.yearsOfExperience > 0 && ` · ${skill.yearsOfExperience} yrs`}
                </span>
              ))
            ) : (
              <p className="text-gray-400 italic">No skills listed</p>
            )}
          </div>
        </div>

        {/* ========== SERVICES OFFERED SECTION ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-green-600" />
            Services Offered
          </h2>
          {technician.serviceCategories?.length > 0 ? (
            <div className="space-y-4">
              {technician.serviceCategories.map((cat, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                  <h3 className="font-semibold text-gray-800">{cat.categoryName}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cat.subServices?.map((sub, subIdx) => (
                      <span key={subIdx} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No services listed</p>
          )}
        </div>

        {/* ========== PRICING SECTION ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Hourly Rate</p>
              <p className="text-xl font-semibold text-gray-900">
                {technician.pricing?.currency || 'KES'} {technician.pricing?.hourlyRate || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fixed Price</p>
              <p className="text-xl font-semibold text-gray-900">
                {technician.pricing?.currency || 'KES'} {technician.pricing?.fixedPrice || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Consultation Fee</p>
              <p className="text-xl font-semibold text-gray-900">
                {technician.pricing?.currency || 'KES'} {technician.pricing?.consultationFee || 0}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Payment Methods</p>
            <p className="text-gray-700">{technician.pricing?.paymentMethods?.join(', ') || 'Cash, M-Pesa'}</p>
          </div>
        </div>

        {/* ========== LOCATION SECTION ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Location
          </h2>
          <div className="space-y-1">
            {technician.address?.street && <p className="text-gray-700">{technician.address.street}</p>}
            <p className="text-gray-700">
              {technician.address?.city && `${technician.address.city}, `}
              {technician.address?.state}
              {technician.address?.zipCode && ` ${technician.address.zipCode}`}
            </p>
            <p className="text-gray-700">{technician.address?.country || 'Kenya'}</p>
            <p className="text-sm text-green-600 mt-2">Service radius: {technician.serviceRadius} km</p>
          </div>
        </div>

        {/* ========== LANGUAGES SECTION ========== */}
        {technician.languages?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Languages className="w-5 h-5 text-green-600" />
              Languages
            </h2>
            <div className="flex flex-wrap gap-2">
              {technician.languages.map((lang, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {lang.name} ({lang.proficiency})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ========== VERIFICATION BADGE ========== */}
        {technician.verificationStatus === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Verified Professional</p>
              <p className="text-sm text-green-700">This technician has been verified by WeBA-Hub</p>
            </div>
          </div>
        )}

        {/* ========== EXPERIENCE SECTION (Optional) ========== */}
        {technician.experience?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              Work Experience
            </h2>
            <div className="space-y-4">
              {technician.experience.map((exp, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                  <h3 className="font-semibold text-gray-800">{exp.title}</h3>
                  <p className="text-gray-600">{exp.company}</p>
                  <p className="text-sm text-gray-500">
                    {exp.startDate && new Date(exp.startDate).getFullYear()} - 
                    {exp.isCurrent ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).getFullYear()}` : ''}
                  </p>
                  {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== EDUCATION SECTION (Optional) ========== */}
        {technician.education?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Education
            </h2>
            <div className="space-y-4">
              {technician.education.map((edu, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                  <h3 className="font-semibold text-gray-800">{edu.degree}</h3>
                  <p className="text-gray-600">{edu.institution}</p>
                  <p className="text-sm text-gray-500">
                    {edu.startDate && new Date(edu.startDate).getFullYear()} - 
                    {edu.isCurrent ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== CERTIFICATIONS SECTION (Optional) ========== */}
        {technician.certifications?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Certificate className="w-5 h-5 text-green-600" />
              Certifications
            </h2>
            <div className="space-y-3">
              {technician.certifications.map((cert, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-2 last:border-0">
                  <h3 className="font-semibold text-gray-800">{cert.name}</h3>
                  <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                  <p className="text-xs text-gray-500">
                    Issued: {cert.issueDate && new Date(cert.issueDate).getFullYear()}
                    {cert.verified && <span className="ml-2 text-green-600">✓ Verified</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default TechnicianProfile;