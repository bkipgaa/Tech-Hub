/**
 * TechnicianProfile.js
 * ====================
 * Public technician profile view - Updated for three-level hierarchy
 * 
 * Displays a public-facing profile page for a technician, including:
 * - Profile header with photo, name, rating, and contact actions
 * - About, skills, services, portfolio, location, languages
 * - Work experience, education, and certifications
 * - Verification badge for verified professionals
 * 
 * @version 2.1.0
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

/**
 * TechnicianProfile Component
 * ---------------------------
 * Renders the public profile page for a single technician.
 * Fetches profile data on mount and when the route ID changes.
 */
const TechnicianProfile = () => {
  // ─── ROUTE PARAMS & NAVIGATION ─────────────────────────────
  // Extract the technician ID from the URL (e.g., /technician/:id)
  const { id } = useParams();
  // Hook to programmatically navigate (used for back button and chat redirect)
  const navigate = useNavigate();
  
  // ─── LOCAL STATE ───────────────────────────────────────────
  // Holds the full technician profile object returned from the API
  const [technician, setTechnician] = useState(null);
  // Loading flag: true while fetching data from the backend
  const [loading, setLoading] = useState(true);
  // Error message string; empty when no error is present
  const [error, setError] = useState('');
  // Controls visibility of the contact info panel (phone/email)
  const [showContact, setShowContact] = useState(false);

  // ─── EFFECTS ───────────────────────────────────────────────
  // Fetch technician profile whenever the route ID changes
  // (e.g., user clicks a different technician from related profiles)
  useEffect(() => {
    fetchTechnicianProfile();
  }, [id]); // Dependency array ensures re-fetch on ID change

  /**
   * fetchTechnicianProfile()
   * ------------------------
   * Async function to load the technician's public profile from the API.
   * - Sets loading state to true at start
   * - Clears any previous error
   * - On success: stores profile data in state
   * - On failure: sets an error message
   * - Finally: sets loading to false regardless of outcome
   */
  const fetchTechnicianProfile = async () => {
    try {
      setLoading(true);   // Show loading spinner
      setError('');       // Reset previous errors
      
      // GET request to the public profile endpoint
      const response = await api.get(`/technician/public/${id}`);
      
      // Extract profile data from the standardized API response wrapper
      setTechnician(response.data.data);
    } catch (err) {
      // Log full error for debugging; show friendly message to user
      console.error('Failed to load technician profile:', err);
      setError('Could not load technician profile. The technician may not exist.');
    } finally {
      // Always turn off loading, even on error
      setLoading(false);
    }
  };

  /**
   * handleContact()
   * ---------------
   * Toggles the visibility of the contact information panel.
   * Clicking "Contact" shows phone/email (if shared by technician).
   * Clicking "Hide Contact" collapses the panel.
   */
  const handleContact = () => {
    setShowContact(prev => !prev); // Toggle boolean state
  };

  /**
   * handleGoBack()
   * --------------
   * Navigates the user to the previous page in browser history.
   * Used by the "Back to Search Results" button.
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  /**
   * handleMessage()
   * ---------------
   * Triggered when client clicks "Message" on a technician's public profile.
   * 
   * Workflow:
   * 1. Validates the technician's user ID exists and is a string
   * 2. Calls backend to create (or fetch existing) conversation
   * 3. Sends an initial greeting so the technician has context
   * 4. Navigates to /chat/<conversationId> to open the thread immediately
   * 
   * Fallback: If anything fails, redirects to the general /chat page
   */
  const handleMessage = async () => {
    try {
      // Safely extract the technician's user ID (handle both populated object and raw ID)
      const technicianUserId = technician?.userId?._id || technician?.userId;
      
      // Guard clause: ensure we have a valid string ID before calling the API
      if (!technicianUserId || typeof technicianUserId !== 'string') {
        console.error('Invalid technician user ID');
        navigate('/chat');
        return;
      }

      // POST to create a new conversation (or retrieve existing one)
      const res = await api.post('/chat/conversations', {
        technicianUserId,           // Required: the technician's user account ID
        technicianProfileId: technician._id,  // Required: the technician profile document ID
        // Pre-fill an initial greeting message mentioning the main category
        initialMessage: `Hi, I'm interested in your ${technician.mainCategory || 'services'} services.`
      });
      
      // On success: navigate directly into the chat thread
      if (res.data?.success && res.data?.data?._id) {
        navigate(`/chat/${res.data.data._id}`);
      } else {
        // If response structure is unexpected, fall back to general chat page
        navigate('/chat');
      }
    } catch (err) {
      // Log error and fallback to general chat page without a specific thread
      console.error('Failed to start conversation:', err);
      navigate('/chat');
    }
  };

  /**
   * formatYear()
   * ------------
   * Safely extracts a 4-digit year from an ISO date string.
   * Returns null if the input is missing or invalid.
   * Used to prevent crashes from malformed dates in experience/education/certifications.
   * 
   * @param {string} dateString - ISO 8601 date string (e.g., "2020-06-15T00:00:00Z")
   * @returns {number|null} - The year (e.g., 2020) or null
   */
  const formatYear = (dateString) => {
    if (!dateString) return null;           // Guard against null/undefined
    const year = new Date(dateString).getFullYear();
    return isNaN(year) ? null : year;       // Guard against invalid date strings
  };

  // ─── RENDER: LOADING STATE ─────────────────────────────────
  // Display a centered spinner while data is being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          {/* Animated spinning circle using Tailwind utilities */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ─── RENDER: ERROR / NOT FOUND STATE ───────────────────────
  // Display an error message if the fetch failed or technician is null
  if (error || !technician) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Red alert box with the error message */}
          <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p>{error || 'Technician not found'}</p>
          </div>
          {/* Back button to return to search results */}
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

  // ─── DERIVED DATA ──────────────────────────────────────────
  // Compute initials from first/last name for the avatar fallback
  // If names are missing, we'll render a User icon instead
  const initials = `${technician.userId?.firstName?.[0] || ''}${technician.userId?.lastName?.[0] || ''}`;

  // ─── MAIN RENDER ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* ─── BACK BUTTON ───────────────────────────────────── */}
        {/* Sticky navigation aid to return to search results */}
        <button
          onClick={handleGoBack}
          className="mb-4 flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search Results
        </button>

        {/* ─── PROFILE HEADER ────────────────────────────────── */}
        {/* Green gradient banner with avatar, name, rating, and action buttons */}
        <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Decorative top bar (empty space for visual balance) */}
          <div className="h-24"></div>
          
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 -mt-12 mb-4">
              
              {/* Avatar: profile image or initials fallback */}
              <div className="flex-shrink-0">
                {technician.userId?.profileImage ? (
                  <img 
                    src={technician.userId.profileImage} 
                    alt={`${technician.userId.firstName || ''} ${technician.userId.lastName || ''}`.trim()} 
                    className="w-28 h-28 rounded-full border-4 border-white object-cover bg-white shadow-md"
                  />
                ) : (
                  // Gradient circle with initials or User icon as fallback
                  <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                    <span className="text-3xl text-white font-semibold">
                      {initials || <User className="w-10 h-10 text-white" />}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name, headline, category badge, rating, and action buttons */}
              <div className="flex-1 mt-2 md:mt-0">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    {/* Full name */}
                    <h1 className="text-3xl font-bold text-white">
                      {technician.userId?.firstName} {technician.userId?.lastName}
                    </h1>
                    {/* Professional headline / tagline */}
                    <p className="text-green-100 mt-1">{technician.profileHeadline}</p>
                    {/* Main service category pill (e.g., "Plumbing", "Electrical") */}
                    {technician.mainCategory && (
                      <span className="inline-block mt-2 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                        {technician.mainCategory}
                      </span>
                    )}
                  </div>
                  {/* Star rating badge: average score + review count */}
                  <div className="flex items-center gap-1 bg-yellow-500 px-3 py-1.5 rounded-full">
                    <Star className="w-5 h-5 text-white fill-current" />
                    <span className="font-bold text-lg text-white">
                      {technician.rating?.average?.toFixed(1) || 'New'}
                    </span>
                    <span className="text-white/80 text-sm">
                      ({technician.rating?.count || 0} reviews)
                    </span>
                  </div>
                </div>
                
                {/* Action buttons: Contact (toggle) and Message (chat) */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleContact}
                    className="bg-white text-green-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    aria-expanded={showContact} // Accessibility: announces expanded state
                  >
                    <PhoneCall className="w-4 h-4" />
                    {showContact ? 'Hide Contact' : 'Contact'}
                  </button>
                  <button 
                    onClick={handleMessage}
                    className="bg-white text-green-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>
                
                {/* Contact info panel: conditionally rendered when showContact is true */}
                {showContact && (
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">Contact Information:</p>
                    <div className="space-y-2">
                      {/* Phone: only shown if technician allows it AND has a phone number */}
                      {technician.settings?.showPhone && technician.userId?.phone && (
                        <div className="flex items-center gap-2 text-gray-800">
                          <Phone className="w-4 h-4 text-green-600" />
                          <a href={`tel:${technician.userId.phone}`} className="hover:text-green-600 transition-colors">
                            {technician.userId.phone}
                          </a>
                        </div>
                      )}
                      {/* Email: only shown if technician allows it AND has an email */}
                      {technician.settings?.showEmail && technician.userId?.email && (
                        <div className="flex items-center gap-2 text-gray-800">
                          <Mail className="w-4 h-4 text-green-600" />
                          <a href={`mailto:${technician.userId.email}`} className="hover:text-green-600 transition-colors">
                            {technician.userId.email}
                          </a>
                        </div>
                      )}
                      {/* Fallback message if technician shares nothing */}
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

        {/* ─── ABOUT SECTION ─────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            About
          </h2>
          <p className="text-gray-600 leading-relaxed text-left">
            {technician.aboutMe || 'No bio provided'}
          </p>
        </div>

        {/* ─── SKILLS SECTION ────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Skills & Expertise
          </h2>
          <div className="flex flex-wrap gap-2">
            {technician.skills?.length > 0 ? (
              // Map each skill to a pill/badge with optional level and years
              technician.skills.map((skill, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm hover:bg-green-500 hover:text-white transition-colors cursor-pointer">
                  {skill.name} {skill.level && `(${skill.level})`}
                  {skill.yearsOfExperience > 0 && ` · ${skill.yearsOfExperience} yrs`}
                </span>
              ))
            ) : (
              <p className="text-gray-400 italic">No skills listed</p>
            )}
          </div>
        </div>

        {/* ─── SERVICES OFFERED SECTION ──────────────────────── */}
        {/* Displays the three-level hierarchy: mainCategory > serviceCategories > subServices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-green-600" />
            Services Offered
          </h2>
          {/* Top-level category (e.g., "Home Repair") */}
          {technician.mainCategory && (
            <div className="mb-4">
              <span className="text-sm text-gray-500">Main Category:</span>
              <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {technician.mainCategory}
              </span>
            </div>
          )}
          {/* Nested service categories with their sub-services */}
          {technician.serviceCategories?.length > 0 ? (
            <div className="space-y-4">
              {technician.serviceCategories.map((cat, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                  {/* Category name (e.g., "Plumbing") */}
                  <h3 className="font-semibold text-gray-800 text-left">{cat.categoryName}</h3>
                  {/* Optional category description */}
                  {cat.description && <p className="text-sm text-gray-600 mt-1">{cat.description}</p>}
                  {/* Sub-services as small green pills (e.g., "Pipe Repair", "Leak Detection") */}
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

        {/* ─── PORTFOLIO SECTION ─────────────────────────────── */}
        {/* Grid of media items (images/videos) showcasing past work */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-green-600" />
            Portfolio
          </h2>
          {technician.portfolio && technician.portfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technician.portfolio.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Render image or video based on mediaType */}
                  {item.mediaType === 'image' && (
                    <img 
                      src={item.mediaUrl} 
                      alt={item.title || 'Portfolio item'} 
                      className="w-full h-40 object-cover"
                      loading="lazy" // Performance: defer off-screen images
                    />
                  )}
                  {item.mediaType === 'video' && (
                    <video src={item.mediaUrl} className="w-full h-40 object-cover" preload="metadata" />
                  )}
                  {/* Portfolio item metadata */}
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

        {/* ─── LOCATION SECTION ──────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Location
          </h2>
          <div className="space-y-1 text-left">
            {/* Address lines: conditionally rendered to avoid empty elements */}
            {technician.address?.street && <p className="text-gray-700">{technician.address.street}</p>}
            <p className="text-gray-700">
              {technician.address?.city && `${technician.address.city}, `}
              {technician.address?.state}
              {technician.address?.zipCode && ` ${technician.address.zipCode}`}
            </p>
            {/* Default country fallback to Kenya if not specified */}
            <p className="text-gray-700">{technician.address?.country || 'Kenya'}</p>
            {/* Service radius indicates how far the technician will travel */}
            {technician.serviceRadius && (
              <p className="text-sm text-green-600 mt-2">Service radius: {technician.serviceRadius} km</p>
            )}
          </div>
        </div>

        {/* ─── LANGUAGES SECTION ─────────────────────────────── */}
        {/* Only renders if the technician has languages configured */}
        {technician.languages?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Languages className="w-5 h-5 text-green-600" />
              Languages
            </h2>
            <div className="flex flex-wrap gap-2 justify-start">
              {technician.languages.map((lang, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-green-500 hover:text-white transition-colors">
                  {lang.name} {lang.proficiency && `(${lang.proficiency})`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── VERIFICATION BADGE ────────────────────────────── */}
        {/* Prominent green banner shown only for verified technicians */}
        {technician.verificationStatus === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Verified Professional</p>
              <p className="text-sm text-green-700">This technician has been verified by WeBA-Hub</p>
            </div>
          </div>
        )}

        {/* ─── WORK EXPERIENCE SECTION ───────────────────────── */}
        {/* Chronological list of past jobs; hidden if no experience data */}
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
                  {/* Date range: start year - end year (or "Present") */}
                  <p className="text-sm text-gray-500">
                    {formatYear(exp.startDate) ? `${formatYear(exp.startDate)} - ` : ''}
                    {exp.isCurrent ? 'Present' : formatYear(exp.endDate) ? formatYear(exp.endDate) : ''}
                  </p>
                  {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── EDUCATION SECTION ─────────────────────────────── */}
        {/* List of degrees/institutions; hidden if no education data */}
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
                    {formatYear(edu.startDate) ? `${formatYear(edu.startDate)} - ` : ''}
                    {edu.isCurrent ? 'Present' : formatYear(edu.endDate) ? formatYear(edu.endDate) : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CERTIFICATIONS SECTION ────────────────────────── */}
        {/* Professional certifications with verification status */}
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
                    {formatYear(cert.issueDate) ? `Issued: ${formatYear(cert.issueDate)}` : ''}
                    {/* Green checkmark for platform-verified certs */}
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