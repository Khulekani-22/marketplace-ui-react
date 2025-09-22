import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "auditData.json");

function ensureFileSync() {
  try {
    fs.accessSync(DATA_FILE, fs.constants.F_OK);
  } catch {
    fs.writeFileSync(DATA_FILE, "[]\n", "utf8");
  }
}

function readAllSync() {
  ensureFileSync();
  try {
    const txt = fs.readFileSync(DATA_FILE, "utf8");
    const json = JSON.parse(txt);
    return Array.isArray(json) ? json : (json.items || []);
  } catch {
    return [];
  }
}

function writeAllSync(items) {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

function nowIso() { return new Date().toISOString(); }
function norm(x){ return (x||"").toString().trim(); }

function pickSafe(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj?.[k];
  return out;
}

// Express middleware: logs mutating requests on response finish
export function auditMutations(req, res, next) {
  const method = (req.method || "").toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return next();

  const start = Date.now();
  const requestId = req.header("x-request-id") || `req_${start.toString(36)}`;
  const tenantId = req.tenant?.id || "public";
  const userEmail = req.user?.email || null;
  const ip = (req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || req.connection?.remoteAddress || null);
  const targetType = (() => {
    const p = req.path || req.originalUrl || "";
    if (p.includes("/vendors")) return "vendors";
    if (p.includes("/services")) return "services";
    if (p.includes("/lms")) return "lms";
    if (p.includes("/users")) return "users";
    return "api";
  })();

  function buildEntry(status) {
    const entry = {
      id: requestId,
      timestamp: nowIso(),
      action: `${method} ${req.originalUrl || req.path || ''}`,
      userEmail,
      tenantId,
      targetType,
      targetId: null,
      ip,
      metadata: {
        status,
        durationMs: Date.now() - start,
      },
    };
    return entry;
  }

  res.on("finish", () => {
    try {
      const status = res.statusCode || 0;
      const entry = buildEntry(status);
      const all = readAllSync();
      all.push(entry);
      writeAllSync(all);
    } catch {
      // best-effort; never block response
    }
  });

  next();
}

