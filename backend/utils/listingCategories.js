/**
 * listingCategories.js
 * ====================
 * Businesses: the groups and types of business or place that can be listed.
 *
 * Each group has:
 *   kind       stay  – somewhere to sleep or rent (priced per night / month)
 *              place – somewhere to go (entry fee)
 *              shop  – a business that sells products or services; no single
 *                      price, it lists its products instead, and its exact
 *                      location is shown so customers can find it
 *   priceUnit  night | month | entry | none
 *   services   service main categories (data/serviceBuckets.js) this group
 *              goes with, e.g. Hardware ↔ Plumbing. Used both ways: a business
 *              page links to those experts, a service page shows these businesses.
 *
 * The ids of the first four groups and their types are stored on existing
 * listings, so they must not change. The frontend has a matching copy in
 * src/utils/listingCategories.js.
 */

const LISTING_GROUPS = [
  {
    id: 'short_stays',
    name: 'Stays & Accommodation',
    kind: 'stay',
    priceUnit: 'night',
    services: ['Cleaning Services', 'Catering & Chefs', 'Security Services', 'Laundry & Dry Cleaning', 'Swimming Pool Care'],
    categories: [
      { id: 'airbnb', name: 'Airbnbs & serviced apartments' },
      { id: 'guest_house', name: 'Guest houses & lodges' },
      { id: 'hotel', name: 'Hotels' },
      { id: 'resort', name: 'Resorts & camps' },
      { id: 'holiday_home', name: 'Holiday homes & villas' },
    ],
  },
  {
    id: 'rentals',
    name: 'Houses for Rent',
    kind: 'stay',
    priceUnit: 'month',
    services: ['Moving & Logistics', 'Cleaning Services', 'Pest Control & Fumigation', 'Locksmith Services', 'Plumbing', 'Electrical Services'],
    categories: [
      { id: 'house_rent', name: 'Houses & apartments for rent' },
      { id: 'hostel', name: 'Hostels & student rooms' },
    ],
  },
  {
    id: 'business',
    name: 'Offices & Shops to Let',
    kind: 'stay',
    priceUnit: 'month',
    services: ['Moving & Logistics', 'IT & Networking', 'Construction & Renovation', 'Security Services', 'Cleaning Services'],
    categories: [
      { id: 'office', name: 'Offices & co-working' },
      { id: 'shop', name: 'Shops & commercial spaces' },
      { id: 'warehouse', name: 'Warehouses & yards' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment & Leisure',
    kind: 'place',
    priceUnit: 'entry', // entry or cover charge; 0 means free entry
    services: ['DJs & Sound', 'Live Bands & Musicians', 'Event Planning', 'Venue Hire', 'Fitness & Personal Training', 'Swimming Lessons'],
    categories: [
      { id: 'club', name: 'Clubs & lounges' },
      { id: 'bar', name: 'Bars & pubs' },
      { id: 'casino', name: 'Casinos & betting lounges' },
      { id: 'live_music', name: 'Live music & karaoke' },
      { id: 'gaming', name: 'Gaming & arcades' },
      { id: 'event_venue', name: 'Event venues & gardens' },
      { id: 'gym', name: 'Gyms & fitness centres' },
      { id: 'swimming_pool', name: 'Swimming pools' },
      { id: 'cinema', name: 'Cinemas' },
    ],
  },
  {
    id: 'hardware',
    name: 'Hardware & Building Supplies',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Plumbing', 'Electrical Services', 'Construction & Renovation', 'Painting & Decorating', 'Welding & Fabrication',
      'Roofing & Waterproofing', 'Tiling & Flooring', 'Carpentry & Furniture', 'Gypsum & Ceiling Works',
      'Glass & Aluminium Works', 'Solar & Renewable Energy', 'Water & Borehole Services',
    ],
    categories: [
      { id: 'hardware_store', name: 'Hardware stores' },
      { id: 'building_materials', name: 'Cement & building materials' },
      { id: 'plumbing_supplies', name: 'Plumbing materials & pipes' },
      { id: 'electrical_supplies', name: 'Electrical supplies' },
      { id: 'paint_shop', name: 'Paint & finishes' },
      { id: 'timber_roofing', name: 'Timber & roofing' },
      { id: 'tiles_sanitary', name: 'Tiles & sanitary ware' },
      { id: 'steel_supplies', name: 'Steel & welding supplies' },
      { id: 'solar_shop', name: 'Solar & batteries' },
      { id: 'tool_hire', name: 'Tool & equipment hire' },
    ],
  },
  {
    id: 'electronics',
    name: 'Phones, Computers & Electronics',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Phone & Electronics Repair', 'IT & Networking', 'Programming & AI', 'Office Equipment Repair',
      'Gate Automation & Electric Fencing', 'Appliance Repair', 'Computer & Coding Classes',
    ],
    categories: [
      { id: 'phone_shop', name: 'Phone shops' },
      { id: 'phone_parts', name: 'Phone spare parts & accessories' },
      { id: 'computer_shop', name: 'Computers & laptops' },
      { id: 'computer_parts', name: 'Computer parts & accessories' },
      { id: 'networking_equipment', name: 'Networking equipment' },
      { id: 'cctv_shop', name: 'CCTV & security systems' },
      { id: 'tv_sound', name: 'TVs & sound systems' },
      { id: 'office_machines', name: 'Printers & office machines' },
      { id: 'gaming_shop', name: 'Gaming consoles & games' },
    ],
  },
  {
    id: 'home_living',
    name: 'Home & Living',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Appliance Repair', 'Carpentry & Furniture', 'Curtains & Blinds Fitting', 'Interior Styling & Home Staging',
      'Gardening & Landscaping', 'Water & Gas Delivery', 'HVAC Services', 'Moving & Logistics',
    ],
    categories: [
      { id: 'appliance_shop', name: 'Home appliances' },
      { id: 'furniture_shop', name: 'Furniture' },
      { id: 'mattress_shop', name: 'Beds & mattresses' },
      { id: 'kitchenware', name: 'Kitchenware' },
      { id: 'decor_curtains', name: 'Curtains & décor' },
      { id: 'gas_refill', name: 'Gas refill' },
      { id: 'water_refill', name: 'Water refill' },
      { id: 'plant_nursery', name: 'Garden & plant nurseries' },
    ],
  },
  {
    id: 'fashion_beauty',
    name: 'Fashion & Beauty',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Tailoring & Fashion', 'Hairdressing & Beauty', "Barbering & Men's Grooming", 'Wigs & Hair Extensions',
      'Makeup Artistry', 'Nails, Lashes & Brows', 'Jewellery Making & Repair', 'Shoe Repair & Cobbling', 'Watch Repair',
      'Personal Styling & Image Consulting',
    ],
    categories: [
      { id: 'boutique', name: 'Boutiques & clothing' },
      { id: 'shoe_shop', name: 'Shoe shops' },
      { id: 'cosmetics_shop', name: 'Cosmetics & beauty shops' },
      { id: 'salon_supplies', name: 'Salon & barber supplies' },
      { id: 'wig_shop', name: 'Wigs & hair products' },
      { id: 'jewellery_shop', name: 'Jewellery & watches' },
      { id: 'fabric_shop', name: 'Fabric shops' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Pharmacy',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Pharmacy & Medicine Delivery', 'Optical & Eye Care', 'Lab Tests & Home Sample Collection', 'Home Nursing',
      'Physiotherapy & Rehab', 'Medical Transport & Ambulance', 'Maternity & Postnatal Care',
      'Medical & Lab Equipment Repair', 'Veterinary Services',
    ],
    categories: [
      { id: 'pharmacy', name: 'Pharmacies & chemists' },
      { id: 'hospital', name: 'Hospitals' },
      { id: 'clinic', name: 'Clinics & medical centres' },
      { id: 'dental_clinic', name: 'Dental clinics' },
      { id: 'optician', name: 'Opticians' },
      { id: 'medical_lab', name: 'Labs & diagnostics' },
      { id: 'medical_supplies', name: 'Medical supplies' },
      { id: 'vet_clinic', name: 'Vet clinics' },
    ],
  },
  {
    id: 'food_drinks',
    name: 'Food & Drinks',
    kind: 'shop',
    priceUnit: 'none',
    services: ['Catering & Chefs', 'Cakes & Baking', 'Bartending & Mobile Bars', 'Food Trucks & Street Food', 'Event Planning', 'Cooking & Baking Classes'],
    categories: [
      { id: 'restaurant', name: 'Restaurants & cafés' },
      { id: 'food_delivery', name: 'Online food delivery' },
      { id: 'fast_food', name: 'Fast food' },
      { id: 'bakery', name: 'Bakeries & cakes' },
      { id: 'supermarket', name: 'Supermarkets & groceries' },
      { id: 'butchery', name: 'Butcheries' },
      { id: 'wines_spirits', name: 'Wines & spirits' },
      { id: 'drinks_distributor', name: 'Water & drinks distributors' },
    ],
  },
  {
    id: 'schools',
    name: 'Schools & Learning',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Tutoring & Training', 'Exam Prep & Revision', 'Early Childhood & Homeschooling', 'Driving School',
      'Computer & Coding Classes', 'Vocational & Trade Skills Training', 'Language Lessons', 'Music Lessons',
    ],
    categories: [
      { id: 'school', name: 'Schools' },
      { id: 'college', name: 'Colleges & training centres' },
      { id: 'daycare', name: 'Daycares & kindergartens' },
      { id: 'driving_school', name: 'Driving schools' },
      { id: 'bookshop', name: 'Bookshops & stationery' },
      { id: 'toy_shop', name: 'Toy shops' },
    ],
  },
  {
    id: 'auto',
    name: 'Auto & Transport',
    kind: 'shop',
    priceUnit: 'none',
    services: ['Automotive Repair', 'Mechanical Services', 'Mobile Car Wash & Detailing', 'Heavy Machinery & Plant Repair', 'Driving School'],
    categories: [
      { id: 'car_parts', name: 'Car spare parts' },
      { id: 'tyres_batteries', name: 'Tyres & batteries' },
      { id: 'car_wash', name: 'Car wash' },
      { id: 'car_hire', name: 'Car hire' },
      { id: 'motorbike_shop', name: 'Motorbike dealers & parts' },
      { id: 'petrol_station', name: 'Petrol stations' },
    ],
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    kind: 'shop',
    priceUnit: 'none',
    services: ['Veterinary Services', 'Water & Borehole Services', 'Gardening & Landscaping', 'Pet Care & Grooming', 'Solar & Renewable Energy'],
    categories: [
      { id: 'agrovet', name: 'Agrovets' },
      { id: 'animal_feeds', name: 'Animal feeds' },
      { id: 'seeds_fertiliser', name: 'Seeds & fertilisers' },
      { id: 'farm_equipment', name: 'Farm tools & equipment' },
    ],
  },
  {
    id: 'business_office',
    name: 'Business & Office',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Printing & Branding', 'Branded Merchandise', 'Cyber & eCitizen Services', 'Graphic Design',
      'Office Equipment Repair', 'Business Registration & Compliance', 'Accounting & Bookkeeping',
    ],
    categories: [
      { id: 'printing_shop', name: 'Printing & branding shops' },
      { id: 'office_supplies', name: 'Office supplies' },
      { id: 'cyber_cafe', name: 'Cyber cafés' },
      { id: 'mpesa_agent', name: 'M-Pesa & agent shops' },
      { id: 'courier', name: 'Courier & parcel services' },
    ],
  },
];

// Unit sizes for houses and apartments
const PROPERTY_TYPES = ['bedsitter', 'studio', '1br', '2br', '3br', '4br_plus', 'bungalow', 'maisonette', 'room', 'other'];

const AMENITIES = [
  'wifi', 'parking', 'water_24h', 'backup_power', 'security', 'cctv', 'furnished',
  'kitchen', 'hot_shower', 'tv', 'pool', 'gym', 'lift', 'balcony', 'garden',
  'pets_allowed', 'breakfast', 'conference_room', 'air_conditioning', 'laundry',
  // entertainment
  'live_music', 'dj', 'food', 'outdoor_seating', 'vip_area', 'sports_screens', 'dance_floor', 'card_payments',
  // shops
  'delivery', 'open_24h', 'wheelchair_access', 'wholesale', 'installation', 'warranty',
];

const CATEGORY_IDS = LISTING_GROUPS.flatMap((g) => g.categories.map((c) => c.id));

const groupFor = (categoryId) => LISTING_GROUPS.find((g) => g.categories.some((c) => c.id === categoryId));

const priceUnitFor = (categoryId) => groupFor(categoryId)?.priceUnit || 'month';

const isShopCategory = (categoryId) => groupFor(categoryId)?.kind === 'shop';

/** Business groups that go with a service main category, e.g. Plumbing → Hardware */
const groupsForService = (mainCategory) => LISTING_GROUPS.filter((g) => g.services.includes(mainCategory));

module.exports = {
  LISTING_GROUPS, PROPERTY_TYPES, AMENITIES, CATEGORY_IDS, groupFor, priceUnitFor, isShopCategory, groupsForService,
};

// Kenya's 47 counties; towns and estates under them are added by listers
const COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu',
  'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru',
  'Migori', 'Mombasa', "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

module.exports.COUNTIES = COUNTIES;
