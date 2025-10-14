import admin from 'firebase-admin';
import DataIntegrityValidator from './backend/utils/DataIntegrityValidator.js';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const validator = new DataIntegrityValidator(db);

console.log('🧪 Testing Data Integrity Validator...\n');

async function testValidator() {
  try {
    // Test service vendor validation
    const validation = await validator.validateServiceVendors();
    console.log('✅ Service vendor validation completed:');
    console.log(`   Valid: ${validation.valid}`);
    console.log(`   Missing vendors: ${validation.missingVendors?.length || 0}`);
    
    if (validation.missingVendors?.length > 0) {
      console.log('   Missing vendor names:');
      validation.missingVendors.forEach(name => console.log(`     - ${name}`));
    }

    // Test full integrity check
    console.log('\n🔍 Running full integrity check...');
    const fullCheck = await validator.runFullCheck();
    
    console.log('\n📊 Full Check Results:');
    console.log(`   Timestamp: ${fullCheck.timestamp}`);
    console.log(`   Service Vendors Valid: ${fullCheck.checks.serviceVendors.valid}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testValidator();