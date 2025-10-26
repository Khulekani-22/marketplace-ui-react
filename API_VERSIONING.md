# API Versioning Strategy

## Overview

The Marketplace API uses **semantic versioning** to ensure backward compatibility while enabling continuous improvement. Multiple versions can coexist, allowing clients to upgrade at their own pace.

## Versioning Approach

We support **three versioning strategies** that you can use interchangeably:

### 1. URL-Based Versioning (Recommended)

```http
GET /api/v1/services
GET /api/v2/services
```

**Advantages:**
- ✅ Clear and explicit
- ✅ Easy to cache
- ✅ Browser-friendly
- ✅ Simple routing

### 2. Header-Based Versioning

```http
GET /api/services
Accept-Version: v1
```

**Advantages:**
- ✅ Clean URLs
- ✅ Flexible version switching
- ✅ Metadata approach

### 3. Query Parameter Versioning

```http
GET /api/services?version=v1
```

**Advantages:**
- ✅ Simple for testing
- ✅ Easy debugging
- ✅ No header manipulation needed

---

## Current Versions

| Version | Status | Release Date | Deprecation | Sunset | Description |
|---------|--------|--------------|-------------|--------|-------------|
| **v1** | Current | 2025-01-01 | - | - | Initial stable version |
| **v2** | Beta | 2025-10-26 | - | - | Enhanced with HATEOAS & metadata |

### Version Status Definitions

- **Current**: Fully supported and recommended
- **Beta**: Preview release, may change before stable
- **Deprecated**: Still supported but will be sunset soon
- **Sunset**: No longer supported

---

## Using Versioned APIs

### JavaScript/TypeScript Example

```javascript
// Using URL-based versioning (recommended)
const apiClient = axios.create({
  baseURL: 'https://api.marketplace.com/api/v1'
});

const services = await apiClient.get('/services');

// Using header-based versioning
const apiClient = axios.create({
  baseURL: 'https://api.marketplace.com/api',
  headers: {
    'Accept-Version': 'v1'
  }
});

// Using query parameter versioning
const response = await fetch(
  'https://api.marketplace.com/api/services?version=v1'
);
```

### Python Example

```python
import requests

# URL-based versioning
base_url = 'https://api.marketplace.com/api/v1'
response = requests.get(f'{base_url}/services')

# Header-based versioning
headers = {'Accept-Version': 'v1'}
response = requests.get(
    'https://api.marketplace.com/api/services',
    headers=headers
)
```

### cURL Example

```bash
# URL-based versioning
curl https://api.marketplace.com/api/v1/services

# Header-based versioning
curl -H "Accept-Version: v1" \
  https://api.marketplace.com/api/services

# Query parameter versioning
curl "https://api.marketplace.com/api/services?version=v1"
```

---

## Version Detection Priority

When multiple versioning methods are used simultaneously, the following priority order applies:

1. **URL path** (highest priority): `/api/v2/services`
2. **Accept-Version header**: `Accept-Version: v2`
3. **Query parameter**: `?version=v2`
4. **Default version**: `v1` (if none specified)

### Example Priority

```http
GET /api/v2/services?version=v1
Accept-Version: v1

# Actual version used: v2 (URL takes precedence)
```

---

## Response Headers

Every API response includes version information:

```http
HTTP/1.1 200 OK
X-API-Version: v1
X-API-Latest-Version: v2
Content-Type: application/json

{
  "status": "success",
  "data": [...],
  "_metadata": {
    "version": "v1",
    "timestamp": "2025-10-26T12:00:00Z"
  }
}
```

### Version Headers

| Header | Description | Example |
|--------|-------------|---------|
| `X-API-Version` | Version being used | `v1` |
| `X-API-Latest-Version` | Latest available version | `v2` |
| `Deprecation` | Indicates deprecated version | `true` |
| `Sunset` | Date when version will be removed | `2026-01-01` |
| `X-API-Deprecation-Warning` | Human-readable warning | `This version will be sunset in 90 days` |
| `Link` | Discover available versions | `<...>; rel="version"; version="v2"` |

---

## Version Differences

### v1 (Initial Stable Version)

**Features:**
- RESTful endpoints
- Firebase authentication
- Pagination support
- Basic error handling

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "id": "123",
    "name": "Service Name",
    "category": "Business"
  }
}
```

### v2 (Enhanced Version)

**New Features:**
- ✨ HATEOAS links for resource navigation
- ✨ Enhanced metadata in all responses
- ✨ Structured error codes
- ✨ API key authentication
- ✨ Per-key rate limiting
- ✨ Better validation messages

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "id": "123",
    "name": "Service Name",
    "category": "Business",
    "_links": {
      "self": { "href": "/api/v2/services/123" },
      "vendor": { "href": "/api/v2/vendors/456" }
    }
  },
  "_metadata": {
    "version": "v2",
    "timestamp": "2025-10-26T12:00:00Z"
  }
}
```

---

## Version Information Endpoint

### Get All Version Info

```bash
GET /api/versions

Response:
{
  "status": "success",
  "currentVersion": "v1",
  "latestVersion": "v2",
  "supportedVersions": ["v1", "v2"],
  "versions": [
    {
      "version": "v1",
      "status": "current",
      "releaseDate": "2025-01-01",
      "deprecationDate": null,
      "sunsetDate": null,
      "isDeprecated": false,
      "isSunset": false,
      "daysUntilSunset": null
    },
    {
      "version": "v2",
      "status": "beta",
      "releaseDate": "2025-10-26",
      "deprecationDate": null,
      "sunsetDate": null,
      "isDeprecated": false,
      "isSunset": false
    }
  ],
  "documentation": "https://docs.22onsloane.co/api/versioning"
}
```

---

## Migration Guides

### Get Migration Guide

```bash
GET /api/versions/v1/migration?to=v2

Response:
{
  "status": "success",
  "migration": {
    "from": "v1",
    "to": "v2",
    "title": "Migrating from v1 to v2",
    "changes": [
      {
        "type": "enhancement",
        "description": "HATEOAS links added to responses",
        "example": {
          "v1": { "id": "123", "name": "Service" },
          "v2": {
            "id": "123",
            "name": "Service",
            "_links": { "self": { "href": "/api/v2/services/123" } }
          }
        }
      }
    ],
    "steps": [
      "Update your base URL to include /v2/ in the path",
      "Update response parsing to handle _metadata field",
      "Update error handling to use structured error codes",
      "Test all endpoints with v2",
      "Monitor for deprecation warnings"
    ],
    "estimatedTime": "2-4 hours",
    "breakingChanges": false
  }
}
```

---

## Changelog

### Get Version Changelog

```bash
GET /api/versions/v2/changelog

Response:
{
  "status": "success",
  "version": "v2",
  "versionInfo": {
    "status": "beta",
    "releaseDate": "2025-10-26"
  },
  "changelog": {
    "releaseDate": "2025-10-26",
    "changes": [
      {
        "type": "feature",
        "description": "HATEOAS links for resource navigation"
      },
      {
        "type": "feature",
        "description": "Enhanced metadata in responses"
      },
      {
        "type": "feature",
        "description": "API key authentication support"
      },
      {
        "type": "improvement",
        "description": "Better validation error messages"
      }
    ]
  }
}
```

---

## Deprecation Policy

### Timeline

When a version is deprecated, we follow this timeline:

```
Stable Release
    ↓
[ 6 months minimum stable period ]
    ↓
Deprecation Announcement
    ↓
[ 3 months deprecation period ]
    ↓  
    ↓  Warnings in responses
    ↓  Email notifications
    ↓  Documentation updates
    ↓
Sunset Date (Version Removed)
```

### Deprecation Warnings

When using a deprecated version, you'll receive warnings:

```http
HTTP/1.1 200 OK
X-API-Version: v1
Deprecation: true
Sunset: 2026-01-01
X-API-Deprecation-Warning: This API version will be sunset in 90 days (2026-01-01). Please upgrade to v2.

{
  "status": "success",
  "data": [...]
}
```

### After Sunset

Requests to sunset versions receive a 410 Gone response:

```http
HTTP/1.1 410 Gone
X-API-Version: v1
X-API-Latest-Version: v2

{
  "status": "error",
  "code": "VERSION_SUNSET",
  "message": "API version 'v1' is no longer supported",
  "sunsetDate": "2026-01-01",
  "latestVersion": "v2",
  "upgradeUrl": "https://docs.22onsloane.co/api/migration"
}
```

---

## Migration Strategy

### Step-by-Step Migration

**1. Review Changes**
```bash
# Get migration guide
curl https://api.marketplace.com/api/versions/v1/migration?to=v2

# Get changelog
curl https://api.marketplace.com/api/versions/v2/changelog
```

**2. Test in Development**
```javascript
// Create v2 client for testing
const v2Client = axios.create({
  baseURL: 'https://api.marketplace.com/api/v2'
});

// Run tests
await testAllEndpoints(v2Client);
```

**3. Parallel Running**
```javascript
// Support both versions during transition
const apiVersion = process.env.API_VERSION || 'v1';
const client = axios.create({
  baseURL: `https://api.marketplace.com/api/${apiVersion}`
});
```

**4. Monitor Usage**
```javascript
// Check for deprecation warnings
client.interceptors.response.use(response => {
  const deprecation = response.headers['deprecation'];
  const warning = response.headers['x-api-deprecation-warning'];
  
  if (deprecation === 'true') {
    console.warn('API version deprecated:', warning);
    // Alert your team
  }
  
  return response;
});
```

**5. Complete Migration**
```javascript
// Switch to new version
const client = axios.create({
  baseURL: 'https://api.marketplace.com/api/v2'
});
```

---

## Best Practices

### ✅ DO

- **Use URL versioning** for simplicity and caching
- **Monitor version headers** in responses
- **Subscribe to deprecation notices** via email
- **Test new versions** in staging before production
- **Migrate proactively** when new versions are released
- **Use latest version** for new projects

### ❌ DON'T

- **Mix versioning strategies** unnecessarily
- **Ignore deprecation warnings**
- **Wait until sunset** to start migration
- **Hardcode version numbers** everywhere
- **Skip testing** when upgrading versions

---

## Version Discovery

### Link Header

All responses include a `Link` header for version discovery:

```http
Link: </api/v1/services>; rel="version"; version="v1",
      </api/v2/services>; rel="version"; version="v2"
```

Parse this header to discover available versions:

```javascript
function parseVersionLinks(linkHeader) {
  const links = linkHeader.split(',');
  return links.map(link => {
    const [url, ...params] = link.split(';');
    const version = params
      .find(p => p.includes('version='))
      ?.split('=')[1]
      ?.replace(/"/g, '');
    return { url: url.trim(), version };
  });
}

// Usage
const versions = parseVersionLinks(response.headers.link);
console.log(versions);
// [{ url: '/api/v1/services', version: 'v1' }, ...]
```

---

## Admin Operations

### Deprecate a Version

```bash
POST /api/versions/v1/deprecate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "deprecationDate": "2025-12-01",
  "sunsetDate": "2026-03-01"
}

Response:
{
  "status": "success",
  "message": "Version v1 has been deprecated",
  "deprecationDate": "2025-12-01",
  "sunsetDate": "2026-03-01"
}
```

---

## FAQ

**Q: What happens if I don't specify a version?**  
A: You'll get the default version (currently v1). We recommend always specifying a version explicitly.

**Q: Can I use different versions for different endpoints?**  
A: Yes, version is determined per-request, so you can mix versions.

**Q: How long are versions supported?**  
A: Minimum 6 months stable + 3 months deprecation = 9 months total.

**Q: Will v1 ever be sunset?**  
A: Yes, but not before v2 is stable and well-adopted, with ample migration notice.

**Q: Do all endpoints support all versions?**  
A: Yes, all endpoints are available in all supported versions.

**Q: Are there breaking changes between versions?**  
A: We minimize breaking changes. V2 is mostly backward compatible with v1.

**Q: How do I know which version I'm using?**  
A: Check the `X-API-Version` response header.

**Q: Can I request features in new versions?**  
A: Yes! Contact us at support@22onsloane.co with feature requests.

---

## Support

For versioning questions:
- View all versions: `GET /api/versions`
- Get migration guide: `GET /api/versions/:version/migration`
- View changelog: `GET /api/versions/:version/changelog`
- Contact support: support@22onsloane.co

---

**Last Updated:** October 26, 2025
