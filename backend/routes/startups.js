import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getData, saveData } from "../utils/hybridDataStore.js";
import { StartupSchema } from "../utils/validators.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";

const router = Router();

// List startups for current tenant
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      q = "",
    } = req.query;

    const { startups = [] } = await getData();
    const tenantId = req.tenant.id;
    
    let rows = startups.filter(
      (s) => (s.tenantId ?? "public") === tenantId || (tenantId === "public" && !s.tenantId)
    );

    // Add search functionality if needed
    if (q) {
      const needle = String(q).toLowerCase();
      rows = rows.filter(
        (s) =>
          s.name?.toLowerCase().includes(needle) ||
          s.industry?.toLowerCase().includes(needle) ||
          s.description?.toLowerCase().includes(needle) ||
          s.founderName?.toLowerCase().includes(needle)
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
    console.error('Error fetching startups:', error);
    res.status(500).json({ error: 'Failed to fetch startups' });
  }
});

// Create or upsert startup for current tenant
router.post("/", firebaseAuthRequired, async (req, res, next) => {
  try {
    const parsed = StartupSchema.parse(req.body);
    const id = parsed.id || uuid();
    const tenantId = req.tenant.id;
    const ownerUid = parsed.ownerUid || req.user?.uid || undefined;
    const contactEmail = (parsed.contactEmail || req.user?.email || "").toLowerCase();

    let updated = false;
    let result = null;
    
    const data = await getData();
    data.startups = data.startups || [];
    const idx = data.startups.findIndex((s) => {
      const sameTenant = (s.tenantId ?? "public") === tenantId;
      if (!sameTenant) return false;
      const sEmail = (s.contactEmail || s.email || "").toLowerCase();
      return (
        s.id === id ||
        (!!ownerUid && s.ownerUid === ownerUid) ||
        (!!contactEmail && sEmail === contactEmail)
      );
    });
    if (idx !== -1) {
      const existingId = data.startups[idx].id || id;
      data.startups[idx] = {
        ...data.startups[idx],
        ...parsed,
        id: existingId,
        tenantId,
        ...(ownerUid ? { ownerUid } : {}),
        ...(contactEmail ? { contactEmail } : {}),
      };
      updated = true;
      result = data.startups[idx];
    } else {
      const obj = {
        ...parsed,
        id,
        tenantId,
        ...(ownerUid ? { ownerUid } : {}),
        ...(contactEmail ? { contactEmail } : {}),
      };
      data.startups.push(obj);
      result = obj;
    }
    await saveData(data);

    res.status(updated ? 200 : 201).json(result);
  } catch (e) {
    next(e);
  }
});

// Update startup by id for current tenant
router.put("/:id", firebaseAuthRequired, async (req, res, next) => {
  try {
    const id = req.params.id;
    const tenantId = req.tenant.id;
    const partial = StartupSchema.partial().parse(req.body);

    let updated = null;
    const data = await getData();
    data.startups = data.startups || [];
    const idx = data.startups.findIndex((s) => s.id === id && (s.tenantId ?? "public") === tenantId);
    if (idx !== -1) {
      data.startups[idx] = { ...data.startups[idx], ...partial };
      updated = data.startups[idx];
    }
    await saveData(data);

    if (!updated) return res.status(404).json({ status: "error", message: "Not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;

