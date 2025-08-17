import jwt from "jsonwebtoken";

const {
  JWT_SECRET = "dev-secret",
  JWT_ISSUER = "scdm.local",
  JWT_AUDIENCE = "marketplace-ui-react",
} = process.env;

/**
 * For local dev we accept HS256 tokens with a shared secret.
 * Production:
 *  - Auth0: verify with JWKS (kid), RS256
 *  - Firebase: verifyIdToken() (RS256) using Firebase Admin SDK
 */

export function jwtAuthRequired(req, res, next) {
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ status: "error", message: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }
}

export function jwtAuthOptional(req, _res, next) {
  const token = extractBearer(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    req.user = payload;
  } catch {
    // ignore invalid token in optional mode
  }
  next();
}

function extractBearer(req) {
  const h = req.header("Authorization");
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.substring(7);
}
