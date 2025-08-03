// run node exportData.cjs  in terminal at src folder

const admin = require("firebase-admin");
const fs = require("fs");

// Load your service account key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Helper to export one collection
async function exportCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const docs = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.id) data.id = doc.id; // Optionally store Firestore doc id
    docs.push(data);
  });
  return docs;
}

(async () => {
  // List your top-level collection names here, or get all collections:
  const collections = await db.listCollections();
  const data = {};
  for (const coll of collections) {
    console.log(`Exporting collection: ${coll.id}`);
    data[coll.id] = await exportCollection(coll.id);
  }
  // Write output to file
  fs.writeFileSync("output.json", JSON.stringify(data, null, 2));
  console.log("Firestore export complete: output.json!");
  process.exit(0);
})();
