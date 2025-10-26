# API Analytics Dashboard

## Overview

The API Analytics Dashboard provides comprehensive insights into API usage, performance, and consumer behavior. This system tracks every API request, aggregates metrics in real-time, and provides queryable endpoints for visualization and monitoring.

## Architecture

### Data Flow

```
API Request
    ↓
Analytics Middleware (capture metrics)
    ↓
Analytics Service (record & aggregate)
    ↓
Firestore Collections:
- apiRequests (individual requests)
- analyticsHourly (hourly aggregates)
- analyticsDaily (daily aggregates)
- analyticsEndpoints (per-endpoint stats)
- analyticsConsumers (per-API-key stats)
    ↓
Analytics API (query & export)
    ↓
Dashboard / Reports
```

### Components

#### 1. Analytics Middleware (`backend/middleware/analyticsMiddleware.js`)
- **Purpose:** Intercepts all API requests to capture timing and metadata
- **Features:**
  - Non-blocking (fire-and-forget)
  - Automatically skips `/api/analytics` and `/health` endpoints
  - Captures request/response metrics automatically
  - Extracts client info (IP, user agent, origin)
  - Normalizes endpoint paths for better aggregation

#### 2. Analytics Service (`backend/services/analyticsService.js`)
- **Purpose:** Records and aggregates metrics in Firestore
- **Features:**
  - Records individual requests
  - Updates hourly/daily aggregates
  - Tracks per-endpoint statistics
  - Tracks per-consumer (API key) usage
  - Time-series bucketing for efficient querying
  - Automatic cleanup of old data

#### 3. Analytics Routes (`backend/routes/analytics.js`)
- **Purpose:** Provides query endpoints for analytics data
- **Features:**
  - Admin-only access (requires Firebase auth + admin role)
  - Multiple aggregation views
  - CSV export functionality
  - Flexible date range queries
  - Health scoring

## Firestore Schema

### Collection: `apiRequests`

Individual request logs (detailed records):

```javascript
{
  endpoint: "/api/services",           // Normalized endpoint path
  method: "GET",                       // HTTP method
  statusCode: 200,                     // Response status code
  responseTime: 125,                   // Response time in ms
  apiKey: "ak_live_abc123",           // API key ID (if used)
  userId: "user123",                   // User ID (if authenticated)
  tenantId: "vendor",                  // Tenant context
  version: "v1",                       // API version
  ipAddress: "192.168.1.100",         // Client IP
  userAgent: "Mozilla/5.0...",        // User agent string
  origin: "https://example.com",      // Request origin
  error: {                            // Error details (if failed)
    message: "Not found",
    code: "NOT_FOUND"
  },
  timestamp: Timestamp,                // Request timestamp
  success: true                        // Success flag (2xx-3xx)
}
```

**Indexes Required:**
```
- timestamp (asc) + success (asc)
- timestamp (desc)
```

### Collection: `analyticsHourly`

Hourly aggregated metrics:

```javascript
{
  period: "2025-10-26-14",            // Hour bucket key
  hour: 14,                            // Hour of day (0-23)
  date: Timestamp,                     // Bucket start time
  totalRequests: 1523,                 // Total requests in hour
  successfulRequests: 1489,            // Successful (2xx-3xx)
  failedRequests: 34,                  // Failed (4xx-5xx)
  totalResponseTime: 190750,           // Sum of response times
  avgResponseTime: 125.24,             // Average response time
  minResponseTime: 12,                 // Fastest response
  maxResponseTime: 3421,               // Slowest response
  statusCodes: {                       // Status code breakdown
    "200": 1234,
    "201": 123,
    "400": 12,
    "404": 15,
    "500": 7
  },
  endpoints: {                         // Endpoint hit counts
    "/api/services": 567,
    "/api/vendors": 234,
    ...
  },
  methods: {                           // HTTP method counts
    "GET": 1123,
    "POST": 234,
    "PUT": 89,
    "DELETE": 77
  },
  versions: {                          // API version usage
    "v1": 1345,
    "v2": 178
  },
  tenants: {                           // Tenant distribution
    "public": 456,
    "vendor": 789,
    "startup": 278
  }
}
```

**Indexes Required:**
```
- date (asc)
- date (desc)
```

### Collection: `analyticsDaily`

Daily aggregated metrics (same structure as hourly, different time bucket):

```javascript
{
  period: "2025-10-26",               // Day bucket key
  date: Timestamp,                     // Day start time
  // ... (same fields as analyticsHourly)
}
```

### Collection: `analyticsEndpoints`

Per-endpoint lifetime statistics:

```javascript
{
  endpoint: "/api/services",           // Endpoint path
  method: "GET",                       // HTTP method
  totalRequests: 45234,                // Lifetime total
  successfulRequests: 44987,           // Successful
  failedRequests: 247,                 // Failed
  totalResponseTime: 5654321,          // Sum of response times
  avgResponseTime: 125.0,              // Average response time
  minResponseTime: 8,                  // Fastest ever
  maxResponseTime: 4523,               // Slowest ever
  statusCodes: {                       // Status code breakdown
    "200": 43123,
    "400": 123,
    "404": 112,
    "500": 12
  },
  lastAccessed: Timestamp,             // Last request time
  firstAccessed: Timestamp             // First request time
}
```

**Document ID:** `METHOD:PATH` (e.g., `GET:/api/services`)

**Indexes Required:**
```
- totalRequests (desc)
- avgResponseTime (desc)
- failedRequests (desc)
- lastAccessed (desc)
```

### Collection: `analyticsConsumers`

Per-consumer (API key) lifetime statistics:

```javascript
{
  apiKey: "ak_live_abc123",           // API key ID
  totalRequests: 12345,                // Lifetime total
  successfulRequests: 12123,           // Successful
  failedRequests: 222,                 // Failed
  totalResponseTime: 1543210,          // Sum of response times
  avgResponseTime: 125.0,              // Average response time
  endpoints: {                         // Endpoint usage
    "/api/services": 5678,
    "/api/vendors": 3456,
    ...
  },
  statusCodes: {                       // Status code breakdown
    "200": 11234,
    "400": 123,
    "500": 99
  },
  lastRequest: Timestamp,              // Last request time
  firstRequest: Timestamp              // First request time
}
```

**Document ID:** API key ID

**Indexes Required:**
```
- totalRequests (desc)
- avgResponseTime (desc)
- lastRequest (desc)
```

## API Endpoints

All analytics endpoints require Firebase authentication with admin privileges.

### 1. GET /api/analytics/overview

Get high-level overview metrics.

**Query Parameters:**
- `period` (optional): `1h`, `24h`, `7d`, `30d`, `90d` (default: `24h`)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/overview?period=7d" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-10-19T00:00:00.000Z",
      "end": "2025-10-26T00:00:00.000Z"
    },
    "metrics": {
      "totalRequests": 125430,
      "successfulRequests": 122145,
      "failedRequests": 3285,
      "errorRate": "2.62",
      "avgResponseTime": 142,
      "statusCodes": {
        "200": 98765,
        "201": 12345,
        "400": 1234,
        "404": 987,
        "500": 1064
      },
      "methods": {
        "GET": 89234,
        "POST": 23456,
        "PUT": 8765,
        "DELETE": 3975
      },
      "versions": {
        "v1": 112345,
        "v2": 13085
      }
    }
  }
}
```

### 2. GET /api/analytics/timeseries

Get time-series data for charting.

**Query Parameters:**
- `period` (optional): `1h`, `24h`, `7d`, `30d`, `90d` (default: `24h`)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `granularity` (optional): `hour`, `day` (default: `hour`)

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/timeseries?period=24h&granularity=hour" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-10-25T14:00:00.000Z",
      "end": "2025-10-26T14:00:00.000Z"
    },
    "granularity": "hour",
    "series": [
      {
        "period": "2025-10-25-14",
        "date": "2025-10-25T14:00:00.000Z",
        "totalRequests": 1523,
        "successfulRequests": 1489,
        "failedRequests": 34,
        "avgResponseTime": 125.24,
        "errorRate": "2.23"
      },
      {
        "period": "2025-10-25-15",
        "date": "2025-10-25T15:00:00.000Z",
        "totalRequests": 1678,
        "successfulRequests": 1642,
        "failedRequests": 36,
        "avgResponseTime": 132.56,
        "errorRate": "2.15"
      }
      // ... more hours
    ]
  }
}
```

**Use Case:** Generate line charts showing request volume, error rate, or response time trends over time.

### 3. GET /api/analytics/endpoints

Get per-endpoint statistics (top endpoints).

**Query Parameters:**
- `limit` (optional): Number of top endpoints (default: `20`)
- `sortBy` (optional): `totalRequests`, `avgResponseTime`, `errorRate` (default: `totalRequests`)

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/endpoints?limit=10&sortBy=totalRequests" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "endpoints": [
      {
        "endpoint": "/api/services",
        "method": "GET",
        "totalRequests": 45234,
        "successfulRequests": 44987,
        "failedRequests": 247,
        "errorRate": "0.55",
        "avgResponseTime": 125,
        "minResponseTime": 12,
        "maxResponseTime": 3421,
        "lastAccessed": "2025-10-26T14:23:45.000Z"
      },
      {
        "endpoint": "/api/vendors",
        "method": "GET",
        "totalRequests": 32145,
        "successfulRequests": 31876,
        "failedRequests": 269,
        "errorRate": "0.84",
        "avgResponseTime": 98,
        "minResponseTime": 8,
        "maxResponseTime": 2567,
        "lastAccessed": "2025-10-26T14:22:12.000Z"
      }
      // ... more endpoints
    ],
    "total": 10
  }
}
```

**Use Case:** Identify most popular endpoints, slowest endpoints, or endpoints with high error rates.

### 4. GET /api/analytics/consumers

Get per-consumer (API key) statistics.

**Query Parameters:**
- `limit` (optional): Number of top consumers (default: `20`)
- `sortBy` (optional): `totalRequests`, `avgResponseTime`, `errorRate` (default: `totalRequests`)

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/consumers?limit=5" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "consumers": [
      {
        "apiKey": "ak_live_abc123",
        "name": "My Mobile App",
        "tier": "premium",
        "totalRequests": 12345,
        "successfulRequests": 12123,
        "failedRequests": 222,
        "errorRate": "1.80",
        "avgResponseTime": 125,
        "topEndpoints": [
          { "key": "/api/services", "count": 5678 },
          { "key": "/api/vendors", "count": 3456 },
          { "key": "/api/subscriptions", "count": 2111 }
        ],
        "lastRequest": "2025-10-26T14:23:45.000Z"
      }
      // ... more consumers
    ],
    "total": 5
  }
}
```

**Use Case:** Identify top API consumers, track individual app usage, monitor rate limit consumption.

### 5. GET /api/analytics/geographic

Get geographic distribution of requests (based on IP addresses).

**Query Parameters:**
- `period` (optional): `1h`, `24h`, `7d`, `30d`, `90d` (default: `24h`)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/geographic?period=7d" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-10-19T00:00:00.000Z",
      "end": "2025-10-26T00:00:00.000Z"
    },
    "distribution": [
      {
        "ip": "192.168.1.100",
        "count": 12345
      },
      {
        "ip": "10.0.0.50",
        "count": 9876
      }
      // ... more IPs (top 20)
    ]
  }
}
```

**Note:** This currently returns IP addresses. In production, integrate with IP geolocation service (MaxMind, ipapi, etc.) to return country/region/city data.

### 6. GET /api/analytics/errors

Get recent error details for debugging.

**Query Parameters:**
- `period` (optional): `1h`, `24h`, `7d`, `30d` (default: `24h`)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of errors (default: `50`, max: `500`)

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/errors?limit=10" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-10-25T14:00:00.000Z",
      "end": "2025-10-26T14:00:00.000Z"
    },
    "errors": [
      {
        "timestamp": "2025-10-26T14:15:23.000Z",
        "endpoint": "/api/services/:id",
        "method": "GET",
        "statusCode": 404,
        "responseTime": 45,
        "error": {
          "message": "Service not found",
          "code": "NOT_FOUND"
        },
        "apiKey": "ak_live_abc123",
        "userId": null
      }
      // ... more errors
    ],
    "total": 10
  }
}
```

**Use Case:** Debug failing API calls, identify common error patterns, track error spikes.

### 7. GET /api/analytics/health

Get system health score and status.

**Query Parameters:**
- `period` (optional): `1h`, `24h`, `7d`, `30d` (default: `24h`)

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/health" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "score": 92,
    "metrics": {
      "errorRate": "1.25",
      "avgResponseTime": 145,
      "totalRequests": 125430
    },
    "period": {
      "start": "2025-10-25T14:00:00.000Z",
      "end": "2025-10-26T14:00:00.000Z"
    }
  }
}
```

**Health Status:**
- `healthy` (score 90-100): Low error rate, fast responses
- `warning` (score 70-89): Slightly elevated errors or slow responses
- `degraded` (score 50-69): High error rate or very slow responses
- `critical` (score 0-49): System in distress

**Scoring:**
- Base score: 100
- Error rate penalties:
  - > 10%: -30 points
  - > 5%: -20 points
  - > 1%: -10 points
- Response time penalties:
  - > 5000ms: -30 points
  - > 2000ms: -20 points
  - > 1000ms: -10 points

### 8. GET /api/analytics/export

Export analytics data as CSV.

**Query Parameters:**
- `type` (required): `overview`, `endpoints`, `consumers`, `errors`
- `period` (optional): `1h`, `24h`, `7d`, `30d`, `90d` (default: `24h`)

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/export?type=endpoints&period=7d" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  --output analytics-endpoints.csv
```

**Example CSV (endpoints):**
```csv
Endpoint,Method,Total Requests,Successful,Failed,Error Rate,Avg Response Time,Min,Max,Last Accessed
/api/services,GET,45234,44987,247,0.55,125,12,3421,2025-10-26T14:23:45.000Z
/api/vendors,GET,32145,31876,269,0.84,98,8,2567,2025-10-26T14:22:12.000Z
```

**Available Export Types:**
- `overview`: Time-series data (period, date, requests, errors, response times)
- `endpoints`: Endpoint statistics
- `consumers`: Consumer (API key) statistics
- `errors`: Recent error details

### 9. POST /api/analytics/cleanup

Cleanup old analytics data (admin maintenance).

**Request Body:**
```json
{
  "daysToKeep": 90
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/analytics/cleanup" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 90}'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Cleaned up analytics data older than 90 days",
  "data": {
    "deletedRecords": 15234
  }
}
```

**Note:** This only deletes individual request logs from `apiRequests` collection. Aggregated data (hourly/daily/endpoint/consumer) is retained indefinitely.

**Recommended Schedule:** Run weekly or monthly to manage Firestore storage costs.

## Dashboard Integration

### Recommended Visualizations

#### 1. **Overview Dashboard**
- **Total Requests** (card with sparkline)
- **Error Rate** (gauge chart)
- **Avg Response Time** (card with sparkline)
- **Request Volume Over Time** (line chart from `/timeseries`)
- **Status Code Distribution** (pie chart)
- **Top Endpoints** (bar chart from `/endpoints`)

#### 2. **Performance Dashboard**
- **Response Time Trends** (line chart from `/timeseries`)
- **Slowest Endpoints** (table from `/endpoints?sortBy=avgResponseTime`)
- **P50/P95/P99 Latencies** (requires additional aggregation)
- **Response Time Heatmap** (by hour of day)

#### 3. **Consumer Dashboard**
- **Top API Consumers** (table from `/consumers`)
- **Request Volume by Consumer** (bar chart)
- **Rate Limit Usage** (progress bars showing tier limits)
- **Consumer Activity Timeline** (from individual consumer data)

#### 4. **Error Analysis Dashboard**
- **Error Rate Over Time** (line chart from `/timeseries`)
- **Recent Errors** (table from `/errors`)
- **Error Distribution by Endpoint** (bar chart)
- **Error Distribution by Status Code** (pie chart)

#### 5. **Geographic Dashboard**
- **Request Distribution Map** (world map from `/geographic`)
- **Top Countries/Regions** (bar chart)
- **Latency by Region** (requires geolocation integration)

### Example: React Dashboard Component

```typescript
import React, { useState, useEffect } from 'react';
import { MarketplaceClient } from '@marketplace/sdk';

const AnalyticsDashboard: React.FC = () => {
  const [overview, setOverview] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const client = new MarketplaceClient({
    baseUrl: process.env.REACT_APP_API_URL,
    firebaseToken: '<YOUR_FIREBASE_TOKEN>'
  });

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [overviewData, seriesData] = await Promise.all([
          fetch('/api/analytics/overview?period=24h', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json()),
          fetch('/api/analytics/timeseries?period=24h', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json())
        ]);

        setOverview(overviewData.data.metrics);
        setTimeSeries(seriesData.data.series);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="analytics-dashboard">
      <h1>API Analytics</h1>
      
      {/* Overview Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Requests"
          value={overview.totalRequests.toLocaleString()}
          change="+12.5%"
        />
        <MetricCard
          title="Error Rate"
          value={`${overview.errorRate}%`}
          status={overview.errorRate < 1 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${overview.avgResponseTime}ms`}
          status={overview.avgResponseTime < 200 ? 'good' : 'warning'}
        />
      </div>

      {/* Time Series Chart */}
      <div className="chart-container">
        <h2>Request Volume Over Time</h2>
        <LineChart data={timeSeries} />
      </div>

      {/* More visualizations... */}
    </div>
  );
};
```

## Performance Considerations

### Write Performance

**Current Design:**
- Analytics recording is **non-blocking** (fire-and-forget)
- Uses Firestore transactions for atomic updates
- Aggregates are updated in parallel
- Failed analytics writes don't affect API responses

**Expected Write Volume:**
- 1 write to `apiRequests` per request
- 4 transactional updates per request (hourly, daily, endpoint, consumer)
- Total: ~5 writes per API request

**At Scale:**
- 1000 req/sec = 5000 writes/sec
- Use Firestore batch writes if hitting limits
- Consider switching to BigQuery for high-volume scenarios

### Query Performance

**Optimized for:**
- Time-range queries (indexed on `date` field)
- Sorting by common metrics (indexed)
- Limited result sets (default limits: 20-50)

**Recommendations:**
- Cache dashboard data (Redis/Memcached)
- Pre-compute daily summaries
- Use pagination for large result sets

### Storage Management

**Growth Rate:**
- Individual requests: ~500 bytes per request
- 1M requests/day = ~500MB/day = ~15GB/month
- Aggregated data: negligible (~1MB/day)

**Cleanup Strategy:**
- Retain individual requests: 90 days (default)
- Retain aggregated data: indefinitely
- Run cleanup monthly: `POST /api/analytics/cleanup`

**Cost Optimization:**
- Export old data to Cloud Storage/BigQuery
- Delete individual requests after aggregation
- Keep only aggregates for historical data

## Monitoring & Alerts

### Recommended Alerts

1. **High Error Rate**
   - Condition: Error rate > 5% for 15 minutes
   - Action: Page on-call engineer

2. **Slow Response Times**
   - Condition: Avg response time > 2000ms for 15 minutes
   - Action: Investigate performance

3. **Traffic Spike**
   - Condition: Requests > 2x normal for 5 minutes
   - Action: Check for DDoS or legitimate surge

4. **Consumer Anomaly**
   - Condition: Single API key exceeds 10x normal usage
   - Action: Check for abuse or bug

### Health Check Integration

```bash
# Monitor API health score
curl -X GET "https://api.example.com/api/analytics/health" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.status'

# Alert if status is not "healthy"
if [ "$STATUS" != "healthy" ]; then
  send_alert "API health degraded: $STATUS"
fi
```

## Best Practices

### 1. Dashboard Refresh Rates
- **Real-time metrics:** Refresh every 5-10 seconds
- **Hourly trends:** Refresh every 1-5 minutes
- **Daily reports:** Refresh on demand or every 15 minutes

### 2. Date Range Selection
- Default to last 24 hours for operational monitoring
- Use 7-day view for weekly trends
- Use 30-day view for monthly reporting
- Limit queries to 90 days max (performance)

### 3. Admin Access Control
- Analytics endpoints require Firebase auth + admin role
- Implement audit logging for analytics access
- Consider additional RBAC for sensitive data

### 4. Data Retention
- Keep individual requests: 30-90 days
- Keep aggregated data: indefinitely
- Export historical data to data warehouse
- Document retention policy

### 5. Privacy Considerations
- PII in request logs (user IDs, emails)
- IP address retention (GDPR compliance)
- Consider anonymization for long-term storage
- Implement data access controls

## Future Enhancements

### Phase 9: Developer Portal (Next)
- Self-service dashboard for API key holders
- Real-time usage graphs per API key
- Rate limit monitoring and alerts
- Billing integration (usage-based)

### Analytics v2 Features
- **Real-time streaming:** WebSocket updates for live dashboards
- **Predictive analytics:** ML-based anomaly detection
- **Custom metrics:** User-defined KPIs and alerts
- **Comparative analysis:** Week-over-week, month-over-month
- **Geographic insights:** IP geolocation integration
- **User journey tracking:** Multi-request session analysis
- **A/B testing support:** Version comparison analytics
- **Cost attribution:** Track costs per consumer/endpoint

### BigQuery Integration
- Stream data to BigQuery for advanced analytics
- SQL queries for complex analysis
- Data Studio dashboards
- Historical trend analysis (multi-year)

## Troubleshooting

### Analytics Data Not Recording

**Check:**
1. Analytics middleware is installed: `analyticsMiddleware` in `server.js`
2. Firestore collections exist and have proper indexes
3. Firebase Admin SDK is initialized
4. Check server logs for analytics errors

**Debug:**
```bash
# Check if middleware is active
grep "analyticsMiddleware" backend/server.js

# Check Firestore collections
firebase firestore:read apiRequests --limit 1

# Check for errors
tail -f backend/backend.log | grep -i analytics
```

### Slow Dashboard Loading

**Check:**
1. Date range is reasonable (< 90 days)
2. Firestore indexes are created
3. Result limits are set
4. Implement caching

**Optimize:**
```javascript
// Cache dashboard data in Redis
const cached = await redis.get('analytics:overview:24h');
if (cached) return JSON.parse(cached);

const data = await analyticsService.getOverview(startDate, endDate);
await redis.setex('analytics:overview:24h', 300, JSON.stringify(data)); // 5 min cache
```

### Missing Aggregated Data

**Check:**
1. Transactions are succeeding (check errors)
2. Firestore write limits not exceeded
3. Clock skew (date bucketing)

**Rebuild:**
```javascript
// Rebuild aggregates from individual requests (one-time script)
const requests = await db.collection('apiRequests')
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate)
  .get();

for (const doc of requests.docs) {
  const data = doc.data();
  await updateHourlyMetrics(data.timestamp.toDate(), data);
  await updateDailyMetrics(data.timestamp.toDate(), data);
}
```

## Conclusion

The API Analytics Dashboard provides comprehensive visibility into:
- ✅ **Usage Patterns** - Track request volume, popular endpoints
- ✅ **Performance** - Monitor response times, identify bottlenecks
- ✅ **Reliability** - Track error rates, debug failures
- ✅ **Consumers** - Understand who's using your API and how
- ✅ **Trends** - Historical data for capacity planning

This foundation enables data-driven decisions for API optimization, scaling, and monetization.

**Next:** Proceed with Phase 9 (Developer Portal) to provide self-service analytics to API consumers.
