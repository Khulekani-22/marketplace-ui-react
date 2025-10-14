#!/usr/bin/env node

/**
 * Improved Migration Script with Better Error Handling
 * This script will:
 * 1. Validate Firebase service account
 * 2. Test Firestore connectivity 
 * 3. Run the migration if connectivity works
 * 4. Provide helpful instructions if it fails
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase AppData Migration Tool');
console.log('=====================================\n');

/**
 * Check if service account key exists and is valid
 */
function validateServiceAccount() {
  const serviceAccountPaths = [
    path.join(__dirname, '../serviceAccountKey.json'),
    path.join(__dirname, '../../serviceAccountKey.json'),
    path.join(__dirname, '../../secrets/sloane-hub-service-account.json'),
    path.join(process.cwd(), 'serviceAccountKey.json')
  ];

  console.log('🔍 Checking for service account key...');

  for (const keyPath of serviceAccountPaths) {
    if (fs.existsSync(keyPath)) {
      try {
        const serviceAccount = require(keyPath);
        
        // Validate required fields
        const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
        const missingFields = requiredFields.filter(field => !serviceAccount[field]);
        
        if (missingFields.length > 0) {
          console.log(`❌ Service account key at ${keyPath} is missing required fields: ${missingFields.join(', ')}`);
          continue;
        }

        console.log(`✅ Valid service account found at: ${keyPath}`);
        console.log(`   Project ID: ${serviceAccount.project_id}`);
        console.log(`   Client Email: ${serviceAccount.client_email}`);
        
        return { keyPath, serviceAccount };
      } catch (error) {
        console.log(`❌ Invalid service account at ${keyPath}: ${error.message}`);
        continue;
      }
    }
  }

  return null;
}

/**
 * Test basic Firestore connectivity
 */
async function testFirestoreConnectivity(serviceAccount) {
  const admin = require('firebase-admin');
  
  try {
    console.log('\n🧪 Testing Firestore connectivity...');
    
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    const db = admin.firestore();
    
    // Test read access - try to list collections
    console.log('   📖 Testing read access...');
    const collections = await db.listCollections();
    console.log(`   ✅ Read access confirmed. Found ${collections.length} collections.`);
    
    // Test write access - create a temporary document
    console.log('   📝 Testing write access...');
    const testRef = db.collection('_migration_test').doc('connectivity_test');
    await testRef.set({
      test: true,
      timestamp: new Date(),
      message: 'Migration connectivity test'
    });
    console.log('   ✅ Write access confirmed.');
    
    // Clean up test document
    await testRef.delete();
    console.log('   🧹 Test document cleaned up.');
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Firestore connectivity failed: ${error.message}`);
    
    // Provide specific error guidance
    if (error.code === 16 || error.message.includes('UNAUTHENTICATED')) {
      console.log('\n💡 Authentication Error Solutions:');
      console.log('   1. Generate a new service account key in Firebase Console:');
      console.log('      - Go to Firebase Console > Project Settings > Service Accounts');
      console.log('      - Click "Generate new private key"');
      console.log('      - Save the file as serviceAccountKey.json');
      console.log('   2. Ensure the service account has these roles:');
      console.log('      - Firebase Admin SDK Administrator Service Agent');
      console.log('      - Cloud Datastore User (for Firestore)');
      console.log('   3. Check that Firestore is enabled in your Firebase project');
      console.log('   4. Verify billing is enabled if required');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n💡 Permission Error Solutions:');
      console.log('   1. Check Firestore Security Rules in Firebase Console');
      console.log('   2. Ensure service account has proper IAM roles');
      console.log('   3. Verify project ID matches in service account key');
    }
    
    return false;
  }
}

/**
 * Run the actual migration
 */
async function runMigration() {
  try {
    console.log('\n🚀 Starting data migration...');
    
    // Import and run the migration
    const AppDataMigration = require('./appDataToFirestore.js');
    const migration = new AppDataMigration();
    
    console.log('📋 Running full migration...');
    await migration.runFullMigration();
    
    console.log('🔍 Verifying migration...');
    await migration.verifyMigration();
    
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Step 1: Validate service account
    const serviceAccountInfo = validateServiceAccount();
    
    if (!serviceAccountInfo) {
      console.log('\n❌ No valid service account key found.');
      console.log('\n📋 To fix this:');
      console.log('   1. Go to Firebase Console > Your Project > Settings > Service Accounts');
      console.log('   2. Click "Generate new private key"');
      console.log('   3. Save the downloaded file as "serviceAccountKey.json" in your project root');
      console.log('   4. Re-run this migration script');
      process.exit(1);
    }

    // Step 2: Test connectivity
    const connectivityOk = await testFirestoreConnectivity(serviceAccountInfo.serviceAccount);
    
    if (!connectivityOk) {
      console.log('\n❌ Firestore connectivity test failed.');
      console.log('\n🔧 Your application is configured to use Firestore as a fallback,');
      console.log('   so it will work with the file-based system until connectivity is fixed.');
      process.exit(1);
    }

    // Step 3: Run migration
    console.log('\n✅ Firestore connectivity confirmed!');
    const migrationSuccess = await runMigration();
    
    if (migrationSuccess) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Test your application locally');
      console.log('   2. Deploy to Vercel with the service account key');
      console.log('   3. Verify functionality on the deployed site');
      console.log('\n💡 Your app now uses Firestore with file fallback for maximum reliability!');
    } else {
      console.log('\n❌ Migration failed. Check the errors above and try again.');
      console.log('\n🔧 The application will continue to work with the file-based system.');
    }

  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = main;