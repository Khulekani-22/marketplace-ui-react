# External Apps & CORS Configuration

## Overview

The External Apps system enables you to **register external applications** that will consume your API and **automatically manage CORS whitelisting** for those applications. This ensures secure cross-origin access while maintaining control over which domains can access your API.

## Features

✅ **Dynamic CORS Validation** - Origins validated against whitelist in real-time  
✅ **Wildcard Support** - Allow entire subdomains with `*.example.com` patterns  
✅ **Origin Tracking** - Monitor all incoming requests by origin  
✅ **Security Headers** - HSTS, CSP, X-Frame-Options, and more  
✅ **Automatic Cache** - 5-minute cache for optimal performance  
✅ **Request Analytics** - Track usage per origin  
✅ **Webhook Integration** - Optional webhook URLs for events  
✅ **Self-Service Management** - Users manage their own external apps  

---

## Quick Start

### 1. Register Your External App

```bash
POST /api/external-apps
Headers:
  Authorization: Bearer <your-firebase-token>
  Content-Type: application/json

Body:
{
  "name": "My Production App",
  "appIdentifier": "my-app-prod",
  "description": "Production deployment of my app",
  "allowedOrigins": [
    "https://myapp.com",
    "https://www.myapp.com",
    "https://app.myapp.com"
  ],
  "webhookUrl": "https://myapp.com/webhooks/marketplace",
  "corsEnabled": true
}

Response:
{
  "status": "success",
  "message": "External app registered successfully",
  "app": {
    "id": "app-id-123",
    "name": "My Production App",
    "appIdentifier": "my-app-prod",
    "allowedOrigins": [...],
    "corsEnabled": true,
    "active": true,
    "createdAt": "2025-10-26T12:00:00Z"
  }
}
```

### 2. Your Origins Are Now Whitelisted

Once registered, your frontend can make requests:

```javascript
// From https://myapp.com
const response = await fetch('https://api.marketplace.com/api/data/services', {
  headers: {
    'X-API-Key': 'your-api-key',
    'X-Tenant-ID': 'public'
  },
  credentials: 'include'  // CORS will allow this
});

const services = await response.json();
```

---

## API Endpoints

### External App Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/external-apps` | List your external apps |
| POST | `/api/external-apps` | Register new external app |
| GET | `/api/external-apps/:id` | Get app details |
| PATCH | `/api/external-apps/:id` | Update app settings |
| DELETE | `/api/external-apps/:id` | Delete/deactivate app |
| GET | `/api/external-apps/tracking/origins` | Origin tracking stats (admin) |
| POST | `/api/external-apps/admin/refresh-cors` | Refresh CORS cache (admin) |

---

## Registering an External App

### Request Body Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Friendly name for your app |
| `appIdentifier` | string | Yes | Unique identifier (slug format) |
| `description` | string | No | Detailed description |
| `allowedOrigins` | array | Yes | List of allowed origin URLs |
| `webhookUrl` | string | No | Webhook endpoint for events |
| `corsEnabled` | boolean | No | Enable CORS (default: true) |
| `metadata` | object | No | Custom metadata |

### Origin Format

Origins must be valid URLs:
- ✅ `https://myapp.com`
- ✅ `https://app.myapp.com`
- ✅ `https://myapp.com:8080`
- ✅ `*.myapp.com` (wildcard subdomain)
- ❌ `myapp.com` (missing protocol)
- ❌ `https://myapp.com/path` (includes path)

### Wildcard Origins

Use wildcards to allow all subdomains:

```json
{
  "allowedOrigins": [
    "https://myapp.com",
    "https://*.myapp.com"
  ]
}
```

This allows:
- `https://myapp.com` ✅
- `https://app.myapp.com` ✅
- `https://staging.myapp.com` ✅
- `https://anything.myapp.com` ✅

### Example: Register Development & Production

```javascript
const response = await fetch('http://localhost:5055/api/external-apps', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My SaaS App',
    appIdentifier: 'my-saas-app',
    description: 'Multi-environment SaaS application',
    allowedOrigins: [
      // Development
      'http://localhost:3000',
      'http://localhost:5173',
      // Staging
      'https://staging.mysaas.com',
      // Production
      'https://mysaas.com',
      'https://www.mysaas.com',
      'https://app.mysaas.com',
      // All subdomains
      'https://*.mysaas.com'
    ],
    webhookUrl: 'https://mysaas.com/api/webhooks',
    corsEnabled: true,
    metadata: {
      environment: 'production',
      tier: 'premium'
    }
  })
});

const { app } = await response.json();
console.log('App registered:', app.id);
```

---

## Managing External Apps

### List Your Apps

```bash
GET /api/external-apps?page=1&pageSize=20&active=true
Headers:
  Authorization: Bearer <firebase-token>

Response:
{
  "status": "success",
  "apps": [
    {
      "id": "app-id-123",
      "name": "My SaaS App",
      "appIdentifier": "my-saas-app",
      "allowedOrigins": [...],
      "active": true,
      "corsEnabled": true,
      "createdAt": "2025-10-26T12:00:00Z",
      "stats": {
        "totalRequests": 15430,
        "lastRequestAt": "2025-10-26T14:30:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Update App Settings

```bash
PATCH /api/external-apps/:id
Headers:
  Authorization: Bearer <firebase-token>
  Content-Type: application/json

Body:
{
  "name": "Updated Name",
  "allowedOrigins": [
    "https://newdomain.com",
    "https://*.newdomain.com"
  ],
  "active": true
}

Response:
{
  "status": "success",
  "message": "External app updated successfully",
  "app": {...}
}
```

### Delete/Deactivate App

```bash
DELETE /api/external-apps/:id
Headers:
  Authorization: Bearer <firebase-token>

Response:
{
  "status": "success",
  "message": "External app deleted successfully"
}
```

**Note:** This performs a soft delete by setting `active: false`. The app data is retained for audit purposes.

---

## CORS Behavior

### How It Works

1. **Request arrives** with `Origin: https://myapp.com` header
2. **CORS middleware** checks if origin is whitelisted
3. **If whitelisted**: Sets `Access-Control-Allow-Origin: https://myapp.com` and allows credentials
4. **If not whitelisted**: Sets `Access-Control-Allow-Origin: null` and blocks credentials
5. **Origin tracked** in Firestore for analytics

### Cache Mechanism

- Origins are cached for **5 minutes** to reduce Firestore reads
- Cache automatically refreshes every 5 minutes
- Manual refresh available via admin endpoint
- Updates to external apps trigger cache refresh

### Default Allowed Origins

These origins are **always allowed** (development):
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:4173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

### CORS Headers

**Allowed Methods:**
```
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

**Allowed Headers:**
```
Origin, X-Requested-With, Content-Type, Accept, 
Authorization, X-API-Key, X-Tenant-ID, X-Firebase-AppCheck
```

**Exposed Headers:**
```
X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset,
X-Total-Count, X-Page, X-Page-Size
```

**Preflight Cache:**
```
24 hours (86400 seconds)
```

---

## Security Headers

### Automatically Applied Headers

**Strict-Transport-Security (HSTS):**
```
max-age=31536000; includeSubDomains; preload
```
Forces HTTPS connections (production only).

**Content-Security-Policy (CSP):**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
frame-ancestors 'none';
```
Prevents XSS attacks.

**X-Frame-Options:**
```
DENY
```
Prevents clickjacking attacks.

**X-Content-Type-Options:**
```
nosniff
```
Prevents MIME type sniffing.

**X-XSS-Protection:**
```
1; mode=block
```
Legacy XSS protection.

**Referrer-Policy:**
```
strict-origin-when-cross-origin
```
Controls referrer information.

**Permissions-Policy:**
```
geolocation=(), microphone=(), camera=(), payment=()
```
Restricts browser features.

---

## Origin Tracking

### View Tracking Statistics

```bash
GET /api/external-apps/tracking/origins?limit=50
Headers:
  Authorization: Bearer <admin-firebase-token>

Response:
{
  "status": "success",
  "origins": [
    {
      "origin": "https://myapp.com",
      "firstSeen": "2025-01-01T00:00:00Z",
      "lastSeen": "2025-10-26T14:30:00Z",
      "requestCount": 15430,
      "lastEndpoint": "/api/data/services",
      "lastMethod": "GET",
      "lastUserAgent": "Mozilla/5.0...",
      "blocked": false
    }
  ],
  "total": 25
}
```

### Tracked Information

For each origin, we track:
- **First seen date** - When origin first appeared
- **Last seen date** - Most recent request
- **Request count** - Total number of requests
- **Last endpoint** - Most recent endpoint accessed
- **Last method** - HTTP method used
- **User agent** - Browser/client information
- **Blocked status** - Whether origin is blocked

---

## Admin Operations

### Refresh CORS Cache

Force immediate cache refresh:

```bash
POST /api/external-apps/admin/refresh-cors
Headers:
  Authorization: Bearer <admin-firebase-token>

Response:
{
  "status": "success",
  "message": "CORS cache refreshed successfully",
  "originsCount": 45,
  "origins": [...]
}
```

### Use Cases

- After bulk updating external apps
- When troubleshooting CORS issues
- After database restoration
- When onboarding new apps

---

## Frontend Integration

### React Example

```javascript
// config/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'X-API-Key': process.env.REACT_APP_API_KEY,
    'X-Tenant-ID': 'public'
  },
  withCredentials: true  // Enable CORS credentials
});

// Intercept CORS errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.message.includes('CORS')) {
      console.error('CORS error - check origin whitelist');
      // Alert user or admin
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Usage
import apiClient from './config/api';

function MyComponent() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    apiClient.get('/api/data/services')
      .then(res => setServices(res.data.data))
      .catch(err => console.error('API error:', err));
  }, []);

  return <ServiceList services={services} />;
}
```

### Vue.js Example

```javascript
// plugins/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY,
    'X-Tenant-ID': 'public'
  },
  withCredentials: true
});

export default {
  install: (app) => {
    app.config.globalProperties.$api = apiClient;
    app.provide('api', apiClient);
  }
};

// main.js
import { createApp } from 'vue';
import api from './plugins/api';

const app = createApp(App);
app.use(api);
app.mount('#app');

// Component usage
import { inject } from 'vue';

export default {
  setup() {
    const api = inject('api');
    
    const loadServices = async () => {
      const response = await api.get('/api/data/services');
      return response.data.data;
    };

    return { loadServices };
  }
};
```

---

## Troubleshooting

### Common CORS Errors

**Error: "No 'Access-Control-Allow-Origin' header"**
- **Cause:** Origin not whitelisted
- **Solution:** Register your origin in external apps

**Error: "CORS policy blocks credentials"**
- **Cause:** Trying to send credentials to non-whitelisted origin
- **Solution:** Add origin to whitelist and ensure `corsEnabled: true`

**Error: "Preflight request fails"**
- **Cause:** OPTIONS request not handled properly
- **Solution:** CORS middleware automatically handles OPTIONS

**Error: "Wildcard origin with credentials"**
- **Cause:** Can't use `*` origin with credentials
- **Solution:** Use specific origin whitelist instead

### Debugging Steps

1. **Check external app registration:**
   ```bash
   GET /api/external-apps
   ```

2. **Verify origin format:**
   ```javascript
   // ✅ Correct
   "https://myapp.com"
   
   // ❌ Wrong
   "myapp.com"  // Missing protocol
   "https://myapp.com/"  // Trailing slash
   ```

3. **Check browser console:**
   ```
   Access to fetch at '...' from origin '...' has been blocked by CORS policy
   ```

4. **Review origin tracking:**
   ```bash
   GET /api/external-apps/tracking/origins
   ```

5. **Refresh CORS cache:**
   ```bash
   POST /api/external-apps/admin/refresh-cors
   ```

---

## Best Practices

### ✅ DO

- **Use specific origins** instead of wildcards when possible
- **Register separate apps** for dev/staging/production
- **Set up webhooks** for important events
- **Monitor origin tracking** for unauthorized attempts
- **Update allowedOrigins** when adding new subdomains
- **Disable CORS** for apps that don't need it

### ❌ DON'T

- **Don't use wildcard (*)** as allowed origin with credentials
- **Don't share app identifiers** across different projects
- **Don't include paths** in origins (e.g., `https://app.com/path`)
- **Don't forget protocol** (always include `https://` or `http://`)
- **Don't leave test origins** in production whitelist

---

## Environment Variables

```bash
# Optional: Override default CORS cache TTL (milliseconds)
CORS_CACHE_TTL=300000  # 5 minutes

# Optional: Enable CORS debug logging
CORS_DEBUG=true
```

---

## Security Considerations

### Origin Validation

- Origins are validated against **exact matches** and **wildcard patterns**
- Firestore whitelist is **cached** to prevent database overload
- Invalid origins receive **null** CORS headers

### Request Tracking

- All origins are **tracked** for analytics
- Suspicious patterns can be **detected** and **blocked**
- Admin can **review** all origin activity

### Best Security Practices

1. **Limit wildcard usage** - Use specific origins when possible
2. **Review tracking regularly** - Check for unauthorized access attempts
3. **Rotate API keys** - If suspicious activity detected
4. **Enable webhooks** - Get notified of important events
5. **Monitor rate limits** - Track usage per origin

---

## FAQ

**Q: Can I use multiple wildcards?**  
A: Yes, you can add multiple wildcard patterns like `*.app1.com` and `*.app2.com`.

**Q: How long does it take for changes to take effect?**  
A: Up to 5 minutes due to cache TTL. Use admin refresh endpoint for immediate effect.

**Q: Can I whitelist IP addresses?**  
A: No, CORS works with origins (protocol + domain + port), not IP addresses.

**Q: What happens if I don't register my app?**  
A: Your requests will be blocked by CORS policy (unless using default localhost origins).

**Q: Can I disable CORS for specific apps?**  
A: Yes, set `corsEnabled: false` when creating/updating the app.

**Q: Does this work with mobile apps?**  
A: CORS only applies to browser requests. Mobile apps should use API keys without CORS concerns.

---

## Support

For CORS and external app issues:
- Review origin tracking: `/api/external-apps/tracking/origins`
- Check external apps: `/api/external-apps`
- Refresh cache: `/api/external-apps/admin/refresh-cors`
- Contact support: support@22onsloane.co

---

**Last Updated:** October 26, 2025
