
import { firestore } from '../services/firestore.js';

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


  res.on("finish", async () => {
    try {
      const status = res.statusCode || 0;
      const entry = buildEntry(status);
      // Write audit log to Firestore
      await firestore.collection('auditLogs').add(entry);
    } catch (err) {
      // best-effort; never block response
      console.error('[Audit] Failed to write audit log to Firestore:', err);
    }
  });

  next();
}

