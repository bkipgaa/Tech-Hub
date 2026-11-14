/**
 * serviceBuckets.js
 * =================
 * The groups ("buckets") that main categories fall under. The Services page
 * shows the buckets first, and signup asks for a bucket before a category.
 *
 * - Technical Services keep the paid plans, commission and plan radius
 *   (utils/subscriptionPlans.js).
 * - Every other bucket is free for now: no plan, no commission, and clients
 *   within NON_TECHNICAL_FREE_RADIUS_KM can find the expert. Daily, weekly
 *   and monthly rates for these will come later.
 *
 * A category the catalog has but this file doesn't list (e.g. added by an
 * admin) is treated as technical, so it keeps the existing plan rules. Add it
 * to the right bucket here to move it.
 */

/** How far clients can find an expert in a non-technical category (free, for now) */
const NON_TECHNICAL_FREE_RADIUS_KM = 100;

/** Categories no longer offered under Services (Stays & Spaces covers property) */
const RETIRED_CATEGORIES = ['Property & Real Estate'];

const BUCKETS = [
  {
    id: 'technical',
    name: 'Technical Services',
    technical: true,
    description: 'Fundis for repairs, installations, building and tech',
    categories: [
      'IT & Networking', 'Electrical Services', 'Mechanical Services', 'Plumbing',
      'Programming & AI', 'Carpentry & Furniture', 'Painting & Decorating',
      'Welding & Fabrication', 'Automotive Repair', 'Construction & Renovation',
      'HVAC Services', 'Appliance Repair', 'Solar & Renewable Energy',
      'Phone & Electronics Repair', 'Water & Borehole Services',
      'Glass & Aluminium Works', 'Roofing & Waterproofing', 'Tiling & Flooring',
      'Gypsum & Ceiling Works', 'Fire Safety Systems', 'Gate Automation & Electric Fencing',
      'Lifts & Escalators', 'Heavy Machinery & Plant Repair', 'Office Equipment Repair',
      'Medical & Lab Equipment Repair',
    ],
  },
  {
    id: 'personal-care',
    name: 'Personal Care & Appearance',
    technical: false,
    description: 'Hair, beauty, grooming, clothing and accessories',
    categories: [
      'Hairdressing & Beauty', 'Tailoring & Fashion', 'Laundry & Dry Cleaning',
      "Barbering & Men's Grooming", 'Nails, Lashes & Brows', 'Makeup Artistry',
      'Spa & Massage', 'Skin Care & Aesthetics', 'Wigs & Hair Extensions',
      'Bridal Beauty & Styling', 'Mobile Salon (Home Visits)', 'Shoe Repair & Cobbling',
      'Sneaker & Shoe Cleaning', 'Bag & Leather Care', 'Jewellery Making & Repair',
      'Watch Repair', 'Tattoo, Henna & Body Art', 'Personal Styling & Image Consulting',
      'Embroidery & Custom Printing', 'Beadwork, Knitting & Crochet',
    ],
  },
  {
    id: 'home-property',
    name: 'Home & Property',
    technical: false,
    description: 'Cleaning, gardens, pests, moving and keeping homes safe',
    categories: [
      'Cleaning Services', 'Gardening & Landscaping', 'Pest Control & Fumigation',
      'Moving & Logistics', 'Security Services', 'Locksmith Services',
      'Handyman & Odd Jobs', 'Carpet & Upholstery Cleaning', 'Window & Facade Cleaning',
      'Disinfection & Sanitization', 'Swimming Pool Care', 'Waste Collection & Recycling',
      'Exhauster & Septic Emptying', 'Water & Gas Delivery', 'Tree Felling & Bush Clearing',
      'House Sitting & Caretaking', 'Home Organizing & Decluttering', 'Curtains & Blinds Fitting',
      'Interior Styling & Home Staging', 'Storage & Self-Storage', 'Mobile Car Wash & Detailing',
    ],
  },
  {
    id: 'health-care',
    name: 'Health, Wellness & Care',
    technical: false,
    description: 'Fitness, therapy, nursing, childcare and pets',
    categories: [
      'Health & Wellness', 'Domestic & Care Services', 'Fitness & Personal Training',
      'Yoga & Pilates', 'Physiotherapy & Rehab', 'Home Nursing', 'Elderly Care',
      'Childcare & Nannies', 'House Help & Housekeeping', 'Counselling & Mental Wellness',
      'Nutrition & Dietetics', 'Maternity & Postnatal Care', 'Disability Support',
      'Lab Tests & Home Sample Collection', 'Pharmacy & Medicine Delivery', 'Optical & Eye Care',
      'Medical Transport & Ambulance', 'Addiction & Recovery Support', 'Pet Care & Grooming',
      'Veterinary Services', 'Life Coaching',
    ],
  },
  {
    id: 'education',
    name: 'Education & Training',
    technical: false,
    description: 'Tutors, lessons, coaching and skills training',
    categories: [
      'Tutoring & Training', 'Exam Prep & Revision', 'Language Lessons', 'Music Lessons',
      'Art & Craft Classes', 'Dance Classes', 'Driving School', 'Computer & Coding Classes',
      'Special Needs Education', 'Early Childhood & Homeschooling', 'Swimming Lessons',
      'Sports Coaching', 'Professional & Business Training', 'Vocational & Trade Skills Training',
      'Cooking & Baking Classes', 'First Aid & Safety Training', 'Religious Studies',
      'Chess & Brain Games', 'Research & Thesis Guidance', 'Career Coaching & CV Help',
      'Adult Literacy',
    ],
  },
  {
    id: 'events-media',
    name: 'Events, Food & Media',
    technical: false,
    description: 'Events, catering, entertainment, photos and video',
    categories: [
      'Event Planning', 'Catering & Chefs', 'Photography & Videography', 'DJs & Sound',
      'MCs & Hosts', 'Live Bands & Musicians', 'Decor & Florists',
      'Tents, Chairs & Equipment Hire', 'Cakes & Baking', 'Bartending & Mobile Bars',
      'Ushers & Event Staff', 'Kids Party Entertainment', 'Wedding Services', 'Venue Hire',
      'Drone Coverage', 'Livestreaming & AV', 'Video Editing & Post-Production',
      'Recording Studio & Audio', 'Traditional Dancers & Cultural Troupes',
      'Food Trucks & Street Food', 'Funeral Services',
    ],
  },
  {
    id: 'business-digital',
    name: 'Business & Digital',
    technical: false,
    description: 'Marketing, design, writing, accounts and admin support',
    categories: [
      'Digital Marketing & Design', 'Graphic Design', 'Social Media Management',
      'Content Writing & Copywriting', 'Translation & Transcription', 'Virtual Assistants',
      'Data Entry & Admin Support', 'Accounting & Bookkeeping', 'Tax Filing (KRA Returns)',
      'Business Registration & Compliance', 'Legal Documentation', 'HR & Recruitment',
      'Printing & Branding', 'Branded Merchandise', 'Customer Support Outsourcing',
      'Market Research & Surveys', 'Business Consulting', 'Insurance Agents',
      'Cyber & eCitizen Services', 'Voice-Over & Audio Production', 'Video Ads & Animation',
    ],
  },
];

const key = (s) => String(s || '').trim().toLowerCase();
const bucketByCategory = new Map();
BUCKETS.forEach((b) => b.categories.forEach((c) => bucketByCategory.set(key(c), b)));

const TECHNICAL = BUCKETS[0];

/** The bucket a main category belongs to (unlisted categories count as technical) */
const bucketOf = (mainCategory) => bucketByCategory.get(key(mainCategory)) || TECHNICAL;

/** True when the category keeps the paid plans and commission */
const isTechnicalCategory = (mainCategory) => bucketOf(mainCategory).technical;

/** Every listed category, in bucket order (used to order the catalog) */
const CATEGORY_ORDER = BUCKETS.flatMap((b) => b.categories);

module.exports = {
  BUCKETS,
  CATEGORY_ORDER,
  NON_TECHNICAL_FREE_RADIUS_KM,
  RETIRED_CATEGORIES,
  bucketOf,
  isTechnicalCategory,
};
