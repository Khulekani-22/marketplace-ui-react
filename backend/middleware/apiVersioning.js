/**
 * API Versioning Middleware
 * 
 * Supports multiple versioning strategies:
 * 1. URL-based versioning: /api/v1/services, /api/v2/services
 * 2. Header-based versioning: Accept-Version: v1, Accept-Version: v2
 * 3. Query parameter versioning: /api/services?version=v1
 * 
 * Features:
 * - Version detection and validation
 * - Deprecation warnings
 * - Sunset dates for old versions
 * - Default version fallback
 * - Version-specific transformations
 */

const SUPPORTED_VERSIONS = ['v1', 'v2'];
const DEFAULT_VERSION = 'v1';
const LATEST_VERSION = 'v2';

/**
 * Version deprecation information
 */
const VERSION_INFO = {
  v1: {
    status: 'current',
    releaseDate: '2025-01-01',
    deprecationDate: null,
    sunsetDate: null,
    description: 'Initial stable version'
  },
  v2: {
    status: 'beta',
    releaseDate: '2025-10-26',
    deprecationDate: null,
    sunsetDate: null,
    description: 'Enhanced version with improved response formats'
  }
};

/**
 * Extract version from request
 * Priority: URL path > Accept-Version header > Query parameter > Default
 */
function extractVersion(req) {
  // 1. URL-based versioning (highest priority)
  const urlMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (urlMatch && SUPPORTED_VERSIONS.includes(urlMatch[1])) {
    return urlMatch[1];
  }

  // 2. Header-based versioning
  const acceptVersion = req.get('Accept-Version');
  if (acceptVersion && SUPPORTED_VERSIONS.includes(acceptVersion)) {
    return acceptVersion;
  }

  // 3. Query parameter versioning
  const queryVersion = req.query.version;
  if (queryVersion && SUPPORTED_VERSIONS.includes(queryVersion)) {
    return queryVersion;
  }

  // 4. Default version
  return DEFAULT_VERSION;
}

/**
 * Normalize path to remove version prefix
 * /api/v1/services -> /api/services
 * /api/v2/services -> /api/services
 */
function normalizeApiPath(path) {
  return path.replace(/^\/api\/v\d+\//, '/api/');
}

/**
 * Check if version is deprecated
 */
function isVersionDeprecated(version) {
  const info = VERSION_INFO[version];
  if (!info || !info.deprecationDate) return false;
  
  const deprecationTime = new Date(info.deprecationDate).getTime();
  return Date.now() >= deprecationTime;
}

/**
 * Check if version is sunset (no longer supported)
 */
function isVersionSunset(version) {
  const info = VERSION_INFO[version];
  if (!info || !info.sunsetDate) return false;
  
  const sunsetTime = new Date(info.sunsetDate).getTime();
  return Date.now() >= sunsetTime;
}

/**
 * Calculate days until sunset
 */
function daysUntilSunset(version) {
  const info = VERSION_INFO[version];
  if (!info || !info.sunsetDate) return null;
  
  const sunsetTime = new Date(info.sunsetDate).getTime();
  const daysRemaining = Math.ceil((sunsetTime - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
}

/**
 * Main versioning middleware
 */
export function apiVersioning() {
  return (req, res, next) => {
    // Extract requested version
    const requestedVersion = extractVersion(req);
    
    // Check if version is supported
    if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
      return res.status(400).json({
        status: 'error',
        code: 'UNSUPPORTED_VERSION',
        message: `API version '${requestedVersion}' is not supported`,
        supportedVersions: SUPPORTED_VERSIONS,
        latestVersion: LATEST_VERSION
      });
    }

    // Check if version is sunset
    if (isVersionSunset(requestedVersion)) {
      return res.status(410).json({
        status: 'error',
        code: 'VERSION_SUNSET',
        message: `API version '${requestedVersion}' is no longer supported`,
        sunsetDate: VERSION_INFO[requestedVersion].sunsetDate,
        latestVersion: LATEST_VERSION,
        upgradeUrl: 'https://docs.22onsloane.co/api/migration'
      });
    }

    // Attach version to request
    req.apiVersion = requestedVersion;
    req.apiVersionInfo = VERSION_INFO[requestedVersion];

    // Store normalized path (don't modify req.path as it's read-only)
    const originalPath = req.path;
    req.normalizedPath = normalizeApiPath(req.path);
    req.originalPath = originalPath;

    // Add version headers to response
    res.setHeader('X-API-Version', requestedVersion);
    res.setHeader('X-API-Latest-Version', LATEST_VERSION);

    // Add deprecation warning if applicable
    if (isVersionDeprecated(requestedVersion)) {
      const days = daysUntilSunset(requestedVersion);
      const sunsetDate = VERSION_INFO[requestedVersion].sunsetDate;
      
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', sunsetDate);
      
      if (days !== null) {
        res.setHeader('X-API-Deprecation-Warning', 
          `This API version will be sunset in ${days} days (${sunsetDate}). Please upgrade to ${LATEST_VERSION}.`
        );
      }
    }

    // Add Link header for version discovery
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const links = SUPPORTED_VERSIONS.map(v => 
      `<${baseUrl}/api/${v}${req.path.replace('/api', '')}>; rel="version"; version="${v}"`
    );
    res.setHeader('Link', links.join(', '));

    next();
  };
}

/**
 * Version-specific response transformation middleware
 */
export function versionTransform() {
  return (req, res, next) => {
    const version = req.apiVersion || DEFAULT_VERSION;
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to transform response based on version
    res.json = function(data) {
      let transformedData = data;
      
      // Apply version-specific transformations
      switch (version) {
        case 'v1':
          transformedData = transformV1(data);
          break;
        case 'v2':
          transformedData = transformV2(data);
          break;
        default:
          transformedData = data;
      }
      
      // Add version metadata to response
      if (transformedData && typeof transformedData === 'object') {
        transformedData._metadata = {
          version,
          timestamp: new Date().toISOString(),
          ...(transformedData._metadata || {})
        };
      }
      
      return originalJson(transformedData);
    };
    
    next();
  };
}

/**
 * Transform response for v1 (legacy format)
 */
function transformV1(data) {
  // V1 uses simple structure
  if (!data) return data;
  
  // Remove v2-specific fields
  if (typeof data === 'object' && data !== null) {
    const { _links, _embedded, ...v1Data } = data;
    return v1Data;
  }
  
  return data;
}

/**
 * Transform response for v2 (enhanced format)
 */
function transformV2(data) {
  // V2 adds HATEOAS links and embedded resources
  if (!data || typeof data !== 'object') return data;
  
  // Already has v2 structure
  if (data._links) return data;
  
  // Add HATEOAS links if response has an ID
  if (data.id) {
    data._links = {
      self: { href: `/api/v2/resources/${data.id}` }
    };
  }
  
  return data;
}

/**
 * Get version info endpoint
 */
export function getVersionInfo(req, res) {
  const versions = Object.entries(VERSION_INFO).map(([version, info]) => ({
    version,
    ...info,
    isDeprecated: isVersionDeprecated(version),
    isSunset: isVersionSunset(version),
    daysUntilSunset: daysUntilSunset(version)
  }));

  res.json({
    status: 'success',
    currentVersion: DEFAULT_VERSION,
    latestVersion: LATEST_VERSION,
    supportedVersions: SUPPORTED_VERSIONS,
    versions,
    documentation: 'https://docs.22onsloane.co/api/versioning'
  });
}

/**
 * Deprecate a version (admin only)
 */
export async function deprecateVersion(version, deprecationDate, sunsetDate) {
  if (!SUPPORTED_VERSIONS.includes(version)) {
    throw new Error(`Invalid version: ${version}`);
  }

  if (!VERSION_INFO[version]) {
    throw new Error(`Version ${version} not found`);
  }

  VERSION_INFO[version].deprecationDate = deprecationDate;
  VERSION_INFO[version].sunsetDate = sunsetDate;
  VERSION_INFO[version].status = 'deprecated';

  // In production, this would also update the database
  console.log(`Version ${version} deprecated. Sunset date: ${sunsetDate}`);
}

// Named exports for convenience
export { SUPPORTED_VERSIONS, DEFAULT_VERSION, LATEST_VERSION, VERSION_INFO };

export default {
  apiVersioning,
  versionTransform,
  getVersionInfo,
  deprecateVersion,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION,
  LATEST_VERSION,
  VERSION_INFO
};
