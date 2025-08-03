// run node importData.cjs in terminal at folder src


const admin = require("firebase-admin");
const fs = require("fs");

// Load your service account key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load your big JSON file
const raw = fs.readFileSync("./data.json");
const data = JSON.parse(raw);

async function importCollection(collName, arr) {
  for (const item of arr) {
    // Use item.id as the doc ID if available, otherwise Firestore auto-generates one
    const docId = item.id ? item.id.toString() : undefined;
    if (docId) {
      await db.collection(collName).doc(docId).set(item);
    } else {
      await db.collection(collName).add(item);
    }
    console.log(`Imported doc to ${collName}: ${docId || '[auto ID]'}`);
  }
}

(async () => {
  // For each top-level key (collection)
  for (const [collection, arr] of Object.entries(data)) {
    if (Array.isArray(arr)) {
      console.log(`Importing collection: ${collection}`);
      await importCollection(collection, arr);
    }
  }
  console.log("Import complete!");
  process.exit(0);
})();
