# Marketplace API Documentation

**Version:** 1.0.0  
**Base URL:** `https://your-domain.com/api` or `http://localhost:5055/api`  
**Last Updated:** October 26, 2025

## Table of Contents

1. [Authentication](#authentication)
2. [Common Headers](#common-headers)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints](#endpoints)
   - [Health](#health-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Services (Listings)](#services-endpoints)
   - [Vendors](#vendors-endpoints)
   - [Startups](#startups-endpoints)
   - [Subscriptions](#subscriptions-endpoints)
   - [Bookings](#bookings-endpoints)
   - [Messages](#messages-endpoints)
   - [Wallets](#wallets-endpoints)
   - [Users](#users-endpoints)
   - [Admin](#admin-endpoints)
   - [Payments](#payments-endpoints)
   - [Mentorship](#mentorship-endpoints)
   - [LMS (Learning Management)](#lms-endpoints)
   - [Assistant](#assistant-endpoints)
   - [Tenants](#tenants-endpoints)
   - [Audit Logs](#audit-logs-endpoints)
   - [Integrity](#integrity-endpoints)
   - [Sync](#sync-endpoints)

---

## Authentication

### Supported Methods

1. **Firebase Authentication (Primary)**
   - Bearer token in Authorization header
   - Token obtained from Firebase Auth
   - Format: `Authorization: Bearer <firebase-id-token>`

2. **JWT Authentication (Optional)**
   - Custom JWT tokens
   - Format: `Authorization: Bearer <jwt-token>`

3. **API Key Authentication (Coming Soon)**
   - For machine-to-machine communication
   - Format: `X-API-Key: <your-api-key>`

### Authentication Levels

- **Public** - No authentication required
- **Authenticated** - Requires valid Firebase/JWT token
- **Admin** - Requires authenticated user with admin role
- **Vendor** - Requires vendor-specific permissions

---

## Common Headers

### Request Headers

```
Authorization: Bearer <token>       # Required for protected endpoints
X-Tenant-ID: <tenant-id>           # Optional, defaults to 'public'
Content-Type: application/json      # For POST/PUT/PATCH requests
```

### Response Headers

```
X-RateLimit-Limit: 100             # Max requests per window
X-RateLimit-Remaining: 95          # Remaining requests
X-RateLimit-Reset: 1698345600      # Unix timestamp
Cache-Control: no-store            # Caching policy
```

---

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": { ... },
  "page": 1,
  "pageSize": 20,
  "total": 150
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful deletion |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

Current rate limits (per IP/API key):
- **Public endpoints:** 100 requests/hour
- **Authenticated endpoints:** 1000 requests/hour
- **Admin endpoints:** 5000 requests/hour

---

# Endpoints

## Health Endpoints

### GET /health

Check API health status.

**Authentication:** None

**Response:**
```json
{
  "status": "ok",
  "ts": "2025-10-26T12:00:00.000Z"
}
```

---

## Authentication Endpoints

### GET /me

Get current authenticated user information.

**Authentication:** Required (Firebase Auth)

**Response:**
```json
{
  "uid": "user-firebase-uid",
  "email": "user@example.com",
  "role": "member|admin|vendor",
  "tenantId": "public|vendor|startup"
}
```

---

## Services Endpoints

Services represent marketplace listings/offerings.

### GET /data/services

Get list of services with filtering and pagination.

**Authentication:** None (Public)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (title, description) |
| `category` | string | Filter by category |
| `vendor` | string | Filter by vendor ID |
| `featured` | boolean | Filter featured services |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |

**Response:**
```json
{
  "page": 1,
  "pageSize": 20,
  "total": 150,
  "items": [
    {
      "id": "service-id-123",
      "title": "Service Title",
      "description": "Service description",
      "category": "Category Name",
      "price": 99.99,
      "currency": "ZAR",
      "vendor": "Vendor Name",
      "vendorId": "vendor-id-456",
      "contactEmail": "vendor@example.com",
      "featured": false,
      "rating": 4.5,
      "reviewCount": 10,
      "imageUrl": "https://...",
      "tenantId": "public",
      "createdAt": "2025-10-26T12:00:00.000Z",
      "updatedAt": "2025-10-26T12:00:00.000Z"
    }
  ]
}
```

### GET /data/services/mine

Get services owned by authenticated user (vendor).

**Authentication:** Required

**Query Parameters:**
- `refresh` (boolean) - Force reload from Firestore

**Response:**
```json
{
  "tenantId": "public",
  "vendor": {
    "id": "vendor-id",
    "vendorId": "vendor-id",
    "name": "Vendor Name",
    "email": "vendor@example.com"
  },
  "listings": [...],
  "bookings": [...]
}
```

### POST /data/services

Create a new service listing.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Service Title",
  "description": "Detailed description",
  "category": "Category Name",
  "price": 99.99,
  "currency": "ZAR",
  "vendor": "Vendor Name",
  "contactEmail": "vendor@example.com",
  "imageUrl": "https://...",
  "featured": false
}
```

**Response:** 201 Created
```json
{
  "id": "generated-service-id",
  "title": "Service Title",
  ...
}
```

### PUT /data/services/:id

Update an existing service.

**Authentication:** Required (Owner or Admin)

**Request Body:** Partial service object

**Response:** 200 OK

### DELETE /data/services/:id

Delete a service listing.

**Authentication:** Required (Owner or Admin)

**Response:** 204 No Content

### POST /data/services/:id/reviews

Add a review to a service.

**Authentication:** None (Public)

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great service!",
  "author": "John Doe",
  "authorEmail": "john@example.com"
}
```

**Response:** 201 Created

---

## Vendors Endpoints

### GET /data/vendors

Get list of vendors.

**Authentication:** None (Public)

**Query Parameters:**
- `page` (number) - Page number
- `pageSize` (number) - Items per page
- `q` (string) - Search query

**Response:**
```json
{
  "page": 1,
  "pageSize": 20,
  "total": 50,
  "items": [
    {
      "id": "vendor-id",
      "vendorId": "vendor-id",
      "name": "Vendor Name",
      "email": "vendor@example.com",
      "phone": "+27123456789",
      "website": "https://vendor.com",
      "description": "Vendor description",
      "logo": "https://...",
      "tenantId": "public",
      "createdAt": "2025-10-26T12:00:00.000Z"
    }
  ]
}
```

### POST /data/vendors

Create a new vendor profile.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Vendor Name",
  "email": "vendor@example.com",
  "phone": "+27123456789",
  "website": "https://vendor.com",
  "description": "Vendor description",
  "logo": "https://..."
}
```

### PUT /data/vendors/:id

Update vendor profile.

**Authentication:** Required (Owner or Admin)

### DELETE /data/vendors/:id

Delete vendor profile.

**Authentication:** Required (Owner or Admin)

---

## Startups Endpoints

### GET /data/startups

Get list of startups.

**Authentication:** None (Public)

**Query Parameters:** Similar to vendors

**Response:** Similar structure to vendors

### POST /data/startups

Create startup profile.

**Authentication:** Required

### PUT /data/startups/:id

Update startup profile.

**Authentication:** Required

---

## Subscriptions Endpoints

### GET /subscriptions/my

Get current user's subscriptions.

**Authentication:** Required

**Response:**
```json
{
  "items": [
    {
      "id": "subscription-id",
      "serviceId": "service-id",
      "email": "user@example.com",
      "uid": "user-uid",
      "type": "service",
      "status": "active",
      "createdAt": "2025-10-26T12:00:00.000Z",
      "canceledAt": null
    }
  ]
}
```

### GET /subscriptions/bookings/mine

Get user's bookings.

**Authentication:** Required

**Response:**
```json
{
  "items": [
    {
      "id": "booking-id",
      "subscriptionId": "subscription-id",
      "serviceId": "service-id",
      "customerEmail": "user@example.com",
      "customerName": "User Name",
      "scheduledDate": "2025-10-30",
      "scheduledSlot": "14:00",
      "status": "confirmed",
      "bookedAt": "2025-10-26T12:00:00.000Z"
    }
  ]
}
```

### GET /subscriptions/service/:id

Get subscribers for a specific service.

**Authentication:** Required

**Query Parameters:**
- `page` (number)
- `pageSize` (number)
- `q` (string) - Search by email

### POST /subscriptions/service

Subscribe to a service.

**Authentication:** Required

**Request Body:**
```json
{
  "serviceId": "service-id",
  "scheduledDate": "2025-10-30",
  "scheduledSlot": "14:00",
  "customerName": "User Name"
}
```

**Response:** 201 Created

### DELETE /subscriptions/service

Unsubscribe from a service.

**Authentication:** Required

**Request Body:**
```json
{
  "serviceId": "service-id"
}
```

### PUT /subscriptions/service/cancel

Cancel a subscription.

**Authentication:** Required

---

## Bookings Endpoints

### GET /bookings/vendor/:vendorId

Get bookings for a vendor.

**Authentication:** Required

**Response:**
```json
{
  "items": [
    {
      "id": "booking-id",
      "serviceId": "service-id",
      "serviceTitle": "Service Title",
      "customerEmail": "user@example.com",
      "customerName": "User Name",
      "scheduledDate": "2025-10-30",
      "scheduledSlot": "14:00",
      "status": "confirmed",
      "meetingLink": "https://meet.example.com/...",
      "bookedAt": "2025-10-26T12:00:00.000Z"
    }
  ]
}
```

### POST /bookings/:bookingId/meeting-link

Add meeting link to booking.

**Authentication:** Required (Vendor)

**Request Body:**
```json
{
  "meetingLink": "https://meet.example.com/..."
}
```

---

## Messages Endpoints

### GET /messages

Get messages for authenticated user.

**Authentication:** Required

**Query Parameters:**
- `page` (number)
- `pageSize` (number)
- `q` (string) - Search

**Response:**
```json
{
  "items": [
    {
      "id": "message-id",
      "subject": "Message Subject",
      "content": "Message content",
      "from": "sender@example.com",
      "to": "recipient@example.com",
      "listingId": "service-id",
      "read": false,
      "createdAt": "2025-10-26T12:00:00.000Z",
      "replies": []
    }
  ]
}
```

### GET /messages/:id

Get specific message details.

**Authentication:** Required

### POST /messages

Send a new message.

**Authentication:** Required

**Request Body:**
```json
{
  "listingId": "service-id",
  "listingTitle": "Service Title",
  "vendorId": "vendor-id",
  "vendorEmail": "vendor@example.com",
  "subject": "Message Subject",
  "content": "Message content"
}
```

### POST /messages/reply

Reply to a message.

**Authentication:** Required

**Request Body:**
```json
{
  "threadId": "message-id",
  "content": "Reply content"
}
```

### POST /messages/read

Mark message as read.

**Authentication:** Required

**Request Body:**
```json
{
  "messageId": "message-id"
}
```

### POST /messages/compose

Compose direct message.

**Authentication:** Required

**Request Body:**
```json
{
  "recipientEmail": "recipient@example.com",
  "subject": "Subject",
  "content": "Message content",
  "type": "direct|vendor_admin"
}
```

### POST /messages/sync

Sync messages from Firestore.

**Authentication:** Required

---

## Wallets Endpoints

### GET /wallets/me

Get current user's wallet information.

**Authentication:** Required

**Response:**
```json
{
  "email": "user@example.com",
  "balance": 1000,
  "currency": "ZAR",
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z"
}
```

### POST /wallets/me/redeem

Redeem credits from wallet.

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 100,
  "serviceId": "service-id",
  "description": "Payment for service"
}
```

### POST /wallets/grant

Grant credits to user (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "email": "user@example.com",
  "amount": 500,
  "description": "Credit grant"
}
```

### GET /wallets/admin/lookup

Lookup user wallet (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `email` (string) - User email

### GET /wallets/admin/transactions

Get all wallet transactions (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `page` (number)
- `pageSize` (number)
- `email` (string) - Filter by email
- `type` (string) - Filter by type (credit|debit|grant)

---

## Users Endpoints

### GET /users

Get list of users.

**Authentication:** None (Public, limited data)

### GET /users/me

Get current user information.

**Authentication:** Required

### GET /users/:email/privileges

Get user privileges.

**Authentication:** Required

### POST /users

Create new user.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "role": "member|admin|vendor",
  "tenantId": "public"
}
```

### PATCH /users/:email/privileges

Update user privileges.

**Authentication:** Required

**Request Body:**
```json
{
  "role": "admin",
  "permissions": ["read", "write", "delete"]
}
```

### POST /users/upgrade

Upgrade user role.

**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "newRole": "vendor"
}
```

### PUT /users/bulk

Bulk update users.

**Authentication:** Required

### GET /users/lookup

Lookup user by email.

**Authentication:** Required

**Query Parameters:**
- `email` (string)

### DELETE /users

Delete user.

**Authentication:** Required

### GET /users/all

Get all users.

**Authentication:** Required

### POST /users/batch-lookup

Batch lookup multiple users.

**Authentication:** Required

**Request Body:**
```json
{
  "emails": ["user1@example.com", "user2@example.com"]
}
```

### POST /users/batch-privileges

Batch update user privileges.

**Authentication:** Required

### GET /users/all-contacts

Get all user contacts.

**Authentication:** Required

---

## Admin Endpoints

All admin endpoints require admin authentication.

### POST /admin/wallet/add-credits

Add credits to user wallet.

**Request Body:**
```json
{
  "email": "user@example.com",
  "amount": 500,
  "description": "Credit bonus"
}
```

### POST /admin/wallet/bulk-credits

Bulk add credits to multiple users.

**Request Body:**
```json
{
  "grants": [
    {
      "email": "user1@example.com",
      "amount": 100,
      "description": "Welcome bonus"
    }
  ]
}
```

### GET /admin/wallet/transactions

Get all wallet transactions.

**Query Parameters:**
- `page`, `pageSize`
- `email` (filter)
- `type` (filter)

### GET /admin/wallet/summary

Get wallet system summary.

**Response:**
```json
{
  "totalWallets": 100,
  "totalBalance": 50000,
  "totalTransactions": 500,
  "recentActivity": [...]
}
```

### GET /admin/wallet/users

Get all users with wallets.

### POST /admin/wallet/normalize-appdata

Normalize wallet data in appData.

### POST /admin/wallet/sync-firebase-users

Sync Firebase users with wallet system.

---

## Payments Endpoints

### GET /payments/sponsored-groups

Get sponsored groups available.

**Authentication:** None (Public)

**Response:**
```json
{
  "groups": [
    {
      "id": "group-id",
      "name": "Group Name",
      "discount": 20,
      "eligibilityCriteria": "..."
    }
  ]
}
```

### POST /payments/redeem-voucher

Redeem a voucher code.

**Request Body:**
```json
{
  "code": "VOUCHER-CODE",
  "serviceId": "service-id"
}
```

### POST /payments/pay-with-credits

Pay for service using wallet credits.

**Request Body:**
```json
{
  "serviceId": "service-id",
  "amount": 100
}
```

### POST /payments/apply-sponsorship

Apply sponsorship to a subscription.

**Request Body:**
```json
{
  "serviceId": "service-id",
  "sponsorshipId": "sponsorship-id"
}
```

---

## Mentorship Endpoints

### GET /mentorship

Get mentorship programs.

**Authentication:** None (Public)

**Query Parameters:**
- `page`, `pageSize`
- `category` (filter)
- `status` (filter)

**Response:**
```json
{
  "items": [
    {
      "id": "mentorship-id",
      "title": "Mentorship Program",
      "description": "...",
      "mentor": {
        "name": "Mentor Name",
        "email": "mentor@example.com"
      },
      "category": "Business",
      "status": "open|closed",
      "maxParticipants": 10,
      "currentParticipants": 5
    }
  ]
}
```

---

## LMS Endpoints

Learning Management System endpoints.

### GET /lms/live

Get live/published LMS data.

**Authentication:** None (Public)

**Response:**
```json
{
  "services": [...],
  "vendors": [...],
  "courses": [...],
  "lessons": [...]
}
```

### GET /lms/checkpoints

Get LMS checkpoints (snapshots).

**Authentication:** Required (Admin)

**Response:**
```json
{
  "checkpoints": [
    {
      "id": "checkpoint-id",
      "timestamp": "2025-10-26T12:00:00.000Z",
      "description": "Checkpoint description",
      "size": 1024000
    }
  ]
}
```

### GET /lms/checkpoints/:id

Get specific checkpoint.

**Authentication:** Required (Admin)

### POST /lms/checkpoints

Create new checkpoint.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "description": "Checkpoint description"
}
```

### DELETE /lms/checkpoints

Delete all checkpoints.

**Authentication:** Required (Admin)

### POST /lms/restore/:id

Restore from checkpoint.

**Authentication:** Required (Admin)

### PUT /lms/publish

Publish LMS data.

**Authentication:** Required (Admin)

---

## Assistant Endpoints

### POST /assistant/ask

Ask the AI assistant a question.

**Authentication:** None (Public)

**Request Body:**
```json
{
  "question": "What services are available?",
  "context": {
    "userId": "optional-user-id",
    "tenantId": "public"
  }
}
```

**Response:**
```json
{
  "answer": "AI generated response",
  "suggestions": ["Follow-up question 1", "Follow-up question 2"],
  "sources": [...]
}
```

---

## Tenants Endpoints

### GET /tenants/current

Get current tenant information.

**Authentication:** None (Public)

**Response:**
```json
{
  "id": "public",
  "name": "Public Tenant",
  "description": "..."
}
```

### GET /tenants

Get all tenants.

**Authentication:** None (Public)

**Response:**
```json
{
  "items": [
    {
      "id": "public",
      "name": "Public Tenant"
    },
    {
      "id": "vendor",
      "name": "Vendor Tenant"
    }
  ]
}
```

---

## Audit Logs Endpoints

### GET /audit-logs

Get audit logs.

**Authentication:** Required

**Query Parameters:**
- `search` (string)
- `userEmail` (string)
- `action` (string)
- `dateFrom` (ISO date)
- `dateTo` (ISO date)
- `limit` (number)

**Response:**
```json
{
  "items": [
    {
      "id": "log-id",
      "timestamp": "2025-10-26T12:00:00.000Z",
      "userEmail": "user@example.com",
      "action": "create|update|delete",
      "targetType": "services|vendors|users",
      "targetId": "target-id",
      "ip": "192.168.1.1",
      "status": 200,
      "duration": 150
    }
  ]
}
```

### POST /audit-logs

Create audit log entry.

**Authentication:** Required

**Request Body:**
```json
{
  "action": "action-name",
  "targetType": "resource-type",
  "targetId": "resource-id",
  "details": {}
}
```

---

## Integrity Endpoints

Data integrity validation endpoints (Admin only).

### GET /integrity/validate-integrity

Validate data integrity.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "status": "ok|error",
  "issues": [
    {
      "type": "orphaned_record|missing_reference",
      "resource": "services",
      "id": "resource-id",
      "message": "Description of issue"
    }
  ]
}
```

### POST /integrity/sync-vendors

Sync vendor data across systems.

**Authentication:** Required (Admin)

### GET /integrity/validate-service-vendors

Validate service-vendor relationships.

**Authentication:** Required (Admin)

---

## Sync Endpoints

Data synchronization endpoints.

### GET /sync/status

Get sync status.

**Authentication:** Required

**Response:**
```json
{
  "lastSync": "2025-10-26T12:00:00.000Z",
  "status": "idle|syncing|error",
  "pendingChanges": 5
}
```

### POST /sync/now

Trigger immediate sync.

**Authentication:** Required

### POST /sync/create-missing

Create missing records during sync.

**Authentication:** Required

**Request Body:**
```json
{
  "resourceType": "vendors|startups|services",
  "force": false
}
```

---

## Pagination

All list endpoints support pagination with the following parameters:

```
?page=1&pageSize=20
```

Response includes pagination metadata:
```json
{
  "page": 1,
  "pageSize": 20,
  "total": 150,
  "items": [...]
}
```

---

## Filtering

List endpoints support various filters:

```
?q=search+term          # Text search
?category=Business      # Category filter
?status=active          # Status filter
?minPrice=10&maxPrice=100  # Range filter
```

---

## Sorting

Add sorting to queries (where supported):

```
?sortBy=createdAt&sortOrder=desc
?sortBy=price&sortOrder=asc
```

---

## Webhooks (Coming Soon)

Register webhooks to receive real-time notifications:

### Events
- `subscription.created`
- `subscription.canceled`
- `booking.created`
- `booking.confirmed`
- `message.received`
- `payment.completed`
- `wallet.transaction`

---

## SDK Support (Coming Soon)

Official SDKs will be available for:
- JavaScript/TypeScript (npm)
- Python (PyPI)
- Java (Maven)
- C# (.NET)

---

## Support

For API support, please contact:
- Email: support@example.com
- Documentation: https://docs.example.com
- Status Page: https://status.example.com

---

## Changelog

### Version 1.0.0 (2025-10-26)
- Initial API documentation
- All core endpoints documented
- Authentication and rate limiting specifications
- Common response formats standardized
