# API Endpoint Inventory

Quick reference of all available endpoints.

## Health & Status

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | API health check |

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | Required | Get current user info |

## Services (Marketplace Listings)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/data/services` | None | List all services (paginated, filterable) |
| GET | `/data/services/mine` | Required | Get my vendor services |
| POST | `/data/services` | Required | Create new service |
| PUT | `/data/services/:id` | Required | Update service |
| DELETE | `/data/services/:id` | Required | Delete service |
| POST | `/data/services/:id/reviews` | None | Add review to service |

## Vendors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/data/vendors` | None | List all vendors |
| POST | `/data/vendors` | Required | Create vendor profile |
| PUT | `/data/vendors/:id` | Required | Update vendor |
| DELETE | `/data/vendors/:id` | Required | Delete vendor |

## Startups

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/data/startups` | None | List all startups |
| POST | `/data/startups` | Required | Create startup profile |
| PUT | `/data/startups/:id` | Required | Update startup |

## Subscriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/subscriptions/my` | Required | Get my subscriptions |
| GET | `/subscriptions/bookings/mine` | Required | Get my bookings |
| GET | `/subscriptions/service/:id` | Required | Get subscribers for service |
| POST | `/subscriptions/service` | Required | Subscribe to service |
| DELETE | `/subscriptions/service` | Required | Unsubscribe from service |
| PUT | `/subscriptions/service/cancel` | Required | Cancel subscription |

## Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bookings/vendor/:vendorId` | Required | Get bookings for vendor |
| POST | `/bookings/:bookingId/meeting-link` | Required | Add meeting link to booking |

## Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages` | Required | List messages (paginated) |
| GET | `/messages/:id` | Required | Get specific message |
| POST | `/messages` | Required | Send new message |
| POST | `/messages/reply` | Required | Reply to message |
| POST | `/messages/read` | Required | Mark message as read |
| POST | `/messages/compose` | Required | Compose direct message |
| POST | `/messages/sync` | Required | Sync messages from Firestore |

## Wallets & Credits

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wallets/me` | Required | Get my wallet info |
| POST | `/wallets/me/redeem` | Required | Redeem wallet credits |
| POST | `/wallets/grant` | Admin | Grant credits to user |
| GET | `/wallets/admin/lookup` | Admin | Lookup user wallet |
| GET | `/wallets/admin/transactions` | Admin | Get all transactions |
| GET | `/wallets/admin/debug/wallets` | Admin | Debug wallet data |
| GET | `/wallets/admin/debug/routes` | None | Debug routes |
| POST | `/wallets/admin/debug/test-create` | Admin | Test wallet creation |
| POST | `/wallets/admin/debug/test-transaction` | Admin | Test transaction |

## Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | None | List users (public data) |
| GET | `/users/me` | Required | Get current user details |
| GET | `/users/:email/privileges` | Required | Get user privileges |
| POST | `/users` | Admin | Create new user |
| PATCH | `/users/:email/privileges` | Required | Update user privileges |
| POST | `/users/upgrade` | None | Upgrade user role |
| PUT | `/users/bulk` | Required | Bulk update users |
| GET | `/users/lookup` | Required | Lookup user by email |
| DELETE | `/users` | Required | Delete user |
| GET | `/users/all` | Required | Get all users |
| POST | `/users/batch-lookup` | Required | Batch lookup users |
| POST | `/users/batch-privileges` | Required | Batch update privileges |
| GET | `/users/all-contacts` | Required | Get all user contacts |

## Admin Operations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/wallet/add-credits` | Admin | Add credits to user |
| POST | `/admin/wallet/bulk-credits` | Admin | Bulk add credits |
| GET | `/admin/wallet/transactions` | Admin | Get all transactions |
| GET | `/admin/wallet/summary` | Admin | Get wallet system summary |
| GET | `/admin/wallet/users` | Admin | Get all wallet users |
| POST | `/admin/wallet/normalize-appdata` | Admin | Normalize wallet data |
| POST | `/admin/wallet/sync-firebase-users` | Admin | Sync Firebase users |

## Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments/sponsored-groups` | None | Get sponsored groups |
| POST | `/payments/redeem-voucher` | None | Redeem voucher code |
| POST | `/payments/pay-with-credits` | None | Pay with wallet credits |
| POST | `/payments/apply-sponsorship` | None | Apply sponsorship |

## Mentorship

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/mentorship` | None | List mentorship programs |

## LMS (Learning Management System)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/lms/live` | None | Get published LMS data |
| GET | `/lms/checkpoints` | Admin | Get LMS checkpoints |
| GET | `/lms/checkpoints/:id` | Admin | Get specific checkpoint |
| POST | `/lms/checkpoints` | Admin | Create checkpoint |
| DELETE | `/lms/checkpoints` | Admin | Delete all checkpoints |
| POST | `/lms/restore/:id` | Admin | Restore from checkpoint |
| PUT | `/lms/publish` | Admin | Publish LMS data |

## AI Assistant

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/assistant/ask` | None | Ask AI assistant question |

## Tenants (Multi-tenancy)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tenants/current` | None | Get current tenant |
| GET | `/tenants` | None | List all tenants |

## Audit Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/audit-logs` | Required | Get audit logs (filtered) |
| POST | `/audit-logs` | Required | Create audit log entry |

## Data Integrity

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/integrity/validate-integrity` | Admin | Validate data integrity |
| POST | `/integrity/sync-vendors` | Admin | Sync vendor data |
| GET | `/integrity/validate-service-vendors` | Admin | Validate service-vendor links |

## Data Synchronization

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/sync/status` | Required | Get sync status |
| POST | `/sync/now` | Required | Trigger immediate sync |
| POST | `/sync/create-missing` | Required | Create missing records |

---

## Summary Statistics

- **Total Endpoints:** 80+
- **Public Endpoints (No Auth):** 20
- **Authenticated Endpoints:** 45
- **Admin Only Endpoints:** 15

## Authentication Levels

- **None** - Public access
- **Required** - Any authenticated user (Firebase/JWT)
- **Admin** - Admin role required
- **Vendor** - Vendor-specific permissions

## Common Query Parameters

Most list endpoints support:
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)
- `q` - Search query
- `sort` - Sort field
- `order` - Sort order (asc/desc)

## Base URLs

- **Development:** `http://localhost:5055/api`
- **Production:** `https://your-domain.com/api`

## Standard Headers

```
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
Content-Type: application/json
```

---

For complete documentation, see:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Full reference
- [API_QUICK_START.md](./API_QUICK_START.md) - Quick start guide
- [openapi.yaml](./openapi.yaml) - OpenAPI specification
- [postman_collection.json](./postman_collection.json) - Postman collection
