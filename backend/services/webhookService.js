/**
 * Webhook Delivery Service
 * 
 * Handles webhook event delivery with:
 * - HMAC signature verification
 * - Automatic retry with exponential backoff
 * - Delivery status tracking
 * - Event replay functionality
 */

import crypto from 'crypto';
import axios from 'axios';
import { firestore } from '../services/firestore.js';

/**
 * Supported webhook events
 */
export const WEBHOOK_EVENTS = {
  // Booking events
  'booking.created': 'A new booking was created',
  'booking.updated': 'A booking was updated',
  'booking.cancelled': 'A booking was cancelled',
  'booking.completed': 'A booking was completed',
  
  // Payment events
  'payment.succeeded': 'A payment was successful',
  'payment.failed': 'A payment failed',
  'payment.refunded': 'A payment was refunded',
  
  // Subscription events
  'subscription.created': 'A new subscription was created',
  'subscription.updated': 'A subscription was updated',
  'subscription.cancelled': 'A subscription was cancelled',
  'subscription.expired': 'A subscription expired',
  
  // Service events
  'service.created': 'A new service was created',
  'service.updated': 'A service was updated',
  'service.deleted': 'A service was deleted',
  
  // User events
  'user.created': 'A new user registered',
  'user.updated': 'User profile was updated',
  
  // Wallet events
  'wallet.credited': 'Wallet was credited',
  'wallet.debited': 'Wallet was debited',
  
  // Rate limit events
  'ratelimit.warning': 'Rate limit threshold exceeded (80%)',
  'ratelimit.exceeded': 'Rate limit fully exceeded'
};

/**
 * Generate HMAC signature for webhook payload
 */
export function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifySignature(payload, signature, secret) {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Deliver webhook to endpoint
 */
async function deliverWebhook(webhook, event, payload, attempt = 1) {
  const maxAttempts = 5;
  const timeoutMs = 10000; // 10 seconds
  
  try {
    // Generate signature
    const signature = generateSignature(payload, webhook.secret);
    
    // Prepare webhook payload
    const webhookPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      attempt,
      data: payload
    };
    
    // Make HTTP request
    const startTime = Date.now();
    const response = await axios.post(webhook.url, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-ID': webhookPayload.id,
        'X-Webhook-Attempt': attempt.toString(),
        'User-Agent': 'Marketplace-Webhook/1.0'
      },
      timeout: timeoutMs,
      validateStatus: (status) => status >= 200 && status < 300
    });
    
    const duration = Date.now() - startTime;
    
    // Record successful delivery
    await recordDelivery(webhook.id, event, webhookPayload, {
      status: 'success',
      statusCode: response.status,
      attempt,
      duration,
      response: response.data
    });
    
    return {
      success: true,
      statusCode: response.status,
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - Date.now();
    const statusCode = error.response?.status || 0;
    const errorMessage = error.message || 'Unknown error';
    
    // Record failed delivery
    await recordDelivery(webhook.id, event, payload, {
      status: 'failed',
      statusCode,
      attempt,
      duration,
      error: errorMessage
    });
    
    // Retry with exponential backoff
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, 16s, 32s
      console.log(`[Webhook] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return deliverWebhook(webhook, event, payload, attempt + 1);
    }
    
    return {
      success: false,
      statusCode,
      error: errorMessage,
      attempts: attempt
    };
  }
}

/**
 * Record webhook delivery attempt
 */
async function recordDelivery(webhookId, event, payload, result) {
  try {
    const deliveryRef = firestore
      .collection('webhookDeliveries')
      .doc();
    
    await deliveryRef.set({
      webhookId,
      event,
      payload,
      ...result,
      createdAt: new Date().toISOString()
    });
    
    // Update webhook statistics
    await firestore.collection('webhooks').doc(webhookId).update({
      lastDeliveryAt: new Date().toISOString(),
      totalDeliveries: firestore.FieldValue.increment(1),
      ...(result.status === 'success' 
        ? { successfulDeliveries: firestore.FieldValue.increment(1) }
        : { failedDeliveries: firestore.FieldValue.increment(1) }
      )
    });
    
  } catch (error) {
    console.error('[Webhook] Error recording delivery:', error);
  }
}

/**
 * Trigger webhook event
 */
export async function triggerWebhook(event, payload, filters = {}) {
  try {
    console.log(`[Webhook] Triggering event: ${event}`);
    
    // Validate event type
    if (!WEBHOOK_EVENTS[event]) {
      console.warn(`[Webhook] Unknown event type: ${event}`);
      return { triggered: 0, message: 'Unknown event type' };
    }
    
    // Find active webhooks subscribed to this event
    let query = firestore.collection('webhooks')
      .where('active', '==', true)
      .where('events', 'array-contains', event);
    
    // Apply filters
    if (filters.appId) {
      query = query.where('appId', '==', filters.appId);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log(`[Webhook] No active webhooks for event: ${event}`);
      return { triggered: 0, message: 'No active webhooks' };
    }
    
    // Deliver to all matching webhooks
    const deliveries = [];
    for (const doc of snapshot.docs) {
      const webhook = { id: doc.id, ...doc.data() };
      
      // Deliver webhook asynchronously
      deliveries.push(
        deliverWebhook(webhook, event, payload)
          .catch(err => {
            console.error(`[Webhook] Delivery failed for ${webhook.id}:`, err);
            return { success: false, error: err.message };
          })
      );
    }
    
    // Wait for all deliveries
    const results = await Promise.all(deliveries);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`[Webhook] Delivered ${successful}/${results.length} webhooks for event: ${event}`);
    
    return {
      triggered: results.length,
      successful,
      failed,
      results
    };
    
  } catch (error) {
    console.error('[Webhook] Error triggering webhook:', error);
    throw error;
  }
}

/**
 * Replay failed webhook delivery
 */
export async function replayWebhook(deliveryId) {
  try {
    // Get delivery record
    const deliveryDoc = await firestore
      .collection('webhookDeliveries')
      .doc(deliveryId)
      .get();
    
    if (!deliveryDoc.exists) {
      throw new Error('Delivery not found');
    }
    
    const delivery = deliveryDoc.data();
    
    // Get webhook
    const webhookDoc = await firestore
      .collection('webhooks')
      .doc(delivery.webhookId)
      .get();
    
    if (!webhookDoc.exists) {
      throw new Error('Webhook not found');
    }
    
    const webhook = { id: webhookDoc.id, ...webhookDoc.data() };
    
    // Redeliver
    const result = await deliverWebhook(webhook, delivery.event, delivery.payload);
    
    return {
      success: result.success,
      originalDeliveryId: deliveryId,
      newDelivery: result
    };
    
  } catch (error) {
    console.error('[Webhook] Error replaying webhook:', error);
    throw error;
  }
}

/**
 * Test webhook endpoint
 */
export async function testWebhook(webhookId) {
  try {
    const webhookDoc = await firestore
      .collection('webhooks')
      .doc(webhookId)
      .get();
    
    if (!webhookDoc.exists) {
      throw new Error('Webhook not found');
    }
    
    const webhook = { id: webhookDoc.id, ...webhookDoc.data() };
    
    // Send test event
    const testPayload = {
      test: true,
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString()
    };
    
    const result = await deliverWebhook(webhook, 'test.webhook', testPayload);
    
    return {
      success: result.success,
      statusCode: result.statusCode,
      duration: result.duration,
      message: result.success 
        ? 'Test webhook delivered successfully' 
        : 'Test webhook delivery failed'
    };
    
  } catch (error) {
    console.error('[Webhook] Error testing webhook:', error);
    throw error;
  }
}

/**
 * Get webhook delivery statistics
 */
export async function getWebhookStats(webhookId, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const deliveriesSnapshot = await firestore
      .collection('webhookDeliveries')
      .where('webhookId', '==', webhookId)
      .where('createdAt', '>', startDate.toISOString())
      .orderBy('createdAt', 'desc')
      .get();
    
    const deliveries = deliveriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const stats = {
      total: deliveries.length,
      successful: deliveries.filter(d => d.status === 'success').length,
      failed: deliveries.filter(d => d.status === 'failed').length,
      averageDuration: 0,
      eventBreakdown: {},
      recentDeliveries: deliveries.slice(0, 10)
    };
    
    // Calculate average duration
    const successfulDeliveries = deliveries.filter(d => d.status === 'success');
    if (successfulDeliveries.length > 0) {
      const totalDuration = successfulDeliveries.reduce((sum, d) => sum + (d.duration || 0), 0);
      stats.averageDuration = Math.round(totalDuration / successfulDeliveries.length);
    }
    
    // Event breakdown
    deliveries.forEach(d => {
      const event = d.event;
      if (!stats.eventBreakdown[event]) {
        stats.eventBreakdown[event] = { total: 0, successful: 0, failed: 0 };
      }
      stats.eventBreakdown[event].total++;
      if (d.status === 'success') {
        stats.eventBreakdown[event].successful++;
      } else {
        stats.eventBreakdown[event].failed++;
      }
    });
    
    return stats;
    
  } catch (error) {
    console.error('[Webhook] Error getting stats:', error);
    throw error;
  }
}

export default {
  triggerWebhook,
  replayWebhook,
  testWebhook,
  getWebhookStats,
  generateSignature,
  verifySignature,
  WEBHOOK_EVENTS
};
