// backend/services/firestore.js
// Firestore admin SDK setup for server-side (Node.js) use
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load service account from environment variable
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT env variable is not set');
}
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Only initialize once
if (!global._firebaseAdminApp) {
  global._firebaseAdminApp = initializeApp({
    credential: cert(serviceAccount),
  });
}

export const firestore = getFirestore();
