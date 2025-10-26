// backend/services/cacheService.js
import Redis from 'ioredis';

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Create Redis client
let redisClient = null;
let isRedisAvailable = false;

export function initializeRedis() {
  try {
    redisClient = new Redis(REDIS_CONFIG);

    redisClient.on('connect', () => {
      console.log('✓ Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.error('✗ Redis connection error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      console.warn('⚠ Redis connection closed');
      isRedisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    isRedisAvailable = false;
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}

export function isRedisHealthy() {
  return isRedisAvailable && redisClient && redisClient.status === 'ready';
}

// Cache key builder
export function buildCacheKey(prefix, ...parts) {
  return `${prefix}:${parts.join(':')}`;
}

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
export async function getCache(key) {
  if (!isRedisHealthy()) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (!value) return null;

    // Try to parse JSON, return raw string if fails
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error(`Cache GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} Success status
 */
export async function setCache(key, value, ttl = 300) {
  if (!isRedisHealthy()) {
    return false;
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`Cache SET error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete key from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCache(key) {
  if (!isRedisHealthy()) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Cache DEL error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete keys matching pattern
 * @param {string} pattern - Key pattern (e.g., "user:*")
 * @returns {Promise<number>} Number of keys deleted
 */
export async function deleteCachePattern(pattern) {
  if (!isRedisHealthy()) {
    return 0;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;

    await redisClient.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`Cache DEL pattern error for ${pattern}:`, error);
    return 0;
  }
}

/**
 * Check if key exists
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Exists status
 */
export async function existsCache(key) {
  if (!isRedisHealthy()) {
    return false;
  }

  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`Cache EXISTS error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get time to live for key
 * @param {string} key - Cache key
 * @returns {Promise<number>} TTL in seconds, -1 if no expiry, -2 if not exists
 */
export async function getTTL(key) {
  if (!isRedisHealthy()) {
    return -2;
  }

  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.error(`Cache TTL error for key ${key}:`, error);
    return -2;
  }
}

/**
 * Increment counter
 * @param {string} key - Counter key
 * @param {number} amount - Amount to increment (default: 1)
 * @returns {Promise<number>} New value
 */
export async function incrementCounter(key, amount = 1) {
  if (!isRedisHealthy()) {
    return 0;
  }

  try {
    return await redisClient.incrby(key, amount);
  } catch (error) {
    console.error(`Cache INCR error for key ${key}:`, error);
    return 0;
  }
}

/**
 * Get multiple keys at once
 * @param {string[]} keys - Array of cache keys
 * @returns {Promise<any[]>} Array of values
 */
export async function multiGet(keys) {
  if (!isRedisHealthy() || keys.length === 0) {
    return keys.map(() => null);
  }

  try {
    const values = await redisClient.mget(...keys);
    return values.map(value => {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    });
  } catch (error) {
    console.error('Cache MGET error:', error);
    return keys.map(() => null);
  }
}

/**
 * Set multiple keys at once
 * @param {Object} keyValuePairs - Object with key-value pairs
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function multiSet(keyValuePairs, ttl = 300) {
  if (!isRedisHealthy()) {
    return false;
  }

  try {
    const pipeline = redisClient.pipeline();
    
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      pipeline.setex(key, ttl, serialized);
    });

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('Cache MSET error:', error);
    return false;
  }
}

// ============================================
// HIGH-LEVEL CACHE WRAPPERS
// ============================================

/**
 * Cache wrapper for functions
 * @param {string} key - Cache key
 * @param {Function} fn - Function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fresh value
 */
export async function cacheWrapper(key, fn, ttl = 300) {
  // Try cache first
  const cached = await getCache(key);
  if (cached !== null) {
    console.log(`Cache HIT: ${key}`);
    return cached;
  }

  console.log(`Cache MISS: ${key}`);
  
  // Execute function and cache result
  const result = await fn();
  await setCache(key, result, ttl);
  
  return result;
}

/**
 * Invalidate cache for a resource
 * @param {string} resource - Resource type (e.g., 'service', 'vendor')
 * @param {string} id - Resource ID
 * @returns {Promise<number>} Number of keys deleted
 */
export async function invalidateResource(resource, id) {
  const patterns = [
    `${resource}:${id}`,
    `${resource}:${id}:*`,
    `list:${resource}*`,
    `query:${resource}*`,
  ];

  let totalDeleted = 0;
  for (const pattern of patterns) {
    const deleted = await deleteCachePattern(pattern);
    totalDeleted += deleted;
  }

  console.log(`Invalidated ${totalDeleted} cache keys for ${resource}:${id}`);
  return totalDeleted;
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStats() {
  if (!isRedisHealthy()) {
    return {
      healthy: false,
      keys: 0,
      memory: '0B',
      hits: 0,
      misses: 0,
      hitRate: '0%',
    };
  }

  try {
    const info = await redisClient.info('stats');
    const dbsize = await redisClient.dbsize();
    
    // Parse info string
    const stats = {};
    info.split('\r\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key] = value;
      }
    });

    const hits = parseInt(stats.keyspace_hits || 0);
    const misses = parseInt(stats.keyspace_misses || 0);
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0';

    return {
      healthy: true,
      keys: dbsize,
      memory: stats.used_memory_human || '0B',
      hits,
      misses,
      hitRate: `${hitRate}%`,
      connections: parseInt(stats.connected_clients || 0),
      uptime: parseInt(stats.uptime_in_seconds || 0),
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      healthy: false,
      error: error.message,
    };
  }
}

/**
 * Flush all cache (use with caution!)
 * @returns {Promise<boolean>} Success status
 */
export async function flushCache() {
  if (!isRedisHealthy()) {
    return false;
  }

  try {
    await redisClient.flushdb();
    console.log('✓ Cache flushed successfully');
    return true;
  } catch (error) {
    console.error('Failed to flush cache:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✓ Redis connection closed gracefully');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

// Handle process termination
process.on('SIGTERM', closeRedis);
process.on('SIGINT', closeRedis);

export default {
  initializeRedis,
  getRedisClient,
  isRedisHealthy,
  buildCacheKey,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  existsCache,
  getTTL,
  incrementCounter,
  multiGet,
  multiSet,
  cacheWrapper,
  invalidateResource,
  getCacheStats,
  flushCache,
  closeRedis,
};
