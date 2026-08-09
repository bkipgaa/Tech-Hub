// Import React and the useState hook for managing component state
import React, { useState } from 'react';
// Import the useAuth hook from your auth context to access user data and update function
import { useAuth } from '../context/AuthContext';
// Import useNavigate from react-router-dom for redirecting if user is not logged in
import { useNavigate } from 'react-router-dom';
// Import icon components from lucide-react for the UI
import { User, Mail, Phone, Camera, Save, Loader2 } from 'lucide-react';
// Import your configured axios instance that has baseURL and auth headers set up
import api from '../services/api';

// Define the Profile functional component
const Profile = () => {
  // Destructure user data and the profile update function from auth context
  const { user, updateUserProfile } = useAuth();
  // Initialize the navigate function for programmatic routing
  const navigate = useNavigate();
  // State to track whether the user is currently in edit mode
  const [isEditing, setIsEditing] = useState(false);
  // State to hold all form field values, pre-filled with existing user data
  const [formData, setFormData] = useState({
    // Set firstName from user object, or empty string if not available yet
    firstName: user?.firstName || '',
    // Set lastName from user object, or empty string if not available yet
    lastName: user?.lastName || '',
    // Set email from user object, or empty string if not available yet
    email: user?.email || '',
    // Set phone from user object, or empty string if not available yet
    phone: user?.phone || '',
    // Set profileImage from user object, or empty string if not available yet
    profileImage: user?.profileImage || ''
  });
  // State to track loading status when saving the entire profile form
  const [loading, setLoading] = useState(false);
  // State to track loading status when uploading the profile image to Cloudinary
  const [uploadingImage, setUploadingImage] = useState(false);
  // State to store any error message from the image upload process
  const [imageError, setImageError] = useState('');

  // If no user is logged in, redirect to the login page immediately
  if (!user) {
    // Navigate to the login route
    navigate('/login');
    // Return null so nothing renders while redirecting
    return null;
  }

  // Handler for text input changes (firstName, lastName, email, phone)
  const handleChange = (e) => {
    // Update formData state by spreading existing values and updating the changed field
    setFormData({
      // Spread all existing formData properties to preserve them
      ...formData,
      // Use the input's name attribute as the key and its current value
      [e.target.name]: e.target.value
    });
  };

  // Handler for uploading the profile image to Cloudinary via your backend API
  const handleImageUpload = async (e) => {
    // Get the first selected file from the file input element
    const file = e.target.files[0];
    // If no file was selected (user cancelled), exit the function early
    if (!file) return;

    // Check if the selected file exceeds 5MB (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      // Set an error message if the file is too large
      setImageError('Image must be less than 5MB');
      // Exit the function — do not proceed with upload
      return;
    }

    // Set uploadingImage to true to show the loading spinner on the UI
    setUploadingImage(true);
    // Clear any previous image upload error messages
    setImageError('');
    // Create a new FormData object to send the file as multipart/form-data
    const uploadData = new FormData();
    // Append the file to FormData with the key 'image' (must match backend field name)
    uploadData.append('image', file);

    // Wrap the API call in a try-catch block to handle network or server errors
    try {
      // Send POST request to the backend upload endpoint using the axios instance
      const res = await api.post('/upload/profile-image', uploadData, {
        // Override the Content-Type header so the browser sets the correct multipart boundary
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Check if the backend responded with success flag set to true
      if (res.data.success) {
        // Update formData with the Cloudinary image URL returned from the server
        setFormData(prev => ({
          // Spread all previous formData values to keep other fields intact
          ...prev,
          // Set profileImage to the Cloudinary URL from the response
          profileImage: res.data.imageUrl
        }));
      }
    } catch (err) {
      // Log the full error to the browser console for debugging
      console.error('Profile image upload error:', err);
      // Set a user-friendly error message from the server response or a generic fallback
      setImageError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      // Whether the upload succeeded or failed, stop the loading spinner
      setUploadingImage(false);
    }
  };

  // Handler for submitting the entire profile form
  const handleSubmit = async (e) => {
    // Prevent the browser's default form submission (page reload)
    e.preventDefault();
    // Set the main form loading state to true to disable the save button
    setLoading(true);
    // Call the context function to send updated formData to the backend
    const result = await updateUserProfile(formData);
    // Set loading back to false now that the API call is complete
    setLoading(false);
    // If the update was successful, switch back to view (non-edit) mode
    if (result.success) {
      setIsEditing(false);
    }
  };

  // Return the JSX markup for the profile page
  return (
    // Outer container: centers content, sets max width, adds vertical padding
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Main card container: white background, rounded corners, shadow */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header banner: gradient background, padding, white text */}
        <div className="bg-gradient-to-r from-green-600 to-red-600 px-6 py-8">
          {/* Page title: large, bold, white */}
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          {/* Subtitle: smaller, light green tint */}
          <p className="text-green-100">Manage your account information</p>
        </div>

        {/* Main content area: padding on all sides */}
        <div className="p-8">
          {/* Flex container: stacks vertically on mobile, side-by-side on medium+ screens */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column: profile image card, takes 1/3 width on medium+ screens */}
            <div className="md:w-1/3">
              {/* Green-tinted card for the avatar section, centered text, rounded, padded */}
              <div className="bg-green-50 rounded-xl p-6 text-center">
                {/* Relative positioning container so the camera button can overlay absolutely */}
                <div className="relative inline-block">
                  {/* If a profile image URL exists, render the actual image */}
                  {formData.profileImage ? (
                    <img 
                      // Source is the Cloudinary URL stored in formData
                      src={formData.profileImage} 
                      // Alt text for accessibility
                      alt="Profile"
                      // Fixed size, circular crop, object-cover prevents distortion, green border
                      className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
                    />
                  ) : (
                    // If no image exists, show a gradient circle with user initials
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-600 to-red-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white">
                      {/* Display first initial of firstName and lastName */}
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                  )}
                  {/* Camera upload button: only visible when in edit mode */}
                  {isEditing && (
                    // Label acts as a styled button; clicking it triggers the hidden file input
                    <label className={`absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer border-2 border-green-500 ${uploadingImage ? 'opacity-50' : ''}`}>
                      {/* If uploading, show a spinning loader icon; otherwise show camera icon */}
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-green-600" />
                      )}
                      {/* Hidden file input: accepts only images, triggers handleImageUpload on change */}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
                {/* Display user's full name below the avatar */}
                <h2 className="text-xl font-bold text-gray-800 mt-4">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </h2>
                {/* Display user's role (e.g., technician, client) in green, capitalized */}
                <p className="text-green-600 font-medium capitalize">{user.role}</p>
                {/* Show membership date formatted to local string */}
                <p className="text-sm text-gray-500 mt-2">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                {/* Display any image upload error message in red */}
                {imageError && (
                  <p className="text-red-500 text-xs mt-2">{imageError}</p>
                )}
              </div>
            </div>

            {/* Right column: profile details form, takes 2/3 width on medium+ screens */}
            <div className="md:w-2/3">
              {/* If NOT in editing mode, show the read-only profile view */}
              {!isEditing ? (
                // View mode container with vertical spacing
                <div className="space-y-6">
                  {/* Grid layout: two columns for first and last name */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* First name display block */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600">First Name</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{user.firstName}</p>
                    </div>
                    {/* Last name display block */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Last Name</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{user.lastName}</p>
                    </div>
                  </div>
                  {/* Email display block (full width) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{user.email}</p>
                  </div>
                  {/* Phone display block (full width) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{user.phone}</p>
                  </div>
                  {/* Button to switch into edit mode */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                // If IN editing mode, render the editable form
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Grid layout for first and last name inputs */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* First name input block */}
                    <div>
                      {/* Label with User icon inline */}
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1 text-green-600" />
                        First Name
                      </label>
                      {/* Controlled input: value bound to state, onChange updates state */}
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    {/* Last name input block */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1 text-green-600" />
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email input block (full width) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1 text-green-600" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Phone input block (full width) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1 text-green-600" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Action buttons row: Save and Cancel side by side */}
                  <div className="flex space-x-4">
                    {/* Save button: submits the form, disabled while loading */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                    {/* Cancel button: exits edit mode without saving */}
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the Profile component as the default export so it can be imported elsewhere
export default Profile;