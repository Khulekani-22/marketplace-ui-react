# API SDK Documentation

This document describes the SDK-style functions that wrap common API endpoints with TypeScript types and Zod validation.

## Overview

The API SDK provides typed, validated functions for common endpoints instead of using raw API calls. This approach offers several benefits:

- **Type Safety**: TypeScript interfaces ensure compile-time type checking
- **Runtime Validation**: Zod schemas validate response data to catch backend regressions early
- **Consistent Headers**: JWT tokens and tenant headers are handled automatically
- **Better Developer Experience**: IntelliSense support and clear function signatures

## Usage

Import SDK functions from the consolidated API client:

```typescript
import { getCurrentUser, getLiveLmsData, getMySubscriptions } from '../lib/apiClient';
```

Or import directly from the SDK module:

```typescript
import { getCurrentUser, getLiveLmsData } from '../lib/sdk';
```

## Available Functions

### User Management

#### `getCurrentUser(params?: GetCurrentUserParams): Promise<UserResponse>`

Get current user information with role and tenant details.

```typescript
// Get current user by email
const user = await getCurrentUser({ email: 'user@example.com' });
console.log(user.role); // 'admin' | 'member'
console.log(user.tenantId); // string

// Get current user by UID
const user = await getCurrentUser({ uid: 'firebase-uid' });

// Types
interface GetCurrentUserParams {
  email?: string;
  uid?: string;
}

interface UserResponse {
  email: string;
  tenantId: string;
  role: 'admin' | 'member';
  uid?: string;
  allowedTenants?: string[];
}
```

### LMS Data

#### `getLiveLmsData(): Promise<LmsData>`

Get live LMS data including cohorts, courses, and lessons.

```typescript
// Get current LMS data
const lmsData = await getLiveLmsData();
console.log(lmsData.cohorts); // Cohort[]

// Types
interface LmsData {
  cohorts: Cohort[];
  lastUpdated?: string;
  version?: string;
}

interface Cohort {
  id: string;
  title: string;
  description?: string;
  courses: Course[];
  order?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  order?: number;
}

interface Lesson {
  id: string;
  title: string;
  content?: string;
  duration?: number;
  order?: number;
}
```

### Subscriptions

#### `getMySubscriptions(): Promise<Subscription[]>`

Get current user's subscriptions.

```typescript
// Get user subscriptions
const subscriptions = await getMySubscriptions();
console.log(subscriptions.length); // number

// Types
interface Subscription {
  id: string;
  serviceId: string;
  userId?: string;
  userEmail?: string;
  status: 'active' | 'cancelled' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}
```

#### `subscribeToService(serviceId: string): Promise<Subscription>`

Subscribe to a service.

```typescript
// Subscribe to a service
const subscription = await subscribeToService('service-123');
console.log(subscription.status); // 'active'
```

#### `unsubscribeFromService(serviceId: string): Promise<boolean>`

Unsubscribe from a service.

```typescript
// Unsubscribe from a service
const success = await unsubscribeFromService('service-123');
console.log(success); // true
```

## Error Handling

All SDK functions include built-in error handling:

1. **Validation Errors**: If the server returns invalid data, a `ZodError` is caught and a user-friendly error is thrown
2. **Network Errors**: Standard HTTP errors are passed through from the underlying Axios calls
3. **Authentication**: JWT tokens are automatically included via the API interceptors

```typescript
try {
  const user = await getCurrentUser({ email: 'invalid@email' });
} catch (error) {
  if (error.message === 'Server returned invalid user data') {
    // Handle validation error
  } else {
    // Handle other errors (network, auth, etc.)
  }
}
```

## Validation Schemas

The SDK uses Zod schemas for runtime validation. You can import and use these schemas directly:

```typescript
import { UserResponseSchema, LmsDataSchema, SubscriptionSchema } from '../lib/apiClient';

// Validate data manually
const validatedUser = UserResponseSchema.parse(someUserData);
```

## Migration Guide

### Before (Raw API calls)

```javascript
// Old way - no types, no validation
const { data } = await api.get('/api/users/me', { params: { email } });
const role = data?.role || 'member'; // Unsafe access
```

### After (SDK functions)

```typescript
// New way - typed and validated
const userData = await getCurrentUser({ email });
const role = userData.role; // Type-safe access
```

## Backward Compatibility

The original `api` instance is still available for endpoints not yet covered by the SDK:

```typescript
import { api } from '../lib/apiClient';

// Still available for other endpoints
const { data } = await api.get('/api/some/other/endpoint');
```

## Best Practices

1. **Use SDK functions when available** instead of raw API calls
2. **Handle errors appropriately** - SDK functions may throw validation errors
3. **Import from apiClient.ts** for a single import source
4. **Update existing code gradually** - both approaches work during migration
5. **Add new endpoints to the SDK** when implementing new features