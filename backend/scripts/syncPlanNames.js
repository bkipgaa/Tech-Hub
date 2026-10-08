// backend/scripts/syncPlanNames.js
require('dotenv').config();
const mongoose = require('mongoose');
const Technician = require('../models/Technician');
const { subscriptionPlans } = require('../utils/subscriptionPlans');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const techs = await Technician.find({
    'subscription.planDetails.name': { $exists: true },
  });

  let updated = 0;
  for (const t of techs) {
    const planId = t.subscription?.plan;
    const newName = subscriptionPlans[planId]?.name;
    if (newName && t.subscription.planDetails.name !== newName) {
      t.subscription.planDetails.name = newName;
      await t.save();
      updated++;
    }
  }

  console.log(`✅ Updated ${updated} of ${techs.length} technicians`);
  await mongoose.disconnect();
})();