/**
 * Simple Firebase Connection Test
 * Tests if we can successfully connect to Firebase using the service account
 */

const admin = require('firebase-admin');
const path = require('path');

async function testFirebaseConnection() {
  try {
    console.log('🔧 Testing Firebase connection...');
    
    // Initialize Firebase if not already done
    if (!admin.apps.length) {
      const serviceAccountKey = require('../serviceAccountKey.json');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        projectId: serviceAccountKey.project_id
      });
      
      console.log(`✅ Firebase Admin initialized for project: ${serviceAccountKey.project_id}`);
    }

    const db = admin.firestore();
    
    // Test by trying to read from a simple collection
    console.log('📝 Testing Firestore read access...');
    const testCollection = db.collection('test');
    const snapshot = await testCollection.limit(1).get();
    
    console.log(`✅ Firestore read test successful! Found ${snapshot.size} documents in 'test' collection`);
    
    // Test write access
    console.log('📝 Testing Firestore write access...');
    const testDoc = await testCollection.add({
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    
    console.log(`✅ Firestore write test successful! Created document: ${testDoc.id}`);
    
    // Clean up test document
    await testDoc.delete();
    console.log('🧹 Cleaned up test document');
    
    console.log('🎉 All Firebase tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details || 'No additional details');
    
    if (error.code === 16) {
      console.log('\n💡 Possible solutions for authentication error:');
      console.log('   1. Check if the service account key is valid and not expired');
      console.log('   2. Ensure the service account has proper Firestore permissions');
      console.log('   3. Verify the Firebase project is active and billing is enabled');
      console.log('   4. Try regenerating the service account key in Firebase Console');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testFirebaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = testFirebaseConnection;