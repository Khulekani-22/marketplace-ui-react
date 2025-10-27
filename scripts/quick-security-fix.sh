#!/bin/bash
# Quick Security Fix Script
# This script helps automate some of the security remediation steps

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

WORKSPACE="/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
cd "$WORKSPACE"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Security Remediation Quick Script   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check if credentials are rotated
echo -e "${YELLOW}⚠️  STEP 1: Have you rotated your Firebase credentials?${NC}"
echo "   - Firebase Web API Key"
echo "   - Firebase Service Account Key"
echo ""
read -p "Have you rotated ALL credentials? (yes/no): " rotated

if [ "$rotated" != "yes" ]; then
    echo -e "${RED}❌ Please rotate credentials first!${NC}"
    echo "   See SECURITY_FIX_URGENT.md for instructions"
    exit 1
fi

echo -e "${GREEN}✓ Credentials rotated${NC}"
echo ""

# Step 2: Backup
echo -e "${YELLOW}📦 STEP 2: Creating backup...${NC}"
BACKUP_DIR="../marketplace-ui-react-backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"
echo ""

# Step 3: Get new API key
echo -e "${YELLOW}🔑 STEP 3: Enter your NEW Firebase Web API Key:${NC}"
read -p "API Key: " NEW_API_KEY

if [ -z "$NEW_API_KEY" ]; then
    echo -e "${RED}❌ API key cannot be empty${NC}"
    exit 1
fi

# Step 4: Update source files
echo -e "${YELLOW}📝 STEP 4: Updating source files...${NC}"

# Update src/firebase.js
if [ -f "src/firebase.js" ]; then
    echo "   Updating src/firebase.js..."
    sed -i '' "s/apiKey: \"AIza[0-9A-Za-z_-]*\"/apiKey: import.meta.env.VITE_FIREBASE_API_KEY/g" src/firebase.js
    echo -e "${GREEN}   ✓ src/firebase.js${NC}"
fi

# Update src/lib/firebase.ts
if [ -f "src/lib/firebase.ts" ]; then
    echo "   Updating src/lib/firebase.ts..."
    sed -i '' "s/apiKey: \"AIza[0-9A-Za-z_-]*\"/apiKey: import.meta.env.VITE_FIREBASE_API_KEY/g" src/lib/firebase.ts
    echo -e "${GREEN}   ✓ src/lib/firebase.ts${NC}"
fi

# Update scripts/get-firebase-token.py
if [ -f "scripts/get-firebase-token.py" ]; then
    echo "   Updating scripts/get-firebase-token.py..."
    cat > scripts/get-firebase-token.py << 'PYTHON_EOF'
#!/usr/bin/env python3
"""
Generate Firebase ID token for API testing
Usage: python3 scripts/get-firebase-token.py <email> <password>
"""

import sys
import json
import urllib.request
import urllib.error
import os

# Get API key from environment
API_KEY = os.environ.get('FIREBASE_API_KEY')
if not API_KEY:
    print("Error: FIREBASE_API_KEY environment variable not set")
    print("Usage: export FIREBASE_API_KEY='your_key' && python3 scripts/get-firebase-token.py <email> <password>")
    sys.exit(1)

AUTH_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"

def get_token(email, password):
    data = json.dumps({
        "email": email,
        "password": password,
        "returnSecureToken": True
    }).encode('utf-8')
    
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(AUTH_URL, data=data, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            return result.get('idToken')
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ Authentication failed: {error_body}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 scripts/get-firebase-token.py <email> <password>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    print(f"🔐 Authenticating {email}...")
    token = get_token(email, password)
    
    if token:
        print(f"\n✅ Firebase ID Token:\n{token}\n")
        print("💾 Token saved to .env.firebase-token")
        with open('.env.firebase-token', 'w') as f:
            f.write(f"FIREBASE_TOKEN={token}\n")
    else:
        print("❌ Failed to get token")
        sys.exit(1)
PYTHON_EOF
    echo -e "${GREEN}   ✓ scripts/get-firebase-token.py${NC}"
fi

# Update scripts/check-firebase-user.sh
if [ -f "scripts/check-firebase-user.sh" ]; then
    echo "   Updating scripts/check-firebase-user.sh..."
    sed -i '' 's/API_KEY="\${1:-AIza[^}]*}"/API_KEY="${1:-${FIREBASE_API_KEY}}"/g' scripts/check-firebase-user.sh
    echo -e "${GREEN}   ✓ scripts/check-firebase-user.sh${NC}"
fi

# Update test scripts
echo "   Updating test scripts..."
find . -name "*.mjs" -not -path "*/node_modules/*" -exec sed -i '' "s/const API_KEY = 'AIza[0-9A-Za-z_-]*'/const API_KEY = process.env.FIREBASE_API_KEY/g" {} \;
echo -e "${GREEN}   ✓ Test scripts updated${NC}"

echo ""

# Step 5: Create .env file
echo -e "${YELLOW}📄 STEP 5: Creating .env file...${NC}"
cat > .env << ENV_EOF
# Firebase Web API Configuration
VITE_FIREBASE_API_KEY=$NEW_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=sloane-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sloane-hub
VITE_FIREBASE_STORAGE_BUCKET=sloane-hub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=664957061898
VITE_FIREBASE_APP_ID=1:664957061898:web:71a4e19471132ef7ba88f3

# For scripts (same as web API key)
FIREBASE_API_KEY=$NEW_API_KEY

# Backend - Service Account (file-based - more secure)
# Place your new serviceAccountKey.json in the root directory
PORT=5055
NODE_ENV=development
ENV_EOF

echo -e "${GREEN}✓ .env file created${NC}"
echo ""

# Step 6: Delete old sensitive files
echo -e "${YELLOW}🗑️  STEP 6: Removing old sensitive files...${NC}"
rm -f backend/.env
rm -f .env.local
echo -e "${GREEN}✓ Old .env files removed${NC}"
echo ""

# Step 7: Verify .gitignore
echo -e "${YELLOW}📋 STEP 7: Verifying .gitignore...${NC}"
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
fi
if ! grep -q "^serviceAccountKey\.json$" .gitignore 2>/dev/null; then
    echo "serviceAccountKey.json" >> .gitignore
fi
echo -e "${GREEN}✓ .gitignore updated${NC}"
echo ""

# Step 8: Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Remediation Summary            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Source files updated to use environment variables${NC}"
echo -e "${GREEN}✅ New .env file created${NC}"
echo -e "${GREEN}✅ Old sensitive files removed${NC}"
echo -e "${GREEN}✅ .gitignore configured${NC}"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS (MANUAL):${NC}"
echo ""
echo "1. Download your NEW service account key JSON from:"
echo "   https://console.cloud.google.com/iam-admin/serviceaccounts?project=sloane-hub"
echo ""
echo "2. Place it in the root directory:"
echo "   cp ~/Downloads/sloane-hub-xxxxx.json $WORKSPACE/serviceAccountKey.json"
echo ""
echo "3. Clean Git history with BFG:"
echo "   brew install bfg"
echo "   bfg --delete-files serviceAccountKey.json"
echo "   bfg --delete-files .env"
echo "   git reflog expire --expire=now --all"
echo "   git gc --prune=now --aggressive"
echo ""
echo "4. Force push to GitHub (AFTER rotating credentials!):"
echo "   git push origin --force --all"
echo ""
echo "5. Test your application:"
echo "   npm run dev          # Frontend"
echo "   node backend/server.js  # Backend"
echo ""
echo -e "${BLUE}📚 For detailed instructions, see:${NC}"
echo "   - SECURITY_FIX_URGENT.md"
echo "   - SECURITY_REMEDIATION_CHECKLIST.md"
echo ""
echo -e "${GREEN}✨ Quick fix completed!${NC}"
