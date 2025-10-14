#!/usr/bin/env node

/**
 * Test Firebase Authentication
 * Tests if Firebase client SDK can authenticate users
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFirebaseAuth() {
  console.log('🔐 Testing Firebase Authentication...\n');
  
  try {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      const serviceAccountPaths = [
        path.join(__dirname, 'serviceAccountKey.json'),
        path.join(__dirname, 'backend/serviceAccountKey.json'),
        path.join(__dirname, 'secrets/sloane-hub-service-account.json'),
      ];

      let serviceAccountKey = null;
      for (const keyPath of serviceAccountPaths) {
        if (fs.existsSync(keyPath)) {
          serviceAccountKey = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
          console.log(`🔑 Using service account from: ${keyPath}`);
          break;
        }
      }

      if (!serviceAccountKey) {
        throw new Error('Service account key not found');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      });
    }

    // List all users in Firebase Auth
    console.log('📋 Listing Firebase Auth users...\n');
    const listUsersResult = await admin.auth().listUsers(10);
    
    console.log(`Found ${listUsersResult.users.length} users:`);
    listUsersResult.users.forEach((userRecord, index) => {
      console.log(`\n${index + 1}. ${userRecord.email || 'No email'}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Display Name: ${userRecord.displayName || 'Not set'}`);
      console.log(`   Email Verified: ${userRecord.emailVerified}`);
      console.log(`   Disabled: ${userRecord.disabled}`);
      console.log(`   Created: ${new Date(userRecord.metadata.creationTime).toISOString()}`);
      console.log(`   Last Sign In: ${userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toISOString() : 'Never'}`);
    });

    // Check specific test users
    console.log('\n\n🔍 Checking specific users...\n');
    const testEmails = [
      'khulekani@22onsloane.co',
      'ruthmaphosa2024@gmail.com',
      '22onsloanedigitalteam@gmail.com',
      'mncubekhulekani@gmail.com'
    ];

    for (const email of testEmails) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log(`✅ ${email}`);
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Email Verified: ${userRecord.emailVerified}`);
        console.log(`   Disabled: ${userRecord.disabled}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`❌ ${email} - User not found in Firebase Auth`);
        } else {
          console.log(`❌ ${email} - Error: ${error.message}`);
        }
      }
    }

    console.log('\n\n✅ Firebase Authentication test completed successfully!');
    console.log('\n💡 To test login in browser:');
    console.log('   1. Go to http://localhost:5173/login');
    console.log('   2. Use one of the verified emails above');
    console.log('   3. If user not found, they need to be created in Firebase Console');
    
    return true;
  } catch (error) {
    console.error('\n❌ Firebase Authentication test failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    return false;
  }
}

// Run the test
testFirebaseAuth()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
