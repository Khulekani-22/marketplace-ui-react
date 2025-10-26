# API Key Authentication System

## Overview

The API key authentication system enables **machine-to-machine (M2M) communication** and allows external applications to securely access the Marketplace API without requiring Firebase user authentication.

## Features

✅ **Secure Key Generation** - Cryptographically secure random keys  
✅ **Hashed Storage** - Keys stored as SHA-256 hashes, never in plain text  
✅ **Tiered Rate Limits** - Free, Standard, Premium tiers  
✅ **Permission-Based Access** - Fine-grained permission control  
✅ **Key Rotation** - Rotate keys without downtime  
✅ **Usage Tracking** - Monitor API key usage and statistics  
✅ **Expiration Support** - Set expiry dates for temporary access  
✅ **Dual Authentication** - Support both Firebase Auth and API keys  

---

## Quick Start

### 1. Create an API Key

```bash
POST /api/api-keys
Headers:
  Authorization: Bearer <your-firebase-token>
  Content-Type: application/json

Body:
{
  "name": "Production App",
  "appName": "my-external-app",
  "description": "API key for production integration",
  "permissions": ["read", "write"],
  "rateLimit": "standard",
  "expiresInDays": 365
}

Response:
{
  "status": "success",
  "apiKey": "a1b2c3d4e5f6...xyz",  // SAVE THIS! Only shown once
  "keyInfo": {
    "id": "key-id-123",
    "name": "Production App",
    "keyPreview": "sk_live_a1b2c3d4",
    "permissions": ["read", "write"],
    "rateLimit": "standard"
  },
  "warning": "Save this API key securely. You won't be able to see it again."
}
```

⚠️ **IMPORTANT:** The full API key is only returned once during creation. Store it securely!

### 2. Use the API Key

```bash
GET /api/data/services
Headers:
  X-API-Key: a1b2c3d4e5f6...xyz
  X-Tenant-ID: public
```

---

## API Endpoints

### Key Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/api-keys` | List your API keys |
| POST | `/api/api-keys` | Create new API key |
| GET | `/api/api-keys/:id` | Get key details |
| PATCH | `/api/api-keys/:id` | Update key settings |
| DELETE | `/api/api-keys/:id` | Revoke key |
| POST | `/api/api-keys/:id/rotate` | Rotate key |
| GET | `/api/api-keys/:id/usage` | Get usage stats |
| GET | `/api/api-keys/admin/stats` | Admin: system stats |

---

## Creating an API Key

### Request Body Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Friendly name for the key |
| `appName` | string | Yes | Application identifier |
| `description` | string | No | Detailed description |
| `permissions` | array | No | Permission list (default: ["read"]) |
| `rateLimit` | string | No | Tier: "free", "standard", "premium" |
| `expiresInDays` | number | No | Days until expiration |
| `metadata` | object | No | Custom metadata |

### Permissions

Available permissions:
- `read` - Read access to resources
- `write` - Create and update resources
- `delete` - Delete resources
- `admin` - Administrative operations
- `*` - All permissions (use with caution)

### Rate Limit Tiers

| Tier | Requests/Hour | Best For |
|------|---------------|----------|
| `free` | 100 | Testing & Development |
| `standard` | 1,000 | Production Apps |
| `premium` | 10,000 | High-Volume Apps |

### Example: Create Read-Only Key

```javascript
const response = await fetch('http://localhost:5055/api/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Analytics Dashboard',
    appName: 'analytics-app',
    description: 'Read-only access for analytics',
    permissions: ['read'],
    rateLimit: 'standard',
    expiresInDays: 90
  })
});

const { apiKey, keyInfo } = await response.json();
// Store apiKey securely (e.g., environment variables)
```

---

## Using API Keys

### Authentication Header

```
X-API-Key: <your-api-key>
```

### Example Requests

**JavaScript/TypeScript:**
```javascript
const apiKey = process.env.MARKETPLACE_API_KEY;

const response = await fetch('http://localhost:5055/api/data/services', {
  headers: {
    'X-API-Key': apiKey,
    'X-Tenant-ID': 'public'
  }
});

const services = await response.json();
```

**Python:**
```python
import os
import requests

api_key = os.getenv('MARKETPLACE_API_KEY')

headers = {
    'X-API-Key': api_key,
    'X-Tenant-ID': 'public'
}

response = requests.get(
    'http://localhost:5055/api/data/services',
    headers=headers
)

services = response.json()
```

**cURL:**
```bash
curl -H "X-API-Key: your-api-key-here" \
     -H "X-Tenant-ID: public" \
     http://localhost:5055/api/data/services
```

---

## Key Management

### List Your API Keys

```bash
GET /api/api-keys
Headers:
  Authorization: Bearer <firebase-token>

Response:
{
  "keys": [
    {
      "id": "key-id-123",
      "name": "Production App",
      "appName": "my-app",
      "keyPreview": "sk_live_a1b2c3d4",
      "active": true,
      "rateLimit": "standard",
      "permissions": ["read", "write"],
      "createdAt": "2025-10-26T12:00:00Z",
      "lastUsedAt": "2025-10-26T14:30:00Z",
      "usageCount": 1543
    }
  ]
}
```

### Update API Key

```bash
PATCH /api/api-keys/:id
Headers:
  Authorization: Bearer <firebase-token>
  Content-Type: application/json

Body:
{
  "name": "Updated Name",
  "permissions": ["read"],
  "active": true
}
```

### Revoke API Key

```bash
DELETE /api/api-keys/:id
Headers:
  Authorization: Bearer <firebase-token>

Response:
{
  "status": "success",
  "message": "API key revoked successfully"
}
```

### Rotate API Key

Generates a new key while keeping the same settings:

```bash
POST /api/api-keys/:id/rotate
Headers:
  Authorization: Bearer <firebase-token>

Response:
{
  "status": "success",
  "apiKey": "new-key-xyz...",  // New key (save this!)
  "keyPreview": "sk_live_xyz123",
  "warning": "Save this new API key securely. The old key is now invalid."
}
```

---

## Usage Statistics

### Get Key Usage

```bash
GET /api/api-keys/:id/usage
Headers:
  Authorization: Bearer <firebase-token>

Response:
{
  "usage": {
    "totalRequests": 15430,
    "lastUsed": "2025-10-26T14:30:00Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "daysActive": 298,
    "averageRequestsPerDay": 52
  }
}
```

### Admin Statistics

```bash
GET /api/api-keys/admin/stats
Headers:
  Authorization: Bearer <admin-firebase-token>

Response:
{
  "stats": {
    "totalKeys": 25,
    "activeKeys": 20,
    "inactiveKeys": 5,
    "expiredKeys": 2,
    "byRateLimit": {
      "free": 10,
      "standard": 12,
      "premium": 3
    },
    "totalUsage": 500000,
    "recentActivity": [...]
  }
}
```

---

## Security Best Practices

### 🔒 Key Storage

**DO:**
- ✅ Store keys in environment variables
- ✅ Use secret management services (AWS Secrets Manager, Azure Key Vault)
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/staging/prod

**DON'T:**
- ❌ Commit keys to version control
- ❌ Hardcode keys in source code
- ❌ Share keys via email/chat
- ❌ Use the same key across multiple apps

### 🛡️ Permission Management

**Principle of Least Privilege:**
- Only grant permissions your app needs
- Use read-only keys when possible
- Separate keys for different functions
- Review permissions regularly

### 📊 Monitoring

- Monitor key usage regularly
- Set up alerts for unusual activity
- Review audit logs
- Revoke unused keys

---

## Dual Authentication

Endpoints support both Firebase Auth and API keys:

```javascript
// Option 1: Firebase Authentication
fetch('/api/data/services', {
  headers: {
    'Authorization': 'Bearer <firebase-token>'
  }
});

// Option 2: API Key Authentication
fetch('/api/data/services', {
  headers: {
    'X-API-Key': '<api-key>'
  }
});

// Both work on the same endpoints!
```

---

## Error Handling

### Common Error Codes

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `MISSING_API_KEY` | 401 | No API key provided | Add X-API-Key header |
| `INVALID_API_KEY` | 401 | Key not found | Check key value |
| `DISABLED_API_KEY` | 401 | Key is deactivated | Activate or rotate key |
| `EXPIRED_API_KEY` | 401 | Key has expired | Create new key |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing permission | Request permission upgrade |

### Error Response Format

```json
{
  "status": "error",
  "message": "API key has expired",
  "code": "EXPIRED_API_KEY"
}
```

---

## Integration Examples

### Node.js SDK

```javascript
// config/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  headers: {
    'X-API-Key': process.env.MARKETPLACE_API_KEY,
    'X-Tenant-ID': 'public'
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('API key invalid or expired');
      // Rotate key or alert admin
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Usage
import apiClient from './config/api';

const services = await apiClient.get('/api/data/services');
```

### Python SDK

```python
# api_client.py
import os
import requests
from typing import Dict, Any

class MarketplaceAPI:
    def __init__(self):
        self.base_url = os.getenv('API_BASE_URL')
        self.api_key = os.getenv('MARKETPLACE_API_KEY')
        self.headers = {
            'X-API-Key': self.api_key,
            'X-Tenant-ID': 'public'
        }
    
    def get_services(self, params: Dict[str, Any] = None):
        response = requests.get(
            f'{self.base_url}/api/data/services',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def create_service(self, service_data: Dict[str, Any]):
        response = requests.post(
            f'{self.base_url}/api/data/services',
            headers=self.headers,
            json=service_data
        )
        response.raise_for_status()
        return response.json()

# Usage
api = MarketplaceAPI()
services = api.get_services({'category': 'Business'})
```

---

## Migration Guide

### From Firebase Auth to API Keys

If you're migrating from Firebase Auth to API keys:

1. **Create API key** with same permissions as your Firebase user
2. **Test both** authentication methods in parallel
3. **Monitor** for any issues
4. **Switch** to API key once validated
5. **Keep** Firebase Auth as backup

### Backward Compatibility

All existing endpoints continue to work with Firebase Auth. API keys are additive, not a replacement.

---

## FAQ

**Q: Can I use API keys for frontend apps?**  
A: No. API keys should only be used in server-to-server communication. Frontend apps should use Firebase Auth.

**Q: How many API keys can I create?**  
A: No limit, but we recommend creating separate keys for each application/environment.

**Q: What happens if my key is compromised?**  
A: Immediately revoke the compromised key and create a new one. Monitor audit logs for suspicious activity.

**Q: Can I share API keys between apps?**  
A: Not recommended. Create separate keys for better security and monitoring.

**Q: Do API keys expire automatically?**  
A: Only if you set an expiration date during creation. Otherwise, they remain valid until revoked.

---

## Support

For API key issues:
- Check audit logs: `/api/audit-logs`
- View key usage: `/api/api-keys/:id/usage`
- Contact support: support@22onsloane.co

---

**Last Updated:** October 26, 2025
