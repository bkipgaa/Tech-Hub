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
 * @author Weba-Hub Team
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Wrench,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Award,
  Languages,
  CheckCircle,
  MessageCircle,
  PhoneCall,
  Briefcase,
  BookOpen,
  BadgeCheck,
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

  // ─── LOCAL STATE ───────────────────────────────────────────
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContact, setShowContact] = useState(false);

  // ─── BOOKING STATE ─────────────────────────────────────────
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    serviceCategory: '',
    subService: '',
    serviceDescription: '',
    estimatedHours: 1,
    preferredDate: '',
    preferredTime: '',
    location: { address: '' },
    clientNotes: '',
    paymentMethod: 'cash',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

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
      let errorMsg = 'Could not load technician profile. ';
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
      // Only check if user is logged in (check for token)
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/bookings/my-bookings?status=completed&limit=50');
      if (response.data.success) {
        const bookings = response.data.data || [];
        // Find a completed booking with this technician
        const completed = bookings.find(
          (b) => b.technicianId?._id === technician._id || b.technicianId === technician._id
        );
        if (completed) {
          setHasCompletedBooking(true);
          setCompletedBookingId(completed._id);
          // Check if already rated
          if (completed.clientRating) {
            setHasRated(true);
          }
        }
      }
    } catch (err) {
      // Silently fail – user may not be authenticated or no bookings
      console.warn('Could not check completed bookings:', err.message);
    }
  };

  /**
   * handleContact()
   * ---------------
   * Toggles the contact information panel (phone/email).
   */
  const handleContact = () => {
    setShowContact((prev) => !prev);
  };

  /**
   * handleGoBack()
   * --------------
   * Navigates to the previous page in browser history.
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  /**
   * handleMessage()
   * ---------------
   * Starts a new conversation with the technician.
   * Creates a chat thread and navigates to it.
   */
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

  // ─── BOOKING FUNCTIONS ──────────────────────────────────────

  /**
   * openBookingModal()
   * ------------------
   * Opens the booking modal and pre-fills the form with the
   * technician's first service category and sub-service if available.
   */
  const openBookingModal = () => {
    // Pre-fill from first service category
    if (technician.serviceCategories && technician.serviceCategories.length > 0) {
      const firstCat = technician.serviceCategories[0];
      setBookingForm((prev) => ({
        ...prev,
        serviceCategory: firstCat.categoryName || '',
        subService: firstCat.subServices?.[0] || '',
        serviceDescription: firstCat.description || '',
      }));
    }
    setShowBookingModal(true);
    setBookingError('');
    setBookingSuccess(false);
  };

  /**
   * closeBookingModal()
   * -------------------
   * Closes the booking modal and resets form state.
   */
  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingError('');
    setBookingLoading(false);
  };

  /**
   * handleBookingInputChange()
   * --------------------------
   * Updates booking form state for text inputs.
   */
  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'address') {
      setBookingForm((prev) => ({
        ...prev,
        location: { ...prev.location, address: value },
      }));
    } else {
      setBookingForm((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error when user types
    if (bookingError) setBookingError('');
  };

  /**
   * handleBookingSubmit()
   * ---------------------
   * Submits the booking to the backend.
   * Validates required fields, handles loading state,
   * and shows success/error feedback.
   */
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const {
      serviceCategory,
      subService,
      serviceDescription,
      estimatedHours,
      preferredDate,
      preferredTime,
      location,
      clientNotes,
      paymentMethod,
    } = bookingForm;

    // Validate required fields
    if (!serviceCategory || !subService || !serviceDescription) {
      setBookingError('Please select a service and provide a description.');
      return;
    }
    if (!preferredDate) {
      setBookingError('Please select a preferred date.');
      return;
    }
    if (!preferredTime) {
      setBookingError('Please select a preferred time.');
      return;
    }
    if (!location.address || location.address.trim() === '') {
      setBookingError('Please provide your address.');
      return;
    }

    // Validate future date
    const selectedDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setBookingError('Preferred date must be today or in the future.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const payload = {
        technicianId: technician._id,
        serviceCategory,
        subService,
        serviceDescription,
        hourlyRate: technician.pricing?.hourlyRate || 0,
        estimatedHours: parseFloat(estimatedHours) || 1,
        preferredDate,
        preferredTime,
        duration: parseFloat(estimatedHours) || 1,
        location: { address: location.address },
        clientNotes: clientNotes || '',
        paymentMethod: paymentMethod || 'cash',
      };

      const response = await api.post('/bookings', payload);

      if (response.data.success) {
        setBookingSuccess(true);
        // Close modal after a delay to show success
        setTimeout(() => {
          closeBookingModal();
          // Navigate to bookings page or stay on profile
          navigate('/bookings');
        }, 2000);
      } else {
        setBookingError(response.data.message || 'Failed to create booking.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      let errorMsg = 'Failed to create booking. ';
      if (err.response) {
        errorMsg += err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMsg += 'No response from server. Check your connection.';
      } else {
        errorMsg += err.message || 'An unexpected error occurred.';
      }
      setBookingError(errorMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  // ─── RATING FUNCTIONS ───────────────────────────────────────

  /**
   * openRatingModal()
   * -----------------
   * Opens the rating modal and resets previous state.
   */
  const openRatingModal = () => {
    setShowRatingModal(true);
    setRatingForm({ rating: 0, review: '' });
    setRatingError('');
    setRatingSuccess(false);
  };

  /**
   * closeRatingModal()
   * ------------------
   * Closes the rating modal.
   */
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingLoading(false);
    setRatingError('');
  };

  /**
   * handleRatingSubmit()
   * --------------------
   * Submits the rating to the backend.
   * Validates star selection and review content.
   * On success, updates the technician's rating and the booking.
   */
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
        // Update the technician's rating display optimistically
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
        // Close modal after success
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

  /**
   * handleStarClick()
   * -----------------
   * Sets the rating when a user clicks on a star.
   */
  const handleStarClick = (starValue) => {
    setRatingForm((prev) => ({ ...prev, rating: starValue }));
    if (ratingError) setRatingError('');
  };

  /**
   * formatYear()
   * ------------
   * Safely extracts a 4-digit year from an ISO date string.
   */
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
            <p className="font-medium">{error || 'Technician not found'}</p>
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
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

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
                    src={technician.userId.profileImage}
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
                </div>

                {/* Action Buttons: Contact, Message, Book */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={handleContact}
                    className="bg-white text-green-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium shadow-sm"
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
                  {isLoggedIn && (
                    <button
                      onClick={openBookingModal}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Book Service
                    </button>
                  )}
                  {isLoggedIn && hasCompletedBooking && !hasRated && (
                    <button
                      onClick={openRatingModal}
                      className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    >
                      <Star className="w-4 h-4 fill-current" />
                      Rate This Technician
                    </button>
                  )}
                </div>

                {/* Contact info panel */}
                {showContact && (
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">Contact Information:</p>
                    <div className="space-y-2">
                      {technician.settings?.showPhone && technician.userId?.phone && (
                        <div className="flex items-center gap-2 text-gray-800">
                          <Phone className="w-4 h-4 text-green-600" />
                          <a href={`tel:${technician.userId.phone}`} className="hover:text-green-600 transition-colors">
                            {technician.userId.phone}
                          </a>
                        </div>
                      )}
                      {technician.settings?.showEmail && technician.userId?.email && (
                        <div className="flex items-center gap-2 text-gray-800">
                          <Mail className="w-4 h-4 text-green-600" />
                          <a href={`mailto:${technician.userId.email}`} className="hover:text-green-600 transition-colors">
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
                  {/* Hourly rate if available */}
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
                    <img
                      src={item.mediaUrl}
                      alt={item.title || 'Portfolio item'}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  )}
                  {item.mediaType === 'video' && (
                    <video src={item.mediaUrl} className="w-full h-40 object-cover" preload="metadata" />
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
              <p className="text-sm text-green-700">This technician has been verified by WeBA-Hub</p>
            </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Book Service</h2>
              <button
                onClick={closeBookingModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={bookingLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBookingSubmit} className="p-5 space-y-4">
              {/* Success Message */}
              {bookingSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Booking created successfully! Redirecting...</span>
                </div>
              )}

              {/* Error Message */}
              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{bookingError}</span>
                </div>
              )}

              {/* Service Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceCategory"
                  value={bookingForm.serviceCategory}
                  onChange={handleBookingInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {technician.serviceCategories?.map((cat, idx) => (
                    <option key={idx} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Service <span className="text-red-500">*</span>
                </label>
                <select
                  name="subService"
                  value={bookingForm.subService}
                  onChange={handleBookingInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a sub-service</option>
                  {technician.serviceCategories
                    ?.find((cat) => cat.categoryName === bookingForm.serviceCategory)
                    ?.subServices?.map((sub, idx) => (
                      <option key={idx} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>
              </div>

              {/* Service Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="serviceDescription"
                  value={bookingForm.serviceDescription}
                  onChange={handleBookingInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-20 resize-y"
                  placeholder="Describe the work you need done..."
                  required
                />
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={bookingForm.estimatedHours}
                  onChange={handleBookingInputChange}
                  min="0.5"
                  step="0.5"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Rate: KES {technician.pricing?.hourlyRate || 0}/hour
                </p>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="preferredDate"
                  value={bookingForm.preferredDate}
                  onChange={handleBookingInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="preferredTime"
                  value={bookingForm.preferredTime}
                  onChange={handleBookingInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={bookingForm.location.address}
                  onChange={handleBookingInputChange}
                  placeholder="e.g., 123 Main St, Nairobi"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  name="clientNotes"
                  value={bookingForm.clientNotes}
                  onChange={handleBookingInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-16 resize-y"
                  placeholder="Any special instructions..."
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={bookingForm.paymentMethod}
                  onChange={handleBookingInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                  <option value="bank-transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingLoading || bookingSuccess}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Booking...
                  </>
                ) : bookingSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    Booking Created!
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── RATING MODAL ────────────────────────────────────── */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Rate This Technician</h2>
              <button
                onClick={closeRatingModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={ratingLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRatingSubmit} className="p-5 space-y-4">
              {/* Success Message */}
              {ratingSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Rating submitted successfully! Thank you.</span>
                </div>
              )}

              {/* Error Message */}
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
                  placeholder="Share your experience with this technician..."
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