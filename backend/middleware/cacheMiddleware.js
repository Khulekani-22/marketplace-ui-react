// backend/middleware/cacheMiddleware.js
import { getCache, setCache, buildCacheKey, isRedisHealthy } from '../services/cacheService.js';

/**
 * Cache middleware for GET requests
 * Caches response based on URL and query parameters
 */
export function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'route',
    includeQuery = true,
    includeUser = false,
    skip = null, // Function to determine if request should skip cache
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if Redis is not healthy
    if (!isRedisHealthy()) {
      return next();
    }

    // Check if request should skip cache
    if (skip && skip(req)) {
      return next();
    }

    // Build cache key
    const keyParts = [req.path];
    
    if (includeQuery && Object.keys(req.query).length > 0) {
      const queryString = JSON.stringify(req.query);
      keyParts.push(queryString);
    }

    if (includeUser && req.user?.uid) {
      keyParts.push(req.user.uid);
    }

    const cacheKey = buildCacheKey(keyPrefix, ...keyParts);

    try {
      // Try to get from cache
      const cachedResponse = await getCache(cacheKey);

      if (cachedResponse) {
        console.log(`[Cache] HIT: ${cacheKey}`);
        
        // Add cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        return res.json(cachedResponse);
      }

      console.log(`[Cache] MISS: ${cacheKey}`);

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, ttl).catch(err => {
            console.error(`Failed to cache response for ${cacheKey}:`, err);
          });
        }

        // Add cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('[Cache] Middleware error:', error);
      next();
    }
  };
}

/**
 * Cache middleware for specific routes
 * More granular control over caching
 */
export function cacheRoute(ttl = 300, options = {}) {
  return cacheMiddleware({ ttl, ...options });
}

/**
 * No-cache middleware
 * Forces responses to not be cached
 */
export function noCache() {
  return (req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    });
    next();
  };
}

/**
 * Cache control middleware
 * Sets cache control headers for CDN/browser caching
 */
export function cacheControl(maxAge = 300, options = {}) {
  const {
    sMaxAge = null, // Shared cache (CDN) max age
    mustRevalidate = false,
    public: isPublic = true,
    immutable = false,
  } = options;

  return (req, res, next) => {
    const directives = [];

    if (isPublic) {
      directives.push('public');
    } else {
      directives.push('private');
    }

    directives.push(`max-age=${maxAge}`);

    if (sMaxAge !== null) {
      directives.push(`s-maxage=${sMaxAge}`);
    }

    if (mustRevalidate) {
      directives.push('must-revalidate');
    }

    if (immutable) {
      directives.push('immutable');
    }

    res.set('Cache-Control', directives.join(', '));
    next();
  };
}

/**
 * Cache warming utility
 * Pre-populate cache with frequently accessed data
 */
export async function warmCache(routes, baseUrl = 'http://localhost:5055') {
  console.log(`[Cache] Warming cache for ${routes.length} routes...`);

  const results = await Promise.allSettled(
    routes.map(async route => {
      try {
        const response = await fetch(`${baseUrl}${route}`);
        if (response.ok) {
          console.log(`[Cache] Warmed: ${route}`);
          return { route, success: true };
        }
        return { route, success: false, error: response.statusText };
      } catch (error) {
        console.error(`[Cache] Failed to warm ${route}:`, error.message);
        return { route, success: false, error: error.message };
      }
    })
  );

  const successful = results.filter(r => r.value?.success).length;
  console.log(`[Cache] Warming complete: ${successful}/${routes.length} successful`);

  return results;
}

export default {
  cacheMiddleware,
  cacheRoute,
  noCache,
  cacheControl,
  warmCache,
};
