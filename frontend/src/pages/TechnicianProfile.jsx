/**
 * TechnicianProfile.js - Public Technician Profile with Booking & Rating
 * ====================================================================
 * 
 * Displays a public-facing profile page for a technician, including:
 * - Profile header with photo, name, rating, and contact actions
 * - About, skills, services, portfolio, location, languages
 * - Work experience, education, and certifications
 * - Verification badge for verified professionals
 * - ✅ BOOKING: Book this technician (client only)
 * - ✅ RATING: Rate the technician after a completed booking
 * - ✅ Error handling with full logging for Render
 * 
 * @version 3.0.0
 * @author Webafix Team
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  MapPin,
  Star,
  Wrench,
  Clock,
  DollarSign,
  Calendar,
  Award,
  Languages,
  CheckCircle,
  MessageCircle,
  Briefcase,
  BookOpen,
  BadgeCheck,
  FileText,
  ExternalLink,
  User,
  ArrowLeft,
  FolderOpen,
  Calendar as CalendarIcon,
  X,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { cldImage, cldVideoPoster, AVATAR_WIDTH, CARD_WIDTH, VIEWER_WIDTH } from '../utils/media';
import BookFundiModal from '../components/booking/BookFundiModal';
import useServiceBuckets from '../hooks/useServiceBuckets';

/**
 * TechnicianProfile Component
 * ---------------------------
 * Renders the public profile page for a single technician.
 * Supports booking, rating, and chat integration.
 */
const TechnicianProfile = () => {
  // ─── ROUTE PARAMS & NAVIGATION ─────────────────────────────
  const { id } = useParams(); // technician ID from URL
  const navigate = useNavigate();
  const routerLocation = useLocation();
  // Service picked during the search; the Book Fundi button keeps it
  const [searchParams] = useSearchParams();
  const presetCategory = searchParams.get('serviceCategory') || '';
  const presetSubService = searchParams.get('subService') || '';

  // ─── LOCAL STATE ───────────────────────────────────────────
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // What this expert's group calls them (Fundi, Stylist, Tutor, …): the group
  // of the service picked in the search, else of their main category
  const { bucketOf } = useServiceBuckets();
  const groupCategory =
    technician?.serviceCategories?.find((sc) => sc.categoryName === presetCategory)?.mainCategory ||
    technician?.mainCategory;
  const termOne = bucketOf(groupCategory)?.expertTermSingular || 'Fundi';

  // ─── BOOKING STATE ─────────────────────────────────────────
  const [showBookingModal, setShowBookingModal] = useState(false);

  // ─── RATING STATE ───────────────────────────────────────────
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    review: '',
  });
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);
  const [completedBookingId, setCompletedBookingId] = useState(null);
  const [hasRated, setHasRated] = useState(false);

  // ─── EFFECTS ───────────────────────────────────────────────
  // Fetch technician profile on mount or ID change
  useEffect(() => {
    fetchTechnicianProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // After profile loads, check for completed bookings
  useEffect(() => {
    if (technician && technician._id) {
      checkCompletedBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technician]);

  /**
   * fetchTechnicianProfile()
   * ------------------------
   * Loads the technician's public profile from the API.
   * Sets loading state, handles errors, and stores data.
   */
  const fetchTechnicianProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/technician/public/${id}`);

      if (response.data.success) {
        setTechnician(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load profile.');
      }
    } catch (err) {
      console.error('Failed to load technician profile:', err);
      let errorMsg = 'Could not load this profile. ';
      if (err.response) {
        errorMsg += `Server error (${err.response.status}). `;
        if (err.response.data?.message) errorMsg += err.response.data.message;
      } else if (err.request) {
        errorMsg += 'No response from server. Check your connection.';
      } else {
        errorMsg += err.message || 'An unexpected error occurred.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * checkCompletedBookings()
   * ------------------------
   * Checks if the logged-in client has any completed bookings with this technician.
   * If yes, stores the booking ID and checks if already rated.
   * This determines whether the "Rate" button appears.
   */
  const checkCompletedBookings = async () => {
    try {
      const signedIn = localStorage.getItem('user');
      if (!signedIn) return;

      const response = await api.get('/bookings/my-bookings?as=client&status=completed&limit=50');
      if (response.data.success) {
        const bookings = response.data.data || [];
        const completed = bookings.find(
          (b) => b.technicianId?._id === technician._id || b.technicianId === technician._id
        );
        if (completed) {
          setHasCompletedBooking(true);
          setCompletedBookingId(completed._id);
          if (completed.clientRating) {
            setHasRated(true);
          }
        }
      }
    } catch (err) {
      console.warn('Could not check completed bookings:', err.message);
    }
  };

  // ─── CONTACT / BACK / MESSAGE ──────────────────────────────

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleMessage = async () => {
    try {
      const technicianUserId = technician?.userId?._id || technician?.userId;
      if (!technicianUserId || typeof technicianUserId !== 'string') {
        console.error('Invalid technician user ID');
        navigate('/chat');
        return;
      }

      const res = await api.post('/chat/conversations', {
        technicianUserId,
        technicianProfileId: technician._id,
        initialMessage: `Hi, I'm interested in your ${technician.mainCategory || 'services'} services.`,
      });

      if (res.data?.success && res.data?.data?._id) {
        navigate(`/chat/${res.data.data._id}`);
      } else {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
      navigate('/chat');
    }
  };

  // ─── BOOKING ───────────────────────────────────────────────
  // Signed-out visitors log in first and come straight back here
  const openBookingModal = () => {
    if (!localStorage.getItem('user')) {
      navigate('/login', { state: { from: routerLocation } });
      return;
    }
    setShowBookingModal(true);
  };

  // ─── RATING FUNCTIONS ───────────────────────────────────────

  const openRatingModal = () => {
    setShowRatingModal(true);
    setRatingForm({ rating: 0, review: '' });
    setRatingError('');
    setRatingSuccess(false);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingLoading(false);
    setRatingError('');
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();

    if (ratingForm.rating === 0) {
      setRatingError('Please select a star rating.');
      return;
    }
    if (!ratingForm.review || ratingForm.review.trim() === '') {
      setRatingError('Please write a review.');
      return;
    }

    setRatingLoading(true);
    setRatingError('');

    try {
      const response = await api.post(`/bookings/${completedBookingId}/rate`, {
        rating: ratingForm.rating,
        review: ratingForm.review.trim(),
      });

      if (response.data.success) {
        setRatingSuccess(true);
        setHasRated(true);
        const updatedRating = response.data.data?.technicianRating;
        if (updatedRating) {
          setTechnician((prev) => ({
            ...prev,
            rating: {
              average: updatedRating.average,
              count: updatedRating.count,
              distribution: updatedRating.distribution,
            },
          }));
        }
        setTimeout(() => {
          closeRatingModal();
        }, 1500);
      } else {
        setRatingError(response.data.message || 'Failed to submit rating.');
      }
    } catch (err) {
      console.error('Rating error:', err);
      let errorMsg = 'Failed to submit rating. ';
      if (err.response) {
        errorMsg += err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMsg += 'No response from server. Check your connection.';
      } else {
        errorMsg += err.message || 'An unexpected error occurred.';
      }
      setRatingError(errorMsg);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleStarClick = (starValue) => {
    setRatingForm((prev) => ({ ...prev, rating: starValue }));
    if (ratingError) setRatingError('');
  };

  const formatYear = (dateString) => {
    if (!dateString) return null;
    const year = new Date(dateString).getFullYear();
    return isNaN(year) ? null : year;
  };

  // ─── RENDER: LOADING ────────────────────────────────────────
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

  // ─── RENDER: ERROR ──────────────────────────────────────────
  if (error || !technician) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="font-medium">{error || 'Profile not found'}</p>
          </div>
          <button
            onClick={handleGoBack}
            className="mt-4 bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // ─── DERIVED DATA ──────────────────────────────────────────
  const initials = `${technician.userId?.firstName?.[0] || ''}${technician.userId?.lastName?.[0] || ''}`;
  // Set at login (the token itself may live only in an httpOnly cookie)
  const isLoggedIn = !!localStorage.getItem('user');

  // ─── MAIN RENDER ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ─── BACK BUTTON ───────────────────────────────────── */}
        <button
          onClick={handleGoBack}
          className="mb-4 flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search Results
        </button>

        {/* ─── PROFILE HEADER ────────────────────────────────── */}
        <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="h-24"></div>

          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 -mt-12 mb-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {technician.userId?.profileImage ? (
                  <img
                    src={cldImage(technician.userId.profileImage, AVATAR_WIDTH)}
                    alt={`${technician.userId.firstName || ''} ${technician.userId.lastName || ''}`.trim()}
                    className="w-28 h-28 rounded-full border-4 border-white object-cover bg-white shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                    <span className="text-3xl text-white font-semibold">
                      {initials || <User className="w-10 h-10 text-white" />}
                    </span>
                  </div>
                )}
              </div>

              {/* Name, headline, actions */}
              <div className="flex-1 mt-2 md:mt-0">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {technician.userId?.firstName} {technician.userId?.lastName}
                    </h1>
                    <p className="text-green-100 mt-1">{technician.profileHeadline}</p>
                    {technician.mainCategory && (
                      <span className="inline-block mt-2 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                        {technician.mainCategory}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500 px-3 py-1.5 rounded-full">
                    <Star className="w-5 h-5 text-white fill-current" />
                    <span className="font-bold text-lg text-white">
                      {technician.rating?.average?.toFixed(1) || 'New'}
                    </span>
                    <span className="text-white/80 text-sm">
                      ({technician.rating?.count || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
                    <Briefcase className="w-5 h-5 text-white" />
                    <span className="font-bold text-lg text-white">{technician.completedJobs || 0}</span>
                    <span className="text-white/80 text-sm">
                      job{technician.completedJobs === 1 ? '' : 's'} completed
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Message, Book (contact details are only shared via chat) */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={handleMessage}
                    className="bg-white text-green-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  {technician.acceptingBookings !== false && (
                    <button
                      onClick={openBookingModal}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Book {termOne}
                    </button>
                  )}
                  {isLoggedIn && technician.acceptingBookings === false && (
                    <span className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Not accepting new bookings right now
                    </span>
                  )}
                  {isLoggedIn && hasCompletedBooking && !hasRated && (
                    <button
                      onClick={openRatingModal}
                      className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    >
                      <Star className="w-4 h-4 fill-current" />
                      Rate This {termOne}
                    </button>
                  )}
                </div>

                <p className="text-xs text-green-100 mt-3">
                  Use Message to chat with this {termOne} — you can share contact details there if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ABOUT ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            About
          </h2>
          <p className="text-gray-600 leading-relaxed text-left">
            {technician.aboutMe || 'No bio provided'}
          </p>
        </div>

        {/* ─── SKILLS ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Skills & Expertise
          </h2>
          <div className="flex flex-wrap gap-2">
            {technician.skills?.length > 0 ? (
              technician.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm hover:bg-green-500 hover:text-white transition-colors cursor-pointer"
                >
                  {skill.name} {skill.level && `(${skill.level})`}
                  {skill.yearsOfExperience > 0 && ` · ${skill.yearsOfExperience} yrs`}
                </span>
              ))
            ) : (
              <p className="text-gray-400 italic">No skills listed</p>
            )}
          </div>
        </div>

        {/* ─── SERVICES OFFERED ────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-green-600" />
            Services Offered
          </h2>
          {technician.mainCategory && (
            <div className="mb-4">
              <span className="text-sm text-gray-500">Main Category:</span>
              <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {technician.mainCategory}
              </span>
            </div>
          )}
          {technician.serviceCategories?.length > 0 ? (
            <div className="space-y-4">
              {technician.serviceCategories.map((cat, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                  <h3 className="font-semibold text-gray-800 text-left">{cat.categoryName}</h3>
                  {cat.description && <p className="text-sm text-gray-600 mt-1">{cat.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-2 justify-start">
                    {cat.subServices?.map((sub, subIdx) => (
                      <span
                        key={subIdx}
                        className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-500 hover:text-white transition-colors"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                  {technician.pricing?.hourlyRate > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      <DollarSign className="w-3 h-3 inline" /> KES {technician.pricing.hourlyRate}/hour
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No services listed</p>
          )}
        </div>

        {/* ─── PORTFOLIO ──────────────────────────────────────── */}
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
                    <a href={cldImage(item.mediaUrl, VIEWER_WIDTH)} target="_blank" rel="noopener noreferrer">
                      <img
                        src={cldImage(item.mediaUrl, CARD_WIDTH)}
                        alt={item.title || 'Portfolio item'}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    </a>
                  )}
                  {item.mediaType === 'video' && (
                    <video
                      src={item.mediaUrl}
                      poster={cldVideoPoster(item.mediaUrl, CARD_WIDTH)}
                      className="w-full h-40 object-cover"
                      preload="none"
                      controls
                    />
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

        {/* ─── LOCATION ──────────────────────────────────────── */}
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
            {technician.serviceRadius && (
              <p className="text-sm text-green-600 mt-2">Service radius: {technician.serviceRadius} km</p>
            )}
          </div>
        </div>

        {/* ─── LANGUAGES ────────────────────────────────────── */}
        {technician.languages?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Languages className="w-5 h-5 text-green-600" />
              Languages
            </h2>
            <div className="flex flex-wrap gap-2 justify-start">
              {technician.languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-green-500 hover:text-white transition-colors"
                >
                  {lang.name} {lang.proficiency && `(${lang.proficiency})`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── VERIFICATION BADGE ───────────────────────────── */}
        {technician.verificationStatus === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Verified Professional</p>
              <p className="text-sm text-green-700">This {termOne} has been verified by Webafix</p>
            </div>
          </div>
        )}

        {/* ─── CV ───────────────────────────────────────────── */}
        {/^https:\/\//.test(technician.cv?.url || '') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-wrap items-center gap-4">
            <FileText className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <h2 className="text-xl font-bold text-gray-800">CV</h2>
              <p className="text-sm text-gray-500 truncate">{technician.cv.fileName || 'Curriculum vitae'}</p>
            </div>
            <a
              href={technician.cv.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
            >
              <ExternalLink className="w-4 h-4" /> View CV
            </a>
          </div>
        )}

        {/* ─── WORK EXPERIENCE ──────────────────────────────── */}
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
                    {formatYear(exp.startDate) ? `${formatYear(exp.startDate)} - ` : ''}
                    {exp.isCurrent ? 'Present' : formatYear(exp.endDate) ? formatYear(exp.endDate) : ''}
                  </p>
                  {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── EDUCATION ────────────────────────────────────── */}
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

        {/* ─── CERTIFICATIONS ────────────────────────────────── */}
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
                    {cert.verified && <span className="ml-2 text-green-600">✓ Verified</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── BOOKING MODAL ───────────────────────────────────── */}
      {showBookingModal && (
        <BookFundiModal
          technicianId={technician._id}
          fundiName={technician.userId?.firstName || `this ${termOne}`}
          expertTerm={termOne}
          serviceCategories={technician.serviceCategories || []}
          presetCategory={presetCategory}
          presetSubService={presetSubService}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {/* ─── RATING MODAL ────────────────────────────────────── */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Rate This {termOne}</h2>
              <button
                onClick={closeRatingModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={ratingLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRatingSubmit} className="p-5 space-y-4">
              {ratingSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Rating submitted successfully! Thank you.</span>
                </div>
              )}

              {ratingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{ratingError}</span>
                </div>
              )}

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      className="text-4xl focus:outline-none transition-colors"
                    >
                      <span
                        className={`${
                          star <= ratingForm.rating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {ratingForm.rating === 0
                    ? 'Click a star to rate'
                    : `You selected ${ratingForm.rating} star${ratingForm.rating > 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Review */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={ratingForm.review}
                  onChange={(e) => setRatingForm((prev) => ({ ...prev, review: e.target.value }))}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-24 resize-y"
                  placeholder={`Share your experience with this ${termOne}...`}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={ratingLoading || ratingSuccess}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {ratingLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : ratingSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    Thank You!
                  </>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianProfile;