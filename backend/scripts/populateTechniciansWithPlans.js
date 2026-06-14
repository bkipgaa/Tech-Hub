/**
 * Populate IT & Networking Technicians for Coastal Region
 * ========================================================
 * 
 * This script creates technicians with subscription plans that match
 * the subscriptionPlans.js configuration exactly.
 * 
 * PLANS (matching subscriptionPlans.js):
 * - trial: Free Trial (10km) - 30 days
 * - basic: Basic (10km) - KES 500/month
 * - basicPlus: Basic-Plus (50km) - KES 1000/month
 * - premium: Premium (100km) - KES 1500/month
 * - business: Business (300km) - KES 2000/month
 * - enterprise: Enterprise (600km) - KES 3000/month
 * - unlimited: Unlimited (1000km) - KES 5000/month
 * 
 * TESTING SCENARIO: Client in MALINDI
 * 
 * DISTANCES FROM MALINDI:
 * - Malindi to Malindi: 0 km
 * - Malindi to Watamu: ~28 km
 * - Malindi to Kilifi: ~40 km  
 * - Malindi to Mombasa: ~120 km
 * 
 * VISIBILITY FROM MALINDI:
 * - trial (10km): Visible only in Malindi
 * - basic (10km): Visible only in Malindi
 * - basicPlus (50km): Visible in Malindi + Watamu + Kilifi
 * - premium (100km): Visible in Malindi + Watamu + Kilifi
 * - business (300km): Visible in ALL towns
 * - enterprise (600km): Visible in ALL towns
 * - unlimited (1000km): Visible in ALL towns
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Technician = require('../models/Technician');
const User = require('../models/User');
const { subscriptionPlans, plansList } = require('../utils/subscriptionPlans');

dotenv.config();

// Town coordinates (longitude, latitude)
const towns = {
  malindi: { 
    name: 'Malindi', 
    coords: [40.117, -3.218],
    state: 'Kilifi',
    lat: -3.218,
    lng: 40.117
  },
  watamu: { 
    name: 'Watamu', 
    coords: [39.9519, -3.3472],
    state: 'Kilifi',
    lat: -3.3472,
    lng: 39.9519
  },
  kilifi: { 
    name: 'Kilifi', 
    coords: [39.8440, -3.6305],
    state: 'Kilifi',
    lat: -3.6305,
    lng: 39.8440
  },
  mombasa: { 
    name: 'Mombasa', 
    coords: [39.6655, -4.0435],
    state: 'Mombasa',
    lat: -4.0435,
    lng: 39.6655
  }
};

// IT & Networking Sub-Categories and Sub-Services
const serviceCategories = [
  {
    name: 'Internet Services',
    subServices: ['WiFi Setup & Configuration', 'Network Troubleshooting', 'Fiber Optic Installation'],
    description: 'Professional internet setup and troubleshooting'
  },
  {
    name: 'CCTV & Security Systems',
    subServices: ['CCTV Camera Installation', 'Security System Maintenance', 'Access Control Systems'],
    description: 'Security camera and surveillance system installation'
  },
  {
    name: 'Computer Repair & Maintenance',
    subServices: ['Hardware Repair', 'Virus & Malware Removal', 'Data Recovery'],
    description: 'Computer hardware and software services'
  }
];

// Technician names for each town (7 unique technicians per town)
const getTechniciansForTown = (townName) => {
  const techniciansByTown = {
    malindi: [
      { firstName: 'John', lastName: 'Mwangi', serviceCat: 0, subServices: [0, 1], hourlyRate: 2000, exp: 8, about: 'Certified network engineer with 8 years experience.', headline: 'Network Engineer | WiFi & Fiber Specialist' },
      { firstName: 'Peter', lastName: 'Odhiambo', serviceCat: 0, subServices: [2, 1], hourlyRate: 2500, exp: 6, about: 'Fiber optic specialist serving Malindi area.', headline: 'Fiber Optic Technician | Network Specialist' },
      { firstName: 'Mary', lastName: 'Wanjiku', serviceCat: 1, subServices: [0, 1], hourlyRate: 2200, exp: 7, about: 'Security systems expert with 7 years experience.', headline: 'CCTV Installation Expert | Security Specialist' },
      { firstName: 'James', lastName: 'Kariuki', serviceCat: 2, subServices: [0, 2], hourlyRate: 1800, exp: 9, about: 'Computer hardware specialist with 9 years experience.', headline: 'Computer Repair Expert | Data Recovery Specialist' },
      { firstName: 'Grace', lastName: 'Atieno', serviceCat: 0, subServices: [1, 0], hourlyRate: 2100, exp: 5, about: 'Network engineer with 5 years experience.', headline: 'Network Engineer | IT Consultant' },
      { firstName: 'David', lastName: 'Omondi', serviceCat: 1, subServices: [2, 0], hourlyRate: 2800, exp: 10, about: 'Security systems engineer with 10 years experience.', headline: 'Senior Security Engineer | Access Control Expert' },
      { firstName: 'Sarah', lastName: 'Njeri', serviceCat: 2, subServices: [1, 0], hourlyRate: 1600, exp: 6, about: 'IT support specialist with 6 years experience.', headline: 'IT Support | Malware Removal Expert' }
    ],
    watamu: [
      { firstName: 'Michael', lastName: 'Mbuvi', serviceCat: 0, subServices: [0, 1], hourlyRate: 1900, exp: 5, about: 'Network specialist serving Watamu.', headline: 'Network Technician | WiFi Expert' },
      { firstName: 'Esther', lastName: 'Kanjogu', serviceCat: 1, subServices: [0, 1], hourlyRate: 2100, exp: 6, about: 'CCTV installation expert in Watamu.', headline: 'CCTV Specialist | Security Expert' },
      { firstName: 'Brian', lastName: 'Kipkirui', serviceCat: 2, subServices: [0, 1], hourlyRate: 1700, exp: 4, about: 'Computer repair technician.', headline: 'Computer Technician | Hardware Specialist' },
      { firstName: 'Lucy', lastName: 'Wambui', serviceCat: 0, subServices: [2, 1], hourlyRate: 2400, exp: 5, about: 'Fiber optic specialist.', headline: 'Fiber Optic Technician | Network Engineer' },
      { firstName: 'Rose', lastName: 'Achieng', serviceCat: 1, subServices: [2, 1], hourlyRate: 2600, exp: 7, about: 'Security systems expert.', headline: 'Security Engineer | Access Control Specialist' },
      { firstName: 'Tom', lastName: 'Mboya', serviceCat: 2, subServices: [2, 0], hourlyRate: 2300, exp: 8, about: 'Data recovery specialist.', headline: 'Data Recovery Expert | Computer Repair' },
      { firstName: 'Alice', lastName: 'Wanjiru', serviceCat: 0, subServices: [1, 0], hourlyRate: 2000, exp: 6, about: 'Network engineer.', headline: 'Network Engineer | IT Support Specialist' }
    ],
    kilifi: [
      { firstName: 'Francis', lastName: 'Kimathi', serviceCat: 0, subServices: [0, 2], hourlyRate: 2200, exp: 7, about: 'Network engineer serving Kilifi.', headline: 'Network Engineer | Fiber Optic Specialist' },
      { firstName: 'Catherine', lastName: 'Jelimo', serviceCat: 1, subServices: [0, 2], hourlyRate: 2300, exp: 6, about: 'Security systems expert.', headline: 'CCTV Specialist | Security Engineer' },
      { firstName: 'Samuel', lastName: 'Maina', serviceCat: 2, subServices: [0, 2], hourlyRate: 1800, exp: 5, about: 'Computer repair specialist.', headline: 'Computer Technician | Data Recovery Expert' },
      { firstName: 'Ruth', lastName: 'Chebet', serviceCat: 0, subServices: [1, 0], hourlyRate: 1900, exp: 4, about: 'Network engineer.', headline: 'Network Technician | IT Support' },
      { firstName: 'Joseph', lastName: 'Kipruto', serviceCat: 1, subServices: [1, 0], hourlyRate: 2000, exp: 5, about: 'Security systems technician.', headline: 'Security Technician | CCTV Expert' },
      { firstName: 'Martha', lastName: 'Njoki', serviceCat: 2, subServices: [1, 0], hourlyRate: 1600, exp: 4, about: 'IT support specialist.', headline: 'IT Support | Malware Removal Expert' },
      { firstName: 'William', lastName: 'Kipkemoi', serviceCat: 0, subServices: [2, 1], hourlyRate: 2600, exp: 6, about: 'Fiber optic engineer.', headline: 'Fiber Optic Engineer | Network Specialist' }
    ],
    mombasa: [
      { firstName: 'Ali', lastName: 'Hassan', serviceCat: 0, subServices: [2, 0], hourlyRate: 3000, exp: 10, about: 'Senior network engineer serving Mombasa.', headline: 'Senior Network Engineer | Fiber Optic Expert' },
      { firstName: 'Fatima', lastName: 'Mohamed', serviceCat: 1, subServices: [0, 2, 1], hourlyRate: 2800, exp: 8, about: 'Security systems engineer.', headline: 'Security Engineer | CCTV & Access Control Expert' },
      { firstName: 'Hamisi', lastName: 'Juma', serviceCat: 2, subServices: [0, 2, 1], hourlyRate: 2500, exp: 9, about: 'Computer repair expert.', headline: 'Master Technician | Data Recovery Specialist' },
      { firstName: 'Aisha', lastName: 'Mwinyi', serviceCat: 0, subServices: [1, 0], hourlyRate: 2700, exp: 7, about: 'Network consultant.', headline: 'Network Consultant | IT Security Expert' },
      { firstName: 'Omar', lastName: 'Bakari', serviceCat: 1, subServices: [1, 0], hourlyRate: 2100, exp: 5, about: 'Security systems technician.', headline: 'Security Technician | CCTV Maintenance' },
      { firstName: 'Zainab', lastName: 'Said', serviceCat: 2, subServices: [1, 0], hourlyRate: 2000, exp: 6, about: 'IT support specialist.', headline: 'IT Support | Cybersecurity Specialist' },
      { firstName: 'Ahmed', lastName: 'Salim', serviceCat: 0, subServices: [2, 1], hourlyRate: 2900, exp: 7, about: 'Fiber optic specialist.', headline: 'Fiber Optic Engineer | Network Expert' }
    ]
  };
  
  return techniciansByTown[townName];
};

// Helper function to calculate distance from Malindi
function getDistanceFromMalindi(townLat, townLng) {
  const malindiLat = -3.218;
  const malindiLng = 40.117;
  
  const R = 6371;
  const dLat = (townLat - malindiLat) * Math.PI / 180;
  const dLon = (townLng - malindiLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(malindiLat * Math.PI / 180) * Math.cos(townLat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Calculate distances
console.log('\n' + '='.repeat(60));
console.log('📍 DISTANCES FROM MALINDI');
console.log('='.repeat(60));
console.log(`   Malindi to Malindi: 0 km`);
console.log(`   Malindi to Watamu: ${getDistanceFromMalindi(towns.watamu.lat, towns.watamu.lng)} km`);
console.log(`   Malindi to Kilifi: ${getDistanceFromMalindi(towns.kilifi.lat, towns.kilifi.lng)} km`);
console.log(`   Malindi to Mombasa: ${getDistanceFromMalindi(towns.mombasa.lat, towns.mombasa.lng)} km\n`);

// Display subscription plans being used
console.log('='.repeat(60));
console.log('💳 SUBSCRIPTION PLANS (from subscriptionPlans.js)');
console.log('='.repeat(60));
for (const plan of plansList) {
  console.log(`   ${plan.id}: ${plan.name} - ${plan.visibilityRadius}km - KES ${plan.price}/month`);
}
console.log('');

async function populateTechnicians() {
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔧 Creating IT & Networking Technicians...\n');
    console.log('='.repeat(80));
    
    const townNames = ['malindi', 'watamu', 'kilifi', 'mombasa'];
    
    for (const townName of townNames) {
      const town = towns[townName];
      const techniciansList = getTechniciansForTown(townName);
      
      console.log(`\n📍 ${town.name.toUpperCase()} (${techniciansList.length} technicians)`);
      console.log('-'.repeat(50));
      
      for (let i = 0; i < techniciansList.length; i++) {
        const profile = techniciansList[i];
        const plan = plansList[i]; // Match index with plan order
        const planDetails = subscriptionPlans[plan.id];
        const serviceCat = serviceCategories[profile.serviceCat];
        
        const subServiceNames = profile.subServices.map(idx => serviceCat.subServices[idx]);
        
        // Generate unique email
        const email = `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}@${townName}.com`;
        const phone = `+2547${12345000 + (townNames.indexOf(townName) * 7) + i}`;
        
        try {
          // Find or create user
          let user = await User.findOne({ email });
          
          if (!user) {
            user = new User({
              email,
              password: 'password123',
              firstName: profile.firstName,
              lastName: profile.lastName,
              phone,
              role: 'technician',
              profileImage: ''
            });
            await user.save();
          } else if (user.role !== 'technician') {
            user.role = 'technician';
            await user.save();
          }
          
          // Check if technician already exists
          let technician = await Technician.findOne({ userId: user._id });
          
          // Calculate end dates based on plan
          const endDate = plan.id !== 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
          const trialEndDate = plan.id === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
          
          const technicianData = {
            userId: user._id,
            aboutMe: profile.about,
            profileHeadline: profile.headline,
            skills: [
              { name: `${serviceCat.name}`, level: 'Expert', yearsOfExperience: profile.exp },
              { name: 'Customer Service', level: 'Advanced', yearsOfExperience: profile.exp },
              { name: 'Technical Support', level: 'Expert', yearsOfExperience: profile.exp }
            ],
            category: 'IT & Networking',
            serviceCategories: [{
              categoryName: serviceCat.name,
              subServices: subServiceNames,
              description: serviceCat.description,
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
            yearsOfExperience: profile.exp,
            experience: [{
              title: profile.headline,
              company: 'Self Employed',
              location: town.name,
              startDate: new Date(new Date().setFullYear(new Date().getFullYear() - profile.exp)),
              isCurrent: true,
              description: `Providing IT & Networking services in ${town.name}.`
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
            serviceRadius: planDetails.visibilityRadius,
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
              plan: plan.id,
              planDetails: {
                name: planDetails.name,
                visibilityRadius: planDetails.visibilityRadius,
                price: planDetails.price,
                features: planDetails.features
              },
              startDate: new Date(),
              endDate: endDate,
              trialEndDate: trialEndDate,
              isTrial: plan.id === 'trial',
              autoRenew: false
            },
            verificationStatus: 'verified',
            businessName: `${profile.firstName} ${profile.lastName} - IT Solutions`,
            isActive: true,
            isAvailable: true,
            rating: {
              average: 4.5 + (Math.random() * 0.5),
              count: Math.floor(Math.random() * 30) + 10
            }
          };
          
          if (technician) {
            Object.assign(technician, technicianData);
            await technician.save();
            console.log(`  ✏️ Updated: ${profile.firstName} ${profile.lastName} | ${plan.name} (${plan.visibilityRadius}km) | ${town.name}`);
            updatedCount++;
          } else {
            technician = new Technician(technicianData);
            await technician.save();
            console.log(`  ✅ Created: ${profile.firstName} ${profile.lastName} | ${plan.name} (${plan.visibilityRadius}km) | ${town.name}`);
            createdCount++;
          }
        } catch (err) {
          console.error(`  ❌ Error creating ${profile.firstName} ${profile.lastName}:`, err.message);
          errorCount++;
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 POPULATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ✏️ Updated: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total: ${createdCount + updatedCount}`);
    console.log(`   📍 Towns: Malindi, Watamu, Kilifi, Mombasa`);
    console.log(`   📂 Category: IT & Networking Only`);
    console.log(`   💳 Plans: ${plansList.map(p => p.name).join(', ')}`);
    
    // Visibility Summary from Malindi
    console.log('\n' + '='.repeat(80));
    console.log('📍 VISIBILITY FROM MALINDI (Client at Malindi)');
    console.log('='.repeat(80));
    
    console.log('\n📋 Expected visible technicians based on subscription plans:\n');
    
    for (const plan of plansList) {
      const visibleTowns = [];
      const notVisibleTowns = [];
      
      for (const [townName, town] of Object.entries(towns)) {
        const distance = getDistanceFromMalindi(town.lat, town.lng);
        if (distance <= plan.visibilityRadius) {
          visibleTowns.push(town.name);
        } else {
          notVisibleTowns.push(town.name);
        }
      }
      
      console.log(`   📌 ${plan.name} (${plan.visibilityRadius}km):`);
      console.log(`      ✅ Visible in: ${visibleTowns.join(', ') || 'none'}`);
      if (notVisibleTowns.length > 0) {
        console.log(`      ❌ NOT visible in: ${notVisibleTowns.join(', ')}`);
      }
      console.log('');
    }
    
    // Town-wise breakdown
    console.log('\n📋 Town-wise breakdown from Malindi:\n');
    
    for (const [townName, town] of Object.entries(towns)) {
      const distance = getDistanceFromMalindi(town.lat, town.lng);
      const visiblePlans = plansList.filter(plan => distance <= plan.visibilityRadius);
      
      console.log(`   📍 ${town.name.toUpperCase()}: ${distance}km away`);
      console.log(`      Total technicians: 7`);
      console.log(`      Visible plans: ${visiblePlans.map(p => p.name).join(', ')}`);
      console.log(`      Visible technicians: ${visiblePlans.length} out of 7`);
      console.log('');
    }
    
    // Test URLs
    console.log('='.repeat(80));
    console.log('🔍 TEST YOUR SEARCH FROM MALINDI:');
    console.log('='.repeat(80));
    console.log('\n1. Search within 10km (only Malindi technicians):');
    console.log('   GET /api/search/technicians?mainCategory=IT%20%26%20Networking&serviceCategory=Internet%20Services&subService=WiFi%20Setup%20%26%20Configuration&lat=-3.218&lng=40.117&radius=10\n');
    
    console.log('2. Search within 50km (Malindi + Watamu + Kilifi):');
    console.log('   GET /api/search/technicians?mainCategory=IT%20%26%20Networking&serviceCategory=CCTV%20%26%20Security%20Systems&subService=CCTV%20Camera%20Installation&lat=-3.218&lng=40.117&radius=50\n');
    
    console.log('3. Search within 300km (All coastal towns):');
    console.log('   GET /api/search/technicians?mainCategory=IT%20%26%20Networking&serviceCategory=Computer%20Repair%20%26%20Maintenance&subService=Hardware%20Repair&lat=-3.218&lng=40.117&radius=300\n');
    
    console.log('4. Nearby search (default 10km):');
    console.log('   GET /api/search/nearby?lat=-3.218&lng=40.117\n');
    
    console.log('\n📊 EXPECTED RESULTS SUMMARY:');
    console.log('   - Radius 10km: ~7 technicians (only Malindi)');
    console.log('   - Radius 50km: ~21 technicians (Malindi + Watamu + Kilifi)');
    console.log('   - Radius 300km: ~28 technicians (ALL towns)\n');
    
  } catch (error) {
    console.error('❌ Fatal Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the population
populateTechnicians();