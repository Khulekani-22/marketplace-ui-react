# Authentication Race Condition Fix

## Problem

During app startup, React components were mounting and making API calls before Firebase Authentication completed initialization. This resulted in harmless but noisy 401 Unauthorized errors in the browser console:

```
GET http://localhost:5173/api/me 401 (Unauthorized)
GET http://localhost:5173/api/messages 401 (Unauthorized)
GET http://localhost:5173/api/wallets/me 401 (Unauthorized)
```

**Timeline:**
1. ❌ Components mount → API calls made (no auth token yet)
2. ❌ Backend receives requests without Bearer token → Returns 401
3. ✅ Firebase auth completes → Token available
4. ✅ Requests retry with token → Succeed

The retry logic handled these errors gracefully, but it created unnecessary network traffic and confusing console logs.

## Solution

Created `src/lib/authReady.ts` utility with `waitForAuth()` function that ensures Firebase auth is initialized before making API requests.

### Implementation

**New File: `src/lib/authReady.ts`**
```typescript
import { auth } from "../firebase.js";

let authReadyPromise: Promise<void> | null = null;

export function waitForAuth(): Promise<void> {
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(); // Already authenticated
      return;
    }

    // Wait for first auth state change
    const unsubscribe = auth.onAuthStateChanged(() => {
      unsubscribe();
      resolve();
    });

    // Timeout after 5 seconds to prevent hanging
    setTimeout(() => {
      unsubscribe();
      resolve();
    }, 5000);
  });

  return authReadyPromise;
}
```

**Updated: `src/lib/api.ts`**
```typescript
import { waitForAuth } from "./authReady";

api.interceptors.request.use(async (config) => {
  // Wait for Firebase auth to initialize before sending requests
  await waitForAuth();
  
  const user = auth.currentUser;
  if (user) {
    const tok = await user.getIdToken();
    config.headers.Authorization = `Bearer ${tok}`;
  }
  // ... rest of interceptor
});
```

## Benefits

1. **Cleaner Console Logs** - No more 401 errors during startup
2. **Reduced Network Traffic** - Eliminates unnecessary failed requests
3. **Better UX** - Requests wait for auth instead of failing and retrying
4. **Singleton Pattern** - `waitForAuth()` returns same promise for all callers
5. **Timeout Protection** - Won't hang if auth never completes (5s timeout)

## Testing

```bash
# Build frontend to verify no TypeScript errors
npm run build

# Start both servers
cd backend && node server.js &
npm run dev
```

**Expected Behavior:**
- ✅ No 401 errors in console during app startup
- ✅ All API requests include Bearer token on first attempt
- ✅ Admin authentication works immediately after login
- ✅ App feels more responsive (no retry delays)

## Technical Details

### Why This Works

The `onAuthStateChanged` listener fires immediately with the current auth state:
- If user is already signed in → Resolves instantly
- If user is signing in → Waits for auth to complete
- If no user → Resolves after first state change (null state)

The timeout prevents edge cases where auth initialization might fail or hang.

### Performance Impact

- **Minimal** - Promise is created once and reused
- API calls wait max ~100-500ms during initial auth check
- After first call, all subsequent calls use cached auth state
- No impact on already-authenticated users

## Files Changed

- ✅ Created `src/lib/authReady.ts` (new utility)
- ✅ Updated `src/lib/api.ts` (added waitForAuth import + call)
- ✅ Build verified (no TypeScript errors)

## Related Issues

This fix addresses the race condition reported in the browser console where:
- `MasterLayout.jsx` showed `hasFullAccess: true` and `isAdmin: true`
- But initial API calls failed with 401 before auth completed
- Retry logic made requests succeed on second attempt

Admin authentication was always working correctly - this fix just makes the startup cleaner.
