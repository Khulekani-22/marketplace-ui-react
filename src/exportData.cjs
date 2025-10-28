// run with: node src/exportData.cjs  (run from project root)
// run with: node src/exportData.cjs  (run from project root)

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Try common locations for the service account key. Update if needed.
const possibleKeys = [
  path.resolve(__dirname, '../secrets/sloane-hub-service-account.json'),
  path.resolve(__dirname, './serviceAccountKey.json'),
  path.resolve(__dirname, '../serviceAccountKey.json')
];

let serviceAccountPath = possibleKeys.find(p => {
  try { return fs.existsSync(p); } catch (e) { return false; }
});

if (!serviceAccountPath) {
  console.error('Service account key not found. Checked:\n' + possibleKeys.join('\n'));
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Recursively export a document (including its subcollections)
async function exportDocument(docRef) {
  const snap = await docRef.get();
  const docData = snap.exists ? snap.data() : {};
  // attach id explicitly
  docData.__id = docRef.id;

  // list subcollections and export them recursively
  const subcols = await docRef.listCollections();
  if (subcols.length > 0) {
    docData.__subcollections = {};
    for (const sc of subcols) {
      const scSnap = await sc.get();
      const scObj = {};
      for (const doc of scSnap.docs) {
        scObj[doc.id] = await exportDocument(sc.doc(doc.id));
      }
      docData.__subcollections[sc.id] = scObj;
    }
  }
  return docData;
}

// Export a top-level collection to an object mapping docId -> exported doc
async function exportCollectionById(collectionId) {
  const collRef = db.collection(collectionId);
  const snap = await collRef.get();
  const out = {};
  for (const doc of snap.docs) {
    out[doc.id] = await exportDocument(collRef.doc(doc.id));
  }
  return out;
}

async function main() {
  try {
    console.log('Listing top-level collections...');
    const collections = await db.listCollections();
    const exportObj = {};
    for (const coll of collections) {
      console.log(`Exporting collection: ${coll.id}`);
      exportObj[coll.id] = await exportCollectionById(coll.id);
    }

    const outFile = path.resolve(process.cwd(), `firestore-export-${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(exportObj, null, 2), 'utf8');
    console.log(`Export complete: ${outFile}`);
    process.exit(0);
  } catch (err) {
    console.error('Export failed:', err);
    process.exit(2);
  }
}

main();

