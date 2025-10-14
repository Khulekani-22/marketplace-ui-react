import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        this.initialized = true;
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

  /**
   * Fallback to file-based system if Firestore fails
   */
  loadFromFile() {
    try {
      const appDataPath = path.resolve(process.cwd(), 'backend', 'appData.json');
      
      if (!fs.existsSync(appDataPath)) {
        // Try src fallback
        const srcPath = path.resolve(process.cwd(), 'src', 'data', 'appData.json');
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
      // Validate data parameter
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data parameter: must be an object');
      }

      if (this.initialized) {
        // Save to Firestore
        console.log('💾 Saving data to Firestore...');
        await this.saveToFirestore(data);
      }

      // Also save to file as backup
      console.log('💾 Saving backup to file...');
      const appDataPath = path.resolve(process.cwd(), 'backend', 'appData.json');
      const text = JSON.stringify(data, null, 2);
      fs.writeFileSync(appDataPath + '.tmp', text);
      fs.renameSync(appDataPath + '.tmp', appDataPath);

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
