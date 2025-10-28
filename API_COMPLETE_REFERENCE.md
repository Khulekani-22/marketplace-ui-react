# 📡 Complete API Endpoint Reference

**Base URL:** `https://marketplace-firebase.vercel.app`  
**Last Updated:** October 28, 2025

---

## ✅ Working Public APIs (No Auth Required)

| Endpoint | Status | Description |
|----------|--------|-------------|
| `/api/health` | ✅ 200 OK | Health check endpoint |
| `/api/health/status` | ✅ 200 OK | Detailed health status with metrics |
| `/health` | ✅ 200 OK | Alternative health check |
| `/api/data/services` | ✅ 200 OK | List all marketplace services |
| `/api/data/vendors` | ✅ 200 OK | List all vendors |
| `/api/data/startups` | ✅ 200 OK | List all startups |
| `/api/tenants` | ✅ 200 OK | List tenants |
| `/api/users` | ✅ 200 OK | List users |
| `/api/audit-logs` | ✅ 200 OK | View audit logs |
| `/api/versions` | ✅ 200 OK | API version information |
| `/api/mentorship` | ✅ 200 OK | Mentorship programs/listings |

**Total Working Public APIs: 11**

---

## 🔒 Protected APIs (Auth Required - 401/403)

| Endpoint | Status | Description |
|----------|--------|-------------|
| `/api/admin` | 🔒 401 | Admin panel operations |
| `/api/wallets` | 🔒 401 | User wallet management |
| `/api/messages` | 🔒 401 | Messaging system |
| `/api/api-keys` | 🔒 401 | API key management |
| `/api/external-apps` | 🔒 401 | External app integrations |
| `/api/webhooks` | 🔒 401 | Webhook management |
| `/api/me` | 🔒 401 | Current user profile |
| `/api/subscriptions/my` | 🔒 401 | User's subscriptions |

**Total Protected APIs: 8**

---

## ❌ Not Deployed/Not Found (404)

These routes exist in your backend code but are not responding on Vercel:

| Endpoint | Status | Possible Reason |
|----------|--------|-----------------|
| `/api/subscriptions` | ❌ 404 | Route not deployed or serverless issue |
| `/api/assistant/api/messages` | ❌ 404 | Incorrect path (should be `/api/assistant/messages`) |
| `/api/integrity` | ❌ 404 | Route not deployed |
| `/api/payments` | ❌ 404 | Route not deployed |
| `/api/lms` | ❌ 404 | LMS routes not deployed |
| `/api/sync` | ❌ 404 | Sync routes not deployed |
| `/api/developer` | ❌ 404 | Developer portal not deployed |
| `/api/oauth` | ❌ 404 | OAuth routes not deployed |
| `/api/analytics` | ❌ 404 | Analytics not deployed |
| `/api/monitoring` | ❌ 404 | Monitoring not deployed |
| `/api/assistant/messages` | ❌ 404 | Assistant messages not deployed |
| `/api/integrity/check` | ❌ 404 | Integrity check not deployed |

**Total Missing: 12**

---

## 📊 Summary Statistics

- ✅ **Working APIs:** 19 (11 public + 8 protected)
- ❌ **Missing APIs:** 12
- 📦 **Total APIs in Backend:** 31+

---

## 🔍 APIs You Were Missing in Your List

Here are the additional working APIs you didn't list:

### Public APIs:
1. `/api/versions` - ✅ Working
2. `/api/mentorship` - ✅ Working
3. `/health` - ✅ Working (duplicate of /api/health)

### Protected APIs (require auth):
4. `/api/messages` - 🔒 Auth required
5. `/api/api-keys` - 🔒 Auth required
6. `/api/external-apps` - 🔒 Auth required
7. `/api/webhooks` - 🔒 Auth required
8. `/api/me` - 🔒 Auth required

### Not Working (but in backend):
9. `/api/payments` - ❌ Not deployed
10. `/api/lms` - ❌ Not deployed
11. `/api/sync` - ❌ Not deployed
12. `/api/developer` - ❌ Not deployed
13. `/api/oauth` - ❌ Not deployed
14. `/api/analytics` - ❌ Not deployed
15. `/api/monitoring` - ❌ Not deployed

---

## 🛠️ Detailed API Information

### Health & Status
```bash
GET /api/health
GET /api/health/status
GET /health
```
Returns server health metrics, uptime, cache status, etc.

### Data APIs
```bash
GET /api/data/services?page=1&pageSize=20
GET /api/data/vendors?page=1&pageSize=20
GET /api/data/startups?page=1&pageSize=20
```
Returns paginated data with items, total count, metadata.

### User Management
```bash
GET /api/users                    # List all users (public)
GET /api/me                       # Current user (🔒 auth required)
GET /api/tenants                  # List tenants
```

### Admin & Monitoring
```bash
GET /api/admin                    # 🔒 Admin operations
GET /api/audit-logs               # Audit trail
GET /api/versions                 # API version info
```

### Messaging & Communication
```bash
GET /api/messages                 # 🔒 User messages
GET /api/mentorship               # Mentorship programs
```

### Developer Tools
```bash
GET /api/api-keys                 # 🔒 API key management
GET /api/external-apps            # 🔒 External integrations
GET /api/webhooks                 # 🔒 Webhook management
```

---

## 🚨 Issues Found

### 1. Subscriptions Not Working
**Problem:** `/api/subscriptions` returns 404  
**Expected:** Should return user subscriptions  
**Status:** Route exists in backend but not responding on Vercel

### 2. Assistant API Path Confusion
**Your Path:** `/api/assistant/api/messages`  
**Actual Path:** `/api/assistant/messages` (404) or `/api/messages` (401)  
**Status:** Route exists but path may be incorrect

### 3. Integrity Check Missing
**Problem:** `/api/integrity` returns 404  
**Expected:** Data integrity verification  
**Status:** Route exists in backend but not deployed

### 4. Many Advanced Features Not Deployed
The following features are in your backend code but not available on Vercel:
- Payments
- LMS (Learning Management System)
- Sync operations
- Developer Portal
- OAuth
- Analytics
- Monitoring

---

## 📝 Recommendations

### Priority 1: Fix Core Features
1. **Deploy Subscriptions API** - Core marketplace feature
2. **Fix Assistant/Messages paths** - Communication feature
3. **Deploy Integrity API** - Data validation

### Priority 2: Optional Features
4. Deploy Payments (if using payment features)
5. Deploy LMS (if using learning features)
6. Deploy Analytics (for tracking)

### Priority 3: Developer Features
7. Deploy Developer Portal
8. Deploy OAuth routes
9. Deploy Monitoring

---

## 🧪 Test Commands

### Test All Working APIs:
```bash
# Public APIs
curl https://marketplace-firebase.vercel.app/api/health/status
curl https://marketplace-firebase.vercel.app/api/data/services?page=1
curl https://marketplace-firebase.vercel.app/api/data/vendors
curl https://marketplace-firebase.vercel.app/api/data/startups
curl https://marketplace-firebase.vercel.app/api/tenants
curl https://marketplace-firebase.vercel.app/api/users
curl https://marketplace-firebase.vercel.app/api/audit-logs
curl https://marketplace-firebase.vercel.app/api/versions
curl https://marketplace-firebase.vercel.app/api/mentorship

# Protected APIs (will return 401 without auth)
curl https://marketplace-firebase.vercel.app/api/admin
curl https://marketplace-firebase.vercel.app/api/wallets
curl https://marketplace-firebase.vercel.app/api/messages
curl https://marketplace-firebase.vercel.app/api/me
```

### Test with Authentication:
```bash
# Replace YOUR_TOKEN with actual Firebase ID token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://marketplace-firebase.vercel.app/api/me

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://marketplace-firebase.vercel.app/api/wallets

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://marketplace-firebase.vercel.app/api/messages
```

---

## 📋 Complete API List (Alphabetical)

### Working:
1. /api/admin (🔒)
2. /api/api-keys (🔒)
3. /api/audit-logs
4. /api/data/services
5. /api/data/startups
6. /api/data/vendors
7. /api/external-apps (🔒)
8. /api/health
9. /api/health/status
10. /api/me (🔒)
11. /api/mentorship
12. /api/messages (🔒)
13. /api/subscriptions/my (🔒)
14. /api/tenants
15. /api/users
16. /api/versions
17. /api/wallets (🔒)
18. /api/webhooks (🔒)
19. /health

### Not Working:
20. /api/analytics (❌)
21. /api/assistant/api/messages (❌)
22. /api/assistant/messages (❌)
23. /api/developer (❌)
24. /api/integrity (❌)
25. /api/integrity/check (❌)
26. /api/lms (❌)
27. /api/monitoring (❌)
28. /api/oauth (❌)
29. /api/payments (❌)
30. /api/subscriptions (❌)
31. /api/sync (❌)

---

## 🎯 Next Steps

1. **Review missing APIs** - Decide which ones you need
2. **Check route files** - Verify they're being imported in server.js
3. **Check Vercel logs** - Look for deployment errors
4. **Test locally** - Confirm routes work on local backend
5. **Redeploy if needed** - Push fixes to enable missing routes

**Need help enabling specific APIs? Let me know which ones are priority!**
