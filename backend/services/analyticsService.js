/**
 * Analytics Service
 * 
 * Collects and aggregates API usage metrics for monitoring and reporting.
 * Tracks request volume, response times, error rates, and consumer patterns.
 */

import crypto from 'crypto';
import admin from 'firebase-admin';

const db = admin.firestore();

const minMaxCache = new Map();
const MAX_MINMAX_RETRY = 3;

function getCacheEntry(path) {
  return minMaxCache.get(path);
}

function setCacheEntry(path, min, max) {
  minMaxCache.set(path, {
    min,
    max,
  });
}

function needsExtremeUpdate(cacheEntry, value) {
  if (!cacheEntry) return true;
  const { min, max } = cacheEntry;
  if (typeof min !== 'number' || typeof max !== 'number') {
    return true;
  }
  return value < min || value > max;
}

function isAlreadyExistsError(error) {
  const code = error?.code;
  return code === 6 || code === '6' || error?.message?.toLowerCase().includes('already exists');
}

function isConcurrencyError(error) {
  const code = error?.code;
  if (!code && !error?.message) return false;
  const message = (error?.message || '').toLowerCase();
  return (
    code === 9 ||
    code === '9' ||
    code === 10 ||
    code === '10' ||
    code === 409 ||
    message.includes('transaction') && message.includes('conflict') ||
    message.includes('transaction has expired') ||
    message.includes('aborted') ||
    message.includes('failed precondition')
  );
}

async function updateMinMaxIfNeeded(docRef, value, {
  cacheKey = docRef.path,
  skipCacheUpdate = false,
  minField = 'minResponseTime',
  maxField = 'maxResponseTime',
} = {}) {
  if (skipCacheUpdate) {
    setCacheEntry(cacheKey, value, value);
    return;
  }

  const cacheEntry = getCacheEntry(cacheKey);
  if (!needsExtremeUpdate(cacheEntry, value)) {
    return;
  }

  for (let attempt = 0; attempt < MAX_MINMAX_RETRY; attempt += 1) {
    try {
      const snapshot = await docRef.get();

      if (!snapshot.exists) {
        await docRef.set({
          [minField]: value,
          [maxField]: value,
        }, { merge: true });
        setCacheEntry(cacheKey, value, value);
        return;
      }

      const data = snapshot.data() || {};
      const currentMin = typeof data[minField] === 'number' ? data[minField] : Infinity;
      const currentMax = typeof data[maxField] === 'number' ? data[maxField] : -Infinity;

      const updates = {};
      let changed = false;
      let nextMin = currentMin;
      let nextMax = currentMax;

      if (value < currentMin) {
        updates[minField] = value;
        changed = true;
        nextMin = value;
      }

      if (value > currentMax) {
        updates[maxField] = value;
        changed = true;
        nextMax = value;
      }

      if (!changed) {
        setCacheEntry(cacheKey, currentMin === Infinity ? value : currentMin, currentMax === -Infinity ? value : currentMax);
        return;
      }

      await docRef.update(updates, { lastUpdateTime: snapshot.updateTime });
      setCacheEntry(cacheKey, nextMin, nextMax);
      return;
    } catch (error) {
      if (isConcurrencyError(error)) {
        continue;
      }
      console.warn('[analytics] Failed to update min/max for document', {
        path: docRef.path,
        error: error?.message,
      });
      return;
    }
  }

  console.warn('[analytics] Exhausted retries updating min/max for document', { path: docRef.path });
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padding = padded.length % 4;
  const normalised = padding ? padded.padEnd(padded.length + (4 - padding), '=') : padded;
  return Buffer.from(normalised, 'base64').toString('utf8');
}

function encodeDocId(value, fallbackLabel = 'unknown') {
  const resolved = value || fallbackLabel;
  try {
    return toBase64Url(resolved);
  } catch {
    return crypto.createHash('sha256').update(resolved).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
}

function encodeFieldKey(value, fallbackLabel = 'unknown') {
  const resolved = value || fallbackLabel;
  try {
    return toBase64Url(resolved);
  } catch {
    return crypto.createHash('sha256').update(resolved).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
}

function decodeFieldKey(encodedKey, fallback = 'unknown') {
  if (!encodedKey) return fallback;
  try {
    return fromBase64Url(encodedKey);
  } catch {
    return fallback;
  }
}

/**
 * Time bucket granularity
 */
const BUCKET_TYPES = {
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day'
};

/**
 * Record an API request metric
 * 
 * @param {Object} data - Request data
 * @param {string} data.endpoint - API endpoint path
 * @param {string} data.method - HTTP method
 * @param {number} data.statusCode - Response status code
 * @param {number} data.responseTime - Response time in ms
 * @param {string} data.apiKey - API key ID (optional)
 * @param {string} data.userId - User ID (optional)
 * @param {string} data.tenantId - Tenant ID
 * @param {string} data.version - API version
 * @param {string} data.ipAddress - Client IP address
 * @param {string} data.userAgent - User agent string
 * @param {string} data.origin - Request origin
 * @param {Object} data.error - Error details (optional)
 */
export async function recordRequest(data) {
  try {
    const timestamp = admin.firestore.Timestamp.now();
    const date = timestamp.toDate();

    // Create request log
    const requestLog = {
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      apiKey: data.apiKey || null,
      userId: data.userId || null,
      tenantId: data.tenantId || 'public',
      version: data.version || 'v1',
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      origin: data.origin || null,
      error: data.error || null,
      timestamp,
      success: data.statusCode >= 200 && data.statusCode < 400
    };

    // Store individual request (for detailed analysis)
    await db.collection('apiRequests').add(requestLog);

    // Update aggregated metrics in parallel
    await Promise.all([
      updateHourlyMetrics(date, requestLog),
      updateDailyMetrics(date, requestLog),
      updateEndpointMetrics(requestLog),
      updateConsumerMetrics(requestLog)
    ]);

  } catch (error) {
    // Don't throw - analytics failures shouldn't break API
    console.error('Analytics recording error:', error);
  }
}

/**
 * Update hourly aggregated metrics
 */
async function updateHourlyMetrics(date, requestLog) {
  const hourKey = getHourKey(date);
  const docRef = db.collection('analyticsHourly').doc(hourKey);
  const endpointLabel = requestLog.endpoint || 'unknown';
  const endpointKey = encodeFieldKey(endpointLabel, 'unknown');
  const method = requestLog.method || 'UNKNOWN';
  const version = requestLog.version || 'v1';
  const tenant = requestLog.tenantId || 'public';
  const statusCode = requestLog.statusCode || 'unknown';
  const successIncrement = requestLog.success ? 1 : 0;
  const failureIncrement = requestLog.success ? 0 : 1;
  const bucketDate = admin.firestore.Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()));

  const updateData = {
    period: hourKey,
    hour: date.getHours(),
    date: bucketDate,
    totalRequests: admin.firestore.FieldValue.increment(1),
    successfulRequests: admin.firestore.FieldValue.increment(successIncrement),
    failedRequests: admin.firestore.FieldValue.increment(failureIncrement),
    totalResponseTime: admin.firestore.FieldValue.increment(requestLog.responseTime),
    [`statusCodes.${statusCode}`]: admin.firestore.FieldValue.increment(1),
    [`endpoints.${endpointKey}`]: admin.firestore.FieldValue.increment(1),
    [`endpointLookup.${endpointKey}`]: endpointLabel,
    [`methods.${method}`]: admin.firestore.FieldValue.increment(1),
    [`versions.${version}`]: admin.firestore.FieldValue.increment(1),
    [`tenants.${tenant}`]: admin.firestore.FieldValue.increment(1),
    lastUpdated: requestLog.timestamp,
  };

  await docRef.set(updateData, { merge: true });

  await updateMinMaxIfNeeded(docRef, requestLog.responseTime, {
    cacheKey: docRef.path,
  });
}

/**
 * Update daily aggregated metrics
 */
async function updateDailyMetrics(date, requestLog) {
  const dayKey = getDayKey(date);
  const docRef = db.collection('analyticsDaily').doc(dayKey);
  const endpointLabel = requestLog.endpoint || 'unknown';
  const endpointKey = encodeFieldKey(endpointLabel, 'unknown');
  const method = requestLog.method || 'UNKNOWN';
  const version = requestLog.version || 'v1';
  const tenant = requestLog.tenantId || 'public';
  const statusCode = requestLog.statusCode || 'unknown';
  const successIncrement = requestLog.success ? 1 : 0;
  const failureIncrement = requestLog.success ? 0 : 1;
  const bucketDate = admin.firestore.Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));

  const updateData = {
    period: dayKey,
    date: bucketDate,
    totalRequests: admin.firestore.FieldValue.increment(1),
    successfulRequests: admin.firestore.FieldValue.increment(successIncrement),
    failedRequests: admin.firestore.FieldValue.increment(failureIncrement),
    totalResponseTime: admin.firestore.FieldValue.increment(requestLog.responseTime),
    [`statusCodes.${statusCode}`]: admin.firestore.FieldValue.increment(1),
    [`endpoints.${endpointKey}`]: admin.firestore.FieldValue.increment(1),
    [`endpointLookup.${endpointKey}`]: endpointLabel,
    [`methods.${method}`]: admin.firestore.FieldValue.increment(1),
    [`versions.${version}`]: admin.firestore.FieldValue.increment(1),
    [`tenants.${tenant}`]: admin.firestore.FieldValue.increment(1),
    lastUpdated: requestLog.timestamp,
  };

  await docRef.set(updateData, { merge: true });

  await updateMinMaxIfNeeded(docRef, requestLog.responseTime, {
    cacheKey: docRef.path,
  });
}

/**
 * Update per-endpoint metrics
 */
async function updateEndpointMetrics(requestLog) {
  const endpointKey = `${requestLog.method || 'UNKNOWN'}:${requestLog.endpoint || 'unknown'}`;
  const docId = encodeDocId(endpointKey, 'UNKNOWN:endpoint');
  const docRef = db.collection('analyticsEndpoints').doc(docId);
  const successIncrement = requestLog.success ? 1 : 0;
  const failureIncrement = requestLog.success ? 0 : 1;
  const statusCode = requestLog.statusCode || 'unknown';
  const cacheKey = docRef.path;

  let created = false;
  try {
    await docRef.create({
      endpoint: requestLog.endpoint,
      method: requestLog.method,
      endpointKey,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: requestLog.responseTime,
      maxResponseTime: requestLog.responseTime,
      statusCodes: {},
      lastAccessed: requestLog.timestamp,
      firstAccessed: requestLog.timestamp,
    });
    created = true;
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  const updateData = {
    endpoint: requestLog.endpoint,
    method: requestLog.method,
    endpointKey,
    lastAccessed: requestLog.timestamp,
    totalRequests: admin.firestore.FieldValue.increment(1),
    successfulRequests: admin.firestore.FieldValue.increment(successIncrement),
    failedRequests: admin.firestore.FieldValue.increment(failureIncrement),
    totalResponseTime: admin.firestore.FieldValue.increment(requestLog.responseTime),
    [`statusCodes.${statusCode}`]: admin.firestore.FieldValue.increment(1),
  };

  await docRef.set(updateData, { merge: true });

  if (created) {
    setCacheEntry(cacheKey, requestLog.responseTime, requestLog.responseTime);
    return;
  }

  await updateMinMaxIfNeeded(docRef, requestLog.responseTime, {
    cacheKey,
  });
}

/**
 * Update per-consumer (API key) metrics
 */
async function updateConsumerMetrics(requestLog) {
  if (!requestLog.apiKey) return;

  const docRef = db.collection('analyticsConsumers').doc(requestLog.apiKey);
  const endpointLabel = requestLog.endpoint || 'unknown';
  const endpointKey = encodeFieldKey(endpointLabel, 'unknown');

  const successIncrement = requestLog.success ? 1 : 0;
  const failureIncrement = requestLog.success ? 0 : 1;
  const statusCode = requestLog.statusCode || 'unknown';
  const cacheKey = docRef.path;

  let created = false;
  try {
    await docRef.create({
      apiKey: requestLog.apiKey,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: requestLog.responseTime,
      maxResponseTime: requestLog.responseTime,
      endpoints: {},
      endpointLookup: {},
      statusCodes: {},
      lastRequest: requestLog.timestamp,
      firstRequest: requestLog.timestamp,
    });
    created = true;
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  const updateData = {
    apiKey: requestLog.apiKey,
    lastRequest: requestLog.timestamp,
    totalRequests: admin.firestore.FieldValue.increment(1),
    successfulRequests: admin.firestore.FieldValue.increment(successIncrement),
    failedRequests: admin.firestore.FieldValue.increment(failureIncrement),
    totalResponseTime: admin.firestore.FieldValue.increment(requestLog.responseTime),
    [`endpoints.${endpointKey}`]: admin.firestore.FieldValue.increment(1),
    [`endpointLookup.${endpointKey}`]: endpointLabel,
    [`statusCodes.${statusCode}`]: admin.firestore.FieldValue.increment(1),
  };

  await docRef.set(updateData, { merge: true });

  if (created) {
    setCacheEntry(cacheKey, requestLog.responseTime, requestLog.responseTime);
    return;
  }

  await updateMinMaxIfNeeded(docRef, requestLog.responseTime, {
    cacheKey,
  });
}

/**
 * Get overview analytics
 */
export async function getOverview(startDate, endDate) {
  const start = admin.firestore.Timestamp.fromDate(startDate);
  const end = admin.firestore.Timestamp.fromDate(endDate);

  // Get hourly buckets in range
  const hourlySnapshot = await db.collection('analyticsHourly')
    .where('date', '>=', start)
    .where('date', '<=', end)
    .get();

  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let totalResponseTime = 0;
  const statusCodes = {};
  const methods = {};
  const versions = {};

  hourlySnapshot.forEach(doc => {
    const data = doc.data();
    totalRequests += data.totalRequests;
    successfulRequests += data.successfulRequests;
    failedRequests += data.failedRequests;
    totalResponseTime += data.totalResponseTime;

    // Aggregate status codes
    Object.entries(data.statusCodes || {}).forEach(([code, count]) => {
      statusCodes[code] = (statusCodes[code] || 0) + count;
    });

    // Aggregate methods
    Object.entries(data.methods || {}).forEach(([method, count]) => {
      methods[method] = (methods[method] || 0) + count;
    });

    // Aggregate versions
    Object.entries(data.versions || {}).forEach(([version, count]) => {
      versions[version] = (versions[version] || 0) + count;
    });
  });

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate: totalRequests > 0 ? (failedRequests / totalRequests * 100).toFixed(2) : 0,
    avgResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
    statusCodes,
    methods,
    versions
  };
}

/**
 * Get time-series data for charts
 */
export async function getTimeSeries(startDate, endDate, granularity = 'hour') {
  const start = admin.firestore.Timestamp.fromDate(startDate);
  const end = admin.firestore.Timestamp.fromDate(endDate);

  const collection = granularity === 'day' ? 'analyticsDaily' : 'analyticsHourly';
  
  const snapshot = await db.collection(collection)
    .where('date', '>=', start)
    .where('date', '<=', end)
    .orderBy('date', 'asc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    const totalRequests = data.totalRequests || 0;
    const totalResponseTime = data.totalResponseTime || 0;
    return {
      period: data.period,
      date: data.date.toDate(),
      totalRequests,
      successfulRequests: data.successfulRequests,
      failedRequests: data.failedRequests,
      avgResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
      errorRate: totalRequests > 0 ? ((data.failedRequests / totalRequests) * 100).toFixed(2) : '0.00'
    };
  });
}

/**
 * Get endpoint statistics
 */
export async function getEndpointStats(limit = 20, sortBy = 'totalRequests') {
  const normalizedSort = ['totalRequests', 'avgResponseTime', 'errorRate', 'failedRequests', 'successfulRequests', 'lastAccessed']
    .includes(sortBy)
    ? sortBy
    : 'totalRequests';

  const orderField = ['totalRequests', 'failedRequests', 'successfulRequests', 'lastAccessed'].includes(normalizedSort)
    ? normalizedSort
    : 'totalRequests';

  const fetchLimit = Math.max(limit, limit * (normalizedSort === orderField ? 1 : 5));

  const snapshot = await db.collection('analyticsEndpoints')
    .orderBy(orderField, 'desc')
    .limit(fetchLimit)
    .get();

  const items = snapshot.docs.map(doc => {
    const data = doc.data();
    const totalRequests = data.totalRequests || 0;
    const totalResponseTime = data.totalResponseTime || 0;
    const avgResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0;
    const errorRateValue = totalRequests > 0 ? (data.failedRequests / totalRequests) * 100 : 0;
    return {
      endpoint: data.endpoint,
      method: data.method,
      totalRequests,
      successfulRequests: data.successfulRequests,
      failedRequests: data.failedRequests,
      errorRate: errorRateValue.toFixed(2),
      avgResponseTime,
      minResponseTime: data.minResponseTime,
      maxResponseTime: data.maxResponseTime,
      lastAccessed: data.lastAccessed.toDate(),
      __errorRateValue: errorRateValue,
    };
  });

  const sorted = items.sort((a, b) => {
    if (normalizedSort === 'avgResponseTime') {
      return b.avgResponseTime - a.avgResponseTime;
    }
    if (normalizedSort === 'errorRate') {
      return b.__errorRateValue - a.__errorRateValue;
    }
    if (normalizedSort === 'lastAccessed') {
      return b.lastAccessed.getTime() - a.lastAccessed.getTime();
    }
    return (b[normalizedSort] || 0) - (a[normalizedSort] || 0);
  });

  return sorted.slice(0, limit).map(({ __errorRateValue, ...rest }) => rest);
}

/**
 * Get consumer (API key) statistics
 */
export async function getConsumerStats(limit = 20, sortBy = 'totalRequests') {
  const normalizedSort = ['totalRequests', 'avgResponseTime', 'errorRate', 'failedRequests', 'successfulRequests', 'lastRequest']
    .includes(sortBy)
    ? sortBy
    : 'totalRequests';

  const orderField = ['totalRequests', 'failedRequests', 'successfulRequests', 'lastRequest'].includes(normalizedSort)
    ? normalizedSort
    : 'totalRequests';

  const fetchLimit = Math.max(limit, limit * (normalizedSort === orderField ? 1 : 5));

  const snapshot = await db.collection('analyticsConsumers')
    .orderBy(orderField, 'desc')
    .limit(fetchLimit)
    .get();

  const consumers = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const totalRequests = data.totalRequests || 0;
    const totalResponseTime = data.totalResponseTime || 0;
    const avgResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0;
    const errorRateValue = totalRequests > 0 ? (data.failedRequests / totalRequests) * 100 : 0;

    const keyDoc = await db.collection('apiKeys').doc(data.apiKey).get();
    const keyData = keyDoc.exists ? keyDoc.data() : null;

    consumers.push({
      apiKey: data.apiKey,
      name: keyData?.name || 'Unknown',
      tier: keyData?.tier || 'free',
      totalRequests,
      successfulRequests: data.successfulRequests,
      failedRequests: data.failedRequests,
      errorRate: errorRateValue.toFixed(2),
      avgResponseTime,
      topEndpoints: getTopItems(data.endpoints, 5, data.endpointLookup),
      lastRequest: data.lastRequest.toDate(),
      __errorRateValue: errorRateValue,
    });
  }

  const sorted = consumers.sort((a, b) => {
    if (normalizedSort === 'avgResponseTime') {
      return b.avgResponseTime - a.avgResponseTime;
    }
    if (normalizedSort === 'errorRate') {
      return b.__errorRateValue - a.__errorRateValue;
    }
    if (normalizedSort === 'lastRequest') {
      return b.lastRequest.getTime() - a.lastRequest.getTime();
    }
    return (b[normalizedSort] || 0) - (a[normalizedSort] || 0);
  });

  return sorted.slice(0, limit).map(({ __errorRateValue, ...rest }) => rest);
}

/**
 * Get geographic distribution (based on IP)
 * Note: Requires IP geolocation service integration
 */
export async function getGeographicStats(startDate, endDate) {
  // This is a placeholder - implement with actual IP geolocation
  // Could use services like MaxMind GeoIP, ipapi, etc.
  
  const start = admin.firestore.Timestamp.fromDate(startDate);
  const end = admin.firestore.Timestamp.fromDate(endDate);

  const snapshot = await db.collection('apiRequests')
    .where('timestamp', '>=', start)
    .where('timestamp', '<=', end)
    .select('ipAddress')
    .get();

  const ipCounts = {};
  snapshot.forEach(doc => {
    const ip = doc.data().ipAddress;
    if (ip) {
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }
  });

  // Return top IPs (in production, map to countries/regions)
  return Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([ip, count]) => ({
      ip,
      count,
      // In production, add: country, region, city
    }));
}

/**
 * Get error details
 */
export async function getErrorDetails(startDate, endDate, limit = 50) {
  const start = admin.firestore.Timestamp.fromDate(startDate);
  const end = admin.firestore.Timestamp.fromDate(endDate);

  const snapshot = await db.collection('apiRequests')
    .where('timestamp', '>=', start)
    .where('timestamp', '<=', end)
    .where('success', '==', false)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      timestamp: data.timestamp.toDate(),
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      error: data.error,
      apiKey: data.apiKey,
      userId: data.userId
    };
  });
}

/**
 * Cleanup old analytics data
 * Call this periodically to manage storage
 */
export async function cleanupOldData(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoff = admin.firestore.Timestamp.fromDate(cutoffDate);

  // Delete old request logs
  const batch = db.batch();
  const oldRequests = await db.collection('apiRequests')
    .where('timestamp', '<', cutoff)
    .limit(500)
    .get();

  oldRequests.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  return oldRequests.size;
}

// Helper functions

function getHourKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

function getDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTopItems(obj, limit, lookup) {
  return Object.entries(obj || {})
    .map(([key, count]) => {
      const label = lookup?.[key] ?? decodeFieldKey(key, key);
      return { key: label, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default {
  recordRequest,
  getOverview,
  getTimeSeries,
  getEndpointStats,
  getConsumerStats,
  getGeographicStats,
  getErrorDetails,
  cleanupOldData
};
