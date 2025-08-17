// Simple role gate. Extend as you formalize roles/claims.
export function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role || "guest";
    if (!allowed.includes(role)) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    next();
  };
}
