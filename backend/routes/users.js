import { Router } from "express";
import admin from "firebase-admin";
import { getData, saveData } from "../utils/dataStore.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";

const router = Router();

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function collectUsers(data) {
  const seen = new Map();
  function add(list) {
    if (!Array.isArray(list)) return;
    for (const u of list) {
      if (!u || typeof u !== "object") continue;
      const email = (u.email || "").toLowerCase();
      if (!email) continue;
      if (!seen.has(email)) seen.set(email, { email, tenantId: u.tenantId || "public", role: u.role || "member" });
    }
  }
  // root users first
  add(data?.users);
  if (seen.size) return Array.from(seen.values());
  // deep scan for arrays of objects with email
  (function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      // if the array looks like users, add them
      if (node.length && typeof node[0] === "object" && node[0] && ("email" in node[0])) add(node);
      for (const v of node) walk(v);
      return;
    }
    for (const k of Object.keys(node)) walk(node[k]);
  })(data);
  return Array.from(seen.values());
}

// List all user role mappings
router.get("/", (_req, res) => {
  const data = getData();
  res.json(collectUsers(data));
});

// Get current user's role/tenant (by Firebase token if present, else by query ?email=)
router.get("/me", (req, res) => {
  const data = getData();
  const users = collectUsers(data);
  const email = normalizeEmail(req.user?.email || req.query.email);
  if (!email) return res.status(400).json({ error: "Missing email" });
  const found = users.find((u) => normalizeEmail(u.email) === email);
  res.json(found || { email, tenantId: "public", role: "member" });
});

// Upsert a user's role/tenant
router.post("/", (req, res) => {
  const { email, tenantId = "public", role = "member", uid = "" } = req.body || {};
  const norm = normalizeEmail(email);
  if (!norm) return res.status(400).json({ error: "Missing email" });
  const updated = saveData((data) => {
    const list = Array.isArray(data.users) ? data.users : [];
    const idx = list.findIndex((u) => normalizeEmail(u.email) === norm);
    const next = { email: norm, tenantId, role, ...(uid ? { uid } : {}) };
    if (idx >= 0) list[idx] = { ...list[idx], ...next };
    else list.push(next);
    data.users = list;
    // also ensure tenant list exists if moving off public
    if (tenantId && tenantId !== "public") {
      const tenants = Array.isArray(data.tenants) ? data.tenants : [];
      if (!tenants.find((t) => t.id === tenantId)) {
        tenants.push({ id: tenantId, name: tenantId });
      }
      data.tenants = tenants;
    }
    return data;
  });
  res.json({ ok: true, users: updated.users });
});

// Upgrade a public user to a private tenant and grant admin role
router.post("/upgrade", (req, res) => {
  const { email, newTenantId } = req.body || {};
  const norm = normalizeEmail(email);
  const tenantId = (newTenantId || "").trim();
  if (!norm || !tenantId) return res.status(400).json({ error: "Missing email or newTenantId" });
  const updated = saveData((data) => {
    const list = Array.isArray(data.users) ? data.users : [];
    const idx = list.findIndex((u) => normalizeEmail(u.email) === norm);
    const next = { email: norm, tenantId, role: "admin" };
    if (idx >= 0) list[idx] = { ...list[idx], ...next };
    else list.push(next);
    data.users = list;
    const tenants = Array.isArray(data.tenants) ? data.tenants : [];
    if (!tenants.find((t) => t.id === tenantId)) tenants.push({ id: tenantId, name: tenantId });
    data.tenants = tenants;
    return data;
  });
  res.json({ ok: true, users: updated.users });
});

export default router;

// Admin-only: lookup Firebase UID by email
function isAdminRequest(req) {
  try {
    const email = (req.user?.email || "").toLowerCase();
    if (!email) return false;
    const data = getData();
    const users = collectUsers(data);
    const found = users.find((u) => (u.email || "").toLowerCase() === email);
    return (found?.role || "") === "admin";
  } catch {
    return false;
  }
}

router.get("/lookup", firebaseAuthRequired, async (req, res) => {
  try {
    if (!isAdminRequest(req)) return res.status(403).json({ status: "error", message: "Forbidden" });
    const email = String(req.query.email || "").toLowerCase();
    if (!email) return res.status(400).json({ status: "error", message: "Missing email" });
    const user = await admin.auth().getUserByEmail(email);
    return res.json({ uid: user.uid, email: user.email, displayName: user.displayName || "" });
  } catch (e) {
    return res.status(404).json({ status: "error", message: e?.message || "User not found" });
  }
});

// Admin-only: delete a user mapping and the Firebase user account
// Does NOT touch any listings or vendor/startup data.
router.delete("/", firebaseAuthRequired, async (req, res) => {
  try {
    if (!isAdminRequest(req)) return res.status(403).json({ status: "error", message: "Forbidden" });
    const raw = req.body?.email || req.query?.email;
    const email = normalizeEmail(raw);
    if (!email) return res.status(400).json({ status: "error", message: "Missing email" });

    // Remove role mapping from data store
    const updated = saveData((data) => {
      const list = Array.isArray(data.users) ? data.users : [];
      const next = list.filter((u) => normalizeEmail(u.email) !== email);
      data.users = next;
      return data;
    });

    // Best-effort deletion in Firebase Auth
    try {
      const user = await admin.auth().getUserByEmail(email);
      if (user?.uid) await admin.auth().deleteUser(user.uid);
    } catch (_) {
      // ignore if user not found or deletion fails
    }

    res.json({ ok: true, users: updated.users });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to delete user" });
  }
});

// Admin-only: list platform users (email, uid, displayName) with optional substring search
router.get("/all", firebaseAuthRequired, async (req, res) => {
  try {
    if (!isAdminRequest(req)) return res.status(403).json({ status: "error", message: "Forbidden" });
    const search = String(req.query.search || "").toLowerCase();
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || "100", 10) || 100, 1), 1000);
    let pageToken = req.query.pageToken ? String(req.query.pageToken) : undefined;

    const out = [];
    let nextPageToken = undefined;
    // Keep scanning Firebase pages until we collect pageSize matches or run out
    do {
      const resp = await admin.auth().listUsers(1000, pageToken);
      for (const u of resp.users || []) {
        const email = (u.email || "").toLowerCase();
        const dn = u.displayName || "";
        if (!search || email.includes(search) || dn.toLowerCase().includes(search)) {
          out.push({ uid: u.uid, email: u.email || "", displayName: dn, disabled: !!u.disabled });
          if (out.length >= pageSize) break;
        }
      }
      if (out.length >= pageSize) {
        nextPageToken = resp.pageToken; // token for the next Firebase page
        break;
      }
      if (!resp.pageToken) {
        nextPageToken = undefined;
        break;
      }
      pageToken = resp.pageToken;
    } while (true);

    res.json({ items: out, count: out.length, nextPageToken });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to list users" });
  }
});
