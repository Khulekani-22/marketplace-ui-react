import express from "express";
import { getData } from "../utils/hybridDataStore.js";

const { Router } = express;
const router = Router();

router.get("/current", async (req, res) => {
  res.json({ tenantId: req.tenant.id });
});

router.get("/", async (_req, res) => {
  // Optional: list known tenants if you store them in appData.tenants
  const { tenants = [] } = await getData();
  res.json(tenants);
});

export default router;
