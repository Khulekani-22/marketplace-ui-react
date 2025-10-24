// Migration script: Add 'listingType' to all service listings in Firestore
// Usage: node scripts/migrate-listingType-to-services.cjs

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Find service account key
const serviceAccountPaths = [
  path.join(__dirname, '../serviceAccountKey.json'),
  path.join(__dirname, '../../serviceAccountKey.json'),
  path.join(__dirname, '../../secrets/sloane-hub-service-account.json'),
  path.join(process.cwd(), 'serviceAccountKey.json')
];
let serviceAccountKey = null;
for (const keyPath of serviceAccountPaths) {
  if (fs.existsSync(keyPath)) {
    serviceAccountKey = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    console.log(`Using Firebase service account: ${keyPath}`);
    break;
  }
}
if (!serviceAccountKey) throw new Error('Service account key not found');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  projectId: serviceAccountKey.project_id
});
const db = admin.firestore();

async function migrate() {
  const servicesRef = db.collection('services');
  const snapshot = await servicesRef.get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.listingType) {
      // Infer type if possible, else default to 'subscription'
      let inferred = 'subscription';
      if (data.category && /mentor/i.test(data.category)) inferred = 'mentorship';
      else if (data.category && /book/i.test(data.category)) inferred = 'booking';
      await doc.ref.update({ listingType: inferred });
      updated++;
      console.log(`Updated ${doc.id}: listingType=${inferred}`);
    }
  }
  console.log(`Migration complete. Updated ${updated} documents.`);
  process.exit(0);
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
