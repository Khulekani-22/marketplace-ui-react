# Analytics Quick Start Guide

## Deploy Analytics System

Follow these steps to deploy and test the API Analytics Dashboard.

## Step 1: Deploy Firestore Indexes

The analytics system requires Firestore indexes for efficient queries.

```bash
# From project root
firebase deploy --only firestore:indexes
```

**Expected output:**
```
✔  firestore: deployed indexes in firestore.indexes.json successfully
```

**Indexes being created:**
- `apiRequests` - timestamp (asc/desc), timestamp + success
- `analyticsHourly` - date (asc/desc)
- `analyticsDaily` - date (asc/desc)
- `analyticsEndpoints` - totalRequests, avgResponseTime, failedRequests, lastAccessed
- `analyticsConsumers` - totalRequests, avgResponseTime, lastRequest

**Note:** Index creation can take 5-10 minutes for large collections.

## Step 2: Verify Server Integration

Check that the analytics middleware and routes are integrated:

```bash
# Check imports
grep "analyticsMiddleware" backend/server.js
grep "analyticsRouter" backend/server.js

# Expected output:
# import { analyticsMiddleware, analyticsErrorHandler } from "./middleware/analyticsMiddleware.js";
# import analyticsRouter from "./routes/analytics.js";
# app.use(analyticsMiddleware);
# app.use(analyticsErrorHandler);
# app.use("/api/analytics", analyticsRouter);
```

## Step 3: Restart Backend Server

```bash
# Stop existing server (if running)
pkill -f "node.*server.js"

# Start server
cd backend
node server.js
```

**Expected output:**
```
SCDM backend running on http://localhost:5055
```

## Step 4: Test Analytics Recording

Make some test API requests:

```bash
# Test 1: Make a successful request
curl -X GET "http://localhost:5055/api/services" \
  -H "X-API-Key: YOUR_API_KEY"

# Test 2: Make a failed request (404)
curl -X GET "http://localhost:5055/api/services/nonexistent" \
  -H "X-API-Key: YOUR_API_KEY"

# Test 3: Make requests with different methods
curl -X POST "http://localhost:5055/api/services" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"title": "Test Service"}'
```

## Step 5: Verify Data Collection

Check Firestore console:

1. **Open Firebase Console:** https://console.firebase.google.com
2. **Navigate to Firestore Database**
3. **Check Collections:**
   - `apiRequests` - Should have new documents
   - `analyticsHourly` - Should have current hour bucket
   - `analyticsEndpoints` - Should have endpoint stats

**Or via CLI:**
```bash
# Check apiRequests collection
firebase firestore:read apiRequests --limit 5

# Expected: Recent request logs with timestamps
```

## Step 6: Query Analytics API

Get admin Firebase token:

```bash
# Login to Firebase
firebase login

# Get ID token for testing
firebase auth:export users.json
# Copy a user's UID, then use it to generate a token
```

**Or use the Firebase SDK in browser console:**
```javascript
// In browser with Firebase initialized
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
console.log(token);
```

Test analytics endpoints:

```bash
# Set your Firebase token
TOKEN="YOUR_FIREBASE_ID_TOKEN"

# Test 1: Get overview
curl -X GET "http://localhost:5055/api/analytics/overview?period=24h" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "period": { "start": "...", "end": "..." },
#     "metrics": {
#       "totalRequests": 10,
#       "successfulRequests": 8,
#       "failedRequests": 2,
#       "errorRate": "20.00",
#       "avgResponseTime": 125,
#       ...
#     }
#   }
# }

# Test 2: Get time series
curl -X GET "http://localhost:5055/api/analytics/timeseries?period=24h&granularity=hour" \
  -H "Authorization: Bearer $TOKEN"

# Test 3: Get endpoint stats
curl -X GET "http://localhost:5055/api/analytics/endpoints?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Test 4: Get consumer stats
curl -X GET "http://localhost:5055/api/analytics/consumers?limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Test 5: Get health status
curl -X GET "http://localhost:5055/api/analytics/health" \
  -H "Authorization: Bearer $TOKEN"
```

## Step 7: Test CSV Export

```bash
# Export endpoints data
curl -X GET "http://localhost:5055/api/analytics/export?type=endpoints&period=7d" \
  -H "Authorization: Bearer $TOKEN" \
  --output analytics-endpoints.csv

# View CSV
cat analytics-endpoints.csv

# Expected: CSV file with endpoint statistics
```

## Step 8: Create Admin User (if needed)

If you don't have an admin user:

```bash
# Via Firebase Console:
# 1. Go to Authentication
# 2. Select a user
# 3. Set custom claims: { "admin": true }

# Or via Firebase Admin SDK:
firebase functions:shell

# In shell:
const admin = require('firebase-admin');
await admin.auth().setCustomUserClaims('USER_UID', { admin: true });
```

**Or via backend script:**

```javascript
// set-admin.js
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userEmail = 'admin@example.com';
const user = await admin.auth().getUserByEmail(userEmail);
await admin.auth().setCustomUserClaims(user.uid, { admin: true });

console.log(`Set admin claim for ${userEmail}`);
process.exit(0);
```

Run:
```bash
node backend/set-admin.js
```

## Step 9: Generate Test Data

Create a script to generate test analytics data:

```javascript
// generate-test-data.js
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5055/api';
const API_KEY = 'YOUR_API_KEY';

const endpoints = [
  '/services',
  '/vendors',
  '/subscriptions',
  '/messages',
  '/wallets'
];

const methods = ['GET', 'POST', 'PUT', 'DELETE'];

async function makeRequest(endpoint, method) {
  try {
    await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Ignore errors (we want some failures for testing)
  }
}

async function generateTestData(count = 100) {
  console.log(`Generating ${count} test requests...`);
  
  for (let i = 0; i < count; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    
    await makeRequest(endpoint, method);
    
    if (i % 10 === 0) {
      console.log(`Progress: ${i}/${count}`);
    }
    
    // Random delay (0-100ms)
    await new Promise(r => setTimeout(r, Math.random() * 100));
  }
  
  console.log('Done!');
}

generateTestData(200);
```

Run:
```bash
node generate-test-data.js
```

Wait 1-2 minutes for aggregations to process, then check analytics again.

## Step 10: Build Dashboard UI

Create a React dashboard component:

```bash
# Install dependencies
npm install recharts date-fns

# Create dashboard component
mkdir -p src/components/Analytics
touch src/components/Analytics/AnalyticsDashboard.tsx
```

**See API_ANALYTICS.md** for complete dashboard implementation examples.

## Troubleshooting

### Issue: "Forbidden" Error on Analytics Endpoints

**Cause:** User doesn't have admin role.

**Fix:**
```bash
# Set admin claim (see Step 8)
firebase auth:set-custom-claims USER_UID '{"admin":true}'
```

### Issue: No Data in Analytics Collections

**Cause:** Analytics middleware not recording data.

**Check:**
```bash
# 1. Check server logs
tail -f backend/backend.log | grep -i analytics

# 2. Verify middleware is installed
grep -n "analyticsMiddleware" backend/server.js

# 3. Check for errors in service
grep -n "Analytics recording error" backend/backend.log
```

**Fix:**
```bash
# Restart server
pkill -f "node.*server.js"
cd backend && node server.js
```

### Issue: Slow Query Performance

**Cause:** Firestore indexes not created.

**Check:**
```bash
# List indexes
firebase firestore:indexes

# Expected: All analytics indexes listed
```

**Fix:**
```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Wait 5-10 minutes for creation
```

### Issue: "Index required" Error

**Cause:** Missing index for complex query.

**Fix:**
1. Click the index creation link in error message
2. Or add index to `firestore.indexes.json`
3. Deploy: `firebase deploy --only firestore:indexes`

## Production Deployment

### 1. Environment Variables

Set in production environment:

```bash
# Vercel
vercel env add NODE_ENV production

# Or .env file
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
```

### 2. Deploy Backend

```bash
# Deploy to Vercel
vercel --prod

# Or deploy to your hosting platform
```

### 3. Schedule Cleanup Job

Set up weekly cleanup (Cloud Functions example):

```javascript
// functions/index.js
import * as functions from 'firebase-functions';
import admin from 'firebase-admin';

admin.initializeApp();

export const weeklyAnalyticsCleanup = functions.pubsub
  .schedule('0 2 * * 0') // Every Sunday at 2 AM
  .onRun(async (context) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90); // Keep 90 days
    
    const db = admin.firestore();
    const batch = db.batch();
    
    const oldRequests = await db.collection('apiRequests')
      .where('timestamp', '<', admin.firestore.Timestamp.fromDate(cutoff))
      .limit(500)
      .get();
    
    oldRequests.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    
    console.log(`Cleaned up ${oldRequests.size} old analytics records`);
  });
```

Deploy:
```bash
firebase deploy --only functions
```

### 4. Set Up Monitoring

**Recommended:**
- Set up alerts for high error rates
- Monitor analytics collection growth
- Track dashboard load times
- Alert on failed analytics writes

## Next Steps

1. ✅ Analytics system deployed and collecting data
2. 📊 Build dashboard UI (see API_ANALYTICS.md)
3. 🔔 Set up monitoring alerts
4. 📈 Export data to BigQuery for long-term storage
5. 🚀 Proceed to Phase 9: Developer Portal

## Support

For issues or questions:
- Review **API_ANALYTICS.md** for detailed documentation
- Check server logs for errors
- Verify Firestore indexes are created
- Test with curl commands first before building UI

---

**Phase 8 Complete! ✅**

Analytics infrastructure is now live and tracking all API requests.
