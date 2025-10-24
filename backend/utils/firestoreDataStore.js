import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeTenantId(id) {
  if (!id) return 'public';
  const value = String(id).toLowerCase();
  return value === 'vendor' ? 'public' : value;
}

function chunkArray(list, size) {
  const chunks = [];
  if (!Array.isArray(list) || size <= 0) return chunks;
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
}

function convertTimestamp(value) {
  if (!value) return value;
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function serializeDocument(doc) {
  if (!doc) return null;
  const data = doc.data();
  if (!data || typeof data !== 'object') {
    return { id: doc.id };
  }

  const output = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      output[key] = value.map((entry) => convertTimestamp(entry));
      continue;
    }
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      output[key] = convertTimestamp(value);
      continue;
    }
    output[key] = value;
  }
  return output;
}

/**
 * Firestore Data Store
 * Drop-in replacement for the file-based dataStore.js
 * Maintains the same API but uses Firestore as the backend
 */
class FirestoreDataStore {
  constructor() {
    this.db = null;
    this.cache = null;
    this.lastLoaded = 0;
    this.TTL_MS = 5000; // 5s cache for Firestore (longer than file-based)
    this.initialized = false;
    
    this.initializeFirestore();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirestore() {
    try {
      // Check if already initialized
      if (admin.apps.length > 0) {
        this.db = admin.firestore();
        // --- Aggregation logic: Merge startups, vendors, and admins into users collection ---
        try {
          const users = Array.isArray(data.users) ? data.users : [];
          const vendors = Array.isArray(data.vendors) ? data.vendors : [];
          const startups = Array.isArray(data.startups) ? data.startups : [];
          const seen = new Map();
          // Add users (admins/members)
          for (const u of users) {
            if (!u || typeof u !== 'object') continue;
            const email = (u.email || '').toLowerCase();
            if (!email) continue;
            seen.set(email, {
              ...u,
              email,
              role: u.role || 'member',
              type: 'user',
              tenantId: u.tenantId || 'public',
            });
          }
          // Add vendors
          for (const v of vendors) {
            const email = (v.contactEmail || v.email || '').toLowerCase();
            if (!email) continue;
            if (!seen.has(email)) {
              seen.set(email, {
                email,
                name: v.name || v.companyName || email,
                role: v.role || 'vendor',
                type: 'vendor',
                tenantId: v.tenantId || 'vendor',
                ...v,
              });
            }
          }
          // Add startups
          for (const s of startups) {
            const email = (s.contactEmail || s.email || '').toLowerCase();
            if (!email) continue;
            if (!seen.has(email)) {
              seen.set(email, {
                email,
                name: s.name || s.companyName || email,
                role: s.role || 'startup',
                type: 'startup',
                tenantId: s.tenantId || 'startup',
                ...s,
              });
            }
          }
          // Overwrite users collection with merged list
          data.users = Array.from(seen.values());
        } catch (aggError) {
          console.warn('⚠️  Failed to aggregate users, vendors, startups:', aggError);
        }
        return data;
        return;
      }

      // Look for service account key in multiple locations
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
          console.log(`🔑 Firebase service account found at: ${keyPath}`);
          break;
        }
      }

      if (!serviceAccountKey) {
        throw new Error('Firebase service account key not found');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        projectId: serviceAccountKey.project_id
      });

      this.db = admin.firestore();
      this.initialized = true;
      console.log('✅ Firestore data store initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Firestore data store:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Load all data from Firestore collections
   */
  async loadFromFirestore() {
    if (!this.initialized) {
      throw new Error('Firestore not initialized');
    }

    try {
      const collections = [
        'bookings', 'cohorts', 'events', 'forumThreads', 'jobs', 
        'mentorshipSessions', 'messageThreads', 'services', 'leads', 
        'startups', 'vendors', 'companies', 'profiles', 'users', 
        'tenants', 'subscriptions', 'wallets'
      ];

      const data = {};

      // Load each collection
      for (const collectionName of collections) {
        try {
          const snapshot = await this.db.collection(collectionName).get();
          data[collectionName] = [];
          
          snapshot.forEach(doc => {
            const docData = doc.data();
            // Remove migration metadata
            delete docData._migrated;
            data[collectionName].push({
              id: doc.id,
              ...docData
            });
          });

          console.log(`📥 Loaded ${data[collectionName].length} ${collectionName}`);
        } catch (error) {
          console.warn(`⚠️  Failed to load ${collectionName}:`, error.message);
          data[collectionName] = [];
        }
      }

      // Load wallet transactions as subcollections
      if (data.wallets && data.wallets.length > 0) {
        for (const wallet of data.wallets) {
          try {
            const transactionsSnapshot = await this.db
              .collection('wallets')
              .doc(wallet.id)
              .collection('transactions')
              .orderBy('createdAt', 'desc')
              .get();

            wallet.transactions = [];
            transactionsSnapshot.forEach(doc => {
              const txData = doc.data();
              delete txData._migrated;
              wallet.transactions.push({
                id: doc.id,
                ...txData
              });
            });

            console.log(`💳 Loaded ${wallet.transactions.length} transactions for wallet ${wallet.id}`);
          } catch (error) {
            console.warn(`⚠️  Failed to load transactions for wallet ${wallet.id}:`, error.message);
            wallet.transactions = [];
          }
        }
      }

      console.log('✅ All data loaded from Firestore');
      return data;

    } catch (error) {
      console.error('❌ Failed to load from Firestore:', error);
      throw error;
    }
  }

  /**
   * Save data to Firestore
   */
  async saveToFirestore(data) {
    if (!this.initialized) {
      throw new Error('Firestore not initialized');
    }

    try {
      let batch = this.db.batch();
      let operationCount = 0;
      const MAX_BATCH_SIZE = 500;

      const flushBatch = async () => {
        if (operationCount === 0) return;
        await batch.commit();
        batch = this.db.batch();
        operationCount = 0;
      };

      const collections = [
        'bookings', 'cohorts', 'events', 'forumThreads', 'jobs', 
        'mentorshipSessions', 'messageThreads', 'services', 'leads', 
        'startups', 'vendors', 'companies', 'profiles', 'users', 
        'tenants', 'subscriptions', 'wallets'
      ];

      for (const collectionName of collections) {
        if (!data[collectionName] || !Array.isArray(data[collectionName])) {
          continue;
        }

        for (const item of data[collectionName]) {
          if (operationCount >= MAX_BATCH_SIZE) {
            await flushBatch();
          }

          const { id, transactions, ...cleanItem } = item;
          const docId = id || this.db.collection(collectionName).doc().id;
          
          // Add metadata
          cleanItem._updatedAt = new Date();
          cleanItem._source = 'dataStore';
          
          const docRef = this.db.collection(collectionName).doc(docId);
          batch.set(docRef, cleanItem, { merge: true });
          operationCount++;

          // Handle wallet transactions separately
          if (collectionName === 'wallets' && transactions && Array.isArray(transactions)) {
            for (const transaction of transactions) {
              if (operationCount >= MAX_BATCH_SIZE) {
                await flushBatch();
              }

              const { id: txId, ...cleanTx } = transaction;
              const txDocId = txId || this.db.collection('temp').doc().id;
              
              cleanTx._updatedAt = new Date();
              cleanTx._source = 'dataStore';
              
              const txRef = docRef.collection('transactions').doc(txDocId);
              batch.set(txRef, cleanTx, { merge: true });
              operationCount++;
            }
          }
        }
      }

      await flushBatch();

      console.log('✅ Data saved to Firestore');

    } catch (error) {
      console.error('❌ Failed to save to Firestore:', error);
      throw error;
    }
  }

  normalizeTenant(id) {
    return normalizeTenantId(id);
  }

  async queryServicesOptimized({
    tenantId,
    category,
    vendor,
    featured,
    minPrice,
    maxPrice,
    page = 1,
    pageSize = 20,
    listingType,
  } = {}) {
    if (!this.initialized) {
      throw new Error('Firestore not initialized');
    }

    const normalizedTenant = this.normalizeTenant(tenantId);
    let queryRef = this.db.collection('services').where('tenantId', '==', normalizedTenant);

    if (category) {
      queryRef = queryRef.where('category', '==', category);
    }
    if (vendor) {
      queryRef = queryRef.where('vendor', '==', vendor);
    }
    if (typeof featured === 'boolean') {
      queryRef = queryRef.where('featured', '==', featured);
    }
    if (listingType) {
      queryRef = queryRef.where('listingType', '==', String(listingType));
    }

    const numericMin = Number(minPrice);
    const numericMax = Number(maxPrice);
    const hasMin = !Number.isNaN(numericMin);
    const hasMax = !Number.isNaN(numericMax);

    if (hasMin) {
      queryRef = queryRef.where('price', '>=', numericMin);
    }
    if (hasMax) {
      queryRef = queryRef.where('price', '<=', numericMax);
    }

    const usePriceOrder = hasMin || hasMax;
    const orderField = usePriceOrder ? 'price' : 'createdAt';
    const direction = usePriceOrder ? 'ASC' : 'DESC';

    let orderedQuery = queryRef.orderBy(orderField, direction.toLowerCase());

    const safePageSize = Math.max(1, Math.min(Number(pageSize) || 20, 100));
    const safePage = Math.max(1, Number(page) || 1);
    const offset = (safePage - 1) * safePageSize;

    if (offset > 0) {
      orderedQuery = orderedQuery.offset(offset);
    }

    orderedQuery = orderedQuery.limit(safePageSize);

    const [snapshot, countSnapshot] = await Promise.all([
      orderedQuery.get(),
      queryRef.count().get().catch(() => null),
    ]);

    const items = snapshot.docs.map((doc) => serializeDocument(doc));
    const total = countSnapshot ? countSnapshot.data().count : items.length + offset;

    return {
      page: safePage,
      pageSize: safePageSize,
      total,
      items,
    };
  }

  async getVendorServices({
    tenantId,
    vendorId,
    ownerUid,
    emails = [],
    limit = 100,
  } = {}) {
    if (!this.initialized) {
      throw new Error('Firestore not initialized');
    }

    const normalizedTenant = this.normalizeTenant(tenantId);
    const servicesRef = this.db.collection('services');
    const uniqueEmails = Array.from(new Set((emails || []).filter(Boolean).map((e) => e.toLowerCase())));
    const queries = [];

    if (vendorId) {
      queries.push(
        servicesRef
          .where('tenantId', '==', normalizedTenant)
          .where('vendorId', '==', vendorId)
          .orderBy('createdAt', 'desc')
          .limit(limit)
      );
    }

    if (ownerUid) {
      queries.push(
        servicesRef
          .where('tenantId', '==', normalizedTenant)
          .where('ownerUid', '==', ownerUid)
          .orderBy('createdAt', 'desc')
          .limit(limit)
      );
    }

    uniqueEmails.forEach((email) => {
      queries.push(
        servicesRef
          .where('tenantId', '==', normalizedTenant)
          .where('contactEmail', '==', email)
          .orderBy('createdAt', 'desc')
          .limit(limit)
      );
    });

    const results = await Promise.all(
      queries.map((q) =>
        q
          .get()
          .then((snap) => snap.docs)
          .catch((err) => {
            console.warn('[FirestoreDataStore] vendor services query failed', err.message);
            return [];
          })
      )
    );

    const map = new Map();
    results.flat().forEach((doc) => {
      if (!doc) return;
      map.set(doc.id, serializeDocument(doc));
    });

    return Array.from(map.values());
  }

  async getVendorBookings({
    tenantId,
    serviceIds = [],
    vendorId,
    emails = [],
    limit = 100,
  } = {}) {
    if (!this.initialized) {
      throw new Error('Firestore not initialized');
    }

    const normalizedTenant = this.normalizeTenant(tenantId);
    const bookingsRef = this.db.collection('bookings');
    const uniqueServiceIds = Array.from(new Set((serviceIds || []).filter(Boolean).map((id) => String(id))));
    const uniqueEmails = Array.from(new Set((emails || []).filter(Boolean).map((e) => e.toLowerCase())));

    const queries = [];

    if (vendorId) {
      queries.push(
        bookingsRef
          .where('tenantId', '==', normalizedTenant)
          .where('vendorId', '==', vendorId)
          .orderBy('createdAt', 'desc')
          .limit(limit)
      );
    }

    uniqueEmails.forEach((email) => {
      queries.push(
        bookingsRef
          .where('tenantId', '==', normalizedTenant)
          .where('vendorEmail', '==', email)
          .orderBy('createdAt', 'desc')
          .limit(limit)
      );
    });

    chunkArray(uniqueServiceIds, 10).forEach((chunk) => {
      queries.push(
        bookingsRef
          .where('tenantId', '==', normalizedTenant)
          .where('serviceId', 'in', chunk)
          .orderBy('createdAt', 'desc')
          .limit(limit)
      );
    });

    const results = await Promise.all(
      queries.map((q) =>
        q
          .get()
          .then((snap) => snap.docs)
          .catch((err) => {
            console.warn('[FirestoreDataStore] vendor bookings query failed', err.message);
            return [];
          })
      )
    );

    const map = new Map();
    results.flat().forEach((doc) => {
      if (!doc) return;
      map.set(doc.id, serializeDocument(doc));
    });

    return Array.from(map.values()).sort((a, b) => {
      const ta = Date.parse(a.createdAt || a.scheduledDate || '') || 0;
      const tb = Date.parse(b.createdAt || b.scheduledDate || '') || 0;
      return tb - ta;
    });
  }

  async getDocumentsByIds(collectionName, ids = []) {
    if (!this.initialized) {
      throw new Error('Firestore not initialized');
    }

    const uniqueIds = Array.from(
      new Set(
        (ids || [])
          .map((id) => (id != null ? String(id).trim() : ''))
          .filter((id) => id.length > 0)
      )
    );

    if (!uniqueIds.length) return [];

    const docRefs = uniqueIds.map((id) => this.db.collection(collectionName).doc(id));
    const results = [];

    for (const chunk of chunkArray(docRefs, 100)) {
      if (!chunk.length) continue;
      try {
        const snapshots = await this.db.getAll(...chunk);
        snapshots.forEach((doc) => {
          if (!doc?.exists) return;
          results.push(serializeDocument(doc));
        });
      } catch (err) {
        console.warn(
          `[FirestoreDataStore] getDocumentsByIds failed for ${collectionName}`,
          err?.message || err
        );
      }
    }

    return results;
  }

  async getMentorshipSessions({ tenantId, limit = 200, includePast = true } = {}) {
    if (!this.initialized) {
      throw new Error('Firestore not initialized');
    }

    const normalizedTenant = this.normalizeTenant(tenantId);
    let baseQuery = this.db.collection('mentorshipSessions');
    if (normalizedTenant !== 'public') {
      baseQuery = baseQuery.where('tenantId', '==', normalizedTenant);
    }

    let snapshot;
    try {
      let orderedQuery = baseQuery.orderBy('sessionDate', 'desc');
      if (limit) {
        orderedQuery = orderedQuery.limit(limit);
      }
      snapshot = await orderedQuery.get();
    } catch (err) {
      console.warn('[FirestoreDataStore] sessionDate order failed, falling back', err?.message || err);
      let fallbackQuery = baseQuery;
      if (limit) {
        fallbackQuery = fallbackQuery.limit(limit);
      }
      snapshot = await fallbackQuery.get();
    }

    let sessions = snapshot.docs.map((doc) => serializeDocument(doc));

    if (!includePast) {
      const now = Date.now();
      sessions = sessions.filter((session) => {
        const ts = Date.parse(session.sessionDate || session.scheduledDate || session.createdAt || '');
        if (!Number.isFinite(ts)) return true;
        return ts >= now;
      });
    }

    return sessions;
  }

  async findVendorProfile({ tenantId, uid, email } = {}) {
    if (!this.initialized) {
      throw new Error('Firestore not initialized');
    }

    const normalizedTenant = this.normalizeTenant(tenantId);
    const emailLc = (email || '').toLowerCase();
    const collections = ['vendors', 'startups', 'companies', 'profiles'];

    const matchDoc = async (snapshot) => {
      if (!snapshot || snapshot.empty) return null;
      for (const doc of snapshot.docs) {
        const data = doc.data() || {};
        const docTenant = normalizeTenantId(data.tenantId);
        if (
          docTenant === normalizedTenant ||
          !data.tenantId ||
          normalizedTenant === 'public'
        ) {
          return serializeDocument(doc);
        }
      }
      return null;
    };

    for (const collectionName of collections) {
      const ref = this.db.collection(collectionName);
      const queries = [];

      if (uid) {
        queries.push(ref.where('ownerUid', '==', uid).limit(1));
        queries.push(ref.where('uid', '==', uid).limit(1));
        queries.push(ref.where('id', '==', uid).limit(1));
      }
      if (emailLc) {
        queries.push(ref.where('contactEmail', '==', emailLc).limit(1));
        queries.push(ref.where('email', '==', emailLc).limit(1));
      }

      for (const q of queries) {
        try {
          const snapshot = await q.get();
          const match = await matchDoc(snapshot);
          if (match) return match;
        } catch (err) {
          console.warn(`[FirestoreDataStore] vendor profile lookup failed (${collectionName})`, err?.message || err);
        }
      }
    }

    return null;
  }

  /**
   * Fallback to file-based system if Firestore fails
   */
  loadFromFile() {
    try {
      const appDataPath = path.resolve(__dirname, '../appData.json');
      
      if (!fs.existsSync(appDataPath)) {
        // Try src fallback
        const srcPath = path.resolve(__dirname, '../../src/data/appData.json');
        if (fs.existsSync(srcPath)) {
          const text = fs.readFileSync(srcPath, 'utf-8');
          return JSON.parse(text);
        }
        throw new Error('No appData.json file found');
      }

      const text = fs.readFileSync(appDataPath, 'utf-8');
      return JSON.parse(text);
      
    } catch (error) {
      console.error('❌ Failed to load from file:', error);
      throw error;
    }
  }

  /**
   * Get data (with caching)
   */
  async getData(forceReload = false) {
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (!forceReload && this.cache && (now - this.lastLoaded) < this.TTL_MS) {
      return this.cache;
    }

    try {
      let data;

      if (this.initialized) {
        // Try Firestore first
        console.log('📡 Loading data from Firestore...');
        data = await this.loadFromFirestore();
      } else {
        // Fall back to file system
        console.log('📄 Firestore unavailable, loading from file...');
        data = this.loadFromFile();
      }

      // Update cache
      this.cache = data;
      this.lastLoaded = now;
      
      return data;

    } catch (error) {
      console.error('❌ getData failed:', error);
      
      // Ultimate fallback - try file if Firestore failed
      if (this.initialized) {
        console.log('📄 Firestore failed, trying file fallback...');
        try {
          const fileData = this.loadFromFile();
          this.cache = fileData;
          this.lastLoaded = now;
          return fileData;
        } catch (fileError) {
          console.error('❌ File fallback also failed:', fileError);
        }
      }
      
      // Return empty data structure as last resort
      return {
        bookings: [], cohorts: [], events: [], forumThreads: [], jobs: [],
        mentorshipSessions: [], messageThreads: [], services: [], leads: [],
        startups: [], vendors: [], companies: [], profiles: [], users: [],
        tenants: [], subscriptions: [], wallets: []
      };
    }
  }

  /**
   * Save data
   */
  async saveData(data) {
      try {
        // Debug log for incoming data
        console.log('saveData received:', data);
        // Accept arrays and objects, but not null/undefined/primitives
        const isValid = (typeof data === 'object' && data !== null);
        if (!isValid) {
          throw new Error('Invalid data parameter: must be a non-null object or array');
        }

        if (this.initialized) {
          // Save to Firestore
          console.log('💾 Saving data to Firestore...');
          await this.saveToFirestore(data);
        }

        // Update cache
        this.cache = data;
        this.lastLoaded = Date.now();
      
        console.log('✅ Data saved successfully');

      } catch (error) {
        console.error('❌ saveData failed:', error);
        throw error;
      }
  }
}

// Create singleton instance
const firestoreDataStore = new FirestoreDataStore();

// Export functions with same interface as original dataStore
export async function getData(forceReload = false) {
  return await firestoreDataStore.getData(forceReload);
}

export async function saveData(data) {
  return await firestoreDataStore.saveData(data);
}

export default firestoreDataStore;
