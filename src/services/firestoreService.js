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
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.js';

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
   * Get services with filtering and pagination
   */
  async getServices({ 
    category = null, 
    vendor = null, 
    minPrice = null, 
    maxPrice = null, 
    featured = null,
    search = null,
    page = 1,
    pageSize = 20
  } = {}) {
    try {
      const conditions = [];

      if (category) {
        conditions.push({ field: 'category', operator: '==', value: category });
      }

      if (vendor) {
        conditions.push({ field: 'vendor', operator: '==', value: vendor });
      }

      if (featured !== null) {
        conditions.push({ field: 'featured', operator: '==', value: featured });
      }

      // Note: Firestore doesn't support range queries with other filters easily
      // For price filtering, we'll fetch all and filter client-side (not ideal for large datasets)
      let services = await this.queryCollection('services', conditions);

      // Client-side filtering for complex conditions
      if (minPrice !== null) {
        services = services.filter(s => Number(s.price) >= Number(minPrice));
      }

      if (maxPrice !== null) {
        services = services.filter(s => Number(s.price) <= Number(maxPrice));
      }

      if (search) {
        const searchLower = search.toLowerCase();
        services = services.filter(s => 
          s.title?.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.vendor?.toLowerCase().includes(searchLower)
        );
      }

      // Pagination
      const total = services.length;
      const start = (page - 1) * pageSize;
      const paginatedServices = services.slice(start, start + pageSize);

      return {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        items: paginatedServices
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