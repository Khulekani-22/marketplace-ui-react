#!/usr/bin/env node

/**
 * Reset Firebase User Password
 * This script resets the password for a Firebase user
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = process.argv[2] || '22onsloanedigitalteam@gmail.com';
const newPassword = process.argv[3];

if (!newPassword) {
  console.error('❌ Error: New password required');
  console.log('\nUsage:');
  console.log('  node scripts/reset-firebase-password.js EMAIL NEW_PASSWORD');
  console.log('\nExample:');
  console.log('  node scripts/reset-firebase-password.js 22onsloanedigitalteam@gmail.com "MyNewPassword123"');
  process.exit(1);
}

console.log('🔐 Resetting password for:', email);
console.log('');

admin.auth().getUserByEmail(email)
  .then(user => {
    console.log('✅ User found:');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('');
    
    return admin.auth().updateUser(user.uid, {
      password: newPassword
    });
  })
  .then(() => {
    console.log('✅ Password updated successfully!');
    console.log('');
    console.log('📋 New Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', newPassword);
    console.log('');
    console.log('🧪 Test with:');
    console.log(`   ./scripts/get-firebase-token.sh ${email} '${newPassword}'`);
    console.log('');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
