/**
 * Webhook Integration Helpers
 * 
 * Helper functions to trigger webhooks from various API endpoints
 * Import and call these functions after creating/updating resources
 */

import { triggerWebhook } from '../services/webhookService.js';

/**
 * Trigger booking webhooks
 */
export async function triggerBookingWebhook(action, bookingData) {
  const eventMap = {
    created: 'booking.created',
    updated: 'booking.updated',
    cancelled: 'booking.cancelled',
    completed: 'booking.completed'
  };
  
  const event = eventMap[action];
  if (!event) {
    console.warn(`[Webhook] Unknown booking action: ${action}`);
    return;
  }
  
  try {
    await triggerWebhook(event, {
      bookingId: bookingData.id,
      serviceId: bookingData.serviceId,
      userId: bookingData.userId,
      vendorId: bookingData.vendorId,
      status: bookingData.status,
      date: bookingData.date,
      amount: bookingData.amount,
      createdAt: bookingData.createdAt,
      updatedAt: bookingData.updatedAt
    });
  } catch (error) {
    console.error(`[Webhook] Error triggering ${event}:`, error);
    // Don't throw - webhook failures shouldn't break the main flow
  }
}

/**
 * Trigger payment webhooks
 */
export async function triggerPaymentWebhook(action, paymentData) {
  const eventMap = {
    succeeded: 'payment.succeeded',
    failed: 'payment.failed',
    refunded: 'payment.refunded'
  };
  
  const event = eventMap[action];
  if (!event) {
    console.warn(`[Webhook] Unknown payment action: ${action}`);
    return;
  }
  
  try {
    await triggerWebhook(event, {
      paymentId: paymentData.id,
      userId: paymentData.userId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      status: paymentData.status,
      method: paymentData.method,
      bookingId: paymentData.bookingId,
      subscriptionId: paymentData.subscriptionId,
      createdAt: paymentData.createdAt
    });
  } catch (error) {
    console.error(`[Webhook] Error triggering ${event}:`, error);
  }
}

/**
 * Trigger subscription webhooks
 */
export async function triggerSubscriptionWebhook(action, subscriptionData) {
  const eventMap = {
    created: 'subscription.created',
    updated: 'subscription.updated',
    cancelled: 'subscription.cancelled',
    expired: 'subscription.expired'
  };
  
  const event = eventMap[action];
  if (!event) {
    console.warn(`[Webhook] Unknown subscription action: ${action}`);
    return;
  }
  
  try {
    await triggerWebhook(event, {
      subscriptionId: subscriptionData.id,
      userId: subscriptionData.userId,
      vendorId: subscriptionData.vendorId,
      planId: subscriptionData.planId,
      status: subscriptionData.status,
      startDate: subscriptionData.startDate,
      endDate: subscriptionData.endDate,
      amount: subscriptionData.amount,
      interval: subscriptionData.interval,
      createdAt: subscriptionData.createdAt,
      updatedAt: subscriptionData.updatedAt
    });
  } catch (error) {
    console.error(`[Webhook] Error triggering ${event}:`, error);
  }
}

/**
 * Trigger service webhooks
 */
export async function triggerServiceWebhook(action, serviceData) {
  const eventMap = {
    created: 'service.created',
    updated: 'service.updated',
    deleted: 'service.deleted'
  };
  
  const event = eventMap[action];
  if (!event) {
    console.warn(`[Webhook] Unknown service action: ${action}`);
    return;
  }
  
  try {
    await triggerWebhook(event, {
      serviceId: serviceData.id,
      vendorId: serviceData.vendorId,
      name: serviceData.name,
      category: serviceData.category,
      price: serviceData.price,
      status: serviceData.status,
      createdAt: serviceData.createdAt,
      updatedAt: serviceData.updatedAt
    });
  } catch (error) {
    console.error(`[Webhook] Error triggering ${event}:`, error);
  }
}

/**
 * Trigger user webhooks
 */
export async function triggerUserWebhook(action, userData) {
  const eventMap = {
    created: 'user.created',
    updated: 'user.updated'
  };
  
  const event = eventMap[action];
  if (!event) {
    console.warn(`[Webhook] Unknown user action: ${action}`);
    return;
  }
  
  try {
    await triggerWebhook(event, {
      userId: userData.id || userData.uid,
      email: userData.email,
      role: userData.role,
      tenantId: userData.tenantId,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    });
  } catch (error) {
    console.error(`[Webhook] Error triggering ${event}:`, error);
  }
}

/**
 * Trigger wallet webhooks
 */
export async function triggerWalletWebhook(action, walletData) {
  const eventMap = {
    credited: 'wallet.credited',
    debited: 'wallet.debited'
  };
  
  const event = eventMap[action];
  if (!event) {
    console.warn(`[Webhook] Unknown wallet action: ${action}`);
    return;
  }
  
  try {
    await triggerWebhook(event, {
      walletId: walletData.id,
      userId: walletData.userId,
      amount: walletData.amount,
      balance: walletData.balance,
      transactionId: walletData.transactionId,
      type: walletData.type,
      description: walletData.description,
      createdAt: walletData.createdAt
    });
  } catch (error) {
    console.error(`[Webhook] Error triggering ${event}:`, error);
  }
}

/**
 * Trigger rate limit webhooks
 */
export async function triggerRateLimitWebhook(action, rateLimitData) {
  const eventMap = {
    warning: 'ratelimit.warning',
    exceeded: 'ratelimit.exceeded'
  };
  
  const event = eventMap[action];
  if (!event) {
    console.warn(`[Webhook] Unknown rate limit action: ${action}`);
    return;
  }
  
  try {
    await triggerWebhook(event, {
      apiKeyId: rateLimitData.apiKeyId,
      appId: rateLimitData.appId,
      limit: rateLimitData.limit,
      current: rateLimitData.current,
      percentage: rateLimitData.percentage,
      resetAt: rateLimitData.resetAt,
      tier: rateLimitData.tier
    }, {
      appId: rateLimitData.appId // Filter by app
    });
  } catch (error) {
    console.error(`[Webhook] Error triggering ${event}:`, error);
  }
}

/**
 * Integration examples for existing routes:
 * 
 * // In booking routes (backend/routes/bookings.js)
 * import { triggerBookingWebhook } from '../utils/webhookHelpers.js';
 * 
 * // After creating booking
 * await triggerBookingWebhook('created', newBooking);
 * 
 * // After updating booking
 * await triggerBookingWebhook('updated', updatedBooking);
 * 
 * // In payment routes (backend/routes/payments.js)
 * import { triggerPaymentWebhook } from '../utils/webhookHelpers.js';
 * 
 * // After successful payment
 * await triggerPaymentWebhook('succeeded', payment);
 * 
 * // In subscription routes (backend/routes/subscriptions.js)
 * import { triggerSubscriptionWebhook } from '../utils/webhookHelpers.js';
 * 
 * // After creating subscription
 * await triggerSubscriptionWebhook('created', subscription);
 * 
 * // In service routes (backend/routes/services.js)
 * import { triggerServiceWebhook } from '../utils/webhookHelpers.js';
 * 
 * // After creating service
 * await triggerServiceWebhook('created', service);
 * 
 * // In wallet routes (backend/routes/wallets.js)
 * import { triggerWalletWebhook } from '../utils/webhookHelpers.js';
 * 
 * // After crediting wallet
 * await triggerWalletWebhook('credited', {
 *   id: walletId,
 *   userId,
 *   amount,
 *   balance: newBalance,
 *   transactionId,
 *   type: 'credit',
 *   description: 'Payment received',
 *   createdAt: new Date().toISOString()
 * });
 * 
 * // In rate limiter middleware (backend/middleware/apiKeyRateLimiter.js)
 * import { triggerRateLimitWebhook } from '../utils/webhookHelpers.js';
 * 
 * // When 80% threshold reached
 * if (percentage >= 80 && percentage < 100) {
 *   await triggerRateLimitWebhook('warning', {
 *     apiKeyId,
 *     appId,
 *     limit: limitConfig.requests,
 *     current: requestCount,
 *     percentage,
 *     resetAt,
 *     tier: limitConfig.tier
 *   });
 * }
 * 
 * // When limit exceeded
 * if (requestCount >= limitConfig.requests) {
 *   await triggerRateLimitWebhook('exceeded', {
 *     apiKeyId,
 *     appId,
 *     limit: limitConfig.requests,
 *     current: requestCount,
 *     percentage: 100,
 *     resetAt,
 *     tier: limitConfig.tier
 *   });
 * }
 */

export default {
  triggerBookingWebhook,
  triggerPaymentWebhook,
  triggerSubscriptionWebhook,
  triggerServiceWebhook,
  triggerUserWebhook,
  triggerWalletWebhook,
  triggerRateLimitWebhook
};
