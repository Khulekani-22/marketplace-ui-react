/**
 * Analytics Routes
 * 
 * Endpoints for retrieving API usage analytics and metrics.
 * Restricted to admin users only.
 */

import express from 'express';
import analyticsService from '../services/analyticsService.js';
import { firebaseAuthRequired } from '../middleware/authFirebase.js';
import { apiKeyAuth } from '../middleware/authApiKey.js';

const router = express.Router();

/**
 * Admin check middleware
 * Ensures only admin users can access analytics
 */
async function requireAdmin(req, res, next) {
  try {
    // Check if user is admin
    const isAdmin = req.user?.role === 'admin' || 
                    req.user?.isAdmin === true ||
                    req.user?.customClaims?.admin === true;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Analytics access requires admin privileges'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}

/**
 * Parse date range from query parameters
 */
function parseDateRange(req) {
  const now = new Date();
  let startDate, endDate;

  if (req.query.startDate && req.query.endDate) {
    startDate = new Date(req.query.startDate);
    endDate = new Date(req.query.endDate);
  } else {
    // Default to last 24 hours
    const period = req.query.period || '24h';
    endDate = now;
    startDate = new Date(now);

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
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }
  }

  return { startDate, endDate };
}

/**
 * GET /api/analytics/overview
 * 
 * Get high-level overview metrics
 * 
 * Query params:
 * - period: 1h | 24h | 7d | 30d | 90d (default: 24h)
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
router.get('/overview', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);

    const overview = await analyticsService.getOverview(startDate, endDate);

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        metrics: overview
      }
    });

  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/timeseries
 * 
 * Get time-series data for charting
 * 
 * Query params:
 * - period: 1h | 24h | 7d | 30d | 90d (default: 24h)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - granularity: hour | day (default: hour)
 */
router.get('/timeseries', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const granularity = req.query.granularity || 'hour';

    const timeSeries = await analyticsService.getTimeSeries(startDate, endDate, granularity);

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        granularity,
        series: timeSeries
      }
    });

  } catch (error) {
    console.error('Get timeseries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/endpoints
 * 
 * Get per-endpoint statistics
 * 
 * Query params:
 * - limit: number of top endpoints (default: 20)
 * - sortBy: totalRequests | avgResponseTime | errorRate (default: totalRequests)
 */
router.get('/endpoints', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'totalRequests';

    const endpoints = await analyticsService.getEndpointStats(limit, sortBy);

    res.json({
      success: true,
      data: {
        endpoints,
        total: endpoints.length
      }
    });

  } catch (error) {
    console.error('Get endpoints error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/consumers
 * 
 * Get per-consumer (API key) statistics
 * 
 * Query params:
 * - limit: number of top consumers (default: 20)
 * - sortBy: totalRequests | avgResponseTime | errorRate (default: totalRequests)
 */
router.get('/consumers', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'totalRequests';

    const consumers = await analyticsService.getConsumerStats(limit, sortBy);

    res.json({
      success: true,
      data: {
        consumers,
        total: consumers.length
      }
    });

  } catch (error) {
    console.error('Get consumers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/geographic
 * 
 * Get geographic distribution of requests
 * 
 * Query params:
 * - period: 1h | 24h | 7d | 30d | 90d (default: 24h)
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
router.get('/geographic', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);

    const geographic = await analyticsService.getGeographicStats(startDate, endDate);

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        distribution: geographic
      }
    });

  } catch (error) {
    console.error('Get geographic error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/errors
 * 
 * Get recent error details
 * 
 * Query params:
 * - period: 1h | 24h | 7d | 30d (default: 24h)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - limit: number of errors to return (default: 50)
 */
router.get('/errors', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const limit = parseInt(req.query.limit) || 50;

    const errors = await analyticsService.getErrorDetails(startDate, endDate, limit);

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        errors,
        total: errors.length
      }
    });

  } catch (error) {
    console.error('Get errors error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/health
 * 
 * Get system health metrics
 */
router.get('/health', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);

    const overview = await analyticsService.getOverview(startDate, endDate);
    
    // Calculate health score (0-100)
    const errorRate = parseFloat(overview.errorRate);
    const avgResponseTime = overview.avgResponseTime;
    
    let healthScore = 100;
    
    // Deduct points for errors
    if (errorRate > 10) healthScore -= 30;
    else if (errorRate > 5) healthScore -= 20;
    else if (errorRate > 1) healthScore -= 10;
    
    // Deduct points for slow responses
    if (avgResponseTime > 5000) healthScore -= 30;
    else if (avgResponseTime > 2000) healthScore -= 20;
    else if (avgResponseTime > 1000) healthScore -= 10;

    let status = 'healthy';
    if (healthScore < 50) status = 'critical';
    else if (healthScore < 70) status = 'degraded';
    else if (healthScore < 90) status = 'warning';

    res.json({
      success: true,
      data: {
        status,
        score: healthScore,
        metrics: {
          errorRate: overview.errorRate,
          avgResponseTime: overview.avgResponseTime,
          totalRequests: overview.totalRequests
        },
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get health error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/cleanup
 * 
 * Cleanup old analytics data
 * Admin only
 * 
 * Body:
 * - daysToKeep: number of days to retain (default: 90)
 */
router.post('/cleanup', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const daysToKeep = parseInt(req.body.daysToKeep) || 90;

    const deletedCount = await analyticsService.cleanupOldData(daysToKeep);

    res.json({
      success: true,
      message: `Cleaned up analytics data older than ${daysToKeep} days`,
      data: {
        deletedRecords: deletedCount
      }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/export
 * 
 * Export analytics data as CSV
 * 
 * Query params:
 * - type: overview | endpoints | consumers | errors
 * - period: 1h | 24h | 7d | 30d | 90d (default: 24h)
 */
router.get('/export', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const type = req.query.type || 'overview';
    const { startDate, endDate } = parseDateRange(req);

    let data;
    let csv;

    switch (type) {
      case 'endpoints':
        data = await analyticsService.getEndpointStats(100);
        csv = convertEndpointsToCSV(data);
        break;
      
      case 'consumers':
        data = await analyticsService.getConsumerStats(100);
        csv = convertConsumersToCSV(data);
        break;
      
      case 'errors':
        data = await analyticsService.getErrorDetails(startDate, endDate, 500);
        csv = convertErrorsToCSV(data);
        break;
      
      case 'overview':
      default:
        data = await analyticsService.getTimeSeries(startDate, endDate, 'hour');
        csv = convertTimeSeriestoCSV(data);
        break;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${Date.now()}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// CSV conversion helpers

function convertTimeSeriestoCSV(data) {
  const headers = 'Period,Date,Total Requests,Successful,Failed,Avg Response Time,Error Rate\n';
  const rows = data.map(row => 
    `${row.period},${row.date.toISOString()},${row.totalRequests},${row.successfulRequests},${row.failedRequests},${row.avgResponseTime},${row.errorRate}`
  ).join('\n');
  return headers + rows;
}

function convertEndpointsToCSV(data) {
  const headers = 'Endpoint,Method,Total Requests,Successful,Failed,Error Rate,Avg Response Time,Min,Max,Last Accessed\n';
  const rows = data.map(row => 
    `${row.endpoint},${row.method},${row.totalRequests},${row.successfulRequests},${row.failedRequests},${row.errorRate},${row.avgResponseTime},${row.minResponseTime},${row.maxResponseTime},${row.lastAccessed.toISOString()}`
  ).join('\n');
  return headers + rows;
}

function convertConsumersToCSV(data) {
  const headers = 'API Key,Name,Tier,Total Requests,Successful,Failed,Error Rate,Avg Response Time,Last Request\n';
  const rows = data.map(row => 
    `${row.apiKey},${row.name},${row.tier},${row.totalRequests},${row.successfulRequests},${row.failedRequests},${row.errorRate},${row.avgResponseTime},${row.lastRequest.toISOString()}`
  ).join('\n');
  return headers + rows;
}

function convertErrorsToCSV(data) {
  const headers = 'Timestamp,Endpoint,Method,Status Code,Response Time,Error Message,API Key,User ID\n';
  const rows = data.map(row => 
    `${row.timestamp.toISOString()},${row.endpoint},${row.method},${row.statusCode},${row.responseTime},"${row.error?.message || ''}",${row.apiKey || ''},${row.userId || ''}`
  ).join('\n');
  return headers + rows;
}

export default router;
