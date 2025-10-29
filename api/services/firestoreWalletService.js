/**
 * Firestore Wallet Service
 * Handles all wallet and transaction operations using Firebase Firestore
 * Replaces file-based appData.json persistence with proper database storage
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

class FirestoreWalletService {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initializeFirestore();
  }

  /**
   * Initialize Firebase Admin SDK and Firestore
   */
  initializeFirestore() {
    try {
      // Check if Firebase Admin is already initialized
      if (!admin.apps.length) {
        // Look for service account key in multiple locations
        const serviceAccountPaths = [
          path.join(__dirname, '../serviceAccountKey.json'),
          path.join(__dirname, '../secrets/sloane-hub-service-account.json'),
          path.join(process.cwd(), 'serviceAccountKey.json')
        ];

        let serviceAccountKey = null;
        for (const keyPath of serviceAccountPaths) {
          if (fs.existsSync(keyPath)) {
            serviceAccountKey = require(keyPath);
            console.log(`🔑 Firebase service account found at: ${keyPath}`);
            break;
          }
        }

        if (!serviceAccountKey) {
          throw new Error('Firebase service account key not found in any expected location');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountKey),
          projectId: serviceAccountKey.project_id
        });

        console.log(`🚀 Firebase Admin initialized for project: ${serviceAccountKey.project_id}`);
      }

      this.db = admin.firestore();
      this.initialized = true;
      console.log('✅ Firestore wallet service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Firestore:', error);
      throw error;
    }
  }

  /**
   * Ensure Firestore is initialized
   */
  ensureInitialized() {
    if (!this.initialized || !this.db) {
      throw new Error('Firestore wallet service not initialized');
    }
  }

  /**
   * Get wallet by user ID
   * @param {string} userId - Firebase user ID
   * @returns {Promise<Object|null>} Wallet object or null if not found
   */
  async getWallet(userId) {
    this.ensureInitialized();
    
    try {
      const walletDoc = await this.db.collection('wallets').doc(userId).get();
      
      if (!walletDoc.exists) {
        return null;
      }

      const walletData = walletDoc.data();
      
      // Get wallet transactions
      const transactionsSnapshot = await this.db
        .collection('wallets')
        .doc(userId)
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .get();

      const transactions = [];
      transactionsSnapshot.forEach(doc => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        id: walletDoc.id,
        ...walletData,
        transactions
      };

    } catch (error) {
      console.error('❌ Error getting wallet:', error);
      throw error;
    }
  }

  /**
   * Create or update wallet
   * @param {Object} walletData - Wallet data to save
   * @returns {Promise<Object>} Updated wallet data
   */
  async saveWallet(walletData) {
    this.ensureInitialized();
    
    try {
      const walletDoc = { ...walletData };
      delete walletDoc.transactions;

      // Save wallet document (without transactions)
      await this.db.collection('wallets').doc(walletData.userId).set({
        ...walletDoc,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log(`✅ Wallet saved for user: ${walletData.userId}`);
      return walletData;

    } catch (error) {
      console.error('❌ Error saving wallet:', error);
      throw error;
    }
  }

  /**
   * Add transaction to wallet
   * @param {string} userId - User ID
   * @param {Object} transaction - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async addTransaction(userId, transaction) {
    this.ensureInitialized();
    
    try {
      // Add transaction to subcollection
      const transactionRef = await this.db
        .collection('wallets')
        .doc(userId)
        .collection('transactions')
        .add({
          ...transaction,
          createdAt: new Date().toISOString()
        });

      const savedTransaction = {
        id: transactionRef.id,
        ...transaction,
        createdAt: new Date().toISOString()
      };

      // Update wallet balance and totals
      await this.updateWalletTotals(userId);

      console.log(`✅ Transaction added: ${transactionRef.id} for user: ${userId}`);
      return savedTransaction;

    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      throw error;
    }
  }

  /**
   * Update wallet balance and totals based on transactions
   * @param {string} userId - User ID
   */
  async updateWalletTotals(userId) {
    this.ensureInitialized();
    
    try {
      // Get all transactions
      const transactionsSnapshot = await this.db
        .collection('wallets')
        .doc(userId)
        .collection('transactions')
        .get();

      let balance = 0;
      let totalEarned = 0;
      let totalSpent = 0;

      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        if (transaction.type === 'credit') {
          balance += transaction.amount;
          totalEarned += transaction.amount;
        } else if (transaction.type === 'debit') {
          balance -= transaction.amount;
          totalSpent += transaction.amount;
        }
      });

      // Update wallet document with calculated totals
      await this.db.collection('wallets').doc(userId).update({
        balance,
        totalEarned,
        totalSpent,
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Wallet totals updated for user: ${userId} - Balance: ${balance}`);

    } catch (error) {
      console.error('❌ Error updating wallet totals:', error);
      throw error;
    }
  }

  /**
   * Get all wallets (admin function)
   * @returns {Promise<Array>} Array of all wallets
   */
  async getAllWallets() {
    this.ensureInitialized();
    
    try {
      const walletsSnapshot = await this.db.collection('wallets').get();
      const wallets = [];

      for (const walletDoc of walletsSnapshot.docs) {
        const walletData = walletDoc.data();
        
        // Get transactions for each wallet
        const transactionsSnapshot = await this.db
          .collection('wallets')
          .doc(walletDoc.id)
          .collection('transactions')
          .orderBy('createdAt', 'desc')
          .get();

        const transactions = [];
        transactionsSnapshot.forEach(doc => {
          transactions.push({
            id: doc.id,
            ...doc.data()
          });
        });

        wallets.push({
          id: walletDoc.id,
          ...walletData,
          transactions
        });
      }

      return wallets;

    } catch (error) {
      console.error('❌ Error getting all wallets:', error);
      throw error;
    }
  }

  /**
   * Import wallet data from appData.json format
   * @param {Array} walletsArray - Array of wallet data from appData.json
   */
  async importWallets(walletsArray) {
    this.ensureInitialized();
    
    try {
      console.log(`📥 Importing ${walletsArray.length} wallets to Firestore...`);

      for (const wallet of walletsArray) {
        const { transactions, ...walletDoc } = wallet;
        
        // Save wallet document
        await this.db.collection('wallets').doc(wallet.userId).set(walletDoc);
        
        // Save transactions
        if (transactions && transactions.length > 0) {
          for (const transaction of transactions) {
            await this.db
              .collection('wallets')
              .doc(wallet.userId)
              .collection('transactions')
              .doc(transaction.id)
              .set(transaction);
          }
        }

        console.log(`✅ Imported wallet for user: ${wallet.userId} with ${transactions?.length || 0} transactions`);
      }

      console.log('🎉 All wallets imported successfully!');

    } catch (error) {
      console.error('❌ Error importing wallets:', error);
      throw error;
    }
  }
}

module.exports = new FirestoreWalletService();