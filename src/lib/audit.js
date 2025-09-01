// src/lib/audit.js
// Centralized audit logging client with API-first strategy and Firestore fallback.

import { api } from "./api";
import db from "../db";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  limit as fsLimit,
  query,
  serverTimestamp,
  where,
  Timestamp,
} from "firebase/firestore";

const COLL = "audit_logs";

// Normalizes log item fields for UI consumption
export function normalizeAuditItem(item) {
  const ts = item.timestamp?._seconds
    ? new Date(item.timestamp._seconds * 1000)
    : item.timestamp instanceof Date
    ? item.timestamp
    : item.timestamp?.toDate?.() || (item.createdAt?.toDate?.() ?? null);

  return {
    id: item.id || item._id || `${item.userId || item.userEmail || ""}-${item.action || ""}-${ts?.getTime?.() || Math.random()}`,
    timestamp: ts || null,
    userId: item.userId || null,
    userEmail: item.userEmail || item.email || null,
    action: item.action || item.event || "unknown",
    targetType: item.targetType || item.entityType || null,
    targetId: item.targetId || item.entityId || null,
    ip: item.ip || item.ipAddress || null,
    metadata: item.metadata || item.meta || {},
    tenantId: item.tenantId || item.tenant || (sessionStorage.getItem("tenantId") || "public"),
  };
}

// Fetch audit logs from backend; fallback to Firestore if API unavailable
export async function fetchAuditLogs({
  search = "",
  userEmail,
  action,
  dateFrom,
  dateTo,
  limit = 100,
  tenantId,
} = {}) {
  // Try API first
  try {
    const params = { search, userEmail, action, limit };
    if (dateFrom instanceof Date) params.dateFrom = dateFrom.toISOString();
    if (dateTo instanceof Date) params.dateTo = dateTo.toISOString();
    const headers = tenantId ? { "x-tenant-id": tenantId } : undefined;
    if (tenantId) params.tenantId = tenantId;
    const { data } = await api.get("/api/audit-logs", { params, headers });
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.map(normalizeAuditItem);
  } catch (e) {
    // fall through to Firestore
  }

  // Firestore fallback (best-effort)
  try {
    const col = collection(db, COLL);
    const wheres = [];
    if (userEmail) wheres.push(where("userEmail", "==", userEmail));
    if (action) wheres.push(where("action", "==", action));
    if (dateFrom) wheres.push(where("timestamp", ">=", Timestamp.fromDate(dateFrom instanceof Date ? dateFrom : new Date(dateFrom))));
    if (dateTo) wheres.push(where("timestamp", "<=", Timestamp.fromDate(dateTo instanceof Date ? dateTo : new Date(dateTo))));
    let q = query(col, orderBy("timestamp", "desc"), fsLimit(Math.min(limit, 500)));
    if (wheres.length) {
      // Firestore requires order/where composition; we’ll apply where filters first then order
      q = query(col, ...wheres, orderBy("timestamp", "desc"), fsLimit(Math.min(limit, 500)));
    }
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => normalizeAuditItem({ id: d.id, ...d.data() }));
    if (search) {
      const s = search.toLowerCase();
      return rows.filter((r) =>
        [r.userEmail, r.action, r.targetType, r.targetId]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s))
      );
    }
    return rows;
  } catch (e) {
    // As a last resort return empty
    return [];
  }
}

// Record an audit event; API first, Firestore fallback
export async function writeAuditLog({
  action,
  userId,
  userEmail,
  targetType,
  targetId,
  ip,
  metadata = {},
}) {
  const tenantId = sessionStorage.getItem("tenantId") || "public";
  const payload = {
    action,
    userId: userId || null,
    userEmail: userEmail || null,
    targetType: targetType || null,
    targetId: targetId || null,
    ip: ip || null,
    metadata,
    tenantId,
    timestamp: new Date().toISOString(),
  };

  // API first
  try {
    await api.post("/api/audit-logs", payload);
    return true;
  } catch (e) {
    // fallback
  }

  try {
    await addDoc(collection(db, COLL), {
      ...payload,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (e) {
    return false;
  }
}
