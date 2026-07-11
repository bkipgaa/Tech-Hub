// backend/scripts/seedCompleteCatalog.js
/**
 * Complete Service Catalog Seed Script
 * =====================================
 * Seeds ALL 20 service categories with comprehensive sub-services
 * 
 * Run: node scripts/seedCompleteCatalog.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ServiceCatalog = require('../models/ServiceCatalog');

dotenv.config();

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

  // ========== 2. ELECTRICAL SERVICES ==========
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

  // ========== 3. PLUMBING ==========
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
  },

  // ========== 4. MECHANICAL SERVICES ==========
  {
    mainCategory: 'Mechanical Services',
    serviceCategories: [
      {
        name: 'HVAC Services',
        description: 'Heating, ventilation, and air conditioning services',
        icon: 'thermostat',
        displayOrder: 1,
        subServices: [
          {
            name: 'AC Installation & Repair',
            description: 'Professional air conditioning installation and repair',
            suggestedPriceRange: { min: 5000, max: 20000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Ventilation System Maintenance',
            description: 'Cleaning and maintenance of ventilation systems',
            suggestedPriceRange: { min: 2000, max: 8000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Heating System Repair',
            description: 'Repair and maintenance of heating systems',
            suggestedPriceRange: { min: 3000, max: 15000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'General Mechanical',
        description: 'General mechanical repair and maintenance',
        icon: 'settings',
        displayOrder: 2,
        subServices: [
          {
            name: 'Mechanical Repair',
            description: 'Repair of mechanical equipment and systems',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Equipment Maintenance',
            description: 'Preventive maintenance for mechanical equipment',
            suggestedPriceRange: { min: 1500, max: 5000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Industrial Machinery',
            description: 'Industrial machinery repair and maintenance',
            suggestedPriceRange: { min: 5000, max: 50000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 5. PROGRAMMING & AI ==========
  {
    mainCategory: 'Programming & AI',
    serviceCategories: [
      {
        name: 'Web Development',
        description: 'Professional web development services',
        icon: 'globe',
        displayOrder: 1,
        subServices: [
          {
            name: 'Frontend Development',
            description: 'Build responsive and interactive user interfaces',
            suggestedPriceRange: { min: 10000, max: 100000 },
            typicalDuration: { value: 5, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Backend Development',
            description: 'Build robust server-side applications and APIs',
            suggestedPriceRange: { min: 15000, max: 150000 },
            typicalDuration: { value: 7, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'Full Stack Development',
            description: 'Complete frontend and backend development',
            suggestedPriceRange: { min: 25000, max: 200000 },
            typicalDuration: { value: 10, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Mobile Development',
        description: 'Mobile app development services',
        icon: 'smartphone',
        displayOrder: 2,
        subServices: [
          {
            name: 'Android Development',
            description: 'Native Android app development',
            suggestedPriceRange: { min: 20000, max: 150000 },
            typicalDuration: { value: 10, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'iOS Development',
            description: 'Native iOS app development',
            suggestedPriceRange: { min: 20000, max: 150000 },
            typicalDuration: { value: 10, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'Cross Platform Development',
            description: 'Cross-platform mobile app development',
            suggestedPriceRange: { min: 30000, max: 200000 },
            typicalDuration: { value: 12, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'AI & Machine Learning',
        description: 'AI and machine learning solutions',
        icon: 'brain',
        displayOrder: 3,
        subServices: [
          {
            name: 'Data Analysis',
            description: 'Data analysis and visualization services',
            suggestedPriceRange: { min: 15000, max: 100000 },
            typicalDuration: { value: 5, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'ML Model Development',
            description: 'Machine learning model development',
            suggestedPriceRange: { min: 25000, max: 200000 },
            typicalDuration: { value: 10, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'AI Solutions',
            description: 'Custom AI solutions and automation',
            suggestedPriceRange: { min: 30000, max: 300000 },
            typicalDuration: { value: 15, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 6. HAIRDRESSING & BEAUTY ==========
  {
    mainCategory: 'Hairdressing & Beauty',
    serviceCategories: [
      {
        name: 'Hair Services',
        description: 'Professional hair care and styling services',
        icon: 'scissors',
        displayOrder: 1,
        subServices: [
          {
            name: 'Haircut',
            description: 'Professional haircut and styling',
            suggestedPriceRange: { min: 500, max: 2000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Styling',
            description: 'Professional hair styling and treatments',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 1.5, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Coloring',
            description: 'Professional hair coloring and highlights',
            suggestedPriceRange: { min: 2000, max: 8000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Braiding',
            description: 'Professional braiding and protective styles',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Beauty Services',
        description: 'Professional beauty and makeup services',
        icon: 'sparkles',
        displayOrder: 2,
        subServices: [
          {
            name: 'Makeup',
            description: 'Professional makeup application for all occasions',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Nail Art',
            description: 'Professional nail care and art',
            suggestedPriceRange: { min: 500, max: 3000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Facials',
            description: 'Professional facial treatments',
            suggestedPriceRange: { min: 1000, max: 4000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          },
          {
            name: 'Waxing',
            description: 'Professional waxing services',
            suggestedPriceRange: { min: 500, max: 3000 },
            typicalDuration: { value: 0.5, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 4
          }
        ]
      }
    ]
  },

  // ========== 7. CARPENTRY & FURNITURE ==========
  {
    mainCategory: 'Carpentry & Furniture',
    serviceCategories: [
      {
        name: 'Custom Furniture',
        description: 'Custom furniture design and construction',
        icon: 'hammer',
        displayOrder: 1,
        subServices: [
          {
            name: 'Custom Furniture Making',
            description: 'Build custom furniture pieces to your specifications',
            suggestedPriceRange: { min: 5000, max: 100000 },
            typicalDuration: { value: 5, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Furniture Repair',
            description: 'Repair damaged furniture',
            suggestedPriceRange: { min: 1000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Furniture Restoration',
            description: 'Restore antique and vintage furniture',
            suggestedPriceRange: { min: 3000, max: 20000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Cabinetry',
        description: 'Custom cabinetry and storage solutions',
        icon: 'cabinet',
        displayOrder: 2,
        subServices: [
          {
            name: 'Kitchen Cabinets',
            description: 'Custom kitchen cabinet design and installation',
            suggestedPriceRange: { min: 20000, max: 150000 },
            typicalDuration: { value: 7, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Wardrobes',
            description: 'Custom wardrobe and closet solutions',
            suggestedPriceRange: { min: 15000, max: 80000 },
            typicalDuration: { value: 5, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Storage Units',
            description: 'Custom storage units and shelving',
            suggestedPriceRange: { min: 5000, max: 50000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 8. LAUNDRY & DRY CLEANING ==========
  {
    mainCategory: 'Laundry & Dry Cleaning',
    serviceCategories: [
      {
        name: 'Laundry Services',
        description: 'Professional laundry and garment care',
        icon: 'shirt',
        displayOrder: 1,
        subServices: [
          {
            name: 'Wash & Fold',
            description: 'Professional washing and folding service',
            suggestedPriceRange: { min: 500, max: 2000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'beginner',
            displayOrder: 1
          },
          {
            name: 'Dry Cleaning',
            description: 'Professional dry cleaning services',
            suggestedPriceRange: { min: 200, max: 1000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Ironing Services',
            description: 'Professional ironing and pressing',
            suggestedPriceRange: { min: 300, max: 1500 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'beginner',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Specialty Cleaning',
        description: 'Specialty garment cleaning services',
        icon: 'star',
        displayOrder: 2,
        subServices: [
          {
            name: 'Wedding Dress Cleaning',
            description: 'Professional wedding dress cleaning and preservation',
            suggestedPriceRange: { min: 3000, max: 10000 },
            typicalDuration: { value: 5, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Leather Cleaning',
            description: 'Professional leather garment cleaning',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Curtain Cleaning',
            description: 'Professional curtain and drape cleaning',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 9. CLEANING SERVICES ==========
  {
    mainCategory: 'Cleaning Services',
    serviceCategories: [
      {
        name: 'Residential Cleaning',
        description: 'Professional home cleaning services',
        icon: 'house',
        displayOrder: 1,
        subServices: [
          {
            name: 'Deep House Cleaning',
            description: 'Comprehensive deep cleaning of homes',
            suggestedPriceRange: { min: 3000, max: 15000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Standard House Cleaning',
            description: 'Regular house cleaning and maintenance',
            suggestedPriceRange: { min: 1500, max: 8000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Move In/Out Cleaning',
            description: 'Deep cleaning for move in/out',
            suggestedPriceRange: { min: 5000, max: 20000 },
            typicalDuration: { value: 6, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Commercial Cleaning',
        description: 'Professional commercial cleaning services',
        icon: 'building',
        displayOrder: 2,
        subServices: [
          {
            name: 'Office Cleaning',
            description: 'Professional office and workspace cleaning',
            suggestedPriceRange: { min: 5000, max: 30000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Restaurant Cleaning',
            description: 'Commercial kitchen and restaurant cleaning',
            suggestedPriceRange: { min: 5000, max: 25000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Industrial Cleaning',
            description: 'Industrial and warehouse cleaning',
            suggestedPriceRange: { min: 10000, max: 50000 },
            typicalDuration: { value: 6, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 10. PAINTING & DECORATING ==========
  {
    mainCategory: 'Painting & Decorating',
    serviceCategories: [
      {
        name: 'Painting Services',
        description: 'Professional painting and coating services',
        icon: 'paintbrush',
        displayOrder: 1,
        subServices: [
          {
            name: 'Interior Painting',
            description: 'Professional interior wall painting',
            suggestedPriceRange: { min: 3000, max: 30000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Exterior Painting',
            description: 'Professional exterior wall painting',
            suggestedPriceRange: { min: 5000, max: 50000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Spray Painting',
            description: 'Professional spray painting services',
            suggestedPriceRange: { min: 2000, max: 20000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Decorating Services',
        description: 'Professional interior decorating',
        icon: 'palette',
        displayOrder: 2,
        subServices: [
          {
            name: 'Wallpaper Installation',
            description: 'Professional wallpaper hanging and removal',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Decorative Finishes',
            description: 'Specialty paint finishes and textures',
            suggestedPriceRange: { min: 3000, max: 15000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'Faux Finishing',
            description: 'Faux painting and finishing techniques',
            suggestedPriceRange: { min: 5000, max: 20000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 11. WELDING & FABRICATION ==========
  {
    mainCategory: 'Welding & Fabrication',
    serviceCategories: [
      {
        name: 'Welding Services',
        description: 'Professional welding and metal joining',
        icon: 'weld',
        displayOrder: 1,
        subServices: [
          {
            name: 'MIG Welding',
            description: 'Professional MIG welding services',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'TIG Welding',
            description: 'Professional TIG welding for precision work',
            suggestedPriceRange: { min: 3000, max: 15000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'Arc Welding',
            description: 'Professional arc welding services',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      },
      {
        name: 'Fabrication',
        description: 'Custom metal fabrication services',
        icon: 'tools',
        displayOrder: 2,
        subServices: [
          {
            name: 'Metal Fabrication',
            description: 'Custom metal fabrication and assembly',
            suggestedPriceRange: { min: 5000, max: 50000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Steel Structures',
            description: 'Steel structure fabrication and erection',
            suggestedPriceRange: { min: 10000, max: 100000 },
            typicalDuration: { value: 5, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'Custom Metal Work',
            description: 'Custom metal gates, railings, and more',
            suggestedPriceRange: { min: 3000, max: 50000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 12. AUTOMOTIVE REPAIR ==========
  {
    mainCategory: 'Automotive Repair',
    serviceCategories: [
      {
        name: 'Engine & Mechanical',
        description: 'Automotive engine and mechanical services',
        icon: 'engine',
        displayOrder: 1,
        subServices: [
          {
            name: 'Engine Diagnostics',
            description: 'Professional engine diagnostic services',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 1.5, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Brake Service',
            description: 'Brake inspection, repair, and replacement',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Oil Change',
            description: 'Professional oil change and filter replacement',
            suggestedPriceRange: { min: 1500, max: 5000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          },
          {
            name: 'Transmission Repair',
            description: 'Transmission diagnosis and repair',
            suggestedPriceRange: { min: 5000, max: 30000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Body & Paint',
        description: 'Automotive body repair and painting',
        icon: 'car',
        displayOrder: 2,
        subServices: [
          {
            name: 'Panel Beating',
            description: 'Professional panel beating and dent removal',
            suggestedPriceRange: { min: 3000, max: 20000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Spray Painting',
            description: 'Professional automotive spray painting',
            suggestedPriceRange: { min: 5000, max: 30000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Rust Removal',
            description: 'Professional rust removal and prevention',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 13. TUTORING & TRAINING ==========
  {
    mainCategory: 'Tutoring & Training',
    serviceCategories: [
      {
        name: 'Academic Tutoring',
        description: 'Professional academic tutoring services',
        icon: 'book',
        displayOrder: 1,
        subServices: [
          {
            name: 'Mathematics',
            description: 'Mathematics tutoring for all levels',
            suggestedPriceRange: { min: 500, max: 3000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Science',
            description: 'Science tutoring (Physics, Chemistry, Biology)',
            suggestedPriceRange: { min: 500, max: 3000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Languages',
            description: 'Language tutoring (English, Kiswahili, French, etc.)',
            suggestedPriceRange: { min: 500, max: 2500 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Test Preparation',
            description: 'Exam preparation and test coaching',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'expert',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Professional Training',
        description: 'Professional skills and development training',
        icon: 'briefcase',
        displayOrder: 2,
        subServices: [
          {
            name: 'IT Training',
            description: 'IT and computer skills training',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Business Skills',
            description: 'Business management and entrepreneurship training',
            suggestedPriceRange: { min: 2000, max: 8000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'Soft Skills',
            description: 'Soft skills and communication training',
            suggestedPriceRange: { min: 1500, max: 5000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Leadership Training',
            description: 'Leadership and management development',
            suggestedPriceRange: { min: 3000, max: 15000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 4
          }
        ]
      }
    ]
  },

  // ========== 14. PHOTOGRAPHY & VIDEOGRAPHY ==========
  {
    mainCategory: 'Photography & Videography',
    serviceCategories: [
      {
        name: 'Photography',
        description: 'Professional photography services',
        icon: 'camera',
        displayOrder: 1,
        subServices: [
          {
            name: 'Wedding Photography',
            description: 'Professional wedding photography coverage',
            suggestedPriceRange: { min: 20000, max: 100000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Event Photography',
            description: 'Professional event photography services',
            suggestedPriceRange: { min: 10000, max: 50000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Portrait Photography',
            description: 'Professional portrait and headshot photography',
            suggestedPriceRange: { min: 5000, max: 20000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Product Photography',
            description: 'Professional product photography for e-commerce',
            suggestedPriceRange: { min: 3000, max: 15000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Videography',
        description: 'Professional videography services',
        icon: 'video',
        displayOrder: 2,
        subServices: [
          {
            name: 'Event Videography',
            description: 'Professional event and wedding videography',
            suggestedPriceRange: { min: 20000, max: 100000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Wedding Videography',
            description: 'Professional wedding video production',
            suggestedPriceRange: { min: 25000, max: 120000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'Corporate Video',
            description: 'Corporate and business video production',
            suggestedPriceRange: { min: 15000, max: 80000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 3
          },
          {
            name: 'Drone Videography',
            description: 'Professional drone aerial videography',
            suggestedPriceRange: { min: 10000, max: 50000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'expert',
            displayOrder: 4
          }
        ]
      }
    ]
  },

  // ========== 15. EVENT PLANNING ==========
  {
    mainCategory: 'Event Planning',
    serviceCategories: [
      {
        name: 'Event Planning',
        description: 'Full event planning and coordination services',
        icon: 'calendar',
        displayOrder: 1,
        subServices: [
          {
            name: 'Wedding Planning',
            description: 'Complete wedding planning and coordination',
            suggestedPriceRange: { min: 25000, max: 150000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Corporate Events',
            description: 'Corporate event planning and execution',
            suggestedPriceRange: { min: 30000, max: 200000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 2
          },
          {
            name: 'Birthday Parties',
            description: 'Birthday party planning and coordination',
            suggestedPriceRange: { min: 10000, max: 50000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          },
          {
            name: 'Conferences',
            description: 'Conference planning and management',
            suggestedPriceRange: { min: 40000, max: 250000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Event Services',
        description: 'Event-related services',
        icon: 'party',
        displayOrder: 2,
        subServices: [
          {
            name: 'Catering',
            description: 'Event catering services',
            suggestedPriceRange: { min: 15000, max: 80000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Decorations',
            description: 'Event decoration services',
            suggestedPriceRange: { min: 8000, max: 40000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 2
          },
          {
            name: 'Entertainment',
            description: 'Event entertainment coordination',
            suggestedPriceRange: { min: 12000, max: 60000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          },
          {
            name: 'Event Photography',
            description: 'Professional event photography',
            suggestedPriceRange: { min: 10000, max: 50000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 4
          }
        ]
      }
    ]
  },

  // ========== 16. CONSTRUCTION & RENOVATION ==========
  {
    mainCategory: 'Construction & Renovation',
    serviceCategories: [
      {
        name: 'Construction',
        description: 'Professional construction services',
        icon: 'building-construction',
        displayOrder: 1,
        subServices: [
          {
            name: 'Building Construction',
            description: 'Complete building construction from foundation to finish',
            suggestedPriceRange: { min: 500000, max: 5000000 },
            typicalDuration: { value: 30, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Roofing',
            description: 'Roof installation, repair, and maintenance',
            suggestedPriceRange: { min: 20000, max: 150000 },
            typicalDuration: { value: 5, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Flooring',
            description: 'Floor installation (tiles, wood, laminate)',
            suggestedPriceRange: { min: 15000, max: 100000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Tiling',
            description: 'Professional floor and wall tiling',
            suggestedPriceRange: { min: 10000, max: 80000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Renovation',
        description: 'Home and building renovation services',
        icon: 'renovation',
        displayOrder: 2,
        subServices: [
          {
            name: 'Home Renovation',
            description: 'Complete home renovation and remodeling',
            suggestedPriceRange: { min: 50000, max: 500000 },
            typicalDuration: { value: 15, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Kitchen Remodeling',
            description: 'Complete kitchen renovation and remodeling',
            suggestedPriceRange: { min: 30000, max: 200000 },
            typicalDuration: { value: 10, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Bathroom Renovation',
            description: 'Bathroom remodeling and renovation',
            suggestedPriceRange: { min: 20000, max: 150000 },
            typicalDuration: { value: 7, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Basement Finishing',
            description: 'Basement finishing and renovation',
            suggestedPriceRange: { min: 30000, max: 200000 },
            typicalDuration: { value: 10, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 4
          }
        ]
      }
    ]
  },

  // ========== 17. APPLIANCE REPAIR ==========
  {
    mainCategory: 'Appliance Repair',
    serviceCategories: [
      {
        name: 'Kitchen Appliances',
        description: 'Kitchen appliance repair and maintenance',
        icon: 'kitchen',
        displayOrder: 1,
        subServices: [
          {
            name: 'Refrigerator Repair',
            description: 'Professional refrigerator repair',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Oven Repair',
            description: 'Professional oven and stove repair',
            suggestedPriceRange: { min: 1500, max: 8000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Dishwasher Repair',
            description: 'Professional dishwasher repair',
            suggestedPriceRange: { min: 1500, max: 7000 },
            typicalDuration: { value: 1.5, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Microwave Repair',
            description: 'Professional microwave repair',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 1, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Laundry Appliances',
        description: 'Laundry appliance repair services',
        icon: 'washer',
        displayOrder: 2,
        subServices: [
          {
            name: 'Washing Machine Repair',
            description: 'Professional washing machine repair',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 1
          },
          {
            name: 'Dryer Repair',
            description: 'Professional dryer repair',
            suggestedPriceRange: { min: 1500, max: 8000 },
            typicalDuration: { value: 1.5, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Washer/Dryer Combo',
            description: 'Washer/dryer combo unit repair',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'expert',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 18. MOVING & LOGISTICS ==========
  {
    mainCategory: 'Moving & Logistics',
    serviceCategories: [
      {
        name: 'Moving Services',
        description: 'Professional moving and relocation services',
        icon: 'truck',
        displayOrder: 1,
        subServices: [
          {
            name: 'Local Moving',
            description: 'Local moving within same city',
            suggestedPriceRange: { min: 5000, max: 30000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Long Distance Moving',
            description: 'Inter-city and long distance moving',
            suggestedPriceRange: { min: 10000, max: 100000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Packing Services',
            description: 'Professional packing and wrapping services',
            suggestedPriceRange: { min: 3000, max: 20000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          },
          {
            name: 'Unpacking Services',
            description: 'Professional unpacking and setup services',
            suggestedPriceRange: { min: 2000, max: 15000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Logistics',
        description: 'Professional logistics and delivery services',
        icon: 'delivery',
        displayOrder: 2,
        subServices: [
          {
            name: 'Storage Services',
            description: 'Secure storage and warehousing',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 1, unit: 'days' },
            expertiseLevel: 'intermediate',
            displayOrder: 1
          },
          {
            name: 'Delivery Services',
            description: 'Local and long distance delivery',
            suggestedPriceRange: { min: 1000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'beginner',
            displayOrder: 2
          },
          {
            name: 'Freight Services',
            description: 'Freight and cargo transportation',
            suggestedPriceRange: { min: 5000, max: 50000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          }
        ]
      }
    ]
  },

  // ========== 19. GARDENING & LANDSCAPING ==========
  {
    mainCategory: 'Gardening & Landscaping',
    serviceCategories: [
      {
        name: 'Gardening',
        description: 'Professional gardening services',
        icon: 'plant',
        displayOrder: 1,
        subServices: [
          {
            name: 'Lawn Care',
            description: 'Professional lawn mowing and care',
            suggestedPriceRange: { min: 1000, max: 5000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'beginner',
            displayOrder: 1
          },
          {
            name: 'Tree Services',
            description: 'Tree trimming, removal, and care',
            suggestedPriceRange: { min: 2000, max: 15000 },
            typicalDuration: { value: 3, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Irrigation Systems',
            description: 'Irrigation system installation and repair',
            suggestedPriceRange: { min: 5000, max: 20000 },
            typicalDuration: { value: 4, unit: 'hours' },
            expertiseLevel: 'advanced',
            displayOrder: 3
          },
          {
            name: 'Garden Design',
            description: 'Professional garden design and planning',
            suggestedPriceRange: { min: 5000, max: 30000 },
            typicalDuration: { value: 2, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 4
          }
        ]
      },
      {
        name: 'Landscaping',
        description: 'Professional landscaping services',
        icon: 'landscape',
        displayOrder: 2,
        subServices: [
          {
            name: 'Landscape Design',
            description: 'Complete landscape design and planning',
            suggestedPriceRange: { min: 10000, max: 50000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'expert',
            displayOrder: 1
          },
          {
            name: 'Hardscaping',
            description: 'Patios, walkways, and retaining walls',
            suggestedPriceRange: { min: 10000, max: 50000 },
            typicalDuration: { value: 3, unit: 'days' },
            expertiseLevel: 'advanced',
            displayOrder: 2
          },
          {
            name: 'Planting Services',
            description: 'Professional planting and garden installation',
            suggestedPriceRange: { min: 3000, max: 20000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 3
          },
          {
            name: 'Landscape Maintenance',
            description: 'Regular landscape maintenance and care',
            suggestedPriceRange: { min: 2000, max: 10000 },
            typicalDuration: { value: 2, unit: 'hours' },
            expertiseLevel: 'intermediate',
            displayOrder: 4
          }
        ]
      }
    ]
  }
];

// ============================================
// MAIN SEEDING FUNCTION
// ============================================

async function populateServiceCatalog() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing service catalog...');
    await ServiceCatalog.deleteMany({});
    console.log('Cleared existing data');

    console.log('Populating ALL service categories...\n');
    let insertedCount = 0;
    
    for (const data of serviceCatalogData) {
      const catalog = new ServiceCatalog(data);
      await catalog.save();
      insertedCount++;
      console.log(`  ✅ Added: ${data.mainCategory}`);
      
      // Log service category and sub-service counts
      let totalSubServices = 0;
      for (const category of data.serviceCategories) {
        const subServiceCount = category.subServices ? category.subServices.length : 0;
        totalSubServices += subServiceCount;
        console.log(`      • ${category.name}: ${subServiceCount} sub-services`);
      }
      console.log(`      📊 Total: ${data.serviceCategories.length} categories, ${totalSubServices} sub-services\n`);
    }
    
    console.log(`\n✅ Successfully seeded ${insertedCount} main categories!`);
    
    // Verify
    const count = await ServiceCatalog.countDocuments();
    console.log(`📊 Total documents in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error populating service catalog:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the population
populateServiceCatalog();