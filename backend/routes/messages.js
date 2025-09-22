import { Router } from "express";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import { getData, saveData } from "../utils/dataStore.js";
import { isAdminForTenant } from "../middleware/isAdmin.js";

const router = Router();

function normalizeEmail(x) {
  return (x || "").toString().trim().toLowerCase();
}

function mapTenant(id){ return (id === 'vendor') ? 'public' : (id || 'public'); }
function isAdminRequest(req) { return isAdminForTenant(req); }

function nowIso() {
  return new Date().toISOString();
}

// POST /api/messages
// Body: { listingId, listingTitle, vendorId, vendorEmail?, subject, content }
// Appends a message to a per-listing feedback thread (creates if missing)
router.post("/", firebaseAuthRequired, (req, res) => {
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
    const updated = saveData((data) => {
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
      const vendors = Array.isArray(data.startups) ? data.startups : [];
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
      const vId = String(vendorId || vendorObj?.vendorId || vendorObj?.id || vEmail || "vendor");
      const vName = vendorObj?.companyName || vendorObj?.name || vendorObj?.displayName || vEmail || vId || "Vendor";

      const participants = [
        { id: `vendor:${vId}`, name: vName, role: "Vendor" },
        adminEmail ? { id: `admin:${adminEmail}`, name: req.user?.email || "Admin", role: "Admin" } : { id: `admin`, name: "Admin", role: "Admin" },
      ];

      const threadBase = {
        id: `t${Date.now().toString(36)}`,
        subject,
        participants,
        participantIds: participants.map((p) => p.id),
        messages: [],
        read: false,
        context: { type: "listing-feedback", listingId: String(listingId), listingTitle, vendorId: vId, adminEmail: adminEmail || undefined },
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
        threads[idx] = t;
      }

      data.messageThreads = threads;
      return data;
    });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e?.message || "Failed to send message" });
  }
});

function resolveVendorByIdentity(data, email, uid) {
  const e = normalizeEmail(email);
  const startups = Array.isArray(data.startups) ? data.startups : [];
  return startups.find(
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
  const isVendorParticipant = (vendorId && vendorKeyMatches(String(vendorId))) || (e && vendorKeyMatches(e));
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
  if (ctx.type === 'listing-feedback') return false;
  if (ctx.type === 'listing-subscriber') return isVendorParticipant || isSubscriber;
  // default: restrict to participants
  return isVendorParticipant || isSubscriber;
}

// GET /api/messages -> list threads (latest first) for current tenant
router.get("/", firebaseAuthRequired, (req, res) => {
  try {
    const tenantId = req.tenant?.id || "public";
    const data = getData();
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
    res.json({ items: arr });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to list messages" });
  }
});

// GET /api/messages/:id -> one thread
router.get("/:id", firebaseAuthRequired, (req, res) => {
  try {
    const tenantId = req.tenant?.id || "public";
    const id = String(req.params.id || "");
    const data = getData();
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
router.post("/reply", firebaseAuthRequired, (req, res) => {
  const { threadId = "", content: raw = "" } = req.body || {};
  const content = (raw || "").toString().trim();
  if (!threadId || !content) return res.status(400).json({ status: "error", message: "Missing threadId or content" });
  const senderEmail = normalizeEmail(req.user?.email);
  const senderIsAdmin = isAdminRequest(req);
  try {
    saveData((data) => {
      const threads = Array.isArray(data.messageThreads) ? data.messageThreads : [];
      const idx = threads.findIndex((t) => t.id === String(threadId));
      if (idx === -1) return data;
      const t = threads[idx];
      const isAdmin = isAdminRequest(req);
      const email = normalizeEmail(req.user?.email);
      const vendor = resolveVendorByIdentity(data, email, req.user?.uid);
      const vendorIdFromUser = vendor?.vendorId || vendor?.id || "";
      if (!canAccessThread(t, { isAdmin, email, vendorId: vendorIdFromUser })) return data; // ignore if not allowed
      const vendors = Array.isArray(data.startups) ? data.startups : [];
      let v = vendors.find((v) => normalizeEmail(v.email || v.contactEmail) === senderEmail);
      const vendorId = v?.vendorId || v?.id || (t?.context?.vendorId || vendorIdFromUser || "vendor");
      const vendorName = v?.companyName || v?.name || vendorId;
      const message = {
        id: `m${Date.now()}`,
        senderId: senderIsAdmin ? "admin" : `vendor:${vendorId}`,
        senderName: senderIsAdmin ? "Admin" : vendorName,
        senderAvatar: "",
        senderRole: senderIsAdmin ? "Admin" : "Vendor",
        content,
        date: nowIso(),
      };
      t.messages = Array.isArray(t.messages) ? t.messages : [];
      t.messages.push(message);
      t.lastMessage = { snippet: content.slice(0, 160), date: nowIso() };
      t.read = false;
      threads[idx] = t;
      data.messageThreads = threads;
      return data;
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to reply" });
  }
});

// POST /api/messages/read { threadId, read }
router.post("/read", firebaseAuthRequired, (req, res) => {
  const { threadId = "", read = true } = req.body || {};
  if (!threadId) return res.status(400).json({ status: "error", message: "Missing threadId" });
  try {
    const updated = saveData((data) => {
      const threads = Array.isArray(data.messageThreads) ? data.messageThreads : [];
      const idx = threads.findIndex((t) => t.id === String(threadId));
      if (idx === -1) return data;
      const isAdmin = isAdminRequest(req);
      const email = normalizeEmail(req.user?.email);
      const vendor = resolveVendorByIdentity(data, email, req.user?.uid);
      const vendorId = vendor?.vendorId || vendor?.id || "";
      if (!canAccessThread(threads[idx], { isAdmin, email, vendorId })) return data;
      threads[idx] = { ...threads[idx], read: !!read };
      data.messageThreads = threads;
      return data;
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to update read" });
  }
});

export default router;

// Compose helper: create thread for vendor<->subscriber
router.post("/compose", firebaseAuthRequired, (req, res) => {
  try {
    const { type, listingId, serviceId, subject: subj, content: body } = req.body || {};
    const subscriberEmailParam = normalizeEmail(req.body?.subscriberEmail || "");
    const subject = (subj || "").toString().trim();
    const content = (body || "").toString().trim();
    if (!content) return res.status(400).json({ status: "error", message: "Missing content" });

    const tenantId = req.tenant?.id || "public";
    const { services = [], startups = [], messageThreads = [], subscriptions = [] } = getData();
    const now = nowIso();

    if (type === "vendor_admin") {
      const id = String(listingId || serviceId || "");
      if (!id) return res.status(400).json({ status: "error", message: "Missing listingId" });
      const svc = services.find((s) => String(s.id) === id);
      if (!svc) return res.status(404).json({ status: "error", message: "Listing not found" });
      const vObj = startups.find((v) => String(v.vendorId || v.id) === String(svc?.vendorId || ""));
      if (!vObj) return res.status(400).json({ status: "error", message: "Vendor not found for listing" });
      const vId = String(vObj?.vendorId || vObj?.id || "vendor");
      const vName = vObj?.companyName || vObj?.name || "Vendor";
      const participants = [ { id: `vendor:${vId}`, name: vName, role: 'Vendor' }, { id: 'admin', name: 'Admin', role: 'Admin' } ];
      const base = { id: `t${Date.now().toString(36)}`, subject: subject || `Listing Feedback • ${svc?.title || id}`, participants, participantIds: participants.map(p=>p.id), messages: [], read: false, context: { type: 'listing-feedback', listingId: id, listingTitle: svc?.title || '', vendorId: vId }, tenantId };
      const msg = { id: `m${Date.now()}`, senderId: `vendor:${vId}`, senderName: vName, senderAvatar: '', senderRole: 'Vendor', content, date: now };
      saveData((data) => {
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
        return data;
      });
      return res.json({ ok: true });
    }

    if (type === "vendor_subscriber" || type === "vendor_to_subscriber") {
      const sid = String(serviceId || listingId || "");
      if (!sid) return res.status(400).json({ status: "error", message: "Missing serviceId" });
      const svc = services.find((s) => String(s.id) === sid);
      if (!svc) return res.status(404).json({ status: "error", message: "Service not found" });
      const vendorId = String(svc.vendorId || "");
      const vendor = startups.find((v) => String(v.vendorId || v.id) === vendorId) || null;

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

      saveData((data) => {
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
        return data;
      });
      return res.json({ ok: true });
    }

    return res.status(400).json({ status: "error", message: "Unknown compose type" });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e?.message || "Failed to compose" });
  }
});
