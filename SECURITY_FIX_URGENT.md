# 🚨 URGENT: Security Fix Required - Exposed Credentials

## ⚠️ CRITICAL: Credentials Exposed on GitHub

GitGuardian has detected the following sensitive credentials in your repository:
1. **Google API Key**: `AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M`
2. **High Entropy Secrets**: Firebase private keys and service account keys

## 🔴 Immediate Actions Required (DO THIS NOW)

### Step 1: Rotate All Exposed Credentials Immediately

#### A. Rotate Firebase Web API Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sloane-hub`
3. Go to **Project Settings** > **General**
4. Under **Your apps** > **Web API Key**
5. Click **Regenerate API Key** or **Delete** the exposed key
6. Create a new Web API Key
7. Update your applications with the new key

#### B. Rotate Service Account Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `sloane-hub`
3. Go to **IAM & Admin** > **Service Accounts**
4. Find: `firebase-adminsdk-w5lfs@sloane-hub.iam.gserviceaccount.com`
5. Click on the service account
6. Go to **Keys** tab
7. Delete ALL existing keys
8. Click **Add Key** > **Create New Key** > **JSON**
9. Download the new key and store it securely
10. Update your backend with the new key

### Step 2: Remove Sensitive Files from Git History

The exposed credentials are in your Git history and need to be completely removed:

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"

# Install BFG Repo-Cleaner (faster than git filter-branch)
brew install bfg

# Backup your repo first!
cd ..
cp -r "marketplace-ui-react" "marketplace-ui-react-backup"
cd "marketplace-ui-react"

# Remove sensitive files from ALL history
bfg --delete-files serviceAccountKey.json
bfg --delete-files .env
bfg --delete-files backend/.env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (THIS WILL REWRITE HISTORY)
git push origin --force --all
git push origin --force --tags
```

⚠️ **WARNING**: This rewrites Git history. Notify all team members to re-clone the repository!

### Step 3: Add Files to .gitignore (Already Done, But Verify)

Verify these are in your `.gitignore`:

```bash
# Check if properly ignored
cat .gitignore | grep -E "(\.env|serviceAccountKey)"
```

Should show:
```
.env
.env.local
.env.*.local
backend/.env
serviceAccountKey.json
api/serviceAccountKey.json
```

### Step 4: Remove Exposed Credentials from Files

After rotating credentials, update these files with environment variables:

#### Files Currently Containing Hardcoded Keys:
```
✗ scripts/check-firebase-user.sh (line 9)
✗ scripts/get-firebase-token.py (line 14)
✗ scripts/test-wallet-grant.mjs (line 4)
✗ test-mine-endpoint.mjs (line 28)
✗ src/firebase.js (line 8)
✗ src/lib/firebase.ts (line 6)
✗ src/components/NotificationLayer.tsx (line 54)
✗ FIREBASE_AUTH_TROUBLESHOOTING.md (multiple lines - DOCUMENTATION)
✗ backend/.env (ENTIRE FILE - DELETE AFTER BACKING UP)
✗ api/serviceAccountKey.json (ENTIRE FILE - REGENERATE)
```

### Step 5: Use Environment Variables Only

Create a `.env.example` template (safe to commit):

```bash
# Firebase Configuration (Web API - Public)
VITE_FIREBASE_API_KEY=your_new_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=sloane-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sloane-hub
VITE_FIREBASE_STORAGE_BUCKET=sloane-hub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=664957061898
VITE_FIREBASE_APP_ID=1:664957061898:web:71a4e19471132ef7ba88f3

# Firebase Admin SDK (Server-Side - SENSITIVE)
FIREBASE_PROJECT_ID=sloane-hub
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-w5lfs@sloane-hub.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Port
PORT=5055
```

## 📋 Files to Update After Credential Rotation

### 1. Frontend Firebase Config
**File**: `src/firebase.js` and `src/lib/firebase.ts`

```typescript
// BEFORE (EXPOSED - BAD):
const firebaseConfig = {
  apiKey: "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M", // ❌ EXPOSED
  // ...
};

// AFTER (SECURE - GOOD):
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // ✅ From env
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 2. Backend Service Account
**File**: `backend/services/firestore.js`

Already using environment variables or file loading - just ensure you:
1. Delete the old `serviceAccountKey.json`
2. Download new service account key
3. Place it outside Git repo OR use environment variables

### 3. Scripts
Update all scripts to use environment variables:

```python
# scripts/get-firebase-token.py
import os
API_KEY = os.environ.get('FIREBASE_API_KEY')  # Get from environment
```

```bash
# scripts/check-firebase-user.sh
API_KEY="${FIREBASE_API_KEY}"  # Get from environment
```

### 4. Documentation Files
**Update these with placeholders only:**
- `FIREBASE_AUTH_TROUBLESHOOTING.md` - Replace real keys with `YOUR_FIREBASE_API_KEY`
- `VERCEL_QUICK_START.md` - Already uses placeholders (good)

## 🔒 Additional Security Measures

### 1. Enable Firebase App Check (Recommended)
Protects your backend from abuse:
1. Go to Firebase Console > App Check
2. Enable App Check for your web app
3. Use reCAPTCHA v3 or hCaptcha
4. Enforce App Check for your APIs

### 2. Restrict API Key in Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** > **Credentials**
3. Find your Web API Key
4. Click **Edit**
5. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your domains:
     - `https://yourdomain.com/*`
     - `https://*.vercel.app/*` (if using Vercel)
     - `http://localhost:*` (for development)
6. Under **API restrictions**:
   - Select **Restrict key**
   - Only enable:
     - Firebase Authentication API
     - Cloud Firestore API
     - Identity Toolkit API

### 3. Use GitHub Secrets for CI/CD
If using GitHub Actions:
1. Go to GitHub repo > **Settings** > **Secrets and variables** > **Actions**
2. Add secrets:
   - `FIREBASE_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT` (entire JSON)
3. Reference in workflows: `${{ secrets.FIREBASE_API_KEY }}`

### 4. Monitor for Future Leaks
1. Enable [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
2. Enable [GitGuardian](https://www.gitguardian.com/) (free for public repos)
3. Use [git-secrets](https://github.com/awslabs/git-secrets) locally

## ✅ Verification Checklist

After completing all steps:

- [ ] Rotated Firebase Web API Key
- [ ] Rotated Firebase Service Account Key  
- [ ] Removed sensitive files from Git history (BFG)
- [ ] Force pushed to GitHub
- [ ] Verified `.gitignore` includes all sensitive files
- [ ] Updated `src/firebase.js` to use env variables
- [ ] Updated `src/lib/firebase.ts` to use env variables
- [ ] Updated all scripts to use env variables
- [ ] Replaced real keys in documentation with placeholders
- [ ] Created `.env.example` file
- [ ] Deleted local `.env` files (they're gitignored now)
- [ ] Created new `.env` files with new credentials (NOT committed)
- [ ] Tested application with new credentials
- [ ] Enabled Firebase App Check (optional but recommended)
- [ ] Restricted API key in Google Cloud Console
- [ ] Enabled GitHub secret scanning
- [ ] Notified team members to re-clone repo (if applicable)

## 📞 Need Help?

If you're unsure about any step:
1. **Don't delay** - rotate credentials first, fix later
2. Contact Firebase Support
3. Review [Firebase Security Best Practices](https://firebase.google.com/docs/rules/security)

## 🔄 Quick Commands Summary

```bash
# 1. Backup
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub"
cp -r "marketplace-ui-react" "marketplace-ui-react-backup"

# 2. Clean history
cd marketplace-ui-react
brew install bfg
bfg --delete-files serviceAccountKey.json
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 3. Force push (after rotating credentials!)
git push origin --force --all

# 4. Clean local sensitive files
rm -f backend/.env
rm -f api/serviceAccountKey.json
rm -f serviceAccountKey.json

# 5. Create new .env from example (after getting new credentials)
cp .env.example .env
# Edit .env with your NEW credentials
```

---

**⏰ Time Sensitivity**: Complete Steps 1-2 within the next hour to minimize security risk.
