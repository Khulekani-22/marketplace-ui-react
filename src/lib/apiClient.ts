// src/lib/apiClient.ts
// Consolidated API client that exports both the Axios instance and SDK-style functions

export { api, getSession, bootstrapSession } from './api';
export { 
  getCurrentUser, 
  getLiveLmsData,
  UserResponse,
  GetCurrentUserParams,
  LmsData,
  LmsResponse,
  UserResponseSchema,
  LmsDataSchema,
  LmsResponseSchema
} from './sdk';