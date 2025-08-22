// backend/routes/lms.js
import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// From backend/routes → project root
const ROOT = path.resolve(__dirname, "..", "..");

// Try both common locations for appData.json (pick the first that exists)
const LIVE_CANDIDATES = [
  path.join(ROOT, "appData.json"),
  path.join(ROOT, "backend", "appData.json"),
];
async function livePath() {
  for (const p of LIVE_CANDIDATES) {
    try { await fs.access(p); return p; } catch {}
  }
  // default to the first if none exist yet
  return LIVE_CANDIDATES[0];
}

// Where we store checkpoints
const SECRETS_DIR = path.join(ROOT, "secrets");
const CP_FILE = path.join(SECRETS_DIR, "lms_checkpoints.json");
const MAX_CP = 50;

const deepClone = (o) => JSON.parse(JSON.stringify(o ?? {}));

function countsOf(appData) {
  const cohorts = Array.isArray(appData?.cohorts) ? appData.cohorts.length : 0;
  const courses = (appData?.cohorts ?? []).reduce(
    (n, c) => n + (Array.isArray(c.courses) ? c.courses.length : 0),
    0
  );
  const lessons = (appData?.cohorts ?? []).reduce(
    (n, c) =>
      n +
      (Array.isArray(c.courses)
        ? c.courses.reduce(
            (m, crs) => m + (Array.isArray(crs.lessons) ? crs.lessons.length : 0),
            0
          )
        : 0),
    0
  );
  return { cohorts, courses, lessons };
}

async function readCheckpoints() {
  try {
    const txt = await fs.readFile(CP_FILE, "utf8");
    const json = JSON.parse(txt);
    return Array.isArray(json) ? json : json.items || [];
  } catch { return []; }
}

async function writeCheckpoints(items) {
  await fs.mkdir(SECRETS_DIR, { recursive: true });
  await fs.writeFile(CP_FILE, JSON.stringify(items, null, 2));
}

function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ----------------------------- Routes ----------------------------- */

// List checkpoints (metadata only)
router.get("/checkpoints", async (_req, res, next) => {
  try {
    const items = await readCheckpoints();
    const slim = items.map(({ id, ts, message, delta }) => ({ id, ts, message, delta }));
    res.json(slim);
  } catch (e) { next(e); }
});

// Get one checkpoint (with data)
router.get("/checkpoints/:id", async (req, res, next) => {
  try {
    const items = await readCheckpoints();
    const found = items.find((x) => x.id === req.params.id);
    if (!found) return res.status(404).json({ message: "Not found" });
    res.json({ id: found.id, ts: found.ts, message: found.message, delta: found.delta, data: found.data });
  } catch (e) { next(e); }
});

// Create checkpoint
router.post("/checkpoints", async (req, res, next) => {
  try {
    const { message = "Checkpoint", data } = req.body || {};
    if (!data || typeof data !== "object") return res.status(400).json({ message: "Missing data" });

    const items = await readCheckpoints();
    const prev = items[0]?.data;
    const prevCounts = countsOf(prev);
    const currCounts = countsOf(data);

    const delta = {
      cohorts: currCounts.cohorts - prevCounts.cohorts,
      courses: currCounts.courses - prevCounts.courses,
      lessons: currCounts.lessons - prevCounts.lessons,
    };

    const item = { id: makeId(), ts: Date.now(), message, delta, data: deepClone(data) };
    const next = [item, ...items].slice(0, MAX_CP);
    await writeCheckpoints(next);

    res.status(201).json({ id: item.id });
  } catch (e) { next(e); }
});

// Delete ALL checkpoints
router.delete("/checkpoints", async (_req, res, next) => {
  try { await writeCheckpoints([]); res.status(204).end(); }
  catch (e) { next(e); }
});

// Restore a checkpoint to live appData.json
router.post("/restore/:id", async (req, res, next) => {
  try {
    const items = await readCheckpoints();
    const found = items.find((x) => x.id === req.params.id);
    if (!found) return res.status(404).json({ message: "Not found" });

    const p = await livePath();
    await fs.writeFile(p, JSON.stringify(found.data ?? {}, null, 2));
    res.json({ ok: true, path: p });
  } catch (e) { next(e); }
});

// Publish current draft to live appData.json
router.put("/publish", async (req, res, next) => {
  try {
    const { data } = req.body || {};
    if (!data || typeof data !== "object") return res.status(400).json({ message: "Missing data" });

    const p = await livePath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(data, null, 2));
    res.json({ ok: true, path: p });
  } catch (e) { next(e); }
});

// Optional helper: read the live file
router.get("/live", async (_req, res, next) => {
  try {
    const p = await livePath();
    const txt = await fs.readFile(p, "utf8").catch(() => "{}");
    res.json({ data: JSON.parse(txt || "{}") });
  } catch (e) { next(e); }
});

export default router;
