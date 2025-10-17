import express from "express";
import { v4 as uuid } from "uuid";
import { getData, saveData } from "../utils/hybridDataStore.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";

const SERVICE_DAY_START = 8;
const SERVICE_DAY_END = 17;
const SLOT_REGEX = /^([01]\d|2[0-3]):00$/;

function isServiceListing(service = {}) {
  const type = (service.listingType || service.type || "").toString().toLowerCase();
  return type === "service" || type === "services";
}

function isValidSlot(slot) {
  if (!slot || typeof slot !== "string") return false;
  if (!SLOT_REGEX.test(slot)) return false;
  const hour = parseInt(slot.slice(0, 2), 10);
  return hour >= SERVICE_DAY_START && hour < SERVICE_DAY_END;
}

function isValidDate(value) {
  if (!value || typeof value !== "string") return false;
  const dt = new Date(`${value}T00:00:00`);
  return !Number.isNaN(dt.getTime());
}

function upsertBooking({ data, subscription, service, scheduledDate, scheduledSlot, customerName, bookedAt, status }) {
  data.bookings = Array.isArray(data.bookings) ? data.bookings : [];
  const bookings = data.bookings;
  const nowIso = new Date().toISOString();
  const idx = bookings.findIndex((b) => (b.subscriptionId && subscription?.id && b.subscriptionId === subscription.id) || (String(b.serviceId || "") === String(subscription.serviceId || "") && (b.customerEmail || "").toLowerCase() === (subscription.email || "").toLowerCase() && !b.canceledAt));
  const baseDetails = {
    subscriptionId: subscription.id,
    serviceId: subscription.serviceId,
    serviceTitle: service?.title || "",
    vendorId: String(service?.vendorId || service?.id || ""),
    vendorName: service?.vendor || service?.vendorName || "",
    vendorEmail: service?.contactEmail || service?.email || "",
    customerId: subscription.uid || subscription.email,
    customerName: customerName || subscription.email,
    customerEmail: subscription.email,
    tenantId: subscription.tenantId,
    price: Number(service?.price || 0) || 0,
  };
  const scheduleDetails = {
    scheduledDate: scheduledDate || null,
    scheduledSlot: scheduledSlot || null,
    bookedAt: bookedAt || nowIso,
    status: status || "scheduled",
    updatedAt: nowIso,
  };
  if (idx >= 0) {
    const existing = bookings[idx];
    bookings[idx] = {
      id: existing.id,
      ...existing,
      ...baseDetails,
      ...scheduleDetails,
      bookedAt: existing.bookedAt || scheduleDetails.bookedAt,
    };
  } else {
    bookings.push({
      id: uuid(),
      ...baseDetails,
      ...scheduleDetails,
    });
  }
  data.bookings = bookings;
}

function markBookingStatus({ data, subscription, serviceId, customerEmail, status }) {
  if (!subscription && !serviceId) return;
  data.bookings = Array.isArray(data.bookings) ? data.bookings : [];
  const bookings = data.bookings;
  const emailLower = (customerEmail || "").toLowerCase();
  const id = subscription?.id;
  const nowIso = new Date().toISOString();
  bookings.forEach((b) => {
    const matchesSubscription = !!id && b.subscriptionId === id;
    const matchesServiceAndEmail = !id && serviceId && String(b.serviceId || "") === String(serviceId) && (!emailLower || (b.customerEmail || "").toLowerCase() === emailLower);
    if (matchesSubscription || matchesServiceAndEmail) {
      b.status = status;
      b.updatedAt = nowIso;
      if (status === "canceled") b.canceledAt = nowIso;
    }
  });
  data.bookings = bookings;
}

const { Router } = express;
const router = Router();

function normalizeTenantId(value) {
  const raw = (value || "public").toString().trim();
  return raw === "vendor" ? "public" : raw;
}

function tenantMatches(entryTenant, currentTenant, { treatPublicAsWildcard = false } = {}) {
  const entry = normalizeTenantId(entryTenant);
  const current = normalizeTenantId(currentTenant);
  if (treatPublicAsWildcard && current === "public") return true;
  if (entry === current) return true;
  if (treatPublicAsWildcard && entry === "public") return true;
  return false;
}

function normalizeEmail(value) {
  return (value || "").toString().trim().toLowerCase();
}

function findSubscriptionIndex(list, { serviceId, tenantId, email, uid }) {
  const targetServiceId = String(serviceId || "");
  const normalizedEmail = normalizeEmail(email);
  const normalizedTenant = normalizeTenantId(tenantId);
  if (!targetServiceId || (!normalizedEmail && !uid)) return -1;

  // Strategy 1: Strict matching (tenant + user + service + not canceled)
  const primaryIdx = list.findIndex((entry) => {
    if (!entry || (entry.type || "service") !== "service") return false;
    if (entry.canceledAt) return false; // Skip already canceled subscriptions
    const entryServiceId = String(entry.serviceId || "");
    if (entryServiceId !== targetServiceId) return false;
    const emailMatches = normalizedEmail && normalizeEmail(entry.email) === normalizedEmail;
    const uidMatches = uid && String(entry.uid || "") === String(uid);
    if (!emailMatches && !uidMatches) return false;
    return tenantMatches(entry.tenantId, normalizedTenant, { treatPublicAsWildcard: true });
  });
  if (primaryIdx >= 0) return primaryIdx;

  // Strategy 2: UID-based fallback (any tenant, not canceled)
  if (uid) {
    const uidFallback = list.findIndex((entry) => {
      if (!entry || (entry.type || "service") !== "service") return false;
      if (entry.canceledAt) return false; // Skip already canceled subscriptions
      const entryServiceId = String(entry.serviceId || "");
      if (entryServiceId !== targetServiceId) return false;
      return String(entry.uid || "") === String(uid);
    });
    if (uidFallback >= 0) return uidFallback;
  }

  // Strategy 3: Email-based fallback (any tenant, not canceled)
  if (normalizedEmail) {
    const emailFallback = list.findIndex((entry) => {
      if (!entry || (entry.type || "service") !== "service") return false;
      if (entry.canceledAt) return false; // Skip already canceled subscriptions
      const entryServiceId = String(entry.serviceId || "");
      if (entryServiceId !== targetServiceId) return false;
      return normalizeEmail(entry.email) === normalizedEmail;
    });
    if (emailFallback >= 0) return emailFallback;
  }

  return -1;
}

// List current user's subscriptions for this tenant
router.get("/my", firebaseAuthRequired, async (req, res) => {
  const email = (req.user?.email || "").toLowerCase();
  const { subscriptions = [] } = await getData();
  const items = subscriptions.filter((s) => (s.email || "").toLowerCase() === email && !s.canceledAt);
  res.json(items);
});

// List current user's bookings
router.get("/bookings/mine", firebaseAuthRequired, async (req, res) => {
  try {
    const email = (req.user?.email || "").toLowerCase();
    const uid = req.user?.uid || "";
    const data = await getData();
    const bookings = Array.isArray(data.bookings) ? data.bookings : [];
    
    // Filter bookings for current user by email or UID
    const userBookings = bookings.filter((b) => {
      const bookingEmail = (b.customerEmail || "").toLowerCase();
      const bookingUid = String(b.customerId || "");
      return (bookingEmail === email || (uid && bookingUid === uid)) && !b.canceledAt;
    });
    
    // Sort by most recent first
    const sorted = userBookings.sort((a, b) => {
      const dateA = Date.parse(b.bookedAt || b.createdAt || "");
      const dateB = Date.parse(a.bookedAt || a.createdAt || "");
      return dateA - dateB;
    });
    
    res.json({ bookings: sorted, total: sorted.length });
  } catch (error) {
    console.error('[BOOKINGS] Error fetching user bookings:', error);
    res.status(500).json({ status: "error", message: "Failed to fetch bookings" });
  }
});

// List subscribers for a specific service/listing (tenant-scoped)
// Returns minimal info: id, email, uid, createdAt. Requires auth.
router.get("/service/:id", firebaseAuthRequired, async (req, res) => {
  const serviceId = String(req.params.id || "");
  const tenantId = normalizeTenantId(req.tenant.id);
  const q = (req.query.q || "").toString().trim().toLowerCase();
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "10", 10)));
  if (!serviceId) return res.status(400).json({ status: "error", message: "Missing serviceId" });
  const { subscriptions = [] } = await getData();
  let rows = subscriptions
    .filter((s) => tenantMatches(s.tenantId, tenantId) && (s.type || "service") === "service" && String(s.serviceId || "") === serviceId && !s.canceledAt)
    .map((s) => ({ id: s.id, email: (s.email || "").toLowerCase(), uid: s.uid, createdAt: s.createdAt }));
  if (q) rows = rows.filter((r) => r.email.includes(q));
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  res.json({ page, pageSize, total, items });
});

// Subscribe to a service/listing
router.post("/service", firebaseAuthRequired, async (req, res) => {
  const serviceId = String(req.body?.serviceId || "").trim();
  const tenantScope = normalizeTenantId(req.tenant.id);
  const email = (req.user?.email || "").toLowerCase();
  const uid = req.user?.uid || "";
  const displayName = req.user?.displayName || (email ? email.split("@")[0] : "");
  if (!serviceId) return res.status(400).json({ status: "error", message: "Missing serviceId" });

  const requestedDate = typeof req.body?.scheduledDate === "string" ? req.body.scheduledDate.trim() : "";
  const requestedSlot = typeof req.body?.scheduledSlot === "string" ? req.body.scheduledSlot.trim() : "";

  let created = null;
  let serviceIsBookable = false;
  let targetTenantId = tenantScope;
  try {
    const data = await getData();
    data.subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    const services = Array.isArray(data.services) ? data.services : [];
    const svc = services.find((s) => String(s.id) === serviceId);
    if (!svc) {
      throw Object.assign(new Error("Service listing not found"), { statusCode: 404 });
    }
    targetTenantId = normalizeTenantId(svc.tenantId || tenantScope);
    const vendorId = svc ? String(svc.vendorId || svc.id || "") : "";
    serviceIsBookable = isServiceListing(svc);

    if (serviceIsBookable) {
      if (!isValidDate(requestedDate)) {
        throw Object.assign(new Error("Invalid or missing scheduledDate"), { statusCode: 400 });
      }
      if (!isValidSlot(requestedSlot)) {
        throw Object.assign(new Error("Invalid or missing scheduledSlot"), { statusCode: 400 });
      }
    }

    // Idempotent/reactivation: unique key by (tenantId, email, type=service, serviceId)
    const exists = data.subscriptions.find((x) => {
      const scope = normalizeTenantId(x.tenantId);
      const matchTenant = scope === targetTenantId || scope === "public";
      return matchTenant && (x.email || "").toLowerCase() === email && (x.type || "service") === "service" && String(x.serviceId || "") === serviceId;
    });
    const nowIso = new Date().toISOString();
    if (exists) {
      if (exists.canceledAt) {
        exists.canceledAt = undefined;
        exists.createdAt = nowIso;
      }
      exists.tenantId = targetTenantId;
      if (serviceIsBookable) {
        exists.scheduledDate = requestedDate;
        exists.scheduledSlot = requestedSlot;
      }
      created = exists;
      if (serviceIsBookable) {
        upsertBooking({
          data,
          subscription: exists,
          service: svc,
          scheduledDate: requestedDate,
          scheduledSlot: requestedSlot,
          customerName: displayName,
          bookedAt: exists.createdAt || nowIso,
          status: "scheduled",
        });
      }
    } else {
      const obj = {
        id: uuid(),
        type: "service",
        serviceId,
        vendorId,
        email,
        uid,
        tenantId: targetTenantId,
        createdAt: nowIso,
      };
      if (serviceIsBookable) {
        obj.scheduledDate = requestedDate;
        obj.scheduledSlot = requestedSlot;
      }
      data.subscriptions.push(obj);
      created = obj;

      if (serviceIsBookable) {
        upsertBooking({
          data,
          subscription: obj,
          service: svc,
          scheduledDate: requestedDate,
          scheduledSlot: requestedSlot,
          customerName: displayName,
          bookedAt: nowIso,
          status: "scheduled",
        });
      }
    }
    
    // Save updated data to Firestore
    await saveData(data);
  } catch (err) {
    const statusCode = err?.statusCode || err?.status || 500;
    const message = err?.message || "Failed to create subscription";
    return res.status(statusCode).json({ status: "error", message });
  }

  if (serviceIsBookable && !created?.scheduledDate) {
    return res.status(400).json({ status: "error", message: "Scheduled booking details are required for this listing" });
  }

  res.status(201).json(created);
});

// Unsubscribe from a service/listing
router.delete("/service", firebaseAuthRequired, async (req, res) => {
  const serviceId = String((req.body?.serviceId || req.query?.serviceId || "")).trim();
  const tenantId = normalizeTenantId(req.tenant.id);
  const email = normalizeEmail(req.user?.email || "");
  const uid = req.user?.uid || "";
  if (!serviceId) return res.status(400).json({ status: "error", message: "Missing serviceId" });

  try {
    const data = await getData();
    const before = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    let matches = before.filter((entry) => {
      if (!entry || (entry.type || "service") !== "service") return false;
      const entryService = String(entry.serviceId || "");
      if (entryService !== serviceId) return false;
      const emailMatches = email && normalizeEmail(entry.email) === email;
      const uidMatches = uid && String(entry.uid || "") === String(uid);
      if (!emailMatches && !uidMatches) return false;
      return tenantMatches(entry.tenantId, tenantId, { treatPublicAsWildcard: true });
    });
    if (!matches.length) {
      matches = before.filter((entry) => (entry?.type || "service") === "service" && String(entry?.serviceId || "") === serviceId);
    }
    const after = before.filter((x) => !matches.includes(x));
    const removed = after.length !== before.length;
    data.subscriptions = after;
    if (removed) {
      matches.forEach((sub) => {
        markBookingStatus({ data, subscription: sub, serviceId, customerEmail: sub?.email || email, status: "canceled" });
      });
    }
    
    await saveData(data);
    
    if (!removed) return res.status(404).json({ status: "error", message: "Subscription not found" });
    res.status(204).send();
  } catch (error) {
    console.error('[SUBSCRIPTION] Delete error:', error);
    res.status(500).json({ status: "error", message: error.message || "Failed to delete subscription" });
  }
});

// Cancel (soft) a subscription to preserve revenue history
router.put("/service/cancel", firebaseAuthRequired, async (req, res) => {
  const serviceId = String(req.body?.serviceId || req.query?.serviceId || "").trim();
  const tenantId = normalizeTenantId(req.tenant.id);
  const email = normalizeEmail(req.user?.email || "");
  const uid = req.user?.uid || "";
  if (!serviceId) return res.status(400).json({ status: "error", message: "Missing serviceId" });
  
  try {
    // Get current data from Firestore
    const data = await getData();
    const list = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    
    // Find subscription with multiple fallback strategies
    let idx = -1;
    
    // Strategy 1: Use the existing findSubscriptionIndex function
    idx = findSubscriptionIndex(list, { serviceId, tenantId, email, uid });
    
    // Strategy 2: Find by serviceId and user (email or uid) regardless of tenant, excluding already canceled
    if (idx < 0) {
      idx = list.findIndex((entry) => {
        if (!entry || (entry.type || "service") !== "service") return false;
        if (String(entry.serviceId || "") !== serviceId) return false;
        if (entry.canceledAt) return false; // Skip already canceled subscriptions
        const emailMatches = email && normalizeEmail(entry.email) === email;
        const uidMatches = uid && String(entry.uid || "") === String(uid);
        return emailMatches || uidMatches;
      });
    }
    
    // Strategy 3: Find by serviceId and email only (most permissive)
    if (idx < 0 && email) {
      idx = list.findIndex((entry) => {
        if (!entry || (entry.type || "service") !== "service") return false;
        if (String(entry.serviceId || "") !== serviceId) return false;
        if (entry.canceledAt) return false; // Skip already canceled subscriptions
        return normalizeEmail(entry.email) === email;
      });
    }
    
    // Strategy 4: Find by serviceId and uid only
    if (idx < 0 && uid) {
      idx = list.findIndex((entry) => {
        if (!entry || (entry.type || "service") !== "service") return false;
        if (String(entry.serviceId || "") !== serviceId) return false;
        if (entry.canceledAt) return false; // Skip already canceled subscriptions
        return String(entry.uid || "") === String(uid);
      });
    }
    
    if (idx < 0) {
      return res.status(404).json({ status: "error", message: "Subscription not found" });
    }
    
    // Update the subscription
    const record = list[idx];
    record.canceledAt = new Date().toISOString();
    markBookingStatus({ data, subscription: record, serviceId, customerEmail: record?.email || email, status: "canceled" });
    data.subscriptions = list;
    
    // Save updated data to Firestore
    await saveData(data);
    
    res.json(record);
  } catch (error) {
    console.error('[SUBSCRIPTION] Cancel error:', error);
    res.status(500).json({ status: "error", message: error.message || "Failed to cancel subscription" });
  }
});

export default router;
