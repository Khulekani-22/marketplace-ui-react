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

// Vendor stats: listings, reviews, bookings/revenue, subscription (scaffold)
router.get("/:id/stats", (req, res) => {
  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ status: "error", message: "Missing vendor id" });
  const tenantId = req.tenant.id;
  try {
    const data = getData();
    const vendors = Array.isArray(data.vendors) ? data.vendors : [];
    const services = Array.isArray(data.services) ? data.services : [];
    const bookings = Array.isArray(data.bookings) ? data.bookings : [];

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
      subscription,
      listings: myServices.map((s) => ({ id: String(s.id || s.vendorId || ""), title: s.title || "", status: (s.status || "approved").toLowerCase(), rating: Number(s.rating || 0), reviewCount: Number(s.reviewCount || (Array.isArray(s.reviews) ? s.reviews.length : 0) || 0), category: s.category || "" })),
    });
  } catch (e) {
    res.status(500).json({ status: "error", message: e?.message || "Failed to compute stats" });
  }
});
