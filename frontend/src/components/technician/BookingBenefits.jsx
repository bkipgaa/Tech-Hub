/**
 * BookingBenefits.jsx
 * ===================
 * Explains to technicians why they should complete jobs through the
 * booking system instead of arranging them off-platform.
 */

import React from 'react';
import { Star, TrendingUp, Briefcase } from 'lucide-react';

const BENEFITS = [
  {
    icon: Star,
    title: 'Only booked jobs can be rated',
    text: 'Clients can rate you only for jobs completed through a booking. Off-platform jobs earn you no ratings.',
  },
  {
    icon: TrendingUp,
    title: 'Higher ratings, more visibility',
    text: 'Clients see your rating, and when they sort by rating, top-rated technicians appear first.',
  },
  {
    icon: Briefcase,
    title: 'Build your portfolio',
    text: 'Every completed booking adds to your jobs-completed count, building a track record that shows clients your experience.',
  },
];

const BookingBenefits = ({ compact = false }) => (
  <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-5">
    <h2 className="text-sm md:text-base font-semibold text-green-800 mb-3">
      Why complete your jobs through bookings?
    </h2>
    <ul className={`grid gap-3 ${compact ? '' : 'md:grid-cols-3'}`}>
      {BENEFITS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-3">
          <Icon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-800">{title}</p>
            <p className="text-xs text-gray-600 mt-0.5">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default BookingBenefits;
