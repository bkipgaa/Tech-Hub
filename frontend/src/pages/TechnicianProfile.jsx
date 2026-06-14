/**
 * TechnicianProfile Component
 * ===========================
 * 
 * PURPOSE:
 * - Displays detailed information about a specific technician
 * - Shows profile, skills, services offered, portfolio, location, and contact info
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
  PhoneCall, Briefcase, BookOpen, BadgeCheck, User, ArrowLeft,
  FolderOpen
} from 'lucide-react';
import api from '../services/api';

const TechnicianProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    fetchTechnicianProfile();
  }, [id]);

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

  const handleContact = () => {
    setShowContact(true);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

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
          className="mb-4 flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search Results
        </button>

        {/* ========== PROFILE HEADER - Single Unified Section ========== */}
        <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Cover Image Area */}
          <div className="h-24"></div>
          
          <div className="px-6 pb-6">
            {/* Profile Image and Basic Info - Integrated together */}
            <div className="flex flex-col md:flex-row gap-6 -mt-12 mb-4">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {technician.userId?.profileImage ? (
                  <img 
                    src={technician.userId.profileImage} 
                    alt={`${technician.userId.firstName} ${technician.userId.lastName}`} 
                    className="w-28 h-28 rounded-full border-4 border-white object-cover bg-white shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                    <span className="text-3xl text-white font-semibold">
                      {technician.userId?.firstName?.[0]}{technician.userId?.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name, Headline and Rating - All in one place */}
              <div className="flex-1 mt-2 md:mt-0">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {technician.userId?.firstName} {technician.userId?.lastName}
                    </h1>
                    <p className="text-green-100 mt-1">{technician.profileHeadline}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500 px-3 py-1.5 rounded-full">
                    <Star className="w-5 h-5 text-white fill-current" />
                    <span className="font-bold text-lg text-white">{technician.rating?.average?.toFixed(1) || 'New'}</span>
                    <span className="text-white/80 text-sm">({technician.rating?.count || 0} reviews)</span>
                  </div>
                </div>
                
                {/* Contact Buttons - Both with white background */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleContact}
                    className="bg-white text-green-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Contact
                  </button>
                  <button className="bg-white text-green-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium shadow-sm">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>
                
                {/* Contact Info (revealed when clicking Contact) */}
                {showContact && (
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
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
          <p className="text-gray-600 leading-relaxed text-left">
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
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm hover:bg-green-500 hover:text-white transition-colors cursor-pointer">
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
                  <h3 className="font-semibold text-gray-800 text-left">{cat.categoryName}</h3>
                  <div className="flex flex-wrap gap-2 mt-2 justify-start">
                    {cat.subServices?.map((sub, subIdx) => (
                      <span key={subIdx} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-500 hover:text-white transition-colors">
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

        {/* ========== PORTFOLIO SECTION ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-green-600" />
            Portfolio
          </h2>
          {technician.portfolio && technician.portfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technician.portfolio.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {item.mediaType === 'image' && (
                    <img 
                      src={item.mediaUrl} 
                      alt={item.title} 
                      className="w-full h-40 object-cover"
                    />
                  )}
                  {item.mediaType === 'video' && (
                    <video src={item.mediaUrl} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    {item.clientName && (
                      <p className="text-xs text-gray-500 mt-2">Client: {item.clientName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-left">No portfolio items added yet</p>
          )}
        </div>

        {/* ========== LOCATION SECTION ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Location
          </h2>
          <div className="space-y-1 text-left">
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
            <div className="flex flex-wrap gap-2 justify-start">
              {technician.languages.map((lang, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-green-500 hover:text-white transition-colors">
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

        {/* ========== EXPERIENCE SECTION ========== */}
        {technician.experience?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              Work Experience
            </h2>
            <div className="space-y-4 text-left">
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

        {/* ========== EDUCATION SECTION ========== */}
        {technician.education?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Education
            </h2>
            <div className="space-y-4 text-left">
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

        {/* ========== CERTIFICATIONS SECTION ========== */}
        {technician.certifications?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-green-600" />
              Certifications
            </h2>
            <div className="space-y-3 text-left">
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