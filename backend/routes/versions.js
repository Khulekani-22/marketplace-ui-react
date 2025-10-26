/**
 * API Version Routes
 * 
 * Manages API versioning endpoints:
 * - Version information
 * - Version deprecation (admin)
 * - Migration guides
 */

import express from 'express';
import { firebaseAuthRequired } from '../middleware/authFirebase.js';
import { requireAdmin } from '../middleware/isAdmin.js';
import {
  getVersionInfo,
  deprecateVersion,
  VERSION_INFO,
  SUPPORTED_VERSIONS
} from '../middleware/apiVersioning.js';

const router = express.Router();

/**
 * GET /api/versions
 * Get information about all API versions
 */
router.get('/', (req, res) => {
  getVersionInfo(req, res);
});

/**
 * POST /api/versions/:version/deprecate
 * Deprecate a specific API version (admin only)
 */
router.post('/:version/deprecate', firebaseAuthRequired, requireAdmin, async (req, res) => {
  try {
    const { version } = req.params;
    const { deprecationDate, sunsetDate } = req.body;

    if (!deprecationDate || !sunsetDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Both deprecationDate and sunsetDate are required'
      });
    }

    // Validate dates
    const depDate = new Date(deprecationDate);
    const sunDate = new Date(sunsetDate);

    if (isNaN(depDate.getTime()) || isNaN(sunDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format'
      });
    }

    if (sunDate <= depDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Sunset date must be after deprecation date'
      });
    }

    // Deprecate the version
    await deprecateVersion(version, deprecationDate, sunsetDate);

    res.json({
      status: 'success',
      message: `Version ${version} has been deprecated`,
      deprecationDate,
      sunsetDate
    });

  } catch (error) {
    console.error('Error deprecating version:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to deprecate version'
    });
  }
});

/**
 * GET /api/versions/:version/migration
 * Get migration guide for upgrading from specified version
 */
router.get('/:version/migration', (req, res) => {
  const { version } = req.params;
  const { to } = req.query;

  if (!SUPPORTED_VERSIONS.includes(version)) {
    return res.status(404).json({
      status: 'error',
      message: `Version ${version} not found`
    });
  }

  const targetVersion = to || 'v2'; // Default to latest

  const migrationGuides = {
    'v1-to-v2': {
      title: 'Migrating from v1 to v2',
      changes: [
        {
          type: 'enhancement',
          description: 'HATEOAS links added to responses',
          example: {
            v1: { id: '123', name: 'Service' },
            v2: {
              id: '123',
              name: 'Service',
              _links: {
                self: { href: '/api/v2/services/123' }
              }
            }
          }
        },
        {
          type: 'enhancement',
          description: 'Metadata added to all responses',
          example: {
            v2: {
              data: { /* ... */ },
              _metadata: {
                version: 'v2',
                timestamp: '2025-10-26T12:00:00Z'
              }
            }
          }
        },
        {
          type: 'change',
          description: 'Error response format standardized',
          breaking: false,
          example: {
            v1: { status: 'error', message: 'Error occurred' },
            v2: {
              status: 'error',
              code: 'ERROR_CODE',
              message: 'Error occurred',
              details: { /* ... */ }
            }
          }
        }
      ],
      steps: [
        'Update your base URL to include /v2/ in the path',
        'Update response parsing to handle _metadata field',
        'Update error handling to use structured error codes',
        'Test all endpoints with v2',
        'Monitor for deprecation warnings'
      ],
      estimatedTime: '2-4 hours',
      breakingChanges: false
    }
  };

  const guideKey = `${version}-to-${targetVersion}`;
  const guide = migrationGuides[guideKey];

  if (!guide) {
    return res.json({
      status: 'success',
      message: `No migration needed from ${version} to ${targetVersion}`,
      currentVersion: version,
      targetVersion
    });
  }

  res.json({
    status: 'success',
    migration: {
      from: version,
      to: targetVersion,
      ...guide
    }
  });
});

/**
 * GET /api/versions/:version/changelog
 * Get changelog for specific version
 */
router.get('/:version/changelog', (req, res) => {
  const { version } = req.params;

  if (!SUPPORTED_VERSIONS.includes(version)) {
    return res.status(404).json({
      status: 'error',
      message: `Version ${version} not found`
    });
  }

  const changelogs = {
    v1: {
      releaseDate: '2025-01-01',
      changes: [
        {
          type: 'feature',
          description: 'Initial API release'
        },
        {
          type: 'feature',
          description: 'RESTful endpoints for all resources'
        },
        {
          type: 'feature',
          description: 'Firebase authentication'
        },
        {
          type: 'feature',
          description: 'Pagination support'
        }
      ]
    },
    v2: {
      releaseDate: '2025-10-26',
      changes: [
        {
          type: 'feature',
          description: 'HATEOAS links for resource navigation'
        },
        {
          type: 'feature',
          description: 'Enhanced metadata in responses'
        },
        {
          type: 'feature',
          description: 'Structured error codes'
        },
        {
          type: 'feature',
          description: 'API key authentication support'
        },
        {
          type: 'feature',
          description: 'Per-key rate limiting'
        },
        {
          type: 'improvement',
          description: 'Better validation error messages'
        },
        {
          type: 'improvement',
          description: 'Consistent response formats'
        }
      ]
    }
  };

  const changelog = changelogs[version];

  res.json({
    status: 'success',
    version,
    versionInfo: VERSION_INFO[version],
    changelog
  });
});

export default router;
