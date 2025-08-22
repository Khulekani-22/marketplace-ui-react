// middleware/tenant.js
export function requireTenant(req, res, next) {
  const tenantId = (req.header("x-tenant-id") || "public").trim();
  const allowedTenants = req.user.tenants || [];   // from custom claims or DB
  if (tenantId !== "public" && !allowedTenants.includes(tenantId)) {
    return res.status(403).json({ error: "Tenant access denied" });
  }
  req.tenantId = tenantId;
  next();
}
