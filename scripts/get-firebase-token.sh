#!/bin/bash

# Get Firebase ID Token using REST API
# Usage: ./scripts/get-firebase-token.sh email@example.com password123

set -e

EMAIL="${1:-$FIREBASE_EMAIL}"
PASSWORD="${2:-$FIREBASE_PASSWORD}"
API_KEY="${FIREBASE_API_KEY}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "❌ Error: Email and password required"
  echo ""
  echo "Usage:"
  echo "  ./scripts/get-firebase-token.sh email@example.com password123"
  echo ""
  echo "Or set environment variables:"
  echo "  export FIREBASE_EMAIL=email@example.com"
  echo "  export FIREBASE_PASSWORD=password123"
  echo "  export FIREBASE_API_KEY=your_web_api_key"
  echo "  ./scripts/get-firebase-token.sh"
  exit 1
fi

if [ -z "$API_KEY" ]; then
  echo "⚠️  Warning: FIREBASE_API_KEY not set"
  echo "Get it from: Firebase Console → Project Settings → Web API Key"
  echo ""
  read -p "Enter Firebase Web API Key: " API_KEY
fi

echo "🔐 Signing in to Firebase..."
echo "📧 Email: $EMAIL"
echo ""

# Sign in with Firebase REST API
RESPONSE=$(curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"returnSecureToken\":true}")

# Check for errors
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Authentication failed:"
  echo "$RESPONSE" | jq -r '.error.message' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

# Extract token
ID_TOKEN=$(echo "$RESPONSE" | jq -r '.idToken')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refreshToken')
EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expiresIn')
USER_ID=$(echo "$RESPONSE" | jq -r '.localId')

if [ -z "$ID_TOKEN" ] || [ "$ID_TOKEN" = "null" ]; then
  echo "❌ Failed to get token"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Successfully authenticated!"
echo ""
echo "📋 User Info:"
echo "   Email: $EMAIL"
echo "   UID: $USER_ID"
echo "   Expires in: ${EXPIRES_IN}s (1 hour)"
echo ""
echo "🎫 Firebase ID Token:"
echo "────────────────────────────────────────────────────────────────────────────────"
echo "$ID_TOKEN"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "🔄 Refresh Token (save this for later):"
echo "$REFRESH_TOKEN"
echo ""
echo "📌 How to use in Postman:"
echo "1. Open your collection → Variables tab"
echo "2. Set firebase_token = [copy token above]"
echo "3. Test with any authenticated endpoint"
echo ""
echo "🔧 Quick test command:"
echo "curl -H \"Authorization: Bearer $ID_TOKEN\" http://localhost:5055/api/me | jq"
echo ""

# Optionally save to .env file
read -p "Save token to .env.firebase-token file? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cat > .env.firebase-token << EOF
# Firebase Authentication Token
# Generated: $(date)
# Expires in: 1 hour

FIREBASE_TOKEN=$ID_TOKEN
FIREBASE_REFRESH_TOKEN=$REFRESH_TOKEN
FIREBASE_USER_ID=$USER_ID
FIREBASE_EMAIL=$EMAIL
EOF
  echo "✅ Saved to .env.firebase-token"
  echo "   Source it with: source .env.firebase-token"
fi
