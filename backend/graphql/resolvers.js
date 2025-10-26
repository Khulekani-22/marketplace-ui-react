// backend/graphql/resolvers.js
import { GraphQLScalarType, Kind } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import admin from '../config/firebase.js';

const db = admin.firestore();
const pubsub = new PubSub();

// Custom scalar types
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date and time as ISO 8601 string',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON object',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return ast.value;
    }
    return null;
  },
});

// Cursor-based pagination helper
function encodeCursor(doc) {
  return Buffer.from(JSON.stringify({ id: doc.id, createdAt: doc.createdAt })).toString('base64');
}

function decodeCursor(cursor) {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

async function paginateQuery(queryRef, pagination = {}, createLoader) {
  const { limit = 20, cursor } = pagination;
  let query = queryRef.limit(limit + 1); // Fetch one extra to check hasNextPage

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.startAfter(decoded.createdAt);
    }
  }

  const snapshot = await query.get();
  const hasNextPage = snapshot.docs.length > limit;
  const docs = snapshot.docs.slice(0, limit);

  const edges = docs.map(doc => ({
    cursor: encodeCursor({ id: doc.id, createdAt: doc.data().createdAt }),
    node: createLoader ? createLoader(doc) : { id: doc.id, ...doc.data() }
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: !!cursor,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      totalCount: docs.length
    }
  };
}

// PubSub event names
const EVENTS = {
  SERVICE_CREATED: 'SERVICE_CREATED',
  SERVICE_UPDATED: 'SERVICE_UPDATED',
  SERVICE_DELETED: 'SERVICE_DELETED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  CONVERSATION_UPDATED: 'CONVERSATION_UPDATED',
  TRANSACTION_CREATED: 'TRANSACTION_CREATED',
  WALLET_UPDATED: 'WALLET_UPDATED',
  SUBSCRIPTION_STATUS_CHANGED: 'SUBSCRIPTION_STATUS_CHANGED',
};

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    // ============================================
    // SERVICES
    // ============================================
    async service(_, { id }, context) {
      const doc = await db.collection('services').doc(id).get();
      if (!doc.exists) {
        throw new Error('Service not found');
      }
      return { id: doc.id, ...doc.data() };
    },

    async services(_, { filter = {}, sort, pagination }, context) {
      let query = db.collection('services');

      // Apply filters
      if (filter.status) {
        query = query.where('status', '==', filter.status);
      }
      if (filter.vendorId) {
        query = query.where('vendorId', '==', filter.vendorId);
      }
      if (filter.categoryId) {
        query = query.where('category', '==', filter.categoryId);
      }
      if (filter.minPrice) {
        query = query.where('price', '>=', filter.minPrice);
      }
      if (filter.maxPrice) {
        query = query.where('price', '<=', filter.maxPrice);
      }

      // Apply sorting
      if (sort) {
        query = query.orderBy(sort.field, sort.order === 'ASC' ? 'asc' : 'desc');
      } else {
        query = query.orderBy('createdAt', 'desc');
      }

      return paginateQuery(query, pagination);
    },

    // ============================================
    // VENDORS
    // ============================================
    async vendor(_, { id }, context) {
      const doc = await db.collection('vendors').doc(id).get();
      if (!doc.exists) {
        throw new Error('Vendor not found');
      }
      return { id: doc.id, ...doc.data() };
    },

    async vendors(_, { filter = {}, pagination }, context) {
      let query = db.collection('vendors');

      if (filter.verified !== undefined) {
        query = query.where('verified', '==', filter.verified);
      }
      if (filter.minRating) {
        query = query.where('rating', '>=', filter.minRating);
      }
      if (filter.categoryId) {
        query = query.where('categories', 'array-contains', filter.categoryId);
      }

      query = query.orderBy('createdAt', 'desc');
      return paginateQuery(query, pagination);
    },

    // ============================================
    // USERS
    // ============================================
    async user(_, { id }, context) {
      const doc = await db.collection('users').doc(id).get();
      if (!doc.exists) {
        throw new Error('User not found');
      }
      return { id: doc.id, ...doc.data() };
    },

    async me(_, __, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      const doc = await db.collection('users').doc(context.user.uid).get();
      if (!doc.exists) {
        throw new Error('User not found');
      }
      return { id: doc.id, ...doc.data() };
    },

    // ============================================
    // SUBSCRIPTIONS
    // ============================================
    async subscription(_, { id }, context) {
      const doc = await db.collection('subscriptions').doc(id).get();
      if (!doc.exists) {
        throw new Error('Subscription not found');
      }
      return { id: doc.id, ...doc.data() };
    },

    async subscriptions(_, { filter = {}, pagination }, context) {
      let query = db.collection('subscriptions');

      if (filter.userId) {
        query = query.where('userId', '==', filter.userId);
      }
      if (filter.vendorId) {
        query = query.where('vendorId', '==', filter.vendorId);
      }
      if (filter.status) {
        query = query.where('status', '==', filter.status);
      }

      query = query.orderBy('createdAt', 'desc');
      return paginateQuery(query, pagination);
    },

    async mySubscriptions(_, { status, pagination }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      let query = db.collection('subscriptions').where('userId', '==', context.user.uid);

      if (status) {
        query = query.where('status', '==', status);
      }

      query = query.orderBy('createdAt', 'desc');
      return paginateQuery(query, pagination);
    },

    // ============================================
    // MESSAGES
    // ============================================
    async message(_, { id }, context) {
      const doc = await db.collection('messages').doc(id).get();
      if (!doc.exists) {
        throw new Error('Message not found');
      }
      return { id: doc.id, ...doc.data() };
    },

    async messages(_, { filter = {}, pagination }, context) {
      let query = db.collection('messages');

      if (filter.conversationId) {
        query = query.where('conversationId', '==', filter.conversationId);
      }
      if (filter.senderId) {
        query = query.where('senderId', '==', filter.senderId);
      }
      if (filter.recipientId) {
        query = query.where('recipientId', '==', filter.recipientId);
      }
      if (filter.status) {
        query = query.where('status', '==', filter.status);
      }
      if (filter.unreadOnly) {
        query = query.where('readAt', '==', null);
      }

      query = query.orderBy('createdAt', 'desc');
      return paginateQuery(query, pagination);
    },

    async myMessages(_, { unreadOnly, pagination }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      let query = db.collection('messages').where('recipientId', '==', context.user.uid);

      if (unreadOnly) {
        query = query.where('readAt', '==', null);
      }

      query = query.orderBy('createdAt', 'desc');
      return paginateQuery(query, pagination);
    },

    async conversation(_, { userId, pagination }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const conversationId = [context.user.uid, userId].sort().join('_');
      let query = db.collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc');

      return paginateQuery(query, pagination);
    },

    // ============================================
    // WALLET & TRANSACTIONS
    // ============================================
    async wallet(_, { id }, context) {
      const doc = await db.collection('wallets').doc(id).get();
      if (!doc.exists) {
        throw new Error('Wallet not found');
      }
      return { id: doc.id, ...doc.data() };
    },

    async wallets(_, { filter = {}, pagination }, context) {
      let query = db.collection('wallets');

      if (filter.userId) {
        query = query.where('userId', '==', filter.userId);
      }
      if (filter.minBalance) {
        query = query.where('balance', '>=', filter.minBalance);
      }
      if (filter.maxBalance) {
        query = query.where('balance', '<=', filter.maxBalance);
      }

      query = query.orderBy('createdAt', 'desc');
      return paginateQuery(query, pagination);
    },

    async myWallet(_, __, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const snapshot = await db.collection('wallets')
        .where('userId', '==', context.user.uid)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Create wallet if not exists
        const walletRef = db.collection('wallets').doc();
        const wallet = {
          userId: context.user.uid,
          balance: 0,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await walletRef.set(wallet);
        return { id: walletRef.id, ...wallet };
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    },

    async transaction(_, { id }, context) {
      const doc = await db.collection('transactions').doc(id).get();
      if (!doc.exists) {
        throw new Error('Transaction not found');
      }
      return { id: doc.id, ...doc.data() };
    },

    async transactions(_, { filter = {}, pagination }, context) {
      let query = db.collection('transactions');

      if (filter.walletId) {
        query = query.where('walletId', '==', filter.walletId);
      }
      if (filter.type) {
        query = query.where('type', '==', filter.type);
      }
      if (filter.status) {
        query = query.where('status', '==', filter.status);
      }
      if (filter.minAmount) {
        query = query.where('amount', '>=', filter.minAmount);
      }
      if (filter.maxAmount) {
        query = query.where('amount', '<=', filter.maxAmount);
      }

      query = query.orderBy('createdAt', 'desc');
      return paginateQuery(query, pagination);
    },

    async myTransactions(_, { type, status, pagination }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // First get user's wallet
      const walletSnapshot = await db.collection('wallets')
        .where('userId', '==', context.user.uid)
        .limit(1)
        .get();

      if (walletSnapshot.empty) {
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
            totalCount: 0
          }
        };
      }

      const walletId = walletSnapshot.docs[0].id;
      let query = db.collection('transactions').where('walletId', '==', walletId);

      if (type) {
        query = query.where('type', '==', type);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      query = query.orderBy('createdAt', 'desc');
      return paginateQuery(query, pagination);
    },
  },

  Mutation: {
    // ============================================
    // SERVICES
    // ============================================
    async createService(_, { input }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Get vendor for this user
      const vendorSnapshot = await db.collection('vendors')
        .where('userId', '==', context.user.uid)
        .limit(1)
        .get();

      if (vendorSnapshot.empty) {
        throw new Error('Vendor profile required to create services');
      }

      const vendorId = vendorSnapshot.docs[0].id;
      const serviceRef = db.collection('services').doc();
      const service = {
        ...input,
        vendorId,
        ratings: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await serviceRef.set(service);
      const result = { id: serviceRef.id, ...service };

      // Publish real-time event
      pubsub.publish(EVENTS.SERVICE_CREATED, { serviceCreated: result });

      return result;
    },

    async updateService(_, { id, input }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const serviceRef = db.collection('services').doc(id);
      const serviceDoc = await serviceRef.get();

      if (!serviceDoc.exists) {
        throw new Error('Service not found');
      }

      const service = serviceDoc.data();

      // Check ownership
      const vendorSnapshot = await db.collection('vendors')
        .where('userId', '==', context.user.uid)
        .limit(1)
        .get();

      if (vendorSnapshot.empty || vendorSnapshot.docs[0].id !== service.vendorId) {
        throw new Error('Unauthorized: You can only update your own services');
      }

      const updates = {
        ...input,
        updatedAt: new Date().toISOString()
      };

      await serviceRef.update(updates);
      const result = { id, ...service, ...updates };

      // Publish real-time event
      pubsub.publish(EVENTS.SERVICE_UPDATED, { serviceUpdated: result });

      return result;
    },

    async deleteService(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const serviceRef = db.collection('services').doc(id);
      const serviceDoc = await serviceRef.get();

      if (!serviceDoc.exists) {
        throw new Error('Service not found');
      }

      const service = serviceDoc.data();

      // Check ownership
      const vendorSnapshot = await db.collection('vendors')
        .where('userId', '==', context.user.uid)
        .limit(1)
        .get();

      if (vendorSnapshot.empty || vendorSnapshot.docs[0].id !== service.vendorId) {
        throw new Error('Unauthorized: You can only delete your own services');
      }

      await serviceRef.delete();

      // Publish real-time event
      pubsub.publish(EVENTS.SERVICE_DELETED, { serviceDeleted: id });

      return true;
    },

    // ============================================
    // SUBSCRIPTIONS
    // ============================================
    async createSubscription(_, { input }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const subscriptionRef = db.collection('subscriptions').doc();
      const subscription = {
        ...input,
        userId: context.user.uid,
        status: 'PENDING',
        autoRenew: false,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + input.duration * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await subscriptionRef.set(subscription);
      const result = { id: subscriptionRef.id, ...subscription };

      // Publish real-time event
      pubsub.publish(EVENTS.SUBSCRIPTION_STATUS_CHANGED, {
        subscriptionStatusChanged: result
      });

      return result;
    },

    async cancelSubscription(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const subscriptionRef = db.collection('subscriptions').doc(id);
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionDoc.data();

      if (subscription.userId !== context.user.uid) {
        throw new Error('Unauthorized: You can only cancel your own subscriptions');
      }

      const updates = {
        status: 'CANCELLED',
        autoRenew: false,
        updatedAt: new Date().toISOString()
      };

      await subscriptionRef.update(updates);
      const result = { id, ...subscription, ...updates };

      // Publish real-time event
      pubsub.publish(EVENTS.SUBSCRIPTION_STATUS_CHANGED, {
        subscriptionStatusChanged: result
      });

      return result;
    },

    async renewSubscription(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const subscriptionRef = db.collection('subscriptions').doc(id);
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionDoc.data();

      if (subscription.userId !== context.user.uid) {
        throw new Error('Unauthorized: You can only renew your own subscriptions');
      }

      const updates = {
        status: 'ACTIVE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updatedAt: new Date().toISOString()
      };

      await subscriptionRef.update(updates);
      const result = { id, ...subscription, ...updates };

      // Publish real-time event
      pubsub.publish(EVENTS.SUBSCRIPTION_STATUS_CHANGED, {
        subscriptionStatusChanged: result
      });

      return result;
    },

    // ============================================
    // MESSAGES
    // ============================================
    async sendMessage(_, { input }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const conversationId = [context.user.uid, input.recipientId].sort().join('_');
      const messageRef = db.collection('messages').doc();
      const message = {
        ...input,
        senderId: context.user.uid,
        conversationId,
        status: 'SENT',
        attachments: input.attachments || [],
        readAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await messageRef.set(message);
      const result = { id: messageRef.id, ...message };

      // Publish real-time events
      pubsub.publish(EVENTS.MESSAGE_RECEIVED, { messageReceived: result });
      pubsub.publish(EVENTS.CONVERSATION_UPDATED, { conversationUpdated: result });

      return result;
    },

    async markMessageAsRead(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const messageRef = db.collection('messages').doc(id);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      const message = messageDoc.data();

      if (message.recipientId !== context.user.uid) {
        throw new Error('Unauthorized: You can only mark your own messages as read');
      }

      const updates = {
        status: 'READ',
        readAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await messageRef.update(updates);
      return { id, ...message, ...updates };
    },

    async deleteMessage(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const messageRef = db.collection('messages').doc(id);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      const message = messageDoc.data();

      if (message.senderId !== context.user.uid && message.recipientId !== context.user.uid) {
        throw new Error('Unauthorized: You can only delete your own messages');
      }

      await messageRef.delete();
      return true;
    },

    // ============================================
    // WALLET & TRANSACTIONS
    // ============================================
    async createTransaction(_, { input }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const walletRef = db.collection('wallets').doc(input.walletId);
      const walletDoc = await walletRef.get();

      if (!walletDoc.exists) {
        throw new Error('Wallet not found');
      }

      const wallet = walletDoc.data();

      if (wallet.userId !== context.user.uid) {
        throw new Error('Unauthorized: You can only create transactions for your own wallet');
      }

      const transactionRef = db.collection('transactions').doc();
      const newBalance = input.type === 'CREDIT'
        ? wallet.balance + input.amount
        : wallet.balance - input.amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      const transaction = {
        ...input,
        balance: newBalance,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update wallet balance
      await walletRef.update({
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      await transactionRef.set(transaction);
      const result = { id: transactionRef.id, ...transaction };

      // Publish real-time events
      pubsub.publish(EVENTS.TRANSACTION_CREATED, { transactionCreated: result });
      pubsub.publish(EVENTS.WALLET_UPDATED, {
        walletUpdated: { id: input.walletId, ...wallet, balance: newBalance }
      });

      return result;
    },

    async creditWallet(_, { walletId, amount, description }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const walletRef = db.collection('wallets').doc(walletId);
      const walletDoc = await walletRef.get();

      if (!walletDoc.exists) {
        throw new Error('Wallet not found');
      }

      const wallet = walletDoc.data();

      if (wallet.userId !== context.user.uid) {
        throw new Error('Unauthorized');
      }

      const newBalance = wallet.balance + amount;

      await walletRef.update({
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      // Create transaction record
      const transactionRef = db.collection('transactions').doc();
      await transactionRef.set({
        walletId,
        type: 'CREDIT',
        amount,
        balance: newBalance,
        description: description || 'Wallet credit',
        status: 'COMPLETED',
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const result = { id: walletId, ...wallet, balance: newBalance };

      // Publish real-time event
      pubsub.publish(EVENTS.WALLET_UPDATED, { walletUpdated: result });

      return result;
    },

    async debitWallet(_, { walletId, amount, description }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const walletRef = db.collection('wallets').doc(walletId);
      const walletDoc = await walletRef.get();

      if (!walletDoc.exists) {
        throw new Error('Wallet not found');
      }

      const wallet = walletDoc.data();

      if (wallet.userId !== context.user.uid) {
        throw new Error('Unauthorized');
      }

      const newBalance = wallet.balance - amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      await walletRef.update({
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      // Create transaction record
      const transactionRef = db.collection('transactions').doc();
      await transactionRef.set({
        walletId,
        type: 'DEBIT',
        amount,
        balance: newBalance,
        description: description || 'Wallet debit',
        status: 'COMPLETED',
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const result = { id: walletId, ...wallet, balance: newBalance };

      // Publish real-time event
      pubsub.publish(EVENTS.WALLET_UPDATED, { walletUpdated: result });

      return result;
    },
  },

  Subscription: {
    // ============================================
    // REAL-TIME SUBSCRIPTIONS
    // ============================================
    serviceCreated: {
      subscribe: () => pubsub.asyncIterator([EVENTS.SERVICE_CREATED]),
    },

    serviceUpdated: {
      subscribe: (_, { id }) => {
        if (id) {
          return pubsub.asyncIterator([`${EVENTS.SERVICE_UPDATED}_${id}`]);
        }
        return pubsub.asyncIterator([EVENTS.SERVICE_UPDATED]);
      },
    },

    serviceDeleted: {
      subscribe: () => pubsub.asyncIterator([EVENTS.SERVICE_DELETED]),
    },

    messageReceived: {
      subscribe: (_, { userId }) => pubsub.asyncIterator([`${EVENTS.MESSAGE_RECEIVED}_${userId}`]),
    },

    conversationUpdated: {
      subscribe: (_, { conversationId }) =>
        pubsub.asyncIterator([`${EVENTS.CONVERSATION_UPDATED}_${conversationId}`]),
    },

    transactionCreated: {
      subscribe: (_, { walletId }) =>
        pubsub.asyncIterator([`${EVENTS.TRANSACTION_CREATED}_${walletId}`]),
    },

    walletUpdated: {
      subscribe: (_, { userId }) =>
        pubsub.asyncIterator([`${EVENTS.WALLET_UPDATED}_${userId}`]),
    },

    subscriptionStatusChanged: {
      subscribe: (_, { userId }) =>
        pubsub.asyncIterator([`${EVENTS.SUBSCRIPTION_STATUS_CHANGED}_${userId}`]),
    },
  },

  // ============================================
  // FIELD RESOLVERS (Nested queries)
  // ============================================
  Service: {
    async vendor(parent, _, context) {
      if (context.loaders) {
        return context.loaders.vendorLoader.load(parent.vendorId);
      }
      const doc = await db.collection('vendors').doc(parent.vendorId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async subscribers(parent, _, context) {
      const snapshot = await db.collection('subscriptions')
        .where('serviceId', '==', parent.id)
        .where('status', '==', 'ACTIVE')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  },

  Vendor: {
    async user(parent, _, context) {
      if (context.loaders) {
        return context.loaders.userLoader.load(parent.userId);
      }
      const doc = await db.collection('users').doc(parent.userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async services(parent, _, context) {
      const snapshot = await db.collection('services')
        .where('vendorId', '==', parent.id)
        .where('status', '==', 'ACTIVE')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async subscriptions(parent, _, context) {
      const snapshot = await db.collection('subscriptions')
        .where('vendorId', '==', parent.id)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  },

  User: {
    async subscriptions(parent, _, context) {
      const snapshot = await db.collection('subscriptions')
        .where('userId', '==', parent.uid)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async messages(parent, _, context) {
      const snapshot = await db.collection('messages')
        .where('recipientId', '==', parent.uid)
        .limit(20)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async wallet(parent, _, context) {
      if (context.loaders) {
        return context.loaders.walletLoader.load(parent.uid);
      }
      const snapshot = await db.collection('wallets')
        .where('userId', '==', parent.uid)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    },
  },

  Subscription: {
    async user(parent, _, context) {
      if (context.loaders) {
        return context.loaders.userByIdLoader.load(parent.userId);
      }
      const doc = await db.collection('users').doc(parent.userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async service(parent, _, context) {
      if (context.loaders) {
        return context.loaders.serviceLoader.load(parent.serviceId);
      }
      const doc = await db.collection('services').doc(parent.serviceId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async vendor(parent, _, context) {
      if (context.loaders) {
        return context.loaders.vendorLoader.load(parent.vendorId);
      }
      const doc = await db.collection('vendors').doc(parent.vendorId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
  },

  Message: {
    async sender(parent, _, context) {
      if (context.loaders) {
        return context.loaders.userByIdLoader.load(parent.senderId);
      }
      const doc = await db.collection('users').doc(parent.senderId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async recipient(parent, _, context) {
      if (context.loaders) {
        return context.loaders.userByIdLoader.load(parent.recipientId);
      }
      const doc = await db.collection('users').doc(parent.recipientId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
  },

  Wallet: {
    async user(parent, _, context) {
      if (context.loaders) {
        return context.loaders.userByIdLoader.load(parent.userId);
      }
      const doc = await db.collection('users').doc(parent.userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async transactions(parent, _, context) {
      const snapshot = await db.collection('transactions')
        .where('walletId', '==', parent.id)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  },

  Transaction: {
    async wallet(parent, _, context) {
      if (context.loaders) {
        return context.loaders.walletByIdLoader.load(parent.walletId);
      }
      const doc = await db.collection('wallets').doc(parent.walletId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
  },
};
