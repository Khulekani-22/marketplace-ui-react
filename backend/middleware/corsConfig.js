/**
 * Enhanced CORS Configuration Middleware
 * 
 * Features:
 * - Dynamic origin validation with whitelist
 * - External app registration system
 * - Request origin tracking
 * - Security headers (HSTS, CSP, X-Frame-Options, etc.)
 * - Preflight request handling
 * - Credential support configuration
 */

import { firestore } from '../config/firestore.js';

/**
 * Default allowed origins for local development
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Cache for allowed origins to reduce Firestore reads
 */
let allowedOriginsCache = [...DEFAULT_ALLOWED_ORIGINS];
let cacheLastUpdated = Date.now();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Refresh allowed origins from Firestore
 */
async function refreshAllowedOrigins() {
  try {
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - cacheLastUpdated < CACHE_TTL) {
      return allowedOriginsCache;
    }

    const externalAppsRef = firestore.collection('externalApps');
    const snapshot = await externalAppsRef
      .where('active', '==', true)
      .where('corsEnabled', '==', true)
      .get();

    const registeredOrigins = snapshot.docs.map(doc => {
      const data = doc.data();
      return data.allowedOrigins || [];
    }).flat();

    // Combine default and registered origins
    allowedOriginsCache = [...new Set([
      ...DEFAULT_ALLOWED_ORIGINS,
      ...registeredOrigins
    ])];

    cacheLastUpdated = now;
    
    console.log(`[CORS] Refreshed allowed origins cache: ${allowedOriginsCache.length} origins`);
    return allowedOriginsCache;
  } catch (error) {
    console.error('[CORS] Error refreshing allowed origins:', error);
    // Return cached origins on error
    return allowedOriginsCache;
  }
}

/**
 * Check if origin is allowed
 */
async function isOriginAllowed(origin) {
  if (!origin) return false;

  const allowedOrigins = await refreshAllowedOrigins();

  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check wildcard patterns (e.g., *.example.com)
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Track origin requests for analytics
 */
async function trackOriginRequest(origin, req) {
  try {
    if (!origin) return;

    const trackingRef = firestore.collection('originTracking').doc(origin);
    const doc = await trackingRef.get();

    if (doc.exists) {
      // Update existing tracking
      await trackingRef.update({
        lastSeen: new Date().toISOString(),
        requestCount: (doc.data().requestCount || 0) + 1,
        lastEndpoint: req.path,
        lastMethod: req.method,
        lastUserAgent: req.get('user-agent') || 'unknown',
      });
    } else {
      // Create new tracking entry
      await trackingRef.set({
        origin,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        requestCount: 1,
        lastEndpoint: req.path,
        lastMethod: req.method,
        lastUserAgent: req.get('user-agent') || 'unknown',
        blocked: false,
      });
    }
  } catch (error) {
    // Don't throw - tracking is non-critical
    console.error('[CORS] Error tracking origin:', error);
  }
}

/**
 * Dynamic CORS middleware
 */
export function dynamicCors() {
  return async (req, res, next) => {
    const origin = req.get('origin');

    // Track the request origin (async, don't wait)
    if (origin && process.env.NODE_ENV !== 'test') {
      trackOriginRequest(origin, req).catch(err => {
        console.error('[CORS] Tracking error:', err);
      });
    }

    // Check if origin is allowed
    if (origin) {
      const allowed = await isOriginAllowed(origin);
      
      if (allowed) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      } else {
        console.warn(`[CORS] Blocked origin: ${origin} for ${req.method} ${req.path}`);
        // Still set basic CORS headers but don't allow credentials
        res.header('Access-Control-Allow-Origin', 'null');
      }
    } else {
      // No origin header (likely same-origin request or server-to-server)
      res.header('Access-Control-Allow-Origin', '*');
    }

    // CORS headers
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, X-Tenant-ID, X-Firebase-AppCheck'
    );
    res.header('Access-Control-Expose-Headers', 
      'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Total-Count, X-Page, X-Page-Size'
    );
    res.header('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return (req, res, next) => {
    // HSTS - Force HTTPS
    if (process.env.NODE_ENV === 'production') {
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Content Security Policy
    res.header('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.cloudfunctions.net; " +
      "frame-ancestors 'none';"
    );

    // Prevent clickjacking
    res.header('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.header('X-Content-Type-Options', 'nosniff');

    // XSS Protection (legacy but still useful)
    res.header('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (formerly Feature Policy)
    res.header('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    // Remove X-Powered-By header to hide tech stack
    res.removeHeader('X-Powered-By');

    next();
  };
}

/**
 * API Response headers middleware
 */
export function apiResponseHeaders() {
  return (req, res, next) => {
    // API version
    res.header('X-API-Version', 'v1');

    // Server timestamp
    res.header('X-Server-Time', new Date().toISOString());

    // Request ID (if available)
    if (req.id) {
      res.header('X-Request-ID', req.id);
    }

    next();
  };
}

/**
 * Cache allowed origins on startup
 */
export async function initializeCors() {
  console.log('[CORS] Initializing CORS configuration...');
  await refreshAllowedOrigins();
  console.log(`[CORS] Loaded ${allowedOriginsCache.length} allowed origins`);
}

/**
 * Manual cache refresh endpoint (admin only)
 */
export async function refreshCorsCache() {
  allowedOriginsCache = [...DEFAULT_ALLOWED_ORIGINS];
  cacheLastUpdated = 0; // Force refresh
  await refreshAllowedOrigins();
  return {
    status: 'success',
    originsCount: allowedOriginsCache.length,
    origins: allowedOriginsCache
  };
}

export default {
  dynamicCors,
  securityHeaders,
  apiResponseHeaders,
  initializeCors,
  refreshCorsCache,
};
