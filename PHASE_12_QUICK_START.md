# Quick Start: Production Deployment with Phase 12

This guide will help you quickly deploy the API platform with Phase 12's production-ready infrastructure (Redis caching, PM2 load balancing, monitoring).

## Prerequisites

- Node.js 18+ installed
- Redis installed and running
- PM2 installed globally
- Git repository cloned

## Step-by-Step Setup

### 1. Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Verify Installation:**
```bash
redis-cli ping
# Should return: PONG
```

### 2. Install Dependencies

```bash
# Navigate to project root
cd /path/to/marketplace-ui-react

# Install backend dependencies
cd backend
npm install

# Install PM2 globally
npm install pm2 -g
```

### 3. Configure Environment

Create or update `.env` file in project root:

```bash
# Server Configuration
NODE_ENV=production
PORT=5055
HOST=0.0.0.0

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=            # Optional, leave empty for local dev

# PM2 Configuration
PM2_INSTANCES=max          # Use all CPU cores (or set specific number like "4")

# Firebase Configuration (existing)
# ... your Firebase credentials ...
```

### 4. Start with PM2 (Production Mode)

```bash
# From project root
pm2 start ecosystem.config.cjs --env production

# View process list
pm2 list

# Monitor in real-time
pm2 monit
```

**Expected Output:**
```
┌─────┬──────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┐
│ id  │ name             │ namespace   │ version │ mode    │ pid      │ uptime │
├─────┼──────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┤
│ 0   │ sloane-backend   │ default     │ 1.0.0   │ cluster │ 12345    │ 0s     │
│ 1   │ sloane-backend   │ default     │ 1.0.0   │ cluster │ 12346    │ 0s     │
│ 2   │ sloane-backend   │ default     │ 1.0.0   │ cluster │ 12347    │ 0s     │
│ 3   │ sloane-backend   │ default     │ 1.0.0   │ cluster │ 12348    │ 0s     │
│ ...  │ ...              │ ...         │ ...     │ ...     │ ...      │ ...    │
└─────┴──────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┘
```

### 5. Verify Deployment

**Check Health:**
```bash
# Liveness probe
curl http://localhost:5055/health/live

# Readiness probe
curl http://localhost:5055/health/ready

# Detailed status
curl http://localhost:5055/health/status | jq
```

**Check Cache:**
```bash
# Verify Redis connection
curl http://localhost:5055/health/status | jq '.cache'

# Should show:
# {
#   "healthy": true,
#   "keys": 0,
#   "stats": { ... }
# }
```

**Check Monitoring:**
```bash
# Performance stats
curl http://localhost:5055/api/monitoring/stats | jq

# Prometheus metrics
curl http://localhost:5055/api/monitoring/metrics
```

**Test API:**
```bash
# Make some requests
curl http://localhost:5055/api/services
curl http://localhost:5055/api/vendors

# Check cache hit rate
curl http://localhost:5055/api/monitoring/stats | jq '.cache.stats.hitRate'
```

### 6. Enable Auto-Start on Boot

```bash
# Generate startup script (run once)
pm2 startup

# Follow the instructions to run the generated command
# Example output:
# sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u yourusername --hp /home/yourusername

# Save current process list
pm2 save
```

Now PM2 will automatically start your API server when the system boots.

### 7. View Logs

```bash
# View all logs
pm2 logs

# View only sloane-backend logs
pm2 logs sloane-backend

# View last 100 lines
pm2 logs sloane-backend --lines 100

# View only errors
pm2 logs sloane-backend --err

# Flush logs
pm2 flush
```

## Common Operations

### Scale Workers

```bash
# Scale to 8 workers
pm2 scale sloane-backend 8

# Scale up by 2
pm2 scale sloane-backend +2

# Scale down by 2
pm2 scale sloane-backend -2
```

### Zero-Downtime Reload

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Reload without downtime
pm2 reload ecosystem.config.cjs --env production
```

### Restart All Workers

```bash
# Restart all instances
pm2 restart sloane-backend

# Restart with environment
pm2 restart ecosystem.config.cjs --env production
```

### Stop Server

```bash
# Stop all instances
pm2 stop sloane-backend

# Delete from PM2 process list
pm2 delete sloane-backend
```

## Monitoring Dashboard

### PM2 Real-Time Monitor

```bash
pm2 monit
```

**Keyboard shortcuts:**
- Arrow keys to navigate
- `q` to quit

### Application Metrics

Open in browser:
- **Health Status:** http://localhost:5055/health/status
- **Performance Stats:** http://localhost:5055/api/monitoring/stats
- **Recent Errors:** http://localhost:5055/api/monitoring/errors
- **Prometheus Metrics:** http://localhost:5055/api/monitoring/metrics

### Setup Prometheus + Grafana (Optional)

**1. Install Prometheus:**

Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'sloane-api'
    static_configs:
      - targets: ['localhost:5055']
    metrics_path: '/api/monitoring/metrics'
```

Start Prometheus:
```bash
docker run -d -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**2. Install Grafana:**
```bash
docker run -d -p 3000:3000 grafana/grafana
```

Open http://localhost:3000 (default credentials: admin/admin)

**3. Add Prometheus Data Source:**
- Configuration → Data Sources → Add data source
- Select Prometheus
- URL: http://localhost:9090
- Save & Test

**4. Create Dashboard:**
- Create → Dashboard → Add Panel
- Use PromQL queries:
  ```promql
  # Request rate
  rate(http_requests_total[5m])
  
  # Response time
  rate(http_request_duration_seconds_sum[5m]) / 
  rate(http_request_duration_seconds_count[5m])
  
  # Error rate
  sum(rate(http_requests_by_status{code=~"5.."}[5m])) / 
  sum(rate(http_requests_total[5m])) * 100
  
  # Cache hit rate
  cache_hit_rate
  ```

## Performance Testing

### Install Apache Bench

**macOS:**
```bash
# Already included with macOS
which ab
```

**Linux:**
```bash
sudo apt install apache2-utils
```

### Run Load Test

```bash
# 10,000 requests, 100 concurrent
ab -n 10000 -c 100 http://localhost:5055/api/services

# With keep-alive
ab -n 10000 -c 100 -k http://localhost:5055/api/services

# With custom headers
ab -n 10000 -c 100 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:5055/api/services
```

### Expected Results

With 8 workers and Redis caching:
```
Requests per second:    3500-4500 [#/sec]
Time per request:       22-28 [ms] (mean)
Failed requests:        0
Cache hit rate:         70-80%
```

## Troubleshooting

### Redis Not Connected

**Symptoms:** Cache always misses, health check shows Redis unhealthy

**Solutions:**
```bash
# Check Redis is running
redis-cli ping

# Check Redis port
netstat -an | grep 6379

# Restart Redis
brew services restart redis  # macOS
sudo systemctl restart redis # Linux

# Check logs
pm2 logs sloane-backend | grep Redis
```

### High Memory Usage

**Symptoms:** PM2 restarting workers frequently

**Solutions:**
```bash
# Check memory usage
pm2 list

# Increase memory limit in ecosystem.config.cjs:
max_memory_restart: '2G'

# Clear Redis cache
redis-cli FLUSHDB

# Restart with new config
pm2 reload ecosystem.config.cjs
```

### Workers Not Starting

**Symptoms:** PM2 shows "errored" or "stopped" status

**Solutions:**
```bash
# Check logs for errors
pm2 logs sloane-backend --err

# Check if port is in use
lsof -i :5055

# Delete and restart
pm2 delete sloane-backend
pm2 start ecosystem.config.cjs --env production
```

### Circuit Breaker Open

**Symptoms:** Requests failing with "Circuit breaker is OPEN"

**Solutions:**
```bash
# Check circuit breaker status
curl http://localhost:5055/api/monitoring/stats | jq '.circuitBreakers'

# Check Firestore connection
curl http://localhost:5055/health/ready

# Wait for automatic recovery (60 seconds)
# Or restart to reset
pm2 restart sloane-backend
```

## Production Checklist

Before going to production, verify:

- [ ] Redis is running and accessible
- [ ] PM2 is configured with `exec_mode: 'cluster'`
- [ ] Environment variables are set correctly
- [ ] Health checks return 200 OK
- [ ] Cache hit rate is above 50%
- [ ] Circuit breakers are in CLOSED state
- [ ] Monitoring endpoints are accessible
- [ ] PM2 startup script is enabled
- [ ] Logs are being written correctly
- [ ] Load test shows expected performance
- [ ] Firestore connection is healthy
- [ ] Security headers are present
- [ ] Rate limiting is working

## Next Steps

1. **Set up monitoring alerts** - Configure Prometheus alerts for high error rates, circuit breaker opens, etc.
2. **Configure reverse proxy** - Set up nginx or HAProxy in front of PM2 for SSL/TLS
3. **Set up log aggregation** - Use ELK stack, Datadog, or CloudWatch for centralized logging
4. **Enable CDN** - Use CloudFront or Cloudflare for static assets
5. **Configure backups** - Regular Redis snapshots and Firestore backups
6. **Set up CI/CD** - Automate deployments with GitHub Actions or GitLab CI

## Resources

- **Phase 12 Documentation:** `PHASE_12_COMPLETE.md`
- **API Documentation:** `docs/API_DOCUMENTATION.md`
- **PM2 Documentation:** https://pm2.keymetrics.io/
- **Redis Documentation:** https://redis.io/documentation
- **Prometheus Documentation:** https://prometheus.io/docs/

## Support

If you encounter issues:
1. Check logs: `pm2 logs sloane-backend`
2. Check health: `curl http://localhost:5055/health/status`
3. Check monitoring: `curl http://localhost:5055/api/monitoring/stats`
4. Refer to troubleshooting section above
5. Check comprehensive guide in `PHASE_12_COMPLETE.md`

---

**Congratulations!** Your API platform is now running with production-grade infrastructure. 🎉
