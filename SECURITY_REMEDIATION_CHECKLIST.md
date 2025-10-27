# 🔒 Security Remediation Checklist

## Current Status: ⚠️ CREDENTIALS EXPOSED

GitGuardian detected:
- ✗ Google API Key: `AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M`
- ✗ Firebase Private Keys in multiple locations
- ✗ Service Account Keys committed to Git

---

## 🚨 PHASE 1: IMMEDIATE ACTIONS (Within 1 Hour)

### Step 1.1: Rotate Firebase Web API Key
- [ ] Go to [Firebase Console](https://console.firebase.google.com/project/sloane-hub/settings/general)
- [ ] Navigate to Project Settings > General
- [ ] Under "Your apps" find the Web App
- [ ] Note current key: `AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M`
- [ ] **Option A**: Delete this key and create a new one
- [ ] **Option B**: Restrict the key (see Phase 3)
- [ ] Save the new key securely (password manager or .env file)
- [ ] Test the new key works before proceeding

### Step 1.2: Rotate Service Account Key
- [ ] Go to [GCP Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=sloane-hub)
- [ ] Find: `firebase-adminsdk-w5lfs@sloane-hub.iam.gserviceaccount.com`
- [ ] Click on service account → "Keys" tab
- [ ] **Delete ALL existing keys** (including the exposed one)
- [ ] Click "Add Key" → "Create new key" → JSON format
- [ ] Download and save securely (outside Git repo)
- [ ] Update your backend configuration

**✅ Checkpoint**: New credentials generated and tested

---

## 🧹 PHASE 2: CLEAN GIT HISTORY (Within 2 Hours)

### Step 2.1: Install BFG Repo-Cleaner
```bash
# macOS
brew install bfg

# Verify installation
bfg --version
```

### Step 2.2: Backup Your Repository
```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub"
cp -r "marketplace-ui-react" "marketplace-ui-react-backup-$(date +%Y%m%d)"
cd "marketplace-ui-react"
```

- [ ] Backup created
- [ ] Backup location: `________________________`

### Step 2.3: Remove Sensitive Files from History
```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Remove service account keys from ALL commits
bfg --delete-files serviceAccountKey.json

# Remove .env files from ALL commits
bfg --delete-files .env

# Remove any other sensitive files
bfg --delete-files "*.pem"
bfg --delete-files "*.key"

# Clean up Git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

- [ ] BFG commands executed
- [ ] Git cleanup completed
- [ ] No errors in output

### Step 2.4: Force Push (DESTRUCTIVE - Point of No Return)
```bash
# THIS REWRITES HISTORY - MAKE SURE CREDENTIALS ARE ROTATED FIRST!
git push origin --force --all
git push origin --force --tags
```

- [ ] Force push completed
- [ ] Team members notified to re-clone (if applicable)

**⚠️ WARNING**: After force push, all team members must delete their local repos and re-clone!

**✅ Checkpoint**: Git history cleaned

---

## 🔧 PHASE 3: UPDATE CODEBASE (Within 3 Hours)

### Step 3.1: Update Frontend Files

#### File: `src/firebase.js`
```javascript
// BEFORE (line 8):
apiKey: "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M",

// AFTER:
apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
```

- [ ] Updated `src/firebase.js`
- [ ] Tested frontend still works

#### File: `src/lib/firebase.ts`
```typescript
// BEFORE (line 6):
apiKey: "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M",

// AFTER:
apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
```

- [ ] Updated `src/lib/firebase.ts`
- [ ] Tested TypeScript builds

#### File: `src/components/NotificationLayer.tsx`
```typescript
// BEFORE (line 54):
defaultValue='AIzaSyDg1xBSwmHKV0usIKxTFL5a6fFTb4s3XVM'

// AFTER:
defaultValue={import.meta.env.VITE_FIREBASE_API_KEY || ''}
```

- [ ] Updated `src/components/NotificationLayer.tsx`

### Step 3.2: Update Backend Files

#### File: `backend/services/firestore.js`
Already uses file loading - just verify it's NOT using hardcoded credentials:
```javascript
// Should be using:
const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');
// OR environment variables
```

- [ ] Verified backend loads from file or env vars
- [ ] Confirmed serviceAccountKey.json is in .gitignore
- [ ] Placed new serviceAccountKey.json (with rotated key) in correct location

### Step 3.3: Update Scripts

#### File: `scripts/get-firebase-token.py`
```python
# BEFORE (line 14):
API_KEY = "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M"

# AFTER:
import os
API_KEY = os.environ.get('FIREBASE_API_KEY')
if not API_KEY:
    raise ValueError("FIREBASE_API_KEY environment variable not set")
```

- [ ] Updated `scripts/get-firebase-token.py`
- [ ] Tested script with: `export FIREBASE_API_KEY="your_new_key" && python3 scripts/get-firebase-token.py`

#### File: `scripts/check-firebase-user.sh`
```bash
# BEFORE (line 9):
API_KEY="${1:-AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M}"

# AFTER:
API_KEY="${1:-${FIREBASE_API_KEY}}"
if [ -z "$API_KEY" ]; then
  echo "Error: FIREBASE_API_KEY not set"
  exit 1
fi
```

- [ ] Updated `scripts/check-firebase-user.sh`

#### File: `scripts/test-wallet-grant.mjs`
```javascript
// BEFORE (line 4):
const API_KEY = 'AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M';

// AFTER:
const API_KEY = process.env.FIREBASE_API_KEY;
if (!API_KEY) {
  throw new Error('FIREBASE_API_KEY environment variable not set');
}
```

- [ ] Updated `scripts/test-wallet-grant.mjs`

#### File: `test-mine-endpoint.mjs`
```javascript
// BEFORE (line 28):
const apiKey = 'AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M';

// AFTER:
const apiKey = process.env.FIREBASE_API_KEY;
if (!apiKey) {
  throw new Error('FIREBASE_API_KEY environment variable not set');
}
```

- [ ] Updated `test-mine-endpoint.mjs`

### Step 3.4: Update Documentation Files

#### File: `FIREBASE_AUTH_TROUBLESHOOTING.md`
Replace ALL instances of `AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M` with:
```
YOUR_FIREBASE_API_KEY
```

- [ ] Updated `FIREBASE_AUTH_TROUBLESHOOTING.md`
- [ ] Verified no real keys remain in documentation

### Step 3.5: Delete Sensitive Files
```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Delete .env files (they're now in .gitignore)
rm -f backend/.env
rm -f .env
rm -f .env.local

# Delete old service account keys
rm -f api/serviceAccountKey.json
rm -f backend/serviceAccountKey.json
```

- [ ] Deleted all local .env files
- [ ] Deleted old service account keys
- [ ] Files are in .gitignore

### Step 3.6: Create New .env Files (NOT COMMITTED)
```bash
# Create new .env from example
cp .env.example .env

# Edit with your NEW credentials
nano .env
```

Your `.env` should contain:
```env
VITE_FIREBASE_API_KEY=YOUR_NEW_API_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=sloane-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sloane-hub
VITE_FIREBASE_STORAGE_BUCKET=sloane-hub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=664957061898
VITE_FIREBASE_APP_ID=1:664957061898:web:71a4e19471132ef7ba88f3

# Backend config
FIREBASE_PROJECT_ID=sloane-hub
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-w5lfs@sloane-hub.iam.gserviceaccount.com
PORT=5055
```

- [ ] Created new `.env` with new credentials
- [ ] Verified `.env` is NOT tracked by Git: `git status` should not show it

### Step 3.7: Place New Service Account Key
```bash
# Place the NEW downloaded service account JSON in:
cp ~/Downloads/sloane-hub-xxxxx.json \
   "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react/serviceAccountKey.json"

# Verify it's gitignored
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
git status | grep serviceAccountKey
# Should output nothing (file is ignored)
```

- [ ] New service account key placed in correct location
- [ ] Verified it's gitignored

**✅ Checkpoint**: All code updated to use environment variables

---

## 🧪 PHASE 4: TESTING (Within 4 Hours)

### Step 4.1: Test Frontend
```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
npm run dev
```

- [ ] Frontend starts without errors
- [ ] Firebase authentication works
- [ ] Can sign in/sign up
- [ ] No console errors about missing API keys

### Step 4.2: Test Backend
```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
node backend/server.js
```

- [ ] Backend starts without errors
- [ ] Connects to Firestore successfully
- [ ] Health endpoints work: `curl http://localhost:5055/health/live`
- [ ] Authentication works

### Step 4.3: Test Scripts
```bash
# Export new API key
export FIREBASE_API_KEY="your_new_api_key"

# Test Python script
python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com '#sloane@22gEn'

# Test other scripts
node scripts/test-wallet-grant.mjs
```

- [ ] All scripts work with environment variables
- [ ] No hardcoded credentials needed

**✅ Checkpoint**: Application fully functional with new credentials

---

## 🛡️ PHASE 5: ADDITIONAL SECURITY (Within 24 Hours)

### Step 5.1: Restrict Firebase API Key
1. Go to [GCP Console > Credentials](https://console.cloud.google.com/apis/credentials?project=sloane-hub)
2. Find your NEW Web API Key
3. Click Edit
4. **Application restrictions**:
   - [ ] Select "HTTP referrers (web sites)"
   - [ ] Add: `https://yourdomain.com/*`
   - [ ] Add: `https://*.vercel.app/*` (if using Vercel)
   - [ ] Add: `http://localhost:*` (for development)
5. **API restrictions**:
   - [ ] Select "Restrict key"
   - [ ] Enable only: Identity Toolkit API, Cloud Firestore API
6. Click "Save"

- [ ] API key restricted to specific domains
- [ ] API key restricted to specific APIs
- [ ] Tested that restrictions work

### Step 5.2: Enable Firebase App Check
1. Go to [Firebase Console > App Check](https://console.firebase.google.com/project/sloane-hub/appcheck)
2. Click "Get started"
3. Register your web app
4. Choose reCAPTCHA v3 or hCaptcha
5. Enable enforcement for:
   - [ ] Cloud Firestore
   - [ ] Authentication
6. Test with debug tokens in development

- [ ] App Check enabled
- [ ] reCAPTCHA configured
- [ ] Enforcement enabled for Firestore
- [ ] Debug tokens created for local development

### Step 5.3: Enable GitHub Security Features
1. Go to GitHub repo: Settings > Security
2. Enable:
   - [ ] Secret scanning
   - [ ] Push protection
   - [ ] Dependabot alerts
   - [ ] Dependabot security updates

### Step 5.4: Set Up Git Hooks (Prevent Future Leaks)
```bash
# Install git-secrets
brew install git-secrets

# Set up in your repo
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
git secrets --install
git secrets --register-aws

# Add Firebase patterns
git secrets --add 'AIza[0-9A-Za-z_-]{35}'
git secrets --add '-----BEGIN PRIVATE KEY-----'

# Scan existing files
git secrets --scan
```

- [ ] git-secrets installed
- [ ] Patterns registered
- [ ] Pre-commit hooks active

**✅ Checkpoint**: Additional security measures in place

---

## 📋 FINAL VERIFICATION

### Verify No Credentials in Git
```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Scan for API keys
./scripts/scan-credentials.sh

# Check what's tracked
git ls-files | grep -E '(\.env|serviceAccountKey)'
# Should return nothing
```

- [ ] No hardcoded credentials found
- [ ] No .env files tracked in Git
- [ ] No serviceAccountKey.json files tracked in Git

### Verify Application Works
- [ ] Frontend authentication works
- [ ] Backend API works
- [ ] Firestore operations work
- [ ] All scripts work
- [ ] No errors in console/logs

### Verify Security Measures
- [ ] Old credentials are rotated and deleted
- [ ] New credentials are in .env files (not committed)
- [ ] API key is restricted in Google Cloud Console
- [ ] App Check is enabled (optional but recommended)
- [ ] Git hooks prevent future leaks
- [ ] GitHub secret scanning is enabled

---

## 📝 Post-Remediation Actions

### Step 1: Commit Clean Code
```bash
git add .
git commit -m "security: Remove hardcoded credentials, use environment variables"
git push origin main
```

- [ ] Changes committed
- [ ] Pushed to GitHub
- [ ] No sensitive data in commit

### Step 2: Update Vercel/Production Environment Variables
If using Vercel or other hosting:
1. Go to your project settings
2. Add environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
3. Redeploy

- [ ] Production environment variables updated
- [ ] Production deployment tested

### Step 3: Document for Team
- [ ] Share this checklist with team
- [ ] Document new credential management process
- [ ] Train team on security best practices

### Step 4: Monitor
- [ ] Check GitGuardian dashboard for all-clear
- [ ] Monitor Firebase usage for anomalies
- [ ] Set up alerts for suspicious activity

---

## 🎉 COMPLETION

- [ ] All phases completed
- [ ] Application works with new credentials
- [ ] No credentials in Git history
- [ ] Additional security measures in place
- [ ] Team notified and trained

**Time to complete**: ____________
**Completed by**: ____________
**Date**: ____________

---

## 🆘 Emergency Contacts

- **Firebase Support**: https://firebase.google.com/support
- **Google Cloud Support**: https://cloud.google.com/support
- **GitGuardian**: https://www.gitguardian.com/
- **GitHub Security**: security@github.com

---

## 📚 References

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/security)
- [Google Cloud Key Management](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
