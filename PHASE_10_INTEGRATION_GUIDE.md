# Phase 10: OAuth 2.0 Integration Steps

## ✅ Completed

1. **Backend Implementation** - Complete OAuth 2.0 server
   - OAuth service (500+ lines)
   - OAuth middleware (200 lines)
   - OAuth routes (600+ lines, 13 endpoints)

2. **Frontend Implementation** - User interfaces
   - OAuth consent screen
   - OAuth clients manager

3. **React Integration** - Routes and navigation
   - Added `/oauth/authorize` route to App.jsx
   - Added OAuth Clients Manager tab to Developer Portal

4. **Database Schema** - Firestore indexes defined
   - 4 composite indexes in firestore.indexes.json

## 🔧 Manual Setup Required

### Step 1: Initialize Firebase Project

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/firebase\ sloane\ hub/ui/marketplace-ui-react

# Login to Firebase (if not already)
firebase login

# List your projects
firebase projects:list

# Initialize or select your project
firebase use <your-project-id>

# Or use interactive setup
firebase use --add
```

### Step 2: Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

This will deploy the 4 OAuth indexes:
- `oauthClients` index (userId + createdAt)
- `oauthTokens` index for refresh token lookup
- `oauthTokens` index for user-client queries
- `oauthConsents` index (userId + clientId)

### Step 3: Test OAuth Flow

#### 3.1 Register a Test Client

1. Navigate to Developer Portal: `http://localhost:5173/dashboard` (or your dev URL)
2. Click "OAuth Clients" tab
3. Click "Register New Client"
4. Fill in:
   - Name: "Test App"
   - Description: "Testing OAuth flow"
   - Redirect URI: `http://localhost:3000/callback` (or your test callback URL)
   - Select scopes: `read:services`, `write:services`
5. Click "Register"
6. **IMPORTANT**: Copy the Client ID and Client Secret (secret shown only once!)

#### 3.2 Test Authorization Request

Build the authorization URL:
```
http://localhost:5173/oauth/authorize?
  client_id=<YOUR_CLIENT_ID>&
  redirect_uri=http://localhost:3000/callback&
  response_type=code&
  scope=read:services%20write:services&
  state=random_state_123
```

Visit this URL in your browser. You should see:
- Beautiful consent screen with gradient design
- App name and description
- List of requested scopes with descriptions
- Approve/Deny buttons

#### 3.3 Test Authorization Code Exchange

After clicking "Approve", you'll be redirected to:
```
http://localhost:3000/callback?code=<AUTHORIZATION_CODE>&state=random_state_123
```

Exchange the code for tokens:
```bash
curl -X POST http://localhost:5055/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "<AUTHORIZATION_CODE>",
    "redirect_uri": "http://localhost:3000/callback",
    "client_id": "<YOUR_CLIENT_ID>",
    "client_secret": "<YOUR_CLIENT_SECRET>"
  }'
```

Expected response:
```json
{
  "access_token": "token_abc123...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_xyz789...",
  "scope": "read:services write:services"
}
```

#### 3.4 Test API Call with OAuth Token

```bash
curl http://localhost:5055/api/data/services \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Should return services data if you have the correct scope.

#### 3.5 Test Token Refresh

```bash
curl -X POST http://localhost:5055/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "<REFRESH_TOKEN>",
    "client_id": "<YOUR_CLIENT_ID>",
    "client_secret": "<YOUR_CLIENT_SECRET>"
  }'
```

Should return new access_token and refresh_token.

#### 3.6 Test PKCE Flow (Enhanced Security)

1. Generate code verifier and challenge (in Node.js):
```javascript
const crypto = require('crypto');
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

console.log('Code Verifier:', codeVerifier);
console.log('Code Challenge:', codeChallenge);
```

2. Authorization request with PKCE:
```
http://localhost:5173/oauth/authorize?
  client_id=<YOUR_CLIENT_ID>&
  redirect_uri=http://localhost:3000/callback&
  response_type=code&
  scope=read:services&
  code_challenge=<CODE_CHALLENGE>&
  code_challenge_method=S256&
  state=random_state_123
```

3. Token exchange with code verifier:
```bash
curl -X POST http://localhost:5055/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "<AUTHORIZATION_CODE>",
    "redirect_uri": "http://localhost:3000/callback",
    "client_id": "<YOUR_CLIENT_ID>",
    "client_secret": "<YOUR_CLIENT_SECRET>",
    "code_verifier": "<CODE_VERIFIER>"
  }'
```

#### 3.7 Test Client Credentials Flow

For machine-to-machine authentication:
```bash
curl -X POST http://localhost:5055/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "<YOUR_CLIENT_ID>",
    "client_secret": "<YOUR_CLIENT_SECRET>",
    "scope": "read:services"
  }'
```

Returns access token without user context (no userId in token).

## 📊 Verification Checklist

- [ ] Firebase project initialized
- [ ] Firestore indexes deployed successfully
- [ ] Can access Developer Portal at `/dashboard`
- [ ] Can see "OAuth Clients" tab in portal
- [ ] Can register new OAuth client
- [ ] Client secret displayed once after creation
- [ ] Can navigate to `/oauth/authorize` consent screen
- [ ] Consent screen shows correct client info
- [ ] Can approve authorization
- [ ] Redirect contains authorization code
- [ ] Can exchange code for tokens
- [ ] Can make API call with access token
- [ ] Can refresh access token
- [ ] PKCE validation works correctly
- [ ] Client credentials flow works
- [ ] Scope enforcement working (403 if insufficient)
- [ ] Token expiry enforced (401 after 1 hour)
- [ ] Can revoke tokens
- [ ] Can delete OAuth client

## 🔐 Security Notes

### Client Secret Storage
- Client secrets are shown **ONLY ONCE** after registration
- Stored as SHA-256 hash in database
- Never displayed again after initial creation
- Users must save secrets securely

### Token Security
- Access tokens expire in 1 hour
- Refresh tokens expire in 30 days
- Authorization codes expire in 10 minutes
- Codes are single-use only
- PKCE recommended for mobile/SPA apps

### PKCE (Proof Key for Code Exchange)
- Prevents authorization code interception
- Uses SHA-256 hashing
- Mandatory for public clients
- Code challenge sent in authorization request
- Code verifier sent in token exchange
- Server validates verifier hashes to challenge

### Scope Enforcement
- All protected endpoints check scopes
- `admin:all` scope grants all permissions
- 403 Forbidden if insufficient permissions
- Scopes clearly displayed in consent screen

## 🚀 Integration Examples

### JavaScript/TypeScript Client

```javascript
// 1. Redirect to authorization
const authUrl = new URL('http://localhost:5173/oauth/authorize');
authUrl.searchParams.append('client_id', CLIENT_ID);
authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('scope', 'read:services write:services');
authUrl.searchParams.append('state', generateRandomState());

window.location.href = authUrl.toString();

// 2. Handle callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Verify state matches to prevent CSRF
if (state !== savedState) {
  throw new Error('State mismatch');
}

// 3. Exchange code for token (server-side)
const response = await fetch('http://localhost:5055/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  })
});

const { access_token, refresh_token } = await response.json();

// 4. Make API calls
const apiResponse = await fetch('http://localhost:5055/api/data/services', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const data = await apiResponse.json();
```

### Python Client

```python
import requests
import secrets
import hashlib
import base64

# 1. Generate PKCE parameters
code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode('utf-8')).digest()
).decode('utf-8').rstrip('=')

# 2. Build authorization URL
auth_url = (
    f"http://localhost:5173/oauth/authorize?"
    f"client_id={CLIENT_ID}&"
    f"redirect_uri={REDIRECT_URI}&"
    f"response_type=code&"
    f"scope=read:services write:services&"
    f"code_challenge={code_challenge}&"
    f"code_challenge_method=S256&"
    f"state={random_state}"
)

print(f"Visit: {auth_url}")

# 3. After redirect, exchange code
code = input("Enter authorization code: ")

token_response = requests.post('http://localhost:5055/api/oauth/token', json={
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': REDIRECT_URI,
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'code_verifier': code_verifier
})

tokens = token_response.json()
access_token = tokens['access_token']

# 4. Make API call
api_response = requests.get(
    'http://localhost:5055/api/data/services',
    headers={'Authorization': f'Bearer {access_token}'}
)

data = api_response.json()
print(data)
```

## 📝 API Documentation Update Needed

Add OAuth 2.0 section to API documentation:

1. **Update OpenAPI Spec** (`api-documentation.json`)
   - Add OAuth 2.0 security scheme
   - Document 13 OAuth endpoints
   - Include scope definitions
   - Add example requests/responses

2. **Update Postman Collection** (`postman_collection.json`)
   - Add OAuth 2.0 folder
   - Include all 13 endpoints
   - Add example authorization flow
   - Document PKCE parameters

3. **Update Developer Guide**
   - Add OAuth 2.0 integration tutorial
   - Include code examples for multiple languages
   - Document best practices
   - Add troubleshooting section

## 🎉 Phase 10 Complete!

OAuth 2.0 Support is now fully implemented with:
- ✅ Complete authorization server
- ✅ 3 grant types (authorization_code, refresh_token, client_credentials)
- ✅ PKCE support for enhanced security
- ✅ 13 granular permission scopes
- ✅ Beautiful consent UI
- ✅ Client management portal
- ✅ Token lifecycle management
- ✅ OpenID Connect userinfo endpoint

**Next**: Phase 11 - GraphQL API Layer 🚀
