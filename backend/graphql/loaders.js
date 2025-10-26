// backend/graphql/loaders.js
import DataLoader from 'dataloader';
import admin from '../config/firebase.js';

const db = admin.firestore();

// Batch load function helper
async function batchLoadByIds(collection, ids) {
  const uniqueIds = [...new Set(ids)];
  const results = await Promise.all(
    uniqueIds.map(id => db.collection(collection).doc(id).get())
  );

  const dataMap = {};
  results.forEach((doc, index) => {
    if (doc.exists) {
      dataMap[uniqueIds[index]] = { id: doc.id, ...doc.data() };
    } else {
      dataMap[uniqueIds[index]] = null;
    }
  });

  // Return in the same order as requested ids
  return ids.map(id => dataMap[id]);
}

async function batchLoadByField(collection, field, values) {
  const uniqueValues = [...new Set(values)];
  
  // Firestore 'in' query limitation: max 10 items
  const chunks = [];
  for (let i = 0; i < uniqueValues.length; i += 10) {
    chunks.push(uniqueValues.slice(i, i + 10));
  }

  const allDocs = [];
  for (const chunk of chunks) {
    const snapshot = await db.collection(collection)
      .where(field, 'in', chunk)
      .get();
    allDocs.push(...snapshot.docs);
  }

  const dataMap = {};
  allDocs.forEach(doc => {
    const value = doc.data()[field];
    if (!dataMap[value]) {
      dataMap[value] = [];
    }
    dataMap[value].push({ id: doc.id, ...doc.data() });
  });

  // Return arrays in the same order as requested values
  return values.map(value => dataMap[value] || []);
}

export function createLoaders() {
  return {
    // ============================================
    // USER LOADERS
    // ============================================
    userLoader: new DataLoader(async (userIds) => {
      return batchLoadByIds('users', userIds);
    }),

    userByIdLoader: new DataLoader(async (ids) => {
      return batchLoadByIds('users', ids);
    }),

    // ============================================
    // VENDOR LOADERS
    // ============================================
    vendorLoader: new DataLoader(async (vendorIds) => {
      return batchLoadByIds('vendors', vendorIds);
    }),

    vendorsByUserIdLoader: new DataLoader(async (userIds) => {
      return batchLoadByField('vendors', 'userId', userIds);
    }),

    // ============================================
    // SERVICE LOADERS
    // ============================================
    serviceLoader: new DataLoader(async (serviceIds) => {
      return batchLoadByIds('services', serviceIds);
    }),

    servicesByVendorIdLoader: new DataLoader(async (vendorIds) => {
      return batchLoadByField('services', 'vendorId', vendorIds);
    }),

    // ============================================
    // SUBSCRIPTION LOADERS
    // ============================================
    subscriptionLoader: new DataLoader(async (subscriptionIds) => {
      return batchLoadByIds('subscriptions', subscriptionIds);
    }),

    subscriptionsByUserIdLoader: new DataLoader(async (userIds) => {
      return batchLoadByField('subscriptions', 'userId', userIds);
    }),

    subscriptionsByServiceIdLoader: new DataLoader(async (serviceIds) => {
      return batchLoadByField('subscriptions', 'serviceId', serviceIds);
    }),

    subscriptionsByVendorIdLoader: new DataLoader(async (vendorIds) => {
      return batchLoadByField('subscriptions', 'vendorId', vendorIds);
    }),

    // ============================================
    // MESSAGE LOADERS
    // ============================================
    messageLoader: new DataLoader(async (messageIds) => {
      return batchLoadByIds('messages', messageIds);
    }),

    messagesBySenderIdLoader: new DataLoader(async (senderIds) => {
      return batchLoadByField('messages', 'senderId', senderIds);
    }),

    messagesByRecipientIdLoader: new DataLoader(async (recipientIds) => {
      return batchLoadByField('messages', 'recipientId', recipientIds);
    }),

    messagesByConversationIdLoader: new DataLoader(async (conversationIds) => {
      return batchLoadByField('messages', 'conversationId', conversationIds);
    }),

    // ============================================
    // WALLET LOADERS
    // ============================================
    walletLoader: new DataLoader(async (userIds) => {
      const walletArrays = await batchLoadByField('wallets', 'userId', userIds);
      // Return first wallet for each userId (users should have one wallet)
      return walletArrays.map(wallets => wallets.length > 0 ? wallets[0] : null);
    }),

    walletByIdLoader: new DataLoader(async (walletIds) => {
      return batchLoadByIds('wallets', walletIds);
    }),

    // ============================================
    // TRANSACTION LOADERS
    // ============================================
    transactionLoader: new DataLoader(async (transactionIds) => {
      return batchLoadByIds('transactions', transactionIds);
    }),

    transactionsByWalletIdLoader: new DataLoader(async (walletIds) => {
      return batchLoadByField('transactions', 'walletId', walletIds);
    }),
  };
}

// Clear all loaders (useful for testing or long-lived connections)
export function clearLoaders(loaders) {
  Object.values(loaders).forEach(loader => {
    if (loader && typeof loader.clearAll === 'function') {
      loader.clearAll();
    }
  });
}
