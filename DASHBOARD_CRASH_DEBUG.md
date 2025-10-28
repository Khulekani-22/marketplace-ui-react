# 🔍 Dashboard Crash Debugging Guide

## Issue
Dashboard page (https://marketplace-firebase.vercel.app/dashboard) is crashing.

## Debugging Steps

### 1. Check Browser Console

Open browser developer tools and check for errors:

```
Right-click → Inspect → Console tab
```

Look for:
- ❌ Module import errors
- ❌ Component rendering errors  
- ❌ API call failures
- ❌ Authentication errors

### 2. Check Network Tab

```
Developer Tools → Network tab → Refresh page
```

Look for:
- Failed API calls (red status codes)
- 401/403 authentication errors
- 500 server errors
- Timeout errors

### 3. Test API Endpoints

```bash
# Test services API (already confirmed working)
curl "https://marketplace-firebase.vercel.app/api/data/services?page=1&pageSize=3"

# Test startups API (used by dashboard)
curl "https://marketplace-firebase.vercel.app/api/data/startups"

# Test vendors API (used by dashboard)
curl "https://marketplace-firebase.vercel.app/api/data/vendors"
```

### 4. Common Dashboard Crash Causes

#### A. Missing API Endpoints
Dashboard tries to fetch:
- `/api/data/startups` - User startup profiles
- `/api/data/vendors` - User vendor profiles  
- `/api/data/services` - Service listings ✅ (confirmed working)

#### B. Authentication Issues
- Firebase auth token not being sent
- Token expired or invalid
- CORS headers blocking auth

#### C. Component Errors
- Missing dependencies in components
- TypeScript type mismatches
- React rendering errors

#### D. Build Issues
- Client-side only code running on server (SSR)
- Environment variables not set
- Missing chunks/bundles

---

## Quick Tests

### Test 1: Check if startups endpoint exists

```bash
curl -s "https://marketplace-firebase.vercel.app/api/data/startups" | head -100
```

**Expected:** JSON array or empty array `[]`  
**If error:** Endpoint might not be deployed

### Test 2: Check if vendors endpoint exists

```bash
curl -s "https://marketplace-firebase.vercel.app/api/data/vendors" | head -100
```

**Expected:** JSON array or empty array `[]`  
**If error:** Endpoint might not be deployed

### Test 3: Try accessing dashboard without auth

Open in incognito/private window:
```
https://marketplace-firebase.vercel.app/dashboard
```

- If it redirects to login → Auth required (expected)
- If it crashes → Component error (not auth related)

### Test 4: Check Vercel deployment logs

1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click on latest deployment
5. Check "Functions" tab for errors
6. Check "Build Logs" for warnings

---

## Likely Issues & Fixes

### Issue 1: Missing API Endpoints

If `/api/data/startups` or `/api/data/vendors` return 404:

**Fix:** Check `backend/server.js` routes are properly set up

```javascript
// Should have these routes:
app.get('/api/data/startups', ...)
app.get('/api/data/vendors', ...)
app.get('/api/data/services', ...) // ✅ Working
```

### Issue 2: Component Import Error

If console shows: `Cannot find module` or `Module not found`

**Fix:** Check component imports in:
- `src/pages/Dashboard.tsx`
- `src/components/DashBoardLayerSeven.tsx`
- `src/components/AccessToMarketDashboard.tsx`
- `src/components/child/TrendingNFTsOne.tsx`

### Issue 3: API Timeout

Dashboard has 8-second timeout for API calls. If backend is slow:

**Fix:** Increase timeout in `AccessToMarketDashboard.tsx`:

```typescript
// Line ~67
timeoutId = setTimeout(() => {
  reject(new Error('Request timeout'));
}, 15000); // Increase from 8000 to 15000
```

### Issue 4: Firebase Auth Not Initialized

If dashboard crashes before API calls:

**Fix:** Check `src/firebase.js` exports and initialization

### Issue 5: Missing Environment Variables

Dashboard needs Firebase config. Check Vercel has:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## Get Crash Details

### In Browser Console:

```javascript
// Check if Firebase is initialized
console.log('Firebase:', window.firebase);

// Check current auth state
console.log('Auth user:', auth.currentUser);

// Test API directly
fetch('https://marketplace-firebase.vercel.app/api/data/services?page=1&pageSize=3')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test startups endpoint
fetch('https://marketplace-firebase.vercel.app/api/data/startups')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Check Vercel Function Logs:

```bash
# If you have Vercel CLI installed:
vercel logs marketplace-firebase.vercel.app
```

---

## Temporary Fix: Simplify Dashboard

If dashboard keeps crashing, temporarily simplify it:

**Create:** `src/pages/DashboardSimple.tsx`

```tsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import MasterLayout from '../masterLayout/MasterLayout';

const DashboardSimple = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/data/services?page=1&pageSize=10')
      .then(res => {
        setServices(res.data.items || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <MasterLayout><div>Loading...</div></MasterLayout>;
  if (error) return <MasterLayout><div>Error: {error}</div></MasterLayout>;

  return (
    <MasterLayout>
      <div className="dashboard-content">
        <h2>Services ({services.length})</h2>
        <div className="row">
          {services.map((service: any) => (
            <div key={service.id} className="col-md-4 mb-3">
              <div className="card">
                <img src={service.imageUrl} alt={service.title} className="card-img-top" />
                <div className="card-body">
                  <h5>{service.title}</h5>
                  <p>{service.category}</p>
                  <p>R{service.price?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MasterLayout>
  );
};

export default DashboardSimple;
```

Then test: Update route to use simplified version temporarily.

---

## Next Steps

1. **Open browser console** at https://marketplace-firebase.vercel.app/dashboard
2. **Copy error message** and share it
3. **Check network tab** for failed requests
4. **Test API endpoints** with curl commands above

**Then I can provide specific fix based on the actual error!**

---

## Common Error Messages & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot read property 'map' of undefined" | API returned unexpected data | Add null checks |
| "Module not found" | Missing import or file | Check file paths |
| "Unauthorized" | Auth token missing | Check Firebase auth |
| "CORS error" | CORS misconfigured | Check ALLOWED_ORIGINS |
| "Timeout" | API too slow | Increase timeout |
| "Cannot find package" | Missing dependency | Add to package.json |
| "Unexpected token <" | Server returned HTML not JSON | Check API endpoint |

---

**To debug effectively, please share:**
1. Browser console error message
2. Network tab failed requests  
3. What happens: Blank page? Error message? Infinite loading?
