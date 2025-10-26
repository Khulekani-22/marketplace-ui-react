# API Key Rate Limiting

## Overview

The API key rate limiting system implements **tiered rate limits** based on your API key subscription level. This ensures fair usage, prevents abuse, and provides predictable API access patterns.

## Rate Limit Tiers

| Tier | Requests/Hour | Best For | Cost |
|------|---------------|----------|------|
| **Free** | 100 | Testing & Development | Free |
| **Standard** | 1,000 | Production Apps | Contact Sales |
| **Premium** | 10,000 | High-Volume Apps | Contact Sales |

### Tier Details

**🆓 Free Tier**
- **100 requests per hour**
- Perfect for testing and development
- Automatic cleanup of request history
- Full API access

**⭐ Standard Tier**
- **1,000 requests per hour**  
- Recommended for most production applications
- 10x increase over free tier
- Priority support

**🚀 Premium Tier**
- **10,000 requests per hour**
- For high-traffic applications
- 100x increase over free tier
- Dedicated support channel
- Custom rate limits available

---

## How Rate Limiting Works

### Sliding Window Algorithm

The system uses a **sliding window** algorithm for precise rate limiting:

1. **Request received** → Check API key tier
2. **Count requests** in the last 60 minutes
3. **If under limit** → Allow request and record timestamp
4. **If over limit** → Return 429 error with retry-after header
5. **Cleanup old requests** automatically (>2 hours old)

### Example Timeline

```
Current Time: 14:30
Window Start: 13:30 (60 minutes ago)

Requests in window:
├─ 13:35 ✓ (counted)
├─ 13:45 ✓ (counted)
├─ 14:00 ✓ (counted)
├─ 14:15 ✓ (counted)
├─ 14:30 ✓ (this request)
└─ 13:20 ✗ (too old, not counted)

Free Tier: 5/100 requests used
Standard Tier: 5/1000 requests used
Premium Tier: 5/10000 requests used
```

---

## Rate Limit Headers

Every API response includes rate limit information:

### Response Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1698345600
X-RateLimit-Tier: Standard Tier
X-RateLimit-Warning: You have used 85% of your rate limit...
```

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed | `1000` |
| `X-RateLimit-Remaining` | Requests remaining in window | `847` |
| `X-RateLimit-Reset` | Unix timestamp when limit resets | `1698345600` |
| `X-RateLimit-Tier` | Your current tier | `Standard Tier` |
| `X-RateLimit-Warning` | Warning when >80% used | (optional) |

### 429 Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698345600

{
  "status": "error",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. You have made 100 requests in the last hour.",
  "details": {
    "tier": "Free Tier",
    "limit": 100,
    "windowMs": 3600000,
    "resetAt": "2025-10-26T15:00:00.000Z",
    "retryAfter": 3600
  },
  "upgrade": "Consider upgrading to Standard tier (1,000 req/hour) or Premium tier (10,000 req/hour)"
}
```

---

## Checking Rate Limit Status

### Get Your Current Status

```bash
GET /api/api-keys/:id/rate-limit
Headers:
  Authorization: Bearer <your-firebase-token>

Response:
{
  "status": "success",
  "rateLimit": {
    "tier": "Standard Tier",
    "limit": 1000,
    "used": 153,
    "remaining": 847,
    "resetAt": "2025-10-26T15:00:00.000Z",
    "percentage": 15
  }
}
```

### Monitor Multiple Keys

```bash
GET /api/api-keys
Headers:
  Authorization: Bearer <your-firebase-token>

Response:
{
  "keys": [
    {
      "id": "key-123",
      "name": "Production API",
      "rateLimit": "standard",
      "usageCount": 15430,
      "lastUsedAt": "2025-10-26T14:30:00Z"
    }
  ]
}
```

---

## Admin Operations

### Reset Rate Limit (Admin Only)

Manually reset rate limit for an API key:

```bash
POST /api/api-keys/:id/rate-limit/reset
Headers:
  Authorization: Bearer <admin-firebase-token>

Response:
{
  "status": "success",
  "message": "Rate limit reset successfully",
  "deleted": 153
}
```

### Rate Limit Statistics (Admin Only)

View system-wide rate limit statistics:

```bash
GET /api/api-keys/admin/rate-limit-stats
Headers:
  Authorization: Bearer <admin-firebase-token>

Response:
{
  "status": "success",
  "stats": {
    "totalKeys": 25,
    "byTier": {
      "free": 10,
      "standard": 12,
      "premium": 3
    },
    "usage": [
      {
        "keyId": "key-123",
        "appName": "my-app",
        "tier": "standard",
        "limit": 1000,
        "used": 850,
        "remaining": 150,
        "percentage": 85
      }
    ],
    "summary": {
      "heavyUsers": 3,
      "mediumUsers": 8,
      "lightUsers": 14
    }
  }
}
```

---

## Handling Rate Limits

### Client-Side Implementation

**JavaScript/TypeScript:**
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  headers: {
    'X-API-Key': process.env.API_KEY
  }
});

// Intercept rate limit errors
apiClient.interceptors.response.use(
  response => {
    // Check rate limit warning
    const warning = response.headers['x-ratelimit-warning'];
    if (warning) {
      console.warn('Rate limit warning:', warning);
      // Alert user or log for monitoring
    }
    
    // Log remaining requests
    const remaining = response.headers['x-ratelimit-remaining'];
    console.log(`Requests remaining: ${remaining}`);
    
    return response;
  },
  error => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '3600');
      const resetAt = new Date(Date.now() + (retryAfter * 1000));
      
      console.error(`Rate limit exceeded. Retry after ${retryAfter}s (${resetAt.toISOString()})`);
      
      // Option 1: Queue for retry
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(axios.request(error.config));
        }, retryAfter * 1000);
      });
      
      // Option 2: Throw error
      // throw new Error(`Rate limit exceeded. Retry at ${resetAt.toISOString()}`);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Python:**
```python
import os
import time
import requests
from datetime import datetime

class RateLimitedAPI:
    def __init__(self):
        self.base_url = os.getenv('API_BASE_URL')
        self.api_key = os.getenv('API_KEY')
        self.headers = {'X-API-Key': self.api_key}
    
    def request_with_retry(self, method, endpoint, **kwargs):
        """Make request with automatic retry on rate limit"""
        url = f'{self.base_url}{endpoint}'
        
        while True:
            response = requests.request(method, url, headers=self.headers, **kwargs)
            
            # Check rate limit warning
            warning = response.headers.get('X-RateLimit-Warning')
            if warning:
                print(f'⚠️  Rate limit warning: {warning}')
            
            # Log usage
            remaining = response.headers.get('X-RateLimit-Remaining', '?')
            print(f'Requests remaining: {remaining}')
            
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 3600))
                reset_at = datetime.fromtimestamp(time.time() + retry_after)
                
                print(f'⏸️  Rate limit exceeded. Retrying at {reset_at.isoformat()}')
                time.sleep(retry_after)
                continue
            
            response.raise_for_status()
            return response.json()
    
    def get_services(self, params=None):
        return self.request_with_retry('GET', '/api/data/services', params=params)

# Usage
api = RateLimitedAPI()
services = api.get_services({'category': 'Business'})
```

### Best Practices

**✅ DO:**
- **Monitor headers** - Check `X-RateLimit-Remaining` regularly
- **Handle 429 errors** - Implement retry logic with exponential backoff
- **Cache responses** - Reduce unnecessary API calls
- **Batch requests** - Combine multiple operations when possible
- **Use webhooks** - For real-time updates instead of polling
- **Upgrade when needed** - Don't wait until hitting limits

**❌ DON'T:**
- **Ignore warnings** - When you see `X-RateLimit-Warning`, take action
- **Retry immediately** - Use `Retry-After` header value
- **Share API keys** - Each app should have its own key
- **Poll excessively** - Use reasonable intervals
- **Ignore errors** - Log and monitor rate limit issues

---

## Rate Limit Strategies

### 1. Request Caching

```javascript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedServices() {
  const cacheKey = 'services';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Returning cached data');
    return cached.data;
  }
  
  const response = await apiClient.get('/api/data/services');
  cache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data;
}
```

### 2. Request Batching

```javascript
// Batch multiple requests
const batchedRequests = [];
const BATCH_DELAY = 100; // ms

function queueRequest(endpoint) {
  return new Promise((resolve, reject) => {
    batchedRequests.push({ endpoint, resolve, reject });
    
    if (batchedRequests.length === 1) {
      setTimeout(processBatch, BATCH_DELAY);
    }
  });
}

async function processBatch() {
  const batch = [...batchedRequests];
  batchedRequests.length = 0;
  
  // Make single batch request
  try {
    const response = await apiClient.post('/api/batch', {
      requests: batch.map(r => r.endpoint)
    });
    
    batch.forEach((req, i) => {
      req.resolve(response.data.results[i]);
    });
  } catch (error) {
    batch.forEach(req => req.reject(error));
  }
}
```

### 3. Exponential Backoff

```javascript
async function requestWithBackoff(endpoint, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await apiClient.get(endpoint);
    } catch (error) {
      if (error.response?.status === 429) {
        const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

---

## Upgrading Your Tier

### When to Upgrade

Consider upgrading if you:
- **Regularly hit rate limits** (>80% usage)
- **Experience 429 errors** frequently
- **Need more capacity** for growth
- **Require higher reliability**

### How to Upgrade

1. **Contact sales**: support@22onsloane.co
2. **Provide**: API key ID and desired tier
3. **Review pricing**: Discuss billing options
4. **Instant activation**: No downtime during upgrade

### Tier Comparison

| Feature | Free | Standard | Premium |
|---------|------|----------|---------|
| Requests/Hour | 100 | 1,000 | 10,000 |
| API Access | ✅ Full | ✅ Full | ✅ Full |
| Support | Community | Email | Priority |
| SLA | None | 99.9% | 99.95% |
| Custom Limits | ❌ | ❌ | ✅ |
| Webhooks | ✅ | ✅ | ✅ Priority |

---

## Monitoring & Alerts

### Set Up Monitoring

```javascript
// Monitor rate limit usage
function checkRateLimit() {
  apiClient.get('/api/api-keys/key-123/rate-limit')
    .then(response => {
      const { percentage, remaining, resetAt } = response.data.rateLimit;
      
      if (percentage >= 90) {
        alert('CRITICAL: 90% rate limit used!');
      } else if (percentage >= 80) {
        alert('WARNING: 80% rate limit used');
      }
      
      console.log(`Rate limit: ${percentage}% used, ${remaining} remaining`);
    });
}

// Check every 10 minutes
setInterval(checkRateLimit, 10 * 60 * 1000);
```

### Webhook Notifications

Configure webhooks to receive alerts:

```json
{
  "event": "rate_limit.warning",
  "apiKeyId": "key-123",
  "percentage": 85,
  "tier": "standard",
  "remaining": 150,
  "timestamp": "2025-10-26T14:30:00Z"
}
```

---

## Troubleshooting

### Common Issues

**Problem: Hitting rate limits too quickly**
- **Solution**: Implement caching, reduce polling frequency
- **Check**: Are you making unnecessary duplicate requests?

**Problem: 429 errors during peak hours**
- **Solution**: Upgrade to higher tier or implement request queuing
- **Check**: Monitor usage patterns to identify peak times

**Problem: Rate limit resets not working**
- **Solution**: Contact support to reset your limit manually
- **Check**: Verify your API key tier is correct

**Problem: Inconsistent rate limit counts**
- **Solution**: Rate limits use sliding window, not fixed intervals
- **Check**: Understand that requests from 60 minutes ago still count

---

## FAQ

**Q: Do rate limits apply to all endpoints?**  
A: Yes, all API endpoints count toward your rate limit.

**Q: Can I have multiple API keys with different tiers?**  
A: Yes, create separate keys for different applications with different tiers.

**Q: What happens if I exceed my rate limit?**  
A: You'll receive a 429 error. Wait for the time specified in `Retry-After` header.

**Q: Do failed requests count toward my limit?**  
A: Yes, all requests count, including failed ones.

**Q: Can I see historical rate limit data?**  
A: Yes, use the admin stats endpoint to view usage history.

**Q: Do rate limits reset at midnight?**  
A: No, rate limits use a sliding 60-minute window, not daily resets.

**Q: Can I request a custom rate limit?**  
A: Yes, Premium tier customers can request custom limits. Contact sales.

---

## Support

For rate limiting issues:
- Check your status: `GET /api/api-keys/:id/rate-limit`
- View usage: `GET /api/api-keys/:id/usage`
- Upgrade tier: support@22onsloane.co
- Technical support: support@22onsloane.co

---

**Last Updated:** October 26, 2025
