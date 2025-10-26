// backend/middleware/redisRateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient, isRedisHealthy } from '../services/cacheService.js';

/**
 * Rate limit tiers configuration
 */
const RATE_LIMIT_TIERS = {
  free: {
    requests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    label: 'Free Tier',
  },
  standard: {
    requests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    label: 'Standard Tier',
  },
  premium: {
    requests: 10000,
    windowMs: 60 * 60 * 1000, // 1 hour
    label: 'Premium Tier',
  },
};

/**
 * Create Redis-based rate limiter
 * Falls back to in-memory if Redis unavailable
 */
export function createRedisRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests, please try again later.',
    standardHeaders = true, // Return rate limit info in headers
    legacyHeaders = false, // Disable X-RateLimit-* headers
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = null, // Custom key generator
  } = options;

  const redisClient = getRedisClient();
  const useRedis = isRedisHealthy() && redisClient;

  const config = {
    windowMs,
    max,
    message: { error: message },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: keyGenerator || ((req) => {
      // Use API key if available, otherwise IP
      return req.apiKeyId || req.ip;
    }),
    handler: (req, res) => {
      const retryAfter = Math.ceil(windowMs / 1000);
      res.status(429).json({
        error: message,
        retryAfter,
        limit: max,
        window: `${windowMs / 1000}s`,
      });
    },
  };

  // Use Redis store if available
  if (useRedis) {
    config.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:', // Rate limit prefix
      sendCommand: (...args) => redisClient.call(...args),
    });
    console.log('[Rate Limiter] Using Redis store for distributed rate limiting');
  } else {
    console.warn('[Rate Limiter] Redis unavailable, using in-memory store');
  }

  return rateLimit(config);
}

/**
 * API Key rate limiter with tiered limits
 * Checks API key tier and applies appropriate rate limit
 */
export function apiKeyRateLimiter() {
  return async (req, res, next) => {
    // Skip if no API key
    if (!req.apiKey || !req.apiKeyId) {
      return next();
    }

    const tier = req.apiKey.rateLimit || 'free';
    const config = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.free;

    const limiter = createRedisRateLimiter({
      windowMs: config.windowMs,
      max: config.requests,
      message: `${config.label} rate limit exceeded. Limit: ${config.requests} requests per hour.`,
      keyGenerator: () => `apikey:${req.apiKeyId}`,
    });

    return limiter(req, res, next);
  };
}

/**
 * General rate limiter for all requests
 * Protects against DDoS
 */
export function generalRateLimiter() {
  return createRedisRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later.',
    keyGenerator: (req) => req.ip,
  });
}

/**
 * Strict rate limiter for sensitive endpoints
 * E.g., authentication, password reset
 */
export function strictRateLimiter() {
  return createRedisRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    message: 'Too many attempts, please try again later.',
    skipSuccessfulRequests: true, // Only count failed requests
  });
}

/**
 * OAuth rate limiter
 * Prevents token abuse
 */
export function oauthRateLimiter() {
  return createRedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'OAuth rate limit exceeded. Please slow down.',
    keyGenerator: (req) => {
      // Rate limit by client ID
      return req.body?.client_id || req.query?.client_id || req.ip;
    },
  });
}

/**
 * GraphQL rate limiter
 * Prevents expensive query abuse
 */
export function graphqlRateLimiter() {
  return createRedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 queries per minute
    message: 'GraphQL rate limit exceeded. Please reduce query complexity.',
    keyGenerator: (req) => {
      // Rate limit by user if authenticated, otherwise IP
      return req.user?.uid || req.ip;
    },
  });
}

/**
 * Webhook rate limiter
 * Prevents webhook spam
 */
export function webhookRateLimiter() {
  return createRedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 webhooks per minute
    message: 'Webhook rate limit exceeded.',
    keyGenerator: (req) => `webhook:${req.apiKeyId || req.ip}`,
  });
}

/**
 * Admin bypass middleware
 * Admins are not rate limited
 */
export function adminBypass() {
  return (req, res, next) => {
    // Check if user is admin
    if (req.user?.role === 'admin' || req.user?.isAdmin) {
      // Skip rate limiting for admins
      return next();
    }
    next();
  };
}

export default {
  createRedisRateLimiter,
  apiKeyRateLimiter,
  generalRateLimiter,
  strictRateLimiter,
  oauthRateLimiter,
  graphqlRateLimiter,
  webhookRateLimiter,
  adminBypass,
};
