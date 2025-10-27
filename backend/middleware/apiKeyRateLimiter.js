/**
 * API Key Rate Limiting Middleware
 * 
 * Implements tiered rate limiting based on API key subscription level:
 * - Free: 100 requests/hour
 * - Standard: 1,000 requests/hour  
 * - Premium: 10,000 requests/hour
 * 
 * Features:
 * - Per-API-key tracking in Firestore
 * - Sliding window algorithm
 * - X-RateLimit-* headers
 * - Automatic cleanup of old entries
 * - Bypass for admin users
 */

import { firestore } from '../services/firestore.js';

/**
 * Rate limit tiers configuration
 */
const RATE_LIMIT_TIERS = {
  free: {
    requests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    label: 'Free Tier'
  },
  standard: {
    requests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    label: 'Standard Tier'
  },
  premium: {
    requests: 10000,
    windowMs: 60 * 60 * 1000, // 1 hour
    label: 'Premium Tier'
  }
};

/**
 * Get rate limit configuration for API key
 */
async function getRateLimitConfig(apiKeyId) {
  try {
    const apiKeyDoc = await firestore.collection('apiKeys').doc(apiKeyId).get();
    
    if (!apiKeyDoc.exists) {
      return RATE_LIMIT_TIERS.free; // Default to free tier
    }

    const apiKeyData = apiKeyDoc.data();
    const tier = apiKeyData.rateLimit || 'free';
    
    return RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.free;
  } catch (error) {
    console.error('[Rate Limiter] Error getting rate limit config:', error);
    return RATE_LIMIT_TIERS.free;
  }
}

/**
 * Record a request in Firestore
 */
async function recordRequest(apiKeyId, timestamp) {
  try {
    const requestRef = firestore
      .collection('apiKeyRateLimits')
      .doc(apiKeyId)
      .collection('requests')
      .doc(timestamp.toString());

    await requestRef.set({
      timestamp,
      createdAt: new Date(timestamp).toISOString()
    });

    // Update last request time on API key
    await firestore.collection('apiKeys').doc(apiKeyId).update({
      lastUsedAt: new Date().toISOString(),
      usageCount: firestore.FieldValue.increment(1)
    });

  } catch (error) {
    console.error('[Rate Limiter] Error recording request:', error);
    // Don't throw - recording failure shouldn't block request
  }
}

/**
 * Get request count in time window
 */
async function getRequestCount(apiKeyId, windowMs) {
  try {
    const now = Date.now();
    const windowStart = now - windowMs;

    const requestsSnapshot = await firestore
      .collection('apiKeyRateLimits')
      .doc(apiKeyId)
      .collection('requests')
      .where('timestamp', '>', windowStart)
      .get();

    return requestsSnapshot.size;
  } catch (error) {
    console.error('[Rate Limiter] Error getting request count:', error);
    return 0; // Fail open
  }
}

/**
 * Clean up old request records
 */
async function cleanupOldRequests(apiKeyId, windowMs) {
  try {
    const now = Date.now();
    const cutoff = now - (windowMs * 2); // Keep 2x window for safety

    const oldRequestsSnapshot = await firestore
      .collection('apiKeyRateLimits')
      .doc(apiKeyId)
      .collection('requests')
      .where('timestamp', '<', cutoff)
      .limit(100)
      .get();

    if (oldRequestsSnapshot.empty) return;

    const batch = firestore.batch();
    oldRequestsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`[Rate Limiter] Cleaned up ${oldRequestsSnapshot.size} old requests for key ${apiKeyId}`);
  } catch (error) {
    console.error('[Rate Limiter] Error cleaning up old requests:', error);
  }
}

/**
 * Calculate reset time
 */
function calculateResetTime(windowMs) {
  const now = Date.now();
  const resetTime = now + windowMs;
  return Math.ceil(resetTime / 1000); // Unix timestamp in seconds
}

/**
 * API Key Rate Limiter Middleware
 */
export function apiKeyRateLimiter() {
  return async (req, res, next) => {
    try {
      // Skip if no API key (will be handled by auth middleware)
      if (!req.apiKey) {
        return next();
      }

      // Skip for admin users
      if (req.user?.admin) {
        return next();
      }

      const apiKeyId = req.apiKey.id;
      const config = await getRateLimitConfig(apiKeyId);
      
      // Get current request count
      const requestCount = await getRequestCount(apiKeyId, config.windowMs);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.requests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.requests - requestCount));
      res.setHeader('X-RateLimit-Reset', calculateResetTime(config.windowMs));
      res.setHeader('X-RateLimit-Tier', config.label);

      // Check if limit exceeded
      if (requestCount >= config.requests) {
        const resetTime = calculateResetTime(config.windowMs);
        const retryAfter = Math.ceil((resetTime * 1000 - Date.now()) / 1000);

        res.setHeader('Retry-After', retryAfter);

        return res.status(429).json({
          status: 'error',
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. You have made ${requestCount} requests in the last hour.`,
          details: {
            tier: config.label,
            limit: config.requests,
            windowMs: config.windowMs,
            resetAt: new Date(resetTime * 1000).toISOString(),
            retryAfter
          },
          upgrade: requestCount >= config.requests && config.label === 'Free Tier' 
            ? 'Consider upgrading to Standard tier (1,000 req/hour) or Premium tier (10,000 req/hour)'
            : undefined
        });
      }

      // Record this request
      const now = Date.now();
      await recordRequest(apiKeyId, now);

      // Cleanup old requests asynchronously (don't wait)
      cleanupOldRequests(apiKeyId, config.windowMs).catch(err => {
        console.error('[Rate Limiter] Cleanup error:', err);
      });

      next();
    } catch (error) {
      console.error('[Rate Limiter] Middleware error:', error);
      // Fail open - don't block request on rate limiter errors
      next();
    }
  };
}

/**
 * Get rate limit status for an API key
 */
export async function getRateLimitStatus(apiKeyId) {
  try {
    const config = await getRateLimitConfig(apiKeyId);
    const requestCount = await getRequestCount(apiKeyId, config.windowMs);
    const remaining = Math.max(0, config.requests - requestCount);
    const resetTime = calculateResetTime(config.windowMs);

    return {
      tier: config.label,
      limit: config.requests,
      used: requestCount,
      remaining,
      resetAt: new Date(resetTime * 1000).toISOString(),
      percentage: Math.round((requestCount / config.requests) * 100)
    };
  } catch (error) {
    console.error('[Rate Limiter] Error getting status:', error);
    throw error;
  }
}

/**
 * Reset rate limit for an API key (admin only)
 */
export async function resetRateLimit(apiKeyId) {
  try {
    const requestsSnapshot = await firestore
      .collection('apiKeyRateLimits')
      .doc(apiKeyId)
      .collection('requests')
      .get();

    if (requestsSnapshot.empty) {
      return { deleted: 0 };
    }

    const batch = firestore.batch();
    requestsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return {
      deleted: requestsSnapshot.size,
      message: `Reset rate limit for API key ${apiKeyId}`
    };
  } catch (error) {
    console.error('[Rate Limiter] Error resetting rate limit:', error);
    throw error;
  }
}

/**
 * Get rate limit statistics (admin only)
 */
export async function getRateLimitStats() {
  try {
    // Get all API keys
    const apiKeysSnapshot = await firestore.collection('apiKeys')
      .where('active', '==', true)
      .get();

    const stats = {
      totalKeys: apiKeysSnapshot.size,
      byTier: {
        free: 0,
        standard: 0,
        premium: 0
      },
      usage: []
    };

    // Analyze each key
    for (const doc of apiKeysSnapshot.docs) {
      const data = doc.data();
      const tier = data.rateLimit || 'free';
      stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;

      try {
        const status = await getRateLimitStatus(doc.id);
        stats.usage.push({
          keyId: doc.id,
          appName: data.appName,
          tier,
          ...status
        });
      } catch (error) {
        console.warn(`Failed to get status for key ${doc.id}:`, error);
      }
    }

    // Sort by usage percentage (highest first)
    stats.usage.sort((a, b) => b.percentage - a.percentage);

    // Add summary
    stats.summary = {
      heavyUsers: stats.usage.filter(u => u.percentage > 80).length,
      mediumUsers: stats.usage.filter(u => u.percentage > 50 && u.percentage <= 80).length,
      lightUsers: stats.usage.filter(u => u.percentage <= 50).length
    };

    return stats;
  } catch (error) {
    console.error('[Rate Limiter] Error getting stats:', error);
    throw error;
  }
}

/**
 * Middleware to check if approaching rate limit (80%)
 */
export function rateLimitWarning() {
  return async (req, res, next) => {
    try {
      if (!req.apiKey) {
        return next();
      }

      const apiKeyId = req.apiKey.id;
      const config = await getRateLimitConfig(apiKeyId);
      const requestCount = await getRequestCount(apiKeyId, config.windowMs);
      const percentage = (requestCount / config.requests) * 100;

      // Add warning header if over 80%
      if (percentage >= 80) {
        res.setHeader('X-RateLimit-Warning', 
          `You have used ${Math.round(percentage)}% of your rate limit. Consider upgrading your tier.`
        );
      }

      next();
    } catch (error) {
      console.error('[Rate Limiter] Warning middleware error:', error);
      next();
    }
  };
}

export default {
  apiKeyRateLimiter,
  getRateLimitStatus,
  resetRateLimit,
  getRateLimitStats,
  rateLimitWarning,
  RATE_LIMIT_TIERS
};
