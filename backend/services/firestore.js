// backend/services/firestore.js
// Firestore admin SDK setup for server-side (Node.js) use
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account key from secrets
const serviceAccountPath = path.resolve(__dirname, '../../secrets/sloane-hub-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Only initialize once
if (!global._firebaseAdminApp) {
  global._firebaseAdminApp = initializeApp({
    credential: cert(serviceAccount),
  });
}

export const firestore = getFirestore();
