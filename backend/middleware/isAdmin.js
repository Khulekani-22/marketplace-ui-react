import { getData } from "../utils/dataStore.js";

export function normalizeEmail(x) {
  return (x || "").toString().trim().toLowerCase();
}

export function mapTenant(id) {
  return id === "vendor" ? "public" : (id || "public");
}

// Build a users list from the datastore. Prefer data.users; if empty, deep-scan.
export function collectUsers(data) {
  const seen = new Map();
  function add(list) {
    if (!Array.isArray(list)) return;
    for (const u of list) {
      if (!u || typeof u !== "object") continue;
      const email = normalizeEmail(u.email);
      if (!email) continue;
      if (!seen.has(email)) seen.set(email, { email, tenantId: u.tenantId || "public", role: u.role || "member" });
    }
  }
  add(data?.users);
  if (seen.size) return Array.from(seen.values());
  (function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      if (node.length && typeof node[0] === "object" && node[0] && ("email" in node[0])) add(node);
      for (const v of node) walk(v);
      return;
    }
    for (const k of Object.keys(node)) walk(node[k]);
  })(data);
  return Array.from(seen.values());
}

// Tenant-aware admin check using datastore mapping
export function isAdminForTenant(req, { email, tenantId } = {}) {
  try {
    const em = normalizeEmail(email || req.user?.email);
    if (!em) return false;
    const target = mapTenant(tenantId || req.tenant?.id);
    const users = collectUsers(getData());
    const found = users.find((u) => normalizeEmail(u.email) === em);
    if (!found) return false;
    const role = (found.role || "member");
    const uTenant = mapTenant(found.tenantId);
    return role === "admin" && uTenant === target;
  } catch {
    return false;
  }
}

// Express middleware to enforce admin for current tenant
export function requireAdmin(req, res, next) {
  if (!normalizeEmail(req.user?.email)) return res.status(401).json({ status: "error", message: "Unauthorized" });
  if (!isAdminForTenant(req)) return res.status(403).json({ status: "error", message: "Forbidden: admin required for tenant" });
  next();
}

