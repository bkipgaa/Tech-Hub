/**
 * Seed Service Catalog Database
 * =============================
 * 
 * This script populates the ServiceCatalog collection with all categories
 * and sub-services for the Weba-Hub platform.
 * 
 * Run with: node scripts/seedServiceCatalog.js
 * 
 * The script will:
 * 1. Connect to MongoDB using current driver settings
 * 2. Clear existing service catalog data
 * 3. Insert comprehensive service catalog with categories and sub-services
 * 4. Verify the data was inserted correctly
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import the ServiceCatalog model
const ServiceCatalog = require('../models/ServiceCatalog');

// Complete service catalog data matching Technician categories
const serviceCatalogData = [
  // ========== IT & NETWORKING ==========
  {
    mainCategory: 'IT & Networking',
    serviceCategories: [
      {
        name: 'Internet Services',
        description: 'Internet connectivity, WiFi setup, and network solutions',
        displayOrder: 1,
        isActive: true,
        tags: ['internet', 'wifi', 'network', 'broadband'],
        subServices: [
          {
            name: 'WiFi Setup & Configuration',
            description: 'Professional WiFi router setup and configuration',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Router', 'Internet connection'],
            requiredSkills: ['Network configuration'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Network Troubleshooting',
            description: 'Diagnose and fix network connectivity issues',
            suggestedPriceRange: { min: 1500, max: 8000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Access to network equipment'],
            requiredSkills: ['Network diagnostics', 'TCP/IP'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Network tester', 'Laptop'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Fiber Optic Installation',
            description: 'Fiber optic cable installation and termination',
            suggestedPriceRange: { min: 5000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Building access', 'Fiber cable'],
            requiredSkills: ['Fiber splicing', 'OTDR testing'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Fusion splicer', 'OTDR'],
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'CCTV & Security Systems',
        description: 'CCTV camera installation and security system setup',
        displayOrder: 2,
        isActive: true,
        tags: ['cctv', 'security', 'cameras', 'surveillance'],
        subServices: [
          {
            name: 'CCTV Camera Installation',
            description: 'Install and configure CCTV cameras',
            suggestedPriceRange: { min: 3000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Camera locations identified'],
            requiredSkills: ['CCTV installation', 'Cabling'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Drill', 'Cables', 'Monitor'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Security System Maintenance',
            description: 'Regular maintenance of security systems',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['System access'],
            requiredSkills: ['Security systems', 'Troubleshooting'],
            expertiseLevel: 'advanced',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Access Control Systems',
            description: 'Install biometric and card access systems',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Door preparation'],
            requiredSkills: ['Access control', 'Biometrics'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Access controller', 'Card reader'],
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Computer Repair & Maintenance',
        description: 'Computer hardware and software repair services',
        displayOrder: 3,
        isActive: true,
        tags: ['computer', 'repair', 'pc', 'laptop'],
        subServices: [
          {
            name: 'Hardware Repair',
            description: 'Fix computer hardware issues',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Computer access'],
            requiredSkills: ['Hardware diagnostics'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Screwdrivers', 'Multimeter'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Virus & Malware Removal',
            description: 'Remove viruses, malware, and spyware',
            suggestedPriceRange: { min: 1000, max: 3000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Computer access'],
            requiredSkills: ['Antivirus software', 'Malware removal'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Data Recovery',
            description: 'Recover lost or deleted data',
            suggestedPriceRange: { min: 2000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Storage device'],
            requiredSkills: ['Data recovery tools'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Data recovery software'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== ELECTRICAL SERVICES ==========
  {
    mainCategory: 'Electrical Services',
    serviceCategories: [
      {
        name: 'Residential Electrical',
        description: 'Home electrical services and installations',
        displayOrder: 1,
        isActive: true,
        tags: ['residential', 'home', 'house', 'electrical'],
        subServices: [
          {
            name: 'House Wiring & Rewiring',
            description: 'Complete house electrical wiring',
            suggestedPriceRange: { min: 20000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['House plan', 'Approved permit'],
            requiredSkills: ['Electrical wiring', 'Safety standards'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Wire strippers', 'Multimeter', 'Drill'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Lighting Installation',
            description: 'Install indoor and outdoor lighting',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Light fixtures'],
            requiredSkills: ['Lighting installation'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Ladder', 'Screwdrivers'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Ceiling Fan Installation',
            description: 'Install ceiling fans',
            suggestedPriceRange: { min: 1000, max: 3000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Ceiling fan'],
            requiredSkills: ['Fan installation'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Ladder', 'Screwdrivers'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Circuit Breaker Replacement',
            description: 'Replace faulty circuit breakers',
            suggestedPriceRange: { min: 1500, max: 5000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Access to breaker panel'],
            requiredSkills: ['Electrical safety', 'Breaker replacement'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Screwdrivers', 'Multimeter'],
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Commercial Electrical',
        description: 'Commercial and industrial electrical services',
        displayOrder: 2,
        isActive: true,
        tags: ['commercial', 'industrial', 'business'],
        subServices: [
          {
            name: 'Three-Phase Wiring',
            description: 'Three-phase electrical installation',
            suggestedPriceRange: { min: 30000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Commercial space access'],
            requiredSkills: ['Three-phase systems'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Three-phase tools', 'Safety gear'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Electrical Panel Upgrades',
            description: 'Upgrade electrical panels',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Power shutdown coordination'],
            requiredSkills: ['Panel upgrades'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Panel tools', 'Safety equipment'],
            isActive: true,
            displayOrder: 2
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== PLUMBING ==========
  {
    mainCategory: 'Plumbing',
    serviceCategories: [
      {
        name: 'General Plumbing',
        description: 'General plumbing repair and installation',
        displayOrder: 1,
        isActive: true,
        tags: ['plumbing', 'pipes', 'water', 'repair'],
        subServices: [
          {
            name: 'Leak Detection & Repair',
            description: 'Find and fix water leaks',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Water access'],
            requiredSkills: ['Leak detection'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Leak detector', 'Pipe wrenches'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Faucet Installation & Repair',
            description: 'Install or repair faucets',
            suggestedPriceRange: { min: 500, max: 2000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Faucet replacement'],
            requiredSkills: ['Faucet installation'],
            expertiseLevel: 'beginner',
            equipmentNeeded: true,
            commonEquipment: ['Wrenches', "Plumber's tape"],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Toilet Repair & Installation',
            description: 'Fix or install toilets',
            suggestedPriceRange: { min: 1000, max: 3000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Toilet access'],
            requiredSkills: ['Toilet repair'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Plunger', 'Wrench', 'Wax ring'],
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Drainage & Sewer',
        description: 'Drain cleaning and sewer services',
        displayOrder: 2,
        isActive: true,
        tags: ['drain', 'sewer', 'clog', 'cleaning'],
        subServices: [
          {
            name: 'Drain Cleaning & Unclogging',
            description: 'Clear clogged drains',
            suggestedPriceRange: { min: 1500, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Access to drain'],
            requiredSkills: ['Drain cleaning'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ["Plumber's snake", 'Drain auger'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Sewer Line Inspection',
            description: 'Inspect sewer lines with camera',
            suggestedPriceRange: { min: 3000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Access to cleanout'],
            requiredSkills: ['Camera inspection'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Sewer camera', 'Locator'],
            isActive: true,
            displayOrder: 2
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== HVAC SERVICES ==========
  {
    mainCategory: 'HVAC Services',
    serviceCategories: [
      {
        name: 'Air Conditioning',
        description: 'AC installation and repair services',
        displayOrder: 1,
        isActive: true,
        tags: ['ac', 'air conditioning', 'cooling'],
        subServices: [
          {
            name: 'AC Installation',
            description: 'Install new air conditioning units',
            suggestedPriceRange: { min: 5000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Window/wall space'],
            requiredSkills: ['AC installation'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Mounting kit', 'Tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'AC Repair',
            description: 'Repair faulty air conditioners',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['AC access'],
            requiredSkills: ['AC repair', 'Refrigerant handling'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Manifold gauge', 'Multimeter'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'AC Maintenance',
            description: 'Regular AC maintenance service',
            suggestedPriceRange: { min: 1500, max: 5000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['AC access'],
            requiredSkills: ['AC maintenance'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Cleaning tools', 'Coil cleaner'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== CARPENTRY & FURNITURE ==========
  {
    mainCategory: 'Carpentry & Furniture',
    serviceCategories: [
      {
        name: 'Furniture Making',
        description: 'Custom furniture design and construction',
        displayOrder: 1,
        isActive: true,
        tags: ['furniture', 'wood', 'custom'],
        subServices: [
          {
            name: 'Custom Furniture',
            description: 'Build custom furniture pieces',
            suggestedPriceRange: { min: 5000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 5, unit: 'days' },
            commonRequirements: ['Design specifications'],
            requiredSkills: ['Woodworking', 'Design'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Saw', 'Drill', 'Sander'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Furniture Repair',
            description: 'Repair damaged furniture',
            suggestedPriceRange: { min: 1000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Furniture access'],
            requiredSkills: ['Wood repair', 'Finishing'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Glue', 'Clamps', 'Sanding tools'],
            isActive: true,
            displayOrder: 2
          }
        ]
      }
    ],
    isActive: true
  }
];

/**
 * Main seeding function
 */
async function seedServiceCatalog() {
  try {
    // Get MongoDB URI from environment
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub';
    console.log('📡 MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials
    
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect without deprecated options
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}\n`);

    // Clear existing data
    console.log('🗑️  Clearing existing service catalog...');
    const deletedCount = await ServiceCatalog.deleteMany({});
    console.log(`✅ Cleared ${deletedCount.deletedCount} existing documents\n`);

    // Insert new data
    console.log('📝 Inserting service catalog data...');
    let insertedCount = 0;
    
    for (const catalog of serviceCatalogData) {
      const newCatalog = new ServiceCatalog(catalog);
      await newCatalog.save();
      insertedCount++;
      console.log(`  ✓ Added: ${catalog.mainCategory}`);
      console.log(`    - ${catalog.serviceCategories.length} service categories`);
      
      // Log sub-service counts for verification
      for (const category of catalog.serviceCategories) {
        const subServiceCount = category.subServices ? category.subServices.length : 0;
        console.log(`      • ${category.name}: ${subServiceCount} sub-services`);
      }
    }
    
    console.log(`\n✅ Successfully seeded ${insertedCount} main categories!`);
    
    // Verify the data
    console.log('\n🔍 Verifying inserted data...');
    const totalCount = await ServiceCatalog.countDocuments();
    console.log(`📊 Total documents in ServiceCatalog: ${totalCount}`);
    
    const allCatalogs = await ServiceCatalog.find({ isActive: true }).select('mainCategory');
    console.log('\n📋 Active catalogs in database:');
    allCatalogs.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.mainCategory}`);
    });
    
    // Get detailed statistics
    const stats = await ServiceCatalog.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$serviceCategories' },
      {
        $group: {
          _id: null,
          totalServiceCategories: { $sum: 1 },
          totalSubServices: { $sum: { $size: '$serviceCategories.subServices' } }
        }
      }
    ]);
    
    if (stats.length > 0) {
      console.log('\n📈 Catalog Statistics:');
      console.log(`   Total Service Categories: ${stats[0].totalServiceCategories}`);
      console.log(`   Total Sub-Services: ${stats[0].totalSubServices}`);
    }
    
    console.log('\n✨ Seeding completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error('Error details:', error);
  } finally {
    // Close the database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

// Run the seed function with error handling
seedServiceCatalog().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});