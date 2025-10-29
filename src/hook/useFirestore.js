import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Custom hook for Firestore operations
 * Provides real-time data, loading states, and CRUD operations
 */
export function useFirestore(collectionName, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Build query based on options
  const firestoreQuery = useMemo(() => {
    let q = collection(db, collectionName);
    
    if (options.where) {
      q = query(q, where(options.where.field, options.where.operator, options.where.value));
    }
    
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
    }
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    return q;
  }, [collectionName, options.where, options.orderBy, options.limit]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      firestoreQuery,
      (snapshot) => {
        const documents = [];
        snapshot.forEach((doc) => {
          documents.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setData(documents);
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, firestoreQuery]);

  // CRUD operations
  const add = async (newData) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...newData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (err) {
      console.error(`Error adding document to ${collectionName}:`, err);
      throw err;
    }
  };

  const update = async (id, updates) => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error(`Error updating document in ${collectionName}:`, err);
      throw err;
    }
  };

  const remove = async (id) => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`Error deleting document from ${collectionName}:`, err);
      throw err;
    }
  };

  const getById = async (id) => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (err) {
      console.error(`Error fetching document from ${collectionName}:`, err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    getById,
    refetch: () => {
      setLoading(true);
      // The onSnapshot will automatically update
    }
  };
}

/**
 * Hook for a single document
 */
export function useFirestoreDoc(collectionName, docId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(db, collectionName, docId);
    
    // Set up real-time listener for single document
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({
            id: docSnap.id,
            ...docSnap.data()
          });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching document ${docId} from ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  const update = async (updates) => {
    if (!docId) throw new Error('No document ID provided');
    
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error(`Error updating document ${docId} in ${collectionName}:`, err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    update
  };
}

/**
 * Hook for services with additional functionality
 */
export function useServices(options = {}) {
  const {
    data: services,
    loading,
    error,
    add,
    update,
    remove,
    getById
  } = useFirestore('services', {
    orderBy: { field: 'createdAt', direction: 'desc' },
    ...options
  });

  // Filter services by category, search, etc.
  const filteredServices = useMemo(() => {
    let filtered = services;

    if (options.category) {
      filtered = filtered.filter(service => 
        service.category?.toLowerCase() === options.category.toLowerCase()
      );
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(service => 
        service.name?.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower) ||
        service.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [services, options.category, options.search]);

  return {
    services: filteredServices,
    allServices: services,
    loading,
    error,
    add,
    update,
    remove,
    getById
  };
}

/**
 * Hook for wallet operations
 */
export function useWallet(userId) {
  const {
    data,
    loading,
    error,
    update
  } = useFirestoreDoc('wallets', userId);

  const addTransaction = async (transaction) => {
    if (!userId) throw new Error('User ID required for wallet operations');

    try {
      // Add transaction to wallet subcollection
      const walletRef = doc(db, 'wallets', userId);
      const transactionRef = collection(walletRef, 'transactions');
      
      await addDoc(transactionRef, {
        ...transaction,
        createdAt: new Date(),
        userId
      });

      // Update wallet balance if this is a credits transaction
      if (transaction.type === 'credit' || transaction.type === 'debit') {
        const currentBalance = data?.balance || 0;
        const amount = parseFloat(transaction.amount) || 0;
        const newBalance = transaction.type === 'credit' 
          ? currentBalance + amount 
          : currentBalance - amount;

        await update({ 
          balance: Math.max(0, newBalance), // Prevent negative balance
          lastTransaction: new Date()
        });
      }
    } catch (err) {
      console.error('Error adding wallet transaction:', err);
      throw err;
    }
  };

  return {
    wallet: data,
    loading,
    error,
    addTransaction,
    updateWallet: update
  };
}