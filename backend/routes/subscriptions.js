import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getData, saveData } from "../utils/dataStore.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";

const router = Router();

// List current user's subscriptions for this tenant
router.get("/my", firebaseAuthRequired, (req, res) => {
  const email = (req.user?.email || "").toLowerCase();
  const tenantId = req.tenant.id;
  const { subscriptions = [] } = getData();
  const items = subscriptions.filter((s) => (s.tenantId ?? "public") === tenantId && (s.email || "").toLowerCase() === email && !s.canceledAt);
  res.json(items);
});

// Subscribe to a service/listing
router.post("/service", firebaseAuthRequired, (req, res) => {
  const serviceId = String(req.body?.serviceId || "").trim();
  const tenantId = req.tenant.id;
  const email = (req.user?.email || "").toLowerCase();
  const uid = req.user?.uid || "";
  if (!serviceId) return res.status(400).json({ status: "error", message: "Missing serviceId" });

  let created = null;
  saveData((data) => {
    data.subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    // Find vendorId for convenience
    const services = Array.isArray(data.services) ? data.services : [];
    const svc = services.find((s) => String(s.id) === serviceId && (s.tenantId ?? "public") === tenantId) || services.find((s) => String(s.id) === serviceId);
    const vendorId = svc ? String(svc.vendorId || svc.id || "") : "";

    // Idempotent/reactivation: unique key by (tenantId, email, type=service, serviceId)
    const exists = data.subscriptions.find((x) => (x.tenantId ?? "public") === tenantId && (x.email || "").toLowerCase() === email && (x.type || "service") === "service" && String(x.serviceId || "") === serviceId);
    if (exists) {
      // If canceled previously, reactivate by clearing canceledAt and bumping createdAt
      if (exists.canceledAt) {
        exists.canceledAt = undefined;
        exists.createdAt = new Date().toISOString();
      }
      created = exists;
      return data;
    }

    const obj = { id: uuid(), type: "service", serviceId, vendorId, email, uid, tenantId, createdAt: new Date().toISOString() };
    data.subscriptions.push(obj);
    created = obj;
    return data;
  });
  res.status(201).json(created);
});

// Unsubscribe from a service/listing
router.delete("/service", firebaseAuthRequired, (req, res) => {
  const serviceId = String((req.body?.serviceId || req.query?.serviceId || "")).trim();
  const tenantId = req.tenant.id;
  const email = (req.user?.email || "").toLowerCase();
  if (!serviceId) return res.status(400).json({ status: "error", message: "Missing serviceId" });

  let removed = false;
  saveData((data) => {
    const before = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    const after = before.filter((x) => !((x.tenantId ?? "public") === tenantId && (x.email || "").toLowerCase() === email && (x.type || "service") === "service" && String(x.serviceId || "") === serviceId));
    removed = after.length !== before.length;
    data.subscriptions = after;
    return data;
  });
  if (!removed) return res.status(404).json({ status: "error", message: "Subscription not found" });
  res.status(204).send();
});

// Cancel (soft) a subscription to preserve revenue history
router.put("/service/cancel", firebaseAuthRequired, (req, res) => {
  const serviceId = String(req.body?.serviceId || req.query?.serviceId || "").trim();
  const tenantId = req.tenant.id;
  const email = (req.user?.email || "").toLowerCase();
  if (!serviceId) return res.status(400).json({ status: "error", message: "Missing serviceId" });
  let updated = null;
  saveData((data) => {
    const list = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    const idx = list.findIndex((x) => (x.tenantId ?? "public") === tenantId && (x.email || "").toLowerCase() === email && (x.type || "service") === "service" && String(x.serviceId || "") === serviceId);
    if (idx >= 0) {
      list[idx].canceledAt = new Date().toISOString();
      updated = list[idx];
    }
    data.subscriptions = list;
    return data;
  });
  if (!updated) return res.status(404).json({ status: "error", message: "Subscription not found" });
  res.json(updated);
});

export default router;
