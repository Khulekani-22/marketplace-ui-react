import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getData, saveData } from "../utils/dataStore.js";
import { VendorSchema } from "../utils/validators.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";

const router = Router();

router.get("/", (req, res) => {
  const { vendors = [] } = getData();
  const tenantId = req.tenant.id;
  const rows = vendors.filter(
    (v) => (v.tenantId ?? "public") === tenantId || (tenantId === "public" && !v.tenantId)
  );
  res.json(rows);
});

router.post("/", firebaseAuthRequired, (req, res, next) => {
  try {
    const parsed = VendorSchema.parse(req.body);
    const id = parsed.id || uuid();
    const tenantId = req.tenant.id;
    const ownerUid = parsed.ownerUid || req.user?.uid || undefined;
    const contactEmail = (parsed.contactEmail || req.user?.email || "").toLowerCase();

    let updated = false;
    let result = null;
    saveData((data) => {
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
      return data;
    });

    res.status(updated ? 200 : 201).json(result);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", firebaseAuthRequired, (req, res, next) => {
  try {
    const id = req.params.id;
    const tenantId = req.tenant.id;
    const partial = VendorSchema.partial().parse(req.body);

    let updated = null;
    saveData((data) => {
      data.vendors = data.vendors || [];
      const idx = data.vendors.findIndex(
        (v) => v.id === id && (v.tenantId ?? "public") === tenantId
      );
      if (idx !== -1) {
        data.vendors[idx] = { ...data.vendors[idx], ...partial };
        updated = data.vendors[idx];
      }
      return data;
    });

    if (!updated) return res.status(404).json({ status: "error", message: "Not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", firebaseAuthRequired, (req, res) => {
  const id = req.params.id;
  const tenantId = req.tenant.id;
  let removed = false;
  saveData((data) => {
    data.vendors = (data.vendors || []).filter((v) => {
      const match = v.id === id && (v.tenantId ?? "public") === tenantId;
      if (match) removed = true;
      return !match;
    });
    return data;
  });
  if (!removed) return res.status(404).json({ status: "error", message: "Not found" });
  res.status(204).send();
});

export default router;

// ---- Migration: upgrade all startups -> vendors (idempotent) ----
// POST /api/data/vendors/migrate-startups
// Uses same matching rules as POST (by id OR ownerUid OR contactEmail within tenant)
router.post("/migrate-startups", firebaseAuthRequired, (req, res, next) => {
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

    saveData((data) => {
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
      return data;
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});
