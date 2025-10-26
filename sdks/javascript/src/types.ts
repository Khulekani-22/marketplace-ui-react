/**
 * Type definitions for Marketplace API
 */

export interface MarketplaceConfig {
  baseUrl: string;
  apiKey?: string;
  firebaseToken?: string;
  tenantId?: string;
  timeout?: number;
  retries?: number;
  version?: 'v1' | 'v2';
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

// Service Types
export interface Service {
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

export interface ServiceQuery extends PaginationParams {
  q?: string;
  category?: string;
  vendor?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateServiceData {
  title: string;
  description: string;
  category: string;
  price: number;
  currency?: string;
  vendor: string;
  contactEmail: string;
  featured?: boolean;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  author: string;
  authorEmail: string;
  createdAt: string;
}

export interface CreateReviewData {
  rating: number;
  comment?: string;
  author?: string;
  authorEmail?: string;
}

// Vendor Types
export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  tenantId?: string;
  createdAt?: string;
}

export interface VendorQuery extends PaginationParams {
  q?: string;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  serviceId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface Booking {
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

export interface CreateBookingData {
  serviceId: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  customerName?: string;
}

// Message Types
export interface Message {
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

export interface MessageQuery extends PaginationParams {}

export interface SendMessageData {
  listingId: string;
  listingTitle: string;
  vendorId: string;
  vendorEmail: string;
  subject: string;
  content: string;
}

export interface MessageReply {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface ReplyToMessageData {
  threadId: string;
  content: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

export interface RedeemCreditsData {
  amount: number;
  serviceId: string;
  description?: string;
}

// User Types
export interface User {
  uid: string;
  email: string;
  role: string;
  tenantId: string;
}

// API Key Types
export interface ApiKey {
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

export interface CreateApiKeyData {
  name: string;
  tier?: 'free' | 'standard' | 'premium';
  expiresAt?: string;
}

export interface ApiKeyUsage {
  apiKeyId: string;
  requests: number;
  period: string;
  limit: number;
  tier: string;
}

// Webhook Types
export interface Webhook {
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

export interface CreateWebhookData {
  url: string;
  events: string[];
  description?: string;
  active?: boolean;
}

export interface UpdateWebhookData {
  url?: string;
  events?: string[];
  description?: string;
  active?: boolean;
}

export interface WebhookEvent {
  id: string;
  event: string;
  timestamp: string;
  attempt: number;
  data: any;
}

export interface WebhookDelivery {
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

export interface WebhookStats {
  total: number;
  successful: number;
  failed: number;
  averageDuration: number;
  eventBreakdown: Record<string, { total: number; successful: number; failed: number }>;
  recentDeliveries: WebhookDelivery[];
}

// Error Response
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

// Health Check
export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
}

// Version Info
export interface VersionInfo {
  version: string;
  status: 'active' | 'deprecated' | 'sunset';
  releaseDate: string;
  deprecationDate?: string;
  sunsetDate?: string;
  features: string[];
}
