// src/lib/apiClient.ts
// Consolidated API client that exports both the Axios instance and SDK-style functions

// Import from JS files - TypeScript will accept these at runtime
import { api } from './api.js';

export { api };
export { 
  getCurrentUser, 
  getLiveLmsData,
  getMySubscriptions,
  subscribeToService,
  unsubscribeFromService,
  UserResponse,
  GetCurrentUserParams,
  LmsData,
  LmsResponse,
  Subscription,
  UserResponseSchema,
  LmsDataSchema,
  LmsResponseSchema,
  SubscriptionSchema
} from './sdk';