// backend/services/firestore.js
// Firestore admin SDK setup for server-side (Node.js) use

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { loadFirebaseServiceAccount } from '../utils/loadFirebaseServiceAccount.js';

// Robust singleton pattern for serverless
let app;
if (!getApps().length) {
  const serviceAccount = loadFirebaseServiceAccount();

  if (serviceAccount) {
    app = initializeApp({
      credential: cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey,
      }),
    });
  } else {
    console.warn('[firestore] No Firebase service account credentials found. Falling back to default app initialization.');
    app = initializeApp();
  }
} else {
  app = getApp();
}

export const firestore = getFirestore(app);
try {
  firestore.settings({ preferRest: true });
} catch (error) {
  console.warn('[firestore] Unable to enable REST mode, continuing with default transport.', error?.message || error);
}
export { FieldValue, Timestamp };
