// server.js (ESM)

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { promises as fsp } from "fs";

// Your existing routers & middleware
import healthRouter from "./routes/health.js";
import servicesRouter from "./routes/services.js";
import vendorsRouter from "./routes/vendors.js";
import startupsRouter from "./routes/startups.js";
import tenantsRouter from "./routes/tenants.js";
import subscriptionsRouter from "./routes/subscriptions.js";
import usersRouter from "./routes/users.js";
import auditLogsRouter from "./routes/auditLogs.js";
import assistantRouter from "./routes/assistant.js";
import messagesRouter from "./routes/messages.js";
import walletsRouter from "./routes/wallets.js";
import { tenantContext } from "./middleware/tenantContext.js";
import { jwtAuthOptional } from "./middleware/authJWT.js";
import { firebaseAuthRequired } from "./middleware/authFirebase.js";
import { requireAdmin } from "./middleware/isAdmin.js";
import { auditMutations } from "./middleware/audit.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DEFAULT_PORT = 5000;
const PORT = Number(process.env.PORT || DEFAULT_PORT);

/* ------------------------ Core security & parsing ------------------------ */
app.use(helmet());
app.use(express.json({ limit: "20mb" })); // checkpoints can be large
// CORS: echo a concrete origin to satisfy browsers when credentials are used
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const ENV_ORIGINS = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOW_ORIGINS = Array.from(new Set([...ENV_ORIGINS, ...DEFAULT_ORIGINS]));
app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser or same-origin requests (no origin header)
      if (!origin) return callback(null, true);
      if (ALLOW_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* -------- Attach tenant and (optional) user to each request globally ----- */
app.use(tenantContext);
app.use(jwtAuthOptional);
// Audit mutating requests (POST/PUT/PATCH/DELETE)
app.use(auditMutations);

/* -------------------------- Authenticated identity ---------------------- */
app.get("/api/me", firebaseAuthRequired, (req, res) => res.json(req.user));

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
    await writeJson(APP_DATA, empty);
  }

  // Normalize critical fields so reads/writes agree across the app
  try {
    const data = await readJson(APP_DATA);
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
    if (changed) await writeJson(APP_DATA, data);
  } catch {}
}

/* ------------------------------- LMS routes ------------------------------ */

const lmsRouter = express.Router();

// Read live appData.json
lmsRouter.get("/live", async (_req, res, next) => {
  try {
    const json = await readJson(APP_DATA);
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
    try { existing = await readJson(APP_DATA); } catch {}

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

    await writeJson(APP_DATA, merged);
    // also replicate to src/data for front-end fallback
    await replicateToSrc(merged);
    const counts = summarize(merged);
    console.log(
      `[LMS] Published live appData.json -> cohorts:${counts.cohorts}, courses:${counts.courses}, lessons:${counts.lessons}`
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
    try { existing = await readJson(APP_DATA); } catch {}

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

    await writeJson(APP_DATA, merged);
    await replicateToSrc(merged);
    console.log(`[LMS] Restored checkpoint id=${id} -> live (preserved users + tenants)`);
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
app.use("/api/data/services", servicesRouter);
app.use("/api/data/vendors", vendorsRouter);
app.use("/api/data/startups", startupsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/users", usersRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/wallets", walletsRouter);

/* --------------------------------- 404 ----------------------------------- */
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

/* ------------------------------ Error handler ---------------------------- */
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res
    .status(err.status || 500)
    .json({ status: "error", message: err.message || "Server error" });
});

/* --------------------------------- Start --------------------------------- */
async function listenWithPort(port) {
  const HOST = process.env.HOST || "127.0.0.1";
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, HOST, () => {
        const hostLabel = HOST === "0.0.0.0" ? "localhost" : HOST;
        console.log(`SCDM backend running on http://${hostLabel}:${port}`);
        console.log(`Live appData.json: ${APP_DATA}`);
        console.log(`Snapshots dir:     ${SNAPSHOT_DIR}`);
        resolve(server);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

(async function start() {
  try {
    await initLmsStorage();
    // Start background replicator from backend/appData.json -> src/data/appData.json every 1 minute
    (function startAppDataReplicator() {
      const TARGET = APP_DATA_SRC;
      if (!TARGET || TARGET === APP_DATA) {
        // Nothing to replicate to or same file path; skip.
        return;
      }
      let lastMtime = 0;
      async function tick() {
        try {
          const st = await fsp.stat(APP_DATA);
          const mt = st.mtimeMs || st.mtime?.getTime?.() || 0;
          if (mt > lastMtime) {
            // Ensure destination directory exists
            await fsp.mkdir(path.dirname(TARGET), { recursive: true });
            // Copy bytes atomically via temp file then rename
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
      // Kick once immediately, then every minute
      tick();
      setInterval(tick, 60 * 1000);
    })();
    // Try ports in order: requested/5000, then 5001, then 5500
    const tried = new Set();
    const ports = [PORT, 5001, 5500].filter((p, i, arr) => arr.indexOf(p) === i);
    let started = false;
    for (const p of ports) {
      try {
        if (tried.has(p)) continue;
        await listenWithPort(p);
        started = true;
        break;
      } catch (err) {
        tried.add(p);
        if (err?.code === "EADDRINUSE") {
          console.warn(`Port ${p} in use. Trying next...`);
          continue;
        }
        throw err;
      }
    }
    if (!started) throw new Error("No available port among [5000, 5001, 5500]");
  } catch (e) {
    console.error("Failed to start backend:", e);
    process.exit(1);
  }
})();
