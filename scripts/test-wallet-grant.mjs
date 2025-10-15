import fs from 'fs/promises';
import admin from 'firebase-admin';

const API_KEY = 'AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M';
const SERVICE_ACCOUNT_PATHS = [
  './serviceAccountKey.json',
  './backend/serviceAccountKey.json',
  './secrets/sloane-hub-service-account.json'
];

async function loadServiceAccount() {
  for (const path of SERVICE_ACCOUNT_PATHS) {
    try {
      const text = await fs.readFile(path, 'utf8');
      console.log(`Using service account: ${path}`);
      return JSON.parse(text);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw new Error('Service account key not found in expected paths.');
}

async function ensureAdmin(serviceAccount) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }
  return admin;
}

async function fetchIdToken(uid) {
  const serviceAccount = await loadServiceAccount();
  await ensureAdmin(serviceAccount);
  const customToken = await admin.auth().createCustomToken(uid);

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to exchange custom token: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.idToken;
}

async function main() {
  const adminUid = 'tAsFySNxnsW4a7L43wMRVLkJAqE3'; // khulekani@22onsloane.co admin
  const targetEmail = 'khulekani@22onsloane.co';

  try {
    const idToken = await fetchIdToken(adminUid);
    console.log('Obtained ID token');

    const response = await fetch('http://127.0.0.1:5055/api/wallets/grant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'x-tenant-id': '22onsloane'
      },
      body: JSON.stringify({
        email: targetEmail,
        amount: 5000,
        description: 'Test grant via script'
      })
    });

    const resultText = await response.text();
    console.log('Status:', response.status);
    console.log('Body:', resultText);
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (admin.apps.length) {
      await admin.app().delete();
    }
  }
}

await main();
