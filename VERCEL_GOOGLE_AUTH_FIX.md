# Vercel Google Authentication Fix Guide

## Issue
Google Sign-In is not working on https://marketplace-firebase.vercel.app/login

## Root Cause Analysis

The issue is likely caused by one or more of the following:

1. **Missing Authorized Domain in Firebase Console** - Vercel domain not added to Firebase Auth authorized domains
2. **Popup Blockers** - `signInWithPopup` may be blocked on production
3. **Missing Environment Variables** - Firebase config may not be properly set in Vercel
4. **OAuth Redirect URI Mismatch** - Google OAuth settings may not include Vercel domain

## Solutions (Apply in Order)

### 1. Add Vercel Domain to Firebase Authorized Domains

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `sloane-hub`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add: `marketplace-firebase.vercel.app`
6. Click **Add**

### 2. Update Google OAuth Authorized Redirect URIs

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `sloane-hub`
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (used for Firebase Auth)
5. Click **Edit**
6. Under **Authorized JavaScript origins**, add:
   - `https://marketplace-firebase.vercel.app`
7. Under **Authorized redirect URIs**, add:
   - `https://marketplace-firebase.vercel.app/__/auth/handler`
   - `https://sloane-hub.firebaseapp.com/__/auth/handler`
8. Click **Save**

### 3. Switch from Popup to Redirect (Recommended for Production)

The current implementation uses `signInWithPopup` which can be blocked by browsers in production environments. Switch to `signInWithRedirect` for better compatibility.

**Update LoginForm.tsx:**

```typescript
// Import redirect methods instead of popup
import {
  signInWithEmailAndPassword,
  signInWithRedirect,  // Changed from signInWithPopup
  getRedirectResult,   // New import
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onIdTokenChanged,
} from "firebase/auth";

// Add this hook at the top of the component
useEffect(() => {
  // Handle redirect result when user returns from Google
  const handleRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        try { 
          await writeAuditLog({ 
            action: "LOGIN_GOOGLE", 
            userEmail: result.user.email 
          }); 
        } catch {}
        // onIdTokenChanged will handle the rest
      }
    } catch (ex) {
      setErr(mapFirebaseError(ex?.code));
    }
  };
  
  handleRedirectResult();
}, []);

// Update the Google login function
async function doGoogleLogin() {
  setErr(null);
  setMsg(null);
  setBusy(true);
  try {
    // Use redirect instead of popup
    await signInWithRedirect(auth, google);
    // User will be redirected away, then back to the app
    // The useEffect above will handle the result
  } catch (ex) {
    setErr(mapFirebaseError(ex?.code));
    setBusy(false);
  }
}
```

### 4. Verify Environment Variables in Vercel

**Steps:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify these variables are set (if using env vars):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

**Note:** Your current setup hardcodes Firebase config in `src/firebase.js`, so this step may not be necessary unless you want to use environment variables.

### 5. Update Other Components Using signInWithPopup

The same changes should be applied to:

**VendorSignupPage.tsx:**
```typescript
import { signInWithRedirect, getRedirectResult } from "firebase/auth";

// Add redirect result handler in useEffect
useEffect(() => {
  const handleRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        // Handle user signup/login
      }
    } catch (ex) {
      setError(mapFirebaseError(ex?.code));
    }
  };
  handleRedirectResult();
}, []);

// Update signup function
const handleGoogleSignup = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  } catch (error) {
    setError(mapFirebaseError(error?.code));
  }
};
```

**authClient.ts:**
```typescript
import { signInWithRedirect, getRedirectResult } from "firebase/auth";

export async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
  // User will be redirected, result handled on return
}

export async function handleAuthRedirect() {
  const result = await getRedirectResult(auth);
  return result;
}
```

### 6. Test Locally Before Deploying

```bash
# Build the project
npm run build

# Preview the production build locally
npm run preview

# Test Google sign-in in the preview
```

### 7. Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "Fix: Switch Google Auth to redirect flow for Vercel compatibility"
git push origin main

# Vercel will automatically deploy
```

### 8. Verify CORS Configuration

Your CORS config already includes the Vercel domain (we just added the https:// protocol). Verify the backend is deployed and accessible:

**Test endpoints:**
- Backend health: `https://marketplace-firebase.vercel.app/api/health/status`
- GraphQL: `https://marketplace-firebase.vercel.app/graphql`

## Debugging Tips

### Check Browser Console
Look for errors like:
- `auth/unauthorized-domain` - Firebase domain not authorized
- `auth/popup-blocked` - Popup blocked by browser
- `auth/popup-closed-by-user` - User closed popup
- CORS errors - Backend not accessible

### Test Firebase Auth Directly
```javascript
// Run in browser console on your Vercel site
import { getAuth, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
const auth = getAuth();
const provider = new GoogleAuthProvider();
signInWithRedirect(auth, provider);
```

### Check Network Tab
1. Open DevTools → Network tab
2. Try to sign in with Google
3. Look for failed requests to:
   - `identitytoolkit.googleapis.com`
   - `securetoken.googleapis.com`
   - Firebase Auth endpoints

### Verify Firebase Configuration
```javascript
// Run in browser console
console.log(auth.app.options);
// Should show:
// authDomain: "sloane-hub.firebaseapp.com"
// apiKey: "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M"
```

## Quick Fix (Immediate Testing)

If you need to test immediately without code changes:

1. Add the Vercel domain to Firebase Console (Step 1)
2. Add redirect URIs to Google OAuth (Step 2)
3. Wait 5-10 minutes for changes to propagate
4. Clear browser cache and cookies
5. Try sign-in again

## Expected Behavior After Fix

1. User clicks "Sign in with Google"
2. User is redirected to Google sign-in page
3. User authorizes the app
4. User is redirected back to `https://marketplace-firebase.vercel.app`
5. Authentication completes automatically
6. User is redirected to dashboard

## Common Issues

### "Popup blocked" Error
- Solution: Switch to redirect flow (recommended above)

### "auth/unauthorized-domain" Error
- Solution: Add domain to Firebase authorized domains

### "This app is blocked" from Google
- Solution: Add redirect URIs to Google Cloud Console

### Network errors / CORS issues
- Solution: Verify backend is deployed and CORS is configured

## Support

If issues persist after following this guide:

1. Check Firebase Console logs: Authentication → Usage
2. Check Vercel deployment logs
3. Check browser console for detailed error messages
4. Verify all domains are properly configured in both Firebase and Google Cloud Console
