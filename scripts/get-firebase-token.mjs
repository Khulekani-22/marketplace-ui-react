#!/usr/bin/env node

/**
 * Get Firebase ID Token for API Testing
 * 
 * Usage:
 *   node scripts/get-firebase-token.mjs email@example.com password123
 *   
 * Or set environment variables:
 *   FIREBASE_EMAIL=email@example.com
 *   FIREBASE_PASSWORD=password123
 *   node scripts/get-firebase-token.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Firebase config from your project
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

// Extract project ID from service account
const projectId = serviceAccount.project_id;

// Firebase config (you need to add your web config here)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_WEB_API_KEY",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
};

// Get credentials from command line or environment
const email = process.argv[2] || process.env.FIREBASE_EMAIL;
const password = process.argv[3] || process.env.FIREBASE_PASSWORD;

if (!email || !password) {
  console.error('❌ Error: Email and password required');
  console.log('\nUsage:');
  console.log('  node scripts/get-firebase-token.mjs email@example.com password123');
  console.log('\nOr set environment variables:');
  console.log('  export FIREBASE_EMAIL=email@example.com');
  console.log('  export FIREBASE_PASSWORD=password123');
  console.log('  node scripts/get-firebase-token.mjs');
  process.exit(1);
}

console.log('🔐 Signing in to Firebase...');
console.log(`📧 Email: ${email}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

try {
  // Sign in
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Get ID token
  const idToken = await user.getIdToken();
  
  console.log('\n✅ Successfully authenticated!');
  console.log('\n📋 User Info:');
  console.log(`   UID: ${user.uid}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Email Verified: ${user.emailVerified}`);
  
  console.log('\n🎫 Firebase ID Token:');
  console.log('─'.repeat(80));
  console.log(idToken);
  console.log('─'.repeat(80));
  
  console.log('\n📌 How to use in Postman:');
  console.log('1. Open your Postman collection');
  console.log('2. Go to Variables tab');
  console.log('3. Set firebase_token = [copy token above]');
  console.log('4. Or use Authorization → Bearer Token → {{firebase_token}}');
  
  console.log('\n⏰ Token expires in: 1 hour');
  console.log('   Run this script again when it expires');
  
  console.log('\n🔧 Quick test:');
  console.log(`   curl -H "Authorization: Bearer ${idToken.substring(0, 50)}..." \\`);
  console.log('        http://localhost:5055/api/me');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Authentication failed:', error.message);
  
  if (error.code === 'auth/invalid-email') {
    console.log('💡 The email address is badly formatted');
  } else if (error.code === 'auth/user-not-found') {
    console.log('💡 No user found with this email');
  } else if (error.code === 'auth/wrong-password') {
    console.log('💡 Incorrect password');
  } else if (error.code === 'auth/too-many-requests') {
    console.log('💡 Too many failed login attempts. Try again later.');
  }
  
  process.exit(1);
}
