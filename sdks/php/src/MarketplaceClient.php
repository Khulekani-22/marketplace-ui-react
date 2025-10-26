<?php

namespace Marketplace\SDK;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * Marketplace API Client
 *
 * Official PHP SDK for the Marketplace API
 */
class MarketplaceClient
{
    private Client $client;
    private string $baseUrl;
    private ?string $apiKey;
    private ?string $firebaseToken;
    private ?string $tenantId;
    private string $version;
    private int $timeout;
    private int $retries;

    /**
     * Create a new Marketplace client
     *
     * @param array{
     *   baseUrl: string,
     *   apiKey?: string,
     *   firebaseToken?: string,
     *   tenantId?: string,
     *   version?: string,
     *   timeout?: int,
     *   retries?: int
     * } $config
     */
    public function __construct(array $config)
    {
        $this->baseUrl = rtrim($config['baseUrl'], '/');
        $this->apiKey = $config['apiKey'] ?? null;
        $this->firebaseToken = $config['firebaseToken'] ?? null;
        $this->tenantId = $config['tenantId'] ?? null;
        $this->version = $config['version'] ?? 'v1';
        $this->timeout = $config['timeout'] ?? 30;
        $this->retries = $config['retries'] ?? 3;

        $this->client = $this->createClient();
    }

    /**
     * Create HTTP client with retry middleware
     */
    private function createClient(): Client
    {
        $handlerStack = HandlerStack::create();
        
        // Retry middleware
        $handlerStack->push(Middleware::retry(
            function ($retries, RequestInterface $request, ?ResponseInterface $response = null, ?\Exception $exception = null) {
                // Don't retry more than configured
                if ($retries >= $this->retries) {
                    return false;
                }

                // Retry on network errors
                if ($exception instanceof ConnectException) {
                    return true;
                }

                // Retry on 5xx errors
                if ($response && $response->getStatusCode() >= 500) {
                    return true;
                }

                return false;
            },
            function ($retries) {
                // Exponential backoff: 2^retries seconds
                return 1000 * pow(2, $retries);
            }
        ));

        return new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => $this->timeout,
            'handler' => $handlerStack,
            'headers' => $this->getDefaultHeaders(),
        ]);
    }

    /**
     * Get default headers
     */
    private function getDefaultHeaders(): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'Accept-Version' => $this->version,
        ];

        if ($this->apiKey) {
            $headers['X-API-Key'] = $this->apiKey;
        }

        if ($this->firebaseToken) {
            $headers['Authorization'] = 'Bearer ' . $this->firebaseToken;
        }

        if ($this->tenantId) {
            $headers['X-Tenant-ID'] = $this->tenantId;
        }

        return $headers;
    }

    /**
     * Make HTTP request
     *
     * @throws MarketplaceException
     */
    private function request(string $method, string $path, array $options = []): array
    {
        try {
            // Merge headers
            $options['headers'] = array_merge(
                $this->getDefaultHeaders(),
                $options['headers'] ?? []
            );

            $response = $this->client->request($method, $path, $options);
            $body = (string) $response->getBody();
            
            return $body ? json_decode($body, true, 512, JSON_THROW_ON_ERROR) : [];
        } catch (RequestException $e) {
            $this->handleRequestException($e);
        } catch (\JsonException $e) {
            throw new MarketplaceException('Invalid JSON response: ' . $e->getMessage());
        }
    }

    /**
     * Handle request exceptions
     *
     * @throws MarketplaceException
     */
    private function handleRequestException(RequestException $e): void
    {
        $response = $e->getResponse();
        
        if (!$response) {
            throw new NetworkException($e->getMessage(), 0, $e);
        }

        $statusCode = $response->getStatusCode();
        $body = json_decode((string) $response->getBody(), true);
        $message = $body['error'] ?? $body['message'] ?? $e->getMessage();

        switch ($statusCode) {
            case 401:
                throw new AuthenticationException($message, $statusCode, $e);
            case 403:
                throw new AuthorizationException($message, $statusCode, $e);
            case 404:
                throw new NotFoundException($message, $statusCode, $e);
            case 400:
                throw new ValidationException($message, $body['errors'] ?? null, $statusCode, $e);
            case 429:
                $retryAfter = (int) ($response->getHeader('Retry-After')[0] ?? 60);
                throw new RateLimitException($message, $retryAfter, $statusCode, $e);
            default:
                throw new MarketplaceException($message, $statusCode, $e);
        }
    }

    // ==================== Authentication ====================

    /**
     * Set API key
     */
    public function setApiKey(string $apiKey): void
    {
        $this->apiKey = $apiKey;
        $this->client = $this->createClient();
    }

    /**
     * Set Firebase token
     */
    public function setFirebaseToken(string $token): void
    {
        $this->firebaseToken = $token;
        $this->client = $this->createClient();
    }

    /**
     * Set tenant ID
     */
    public function setTenantId(string $tenantId): void
    {
        $this->tenantId = $tenantId;
        $this->client = $this->createClient();
    }

    // ==================== Health & Info ====================

    /**
     * Health check
     */
    public function healthCheck(): array
    {
        return $this->request('GET', '/health');
    }

    /**
     * Get current user info
     */
    public function getCurrentUser(): array
    {
        return $this->request('GET', '/me');
    }

    /**
     * Get version information
     */
    public function getVersionInfo(): array
    {
        $data = $this->request('GET', '/versions');
        return $data['versions'] ?? [];
    }

    // ==================== Services ====================

    /**
     * List services
     *
     * @param array{
     *   q?: string,
     *   category?: string,
     *   vendor?: string,
     *   featured?: bool,
     *   minPrice?: float,
     *   maxPrice?: float,
     *   page?: int,
     *   pageSize?: int
     * } $query
     */
    public function listServices(array $query = []): array
    {
        return $this->request('GET', '/data/services', ['query' => $query]);
    }

    /**
     * Get my services (requires auth)
     */
    public function getMyServices(bool $refresh = false): array
    {
        return $this->request('GET', '/data/services/mine', [
            'query' => ['refresh' => $refresh ? 'true' : 'false']
        ]);
    }

    /**
     * Create service (requires auth)
     */
    public function createService(array $serviceData): array
    {
        return $this->request('POST', '/data/services', ['json' => $serviceData]);
    }

    /**
     * Update service (requires auth)
     */
    public function updateService(string $id, array $updates): array
    {
        return $this->request('PUT', "/data/services/{$id}", ['json' => $updates]);
    }

    /**
     * Delete service (requires auth)
     */
    public function deleteService(string $id): void
    {
        $this->request('DELETE', "/data/services/{$id}");
    }

    /**
     * Add review to service
     */
    public function addReview(string $serviceId, array $review): array
    {
        return $this->request('POST', "/data/services/{$serviceId}/reviews", ['json' => $review]);
    }

    // ==================== Vendors ====================

    /**
     * List vendors
     */
    public function listVendors(array $query = []): array
    {
        return $this->request('GET', '/data/vendors', ['query' => $query]);
    }

    /**
     * Create vendor (requires auth)
     */
    public function createVendor(array $vendorData): array
    {
        return $this->request('POST', '/data/vendors', ['json' => $vendorData]);
    }

    // ==================== Subscriptions & Bookings ====================

    /**
     * Get my subscriptions (requires auth)
     */
    public function getMySubscriptions(): array
    {
        return $this->request('GET', '/subscriptions/my');
    }

    /**
     * Get my bookings (requires auth)
     */
    public function getMyBookings(): array
    {
        return $this->request('GET', '/subscriptions/bookings/mine');
    }

    /**
     * Subscribe to service (requires auth)
     */
    public function subscribeToService(array $bookingData): array
    {
        return $this->request('POST', '/subscriptions/service', ['json' => $bookingData]);
    }

    /**
     * Unsubscribe from service (requires auth)
     */
    public function unsubscribeFromService(string $serviceId): void
    {
        $this->request('DELETE', '/subscriptions/service', [
            'json' => ['serviceId' => $serviceId]
        ]);
    }

    // ==================== Messages ====================

    /**
     * List messages (requires auth)
     */
    public function listMessages(array $query = []): array
    {
        return $this->request('GET', '/messages', ['query' => $query]);
    }

    /**
     * Send message (requires auth)
     */
    public function sendMessage(array $messageData): array
    {
        return $this->request('POST', '/messages', ['json' => $messageData]);
    }

    /**
     * Reply to message (requires auth)
     */
    public function replyToMessage(array $replyData): array
    {
        return $this->request('POST', '/messages/reply', ['json' => $replyData]);
    }

    /**
     * Mark message as read (requires auth)
     */
    public function markMessageAsRead(string $messageId): void
    {
        $this->request('POST', '/messages/read', ['json' => ['messageId' => $messageId]]);
    }

    // ==================== Wallet ====================

    /**
     * Get my wallet (requires auth)
     */
    public function getMyWallet(): array
    {
        return $this->request('GET', '/wallets/me');
    }

    /**
     * Redeem credits (requires auth)
     */
    public function redeemCredits(array $redeemData): array
    {
        return $this->request('POST', '/wallets/me/redeem', ['json' => $redeemData]);
    }

    // ==================== API Keys ====================

    /**
     * Create API key (requires auth)
     */
    public function createApiKey(array $keyData): array
    {
        return $this->request('POST', '/api-keys', ['json' => $keyData]);
    }

    /**
     * List API keys (requires auth)
     */
    public function listApiKeys(): array
    {
        $data = $this->request('GET', '/api-keys');
        return $data['apiKeys'] ?? [];
    }

    /**
     * Get API key usage (requires auth)
     */
    public function getApiKeyUsage(string $keyId): array
    {
        return $this->request('GET', "/api-keys/{$keyId}/usage");
    }

    /**
     * Delete API key (requires auth)
     */
    public function deleteApiKey(string $keyId): void
    {
        $this->request('DELETE', "/api-keys/{$keyId}");
    }

    /**
     * Rotate API key (requires auth)
     */
    public function rotateApiKey(string $keyId): array
    {
        return $this->request('POST', "/api-keys/{$keyId}/rotate");
    }

    // ==================== Webhooks ====================

    /**
     * Create webhook (requires API key auth)
     */
    public function createWebhook(array $webhookData): array
    {
        $data = $this->request('POST', '/webhooks', ['json' => $webhookData]);
        return $data['webhook'] ?? [];
    }

    /**
     * List webhooks (requires API key auth)
     */
    public function listWebhooks(array $params = []): array
    {
        $data = $this->request('GET', '/webhooks', ['query' => $params]);
        return $data['webhooks'] ?? [];
    }

    /**
     * Get webhook (requires API key auth)
     */
    public function getWebhook(string $webhookId): array
    {
        $data = $this->request('GET', "/webhooks/{$webhookId}");
        return $data['webhook'] ?? [];
    }

    /**
     * Update webhook (requires API key auth)
     */
    public function updateWebhook(string $webhookId, array $updates): array
    {
        $data = $this->request('PATCH', "/webhooks/{$webhookId}", ['json' => $updates]);
        return $data['webhook'] ?? [];
    }

    /**
     * Delete webhook (requires API key auth)
     */
    public function deleteWebhook(string $webhookId): void
    {
        $this->request('DELETE', "/webhooks/{$webhookId}");
    }

    /**
     * Test webhook (requires API key auth)
     */
    public function testWebhook(string $webhookId): array
    {
        $data = $this->request('POST', "/webhooks/{$webhookId}/test");
        return $data['result'] ?? [];
    }

    /**
     * Get webhook statistics (requires API key auth)
     */
    public function getWebhookStats(string $webhookId, int $days = 7): array
    {
        $data = $this->request('GET', "/webhooks/{$webhookId}/stats", [
            'query' => ['days' => $days]
        ]);
        return $data['stats'] ?? [];
    }

    /**
     * Get webhook deliveries (requires API key auth)
     */
    public function getWebhookDeliveries(string $webhookId, array $params = []): array
    {
        $data = $this->request('GET', "/webhooks/{$webhookId}/deliveries", ['query' => $params]);
        return $data['deliveries'] ?? [];
    }

    /**
     * Replay webhook delivery (requires API key auth)
     */
    public function replayWebhookDelivery(string $deliveryId): array
    {
        $data = $this->request('POST', "/webhooks/deliveries/{$deliveryId}/replay");
        return $data['result'] ?? [];
    }

    /**
     * Rotate webhook secret (requires API key auth)
     */
    public function rotateWebhookSecret(string $webhookId): array
    {
        return $this->request('POST', "/webhooks/{$webhookId}/rotate-secret");
    }

    /**
     * List available webhook events
     */
    public function listWebhookEvents(): array
    {
        $data = $this->request('GET', '/webhooks/meta/events');
        return $data['events'] ?? [];
    }
}
