# Marketplace SDK for PHP

Official PHP SDK for the Marketplace API. Build powerful integrations with automatic retries, comprehensive error handling, and full type hints.

## Requirements

- PHP 8.0 or higher
- Composer
- ext-json

## Installation

```bash
composer require marketplace/sdk
```

## Quick Start

### API Key Authentication

```php
<?php

require 'vendor/autoload.php';

use Marketplace\SDK\MarketplaceClient;

$client = new MarketplaceClient([
    'baseUrl' => 'https://your-api.com/api',
    'apiKey' => 'ak_live_your_api_key',
    'tenantId' => 'public',  // optional
    'version' => 'v1',       // optional: 'v1' or 'v2'
]);

// List services
$services = $client->listServices([
    'page' => 1,
    'pageSize' => 20,
    'category' => 'Business'
]);

foreach ($services['items'] as $service) {
    echo $service['title'] . ": $" . $service['price'] . "\n";
}
```

### Firebase Token Authentication

```php
<?php

use Marketplace\SDK\MarketplaceClient;

// Get Firebase token from your authentication flow
// See GET_FIREBASE_TOKEN.md for how to get this token
$firebaseToken = 'your-firebase-id-token';

$client = new MarketplaceClient([
    'baseUrl' => 'https://your-api.com/api',
    'firebaseToken' => $firebaseToken,
]);

// Get current user
$user = $client->getCurrentUser();
echo "Welcome, " . $user['email'] . "!\n";
```

#### 🔐 How to Get Firebase Token

**Option 1: Using our helper script**
```bash
# From project root
./scripts/get-firebase-token.sh your-email@example.com your-password
```

**Option 2: Using Firebase REST API**
```bash
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password",
    "returnSecureToken": true
  }'
```

**Option 3: From PHP**
```php
<?php

// Sign in with Firebase REST API
$apiKey = 'YOUR_FIREBASE_WEB_API_KEY';
$email = 'your-email@example.com';
$password = 'your-password';

$response = file_get_contents(
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$apiKey",
    false,
    stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode([
                'email' => $email,
                'password' => $password,
                'returnSecureToken' => true
            ])
        ]
    ])
);

$data = json_decode($response, true);
$firebaseToken = $data['idToken']; // Use this token!
$refreshToken = $data['refreshToken']; // Save for refreshing

echo "Token: $firebaseToken\n";
```

See **[GET_FIREBASE_TOKEN.md](../../GET_FIREBASE_TOKEN.md)** for complete documentation.

## Core Features

### Services

```php
// List services with filters
$services = $client->listServices([
    'q' => 'consulting',
    'category' => 'Business',
    'minPrice' => 100,
    'maxPrice' => 1000,
    'featured' => true,
    'page' => 1,
    'pageSize' => 20
]);

// Get my services (requires auth)
$myServices = $client->getMyServices();
print_r($myServices['listings']);
print_r($myServices['bookings']);

// Create service (requires auth)
$newService = $client->createService([
    'title' => 'Business Consulting',
    'description' => 'Expert business consulting services',
    'category' => 'Business',
    'price' => 299.99,
    'vendor' => 'My Company',
    'contactEmail' => 'contact@example.com'
]);

// Update service (requires auth)
$updated = $client->updateService('service-id', [
    'price' => 349.99,
    'featured' => true
]);

// Delete service (requires auth)
$client->deleteService('service-id');

// Add review
$reviewed = $client->addReview('service-id', [
    'rating' => 5,
    'comment' => 'Excellent service!',
    'author' => 'John Doe',
    'authorEmail' => 'john@example.com'
]);
```

### Subscriptions & Bookings

```php
// Get my subscriptions (requires auth)
$subscriptions = $client->getMySubscriptions();

// Get my bookings (requires auth)
$bookings = $client->getMyBookings();

// Subscribe to service (requires auth)
$booking = $client->subscribeToService([
    'serviceId' => 'service-id',
    'scheduledDate' => '2025-12-01',
    'scheduledSlot' => '14:00',
    'customerName' => 'John Doe'
]);

// Unsubscribe (requires auth)
$client->unsubscribeFromService('service-id');
```

### Messages

```php
// List messages (requires auth)
$messages = $client->listMessages([
    'page' => 1,
    'pageSize' => 20
]);

// Send message (requires auth)
$message = $client->sendMessage([
    'listingId' => 'service-id',
    'listingTitle' => 'Business Consulting',
    'vendorId' => 'vendor-id',
    'vendorEmail' => 'vendor@example.com',
    'subject' => 'Inquiry about service',
    'content' => 'I would like to know more about your service.'
]);

// Reply to message (requires auth)
$replied = $client->replyToMessage([
    'threadId' => 'message-id',
    'content' => 'Thank you for your inquiry...'
]);

// Mark as read (requires auth)
$client->markMessageAsRead('message-id');
```

### Wallet

```php
// Get my wallet (requires auth)
$wallet = $client->getMyWallet();
echo "Balance: {$wallet['balance']} {$wallet['currency']}\n";

// Redeem credits (requires auth)
$updated = $client->redeemCredits([
    'amount' => 100,
    'serviceId' => 'service-id',
    'description' => 'Payment for service'
]);
```

### API Keys

```php
// Create API key (requires Firebase auth)
$apiKey = $client->createApiKey([
    'name' => 'Production API Key',
    'tier' => 'standard',
    'expiresAt' => '2026-12-31T23:59:59Z'
]);

echo "API Key: " . $apiKey['key'] . "\n"; // Save this securely!

// List API keys (requires Firebase auth)
$keys = $client->listApiKeys();

// Get usage (requires Firebase auth)
$usage = $client->getApiKeyUsage('key-id');
echo "Used: {$usage['requests']}/{$usage['limit']} requests\n";

// Rotate API key (requires Firebase auth)
$rotated = $client->rotateApiKey('key-id');
echo "New key: " . $rotated['key'] . "\n";

// Delete API key (requires Firebase auth)
$client->deleteApiKey('key-id');
```

### Webhooks

```php
// Create webhook (requires API key auth)
$webhook = $client->createWebhook([
    'url' => 'https://your-app.com/webhooks',
    'events' => ['booking.created', 'payment.succeeded'],
    'description' => 'Production webhook',
    'active' => true
]);

echo "Webhook secret: " . $webhook['secret'] . "\n"; // Save this securely!

// List webhooks (requires API key auth)
$webhooks = $client->listWebhooks([
    'active' => true,
    'event' => 'booking.created'
]);

// Update webhook (requires API key auth)
$client->updateWebhook('webhook-id', [
    'events' => ['booking.created', 'booking.updated', 'payment.succeeded'],
    'active' => true
]);

// Test webhook (requires API key auth)
$testResult = $client->testWebhook('webhook-id');
echo "Test successful: " . ($testResult['success'] ? 'Yes' : 'No') . "\n";

// Get statistics (requires API key auth)
$stats = $client->getWebhookStats('webhook-id', 7);
echo "Success rate: {$stats['successful']}/{$stats['total']}\n";

// Get deliveries (requires API key auth)
$deliveries = $client->getWebhookDeliveries('webhook-id', [
    'limit' => 50,
    'status' => 'failed'
]);

// Replay failed delivery (requires API key auth)
$client->replayWebhookDelivery('delivery-id');

// Rotate secret (requires API key auth)
$newSecret = $client->rotateWebhookSecret('webhook-id');
echo "New secret: " . $newSecret['secret'] . "\n";

// List available events
$events = $client->listWebhookEvents();
print_r($events);
```

## Webhook Verification

Verify incoming webhook requests:

```php
<?php

use Marketplace\SDK\WebhookVerifier;

$verifier = new WebhookVerifier('whsec_your_webhook_secret');

// Get webhook data
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');

// Verify signature
if (!$verifier->verifyRequest($payload, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Process webhook
$data = json_decode($payload, true);
$event = $_SERVER['HTTP_X_WEBHOOK_EVENT'] ?? '';

error_log("Received webhook: $event");
error_log("Data: " . print_r($data, true));

// Respond with 200 OK
http_response_code(200);
echo json_encode(['received' => true]);
```

## Error Handling

The SDK provides typed exception classes:

```php
<?php

use Marketplace\SDK\MarketplaceClient;
use Marketplace\SDK\AuthenticationException;
use Marketplace\SDK\AuthorizationException;
use Marketplace\SDK\NotFoundException;
use Marketplace\SDK\ValidationException;
use Marketplace\SDK\RateLimitException;
use Marketplace\SDK\NetworkException;
use Marketplace\SDK\MarketplaceException;

$client = new MarketplaceClient([
    'baseUrl' => 'https://your-api.com/api',
    'apiKey' => 'ak_live_...'
]);

try {
    $service = $client->createService([
        'title' => 'My Service',
        // ... other fields
    ]);
} catch (AuthenticationException $e) {
    echo "Authentication failed: " . $e->getMessage() . "\n";
} catch (ValidationException $e) {
    echo "Validation failed: " . $e->getMessage() . "\n";
    print_r($e->getErrors());
} catch (RateLimitException $e) {
    echo "Rate limited. Retry after: " . $e->getRetryAfter() . " seconds\n";
} catch (NotFoundException $e) {
    echo "Resource not found\n";
} catch (NetworkException $e) {
    echo "Network error: " . $e->getMessage() . "\n";
} catch (MarketplaceException $e) {
    echo "API error: " . $e->getMessage() . "\n";
    echo "Status code: " . $e->getStatusCode() . "\n";
}
```

## Configuration Options

```php
$client = new MarketplaceClient([
    'baseUrl' => 'https://your-api.com/api',    // Required: API base URL
    'apiKey' => 'ak_live_...',                  // Optional: API key for machine-to-machine
    'firebaseToken' => 'firebase-id-token',     // Optional: Firebase authentication token
    'tenantId' => 'public',                     // Optional: Tenant context
    'version' => 'v1',                          // Optional: API version ('v1' or 'v2')
    'timeout' => 30,                            // Optional: Request timeout in seconds (default: 30)
    'retries' => 3                              // Optional: Number of retries (default: 3)
]);
```

## Automatic Retries

The SDK automatically retries failed requests with exponential backoff:

- Network errors are retried
- 5xx server errors are retried
- 4xx client errors are NOT retried
- Retry delay: 2s → 4s → 8s

```php
$client = new MarketplaceClient([
    'baseUrl' => 'https://your-api.com/api',
    'apiKey' => 'ak_live_...',
    'retries' => 5  // Custom retry count
]);
```

## Dynamic Authentication

Update authentication tokens dynamically:

```php
$client = new MarketplaceClient([
    'baseUrl' => 'https://your-api.com/api'
]);

// Set API key later
$client->setApiKey('ak_live_...');

// Update Firebase token
$client->setFirebaseToken('new-firebase-token');

// Change tenant
$client->setTenantId('startup');
```

## Health Check

```php
$health = $client->healthCheck();
echo "API Status: " . $health['status'] . "\n";
echo "Uptime: " . $health['uptime'] . " seconds\n";
```

## Version Information

```php
$versions = $client->getVersionInfo();
foreach ($versions as $version) {
    echo "{$version['version']}: {$version['status']}\n";
    if (isset($version['deprecationDate'])) {
        echo "Deprecated on: {$version['deprecationDate']}\n";
    }
}
```

## Examples

### Complete Integration Example

```php
<?php

require 'vendor/autoload.php';

use Marketplace\SDK\MarketplaceClient;

// Initialize client
$client = new MarketplaceClient([
    'baseUrl' => getenv('API_BASE_URL'),
    'firebaseToken' => getenv('FIREBASE_TOKEN'),
    'tenantId' => 'vendor'
]);

// Create a service
$service = $client->createService([
    'title' => 'Premium Consulting',
    'description' => 'Expert consulting services',
    'category' => 'Business',
    'price' => 499.99,
    'vendor' => 'Acme Consulting',
    'contactEmail' => 'info@acme.com'
]);

echo "Service created: {$service['id']}\n";

// Set up webhook
$webhook = $client->createWebhook([
    'url' => 'https://acme.com/webhooks',
    'events' => ['booking.created', 'payment.succeeded'],
    'description' => 'Acme webhook'
]);

echo "Webhook created with secret: {$webhook['secret']}\n";

// List my services
$myServices = $client->getMyServices();
echo "You have " . count($myServices['listings']) . " services\n";
```

### Laravel Integration

```php
<?php

namespace App\Services;

use Marketplace\SDK\MarketplaceClient;

class MarketplaceService
{
    private MarketplaceClient $client;

    public function __construct()
    {
        $this->client = new MarketplaceClient([
            'baseUrl' => config('marketplace.base_url'),
            'apiKey' => config('marketplace.api_key'),
            'tenantId' => config('marketplace.tenant_id'),
        ]);
    }

    public function getClient(): MarketplaceClient
    {
        return $this->client;
    }

    public function listServices(array $filters = []): array
    {
        return $this->client->listServices($filters);
    }

    public function createService(array $data): array
    {
        return $this->client->createService($data);
    }
}
```

## Support

- **Documentation**: https://docs.your-api.com
- **Issues**: https://github.com/your-org/marketplace-sdk-php/issues
- **Email**: support@your-api.com

## License

MIT © Marketplace Team
