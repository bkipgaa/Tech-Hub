/**
 * Cleanup Technicians Script
 * ==========================
 * Clears all technician data from the database to prepare for fresh population
 * with the new three-level hierarchy (mainCategory, serviceCategories, subServices)
 * 
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Technician = require('../models/Technician');
const User = require('../models/User');

dotenv.config();

async function cleanupTechnicians() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧹 Starting cleanup process...\n');

    // 1. Count existing technicians before deletion
    const technicianCount = await Technician.countDocuments();
    console.log(`📊 Found ${technicianCount} technician(s) in database`);

    if (technicianCount === 0) {
      console.log('ℹ️ No technicians to clean up.');
      
      // Check if we should also clean up users
      const userCount = await User.countDocuments({ role: 'technician' });
      console.log(`📊 Found ${userCount} user(s) with technician role`);
      
      if (userCount > 0) {
        console.log('⚠️ Warning: There are users with technician role but no technician documents.');
        console.log('   You may want to manually review these users.');
      }
      
      await mongoose.disconnect();
      console.log('\n👋 Disconnected from MongoDB');
      return;
    }

    // 2. Get all technician user IDs before deletion (for user role cleanup)
    const technicians = await Technician.find({}, 'userId');
    const userIds = technicians.map(t => t.userId);
    console.log(`👤 Found ${userIds.length} technician user(s) to update`);

    // 3. Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete ALL technician profiles!');
    console.log(`   - ${technicianCount} technician(s) will be deleted`);
    console.log(`   - ${userIds.length} user(s) will have their role changed to 'user'`);
    console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('\n🚀 Proceeding with cleanup...\n');

    // 4. Delete all technician documents
    const deleteResult = await Technician.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} technician document(s)`);

    // 5. Update user roles from 'technician' to 'user'
    if (userIds.length > 0) {
      const updateResult = await User.updateMany(
        { _id: { $in: userIds }, role: 'technician' },
        { role: 'user' }
      );
      console.log(`👤 Updated ${updateResult.modifiedCount} user(s) role to 'user'`);
    }

    // 6. Verify cleanup
    const remainingTechnicians = await Technician.countDocuments();
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   - Remaining technicians: ${remainingTechnicians}`);
    console.log(`   - Total users with technician role: ${await User.countDocuments({ role: 'technician' })}`);

    // 7. Show summary of what was cleaned
    console.log('\n📋 Cleanup Summary:');
    console.log(`   ✅ All technician profiles deleted`);
    console.log(`   ✅ All technician users converted back to 'user' role`);
    console.log(`   ✅ Database is ready for fresh technician population`);

    console.log('\n💡 Next steps:');
    console.log('   1. Run the updated population script:');
    console.log('      npm run populate-technicians');
    console.log('      or');
    console.log('      node scripts/populate-technicians.js');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupTechnicians();