// scripts/backfillServiceCategoryMainCategory.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Technician = require('../models/Technician');

dotenv.config();

async function backfillMainCategory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const technicians = await Technician.find({});
    console.log(`📦 Found ${technicians.length} technicians to check.`);

    let updatedCount = 0;

    for (const tech of technicians) {
      let needsSave = false;

      // 1. Populate mainCategories if empty
      if (!tech.mainCategories || tech.mainCategories.length === 0) {
        tech.mainCategories = tech.mainCategory ? [tech.mainCategory] : [];
        needsSave = true;
        console.log(`  ✅ Set mainCategories for ${tech._id}`);
      }

      // 2. Add mainCategory to each service category
      const primaryMainCategory = tech.mainCategory || (tech.mainCategories && tech.mainCategories[0]) || '';

      if (tech.serviceCategories && tech.serviceCategories.length > 0) {
        for (const service of tech.serviceCategories) {
          if (!service.mainCategory) {
            service.mainCategory = primaryMainCategory;
            needsSave = true;
            console.log(`    ✅ Added mainCategory "${primaryMainCategory}" to service "${service.categoryName}"`);
          }
        }
      }

      if (needsSave) {
        await tech.save();
        updatedCount++;
      }
    }

    console.log(`✅ Migration complete! Updated ${updatedCount} technicians.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

backfillMainCategory();