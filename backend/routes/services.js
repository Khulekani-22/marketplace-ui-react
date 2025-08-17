import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getData, saveData } from "../utils/dataStore.js";
import { ServiceSchema } from "../utils/validators.js";
import { jwtAuthRequired } from "../middleware/authJWT.js";
// import { requireRole } from "../policies/rbac.js";
// replace the demo JWT middleware with Firebase:
import { firebaseAuthRequired } from "../middleware/authFirebase.js";


const router = Router();

/**
 * GET /api/data/services
 * Query: q (search), category, vendor, featured (true), minPrice, maxPrice, page, pageSize
 * Respects tenant scoping via req.tenant.id
 */
router.post("/", firebaseAuthRequired, (req, res, next) => { /* ... */ });
router.put("/:id", firebaseAuthRequired, (req, res, next) => { /* ... */ });
router.delete("/:id", firebaseAuthRequired, (req, res) => { /* ... */ });

router.get("/", (req, res) => {
  const {
    q = "",
    category,
    vendor,
    featured,
    minPrice,
    maxPrice,
    page = 1,
    pageSize = 20,
  } = req.query;

  const { services = [] } = getData();
  const tenantId = req.tenant.id;

  let rows = services.filter(
    (s) => (s.tenantId ?? "public") === tenantId || (tenantId === "public" && !s.tenantId)
  );

  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter(
      (s) =>
        s.title?.toLowerCase().includes(needle) ||
        s.category?.toLowerCase().includes(needle) ||
        s.vendor?.toLowerCase().includes(needle) ||
        s.tags?.some((t) => t.toLowerCase().includes(needle))
    );
  }
  if (category) rows = rows.filter((s) => s.category === category);
  if (vendor) rows = rows.filter((s) => s.vendor === vendor);
  if (featured === "true") rows = rows.filter((s) => s.isFeatured === true);

  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (!Number.isNaN(min)) rows = rows.filter((s) => Number(s.price) >= min);
  if (!Number.isNaN(max)) rows = rows.filter((s) => Number(s.price) <= max);

  const p = Math.max(1, parseInt(page));
  const ps = Math.min(100, Math.max(1, parseInt(pageSize)));
  const total = rows.length;
  const start = (p - 1) * ps;
  const slice = rows.slice(start, start + ps);

  res.json({ page: p, pageSize: ps, total, items: slice });
});

/**
 * POST /api/data/services
 * Body: ServiceSchema (id optional). Requires auth.
 */
router.post("/", jwtAuthRequired, (req, res, next) => {
  try {
    const parsed = ServiceSchema.parse(req.body);
    const id = parsed.id || uuid();
    const tenantId = req.tenant.id;

    const result = saveData((data) => {
      data.services = data.services || [];
      data.services.push({ ...parsed, id, tenantId });
      return data;
    });

    const created = result.services.find((s) => s.id === id);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/data/services/:id
 */
router.put("/:id", jwtAuthRequired, (req, res, next) => {
  try {
    const id = req.params.id;
    const tenantId = req.tenant.id;
    const parsed = ServiceSchema.partial().parse(req.body);

    let found = null;
    const result = saveData((data) => {
      data.services = data.services || [];
      const idx = data.services.findIndex(
        (s) => s.id === id && (s.tenantId ?? "public") === tenantId
      );
      if (idx === -1) return data;
      data.services[idx] = { ...data.services[idx], ...parsed };
      found = data.services[idx];
      return data;
    });

    if (!found) {
      return res.status(404).json({ status: "error", message: "Not found" });
    }
    res.json(found);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/data/services/:id
 */
router.delete("/:id", jwtAuthRequired, (req, res) => {
  const id = req.params.id;
  const tenantId = req.tenant.id;

  let removed = false;
  saveData((data) => {
    data.services = (data.services || []).filter((s) => {
      const match = s.id === id && (s.tenantId ?? "public") === tenantId;
      if (match) removed = true;
      return !match;
    });
    return data;
  });

  if (!removed) {
    return res.status(404).json({ status: "error", message: "Not found" });
  }
  res.status(204).send();
});

export default router;
