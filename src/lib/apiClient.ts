// src/lib/apiClient.ts
// Consolidated API client that exports both the Axios instance and SDK-style functions

export { api, getSession, bootstrapSession } from './api';
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