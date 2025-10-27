# 🧪 Postman API Testing Guide - All 12 Phases

## ✅ Current Status
- **Phase 12**: Health & Monitoring - ✅ **WORKING**
- **Backend Server**: Running on `http://localhost:5055`
- **Firebase Auth**: Token generated and ready

---

## 🎯 Testing Strategy

We'll test in this order:
1. **Phase 12** - Health (Already working ✅)
2. **Phase 1** - Authentication & User Management
3. **Phase 2** - Core Data APIs (Vendors, Services, etc.)
4. **Phase 3** - Wallet & Subscriptions
5. **Phase 4** - Advanced Features
6. **Phases 5-11** - Additional Features

---

## 📋 Pre-Testing Checklist

### ✅ Verify Your Postman Environment Variables

Make sure these are set in your Postman environment:

| Variable | Value | Status |
|----------|-------|--------|
| `base_url` | `http://localhost:5055` | Required |
| `firebase_token` | Your Firebase ID token | Required |
| `api_key` | (Will be generated in Phase 2) | Optional |

### Get Fresh Firebase Token (If Needed)

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com '#sloane@22gEn'
```

Copy the token and update `firebase_token` in your Postman environment.

---

## 🔥 PHASE 1: Authentication & User Management

### Test Order:

#### 1.1 Get Current User Info ⭐ START HERE
```
GET {{base_url}}/api/me
Headers:
  Authorization: Bearer {{firebase_token}}
```

**Expected Response:**
```json
{
  "uid": "duFghKRYhyRFUhlBRm66iMLKgh22",
  "email": "22onsloanedigitalteam@gmail.com",
  "role": "admin",
  "tenantId": "22onsloane"
}
```

**✅ Success Criteria:**
- Status: 200
- Returns your user info
- Shows your role (admin/member/vendor)

**❌ If it fails:**
- Check Authorization header has `Bearer ` prefix
- Get fresh Firebase token
- Verify backend is running

---

#### 1.2 List All Users (Admin Only)
```
GET {{base_url}}/api/users
Headers:
  Authorization: Bearer {{firebase_token}}
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "uid": "...",
      "email": "...",
      "role": "..."
    }
  ]
}
```

---

#### 1.3 Get Specific User
```
GET {{base_url}}/api/users/{{user_id}}
Headers:
  Authorization: Bearer {{firebase_token}}
```

Replace `{{user_id}}` with actual user UID from previous response.

---

#### 1.4 Update User Profile
```
PATCH {{base_url}}/api/users/{{user_id}}
Headers:
  Authorization: Bearer {{firebase_token}}
  Content-Type: application/json
Body:
{
  "displayName": "Updated Name",
  "phoneNumber": "+1234567890"
}
```

---

## 📊 PHASE 2: Core Data APIs

### Test Order:

#### 2.1 Get All Vendors ⭐ START HERE
```
GET {{base_url}}/api/data/vendors
```

**No Auth Required** - Public endpoint

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "name": "...",
      "category": "...",
      "description": "..."
    }
  ]
}
```

---

#### 2.2 Get Specific Vendor
```
GET {{base_url}}/api/data/vendors/{{vendor_id}}
```

Use vendor ID from previous response.

---

#### 2.3 Create New Vendor (Auth Required)
```
POST {{base_url}}/api/data/vendors
Headers:
  Authorization: Bearer {{firebase_token}}
  Content-Type: application/json
Body:
{
  "name": "Test Vendor via Postman",
  "email": "testvendor@example.com",
  "category": "Technology",
  "description": "Testing vendor creation",
  "services": ["Consulting", "Development"],
  "contactPhone": "+1234567890"
}
```

---

#### 2.4 Get All Services
```
GET {{base_url}}/api/data/services
```

**No Auth Required** - Public endpoint

---

#### 2.5 Get All Startups
```
GET {{base_url}}/api/data/startups
```

**No Auth Required** - Public endpoint

---

## 💰 PHASE 3: Wallet & Subscriptions

### Test Order:

#### 3.1 Get My Wallet ⭐ START HERE
```
GET {{base_url}}/api/wallets/mine
Headers:
  Authorization: Bearer {{firebase_token}}
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "id": "22onsloane:...",
    "balance": 1000,
    "currency": "ZAR",
    "transactions": [...]
  }
}
```

---

#### 3.2 Get Wallet Balance
```
GET {{base_url}}/api/wallets/mine/balance
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 3.3 Get Wallet Transactions
```
GET {{base_url}}/api/wallets/mine/transactions
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 3.4 Get My Subscriptions
```
GET {{base_url}}/api/subscriptions/mine
Headers:
  Authorization: Bearer {{firebase_token}}
```

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "vendorId": "...",
      "status": "active",
      "startDate": "...",
      "endDate": "..."
    }
  ]
}
```

---

#### 3.5 List All Subscriptions (Public)
```
GET {{base_url}}/api/subscriptions
```

Shows available subscription plans.

---

#### 3.6 Subscribe to Vendor
```
POST {{base_url}}/api/subscriptions
Headers:
  Authorization: Bearer {{firebase_token}}
  Content-Type: application/json
Body:
{
  "vendorId": "vendor_id_here",
  "plan": "monthly",
  "amount": 100
}
```

---

## 🔑 PHASE 4: API Keys & External Apps

### Test Order:

#### 4.1 List My API Keys ⭐ START HERE
```
GET {{base_url}}/api/api-keys
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 4.2 Create New API Key
```
POST {{base_url}}/api/api-keys
Headers:
  Authorization: Bearer {{firebase_token}}
  Content-Type: application/json
Body:
{
  "name": "Postman Test Key",
  "tier": "standard",
  "permissions": ["read", "write"],
  "expiresIn": "30d"
}
```

**Save the API key returned!** You'll need it for testing.

---

#### 4.3 Test API Key Authentication
```
GET {{base_url}}/api/data/vendors
Headers:
  X-API-Key: {{your_generated_api_key}}
```

---

#### 4.4 List External Apps (Admin)
```
GET {{base_url}}/api/external-apps
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 4.5 Register External App
```
POST {{base_url}}/api/external-apps
Headers:
  Authorization: Bearer {{firebase_token}}
  Content-Type: application/json
Body:
{
  "name": "Postman Test App",
  "appIdentifier": "postman-test-app",
  "description": "Testing external app registration",
  "allowedOrigins": ["http://localhost:3000"],
  "webhookUrl": "https://webhook.site/your-unique-url"
}
```

---

## 🔔 PHASE 5: Webhooks

### Test Order:

#### 5.1 List My Webhooks
```
GET {{base_url}}/api/webhooks
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 5.2 Create Webhook
```
POST {{base_url}}/api/webhooks
Headers:
  Authorization: Bearer {{firebase_token}}
  Content-Type: application/json
Body:
{
  "url": "https://webhook.site/your-unique-url",
  "events": ["subscription.created", "wallet.transaction"],
  "description": "Test webhook from Postman",
  "secret": "my-webhook-secret-123"
}
```

**Get a webhook URL**: Go to https://webhook.site/ to get a test URL

---

#### 5.3 Test Webhook
```
POST {{base_url}}/api/webhooks/{{webhook_id}}/test
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

## 📈 PHASE 6: Analytics

### Test Order:

#### 6.1 Get Analytics Overview (Admin)
```
GET {{base_url}}/api/analytics/overview
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 6.2 Get User Activity
```
GET {{base_url}}/api/analytics/users/activity
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 6.3 Get Revenue Analytics
```
GET {{base_url}}/api/analytics/revenue
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

## 📊 PHASE 7: Monitoring

### Test Order:

#### 7.1 Get System Stats
```
GET {{base_url}}/api/monitoring/stats
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 7.2 Get Metrics (Admin)
```
GET {{base_url}}/api/monitoring/metrics
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

## 🔐 PHASE 8: OAuth 2.0

### Test Order:

#### 8.1 Get OAuth Token (Client Credentials)
```
POST {{base_url}}/api/oauth/token
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  grant_type=client_credentials
  client_id={{your_client_id}}
  client_secret={{your_client_secret}}
```

---

#### 8.2 Authorize (Authorization Code Flow)
```
GET {{base_url}}/api/oauth/authorize?client_id={{client_id}}&redirect_uri={{redirect_uri}}&response_type=code&state=random_state_string
```

---

## 🎓 PHASE 9: LMS (Learning Management)

### Test Order:

#### 9.1 Get All Checkpoints
```
GET {{base_url}}/api/lms/checkpoints
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 9.2 Create Checkpoint
```
POST {{base_url}}/api/lms/checkpoint
Headers:
  Authorization: Bearer {{firebase_token}}
  Content-Type: application/json
Body:
{
  "name": "Test Checkpoint",
  "data": {
    "lesson": "Introduction to APIs",
    "progress": 75
  }
}
```

---

## 👥 PHASE 10: Tenants (Multi-tenancy)

### Test Order:

#### 10.1 Get All Tenants (Admin)
```
GET {{base_url}}/api/tenants
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 10.2 Create New Tenant
```
POST {{base_url}}/api/tenants
Headers:
  Authorization: Bearer {{firebase_token}}
  Content-Type: application/json
Body:
{
  "name": "Test Organization",
  "slug": "test-org",
  "settings": {
    "theme": "dark",
    "features": ["wallet", "subscriptions"]
  }
}
```

---

## 📝 PHASE 11: Audit Logs

### Test Order:

#### 11.1 Get Audit Logs (Admin)
```
GET {{base_url}}/api/audit-logs
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

#### 11.2 Get Audit Logs with Filters
```
GET {{base_url}}/api/audit-logs?action=POST&targetType=vendors&startDate=2025-10-01
Headers:
  Authorization: Bearer {{firebase_token}}
```

---

## 🎯 PHASE 12: Health & Monitoring ✅ WORKING

You've already tested these successfully!

#### 12.1 Liveness Probe ✅
```
GET {{base_url}}/health/live
```

#### 12.2 Readiness Probe ✅
```
GET {{base_url}}/health/ready
```

#### 12.3 Detailed Status ✅
```
GET {{base_url}}/health/status
```

---

## 📊 Testing Progress Tracker

Use this to track your progress:

### Phase 1: Authentication ⭐ Test This Next
- [ ] 1.1 Get Current User (`/api/me`)
- [ ] 1.2 List All Users
- [ ] 1.3 Get Specific User
- [ ] 1.4 Update User Profile

### Phase 2: Core Data
- [ ] 2.1 Get All Vendors
- [ ] 2.2 Get Specific Vendor
- [ ] 2.3 Create New Vendor
- [ ] 2.4 Get All Services
- [ ] 2.5 Get All Startups

### Phase 3: Wallet & Subscriptions
- [ ] 3.1 Get My Wallet
- [ ] 3.2 Get Wallet Balance
- [ ] 3.3 Get Wallet Transactions
- [ ] 3.4 Get My Subscriptions
- [ ] 3.5 List All Subscriptions
- [ ] 3.6 Subscribe to Vendor

### Phase 4: API Keys
- [ ] 4.1 List My API Keys
- [ ] 4.2 Create New API Key
- [ ] 4.3 Test API Key Authentication
- [ ] 4.4 List External Apps
- [ ] 4.5 Register External App

### Phase 5: Webhooks
- [ ] 5.1 List My Webhooks
- [ ] 5.2 Create Webhook
- [ ] 5.3 Test Webhook

### Phase 6: Analytics
- [ ] 6.1 Get Analytics Overview
- [ ] 6.2 Get User Activity
- [ ] 6.3 Get Revenue Analytics

### Phase 7: Monitoring
- [ ] 7.1 Get System Stats
- [ ] 7.2 Get Metrics

### Phase 8: OAuth
- [ ] 8.1 Get OAuth Token
- [ ] 8.2 Authorize

### Phase 9: LMS
- [ ] 9.1 Get All Checkpoints
- [ ] 9.2 Create Checkpoint

### Phase 10: Tenants
- [ ] 10.1 Get All Tenants
- [ ] 10.2 Create New Tenant

### Phase 11: Audit Logs
- [ ] 11.1 Get Audit Logs
- [ ] 11.2 Get Audit Logs with Filters

### Phase 12: Health & Monitoring ✅
- [x] 12.1 Liveness Probe
- [x] 12.2 Readiness Probe
- [x] 12.3 Detailed Status

---

## 🔧 Troubleshooting Common Issues

### Issue: 401 Unauthorized
**Solution:**
1. Get fresh Firebase token: `python3 scripts/get-firebase-token.py ...`
2. Update `firebase_token` in Postman environment
3. Verify Authorization header: `Bearer {{firebase_token}}`

### Issue: 403 Forbidden
**Solution:**
- You don't have permission for this endpoint
- Some endpoints require admin role
- Check your user role: `GET /api/me`

### Issue: 404 Not Found
**Solution:**
- Verify the endpoint URL is correct
- Check if resource ID exists
- Ensure backend is running on correct port

### Issue: 500 Internal Server Error
**Solution:**
- Check backend console for error logs
- Verify request body format is correct
- Check if required fields are provided

### Issue: CORS Error
**Solution:**
- Backend should allow `http://localhost` origins
- Check CORS configuration in backend

---

## 📈 Testing Best Practices

1. **Start with Phase 1** (`GET /api/me`) - Verify authentication works
2. **Test public endpoints first** - No auth required, easier to debug
3. **Save generated IDs** - Use them in subsequent requests
4. **Check response status codes** - 200/201 = success, 4xx = client error, 5xx = server error
5. **Read error messages** - They tell you exactly what's wrong
6. **Use Postman Tests** - Automate validation with test scripts

---

## 🎯 Quick Test Script (For Postman Tests Tab)

Add this to your request "Tests" tab in Postman to auto-validate:

```javascript
// Test: Status code is successful
pm.test("Status code is 2xx", function () {
    pm.response.to.have.status(200) || 
    pm.response.to.have.status(201);
});

// Test: Response has data
pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('status');
});

// Test: Response time is acceptable
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

---

## 🚀 Next Steps

**Recommended Testing Order:**

1. ✅ **Phase 12** - Health (Already working!)
2. ⭐ **Phase 1** - Test `/api/me` endpoint next
3. 📊 **Phase 2** - Test public vendors/services endpoints
4. 💰 **Phase 3** - Test wallet and subscriptions
5. 🔑 **Phase 4** - Generate and test API keys
6. Continue with remaining phases...

---

## 📞 Need Help?

**Backend not responding?**
```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
node backend/server.js
```

**Need fresh token?**
```bash
python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com '#sloane@22gEn'
```

**Check what's running:**
```bash
lsof -ti:5055  # Should show process ID if backend is running
curl http://localhost:5055/health/live  # Quick health check
```

---

## ✨ Success Metrics

You'll know you're successful when:
- ✅ All Phase 12 endpoints return 200
- ✅ `/api/me` returns your user info
- ✅ Public endpoints work without auth
- ✅ Protected endpoints work with Firebase token
- ✅ You can create/read/update/delete resources
- ✅ API keys work for authentication
- ✅ Webhooks receive test events

---

**Happy Testing! 🎉**

Start with **Phase 1: Test 1.1** - `GET {{base_url}}/api/me` and let me know if you hit any issues!
