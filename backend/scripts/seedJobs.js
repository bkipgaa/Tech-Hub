/**
 * Seed Jobs Script
 * ================
 * 
 * Creates sample job postings for testing the job listing feature.
 * 
 * Run with: node scripts/seedJobs.js
 * 
 * This script will:
 * 1. Create a test client if not exists
 * 2. Create 20+ diverse job postings across all categories
 * 3. Set job status to 'approved' for immediate visibility
 * 4. Generate realistic budgets, locations, and descriptions
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Job = require('../models/Job');
const User = require('../models/User');

// Kenyan towns and cities for realistic locations
const locations = [
  { city: 'Nairobi', addresses: ['Westlands', 'Kilimani', 'Karen', 'Langata', 'CBD', 'Eastlands', 'South B', 'South C', 'Embakasi', 'Rongai'] },
  { city: 'Mombasa', addresses: ['Nyali', 'Bamburi', 'Likoni', 'Changamwe', 'Mtwapa', 'Kilifi'] },
  { city: 'Kisumu', addresses: ['Milimani', 'Kondele', 'Nyamasaria', 'Kibos', 'Maseno'] },
  { city: 'Nakuru', addresses: ['Milimani', 'Lanet', 'Njoro', 'Ngata', 'Bahati'] },
  { city: 'Eldoret', addresses: ['Kapsoya', 'Langas', 'Elgon View', 'Pioneer', 'Annex'] },
  { city: 'Thika', addresses: ['Kiandutu', 'Makongeni', 'Landless', 'Kiganjo', 'Gatanga'] },
  { city: 'Malindi', addresses: ['Casuarina', 'Silversand', 'Kijiji', 'Shella', 'Marina'] },
  { city: 'Kitale', addresses: ['Milimani', 'Sitatunga', 'Langas', 'Tuwan', 'Matunda'] },
  { city: 'Garissa', addresses: ['Bullawayo', 'Mashimoni', 'Soko Mjinga', 'Township'] }
];

// Service categories and their sub-services (matching ServiceCatalog)
const serviceData = {
  'Electrical Services': {
    categories: ['Residential Electrical', 'Commercial Electrical'],
    subServices: {
      'Residential Electrical': [
        'House Wiring & Rewiring',
        'Lighting Installation',
        'Ceiling Fan Installation',
        'Circuit Breaker Replacement',
        'Electrical Inspection',
        'Outlet Installation'
      ],
      'Commercial Electrical': [
        'Three-Phase Wiring',
        'Electrical Panel Upgrades',
        'Emergency Lighting Installation',
        'Commercial Lighting'
      ]
    }
  },
  'Plumbing': {
    categories: ['General Plumbing', 'Drainage & Sewer'],
    subServices: {
      'General Plumbing': [
        'Leak Detection & Repair',
        'Faucet Installation & Repair',
        'Toilet Repair & Installation',
        'Pipe Installation',
        'Water Heater Installation',
        'Bathroom Renovation'
      ],
      'Drainage & Sewer': [
        'Drain Cleaning & Unclogging',
        'Sewer Line Inspection',
        'Drain Repair',
        'Septic Tank Cleaning'
      ]
    }
  },
  'IT & Networking': {
    categories: ['Internet Services', 'CCTV & Security Systems', 'Computer Repair & Maintenance'],
    subServices: {
      'Internet Services': [
        'WiFi Setup & Configuration',
        'Network Troubleshooting',
        'Fiber Optic Installation',
        'Router Configuration',
        'Network Security Setup'
      ],
      'CCTV & Security Systems': [
        'CCTV Camera Installation',
        'Security System Maintenance',
        'Access Control Systems',
        'Intercom Installation'
      ],
      'Computer Repair & Maintenance': [
        'Hardware Repair',
        'Virus & Malware Removal',
        'Data Recovery',
        'Software Installation',
        'Computer Maintenance'
      ]
    }
  },
  'HVAC Services': {
    categories: ['Air Conditioning'],
    subServices: {
      'Air Conditioning': [
        'AC Installation',
        'AC Repair',
        'AC Maintenance',
        'AC Gas Refill',
        'Duct Cleaning'
      ]
    }
  },
  'Carpentry & Furniture': {
    categories: ['Furniture Making'],
    subServices: {
      'Furniture Making': [
        'Custom Furniture',
        'Furniture Repair',
        'Cabinet Making',
        'Bookshelf Installation',
        'Wardrobe Installation'
      ]
    }
  },
  'Cleaning Services': {
    categories: ['Residential Cleaning', 'Commercial Cleaning'],
    subServices: {
      'Residential Cleaning': [
        'Deep House Cleaning',
        'Carpet Cleaning',
        'Window Cleaning',
        'Move In/Out Cleaning'
      ],
      'Commercial Cleaning': [
        'Office Cleaning',
        'Post-Construction Cleaning',
        'Industrial Cleaning'
      ]
    }
  },
  'Painting & Decorating': {
    categories: ['Interior Painting', 'Exterior Painting'],
    subServices: {
      'Interior Painting': [
        'Wall Painting',
        'Ceiling Painting',
        'Wallpaper Installation',
        'Texture Painting'
      ],
      'Exterior Painting': [
        'House Painting',
        'Fence Painting',
        'Roof Painting'
      ]
    }
  },
  'Automotive Repair': {
    categories: ['General Repair', 'Electrical Repair'],
    subServices: {
      'General Repair': [
        'Engine Diagnostics',
        'Brake Repair',
        'Oil Change',
        'Transmission Repair'
      ],
      'Electrical Repair': [
        'Battery Replacement',
        'Alternator Repair',
        'Wiring Repair'
      ]
    }
  }
};

// Generate random budget based on service type
function getBudget(mainCategory, subService) {
  const budgets = {
    'Electrical Services': { min: 2000, max: 100000 },
    'Plumbing': { min: 1000, max: 50000 },
    'IT & Networking': { min: 1500, max: 80000 },
    'HVAC Services': { min: 2000, max: 60000 },
    'Carpentry & Furniture': { min: 3000, max: 150000 },
    'Cleaning Services': { min: 1000, max: 30000 },
    'Painting & Decorating': { min: 5000, max: 120000 },
    'Automotive Repair': { min: 1500, max: 45000 }
  };
  
  const range = budgets[mainCategory] || { min: 1000, max: 50000 };
  
  // Some services have higher budgets
  if (subService.includes('Wiring') || subService.includes('Installation')) {
    return Math.floor(Math.random() * (range.max * 0.7) + range.min * 2);
  }
  if (subService.includes('Emergency') || subService.includes('Urgent')) {
    return Math.floor(Math.random() * (range.max * 0.5) + range.min * 1.5);
  }
  
  return Math.floor(Math.random() * (range.max - range.min) + range.min);
}

// Generate random urgent status (30% chance)
function isUrgent() {
  return Math.random() < 0.3;
}

// Generate random date within last 30 days
function randomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);
  date.setDate(now.getDate() - daysAgo);
  return date;
}

// Job titles for variety
const jobTitles = {
  'Electrical Services': [
    "Need {service} for {property}",
    "Emergency {service} Required",
    "Professional {service} Needed",
    "Urgent {service} in {area}",
    "Qualified {service} Wanted"
  ],
  'Plumbing': [
    "{service} Needed Immediately",
    "Emergency {service} Service",
    "Professional {service} Required",
    "Urgent {service} in {area}"
  ],
  'IT & Networking': [
    "{service} for {property}",
    "IT Support Needed - {service}",
    "Professional {service} Required",
    "Urgent {service} - {description}"
  ],
  'HVAC Services': [
    "{service} Needed for {property}",
    "Emergency {service} Required",
    "AC {service} Service",
    "Professional {service} Wanted"
  ],
  'Carpentry & Furniture': [
    "Custom {service} Required",
    "Professional {service} Needed",
    "Urgent {service} for {property}",
    "Quality {service} Wanted"
  ]
};

function generateTitle(mainCategory, serviceCategory, subService, location) {
  const templates = jobTitles[mainCategory] || [
    "{service} Service Needed",
    "Professional {service} Required",
    "Urgent {service} in {area}"
  ];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const propertyTypes = ['House', 'Office', 'Apartment', 'Store', 'Warehouse', 'Restaurant'];
  const property = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
  
  let title = template
    .replace('{service}', subService)
    .replace('{property}', property)
    .replace('{area}', location)
    .replace('{description}', subService.toLowerCase());
  
  return title;
}

function generateDescription(mainCategory, serviceCategory, subService, budget, isUrgent) {
  const descriptions = {
    'Electrical Services': [
      `Need a qualified electrician for ${subService.toLowerCase()}. The property requires professional installation with proper safety compliance. Budget is approximately KES ${budget.toLocaleString()}. Please provide your quote and availability.`,
      `Looking for an experienced electrician to handle ${subService.toLowerCase()}. Work needs to be completed within 3-5 days. Budget: KES ${budget.toLocaleString()}.`,
      `Urgent requirement for ${subService.toLowerCase()}. Need someone with proper equipment and certification. Budget: KES ${budget.toLocaleString()}. Please respond ASAP.`
    ],
    'Plumbing': [
      `Need a professional plumber for ${subService.toLowerCase()}. The issue requires immediate attention. Budget: KES ${budget.toLocaleString()}.`,
      `Looking for an experienced plumber to handle ${subService.toLowerCase()}. Quality work is essential. Budget: KES ${budget.toLocaleString()}.`,
      `Emergency plumbing service needed for ${subService.toLowerCase()}. Require someone available today. Budget: KES ${budget.toLocaleString()}.`
    ],
    'IT & Networking': [
      `Need an IT professional for ${subService.toLowerCase()}. Must have experience with similar installations. Budget: KES ${budget.toLocaleString()}.`,
      `Looking for a certified technician to handle ${subService.toLowerCase()}. Quality work required. Budget: KES ${budget.toLocaleString()}.`,
      `Require immediate IT support for ${subService.toLowerCase()}. Must be available within 24 hours. Budget: KES ${budget.toLocaleString()}.`
    ]
  };
  
  const templates = descriptions[mainCategory] || [
    `Need professional service for ${subService.toLowerCase()}. Quality work required. Budget: KES ${budget.toLocaleString()}.`,
    `Looking for experienced technician for ${subService.toLowerCase()}. Please provide your best quote. Budget: KES ${budget.toLocaleString()}.`
  ];
  
  let description = templates[Math.floor(Math.random() * templates.length)];
  
  if (isUrgent) {
    description = `🚨 URGENT: ${description} Work needs to start immediately.`;
  }
  
  return description;
}

// Generate 20+ jobs
function generateJobs(clientId, clientName, clientEmail, clientPhone) {
  const jobs = [];
  const mainCategories = Object.keys(serviceData);
  
  for (let i = 0; i < 25; i++) {
    // Select random main category
    const mainCategory = mainCategories[Math.floor(Math.random() * mainCategories.length)];
    const categoryData = serviceData[mainCategory];
    
    // Select random service category
    const serviceCategory = categoryData.categories[Math.floor(Math.random() * categoryData.categories.length)];
    
    // Select random sub-service
    const subServices = categoryData.subServices[serviceCategory];
    const subService = subServices[Math.floor(Math.random() * subServices.length)];
    
    // Select random location
    const locationData = locations[Math.floor(Math.random() * locations.length)];
    const addressArea = locationData.addresses[Math.floor(Math.random() * locationData.addresses.length)];
    const fullAddress = `${Math.floor(Math.random() * 999) + 1} ${addressArea}, ${locationData.city}`;
    
    // Generate budget
    const budget = getBudget(mainCategory, subService);
    const urgent = isUrgent();
    
    // Generate title and description
    const title = generateTitle(mainCategory, serviceCategory, subService, locationData.city);
    const description = generateDescription(mainCategory, serviceCategory, subService, budget, urgent);
    
    // Generate random date
    const createdAt = randomDate();
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    jobs.push({
      title,
      description,
      mainCategory,
      serviceCategory,
      subService,
      address: fullAddress,
      location: locationData.city,
      budget,
      currency: 'KES',
      pricingType: 'fixed',
      isUrgent: urgent,
      clientId,
      clientName,
      email: clientEmail,
      phone: clientPhone,
      status: 'approved',
      createdAt,
      expiresAt,
      viewCount: Math.floor(Math.random() * 100),
      applicationCount: Math.floor(Math.random() * 8)
    });
  }
  
  return jobs;
}

/**
 * Main seeding function
 */
async function seedJobs() {
  try {
    // Get MongoDB URI
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tech-hub';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Create or get test client
    let testClient = await User.findOne({ email: 'testclient@example.com' });
    
    if (!testClient) {
      console.log('📝 Creating test client user...');
      testClient = new User({
        email: 'testclient@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+254712345678',
        role: 'client',
        isVerified: true,
        status: 'active'
      });
      await testClient.save();
      console.log('✅ Test client created\n');
    } else {
      console.log('✅ Using existing test client\n');
    }

    // Clear existing jobs (optional - comment out if you want to keep existing)
    const deletedCount = await Job.deleteMany({});
    console.log(`🗑️ Cleared ${deletedCount.deletedCount} existing jobs\n`);

    // Generate jobs
    console.log('📝 Generating job postings...\n');
    const jobs = generateJobs(
      testClient._id,
      `${testClient.firstName} ${testClient.lastName}`,
      testClient.email,
      testClient.phone
    );
    
    console.log(`Generated ${jobs.length} job postings\n`);
    
    // Insert jobs
    let insertedCount = 0;
    for (const jobData of jobs) {
      const job = new Job(jobData);
      await job.save();
      insertedCount++;
      
      // Show progress
      const urgentTag = jobData.isUrgent ? '🚨 URGENT' : '   ';
      console.log(`${urgentTag} ${insertedCount}. ${jobData.title.substring(0, 50)}... - KES ${jobData.budget.toLocaleString()} (${jobData.location})`);
    }
    
    console.log(`\n✅ Successfully created ${insertedCount} job postings!\n`);
    
    // Show statistics
    const stats = await Job.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$mainCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📊 Job Statistics by Category:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} job(s)`);
    });
    
    const urgentCount = await Job.countDocuments({ isUrgent: true, status: 'approved' });
    const totalBudget = await Job.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Jobs: ${insertedCount}`);
    console.log(`   Urgent Jobs: ${urgentCount}`);
    console.log(`   Total Value: KES ${totalBudget[0]?.total.toLocaleString() || 0}`);
    console.log(`   Average Budget: KES ${Math.floor(totalBudget[0]?.total / insertedCount).toLocaleString() || 0}`);
    
    // Show sample of jobs by location
    const locationStats = await Job.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    console.log(`\n📍 Top Locations:`);
    locationStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} job(s)`);
    });
    
    console.log('\n✨ Job seeding completed successfully!');
    console.log('\n💡 Now you can view jobs at:');
    console.log('   http://localhost:5000/api/jobs/available');
    console.log('   Or visit the frontend "Available Jobs" page\n');
    
  } catch (error) {
    console.error('\n❌ Error seeding jobs:', error.message);
    console.error(error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

// Run the seed function
seedJobs();