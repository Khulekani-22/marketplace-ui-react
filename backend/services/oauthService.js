import crypto from 'crypto';
import { db } from '../config/firebase.js';

/**
 * OAuth 2.0 Service
 * Handles OAuth client registration, authorization codes, and access tokens
 */

// Supported OAuth 2.0 grant types
export const GRANT_TYPES = {
  AUTHORIZATION_CODE: 'authorization_code',
  REFRESH_TOKEN: 'refresh_token',
  CLIENT_CREDENTIALS: 'client_credentials'
};

// Token expiration times (in seconds)
export const TOKEN_EXPIRY = {
  AUTHORIZATION_CODE: 600, // 10 minutes
  ACCESS_TOKEN: 3600, // 1 hour
  REFRESH_TOKEN: 2592000 // 30 days
};

// OAuth scopes with descriptions
export const SCOPES = {
  'read:services': 'View services and listings',
  'write:services': 'Create and update services',
  'delete:services': 'Delete services',
  'read:vendors': 'View vendor profiles',
  'write:vendors': 'Update vendor profiles',
  'read:subscriptions': 'View subscription information',
  'write:subscriptions': 'Create and manage subscriptions',
  'read:messages': 'View messages',
  'write:messages': 'Send messages',
  'read:wallet': 'View wallet balance and transactions',
  'write:wallet': 'Perform wallet operations',
  'read:users': 'View user profile information',
  'write:users': 'Update user profile',
  'admin:all': 'Full administrative access'
};

/**
 * Generate a secure random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a secret for storage
 */
function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Register a new OAuth client
 */
export async function registerOAuthClient(userId, clientData) {
  const {
    name,
    description,
    redirectUris,
    grantTypes = [GRANT_TYPES.AUTHORIZATION_CODE],
    scopes = []
  } = clientData;

  // Validate required fields
  if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
    throw new Error('Name and at least one redirect URI are required');
  }

  // Validate grant types
  const invalidGrantTypes = grantTypes.filter(gt => !Object.values(GRANT_TYPES).includes(gt));
  if (invalidGrantTypes.length > 0) {
    throw new Error(`Invalid grant types: ${invalidGrantTypes.join(', ')}`);
  }

  // Validate scopes
  const invalidScopes = scopes.filter(scope => !SCOPES[scope]);
  if (invalidScopes.length > 0) {
    throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
  }

  // Generate client ID and secret
  const clientId = `oauth_${generateToken(16)}`;
  const clientSecret = generateToken(32);
  const clientSecretHash = hashSecret(clientSecret);

  const client = {
    clientId,
    clientSecretHash,
    name,
    description: description || '',
    userId,
    redirectUris,
    grantTypes,
    scopes,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store in Firestore
  await db.collection('oauthClients').doc(clientId).set(client);

  // Return client with unhashed secret (only time it's visible)
  return {
    ...client,
    clientSecret, // Return plain secret only on creation
    clientSecretHash: undefined // Don't expose hash
  };
}

/**
 * Get OAuth client by client ID
 */
export async function getOAuthClient(clientId) {
  const doc = await db.collection('oauthClients').doc(clientId).get();
  
  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, ...doc.data() };
}

/**
 * Verify client credentials
 */
export async function verifyClientCredentials(clientId, clientSecret) {
  const client = await getOAuthClient(clientId);
  
  if (!client || !client.active) {
    return null;
  }

  const secretHash = hashSecret(clientSecret);
  if (secretHash !== client.clientSecretHash) {
    return null;
  }

  return client;
}

/**
 * Generate authorization code
 */
export async function generateAuthorizationCode(clientId, userId, redirectUri, scopes, codeChallenge = null) {
  const client = await getOAuthClient(clientId);
  
  if (!client || !client.active) {
    throw new Error('Invalid or inactive client');
  }

  // Verify redirect URI is registered
  if (!client.redirectUris.includes(redirectUri)) {
    throw new Error('Invalid redirect URI');
  }

  // Verify scopes are allowed for this client
  const invalidScopes = scopes.filter(scope => !client.scopes.includes(scope));
  if (invalidScopes.length > 0) {
    throw new Error(`Client not authorized for scopes: ${invalidScopes.join(', ')}`);
  }

  const code = generateToken(32);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.AUTHORIZATION_CODE * 1000).toISOString();

  const authCode = {
    code,
    clientId,
    userId,
    redirectUri,
    scopes,
    codeChallenge, // For PKCE
    used: false,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  await db.collection('oauthAuthorizationCodes').doc(code).set(authCode);

  return code;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeAuthorizationCode(code, clientId, clientSecret, redirectUri, codeVerifier = null) {
  // Verify client credentials
  const client = await verifyClientCredentials(clientId, clientSecret);
  if (!client) {
    throw new Error('Invalid client credentials');
  }

  // Get authorization code
  const codeDoc = await db.collection('oauthAuthorizationCodes').doc(code).get();
  
  if (!codeDoc.exists) {
    throw new Error('Invalid authorization code');
  }

  const authCode = codeDoc.data();

  // Verify code hasn't been used
  if (authCode.used) {
    throw new Error('Authorization code already used');
  }

  // Verify code hasn't expired
  if (new Date(authCode.expiresAt) < new Date()) {
    throw new Error('Authorization code expired');
  }

  // Verify client ID matches
  if (authCode.clientId !== clientId) {
    throw new Error('Client ID mismatch');
  }

  // Verify redirect URI matches
  if (authCode.redirectUri !== redirectUri) {
    throw new Error('Redirect URI mismatch');
  }

  // Verify PKCE code verifier if code challenge was provided
  if (authCode.codeChallenge) {
    if (!codeVerifier) {
      throw new Error('Code verifier required');
    }

    const verifierHash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    if (verifierHash !== authCode.codeChallenge) {
      throw new Error('Invalid code verifier');
    }
  }

  // Mark code as used
  await db.collection('oauthAuthorizationCodes').doc(code).update({
    used: true,
    usedAt: new Date().toISOString()
  });

  // Generate access token and refresh token
  const accessToken = generateToken(32);
  const refreshToken = generateToken(32);
  const accessTokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.ACCESS_TOKEN * 1000).toISOString();
  const refreshTokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN * 1000).toISOString();

  const tokenData = {
    accessToken,
    refreshToken,
    clientId,
    userId: authCode.userId,
    scopes: authCode.scopes,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    createdAt: new Date().toISOString(),
    revoked: false
  };

  await db.collection('oauthTokens').doc(accessToken).set(tokenData);

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: TOKEN_EXPIRY.ACCESS_TOKEN,
    refresh_token: refreshToken,
    scope: authCode.scopes.join(' ')
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  // Verify client credentials
  const client = await verifyClientCredentials(clientId, clientSecret);
  if (!client) {
    throw new Error('Invalid client credentials');
  }

  // Find token by refresh token
  const tokensSnapshot = await db.collection('oauthTokens')
    .where('refreshToken', '==', refreshToken)
    .where('clientId', '==', clientId)
    .where('revoked', '==', false)
    .limit(1)
    .get();

  if (tokensSnapshot.empty) {
    throw new Error('Invalid refresh token');
  }

  const oldTokenDoc = tokensSnapshot.docs[0];
  const oldToken = oldTokenDoc.data();

  // Verify refresh token hasn't expired
  if (new Date(oldToken.refreshTokenExpiresAt) < new Date()) {
    throw new Error('Refresh token expired');
  }

  // Generate new access token
  const newAccessToken = generateToken(32);
  const newRefreshToken = generateToken(32);
  const accessTokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.ACCESS_TOKEN * 1000).toISOString();
  const refreshTokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN * 1000).toISOString();

  const newTokenData = {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    clientId,
    userId: oldToken.userId,
    scopes: oldToken.scopes,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    createdAt: new Date().toISOString(),
    revoked: false
  };

  // Revoke old token
  await db.collection('oauthTokens').doc(oldTokenDoc.id).update({
    revoked: true,
    revokedAt: new Date().toISOString()
  });

  // Store new token
  await db.collection('oauthTokens').doc(newAccessToken).set(newTokenData);

  return {
    access_token: newAccessToken,
    token_type: 'Bearer',
    expires_in: TOKEN_EXPIRY.ACCESS_TOKEN,
    refresh_token: newRefreshToken,
    scope: oldToken.scopes.join(' ')
  };
}

/**
 * Validate OAuth access token
 */
export async function validateAccessToken(accessToken) {
  const tokenDoc = await db.collection('oauthTokens').doc(accessToken).get();
  
  if (!tokenDoc.exists) {
    return null;
  }

  const token = tokenDoc.data();

  // Check if revoked
  if (token.revoked) {
    return null;
  }

  // Check if expired
  if (new Date(token.accessTokenExpiresAt) < new Date()) {
    return null;
  }

  return {
    userId: token.userId,
    clientId: token.clientId,
    scopes: token.scopes
  };
}

/**
 * Revoke OAuth token
 */
export async function revokeToken(token, tokenTypeHint = 'access_token') {
  let query;

  if (tokenTypeHint === 'refresh_token') {
    query = db.collection('oauthTokens')
      .where('refreshToken', '==', token)
      .limit(1);
  } else {
    query = db.collection('oauthTokens')
      .where('accessToken', '==', token)
      .limit(1);
  }

  const snapshot = await query.get();

  if (!snapshot.empty) {
    const tokenDoc = snapshot.docs[0];
    await tokenDoc.ref.update({
      revoked: true,
      revokedAt: new Date().toISOString()
    });
  }

  return true;
}

/**
 * Generate client credentials token (machine-to-machine)
 */
export async function generateClientCredentialsToken(clientId, clientSecret, scopes) {
  // Verify client credentials
  const client = await verifyClientCredentials(clientId, clientSecret);
  if (!client) {
    throw new Error('Invalid client credentials');
  }

  // Verify client supports client_credentials grant
  if (!client.grantTypes.includes(GRANT_TYPES.CLIENT_CREDENTIALS)) {
    throw new Error('Client not authorized for client_credentials grant');
  }

  // Verify scopes
  const invalidScopes = scopes.filter(scope => !client.scopes.includes(scope));
  if (invalidScopes.length > 0) {
    throw new Error(`Client not authorized for scopes: ${invalidScopes.join(', ')}`);
  }

  const accessToken = generateToken(32);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.ACCESS_TOKEN * 1000).toISOString();

  const tokenData = {
    accessToken,
    clientId,
    userId: null, // No user context for client credentials
    scopes,
    accessTokenExpiresAt: expiresAt,
    createdAt: new Date().toISOString(),
    revoked: false
  };

  await db.collection('oauthTokens').doc(accessToken).set(tokenData);

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: TOKEN_EXPIRY.ACCESS_TOKEN,
    scope: scopes.join(' ')
  };
}

/**
 * List OAuth clients for a user
 */
export async function listUserOAuthClients(userId) {
  const snapshot = await db.collection('oauthClients')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    // Don't expose client secret hash
    delete data.clientSecretHash;
    return { id: doc.id, ...data };
  });
}

/**
 * Delete OAuth client
 */
export async function deleteOAuthClient(clientId, userId) {
  const client = await getOAuthClient(clientId);
  
  if (!client) {
    throw new Error('Client not found');
  }

  if (client.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Revoke all tokens for this client
  const tokensSnapshot = await db.collection('oauthTokens')
    .where('clientId', '==', clientId)
    .get();

  const batch = db.batch();
  tokensSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      revoked: true,
      revokedAt: new Date().toISOString()
    });
  });

  // Delete client
  batch.delete(db.collection('oauthClients').doc(clientId));

  await batch.commit();

  return true;
}

/**
 * Update OAuth client
 */
export async function updateOAuthClient(clientId, userId, updates) {
  const client = await getOAuthClient(clientId);
  
  if (!client) {
    throw new Error('Client not found');
  }

  if (client.userId !== userId) {
    throw new Error('Unauthorized');
  }

  const allowedUpdates = {
    name: updates.name,
    description: updates.description,
    redirectUris: updates.redirectUris,
    scopes: updates.scopes,
    updatedAt: new Date().toISOString()
  };

  // Remove undefined values
  Object.keys(allowedUpdates).forEach(key => {
    if (allowedUpdates[key] === undefined) {
      delete allowedUpdates[key];
    }
  });

  await db.collection('oauthClients').doc(clientId).update(allowedUpdates);

  return getOAuthClient(clientId);
}

/**
 * Check if user has granted scopes to client
 */
export async function hasUserGrantedScopes(userId, clientId, requestedScopes) {
  const consentSnapshot = await db.collection('oauthConsents')
    .where('userId', '==', userId)
    .where('clientId', '==', clientId)
    .limit(1)
    .get();

  if (consentSnapshot.empty) {
    return false;
  }

  const consent = consentSnapshot.docs[0].data();
  
  // Check if all requested scopes are granted
  return requestedScopes.every(scope => consent.scopes.includes(scope));
}

/**
 * Save user consent
 */
export async function saveUserConsent(userId, clientId, scopes) {
  const consentId = `${userId}_${clientId}`;
  
  await db.collection('oauthConsents').doc(consentId).set({
    userId,
    clientId,
    scopes,
    grantedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return true;
}

/**
 * Revoke user consent
 */
export async function revokeUserConsent(userId, clientId) {
  const consentId = `${userId}_${clientId}`;
  
  await db.collection('oauthConsents').doc(consentId).delete();

  // Revoke all tokens for this user-client combination
  const tokensSnapshot = await db.collection('oauthTokens')
    .where('userId', '==', userId)
    .where('clientId', '==', clientId)
    .get();

  const batch = db.batch();
  tokensSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      revoked: true,
      revokedAt: new Date().toISOString()
    });
  });

  await batch.commit();

  return true;
}
