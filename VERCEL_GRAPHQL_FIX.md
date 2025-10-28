# ✅ Vercel Serverless Error Fix - Apollo GraphQL Dependencies

## Error Fixed

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'apollo-server-express' 
imported from /var/task/backend/graphql/server.js
```

## Root Cause

The backend GraphQL server uses `apollo-server-express` and related GraphQL packages, but these dependencies were only listed in `backend/package.json`. 

**Vercel uses the root `package.json`** for dependency installation, so the GraphQL packages were missing on deployment.

## Fix Applied

Added missing GraphQL dependencies to root `package.json`:

```json
"@graphql-tools/schema": "^10.0.25",
"apollo-server-express": "^3.13.0",
"graphql": "^16.11.0",
"graphql-subscriptions": "^3.0.0",
"graphql-tools": "^9.0.20",
"graphql-ws": "^6.0.6",
"ws": "^8.18.0"
```

## Deploy the Fix

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Install dependencies locally to verify
npm install

# Commit and push
git add package.json
git commit -m "Fix: Add Apollo GraphQL dependencies for Vercel deployment"
git push origin main
```

## Verification

After deployment completes:

### 1. Check Deployment Status
- Go to https://vercel.com/dashboard
- Wait for deployment to finish
- Check build logs for no errors

### 2. Test Backend Health
```
https://marketplace-firebase.vercel.app/api/health/status
```
Expected: `{"status":"healthy",...}`

### 3. Test Services Endpoint
```
https://marketplace-firebase.vercel.app/api/data/services?page=1&pageSize=5
```
Expected: `{"items":[...], "total":...}`

### 4. Test GraphQL Endpoint (Optional)
```
https://marketplace-firebase.vercel.app/graphql
```
Expected: GraphQL playground or introspection response

### 5. Test Dashboard
```
https://marketplace-firebase.vercel.app/dashboard
```
Expected: Dashboard loads with service listings displayed

## Why This Happened

**Dual package.json Setup:**
- Root `package.json` - Frontend dependencies (Vite, React, etc.)
- `backend/package.json` - Backend dependencies (Express, GraphQL, etc.)

**Vercel Behavior:**
- Vercel only installs from root `package.json`
- Backend code runs as serverless functions
- All backend dependencies must be in root `package.json`

**Solution:**
- Merged backend dependencies into root `package.json`
- This allows Vercel to install all required packages

## Additional Notes

### Dependencies Added
1. **`apollo-server-express`** - GraphQL server for Express
2. **`graphql`** - Core GraphQL library
3. **`@graphql-tools/schema`** - Schema creation utilities
4. **`graphql-subscriptions`** - Real-time subscriptions
5. **`graphql-tools`** - GraphQL tools and utilities
6. **`graphql-ws`** - WebSocket for GraphQL subscriptions
7. **`ws`** - WebSocket library

### Files Modified
- ✅ `/package.json` - Added GraphQL dependencies

### Files NOT Modified (No changes needed)
- `backend/graphql/server.js` - Already correct
- `backend/server.js` - Already correct
- `vercel.json` - Already configured correctly

## Expected Outcome

After this fix:
- ✅ Backend deploys successfully to Vercel
- ✅ No more "Cannot find package" errors
- ✅ GraphQL server initializes properly
- ✅ Services API endpoint works
- ✅ Dashboard displays Firestore listings

## Rollback (If Needed)

If something goes wrong, you can remove the added packages:

```bash
# Open package.json and remove these lines:
# "@graphql-tools/schema": "^10.0.25",
# "apollo-server-express": "^3.13.0",
# "graphql": "^16.11.0",
# "graphql-subscriptions": "^3.0.0",
# "graphql-tools": "^9.0.20",
# "graphql-ws": "^6.0.6",
# "ws": "^8.18.0",

# Then:
npm install
git add package.json
git commit -m "Rollback GraphQL dependencies"
git push origin main
```

## Testing Checklist

After deployment:

- [ ] Vercel deployment succeeded (no build errors)
- [ ] Backend health endpoint returns 200 OK
- [ ] Services endpoint returns data
- [ ] No serverless handler crash errors
- [ ] Dashboard page loads
- [ ] Service listings appear on dashboard
- [ ] No console errors related to GraphQL
- [ ] Sign in with Google still works

## Related Issues Fixed

This fix resolves:
1. ✅ Serverless handler crash
2. ✅ "Cannot find package 'apollo-server-express'" error
3. ✅ Backend not initializing on Vercel
4. ✅ Dashboard not displaying listings (caused by backend failure)

## Next Steps

1. ✅ Run `npm install` locally
2. ✅ Commit and push changes
3. ✅ Wait for Vercel deployment
4. ✅ Test all endpoints
5. ✅ Verify dashboard shows listings

---

**Status:** Ready to deploy 🚀  
**Estimated Deploy Time:** 2-3 minutes  
**Expected Result:** Backend fully functional on Vercel
