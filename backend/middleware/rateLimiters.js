import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const FOUR_MINUTES_MS = 4 * 60 * 1000;

function normalizeEmail(value) {
  return (value || "").toString().trim().toLowerCase();
}

function isForceBypass(req) {
  const q = req?.query || {};
  const forceKeys = ["force", "forceRefresh", "refresh", "manual"];
  for (const key of forceKeys) {
    const raw = q[key];
    if (typeof raw === "string") {
      const val = raw.trim().toLowerCase();
      if (val === "1" || val === "true" || val === "yes" || val === "manual") return true;
    }
    if (Array.isArray(raw)) {
      if (raw.some((item) => typeof item === "string" && ["1", "true", "yes", "manual"].includes(item.trim().toLowerCase()))) {
        return true;
      }
    }
  }
  const header = (req?.headers?.["x-message-refresh"] || "").toString().trim().toLowerCase();
  return header === "manual" || header === "force";
}

export const messageListLimiter = rateLimit({
  windowMs: FOUR_MINUTES_MS,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Messages were just refreshed. Try again in a few minutes." },
  keyGenerator: (req) => {
    const tenantId = req?.tenant?.id || "public";
    const user = req?.user || {};
    const uid = user.uid ? String(user.uid) : "";
    const email = normalizeEmail(user.email);
    const ip = req?.ip ? ipKeyGenerator(req.ip) : "";
    const keyBase = uid || email || ip || "anon";
    return `${tenantId}:${keyBase}`;
  },
  skip: (req) => isForceBypass(req),
  handler: (req, res) => {
    res.status(429).json({ status: "error", message: "Messages were just refreshed. Try again in a few minutes." });
  },
});
