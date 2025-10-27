# Quick Fix: "Route not found" Error in Postman

## ❌ What Went Wrong
You're getting `{"status":"error","message":"Route not found"}` because the endpoint URL is incorrect.

## ✅ Available API Routes

### **Health & Monitoring** (No Auth Required)
```
GET  http://localhost:5055/health/status
GET  http://localhost:5055/health/live
GET  http://localhost:5055/health/ready
GET  http://localhost:5055/api/health/status
GET  http://localhost:5055/api/versions
```

### **Authentication** (Firebase Token Required)
```
GET  http://localhost:5055/api/me
GET  http://localhost:5055/api/users
POST http://localhost:5055/api/users
```

### **Core Data** (API Key or Firebase Token)
```
GET  http://localhost:5055/api/data/vendors
GET  http://localhost:5055/api/data/services
GET  http://localhost:5055/api/data/startups
POST http://localhost:5055/api/data/vendors
POST http://localhost:5055/api/data/services
```

### **Wallets** (Firebase Token Required)
```
GET  http://localhost:5055/api/wallets/mine
POST http://localhost:5055/api/wallets
GET  http://localhost:5055/api/wallets
```

### **Subscriptions** (Firebase Token Required)
```
GET  http://localhost:5055/api/subscriptions
POST http://localhost:5055/api/subscriptions
GET  http://localhost:5055/api/subscriptions/:id
```

### **API Keys** (Firebase Token Required)
```
POST http://localhost:5055/api/api-keys
GET  http://localhost:5055/api/api-keys
GET  http://localhost:5055/api/api-keys/:id
DELETE http://localhost:5055/api/api-keys/:id
```

### **External Apps** (Firebase Token Required)
```
POST http://localhost:5055/api/external-apps
GET  http://localhost:5055/api/external-apps
GET  http://localhost:5055/api/external-apps/:id
```

### **Webhooks** (Firebase Token Required)
```
POST http://localhost:5055/api/webhooks
GET  http://localhost:5055/api/webhooks
GET  http://localhost:5055/api/webhooks/:id
DELETE http://localhost:5055/api/webhooks/:id
```

### **Analytics** (Firebase Token Required)
```
GET  http://localhost:5055/api/analytics/summary
GET  http://localhost:5055/api/analytics/endpoints
GET  http://localhost:5055/api/analytics/users
POST http://localhost:5055/api/analytics/export
```

### **Monitoring** (Firebase Token Required)
```
GET  http://localhost:5055/api/monitoring/stats
GET  http://localhost:5055/api/monitoring/metrics
GET  http://localhost:5055/api/monitoring/errors
```

### **OAuth 2.0** (No Auth for Token Endpoint)
```
POST http://localhost:5055/api/oauth/token
POST http://localhost:5055/api/oauth/authorize
POST http://localhost:5055/api/oauth/introspect
POST http://localhost:5055/api/oauth/revoke
```

### **Audit Logs** (Admin Only)
```
GET  http://localhost:5055/api/audit-logs
GET  http://localhost:5055/api/audit-logs/:id
```

### **GraphQL** (Firebase Token or API Key)
```
POST http://localhost:5055/graphql
GET  http://localhost:5055/graphql  (GraphQL Playground)
```

---

## 🔧 Troubleshooting Steps

### 1. **Check Your URL Format**
```
❌ WRONG: http://localhost:5055/vendors
❌ WRONG: http://localhost:5055/data/vendors
✅ CORRECT: http://localhost:5055/api/data/vendors
```

### 2. **Check for Trailing Slashes**
```
✅ CORRECT: http://localhost:5055/api/health/status
❌ MIGHT FAIL: http://localhost:5055/api/health/status/
```

### 3. **Verify Server is Running**
```bash
# Check if server is running on port 5055
lsof -ti:5055

# If not running, start it:
node backend/server.js
```

### 4. **Check HTTP Method**
```
❌ WRONG: POST http://localhost:5055/api/data/vendors (when you want to GET)
✅ CORRECT: GET http://localhost:5055/api/data/vendors
```

### 5. **API Versioning (Optional)**
The server supports API versioning. You can add `/v1/` or `/v2/` in the URL:
```
✅ Works: http://localhost:5055/api/data/vendors
✅ Also works: http://localhost:5055/v1/api/data/vendors
✅ Also works: http://localhost:5055/api/v1/data/vendors
```

---

## 🎯 Quick Test Sequence

**Step 1: Test Health (No Auth)**
```
GET http://localhost:5055/health/status
Expected: 200 OK with server status
```

**Step 2: Test Authentication**
```
GET http://localhost:5055/api/me
Headers:
  Authorization: Bearer {{firebase_token}}
Expected: 200 OK with user info
```

**Step 3: Test API Key**
```
GET http://localhost:5055/api/data/vendors
Headers:
  X-API-Key: {{api_key}}
Expected: 200 OK with vendor list
```

**Step 4: Test Data Retrieval**
```
GET http://localhost:5055/api/data/services
Headers:
  X-API-Key: {{api_key}}
Expected: 200 OK with services list
```

---

## 🚨 Common Mistakes

### Mistake #1: Missing `/api/` prefix
```
❌ http://localhost:5055/wallets/mine
✅ http://localhost:5055/api/wallets/mine
```

### Mistake #2: Wrong authentication header
```
❌ Headers: { "X-Firebase-Token": "..." }
✅ Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Mistake #3: Using wrong HTTP method
```
❌ POST http://localhost:5055/api/data/vendors (to get list)
✅ GET http://localhost:5055/api/data/vendors
```

### Mistake #4: Missing authentication
```
❌ GET http://localhost:5055/api/me (no headers)
✅ GET http://localhost:5055/api/me
    Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

---

## 📋 Next Steps

1. **Tell me which endpoint you were trying to access** - Share the exact URL
2. **Share the HTTP method** - GET, POST, PUT, DELETE?
3. **Share your headers** - What authentication are you using?

Then I can help you fix the specific issue!

---

## 🔑 Your Credentials (Quick Copy)

```
Base URL: http://localhost:5055
Firebase Token: eyJhbGciOiJSUzI1NiIsImtpZCI6IjdlYTA5ZDA1NzI2MmU2M2U2MmZmNzNmMDNlMDRhZDI5ZDg5Zjg5MmEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiMjJPblNsb2FuZSBEaWdpdGFsIFRlYW0iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSnZMOTFDRG9JOWRySHViVEQxX3FMbWxJQVE2ZnpySXFsWnRXSkdlbEdBa29wb1NRPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Nsb2FuZS1odWIiLCJhdWQiOiJzbG9hbmUtaHViIiwiYXV0aF90aW1lIjoxNzYxNTU2MTM5LCJ1c2VyX2lkIjoiZHVGZ2hLUlloeVJGVWhsQlJtNjZpTUxLZ2gyMiIsInN1YiI6ImR1RmdoS1JZaHlSRlVobEJSbTY2aU1MS2doMjIiLCJpYXQiOjE3NjE1NTYxMzksImV4cCI6MTc2MTU1OTczOSwiZW1haWwiOiIyMm9uc2xvYW5lZGlnaXRhbHRlYW1AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTc0NDcwMDQ4MTE0ODM4NzY4MzkiXSwiZW1haWwiOlsiMjJvbnNsb2FuZWRpZ2l0YWx0ZWFtQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.wmFPRUIubQgakZLV15R4bX9ZYf8Fg2UYSv4A1kzuSP31QUS51-p-1G9eUTwhnOa7UWMdWHSkSzbjJGA53SDByXaIj8j19RjMKZmp0PeRm-SdUnvb6bOkb2y7eXHrfteTul0KtBUywvGwx7kV23cq5opwZmLAwCnRbOKQZHh1a1_Sz74EESU00K-4dVUwuUt3tzT2_SRZEt1cfBzO2AaDWiztQjrNOdJtBQC7ydNk-jvhMKH4o4AYneYBfSC4e7p6XB5vis82TrIa_peURAw9Fst7KOnZi_I7x3U8Yj0JslU9lLEmK6vY4YcCJvDh_J7T6FphuZd3j3csx21JDlR2xg
API Key: d5ac8c153592bf1e7cbc28f451edb71245cf0e90229ce202bed503e98a610a08
```

**Expires:** Firebase token expires at 12:09 PM (check current time!)

---

## 💡 Pro Tip
If your Firebase token expired (after 1 hour), regenerate it:
```bash
python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com '#sloane@22gEn'
```
