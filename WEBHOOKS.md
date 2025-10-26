# Webhook System Documentation

## Overview

The webhook system enables external applications to receive real-time notifications about events in the marketplace. This push-based notification system eliminates the need for polling and ensures external apps are immediately notified of important events.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Webhook Events](#webhook-events)
3. [Creating Webhooks](#creating-webhooks)
4. [Signature Verification](#signature-verification)
5. [Delivery & Retry Logic](#delivery--retry-logic)
6. [Managing Webhooks](#managing-webhooks)
7. [Testing Webhooks](#testing-webhooks)
8. [Security Best Practices](#security-best-practices)
9. [Examples](#examples)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Create a Webhook Endpoint

Your application needs an HTTP endpoint that can receive POST requests:

```javascript
// Node.js/Express example
app.post('/webhooks/marketplace', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const event = req.headers['x-webhook-event'];
  const payload = req.body;
  
  // Verify signature (see Signature Verification section)
  if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process event
  console.log(`Received ${event}:`, payload);
  
  // Respond with 2xx status to confirm receipt
  res.status(200).json({ received: true });
});
```

### 2. Register Your Webhook

```bash
curl -X POST https://your-api.com/api/webhooks \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/marketplace",
    "events": ["booking.created", "payment.succeeded"],
    "description": "Production webhook for bookings and payments",
    "active": true
  }'
```

Response:
```json
{
  "message": "Webhook created successfully",
  "webhook": {
    "id": "webhook_abc123",
    "url": "https://your-app.com/webhooks/marketplace",
    "events": ["booking.created", "payment.succeeded"],
    "secret": "whsec_d8f7g6h5j4k3l2m1n0o9p8q7r6s5t4u3v2w1x0y9z8",
    "active": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**⚠️ Important:** Save the `secret` - it's only shown once and is used to verify webhook signatures.

### 3. Test Your Webhook

```bash
curl -X POST https://your-api.com/api/webhooks/webhook_abc123/test \
  -H "X-API-Key: your_api_key"
```

---

## Webhook Events

### Available Events

The system supports the following webhook events:

#### Booking Events
- `booking.created` - A new booking was created
- `booking.updated` - A booking was updated
- `booking.cancelled` - A booking was cancelled
- `booking.completed` - A booking was completed

#### Payment Events
- `payment.succeeded` - A payment was successful
- `payment.failed` - A payment failed
- `payment.refunded` - A payment was refunded

#### Subscription Events
- `subscription.created` - A new subscription was created
- `subscription.updated` - A subscription was updated
- `subscription.cancelled` - A subscription was cancelled
- `subscription.expired` - A subscription expired

#### Service Events
- `service.created` - A new service was created
- `service.updated` - A service was updated
- `service.deleted` - A service was deleted

#### User Events
- `user.created` - A new user registered
- `user.updated` - User profile was updated

#### Wallet Events
- `wallet.credited` - Wallet was credited
- `wallet.debited` - Wallet was debited

#### Rate Limit Events
- `ratelimit.warning` - Rate limit threshold exceeded (80%)
- `ratelimit.exceeded` - Rate limit fully exceeded

### List All Events

```bash
GET /api/webhooks/meta/events
```

Response:
```json
{
  "events": [
    {
      "event": "booking.created",
      "description": "A new booking was created",
      "category": "booking"
    }
  ],
  "byCategory": {
    "booking": [
      { "event": "booking.created", "description": "..." },
      { "event": "booking.updated", "description": "..." }
    ],
    "payment": [...]
  },
  "total": 18
}
```

---

## Creating Webhooks

### Create Webhook

```http
POST /api/webhooks
X-API-Key: your_api_key
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["booking.created", "payment.succeeded"],
  "description": "Production webhook",
  "active": true
}
```

**Validation Rules:**
- `url` (required): Must be a valid HTTP/HTTPS URL
- `events` (required): Array of at least one valid event type
- `description` (optional): Human-readable description
- `active` (optional): Boolean, defaults to `true`

**Response:**
```json
{
  "message": "Webhook created successfully",
  "webhook": {
    "id": "webhook_abc123",
    "appId": "app_xyz789",
    "url": "https://your-app.com/webhooks",
    "events": ["booking.created", "payment.succeeded"],
    "description": "Production webhook",
    "secret": "whsec_...",
    "active": true,
    "totalDeliveries": 0,
    "successfulDeliveries": 0,
    "failedDeliveries": 0,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### List Webhooks

```http
GET /api/webhooks?active=true&event=booking.created
X-API-Key: your_api_key
```

**Query Parameters:**
- `active` (optional): Filter by active status (`true`/`false`)
- `event` (optional): Filter by specific event type

**Response:**
```json
{
  "webhooks": [
    {
      "id": "webhook_abc123",
      "url": "https://your-app.com/webhooks",
      "events": ["booking.created"],
      "active": true,
      "totalDeliveries": 150,
      "successfulDeliveries": 148,
      "failedDeliveries": 2,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

## Signature Verification

All webhook deliveries include an HMAC-SHA256 signature in the `X-Webhook-Signature` header. **Always verify this signature** before processing webhooks.

### How Signatures Work

1. The system generates a signature using your webhook secret:
   ```
   signature = HMAC-SHA256(secret, JSON.stringify(payload))
   ```

2. The signature is sent in the `X-Webhook-Signature` header

3. Your application verifies the signature matches

### Verification Examples

#### Node.js
```javascript
import crypto from 'crypto';

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  
  if (!verifySignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
  res.status(200).json({ received: true });
});
```

#### Python
```python
import hmac
import hashlib
import json

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        json.dumps(payload, separators=(',', ':')).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)

# In your Flask handler
@app.route('/webhooks', methods=['POST'])
def webhook_handler():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.json
    
    if not verify_signature(payload, signature, os.getenv('WEBHOOK_SECRET')):
        return {'error': 'Invalid signature'}, 401
    
    # Process webhook...
    return {'received': True}, 200
```

#### PHP
```php
<?php
function verifySignature($payload, $signature, $secret) {
    $expected = hash_hmac(
        'sha256',
        json_encode($payload, JSON_UNESCAPED_SLASHES),
        $secret
    );
    
    return hash_equals($signature, $expected);
}

// In your webhook handler
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'];
$payload = json_decode(file_get_contents('php://input'), true);

if (!verifySignature($payload, $signature, getenv('WEBHOOK_SECRET'))) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Process webhook...
http_response_code(200);
echo json_encode(['received' => true]);
?>
```

---

## Delivery & Retry Logic

### Webhook Payload Format

Every webhook delivery includes:

```json
{
  "id": "evt_abc123xyz",
  "event": "booking.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "attempt": 1,
  "data": {
    "bookingId": "booking_123",
    "serviceId": "service_456",
    "userId": "user_789",
    "status": "confirmed",
    ...
  }
}
```

### Request Headers

- `Content-Type: application/json`
- `X-Webhook-Signature: <hmac_signature>`
- `X-Webhook-Event: <event_type>`
- `X-Webhook-ID: <unique_delivery_id>`
- `X-Webhook-Attempt: <attempt_number>`
- `User-Agent: Marketplace-Webhook/1.0`

### Successful Delivery

Your endpoint should respond with a **2xx status code** (200, 201, 204, etc.) within 10 seconds. Any other status code is considered a failure.

```javascript
// Good responses
res.status(200).json({ received: true });
res.status(204).send();
```

### Retry Logic

If delivery fails (non-2xx response, timeout, or network error), the system automatically retries with exponential backoff:

| Attempt | Delay      | Total Time Elapsed |
|---------|------------|-------------------|
| 1       | Immediate  | 0s                |
| 2       | 2 seconds  | 2s                |
| 3       | 4 seconds  | 6s                |
| 4       | 8 seconds  | 14s               |
| 5       | 16 seconds | 30s               |
| 6 (max) | 32 seconds | 62s               |

**Maximum Attempts:** 5 retries (6 total attempts)  
**Timeout:** 10 seconds per attempt  
**Total Time:** Up to ~1 minute from first attempt to final retry

### Delivery Tracking

All delivery attempts are tracked in the `webhookDeliveries` collection with:
- Status (success/failed)
- HTTP status code
- Response time (duration in ms)
- Attempt number
- Error message (if failed)

---

## Managing Webhooks

### Get Webhook Details

```http
GET /api/webhooks/:id
X-API-Key: your_api_key
```

### Update Webhook

```http
PATCH /api/webhooks/:id
X-API-Key: your_api_key
Content-Type: application/json
```

```json
{
  "url": "https://new-url.com/webhooks",
  "events": ["booking.created", "booking.updated", "payment.succeeded"],
  "active": true
}
```

### Delete Webhook

```http
DELETE /api/webhooks/:id
X-API-Key: your_api_key
```

### Rotate Webhook Secret

If your webhook secret is compromised, generate a new one:

```http
POST /api/webhooks/:id/rotate-secret
X-API-Key: your_api_key
```

Response:
```json
{
  "message": "Webhook secret rotated successfully",
  "webhookId": "webhook_abc123",
  "secret": "whsec_NEW_SECRET_HERE"
}
```

**⚠️ Important:** Update your verification code immediately after rotating the secret.

---

## Testing Webhooks

### Test Endpoint

Send a test webhook to verify your endpoint is working:

```http
POST /api/webhooks/:id/test
X-API-Key: your_api_key
```

Response:
```json
{
  "message": "Test webhook delivered successfully",
  "result": {
    "success": true,
    "statusCode": 200,
    "duration": 145
  }
}
```

### Get Webhook Statistics

```http
GET /api/webhooks/:id/stats?days=7
X-API-Key: your_api_key
```

Response:
```json
{
  "webhookId": "webhook_abc123",
  "period": "7 days",
  "stats": {
    "total": 250,
    "successful": 245,
    "failed": 5,
    "averageDuration": 180,
    "eventBreakdown": {
      "booking.created": { "total": 100, "successful": 98, "failed": 2 },
      "payment.succeeded": { "total": 150, "successful": 147, "failed": 3 }
    },
    "recentDeliveries": [...]
  }
}
```

### View Delivery History

```http
GET /api/webhooks/:id/deliveries?limit=50&status=failed&event=booking.created
X-API-Key: your_api_key
```

**Query Parameters:**
- `limit` (optional): Number of deliveries to return (default: 50)
- `status` (optional): Filter by status (`success`/`failed`)
- `event` (optional): Filter by event type

Response:
```json
{
  "webhookId": "webhook_abc123",
  "deliveries": [
    {
      "id": "delivery_xyz789",
      "event": "booking.created",
      "status": "success",
      "statusCode": 200,
      "attempt": 1,
      "duration": 150,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 50
}
```

### Replay Failed Delivery

If a delivery failed, you can manually replay it:

```http
POST /api/webhooks/deliveries/:deliveryId/replay
X-API-Key: your_api_key
```

Response:
```json
{
  "message": "Webhook delivery replayed",
  "result": {
    "success": true,
    "originalDeliveryId": "delivery_xyz789",
    "newDelivery": {
      "success": true,
      "statusCode": 200,
      "duration": 145
    }
  }
}
```

---

## Security Best Practices

### 1. Always Verify Signatures

```javascript
// ✅ Good
if (!verifySignature(payload, signature, secret)) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// ❌ Bad - never skip verification
// processWebhook(payload); // DON'T DO THIS
```

### 2. Use HTTPS for Webhook URLs

```javascript
// ✅ Good
url: "https://your-app.com/webhooks"

// ❌ Bad - HTTP is not secure
// url: "http://your-app.com/webhooks"
```

### 3. Store Secrets Securely

```javascript
// ✅ Good - use environment variables
const secret = process.env.WEBHOOK_SECRET;

// ❌ Bad - hardcoded secrets
// const secret = "whsec_abc123"; // DON'T DO THIS
```

### 4. Implement Idempotency

Webhooks may be delivered multiple times. Use the `X-Webhook-ID` header to prevent duplicate processing:

```javascript
const processedIds = new Set(); // In production, use Redis/database

app.post('/webhooks', async (req, res) => {
  const webhookId = req.headers['x-webhook-id'];
  
  // Check if already processed
  if (processedIds.has(webhookId)) {
    return res.status(200).json({ received: true, duplicate: true });
  }
  
  // Process webhook
  await processEvent(req.body);
  
  // Mark as processed
  processedIds.add(webhookId);
  
  res.status(200).json({ received: true });
});
```

### 5. Respond Quickly

Don't perform long-running operations in your webhook handler. Acknowledge receipt quickly and process asynchronously:

```javascript
// ✅ Good - async processing
app.post('/webhooks', async (req, res) => {
  // Verify signature
  if (!verifySignature(req.body, req.headers['x-webhook-signature'], secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Queue for async processing
  await queue.add('process-webhook', req.body);
  
  // Respond immediately
  res.status(200).json({ received: true });
});

// ❌ Bad - synchronous long operations
app.post('/webhooks', async (req, res) => {
  await longRunningOperation(); // This times out
  res.status(200).json({ received: true });
});
```

### 6. Rate Limit Your Webhook Endpoint

Protect your webhook endpoint from abuse:

```javascript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

app.post('/webhooks', webhookLimiter, webhookHandler);
```

### 7. Log All Deliveries

Maintain audit logs for debugging:

```javascript
app.post('/webhooks', async (req, res) => {
  const event = req.headers['x-webhook-event'];
  const webhookId = req.headers['x-webhook-id'];
  
  console.log('Webhook received:', {
    id: webhookId,
    event,
    timestamp: new Date().toISOString()
  });
  
  // Process...
});
```

---

## Examples

### Complete Node.js/Express Implementation

```javascript
import express from 'express';
import crypto from 'crypto';
import { Queue } from 'bull'; // For async processing

const app = express();
const webhookQueue = new Queue('webhooks');

// Store processed webhook IDs (use Redis in production)
const processedWebhooks = new Set();

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expected = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

app.post('/webhooks/marketplace', express.json(), async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const event = req.headers['x-webhook-event'];
  const webhookId = req.headers['x-webhook-id'];
  const attempt = parseInt(req.headers['x-webhook-attempt'] || '1');
  
  // Log receipt
  console.log(`[Webhook] Received ${event} (id: ${webhookId}, attempt: ${attempt})`);
  
  // Verify signature
  if (!verifySignature(req.body, signature, process.env.WEBHOOK_SECRET)) {
    console.error('[Webhook] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Check for duplicates
  if (processedWebhooks.has(webhookId)) {
    console.log('[Webhook] Duplicate webhook, already processed');
    return res.status(200).json({ received: true, duplicate: true });
  }
  
  // Queue for async processing
  try {
    await webhookQueue.add({
      webhookId,
      event,
      payload: req.body,
      receivedAt: new Date().toISOString()
    });
    
    // Mark as processed
    processedWebhooks.add(webhookId);
    
    // Respond immediately
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('[Webhook] Error queuing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Process webhooks asynchronously
webhookQueue.process(async (job) => {
  const { webhookId, event, payload } = job.data;
  
  console.log(`[Webhook] Processing ${event} (id: ${webhookId})`);
  
  try {
    switch (event) {
      case 'booking.created':
        await handleBookingCreated(payload.data);
        break;
        
      case 'payment.succeeded':
        await handlePaymentSucceeded(payload.data);
        break;
        
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.data);
        break;
        
      default:
        console.log(`[Webhook] Unknown event type: ${event}`);
    }
    
    console.log(`[Webhook] Successfully processed ${event}`);
    
  } catch (error) {
    console.error(`[Webhook] Error processing ${event}:`, error);
    throw error; // Retry via Bull queue
  }
});

async function handleBookingCreated(data) {
  // Send confirmation email
  await sendEmail(data.userId, 'Booking Confirmed', {
    bookingId: data.bookingId,
    serviceName: data.serviceName
  });
  
  // Update calendar
  await updateCalendar(data);
  
  // Notify vendor
  await notifyVendor(data.vendorId, data);
}

async function handlePaymentSucceeded(data) {
  // Update payment status
  await updatePaymentStatus(data.paymentId, 'succeeded');
  
  // Send receipt
  await sendReceipt(data.userId, data);
  
  // Update accounting
  await updateAccounting(data);
}

async function handleSubscriptionCancelled(data) {
  // Revoke access
  await revokeAccess(data.userId, data.subscriptionId);
  
  // Send cancellation email
  await sendEmail(data.userId, 'Subscription Cancelled', data);
  
  // Update billing
  await updateBilling(data);
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

---

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Webhook is Active**
```bash
GET /api/webhooks/:id
```
Verify `"active": true` in response.

**Check 2: Correct Events Subscribed**
```bash
GET /api/webhooks/:id
```
Verify the `events` array includes the event types you expect.

**Check 3: Event is Being Triggered**
```bash
GET /api/webhooks/admin/stats
```
Check system-wide event delivery stats to confirm events are being triggered.

### Deliveries Failing

**Check 1: Endpoint is Accessible**
```bash
curl -X POST https://your-app.com/webhooks \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Check 2: Review Delivery History**
```bash
GET /api/webhooks/:id/deliveries?status=failed
```
Check error messages and status codes.

**Check 3: Signature Verification**
Ensure your signature verification code matches the algorithm:
```javascript
HMAC-SHA256(secret, JSON.stringify(payload))
```

**Check 4: Timeout Issues**
Your endpoint must respond within 10 seconds. If processing takes longer, acknowledge immediately and process asynchronously.

### High Failure Rate

**Check 1: View Statistics**
```bash
GET /api/webhooks/:id/stats?days=7
```

**Check 2: Test Webhook**
```bash
POST /api/webhooks/:id/test
```
This sends a test event to verify connectivity.

**Check 3: Check Response Times**
Review `averageDuration` in stats. If >5 seconds, optimize your handler.

### Duplicate Events

**Solution:** Implement idempotency using the `X-Webhook-ID` header (see Security Best Practices #4).

### Missing Events

**Check 1: Verify Event Subscription**
```bash
GET /api/webhooks/:id
```

**Check 2: Check Delivery History**
```bash
GET /api/webhooks/:id/deliveries?event=booking.created
```

**Check 3: Replay Failed Delivery**
```bash
POST /api/webhooks/deliveries/:deliveryId/replay
```

---

## Admin Endpoints

### Trigger Webhook Manually

Manually trigger a webhook event (admin only):

```http
POST /api/webhooks/admin/trigger
Authorization: Bearer <firebase_token>
Content-Type: application/json
```

```json
{
  "event": "booking.created",
  "payload": {
    "bookingId": "booking_123",
    "test": true
  },
  "filters": {
    "appId": "app_xyz789"
  }
}
```

### System-Wide Statistics

Get webhook statistics across all webhooks (admin only):

```http
GET /api/webhooks/admin/stats?days=7
Authorization: Bearer <firebase_token>
```

Response:
```json
{
  "stats": {
    "period": "7 days",
    "activeWebhooks": 25,
    "totalDeliveries": 10500,
    "successful": 10350,
    "failed": 150,
    "averageDuration": 175,
    "eventBreakdown": {
      "booking.created": { "total": 3500, "successful": 3480, "failed": 20 },
      "payment.succeeded": { "total": 4000, "successful": 3950, "failed": 50 }
    },
    "topWebhooks": [
      { "webhookId": "webhook_abc123", "deliveries": 2500 },
      { "webhookId": "webhook_def456", "deliveries": 1800 }
    ]
  }
}
```

---

## FAQ

### Q: Can I subscribe to all events?

A: Subscribe to individual events you need. There's no "wildcard" subscription to prevent unnecessary traffic.

### Q: What happens if my endpoint is down?

A: The system retries delivery up to 5 times with exponential backoff (up to ~1 minute). After max retries, the delivery is marked as failed. You can replay failed deliveries later.

### Q: Can I have multiple webhooks?

A: Yes! You can create multiple webhooks per API key/app, each with different URLs and event subscriptions.

### Q: How do I test webhooks in development?

A: Use tools like [ngrok](https://ngrok.com/) to expose your local server:
```bash
ngrok http 3000
# Use the ngrok URL when creating your webhook
```

### Q: Are webhooks guaranteed to be delivered in order?

A: No. Events are delivered as they occur, but network conditions and retries mean order is not guaranteed. Use timestamps and idempotency keys to handle this.

### Q: Can I filter events by specific criteria?

A: Not directly in webhook registration. Subscribe to the event type and filter in your handler based on the payload data.

### Q: How long are delivery records kept?

A: Delivery records are retained for 90 days.

### Q: What's the maximum payload size?

A: Webhook payloads are typically <100KB. If you need full resource data, use the included IDs to fetch via API.

---

## Support

For webhook issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review delivery history via `/api/webhooks/:id/deliveries`
- Test your webhook via `/api/webhooks/:id/test`
- Contact support with your `webhookId` and `deliveryId`

---

**Last Updated:** January 2024  
**API Version:** v1
