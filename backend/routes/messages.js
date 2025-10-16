import { Router } from "express";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getData, saveData } from "../utils/hybridDataStore.js";
import { isAdminForTenant } from "../middleware/isAdmin.js";
import { messageListLimiter } from "../middleware/rateLimiters.js";

const router = Router();

function normalizeEmail(x) {
  return (x || "").toString().trim().toLowerCase();
}

function mapTenant(id){ return (id === 'vendor') ? 'public' : (id || 'public'); }
function isAdminRequest(req) { return isAdminForTenant(req); }

function nowIso() {
  return new Date().toISOString();
}

function listVendors(data = {}) {
  const startups = Array.isArray(data.startups) ? data.startups : [];
  const vendors = Array.isArray(data.vendors) ? data.vendors : [];
  if (!startups.length && !vendors.length) return [];
  const merged = [...vendors, ...startups];
  const byKey = new Map();
  merged.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const key = String(entry.vendorId || entry.id || entry.email || entry.contactEmail || "");
    if (!key) return;
    if (!byKey.has(key)) byKey.set(key, entry);
  });
  return Array.from(byKey.values());
}

// POST /api/messages
// Body: { listingId, listingTitle, vendorId, vendorEmail?, subject, content }
// Appends a message to a per-listing feedback thread (creates if missing)
router.post("/", firebaseAuthRequired, async (req, res) => {
  const {
    listingId = "",
    listingTitle = "",
    vendorId = "",
    vendorEmail = "",
    subject: subjectRaw = "",
    content: contentRaw = "",
  } = req.body || {};

  const content = (contentRaw || "").toString().trim();
  const subject = (subjectRaw || "").toString().trim() || `Listing Feedback • ${listingTitle || listingId}`;
  if (!listingId || !content) {
    return res.status(400).json({ status: "error", message: "Missing listingId or content" });
  }

  const senderEmail = normalizeEmail(req.user?.email);
  const senderIsAdmin = isAdminRequest(req);

  try {
    const data = await getData();
    const tenantId = req.tenant?.id || "public";
    const threads = Array.isArray(data.messageThreads) ? data.messageThreads : [];

    const adminEmail = senderIsAdmin ? normalizeEmail(req.user?.email) : "";
    // Try to find an existing thread for this listingId; if admin-sent, prefer same-admin thread
    let idx = threads.findIndex((t) => (
      (t?.context?.type === "listing-feedback") &&
      (t?.context?.listingId === String(listingId)) &&
      ((t?.tenantId || "public") === tenantId) &&
      (!adminEmail || normalizeEmail(t?.context?.adminEmail) === adminEmail)
    ));

    // Resolve vendor info from data if not provided
    const vendors = listVendors(data);
    const services = Array.isArray(data.services) ? data.services : [];
    let vendorObj = vendors.find((v) => String(v.vendorId || v.id) === String(vendorId));
    if (!vendorObj) {
      const svc = services.find((s) => String(s.id) === String(listingId));
      if (svc) {
        vendorObj = vendors.find((v) => String(v.vendorId || v.id) === String(svc.vendorId));
      }
    }
    // If an admin is sending and we cannot resolve a vendor from the listing, reject.
    if (senderIsAdmin && !vendorObj) {
      throw Object.assign(new Error("Vendor not found for listing"), { status: 400 });
    }
    const vEmail = normalizeEmail(vendorEmail || vendorObj?.email || vendorObj?.contactEmail);
    const vIdRaw = vendorId || vendorObj?.vendorId || vendorObj?.id || vEmail || "vendor";
    const vId = String(vIdRaw);
    const vName = vendorObj?.companyName || vendorObj?.name || vendorObj?.displayName || vEmail || vId || "Vendor";

    const participants = [
      { id: `vendor:${vId}`, name: vName, role: "Vendor" },
      adminEmail ? { id: `admin:${adminEmail}`, name: req.user?.email || "Admin", role: "Admin" } : { id: `admin`, name: "Admin", role: "Admin" },
    ];
    const vendorEmailKey = vEmail && vEmail !== vId ? `vendor:${vEmail}` : null;
    const participantIds = Array.from(
      new Set([
        ...participants.map((p) => p.id),
        ...(vendorEmailKey ? [vendorEmailKey] : []),
      ])
    );

    const threadBase = {
      id: `t${Date.now().toString(36)}`,
      subject,
      participants,
      participantIds,
      messages: [],
      read: false,
      context: {
        type: "listing-feedback",
        listingId: String(listingId),
        listingTitle,
        vendorId: vId,
        vendorEmail: vEmail || undefined,
        adminEmail: adminEmail || undefined,
      },
      tenantId,
    };

    const message = {
      id: `m${Date.now()}`,
      senderId: senderIsAdmin ? `admin:${adminEmail}` : `vendor:${vId}`,
      senderName: senderIsAdmin ? (req.user?.email || "Admin") : vName,
      senderAvatar: "",
      senderRole: senderIsAdmin ? "Admin" : "Vendor",
      content,
      date: nowIso(),
    };

    if (idx === -1) {
      const thread = { ...threadBase, messages: [message], lastMessage: { snippet: content.slice(0, 160), date: nowIso() } };
      threads.unshift(thread);
    } else {
      const t = threads[idx];
      // If this is the first admin reply, bind admin identity to thread
      if (senderIsAdmin && adminEmail) {
        t.participantIds = (Array.isArray(t.participantIds) ? t.participantIds : []).filter((id) => id !== 'admin');
        t.participantIds = Array.from(new Set([...(t.participantIds || []), `admin:${adminEmail}`]));
        t.context = { ...(t.context || {}), adminEmail };
      }
      t.messages = Array.isArray(t.messages) ? t.messages : [];
      t.messages.push(message);
      t.lastMessage = { snippet: content.slice(0, 160), date: nowIso() };
      t.read = false;
      const nextParticipantIds = new Set(Array.isArray(t.participantIds) ? t.participantIds : []);
      nextParticipantIds.add(`vendor:${vId}`);
      if (vendorEmailKey) nextParticipantIds.add(vendorEmailKey);
      t.participantIds = Array.from(nextParticipantIds);
      if (vEmail) {
        t.context = { ...(t.context || {}), vendorEmail: vEmail };
      }
      threads[idx] = t;
    }

    data.messageThreads = threads;
    await saveData(data);

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e?.message || "Failed to send message" });
  }
});

router.post("/sync", firebaseAuthRequired, async (req, res) => {
  try {
    const email = normalizeEmail(req.user?.email);
    if (!email) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const data = await getData();
    const isAdmin = isAdminRequest(req);
    const vendor = resolveVendorByIdentity(data, email, req.user?.uid);

    if (!isAdmin && !vendor) {
      return res.status(403).json({ status: "error", message: "Forbidden: admin or vendor required" });
    }

    // No-op: just verifying data access
    return res.json({ ok: true, role: isAdmin ? "admin" : "vendor" });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e?.message || "Failed to sync messages" });
  }
});

function resolveVendorByIdentity(data, email, uid) {
  const e = normalizeEmail(email);
  const vendors = listVendors(data);
  return vendors.find(
    (v) => normalizeEmail(v.email || v.contactEmail) === e || (uid && (v.ownerUid === uid || v.uid === uid))
  );
}

function canAccessThread(t, { isAdmin, email, vendorId }) {
  if (!t) return false;
  const e = normalizeEmail(email);
  const ctx = t.context || {};
  const pid = Array.isArray(t.participantIds) ? t.participantIds : [];
  // Vendors may be keyed by canonical vendorId or by email (when vendorId was missing at creation time)
  const vendorKeyMatches = (id) => pid.includes(`vendor:${id}`) || ctx.vendorId === id;
  const vendorEmail = normalizeEmail(ctx.vendorEmail);
  const vendorIdMatch = vendorId && vendorKeyMatches(String(vendorId));
  const vendorEmailMatch = vendorEmail && (pid.includes(`vendor:${vendorEmail}`) || vendorEmail === e);
  const isVendorParticipant = vendorIdMatch || vendorEmailMatch || (e && vendorKeyMatches(e));
  const isSubscriber = e && (normalizeEmail(ctx.subscriberEmail) === e || pid.includes(`user:${e}`));
  if (isAdmin) {
    // Admin can see:
    // 1) Admin-participant listing-feedback threads (unclaimed or claimed by this admin)
    const adminThread = (ctx.type === 'listing-feedback' && !ctx.adminEmail && pid.includes('admin'))
      || (e && (pid.includes(`admin:${e}`) || normalizeEmail(ctx.adminEmail) === e));
    // 2) All subscriber<->vendor threads for the tenant
    const subscriberThread = ctx.type === 'listing-subscriber';
    // 2) Their vendor/subscriber participation if they are also a vendor or subscriber
    const vendorOrSubscriber = isVendorParticipant || isSubscriber;
    return adminThread || subscriberThread || vendorOrSubscriber;
  }
  // Vendor->Admin threads are visible only to admins (senders do not see them in inbox/sent)
  if (ctx.type === 'listing-feedback') return isVendorParticipant;
  if (ctx.type === 'listing-subscriber') return isVendorParticipant || isSubscriber;
  // default: restrict to participants
  return isVendorParticipant || isSubscriber;
}

// GET /api/messages -> list threads (latest first) for current tenant
router.get("/", firebaseAuthRequired, messageListLimiter, async (req, res) => {
  try {
    const tenantId = req.tenant?.id || "public";
    
    // Force reload from disk if this is a manual refresh
    const isManualRefresh = req.headers["x-message-refresh"] === "manual";
    const data = getData(isManualRefresh);
    
    if (isManualRefresh) {
      console.log('[Messages] Manual refresh requested, reloaded from disk');
    }
    
    const { messageThreads = [] } = data;
    const isAdmin = isAdminRequest(req);
    const email = normalizeEmail(req.user?.email);
    const vendor = resolveVendorByIdentity(data, email, req.user?.uid);
    const vendorId = vendor?.vendorId || vendor?.id || "";
    
    const arr = messageThreads
      .filter((t) => (t?.tenantId || "public") === tenantId)
      .filter((t) => canAccessThread(t, { isAdmin, email, vendorId }))
      .sort((a, b) => {
        const da = new Date(a?.lastMessage?.date || a?.messages?.[a.messages.length - 1]?.date || 0).getTime();
        const db = new Date(b?.lastMessage?.date || b?.messages?.[b.messages.length - 1]?.date || 0).getTime();
        return db - da;
      });
      
    res.json({ 
      items: arr,
      meta: {
        total: arr.length,
        tenant: tenantId,
        refreshedAt: new Date().toISOString(),
        isManualRefresh
      }
    });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to list messages" });
  }
});

// GET /api/messages/:id -> one thread
router.get("/:id", firebaseAuthRequired, async (req, res) => {
  try {
    const tenantId = req.tenant?.id || "public";
    const id = String(req.params.id || "");
    const data = await getData();
    const { messageThreads = [] } = data;
    const found = messageThreads.find((t) => t.id === id && (t?.tenantId || "public") === tenantId);
    if (!found) return res.status(404).json({ status: "error", message: "Not found" });
    const isAdmin = isAdminRequest(req);
    const email = normalizeEmail(req.user?.email);
    const vendor = resolveVendorByIdentity(data, email, req.user?.uid);
    const vendorId = vendor?.vendorId || vendor?.id || "";
    if (!canAccessThread(found, { isAdmin, email, vendorId })) return res.status(403).json({ status: "error", message: "Forbidden" });
    res.json(found);
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to get message thread" });
  }
});

// POST /api/messages/reply { threadId, content }
router.post("/reply", firebaseAuthRequired, async (req, res) => {
  const { threadId = "", content: raw = "" } = req.body || {};
  const content = (raw || "").toString().trim();
  if (!threadId || !content) return res.status(400).json({ status: "error", message: "Missing threadId or content" });
  const tenantId = req.tenant?.id || "public";
  const senderEmail = normalizeEmail(req.user?.email);
  const senderIsAdmin = isAdminRequest(req);
  try {
    const data = await getData();
    const threads = Array.isArray(data.messageThreads) ? data.messageThreads : [];
    const idx = threads.findIndex((t) => t.id === String(threadId));
    if (idx === -1) {
      throw Object.assign(new Error("Thread not found"), { status: 404 });
    }
    const thread = threads[idx];
    if ((thread?.tenantId || "public") !== tenantId) {
      throw Object.assign(new Error("Thread not found"), { status: 404 });
    }
    const email = normalizeEmail(req.user?.email);
    const vendor = resolveVendorByIdentity(data, email, req.user?.uid);
    const vendorIdFromUser = vendor?.vendorId || vendor?.id || "";
    if (!canAccessThread(thread, { isAdmin: senderIsAdmin, email, vendorId: vendorIdFromUser })) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    const vendors = listVendors(data);
    const vendorProfile = vendors.find((v) => normalizeEmail(v.email || v.contactEmail) === senderEmail);
    const vendorId = vendorProfile?.vendorId || vendorProfile?.id || (thread?.context?.vendorId || vendorIdFromUser || "vendor");
    const vendorName = vendorProfile?.companyName || vendorProfile?.name || vendorId;
    const now = nowIso();
    const message = {
      id: `m${Date.now()}`,
      senderId: senderIsAdmin ? "admin" : `vendor:${vendorId}`,
      senderName: senderIsAdmin ? "Admin" : vendorName,
      senderAvatar: "",
      senderRole: senderIsAdmin ? "Admin" : "Vendor",
      content,
      date: now,
    };

    thread.messages = Array.isArray(thread.messages) ? thread.messages : [];
    thread.messages.push(message);
    thread.lastMessage = { snippet: content.slice(0, 160), date: now };
    thread.read = false;
    threads[idx] = thread;
    data.messageThreads = threads;
    await saveData(data);

    res.json({ ok: true });
  } catch (e) {
    if (e?.status === 404) return res.status(404).json({ status: "error", message: e.message || "Thread not found" });
    if (e?.status === 403) return res.status(403).json({ status: "error", message: e.message || "Forbidden" });
    res.status(500).json({ status: "error", message: e?.message || "Failed to reply" });
  }
});

// POST /api/messages/read { threadId, read }
router.post("/read", firebaseAuthRequired, async (req, res) => {
  const { threadId = "", read = true } = req.body || {};
  if (!threadId) return res.status(400).json({ status: "error", message: "Missing threadId" });
  const tenantId = req.tenant?.id || "public";
  try {
    const data = await getData();
    const threads = Array.isArray(data.messageThreads) ? data.messageThreads : [];
    const idx = threads.findIndex((t) => t.id === String(threadId));
    if (idx === -1) {
      throw Object.assign(new Error("Thread not found"), { status: 404 });
    }
    const thread = threads[idx];
    if ((thread?.tenantId || "public") !== tenantId) {
      throw Object.assign(new Error("Thread not found"), { status: 404 });
    }
    const isAdmin = isAdminRequest(req);
    const email = normalizeEmail(req.user?.email);
    const vendor = resolveVendorByIdentity(data, email, req.user?.uid);
    const vendorId = vendor?.vendorId || vendor?.id || "";
    if (!canAccessThread(thread, { isAdmin, email, vendorId })) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    threads[idx] = { ...thread, read: !!read };
    data.messageThreads = threads;
    await saveData(data);

    res.json({ ok: true });
  } catch (e) {
    if (e?.status === 404) return res.status(404).json({ status: "error", message: e.message || "Thread not found" });
    if (e?.status === 403) return res.status(403).json({ status: "error", message: e.message || "Forbidden" });
    res.status(500).json({ status: "error", message: e?.message || "Failed to update read" });
  }
});

export default router;

// Compose helper: create thread for vendor<->subscriber
router.post("/compose", firebaseAuthRequired, async (req, res) => {
  try {
    const { type, listingId, serviceId, subject: subj, content: body } = req.body || {};
    const subscriberEmailParam = normalizeEmail(req.body?.subscriberEmail || "");
    const subject = (subj || "").toString().trim();
    const content = (body || "").toString().trim();
    if (!content) return res.status(400).json({ status: "error", message: "Missing content" });

    const tenantId = req.tenant?.id || "public";
    const { services = [], messageThreads = [], subscriptions = [], vendors: vendorsRaw = [], startups = [] } = await getData();
    const vendors = listVendors({ vendors: vendorsRaw, startups });
    const now = nowIso();

    if (type === "vendor_admin") {
      const id = String(listingId || serviceId || "");
      if (!id) return res.status(400).json({ status: "error", message: "Missing listingId" });
      const svc = services.find((s) => String(s.id) === id);
      if (!svc) return res.status(404).json({ status: "error", message: "Listing not found" });
      const vObj = vendors.find((v) => String(v.vendorId || v.id) === String(svc?.vendorId || ""));
      if (!vObj) return res.status(400).json({ status: "error", message: "Vendor not found for listing" });
      const vId = String(vObj?.vendorId || vObj?.id || "vendor");
      const vName = vObj?.companyName || vObj?.name || "Vendor";
      const participants = [ { id: `vendor:${vId}`, name: vName, role: 'Vendor' }, { id: 'admin', name: 'Admin', role: 'Admin' } ];
      const base = { id: `t${Date.now().toString(36)}`, subject: subject || `Listing Feedback • ${svc?.title || id}`, participants, participantIds: participants.map(p=>p.id), messages: [], read: false, context: { type: 'listing-feedback', listingId: id, listingTitle: svc?.title || '', vendorId: vId }, tenantId };
      const msg = { id: `m${Date.now()}`, senderId: `vendor:${vId}`, senderName: vName, senderAvatar: '', senderRole: 'Vendor', content, date: now };
      
      const data = await getData();
      const list = Array.isArray(data.messageThreads) ? data.messageThreads : [];
      const idx = list.findIndex((t) => t?.context?.type === 'listing-feedback' && String(t?.context?.listingId) === id && (t?.tenantId || 'public') === tenantId);
      if (idx === -1) list.unshift({ ...base, messages: [msg], lastMessage: { snippet: content.slice(0,160), date: now } });
      else {
        const t = list[idx];
        t.messages = Array.isArray(t.messages) ? t.messages : [];
        t.messages.push(msg);
        t.lastMessage = { snippet: content.slice(0,160), date: now };
        t.read = false;
        list[idx] = t;
      }
      data.messageThreads = list;
      await saveData(data);

      return res.json({ ok: true });
    }

    if (type === "vendor_subscriber" || type === "vendor_to_subscriber") {
      const sid = String(serviceId || listingId || "");
      if (!sid) return res.status(400).json({ status: "error", message: "Missing serviceId" });
      const svc = services.find((s) => String(s.id) === sid);
      if (!svc) return res.status(404).json({ status: "error", message: "Service not found" });
      const vendorId = String(svc.vendorId || "");
      const vendor = vendors.find((v) => String(v.vendorId || v.id) === vendorId) || null;

      // Determine sender and subscriber based on mode
      const subscriberEmail = type === 'vendor_subscriber' ? normalizeEmail(req.user?.email) : subscriberEmailParam;
      if (!subscriberEmail) return res.status(400).json({ status: "error", message: "Missing subscriber identity" });
      const senderIsVendor = type === 'vendor_to_subscriber';

      // Find or create thread for (tenant, type=listing-subscriber, serviceId, subscriberEmail)
      let idx = messageThreads.findIndex(
        (t) => (t?.tenantId || "public") === tenantId && t?.context?.type === "listing-subscriber" && String(t?.context?.serviceId || "") === sid && normalizeEmail(t?.context?.subscriberEmail) === subscriberEmail
      );

      const participants = [
        { id: vendorId ? `vendor:${vendorId}` : "vendor", name: vendor?.companyName || vendor?.name || "Vendor", role: "Vendor" },
        { id: `user:${subscriberEmail}`, name: subscriberEmail, role: "Subscriber" },
      ];

      const message = senderIsVendor
        ? {
            id: `m${Date.now()}`,
            senderId: vendorId ? `vendor:${vendorId}` : 'vendor',
            senderName: vendor?.companyName || vendor?.name || 'Vendor',
            senderAvatar: "",
            senderRole: "Vendor",
            content,
            date: now,
          }
        : {
            id: `m${Date.now()}`,
            senderId: `user:${subscriberEmail}`,
            senderName: subscriberEmail,
            senderAvatar: "",
            senderRole: "Subscriber",
            content,
            date: now,
          };

      const data = await getData();
      const list = Array.isArray(data.messageThreads) ? data.messageThreads : [];
      if (idx === -1) {
        const thread = {
          id: `t${Date.now().toString(36)}`,
          subject: subject || `Message about ${svc.title || "listing"}`,
          participants,
          participantIds: participants.map((p) => p.id),
          messages: [message],
          lastMessage: { snippet: content.slice(0, 160), date: now },
          read: false,
          context: { type: "listing-subscriber", serviceId: sid, serviceTitle: svc.title || "", vendorId, subscriberEmail },
          tenantId,
        };
        list.unshift(thread);
      } else {
        const t = list[idx];
        t.messages = Array.isArray(t.messages) ? t.messages : [];
        t.messages.push(message);
        t.lastMessage = { snippet: content.slice(0, 160), date: now };
        t.read = false;
        // Ensure strict participants (1:1): vendor + this subscriber only
        t.participantIds = Array.from(new Set([`vendor:${vendorId}`, `user:${subscriberEmail}`]));
        list[idx] = t;
      }
      data.messageThreads = list;
      await saveData(data);

      return res.json({ ok: true });
    }

    return res.status(400).json({ status: "error", message: "Unknown compose type" });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e?.message || "Failed to compose" });
  }
});
