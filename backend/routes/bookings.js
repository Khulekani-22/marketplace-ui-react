import express from "express";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import { getData } from "../utils/hybridDataStore.js";

const router = express.Router();
const db = getFirestore();

function normalizeTenantId(id) {
  if (!id) return "public";
  const value = String(id).trim().toLowerCase();
  return value === "vendor" ? "public" : value;
}

function sameTenant(entryTenant, tenantId) {
  const entry = normalizeTenantId(entryTenant);
  const current = normalizeTenantId(tenantId);
  if (entry === current) return true;
  return !entry && current === "public";
}

function normalizeEmail(value) {
  return (value || "").toString().trim().toLowerCase();
}

function collectId(targetSet, value) {
  if (value === undefined || value === null) return;
  const str = String(value).trim();
  if (!str) return;
  targetSet.add(str);
  targetSet.add(str.toLowerCase());
}

function hasId(targetSet, value) {
  if (value === undefined || value === null) return false;
  const str = String(value).trim();
  if (!str) return false;
  return targetSet.has(str) || targetSet.has(str.toLowerCase());
}

function buildVendorScope(data, tenantId, user, vendorHint) {
  const pools = [
    Array.isArray(data?.vendors) ? data.vendors : [],
    Array.isArray(data?.startups) ? data.startups : [],
    Array.isArray(data?.companies) ? data.companies : [],
    Array.isArray(data?.profiles) ? data.profiles : [],
  ];

  const emailLc = normalizeEmail(user?.email);
  const uid = (user?.uid || "").toString();

  let vendorRecord = null;

  if (uid) {
    for (const arr of pools) {
      const match = arr.find((v) => String(v?.ownerUid || v?.uid || v?.id || "") === uid);
      if (match) {
        vendorRecord = match;
        break;
      }
    }
  }

  if (!vendorRecord && emailLc) {
    for (const arr of pools) {
      const match = arr.find((v) => normalizeEmail(v?.contactEmail || v?.email) === emailLc);
      if (match) {
        vendorRecord = match;
        break;
      }
    }
  }

  if (!vendorRecord && emailLc) {
    for (const arr of pools) {
      const match = arr.find(
        (v) => Array.isArray(v?.members) && v.members.some((m) => normalizeEmail(m?.email) === emailLc)
      );
      if (match) {
        vendorRecord = match;
        break;
      }
    }
  }

  const ids = new Set();
  const serviceIds = new Set();
  const emails = new Set();
  const vendorNames = new Set();

  collectId(ids, vendorHint);
  collectId(ids, uid);
  if (emailLc) emails.add(emailLc);

  if (vendorRecord) {
    collectId(ids, vendorRecord.vendorId);
    collectId(ids, vendorRecord.id);
    collectId(ids, vendorRecord.ownerUid);
    collectId(ids, vendorRecord.uid);
    const vrEmail = normalizeEmail(vendorRecord.contactEmail || vendorRecord.email);
    if (vrEmail) emails.add(vrEmail);
    const name = (vendorRecord.vendor || vendorRecord.name || "").toString().trim().toLowerCase();
    if (name) vendorNames.add(name);
  }

  const services = Array.isArray(data?.services) ? data.services : [];
  services.forEach((service) => {
    if (!sameTenant(service?.tenantId, tenantId)) return;
    const svcEmail = normalizeEmail(service?.contactEmail || service?.email);
    const svcName = (service?.vendor || service?.vendorName || "").toString().trim().toLowerCase();
    const svcVendorId = service?.vendorId || service?.id;
    const svcOwnerUid = service?.ownerUid || service?.ownerId;

    const matchesVendor =
      hasId(ids, svcVendorId) ||
      hasId(ids, service?.id) ||
      hasId(ids, service?.serviceId) ||
      hasId(ids, svcOwnerUid) ||
      (svcEmail && emails.has(svcEmail)) ||
      (svcName && vendorNames.has(svcName));

    if (matchesVendor) {
      collectId(serviceIds, service?.id);
      collectId(serviceIds, service?.serviceId);
    }
  });

  return {
    ids,
    emails,
    vendorNames,
    serviceIds,
    vendorRecord,
  };
}

function bookingBelongsToVendor(scope, booking, tenantId) {
  if (!sameTenant(booking?.tenantId, tenantId)) return false;
  const bookingVendorEmail = normalizeEmail(booking?.vendorEmail);
  const bookingVendorName = (booking?.vendorName || "").toString().trim().toLowerCase();
  return (
    hasId(scope.ids, booking?.vendorId) ||
    hasId(scope.ids, booking?.vendor?.id) ||
    hasId(scope.serviceIds, booking?.serviceId) ||
    hasId(scope.ids, booking?.serviceId) ||
    (bookingVendorEmail && scope.emails.has(bookingVendorEmail)) ||
    (bookingVendorName && scope.vendorNames.has(bookingVendorName))
  );
}

router.get("/vendor/:vendorId", firebaseAuthRequired, async (req, res) => {
  const vendorParam = (req.params.vendorId || "").toString().trim();
  if (!vendorParam) {
    return res.status(400).json({ error: "Missing vendorId" });
  }

  try {
    const tenantId = req.tenant?.id || "public";
    const forceReload = req.query.refresh === "true";
    const data = await getData(forceReload);
    const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
    const scope = buildVendorScope(data, tenantId, req.user || {}, vendorParam);

    // Allow special hints like "me" to resolve from vendor scope
    if ((vendorParam || "").toLowerCase() === "me") {
      collectId(scope.ids, scope.vendorRecord?.vendorId);
      collectId(scope.ids, scope.vendorRecord?.id);
    }

    const vendorBookings = bookings
      .filter((booking) => bookingBelongsToVendor(scope, booking, tenantId))
      .map((booking) => ({ ...booking }));

    vendorBookings.sort((a, b) => {
      const first = Date.parse(b?.scheduledDate || b?.bookedAt || b?.createdAt || "");
      const second = Date.parse(a?.scheduledDate || a?.bookedAt || a?.createdAt || "");
      return first - second;
    });

    return res.json({ bookings: vendorBookings, total: vendorBookings.length });
  } catch (error) {
    console.error("[bookings] Failed to load vendor bookings:", error);
    return res.status(500).json({ error: "Failed to load bookings" });
  }
});

// PATCH/POST meeting link for a booking
router.post("/:bookingId/meeting-link", firebaseAuthRequired, async (req, res) => {
  const { bookingId } = req.params;
  const { link } = req.body || {};

  const trimmedLink = typeof link === "string" ? link.trim() : "";

  if (!bookingId) {
    return res.status(400).json({ error: "Missing bookingId" });
  }
  if (!trimmedLink) {
    return res.status(400).json({ error: "Meeting link is required" });
  }

  try {
    let url;
    try {
      url = new URL(trimmedLink);
    } catch {
      return res.status(400).json({ error: "Meeting link must be a valid URL" });
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return res.status(400).json({ error: "Meeting link must use http or https" });
    }

    const bookingRef = db.collection("bookings").doc(bookingId);
    const snap = await bookingRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = { id: snap.id, ...snap.data() };
    const tenantId = req.tenant?.id || "public";
    const data = await getData();
    const scope = buildVendorScope(data, tenantId, req.user || {}, bookingData?.vendorId);

    if (!bookingBelongsToVendor(scope, bookingData, tenantId)) {
      return res.status(403).json({ error: "You do not have access to this booking" });
    }

    await bookingRef.set(
      {
        meetingLink: trimmedLink,
        meetingLinkUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Refresh cached dataset so subsequent fetch returns the updated meeting link
    await getData(true);

    return res.json({ success: true, booking: { ...bookingData, meetingLink: trimmedLink } });
  } catch (err) {
    console.error("[bookings] Failed to update meeting link:", err);
    return res.status(500).json({ error: "Failed to update meeting link", details: err.message });
  }
});

export default router;
