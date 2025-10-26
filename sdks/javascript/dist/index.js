"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthenticationError: () => AuthenticationError,
  AuthorizationError: () => AuthorizationError,
  FirebaseAuthHelper: () => FirebaseAuthHelper,
  MarketplaceClient: () => MarketplaceClient,
  MarketplaceError: () => MarketplaceError,
  NetworkError: () => NetworkError,
  NotFoundError: () => NotFoundError,
  RateLimitError: () => RateLimitError,
  ValidationError: () => ValidationError,
  WebhookVerifier: () => WebhookVerifier,
  createApiKeyAuth: () => createApiKeyAuth
});
module.exports = __toCommonJS(index_exports);

// src/client.ts
var import_axios = __toESM(require("axios"));

// src/errors.ts
var MarketplaceError = class _MarketplaceError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.statusCode = statusCode;
    this.response = response;
    this.name = "MarketplaceError";
    Object.setPrototypeOf(this, _MarketplaceError.prototype);
  }
};
var AuthenticationError = class _AuthenticationError extends MarketplaceError {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, _AuthenticationError.prototype);
  }
};
var AuthorizationError = class _AuthorizationError extends MarketplaceError {
  constructor(message = "Access denied") {
    super(message, 403);
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, _AuthorizationError.prototype);
  }
};
var NotFoundError = class _NotFoundError extends MarketplaceError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, _NotFoundError.prototype);
  }
};
var ValidationError = class _ValidationError extends MarketplaceError {
  constructor(message = "Validation failed", errors) {
    super(message, 400);
    this.errors = errors;
    this.name = "ValidationError";
    Object.setPrototypeOf(this, _ValidationError.prototype);
  }
};
var RateLimitError = class _RateLimitError extends MarketplaceError {
  constructor(message = "Rate limit exceeded", retryAfter) {
    super(message, 429);
    this.retryAfter = retryAfter;
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, _RateLimitError.prototype);
  }
};
var NetworkError = class _NetworkError extends MarketplaceError {
  constructor(message = "Network error occurred") {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, _NetworkError.prototype);
  }
};

// src/client.ts
var MarketplaceClient = class {
  constructor(config) {
    this.config = {
      timeout: 3e4,
      retries: 3,
      version: "v1",
      ...config
    };
    this.client = import_axios.default.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: this.getDefaultHeaders()
    });
    this.setupInterceptors();
  }
  getDefaultHeaders() {
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    }
    if (this.config.firebaseToken) {
      headers["Authorization"] = `Bearer ${this.config.firebaseToken}`;
    }
    if (this.config.tenantId) {
      headers["X-Tenant-ID"] = this.config.tenantId;
    }
    if (this.config.version) {
      headers["Accept-Version"] = this.config.version;
    }
    return headers;
  }
  setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const defaultHeaders = this.getDefaultHeaders();
        Object.keys(defaultHeaders).forEach((key) => {
          config.headers.set(key, defaultHeaders[key]);
        });
        return config;
      },
      (error) => Promise.reject(error)
    );
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (config && (!error.response || error.response.status >= 500) && (config._retryCount || 0) < (this.config.retries || 3)) {
          config._retryCount = (config._retryCount || 0) + 1;
          const delay = Math.pow(2, config._retryCount) * 1e3;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.client.request(config);
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }
  handleError(error) {
    if (!error.response) {
      return new NetworkError(error.message);
    }
    const { status, data } = error.response;
    const message = data?.error || data?.message || error.message;
    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message);
      case 404:
        return new NotFoundError(message);
      case 400:
        return new ValidationError(message, data?.errors);
      case 429:
        return new RateLimitError(
          message,
          parseInt(error.response.headers["retry-after"] || "60")
        );
      default:
        return new MarketplaceError(message, status, data);
    }
  }
  /**
   * Update authentication token
   */
  setFirebaseToken(token) {
    this.config.firebaseToken = token;
  }
  /**
   * Update API key
   */
  setApiKey(apiKey) {
    this.config.apiKey = apiKey;
  }
  /**
   * Update tenant ID
   */
  setTenantId(tenantId) {
    this.config.tenantId = tenantId;
  }
  // ==================== Health & Info ====================
  /**
   * Health check
   */
  async healthCheck() {
    const { data } = await this.client.get("/health");
    return data;
  }
  /**
   * Get current user info
   */
  async getCurrentUser() {
    const { data } = await this.client.get("/me");
    return data;
  }
  /**
   * Get version information
   */
  async getVersionInfo() {
    const { data } = await this.client.get("/versions");
    return data.versions;
  }
  // ==================== Services ====================
  /**
   * List services
   */
  async listServices(query) {
    const { data } = await this.client.get("/data/services", { params: query });
    return data;
  }
  /**
   * Get my services (requires auth)
   */
  async getMyServices(refresh = false) {
    const { data } = await this.client.get("/data/services/mine", {
      params: { refresh }
    });
    return data;
  }
  /**
   * Create service (requires auth)
   */
  async createService(serviceData) {
    const { data } = await this.client.post("/data/services", serviceData);
    return data;
  }
  /**
   * Update service (requires auth)
   */
  async updateService(id, updates) {
    const { data } = await this.client.put(`/data/services/${id}`, updates);
    return data;
  }
  /**
   * Delete service (requires auth)
   */
  async deleteService(id) {
    await this.client.delete(`/data/services/${id}`);
  }
  /**
   * Add review to service
   */
  async addReview(serviceId, review) {
    const { data } = await this.client.post(`/data/services/${serviceId}/reviews`, review);
    return data;
  }
  // ==================== Vendors ====================
  /**
   * List vendors
   */
  async listVendors(query) {
    const { data } = await this.client.get("/data/vendors", { params: query });
    return data;
  }
  /**
   * Create vendor (requires auth)
   */
  async createVendor(vendorData) {
    const { data } = await this.client.post("/data/vendors", vendorData);
    return data;
  }
  // ==================== Subscriptions & Bookings ====================
  /**
   * Get my subscriptions (requires auth)
   */
  async getMySubscriptions() {
    const { data } = await this.client.get("/subscriptions/my");
    return data;
  }
  /**
   * Get my bookings (requires auth)
   */
  async getMyBookings() {
    const { data } = await this.client.get("/subscriptions/bookings/mine");
    return data;
  }
  /**
   * Subscribe to service (requires auth)
   */
  async subscribeToService(bookingData) {
    const { data } = await this.client.post("/subscriptions/service", bookingData);
    return data;
  }
  /**
   * Unsubscribe from service (requires auth)
   */
  async unsubscribeFromService(serviceId) {
    await this.client.delete("/subscriptions/service", {
      data: { serviceId }
    });
  }
  // ==================== Messages ====================
  /**
   * List messages (requires auth)
   */
  async listMessages(query) {
    const { data } = await this.client.get("/messages", { params: query });
    return data;
  }
  /**
   * Send message (requires auth)
   */
  async sendMessage(messageData) {
    const { data } = await this.client.post("/messages", messageData);
    return data;
  }
  /**
   * Reply to message (requires auth)
   */
  async replyToMessage(replyData) {
    const { data } = await this.client.post("/messages/reply", replyData);
    return data;
  }
  /**
   * Mark message as read (requires auth)
   */
  async markMessageAsRead(messageId) {
    await this.client.post("/messages/read", { messageId });
  }
  // ==================== Wallet ====================
  /**
   * Get my wallet (requires auth)
   */
  async getMyWallet() {
    const { data } = await this.client.get("/wallets/me");
    return data;
  }
  /**
   * Redeem credits (requires auth)
   */
  async redeemCredits(redeemData) {
    const { data } = await this.client.post("/wallets/me/redeem", redeemData);
    return data;
  }
  // ==================== API Keys ====================
  /**
   * Create API key (requires auth)
   */
  async createApiKey(keyData) {
    const { data } = await this.client.post("/api-keys", keyData);
    return data;
  }
  /**
   * List API keys (requires auth)
   */
  async listApiKeys() {
    const { data } = await this.client.get("/api-keys");
    return data.apiKeys;
  }
  /**
   * Get API key usage (requires auth)
   */
  async getApiKeyUsage(keyId) {
    const { data } = await this.client.get(`/api-keys/${keyId}/usage`);
    return data;
  }
  /**
   * Delete API key (requires auth)
   */
  async deleteApiKey(keyId) {
    await this.client.delete(`/api-keys/${keyId}`);
  }
  /**
   * Rotate API key (requires auth)
   */
  async rotateApiKey(keyId) {
    const { data } = await this.client.post(`/api-keys/${keyId}/rotate`);
    return data;
  }
  // ==================== Webhooks ====================
  /**
   * Create webhook (requires API key auth)
   */
  async createWebhook(webhookData) {
    const { data } = await this.client.post("/webhooks", webhookData);
    return data.webhook;
  }
  /**
   * List webhooks (requires API key auth)
   */
  async listWebhooks(params) {
    const { data } = await this.client.get("/webhooks", { params });
    return data.webhooks;
  }
  /**
   * Get webhook (requires API key auth)
   */
  async getWebhook(webhookId) {
    const { data } = await this.client.get(`/webhooks/${webhookId}`);
    return data.webhook;
  }
  /**
   * Update webhook (requires API key auth)
   */
  async updateWebhook(webhookId, updates) {
    const { data } = await this.client.patch(`/webhooks/${webhookId}`, updates);
    return data.webhook;
  }
  /**
   * Delete webhook (requires API key auth)
   */
  async deleteWebhook(webhookId) {
    await this.client.delete(`/webhooks/${webhookId}`);
  }
  /**
   * Test webhook (requires API key auth)
   */
  async testWebhook(webhookId) {
    const { data } = await this.client.post(`/webhooks/${webhookId}/test`);
    return data.result;
  }
  /**
   * Get webhook statistics (requires API key auth)
   */
  async getWebhookStats(webhookId, days = 7) {
    const { data } = await this.client.get(`/webhooks/${webhookId}/stats`, {
      params: { days }
    });
    return data.stats;
  }
  /**
   * Get webhook deliveries (requires API key auth)
   */
  async getWebhookDeliveries(webhookId, params) {
    const { data } = await this.client.get(`/webhooks/${webhookId}/deliveries`, { params });
    return data.deliveries;
  }
  /**
   * Replay webhook delivery (requires API key auth)
   */
  async replayWebhookDelivery(deliveryId) {
    const { data } = await this.client.post(`/webhooks/deliveries/${deliveryId}/replay`);
    return data.result;
  }
  /**
   * Rotate webhook secret (requires API key auth)
   */
  async rotateWebhookSecret(webhookId) {
    const { data } = await this.client.post(`/webhooks/${webhookId}/rotate-secret`);
    return data;
  }
  /**
   * List available webhook events
   */
  async listWebhookEvents() {
    const { data } = await this.client.get("/webhooks/meta/events");
    return data.events;
  }
};

// src/webhooks.ts
var import_crypto = __toESM(require("crypto"));
var WebhookVerifier = class {
  constructor(secret) {
    this.secret = secret;
  }
  /**
   * Verify webhook signature
   */
  verify(payload, signature) {
    const expectedSignature = this.generateSignature(payload);
    try {
      return import_crypto.default.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }
  /**
   * Generate signature for payload
   */
  generateSignature(payload) {
    const hmac = import_crypto.default.createHmac("sha256", this.secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest("hex");
  }
  /**
   * Verify webhook request (Express middleware compatible)
   */
  verifyRequest(body, signatureHeader) {
    if (!signatureHeader) {
      return false;
    }
    return this.verify(body, signatureHeader);
  }
};

// src/auth.ts
var import_app = require("firebase/app");
var import_auth = require("firebase/auth");
var FirebaseAuthHelper = class {
  constructor(config) {
    this.app = (0, import_app.initializeApp)(config);
    this.auth = (0, import_auth.getAuth)(this.app);
  }
  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    return (0, import_auth.signInWithEmailAndPassword)(this.auth, email, password);
  }
  /**
   * Get current ID token
   */
  async getIdToken() {
    const user = this.auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }
  /**
   * Sign out
   */
  async signOut() {
    return this.auth.signOut();
  }
  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }
};
function createApiKeyAuth(apiKey) {
  return { apiKey };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticationError,
  AuthorizationError,
  FirebaseAuthHelper,
  MarketplaceClient,
  MarketplaceError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  WebhookVerifier,
  createApiKeyAuth
});
