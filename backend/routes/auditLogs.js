import { Router } from "express";
import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "auditData.json");

async function ensureFile() {
  try {
    await fsp.access(DATA_FILE);
  } catch {
    await fsp.writeFile(DATA_FILE, "[]\n", "utf8");
  }
}

async function readAll() {
  await ensureFile();
  const txt = await fsp.readFile(DATA_FILE, "utf8");
  try {
    const json = JSON.parse(txt);
    return Array.isArray(json) ? json : json.items || [];
  } catch {
    return [];
  }
}

async function writeAll(items) {
  const tmp = DATA_FILE + ".tmp";
  const text = JSON.stringify(items, null, 2);
  await fsp.writeFile(tmp, text, "utf8");
  await fsp.rename(tmp, DATA_FILE);
}

function toDate(x) {
  if (!x) return null;
  const d = new Date(x);
  return isNaN(d.getTime()) ? null : d;
}

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => (out[k] = obj?.[k] ?? null));
  return out;
}

// GET /api/audit-logs
router.get("/", async (req, res, next) => {
  try {
    const {
      search = "",
      userEmail,
      action,
      dateFrom,
      dateTo,
      limit = 100,
    } = req.query || {};

    const all = await readAll();
    const tenantId = (req.tenant && req.tenant.id) || "public";
    const s = String(search || "").toLowerCase();
    const from = toDate(dateFrom);
    const to = toDate(dateTo);

    const filtered = all
      .filter((r) => {
        const t = r.tenantId || "public";
        return tenantId === "public" ? t === "public" || !r.tenantId : t === tenantId;
      })
      .filter((r) => (userEmail ? r.userEmail === userEmail : true))
      .filter((r) => (action ? r.action === action : true))
      .filter((r) => {
        if (!from && !to) return true;
        const ts = toDate(r.timestamp) || new Date(0);
        if (from && ts < from) return false;
        if (to && ts > to) return false;
        return true;
      })
      .filter((r) => {
        if (!s) return true;
        return [r.userEmail, r.action, r.targetType, r.targetId, r.ip]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s));
      })
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, Math.max(1, Math.min(1000, Number(limit) || 100)));

    res.json({ items: filtered });
  } catch (e) {
    next(e);
  }
});

// POST /api/audit-logs
router.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const now = new Date();
    const entry = {
      id: body.id || `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: body.timestamp || now.toISOString(),
      ...pick(body, [
        "action",
        "userId",
        "userEmail",
        "targetType",
        "targetId",
        "ip",
        "metadata",
        "tenantId",
      ]),
    };
    // Fill IP from request if not provided
    entry.ip = entry.ip || (req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || req.connection?.remoteAddress || null);

    const all = await readAll();
    all.push(entry);
    await writeAll(all);
    res.status(201).json({ ok: true, item: entry });
  } catch (e) {
    next(e);
  }
});

export default router;
