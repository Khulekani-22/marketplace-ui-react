// src/lib/sdk.ts
// SDK-style functions for common API endpoints with TypeScript types and Zod validation

import { z } from 'zod';
import { api } from './api.js';

// ========== Request/Response Type Definitions ==========

// User types (for /api/users/me endpoint)
export const UserResponseSchema = z.object({
  email: z.string().email(),
  tenantId: z.string().default('public'),
  role: z.enum(['admin', 'member']).default('member'),
  uid: z.string().optional(),
  allowedTenants: z.array(z.string()).optional(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export interface GetCurrentUserParams {
  email?: string;
  uid?: string;
}

// LMS types (for /api/lms/live endpoint)
export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
});

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  lessons: z.array(LessonSchema).default([]),
  order: z.number().optional(),
});

export const CohortSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  courses: z.array(CourseSchema).default([]),
  order: z.number().optional(),
});

export const LmsDataSchema = z.object({
  cohorts: z.array(CohortSchema).default([]),
  lastUpdated: z.string().optional(),
  version: z.string().optional(),
});

export const LmsResponseSchema = z.object({
  data: LmsDataSchema,
});

export type LmsData = z.infer<typeof LmsDataSchema>;
export type LmsResponse = z.infer<typeof LmsResponseSchema>;

// ========== SDK Functions ==========

/**
 * Get current user information
 * Validates response data before returning
 */
export async function getCurrentUser(params?: GetCurrentUserParams): Promise<UserResponse> {
  try {
    const { data } = await api.get('/api/users/me', { params });
    
    // Validate the response against the schema
    const validatedData = UserResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid user data received from server:', error.issues);
      throw new Error('Server returned invalid user data');
    }
    throw error;
  }
}

/**
 * Get live LMS data
 * Validates response data before returning
 */
export async function getLiveLmsData(): Promise<LmsData> {
  try {
    const { data } = await api.get('/api/lms/live');
    
    // Validate the response against the schema
    const validatedResponse = LmsResponseSchema.parse(data);
    return validatedResponse.data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid LMS data received from server:', error.issues);
      throw new Error('Server returned invalid LMS data');
    }
    throw error;
  }
}

// ========== Additional Common Endpoints ==========

// Subscription types
export const SubscriptionSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  status: z.enum(['active', 'cancelled', 'pending']).default('active'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

/**
 * Get user's subscriptions
 * Validates response data before returning
 */
export async function getMySubscriptions(): Promise<Subscription[]> {
  try {
    const { data } = await api.get('/api/subscriptions/my');
    
    // Validate the response array
    const validatedData = z.array(SubscriptionSchema).parse(Array.isArray(data) ? data : []);
    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid subscription data received from server:', error.issues);
      throw new Error('Server returned invalid subscription data');
    }
    throw error;
  }
}

/**
 * Subscribe to a service
 * Validates response data before returning  
 */
export async function subscribeToService(serviceId: string): Promise<Subscription> {
  try {
    const { data } = await api.post('/api/subscriptions/service', { serviceId });
    
    // Validate the response
    const validatedData = SubscriptionSchema.parse(data);
    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid subscription response from server:', error.issues);
      throw new Error('Server returned invalid subscription response');
    }
    throw error;
  }
}

/**
 * Unsubscribe from a service
 */
export async function unsubscribeFromService(serviceId: string): Promise<boolean> {
  try {
    await api.put('/api/subscriptions/service/cancel', { serviceId });
    return true;
  } catch (error) {
    throw error;
  }
}

// ========== Re-export the API instance for backward compatibility ==========
export { api } from './api';