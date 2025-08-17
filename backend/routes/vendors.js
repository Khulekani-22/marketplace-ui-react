import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getData, saveData } from "../utils/dataStore.js";
import { VendorSchema } from "../utils/validators.js";
import { jwtAuthRequired } from "../middleware/authJWT.js";

const router = Router();

router.get("/", (req, res) => {
  const { vendors = [] } = getData();
  const tenantId = req.tenant.id;
  const rows = vendors.filter(
    (v) => (v.tenantId ?? "public") === tenantId || (tenantId === "public" && !v.tenantId)
  );
  res.json(rows);
});

router.post("/", jwtAuthRequired, (req, res, next) => {
  try {
    const parsed = VendorSchema.parse(req.body);
    const id = parsed.id || uuid();
    const tenantId = req.tenant.id;

    saveData((data) => {
      data.vendors = data.vendors || [];
      data.vendors.push({ ...parsed, id, tenantId });
      return data;
    });

    res.status(201).json({ ...parsed, id, tenantId });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", jwtAuthRequired, (req, res, next) => {
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

router.delete("/:id", jwtAuthRequired, (req, res) => {
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
