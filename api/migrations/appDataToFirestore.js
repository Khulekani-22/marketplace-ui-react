/**
 * Full AppData to Firestore Migration Script
 * Migrates all data from backend/appData.json to Firebase Firestore
 * 
 * Collections to migrate:
 * - bookings, cohorts, events, forumThreads, jobs, mentorshipSessions
 * - messageThreads, services, leads, startups, vendors, companies
 * - profiles, users, tenants, subscriptions, wallets
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class AppDataMigration {
  constructor() {
    this.db = null;
    this.migrationResults = {};
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    try {
      // Check if Firebase Admin is already initialized
      if (!admin.apps.length) {
        // Look for service account key
        const serviceAccountPaths = [
          path.join(__dirname, '../../serviceAccountKey.json'),
          path.join(__dirname, '../../secrets/sloane-hub-service-account.json'),
          path.join(process.cwd(), 'serviceAccountKey.json'),
          path.join(__dirname, '../serviceAccountKey.json')
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
          throw new Error('Firebase service account key not found');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountKey),
          projectId: serviceAccountKey.project_id
        });

        console.log(`🚀 Firebase Admin initialized for project: ${serviceAccountKey.project_id}`);
      }

      this.db = admin.firestore();
      console.log('✅ Migration service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize migration service:', error);
      throw error;
    }
  }

  /**
   * Load appData.json
   */
  loadAppData() {
    try {
      const appDataPath = path.join(__dirname, '../../backend/appData.json');
      if (!fs.existsSync(appDataPath)) {
        throw new Error('appData.json not found at ' + appDataPath);
      }

      const rawData = fs.readFileSync(appDataPath, 'utf8');
      const appData = JSON.parse(rawData);
      
      console.log('📂 AppData loaded successfully');
      console.log('📊 Collections found:');
      for (const [key, value] of Object.entries(appData)) {
        const count = Array.isArray(value) ? value.length : 'object';
        console.log(`   • ${key}: ${count} items`);
      }

      return appData;
    } catch (error) {
      console.error('❌ Failed to load appData.json:', error);
      throw error;
    }
  }

  /**
   * Migrate a single collection
   */
  async migrateCollection(collectionName, data, options = {}) {
    try {
      console.log(`\n🚀 Migrating ${collectionName}...`);
      
      if (!Array.isArray(data) && typeof data !== 'object') {
        console.log(`⚠️  Skipping ${collectionName} - not a valid collection`);
        return { success: false, reason: 'Invalid data type' };
      }

      // Handle array collections (most common)
      if (Array.isArray(data)) {
        let successCount = 0;
        let errorCount = 0;

        for (const item of data) {
          try {
            // Determine document ID
            let docId = item.id || item.userId || item._id;
            if (!docId) {
              docId = this.db.collection(collectionName).doc().id; // Auto-generate ID
            }

            // Special handling for wallets collection
            if (collectionName === 'wallets') {
              await this.migrateWallet(item);
            } else {
              // Clean the item (remove undefined values)
              const cleanItem = this.cleanObject(item);
              
              // Add migration metadata
              cleanItem._migrated = {
                timestamp: new Date().toISOString(),
                source: 'appData.json'
              };

              await this.db.collection(collectionName).doc(docId.toString()).set(cleanItem);
            }
            
            successCount++;
          } catch (itemError) {
            console.error(`  ❌ Failed to migrate item in ${collectionName}:`, itemError);
            errorCount++;
          }
        }

        this.migrationResults[collectionName] = {
          success: true,
          total: data.length,
          successful: successCount,
          failed: errorCount
        };

        console.log(`✅ ${collectionName}: ${successCount}/${data.length} items migrated successfully`);
        if (errorCount > 0) {
          console.log(`⚠️  ${collectionName}: ${errorCount} items failed`);
        }

      } else {
        // Handle object collections (like _meta)
        const cleanData = this.cleanObject(data);
        cleanData._migrated = {
          timestamp: new Date().toISOString(),
          source: 'appData.json'
        };

        await this.db.collection('_metadata').doc(collectionName).set(cleanData);
        
        this.migrationResults[collectionName] = {
          success: true,
          total: 1,
          successful: 1,
          failed: 0
        };

        console.log(`✅ ${collectionName}: Metadata migrated successfully`);
      }

      return this.migrationResults[collectionName];

    } catch (error) {
      console.error(`❌ Failed to migrate collection ${collectionName}:`, error);
      this.migrationResults[collectionName] = {
        success: false,
        error: error.message
      };
      return this.migrationResults[collectionName];
    }
  }

  /**
   * Special handling for wallet migration with transactions as subcollections
   */
  async migrateWallet(wallet) {
    try {
      const { transactions, ...walletDoc } = wallet;
      const userId = wallet.userId;

      // Clean wallet document
      const cleanWallet = this.cleanObject(walletDoc);
      cleanWallet._migrated = {
        timestamp: new Date().toISOString(),
        source: 'appData.json'
      };

      // Save wallet document
      await this.db.collection('wallets').doc(userId).set(cleanWallet);

      // Save transactions as subcollection
      if (transactions && Array.isArray(transactions)) {
        for (const transaction of transactions) {
          const cleanTransaction = this.cleanObject(transaction);
          cleanTransaction._migrated = {
            timestamp: new Date().toISOString(),
            source: 'appData.json'
          };

          await this.db
            .collection('wallets')
            .doc(userId)
            .collection('transactions')
            .doc(transaction.id)
            .set(cleanTransaction);
        }

        console.log(`  💳 Wallet ${userId}: ${transactions.length} transactions migrated`);
      }

    } catch (error) {
      console.error('❌ Error migrating wallet:', error);
      throw error;
    }
  }

  /**
   * Clean object by removing undefined values and functions
   */
  cleanObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.cleanObject(item));

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && typeof value !== 'function') {
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = this.cleanObject(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }

  /**
   * Run full migration
   */
  async runFullMigration() {
    try {
      console.log('🏁 Starting full appData migration to Firestore...\n');
      
      const appData = this.loadAppData();
      const collections = Object.entries(appData);
      
      console.log(`📋 Found ${collections.length} collections to migrate\n`);

      // Migrate each collection
      for (const [collectionName, collectionData] of collections) {
        await this.migrateCollection(collectionName, collectionData);
        
        // Small delay to avoid overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Print final summary
      this.printMigrationSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Print migration summary
   */
  printMigrationSummary() {
    console.log('\n🎉 Migration Complete! Summary:');
    console.log('=' .repeat(50));

    let totalSuccess = 0;
    let totalFailed = 0;

    for (const [collection, result] of Object.entries(this.migrationResults)) {
      if (result.success) {
        console.log(`✅ ${collection.padEnd(20)} ${result.successful}/${result.total} items`);
        totalSuccess += result.successful || 0;
        totalFailed += result.failed || 0;
      } else {
        console.log(`❌ ${collection.padEnd(20)} FAILED: ${result.error}`);
        totalFailed++;
      }
    }

    console.log('=' .repeat(50));
    console.log(`📊 Total: ${totalSuccess} successful, ${totalFailed} failed`);
    console.log(`🔥 Firestore now contains all your appData!`);
  }

  /**
   * Verify migration by checking document counts
   */
  async verifyMigration() {
    try {
      console.log('\n🔍 Verifying migration...');
      
      const collections = ['bookings', 'cohorts', 'events', 'forumThreads', 'jobs', 
                          'mentorshipSessions', 'messageThreads', 'services', 'leads', 
                          'startups', 'vendors', 'companies', 'profiles', 'users', 
                          'tenants', 'subscriptions', 'wallets'];

      for (const collectionName of collections) {
        try {
          const snapshot = await this.db.collection(collectionName).get();
          console.log(`✅ ${collectionName.padEnd(20)} ${snapshot.size} documents`);
        } catch (error) {
          console.log(`❌ ${collectionName.padEnd(20)} Error: ${error.message}`);
        }
      }

      // Check wallet transactions
      const walletsSnapshot = await this.db.collection('wallets').get();
      for (const walletDoc of walletsSnapshot.docs) {
        const transactionsSnapshot = await walletDoc.ref.collection('transactions').get();
        console.log(`💳 Wallet ${walletDoc.id.padEnd(15)} ${transactionsSnapshot.size} transactions`);
      }

    } catch (error) {
      console.error('❌ Verification failed:', error);
    }
  }
}

// Export for use as module or run directly
if (require.main === module) {
  // Run migration if script is executed directly
  (async () => {
    try {
      const migration = new AppDataMigration();
      await migration.runFullMigration();
      await migration.verifyMigration();
      
      console.log('\n🎊 All done! Your data is now in Firestore.');
      process.exit(0);
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = AppDataMigration;