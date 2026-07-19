/**
 * Populate Technicians Script
 * ===========================
 * Creates test technicians across different Kenyan towns
 * Updated to use three-level service hierarchy:
 * Level 1: mainCategory (string) + mainCategories (array)
 * Level 2: serviceCategories (with categoryName and mainCategory)
 * Level 3: subServices
 * 
 * @version 3.0.0
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
  nairobi: { name: 'Nairobi', coords: [36.5177334, -1.3031874], state: 'Nairobi' }
};

// Service categories and sub-services - THREE LEVEL HIERARCHY
const serviceData = {
  'IT & Networking': {
    serviceCategories: [
      {
        name: 'Internet Services',
        subServices: ['WiFi Setup & Configuration', 'Network Troubleshooting', 'Fiber Optic Installation', 'Mesh Network Installation']
      },
      {
        name: 'CCTV & Security Systems',
        subServices: ['CCTV Camera Installation', 'Security System Maintenance', 'Access Control Systems']
      },
      {
        name: 'Computer Repair & Maintenance',
        subServices: ['Hardware Repair', 'Virus & Malware Removal', 'Data Recovery']
      }
    ]
  },
  'Electrical Services': {
    serviceCategories: [
      {
        name: 'Residential Electrical',
        subServices: ['House Wiring & Rewiring', 'Lighting Installation', 'Ceiling Fan Installation', 'Circuit Breaker Replacement']
      },
      {
        name: 'Commercial Electrical',
        subServices: ['Three-Phase Wiring', 'Electrical Panel Upgrades']
      }
    ]
  },
  'Mechanical Services': {
    serviceCategories: [
      {
        name: 'HVAC Services',
        subServices: ['AC Installation & Repair', 'Ventilation System Maintenance', 'Heating System Repair']
      },
      {
        name: 'General Mechanical',
        subServices: ['Mechanical Repair', 'Equipment Maintenance', 'Industrial Machinery']
      }
    ]
  },
  'Plumbing': {
    serviceCategories: [
      {
        name: 'General Plumbing',
        subServices: ['Leak Detection & Repair', 'Faucet Installation & Repair', 'Toilet Repair & Installation']
      },
      {
        name: 'Drainage & Sewer',
        subServices: ['Drain Cleaning & Unclogging', 'Sewer Line Inspection']
      }
    ]
  },
  'Programming & AI': {
    serviceCategories: [
      {
        name: 'Web Development',
        subServices: ['Frontend Development', 'Backend Development', 'Full Stack Development']
      },
      {
        name: 'Mobile Development',
        subServices: ['Android Development', 'iOS Development', 'Cross Platform Development']
      },
      {
        name: 'AI & Machine Learning',
        subServices: ['Data Analysis', 'ML Model Development', 'AI Solutions']
      }
    ]
  },
  'Hairdressing & Beauty': {
    serviceCategories: [
      {
        name: 'Hair Services',
        subServices: ['Haircut', 'Styling', 'Coloring', 'Braiding']
      },
      {
        name: 'Beauty Services',
        subServices: ['Makeup', 'Nail Art', 'Facials', 'Waxing']
      }
    ]
  },
  'Carpentry & Furniture': {
    serviceCategories: [
      {
        name: 'Custom Furniture',
        subServices: ['Custom Furniture Making', 'Furniture Repair', 'Furniture Restoration']
      },
      {
        name: 'Cabinetry',
        subServices: ['Kitchen Cabinets', 'Wardrobes', 'Storage Units']
      }
    ]
  },
  'Laundry & Dry Cleaning': {
    serviceCategories: [
      {
        name: 'Laundry Services',
        subServices: ['Wash & Fold', 'Dry Cleaning', 'Ironing Services']
      },
      {
        name: 'Specialty Cleaning',
        subServices: ['Wedding Dress Cleaning', 'Leather Cleaning', 'Curtain Cleaning']
      }
    ]
  },
  'Cleaning Services': {
    serviceCategories: [
      {
        name: 'Residential Cleaning',
        subServices: ['Deep House Cleaning', 'Standard House Cleaning', 'Move In/Out Cleaning']
      },
      {
        name: 'Commercial Cleaning',
        subServices: ['Office Cleaning', 'Restaurant Cleaning', 'Industrial Cleaning']
      }
    ]
  },
  'Painting & Decorating': {
    serviceCategories: [
      {
        name: 'Painting Services',
        subServices: ['Interior Painting', 'Exterior Painting', 'Spray Painting']
      },
      {
        name: 'Decorating Services',
        subServices: ['Wallpaper Installation', 'Decorative Finishes', 'Faux Finishing']
      }
    ]
  },
  'Welding & Fabrication': {
    serviceCategories: [
      {
        name: 'Welding Services',
        subServices: ['MIG Welding', 'TIG Welding', 'Arc Welding']
      },
      {
        name: 'Fabrication',
        subServices: ['Metal Fabrication', 'Steel Structures', 'Custom Metal Work']
      }
    ]
  },
  'Automotive Repair': {
    serviceCategories: [
      {
        name: 'Engine & Mechanical',
        subServices: ['Engine Diagnostics', 'Brake Service', 'Oil Change', 'Transmission Repair']
      },
      {
        name: 'Body & Paint',
        subServices: ['Panel Beating', 'Spray Painting', 'Rust Removal']
      }
    ]
  },
  'Tutoring & Training': {
    serviceCategories: [
      {
        name: 'Academic Tutoring',
        subServices: ['Mathematics', 'Science', 'Languages', 'Test Preparation']
      },
      {
        name: 'Professional Training',
        subServices: ['IT Training', 'Business Skills', 'Soft Skills', 'Leadership Training']
      }
    ]
  },
  'Photography & Videography': {
    serviceCategories: [
      {
        name: 'Photography',
        subServices: ['Wedding Photography', 'Event Photography', 'Portrait Photography', 'Product Photography']
      },
      {
        name: 'Videography',
        subServices: ['Event Videography', 'Wedding Videography', 'Corporate Video', 'Drone Videography']
      }
    ]
  },
  'Event Planning': {
    serviceCategories: [
      {
        name: 'Event Planning',
        subServices: ['Wedding Planning', 'Corporate Events', 'Birthday Parties', 'Conferences']
      },
      {
        name: 'Event Services',
        subServices: ['Catering', 'Decorations', 'Entertainment', 'Event Photography']
      }
    ]
  },
  'Construction & Renovation': {
    serviceCategories: [
      {
        name: 'Construction',
        subServices: ['Building Construction', 'Roofing', 'Flooring', 'Tiling']
      },
      {
        name: 'Renovation',
        subServices: ['Home Renovation', 'Kitchen Remodeling', 'Bathroom Renovation', 'Basement Finishing']
      }
    ]
  },
  'HVAC Services': {
    serviceCategories: [
      {
        name: 'HVAC Installation',
        subServices: ['AC Installation', 'Heating Installation', 'Ventilation Installation']
      },
      {
        name: 'HVAC Maintenance',
        subServices: ['AC Repair', 'Heating Repair', 'Filter Replacement', 'System Maintenance']
      }
    ]
  },
  'Appliance Repair': {
    serviceCategories: [
      {
        name: 'Kitchen Appliances',
        subServices: ['Refrigerator Repair', 'Oven Repair', 'Dishwasher Repair', 'Microwave Repair']
      },
      {
        name: 'Laundry Appliances',
        subServices: ['Washing Machine Repair', 'Dryer Repair', 'Washer/Dryer Combo']
      }
    ]
  },
  'Moving & Logistics': {
    serviceCategories: [
      {
        name: 'Moving Services',
        subServices: ['Local Moving', 'Long Distance Moving', 'Packing Services', 'Unpacking Services']
      },
      {
        name: 'Logistics',
        subServices: ['Storage Services', 'Delivery Services', 'Freight Services']
      }
    ]
  },
  'Gardening & Landscaping': {
    serviceCategories: [
      {
        name: 'Gardening',
        subServices: ['Lawn Care', 'Tree Services', 'Irrigation Systems', 'Garden Design']
      },
      {
        name: 'Landscaping',
        subServices: ['Landscape Design', 'Hardscaping', 'Planting Services', 'Landscape Maintenance']
      }
    ]
  }
};

// Technician profiles to create - UPDATED with mainCategory
const technicianProfiles = [
  // ========== MALINDI (2 technicians) ==========
  {
    town: 'malindi',
    firstName: 'John',
    lastName: 'Mwangi',
    email: 'john.mwangi@example.com',
    phone: '+254712345001',
    mainCategory: 'IT & Networking',
    serviceCategory: 'Internet Services',
    subServices: ['WiFi Setup & Configuration', 'Network Troubleshooting'],
    aboutMe: 'Certified network engineer with 8 years experience in ISP and enterprise networks.',
    headline: 'Network Engineer | Fiber Optic Specialist',
    skills: [
      { name: 'Network Configuration', level: 'Expert', yearsOfExperience: 8 },
      { name: 'Fiber Optics', level: 'Advanced', yearsOfExperience: 5 },
      { name: 'CCTV Installation', level: 'Intermediate', yearsOfExperience: 3 }
    ],
    hourlyRate: 2000,
    yearsOfExperience: 8
  },
  {
    town: 'malindi',
    firstName: 'Peter',
    lastName: 'Odhiambo',
    email: 'peter.odhiambo@example.com',
    phone: '+254712345002',
    mainCategory: 'Electrical Services',
    serviceCategory: 'Residential Electrical',
    subServices: ['House Wiring & Rewiring', 'Lighting Installation', 'Ceiling Fan Installation'],
    aboutMe: 'Licensed electrician with 10 years experience in residential and commercial installations.',
    headline: 'Master Electrician | Licensed Contractor',
    skills: [
      { name: 'House Wiring', level: 'Expert', yearsOfExperience: 10 },
      { name: 'Circuit Breakers', level: 'Advanced', yearsOfExperience: 8 },
      { name: 'Lighting Systems', level: 'Expert', yearsOfExperience: 10 }
    ],
    hourlyRate: 1800,
    yearsOfExperience: 10
  },

  // ========== WATAMU (2 technicians) ==========
  {
    town: 'watamu',
    firstName: 'Mary',
    lastName: 'Wanjiku',
    email: 'mary.wanjiku@example.com',
    phone: '+254712345003',
    mainCategory: 'Plumbing',
    serviceCategory: 'General Plumbing',
    subServices: ['Leak Detection & Repair', 'Faucet Installation & Repair', 'Toilet Repair & Installation'],
    aboutMe: 'Professional plumber with 7 years experience in residential and commercial plumbing.',
    headline: 'Certified Plumber | Leak Detection Expert',
    skills: [
      { name: 'Pipe Installation', level: 'Expert', yearsOfExperience: 7 },
      { name: 'Leak Detection', level: 'Advanced', yearsOfExperience: 5 },
      { name: 'Drain Cleaning', level: 'Intermediate', yearsOfExperience: 4 }
    ],
    hourlyRate: 1500,
    yearsOfExperience: 7
  },
  {
    town: 'watamu',
    firstName: 'James',
    lastName: 'Kariuki',
    email: 'james.kariuki@example.com',
    phone: '+254712345004',
    mainCategory: 'IT & Networking',
    serviceCategory: 'CCTV & Security Systems',
    subServices: ['CCTV Camera Installation', 'Security System Maintenance'],
    aboutMe: 'Security systems expert with 6 years experience in CCTV and access control.',
    headline: 'CCTV Specialist | Security Systems Expert',
    skills: [
      { name: 'CCTV Installation', level: 'Expert', yearsOfExperience: 6 },
      { name: 'Access Control', level: 'Advanced', yearsOfExperience: 4 },
      { name: 'Network Setup', level: 'Intermediate', yearsOfExperience: 3 }
    ],
    hourlyRate: 2200,
    yearsOfExperience: 6
  },

  // ========== KILIFI (2 technicians) ==========
  {
    town: 'kilifi',
    firstName: 'Grace',
    lastName: 'Atieno',
    email: 'grace.atieno@example.com',
    phone: '+254712345005',
    mainCategory: 'Electrical Services',
    serviceCategory: 'Commercial Electrical',
    subServices: ['Three-Phase Wiring', 'Electrical Panel Upgrades'],
    aboutMe: 'Commercial electrician specializing in industrial and business electrical systems.',
    headline: 'Commercial Electrician | Industrial Specialist',
    skills: [
      { name: 'Three-Phase Systems', level: 'Expert', yearsOfExperience: 9 },
      { name: 'Panel Upgrades', level: 'Advanced', yearsOfExperience: 7 },
      { name: 'Industrial Wiring', level: 'Expert', yearsOfExperience: 8 }
    ],
    hourlyRate: 2500,
    yearsOfExperience: 9
  },
  {
    town: 'kilifi',
    firstName: 'David',
    lastName: 'Omondi',
    email: 'david.omondi@example.com',
    phone: '+254712345006',
    mainCategory: 'Plumbing',
    serviceCategory: 'Drainage & Sewer',
    subServices: ['Drain Cleaning & Unclogging', 'Sewer Line Inspection'],
    aboutMe: 'Drainage and sewer specialist with 5 years experience in pipe inspection and cleaning.',
    headline: 'Drainage Expert | Sewer Line Specialist',
    skills: [
      { name: 'Drain Cleaning', level: 'Advanced', yearsOfExperience: 5 },
      { name: 'Sewer Inspection', level: 'Advanced', yearsOfExperience: 4 },
      { name: 'Pipe Repair', level: 'Intermediate', yearsOfExperience: 3 }
    ],
    hourlyRate: 1600,
    yearsOfExperience: 5
  },

  // ========== MOMBASA (2 technicians) ==========
  {
    town: 'mombasa',
    firstName: 'Sarah',
    lastName: 'Hassan',
    email: 'sarah.hassan@example.com',
    phone: '+254712345007',
    mainCategory: 'IT & Networking',
    serviceCategory: 'Computer Repair & Maintenance',
    subServices: ['Hardware Repair', 'Virus & Malware Removal', 'Data Recovery'],
    aboutMe: 'IT support specialist with 6 years experience in computer repair and data recovery.',
    headline: 'Computer Repair Expert | Data Recovery Specialist',
    skills: [
      { name: 'Hardware Repair', level: 'Expert', yearsOfExperience: 6 },
      { name: 'Data Recovery', level: 'Advanced', yearsOfExperience: 4 },
      { name: 'Malware Removal', level: 'Advanced', yearsOfExperience: 5 }
    ],
    hourlyRate: 2000,
    yearsOfExperience: 6
  },
  {
    town: 'mombasa',
    firstName: 'Michael',
    lastName: 'Mbuvi',
    email: 'michael.mbuvi@example.com',
    phone: '+254712345008',
    mainCategory: 'Electrical Services',
    serviceCategory: 'Residential Electrical',
    subServices: ['House Wiring & Rewiring', 'Circuit Breaker Replacement', 'Lighting Installation'],
    aboutMe: 'Residential electrician with 12 years experience serving Mombasa and coastal region.',
    headline: 'Senior Electrician | Home Wiring Expert',
    skills: [
      { name: 'House Wiring', level: 'Expert', yearsOfExperience: 12 },
      { name: 'Breaker Panels', level: 'Expert', yearsOfExperience: 10 },
      { name: 'Troubleshooting', level: 'Advanced', yearsOfExperience: 8 }
    ],
    hourlyRate: 2000,
    yearsOfExperience: 12
  },

  // ========== NAIROBI (2 technicians) ==========
  {
    town: 'nairobi',
    firstName: 'Brian',
    lastName: 'Kipkirui',
    email: 'brian.kipkirui@example.com',
    phone: '+254712345009',
    mainCategory: 'IT & Networking',
    serviceCategory: 'Internet Services',
    subServices: ['Fiber Optic Installation', 'WiFi Setup & Configuration', 'Network Troubleshooting'],
    aboutMe: 'Network engineer specializing in fiber optic installations and enterprise networks.',
    headline: 'Senior Network Engineer | Fiber Optic Specialist',
    skills: [
      { name: 'Fiber Optics', level: 'Expert', yearsOfExperience: 7 },
      { name: 'Network Security', level: 'Advanced', yearsOfExperience: 5 },
      { name: 'Cloud Computing', level: 'Advanced', yearsOfExperience: 4 }
    ],
    hourlyRate: 3000,
    yearsOfExperience: 7
  },
  {
    town: 'nairobi',
    firstName: 'Lucy',
    lastName: 'Wambui',
    email: 'lucy.wambui@example.com',
    phone: '+254712345010',
    mainCategory: 'Plumbing',
    serviceCategory: 'General Plumbing',
    subServices: ['Leak Detection & Repair', 'Faucet Installation & Repair', 'Toilet Repair & Installation'],
    aboutMe: 'Professional plumber serving Nairobi with 8 years experience in residential plumbing.',
    headline: 'Master Plumber | Emergency Plumbing',
    skills: [
      { name: 'Pipe Fitting', level: 'Expert', yearsOfExperience: 8 },
      { name: 'Water Heaters', level: 'Advanced', yearsOfExperience: 6 },
      { name: 'Leak Repair', level: 'Expert', yearsOfExperience: 8 }
    ],
    hourlyRate: 1800,
    yearsOfExperience: 8
  }
];

async function populateTechnicians() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // First, check if users exist or create temporary ones
    console.log('\n📋 Creating technicians...\n');

    for (const profile of technicianProfiles) {
      const town = towns[profile.town];
      
      // Find or create a user for this technician
      let user = await User.findOne({ email: profile.email });
      
      if (!user) {
        // Create a new user
        user = new User({
          email: profile.email,
          password: 'password123', // You should change this
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          role: 'technician',
          profileImage: '',
          isVerified: true
        });
        await user.save();
        console.log(`  ✓ Created user: ${profile.firstName} ${profile.lastName} (${profile.email})`);
      } else {
        // Update existing user to technician role
        user.role = 'technician';
        await user.save();
        console.log(`  ✓ Using existing user: ${profile.firstName} ${profile.lastName}`);
      }

      // Check if technician profile already exists
      const existingTech = await Technician.findOne({ userId: user._id });
      
      if (existingTech) {
        console.log(`  ⚠ Technician profile already exists for ${profile.firstName} ${profile.lastName}, skipping...`);
        continue;
      }

      // Create technician profile with THREE-LEVEL HIERARCHY
      const technician = new Technician({
        userId: user._id,
        aboutMe: profile.aboutMe,
        profileHeadline: profile.headline,
        skills: profile.skills,
        
        // ✅ Level 1: mainCategory (string) + mainCategories (array)
        mainCategory: profile.mainCategory,
        mainCategories: [profile.mainCategory], // NEW: array for multiple (future expansion)
        
        // ✅ Level 2 & 3: serviceCategories with categoryName, subServices, and mainCategory
        serviceCategories: [{
          mainCategory: profile.mainCategory, // Link to Level 1
          categoryName: profile.serviceCategory,
          subServices: profile.subServices,
          description: `${profile.serviceCategory} services for ${town.name} area`,
          basePrice: profile.hourlyRate * 2,
          estimatedDuration: '2-4 hours',
          isActive: true,
          displayOrder: 0
        }],
        
        pricing: {
          hourlyRate: profile.hourlyRate,
          fixedPrice: 0,
          consultationFee: 500,
          currency: 'KES',
          paymentMethods: ['Cash', 'M-Pesa', 'Bank Transfer']
        },
        yearsOfExperience: profile.yearsOfExperience,
        experience: [
          {
            title: profile.headline,
            company: 'Self Employed',
            location: town.name,
            startDate: new Date(new Date().setFullYear(new Date().getFullYear() - profile.yearsOfExperience)),
            isCurrent: true,
            description: `Providing ${profile.mainCategory} services in ${town.name} and surrounding areas.`
          }
        ],
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
        serviceRadius: 50,
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
        businessName: `${profile.firstName} ${profile.lastName} ${profile.mainCategory}`,
        verificationStatus: 'verified',
        isActive: true,
        isAvailable: true,
        rating: {
          average: 4.5 + Math.random() * 0.5,
          count: Math.floor(Math.random() * 50) + 10
        }
      });

      await technician.save();
      console.log(`  ✓ Created technician: ${profile.firstName} ${profile.lastName} - ${profile.mainCategory} (${town.name})`);
    }

    console.log('\n✅ Population complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Total technicians created: ${technicianProfiles.length}`);
    console.log('\n📍 Technicians by location:');
    
    const byTown = {};
    for (const profile of technicianProfiles) {
      const townName = towns[profile.town].name;
      byTown[townName] = (byTown[townName] || 0) + 1;
    }
    for (const [town, count] of Object.entries(byTown)) {
      console.log(`   - ${town}: ${count} technician(s)`);
    }
    
    console.log('\n📂 Categories breakdown:');
    const byCategory = {};
    for (const profile of technicianProfiles) {
      byCategory[profile.mainCategory] = (byCategory[profile.mainCategory] || 0) + 1;
    }
    for (const [category, count] of Object.entries(byCategory)) {
      console.log(`   - ${category}: ${count} technician(s)`);
    }

  } catch (error) {
    console.error('Error populating technicians:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
populateTechnicians();