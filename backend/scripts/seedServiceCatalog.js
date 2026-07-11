/**
 * Seed Service Catalog Database
 * =============================
 * 
 * This script populates the ServiceCatalog collection with ALL categories
 * and sub-services for the Weba-Hub platform.
 * 
 * Run with: node scripts/seedServiceCatalog.js
 * 
 * The script will:
 * 1. Connect to MongoDB using current driver settings
 * 2. Clear existing service catalog data
 * 3. Insert ALL 20 comprehensive service categories with sub-services
 * 4. Verify the data was inserted correctly
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import the ServiceCatalog model
const ServiceCatalog = require('../models/ServiceCatalog');

// ============================================
// COMPLETE SERVICE CATALOG DATA - ALL 20 CATEGORIES
// ============================================

const serviceCatalogData = [
  // ========== 1. IT & NETWORKING ==========
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
          },
          {
            name: 'Mesh Network Installation',
            description: 'Whole-home mesh WiFi system setup',
            suggestedPriceRange: { min: 3000, max: 8000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Mesh system', 'Power outlets'],
            requiredSkills: ['Mesh network configuration'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 4
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

  // ========== 2. ELECTRICAL SERVICES ==========
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

  // ========== 3. PLUMBING ==========
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

  // ========== 4. MECHANICAL SERVICES ==========
  {
    mainCategory: 'Mechanical Services',
    serviceCategories: [
      {
        name: 'General Mechanical',
        description: 'General mechanical repair and maintenance',
        displayOrder: 1,
        isActive: true,
        tags: ['mechanical', 'repair', 'maintenance'],
        subServices: [
          {
            name: 'Mechanical Repair',
            description: 'Repair of mechanical equipment and systems',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Equipment access'],
            requiredSkills: ['Mechanical repair', 'Diagnostics'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Tool set', 'Diagnostic tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Equipment Maintenance',
            description: 'Preventive maintenance for mechanical equipment',
            suggestedPriceRange: { min: 1500, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Equipment access'],
            requiredSkills: ['Maintenance', 'Lubrication'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Lubrication tools', 'Cleaning supplies'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Industrial Machinery',
            description: 'Industrial machinery repair and maintenance',
            suggestedPriceRange: { min: 5000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Factory access', 'Safety clearance'],
            requiredSkills: ['Industrial machinery', 'Hydraulics'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Heavy tools', 'Safety gear'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 5. HVAC SERVICES (STANDALONE MAIN CATEGORY) ==========
  {
    mainCategory: 'HVAC Services',
    serviceCategories: [
      {
        name: 'Air Conditioning',
        description: 'AC installation, repair, and maintenance services',
        displayOrder: 1,
        isActive: true,
        tags: ['ac', 'air conditioning', 'cooling', 'repair'],
        subServices: [
          {
            name: 'AC Installation',
            description: 'Install new air conditioning units',
            suggestedPriceRange: { min: 5000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Window/wall space', 'Electrical outlet near installation point'],
            requiredSkills: ['AC installation', 'Electrical wiring', 'Refrigerant handling'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Mounting kit', 'Drill', 'Manifold gauge', 'Vacuum pump', 'Electrical tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'AC Repair',
            description: 'Repair faulty air conditioners',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['AC unit access', 'Power source for testing'],
            requiredSkills: ['AC repair', 'Refrigerant handling', 'Electrical diagnostics'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Manifold gauge', 'Multimeter', 'Refrigerant leak detector', 'Repair tools'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'AC Maintenance',
            description: 'Regular AC maintenance service',
            suggestedPriceRange: { min: 1500, max: 5000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['AC unit access'],
            requiredSkills: ['AC maintenance', 'Cleaning techniques'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Cleaning tools', 'Coil cleaner', 'Fin comb', 'Filter replacements'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Ventilation System Maintenance',
            description: 'Ventilation system cleaning and maintenance',
            suggestedPriceRange: { min: 2000, max: 8000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Ventilation access', 'Ladder for high vents'],
            requiredSkills: ['Ventilation systems', 'Duct cleaning', 'Safety protocols'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Cleaning tools', 'Safety equipment', 'Duct cleaning brush', 'Vacuum'],
            isActive: true,
            displayOrder: 4
          },
          {
            name: 'Heating System Repair',
            description: 'Repair heating systems and furnaces',
            suggestedPriceRange: { min: 3000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Heating system access', 'Proper ventilation for testing'],
            requiredSkills: ['Heating systems', 'Gas safety', 'Electrical diagnostics'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Gas detector', 'Multimeter', 'Manometer', 'Repair tools'],
            isActive: true,
            displayOrder: 5
          },
          {
            name: 'Duct Cleaning',
            description: 'Professional air duct cleaning and sanitization',
            suggestedPriceRange: { min: 3000, max: 12000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Access to all vents', 'Power source'],
            requiredSkills: ['Duct cleaning', 'Sanitization techniques'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['High-powered vacuum', 'Duct cleaning brushes', 'Sanitizing equipment'],
            isActive: true,
            displayOrder: 6
          }
        ]
      },
      {
        name: 'Refrigeration',
        description: 'Refrigeration system services',
        displayOrder: 2,
        isActive: true,
        tags: ['refrigeration', 'cooling', 'commercial', 'cold room'],
        subServices: [
          {
            name: 'Refrigerator Repair',
            description: 'Professional refrigerator and freezer repair',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Refrigerator access', 'Ventilation'],
            requiredSkills: ['Refrigeration systems', 'Compressor diagnosis'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Multimeter', 'Refrigerant tools', 'Compressor tester'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Cold Room Installation',
            description: 'Commercial cold room and walk-in cooler installation',
            suggestedPriceRange: { min: 20000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Space preparation', 'Power supply'],
            requiredSkills: ['Cold room construction', 'Refrigeration systems'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Refrigeration tools', 'Insulation tools', 'Electrical tools'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Commercial Refrigeration',
            description: 'Commercial refrigeration system repair and maintenance',
            suggestedPriceRange: { min: 5000, max: 30000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Commercial kitchen access', 'Proper ventilation'],
            requiredSkills: ['Commercial refrigeration', 'Food safety'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Commercial refrigeration tools', 'Refrigerant recovery machine'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 6. PROGRAMMING & AI ==========
  {
    mainCategory: 'Programming & AI',
    serviceCategories: [
      {
        name: 'Web Development',
        description: 'Professional web development services',
        displayOrder: 1,
        isActive: true,
        tags: ['web', 'development', 'website', 'frontend', 'backend'],
        subServices: [
          {
            name: 'Frontend Development',
            description: 'Build responsive and interactive user interfaces',
            suggestedPriceRange: { min: 10000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 5, unit: 'days' },
            commonRequirements: ['Design specifications'],
            requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
            expertiseLevel: 'advanced',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Backend Development',
            description: 'Build robust server-side applications and APIs',
            suggestedPriceRange: { min: 15000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 7, unit: 'days' },
            commonRequirements: ['API specifications'],
            requiredSkills: ['Node.js', 'Python', 'Databases'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Full Stack Development',
            description: 'Complete frontend and backend development',
            suggestedPriceRange: { min: 25000, max: 200000, currency: 'KES' },
            typicalDuration: { value: 10, unit: 'days' },
            commonRequirements: ['Project requirements'],
            requiredSkills: ['Full stack', 'MERN/MEAN stack'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Mobile Development',
        description: 'Mobile app development services',
        displayOrder: 2,
        isActive: true,
        tags: ['mobile', 'app', 'android', 'ios'],
        subServices: [
          {
            name: 'Android Development',
            description: 'Native Android app development',
            suggestedPriceRange: { min: 20000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 10, unit: 'days' },
            commonRequirements: ['App specifications'],
            requiredSkills: ['Java', 'Kotlin', 'Android SDK'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'iOS Development',
            description: 'Native iOS app development',
            suggestedPriceRange: { min: 20000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 10, unit: 'days' },
            commonRequirements: ['App specifications'],
            requiredSkills: ['Swift', 'iOS SDK'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Mac computer'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Cross Platform Development',
            description: 'Cross-platform mobile app development',
            suggestedPriceRange: { min: 30000, max: 200000, currency: 'KES' },
            typicalDuration: { value: 12, unit: 'days' },
            commonRequirements: ['App specifications'],
            requiredSkills: ['React Native', 'Flutter'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'AI & Machine Learning',
        description: 'AI and machine learning solutions',
        displayOrder: 3,
        isActive: true,
        tags: ['ai', 'machine learning', 'data science', 'automation'],
        subServices: [
          {
            name: 'Data Analysis',
            description: 'Data analysis and visualization services',
            suggestedPriceRange: { min: 15000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 5, unit: 'days' },
            commonRequirements: ['Dataset access'],
            requiredSkills: ['Python', 'Pandas', 'Data visualization'],
            expertiseLevel: 'advanced',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'ML Model Development',
            description: 'Machine learning model development',
            suggestedPriceRange: { min: 25000, max: 200000, currency: 'KES' },
            typicalDuration: { value: 10, unit: 'days' },
            commonRequirements: ['Training data'],
            requiredSkills: ['Python', 'ML frameworks', 'Statistics'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'AI Solutions',
            description: 'Custom AI solutions and automation',
            suggestedPriceRange: { min: 30000, max: 300000, currency: 'KES' },
            typicalDuration: { value: 15, unit: 'days' },
            commonRequirements: ['Business requirements'],
            requiredSkills: ['AI', 'Automation', 'Integration'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 7. HAIRDRESSING & BEAUTY ==========
  {
    mainCategory: 'Hairdressing & Beauty',
    serviceCategories: [
      {
        name: 'Hair Services',
        description: 'Professional hair care and styling services',
        displayOrder: 1,
        isActive: true,
        tags: ['hair', 'haircut', 'styling', 'braiding'],
        subServices: [
          {
            name: 'Haircut',
            description: 'Professional haircut and styling',
            suggestedPriceRange: { min: 500, max: 2000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Hair access'],
            requiredSkills: ['Haircutting', 'Styling'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Scissors', 'Clippers', 'Combs'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Styling',
            description: 'Professional hair styling and treatments',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 1.5, unit: 'hours' },
            commonRequirements: ['Hair access'],
            requiredSkills: ['Hair styling', 'Blow drying'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Blow dryer', 'Curling iron', 'Products'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Coloring',
            description: 'Professional hair coloring and highlights',
            suggestedPriceRange: { min: 2000, max: 8000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Hair access'],
            requiredSkills: ['Color theory', 'Application techniques'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Color brushes', 'Bowl', 'Foil'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Braiding',
            description: 'Professional braiding and protective styles',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Hair access'],
            requiredSkills: ['Braiding techniques'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Combs', 'Hair ties', 'Products'],
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Beauty Services',
        description: 'Professional beauty and makeup services',
        displayOrder: 2,
        isActive: true,
        tags: ['makeup', 'nails', 'facials', 'waxing'],
        subServices: [
          {
            name: 'Makeup',
            description: 'Professional makeup application for all occasions',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Skin access'],
            requiredSkills: ['Makeup application', 'Color matching'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Makeup kit', 'Brushes', 'Sponges'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Nail Art',
            description: 'Professional nail care and art',
            suggestedPriceRange: { min: 500, max: 3000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Nail access'],
            requiredSkills: ['Nail art', 'Manicure'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Nail polish', 'Tools', 'UV lamp'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Facials',
            description: 'Professional facial treatments',
            suggestedPriceRange: { min: 1000, max: 4000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Skin access'],
            requiredSkills: ['Facial techniques', 'Skin care'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Facial products', 'Steamer'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Waxing',
            description: 'Professional waxing services',
            suggestedPriceRange: { min: 500, max: 3000, currency: 'KES' },
            typicalDuration: { value: 0.5, unit: 'hours' },
            commonRequirements: ['Skin access'],
            requiredSkills: ['Waxing techniques'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Wax warmer', 'Applicators', 'Strips'],
            isActive: true,
            displayOrder: 4
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 8. CARPENTRY & FURNITURE ==========
  {
    mainCategory: 'Carpentry & Furniture',
    serviceCategories: [
      {
        name: 'Custom Furniture',
        description: 'Custom furniture design and construction',
        displayOrder: 1,
        isActive: true,
        tags: ['furniture', 'wood', 'custom'],
        subServices: [
          {
            name: 'Custom Furniture Making',
            description: 'Build custom furniture pieces to your specifications',
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
          },
          {
            name: 'Furniture Restoration',
            description: 'Restore antique and vintage furniture',
            suggestedPriceRange: { min: 3000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Furniture access'],
            requiredSkills: ['Restoration techniques', 'Finishing'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Specialty tools', 'Finishing supplies'],
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Cabinetry',
        description: 'Custom cabinetry and storage solutions',
        displayOrder: 2,
        isActive: true,
        tags: ['cabinets', 'kitchen', 'storage', 'wardrobe'],
        subServices: [
          {
            name: 'Kitchen Cabinets',
            description: 'Custom kitchen cabinet design and installation',
            suggestedPriceRange: { min: 20000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 7, unit: 'days' },
            commonRequirements: ['Kitchen measurements'],
            requiredSkills: ['Cabinet making', 'Installation'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Table saw', 'Router', 'Installation tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Wardrobes',
            description: 'Custom wardrobe and closet solutions',
            suggestedPriceRange: { min: 15000, max: 80000, currency: 'KES' },
            typicalDuration: { value: 5, unit: 'days' },
            commonRequirements: ['Closet measurements'],
            requiredSkills: ['Wardrobe construction'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Saw', 'Drill', 'Installation tools'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Storage Units',
            description: 'Custom storage units and shelving',
            suggestedPriceRange: { min: 5000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Space measurements'],
            requiredSkills: ['Shelving construction'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Saw', 'Drill', 'Level'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 9. LAUNDRY & DRY CLEANING ==========
  {
    mainCategory: 'Laundry & Dry Cleaning',
    serviceCategories: [
      {
        name: 'Laundry Services',
        description: 'Professional laundry and garment care',
        displayOrder: 1,
        isActive: true,
        tags: ['laundry', 'wash', 'fold', 'ironing'],
        subServices: [
          {
            name: 'Wash & Fold',
            description: 'Professional washing and folding service',
            suggestedPriceRange: { min: 500, max: 2000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Laundry access'],
            requiredSkills: ['Laundry care'],
            expertiseLevel: 'beginner',
            equipmentNeeded: true,
            commonEquipment: ['Washing machine', 'Dryer'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Dry Cleaning',
            description: 'Professional dry cleaning services',
            suggestedPriceRange: { min: 200, max: 1000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Garment access'],
            requiredSkills: ['Dry cleaning techniques'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Dry cleaning machine', 'Pressing equipment'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Ironing Services',
            description: 'Professional ironing and pressing',
            suggestedPriceRange: { min: 300, max: 1500, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Garment access'],
            requiredSkills: ['Ironing techniques'],
            expertiseLevel: 'beginner',
            equipmentNeeded: true,
            commonEquipment: ['Iron', 'Ironing board'],
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Specialty Cleaning',
        description: 'Specialty garment cleaning services',
        displayOrder: 2,
        isActive: true,
        tags: ['wedding dress', 'leather', 'curtains'],
        subServices: [
          {
            name: 'Wedding Dress Cleaning',
            description: 'Professional wedding dress cleaning and preservation',
            suggestedPriceRange: { min: 3000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 5, unit: 'days' },
            commonRequirements: ['Dress access'],
            requiredSkills: ['Delicate fabric care'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Specialty cleaning supplies'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Leather Cleaning',
            description: 'Professional leather garment cleaning',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Garment access'],
            requiredSkills: ['Leather care'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Leather cleaning supplies'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Curtain Cleaning',
            description: 'Professional curtain and drape cleaning',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Curtain access'],
            requiredSkills: ['Curtain care'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Steamer', 'Cleaning supplies'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 10. CLEANING SERVICES ==========
  {
    mainCategory: 'Cleaning Services',
    serviceCategories: [
      {
        name: 'Residential Cleaning',
        description: 'Professional home cleaning services',
        displayOrder: 1,
        isActive: true,
        tags: ['cleaning', 'home', 'house', 'deep clean'],
        subServices: [
          {
            name: 'Deep House Cleaning',
            description: 'Comprehensive deep cleaning of homes',
            suggestedPriceRange: { min: 3000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Home access'],
            requiredSkills: ['Deep cleaning techniques'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Cleaning supplies', 'Equipment'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Standard House Cleaning',
            description: 'Regular house cleaning and maintenance',
            suggestedPriceRange: { min: 1500, max: 8000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Home access'],
            requiredSkills: ['House cleaning'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Cleaning supplies'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Move In/Out Cleaning',
            description: 'Deep cleaning for move in/out',
            suggestedPriceRange: { min: 5000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 6, unit: 'hours' },
            commonRequirements: ['Property access'],
            requiredSkills: ['Deep cleaning'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Cleaning equipment', 'Supplies'],
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Commercial Cleaning',
        description: 'Professional commercial cleaning services',
        displayOrder: 2,
        isActive: true,
        tags: ['commercial', 'office', 'business', 'industrial'],
        subServices: [
          {
            name: 'Office Cleaning',
            description: 'Professional office and workspace cleaning',
            suggestedPriceRange: { min: 5000, max: 30000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Office access'],
            requiredSkills: ['Commercial cleaning'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Commercial cleaning equipment'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Restaurant Cleaning',
            description: 'Commercial kitchen and restaurant cleaning',
            suggestedPriceRange: { min: 5000, max: 25000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Restaurant access'],
            requiredSkills: ['Kitchen cleaning', 'Sanitation'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Commercial cleaning supplies'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Industrial Cleaning',
            description: 'Industrial and warehouse cleaning',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 6, unit: 'hours' },
            commonRequirements: ['Industrial access'],
            requiredSkills: ['Industrial cleaning'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Industrial cleaning equipment'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 11. PAINTING & DECORATING ==========
  {
    mainCategory: 'Painting & Decorating',
    serviceCategories: [
      {
        name: 'Painting Services',
        description: 'Professional painting and coating services',
        displayOrder: 1,
        isActive: true,
        tags: ['painting', 'interior', 'exterior', 'spray'],
        subServices: [
          {
            name: 'Interior Painting',
            description: 'Professional interior wall painting',
            suggestedPriceRange: { min: 3000, max: 30000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Room access'],
            requiredSkills: ['Interior painting'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Brushes', 'Rollers', 'Paint'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Exterior Painting',
            description: 'Professional exterior wall painting',
            suggestedPriceRange: { min: 5000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Exterior access'],
            requiredSkills: ['Exterior painting'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Brushes', 'Rollers', 'Ladders'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Spray Painting',
            description: 'Professional spray painting services',
            suggestedPriceRange: { min: 2000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Surface access'],
            requiredSkills: ['Spray painting techniques'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Spray gun', 'Compressor'],
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Decorating Services',
        description: 'Professional interior decorating',
        displayOrder: 2,
        isActive: true,
        tags: ['wallpaper', 'decor', 'faux', 'finishing'],
        subServices: [
          {
            name: 'Wallpaper Installation',
            description: 'Professional wallpaper hanging and removal',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Wall access'],
            requiredSkills: ['Wallpaper hanging'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Smoothing tools', 'Cutting tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Decorative Finishes',
            description: 'Specialty paint finishes and textures',
            suggestedPriceRange: { min: 3000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Surface access'],
            requiredSkills: ['Decorative techniques'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Specialty tools', 'Finishing supplies'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Faux Finishing',
            description: 'Faux painting and finishing techniques',
            suggestedPriceRange: { min: 5000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Surface access'],
            requiredSkills: ['Faux finishing techniques'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Specialty brushes', 'Glazes'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 12. WELDING & FABRICATION ==========
  {
    mainCategory: 'Welding & Fabrication',
    serviceCategories: [
      {
        name: 'Welding Services',
        description: 'Professional welding and metal joining',
        displayOrder: 1,
        isActive: true,
        tags: ['welding', 'mig', 'tig', 'arc'],
        subServices: [
          {
            name: 'MIG Welding',
            description: 'Professional MIG welding services',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Metal access'],
            requiredSkills: ['MIG welding'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['MIG welder', 'Safety gear'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'TIG Welding',
            description: 'Professional TIG welding for precision work',
            suggestedPriceRange: { min: 3000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Metal access'],
            requiredSkills: ['TIG welding'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['TIG welder', 'Safety gear'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Arc Welding',
            description: 'Professional arc welding services',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Metal access'],
            requiredSkills: ['Arc welding'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Arc welder', 'Safety gear'],
            isActive: true,
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Fabrication',
        description: 'Custom metal fabrication services',
        displayOrder: 2,
        isActive: true,
        tags: ['fabrication', 'metal', 'steel', 'custom'],
        subServices: [
          {
            name: 'Metal Fabrication',
            description: 'Custom metal fabrication and assembly',
            suggestedPriceRange: { min: 5000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Design specifications'],
            requiredSkills: ['Metal fabrication'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Metal working tools', 'Welding equipment'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Steel Structures',
            description: 'Steel structure fabrication and erection',
            suggestedPriceRange: { min: 10000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 5, unit: 'days' },
            commonRequirements: ['Site access', 'Foundation'],
            requiredSkills: ['Steel construction'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Heavy equipment', 'Welding gear'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Custom Metal Work',
            description: 'Custom metal gates, railings, and more',
            suggestedPriceRange: { min: 3000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Design specifications'],
            requiredSkills: ['Metal working', 'Welding'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Welding equipment', 'Metal working tools'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 13. AUTOMOTIVE REPAIR ==========
  {
    mainCategory: 'Automotive Repair',
    serviceCategories: [
      {
        name: 'Engine & Mechanical',
        description: 'Automotive engine and mechanical services',
        displayOrder: 1,
        isActive: true,
        tags: ['engine', 'mechanical', 'brakes', 'transmission'],
        subServices: [
          {
            name: 'Engine Diagnostics',
            description: 'Professional engine diagnostic services',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 1.5, unit: 'hours' },
            commonRequirements: ['Vehicle access'],
            requiredSkills: ['Engine diagnostics'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Diagnostic scanner', 'Tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Brake Service',
            description: 'Brake inspection, repair, and replacement',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Vehicle access'],
            requiredSkills: ['Brake systems'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Brake tools', 'Jack', 'Safety stands'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Oil Change',
            description: 'Professional oil change and filter replacement',
            suggestedPriceRange: { min: 1500, max: 5000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Vehicle access'],
            requiredSkills: ['Oil change'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Oil filter wrench', 'Drain pan', 'Jack'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Transmission Repair',
            description: 'Transmission diagnosis and repair',
            suggestedPriceRange: { min: 5000, max: 30000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Vehicle access'],
            requiredSkills: ['Transmission repair'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Transmission tools', 'Lift'],
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Body & Paint',
        description: 'Automotive body repair and painting',
        displayOrder: 2,
        isActive: true,
        tags: ['body', 'paint', 'dent', 'rust'],
        subServices: [
          {
            name: 'Panel Beating',
            description: 'Professional panel beating and dent removal',
            suggestedPriceRange: { min: 3000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Vehicle access'],
            requiredSkills: ['Panel beating', 'Dent removal'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Body tools', 'Dent puller'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Spray Painting',
            description: 'Professional automotive spray painting',
            suggestedPriceRange: { min: 5000, max: 30000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Vehicle access', 'Paint booth'],
            requiredSkills: ['Automotive painting'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Spray gun', 'Compressor', 'Paint booth'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Rust Removal',
            description: 'Professional rust removal and prevention',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Vehicle access'],
            requiredSkills: ['Rust removal', 'Anti-rust treatment'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Sanding tools', 'Anti-rust products'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 14. TUTORING & TRAINING ==========
  {
    mainCategory: 'Tutoring & Training',
    serviceCategories: [
      {
        name: 'Academic Tutoring',
        description: 'Professional academic tutoring services',
        displayOrder: 1,
        isActive: true,
        tags: ['tutoring', 'math', 'science', 'languages'],
        subServices: [
          {
            name: 'Mathematics',
            description: 'Mathematics tutoring for all levels',
            suggestedPriceRange: { min: 500, max: 3000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Student access'],
            requiredSkills: ['Math tutoring'],
            expertiseLevel: 'advanced',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Science',
            description: 'Science tutoring (Physics, Chemistry, Biology)',
            suggestedPriceRange: { min: 500, max: 3000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Student access'],
            requiredSkills: ['Science tutoring'],
            expertiseLevel: 'advanced',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Languages',
            description: 'Language tutoring (English, Kiswahili, French, etc.)',
            suggestedPriceRange: { min: 500, max: 2500, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Student access'],
            requiredSkills: ['Language teaching'],
            expertiseLevel: 'advanced',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Test Preparation',
            description: 'Exam preparation and test coaching',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Student access'],
            requiredSkills: ['Test prep'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Professional Training',
        description: 'Professional skills and development training',
        displayOrder: 2,
        isActive: true,
        tags: ['training', 'professional', 'skills', 'development'],
        subServices: [
          {
            name: 'IT Training',
            description: 'IT and computer skills training',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Computer access'],
            requiredSkills: ['IT training'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Computer', 'Projector'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Business Skills',
            description: 'Business management and entrepreneurship training',
            suggestedPriceRange: { min: 2000, max: 8000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Student access'],
            requiredSkills: ['Business training'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Soft Skills',
            description: 'Soft skills and communication training',
            suggestedPriceRange: { min: 1500, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Student access'],
            requiredSkills: ['Soft skills training'],
            expertiseLevel: 'advanced',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Leadership Training',
            description: 'Leadership and management development',
            suggestedPriceRange: { min: 3000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Student access'],
            requiredSkills: ['Leadership training'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 4
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 15. PHOTOGRAPHY & VIDEOGRAPHY ==========
  {
    mainCategory: 'Photography & Videography',
    serviceCategories: [
      {
        name: 'Photography',
        description: 'Professional photography services',
        displayOrder: 1,
        isActive: true,
        tags: ['photography', 'wedding', 'event', 'portrait'],
        subServices: [
          {
            name: 'Wedding Photography',
            description: 'Professional wedding photography coverage',
            suggestedPriceRange: { min: 20000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Wedding access'],
            requiredSkills: ['Wedding photography'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Camera', 'Lenses', 'Lighting'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Event Photography',
            description: 'Professional event photography services',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Event access'],
            requiredSkills: ['Event photography'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Camera', 'Lenses', 'Flash'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Portrait Photography',
            description: 'Professional portrait and headshot photography',
            suggestedPriceRange: { min: 5000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Studio/space access'],
            requiredSkills: ['Portrait photography'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Camera', 'Lenses', 'Studio lights'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Product Photography',
            description: 'Professional product photography for e-commerce',
            suggestedPriceRange: { min: 3000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Product access'],
            requiredSkills: ['Product photography'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Camera', 'Light tent', 'Lighting'],
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Videography',
        description: 'Professional videography services',
        displayOrder: 2,
        isActive: true,
        tags: ['videography', 'video', 'wedding', 'corporate'],
        subServices: [
          {
            name: 'Event Videography',
            description: 'Professional event and wedding videography',
            suggestedPriceRange: { min: 20000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Event access'],
            requiredSkills: ['Event videography'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Camera', 'Microphone', 'Lighting'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Wedding Videography',
            description: 'Professional wedding video production',
            suggestedPriceRange: { min: 25000, max: 120000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Wedding access'],
            requiredSkills: ['Wedding videography'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Camera', 'Audio gear', 'Editing suite'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Corporate Video',
            description: 'Corporate and business video production',
            suggestedPriceRange: { min: 15000, max: 80000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Business access'],
            requiredSkills: ['Corporate video'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Camera', 'Audio', 'Lighting'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Drone Videography',
            description: 'Professional drone aerial videography',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Flight area access'],
            requiredSkills: ['Drone piloting', 'Aerial videography'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Drone', 'Batteries', 'Controller'],
            isActive: true,
            displayOrder: 4
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 16. EVENT PLANNING ==========
  {
    mainCategory: 'Event Planning',
    serviceCategories: [
      {
        name: 'Event Planning',
        description: 'Full event planning and coordination services',
        displayOrder: 1,
        isActive: true,
        tags: ['event', 'wedding', 'corporate', 'party'],
        subServices: [
          {
            name: 'Wedding Planning',
            description: 'Complete wedding planning and coordination',
            suggestedPriceRange: { min: 25000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Venue booked', 'Guest list'],
            requiredSkills: ['Event planning', 'Vendor coordination'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Corporate Events',
            description: 'Corporate event planning and execution',
            suggestedPriceRange: { min: 30000, max: 200000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Venue', 'Agenda'],
            requiredSkills: ['Corporate event management'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Birthday Parties',
            description: 'Birthday party planning and coordination',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Guest list', 'Theme choice'],
            requiredSkills: ['Party planning'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Conferences',
            description: 'Conference planning and management',
            suggestedPriceRange: { min: 40000, max: 250000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Venue', 'Speakers', 'Agenda'],
            requiredSkills: ['Conference management'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Event Services',
        description: 'Event-related services',
        displayOrder: 2,
        isActive: true,
        tags: ['catering', 'decorations', 'entertainment', 'photography'],
        subServices: [
          {
            name: 'Catering',
            description: 'Event catering services',
            suggestedPriceRange: { min: 15000, max: 80000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Guest count', 'Dietary restrictions'],
            requiredSkills: ['Catering', 'Food service'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Catering equipment', 'Food warmers'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Decorations',
            description: 'Event decoration services',
            suggestedPriceRange: { min: 8000, max: 40000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Theme', 'Venue access'],
            requiredSkills: ['Decoration design'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Decoration materials'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Entertainment',
            description: 'Event entertainment coordination',
            suggestedPriceRange: { min: 12000, max: 60000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Entertainment preferences'],
            requiredSkills: ['Entertainment booking'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Event Photography',
            description: 'Professional event photography',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Event schedule'],
            requiredSkills: ['Photography', 'Event coverage'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Camera', 'Lighting equipment'],
            isActive: true,
            displayOrder: 4
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 17. CONSTRUCTION & RENOVATION ==========
  {
    mainCategory: 'Construction & Renovation',
    serviceCategories: [
      {
        name: 'Construction',
        description: 'Professional construction services',
        displayOrder: 1,
        isActive: true,
        tags: ['construction', 'building', 'roofing', 'tiling'],
        subServices: [
          {
            name: 'Building Construction',
            description: 'Complete building construction from foundation to finish',
            suggestedPriceRange: { min: 500000, max: 5000000, currency: 'KES' },
            typicalDuration: { value: 30, unit: 'days' },
            commonRequirements: ['Architectural plans', 'Approved permits'],
            requiredSkills: ['Construction management', 'Building codes'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Construction tools', 'Heavy equipment'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Roofing',
            description: 'Roof installation, repair, and maintenance',
            suggestedPriceRange: { min: 20000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 5, unit: 'days' },
            commonRequirements: ['Roof access', 'Roofing materials'],
            requiredSkills: ['Roofing', 'Safety protocols'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Roofing tools', 'Safety harness'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Flooring',
            description: 'Floor installation (tiles, wood, laminate)',
            suggestedPriceRange: { min: 15000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Floor access', 'Flooring materials'],
            requiredSkills: ['Flooring installation'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Flooring tools', 'Cutting equipment'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Tiling',
            description: 'Professional floor and wall tiling',
            suggestedPriceRange: { min: 10000, max: 80000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Surface access', 'Tiles', 'Adhesive'],
            requiredSkills: ['Tiling', 'Surface preparation'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Tile cutter', 'Trowel', 'Grout float'],
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Renovation',
        description: 'Home and building renovation services',
        displayOrder: 2,
        isActive: true,
        tags: ['renovation', 'remodeling', 'kitchen', 'bathroom'],
        subServices: [
          {
            name: 'Home Renovation',
            description: 'Complete home renovation and remodeling',
            suggestedPriceRange: { min: 50000, max: 500000, currency: 'KES' },
            typicalDuration: { value: 15, unit: 'days' },
            commonRequirements: ['Renovation plans', 'Budget'],
            requiredSkills: ['Renovation', 'Project management'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Demolition tools', 'Construction tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Kitchen Remodeling',
            description: 'Complete kitchen renovation and remodeling',
            suggestedPriceRange: { min: 30000, max: 200000, currency: 'KES' },
            typicalDuration: { value: 10, unit: 'days' },
            commonRequirements: ['Kitchen design', 'Cabinetry'],
            requiredSkills: ['Kitchen remodeling', 'Cabinetry installation'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Carpentry tools', 'Plumbing tools'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Bathroom Renovation',
            description: 'Bathroom remodeling and renovation',
            suggestedPriceRange: { min: 20000, max: 150000, currency: 'KES' },
            typicalDuration: { value: 7, unit: 'days' },
            commonRequirements: ['Bathroom design', 'Fixtures'],
            requiredSkills: ['Plumbing', 'Tiling', 'Renovation'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Plumbing tools', 'Tiling tools'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Basement Finishing',
            description: 'Basement finishing and renovation',
            suggestedPriceRange: { min: 30000, max: 200000, currency: 'KES' },
            typicalDuration: { value: 10, unit: 'days' },
            commonRequirements: ['Basement access', 'Design plans'],
            requiredSkills: ['Basement finishing'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Construction tools', 'Finishing tools'],
            isActive: true,
            displayOrder: 4
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 18. APPLIANCE REPAIR ==========
  {
    mainCategory: 'Appliance Repair',
    serviceCategories: [
      {
        name: 'Kitchen Appliances',
        description: 'Kitchen appliance repair and maintenance',
        displayOrder: 1,
        isActive: true,
        tags: ['appliance', 'repair', 'kitchen', 'refrigerator'],
        subServices: [
          {
            name: 'Refrigerator Repair',
            description: 'Professional refrigerator repair',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Refrigerator access'],
            requiredSkills: ['Refrigerator repair', 'Compressor'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Multimeter', 'Refrigerant tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Oven Repair',
            description: 'Professional oven and stove repair',
            suggestedPriceRange: { min: 1500, max: 8000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Oven access'],
            requiredSkills: ['Oven repair', 'Electrical'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Multimeter', 'Screwdrivers'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Dishwasher Repair',
            description: 'Professional dishwasher repair',
            suggestedPriceRange: { min: 1500, max: 7000, currency: 'KES' },
            typicalDuration: { value: 1.5, unit: 'hours' },
            commonRequirements: ['Dishwasher access'],
            requiredSkills: ['Dishwasher repair', 'Plumbing'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Plumbing tools', 'Multimeter'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Microwave Repair',
            description: 'Professional microwave repair',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'hours' },
            commonRequirements: ['Microwave access'],
            requiredSkills: ['Microwave repair'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Screwdrivers', 'Multimeter'],
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Laundry Appliances',
        description: 'Laundry appliance repair services',
        displayOrder: 2,
        isActive: true,
        tags: ['washing machine', 'dryer', 'laundry', 'repair'],
        subServices: [
          {
            name: 'Washing Machine Repair',
            description: 'Professional washing machine repair',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Washing machine access'],
            requiredSkills: ['Washing machine repair'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Multimeter', 'Plumbing tools'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Dryer Repair',
            description: 'Professional dryer repair',
            suggestedPriceRange: { min: 1500, max: 8000, currency: 'KES' },
            typicalDuration: { value: 1.5, unit: 'hours' },
            commonRequirements: ['Dryer access'],
            requiredSkills: ['Dryer repair', 'Electrical'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Multimeter', 'Screwdrivers'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Washer/Dryer Combo',
            description: 'Washer/dryer combo unit repair',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Combo unit access'],
            requiredSkills: ['Combo unit repair'],
            expertiseLevel: 'expert',
            equipmentNeeded: true,
            commonEquipment: ['Specialized tools', 'Multimeter'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 19. MOVING & LOGISTICS ==========
  {
    mainCategory: 'Moving & Logistics',
    serviceCategories: [
      {
        name: 'Moving Services',
        description: 'Professional moving and relocation services',
        displayOrder: 1,
        isActive: true,
        tags: ['moving', 'relocation', 'packing', 'delivery'],
        subServices: [
          {
            name: 'Local Moving',
            description: 'Local moving within same city',
            suggestedPriceRange: { min: 5000, max: 30000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Access to items'],
            requiredSkills: ['Moving', 'Packing'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Moving truck', 'Dolly', 'Packing materials'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Long Distance Moving',
            description: 'Inter-city and long distance moving',
            suggestedPriceRange: { min: 10000, max: 100000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Access to items', 'Transport'],
            requiredSkills: ['Long distance moving'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Moving truck', 'Packing materials'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Packing Services',
            description: 'Professional packing and wrapping services',
            suggestedPriceRange: { min: 3000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Items to pack'],
            requiredSkills: ['Packing techniques'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Packing materials', 'Tape', 'Boxes'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Unpacking Services',
            description: 'Professional unpacking and setup services',
            suggestedPriceRange: { min: 2000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Boxes to unpack'],
            requiredSkills: ['Unpacking', 'Organization'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Logistics',
        description: 'Professional logistics and delivery services',
        displayOrder: 2,
        isActive: true,
        tags: ['logistics', 'delivery', 'freight', 'storage'],
        subServices: [
          {
            name: 'Storage Services',
            description: 'Secure storage and warehousing',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 1, unit: 'days' },
            commonRequirements: ['Items to store'],
            requiredSkills: ['Storage management'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Storage space', 'Security'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Delivery Services',
            description: 'Local and long distance delivery',
            suggestedPriceRange: { min: 1000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Items to deliver'],
            requiredSkills: ['Delivery', 'Navigation'],
            expertiseLevel: 'beginner',
            equipmentNeeded: true,
            commonEquipment: ['Vehicle', 'Phone'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Freight Services',
            description: 'Freight and cargo transportation',
            suggestedPriceRange: { min: 5000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Freight to transport'],
            requiredSkills: ['Freight management'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Truck', 'Loading equipment'],
            isActive: true,
            displayOrder: 3
          }
        ]
      }
    ],
    isActive: true
  },

  // ========== 20. GARDENING & LANDSCAPING ==========
  {
    mainCategory: 'Gardening & Landscaping',
    serviceCategories: [
      {
        name: 'Gardening',
        description: 'Professional gardening services',
        displayOrder: 1,
        isActive: true,
        tags: ['gardening', 'lawn', 'trees', 'irrigation'],
        subServices: [
          {
            name: 'Lawn Care',
            description: 'Professional lawn mowing and care',
            suggestedPriceRange: { min: 1000, max: 5000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Lawn access'],
            requiredSkills: ['Lawn care', 'Mowing'],
            expertiseLevel: 'beginner',
            equipmentNeeded: true,
            commonEquipment: ['Lawn mower', 'Trimmer'],
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Tree Services',
            description: 'Tree trimming, removal, and care',
            suggestedPriceRange: { min: 2000, max: 15000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'hours' },
            commonRequirements: ['Tree access'],
            requiredSkills: ['Tree care', 'Safety'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Chainsaw', 'Safety gear', 'Climbing equipment'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Irrigation Systems',
            description: 'Irrigation system installation and repair',
            suggestedPriceRange: { min: 5000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 4, unit: 'hours' },
            commonRequirements: ['Garden access'],
            requiredSkills: ['Irrigation', 'Plumbing'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Pipe tools', 'Sprinkler heads'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Garden Design',
            description: 'Professional garden design and planning',
            suggestedPriceRange: { min: 5000, max: 30000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'days' },
            commonRequirements: ['Garden area access'],
            requiredSkills: ['Garden design', 'Landscaping'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Landscaping',
        description: 'Professional landscaping services',
        displayOrder: 2,
        isActive: true,
        tags: ['landscaping', 'design', 'hardscaping', 'planting'],
        subServices: [
          {
            name: 'Landscape Design',
            description: 'Complete landscape design and planning',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Property access'],
            requiredSkills: ['Landscape design'],
            expertiseLevel: 'expert',
            equipmentNeeded: false,
            isActive: true,
            displayOrder: 1
          },
          {
            name: 'Hardscaping',
            description: 'Patios, walkways, and retaining walls',
            suggestedPriceRange: { min: 10000, max: 50000, currency: 'KES' },
            typicalDuration: { value: 3, unit: 'days' },
            commonRequirements: ['Area access', 'Materials'],
            requiredSkills: ['Hardscaping', 'Construction'],
            expertiseLevel: 'advanced',
            equipmentNeeded: true,
            commonEquipment: ['Construction tools', 'Materials'],
            isActive: true,
            displayOrder: 2
          },
          {
            name: 'Planting Services',
            description: 'Professional planting and garden installation',
            suggestedPriceRange: { min: 3000, max: 20000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Garden access', 'Plants'],
            requiredSkills: ['Planting', 'Garden care'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Gardening tools', 'Soil'],
            isActive: true,
            displayOrder: 3
          },
          {
            name: 'Landscape Maintenance',
            description: 'Regular landscape maintenance and care',
            suggestedPriceRange: { min: 2000, max: 10000, currency: 'KES' },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Property access'],
            requiredSkills: ['Landscape maintenance'],
            expertiseLevel: 'intermediate',
            equipmentNeeded: true,
            commonEquipment: ['Gardening tools', 'Trimmer'],
            isActive: true,
            displayOrder: 4
          }
        ]
      }
    ],
    isActive: true
  }
];

// ============================================
// MAIN SEEDING FUNCTION
// ============================================

/**
 * Main seeding function
 */
async function seedServiceCatalog() {
  try {
    // Get MongoDB URI from environment
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub';
    console.log('📡 MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//<credentials>@'));
    
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
    console.log('📝 Inserting ALL 20 service categories...\n');
    let insertedCount = 0;
    
    for (const catalog of serviceCatalogData) {
      const newCatalog = new ServiceCatalog(catalog);
      await newCatalog.save();
      insertedCount++;
      console.log(`  ✅ Added: ${catalog.mainCategory}`);
      
      // Log service category and sub-service counts
      let totalSubServices = 0;
      for (const category of catalog.serviceCategories) {
        const subServiceCount = category.subServices ? category.subServices.length : 0;
        totalSubServices += subServiceCount;
        console.log(`      • ${category.name}: ${subServiceCount} sub-services`);
      }
      console.log(`      📊 Total: ${catalog.serviceCategories.length} categories, ${totalSubServices} sub-services\n`);
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
    console.log('\n🚀 All 20 service categories are now available!');
    console.log('   Test with:');
    console.log('   GET /api/service-catalog/HVAC%20Services/service-categories');
    console.log('   GET /api/service-catalog/Event%20Planning/service-categories');
    console.log('   GET /api/service-catalog/Construction%20%26%20Renovation/service-categories');
    
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