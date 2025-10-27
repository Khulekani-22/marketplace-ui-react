/**
 * External Apps Management Routes
 * 
 * Endpoints for registering and managing external applications
 * that consume the API. Includes CORS whitelist management.
 */

import express from 'express';
import { firestore } from '../services/firestore.js';
import { firebaseAuthRequired } from '../middleware/authFirebase.js';
import { requireAdmin } from '../middleware/isAdmin.js';
import { refreshCorsCache } from '../middleware/corsConfig.js';

const router = express.Router();

/**
 * Validate URL format
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate origin format (can include wildcards)
 */
function isValidOrigin(origin) {
  // Allow wildcards like *.example.com
  if (origin.includes('*')) {
    const withoutWildcard = origin.replace(/\*/g, 'example');
    return isValidUrl(withoutWildcard);
  }
  return isValidUrl(origin);
}

/**
 * List all external apps
 * GET /api/external-apps
 */
router.get('/', firebaseAuthRequired, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, active, search } = req.query;
    const userId = req.user.uid;
    const isAdmin = req.user.admin || false;

    let query = firestore.collection('externalApps');

    // Non-admins can only see their own apps
    if (!isAdmin) {
      query = query.where('createdBy', '==', userId);
    }

    // Filter by active status
    if (active !== undefined) {
      query = query.where('active', '==', active === 'true');
    }

    const snapshot = await query.get();
    let apps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      apps = apps.filter(app => 
        app.name?.toLowerCase().includes(searchLower) ||
        app.description?.toLowerCase().includes(searchLower) ||
        app.appIdentifier?.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const total = apps.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedApps = apps.slice(startIndex, endIndex);

    res.json({
      status: 'success',
      apps: paginatedApps,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Error listing external apps:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to list external apps',
      error: error.message
    });
  }
});

/**
 * Register a new external app
 * POST /api/external-apps
 */
router.post('/', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      name,
      appIdentifier,
      description,
      allowedOrigins = [],
      webhookUrl,
      corsEnabled = true,
      metadata = {}
    } = req.body;

    // Validation
    if (!name || !appIdentifier) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and app identifier are required'
      });
    }

    // Validate origins
    for (const origin of allowedOrigins) {
      if (!isValidOrigin(origin)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid origin format: ${origin}`
        });
      }
    }

    // Validate webhook URL if provided
    if (webhookUrl && !isValidUrl(webhookUrl)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid webhook URL format'
      });
    }

    // Check if app identifier already exists
    const existingApp = await firestore.collection('externalApps')
      .where('appIdentifier', '==', appIdentifier)
      .limit(1)
      .get();

    if (!existingApp.empty) {
      return res.status(409).json({
        status: 'error',
        message: 'App identifier already exists'
      });
    }

    // Create external app
    const appData = {
      name,
      appIdentifier,
      description: description || '',
      allowedOrigins,
      webhookUrl: webhookUrl || null,
      corsEnabled,
      active: true,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
      stats: {
        totalRequests: 0,
        lastRequestAt: null
      }
    };

    const appRef = await firestore.collection('externalApps').add(appData);

    // Refresh CORS cache
    await refreshCorsCache();

    res.status(201).json({
      status: 'success',
      message: 'External app registered successfully',
      app: {
        id: appRef.id,
        ...appData
      }
    });
  } catch (error) {
    console.error('Error creating external app:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create external app',
      error: error.message
    });
  }
});

/**
 * Get external app details
 * GET /api/external-apps/:id
 */
router.get('/:id', firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.admin || false;

    const appDoc = await firestore.collection('externalApps').doc(id).get();

    if (!appDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'External app not found'
      });
    }

    const appData = appDoc.data();

    // Check permissions
    if (!isAdmin && appData.createdBy !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.json({
      status: 'success',
      app: {
        id: appDoc.id,
        ...appData
      }
    });
  } catch (error) {
    console.error('Error fetching external app:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch external app',
      error: error.message
    });
  }
});

/**
 * Update external app
 * PATCH /api/external-apps/:id
 */
router.patch('/:id', firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.admin || false;

    const appDoc = await firestore.collection('externalApps').doc(id).get();

    if (!appDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'External app not found'
      });
    }

    const appData = appDoc.data();

    // Check permissions
    if (!isAdmin && appData.createdBy !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const {
      name,
      description,
      allowedOrigins,
      webhookUrl,
      corsEnabled,
      active,
      metadata
    } = req.body;

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (corsEnabled !== undefined) updates.corsEnabled = corsEnabled;
    if (active !== undefined) updates.active = active;
    if (metadata !== undefined) updates.metadata = metadata;

    // Validate and update origins
    if (allowedOrigins !== undefined) {
      for (const origin of allowedOrigins) {
        if (!isValidOrigin(origin)) {
          return res.status(400).json({
            status: 'error',
            message: `Invalid origin format: ${origin}`
          });
        }
      }
      updates.allowedOrigins = allowedOrigins;
    }

    // Validate webhook URL
    if (webhookUrl !== undefined) {
      if (webhookUrl && !isValidUrl(webhookUrl)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid webhook URL format'
        });
      }
      updates.webhookUrl = webhookUrl || null;
    }

    await firestore.collection('externalApps').doc(id).update(updates);

    // Refresh CORS cache if origins or CORS settings changed
    if (updates.allowedOrigins || updates.corsEnabled !== undefined) {
      await refreshCorsCache();
    }

    res.json({
      status: 'success',
      message: 'External app updated successfully',
      app: {
        id,
        ...appData,
        ...updates
      }
    });
  } catch (error) {
    console.error('Error updating external app:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update external app',
      error: error.message
    });
  }
});

/**
 * Delete external app
 * DELETE /api/external-apps/:id
 */
router.delete('/:id', firebaseAuthRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.admin || false;

    const appDoc = await firestore.collection('externalApps').doc(id).get();

    if (!appDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'External app not found'
      });
    }

    const appData = appDoc.data();

    // Check permissions
    if (!isAdmin && appData.createdBy !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Soft delete
    await firestore.collection('externalApps').doc(id).update({
      active: false,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Refresh CORS cache
    await refreshCorsCache();

    res.json({
      status: 'success',
      message: 'External app deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting external app:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete external app',
      error: error.message
    });
  }
});

/**
 * Get origin tracking stats
 * GET /api/external-apps/tracking/origins
 */
router.get('/tracking/origins', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const snapshot = await firestore.collection('originTracking')
      .orderBy('requestCount', 'desc')
      .limit(parseInt(limit))
      .get();

    const origins = snapshot.docs.map(doc => ({
      origin: doc.id,
      ...doc.data()
    }));

    res.json({
      status: 'success',
      origins,
      total: origins.length
    });
  } catch (error) {
    console.error('Error fetching origin tracking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch origin tracking',
      error: error.message
    });
  }
});

/**
 * Refresh CORS cache (admin only)
 * POST /api/external-apps/admin/refresh-cors
 */
router.post('/admin/refresh-cors', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const result = await refreshCorsCache();
    
    res.json({
      status: 'success',
      message: 'CORS cache refreshed successfully',
      ...result
    });
  } catch (error) {
    console.error('Error refreshing CORS cache:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to refresh CORS cache',
      error: error.message
    });
  }
});

export default router;
