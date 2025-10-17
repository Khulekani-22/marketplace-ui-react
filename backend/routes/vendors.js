import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getData, saveData } from "../utils/hybridDataStore.js";
import { isAdminForTenant } from "../middleware/isAdmin.js";
import { VendorSchema } from "../utils/validators.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import { syncVendorToStartup } from "../utils/profileSync.js";

const { Router } = express;
const router = Router();

function normalizeEmail(x){ return (x||"").toString().trim().toLowerCase(); }
function collectUsers(data){
  const seen = new Map();
  const add = (list)=>{
    if (!Array.isArray(list)) return;
    for (const u of list){
      if (!u || typeof u !== 'object') continue;
      const em = normalizeEmail(u.email);
      if (!em) continue;
      if (!seen.has(em)) seen.set(em, { email: em, tenantId: u.tenantId || 'public', role: u.role || 'member' });
    }
  };
  add(data?.users);
  if (seen.size) return Array.from(seen.values());
  (function walk(node){
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)){
      if (node.length && typeof node[0] === 'object' && node[0] && ('email' in node[0])) add(node);
      for (const v of node) walk(v);
      return;
    }
    for (const k of Object.keys(node)) walk(node[k]);
  })(data);
  return Array.from(seen.values());
}
function mapTenant(id){ return (id === 'vendor') ? 'public' : (id || 'public'); }
function isAdminRequest(req) { return isAdminForTenant(req); }

router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      q = "",
    } = req.query;

    const { vendors = [] } = await getData();
    const tenantId = req.tenant.id;
    
    let rows = vendors.filter(
      (v) => (v.tenantId ?? "public") === tenantId || (tenantId === "public" && !v.tenantId)
    );

    // Add search functionality if needed
    if (q) {
      const needle = String(q).toLowerCase();
      rows = rows.filter(
        (v) =>
          v.name?.toLowerCase().includes(needle) ||
          v.companyName?.toLowerCase().includes(needle) ||
          v.email?.toLowerCase().includes(needle) ||
          v.skills?.some((s) => s.toLowerCase().includes(needle))
      );
    }

    // Pagination
    const p = Math.max(1, parseInt(page));
    const ps = Math.min(100, Math.max(1, parseInt(pageSize)));
    const total = rows.length;
    const start = (p - 1) * ps;
    const slice = rows.slice(start, start + ps);

    res.json({ page: p, pageSize: ps, total, items: slice });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

router.post("/", firebaseAuthRequired, async (req, res, next) => {
  try {
    const parsed = VendorSchema.parse(req.body);
    const id = parsed.id || uuid();
    const tenantId = req.tenant.id;
    const ownerUid = parsed.ownerUid || req.user?.uid || undefined;
    const contactEmail = (parsed.contactEmail || req.user?.email || "").toLowerCase();

    let updated = false;
    let result = null;
    
    const data = await getData();
    data.vendors = data.vendors || [];
    const idx = data.vendors.findIndex((v) => {
      const sameTenant = (v.tenantId ?? "public") === tenantId;
      if (!sameTenant) return false;
      const vEmail = (v.contactEmail || v.email || "").toLowerCase();
      return (
        v.id === id ||
        (!!ownerUid && v.ownerUid === ownerUid) ||
        (!!contactEmail && vEmail === contactEmail)
      );
    });
    if (idx !== -1) {
      // Upsert: merge into existing vendor
      const existingId = data.vendors[idx].id || id;
      data.vendors[idx] = {
        ...data.vendors[idx],
        ...parsed,
        id: existingId,
        tenantId,
        ...(ownerUid ? { ownerUid } : {}),
        ...(contactEmail ? { contactEmail } : {}),
      };
      updated = true;
      result = data.vendors[idx];
    } else {
      const obj = {
        ...parsed,
        id,
        tenantId,
        ...(ownerUid ? { ownerUid } : {}),
        ...(contactEmail ? { contactEmail } : {}),
      };
      data.vendors.push(obj);
      result = obj;
    }
    await saveData(data);

    // Auto-sync vendor data to startup profile if exists
    if (result && (ownerUid || contactEmail)) {
      const syncResult = await syncVendorToStartup(result);
      if (syncResult.synced) {
        console.log('[Vendors] Auto-synced to startup:', syncResult.startupId);
        result.syncedToStartup = true;
        result.lastSyncedAt = syncResult.timestamp;
      }
    }

    res.status(updated ? 200 : 201).json(result);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", firebaseAuthRequired, async (req, res, next) => {
  try {
    const id = req.params.id;
    const tenantId = req.tenant.id;
    const partial = VendorSchema.partial().parse(req.body);

    let updated = null;
    const data = await getData();
    data.vendors = data.vendors || [];
    const idx = data.vendors.findIndex(
      (v) => v.id === id && (v.tenantId ?? "public") === tenantId
    );
    if (idx !== -1) {
      data.vendors[idx] = { ...data.vendors[idx], ...partial };
      updated = data.vendors[idx];
    }
    await saveData(data);

    if (!updated) return res.status(404).json({ status: "error", message: "Not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", firebaseAuthRequired, async (req, res) => {
  const id = req.params.id;
  const tenantId = req.tenant.id;
  let removed = false;
  
  const data = await getData();
  data.vendors = (data.vendors || []).filter((v) => {
    const match = v.id === id && (v.tenantId ?? "public") === tenantId;
    if (match) removed = true;
    return !match;
  });
  await saveData(data);

  if (!removed) return res.status(404).json({ status: "error", message: "Not found" });
  res.status(204).send();
});

export default router;

// ---- Admin: Rename a vendor id across the datastore (tenant-scoped) ----
// POST /api/data/vendors/rename-id
// Body: { ownerUid?: string, oldId?: string, newId: string }
// Matches vendor in current tenant by (ownerUid OR oldId). Updates:
// - startups[].{id,vendorId}
// - vendors[].{id}
// - services[].vendorId
// - subscriptions[].vendorId
// - bookings[].vendorId
// - messageThreads[].participantIds/participants.id/messages[].senderId containing `vendor:<id>`; and context.vendorId
router.post("/rename-id", firebaseAuthRequired, async (req, res) => {
  const tenantId = req.tenant.id;
  const ownerUid = (req.body?.ownerUid || "").toString().trim();
  const oldId = (req.body?.oldId || "").toString().trim();
  const newId = (req.body?.newId || "").toString().trim();
  const emailParam = (req.body?.email || "").toString().trim().toLowerCase();
  if (!newId) return res.status(400).json({ status: "error", message: "Missing newId" });

  // Require admin OR the vendor owner themself
  const isSelf = ownerUid && (req.user?.uid === ownerUid);
  if (!isAdminRequest(req) && !isSelf) {
    return res.status(403).json({ status: "error", message: "Forbidden" });
  }

  const result = { tenantId, matched: false, changes: { startups: 0, vendors: 0, services: 0, subscriptions: 0, bookings: 0, threads: 0 } };

  try {
    const data = await getData();
    // Resolve email for convenience matching in services without vendorId (optional)
    let vendorEmail = emailParam || "";

    // Update startups directory (primary vendor directory)
    const startups = Array.isArray(data.startups) ? data.startups : [];
    startups.forEach((v, i) => {
      const sameTenant = (v.tenantId ?? "public") === tenantId;
      if (!sameTenant) return;
      const vid = String(v.vendorId || v.id || "");
      const isMatch = (!!ownerUid && String(v.ownerUid || "") === ownerUid) || (!!oldId && vid === oldId);
      if (isMatch) {
        result.matched = true;
        vendorEmail = (v.contactEmail || v.email || "").toLowerCase();
        const prev = startups[i];
        startups[i] = { ...prev, id: newId, vendorId: newId };
        result.changes.startups += 1;
      }
    });
    data.startups = startups;

    // If not matched in startups, try other pools (vendors/companies/profiles) within tenant
    if (!result.matched) {
      const pools = [
        Array.isArray(data.vendors) ? data.vendors : [],
        Array.isArray(data.companies) ? data.companies : [],
        Array.isArray(data.profiles) ? data.profiles : [],
      ];
      let found = null;
      for (const arr of pools) {
        const hit = arr.find((v) => {
          const sameTenant = (v.tenantId ?? "public") === tenantId;
          if (!sameTenant) return false;
          const vid = String(v.vendorId || v.id || "");
          const vEmail = (v.contactEmail || v.email || "").toLowerCase();
          return (!!ownerUid && String(v.ownerUid || "") === ownerUid) || (!!oldId && vid === oldId) || (!!vendorEmail && vEmail === vendorEmail);
        });
        if (hit) { found = hit; break; }
      }
      if (found || vendorEmail) {
        const e = (found?.contactEmail || found?.email || vendorEmail || "").toLowerCase();
        vendorEmail = e;
        const name = found?.companyName || found?.name || (e ? e.split("@")[0] : "Vendor");
        startups.push({
          ...(found || {}),
          id: newId,
          vendorId: newId,
          contactEmail: e,
          tenantId,
        });
        data.startups = startups;
        result.matched = true;
        result.changes.startups += 1;
      }
    }

    // Update vendors collection (if used)
    const vendors = Array.isArray(data.vendors) ? data.vendors : [];
    vendors.forEach((v, i) => {
      const sameTenant = (v.tenantId ?? "public") === tenantId;
      if (!sameTenant) return;
      const vid = String(v.vendorId || v.id || "");
      const isMatch = (!!ownerUid && String(v.ownerUid || "") === ownerUid) || (!!oldId && vid === oldId);
      if (isMatch) {
        const prev = vendors[i];
        vendors[i] = { ...prev, id: newId };
        result.changes.vendors += 1;
      }
    });
    data.vendors = vendors;

    // Update services (listings)
    const services = Array.isArray(data.services) ? data.services : [];
    services.forEach((s, i) => {
      const sameTenant = (s.tenantId ?? "public") === tenantId;
      if (!sameTenant) return;
      const sid = String(s.vendorId || "");
      if ((oldId && sid === oldId) || (!sid && vendorEmail && (s.contactEmail || "").toLowerCase() === vendorEmail)) {
        services[i] = { ...s, vendorId: newId };
        result.changes.services += 1;
      }
    });
    data.services = services;

    // Update subscriptions convenience vendorId
    const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    subscriptions.forEach((x) => {
      const sameTenant = (x.tenantId ?? "public") === tenantId;
      if (!sameTenant) return;
      if (String(x.vendorId || "") === oldId) { x.vendorId = newId; result.changes.subscriptions += 1; }
    });
    data.subscriptions = subscriptions;

    // Update bookings vendorId
    const bookings = Array.isArray(data.bookings) ? data.bookings : [];
    bookings.forEach((b) => {
      const sameTenant = (b.tenantId ?? "public") === tenantId;
      if (!sameTenant) return;
      if (String(b.vendorId || "") === oldId) { b.vendorId = newId; result.changes.bookings += 1; }
    });
    data.bookings = bookings;

    // Update message threads: participantIds, participants.id, context.vendorId, messages[].senderId
    const threads = Array.isArray(data.messageThreads) ? data.messageThreads : [];
    const from = `vendor:${oldId}`;
    const to = `vendor:${newId}`;
    threads.forEach((t, idx) => {
      const sameTenant = (t.tenantId ?? "public") === tenantId;
      if (!sameTenant) return;
      let touched = false;
      if (t.context && String(t.context.vendorId || "") === oldId) {
        t.context.vendorId = newId; touched = true;
      }
      if (Array.isArray(t.participantIds)) {
        const nextIds = t.participantIds.map((id) => (id === from ? to : id));
        if (nextIds.join("|") !== t.participantIds.join("|")) { t.participantIds = Array.from(new Set(nextIds)); touched = true; }
      }
      if (Array.isArray(t.participants)) {
        t.participants = t.participants.map((p) => (p?.id === from ? { ...p, id: to } : p));
      }
      if (Array.isArray(t.messages)) {
        t.messages = t.messages.map((m) => (m?.senderId === from ? { ...m, senderId: to } : m));
      }
      if (touched) { threads[idx] = t; result.changes.threads += 1; }
    });
    data.messageThreads = threads;

    await saveData(data);

    if (!result.matched) return res.status(404).json({ status: "error", message: "Vendor not found for given ownerUid/oldId in tenant and no email provided" });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to rename vendor id" });
  }

  try {
    saveData((data) => {
      // Resolve email for convenience matching in services without vendorId (optional)
      let vendorEmail = emailParam || "";

      // Update startups directory (primary vendor directory)
      const startups = Array.isArray(data.startups) ? data.startups : [];
      startups.forEach((v, i) => {
        const sameTenant = (v.tenantId ?? "public") === tenantId;
        if (!sameTenant) return;
        const vid = String(v.vendorId || v.id || "");
        const isMatch = (!!ownerUid && String(v.ownerUid || "") === ownerUid) || (!!oldId && vid === oldId);
        if (isMatch) {
          result.matched = true;
          vendorEmail = (v.contactEmail || v.email || "").toLowerCase();
          const prev = startups[i];
          startups[i] = { ...prev, id: newId, vendorId: newId };
          result.changes.startups += 1;
        }
      });
      data.startups = startups;

      // If not matched in startups, try other pools (vendors/companies/profiles) within tenant
      if (!result.matched) {
        const pools = [
          Array.isArray(data.vendors) ? data.vendors : [],
          Array.isArray(data.companies) ? data.companies : [],
          Array.isArray(data.profiles) ? data.profiles : [],
        ];
        let found = null;
        for (const arr of pools) {
          const hit = arr.find((v) => {
            const sameTenant = (v.tenantId ?? "public") === tenantId;
            if (!sameTenant) return false;
            const vid = String(v.vendorId || v.id || "");
            const vEmail = (v.contactEmail || v.email || "").toLowerCase();
            return (!!ownerUid && String(v.ownerUid || "") === ownerUid) || (!!oldId && vid === oldId) || (!!vendorEmail && vEmail === vendorEmail);
          });
          if (hit) { found = hit; break; }
        }
        if (found || vendorEmail) {
          const e = (found?.contactEmail || found?.email || vendorEmail || "").toLowerCase();
          vendorEmail = e;
          const name = found?.companyName || found?.name || (e ? e.split("@")[0] : "Vendor");
          startups.push({
            ...(found || {}),
            id: newId,
            vendorId: newId,
            contactEmail: e,
            tenantId,
          });
          data.startups = startups;
          result.matched = true;
          result.changes.startups += 1;
        }
      }

      // Update vendors collection (if used)
      const vendors = Array.isArray(data.vendors) ? data.vendors : [];
      vendors.forEach((v, i) => {
        const sameTenant = (v.tenantId ?? "public") === tenantId;
        if (!sameTenant) return;
        const vid = String(v.vendorId || v.id || "");
        const isMatch = (!!ownerUid && String(v.ownerUid || "") === ownerUid) || (!!oldId && vid === oldId);
        if (isMatch) {
          const prev = vendors[i];
          vendors[i] = { ...prev, id: newId };
          result.changes.vendors += 1;
        }
      });
      data.vendors = vendors;

      // Update services (listings)
      const services = Array.isArray(data.services) ? data.services : [];
      services.forEach((s, i) => {
        const sameTenant = (s.tenantId ?? "public") === tenantId;
        if (!sameTenant) return;
        const sid = String(s.vendorId || "");
        if ((oldId && sid === oldId) || (!sid && vendorEmail && (s.contactEmail || "").toLowerCase() === vendorEmail)) {
          services[i] = { ...s, vendorId: newId };
          result.changes.services += 1;
        }
      });
      data.services = services;

      // Update subscriptions convenience vendorId
      const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
      subscriptions.forEach((x) => {
        const sameTenant = (x.tenantId ?? "public") === tenantId;
        if (!sameTenant) return;
        if (String(x.vendorId || "") === oldId) { x.vendorId = newId; result.changes.subscriptions += 1; }
      });
      data.subscriptions = subscriptions;

      // Update bookings vendorId
      const bookings = Array.isArray(data.bookings) ? data.bookings : [];
      bookings.forEach((b) => {
        const sameTenant = (b.tenantId ?? "public") === tenantId;
        if (!sameTenant) return;
        if (String(b.vendorId || "") === oldId) { b.vendorId = newId; result.changes.bookings += 1; }
      });
      data.bookings = bookings;

      // Update message threads: participantIds, participants.id, context.vendorId, messages[].senderId
      const threads = Array.isArray(data.messageThreads) ? data.messageThreads : [];
      const from = `vendor:${oldId}`;
      const to = `vendor:${newId}`;
      threads.forEach((t, idx) => {
        const sameTenant = (t.tenantId ?? "public") === tenantId;
        if (!sameTenant) return;
        let touched = false;
        if (t.context && String(t.context.vendorId || "") === oldId) {
          t.context.vendorId = newId; touched = true;
        }
        if (Array.isArray(t.participantIds)) {
          const nextIds = t.participantIds.map((id) => (id === from ? to : id));
          if (nextIds.join("|") !== t.participantIds.join("|")) { t.participantIds = Array.from(new Set(nextIds)); touched = true; }
        }
        if (Array.isArray(t.participants)) {
          t.participants = t.participants.map((p) => (p?.id === from ? { ...p, id: to } : p));
        }
        if (Array.isArray(t.messages)) {
          t.messages = t.messages.map((m) => (m?.senderId === from ? { ...m, senderId: to } : m));
        }
        if (touched) { threads[idx] = t; result.changes.threads += 1; }
      });
      data.messageThreads = threads;

      return data;
    });

    if (!result.matched) return res.status(404).json({ status: "error", message: "Vendor not found for given ownerUid/oldId in tenant and no email provided" });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to rename vendor id" });
  }
});

// ---- Migration: upgrade all startups -> vendors (idempotent) ----
// POST /api/data/vendors/migrate-startups
// Uses same matching rules as POST (by id OR ownerUid OR contactEmail within tenant)
router.post("/migrate-startups", firebaseAuthRequired, async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const result = { scanned: 0, created: 0, updated: 0 };

    function toVendor(s) {
      const email = (s.contactEmail || s.email || "").toLowerCase();
      const statusRaw = (s.status || s.approvalStatus || "pending").toLowerCase();
      const status = ["active", "pending", "suspended"].includes(statusRaw)
        ? statusRaw
        : statusRaw === "approved"
        ? "active"
        : statusRaw === "rejected"
        ? "suspended"
        : "pending";
      return {
        id: String(s.vendorId || s.id || email || ""),
        name: s.name || s.companyName || s.vendor || s.displayName || "",
        contactEmail: email,
        ownerUid: s.ownerUid || s.uid || undefined,
        phone: s.phone || s.phoneNumber || "",
        website: s.website || s.url || "",
        description: s.description || "",
        logoUrl: s.logoUrl || s.logo || s.avatar || "",
        bannerUrl: s.bannerUrl || "",
        country: s.country || "",
        city: s.city || "",
        addressLine: s.addressLine || s.address || "",
        socials: {
          twitter: s.socials?.twitter || "",
          linkedin: s.socials?.linkedin || "",
          facebook: s.socials?.facebook || "",
          instagram: s.socials?.instagram || "",
          youtube: s.socials?.youtube || "",
          github: s.socials?.github || "",
        },
        categories: Array.isArray(s.categories)
          ? s.categories
          : typeof s.categories === "string"
          ? s.categories.split(",").map((x) => x.trim()).filter(Boolean)
          : [],
        tags: Array.isArray(s.tags)
          ? s.tags
          : typeof s.tags === "string"
          ? s.tags.split(",").map((x) => x.trim()).filter(Boolean)
          : [],
        foundedYear: s.foundedYear || "",
        teamSize: s.teamSize || "",
        registrationNo: s.registrationNo || "",
        status,
        kycStatus: s.kycStatus || (status === "active" ? "approved" : "pending"),
        tenantId: s.tenantId || tenantId,
      };
    }

    const data = await getData();
    data.vendors = data.vendors || [];
    const startups = Array.isArray(data.startups) ? data.startups : [];
    result.scanned = startups.length;

    startups.forEach((s) => {
      const v = toVendor(s);
      const email = v.contactEmail;
      const matchIdx = data.vendors.findIndex((it) => {
        const sameTenant = (it.tenantId ?? "public") === (v.tenantId ?? tenantId);
        if (!sameTenant) return false;
        const itEmail = (it.contactEmail || it.email || "").toLowerCase();
        return it.id === v.id || (v.ownerUid && it.ownerUid === v.ownerUid) || (!!email && itEmail === email);
      });
      if (matchIdx !== -1) {
        data.vendors[matchIdx] = { ...data.vendors[matchIdx], ...v, id: data.vendors[matchIdx].id || v.id };
        result.updated++;
      } else {
        data.vendors.push(v);
        result.created++;
      }
    });

    // Clear startups after migration
    data.startups = [];
    await saveData(data);

    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

// Vendor stats: listings, reviews, bookings/revenue, subscription (scaffold)
router.get("/:id/stats", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ status: "error", message: "Missing vendor id" });
  const tenantId = req.tenant.id;
  try {
    const data = await getData();
    const vendors = Array.isArray(data.vendors) ? data.vendors : [];
    const services = Array.isArray(data.services) ? data.services : [];
    const bookings = Array.isArray(data.bookings) ? data.bookings : [];
    const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];

    const qEmail = String(req.query.email || "").trim().toLowerCase();
    const qUid = String(req.query.uid || "").trim();
    const qName = String(req.query.name || "").trim().toLowerCase();

    // Find vendor record (within tenant if present) by id, then by email, then by ownerUid
    let vendor = vendors.find((v) => (String(v.id) === id || String(v.vendorId) === id) && (v.tenantId ?? "public") === tenantId);
    if (!vendor && qEmail) {
      vendor = vendors.find((v) => (v.tenantId ?? "public") === tenantId && (String(v.contactEmail || v.email || "").toLowerCase() === qEmail));
    }
    if (!vendor && qUid) {
      vendor = vendors.find((v) => (v.tenantId ?? "public") === tenantId && String(v.ownerUid || "") === qUid);
    }
    const vEmail = (qEmail || (vendor?.contactEmail || vendor?.email || "")).toLowerCase();
    const vName = (qName || vendor?.name || vendor?.companyName || "").toLowerCase();
    const vId = vendor?.vendorId || vendor?.id || id;

    // Listings for this vendor (by vendorId or contactEmail)
    const myServices = services.filter((s) => {
      const sid = String(s.vendorId || s.id || "");
      const se = (s.contactEmail || s.email || "").toLowerCase();
      const sv = String(s.vendor || "").toLowerCase();
      return (
        sid === vId ||
        sid === id ||
        (!!vEmail && se === vEmail) ||
        (!!vName && !sid && sv === vName)
      );
    });
    const totalListings = myServices.length;
    const byStatus = myServices.reduce((acc, s) => {
      const k = (s.status || "approved").toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const totalReviews = myServices.reduce((n, s) => n + (Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0)) || 0), 0);
    const avgRating = (() => {
      const ratings = myServices.map((s) => Number(s.rating || 0)).filter((x) => !Number.isNaN(x));
      if (!ratings.length) return 0;
      const sum = ratings.reduce((a, b) => a + b, 0);
      return sum / ratings.length;
    })();

    // Bookings & revenue for this vendor
    const myBookings = bookings.filter((b) => String(b.vendorId || "") === id || (!!vEmail && (b.vendorEmail || "").toLowerCase() === vEmail));
    const totalBookings = myBookings.length;
    const completed = myBookings.filter((b) => (b.status || "").toLowerCase() === "completed");
    const revenue = completed.reduce((sum, b) => sum + (Number(b.price || 0) || 0), 0);

    // Subscriptions: totals and per-listing within current tenant
    const myServiceIds = new Set(myServices.map((s) => String(s.id || s.vendorId || "")));
    const subByService = {};
    let totalSubscriptions = 0;
    subscriptions.forEach((x) => {
      const tOk = (x.tenantId ?? "public") === tenantId;
      const sid = String(x.serviceId || "");
      if (tOk && myServiceIds.has(sid)) {
        totalSubscriptions += 1;
        subByService[sid] = (subByService[sid] || 0) + 1;
      }
    });

    // Time-bucketed sales based on subscription pricing
    function ym(d) {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    }
    function yq(d) {
      const dt = new Date(d);
      const q = Math.floor(dt.getMonth() / 3) + 1;
      return `${dt.getFullYear()}-Q${q}`;
    }
    function yy(d) {
      const dt = new Date(d);
      return String(dt.getFullYear());
    }
    const monthly = {}; // key -> { revenue, count }
    const quarterly = {};
    const annual = {};

    // Build price map per service (fallback to 0 if missing)
    const priceByService = myServices.reduce((m, s) => {
      m[String(s.id || s.vendorId || "")] = Number(s.price || 0) || 0;
      return m;
    }, {});

    // For each subscription, add recurring revenue for each month it is active
    const now = new Date();
    const endThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    subscriptions.forEach((x) => {
      const tOk = (x.tenantId ?? "public") === tenantId;
      const sid = String(x.serviceId || "");
      if (!tOk || !myServiceIds.has(sid)) return;
      const price = priceByService[sid] || 0;
      const start = new Date(x.createdAt || now);
      const end = x.canceledAt ? new Date(x.canceledAt) : endThisMonth;
      // Normalize to first day of month
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      const stop = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cur <= stop) {
        const keyM = ym(cur);
        const keyQ = yq(cur);
        const keyY = yy(cur);
        if (!monthly[keyM]) monthly[keyM] = { revenue: 0, count: 0 };
        if (!quarterly[keyQ]) quarterly[keyQ] = { revenue: 0, count: 0 };
        if (!annual[keyY]) annual[keyY] = { revenue: 0, count: 0 };
        monthly[keyM].revenue += price; monthly[keyM].count += 1;
        quarterly[keyQ].revenue += price; quarterly[keyQ].count += 1;
        annual[keyY].revenue += price; annual[keyY].count += 1;
        // next month
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
    });

    // Subscription scaffold (based on vendor status/kyc)
    const subscription = {
      plan: vendor ? (vendor.subscriptionPlan || "Free") : "Free",
      status: vendor ? ((vendor.status || vendor.kycStatus || "pending").toLowerCase()) : "pending",
    };

    res.json({
      vendorId: id,
      listingStats: { total: totalListings, byStatus },
      reviewStats: { totalReviews, avgRating },
      bookingStats: { totalBookings, revenue },
      subscriptionStats: { total: totalSubscriptions, byService: subByService },
      salesTime: { monthly, quarterly, annual },
      subscription,
      listings: myServices.map((s) => ({ id: String(s.id || s.vendorId || ""), title: s.title || "", status: (s.status || "approved").toLowerCase(), rating: Number(s.rating || 0), reviewCount: Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0) || 0), category: s.category || "" })),
    });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to compute stats" });
  }
});
