import { validateAccessToken } from '../services/oauthService.js';

/**
 * OAuth 2.0 Middleware
 * Validates OAuth access tokens and enforces scope requirements
 */

/**
 * Middleware to require valid OAuth access token
 */
export async function oauthRequired(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token
    const tokenData = await validateAccessToken(token);
    
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        error: 'invalid_token',
        message: 'Invalid or expired access token'
      });
    }

    // Attach token data to request
    req.oauth = {
      userId: tokenData.userId,
      clientId: tokenData.clientId,
      scopes: tokenData.scopes,
      token
    };

    next();
  } catch (error) {
    console.error('OAuth validation error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to validate access token'
    });
  }
}

/**
 * Middleware to require specific OAuth scopes
 * Usage: requireScopes(['read:services', 'write:services'])
 */
export function requireScopes(requiredScopes) {
  return (req, res, next) => {
    if (!req.oauth) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'OAuth authentication required'
      });
    }

    const { scopes } = req.oauth;

    // Check if user has admin:all scope (grants all permissions)
    if (scopes.includes('admin:all')) {
      return next();
    }

    // Check if user has all required scopes
    const missingScopes = requiredScopes.filter(scope => !scopes.includes(scope));

    if (missingScopes.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'insufficient_scope',
        message: 'Insufficient permissions',
        required_scopes: requiredScopes,
        missing_scopes: missingScopes
      });
    }

    next();
  };
}

/**
 * Middleware to require ANY of the specified scopes
 * Usage: requireAnyScope(['read:services', 'admin:all'])
 */
export function requireAnyScope(allowedScopes) {
  return (req, res, next) => {
    if (!req.oauth) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'OAuth authentication required'
      });
    }

    const { scopes } = req.oauth;

    // Check if user has any of the allowed scopes
    const hasScope = allowedScopes.some(scope => scopes.includes(scope));

    if (!hasScope) {
      return res.status(403).json({
        success: false,
        error: 'insufficient_scope',
        message: 'Insufficient permissions',
        required_scopes: allowedScopes
      });
    }

    next();
  };
}

/**
 * Optional OAuth middleware - validates token if present but doesn't require it
 * Useful for endpoints that work with or without authentication
 */
export async function oauthOptional(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without OAuth context
      return next();
    }

    const token = authHeader.substring(7);
    const tokenData = await validateAccessToken(token);
    
    if (tokenData) {
      // Attach token data to request
      req.oauth = {
        userId: tokenData.userId,
        clientId: tokenData.clientId,
        scopes: tokenData.scopes,
        token
      };
    }

    next();
  } catch (error) {
    console.error('OAuth validation error:', error);
    // Don't fail the request, just continue without OAuth context
    next();
  }
}

/**
 * Middleware to check if OAuth token belongs to specific user
 * Useful for ensuring users can only access their own resources
 */
export function requireOwnResource(userIdParam = 'userId') {
  return (req, res, next) => {
    if (!req.oauth) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'OAuth authentication required'
      });
    }

    const requestedUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (!requestedUserId) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: `Missing ${userIdParam} parameter`
      });
    }

    // Allow if admin or accessing own resource
    if (req.oauth.scopes.includes('admin:all') || req.oauth.userId === requestedUserId) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: 'forbidden',
      message: 'You can only access your own resources'
    });
  };
}

/**
 * Extract scope requirements from route
 * Helper function to document scope requirements
 */
export function documentScopes(scopes) {
  return (req, res, next) => {
    // Store scope documentation in request for API documentation generation
    req.scopeRequirements = scopes;
    next();
  };
}
