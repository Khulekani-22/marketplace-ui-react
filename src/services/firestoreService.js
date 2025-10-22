import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Firestore Service for Frontend
 * Provides methods to interact with Firestore collections
 */
class FirestoreService {
  /**
   * Get all documents from a collection
   */
  async getCollection(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return documents;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error fetching document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Query documents with conditions
   */
  async queryCollection(collectionName, conditions = [], orderByField = null, limitCount = null) {
    try {
      let q = collection(db, collectionName);

      // Add where conditions
      conditions.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });

      // Add ordering
      if (orderByField) {
        const { field, direction = 'asc' } = orderByField;
        q = query(q, orderBy(field, direction));
      }

      // Add limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return documents;
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Add a new document
   */
  async addDocument(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return {
        id: docRef.id,
        ...data
      };
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      
      return {
        id: docId,
        ...data
      };
    } catch (error) {
      console.error(`Error updating document ${docId} in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get services with server-side filtering and cursor-friendly pagination.
   * Falls back to limited client filtering for free-text search while avoiding
   * reading the entire collection. Returns `hasMore` and `nextCursor` so callers
   * can request additional batches without repeating the initial work.
   */
  async getServices({ 
    category = null,
    vendor = null,
    minPrice = null,
    maxPrice = null,
    featured = null,
    search = null,
    tenantId = null,
    page = 1,
    pageSize = 20,
    cursor = null,
    sortBy = null,
    includeTotal = true
  } = {}) {
    try {
      const servicesRef = collection(db, 'services');
      const whereConstraints = [];

      if (category) {
        whereConstraints.push(where('category', '==', category));
      }

      if (vendor) {
        whereConstraints.push(where('vendor', '==', vendor));
      }

      if (tenantId) {
        const tenantFilter = tenantId === 'vendor' ? 'public' : tenantId;
        whereConstraints.push(where('tenantId', '==', tenantFilter));
      }

      if (featured !== null) {
        whereConstraints.push(where('featured', '==', Boolean(featured)));
      }

      const numericMin = minPrice !== null ? Number(minPrice) : null;
      const numericMax = maxPrice !== null ? Number(maxPrice) : null;
      const usePriceRange = numericMin !== null || numericMax !== null;

      if (numericMin !== null) {
        whereConstraints.push(where('price', '>=', numericMin));
      }

      if (numericMax !== null) {
        whereConstraints.push(where('price', '<=', numericMax));
      }

      const defaultSortField = usePriceRange ? 'price' : 'createdAt';
      const sortField = usePriceRange ? 'price' : (sortBy?.field || defaultSortField);
      const sortDirection = sortBy?.direction || (usePriceRange ? 'asc' : 'desc');
      const normalizedDirection = sortDirection === 'asc' ? 'asc' : 'desc';
      const orderConstraints = [orderBy(sortField, normalizedDirection)];

      const normalizedPageSize = Math.max(1, Number(pageSize) || 20);
      const normalizedPage = Math.max(1, Number(page) || 1);
      const fetchLimit = normalizedPageSize + 1;
      const MAX_BATCHES = 10; // Prevent unbounded scans

      const searchTerm = typeof search === 'string' && search.trim()
        ? search.trim().toLowerCase()
        : null;

      const skipOffset = cursor ? 0 : (normalizedPage - 1) * normalizedPageSize;
      const targetMatchCount = skipOffset + normalizedPageSize;

      let cursorSnapshot = null;
      if (cursor) {
        if (typeof cursor === 'object' && cursor.id) {
          cursorSnapshot = cursor;
        } else if (typeof cursor === 'string') {
          const existing = await getDoc(doc(db, 'services', cursor));
          if (existing.exists()) {
            cursorSnapshot = existing;
          } else {
            console.warn(`[FirestoreService] Invalid cursor received: ${cursor}`);
          }
        }
      }

      const countPromise = includeTotal && !searchTerm
        ? getCountFromServer(query(servicesRef, ...whereConstraints)).catch((err) => {
            console.warn('[FirestoreService] Count query failed', err);
            return null;
          })
        : null;

      const matchingDocs = [];
      let lastProcessedDoc = cursorSnapshot;
      let batches = 0;
      let sawMoreDocs = false;
      let currentCursor = cursorSnapshot;

      while (matchingDocs.length < targetMatchCount && batches < MAX_BATCHES) {
        batches += 1;
        const constraints = [...whereConstraints, ...orderConstraints];
        if (currentCursor) {
          constraints.push(startAfter(currentCursor));
        }
        constraints.push(limit(fetchLimit));

        const snapshot = await getDocs(query(servicesRef, ...constraints));
        if (snapshot.empty) {
          break;
        }

        const docs = snapshot.docs;
        const hasMoreInBatch = docs.length === fetchLimit;
        sawMoreDocs = sawMoreDocs || hasMoreInBatch;

        docs.forEach((docSnap) => {
          const data = {
            id: docSnap.id,
            ...docSnap.data()
          };

          if (searchTerm) {
            const haystack = [data.title, data.description, data.vendor, data.category]
              .filter(Boolean)
              .map((val) => String(val).toLowerCase());
            const match = haystack.some((entry) => entry.includes(searchTerm));
            if (!match) {
              return;
            }
          }

          matchingDocs.push({ doc: docSnap, data });
        });

        lastProcessedDoc = docs[docs.length - 1];
        currentCursor = lastProcessedDoc;

        if (!hasMoreInBatch) {
          break;
        }
      }

      if (matchingDocs.length > targetMatchCount) {
        sawMoreDocs = true;
      }

      if (batches >= MAX_BATCHES && currentCursor) {
        sawMoreDocs = true;
      }

      const pageDocs = matchingDocs.slice(skipOffset, skipOffset + normalizedPageSize);

      const lastReturnedDoc = pageDocs.length ? pageDocs[pageDocs.length - 1].doc : lastProcessedDoc;
      const hasMore = Boolean(
        (matchingDocs.length > skipOffset + normalizedPageSize) ||
        (sawMoreDocs && lastProcessedDoc)
      );
      const nextCursorValue = hasMore && lastReturnedDoc ? lastReturnedDoc.id : null;

      let total = pageDocs.length;
      if (countPromise) {
        const countSnapshot = await countPromise;
        if (countSnapshot) {
          const aggregateData = countSnapshot.data();
          if (aggregateData && typeof aggregateData.count === 'number') {
            total = aggregateData.count;
          }
        }
      }

      return {
        page: normalizedPage,
        pageSize: normalizedPageSize,
        total,
        items: pageDocs.map((entry) => entry.data),
        hasMore,
        nextCursor: nextCursorValue
      };
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  /**
   * Get user's services (for vendors)
   */
  async getUserServices(userId, userEmail) {
    try {
      const conditions = [];
      
      if (userId) {
        conditions.push({ field: 'ownerUid', operator: '==', value: userId });
      } else if (userEmail) {
        conditions.push({ field: 'contactEmail', operator: '==', value: userEmail });
      }

      return await this.queryCollection('services', conditions);
    } catch (error) {
      console.error('Error fetching user services:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time updates for a collection
   */
  subscribeToCollection(collectionName, callback, conditions = []) {
    try {
      let q = collection(db, collectionName);

      // Add where conditions
      conditions.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });

      return onSnapshot(q, (querySnapshot) => {
        const documents = [];
        querySnapshot.forEach((doc) => {
          documents.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(documents);
      });
    } catch (error) {
      console.error(`Error subscribing to ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async batchWrite(operations) {
    try {
      const batch = writeBatch(db);

      operations.forEach(({ type, collectionName, docId, data }) => {
        const docRef = docId ? doc(db, collectionName, docId) : doc(collection(db, collectionName));

        switch (type) {
          case 'set':
            batch.set(docRef, { ...data, updatedAt: new Date() });
            break;
          case 'update':
            batch.update(docRef, { ...data, updatedAt: new Date() });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error in batch write:', error);
      throw error;
    }
  }

  /**
   * Get wallet with transactions
   */
  async getWalletWithTransactions(userId) {
    try {
      const wallet = await this.getDocument('wallets', userId);
      
      if (wallet) {
        // Get transactions subcollection
        const transactionsSnapshot = await getDocs(
          query(
            collection(db, 'wallets', userId, 'transactions'),
            orderBy('createdAt', 'desc')
          )
        );
        
        const transactions = [];
        transactionsSnapshot.forEach((doc) => {
          transactions.push({
            id: doc.id,
            ...doc.data()
          });
        });

        return {
          ...wallet,
          transactions
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching wallet with transactions:', error);
      throw error;
    }
  }

  /**
   * Add transaction to wallet
   */
  async addTransaction(userId, transactionData) {
    try {
      const transactionRef = await addDoc(
        collection(db, 'wallets', userId, 'transactions'),
        {
          ...transactionData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );

      return {
        id: transactionRef.id,
        ...transactionData
      };
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const firestoreService = new FirestoreService();
export default firestoreService;

// Also export individual methods for easier importing
export const {
  getCollection,
  getDocument,
  queryCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  getServices,
  getUserServices,
  subscribeToCollection,
  batchWrite,
  getWalletWithTransactions,
  addTransaction
} = firestoreService;
