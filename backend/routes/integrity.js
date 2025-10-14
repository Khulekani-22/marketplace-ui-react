import { Router } from 'express';
import DataIntegrityValidator from '../utils/DataIntegrityValidator.js';
import { firebaseAuthRequired } from '../middleware/authFirebase.js';
import { requireAdmin } from '../middleware/isAdmin.js';
import admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();
const validator = new DataIntegrityValidator(db);

/**
 * Run data integrity validation
 * GET /api/admin/validate-integrity
 */
router.get('/validate-integrity', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const results = await validator.runFullCheck();
    res.json({
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Error running integrity check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to run integrity check',
      error: error.message
    });
  }
});

/**
 * Auto-sync missing vendors from startups
 * POST /api/admin/sync-vendors
 */
router.post('/sync-vendors', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const result = await validator.autoSyncMissingVendors();
    res.json({
      status: 'success',
      message: `Successfully synced ${result.synced} vendors`,
      data: result
    });
  } catch (error) {
    console.error('Error syncing vendors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync vendors',
      error: error.message
    });
  }
});

/**
 * Validate service vendor integrity
 * GET /api/admin/validate-service-vendors
 */
router.get('/validate-service-vendors', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const validation = await validator.validateServiceVendors();
    res.json({
      status: 'success',
      data: validation
    });
  } catch (error) {
    console.error('Error validating service vendors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate service vendors',
      error: error.message
    });
  }
});

export default router;