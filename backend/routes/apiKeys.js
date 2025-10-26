import { Router } from "express";
import { firestore } from "../services/firestore.js";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import { requireAdmin } from "../middleware/isAdmin.js";
import {
  generateApiKey,
  generateKeyPrefix,
  hashApiKey,
  maskApiKey
} from "../middleware/authApiKey.js";
import {
  getRateLimitStatus,
  resetRateLimit,
  getRateLimitStats
} from "../middleware/apiKeyRateLimiter.js";

const router = Router();
const API_KEYS_COLLECTION = "apiKeys";

/**
 * GET /api/api-keys
 * List API keys for authenticated user (or all if admin)
 */
router.get("/", firebaseAuthRequired, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const isAdmin = req.user?.role === "admin";

    let query = firestore.collection(API_KEYS_COLLECTION);
    
    // Non-admins can only see their own keys
    if (!isAdmin) {
      query = query.where("createdBy", "==", userEmail);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    
    const keys = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        appName: data.appName,
        keyPreview: maskApiKey(data.keyPreview || ""),
        active: data.active,
        rateLimit: data.rateLimit,
        permissions: data.permissions,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
        lastUsedAt: data.lastUsedAt?.toDate?.().toISOString() || data.lastUsedAt || null,
        expiresAt: data.expiresAt?.toDate?.().toISOString() || data.expiresAt || null,
        usageCount: data.usageCount || 0
      };
    });

    res.json({ keys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch API keys"
    });
  }
});

/**
 * POST /api/api-keys
 * Create a new API key
 */
router.post("/", firebaseAuthRequired, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const {
      name,
      appName,
      description,
      permissions = ["read"],
      rateLimit = "standard",
      expiresInDays = null,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!name || !appName) {
      return res.status(400).json({
        status: "error",
        message: "Name and appName are required"
      });
    }

    // Validate rate limit tier
    const validRateLimits = ["free", "standard", "premium"];
    if (!validRateLimits.includes(rateLimit)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid rateLimit. Must be one of: ${validRateLimits.join(", ")}`
      });
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const keyPreview = generateKeyPrefix();

    // Calculate expiry date
    let expiresAt = null;
    if (expiresInDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);
      expiresAt = expiryDate;
    }

    // Create key document
    const keyData = {
      name,
      appName,
      description: description || "",
      keyHash,
      keyPreview,
      permissions,
      rateLimit,
      active: true,
      createdBy: userEmail,
      createdAt: new Date(),
      lastUsedAt: null,
      expiresAt,
      usageCount: 0,
      metadata
    };

    const docRef = await firestore.collection(API_KEYS_COLLECTION).add(keyData);

    // Return the full API key ONCE (never stored in plain text)
    res.status(201).json({
      status: "success",
      message: "API key created successfully",
      apiKey: apiKey, // Only returned once!
      keyInfo: {
        id: docRef.id,
        name,
        appName,
        keyPreview,
        permissions,
        rateLimit,
        expiresAt: expiresAt?.toISOString() || null
      },
      warning: "Save this API key securely. You won't be able to see it again."
    });

  } catch (error) {
    console.error("Error creating API key:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create API key"
    });
  }
});

/**
 * GET /api/api-keys/:id
 * Get details of a specific API key
 */
router.get("/:id", firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;
    const isAdmin = req.user?.role === "admin";

    const docRef = firestore.collection(API_KEYS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        status: "error",
        message: "API key not found"
      });
    }

    const data = doc.data();

    // Check ownership
    if (!isAdmin && data.createdBy !== userEmail) {
      return res.status(403).json({
        status: "error",
        message: "Access denied"
      });
    }

    res.json({
      id: doc.id,
      name: data.name,
      appName: data.appName,
      description: data.description,
      keyPreview: maskApiKey(data.keyPreview || ""),
      active: data.active,
      rateLimit: data.rateLimit,
      permissions: data.permissions,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      lastUsedAt: data.lastUsedAt?.toDate?.().toISOString() || data.lastUsedAt || null,
      expiresAt: data.expiresAt?.toDate?.().toISOString() || data.expiresAt || null,
      usageCount: data.usageCount || 0,
      metadata: data.metadata || {}
    });

  } catch (error) {
    console.error("Error fetching API key:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch API key"
    });
  }
});

/**
 * PATCH /api/api-keys/:id
 * Update API key (name, permissions, active status, etc.)
 */
router.patch("/:id", firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;
    const isAdmin = req.user?.role === "admin";

    const docRef = firestore.collection(API_KEYS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        status: "error",
        message: "API key not found"
      });
    }

    const data = doc.data();

    // Check ownership
    if (!isAdmin && data.createdBy !== userEmail) {
      return res.status(403).json({
        status: "error",
        message: "Access denied"
      });
    }

    const {
      name,
      description,
      permissions,
      rateLimit,
      active,
      metadata
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (permissions !== undefined) updates.permissions = permissions;
    if (rateLimit !== undefined) updates.rateLimit = rateLimit;
    if (active !== undefined) updates.active = active;
    if (metadata !== undefined) updates.metadata = { ...data.metadata, ...metadata };
    
    updates.updatedAt = new Date();

    await docRef.update(updates);

    res.json({
      status: "success",
      message: "API key updated successfully"
    });

  } catch (error) {
    console.error("Error updating API key:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update API key"
    });
  }
});

/**
 * DELETE /api/api-keys/:id
 * Revoke/delete an API key
 */
router.delete("/:id", firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;
    const isAdmin = req.user?.role === "admin";

    const docRef = firestore.collection(API_KEYS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        status: "error",
        message: "API key not found"
      });
    }

    const data = doc.data();

    // Check ownership
    if (!isAdmin && data.createdBy !== userEmail) {
      return res.status(403).json({
        status: "error",
        message: "Access denied"
      });
    }

    // Soft delete - just deactivate
    await docRef.update({
      active: false,
      revokedAt: new Date(),
      revokedBy: userEmail
    });

    res.json({
      status: "success",
      message: "API key revoked successfully"
    });

  } catch (error) {
    console.error("Error revoking API key:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to revoke API key"
    });
  }
});

/**
 * POST /api/api-keys/:id/rotate
 * Rotate an API key (generate new key, invalidate old)
 */
router.post("/:id/rotate", firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;
    const isAdmin = req.user?.role === "admin";

    const docRef = firestore.collection(API_KEYS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        status: "error",
        message: "API key not found"
      });
    }

    const data = doc.data();

    // Check ownership
    if (!isAdmin && data.createdBy !== userEmail) {
      return res.status(403).json({
        status: "error",
        message: "Access denied"
      });
    }

    // Generate new API key
    const newApiKey = generateApiKey();
    const newKeyHash = hashApiKey(newApiKey);
    const newKeyPreview = generateKeyPrefix();

    // Update with new key
    await docRef.update({
      keyHash: newKeyHash,
      keyPreview: newKeyPreview,
      rotatedAt: new Date(),
      rotatedBy: userEmail,
      usageCount: 0,
      lastUsedAt: null
    });

    res.json({
      status: "success",
      message: "API key rotated successfully",
      apiKey: newApiKey, // Only returned once!
      keyPreview: newKeyPreview,
      warning: "Save this new API key securely. The old key is now invalid."
    });

  } catch (error) {
    console.error("Error rotating API key:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to rotate API key"
    });
  }
});

/**
 * GET /api/api-keys/:id/usage
 * Get usage statistics for an API key
 */
router.get("/:id/usage", firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;
    const isAdmin = req.user?.role === "admin";

    const docRef = firestore.collection(API_KEYS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        status: "error",
        message: "API key not found"
      });
    }

    const data = doc.data();

    // Check ownership
    if (!isAdmin && data.createdBy !== userEmail) {
      return res.status(403).json({
        status: "error",
        message: "Access denied"
      });
    }

    // Get usage stats from audit logs (if integrated)
    const usage = {
      totalRequests: data.usageCount || 0,
      lastUsed: data.lastUsedAt?.toDate?.().toISOString() || null,
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      daysActive: data.createdAt ? 
        Math.floor((Date.now() - data.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 0,
      averageRequestsPerDay: 0
    };

    if (usage.daysActive > 0) {
      usage.averageRequestsPerDay = Math.round(usage.totalRequests / usage.daysActive);
    }

    res.json({ usage });

  } catch (error) {
    console.error("Error fetching API key usage:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch usage statistics"
    });
  }
});

/**
 * Admin: GET /api/api-keys/admin/stats
 * Get overall API key statistics
 */
router.get("/admin/stats", firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const snapshot = await firestore.collection(API_KEYS_COLLECTION).get();
    
    const stats = {
      totalKeys: 0,
      activeKeys: 0,
      inactiveKeys: 0,
      expiredKeys: 0,
      byRateLimit: {
        free: 0,
        standard: 0,
        premium: 0
      },
      totalUsage: 0,
      recentActivity: []
    };

    const now = new Date();
    const recentKeys = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.totalKeys++;
      
      if (data.active) {
        stats.activeKeys++;
      } else {
        stats.inactiveKeys++;
      }

      if (data.expiresAt) {
        const expiryDate = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (expiryDate < now) {
          stats.expiredKeys++;
        }
      }

      const rateLimit = data.rateLimit || "standard";
      stats.byRateLimit[rateLimit] = (stats.byRateLimit[rateLimit] || 0) + 1;
      
      stats.totalUsage += data.usageCount || 0;

      if (data.lastUsedAt) {
        recentKeys.push({
          id: doc.id,
          appName: data.appName,
          lastUsedAt: data.lastUsedAt.toDate ? data.lastUsedAt.toDate() : new Date(data.lastUsedAt),
          usageCount: data.usageCount || 0
        });
      }
    });

    // Sort by last used and get top 10
    stats.recentActivity = recentKeys
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, 10)
      .map(k => ({
        id: k.id,
        appName: k.appName,
        lastUsedAt: k.lastUsedAt.toISOString(),
        usageCount: k.usageCount
      }));

    res.json({ stats });

  } catch (error) {
    console.error("Error fetching API key stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch statistics"
    });
  }
});

/**
 * GET /api/api-keys/:id/rate-limit
 * Get rate limit status for specific API key
 */
router.get("/:id/rate-limit", firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;
    const isAdmin = req.user?.role === "admin";

    // Verify ownership
    const keyDoc = await firestore.collection(API_KEYS_COLLECTION).doc(id).get();

    if (!keyDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "API key not found"
      });
    }

    const keyData = keyDoc.data();
    
    if (!isAdmin && keyData.createdBy !== userEmail) {
      return res.status(403).json({
        status: "error",
        message: "Access denied"
      });
    }

    // Get rate limit status
    const status = await getRateLimitStatus(id);

    res.json({
      status: "success",
      rateLimit: status
    });

  } catch (error) {
    console.error("Error fetching rate limit status:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch rate limit status",
      error: error.message
    });
  }
});

/**
 * POST /api/api-keys/:id/rate-limit/reset
 * Reset rate limit for specific API key (admin only)
 */
router.post("/:id/rate-limit/reset", firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify key exists
    const keyDoc = await firestore.collection(API_KEYS_COLLECTION).doc(id).get();

    if (!keyDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "API key not found"
      });
    }

    // Reset rate limit
    const result = await resetRateLimit(id);

    res.json({
      status: "success",
      message: "Rate limit reset successfully",
      ...result
    });

  } catch (error) {
    console.error("Error resetting rate limit:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to reset rate limit",
      error: error.message
    });
  }
});

/**
 * GET /api/api-keys/admin/rate-limit-stats
 * Get rate limit statistics for all API keys (admin only)
 */
router.get("/admin/rate-limit-stats", firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const stats = await getRateLimitStats();

    res.json({
      status: "success",
      stats
    });

  } catch (error) {
    console.error("Error fetching rate limit stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch rate limit statistics",
      error: error.message
    });
  }
});

export default router;
