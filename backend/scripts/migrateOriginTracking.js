import 'dotenv/config';
import { firestore } from '../services/firestore.js';
import { originToDocId, decodeOriginFromDocId } from '../utils/originTracking.js';

const COLLECTION = 'originTracking';
const BATCH_LIMIT = 400;

async function migrateOriginTracking() {
  console.log(`[migrate-origin-tracking] Starting migration for collection "${COLLECTION}"...`);

  const snapshot = await firestore.collection(COLLECTION).get();
  if (snapshot.empty) {
    console.log('[migrate-origin-tracking] No documents found. Nothing to migrate.');
    return { migrated: 0, updatedKeys: 0, deleted: 0, skipped: 0, merged: 0 };
  }

  let batch = firestore.batch();
  let opsInBatch = 0;
  let migrated = 0;
  let updatedKeys = 0;
  let deleted = 0;
  let skipped = 0;
  let merged = 0;

  async function commitBatch(force = false) {
    if (opsInBatch === 0) return;
    if (!force && opsInBatch < BATCH_LIMIT) return;

    await batch.commit();
    opsInBatch = 0;
    batch = firestore.batch();
  }

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};

    let origin = data.origin;
    if (!origin) {
      const decoded = decodeOriginFromDocId(doc.id);
      if (decoded) {
        origin = decoded;
      } else {
        origin = data.originUrl || data.originHost || doc.id;
      }
    }

    if (!origin) {
      console.warn(`[migrate-origin-tracking] Skipping document ${doc.id} - unable to determine origin.`);
      skipped += 1;
      continue;
    }

    const targetId = originToDocId(origin);
    const targetRef = firestore.collection(COLLECTION).doc(targetId);

    if (doc.id === targetId) {
      if (!data.originKey) {
        batch.update(doc.ref, { originKey: targetId });
        opsInBatch += 1;
        updatedKeys += 1;
        await commitBatch();
      }
      skipped += 1;
      continue;
    }

    const targetSnap = await targetRef.get();
    if (targetSnap.exists) {
      const targetData = targetSnap.data() || {};
      const mergedData = {
        origin,
        originKey: targetId,
        firstSeen: earliestDate(targetData.firstSeen, data.firstSeen),
        lastSeen: latestDate(targetData.lastSeen, data.lastSeen),
        requestCount: (targetData.requestCount || 0) + (data.requestCount || 0),
        lastEndpoint: data.lastEndpoint || targetData.lastEndpoint || null,
        lastMethod: data.lastMethod || targetData.lastMethod || null,
        lastUserAgent: data.lastUserAgent || targetData.lastUserAgent || null,
        blocked: typeof data.blocked === 'boolean' ? data.blocked : (targetData.blocked ?? false),
      };

      batch.update(targetRef, mergedData);
      opsInBatch += 1;
      merged += 1;
    } else {
      batch.set(targetRef, {
        ...data,
        origin,
        originKey: targetId,
      }, { merge: true });
      opsInBatch += 1;
      migrated += 1;
    }

    batch.delete(doc.ref);
    opsInBatch += 1;
    deleted += 1;

    if (opsInBatch >= BATCH_LIMIT) {
      await commitBatch(true);
    }
  }

  await commitBatch(true);

  console.log('[migrate-origin-tracking] Migration complete.', {
    migrated,
    merged,
    updatedKeys,
    deleted,
    skipped,
  });

  return { migrated, merged, updatedKeys, deleted, skipped };
}

function earliestDate(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  return new Date(a) <= new Date(b) ? a : b;
}

function latestDate(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  return new Date(a) >= new Date(b) ? a : b;
}

migrateOriginTracking()
  .then(() => {
    console.log('[migrate-origin-tracking] Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[migrate-origin-tracking] Failed:', error);
    process.exit(1);
  });
