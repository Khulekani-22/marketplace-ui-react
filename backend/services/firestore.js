// backend/services/firestore.js
// Firestore admin SDK setup for server-side (Node.js) use

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get directory path for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account key from file
const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');
console.log('🔑 Loading Firebase service account from:', serviceAccountPath);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

// Robust singleton pattern for serverless
let app;
if (!getApps().length) {
  app = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  app = getApp();
}

export const firestore = getFirestore(app);
