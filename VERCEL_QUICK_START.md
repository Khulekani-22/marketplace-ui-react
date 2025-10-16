# 🚀 Vercel Firebase Connection - Quick Start

## Problem
Your app works locally but doesn't connect to Firebase on Vercel.

## Solution (5 Minutes)

### Step 1: Go to Vercel Dashboard
1. Open your project: https://vercel.com/dashboard
2. Click on your project (`marketplace-ui-react-vcl-main-oct`)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Three Environment Variables

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `FIREBASE_PRIVATE_KEY` | Your private key | Copy from `api/serviceAccountKey.json` → `private_key` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@sloane-hub.iam.gserviceaccount.com` | Copy from `api/serviceAccountKey.json` → `client_email` |
| `FIREBASE_PROJECT_ID` | `sloane-hub` | Copy from `api/serviceAccountKey.json` → `project_id` |

### Step 3: Important for FIREBASE_PRIVATE_KEY
⚠️ **Copy the ENTIRE key including these lines:**
```
-----BEGIN PRIVATE KEY-----
... (all the key content) ...
-----END PRIVATE KEY-----
```

### Step 4: Set Environment Scope
For each variable, check these boxes:
- ✅ Production
- ✅ Preview  
- ✅ Development

### Step 5: Redeploy
After adding all 3 variables:
```bash
vercel --prod
```

Or just push a new commit to trigger auto-deployment.

---

## Verify It Works

### 1. Check Health Endpoint
Visit: `https://your-app.vercel.app/api/health`

You should see:
```json
{
  "status": "ok",
  "firebase": {
    "configured": true,
    "projectId": "sloane-hub",
    "credentialSource": "environment-variables"
  }
}
```

### 2. Check Vercel Function Logs
In Vercel dashboard → Functions → Check logs for:
- ✅ `🔑 Loading Firebase credentials from environment variables`
- ✅ `✅ Firebase Admin initialized`
- ❌ No "service account credentials not configured" errors

### 3. Test Your App
- Login to the app
- Try booking a session
- Check if data loads correctly

---

## Troubleshooting

### Error: "service account credentials not configured"
**Fix:** Check variable names are EXACT:
- `FIREBASE_PRIVATE_KEY` (not FIREBASE_KEY)
- `FIREBASE_CLIENT_EMAIL` (not CLIENT_EMAIL)
- `FIREBASE_PROJECT_ID` (not PROJECT_ID)

### Error: "Invalid private key"
**Fix:** Make sure you copied the BEGIN/END lines:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhki...
-----END PRIVATE KEY-----
```

### Still not working?
1. Check Vercel function logs for specific errors
2. Make sure all 3 variables are set
3. Redeploy after adding variables
4. Check the full guide: `VERCEL_FIREBASE_SETUP.md`

---

## Quick Copy-Paste Values

From your `api/serviceAccountKey.json`:

**FIREBASE_CLIENT_EMAIL:**
```
firebase-adminsdk-fbsvc@sloane-hub.iam.gserviceaccount.com
```

**FIREBASE_PROJECT_ID:**
```
sloane-hub
```

**FIREBASE_PRIVATE_KEY:**  
*(Open `api/serviceAccountKey.json` and copy the entire `private_key` value)*

---

## That's It! 🎉

Once you add these 3 environment variables and redeploy, your Vercel app will connect to Firebase just like it does locally.

Need more details? See: `VERCEL_FIREBASE_SETUP.md`
