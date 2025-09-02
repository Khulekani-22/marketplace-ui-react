import { Router } from "express";
import admin from "firebase-admin";
import { getData, saveData } from "../utils/dataStore.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";

const router = Router();

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// List all user role mappings
router.get("/", (_req, res) => {
  const { users = [] } = getData();
  res.json(users);
});

// Get current user's role/tenant (by Firebase token if present, else by query ?email=)
router.get("/me", (req, res) => {
  const { users = [] } = getData();
  const email = normalizeEmail(req.user?.email || req.query.email);
  if (!email) return res.status(400).json({ error: "Missing email" });
  const found = users.find((u) => normalizeEmail(u.email) === email);
  res.json(
    found || {
      email,
      tenantId: "public",
      role: "member",
    }
  );
});

// Upsert a user's role/tenant
router.post("/", (req, res) => {
  const { email, tenantId = "public", role = "member" } = req.body || {};
  const norm = normalizeEmail(email);
  if (!norm) return res.status(400).json({ error: "Missing email" });
  const updated = saveData((data) => {
    const list = Array.isArray(data.users) ? data.users : [];
    const idx = list.findIndex((u) => normalizeEmail(u.email) === norm);
    const next = { email: norm, tenantId, role };
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
    const { users = [] } = getData();
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
