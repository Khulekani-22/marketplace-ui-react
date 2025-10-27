# 🚀 **Quick Testing Guide for Your Postman Collection**

## 📌 Your Postman Link
https://khulekani-22-1484809.postman.co/workspace/My-Workspace~d63ac943-fc58-4da6-b36b-83f09c0025db/collection/49552589-18690b8d-1718-4df2-8299-882d491c0c72

---

## ⚙️ Setup (One-Time Configuration)

### Step 1: Set Collection Variables

1. In Postman, open your collection: **"Sloane Marketplace API - Complete (All 12 Phases)"**
2. Click the **Variables** tab
3. Set these variables:

| Variable | Current Value |
|----------|---------------|
| `base_url` | `http://localhost:5055` |
| `api_base` | `http://localhost:5055/api` |
| `firebase_token` | `eyJhbGciOiJSUzI1NiIsImtpZCI6IjdlYTA5ZDA1NzI2MmU2M2U2MmZmNzNmMDNlMDRhZDI5ZDg5Zjg5MmEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiMjJPblNsb2FuZSBEaWdpdGFsIFRlYW0iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSnZMOTFDRG9JOWRySHViVEQxX3FMbWxJQVE2ZnpySXFsWnRXSkdlbEdBa29wb1NRPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Nsb2FuZS1odWIiLCJhdWQiOiJzbG9hbmUtaHViIiwiYXV0aF90aW1lIjoxNzYxNDc3ODk5LCJ1c2VyX2lkIjoiZHVGZ2hLUlloeVJGVWhsQlJtNjZpTUxLZ2gyMiIsInN1YiI6ImR1RmdoS1JZaHlSRlVobEJSbTY2aU1MS2doMjIiLCJpYXQiOjE3NjE0Nzc4OTksImV4cCI6MTc2MTQ4MTQ5OSwiZW1haWwiOiIyMm9uc2xvYW5lZGlnaXRhbHRlYW1AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTc0NDcwMDQ4MTE0ODM4NzY4MzkiXSwiZW1haWwiOlsiMjJvbnNsb2FuZWRpZ2l0YWx0ZWFtQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.abwHIIn62QQ2yfFORh2Y_v1QTUqDQk83NL0AR18Pw5HGHa9vx75oKXbS_ACmF5DE4DYhxUJN6z2IxxgTxVtsfoYcXuOrzO55gS2Jw7t6mbELdesUxJsn8FuOugtImIALvj1tI_gosMStvweTxwShQp3trZsppLblpBAQk63_LyZzX0UOO5zn8kLqaWZ9vvbY6yXnzOGmNJjCwVQN-WUmuu3YwrfFW1CXx6I7StC4s9repT4uP8A5lY3BptJhABP-fWhXvMGL7QjnyxKvBAkGgjA3Q6aWpilSb6q0J8b3q8Y8OrMSnXGY0GeLOvIIRhCbbAK5JITVt-hXTLAZtnJE5A` |

4. Click **Save** (top right corner)

---

## 🧪 Testing Workflow

### ✅ Phase 1: Test Without Authentication (No Token Required)

These endpoints work without any authentication:

#### 1.1 Health & Monitoring

**Test Request:**
```
GET http://localhost:5055/health/live
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

**In Postman:**
- Go to folder: **"Phase 12: Health & Monitoring"**
- Click: **"Liveness Probe"**
- Click **Send** button
- ✅ Should return 200 OK

#### 1.2 Try Other Health Endpoints

- **Readiness Probe**: `/health/ready`
- **Health Status**: `/health/status` (detailed info)
- **Prometheus Metrics**: `/api/monitoring/metrics`
- **Performance Stats**: `/api/monitoring/stats`

---

### ✅ Phase 2: Test With Firebase Authentication

These endpoints require your `firebase_token`:

#### 2.1 Get Current User

**Test Request:**
```
GET http://localhost:5055/api/me
Authorization: Bearer {{firebase_token}}
```

**In Postman:**
- Go to folder: **"REST API - Users"**
- Click: **"Get Current User"**
- Make sure Authorization is set to "Inherit from parent" (uses collection's firebase_token)
- Click **Send**
- ✅ Should return your user profile

**Expected Response:**
```json
{
  "uid": "duFghKRYhyRFUhlBRm66iMLKgh22",
  "email": "22onsloanedigitalteam@gmail.com",
  "name": "22OnSloane Digital Team"
}
```

#### 2.2 Get All Services

**Test Request:**
```
GET http://localhost:5055/api/services
Authorization: Bearer {{firebase_token}}
```

**In Postman:**
- Go to folder: **"REST API - Services"**
- Click: **"Get All Services"**
- Click **Send**
- ✅ Should return list of services

---

### ✅ Phase 3: Test API Key Authentication

#### 3.1 Create an API Key

**In Postman:**
- Go to folder: **"Phase 2: API Key Management"**
- Click: **"Create API Key"**
- Click **Send**

**Request Body (already set):**
```json
{
  "name": "My Test App",
  "description": "Testing API key authentication",
  "rateLimit": "standard",
  "allowedOrigins": ["https://myapp.com"],
  "scopes": ["services:read", "vendors:read"]
}
```

**Expected Response:**
```json
{
  "id": "ak_xxxxx",
  "key": "YOUR_API_KEY_HERE",  // ← COPY THIS!
  "name": "My Test App",
  "tier": "standard",
  "limit": 1000
}
```

**📝 IMPORTANT:** Copy the `key` value!

#### 3.2 Use the API Key

1. In Postman collection, go to **Variables** tab
2. Set `api_key` = `[paste your API key]`
3. Save

4. Test it:
   - Go to: **"Phase 2: API Key Management" → "Test API Key Auth"**
   - This request uses `X-API-Key` header instead of Bearer token
   - Click **Send**
   - ✅ Should return services list

---

### ✅ Phase 4: Test GraphQL API

#### 4.1 Query Services via GraphQL

**In Postman:**
- Go to folder: **"Phase 11: GraphQL"**
- Click: **"GraphQL - Get Services"**
- Click **Send**

**GraphQL Query:**
```graphql
query GetServices($limit: Int) {
  services(pagination: { limit: $limit }) {
    edges {
      node {
        id
        name
        description
        price
        status
      }
    }
  }
}
```

**Variables:**
```json
{
  "limit": 10
}
```

**Expected Response:**
```json
{
  "data": {
    "services": {
      "edges": [
        {
          "node": {
            "id": "service_123",
            "name": "Premium Consulting",
            "description": "Expert consulting",
            "price": 299.99,
            "status": "ACTIVE"
          }
        }
      ]
    }
  }
}
```

---

### ✅ Phase 5: Test Webhooks

#### 5.1 Create a Webhook

**In Postman:**
- Go to folder: **"Phase 6: Webhooks"**
- Click: **"Create Webhook"**
- Modify the URL in the body to your webhook endpoint (or use a test URL like `https://webhook.site`)
- Click **Send**

**Request Body:**
```json
{
  "url": "https://webhook.site/your-unique-id",
  "events": ["service.created", "service.updated"],
  "secret": "my_webhook_secret_123",
  "description": "Test webhook"
}
```

**Expected Response:**
```json
{
  "id": "wh_xxxxx",
  "url": "https://webhook.site/your-unique-id",
  "events": ["service.created", "service.updated"],
  "secret": "whsec_xxxxx",
  "active": true
}
```

#### 5.2 List Your Webhooks

- Click: **"List Webhooks"**
- Click **Send**
- ✅ Should show all your webhooks

---

### ✅ Phase 6: Test Analytics

#### 6.1 Get Usage Statistics

**In Postman:**
- Go to folder: **"Phase 8: Analytics"**
- Click: **"Get Usage Overview"**
- Click **Send**

**Expected Response:**
```json
{
  "period": "7d",
  "totalRequests": 1234,
  "successfulRequests": 1200,
  "failedRequests": 34,
  "averageResponseTime": 45,
  "topEndpoints": [...]
}
```

---

### ✅ Phase 7: Test OAuth 2.0

#### 7.1 Create OAuth Client

**In Postman:**
- Go to folder: **"Phase 10: OAuth 2.0"**
- Click: **"Create OAuth Client"**
- Click **Send**

**Request Body:**
```json
{
  "name": "My OAuth App",
  "redirectUris": ["https://myapp.com/callback"],
  "scopes": ["services:read", "services:write"],
  "description": "OAuth test app"
}
```

**Expected Response:**
```json
{
  "clientId": "oauth_client_xxxxx",
  "clientSecret": "oauth_secret_xxxxx",  // ← SAVE THIS!
  "name": "My OAuth App",
  "redirectUris": ["https://myapp.com/callback"]
}
```

#### 7.2 Get Access Token (Client Credentials)

- Save the `clientId` and `clientSecret` to collection variables
- Click: **"Client Credentials Flow"**
- Update the body with your client credentials
- Click **Send**

**Expected Response:**
```json
{
  "access_token": "oauth_token_xxxxx",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "services:read services:write"
}
```

---

## 🔄 When Your Firebase Token Expires

**Token expires after 1 hour.** When you get `401 Unauthorized`:

### Get a Fresh Token:

```bash
python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com '#sloane@22gEn'
```

Then update the `firebase_token` variable in Postman!

---

## 📊 Testing Checklist

- [ ] Health endpoints work (no auth)
- [ ] Get current user (with Firebase token)
- [ ] Get services list
- [ ] Create API key
- [ ] Test with API key authentication
- [ ] Create a webhook
- [ ] List webhooks
- [ ] GraphQL query for services
- [ ] Get analytics stats
- [ ] Create OAuth client
- [ ] Get OAuth access token

---

## 🐛 Troubleshooting

### ❌ Error: "Connection Refused"
**Solution:** Make sure your backend server is running:
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/firebase\ sloane\ hub/ui/marketplace-ui-react
node backend/server.js
```

### ❌ Error: "401 Unauthorized"
**Solutions:**
1. Check if `firebase_token` variable is set in Postman
2. Token might be expired - get a fresh one:
   ```bash
   python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com '#sloane@22gEn'
   ```
3. Make sure Authorization is set to "Inherit from parent"

### ❌ Error: "Network Error"
**Solutions:**
1. Check if server is running on port 5055
2. Verify `base_url` variable: `http://localhost:5055`
3. Try testing health endpoint first: `GET http://localhost:5055/health/live`

### ❌ Error: "Invalid API Key"
**Solutions:**
1. Create a new API key using the "Create API Key" request
2. Copy the returned key value
3. Set it in the `api_key` variable
4. Make sure request is using `X-API-Key` header

---

## 💡 Pro Tips

1. **Start Simple**: Test health endpoints first (no auth needed)
2. **Check Variables**: Always verify your variables are saved
3. **Use Folders**: Test endpoints folder by folder
4. **Save Responses**: Use Postman's "Save Response" for reference
5. **Check Console**: Use Postman Console (bottom left) to see full request/response
6. **Test Scripts**: Some requests have test scripts that auto-validate responses

---

## 🎯 Quick Test Sequence (5 Minutes)

1. ✅ **Health Check**: `GET /health/live` → Should return `{"status": "ok"}`
2. ✅ **Get User**: `GET /api/me` → Returns your profile
3. ✅ **Get Services**: `GET /api/services` → Returns services list
4. ✅ **Create API Key**: `POST /api/api-keys` → Returns new API key
5. ✅ **Test GraphQL**: `POST /graphql` → Returns GraphQL response

**That's it! You're testing all 12 phases!** 🚀

---

## 📚 Additional Resources

- **GET_FIREBASE_TOKEN.md** - Complete token guide
- **FIREBASE_TOKEN_QUICK_START.md** - 60-second token guide
- **PHASE_12_COMPLETE.md** - Full API documentation
- **.env.firebase-token** - Saved token file (source it: `source .env.firebase-token`)

---

## 🆘 Still Need Help?

Run the diagnostic:
```bash
curl http://localhost:5055/health/status
```

This shows:
- ✅ Server status
- ✅ Firestore connection
- ✅ Redis connection
- ✅ Memory usage
- ✅ Uptime

Happy Testing! 🎉
