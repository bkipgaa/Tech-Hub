import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone } from 'lucide-react';

const BookService = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle booking submission
    console.log('Booking submitted:', formData);
    alert('Booking submitted successfully!');
  };

  return (
    <div className="py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-green-700 mb-8 text-center">Book a Service</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-600" />
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

          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600" />
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

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Select Service</label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
            >
              <option value="">Choose a service</option>
              <option value="web-dev">Web Development</option>
              <option value="ui-ux">UI/UX Design</option>
              <option value="digital-marketing">Digital Marketing</option>
              <option value="mobile-dev">Mobile Development</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                Preferred Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                Preferred Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none"
              placeholder="Tell us more about your project..."
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-red-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 text-lg"
          >
            Confirm Booking
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookService;