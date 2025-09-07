import { Router } from "express";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import { getData, saveData } from "../utils/dataStore.js";

const router = Router();

function normalizeEmail(x) {
  return (x || "").toString().trim().toLowerCase();
}

function isAdminRequest(req) {
  try {
    const email = normalizeEmail(req.user?.email);
    if (!email) return false;
    const data = getData();
    const users = Array.isArray(data.users) ? data.users : [];
    const found = users.find((u) => normalizeEmail(u.email) === email);
    return (found?.role || "") === "admin";
  } catch {
    return false;
  }
}

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

      // Try to find an existing thread for this listingId and tenant
      let idx = threads.findIndex((t) => (
        (t?.context?.type === "listing-feedback") &&
        (t?.context?.listingId === String(listingId)) &&
        ((t?.tenantId || "public") === tenantId)
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

      const vEmail = normalizeEmail(vendorEmail || vendorObj?.email || vendorObj?.contactEmail);
      const vId = String(vendorId || vendorObj?.vendorId || vendorObj?.id || vEmail || "vendor");
      const vName = vendorObj?.companyName || vendorObj?.name || vendorObj?.displayName || vEmail || vId || "Vendor";

      const participants = [
        { id: `vendor:${vId}`, name: vName, role: "Vendor" },
        { id: `admin`, name: "Admin", role: "Admin" },
      ];

      const threadBase = {
        id: `t${Date.now().toString(36)}`,
        subject,
        participants,
        participantIds: participants.map((p) => p.id),
        messages: [],
        read: false,
        context: { type: "listing-feedback", listingId: String(listingId), listingTitle, vendorId: vId },
        tenantId,
      };

      const message = {
        id: `m${Date.now()}`,
        senderId: senderIsAdmin ? "admin" : `vendor:${vId}`,
        senderName: senderIsAdmin ? "Admin" : vName,
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

// GET /api/messages -> list threads (latest first) for current tenant
router.get("/", (req, res) => {
  try {
    const tenantId = req.tenant?.id || "public";
    const { messageThreads = [] } = getData();
    const arr = messageThreads
      .filter((t) => (t?.tenantId || "public") === tenantId)
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
router.get("/:id", (req, res) => {
  try {
    const tenantId = req.tenant?.id || "public";
    const id = String(req.params.id || "");
    const { messageThreads = [] } = getData();
    const found = messageThreads.find((t) => t.id === id && (t?.tenantId || "public") === tenantId);
    if (!found) return res.status(404).json({ status: "error", message: "Not found" });
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
      const vendors = Array.isArray(data.startups) ? data.startups : [];
      let v = vendors.find((v) => normalizeEmail(v.email || v.contactEmail) === senderEmail);
      const vendorId = v?.vendorId || v?.id || (t?.context?.vendorId || "vendor");
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
      // Defer to /api/messages logic by pushing a new message
      req.body = {
        listingId: id,
        listingTitle: (services.find((s) => String(s.id) === id)?.title) || "",
        vendorId: startups.find((v) => String(v.vendorId || v.id) === (services.find((s) => String(s.id) === id)?.vendorId || ""))?.vendorId || "",
        vendorEmail: startups.find((v) => String(v.vendorId || v.id) === (services.find((s) => String(s.id) === id)?.vendorId || ""))?.email || "",
        subject: subject || `Listing Feedback • ${id}`,
        content,
      };
      // Reuse the POST / handler
      return router.handle(req, res);
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
