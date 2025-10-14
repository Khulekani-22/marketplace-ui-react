# Firestore Backend Migration - Component Updates

**Date:** October 14, 2025  
**Objective:** Migrate all frontend components to use Axios + Firestore backend API as the primary data source  
**Status:** 🚧 IN PROGRESS

---

## Overview

This migration updates all React components to fetch data from the Firestore backend via Axios HTTP requests instead of importing local JSON files. This ensures:

1. **Real-time data:** Always fetch fresh data from Firestore
2. **Single source of truth:** Backend Firestore database is authoritative
3. **Multi-tenant support:** Proper tenant isolation and access control
4. **Scalability:** No need to rebuild/redeploy frontend for data changes

---

## Migration Strategy

### Phase 1: Context Providers ✅
- [x] **AppSyncContext.tsx** - Updated to use `/api/lms/live` as primary source
  - Removed import of `appData.json`
  - Uses API first, falls back to localStorage cache only
  - No longer uses bundled JSON as fallback

### Phase 2: Page Components 🚧
Files that need updates:
- [ ] **VendorAddListingPage.tsx** - Currently imports `appDataLocal`
- [ ] **VendorDashboardPage.tsx** - Currently imports `appDataLocal`
- [ ] **VendorsAdminPage.tsx** - Currently imports `appDataLocal`
- [ ] **VendorProfilePage.tsx** - Currently imports `appDataLocal`
- [ ] **ListingsAdminPage.tsx** - Currently imports `appDataLocal`

### Phase 3: Child Components 🚧
Files that need updates:
- [ ] **StatisticsOne.jsx** - Uses `appData.json`
- [ ] **Workspace1.jsx** - Uses `appData.json`
- [ ] **ETHPriceOne.jsx** - Uses `appData.json`
- [ ] **FeaturedCreatorsOne.jsx** - Uses `appData.json`
- [ ] **TrendingNFTsOne.jsx** - Uses `appDataLocal`
- [ ] **Recommendations.jsx** - Uses `appDataLocal`
- [ ] **CohortDetail.jsx** - Uses `appData.json`
- [ ] **TrendingBidsOne.jsx** - Uses `appData.json`
- [ ] **RecentBidOne.jsx** - Uses `appData.json`

### Phase 4: Utility Files 🚧
- [ ] **src/loadData.js** - Uses `appData.json`
- [ ] **src/utils/loadData.ts** - Uses `appData.json`

---

## API Endpoints Available

### Core Data Endpoints
- `GET /api/services` - Get all services (listings)
- `GET /api/services/mine` - Get my services (vendor)
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `GET /api/vendors` - Get all vendors
- `GET /api/startups` - Get all startups
- `GET /api/tenants` - Get all tenants
- `GET /api/users` - Get all users
- `GET /api/lms/live` - Get complete app data (LMS data)
- `GET /api/subscriptions` - Get subscriptions

### Admin Endpoints
- `POST /api/admin/wallet/add-credits` - Add wallet credits
- `GET /api/admin/wallet/transactions` - Get all transactions
- `GET /api/admin/wallet/users` - Get users with wallets
- `POST /api/integrity/sync-vendors` - Sync vendor data

---

## Migration Pattern

###Before (Local JSON):
```tsx
import appDataLocal from "../data/appData.json";

function MyComponent() {
  const [services, setServices] = useState(appDataLocal.services || []);
  // ... rest of component
}
```

### After (API Call):
```tsx
import { api } from "../lib/api";
import { useAppSync } from "../context/useAppSync";

function MyComponent() {
  const { appData, appDataLoading } = useAppSync();
  const [services, setServices] = useState([]);
  
  useEffect(() => {
    if (appData?.services) {
      setServices(appData.services);
    }
  }, [appData]);
  
  // OR fetch directly if needed:
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/api/services");
        setServices(data || []);
      } catch (err) {
        console.error("Failed to load services:", err);
      }
    }
    load();
  }, []);
  
  if (appDataLoading) return <div>Loading...</div>;
  // ... rest of component
}
```

---

## Benefits of API-First Approach

### 1. Real-Time Data
- Data always reflects current state in Firestore
- No need to refresh browser or rebuild app for data changes
- Changes made by other users/tenants visible immediately

### 2. Proper Authentication
- Firebase token automatically included in requests
- Backend validates user permissions
- Tenant isolation enforced server-side

### 3. Better Error Handling
- API errors surfaced properly to user
- Retry logic in axios interceptors
- Fallback to cached data when network unavailable

### 4. Performance
- Data cached in localStorage (`sl_app_data_cache_v1`)
- Server-side filtering reduces data transfer
- Only fetch what's needed per component

### 5. Security
- No sensitive data embedded in frontend bundle
- Backend enforces access control
- Audit logging for data access

---

## Testing Checklist

After migration, verify:

- [ ] Services/Listings load correctly
- [ ] Vendors load correctly
- [ ] Startups load correctly
- [ ] LMS cohorts/courses load correctly
- [ ] User profile data loads correctly
- [ ] Wallet balances load correctly
- [ ] Multi-tenant data isolation works
- [ ] Admin features work with proper permissions
- [ ] Error handling works (try with network offline)
- [ ] Data caching works (check localStorage)
- [ ] Performance is acceptable (check Network tab)

---

## Completed Changes

### 1. AppSyncContext.tsx ✅
**Changes:**
- Removed `import appDataLocal from "../data/appData.json"`
- Modified `initialAppData` to only use cached data
- Updated `refreshAppData` to not fallback to bundled JSON
- Now uses only API (`/api/lms/live`) and localStorage cache

**Impact:**
- All components using `useAppSync()` hook now get API data
- Automatic tenant filtering via `x-tenant-id` header
- Better error messages when API unavailable

---

## Next Steps

1. ✅ Update AppSyncContext (completed)
2. 🚧 Update page components (in progress)
3. 🔜 Update child components
4. 🔜 Update utility files
5. 🔜 Test all components
6. 🔜 Remove unused local JSON imports
7. 🔜 Update documentation

---

## Rollback Plan

If issues arise:
1. Revert to git commit before migration
2. Or temporarily restore local JSON fallback:
   ```tsx
   import appDataLocal from "../data/appData.json";
   const fallback = cached || appDataLocal || null;
   ```

---

## Notes

- **AppSyncContext** is the central data provider - most components should use it
- Direct API calls should only be used for:
  - Data not in AppSync (e.g., specific service details)
  - Mutations (POST/PUT/DELETE operations)
  - Real-time updates not covered by AppSync polling
- Always handle loading states properly
- Always handle error states and show user-friendly messages
- Use `suppressToast` and `suppressErrorLog` for background requests

---

**Status:** Phase 1 complete. Continuing with Phase 2...
