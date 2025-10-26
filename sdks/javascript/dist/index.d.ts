import * as _firebase_auth from '@firebase/auth';
import { UserCredential } from 'firebase/auth';

/**
 * Type definitions for Marketplace API
 */
interface MarketplaceConfig {
    baseUrl: string;
    apiKey?: string;
    firebaseToken?: string;
    tenantId?: string;
    timeout?: number;
    retries?: number;
    version?: 'v1' | 'v2';
}
interface PaginationParams {
    page?: number;
    pageSize?: number;
}
interface PaginatedResponse<T> {
    page: number;
    pageSize: number;
    total: number;
    items: T[];
}
interface Service {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    currency?: string;
    vendor: string;
    vendorId?: string;
    contactEmail: string;
    featured?: boolean;
    rating?: number;
    reviewCount?: number;
    reviews?: Review[];
    tenantId?: string;
    createdAt?: string;
    updatedAt?: string;
}
interface ServiceQuery extends PaginationParams {
    q?: string;
    category?: string;
    vendor?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
}
interface CreateServiceData {
    title: string;
    description: string;
    category: string;
    price: number;
    currency?: string;
    vendor: string;
    contactEmail: string;
    featured?: boolean;
}
interface UpdateServiceData extends Partial<CreateServiceData> {
}
interface Review {
    id: string;
    rating: number;
    comment: string;
    author: string;
    authorEmail: string;
    createdAt: string;
}
interface CreateReviewData {
    rating: number;
    comment?: string;
    author?: string;
    authorEmail?: string;
}
interface Vendor {
    id: string;
    name: string;
    email: string;
    phone?: string;
    website?: string;
    description?: string;
    tenantId?: string;
    createdAt?: string;
}
interface VendorQuery extends PaginationParams {
    q?: string;
}
interface Subscription {
    id: string;
    userId: string;
    serviceId: string;
    status: 'active' | 'cancelled' | 'expired';
    startDate: string;
    endDate?: string;
    createdAt: string;
}
interface Booking {
    id: string;
    userId: string;
    serviceId: string;
    vendorId: string;
    scheduledDate?: string;
    scheduledSlot?: string;
    customerName?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    createdAt: string;
}
interface CreateBookingData {
    serviceId: string;
    scheduledDate?: string;
    scheduledSlot?: string;
    customerName?: string;
}
interface Message {
    id: string;
    listingId: string;
    listingTitle: string;
    vendorId: string;
    vendorEmail: string;
    userId: string;
    userEmail: string;
    subject: string;
    content: string;
    read: boolean;
    createdAt: string;
    replies?: MessageReply[];
}
interface MessageQuery extends PaginationParams {
}
interface SendMessageData {
    listingId: string;
    listingTitle: string;
    vendorId: string;
    vendorEmail: string;
    subject: string;
    content: string;
}
interface MessageReply {
    id: string;
    content: string;
    author: string;
    createdAt: string;
}
interface ReplyToMessageData {
    threadId: string;
    content: string;
}
interface Wallet {
    id: string;
    userId: string;
    balance: number;
    currency: string;
    transactions: WalletTransaction[];
    createdAt: string;
    updatedAt: string;
}
interface WalletTransaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    balance: number;
    description: string;
    createdAt: string;
}
interface RedeemCreditsData {
    amount: number;
    serviceId: string;
    description?: string;
}
interface User {
    uid: string;
    email: string;
    role: string;
    tenantId: string;
}
interface ApiKey {
    id: string;
    appId: string;
    userId: string;
    name: string;
    tier: 'free' | 'standard' | 'premium';
    active: boolean;
    expiresAt?: string;
    lastUsedAt?: string;
    createdAt: string;
    updatedAt: string;
}
interface CreateApiKeyData {
    name: string;
    tier?: 'free' | 'standard' | 'premium';
    expiresAt?: string;
}
interface ApiKeyUsage {
    apiKeyId: string;
    requests: number;
    period: string;
    limit: number;
    tier: string;
}
interface Webhook {
    id: string;
    appId: string;
    url: string;
    events: string[];
    description?: string;
    active: boolean;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    createdAt: string;
    updatedAt: string;
}
interface CreateWebhookData {
    url: string;
    events: string[];
    description?: string;
    active?: boolean;
}
interface UpdateWebhookData {
    url?: string;
    events?: string[];
    description?: string;
    active?: boolean;
}
interface WebhookEvent {
    id: string;
    event: string;
    timestamp: string;
    attempt: number;
    data: any;
}
interface WebhookDelivery {
    id: string;
    webhookId: string;
    event: string;
    status: 'success' | 'failed';
    statusCode: number;
    attempt: number;
    duration: number;
    error?: string;
    createdAt: string;
}
interface WebhookStats {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
    eventBreakdown: Record<string, {
        total: number;
        successful: number;
        failed: number;
    }>;
    recentDeliveries: WebhookDelivery[];
}
interface ApiError {
    error: string;
    message?: string;
    statusCode?: number;
}
interface HealthStatus {
    status: string;
    timestamp: string;
    uptime: number;
}
interface VersionInfo {
    version: string;
    status: 'active' | 'deprecated' | 'sunset';
    releaseDate: string;
    deprecationDate?: string;
    sunsetDate?: string;
    features: string[];
}

/**
 * Main Marketplace API Client
 */

declare class MarketplaceClient {
    private client;
    private config;
    constructor(config: MarketplaceConfig);
    private getDefaultHeaders;
    private setupInterceptors;
    private handleError;
    /**
     * Update authentication token
     */
    setFirebaseToken(token: string): void;
    /**
     * Update API key
     */
    setApiKey(apiKey: string): void;
    /**
     * Update tenant ID
     */
    setTenantId(tenantId: string): void;
    /**
     * Health check
     */
    healthCheck(): Promise<HealthStatus>;
    /**
     * Get current user info
     */
    getCurrentUser(): Promise<User>;
    /**
     * Get version information
     */
    getVersionInfo(): Promise<VersionInfo[]>;
    /**
     * List services
     */
    listServices(query?: ServiceQuery): Promise<PaginatedResponse<Service>>;
    /**
     * Get my services (requires auth)
     */
    getMyServices(refresh?: boolean): Promise<{
        tenantId: string;
        vendor: any;
        listings: Service[];
        bookings: Booking[];
    }>;
    /**
     * Create service (requires auth)
     */
    createService(serviceData: CreateServiceData): Promise<Service>;
    /**
     * Update service (requires auth)
     */
    updateService(id: string, updates: UpdateServiceData): Promise<Service>;
    /**
     * Delete service (requires auth)
     */
    deleteService(id: string): Promise<void>;
    /**
     * Add review to service
     */
    addReview(serviceId: string, review: CreateReviewData): Promise<Service>;
    /**
     * List vendors
     */
    listVendors(query?: VendorQuery): Promise<PaginatedResponse<Vendor>>;
    /**
     * Create vendor (requires auth)
     */
    createVendor(vendorData: Omit<Vendor, 'id' | 'createdAt'>): Promise<Vendor>;
    /**
     * Get my subscriptions (requires auth)
     */
    getMySubscriptions(): Promise<Subscription[]>;
    /**
     * Get my bookings (requires auth)
     */
    getMyBookings(): Promise<Booking[]>;
    /**
     * Subscribe to service (requires auth)
     */
    subscribeToService(bookingData: CreateBookingData): Promise<Booking>;
    /**
     * Unsubscribe from service (requires auth)
     */
    unsubscribeFromService(serviceId: string): Promise<void>;
    /**
     * List messages (requires auth)
     */
    listMessages(query?: MessageQuery): Promise<PaginatedResponse<Message>>;
    /**
     * Send message (requires auth)
     */
    sendMessage(messageData: SendMessageData): Promise<Message>;
    /**
     * Reply to message (requires auth)
     */
    replyToMessage(replyData: ReplyToMessageData): Promise<Message>;
    /**
     * Mark message as read (requires auth)
     */
    markMessageAsRead(messageId: string): Promise<void>;
    /**
     * Get my wallet (requires auth)
     */
    getMyWallet(): Promise<Wallet>;
    /**
     * Redeem credits (requires auth)
     */
    redeemCredits(redeemData: RedeemCreditsData): Promise<Wallet>;
    /**
     * Create API key (requires auth)
     */
    createApiKey(keyData: CreateApiKeyData): Promise<ApiKey & {
        key: string;
    }>;
    /**
     * List API keys (requires auth)
     */
    listApiKeys(): Promise<ApiKey[]>;
    /**
     * Get API key usage (requires auth)
     */
    getApiKeyUsage(keyId: string): Promise<ApiKeyUsage>;
    /**
     * Delete API key (requires auth)
     */
    deleteApiKey(keyId: string): Promise<void>;
    /**
     * Rotate API key (requires auth)
     */
    rotateApiKey(keyId: string): Promise<ApiKey & {
        key: string;
    }>;
    /**
     * Create webhook (requires API key auth)
     */
    createWebhook(webhookData: CreateWebhookData): Promise<Webhook & {
        secret: string;
    }>;
    /**
     * List webhooks (requires API key auth)
     */
    listWebhooks(params?: {
        active?: boolean;
        event?: string;
    }): Promise<Webhook[]>;
    /**
     * Get webhook (requires API key auth)
     */
    getWebhook(webhookId: string): Promise<Webhook>;
    /**
     * Update webhook (requires API key auth)
     */
    updateWebhook(webhookId: string, updates: UpdateWebhookData): Promise<Webhook>;
    /**
     * Delete webhook (requires API key auth)
     */
    deleteWebhook(webhookId: string): Promise<void>;
    /**
     * Test webhook (requires API key auth)
     */
    testWebhook(webhookId: string): Promise<{
        success: boolean;
        statusCode: number;
        duration: number;
    }>;
    /**
     * Get webhook statistics (requires API key auth)
     */
    getWebhookStats(webhookId: string, days?: number): Promise<WebhookStats>;
    /**
     * Get webhook deliveries (requires API key auth)
     */
    getWebhookDeliveries(webhookId: string, params?: {
        limit?: number;
        status?: string;
        event?: string;
    }): Promise<WebhookDelivery[]>;
    /**
     * Replay webhook delivery (requires API key auth)
     */
    replayWebhookDelivery(deliveryId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Rotate webhook secret (requires API key auth)
     */
    rotateWebhookSecret(webhookId: string): Promise<{
        webhookId: string;
        secret: string;
    }>;
    /**
     * List available webhook events
     */
    listWebhookEvents(): Promise<Array<{
        event: string;
        description: string;
        category: string;
    }>>;
}

/**
 * Webhook signature verification for Marketplace SDK
 */
declare class WebhookVerifier {
    private secret;
    constructor(secret: string);
    /**
     * Verify webhook signature
     */
    verify(payload: any, signature: string): boolean;
    /**
     * Generate signature for payload
     */
    generateSignature(payload: any): string;
    /**
     * Verify webhook request (Express middleware compatible)
     */
    verifyRequest(body: any, signatureHeader: string): boolean;
}

/**
 * Custom error classes for Marketplace SDK
 */
declare class MarketplaceError extends Error {
    statusCode?: number | undefined;
    response?: any | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: any | undefined);
}
declare class AuthenticationError extends MarketplaceError {
    constructor(message?: string);
}
declare class AuthorizationError extends MarketplaceError {
    constructor(message?: string);
}
declare class NotFoundError extends MarketplaceError {
    constructor(message?: string);
}
declare class ValidationError extends MarketplaceError {
    errors?: any | undefined;
    constructor(message?: string, errors?: any | undefined);
}
declare class RateLimitError extends MarketplaceError {
    retryAfter?: number | undefined;
    constructor(message?: string, retryAfter?: number | undefined);
}
declare class NetworkError extends MarketplaceError {
    constructor(message?: string);
}

interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
}
declare class FirebaseAuthHelper {
    private app;
    private auth;
    constructor(config: FirebaseConfig);
    /**
     * Sign in with email and password
     */
    signIn(email: string, password: string): Promise<UserCredential>;
    /**
     * Get current ID token
     */
    getIdToken(): Promise<string | null>;
    /**
     * Sign out
     */
    signOut(): Promise<void>;
    /**
     * Get current user
     */
    getCurrentUser(): _firebase_auth.User | null;
}
interface ApiKeyAuthHelper {
    apiKey: string;
}
declare function createApiKeyAuth(apiKey: string): ApiKeyAuthHelper;

export { type ApiError, type ApiKey, type ApiKeyAuthHelper, type ApiKeyUsage, AuthenticationError, AuthorizationError, type Booking, type CreateApiKeyData, type CreateBookingData, type CreateReviewData, type CreateServiceData, type CreateWebhookData, FirebaseAuthHelper, type FirebaseConfig, type HealthStatus, MarketplaceClient, type MarketplaceConfig, MarketplaceError, type Message, type MessageQuery, type MessageReply, NetworkError, NotFoundError, type PaginatedResponse, type PaginationParams, RateLimitError, type RedeemCreditsData, type ReplyToMessageData, type Review, type SendMessageData, type Service, type ServiceQuery, type Subscription, type UpdateServiceData, type UpdateWebhookData, type User, ValidationError, type Vendor, type VendorQuery, type VersionInfo, type Wallet, type WalletTransaction, type Webhook, type WebhookDelivery, type WebhookEvent, type WebhookStats, WebhookVerifier, createApiKeyAuth };
