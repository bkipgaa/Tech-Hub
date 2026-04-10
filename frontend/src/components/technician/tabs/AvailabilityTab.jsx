import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

/**
 * AvailabilityTab Component
 * Manages technician's weekly schedule and availability settings
 * Features: Enable/disable days, add/remove time slots, availability toggles
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.formData - Main form data containing availability
 * @param {Function} props.setFormData - Function to update form data
 * @param {boolean} props.isEditing - Whether the form is in edit mode
 * @param {Function} props.handleInputChange - Function to handle input changes
 */
const AvailabilityTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  // Array of days for mapping
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  /**
   * Update a specific day's enabled status and reset hours if disabled
   * @param {string} day - Day of the week
   * @param {boolean} enabled - Whether the day is enabled
   */
  const handleDayToggle = (day, enabled) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day],
          enabled: enabled,
          // If disabling, clear hours; if enabling, set default hours
          hours: enabled ? [{ start: '09:00', end: '17:00' }] : []
        }
      }
    });
  };

  /**
   * Update a specific time slot's start or end time
   * @param {string} day - Day of the week
   * @param {number} slotIndex - Index of the time slot
   * @param {string} field - Field to update ('start' or 'end')
   * @param {string} value - New time value
   */
  const handleTimeChange = (day, slotIndex, field, value) => {
    const updatedHours = [...formData.availability[day].hours];
    updatedHours[slotIndex] = { ...updatedHours[slotIndex], [field]: value };
    
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day],
          hours: updatedHours
        }
      }
    });
  };

  /**
   * Add a new time slot to a specific day
   * @param {string} day - Day of the week
   */
  const addTimeSlot = (day) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day],
          hours: [...formData.availability[day].hours, { start: '09:00', end: '17:00' }]
        }
      }
    });
  };

  /**
   * Remove a time slot from a specific day
   * @param {string} day - Day of the week
   * @param {number} slotIndex - Index of the time slot to remove
   */
  const removeTimeSlot = (day, slotIndex) => {
    const updatedHours = formData.availability[day].hours.filter((_, i) => i !== slotIndex);
    
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day],
          hours: updatedHours,
          // If no hours left, disable the day
          enabled: updatedHours.length > 0 ? formData.availability[day].enabled : false
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Weekly Schedule */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Weekly Availability
        </label>
        {isEditing ? (
          // Edit Mode - Interactive schedule builder
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day} className="border border-green-200 rounded-lg p-4">
                {/* Day Header with Enable/Disable Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.availability[day]?.enabled}
                      onChange={(e) => handleDayToggle(day, e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 font-medium text-gray-700 capitalize">{day}</span>
                  </label>
                </div>
                
                {/* Time Slots - Only show if day is enabled */}
                {formData.availability[day]?.enabled && (
                  <div className="space-y-2">
                    {/* Display existing time slots */}
                    {formData.availability[day]?.hours?.map((hour, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={hour.start}
                          onChange={(e) => handleTimeChange(day, idx, 'start', e.target.value)}
                          className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={hour.end}
                          onChange={(e) => handleTimeChange(day, idx, 'end', e.target.value)}
                          className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(day, idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add Time Slot Button */}
                    <button
                      type="button"
                      onClick={() => addTimeSlot(day)}
                      className="text-green-600 hover:text-green-700 text-sm flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add time slot
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // View Mode - Display schedule as grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(formData.availability).map(([day, schedule]) => (
              <div key={day} className="border border-green-200 rounded-lg p-3">
                <p className="font-medium text-gray-700 capitalize">{day}</p>
                {schedule.enabled ? (
                  // Show time slots if enabled
                  schedule.hours.map((hour, idx) => (
                    <p key={idx} className="text-sm text-gray-600">
                      {hour.start} - {hour.end}
                    </p>
                  ))
                ) : (
                  // Show unavailable if disabled
                  <p className="text-sm text-gray-400">Unavailable</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Toggles */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Currently available for work
          </label>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityTab;