/**
 * Main Marketplace API Client
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type {
  MarketplaceConfig,
  Service,
  ServiceQuery,
  CreateServiceData,
  UpdateServiceData,
  CreateReviewData,
  Vendor,
  VendorQuery,
  Subscription,
  Booking,
  CreateBookingData,
  Message,
  MessageQuery,
  SendMessageData,
  ReplyToMessageData,
  Wallet,
  RedeemCreditsData,
  User,
  ApiKey,
  CreateApiKeyData,
  ApiKeyUsage,
  Webhook,
  CreateWebhookData,
  UpdateWebhookData,
  WebhookStats,
  WebhookDelivery,
  HealthStatus,
  VersionInfo,
  PaginatedResponse,
} from './types';
import {
  MarketplaceError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from './errors';

export class MarketplaceClient {
  private client: AxiosInstance;
  private config: MarketplaceConfig;

  constructor(config: MarketplaceConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      version: 'v1',
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: this.getDefaultHeaders(),
    });

    this.setupInterceptors();
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    if (this.config.firebaseToken) {
      headers['Authorization'] = `Bearer ${this.config.firebaseToken}`;
    }

    if (this.config.tenantId) {
      headers['X-Tenant-ID'] = this.config.tenantId;
    }

    if (this.config.version) {
      headers['Accept-Version'] = this.config.version;
    }

    return headers;
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Update headers in case they changed
        const defaultHeaders = this.getDefaultHeaders();
        Object.keys(defaultHeaders).forEach(key => {
          config.headers.set(key, defaultHeaders[key]);
        });
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor with retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };

        // Retry logic for network errors and 5xx errors
        if (
          config &&
          (!error.response || error.response.status >= 500) &&
          (config._retryCount || 0) < (this.config.retries || 3)
        ) {
          config._retryCount = (config._retryCount || 0) + 1;

          // Exponential backoff
          const delay = Math.pow(2, config._retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));

          return this.client.request(config);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): MarketplaceError {
    if (!error.response) {
      return new NetworkError(error.message);
    }

    const { status, data } = error.response;
    const message = (data as any)?.error || (data as any)?.message || error.message;

    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message);
      case 404:
        return new NotFoundError(message);
      case 400:
        return new ValidationError(message, (data as any)?.errors);
      case 429:
        return new RateLimitError(
          message,
          parseInt(error.response.headers['retry-after'] || '60')
        );
      default:
        return new MarketplaceError(message, status, data);
    }
  }

  /**
   * Update authentication token
   */
  setFirebaseToken(token: string) {
    this.config.firebaseToken = token;
  }

  /**
   * Update API key
   */
  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
  }

  /**
   * Update tenant ID
   */
  setTenantId(tenantId: string) {
    this.config.tenantId = tenantId;
  }

  // ==================== Health & Info ====================

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthStatus> {
    const { data } = await this.client.get('/health');
    return data;
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get('/me');
    return data;
  }

  /**
   * Get version information
   */
  async getVersionInfo(): Promise<VersionInfo[]> {
    const { data } = await this.client.get('/versions');
    return data.versions;
  }

  // ==================== Services ====================

  /**
   * List services
   */
  async listServices(query?: ServiceQuery): Promise<PaginatedResponse<Service>> {
    const { data } = await this.client.get('/data/services', { params: query });
    return data;
  }

  /**
   * Get my services (requires auth)
   */
  async getMyServices(refresh = false): Promise<{
    tenantId: string;
    vendor: any;
    listings: Service[];
    bookings: Booking[];
  }> {
    const { data } = await this.client.get('/data/services/mine', {
      params: { refresh },
    });
    return data;
  }

  /**
   * Create service (requires auth)
   */
  async createService(serviceData: CreateServiceData): Promise<Service> {
    const { data } = await this.client.post('/data/services', serviceData);
    return data;
  }

  /**
   * Update service (requires auth)
   */
  async updateService(id: string, updates: UpdateServiceData): Promise<Service> {
    const { data } = await this.client.put(`/data/services/${id}`, updates);
    return data;
  }

  /**
   * Delete service (requires auth)
   */
  async deleteService(id: string): Promise<void> {
    await this.client.delete(`/data/services/${id}`);
  }

  /**
   * Add review to service
   */
  async addReview(serviceId: string, review: CreateReviewData): Promise<Service> {
    const { data } = await this.client.post(`/data/services/${serviceId}/reviews`, review);
    return data;
  }

  // ==================== Vendors ====================

  /**
   * List vendors
   */
  async listVendors(query?: VendorQuery): Promise<PaginatedResponse<Vendor>> {
    const { data } = await this.client.get('/data/vendors', { params: query });
    return data;
  }

  /**
   * Create vendor (requires auth)
   */
  async createVendor(vendorData: Omit<Vendor, 'id' | 'createdAt'>): Promise<Vendor> {
    const { data } = await this.client.post('/data/vendors', vendorData);
    return data;
  }

  // ==================== Subscriptions & Bookings ====================

  /**
   * Get my subscriptions (requires auth)
   */
  async getMySubscriptions(): Promise<Subscription[]> {
    const { data } = await this.client.get('/subscriptions/my');
    return data;
  }

  /**
   * Get my bookings (requires auth)
   */
  async getMyBookings(): Promise<Booking[]> {
    const { data } = await this.client.get('/subscriptions/bookings/mine');
    return data;
  }

  /**
   * Subscribe to service (requires auth)
   */
  async subscribeToService(bookingData: CreateBookingData): Promise<Booking> {
    const { data } = await this.client.post('/subscriptions/service', bookingData);
    return data;
  }

  /**
   * Unsubscribe from service (requires auth)
   */
  async unsubscribeFromService(serviceId: string): Promise<void> {
    await this.client.delete('/subscriptions/service', {
      data: { serviceId },
    });
  }

  // ==================== Messages ====================

  /**
   * List messages (requires auth)
   */
  async listMessages(query?: MessageQuery): Promise<PaginatedResponse<Message>> {
    const { data } = await this.client.get('/messages', { params: query });
    return data;
  }

  /**
   * Send message (requires auth)
   */
  async sendMessage(messageData: SendMessageData): Promise<Message> {
    const { data } = await this.client.post('/messages', messageData);
    return data;
  }

  /**
   * Reply to message (requires auth)
   */
  async replyToMessage(replyData: ReplyToMessageData): Promise<Message> {
    const { data } = await this.client.post('/messages/reply', replyData);
    return data;
  }

  /**
   * Mark message as read (requires auth)
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    await this.client.post('/messages/read', { messageId });
  }

  // ==================== Wallet ====================

  /**
   * Get my wallet (requires auth)
   */
  async getMyWallet(): Promise<Wallet> {
    const { data } = await this.client.get('/wallets/me');
    return data;
  }

  /**
   * Redeem credits (requires auth)
   */
  async redeemCredits(redeemData: RedeemCreditsData): Promise<Wallet> {
    const { data } = await this.client.post('/wallets/me/redeem', redeemData);
    return data;
  }

  // ==================== API Keys ====================

  /**
   * Create API key (requires auth)
   */
  async createApiKey(keyData: CreateApiKeyData): Promise<ApiKey & { key: string }> {
    const { data } = await this.client.post('/api-keys', keyData);
    return data;
  }

  /**
   * List API keys (requires auth)
   */
  async listApiKeys(): Promise<ApiKey[]> {
    const { data } = await this.client.get('/api-keys');
    return data.apiKeys;
  }

  /**
   * Get API key usage (requires auth)
   */
  async getApiKeyUsage(keyId: string): Promise<ApiKeyUsage> {
    const { data } = await this.client.get(`/api-keys/${keyId}/usage`);
    return data;
  }

  /**
   * Delete API key (requires auth)
   */
  async deleteApiKey(keyId: string): Promise<void> {
    await this.client.delete(`/api-keys/${keyId}`);
  }

  /**
   * Rotate API key (requires auth)
   */
  async rotateApiKey(keyId: string): Promise<ApiKey & { key: string }> {
    const { data } = await this.client.post(`/api-keys/${keyId}/rotate`);
    return data;
  }

  // ==================== Webhooks ====================

  /**
   * Create webhook (requires API key auth)
   */
  async createWebhook(webhookData: CreateWebhookData): Promise<Webhook & { secret: string }> {
    const { data } = await this.client.post('/webhooks', webhookData);
    return data.webhook;
  }

  /**
   * List webhooks (requires API key auth)
   */
  async listWebhooks(params?: { active?: boolean; event?: string }): Promise<Webhook[]> {
    const { data } = await this.client.get('/webhooks', { params });
    return data.webhooks;
  }

  /**
   * Get webhook (requires API key auth)
   */
  async getWebhook(webhookId: string): Promise<Webhook> {
    const { data } = await this.client.get(`/webhooks/${webhookId}`);
    return data.webhook;
  }

  /**
   * Update webhook (requires API key auth)
   */
  async updateWebhook(webhookId: string, updates: UpdateWebhookData): Promise<Webhook> {
    const { data } = await this.client.patch(`/webhooks/${webhookId}`, updates);
    return data.webhook;
  }

  /**
   * Delete webhook (requires API key auth)
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.client.delete(`/webhooks/${webhookId}`);
  }

  /**
   * Test webhook (requires API key auth)
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; statusCode: number; duration: number }> {
    const { data } = await this.client.post(`/webhooks/${webhookId}/test`);
    return data.result;
  }

  /**
   * Get webhook statistics (requires API key auth)
   */
  async getWebhookStats(webhookId: string, days = 7): Promise<WebhookStats> {
    const { data } = await this.client.get(`/webhooks/${webhookId}/stats`, {
      params: { days },
    });
    return data.stats;
  }

  /**
   * Get webhook deliveries (requires API key auth)
   */
  async getWebhookDeliveries(
    webhookId: string,
    params?: { limit?: number; status?: string; event?: string }
  ): Promise<WebhookDelivery[]> {
    const { data } = await this.client.get(`/webhooks/${webhookId}/deliveries`, { params });
    return data.deliveries;
  }

  /**
   * Replay webhook delivery (requires API key auth)
   */
  async replayWebhookDelivery(deliveryId: string): Promise<{ success: boolean }> {
    const { data } = await this.client.post(`/webhooks/deliveries/${deliveryId}/replay`);
    return data.result;
  }

  /**
   * Rotate webhook secret (requires API key auth)
   */
  async rotateWebhookSecret(webhookId: string): Promise<{ webhookId: string; secret: string }> {
    const { data } = await this.client.post(`/webhooks/${webhookId}/rotate-secret`);
    return data;
  }

  /**
   * List available webhook events
   */
  async listWebhookEvents(): Promise<Array<{ event: string; description: string; category: string }>> {
    const { data } = await this.client.get('/webhooks/meta/events');
    return data.events;
  }
}
