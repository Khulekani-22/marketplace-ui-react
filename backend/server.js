// server.js (ESM)

import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";
import { promises as fsp } from "fs";

// Your existing routers & middleware
import healthRouter from "./routes/health.js";
import servicesRouter from "./routes/services.js";
import vendorsRouter from "./routes/vendors.js";
import startupsRouter from "./routes/startups.js";
import tenantsRouter from "./routes/tenants.js";
import subscriptionsRouter from "./routes/subscriptions.js";
import mentorshipRouter from "./routes/mentorship.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";
import paymentRoutes from "./routes/payments.js";
import { getData, saveData } from "./utils/hybridDataStore.js";
import auditLogsRouter from "./routes/auditLogs.js";
import assistantRouter from "./routes/assistant.js";
import messagesRouter from "./routes/messages.js";
import walletsRouter from "./routes/wallets.js";
import integrityRouter from "./routes/integrity.js";
import syncRouter from "./routes/sync.js";
import apiKeysRouter from "./routes/apiKeys.js";
import externalAppsRouter from "./routes/externalApps.js";
import versionsRouter from "./routes/versions.js";
import webhooksRouter from "./routes/webhooks.js";
import developerPortalRouter from "./routes/developerPortal.js";
import oauthRouter from "./routes/oauth.js";
import { apolloServer, setupWebSocketServer } from "./graphql/server.js";
import { tenantContext } from "./middleware/tenantContext.js";
import { jwtAuthOptional } from "./middleware/authJWT.js";
import { firebaseAuthRequired } from "./middleware/authFirebase.js";
import { requireAdmin } from "./middleware/isAdmin.js";
import { auditMutations } from "./middleware/audit.js";
import { dynamicCors, securityHeaders, apiResponseHeaders, initializeCors } from "./middleware/corsConfig.js";
import { apiKeyRateLimiter, rateLimitWarning } from "./middleware/apiKeyRateLimiter.js";
import { apiVersioning, versionTransform } from "./middleware/apiVersioning.js";
import { analyticsMiddleware, analyticsErrorHandler } from "./middleware/analyticsMiddleware.js";
import analyticsRouter from "./routes/analytics.js";
import monitoringRouter, { metricsMiddleware } from "./routes/monitoring.js";
import { initializeRedis } from "./services/cacheService.js";
import { cacheMiddleware, noCache } from "./middleware/cacheMiddleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Disable automatic ETag generation so dynamic responses (like subscriptions)
// are never served with a 304 that strips the JSON body Vercel users expect.
app.set("etag", false);
// Attach payment routes (serverless-compatible)
app.use("/api/payments", paymentRoutes);
const DEFAULT_PORT = 5055;
const PORT = Number(process.env.PORT || DEFAULT_PORT);

let initPromise = null;
let serverPromise = null;
let replicatorStarted = false;

/* ------------------------ Core security & parsing ------------------------ */
app.use(helmet());
app.use(express.json({ limit: "20mb" })); // checkpoints can be large

// Enhanced CORS configuration with dynamic origin validation
app.use(dynamicCors());

// Security headers (HSTS, CSP, X-Frame-Options, etc.)
app.use(securityHeaders());

// API response headers (version, timestamps, etc.)
app.use(apiResponseHeaders());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* -------- API Versioning -------- */
app.use(apiVersioning());
app.use(versionTransform());

/* -------- Attach tenant and (optional) user to each request globally ----- */
app.use(tenantContext);
app.use(jwtAuthOptional);

// API Key rate limiting (applies after API key auth)
app.use(apiKeyRateLimiter());
app.use(rateLimitWarning());

// Metrics tracking (should be early to track all requests)
app.use(metricsMiddleware());

// Cache middleware for GET requests (applies to all routes)
app.use(cacheMiddleware({
  ttl: 300, // 5 minutes
  skip: (req) => {
    // Skip caching for authenticated requests
    if (req.user || req.headers.authorization) return true;
    // Skip caching for admin/auth endpoints
    if (req.path.startsWith('/api/admin')) return true;
    if (req.path.startsWith('/api/auth')) return true;
    if (req.path.startsWith('/api/oauth')) return true;
    if (req.path.startsWith('/api/me')) return true;
    return false;
  }
}));

// Analytics tracking (records all API requests)
app.use(analyticsMiddleware);

// Audit mutating requests (POST/PUT/PATCH/DELETE)
app.use(auditMutations);

/* -------------------------- Authenticated identity ---------------------- */
app.get("/api/me", firebaseAuthRequired, async (req, res) => {
  try {
    // Look up user role from Firestore
    const data = await getData();
    const users = Array.isArray(data?.users) ? data.users : [];
    const userEmail = req.user.email?.toLowerCase();
    
    // Find user in the database
    let userRole = "member"; // default
    let userTenantId = "vendor"; // default
    
    const foundUser = users.find(u => u?.email?.toLowerCase() === userEmail);
    if (foundUser) {
      userRole = foundUser.role || "member";
      userTenantId = foundUser.tenantId || "vendor";
    }
    
    // Normalize tenant (convert "public" to "vendor")
    if (userTenantId === "public") userTenantId = "vendor";
    
    console.log("📋 /api/me - User lookup:", {
      email: userEmail,
      foundInDB: !!foundUser,
      role: userRole,
      tenantId: userTenantId,
      foundUserData: foundUser,
      requestTenant: req.tenant?.id
    });
    
    res.json({
      uid: req.user.uid,
      email: req.user.email,
      role: userRole,
      tenantId: userTenantId
    });
  } catch (error) {
    console.error("❌ /api/me error:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to get user info" 
    });
  }
});

/* ============================ LMS storage =============================== */

const SECRET_DIR = path.resolve(__dirname, "secrets");
const SNAPSHOT_DIR = path.join(SECRET_DIR, "lms_snapshots");
const INDEX_FILE = path.join(SECRET_DIR, "lms_checkpoints.json");
const MAX_KEEP = 50;

// Canonical store prefers backend/appData.json; replicate to src/data/appData.json as fallback
const APP_DATA_BACKEND = path.resolve(__dirname, "appData.json");
const APP_DATA_SRC = path.resolve(__dirname, "../src/data/appData.json");
const APP_DATA = APP_DATA_BACKEND;

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function ensureFile(p, defaultContent) {
  try {
    await fsp.access(p);
  } catch {
    await fsp.writeFile(p, defaultContent);
  }
}

async function readJson(p) {
  const full = path.resolve(p);
  try {
    const txt = await fsp.readFile(full, "utf8");
    return JSON.parse(txt);
  } catch (e) {
    // If the primary appData.json is unreadable or invalid, fall back to src/data/appData.json
    const isAppData = full === APP_DATA;
    const code = e && typeof e === 'object' ? e.code : undefined;
    const parseErr = e instanceof SyntaxError || /JSON/.test(String(e?.message || ""));
    const readErr = code === 'ENOENT' || code === 'EISDIR' || code === 'EPERM';
    if (isAppData && (parseErr || readErr)) {
      try {
        const txt2 = await fsp.readFile(APP_DATA_SRC, "utf8");
        const json2 = JSON.parse(txt2);
        console.warn("[LMS] Falling back to src/data/appData.json due to invalid backend/appData.json");
        return json2;
      } catch (e2) {
        // fall through and rethrow the original error
      }
    }
    throw e;
  }
}

async function writeJson(p, data) {
  await fsp.writeFile(p, JSON.stringify(data, null, 2));
}

async function replicateToSrc(data) {
  try {
    // Ensure directory exists
    await fsp.mkdir(path.dirname(APP_DATA_SRC), { recursive: true });
    await writeJson(APP_DATA_SRC, data);
  } catch (e) {
    console.warn("[LMS] Failed to replicate appData to src/data:", e?.message || e);
  }
}

function uid() {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)
  );
}

function isPlainObject(x) {
  return x && typeof x === "object" && !Array.isArray(x);
}

function summarize(appData) {
  const cohorts = Array.isArray(appData?.cohorts) ? appData.cohorts.length : 0;
  const courses =
    appData?.cohorts?.reduce(
      (n, c) => n + (Array.isArray(c.courses) ? c.courses.length : 0),
      0
    ) ?? 0;
  const lessons =
    appData?.cohorts?.reduce(
      (n, c) =>
        n +
        (Array.isArray(c.courses)
          ? c.courses.reduce(
              (m, crs) => m + (Array.isArray(crs.lessons) ? crs.lessons.length : 0),
              0
            )
          : 0),
      0
    ) ?? 0;
  return { cohorts, courses, lessons };
}

function withDeltas(items) {
  return items.map((ck, i) => {
    const prev = items[i + 1];
    if (!prev) return { ...ck, delta: { cohorts: 0, courses: 0, lessons: 0 } };
    return {
      ...ck,
      delta: {
        cohorts: ck.counts.cohorts - prev.counts.cohorts,
        courses: ck.counts.courses - prev.counts.courses,
        lessons: ck.counts.lessons - prev.counts.lessons,
      },
    };
  });
}

async function initLmsStorage() {
  await ensureDir(SECRET_DIR);
  await ensureDir(SNAPSHOT_DIR);
  await ensureFile(INDEX_FILE, "[]");

  // Make sure appData.json exists
  try {
    await fsp.access(APP_DATA);
  } catch {
    const empty = {
      cohorts: [],
      bookings: [],
      events: [],
      forumThreads: [],
      jobs: [],
      mentorshipSessions: [],
      messageThreads: [],
      services: [],
      leads: [],
      startups: [],
      wallets: [],
    };
    // Initialize Firestore with empty data structure if needed
    await saveData(empty);
  }

  // Normalize critical fields so reads/writes agree across the app
  try {
    const data = await getData();
    let changed = false;
    const asArray = (x) => (Array.isArray(x) ? x : []);
    data.services = asArray(data.services).map((s) => {
      const orig = s;
      const id = String(s.id ?? s.vendorId ?? "");
      const reviews = Array.isArray(s.reviews) ? s.reviews : [];
      const rc = typeof s.reviewCount === "number" ? s.reviewCount : reviews.length;
      const rating = typeof s.rating === "number" ? s.rating : 0;
      const tenantId = s.tenantId ?? "public";
      const norm = { ...s, id, reviews, reviewCount: rc, rating, tenantId };
      if (JSON.stringify(orig) !== JSON.stringify(norm)) changed = true;
      return norm;
    });
    data.vendors = asArray(data.vendors).map((v) => {
      const orig = v;
      const id = String(v.id ?? v.vendorId ?? "");
      const tenantId = v.tenantId ?? "public";
      const contactEmail = (v.contactEmail || v.email || "").toLowerCase();
      const norm = { ...v, id, tenantId, contactEmail };
      if (JSON.stringify(orig) !== JSON.stringify(norm)) changed = true;
      return norm;
    });
    data.startups = asArray(data.startups).map((v) => {
      const orig = v;
      const id = String(v.id ?? v.vendorId ?? "");
      const tenantId = v.tenantId ?? "public";
      const contactEmail = (v.contactEmail || v.email || "").toLowerCase();
      const norm = { ...v, id, tenantId, contactEmail };
      if (JSON.stringify(orig) !== JSON.stringify(norm)) changed = true;
      return norm;
    });
    if (changed) await saveData(data);
  } catch {}
}

/* ------------------------------- LMS routes ------------------------------ */

const lmsRouter = express.Router();

// Read live data from Firestore (not from appData.json file)
lmsRouter.get("/live", async (_req, res, next) => {
  try {
    // Use getData() which reads from Firestore via hybridDataStore
    const json = await getData();
    res.set("Cache-Control", "no-store");
    res.json(json);
  } catch (e) {
    next(e);
  }
});

// Publish working copy to live (PUT from UI)
lmsRouter.put("/publish", firebaseAuthRequired, requireAdmin, async (req, res, next) => {
  try {
    const { data } = req.body || {};
    if (!isPlainObject(data))
      return res.status(400).json({ error: "Body must be { data: <object> }" });

    // Preserve security-critical tables (users) and merge tenants instead of overwriting
    let existing = {};
    try { existing = await getData(); } catch {}

    const merged = { ...existing, ...data };
    // Always keep existing users (role assignments) from the server
    merged.users = Array.isArray(existing?.users) ? existing.users : [];
    // Tenants: merge by id
    const exTen = Array.isArray(existing?.tenants) ? existing.tenants : [];
    const newTen = Array.isArray(data?.tenants) ? data.tenants : [];
    const tenMap = new Map();
    [...exTen, ...newTen].forEach((t) => {
      if (!t) return; const id = t.id || t; const name = t.name || t;
      if (id) tenMap.set(id, { id, name });
    });
    merged.tenants = Array.from(tenMap.values());

    await saveData(merged);
    // also replicate to src/data for front-end fallback
    await replicateToSrc(merged);
    const counts = summarize(merged);
    console.log(
      `[LMS] Published live data to Firestore -> cohorts:${counts.cohorts}, courses:${counts.courses}, lessons:${counts.lessons}, services:${counts.services || 0}`
    );
    res.json({ ok: true, counts });
  } catch (e) {
    next(e);
  }
});

// List checkpoints (latest first, with deltas)
lmsRouter.get("/checkpoints", firebaseAuthRequired, requireAdmin, async (_req, res, next) => {
  try {
    const index = (await readJson(INDEX_FILE)).sort((a, b) => b.ts - a.ts);
    res.json({ items: withDeltas(index) });
  } catch (e) {
    next(e);
  }
});

// Save checkpoint
lmsRouter.post("/checkpoints", firebaseAuthRequired, requireAdmin, async (req, res, next) => {
  try {
    const { message = "", data } = req.body || {};
    if (!isPlainObject(data))
      return res.status(400).json({ error: "Missing or invalid 'data' JSON." });

    const id = uid();
    const ts = Date.now();
    const counts = summarize(data);

    const snapPath = path.join(SNAPSHOT_DIR, `${id}.json`);
    await writeJson(snapPath, data);

    const index = await readJson(INDEX_FILE);
    index.unshift({ id, ts, message, counts });

    // Trim to MAX_KEEP (delete old snapshot files)
    const keep = index.slice(0, MAX_KEEP);
    const drop = index.slice(MAX_KEEP);
    await Promise.all(
      drop.map((ck) =>
        fsp.unlink(path.join(SNAPSHOT_DIR, `${ck.id}.json`)).catch(() => void 0)
      )
    );
    await writeJson(INDEX_FILE, keep);

    console.log(
      `[LMS] Checkpoint saved id=${id} | ${message || "(no message)"}`
    );
    res.json({ ok: true, id, ts, counts });
  } catch (e) {
    console.error("[LMS] Failed to save checkpoint:", e);
    next(e);
  }
});

// Download one checkpoint
lmsRouter.get("/checkpoints/:id", firebaseAuthRequired, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const snapPath = path.join(SNAPSHOT_DIR, `${id}.json`);
    if (!fs.existsSync(snapPath))
      return res.status(404).json({ error: "Snapshot not found" });

    const data = await readJson(snapPath);
    const meta =
      (await readJson(INDEX_FILE)).find((c) => c.id === id) ||
      { id, ts: null, message: "", counts: summarize(data) };

    res.json({ ...meta, data });
  } catch (e) {
    next(e);
  }
});

// Restore a checkpoint to live
lmsRouter.post("/restore/:id", firebaseAuthRequired, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const snapPath = path.join(SNAPSHOT_DIR, `${id}.json`);
    if (!fs.existsSync(snapPath))
      return res.status(404).json({ error: "Snapshot not found" });

    const snapData = await readJson(snapPath);
    let existing = {};
    try { existing = await getData(); } catch {}

    const merged = { ...existing, ...snapData };
    // Preserve server users; merge tenants
    merged.users = Array.isArray(existing?.users) ? existing.users : [];
    const exTen = Array.isArray(existing?.tenants) ? existing.tenants : [];
    const newTen = Array.isArray(snapData?.tenants) ? snapData.tenants : [];
    const tenMap = new Map();
    [...exTen, ...newTen].forEach((t) => {
      if (!t) return; const id2 = t.id || t; const name = t.name || t;
      if (id2) tenMap.set(id2, { id: id2, name });
    });
    merged.tenants = Array.from(tenMap.values());

    await saveData(merged);
    await replicateToSrc(merged);
    console.log(`[LMS] Restored checkpoint id=${id} -> Firestore (preserved users + tenants)`);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Clear history (admin)
lmsRouter.delete("/checkpoints", firebaseAuthRequired, requireAdmin, async (_req, res, next) => {
  try {
    const index = await readJson(INDEX_FILE);
    await Promise.all(
      index.map((ck) =>
        fsp.unlink(path.join(SNAPSHOT_DIR, `${ck.id}.json`)).catch(() => void 0)
      )
    );
    await writeJson(INDEX_FILE, []);
    console.log("[LMS] Cleared all checkpoints");
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.use("/api/lms", lmsRouter);

/* --------------------------------- Other APIs ----------------------------- */
app.use("/api/health", healthRouter);
app.use("/api/versions", versionsRouter);
app.use("/api/mentorship", mentorshipRouter);
app.use("/api/data/services", servicesRouter);
app.use("/api/data/vendors", vendorsRouter);
app.use("/api/data/startups", startupsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/wallets", walletsRouter);
app.use("/api/integrity", integrityRouter);
app.use("/api/sync", syncRouter);
app.use("/api/api-keys", apiKeysRouter);
app.use("/api/external-apps", externalAppsRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/developer", developerPortalRouter);
app.use("/api/oauth", oauthRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/monitoring", monitoringRouter);
app.use("/health", healthRouter);

/* --------------------------------- 404 ----------------------------------- */
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

/* ------------------------------ Error handler ---------------------------- */
// Analytics error handler (records errors in analytics)
app.use(analyticsErrorHandler);

app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res
    .status(err.status || 500)
    .json({ status: "error", message: err.message || "Server error" });
});

/* --------------------------------- Start --------------------------------- */
async function listenWithPort(port) {
  const HOST = process.env.HOST || "127.0.0.1";
  return new Promise(async (resolve, reject) => {
    // Initialize Redis cache service
    console.log('[Server] Initializing Redis cache...');
    await initializeRedis();
    
    // Start Apollo Server
    await apolloServer.start();
    
    // Apply Apollo middleware to Express
    apolloServer.applyMiddleware({
      app,
      path: '/graphql',
      cors: false, // We handle CORS ourselves
    });

    const httpServer = app
      .listen(port, HOST, () => {
        const hostLabel = HOST === "0.0.0.0" ? "localhost" : HOST;
        console.log(`SCDM backend running on http://${hostLabel}:${port}`);
        console.log(`GraphQL endpoint: http://${hostLabel}:${port}/graphql`);
        console.log(`GraphQL Playground: http://${hostLabel}:${port}/graphql`);
        console.log(`Health Check: http://${hostLabel}:${port}/health/status`);
        console.log(`Monitoring: http://${hostLabel}:${port}/api/monitoring/stats`);
        console.log(`Live appData.json: ${APP_DATA}`);
        console.log(`Snapshots dir:     ${SNAPSHOT_DIR}`);
        
        // Setup WebSocket server for GraphQL subscriptions
        setupWebSocketServer(httpServer);
        console.log(`GraphQL Subscriptions (WebSocket): ws://${hostLabel}:${port}/graphql`);
        
        resolve(httpServer);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      await initLmsStorage();
      // Initialize CORS configuration
      await initializeCors();
      return true;
    })();
  }
  return initPromise;
}

function startAppDataReplicator() {
  if (replicatorStarted) return;
  const TARGET = APP_DATA_SRC;
  if (!TARGET || TARGET === APP_DATA) {
    return;
  }
  replicatorStarted = true;
  let lastMtime = 0;
  async function tick() {
    try {
      const st = await fsp.stat(APP_DATA);
      const mt = st.mtimeMs || st.mtime?.getTime?.() || 0;
      if (mt > lastMtime) {
        await fsp.mkdir(path.dirname(TARGET), { recursive: true });
        const content = await fsp.readFile(APP_DATA, "utf8");
        await fsp.writeFile(TARGET + ".tmp", content, "utf8");
        await fsp.rename(TARGET + ".tmp", TARGET);
        lastMtime = mt;
        console.log(`[Replicator] appData.json -> src/data replicated at ${new Date().toISOString()}`);
      }
    } catch (e) {
      console.warn("[Replicator] Failed to replicate appData:", e?.message || e);
    }
  }
  tick();
  setInterval(tick, 60 * 1000);
}

export async function startServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      await ensureInitialized();
      startAppDataReplicator();

      const tried = new Set();
      const ports = [PORT, 5001, 5500].filter((p, i, arr) => arr.indexOf(p) === i);
      for (const p of ports) {
        try {
          if (tried.has(p)) continue;
          const instance = await listenWithPort(p);
          return instance;
        } catch (err) {
          tried.add(p);
          if (err?.code === "EADDRINUSE") {
            console.warn(`Port ${p} in use. Trying next...`);
            continue;
          }
          throw err;
        }
      }
      throw new Error("No available port among [5055, 5001, 5500]");
    })().catch((error) => {
      serverPromise = null;
      throw error;
    });
  }
  return serverPromise;
}

export async function ensureBackendReady() {
  await ensureInitialized();
}

const executedFile = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (executedFile && executedFile === import.meta.url) {
  startServer().catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
}

export { app };
export default app;
