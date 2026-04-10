// scripts/populateServiceCatalog.js
const ServiceCatalog = require('../models/ServiceCatalog');

const serviceCatalogData = [
  {
    mainCategory: 'IT & Networking',
    serviceCategories: [
      {
        name: 'Internet Services',
        description: 'Professional internet setup and troubleshooting services',
        icon: 'wifi',
        displayOrder: 1,
        subServices: [
          {
            name: 'WiFi Setup & Configuration',
            description: 'Professional WiFi router setup and configuration for home or office',
            suggestedPriceRange: { min: 1500, max: 5000 },
            typicalDuration: { value: 2, unit: 'hours' },
            commonRequirements: ['Existing internet connection', 'Router (if not provided)'],
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Network Troubleshooting',
            description: 'Diagnose and fix network connectivity issues',
            suggestedPriceRange: { min: 1000, max: 3000 },
            typicalDuration: { value: 1.5, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Fiber Optic Installation',
            description: 'End-to-end fiber optic cable installation and termination',
            suggestedPriceRange: { min: 5000, max: 15000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Mesh Network Installation',
            description: 'Whole-home mesh WiFi system setup',
            suggestedPriceRange: { min: 3000, max: 8000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'CCTV & Security Systems',
        description: 'Professional security camera and surveillance system installation',
        icon: 'camera',
        displayOrder: 2,
        subServices: [
          {
            name: 'CCTV Camera Installation',
            description: 'Professional installation of security cameras',
            suggestedPriceRange: { min: 3000, max: 15000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Security System Maintenance',
            description: 'Regular maintenance and checkup of security systems',
            suggestedPriceRange: { min: 2000, max: 5000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Access Control Systems',
            description: 'Installation of biometric and card-based access systems',
            suggestedPriceRange: { min: 5000, max: 20000 },
            typicalDuration: { value: 5, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Computer Repair & Maintenance',
        description: 'Professional computer hardware and software services',
        icon: 'laptop',
        displayOrder: 3,
        subServices: [
          {
            name: 'Hardware Repair',
            description: 'Diagnosis and repair of computer hardware issues',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Virus & Malware Removal',
            description: 'Complete virus scanning and removal',
            suggestedPriceRange: { min: 1500, max: 4000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Data Recovery',
            description: 'Recover lost or deleted data from storage devices',
            suggestedPriceRange: { min: 3000, max: 15000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'expert',
            displayOrder: 3
          }
        ]
      }
    ]
  },
  {
    mainCategory: 'Electrical Services',
    serviceCategories: [
      {
        name: 'Residential Electrical',
        description: 'Complete electrical services for homes',
        icon: 'home',
        displayOrder: 1,
        subServices: [
          {
            name: 'House Wiring & Rewiring',
            description: 'Complete electrical wiring for new homes or rewiring old ones',
            suggestedPriceRange: { min: 10000, max: 50000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Lighting Installation',
            description: 'Installation of indoor and outdoor lighting fixtures',
            suggestedPriceRange: { min: 2000, max: 8000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Ceiling Fan Installation',
            description: 'Professional ceiling fan mounting and wiring',
            suggestedPriceRange: { min: 1500, max: 4000 },
            typicalDuration: { value: 1.5, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          },
          {
            name: 'Circuit Breaker Replacement',
            description: 'Replace faulty circuit breakers',
            suggestedPriceRange: { min: 1500, max: 5000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Commercial Electrical',
        description: 'Electrical services for businesses and commercial properties',
        icon: 'building',
        displayOrder: 2,
        subServices: [
          {
            name: 'Three-Phase Wiring',
            description: 'Installation and maintenance of three-phase electrical systems',
            suggestedPriceRange: { min: 15000, max: 60000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Electrical Panel Upgrades',
            description: 'Upgrade electrical panels for increased capacity',
            suggestedPriceRange: { min: 8000, max: 25000 },
            typicalDuration: { value: 5, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          }
        ]
      }
    ]
  },
  {
    mainCategory: 'Plumbing',
    serviceCategories: [
      {
        name: 'General Plumbing',
        description: 'Everyday plumbing services for homes and businesses',
        icon: 'wrench',
        displayOrder: 1,
        subServices: [
          {
            name: 'Leak Detection & Repair',
            description: 'Find and fix water leaks in pipes and fixtures',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 1.5, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Faucet Installation & Repair',
            description: 'Install new faucets or repair existing ones',
            suggestedPriceRange: { min: 800, max: 3000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'beginner',
            displayOrder: 2
          },
          {
            name: 'Toilet Repair & Installation',
            description: 'Fix running toilets or install new ones',
            suggestedPriceRange: { min: 1500, max: 5000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Drainage & Sewer',
        description: 'Drain cleaning and sewer line services',
        icon: 'pipe',
        displayOrder: 2,
        subServices: [
          {
            name: 'Drain Cleaning & Unclogging',
            description: 'Clear clogged drains and pipes',
            suggestedPriceRange: { min: 1500, max: 6000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Sewer Line Inspection',
            description: 'Camera inspection of sewer lines',
            suggestedPriceRange: { min: 3000, max: 8000 },
            typicalDuration: { value: 1.5, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          }
        ]
      }
    ]
  }
  // Add more main categories as needed
];

async function populateServiceCatalog() {
  try {
    // Check if data already exists
    const count = await ServiceCatalog.countDocuments();
    
    if (count === 0) {
      console.log('Populating service catalog...');
      
      for (const data of serviceCatalogData) {
        const catalog = new ServiceCatalog(data);
        await catalog.save();
      }
      
      console.log('Service catalog populated successfully');
    } else {
      console.log('Service catalog already exists, skipping population');
    }
  } catch (error) {
    console.error('Error populating service catalog:', error);
  }
}

module.exports = populateServiceCatalog;