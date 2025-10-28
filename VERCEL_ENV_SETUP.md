# Vercel Environment Variables Setup Guide

## Quick Setup Instructions

### Method 1: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project: `marketplace-firebase`
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable below by clicking **Add New**
5. For each variable, set the environment to: **Production**, **Preview**, and **Development**

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY
# Paste: AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M
# Select: Production, Preview, Development

# Repeat for all variables below
```

## Required Environment Variables

### 1. Frontend Firebase Configuration

These variables are needed for the React/Vite frontend to connect to Firebase:

| Variable Name | Value | Required |
|--------------|-------|----------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M` | ✅ Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | `sloane-hub.firebaseapp.com` | ✅ Yes |
| `VITE_FIREBASE_PROJECT_ID` | `sloane-hub` | ✅ Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | `sloane-hub.firebasestorage.app` | ✅ Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `664957061898` | ✅ Yes |
| `VITE_FIREBASE_APP_ID` | `1:664957061898:web:71a4e19471132ef7ba88f3` | ✅ Yes |

### 2. Backend API Configuration

| Variable Name | Value | Required |
|--------------|-------|----------|
| `VITE_API_URL` | `https://marketplace-firebase.vercel.app/api` | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `PORT` | `5055` | ⚠️ Optional (Vercel manages ports) |

### 3. Backend Firebase Admin SDK

| Variable Name | Value | Required |
|--------------|-------|----------|
| `FIREBASE_PROJECT_ID` | `sloane-hub` | ✅ Yes |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-v5fhd@sloane-hub.iam.gserviceaccount.com` | ✅ Yes |

### 4. Security & CORS

| Variable Name | Value | Required |
|--------------|-------|----------|
| `ALLOWED_ORIGINS` | `https://marketplace-firebase.vercel.app,http://localhost:3000,http://localhost:5173` | ✅ Yes |
| `SESSION_SECRET` | **Generate a secure random string** | ✅ Yes |

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Optional Configuration

| Variable Name | Default Value | Required |
|--------------|---------------|----------|
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | ❌ No |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | ❌ No |
| `ENABLE_ANALYTICS` | `true` | ❌ No |
| `ENABLE_GRAPHQL` | `true` | ❌ No |
| `ENABLE_WEBSOCKETS` | `false` | ❌ No |
| `DEFAULT_TENANT` | `vendor` | ❌ No |

### 6. Service Account Secret (Important!)

Your Firebase service account key needs to be uploaded as a **secret file** in Vercel:

**Option A: Using Vercel CLI**
```bash
# Create a secrets directory in your project root
mkdir -p secrets

# Copy your service account key
cp serviceAccountKey.json secrets/sloane-hub-service-account.json

# The file will be deployed with your project
# Make sure secrets/ is NOT in .gitignore for deployment
```

**Option B: Environment Variable (Alternative)**
```bash
# Convert service account to base64
cat serviceAccountKey.json | base64 > service-account-base64.txt

# Add as environment variable in Vercel
# Name: FIREBASE_SERVICE_ACCOUNT_BASE64
# Value: [paste the base64 content]

# Then decode in your code:
# const serviceAccount = JSON.parse(
#   Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
# );
```

## Step-by-Step Vercel Dashboard Setup

### Step 1: Navigate to Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** in the top menu
4. Click **Environment Variables** in the sidebar

### Step 2: Add Each Variable

For each variable listed above:

1. Click **Add New** button
2. Enter the **Key** (variable name)
3. Enter the **Value**
4. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### Step 3: Redeploy

After adding all variables:
```bash
# Trigger a new deployment
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin main
```

Or click **Redeploy** in the Vercel dashboard.

## Updating Your Code to Use Environment Variables

### Update `src/firebase.js`

Replace the hardcoded config with environment variables:

```javascript
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

export default app;
```

### Update API Client to Use Environment Variable

```javascript
// src/lib/api.js or similar
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055/api';
```

## Verification

After deployment, verify your environment variables are loaded:

### Check in Browser Console (Frontend)
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Firebase Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

### Check Backend Logs (Vercel Functions)
Look for your backend logs in Vercel → Project → Logs

## Security Best Practices

### ✅ DO:
- Use environment variables for all configuration
- Keep service account keys secure
- Use different Firebase projects for dev/staging/prod
- Rotate secrets regularly
- Set appropriate CORS origins

### ❌ DON'T:
- Commit `.env` files to git (except `.env.example`)
- Share service account keys in chat/email
- Use production keys in development
- Expose API keys in client-side error messages

## Troubleshooting

### Variables Not Loading
1. Check variable names match exactly (case-sensitive)
2. Verify you selected the right environment (Production/Preview/Development)
3. Redeploy after adding variables
4. Check Vercel build logs for errors

### Firebase Auth Not Working
1. Verify `VITE_FIREBASE_AUTH_DOMAIN` is correct
2. Check Firebase Console → Authentication → Authorized domains
3. Ensure `marketplace-firebase.vercel.app` is listed

### Backend API Errors
1. Check service account is properly loaded
2. Verify `FIREBASE_PROJECT_ID` matches your Firebase project
3. Check backend logs in Vercel dashboard

## Testing Locally with Vercel Environment

Pull environment variables from Vercel to test locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Now run your dev server
npm run dev
```

## Complete Vercel CLI Script

Here's a complete script to add all variables at once:

```bash
#!/bin/bash
# add-vercel-env.sh

echo "Adding environment variables to Vercel..."

# Frontend Firebase
vercel env add VITE_FIREBASE_API_KEY production preview development
vercel env add VITE_FIREBASE_AUTH_DOMAIN production preview development
vercel env add VITE_FIREBASE_PROJECT_ID production preview development
vercel env add VITE_FIREBASE_STORAGE_BUCKET production preview development
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production preview development
vercel env add VITE_FIREBASE_APP_ID production preview development

# Backend Config
vercel env add VITE_API_URL production preview development
vercel env add NODE_ENV production preview development
vercel env add FIREBASE_PROJECT_ID production preview development
vercel env add FIREBASE_CLIENT_EMAIL production preview development
vercel env add ALLOWED_ORIGINS production preview development
vercel env add SESSION_SECRET production preview development

echo "Done! Remember to redeploy your project."
```

## Next Steps

1. ✅ Add all environment variables to Vercel
2. ✅ Upload service account key
3. ✅ Update `src/firebase.js` to use env vars
4. ✅ Commit and push changes
5. ✅ Verify deployment succeeds
6. ✅ Test Google sign-in on production

## Reference Files

- Environment variables template: `.env.vercel`
- Example file: `.env.example`
- Service account location: `secrets/sloane-hub-service-account.json`
