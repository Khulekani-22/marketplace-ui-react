// backend/routes/health.js
import { Router } from "express";
import admin from "firebase-admin";
import { isRedisHealthy, getCacheStats } from "../services/cacheService.js";

const router = Router();

// Track start time
const startTime = Date.now();

/**
 * Liveness probe
 * Returns 200 if server is running
 * Used by load balancers / Kubernetes to know if container should be restarted
 */
router.get("/live", (_req, res) => {
  res.json({ 
    status: "alive", 
    timestamp: new Date().toISOString() 
  });
});

/**
 * Readiness probe
 * Returns 200 only if all dependencies are ready
 * Used by load balancers to know if instance can receive traffic
 */
router.get("/ready", async (_req, res) => {
  const checks = {
    firestore: await checkFirestore(),
    redis: await checkRedis(),
  };

  const allHealthy = Object.values(checks).every(check => check.healthy);
  const status = allHealthy ? "ready" : "not ready";
  const httpStatus = allHealthy ? 200 : 503;

  res.status(httpStatus).json({
    status,
    checks,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Detailed health status
 * Returns comprehensive system health information
 */
router.get("/status", async (_req, res) => {
  const checks = {
    firestore: await checkFirestore(),
    redis: await checkRedis(),
  };

  const allHealthy = Object.values(checks).every(check => check.healthy);
  const status = allHealthy ? "healthy" : (
    Object.values(checks).some(check => check.healthy) ? "degraded" : "unhealthy"
  );

  const uptime = Date.now() - startTime;
  const memory = process.memoryUsage();
  const cacheStats = await getCacheStats();

  res.json({
    status,
    uptime: {
      milliseconds: uptime,
      seconds: Math.floor(uptime / 1000),
      minutes: Math.floor(uptime / 60000),
      hours: Math.floor(uptime / 3600000),
      formatted: formatUptime(uptime),
    },
    memory: {
      heapUsed: formatBytes(memory.heapUsed),
      heapTotal: formatBytes(memory.heapTotal),
      rss: formatBytes(memory.rss),
      external: formatBytes(memory.external),
      arrayBuffers: formatBytes(memory.arrayBuffers || 0),
    },
    cache: cacheStats,
    checks,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "unknown",
    nodeVersion: process.version,
    pid: process.pid,
  });
});

/**
 * Basic health check (backward compatibility)
 */
router.get("/", (_req, res) => {
  res.json({ 
    status: "ok", 
    ts: new Date().toISOString() 
  });
});

// Health check helper functions

async function checkFirestore() {
  try {
    const db = admin.firestore();
    const testDoc = await db.collection("_health_check").doc("test").get();
    
    return {
      healthy: true,
      message: "Firestore connection successful",
      latency: null, // Could measure latency here
    };
  } catch (error) {
    return {
      healthy: false,
      message: error.message,
      error: error.code,
    };
  }
}

async function checkRedis() {
  try {
    const healthy = isRedisHealthy();
    
    if (!healthy) {
      return {
        healthy: false,
        message: "Redis is not available",
      };
    }

    return {
      healthy: true,
      message: "Redis connection successful",
    };
  } catch (error) {
    return {
      healthy: false,
      message: error.message,
      error: error.code,
    };
  }
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

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default router;
