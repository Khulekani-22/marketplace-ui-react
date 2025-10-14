#!/usr/bin/env node
import fetch from 'node-fetch';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

console.log('🧪 Testing /api/data/services/mine endpoint...\n');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  await readFile('./serviceAccountKey.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Get custom token for khulekani user
const uid = 'tAsFySNxnsW4a7L43wMRVLkJAqE3';
const email = 'khulekani@22onsloane.co';

console.log(`Creating token for: ${email} (${uid})`);
const customToken = await getAuth().createCustomToken(uid);

// Sign in with custom token to get ID token
const apiKey = 'AIzaSyBFdVgRqgq8dQgIqCTgXHwYJ9bpXnJwX_I'; // From firebase config
const signInResponse = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  }
);

const authResult = await signInResponse.json();
if (!authResult.idToken) {
  console.error('❌ Failed to get ID token:', authResult);
  process.exit(1);
}

console.log('✅ Got Firebase ID token\n');

// Call /api/data/services/mine endpoint
console.log('Calling: GET http://localhost:5055/api/data/services/mine');
const response = await fetch('http://localhost:5055/api/data/services/mine', {
  headers: { 
    'Authorization': `Bearer ${authResult.idToken}`,
    'x-tenant-id': 'public'
  }
});

const data = await response.json();
console.log('\n=== RESPONSE ===');
console.log('Status:', response.status);
console.log('Listings count:', data.listings?.length || 0);
console.log('Bookings count:', data.bookings?.length || 0);

if (data.listings && data.listings.length > 0) {
  console.log('\n=== LISTINGS ===');
  data.listings.forEach((listing, i) => {
    console.log(`  ${i + 1}. ${listing.name || listing.title} (ID: ${listing.id})`);
    console.log(`     VendorId: ${listing.vendorId}`);
  });
  console.log('\n✅ SUCCESS! Vendor listings are working!');
} else {
  console.log('\n❌ No listings returned');
  console.log('Response:', JSON.stringify(data, null, 2));
}

process.exit(0);
