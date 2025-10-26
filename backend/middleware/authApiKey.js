// middleware/authApiKey.js
import { firestore } from "../services/firestore.js";
import crypto from "crypto";

const API_KEYS_COLLECTION = "apiKeys";

/**
 * API Key Authentication Middleware
 * Supports machine-to-machine communication
 * 
 * Header format: X-API-Key: <api-key>
 */

/**
 * Verify API key and attach consumer info to request
 */
export async function apiKeyAuth(req, res, next) {
  const apiKey = req.header("X-API-Key");
  
  if (!apiKey) {
    return res.status(401).json({
      status: "error",
      message: "Missing API key",
      code: "MISSING_API_KEY"
    });
  }

  try {
    // Hash the API key for lookup (we store hashed keys)
    const keyHash = hashApiKey(apiKey);
    
    // Look up the API key in Firestore
    const keysRef = firestore.collection(API_KEYS_COLLECTION);
    const snapshot = await keysRef.where("keyHash", "==", keyHash).limit(1).get();
    
    if (snapshot.empty) {
      return res.status(401).json({
        status: "error",
        message: "Invalid API key",
        code: "INVALID_API_KEY"
      });
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();

    // Check if key is active
    if (!keyData.active) {
      return res.status(401).json({
        status: "error",
        message: "API key is disabled",
        code: "DISABLED_API_KEY"
      });
    }

    // Check if key has expired
    if (keyData.expiresAt) {
      const expiryDate = keyData.expiresAt.toDate ? keyData.expiresAt.toDate() : new Date(keyData.expiresAt);
      if (expiryDate < new Date()) {
        return res.status(401).json({
          status: "error",
          message: "API key has expired",
          code: "EXPIRED_API_KEY"
        });
      }
    }

    // Update last used timestamp
    await keysRef.doc(keyDoc.id).update({
      lastUsedAt: new Date(),
      usageCount: (keyData.usageCount || 0) + 1
    });

    // Attach API key info to request
    req.apiKey = {
      id: keyDoc.id,
      appName: keyData.appName,
      permissions: keyData.permissions || [],
      rateLimit: keyData.rateLimit || "standard",
      metadata: keyData.metadata || {},
      createdBy: keyData.createdBy
    };

    // Also set user context for compatibility with existing middleware
    req.user = {
      email: keyData.createdBy,
      uid: `api-key-${keyDoc.id}`,
      role: "api-consumer",
      apiKeyAuth: true
    };

    next();
  } catch (error) {
    console.error("API key verification error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to verify API key",
      code: "API_KEY_VERIFICATION_FAILED"
    });
  }
}

/**
 * Optional API key authentication
 * Allows both API key and no auth
 */
export function apiKeyAuthOptional(req, res, next) {
  const apiKey = req.header("X-API-Key");
  
  if (!apiKey) {
    return next();
  }
  
  return apiKeyAuth(req, res, next);
}

/**
 * Dual authentication: Accept either Firebase token OR API key
 */
export function dualAuth(firebaseAuth) {
  return async (req, res, next) => {
    const hasApiKey = req.header("X-API-Key");
    const hasFirebaseToken = req.header("Authorization")?.startsWith("Bearer ");

    if (hasApiKey) {
      return apiKeyAuth(req, res, next);
    }
    
    if (hasFirebaseToken) {
      return firebaseAuth(req, res, next);
    }

    return res.status(401).json({
      status: "error",
      message: "Authentication required. Provide either X-API-Key or Authorization header",
      code: "AUTHENTICATION_REQUIRED"
    });
  };
}

/**
 * Check if API key has specific permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(403).json({
        status: "error",
        message: "API key authentication required",
        code: "API_KEY_REQUIRED"
      });
    }

    const permissions = req.apiKey.permissions || [];
    
    if (!permissions.includes(permission) && !permissions.includes("*")) {
      return res.status(403).json({
        status: "error",
        message: `Permission denied. Required: ${permission}`,
        code: "INSUFFICIENT_PERMISSIONS"
      });
    }

    next();
  };
}

/**
 * Hash API key for secure storage
 */
export function hashApiKey(apiKey) {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}

/**
 * Generate a secure API key
 */
export function generateApiKey() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate key prefix for display (e.g., "sk_live_abc123...")
 */
export function generateKeyPrefix(environment = "live") {
  const randomPart = crypto.randomBytes(8).toString("hex");
  return `sk_${environment}_${randomPart}`;
}

/**
 * Mask API key for display (show only first and last 4 chars)
 */
export function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 12) return "****";
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}
