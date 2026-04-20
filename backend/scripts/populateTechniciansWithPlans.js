/**
 * Populate Technicians with Different Subscription Plans
 * Creates technicians across Kenya with various visibility radii
 * Skips existing technicians to avoid duplicate errors
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Technician = require('../models/Technician');
const User = require('../models/User');

dotenv.config();

// Town coordinates (longitude, latitude)
const towns = {
  malindi: { name: 'Malindi', coords: [40.0974072, -3.2311121], state: 'Kilifi' },
  watamu: { name: 'Watamu', coords: [39.9519494, -3.3472035], state: 'Kilifi' },
  kilifi: { name: 'Kilifi', coords: [39.7318228, -3.5372547], state: 'Kilifi' },
  mombasa: { name: 'Mombasa', coords: [39.5014501, -4.0351721], state: 'Mombasa' },
  nairobi: { name: 'Nairobi', coords: [36.5177334, -1.3031874], state: 'Nairobi' },
  kisumu: { name: 'Kisumu', coords: [34.7619, -0.1022], state: 'Kisumu' },
  nakuru: { name: 'Nakuru', coords: [36.0833, -0.3031], state: 'Nakuru' },
  eldoret: { name: 'Eldoret', coords: [35.2699, 0.5143], state: 'Uasin Gishu' },
  nanyuki: { name: 'Nanyuki', coords: [37.0739, 0.0199], state: 'Laikipia' },
  meru: { name: 'Meru', coords: [37.6559, 0.05], state: 'Meru' }
};

// Categories and services
const categories = {
  'IT & Networking': {
    serviceCategory: 'Internet Services',
    subServices: ['WiFi Setup & Configuration', 'Network Troubleshooting', 'Fiber Optic Installation']
  },
  'Electrical Services': {
    serviceCategory: 'Residential Electrical',
    subServices: ['House Wiring & Rewiring', 'Circuit Breaker Replacement', 'Lighting Installation']
  },
  'Plumbing': {
    serviceCategory: 'General Plumbing',
    subServices: ['Leak Detection & Repair', 'Faucet Installation & Repair', 'Toilet Repair & Installation']
  }
};

// Subscription plans with their visibility radii
const subscriptionPlans = {
  free: { plan: 'free', visibilityRadius: 10, price: 0, label: 'Free Plan (10km)' },
  basic: { plan: 'basic', visibilityRadius: 30, price: 500, label: 'Basic Plan (30km)' },
  premium: { plan: 'premium', visibilityRadius: 50, price: 1000, label: 'Premium Plan (50km)' },
  business: { plan: 'business', visibilityRadius: 200, price: 2000, label: 'Business Plan (200km)' },
  enterprise: { plan: 'enterprise', visibilityRadius: 500, price: 3000, label: 'Enterprise Plan (500km)' },
  unlimited: { plan: 'unlimited', visibilityRadius: 1000, price: 5000, label: 'Unlimited Plan (1000km)' },
  trial: { plan: 'trial', visibilityRadius: 50, price: 0, label: 'Trial Plan (50km - 30 days)' }
};

// Technician data with different subscription plans
const technicianProfiles = [
  // ========== NAIROBI (Capital - various plans) ==========
  {
    town: 'nairobi',
    firstName: 'James',
    lastName: 'Mwangi',
    email: 'james.mwangi@nairobi.com',
    category: 'Electrical Services',
    plan: 'free',
    aboutMe: 'Licensed electrician serving Nairobi area.',
    headline: 'Electrician | Free Plan (10km)',
    hourlyRate: 1500,
    yearsOfExperience: 5
  },
  {
    town: 'nairobi',
    firstName: 'Sarah',
    lastName: 'Njeri',
    email: 'sarah.njeri@nairobi.com',
    category: 'IT & Networking',
    plan: 'basic',
    aboutMe: 'Network engineer covering Nairobi and environs.',
    headline: 'Network Engineer | Basic Plan (30km)',
    hourlyRate: 2000,
    yearsOfExperience: 6
  },
  {
    town: 'nairobi',
    firstName: 'Peter',
    lastName: 'Omondi',
    email: 'peter.omondi@nairobi.com',
    category: 'Plumbing',
    plan: 'premium',
    aboutMe: 'Master plumber serving Nairobi and up to 50km radius.',
    headline: 'Master Plumber | Premium Plan (50km)',
    hourlyRate: 1800,
    yearsOfExperience: 8
  },
  {
    town: 'nairobi',
    firstName: 'Grace',
    lastName: 'Wanjiku',
    email: 'grace.wanjiku@nairobi.com',
    category: 'Electrical Services',
    plan: 'business',
    aboutMe: 'Commercial electrician serving Nairobi and surrounding counties.',
    headline: 'Commercial Electrician | Business Plan (200km)',
    hourlyRate: 2500,
    yearsOfExperience: 10
  },

  // ========== MOMBASA (Coastal city) ==========
  {
    town: 'mombasa',
    firstName: 'Ali',
    lastName: 'Hassan',
    email: 'ali.hassan@mombasa.com',
    category: 'IT & Networking',
    plan: 'free',
    aboutMe: 'IT support specialist in Mombasa.',
    headline: 'IT Specialist | Free Plan (10km)',
    hourlyRate: 1600,
    yearsOfExperience: 4
  },
  {
    town: 'mombasa',
    firstName: 'Fatima',
    lastName: 'Mohamed',
    email: 'fatima.mohamed@mombasa.com',
    category: 'Plumbing',
    plan: 'premium',
    aboutMe: 'Professional plumber serving Mombasa and coastal region.',
    headline: 'Plumber | Premium Plan (50km)',
    hourlyRate: 1700,
    yearsOfExperience: 7
  },
  {
    town: 'mombasa',
    firstName: 'Hamisi',
    lastName: 'Juma',
    email: 'hamisi.juma@mombasa.com',
    category: 'Electrical Services',
    plan: 'enterprise',
    aboutMe: 'Senior electrician serving entire coastal region.',
    headline: 'Senior Electrician | Enterprise Plan (500km)',
    hourlyRate: 2200,
    yearsOfExperience: 12
  },

  // ========== KISUMU (Western Kenya) ==========
  {
    town: 'kisumu',
    firstName: 'John',
    lastName: 'Otieno',
    email: 'john.otieno@kisumu.com',
    category: 'IT & Networking',
    plan: 'basic',
    aboutMe: 'Network technician in Kisumu area.',
    headline: 'Network Tech | Basic Plan (30km)',
    hourlyRate: 1400,
    yearsOfExperience: 3
  },
  {
    town: 'kisumu',
    firstName: 'Mary',
    lastName: 'Achieng',
    email: 'mary.achieng@kisumu.com',
    category: 'Plumbing',
    plan: 'business',
    aboutMe: 'Plumber serving Kisumu and surrounding counties.',
    headline: 'Plumber | Business Plan (200km)',
    hourlyRate: 1600,
    yearsOfExperience: 6
  },
  {
    town: 'kisumu',
    firstName: 'Tom',
    lastName: 'Mboya',
    email: 'tom.mboya@kisumu.com',
    category: 'Electrical Services',
    plan: 'trial',
    aboutMe: 'Electrician on trial - serving Kisumu area.',
    headline: 'Electrician | Trial Plan (50km)',
    hourlyRate: 1300,
    yearsOfExperience: 2
  },

  // ========== NAKURU (Rift Valley) ==========
  {
    town: 'nakuru',
    firstName: 'David',
    lastName: 'Kipchoge',
    email: 'david.kipchoge@nakuru.com',
    category: 'Electrical Services',
    plan: 'free',
    aboutMe: 'Electrician in Nakuru town.',
    headline: 'Electrician | Free Plan (10km)',
    hourlyRate: 1400,
    yearsOfExperience: 4
  },
  {
    town: 'nakuru',
    firstName: 'Ruth',
    lastName: 'Chebet',
    email: 'ruth.chebet@nakuru.com',
    category: 'IT & Networking',
    plan: 'premium',
    aboutMe: 'IT consultant serving Nakuru and surrounding areas.',
    headline: 'IT Consultant | Premium Plan (50km)',
    hourlyRate: 1800,
    yearsOfExperience: 5
  },
  {
    town: 'nakuru',
    firstName: 'Joseph',
    lastName: 'Kipruto',
    email: 'joseph.kipruto@nakuru.com',
    category: 'Plumbing',
    plan: 'unlimited',
    aboutMe: 'Master plumber serving entire Rift Valley region.',
    headline: 'Master Plumber | Unlimited Plan (1000km)',
    hourlyRate: 2000,
    yearsOfExperience: 10
  },

  // ========== ELDORET (North Rift) ==========
  {
    town: 'eldoret',
    firstName: 'William',
    lastName: 'Kipkemoi',
    email: 'william.kipkemoi@eldoret.com',
    category: 'Electrical Services',
    plan: 'basic',
    aboutMe: 'Electrician in Eldoret area.',
    headline: 'Electrician | Basic Plan (30km)',
    hourlyRate: 1500,
    yearsOfExperience: 5
  },
  {
    town: 'eldoret',
    firstName: 'Catherine',
    lastName: 'Jelimo',
    email: 'catherine.jelimo@eldoret.com',
    category: 'IT & Networking',
    plan: 'enterprise',
    aboutMe: 'Network engineer serving North Rift region.',
    headline: 'Network Engineer | Enterprise Plan (500km)',
    hourlyRate: 2100,
    yearsOfExperience: 7
  },

  // ========== NANYUKI (Central Kenya) ==========
  {
    town: 'nanyuki',
    firstName: 'Simon',
    lastName: 'Maina',
    email: 'simon.maina@nanyuki.com',
    category: 'Plumbing',
    plan: 'free',
    aboutMe: 'Plumber in Nanyuki town.',
    headline: 'Plumber | Free Plan (10km)',
    hourlyRate: 1300,
    yearsOfExperience: 3
  },
  {
    town: 'nanyuki',
    firstName: 'Lucy',
    lastName: 'Wanjiru',
    email: 'lucy.wanjiru@nanyuki.com',
    category: 'Electrical Services',
    plan: 'premium',
    aboutMe: 'Electrician serving Nanyuki and surrounding areas.',
    headline: 'Electrician | Premium Plan (50km)',
    hourlyRate: 1600,
    yearsOfExperience: 6
  },

  // ========== MERU (Eastern Kenya) ==========
  {
    town: 'meru',
    firstName: 'Daniel',
    lastName: 'Mutua',
    email: 'daniel.mutua@meru.com',
    category: 'IT & Networking',
    plan: 'basic',
    aboutMe: 'IT technician in Meru area.',
    headline: 'IT Technician | Basic Plan (30km)',
    hourlyRate: 1400,
    yearsOfExperience: 4
  },
  {
    town: 'meru',
    firstName: 'Esther',
    lastName: 'Kanjogu',
    email: 'esther.kanjogu@meru.com',
    category: 'Plumbing',
    plan: 'business',
    aboutMe: 'Plumber serving Meru and Eastern region.',
    headline: 'Plumber | Business Plan (200km)',
    hourlyRate: 1700,
    yearsOfExperience: 7
  },

  // ========== KILIFI (Coastal) ==========
  {
    town: 'kilifi',
    firstName: 'Omar',
    lastName: 'Bakari',
    email: 'omar.bakari@kilifi.com',
    category: 'Electrical Services',
    plan: 'trial',
    aboutMe: 'Electrician on trial in Kilifi.',
    headline: 'Electrician | Trial Plan (50km)',
    hourlyRate: 1400,
    yearsOfExperience: 3
  },
  {
    town: 'kilifi',
    firstName: 'Aisha',
    lastName: 'Mwinyi',
    email: 'aisha.mwinyi@kilifi.com',
    category: 'IT & Networking',
    plan: 'unlimited',
    aboutMe: 'IT consultant serving entire coastal region.',
    headline: 'IT Consultant | Unlimited Plan (1000km)',
    hourlyRate: 2200,
    yearsOfExperience: 8
  }
];

/**
 * Check if technician already exists for a user
 * @param {ObjectId} userId - The user ID to check
 * @returns {Promise<boolean>} True if technician exists
 */
async function technicianExists(userId) {
  const existing = await Technician.findOne({ userId });
  return !!existing;
}

/**
 * Create or update technician profile
 * @param {Object} profile - Technician profile data
 * @param {Object} town - Town coordinates and info
 * @param {Object} plan - Subscription plan details
 * @param {Object} categoryData - Service category data
 * @param {Object} user - User document
 */
async function createOrUpdateTechnician(profile, town, plan, categoryData, user) {
  const technicianData = {
    userId: user._id,
    aboutMe: profile.aboutMe,
    profileHeadline: profile.headline,
    skills: [
      { name: `${profile.category} Service`, level: 'Expert', yearsOfExperience: profile.yearsOfExperience }
    ],
    category: profile.category,
    serviceCategories: [{
      categoryName: categoryData.serviceCategory,
      subServices: categoryData.subServices,
      description: `${categoryData.serviceCategory} services in ${town.name}`,
      basePrice: profile.hourlyRate * 2,
      estimatedDuration: '2-4 hours'
    }],
    pricing: {
      hourlyRate: profile.hourlyRate,
      fixedPrice: 0,
      consultationFee: 500,
      currency: 'KES',
      paymentMethods: ['Cash', 'M-Pesa', 'Bank Transfer']
    },
    yearsOfExperience: profile.yearsOfExperience,
    experience: [{
      title: profile.headline,
      company: 'Self Employed',
      location: town.name,
      startDate: new Date(new Date().setFullYear(new Date().getFullYear() - profile.yearsOfExperience)),
      isCurrent: true,
      description: `Providing ${profile.category} services in ${town.name}.`
    }],
    address: {
      street: `${town.name} Main Road`,
      city: town.name,
      state: town.state,
      zipCode: '80100',
      country: 'Kenya'
    },
    location: {
      type: 'Point',
      coordinates: town.coords,
      formattedAddress: `${town.name}, ${town.state}, Kenya`
    },
    serviceRadius: plan.visibilityRadius,
    languages: [
      { name: 'English', proficiency: 'Fluent' },
      { name: 'Swahili', proficiency: 'Fluent' }
    ],
    availability: {
      monday: { enabled: true, hours: [{ start: '08:00', end: '18:00' }] },
      tuesday: { enabled: true, hours: [{ start: '08:00', end: '18:00' }] },
      wednesday: { enabled: true, hours: [{ start: '08:00', end: '18:00' }] },
      thursday: { enabled: true, hours: [{ start: '08:00', end: '18:00' }] },
      friday: { enabled: true, hours: [{ start: '08:00', end: '18:00' }] },
      saturday: { enabled: true, hours: [{ start: '09:00', end: '15:00' }] },
      sunday: { enabled: false, hours: [] }
    },
    emergencyAvailable: true,
    remoteServiceAvailable: true,
    weekendAvailable: true,
    subscription: {
      plan: profile.plan,
      planDetails: {
        name: plan.label,
        visibilityRadius: plan.visibilityRadius,
        price: plan.price,
        features: []
      },
      startDate: new Date(),
      endDate: profile.plan !== 'free' && profile.plan !== 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      trialEndDate: profile.plan === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      isTrial: profile.plan === 'trial',
      autoRenew: false
    },
    verificationStatus: 'verified',
    businessName: `${profile.firstName} ${profile.lastName} ${profile.category}`,
    isActive: true,
    isAvailable: true,
    rating: {
      average: 4.5 + Math.random() * 0.5,
      count: Math.floor(Math.random() * 30) + 10
    }
  };

  // Check if technician already exists
  const existingTechnician = await Technician.findOne({ userId: user._id });
  
  if (existingTechnician) {
    // Update existing technician
    Object.assign(existingTechnician, technicianData);
    await existingTechnician.save();
    return { created: false, updated: true };
  } else {
    // Create new technician
    const technician = new Technician(technicianData);
    await technician.save();
    return { created: true, updated: false };
  }
}

async function populateTechnicians() {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB\n');

    for (const profile of technicianProfiles) {
      const town = towns[profile.town];
      const plan = subscriptionPlans[profile.plan];
      
      if (!plan) {
        console.log(`  ⚠ Unknown plan: ${profile.plan} for ${profile.firstName} ${profile.lastName}, skipping...`);
        skippedCount++;
        continue;
      }
      
      const categoryData = categories[profile.category];
      
      if (!categoryData) {
        console.log(`  ⚠ Unknown category: ${profile.category} for ${profile.firstName} ${profile.lastName}, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Find or create user
      let user = await User.findOne({ email: profile.email });
      
      if (!user) {
        user = new User({
          email: profile.email,
          password: 'password123',
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone || '+254700000000',
          role: 'technician',
          profileImage: ''
        });
        await user.save();
        console.log(`✓ Created user: ${profile.firstName} ${profile.lastName}`);
      } else {
        // Ensure user role is technician
        if (user.role !== 'technician') {
          user.role = 'technician';
          await user.save();
        }
        console.log(`✓ Using existing user: ${profile.firstName} ${profile.lastName}`);
      }

      // Create or update technician
      const result = await createOrUpdateTechnician(profile, town, plan, categoryData, user);
      
      if (result.created) {
        console.log(`  ✓ Created: ${profile.firstName} ${profile.lastName} | ${profile.category} | ${plan.label}`);
        createdCount++;
      } else if (result.updated) {
        console.log(`  ✓ Updated: ${profile.firstName} ${profile.lastName} | ${profile.category} | ${plan.label}`);
        updatedCount++;
      }
    }

    console.log('\n✅ Population complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - New technicians created: ${createdCount}`);
    console.log(`   - Existing technicians updated: ${updatedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Total processed: ${technicianProfiles.length}`);
    
    // Summary by plan
    const planSummary = {};
    for (const profile of technicianProfiles) {
      planSummary[profile.plan] = (planSummary[profile.plan] || 0) + 1;
    }
    console.log('\n📋 By Subscription Plan:');
    for (const [plan, count] of Object.entries(planSummary)) {
      const planInfo = subscriptionPlans[plan];
      console.log(`   - ${planInfo?.label || plan}: ${count} technician(s)`);
    }
    
    // Summary by town
    const townSummary = {};
    for (const profile of technicianProfiles) {
      townSummary[profile.town] = (townSummary[profile.town] || 0) + 1;
    }
    console.log('\n📍 By Location:');
    for (const [town, count] of Object.entries(townSummary)) {
      console.log(`   - ${town}: ${count} technician(s)`);
    }

    // Summary by category
    const categorySummary = {};
    for (const profile of technicianProfiles) {
      categorySummary[profile.category] = (categorySummary[profile.category] || 0) + 1;
    }
    console.log('\n🔧 By Category:');
    for (const [category, count] of Object.entries(categorySummary)) {
      console.log(`   - ${category}: ${count} technician(s)`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the population script
populateTechnicians();