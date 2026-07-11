// backend/scripts/seedMissingCategories.js
const mongoose = require('mongoose');
const ServiceCatalog = require('../models/ServiceCatalog');
require('dotenv').config();

const missingCategories = [
  {
    mainCategory: "Event Planning",
    serviceCategories: [
      {
        name: "Event Planning",
        description: "Full event planning and coordination services",
        isActive: true,
        displayOrder: 0,
        subServices: [
          { name: "Wedding Planning", description: "Complete wedding planning and coordination", suggestedPriceRange: { min: 25000, max: 100000, currency: "KES" }, typicalDuration: { value: 3, unit: "days" }, expertiseLevel: "expert", isActive: true, displayOrder: 0 },
          { name: "Corporate Events", description: "Corporate event planning and execution", suggestedPriceRange: { min: 30000, max: 150000, currency: "KES" }, typicalDuration: { value: 2, unit: "days" }, expertiseLevel: "expert", isActive: true, displayOrder: 1 },
          { name: "Birthday Parties", description: "Birthday party planning and coordination", suggestedPriceRange: { min: 10000, max: 50000, currency: "KES" }, typicalDuration: { value: 1, unit: "days" }, expertiseLevel: "intermediate", isActive: true, displayOrder: 2 },
          { name: "Conferences", description: "Conference planning and management", suggestedPriceRange: { min: 40000, max: 200000, currency: "KES" }, typicalDuration: { value: 2, unit: "days" }, expertiseLevel: "expert", isActive: true, displayOrder: 3 }
        ]
      },
      {
        name: "Event Services",
        description: "Event-related services",
        isActive: true,
        displayOrder: 1,
        subServices: [
          { name: "Catering", description: "Event catering services", suggestedPriceRange: { min: 15000, max: 80000, currency: "KES" }, typicalDuration: { value: 1, unit: "days" }, expertiseLevel: "intermediate", isActive: true, displayOrder: 0 },
          { name: "Decorations", description: "Event decoration services", suggestedPriceRange: { min: 8000, max: 40000, currency: "KES" }, typicalDuration: { value: 1, unit: "days" }, expertiseLevel: "intermediate", isActive: true, displayOrder: 1 },
          { name: "Entertainment", description: "Event entertainment coordination", suggestedPriceRange: { min: 12000, max: 60000, currency: "KES" }, typicalDuration: { value: 1, unit: "days" }, expertiseLevel: "intermediate", isActive: true, displayOrder: 2 },
          { name: "Event Photography", description: "Professional event photography", suggestedPriceRange: { min: 10000, max: 50000, currency: "KES" }, typicalDuration: { value: 1, unit: "days" }, expertiseLevel: "expert", isActive: true, displayOrder: 3 }
        ]
      }
    ]
  }
];

async function seedMissingCategories() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    for (const data of missingCategories) {
      const existing = await ServiceCatalog.findOne({ mainCategory: data.mainCategory });
      if (existing) {
        console.log(`⚠️ ${data.mainCategory} already exists, skipping...`);
      } else {
        await ServiceCatalog.create(data);
        console.log(`✅ Created ${data.mainCategory} catalog`);
      }
    }

    console.log('✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding missing categories:', error);
    process.exit(1);
  }
}

seedMissingCategories();