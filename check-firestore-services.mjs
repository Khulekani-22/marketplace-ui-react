#!/usr/bin/env node
/**
 * Check Firestore services collection and show count
 */

import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPaths = [
  './serviceAccountKey.json',
  './secrets/sloane-hub-service-account.json',
  './backend/serviceAccountKey.json'
];

let serviceAccount = null;
for (const path of serviceAccountPaths) {
  if (fs.existsSync(path)) {
    serviceAccount = JSON.parse(fs.readFileSync(path, 'utf8'));
    console.log(`✅ Using service account: ${path}`);
    break;
  }
}

if (!serviceAccount) {
  console.error('❌ Service account key not found');
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkServices() {
  try {
    console.log('\n🔍 Checking Firestore services collection...\n');
    
    const snapshot = await db.collection('services').get();
    
    console.log(`Total services in Firestore: ${snapshot.size}`);
    
    if (snapshot.size === 0) {
      console.log('\n⚠️  Services collection is EMPTY!');
      console.log('\nTo populate with sample data, you can:');
      console.log('1. Use the admin UI at /listings-admin');
      console.log('2. Import data from a JSON file');
      console.log('3. Add services manually through the vendor portal');
    } else {
      console.log('\n✅ Found services:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.title || '(no title)'} | Status: ${data.status || 'unknown'} | Category: ${data.category || 'none'}`);
      });
      
      // Count by status
      const byStatus = {};
      snapshot.forEach(doc => {
        const status = doc.data().status || 'unknown';
        byStatus[status] = (byStatus[status] || 0) + 1;
      });
      
      console.log('\n📊 Status breakdown:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }
    
    console.log('\n');
  } catch (error) {
    console.error('❌ Error checking services:', error.message);
    process.exit(1);
  }
}

checkServices().then(() => process.exit(0));
