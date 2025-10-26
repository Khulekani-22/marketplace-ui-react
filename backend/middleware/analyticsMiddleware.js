/**
 * Analytics Middleware
 * 
 * Tracks API requests and sends metrics to analytics service.
 * Should be applied early in middleware chain (after security, before routes).
 */

import analyticsService from '../services/analyticsService.js';

/**
 * Analytics tracking middleware
 * 
 * Captures request details and response metrics.
 * Non-blocking - analytics failures don't affect API responses.
 */
export function analyticsMiddleware(req, res, next) {
  // Skip analytics endpoints themselves to avoid recursion
  if (req.path.startsWith('/api/analytics')) {
    return next();
  }

  // Skip health checks to reduce noise
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;
  const originalJson = res.json;

  // Track if response has been sent
  let responseSent = false;

  // Override res.json to capture response
  res.json = function(data) {
    if (!responseSent) {
      responseSent = true;
      captureMetrics(req, res, startTime, null);
    }
    return originalJson.call(this, data);
  };

  // Override res.end to capture response
  res.end = function(chunk, encoding) {
    if (!responseSent) {
      responseSent = true;
      captureMetrics(req, res, startTime, null);
    }
    return originalEnd.call(this, chunk, encoding);
  };

  // Capture errors
  const originalError = res.error;
  res.error = function(error) {
    if (!responseSent) {
      responseSent = true;
      captureMetrics(req, res, startTime, error);
    }
    if (originalError) {
      return originalError.call(this, error);
    }
  };

  next();
}

/**
 * Capture and record metrics
 */
async function captureMetrics(req, res, startTime, error) {
  try {
    const responseTime = Date.now() - startTime;

    // Extract API key from various sources
    let apiKey = null;
    if (req.apiKey) {
      apiKey = req.apiKey.id;
    } else if (req.headers['x-api-key']) {
      // Extract key ID from header (format: ak_xxx_yyy)
      const keyHeader = req.headers['x-api-key'];
      apiKey = keyHeader; // Store full key for now
    }

    // Extract user ID
    let userId = null;
    if (req.user) {
      userId = req.user.uid || req.user.id;
    }

    // Get tenant ID
    const tenantId = req.tenantId || 'public';

    // Get API version
    const version = req.apiVersion || 'v1';

    // Get client info
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const origin = req.headers['origin'] || req.headers['referer'];

    // Normalize endpoint path (remove IDs)
    const endpoint = normalizeEndpoint(req.path);

    // Build analytics data
    const analyticsData = {
      endpoint,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      apiKey,
      userId,
      tenantId,
      version,
      ipAddress,
      userAgent,
      origin
    };

    // Add error details if present
    if (error) {
      analyticsData.error = {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    // Record asynchronously (don't await - fire and forget)
    analyticsService.recordRequest(analyticsData).catch(err => {
      console.error('Analytics recording failed:', err);
    });

  } catch (err) {
    // Silently fail - analytics shouldn't break the API
    console.error('Analytics middleware error:', err);
  }
}

/**
 * Get client IP address
 */
function getClientIp(req) {
  // Check various headers for real IP (proxy/load balancer scenarios)
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Normalize endpoint path
 * Removes IDs and other variable segments for better aggregation
 * 
 * Examples:
 * /api/services/123 -> /api/services/:id
 * /api/vendors/abc-def-123/listings -> /api/vendors/:id/listings
 */
function normalizeEndpoint(path) {
  return path
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Replace alphanumeric IDs (like ak_live_abc123)
    .replace(/\/(ak|sk|wh|usr|vnd|srv)_[a-z0-9_]+/gi, '/:id')
    // Replace long alphanumeric segments (likely IDs)
    .replace(/\/[a-zA-Z0-9]{16,}/g, '/:id')
    // Remove query parameters
    .split('?')[0]
    // Remove trailing slash
    .replace(/\/$/, '');
}

/**
 * Express error handler for analytics
 * Should be placed after all routes
 */
export function analyticsErrorHandler(err, req, res, next) {
  // Record error in analytics
  const startTime = req._analyticsStartTime || Date.now();
  captureMetrics(req, res, startTime, err).catch(console.error);
  
  // Pass to next error handler
  next(err);
}

export default {
  analyticsMiddleware,
  analyticsErrorHandler
};
