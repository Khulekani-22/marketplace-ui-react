import express from "express";
import { getData } from "../utils/hybridDataStore.js";

const { Router } = express;
const router = Router();

router.get("/current", (req, res) => {
  res.json({ tenantId: req.tenant.id });
});

router.get("/", (_req, res) => {
  // Optional: list known tenants if you store them in appData.tenants
  const { tenants = [] } = getData();
  res.json(tenants);
});

export default router;
