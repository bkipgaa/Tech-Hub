import React from 'react';
import { Phone, Mail } from 'lucide-react';

/**
 * SettingsTab Component
 * Manages technician's privacy, booking, and notification settings
 * Features: Privacy toggles, booking preferences, notification channels
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.formData - Main form data containing settings
 * @param {Function} props.setFormData - Function to update form data
 * @param {boolean} props.isEditing - Whether the form is in edit mode
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {Object} props.user - User object containing contact information
 */
const SettingsTab = ({ formData, setFormData, isEditing, handleInputChange, user }) => {
  /**
   * Handle notification setting changes
   * Updates the nested notifications object
   * @param {string} type - Notification type ('email', 'sms', 'push')
   * @param {boolean} checked - New checked state
   */
  const handleNotificationChange = (type, checked) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        notifications: {
          ...formData.settings.notifications,
          [type]: checked
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Privacy Settings</h3>
        <div className="space-y-3">
          {/* Show Email Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="settings.showEmail"
              checked={formData.settings.showEmail}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              Show email address on profile
            </label>
          </div>
          
          {/* Show Phone Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="settings.showPhone"
              checked={formData.settings.showPhone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              Show phone number on profile
            </label>
          </div>
        </div>
      </div>

      {/* Booking Settings */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Booking Settings</h3>
        <div className="space-y-3">
          {/* Instant Booking Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="settings.instantBooking"
              checked={formData.settings.instantBooking}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              Allow instant booking (no approval needed)
            </label>
          </div>
          
          {/* Requires Approval Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="settings.requiresApproval"
              checked={formData.settings.requiresApproval}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              Require approval for all bookings
            </label>
          </div>
          
          {/* Auto Accept Jobs Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="settings.autoAcceptJobs"
              checked={formData.settings.autoAcceptJobs}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              Auto-accept jobs within availability
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Notification Settings</h3>
        <div className="space-y-3">
          {/* Email Notifications Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.notifications?.email}
              onChange={(e) => handleNotificationChange('email', e.target.checked)}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              Email notifications
            </label>
          </div>
          
          {/* SMS Notifications Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.notifications?.sms}
              onChange={(e) => handleNotificationChange('sms', e.target.checked)}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              SMS notifications
            </label>
          </div>
          
          {/* Push Notifications Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.notifications?.push}
              onChange={(e) => handleNotificationChange('push', e.target.checked)}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              Push notifications
            </label>
          </div>
        </div>
      </div>

      {/* Job Settings */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Job Settings</h3>
        <div className="space-y-3">
          {/* Job Reminders Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="settings.jobReminders"
              checked={formData.settings.jobReminders}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-900">
              Receive job reminders
            </label>
          </div>
        </div>
      </div>

      {/* Contact Information - Read-only from User */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Phone className="w-4 h-4 text-green-600 mr-2" />
          Contact Information
        </h3>
        <div className="space-y-2">
          <p className="flex items-center text-gray-600">
            <Mail className="w-4 h-4 mr-2 text-green-600" />
            {user?.email}
          </p>
          <p className="flex items-center text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-green-600" />
            {user?.phone}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;