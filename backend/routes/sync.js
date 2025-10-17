import { Router } from "express";
import { firebaseAuthRequired } from "../middleware/authFirebase.js";
import { 
  bidirectionalSync, 
  autoCreateMissingProfile,
  SYNC_FIELDS 
} from "../utils/profileSync.js";

const router = Router();

/**
 * GET /api/sync/status
 * Check sync status between startup and vendor profiles
 */
router.get("/status", firebaseAuthRequired, async (req, res) => {
  try {
    const ownerUid = req.user?.uid;
    const email = req.user?.email;

    if (!ownerUid && !email) {
      return res.status(400).json({ 
        status: "error", 
        message: "User identification required" 
      });
    }

    const { getData } = await import("../utils/hybridDataStore.js");
    const data = await getData();

    const normalizedEmail = (email || "").toLowerCase();
    
    const startup = data.startups?.find(s => 
      (ownerUid && s.ownerUid === ownerUid) ||
      (normalizedEmail && (s.contactEmail || "").toLowerCase() === normalizedEmail)
    );
    
    const vendor = data.vendors?.find(v => 
      (ownerUid && v.ownerUid === ownerUid) ||
      (normalizedEmail && (v.contactEmail || "").toLowerCase() === normalizedEmail)
    );

    res.json({
      hasStartup: !!startup,
      hasVendor: !!vendor,
      startupId: startup?.id,
      vendorId: vendor?.id,
      startupLastSynced: startup?.lastSyncedAt,
      vendorLastSynced: vendor?.lastSyncedAt,
      syncFields: SYNC_FIELDS,
      canSync: !!(startup && vendor),
      canCreateStartup: !!vendor && !startup,
      canCreateVendor: !!startup && !vendor,
    });
  } catch (error) {
    console.error("Error checking sync status:", error);
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});

/**
 * POST /api/sync/now
 * Manually trigger bidirectional sync
 */
router.post("/now", firebaseAuthRequired, async (req, res) => {
  try {
    const ownerUid = req.user?.uid;
    const email = req.user?.email;

    if (!ownerUid && !email) {
      return res.status(400).json({ 
        status: "error", 
        message: "User identification required" 
      });
    }

    const result = await bidirectionalSync(ownerUid, email);
    
    if (result.synced) {
      res.json({
        status: "success",
        message: "Profiles synchronized successfully",
        ...result
      });
    } else {
      res.status(400).json({
        status: "error",
        message: result.reason || "Sync failed",
        ...result
      });
    }
  } catch (error) {
    console.error("Error syncing profiles:", error);
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});

/**
 * POST /api/sync/create-missing
 * Auto-create missing profile (startup or vendor)
 */
router.post("/create-missing", firebaseAuthRequired, async (req, res) => {
  try {
    const ownerUid = req.user?.uid;
    const email = req.user?.email;
    const { sourceType } = req.body; // 'vendor' or 'startup'

    if (!ownerUid && !email) {
      return res.status(400).json({ 
        status: "error", 
        message: "User identification required" 
      });
    }

    if (!sourceType || !["vendor", "startup"].includes(sourceType)) {
      return res.status(400).json({ 
        status: "error", 
        message: "sourceType must be 'vendor' or 'startup'" 
      });
    }

    const result = await autoCreateMissingProfile(ownerUid, email, sourceType);
    
    if (result.created) {
      res.status(201).json({
        status: "success",
        message: `${result.type} profile created successfully`,
        ...result
      });
    } else {
      res.status(400).json({
        status: "error",
        message: result.reason || "Profile creation failed",
        ...result
      });
    }
  } catch (error) {
    console.error("Error creating missing profile:", error);
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});

export default router;
