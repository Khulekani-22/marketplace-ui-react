/**
 * Analytics Service
 * 
 * Collects and aggregates API usage metrics for monitoring and reporting.
 * Tracks request volume, response times, error rates, and consumer patterns.
 */

import crypto from 'crypto';
import admin from 'firebase-admin';

const db = admin.firestore();

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

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    
    if (!doc.exists) {
      // Initialize new hourly bucket
      transaction.set(docRef, {
        period: hourKey,
        hour: date.getHours(),
        date: admin.firestore.Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours())),
        totalRequests: 1,
        successfulRequests: requestLog.success ? 1 : 0,
        failedRequests: requestLog.success ? 0 : 1,
        totalResponseTime: requestLog.responseTime,
        avgResponseTime: requestLog.responseTime,
        minResponseTime: requestLog.responseTime,
        maxResponseTime: requestLog.responseTime,
        statusCodes: { [requestLog.statusCode]: 1 },
        endpoints: { [endpointKey]: 1 },
        endpointLookup: { [endpointKey]: endpointLabel },
        methods: { [requestLog.method]: 1 },
        versions: { [requestLog.version]: 1 },
        tenants: { [requestLog.tenantId]: 1 }
      });
    } else {
      // Update existing bucket
      const data = doc.data();
      const totalRequests = data.totalRequests + 1;
      const totalResponseTime = data.totalResponseTime + requestLog.responseTime;
      
      transaction.update(docRef, {
        totalRequests,
        successfulRequests: admin.firestore.FieldValue.increment(requestLog.success ? 1 : 0),
        failedRequests: admin.firestore.FieldValue.increment(requestLog.success ? 0 : 1),
        totalResponseTime,
        avgResponseTime: totalResponseTime / totalRequests,
        minResponseTime: Math.min(data.minResponseTime, requestLog.responseTime),
        maxResponseTime: Math.max(data.maxResponseTime, requestLog.responseTime),
        [`statusCodes.${requestLog.statusCode}`]: admin.firestore.FieldValue.increment(1),
        [`endpoints.${endpointKey}`]: admin.firestore.FieldValue.increment(1),
        [`endpointLookup.${endpointKey}`]: endpointLabel,
        [`methods.${requestLog.method}`]: admin.firestore.FieldValue.increment(1),
        [`versions.${requestLog.version}`]: admin.firestore.FieldValue.increment(1),
        [`tenants.${requestLog.tenantId}`]: admin.firestore.FieldValue.increment(1)
      });
    }
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

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    
    if (!doc.exists) {
      transaction.set(docRef, {
        period: dayKey,
        date: admin.firestore.Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate())),
        totalRequests: 1,
        successfulRequests: requestLog.success ? 1 : 0,
        failedRequests: requestLog.success ? 0 : 1,
        totalResponseTime: requestLog.responseTime,
        avgResponseTime: requestLog.responseTime,
        minResponseTime: requestLog.responseTime,
        maxResponseTime: requestLog.responseTime,
        statusCodes: { [requestLog.statusCode]: 1 },
        endpoints: { [endpointKey]: 1 },
        endpointLookup: { [endpointKey]: endpointLabel },
        methods: { [requestLog.method]: 1 },
        versions: { [requestLog.version]: 1 },
        tenants: { [requestLog.tenantId]: 1 }
      });
    } else {
      const data = doc.data();
      const totalRequests = data.totalRequests + 1;
      const totalResponseTime = data.totalResponseTime + requestLog.responseTime;
      
      transaction.update(docRef, {
        totalRequests,
        successfulRequests: admin.firestore.FieldValue.increment(requestLog.success ? 1 : 0),
        failedRequests: admin.firestore.FieldValue.increment(requestLog.success ? 0 : 1),
        totalResponseTime,
        avgResponseTime: totalResponseTime / totalRequests,
        minResponseTime: Math.min(data.minResponseTime, requestLog.responseTime),
        maxResponseTime: Math.max(data.maxResponseTime, requestLog.responseTime),
        [`statusCodes.${requestLog.statusCode}`]: admin.firestore.FieldValue.increment(1),
        [`endpoints.${endpointKey}`]: admin.firestore.FieldValue.increment(1),
        [`endpointLookup.${endpointKey}`]: endpointLabel,
        [`methods.${requestLog.method}`]: admin.firestore.FieldValue.increment(1),
        [`versions.${requestLog.version}`]: admin.firestore.FieldValue.increment(1),
        [`tenants.${requestLog.tenantId}`]: admin.firestore.FieldValue.increment(1)
      });
    }
  });
}

/**
 * Update per-endpoint metrics
 */
async function updateEndpointMetrics(requestLog) {
  const endpointKey = `${requestLog.method || 'UNKNOWN'}:${requestLog.endpoint || 'unknown'}`;
  const docId = encodeDocId(endpointKey, 'UNKNOWN:endpoint');
  const docRef = db.collection('analyticsEndpoints').doc(docId);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    
    if (!doc.exists) {
      transaction.set(docRef, {
        endpoint: requestLog.endpoint,
        method: requestLog.method,
        endpointKey,
        totalRequests: 1,
        successfulRequests: requestLog.success ? 1 : 0,
        failedRequests: requestLog.success ? 0 : 1,
        totalResponseTime: requestLog.responseTime,
        avgResponseTime: requestLog.responseTime,
        minResponseTime: requestLog.responseTime,
        maxResponseTime: requestLog.responseTime,
        statusCodes: { [requestLog.statusCode]: 1 },
        lastAccessed: requestLog.timestamp,
        firstAccessed: requestLog.timestamp
      });
    } else {
      const data = doc.data();
      const totalRequests = data.totalRequests + 1;
      const totalResponseTime = data.totalResponseTime + requestLog.responseTime;
      
      transaction.update(docRef, {
        totalRequests,
        successfulRequests: admin.firestore.FieldValue.increment(requestLog.success ? 1 : 0),
        failedRequests: admin.firestore.FieldValue.increment(requestLog.success ? 0 : 1),
        totalResponseTime,
        avgResponseTime: totalResponseTime / totalRequests,
        minResponseTime: Math.min(data.minResponseTime, requestLog.responseTime),
        maxResponseTime: Math.max(data.maxResponseTime, requestLog.responseTime),
        [`statusCodes.${requestLog.statusCode}`]: admin.firestore.FieldValue.increment(1),
        lastAccessed: requestLog.timestamp,
        endpoint: requestLog.endpoint,
        method: requestLog.method,
        endpointKey
      });
    }
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

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    
    if (!doc.exists) {
      transaction.set(docRef, {
        apiKey: requestLog.apiKey,
        totalRequests: 1,
        successfulRequests: requestLog.success ? 1 : 0,
        failedRequests: requestLog.success ? 0 : 1,
        totalResponseTime: requestLog.responseTime,
        avgResponseTime: requestLog.responseTime,
        endpoints: { [endpointKey]: 1 },
        endpointLookup: { [endpointKey]: endpointLabel },
        statusCodes: { [requestLog.statusCode]: 1 },
        lastRequest: requestLog.timestamp,
        firstRequest: requestLog.timestamp
      });
    } else {
      const data = doc.data();
      const totalRequests = data.totalRequests + 1;
      const totalResponseTime = data.totalResponseTime + requestLog.responseTime;
      
      transaction.update(docRef, {
        totalRequests,
        successfulRequests: admin.firestore.FieldValue.increment(requestLog.success ? 1 : 0),
        failedRequests: admin.firestore.FieldValue.increment(requestLog.success ? 0 : 1),
        totalResponseTime,
        avgResponseTime: totalResponseTime / totalRequests,
        [`endpoints.${endpointKey}`]: admin.firestore.FieldValue.increment(1),
        [`endpointLookup.${endpointKey}`]: endpointLabel,
        [`statusCodes.${requestLog.statusCode}`]: admin.firestore.FieldValue.increment(1),
        lastRequest: requestLog.timestamp
      });
    }
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
    return {
      period: data.period,
      date: data.date.toDate(),
      totalRequests: data.totalRequests,
      successfulRequests: data.successfulRequests,
      failedRequests: data.failedRequests,
      avgResponseTime: data.avgResponseTime,
      errorRate: ((data.failedRequests / data.totalRequests) * 100).toFixed(2)
    };
  });
}

/**
 * Get endpoint statistics
 */
export async function getEndpointStats(limit = 20, sortBy = 'totalRequests') {
  const snapshot = await db.collection('analyticsEndpoints')
    .orderBy(sortBy, 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      endpoint: data.endpoint,
      method: data.method,
      totalRequests: data.totalRequests,
      successfulRequests: data.successfulRequests,
      failedRequests: data.failedRequests,
      errorRate: ((data.failedRequests / data.totalRequests) * 100).toFixed(2),
      avgResponseTime: Math.round(data.avgResponseTime),
      minResponseTime: data.minResponseTime,
      maxResponseTime: data.maxResponseTime,
      lastAccessed: data.lastAccessed.toDate()
    };
  });
}

/**
 * Get consumer (API key) statistics
 */
export async function getConsumerStats(limit = 20, sortBy = 'totalRequests') {
  const snapshot = await db.collection('analyticsConsumers')
    .orderBy(sortBy, 'desc')
    .limit(limit)
    .get();

  const consumers = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Get API key details
    const keyDoc = await db.collection('apiKeys').doc(data.apiKey).get();
    const keyData = keyDoc.exists ? keyDoc.data() : null;

    consumers.push({
      apiKey: data.apiKey,
      name: keyData?.name || 'Unknown',
      tier: keyData?.tier || 'free',
      totalRequests: data.totalRequests,
      successfulRequests: data.successfulRequests,
      failedRequests: data.failedRequests,
      errorRate: ((data.failedRequests / data.totalRequests) * 100).toFixed(2),
      avgResponseTime: Math.round(data.avgResponseTime),
      topEndpoints: getTopItems(data.endpoints, 5, data.endpointLookup),
      lastRequest: data.lastRequest.toDate()
    });
  }

  return consumers;
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
