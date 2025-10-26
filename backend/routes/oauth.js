import express from 'express';
import {
  registerOAuthClient,
  getOAuthClient,
  listUserOAuthClients,
  updateOAuthClient,
  deleteOAuthClient,
  generateAuthorizationCode,
  exchangeAuthorizationCode,
  refreshAccessToken,
  generateClientCredentialsToken,
  revokeToken,
  hasUserGrantedScopes,
  saveUserConsent,
  revokeUserConsent,
  GRANT_TYPES,
  SCOPES
} from '../services/oauthService.js';
import { firebaseAuthRequired } from '../middleware/authFirebase.js';
import { oauthRequired } from '../middleware/oauth.js';

const router = express.Router();

/**
 * GET /oauth/scopes
 * Get list of available OAuth scopes
 */
router.get('/scopes', (req, res) => {
  const scopeList = Object.entries(SCOPES).map(([scope, description]) => ({
    scope,
    description
  }));

  res.json({
    success: true,
    data: scopeList
  });
});

/**
 * POST /oauth/clients
 * Register a new OAuth client
 * Requires Firebase authentication
 */
router.post('/clients', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, description, redirectUris, grantTypes, scopes } = req.body;

    if (!name || !redirectUris) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Name and redirect URIs are required'
      });
    }

    const client = await registerOAuthClient(userId, {
      name,
      description,
      redirectUris,
      grantTypes,
      scopes
    });

    res.status(201).json({
      success: true,
      data: client,
      message: 'OAuth client created successfully. Save the client secret - it will not be shown again.'
    });
  } catch (error) {
    console.error('Register OAuth client error:', error);
    res.status(400).json({
      success: false,
      error: 'registration_failed',
      message: error.message
    });
  }
});

/**
 * GET /oauth/clients
 * List user's OAuth clients
 * Requires Firebase authentication
 */
router.get('/clients', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const clients = await listUserOAuthClients(userId);

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('List OAuth clients error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to list OAuth clients'
    });
  }
});

/**
 * GET /oauth/clients/:clientId
 * Get OAuth client details
 * Requires Firebase authentication
 */
router.get('/clients/:clientId', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { clientId } = req.params;

    const client = await getOAuthClient(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'OAuth client not found'
      });
    }

    if (client.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'forbidden',
        message: 'Access denied'
      });
    }

    // Don't expose client secret hash
    delete client.clientSecretHash;

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Get OAuth client error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to get OAuth client'
    });
  }
});

/**
 * PUT /oauth/clients/:clientId
 * Update OAuth client
 * Requires Firebase authentication
 */
router.put('/clients/:clientId', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { clientId } = req.params;
    const updates = req.body;

    const client = await updateOAuthClient(clientId, userId, updates);

    delete client.clientSecretHash;

    res.json({
      success: true,
      data: client,
      message: 'OAuth client updated successfully'
    });
  } catch (error) {
    console.error('Update OAuth client error:', error);
    res.status(400).json({
      success: false,
      error: 'update_failed',
      message: error.message
    });
  }
});

/**
 * DELETE /oauth/clients/:clientId
 * Delete OAuth client and revoke all its tokens
 * Requires Firebase authentication
 */
router.delete('/clients/:clientId', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { clientId } = req.params;

    await deleteOAuthClient(clientId, userId);

    res.json({
      success: true,
      message: 'OAuth client deleted successfully'
    });
  } catch (error) {
    console.error('Delete OAuth client error:', error);
    res.status(400).json({
      success: false,
      error: 'deletion_failed',
      message: error.message
    });
  }
});

/**
 * GET /oauth/authorize
 * OAuth authorization endpoint
 * Displays consent screen for user to authorize client
 */
router.get('/authorize', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      client_id,
      redirect_uri,
      response_type,
      scope,
      state,
      code_challenge,
      code_challenge_method
    } = req.query;

    // Validate required parameters
    if (!client_id || !redirect_uri || !response_type || !scope) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Missing required parameters: client_id, redirect_uri, response_type, scope'
      });
    }

    // Only support authorization code flow
    if (response_type !== 'code') {
      return res.status(400).json({
        success: false,
        error: 'unsupported_response_type',
        message: 'Only response_type=code is supported'
      });
    }

    // Validate PKCE if provided
    if (code_challenge && code_challenge_method !== 'S256') {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Only code_challenge_method=S256 is supported'
      });
    }

    // Get client details
    const client = await getOAuthClient(client_id);

    if (!client || !client.active) {
      return res.status(400).json({
        success: false,
        error: 'invalid_client',
        message: 'Invalid or inactive client'
      });
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Invalid redirect URI'
      });
    }

    // Parse requested scopes
    const requestedScopes = scope.split(' ');

    // Validate scopes
    const invalidScopes = requestedScopes.filter(s => !SCOPES[s]);
    if (invalidScopes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'invalid_scope',
        message: `Invalid scopes: ${invalidScopes.join(', ')}`
      });
    }

    // Check if client is authorized for these scopes
    const unauthorizedScopes = requestedScopes.filter(s => !client.scopes.includes(s));
    if (unauthorizedScopes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'invalid_scope',
        message: `Client not authorized for scopes: ${unauthorizedScopes.join(', ')}`
      });
    }

    // Check if user has already granted these scopes
    const alreadyGranted = await hasUserGrantedScopes(userId, client_id, requestedScopes);

    if (alreadyGranted) {
      // Auto-approve if already granted
      const code = await generateAuthorizationCode(
        client_id,
        userId,
        redirect_uri,
        requestedScopes,
        code_challenge
      );

      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('code', code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      return res.redirect(redirectUrl.toString());
    }

    // Return consent screen data
    res.json({
      success: true,
      data: {
        client: {
          id: client.clientId,
          name: client.name,
          description: client.description
        },
        requestedScopes: requestedScopes.map(s => ({
          scope: s,
          description: SCOPES[s]
        })),
        user: {
          email: req.user.email,
          uid: userId
        }
      },
      // Include authorization params for form submission
      authParams: {
        client_id,
        redirect_uri,
        response_type,
        scope,
        state,
        code_challenge,
        code_challenge_method
      }
    });
  } catch (error) {
    console.error('OAuth authorize error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to process authorization request'
    });
  }
});

/**
 * POST /oauth/authorize
 * User grants or denies authorization
 */
router.post('/authorize', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      client_id,
      redirect_uri,
      scope,
      state,
      code_challenge,
      approved
    } = req.body;

    if (!client_id || !redirect_uri || !scope) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Missing required parameters'
      });
    }

    const redirectUrl = new URL(redirect_uri);

    // User denied authorization
    if (!approved) {
      redirectUrl.searchParams.set('error', 'access_denied');
      redirectUrl.searchParams.set('error_description', 'User denied authorization');
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }
      return res.json({
        success: false,
        redirect: redirectUrl.toString()
      });
    }

    // User approved - save consent
    const requestedScopes = scope.split(' ');
    await saveUserConsent(userId, client_id, requestedScopes);

    // Generate authorization code
    const code = await generateAuthorizationCode(
      client_id,
      userId,
      redirect_uri,
      requestedScopes,
      code_challenge
    );

    redirectUrl.searchParams.set('code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    res.json({
      success: true,
      redirect: redirectUrl.toString()
    });
  } catch (error) {
    console.error('OAuth authorize POST error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: error.message
    });
  }
});

/**
 * POST /oauth/token
 * Exchange authorization code for access token
 * or refresh an access token
 */
router.post('/token', async (req, res) => {
  try {
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      refresh_token,
      code_verifier,
      scope
    } = req.body;

    if (!grant_type || !client_id || !client_secret) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: grant_type, client_id, client_secret'
      });
    }

    let tokenResponse;

    switch (grant_type) {
      case GRANT_TYPES.AUTHORIZATION_CODE:
        if (!code || !redirect_uri) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing code or redirect_uri'
          });
        }

        tokenResponse = await exchangeAuthorizationCode(
          code,
          client_id,
          client_secret,
          redirect_uri,
          code_verifier
        );
        break;

      case GRANT_TYPES.REFRESH_TOKEN:
        if (!refresh_token) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing refresh_token'
          });
        }

        tokenResponse = await refreshAccessToken(
          refresh_token,
          client_id,
          client_secret
        );
        break;

      case GRANT_TYPES.CLIENT_CREDENTIALS:
        if (!scope) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing scope'
          });
        }

        const requestedScopes = scope.split(' ');
        tokenResponse = await generateClientCredentialsToken(
          client_id,
          client_secret,
          requestedScopes
        );
        break;

      default:
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: `Grant type ${grant_type} is not supported`
        });
    }

    res.json(tokenResponse);
  } catch (error) {
    console.error('OAuth token error:', error);
    res.status(400).json({
      error: 'invalid_grant',
      error_description: error.message
    });
  }
});

/**
 * POST /oauth/revoke
 * Revoke an access token or refresh token
 */
router.post('/revoke', async (req, res) => {
  try {
    const { token, token_type_hint } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing token parameter'
      });
    }

    await revokeToken(token, token_type_hint);

    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error) {
    console.error('OAuth revoke error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Failed to revoke token'
    });
  }
});

/**
 * DELETE /oauth/consents/:clientId
 * Revoke user consent for a client
 */
router.delete('/consents/:clientId', firebaseAuthRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { clientId } = req.params;

    await revokeUserConsent(userId, clientId);

    res.json({
      success: true,
      message: 'Consent revoked successfully'
    });
  } catch (error) {
    console.error('Revoke consent error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to revoke consent'
    });
  }
});

/**
 * GET /oauth/userinfo
 * Get user information using OAuth token
 * Standard OpenID Connect endpoint
 */
router.get('/userinfo', oauthRequired, async (req, res) => {
  try {
    // Return user information based on granted scopes
    const userInfo = {
      sub: req.oauth.userId // Standard 'sub' claim for user ID
    };

    // Add additional claims based on scopes
    if (req.oauth.scopes.includes('read:users')) {
      userInfo.email = req.user?.email;
      userInfo.name = req.user?.displayName;
    }

    res.json(userInfo);
  } catch (error) {
    console.error('UserInfo error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Failed to get user information'
    });
  }
});

export default router;
