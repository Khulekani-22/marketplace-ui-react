/**
 * Webhook Management Routes
 * 
 * Endpoints for registering, managing, and testing webhooks
 */

import express from 'express';
import crypto from 'crypto';
import { firestore } from '../services/firestore.js';
import { firebaseAuthRequired } from '../middleware/authFirebase.js';
import { apiKeyAuth } from '../middleware/authApiKey.js';
import { requireAdmin } from '../middleware/isAdmin.js';
import { 
  triggerWebhook, 
  testWebhook, 
  replayWebhook, 
  getWebhookStats,
  WEBHOOK_EVENTS 
} from '../services/webhookService.js';

const router = express.Router();

/**
 * Create webhook
 * POST /api/webhooks
 */
router.post('/', apiKeyAuth, async (req, res) => {
  try {
    const { url, events, description, active = true } = req.body;
    const apiKey = req.apiKey;
    
    // Validation
    if (!url) {
      return res.status(400).json({
        error: 'Webhook URL is required'
      });
    }
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'At least one event must be specified',
        availableEvents: Object.keys(WEBHOOK_EVENTS)
      });
    }
    
    // Validate event types
    const invalidEvents = events.filter(e => !WEBHOOK_EVENTS[e]);
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        error: 'Invalid event types',
        invalidEvents,
        availableEvents: Object.keys(WEBHOOK_EVENTS)
      });
    }
    
    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({
          error: 'Webhook URL must use HTTP or HTTPS protocol'
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid webhook URL format'
      });
    }
    
    // Generate webhook secret for signature verification
    const secret = crypto.randomBytes(32).toString('hex');
    
    // Create webhook
    const webhookRef = firestore.collection('webhooks').doc();
    const webhook = {
      id: webhookRef.id,
      appId: apiKey.appId,
      apiKeyId: apiKey.id,
      userId: apiKey.userId,
      url,
      events,
      description: description || '',
      secret,
      active,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await webhookRef.set(webhook);
    
    res.status(201).json({
      message: 'Webhook created successfully',
      webhook: {
        ...webhook,
        // Return secret only on creation
        secret
      }
    });
    
  } catch (error) {
    console.error('[Webhooks] Error creating webhook:', error);
    res.status(500).json({
      error: 'Failed to create webhook',
      message: error.message
    });
  }
});

/**
 * List webhooks
 * GET /api/webhooks
 */
router.get('/', apiKeyAuth, async (req, res) => {
  try {
    const apiKey = req.apiKey;
    const { active, event } = req.query;
    
    let query = firestore.collection('webhooks');
    
    // Filter by API key or app
    if (apiKey.appId) {
      query = query.where('appId', '==', apiKey.appId);
    } else {
      query = query.where('apiKeyId', '==', apiKey.id);
    }
    
    // Filter by active status
    if (active !== undefined) {
      query = query.where('active', '==', active === 'true');
    }
    
    // Filter by event
    if (event) {
      query = query.where('events', 'array-contains', event);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const webhooks = snapshot.docs.map(doc => {
      const data = doc.data();
      // Don't expose secret in list view
      delete data.secret;
      return {
        id: doc.id,
        ...data
      };
    });
    
    res.json({
      webhooks,
      count: webhooks.length,
      availableEvents: WEBHOOK_EVENTS
    });
    
  } catch (error) {
    console.error('[Webhooks] Error listing webhooks:', error);
    res.status(500).json({
      error: 'Failed to list webhooks',
      message: error.message
    });
  }
});

/**
 * Get webhook by ID
 * GET /api/webhooks/:id
 */
router.get('/:id', apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.apiKey;
    
    const doc = await firestore.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'Webhook not found'
      });
    }
    
    const webhook = { id: doc.id, ...doc.data() };
    
    // Check ownership
    if (webhook.apiKeyId !== apiKey.id && webhook.appId !== apiKey.appId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    // Don't expose secret
    delete webhook.secret;
    
    res.json({ webhook });
    
  } catch (error) {
    console.error('[Webhooks] Error getting webhook:', error);
    res.status(500).json({
      error: 'Failed to get webhook',
      message: error.message
    });
  }
});

/**
 * Update webhook
 * PATCH /api/webhooks/:id
 */
router.patch('/:id', apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, events, description, active } = req.body;
    const apiKey = req.apiKey;
    
    const doc = await firestore.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'Webhook not found'
      });
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook.apiKeyId !== apiKey.id && webhook.appId !== apiKey.appId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    const updates = { updatedAt: new Date().toISOString() };
    
    // Validate and update URL
    if (url) {
      try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return res.status(400).json({
            error: 'Webhook URL must use HTTP or HTTPS protocol'
          });
        }
        updates.url = url;
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid webhook URL format'
        });
      }
    }
    
    // Validate and update events
    if (events) {
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          error: 'At least one event must be specified'
        });
      }
      
      const invalidEvents = events.filter(e => !WEBHOOK_EVENTS[e]);
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          error: 'Invalid event types',
          invalidEvents,
          availableEvents: Object.keys(WEBHOOK_EVENTS)
        });
      }
      
      updates.events = events;
    }
    
    // Update description
    if (description !== undefined) {
      updates.description = description;
    }
    
    // Update active status
    if (active !== undefined) {
      updates.active = active;
    }
    
    await firestore.collection('webhooks').doc(id).update(updates);
    
    const updated = { id, ...webhook, ...updates };
    delete updated.secret;
    
    res.json({
      message: 'Webhook updated successfully',
      webhook: updated
    });
    
  } catch (error) {
    console.error('[Webhooks] Error updating webhook:', error);
    res.status(500).json({
      error: 'Failed to update webhook',
      message: error.message
    });
  }
});

/**
 * Delete webhook
 * DELETE /api/webhooks/:id
 */
router.delete('/:id', apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.apiKey;
    
    const doc = await firestore.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'Webhook not found'
      });
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook.apiKeyId !== apiKey.id && webhook.appId !== apiKey.appId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    await firestore.collection('webhooks').doc(id).delete();
    
    res.json({
      message: 'Webhook deleted successfully',
      webhookId: id
    });
    
  } catch (error) {
    console.error('[Webhooks] Error deleting webhook:', error);
    res.status(500).json({
      error: 'Failed to delete webhook',
      message: error.message
    });
  }
});

/**
 * Rotate webhook secret
 * POST /api/webhooks/:id/rotate-secret
 */
router.post('/:id/rotate-secret', apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.apiKey;
    
    const doc = await firestore.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'Webhook not found'
      });
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook.apiKeyId !== apiKey.id && webhook.appId !== apiKey.appId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex');
    
    await firestore.collection('webhooks').doc(id).update({
      secret: newSecret,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      message: 'Webhook secret rotated successfully',
      webhookId: id,
      secret: newSecret
    });
    
  } catch (error) {
    console.error('[Webhooks] Error rotating secret:', error);
    res.status(500).json({
      error: 'Failed to rotate secret',
      message: error.message
    });
  }
});

/**
 * Test webhook
 * POST /api/webhooks/:id/test
 */
router.post('/:id/test', apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.apiKey;
    
    const doc = await firestore.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'Webhook not found'
      });
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook.apiKeyId !== apiKey.id && webhook.appId !== apiKey.appId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    const result = await testWebhook(id);
    
    res.json({
      message: result.message,
      result
    });
    
  } catch (error) {
    console.error('[Webhooks] Error testing webhook:', error);
    res.status(500).json({
      error: 'Failed to test webhook',
      message: error.message
    });
  }
});

/**
 * Get webhook statistics
 * GET /api/webhooks/:id/stats
 */
router.get('/:id/stats', apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;
    const apiKey = req.apiKey;
    
    const doc = await firestore.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'Webhook not found'
      });
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook.apiKeyId !== apiKey.id && webhook.appId !== apiKey.appId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    const stats = await getWebhookStats(id, parseInt(days));
    
    res.json({
      webhookId: id,
      period: `${days} days`,
      stats
    });
    
  } catch (error) {
    console.error('[Webhooks] Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get webhook stats',
      message: error.message
    });
  }
});

/**
 * Get webhook deliveries
 * GET /api/webhooks/:id/deliveries
 */
router.get('/:id/deliveries', apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, status, event } = req.query;
    const apiKey = req.apiKey;
    
    const doc = await firestore.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        error: 'Webhook not found'
      });
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook.apiKeyId !== apiKey.id && webhook.appId !== apiKey.appId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    let query = firestore
      .collection('webhookDeliveries')
      .where('webhookId', '==', id);
    
    // Filter by status
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Filter by event
    if (event) {
      query = query.where('event', '==', event);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const deliveries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      webhookId: id,
      deliveries,
      count: deliveries.length
    });
    
  } catch (error) {
    console.error('[Webhooks] Error getting deliveries:', error);
    res.status(500).json({
      error: 'Failed to get deliveries',
      message: error.message
    });
  }
});

/**
 * Replay failed delivery
 * POST /api/webhooks/deliveries/:deliveryId/replay
 */
router.post('/deliveries/:deliveryId/replay', apiKeyAuth, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    const result = await replayWebhook(deliveryId);
    
    res.json({
      message: 'Webhook delivery replayed',
      result
    });
    
  } catch (error) {
    console.error('[Webhooks] Error replaying delivery:', error);
    res.status(500).json({
      error: 'Failed to replay delivery',
      message: error.message
    });
  }
});

/**
 * List available webhook events
 * GET /api/webhooks/events
 */
router.get('/meta/events', (req, res) => {
  const events = Object.entries(WEBHOOK_EVENTS).map(([event, description]) => ({
    event,
    description,
    category: event.split('.')[0]
  }));
  
  // Group by category
  const byCategory = {};
  events.forEach(e => {
    if (!byCategory[e.category]) {
      byCategory[e.category] = [];
    }
    byCategory[e.category].push({ event: e.event, description: e.description });
  });
  
  res.json({
    events,
    byCategory,
    total: events.length
  });
});

/**
 * Trigger webhook manually (admin only)
 * POST /api/webhooks/admin/trigger
 */
router.post('/admin/trigger', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { event, payload, filters } = req.body;
    
    if (!event) {
      return res.status(400).json({
        error: 'Event type is required'
      });
    }
    
    const result = await triggerWebhook(event, payload || {}, filters || {});
    
    res.json({
      message: 'Webhook triggered',
      result
    });
    
  } catch (error) {
    console.error('[Webhooks] Error triggering webhook:', error);
    res.status(500).json({
      error: 'Failed to trigger webhook',
      message: error.message
    });
  }
});

/**
 * Get system-wide webhook statistics (admin only)
 * GET /api/webhooks/admin/stats
 */
router.get('/admin/stats', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get all deliveries in period
    const deliveriesSnapshot = await firestore
      .collection('webhookDeliveries')
      .where('createdAt', '>', startDate.toISOString())
      .get();
    
    const deliveries = deliveriesSnapshot.docs.map(doc => doc.data());
    
    // Get all active webhooks
    const webhooksSnapshot = await firestore
      .collection('webhooks')
      .where('active', '==', true)
      .get();
    
    const stats = {
      period: `${days} days`,
      activeWebhooks: webhooksSnapshot.size,
      totalDeliveries: deliveries.length,
      successful: deliveries.filter(d => d.status === 'success').length,
      failed: deliveries.filter(d => d.status === 'failed').length,
      averageDuration: 0,
      eventBreakdown: {},
      topWebhooks: []
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
    
    // Top webhooks by delivery count
    const webhookCounts = {};
    deliveries.forEach(d => {
      webhookCounts[d.webhookId] = (webhookCounts[d.webhookId] || 0) + 1;
    });
    
    stats.topWebhooks = Object.entries(webhookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([webhookId, count]) => ({ webhookId, deliveries: count }));
    
    res.json({ stats });
    
  } catch (error) {
    console.error('[Webhooks] Error getting admin stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

export default router;
