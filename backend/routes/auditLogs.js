import { Router } from "express";

import { firestore } from "../services/firestore.js";

const router = Router();


const AUDIT_COLLECTION = "auditLogs";

async function readAll() {
  const snapshot = await firestore.collection(AUDIT_COLLECTION).get();
  return snapshot.docs.map(doc => doc.data());
}

async function writeAll(items) {
  // Overwrite all audit logs (rarely needed, but for compatibility)
  const batch = firestore.batch();
  const colRef = firestore.collection(AUDIT_COLLECTION);
  // Delete existing
  const existing = await colRef.get();
  existing.docs.forEach(doc => batch.delete(doc.ref));
  // Add new
  items.forEach(item => {
    const ref = colRef.doc(item.id);
    batch.set(ref, item);
  });
  await batch.commit();
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

    let query = firestore.collection(AUDIT_COLLECTION);
    if (userEmail) query = query.where("userEmail", "==", userEmail);
    if (action) query = query.where("action", "==", action);
    // Filtering by date
    if (dateFrom) query = query.where("timestamp", ">=", dateFrom);
    if (dateTo) query = query.where("timestamp", "<=", dateTo);
    query = query.orderBy("timestamp", "desc");
    const snapshot = await query.limit(Math.max(1, Math.min(1000, Number(limit) || 100))).get();
    let items = snapshot.docs.map(doc => doc.data());
    // Search filter
    const s = String(search || "").toLowerCase();
    if (s) {
      items = items.filter(r => [r.userEmail, r.action, r.targetType, r.targetId, r.ip]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(s)));
    }
    res.json({ items });
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

    await firestore.collection(AUDIT_COLLECTION).doc(entry.id).set(entry);
    res.status(201).json({ ok: true, item: entry });
  } catch (e) {
    next(e);
  }
});

export default router;
