import { Router } from "express";
import admin from "firebase-admin";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getData, saveData } from "../utils/hybridDataStore.js";
import { isAdminForTenant } from "../middleware/isAdmin.js";
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

function sanitizeUsersPayload(list = []) {
  const seen = new Map();
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const email = normalizeEmail(entry.email);
    if (!email) continue;
    const role = entry.role === "admin" ? "admin" : "member";
    const rawTenant = typeof entry.tenantId === "string" ? entry.tenantId.trim() : "";
    const tenantId = mapTenant(rawTenant);
    const uid = typeof entry.uid === "string" && entry.uid.trim() ? entry.uid.trim() : undefined;
    const payload = { email, tenantId, role };
    if (uid) payload.uid = uid;
    seen.set(email, payload);
  }
  return Array.from(seen.values());
}

// GET /api/users/all-contacts
// Returns all users, vendors, and startups for autocomplete
router.get('/all-contacts', firebaseAuthRequired, async (req, res) => {
  try {
    const data = await getData();
    // Collect users
    const users = Array.isArray(data.users) ? data.users.map(u => ({
      email: u.email,
      name: u.displayName || u.name || u.email,
      role: u.role || 'member',
      type: 'user',
      tenantId: u.tenantId || 'public',
    })) : [];
    // Collect vendors
    const vendors = Array.isArray(data.vendors) ? data.vendors.map(v => ({
      email: v.contactEmail || v.email,
      name: v.name || v.companyName || v.contactEmail || v.email,
      role: v.role || 'vendor',
      type: 'vendor',
      tenantId: v.tenantId || 'vendor',
    })) : [];
    // Collect startups
    const startups = Array.isArray(data.startups) ? data.startups.map(s => ({
      email: s.contactEmail || s.email,
      name: s.name || s.companyName || s.contactEmail || s.email,
      role: s.role || 'startup',
      type: 'startup',
      tenantId: s.tenantId || 'startup',
    })) : [];
    // Merge and deduplicate by email
    const all = [...users, ...vendors, ...startups];
    const seen = new Map();
    for (const entry of all) {
      if (!entry.email) continue;
      const key = entry.email.toLowerCase();
      if (!seen.has(key)) seen.set(key, entry);
    }
    res.json({ items: Array.from(seen.values()) });
  } catch (error) {
    console.error('Error fetching all contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});
router.get("/", async (_req, res) => {
  const data = await getData();
  res.json(collectUsers(data));
});

// Get current user's role/tenant (by Firebase token if present, else by query ?email=)
router.get("/me", async (req, res) => {
  const data = await getData();
  const users = collectUsers(data);
  const email = normalizeEmail(req.user?.email || req.query.email);
  if (!email) return res.status(400).json({ error: "Missing email" });
  const found = users.find((u) => normalizeEmail(u.email) === email);
  res.json(found || { email, tenantId: "public", role: "member" });
});

// Upsert a user's role/tenant
router.post("/", firebaseAuthRequired, isAdminForTenant, async (req, res) => {
  const { email, tenantId = "public", role = "member", uid = "" } = req.body || {};
  const norm = normalizeEmail(email);
  if (!norm) return res.status(400).json({ error: "Missing email" });
  
  // Only admins can grant admin roles
  if (role === "admin" && !req.user?.isAdmin) {
    return res.status(403).json({ error: "Only admins can grant admin roles" });
  }
  
  const data = await getData();
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
  await saveData(data);

  res.json({ ok: true, users: data.users });
});

// Upgrade a public user to a private tenant and grant admin role
router.post("/upgrade", async (req, res) => {
  const { email, newTenantId } = req.body || {};
  const norm = normalizeEmail(email);
  const tenantId = (newTenantId || "").trim();
  if (!norm || !tenantId) return res.status(400).json({ error: "Missing email or newTenantId" });
  
  const data = await getData();
  const list = Array.isArray(data.users) ? data.users : [];
  const idx = list.findIndex((u) => normalizeEmail(u.email) === norm);
  const next = { email: norm, tenantId, role: "admin" };
  if (idx >= 0) list[idx] = { ...list[idx], ...next };
  else list.push(next);
  data.users = list;
  const tenants = Array.isArray(data.tenants) ? data.tenants : [];
  if (!tenants.find((t) => t.id === tenantId)) tenants.push({ id: tenantId, name: tenantId });
  data.tenants = tenants;
  await saveData(data);

  res.json({ ok: true, users: data.users });
});

// Bulk replace users list (admin only, backs the "Save All Changes" action)
router.put("/bulk", firebaseAuthRequired, async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    const incoming = Array.isArray(req.body?.users) ? req.body.users : [];
    const sanitized = sanitizeUsersPayload(incoming);

    const data = await getData();
    data.users = sanitized;
    const tenants = Array.isArray(data.tenants) ? [...data.tenants] : [];
    const known = new Set(tenants.map((t) => (t && typeof t === "object" ? t.id : t)).filter(Boolean));
    sanitized.forEach((u) => {
      const id = u.tenantId || "public";
      if (id && id !== "public" && !known.has(id)) {
        tenants.push({ id, name: id });
        known.add(id);
      }
    });
    data.tenants = tenants;
    await saveData(data);

    res.json({ ok: true, users: data.users });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to save users" });
  }
});

// Admin-only: lookup Firebase UID by email
function mapTenant(id){ return (id === 'vendor') ? 'public' : (id || 'public'); }
function isAdminRequest(req) { return isAdminForTenant(req); }

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
    const data = await getData();
    const list = Array.isArray(data.users) ? data.users : [];
    const next = list.filter((u) => normalizeEmail(u.email) !== email);
    data.users = next;
    await saveData(data);

    // Best-effort deletion in Firebase Auth
    try {
      const user = await admin.auth().getUserByEmail(email);
      if (user?.uid) await admin.auth().deleteUser(user.uid);
    } catch (_) {
      // ignore if user not found or deletion fails
    }

    res.json({ ok: true, users: data.users });
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

export default router;

// Admin-only: batch lookup Firebase UIDs by email
router.post("/batch-lookup", firebaseAuthRequired, async (req, res) => {
  try {
    if (!isAdminRequest(req)) return res.status(403).json({ status: "error", message: "Forbidden" });
    const emails = Array.isArray(req.body?.emails) ? req.body.emails : [];
    if (!emails.length) return res.status(400).json({ status: "error", message: "Missing emails array" });
    // Normalize and dedupe emails
    const normEmails = Array.from(new Set(emails.map(e => (e || "").trim().toLowerCase()).filter(Boolean)));
    // Batch lookup UIDs
    const results = [];
    for (const email of normEmails) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        results.push({ email, uid: user.uid, displayName: user.displayName || "" });
      } catch (err) {
        results.push({ email, error: err?.message || "User not found" });
      }
    }
    res.json({ items: results, count: results.length });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Batch lookup failed" });
  }
});
