# Marketplace SDK for JavaScript/TypeScript

Official JavaScript/TypeScript SDK for the Marketplace API. Build powerful integrations with full TypeScript support, automatic retries, and built-in error handling.

## Installation

```bash
npm install @marketplace/sdk
# or
yarn add @marketplace/sdk
# or
pnpm add @marketplace/sdk
```

## Quick Start

### API Key Authentication

```typescript
import { MarketplaceClient } from '@marketplace/sdk';

const client = new MarketplaceClient({
  baseUrl: 'https://your-api.com/api',
  apiKey: 'ak_live_your_api_key',
  tenantId: 'public',  // optional
  version: 'v1'        // optional: 'v1' or 'v2'
});

// List services
const services = await client.listServices({
  page: 1,
  pageSize: 20,
  category: 'Business'
});

console.log(services.items);
```

### Firebase Authentication

```typescript
import { MarketplaceClient, FirebaseAuthHelper } from '@marketplace/sdk';

// Initialize Firebase auth
const firebaseAuth = new FirebaseAuthHelper({
  apiKey: 'your-firebase-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id'
});

// Sign in
await firebaseAuth.signIn('user@example.com', 'password');

// Get token
const token = await firebaseAuth.getIdToken();

// Create client with Firebase token
const client = new MarketplaceClient({
  baseUrl: 'https://your-api.com/api',
  firebaseToken: token
});

// Get current user
const user = await client.getCurrentUser();
console.log(user);
```

## Core Features

### Services

```typescript
// List services with filters
const services = await client.listServices({
  q: 'consulting',
  category: 'Business',
  minPrice: 100,
  maxPrice: 1000,
  featured: true,
  page: 1,
  pageSize: 20
});

// Get my services (requires auth)
const myServices = await client.getMyServices();
console.log(myServices.listings);
console.log(myServices.bookings);

// Create service (requires auth)
const newService = await client.createService({
  title: 'Business Consulting',
  description: 'Expert business consulting services',
  category: 'Business',
  price: 299.99,
  vendor: 'My Company',
  contactEmail: 'contact@example.com'
});

// Update service (requires auth)
const updated = await client.updateService('service-id', {
  price: 349.99,
  featured: true
});

// Delete service (requires auth)
await client.deleteService('service-id');

// Add review
const reviewed = await client.addReview('service-id', {
  rating: 5,
  comment: 'Excellent service!',
  author: 'John Doe',
  authorEmail: 'john@example.com'
});
```

### Subscriptions & Bookings

```typescript
// Get my subscriptions (requires auth)
const subscriptions = await client.getMySubscriptions();

// Get my bookings (requires auth)
const bookings = await client.getMyBookings();

// Subscribe to service (requires auth)
const booking = await client.subscribeToService({
  serviceId: 'service-id',
  scheduledDate: '2025-12-01',
  scheduledSlot: '14:00',
  customerName: 'John Doe'
});

// Unsubscribe (requires auth)
await client.unsubscribeFromService('service-id');
```

### Messages

```typescript
// List messages (requires auth)
const messages = await client.listMessages({
  page: 1,
  pageSize: 20
});

// Send message (requires auth)
const message = await client.sendMessage({
  listingId: 'service-id',
  listingTitle: 'Business Consulting',
  vendorId: 'vendor-id',
  vendorEmail: 'vendor@example.com',
  subject: 'Inquiry about service',
  content: 'I would like to know more about your service.'
});

// Reply to message (requires auth)
const replied = await client.replyToMessage({
  threadId: 'message-id',
  content: 'Thank you for your inquiry...'
});

// Mark as read (requires auth)
await client.markMessageAsRead('message-id');
```

### Wallet

```typescript
// Get my wallet (requires auth)
const wallet = await client.getMyWallet();
console.log(`Balance: ${wallet.balance} ${wallet.currency}`);

// Redeem credits (requires auth)
const updated = await client.redeemCredits({
  amount: 100,
  serviceId: 'service-id',
  description: 'Payment for service'
});
```

### API Keys

```typescript
// Create API key (requires Firebase auth)
const apiKey = await client.createApiKey({
  name: 'Production API Key',
  tier: 'standard',
  expiresAt: '2026-12-31T23:59:59Z'
});

console.log('API Key:', apiKey.key); // Save this securely!

// List API keys (requires Firebase auth)
const keys = await client.listApiKeys();

// Get usage (requires Firebase auth)
const usage = await client.getApiKeyUsage('key-id');
console.log(`Used: ${usage.requests}/${usage.limit} requests`);

// Rotate API key (requires Firebase auth)
const rotated = await client.rotateApiKey('key-id');
console.log('New key:', rotated.key);

// Delete API key (requires Firebase auth)
await client.deleteApiKey('key-id');
```

### Webhooks

```typescript
// Create webhook (requires API key auth)
const webhook = await client.createWebhook({
  url: 'https://your-app.com/webhooks',
  events: ['booking.created', 'payment.succeeded'],
  description: 'Production webhook',
  active: true
});

console.log('Webhook secret:', webhook.secret); // Save this securely!

// List webhooks (requires API key auth)
const webhooks = await client.listWebhooks({
  active: true,
  event: 'booking.created'
});

// Update webhook (requires API key auth)
await client.updateWebhook('webhook-id', {
  events: ['booking.created', 'booking.updated', 'payment.succeeded'],
  active: true
});

// Test webhook (requires API key auth)
const testResult = await client.testWebhook('webhook-id');
console.log('Test successful:', testResult.success);

// Get statistics (requires API key auth)
const stats = await client.getWebhookStats('webhook-id', 7);
console.log(`Success rate: ${stats.successful}/${stats.total}`);

// Get deliveries (requires API key auth)
const deliveries = await client.getWebhookDeliveries('webhook-id', {
  limit: 50,
  status: 'failed'
});

// Replay failed delivery (requires API key auth)
await client.replayWebhookDelivery('delivery-id');

// Rotate secret (requires API key auth)
const newSecret = await client.rotateWebhookSecret('webhook-id');
console.log('New secret:', newSecret.secret);

// List available events
const events = await client.listWebhookEvents();
console.log(events);
```

## Webhook Verification

Verify incoming webhook requests:

```typescript
import { WebhookVerifier } from '@marketplace/sdk';

// Create verifier with your webhook secret
const verifier = new WebhookVerifier('whsec_your_webhook_secret');

// Express example
app.post('/webhooks', express.json(), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  
  // Verify signature
  if (!verifier.verifyRequest(payload, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  console.log('Event:', req.headers['x-webhook-event']);
  console.log('Data:', payload.data);
  
  res.status(200).json({ received: true });
});
```

## Error Handling

The SDK provides typed error classes:

```typescript
import {
  MarketplaceClient,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError
} from '@marketplace/sdk';

const client = new MarketplaceClient({ baseUrl: '...', apiKey: '...' });

try {
  const service = await client.createService({
    title: 'My Service',
    // ... other fields
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.errors);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found');
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Configuration Options

```typescript
const client = new MarketplaceClient({
  baseUrl: 'https://your-api.com/api',    // Required: API base URL
  apiKey: 'ak_live_...',                  // Optional: API key for machine-to-machine
  firebaseToken: 'firebase-id-token',     // Optional: Firebase authentication token
  tenantId: 'public',                     // Optional: Tenant context
  version: 'v1',                          // Optional: API version ('v1' or 'v2')
  timeout: 30000,                         // Optional: Request timeout in ms (default: 30000)
  retries: 3                              // Optional: Number of retries (default: 3)
});
```

## Automatic Retries

The SDK automatically retries failed requests with exponential backoff:

- Network errors are retried
- 5xx server errors are retried
- 4xx client errors are NOT retried
- Retry delay: 2s → 4s → 8s

```typescript
const client = new MarketplaceClient({
  baseUrl: 'https://your-api.com/api',
  apiKey: 'ak_live_...',
  retries: 5  // Custom retry count
});
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  Service,
  Vendor,
  Booking,
  Message,
  Wallet,
  ApiKey,
  Webhook,
  PaginatedResponse
} from '@marketplace/sdk';

// All API responses are fully typed
const services: PaginatedResponse<Service> = await client.listServices();

// Autocomplete and type checking for all methods
const service: Service = await client.createService({
  title: 'My Service',
  description: 'Description',
  category: 'Business',
  price: 99.99,
  vendor: 'My Company',
  contactEmail: 'contact@example.com'
});
```

## Dynamic Authentication

Update authentication tokens dynamically:

```typescript
const client = new MarketplaceClient({
  baseUrl: 'https://your-api.com/api'
});

// Set API key later
client.setApiKey('ak_live_...');

// Update Firebase token
client.setFirebaseToken('new-firebase-token');

// Change tenant
client.setTenantId('startup');
```

## Health Check

```typescript
const health = await client.healthCheck();
console.log('API Status:', health.status);
console.log('Uptime:', health.uptime, 'seconds');
```

## Version Information

```typescript
const versions = await client.getVersionInfo();
versions.forEach(v => {
  console.log(`${v.version}: ${v.status}`);
  if (v.deprecationDate) {
    console.log(`Deprecated on: ${v.deprecationDate}`);
  }
});
```

## Examples

### Complete Integration Example

```typescript
import { MarketplaceClient, FirebaseAuthHelper } from '@marketplace/sdk';

// Initialize
const auth = new FirebaseAuthHelper({
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!
});

// Sign in
await auth.signIn('user@example.com', 'password');
const token = await auth.getIdToken();

const client = new MarketplaceClient({
  baseUrl: process.env.API_BASE_URL!,
  firebaseToken: token!,
  tenantId: 'vendor'
});

// Create a service
const service = await client.createService({
  title: 'Premium Consulting',
  description: 'Expert consulting services',
  category: 'Business',
  price: 499.99,
  vendor: 'Acme Consulting',
  contactEmail: 'info@acme.com'
});

console.log('Service created:', service.id);

// Set up webhook
const webhook = await client.createWebhook({
  url: 'https://acme.com/webhooks',
  events: ['booking.created', 'payment.succeeded'],
  description: 'Acme webhook'
});

console.log('Webhook created with secret:', webhook.secret);

// List my services
const myServices = await client.getMyServices();
console.log(`You have ${myServices.listings.length} services`);
```

## Browser Support

The SDK works in both Node.js and browser environments:

```html
<script type="module">
  import { MarketplaceClient } from 'https://unpkg.com/@marketplace/sdk';
  
  const client = new MarketplaceClient({
    baseUrl: 'https://your-api.com/api',
    apiKey: 'ak_live_...'
  });
  
  const services = await client.listServices();
  console.log(services);
</script>
```

## Support

- **Documentation**: [https://docs.your-api.com](https://docs.your-api.com)
- **Issues**: [https://github.com/your-org/marketplace-sdk-js/issues](https://github.com/your-org/marketplace-sdk-js/issues)
- **Email**: support@your-api.com

## License

MIT © Marketplace Team
