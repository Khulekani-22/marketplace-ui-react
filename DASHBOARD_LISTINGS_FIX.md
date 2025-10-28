# Dashboard Listings Not Showing - Diagnostic Guide

## Issue
After successful Google sign-in on https://marketplace-firebase.vercel.app/dashboard, listings from Firestore are not displaying.

## Root Cause Analysis

Based on code review, the dashboard uses this flow:
1. `Dashboard.tsx` → `DashBoardLayerSeven.tsx` → `AccessToMarketDashboard.tsx`
2. `AccessToMarketDashboard` renders `TrendingNFTsOne` component
3. `TrendingNFTsOne` fetches services from `/api/data/services`
4. API client auto-detects Vercel domain and uses same origin

## Diagnostic Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) on https://marketplace-firebase.vercel.app/dashboard and check for:

**Look for these errors:**
```
- CORS errors (Access-Control-Allow-Origin)
- 401 Unauthorized (auth token issues)
- 404 Not Found (API endpoint missing)
- 500 Server Error (backend issues)
- Network timeout errors
- Firebase authentication errors
```

**Expected console messages:**
```javascript
[TrendingNFTsOne] Subscriptions fetched: [...]
[TrendingNFTsOne] Subscription IDs: [...]
```

### Step 2: Check Network Tab

1. Open DevTools → **Network** tab
2. Filter by: `services`
3. Reload the dashboard page
4. Look for the API request: `GET /api/data/services?page=1&pageSize=400&tenantId=vendor`

**Check the response:**
- ✅ **200 OK** - API is working
- ❌ **401** - Authentication issue
- ❌ **404** - Backend not deployed or route missing
- ❌ **500** - Server error
- ❌ **CORS** - CORS misconfiguration
- ❌ **(failed)** - Network error or timeout

### Step 3: Test Backend API Directly

**Health Check:**
```
https://marketplace-firebase.vercel.app/api/health/status
```
Expected: `{"status":"healthy","uptime":...}`

**Services Endpoint:**
```
https://marketplace-firebase.vercel.app/api/data/services?page=1&pageSize=10
```
Expected: `{"items":[...], "total":...}`

### Step 4: Check Firebase Authentication

In browser console on the dashboard page:
```javascript
// Check if user is authenticated
import { auth } from './firebase.js';
console.log('Current user:', auth.currentUser);
console.log('User email:', auth.currentUser?.email);
console.log('User UID:', auth.currentUser?.uid);

// Check if token is valid
auth.currentUser?.getIdToken().then(token => {
  console.log('ID Token exists:', !!token);
  console.log('Token preview:', token.substring(0, 50) + '...');
});
```

### Step 5: Check Firestore Data

Verify data exists in Firestore:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `sloane-hub`
3. Navigate to **Firestore Database**
4. Check if `services` collection exists
5. Verify documents have `status: "approved"`
6. Check if documents have required fields:
   - `id`
   - `title`
   - `description`
   - `vendor` or `vendorName`
   - `category`
   - `status` = "approved"

## Common Issues & Solutions

### Issue 1: Backend Not Deployed to Vercel

**Symptom:** 404 errors on `/api/*` endpoints

**Solution:**
```bash
# Verify vercel.json has API rewrites
cat vercel.json | grep -A 5 "rewrites"

# Should show:
# {
#   "source": "/api/(.*)",
#   "destination": "/api/server.js"
# }

# Redeploy to Vercel
git add .
git commit -m "Ensure backend API is deployed"
git push origin main
```

### Issue 2: Missing Environment Variables

**Symptom:** Backend errors, 500 responses

**Solution:** Verify all environment variables are set in Vercel:
- See `VERCEL_ENV_READY.md` for complete list
- Go to Vercel Dashboard → Settings → Environment Variables
- Ensure all variables are set for Production environment
- Redeploy after adding variables

### Issue 3: CORS Blocking Requests

**Symptom:** CORS errors in console

**Solution:** Already fixed in `backend/middleware/corsConfig.js`
- Vercel domain should be: `https://marketplace-firebase.vercel.app`
- Backend should allow this origin
- Redeploy to apply CORS fix

### Issue 4: Authentication Token Not Sent

**Symptom:** 401 Unauthorized errors

**Solution:**
```javascript
// Check if axios interceptor is adding auth header
// In browser console:
api.interceptors.request.handlers.forEach((h, i) => {
  console.log(`Interceptor ${i}:`, h);
});

// Check if token is being sent
api.get('/api/data/services').then(
  r => console.log('Success:', r),
  e => console.log('Error:', e.response?.status, e.response?.data)
);
```

### Issue 5: Empty Firestore Collection

**Symptom:** API returns `{"items":[], "total":0}`

**Solution:**
1. Check Firestore Console for data
2. If empty, import data:
   ```bash
   cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
   node backend/scripts/import-data.js
   ```
3. Or manually add test service via Firebase Console

### Issue 6: Firestore Rules Blocking Reads

**Symptom:** API works locally but not on Vercel

**Solution:** Check Firestore security rules:
```javascript
// firestore.rules should allow backend reads
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /services/{serviceId} {
      // Allow backend (service account) to read
      allow read: if request.auth != null || request.auth.token.admin == true;
    }
  }
}
```

### Issue 7: Service Account Not Deployed

**Symptom:** Backend can't authenticate with Firestore

**Solution:**
```bash
# Verify service account file exists
ls -la secrets/sloane-hub-service-account.json

# If missing, copy it:
cp serviceAccountKey.json secrets/sloane-hub-service-account.json

# Ensure it's not in .gitignore for deployment
git add secrets/sloane-hub-service-account.json
git commit -m "Add service account for Vercel deployment"
git push origin main
```

## Quick Diagnostic Script

Run this in the browser console on the dashboard:

```javascript
// Dashboard Diagnostic Script
(async function diagnose() {
  console.log('🔍 Starting Dashboard Diagnostics...\n');
  
  // 1. Check Authentication
  const user = auth.currentUser;
  console.log('✅ Auth User:', user ? `${user.email} (${user.uid})` : '❌ Not authenticated');
  
  // 2. Check API Base URL
  console.log('✅ API Base:', api.defaults.baseURL);
  
  // 3. Test Health Endpoint
  try {
    const health = await fetch('/api/health/status');
    const healthData = await health.json();
    console.log('✅ Backend Health:', healthData);
  } catch (e) {
    console.error('❌ Backend Health Failed:', e.message);
  }
  
  // 4. Test Services Endpoint
  try {
    const services = await fetch('/api/data/services?page=1&pageSize=10');
    const servicesData = await services.json();
    console.log('✅ Services Response:', {
      status: services.status,
      total: servicesData.total,
      items: servicesData.items?.length || 0
    });
  } catch (e) {
    console.error('❌ Services Failed:', e.message);
  }
  
  // 5. Check Session Storage
  console.log('✅ Tenant ID:', sessionStorage.getItem('tenantId') || '(not set)');
  
  // 6. Check for CORS Issues
  console.log('\n📋 Check Network tab for CORS errors');
  console.log('📋 Look for failed /api/data/services requests');
  
  console.log('\n✅ Diagnostics Complete');
})();
```

## Step-by-Step Fix Process

### Fix 1: Ensure Backend is Deployed

```bash
# Check vercel.json configuration
cat vercel.json

# Redeploy
git add .
git commit --allow-empty -m "Trigger Vercel redeploy for backend"
git push origin main

# Wait for deployment to complete
# Check: https://vercel.com/dashboard
```

### Fix 2: Verify Service Account

```bash
# Ensure service account exists
ls -la secrets/sloane-hub-service-account.json

# If missing, restore it
cp serviceAccountKey.json secrets/sloane-hub-service-account.json
git add secrets/sloane-hub-service-account.json
git commit -m "Add service account for backend"
git push origin main
```

### Fix 3: Check Vercel Logs

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Logs** tab
4. Look for errors from `/api/data/services` endpoint
5. Check for:
   - Service account errors
   - Firestore connection errors
   - Authentication errors
   - Missing environment variables

### Fix 4: Test API Locally First

```bash
# Start backend locally
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
node backend/server.js

# In another terminal, test the endpoint
curl http://localhost:5055/api/data/services?page=1&pageSize=10

# Should return JSON with services
```

### Fix 5: Add Debug Logging

Temporarily add logging to see what's happening:

```typescript
// In TrendingNFTsOne.jsx, around line 239
try {
  console.log('[DEBUG] Fetching services from:', api.defaults.baseURL);
  console.log('[DEBUG] Params:', params);
  
  const { data } = await api.get('/api/data/services', {
    params,
    suppressToast: true,
    suppressErrorLog: false, // Changed to see errors
  });
  
  console.log('[DEBUG] Response data:', data);
  console.log('[DEBUG] Items count:', data?.items?.length);
  
  const remoteApproved = safeArray(data?.items).map(normalize).filter(isApproved);
  console.log('[DEBUG] Approved items:', remoteApproved.length);
  
  applyResult(remoteApproved);
} catch (error) {
  console.error('[DEBUG] Fetch error:', error);
  console.error('[DEBUG] Error response:', error.response?.data);
  console.error('[DEBUG] Error status:', error.response?.status);
  applyResult([], true);
}
```

## Expected Working Flow

1. User signs in with Google ✅
2. Redirected to `/dashboard` ✅
3. `TrendingNFTsOne` component mounts
4. Fetches from `/api/data/services` with auth token
5. Backend authenticates with Firebase service account
6. Backend queries Firestore `services` collection
7. Returns approved services to frontend
8. Component displays service cards

## Success Criteria

When working correctly, you should see:
- ✅ No errors in browser console
- ✅ Network tab shows `200 OK` for `/api/data/services`
- ✅ Service cards displayed on dashboard
- ✅ Backend logs show successful Firestore queries
- ✅ Loading spinner appears briefly then shows content

## Next Steps

1. **Run diagnostic script** in browser console
2. **Check Vercel logs** for backend errors
3. **Verify Firestore** has data in `services` collection
4. **Test backend API** directly with curl or Postman
5. **Check environment variables** are all set in Vercel
6. **Review CORS configuration** in backend
7. **Verify service account** is deployed

## Need Help?

If issues persist:
1. Share browser console errors
2. Share Vercel deployment logs
3. Share Firestore rules configuration
4. Confirm data exists in Firestore Console
