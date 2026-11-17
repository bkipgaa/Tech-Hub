/**
 * listingCategories.js
 * ====================
 * Businesses: groups, types of business and labels. Mirrors
 * backend/utils/listingCategories.js (the backend is the source of truth for
 * which ids are valid; see it for what kind, priceUnit and services mean).
 */

export const LISTING_GROUPS = [
  {
    id: 'short_stays',
    name: 'Stays & Accommodation',
    blurb: 'Book a night, a weekend or a few weeks',
    kind: 'stay',
    priceUnit: 'night',
    services: [
      'Cleaning Services',
      'Catering & Chefs',
      'Security Services',
      'Laundry & Dry Cleaning',
      'Swimming Pool Care'
    ],
    categories: [
      {
        id: 'airbnb',
        name: 'Airbnbs & serviced apartments'
      },
      {
        id: 'guest_house',
        name: 'Guest houses & lodges'
      },
      {
        id: 'hotel',
        name: 'Hotels'
      },
      {
        id: 'resort',
        name: 'Resorts & camps'
      },
      {
        id: 'holiday_home',
        name: 'Holiday homes & villas'
      }
    ]
  },
  {
    id: 'rentals',
    name: 'Houses for Rent',
    blurb: 'Find your next home',
    kind: 'stay',
    priceUnit: 'month',
    services: [
      'Moving & Logistics',
      'Cleaning Services',
      'Pest Control & Fumigation',
      'Locksmith Services',
      'Plumbing',
      'Electrical Services'
    ],
    categories: [
      {
        id: 'house_rent',
        name: 'Houses & apartments for rent'
      },
      {
        id: 'hostel',
        name: 'Hostels & student rooms'
      }
    ]
  },
  {
    id: 'business',
    name: 'Offices & Shops to Let',
    blurb: 'Room to run and grow your business',
    kind: 'stay',
    priceUnit: 'month',
    services: [
      'Moving & Logistics',
      'IT & Networking',
      'Construction & Renovation',
      'Security Services',
      'Cleaning Services'
    ],
    categories: [
      {
        id: 'office',
        name: 'Offices & co-working'
      },
      {
        id: 'shop',
        name: 'Shops & commercial spaces'
      },
      {
        id: 'warehouse',
        name: 'Warehouses & yards'
      }
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment & Leisure',
    blurb: 'Nights out, gyms, pools and venues',
    kind: 'place',
    priceUnit: 'entry',
    services: [
      'DJs & Sound',
      'Live Bands & Musicians',
      'Event Planning',
      'Venue Hire',
      'Fitness & Personal Training',
      'Swimming Lessons'
    ],
    categories: [
      {
        id: 'club',
        name: 'Clubs & lounges'
      },
      {
        id: 'bar',
        name: 'Bars & pubs'
      },
      {
        id: 'casino',
        name: 'Casinos & betting lounges'
      },
      {
        id: 'live_music',
        name: 'Live music & karaoke'
      },
      {
        id: 'gaming',
        name: 'Gaming & arcades'
      },
      {
        id: 'event_venue',
        name: 'Event venues & gardens'
      },
      {
        id: 'gym',
        name: 'Gyms & fitness centres'
      },
      {
        id: 'swimming_pool',
        name: 'Swimming pools'
      },
      {
        id: 'cinema',
        name: 'Cinemas'
      }
    ]
  },
  {
    id: 'hardware',
    name: 'Hardware & Building Supplies',
    blurb: 'Cement, pipes, electricals, paint and tools',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Plumbing',
      'Electrical Services',
      'Construction & Renovation',
      'Painting & Decorating',
      'Welding & Fabrication',
      'Roofing & Waterproofing',
      'Tiling & Flooring',
      'Carpentry & Furniture',
      'Gypsum & Ceiling Works',
      'Glass & Aluminium Works',
      'Solar & Renewable Energy',
      'Water & Borehole Services'
    ],
    categories: [
      {
        id: 'hardware_store',
        name: 'Hardware stores'
      },
      {
        id: 'building_materials',
        name: 'Cement & building materials'
      },
      {
        id: 'plumbing_supplies',
        name: 'Plumbing materials & pipes'
      },
      {
        id: 'electrical_supplies',
        name: 'Electrical supplies'
      },
      {
        id: 'paint_shop',
        name: 'Paint & finishes'
      },
      {
        id: 'timber_roofing',
        name: 'Timber & roofing'
      },
      {
        id: 'tiles_sanitary',
        name: 'Tiles & sanitary ware'
      },
      {
        id: 'steel_supplies',
        name: 'Steel & welding supplies'
      },
      {
        id: 'solar_shop',
        name: 'Solar & batteries'
      },
      {
        id: 'tool_hire',
        name: 'Tool & equipment hire'
      }
    ]
  },
  {
    id: 'electronics',
    name: 'Phones, Computers & Electronics',
    blurb: 'Phones, spare parts, laptops and networking',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Phone & Electronics Repair',
      'IT & Networking',
      'Programming & AI',
      'Office Equipment Repair',
      'Gate Automation & Electric Fencing',
      'Appliance Repair',
      'Computer & Coding Classes'
    ],
    categories: [
      {
        id: 'phone_shop',
        name: 'Phone shops'
      },
      {
        id: 'phone_parts',
        name: 'Phone spare parts & accessories'
      },
      {
        id: 'computer_shop',
        name: 'Computers & laptops'
      },
      {
        id: 'computer_parts',
        name: 'Computer parts & accessories'
      },
      {
        id: 'networking_equipment',
        name: 'Networking equipment'
      },
      {
        id: 'cctv_shop',
        name: 'CCTV & security systems'
      },
      {
        id: 'tv_sound',
        name: 'TVs & sound systems'
      },
      {
        id: 'office_machines',
        name: 'Printers & office machines'
      },
      {
        id: 'gaming_shop',
        name: 'Gaming consoles & games'
      }
    ]
  },
  {
    id: 'home_living',
    name: 'Home & Living',
    blurb: 'Appliances, furniture, gas and water',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Appliance Repair',
      'Carpentry & Furniture',
      'Curtains & Blinds Fitting',
      'Interior Styling & Home Staging',
      'Gardening & Landscaping',
      'Water & Gas Delivery',
      'HVAC Services',
      'Moving & Logistics'
    ],
    categories: [
      {
        id: 'appliance_shop',
        name: 'Home appliances'
      },
      {
        id: 'furniture_shop',
        name: 'Furniture'
      },
      {
        id: 'mattress_shop',
        name: 'Beds & mattresses'
      },
      {
        id: 'kitchenware',
        name: 'Kitchenware'
      },
      {
        id: 'decor_curtains',
        name: 'Curtains & décor'
      },
      {
        id: 'gas_refill',
        name: 'Gas refill'
      },
      {
        id: 'water_refill',
        name: 'Water refill'
      },
      {
        id: 'plant_nursery',
        name: 'Garden & plant nurseries'
      }
    ]
  },
  {
    id: 'fashion_beauty',
    name: 'Fashion & Beauty',
    blurb: 'Boutiques, shoes, cosmetics and hair',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Tailoring & Fashion',
      'Hairdressing & Beauty',
      "Barbering & Men's Grooming",
      'Wigs & Hair Extensions',
      'Makeup Artistry',
      'Nails, Lashes & Brows',
      'Jewellery Making & Repair',
      'Shoe Repair & Cobbling',
      'Watch Repair',
      'Personal Styling & Image Consulting'
    ],
    categories: [
      {
        id: 'boutique',
        name: 'Boutiques & clothing'
      },
      {
        id: 'shoe_shop',
        name: 'Shoe shops'
      },
      {
        id: 'cosmetics_shop',
        name: 'Cosmetics & beauty shops'
      },
      {
        id: 'salon_supplies',
        name: 'Salon & barber supplies'
      },
      {
        id: 'wig_shop',
        name: 'Wigs & hair products'
      },
      {
        id: 'jewellery_shop',
        name: 'Jewellery & watches'
      },
      {
        id: 'fabric_shop',
        name: 'Fabric shops'
      }
    ]
  },
  {
    id: 'health',
    name: 'Health & Pharmacy',
    blurb: 'Pharmacies, hospitals, clinics and labs',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Pharmacy & Medicine Delivery',
      'Optical & Eye Care',
      'Lab Tests & Home Sample Collection',
      'Home Nursing',
      'Physiotherapy & Rehab',
      'Medical Transport & Ambulance',
      'Maternity & Postnatal Care',
      'Medical & Lab Equipment Repair',
      'Veterinary Services'
    ],
    categories: [
      {
        id: 'pharmacy',
        name: 'Pharmacies & chemists'
      },
      {
        id: 'hospital',
        name: 'Hospitals'
      },
      {
        id: 'clinic',
        name: 'Clinics & medical centres'
      },
      {
        id: 'dental_clinic',
        name: 'Dental clinics'
      },
      {
        id: 'optician',
        name: 'Opticians'
      },
      {
        id: 'medical_lab',
        name: 'Labs & diagnostics'
      },
      {
        id: 'medical_supplies',
        name: 'Medical supplies'
      },
      {
        id: 'vet_clinic',
        name: 'Vet clinics'
      }
    ]
  },
  {
    id: 'food_drinks',
    name: 'Food & Drinks',
    blurb: 'Restaurants, delivery, groceries, wines & spirits',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Catering & Chefs',
      'Cakes & Baking',
      'Bartending & Mobile Bars',
      'Food Trucks & Street Food',
      'Event Planning',
      'Cooking & Baking Classes'
    ],
    categories: [
      {
        id: 'restaurant',
        name: 'Restaurants & cafés'
      },
      {
        id: 'food_delivery',
        name: 'Online food delivery'
      },
      {
        id: 'fast_food',
        name: 'Fast food'
      },
      {
        id: 'bakery',
        name: 'Bakeries & cakes'
      },
      {
        id: 'supermarket',
        name: 'Supermarkets & groceries'
      },
      {
        id: 'butchery',
        name: 'Butcheries'
      },
      {
        id: 'wines_spirits',
        name: 'Wines & spirits'
      },
      {
        id: 'drinks_distributor',
        name: 'Water & drinks distributors'
      }
    ]
  },
  {
    id: 'schools',
    name: 'Schools & Learning',
    blurb: 'Schools, colleges, daycares and bookshops',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Tutoring & Training',
      'Exam Prep & Revision',
      'Early Childhood & Homeschooling',
      'Driving School',
      'Computer & Coding Classes',
      'Vocational & Trade Skills Training',
      'Language Lessons',
      'Music Lessons'
    ],
    categories: [
      {
        id: 'school',
        name: 'Schools'
      },
      {
        id: 'college',
        name: 'Colleges & training centres'
      },
      {
        id: 'daycare',
        name: 'Daycares & kindergartens'
      },
      {
        id: 'driving_school',
        name: 'Driving schools'
      },
      {
        id: 'bookshop',
        name: 'Bookshops & stationery'
      },
      {
        id: 'toy_shop',
        name: 'Toy shops'
      }
    ]
  },
  {
    id: 'auto',
    name: 'Auto & Transport',
    blurb: 'Spare parts, tyres, car wash and car hire',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Automotive Repair',
      'Mechanical Services',
      'Mobile Car Wash & Detailing',
      'Heavy Machinery & Plant Repair',
      'Driving School'
    ],
    categories: [
      {
        id: 'car_parts',
        name: 'Car spare parts'
      },
      {
        id: 'tyres_batteries',
        name: 'Tyres & batteries'
      },
      {
        id: 'car_wash',
        name: 'Car wash'
      },
      {
        id: 'car_hire',
        name: 'Car hire'
      },
      {
        id: 'motorbike_shop',
        name: 'Motorbike dealers & parts'
      },
      {
        id: 'petrol_station',
        name: 'Petrol stations'
      }
    ]
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    blurb: 'Agrovets, feeds, seeds and farm tools',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Veterinary Services',
      'Water & Borehole Services',
      'Gardening & Landscaping',
      'Pet Care & Grooming',
      'Solar & Renewable Energy'
    ],
    categories: [
      {
        id: 'agrovet',
        name: 'Agrovets'
      },
      {
        id: 'animal_feeds',
        name: 'Animal feeds'
      },
      {
        id: 'seeds_fertiliser',
        name: 'Seeds & fertilisers'
      },
      {
        id: 'farm_equipment',
        name: 'Farm tools & equipment'
      }
    ]
  },
  {
    id: 'business_office',
    name: 'Business & Office',
    blurb: 'Printing, office supplies, cyber and M-Pesa',
    kind: 'shop',
    priceUnit: 'none',
    services: [
      'Printing & Branding',
      'Branded Merchandise',
      'Cyber & eCitizen Services',
      'Graphic Design',
      'Office Equipment Repair',
      'Business Registration & Compliance',
      'Accounting & Bookkeeping'
    ],
    categories: [
      {
        id: 'printing_shop',
        name: 'Printing & branding shops'
      },
      {
        id: 'office_supplies',
        name: 'Office supplies'
      },
      {
        id: 'cyber_cafe',
        name: 'Cyber cafés'
      },
      {
        id: 'mpesa_agent',
        name: 'M-Pesa & agent shops'
      },
      {
        id: 'courier',
        name: 'Courier & parcel services'
      }
    ]
  }
];

export const ALL_CATEGORIES = LISTING_GROUPS.flatMap((g) =>
  g.categories.map((c) => ({ ...c, groupId: g.id, priceUnit: g.priceUnit }))
);

export const categoryById = (id) => ALL_CATEGORIES.find((c) => c.id === id);
export const groupById = (id) => LISTING_GROUPS.find((g) => g.id === id);

export const isShortStay = (categoryId) => categoryById(categoryId)?.groupId === 'short_stays';
export const isBusiness = (categoryId) => categoryById(categoryId)?.groupId === 'business';
export const isEntertainment = (categoryId) => categoryById(categoryId)?.groupId === 'entertainment';
/** A shop or other business that lists products (no single price, exact location shown) */
export const isShop = (categoryId) => groupById(categoryById(categoryId)?.groupId)?.kind === 'shop';
export const isShopGroup = (groupId) => groupById(groupId)?.kind === 'shop';

/** Business groups that go with a service main category, e.g. Plumbing → Hardware & Building Supplies */
export const groupsForService = (mainCategory) => LISTING_GROUPS.filter((g) => g.services.includes(mainCategory));

/** Business groups that go with any category in a service group (bucket) */
export const groupsForBucket = (bucket) =>
  LISTING_GROUPS.filter((g) => bucket?.categories?.some((c) => g.services.includes(c.name || c)));

/** How a group's price is described, e.g. "per night", "entry fee" ('' for shops) */
export const priceUnitLabel = (unit) => (unit === 'entry' ? 'entry fee' : unit === 'none' ? '' : `per ${unit}`);

export const PROPERTY_TYPES = [
  { id: 'bedsitter', label: 'Bedsitter' },
  { id: 'studio', label: 'Studio' },
  { id: '1br', label: '1 bedroom' },
  { id: '2br', label: '2 bedrooms' },
  { id: '3br', label: '3 bedrooms' },
  { id: '4br_plus', label: '4+ bedrooms' },
  { id: 'bungalow', label: 'Bungalow' },
  { id: 'maisonette', label: 'Maisonette' },
  { id: 'room', label: 'Single room' },
  { id: 'other', label: 'Other' },
];

export const propertyTypeLabel = (id) => PROPERTY_TYPES.find((p) => p.id === id)?.label || '';

export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'parking', label: 'Parking' },
  { id: 'water_24h', label: '24h water' },
  { id: 'backup_power', label: 'Backup power' },
  { id: 'security', label: 'Security guard' },
  { id: 'cctv', label: 'CCTV' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'hot_shower', label: 'Hot shower' },
  { id: 'tv', label: 'TV' },
  { id: 'pool', label: 'Swimming pool' },
  { id: 'gym', label: 'Gym' },
  { id: 'lift', label: 'Lift' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'garden', label: 'Garden' },
  { id: 'pets_allowed', label: 'Pets allowed' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'conference_room', label: 'Meeting room' },
  { id: 'air_conditioning', label: 'Air conditioning' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'live_music', label: 'Live music', for: 'entertainment' },
  { id: 'dj', label: 'DJ', for: 'entertainment' },
  { id: 'food', label: 'Food served', for: 'entertainment' },
  { id: 'outdoor_seating', label: 'Outdoor seating', for: 'entertainment' },
  { id: 'vip_area', label: 'VIP area', for: 'entertainment' },
  { id: 'sports_screens', label: 'Sports on screen', for: 'entertainment' },
  { id: 'dance_floor', label: 'Dance floor', for: 'entertainment' },
  { id: 'card_payments', label: 'Card & M-Pesa accepted', for: 'entertainment' },
  { id: 'delivery', label: 'Delivery', for: 'shop' },
  { id: 'open_24h', label: 'Open 24 hours', for: 'shop' },
  { id: 'wholesale', label: 'Wholesale prices', for: 'shop' },
  { id: 'installation', label: 'Installation / fitting', for: 'shop' },
  { id: 'warranty', label: 'Warranty on products', for: 'shop' },
  { id: 'wheelchair_access', label: 'Wheelchair access', for: 'shop' },
];

// Amenities that make sense for a category (entertainment and shops have their own sets)
export const amenitiesFor = (categoryId) => {
  const ent = isEntertainment(categoryId);
  const shop = isShop(categoryId);
  const shared = ['wifi', 'parking', 'security', 'cctv', 'backup_power', 'air_conditioning'];
  if (shop) return AMENITIES.filter((a) => a.for === 'shop' || a.id === 'card_payments' || shared.includes(a.id));
  return AMENITIES.filter((a) => (ent ? a.for === 'entertainment' || shared.includes(a.id) : !a.for));
};

export const amenityLabel = (id) => AMENITIES.find((a) => a.id === id)?.label || id;

export const LISTER_TYPES = [
  { id: 'owner', label: 'Owner / landlord' },
  { id: 'host', label: 'Host' },
  { id: 'agent', label: 'Agent' },
  { id: 'property_manager', label: 'Property manager' },
];

export const listerTypeLabel = (id) => LISTER_TYPES.find((l) => l.id === id)?.label || 'Lister';

// Kenya's 47 counties (same list the backend accepts)
export const COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu',
  'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru',
  'Migori', 'Mombasa', "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

// Listing pricing (mirrors backend/utils/listingPlan.js)
export const LISTING_FREE_MONTHS = 3;   // free months from your first listing
export const LISTING_FREE_COUNT = 5;    // listings that are free during those months
export const LISTING_PAY_MONTHS = [1]; // each payment covers the next month

// KES per listing per month otherwise: 200, then 500 from 1 December 2026 (midnight, Nairobi).
// The server charges the price at the time of payment; this is for display.
export const LISTING_NEW_PRICE = 500;
export const LISTING_NEW_PRICE_FROM = new Date('2026-12-01T00:00:00+03:00');
export const listingPriceAt = (at = new Date()) => (at >= LISTING_NEW_PRICE_FROM ? LISTING_NEW_PRICE : 200);
export const LISTING_PRICE = listingPriceAt(); // today's price, when the page loaded
/** " (KES 500 from 1 December 2026)" until the new price starts, then '' */
export const LISTING_PRICE_CHANGE_NOTE =
  LISTING_PRICE === LISTING_NEW_PRICE ? '' : ` (KES ${LISTING_NEW_PRICE} from 1 December 2026)`;

export const formatPrice = (price, unit) => {
  if (unit === 'none') return ''; // shops price their products, not the listing
  if (unit === 'entry') return Number(price) > 0 ? `KES ${Number(price).toLocaleString('en-KE')} entry` : 'Free entry';
  return `KES ${Number(price || 0).toLocaleString('en-KE')}${unit ? ` / ${unit}` : ''}`;
};

/** "Kilimani, Nairobi, Nairobi" (estate, town, county), falling back to the old single area field */
export const placeLabel = (l, { withCounty = true } = {}) => {
  const town = l.town || l.area;
  // "Kilimani, Nairobi", not "Kilimani, Nairobi, Nairobi" when the town shares the county's name
  const county = withCounty && l.county && l.county.toLowerCase() !== String(town || '').toLowerCase() ? l.county : null;
  return [l.estate, town, county].filter(Boolean).join(', ');
};

/** "0712 345 678" → "254712345678" for wa.me / tel: links */
export const toInternationalPhone = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};

// "Near me" distance bands (km). The first is the default: everything, nearest first.
export const DISTANCE_BANDS = [
  { id: 'any', label: 'Any distance', minKm: 0, maxKm: null },
  { id: '0-1', label: 'Within 1 km', minKm: 0, maxKm: 1 },
  { id: '1-10', label: '1 – 10 km', minKm: 1, maxKm: 10 },
  { id: '10-20', label: '10 – 20 km', minKm: 10, maxKm: 20 },
  { id: '20-50', label: '20 – 50 km', minKm: 20, maxKm: 50 },
  { id: '50-100', label: '50 – 100 km', minKm: 50, maxKm: 100 },
];

export const bandById = (id) => DISTANCE_BANDS.find((b) => b.id === id) || DISTANCE_BANDS[0];

/** 0.35 → "350 m away", 12.4 → "12.4 km away" */
export const formatDistance = (km) => {
  if (km == null || !Number.isFinite(Number(km))) return '';
  const n = Number(km);
  if (n < 1) return `${Math.max(100, Math.round(n * 10) * 100)} m away`;
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} km away`;
};
