# API Quick Start Guide

## 🚀 Getting Started

### Base URLs
- **Development:** `http://localhost:5055/api`
- **Production:** `https://your-domain.com/api`

### Authentication
```bash
# Get Firebase ID token first, then use it in requests
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     https://your-domain.com/api/me
```

---

## 📚 Common Use Cases

### 1. Browse Services (No Auth Required)

```bash
# List all services
GET /api/data/services?page=1&pageSize=20

# Search services
GET /api/data/services?q=consulting&category=Business

# Filter by price range
GET /api/data/services?minPrice=50&maxPrice=500

# Get featured services only
GET /api/data/services?featured=true
```

**Example Response:**
```json
{
  "page": 1,
  "pageSize": 20,
  "total": 150,
  "items": [
    {
      "id": "service-123",
      "title": "Business Consulting",
      "price": 299.99,
      "vendor": "Acme Corp",
      "rating": 4.5
    }
  ]
}
```

### 2. Vendor Management (Auth Required)

```bash
# Get my vendor listings
GET /api/data/services/mine
Headers: Authorization: Bearer TOKEN

# Create new service
POST /api/data/services
Headers: 
  Authorization: Bearer TOKEN
  Content-Type: application/json
Body:
{
  "title": "New Service",
  "description": "Description",
  "price": 99.99,
  "category": "Business"
}

# Update service
PUT /api/data/services/{id}
Headers: 
  Authorization: Bearer TOKEN
  Content-Type: application/json
Body:
{
  "price": 149.99
}
```

### 3. Subscribe to Service (Auth Required)

```bash
# Subscribe
POST /api/subscriptions/service
Headers:
  Authorization: Bearer TOKEN
  Content-Type: application/json
Body:
{
  "serviceId": "service-123",
  "scheduledDate": "2025-11-01",
  "scheduledSlot": "14:00",
  "customerName": "John Doe"
}

# View my subscriptions
GET /api/subscriptions/my
Headers: Authorization: Bearer TOKEN

# View my bookings
GET /api/subscriptions/bookings/mine
Headers: Authorization: Bearer TOKEN
```

### 4. Messaging System (Auth Required)

```bash
# Send message to vendor
POST /api/messages
Headers:
  Authorization: Bearer TOKEN
  Content-Type: application/json
Body:
{
  "listingId": "service-123",
  "vendorEmail": "vendor@example.com",
  "subject": "Question about service",
  "content": "Is this service available next week?"
}

# Get my messages
GET /api/messages?page=1
Headers: Authorization: Bearer TOKEN

# Reply to message
POST /api/messages/reply
Headers:
  Authorization: Bearer TOKEN
  Content-Type: application/json
Body:
{
  "threadId": "message-456",
  "content": "Thank you for your response!"
}
```

### 5. Wallet & Credits (Auth Required)

```bash
# Check wallet balance
GET /api/wallets/me
Headers: Authorization: Bearer TOKEN

Response:
{
  "email": "user@example.com",
  "balance": 1000,
  "currency": "ZAR"
}

# Pay with credits
POST /api/wallets/me/redeem
Headers:
  Authorization: Bearer TOKEN
  Content-Type: application/json
Body:
{
  "amount": 99,
  "serviceId": "service-123",
  "description": "Payment for consulting"
}
```

### 6. Admin Operations (Admin Auth Required)

```bash
# Add credits to user
POST /api/admin/wallet/add-credits
Headers:
  Authorization: Bearer ADMIN_TOKEN
  Content-Type: application/json
Body:
{
  "email": "user@example.com",
  "amount": 500,
  "description": "Welcome bonus"
}

# View all transactions
GET /api/admin/wallet/transactions?page=1&pageSize=50
Headers: Authorization: Bearer ADMIN_TOKEN

# Get wallet summary
GET /api/admin/wallet/summary
Headers: Authorization: Bearer ADMIN_TOKEN
```

---

## 🔑 Authentication Patterns

### Firebase Authentication

```javascript
// JavaScript/TypeScript Example
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(
  auth, 
  'user@example.com', 
  'password'
);

const token = await userCredential.user.getIdToken();

// Use token in API calls
fetch('http://localhost:5055/api/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'public'
  }
});
```

### Python Example

```python
import requests

# Get token from Firebase first
token = "your-firebase-token"

headers = {
    "Authorization": f"Bearer {token}",
    "X-Tenant-ID": "public",
    "Content-Type": "application/json"
}

# List services
response = requests.get(
    "http://localhost:5055/api/data/services",
    headers=headers,
    params={"page": 1, "pageSize": 20}
)

services = response.json()
```

### cURL Examples

```bash
# Store token in variable
TOKEN="your-firebase-token"

# Get current user
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5055/api/me

# Create service
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"New Service","price":99}' \
     http://localhost:5055/api/data/services
```

---

## 📊 Pagination & Filtering

### Standard Pagination
All list endpoints support:
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)

```bash
GET /api/data/services?page=2&pageSize=50
```

### Text Search
Use `q` parameter:
```bash
GET /api/data/services?q=consulting
GET /api/messages?q=urgent
```

### Filtering
```bash
# By category
GET /api/data/services?category=Business

# By price range
GET /api/data/services?minPrice=100&maxPrice=500

# By vendor
GET /api/data/services?vendor=vendor-id

# Featured only
GET /api/data/services?featured=true
```

### Response Format
```json
{
  "page": 1,
  "pageSize": 20,
  "total": 150,
  "items": [...]
}
```

---

## 🛡️ Error Handling

### Standard Error Response
```json
{
  "status": "error",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 204 | No Content | Deleted successfully |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Provide valid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Retry or contact support |

### Error Handling Example

```javascript
try {
  const response = await fetch('/api/data/services', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    switch (response.status) {
      case 401:
        // Refresh token or redirect to login
        break;
      case 429:
        // Back off and retry
        break;
      case 500:
        // Show error message to user
        break;
    }
  }
  
  const data = await response.json();
} catch (error) {
  console.error('Network error:', error);
}
```

---

## 🎯 Rate Limiting

Current limits:
- **Public endpoints:** 100 requests/hour
- **Authenticated:** 1000 requests/hour  
- **Admin:** 5000 requests/hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1698345600
```

### Handling Rate Limits

```javascript
const response = await fetch('/api/data/services');

const limit = response.headers.get('X-RateLimit-Limit');
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');

if (remaining < 10) {
  console.warn('Approaching rate limit!');
}

if (response.status === 429) {
  const retryAfter = new Date(reset * 1000);
  console.log(`Rate limited. Retry after: ${retryAfter}`);
}
```

---

## 🔄 Real-Time Updates (Coming Soon)

Webhooks will allow you to receive real-time notifications:

```javascript
// Register webhook
POST /api/webhooks
{
  "url": "https://your-app.com/webhook",
  "events": [
    "subscription.created",
    "booking.confirmed",
    "message.received"
  ]
}

// Your webhook endpoint receives:
{
  "event": "subscription.created",
  "timestamp": "2025-10-26T12:00:00Z",
  "data": {
    "subscriptionId": "sub-123",
    "serviceId": "service-456"
  },
  "signature": "hmac-sha256-signature"
}
```

---

## 🧪 Testing

### Using Postman
1. Import `postman_collection.json`
2. Set environment variables:
   - `base_url`: http://localhost:5055/api
   - `firebase_token`: Your Firebase ID token
   - `tenant_id`: public
3. Run collection

### Using cURL
```bash
# Health check (no auth)
curl http://localhost:5055/api/health

# Get services (no auth)
curl http://localhost:5055/api/data/services

# Get current user (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5055/api/me
```

### Integration Testing

```javascript
// Jest example
describe('Services API', () => {
  let token;
  
  beforeAll(async () => {
    // Get Firebase token
    token = await getTestToken();
  });
  
  test('should list services', async () => {
    const response = await fetch('/api/data/services');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
  });
  
  test('should create service with auth', async () => {
    const response = await fetch('/api/data/services', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Service',
        price: 99
      })
    });
    
    expect(response.status).toBe(201);
  });
});
```

---

## 📖 Resources

- **Full Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **OpenAPI Spec:** [openapi.yaml](./openapi.yaml)
- **Postman Collection:** [postman_collection.json](./postman_collection.json)
- **Support:** support@22onsloane.co

---

## 🆕 What's Coming

- ✅ API Key authentication for M2M
- ✅ Webhook system for real-time events
- ✅ GraphQL endpoint
- ✅ SDK libraries (JS, Python, Java, C#)
- ✅ Developer portal with interactive docs
- ✅ Enhanced rate limiting with tiered plans
- ✅ API usage analytics dashboard

---

## 💡 Tips & Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (never in code)
3. **Implement token refresh** logic
4. **Handle rate limits** gracefully
5. **Use pagination** for large datasets
6. **Cache responses** when appropriate
7. **Log API errors** for debugging
8. **Validate responses** before use
9. **Use webhooks** instead of polling
10. **Monitor API health** regularly

---

Last updated: October 26, 2025
