// backend/routes/monitoring.js
import { Router } from "express";
import { getCacheStats, isRedisHealthy } from "../services/cacheService.js";
import { getAllBreakerStates } from "../services/circuitBreaker.js";
import admin from "firebase-admin";

const router = Router();

// Track metrics
const metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byRoute: {},
    byStatusCode: {},
  },
  errors: [],
  responseTime: {
    total: 0,
    count: 0,
    min: Infinity,
    max: 0,
    samples: [], // Last 100 samples
  },
  startTime: Date.now(),
};

// Max errors to keep in memory
const MAX_ERRORS = 100;
const MAX_RESPONSE_TIME_SAMPLES = 100;

/**
 * Middleware to track request metrics
 * Mount this early in middleware chain
 */
export function metricsMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    // Track request
    metrics.requests.total++;
    metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;

    // Track response
    const originalSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - startTime;

      // Track response time
      metrics.responseTime.total += duration;
      metrics.responseTime.count++;
      metrics.responseTime.min = Math.min(metrics.responseTime.min, duration);
      metrics.responseTime.max = Math.max(metrics.responseTime.max, duration);
      
      // Keep last N samples for percentile calculation
      metrics.responseTime.samples.push(duration);
      if (metrics.responseTime.samples.length > MAX_RESPONSE_TIME_SAMPLES) {
        metrics.responseTime.samples.shift();
      }

      // Track status code
      metrics.requests.byStatusCode[res.statusCode] = 
        (metrics.requests.byStatusCode[res.statusCode] || 0) + 1;

      // Track route
      const route = `${req.method} ${req.route?.path || req.path}`;
      metrics.requests.byRoute[route] = (metrics.requests.byRoute[route] || 0) + 1;

      // Track errors
      if (res.statusCode >= 400) {
        metrics.errors.push({
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('user-agent'),
          ip: req.ip,
        });

        // Keep only last N errors
        if (metrics.errors.length > MAX_ERRORS) {
          metrics.errors.shift();
        }
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * GET /monitoring/metrics
 * Prometheus-compatible metrics endpoint
 */
router.get("/metrics", async (req, res) => {
  const uptime = Date.now() - metrics.startTime;
  const avgResponseTime = metrics.responseTime.count > 0
    ? metrics.responseTime.total / metrics.responseTime.count
    : 0;

  // Calculate percentiles
  const p95 = calculatePercentile(metrics.responseTime.samples, 95);
  const p99 = calculatePercentile(metrics.responseTime.samples, 99);

  // Get cache stats
  const cacheStats = await getCacheStats();

  // Get circuit breaker states
  const breakerStates = getAllBreakerStates();

  // Prometheus format
  const prometheusMetrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.requests.total}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds summary
http_request_duration_seconds_sum ${metrics.responseTime.total / 1000}
http_request_duration_seconds_count ${metrics.responseTime.count}
http_request_duration_seconds{quantile="0.95"} ${p95 / 1000}
http_request_duration_seconds{quantile="0.99"} ${p99 / 1000}

# HELP http_requests_by_status HTTP requests by status code
# TYPE http_requests_by_status counter
${Object.entries(metrics.requests.byStatusCode)
  .map(([code, count]) => `http_requests_by_status{code="${code}"} ${count}`)
  .join('\n')}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime / 1000}

# HELP cache_hit_rate Cache hit rate percentage
# TYPE cache_hit_rate gauge
cache_hit_rate ${parseFloat(cacheStats.stats?.hitRate) || 0}

# HELP circuit_breaker_state Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)
# TYPE circuit_breaker_state gauge
${Object.entries(breakerStates)
  .map(([name, state]) => {
    const stateValue = state.state === 'CLOSED' ? 0 : state.state === 'HALF_OPEN' ? 1 : 2;
    return `circuit_breaker_state{name="${name}"} ${stateValue}`;
  })
  .join('\n')}
`.trim();

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(prometheusMetrics);
});

/**
 * GET /monitoring/stats
 * Human-readable performance statistics
 */
router.get("/stats", async (req, res) => {
  const uptime = Date.now() - metrics.startTime;
  const avgResponseTime = metrics.responseTime.count > 0
    ? metrics.responseTime.total / metrics.responseTime.count
    : 0;

  const p50 = calculatePercentile(metrics.responseTime.samples, 50);
  const p95 = calculatePercentile(metrics.responseTime.samples, 95);
  const p99 = calculatePercentile(metrics.responseTime.samples, 99);

  const cacheStats = await getCacheStats();
  const breakerStates = getAllBreakerStates();

  res.json({
    uptime: {
      milliseconds: uptime,
      formatted: formatUptime(uptime),
    },
    requests: {
      total: metrics.requests.total,
      byMethod: metrics.requests.byMethod,
      byStatusCode: metrics.requests.byStatusCode,
      topRoutes: getTopRoutes(10),
    },
    responseTime: {
      average: Math.round(avgResponseTime),
      min: metrics.responseTime.min === Infinity ? 0 : metrics.responseTime.min,
      max: metrics.responseTime.max,
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      unit: 'ms',
    },
    errors: {
      total: metrics.errors.length,
      recent: metrics.errors.slice(-10),
    },
    cache: cacheStats,
    circuitBreakers: breakerStates,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /monitoring/errors
 * Recent errors
 */
router.get("/errors", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  
  res.json({
    total: metrics.errors.length,
    errors: metrics.errors.slice(-limit).reverse(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /monitoring/performance
 * Performance analysis
 */
router.get("/performance", async (req, res) => {
  const uptime = Date.now() - metrics.startTime;
  const requestsPerSecond = metrics.requests.total / (uptime / 1000);
  const avgResponseTime = metrics.responseTime.count > 0
    ? metrics.responseTime.total / metrics.responseTime.count
    : 0;

  const errorCount = Object.entries(metrics.requests.byStatusCode)
    .filter(([code]) => parseInt(code) >= 400)
    .reduce((sum, [, count]) => sum + count, 0);
  
  const errorRate = metrics.requests.total > 0
    ? (errorCount / metrics.requests.total) * 100
    : 0;

  res.json({
    throughput: {
      requestsPerSecond: requestsPerSecond.toFixed(2),
      totalRequests: metrics.requests.total,
      uptime: formatUptime(uptime),
    },
    latency: {
      average: Math.round(avgResponseTime),
      p50: Math.round(calculatePercentile(metrics.responseTime.samples, 50)),
      p95: Math.round(calculatePercentile(metrics.responseTime.samples, 95)),
      p99: Math.round(calculatePercentile(metrics.responseTime.samples, 99)),
      unit: 'ms',
    },
    reliability: {
      errorRate: errorRate.toFixed(2) + '%',
      successRate: (100 - errorRate).toFixed(2) + '%',
      errorCount,
      successCount: metrics.requests.total - errorCount,
    },
    slowestRoutes: getSlowestRoutes(10),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /monitoring/reset
 * Reset metrics (use with caution)
 */
router.post("/reset", (req, res) => {
  metrics.requests.total = 0;
  metrics.requests.byMethod = {};
  metrics.requests.byRoute = {};
  metrics.requests.byStatusCode = {};
  metrics.errors = [];
  metrics.responseTime.total = 0;
  metrics.responseTime.count = 0;
  metrics.responseTime.min = Infinity;
  metrics.responseTime.max = 0;
  metrics.responseTime.samples = [];
  metrics.startTime = Date.now();

  res.json({
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString(),
  });
});

// Helper functions

function calculatePercentile(samples, percentile) {
  if (samples.length === 0) return 0;
  
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  
  return sorted[Math.max(0, index)];
}

function getTopRoutes(limit = 10) {
  return Object.entries(metrics.requests.byRoute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([route, count]) => ({ route, count }));
}

function getSlowestRoutes(limit = 10) {
  const routeTimes = {};
  
  // This is simplified - in production, track per-route timing
  return Object.entries(metrics.requests.byRoute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([route, count]) => ({ 
      route, 
      count,
      avgResponseTime: Math.round(metrics.responseTime.total / metrics.responseTime.count || 0),
    }));
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export default router;
export { metrics };
