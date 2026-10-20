/**
 * BookingBenefits.jsx
 * ===================
 * Explains why work should go through the booking system instead of being
 * arranged off-platform. Two versions:
 *   - audience="technician" (default): why experts should complete jobs
 *     through bookings
 *   - audience="client": why clients should request services through bookings
 */

import React from 'react';
import { Star, TrendingUp, Briefcase, ShieldCheck, FileText } from 'lucide-react';

const CONTENT = {
  technician: {
    title: 'Why complete your jobs through bookings?',
    benefits: [
      {
        icon: Star,
        title: 'Only booked jobs can be rated',
        text: 'Clients can rate you only for jobs completed through a booking. Off-platform jobs earn you no ratings.',
      },
      {
        icon: TrendingUp,
        title: 'Higher ratings, more visibility',
        text: 'Search results rank well-rated experts first, putting you above most other experts.',
      },
      {
        icon: Briefcase,
        title: 'Build your portfolio',
        text: 'Every completed booking adds to the jobs-completed count on your profile. More completed jobs also raise you in search and show clients your experience.',
      },
    ],
  },
  client: {
    title: 'Why request services through our booking system?',
    benefits: [
      {
        icon: ShieldCheck,
        title: 'Accountability',
        text: 'Every booking is recorded with Webafix, so the expert is accountable for the work they agreed to do.',
      },
      {
        icon: Star,
        title: 'Rate your expert',
        text: 'Only booked jobs can be rated. Your rating boosts good experts and their place in search, and helps other clients choose well.',
      },
      {
        icon: FileText,
        title: 'A clear record if something goes wrong',
        text: 'The quote, agreed price and payment you confirmed are saved on the booking, so you have proof if you need to raise a dispute.',
      },
    ],
  },
};

const BookingBenefits = ({ compact = false, audience = 'technician' }) => {
  const { title, benefits } = CONTENT[audience] || CONTENT.technician;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-5">
      <h2 className="text-sm md:text-base font-semibold text-green-800 mb-3">{title}</h2>
      <ul className={`grid gap-3 ${compact ? '' : 'md:grid-cols-3'}`}>
        {benefits.map(({ icon: Icon, title: benefitTitle, text }) => (
          <li key={benefitTitle} className="flex gap-3">
            <Icon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">{benefitTitle}</p>
              <p className="text-xs text-gray-600 mt-0.5">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingBenefits;
