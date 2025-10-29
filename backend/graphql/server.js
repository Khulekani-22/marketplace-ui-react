// backend/graphql/server.js
import { ApolloServer } from 'apollo-server-express';
import { WebSocketServer } from 'ws';
import { makeServer } from 'graphql-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { createLoaders } from './loaders.js';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { loadFirebaseServiceAccount } from '../utils/loadFirebaseServiceAccount.js';

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Context function for Apollo Server
async function getContext({ req, connection }) {
  // WebSocket connection (for subscriptions)
  if (connection) {
    return {
      ...connection.context,
      loaders: createLoaders(),
    };
  }

  // HTTP request (for queries and mutations)
  const context = {
    loaders: createLoaders(),
    user: null,
  };

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Initialize Firebase Admin if needed
      if (!getApps().length) {
        const serviceAccount = loadFirebaseServiceAccount();
        if (serviceAccount) {
          initializeApp({
            credential: cert({
              projectId: serviceAccount.projectId,
              clientEmail: serviceAccount.clientEmail,
              privateKey: serviceAccount.privateKey,
            }),
          });
        } else {
          initializeApp();
        }
      } else {
        getApp();
      }
      
      // Verify Firebase ID token
      const decodedToken = await getAuth().verifyIdToken(token);
      context.user = decodedToken;
    }
  } catch (error) {
    console.error('Auth error in GraphQL context:', error);
    // Don't throw - allow public queries
  }

  return context;
}

// Create Apollo Server instance
export const apolloServer = new ApolloServer({
  schema,
  context: getContext,
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      path: error.path,
    };
  },
  plugins: [
    // Add custom plugins for logging, monitoring, etc.
    {
      async requestDidStart() {
        return {
          async didEncounterErrors(requestContext) {
            console.error('GraphQL Request Errors:', requestContext.errors);
          },
        };
      },
    },
  ],
  introspection: true, // Enable in development, disable in production
  playground: true, // Enable GraphQL Playground in development
});

// Setup WebSocket server for subscriptions
export function setupWebSocketServer(httpServer) {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  makeServer(
    {
      schema,
      context: async (ctx) => {
        // Extract token from connection params
        const token = ctx.connectionParams?.authorization?.substring(7);
        let user = null;

        if (token) {
          try {
            const decodedToken = await getAuth().verifyIdToken(token);
            user = decodedToken;
          } catch (error) {
            console.error('WebSocket auth error:', error);
          }
        }

        return {
          user,
          loaders: createLoaders(),
        };
      },
      onConnect: (ctx) => {
        console.log('WebSocket client connected');
      },
      onDisconnect: (ctx) => {
        console.log('WebSocket client disconnected');
      },
    },
    wsServer
  );

  return wsServer;
}

export default apolloServer;
