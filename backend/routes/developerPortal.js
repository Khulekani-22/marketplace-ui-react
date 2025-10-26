/**
 * Developer Portal Routes
 * 
 * Backend API endpoints for the developer portal.
 * Provides user-scoped access to API keys, usage stats, and webhook management.
 */

import express from 'express';
import admin from 'firebase-admin';
import { firebaseAuthRequired } from '../middleware/auth.js';
import analyticsService from '../services/analyticsService.js';

const router = express.Router();
const db = admin.firestore();

/**
 * GET /api/developer/profile
 * 
 * Get developer profile information
 */
router.get('/profile', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user's API keys count
    const apiKeysSnapshot = await db.collection('apiKeys')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    // Get user's webhooks count
    const webhooksSnapshot = await db.collection('webhooks')
      .where('userId', '==', userId)
      .where('active', '==', true)
      .get();

    // Get total requests across all user's API keys
    let totalRequests = 0;
    for (const doc of apiKeysSnapshot.docs) {
      const keyId = doc.id;
      const consumerDoc = await db.collection('analyticsConsumers').doc(keyId).get();
      if (consumerDoc.exists) {
        totalRequests += consumerDoc.data().totalRequests || 0;
      }
    }

    res.json({
      success: true,
      data: {
        userId,
        email: req.user.email,
        apiKeysCount: apiKeysSnapshot.size,
        webhooksCount: webhooksSnapshot.size,
        totalRequests,
        createdAt: req.user.metadata?.creationTime
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/developer/api-keys
 * 
 * List user's API keys
 */
router.get('/api-keys', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db.collection('apiKeys')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const apiKeys = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get usage stats for this key
      const statsDoc = await db.collection('analyticsConsumers').doc(doc.id).get();
      const stats = statsDoc.exists ? statsDoc.data() : null;

      // Get rate limit info
      const rateLimitDoc = await db.collection('rateLimits').doc(doc.id).get();
      const rateLimit = rateLimitDoc.exists ? rateLimitDoc.data() : null;

      apiKeys.push({
        id: doc.id,
        name: data.name,
        keyPrefix: data.keyPrefix,
        tier: data.tier,
        status: data.status,
        expiresAt: data.expiresAt?.toDate(),
        createdAt: data.createdAt.toDate(),
        lastUsed: stats?.lastRequest?.toDate() || null,
        totalRequests: stats?.totalRequests || 0,
        rateLimit: {
          limit: getRateLimitForTier(data.tier),
          remaining: rateLimit ? (getRateLimitForTier(data.tier) - rateLimit.count) : getRateLimitForTier(data.tier),
          resetAt: rateLimit?.windowStart ? new Date(rateLimit.windowStart.toMillis() + 3600000) : null
        }
      });
    }

    res.json({
      success: true,
      data: apiKeys
    });

  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/developer/api-keys/:id/usage
 * 
 * Get usage statistics for a specific API key
 */
router.get('/api-keys/:id/usage', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const keyId = req.params.id;

    // Verify ownership
    const keyDoc = await db.collection('apiKeys').doc(keyId).get();
    if (!keyDoc.exists || keyDoc.data().userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'API key not found'
      });
    }

    // Get usage stats
    const statsDoc = await db.collection('analyticsConsumers').doc(keyId).get();
    
    if (!statsDoc.exists) {
      return res.json({
        success: true,
        data: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          errorRate: 0,
          avgResponseTime: 0,
          topEndpoints: [],
          recentActivity: []
        }
      });
    }

    const stats = statsDoc.data();

    // Get recent requests (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const recentSnapshot = await db.collection('apiRequests')
      .where('apiKey', '==', keyId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(yesterday))
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const recentActivity = recentSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        timestamp: data.timestamp.toDate(),
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        responseTime: data.responseTime
      };
    });

    // Format top endpoints
    const topEndpoints = Object.entries(stats.endpoints || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    res.json({
      success: true,
      data: {
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        failedRequests: stats.failedRequests,
        errorRate: ((stats.failedRequests / stats.totalRequests) * 100).toFixed(2),
        avgResponseTime: Math.round(stats.avgResponseTime),
        topEndpoints,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Get API key usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/developer/api-keys/:id/timeseries
 * 
 * Get time-series usage data for an API key
 */
router.get('/api-keys/:id/timeseries', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const keyId = req.params.id;
    const period = req.query.period || '24h';

    // Verify ownership
    const keyDoc = await db.collection('apiKeys').doc(keyId).get();
    if (!keyDoc.exists || keyDoc.data().userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'API key not found'
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    // Get hourly data
    const snapshot = await db.collection('apiRequests')
      .where('apiKey', '==', keyId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .orderBy('timestamp', 'asc')
      .get();

    // Group by hour
    const hourlyData = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp.toDate();
      const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
      
      if (!hourlyData.has(hourKey)) {
        hourlyData.set(hourKey, {
          hour: hourKey,
          timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()),
          requests: 0,
          successful: 0,
          failed: 0,
          totalResponseTime: 0
        });
      }
      
      const bucket = hourlyData.get(hourKey);
      bucket.requests++;
      if (data.success) bucket.successful++;
      else bucket.failed++;
      bucket.totalResponseTime += data.responseTime;
    });

    // Convert to array and calculate averages
    const series = Array.from(hourlyData.values()).map(bucket => ({
      timestamp: bucket.timestamp,
      requests: bucket.requests,
      successful: bucket.successful,
      failed: bucket.failed,
      errorRate: ((bucket.failed / bucket.requests) * 100).toFixed(2),
      avgResponseTime: Math.round(bucket.totalResponseTime / bucket.requests)
    }));

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        series
      }
    });

  } catch (error) {
    console.error('Get API key timeseries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/developer/webhooks
 * 
 * List user's webhooks
 */
router.get('/webhooks', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db.collection('webhooks')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const webhooks = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get delivery stats
      const deliveriesSnapshot = await db.collection('webhookDeliveries')
        .where('webhookId', '==', doc.id)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      const lastDelivery = deliveriesSnapshot.empty ? null : {
        timestamp: deliveriesSnapshot.docs[0].data().timestamp.toDate(),
        success: deliveriesSnapshot.docs[0].data().success
      };

      webhooks.push({
        id: doc.id,
        url: data.url,
        events: data.events,
        active: data.active,
        createdAt: data.createdAt.toDate(),
        lastDelivery
      });
    }

    res.json({
      success: true,
      data: webhooks
    });

  } catch (error) {
    console.error('List webhooks error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/developer/webhooks/:id/deliveries
 * 
 * Get delivery history for a webhook
 */
router.get('/webhooks/:id/deliveries', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const webhookId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;

    // Verify ownership
    const webhookDoc = await db.collection('webhooks').doc(webhookId).get();
    if (!webhookDoc.exists || webhookDoc.data().userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Webhook not found'
      });
    }

    // Get deliveries
    const snapshot = await db.collection('webhookDeliveries')
      .where('webhookId', '==', webhookId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const deliveries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        event: data.event,
        success: data.success,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        attempt: data.attempt,
        error: data.error,
        timestamp: data.timestamp.toDate()
      };
    });

    res.json({
      success: true,
      data: deliveries
    });

  } catch (error) {
    console.error('Get webhook deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/developer/usage-summary
 * 
 * Get overall usage summary for the user
 */
router.get('/usage-summary', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const period = req.query.period || '30d';

    // Get user's API keys
    const apiKeysSnapshot = await db.collection('apiKeys')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    const keyIds = apiKeysSnapshot.docs.map(doc => doc.id);

    if (keyIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          errorRate: 0,
          avgResponseTime: 0,
          topEndpoints: [],
          requestsByKey: []
        }
      });
    }

    // Aggregate stats across all keys
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalResponseTime = 0;
    const endpointCounts = {};
    const requestsByKey = [];

    for (const keyId of keyIds) {
      const statsDoc = await db.collection('analyticsConsumers').doc(keyId).get();
      if (statsDoc.exists) {
        const stats = statsDoc.data();
        const keyDoc = await db.collection('apiKeys').doc(keyId).get();
        const keyData = keyDoc.data();

        totalRequests += stats.totalRequests || 0;
        successfulRequests += stats.successfulRequests || 0;
        failedRequests += stats.failedRequests || 0;
        totalResponseTime += stats.totalResponseTime || 0;

        // Aggregate endpoints
        Object.entries(stats.endpoints || {}).forEach(([endpoint, count]) => {
          endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + count;
        });

        requestsByKey.push({
          keyId,
          keyName: keyData.name,
          requests: stats.totalRequests || 0
        });
      }
    }

    // Top endpoints
    const topEndpoints = Object.entries(endpointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    res.json({
      success: true,
      data: {
        totalRequests,
        successfulRequests,
        failedRequests,
        errorRate: totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(2) : 0,
        avgResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
        topEndpoints,
        requestsByKey: requestsByKey.sort((a, b) => b.requests - a.requests)
      }
    });

  } catch (error) {
    console.error('Get usage summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/developer/documentation
 * 
 * Get API documentation endpoints list
 */
router.get('/documentation', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        openapi: '/openapi.yaml',
        postman: '/postman_collection.json',
        guides: [
          { title: 'Quick Start', path: '/docs/quick-start' },
          { title: 'Authentication', path: '/docs/authentication' },
          { title: 'Rate Limiting', path: '/docs/rate-limiting' },
          { title: 'Webhooks', path: '/docs/webhooks' },
          { title: 'Versioning', path: '/docs/versioning' },
          { title: 'SDKs', path: '/docs/sdks' }
        ],
        sdks: [
          {
            language: 'JavaScript/TypeScript',
            package: '@marketplace/sdk',
            install: 'npm install @marketplace/sdk',
            docs: '/sdks/javascript/README.md'
          },
          {
            language: 'PHP',
            package: 'marketplace/sdk',
            install: 'composer require marketplace/sdk',
            docs: '/sdks/php/README.md'
          }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Helper functions

function getRateLimitForTier(tier) {
  const limits = {
    free: 100,
    standard: 1000,
    premium: 10000
  };
  return limits[tier] || limits.free;
}

export default router;
