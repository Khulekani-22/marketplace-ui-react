// Resolves the active tenant from headers or query; defaults to 'public'
export function tenantContext(req, _res, next) {
  const headerTenant = req.header("x-tenant-id");
  const queryTenant = req.query.tenantId;
  const tenantId = (headerTenant || queryTenant || "public").trim();
  req.tenant = { id: tenantId };
  next();
}
