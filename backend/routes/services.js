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

// export placed at end of file

// Add or update a review for a service (public access; tenant-scoped)
router.post("/:id/reviews", async (req, res, next) => {
  try {
    const id = String(req.params.id || "");
    const tenantId = req.tenant.id;
    const { rating, comment = "", author = "", authorEmail = "" } = req.body || {};
    const r = Number(rating);
    if (!id || Number.isNaN(r) || r < 1 || r > 5) {
      return res.status(400).json({ status: "error", message: "Invalid id or rating (1..5)" });
    }

    let updated = null;
    saveData((data) => {
      data.services = data.services || [];
      let idx = data.services.findIndex(
        (s) => String(s.id) === id && (s.tenantId ?? "public") === tenantId
      );
      // Fallback: any tenant by id
      if (idx === -1 && id && id !== 'undefined') {
        idx = data.services.findIndex((s) => String(s.id) === id);
      }
      // Fallback: try soft match by title/vendor/contactEmail if provided
      if (idx === -1) {
        const t = (req.body?.title || "").trim().toLowerCase();
        const vname = (req.body?.vendor || "").trim().toLowerCase();
        const cemail = (req.body?.contactEmail || "").trim().toLowerCase();
        if (t || vname || cemail) {
          idx = data.services.findIndex((s) => {
            const st = (s.title || "").trim().toLowerCase();
            const sv = (s.vendor || "").trim().toLowerCase();
            const se = (s.contactEmail || s.email || "").trim().toLowerCase();
            const tenantOk = (s.tenantId ?? "public") === tenantId || tenantId === 'public';
            const byTitleVendor = t && vname && st === t && sv === vname;
            const byEmail = cemail && se === cemail;
            return tenantOk && (byTitleVendor || byEmail);
          });
          // Last resort: ignore tenant on soft match
          if (idx === -1) {
            idx = data.services.findIndex((s) => {
              const st = (s.title || "").trim().toLowerCase();
              const sv = (s.vendor || "").trim().toLowerCase();
              const se = (s.contactEmail || s.email || "").trim().toLowerCase();
              const byTitleVendor = t && vname && st === t && sv === vname;
              const byEmail = cemail && se === cemail;
              return byTitleVendor || byEmail;
            });
          }
        }
      }
      if (idx === -1) return data;
      const s = data.services[idx];
      const now = new Date().toISOString();
      const reviews = Array.isArray(s.reviews) ? s.reviews : [];
      // Upsert: if same authorEmail exists, replace the previous rating/comment
      const prevIdx = reviews.findIndex((rv) => (rv.authorEmail || "").toLowerCase() === (authorEmail || "").toLowerCase() && authorEmail);
      const reviewObj = { id: uuid(), rating: r, comment, author, authorEmail, createdAt: now };
      if (prevIdx >= 0) reviews[prevIdx] = { ...reviews[prevIdx], ...reviewObj };
      else reviews.push(reviewObj);

      // Recompute aggregates using weighted avg if prior counts exist
      const priorCount = Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0) || 0);
      const priorAvg = Number(s.rating || 0);
      let newCount = priorCount;
      let newAvg = priorAvg;
      if (prevIdx >= 0) {
        // Replace contribution: approximate by recomputing from reviews array if it holds history
        if (reviews.length > 0) {
          const sum = reviews.reduce((a, rv) => a + Number(rv.rating || 0), 0);
          newCount = Math.max(priorCount, reviews.length);
          newAvg = sum / reviews.length;
        }
      } else {
        newCount = priorCount + 1;
        if (priorCount > 0) newAvg = (priorAvg * priorCount + r) / newCount;
        else newAvg = r;
      }

      data.services[idx] = {
        ...s,
        reviews,
        reviewCount: newCount,
        rating: newAvg,
        lastReviewedAt: now,
      };
      updated = data.services[idx];
      return data;
    });

    if (!updated) return res.status(404).json({ status: "error", message: "Service not found" });
    res.status(201).json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
