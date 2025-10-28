# 🎯 Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Firebase Console Configuration
- [ ] Login to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select project: `sloane-hub`
- [ ] Navigate to **Authentication** → **Settings** → **Authorized domains**
- [ ] Verify `marketplace-firebase.vercel.app` is added
- [ ] If not added, click **Add domain** and add it

### 2. Google Cloud Console Configuration
- [ ] Login to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Select project: `sloane-hub`
- [ ] Navigate to **APIs & Services** → **Credentials**
- [ ] Find OAuth 2.0 Client ID (for Firebase)
- [ ] Under **Authorized JavaScript origins**, verify:
  - [ ] `https://marketplace-firebase.vercel.app`
  - [ ] `https://sloane-hub.firebaseapp.com`
- [ ] Under **Authorized redirect URIs**, verify:
  - [ ] `https://marketplace-firebase.vercel.app/__/auth/handler`
  - [ ] `https://sloane-hub.firebaseapp.com/__/auth/handler`
- [ ] Click **Save** if any changes made

## Vercel Environment Variables Setup

### 3. Add Environment Variables to Vercel
- [ ] Login to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Select your project
- [ ] Navigate to **Settings** → **Environment Variables**

### 4. Add Frontend Firebase Variables
- [ ] `VITE_FIREBASE_API_KEY` = `AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` = `sloane-hub.firebaseapp.com`
- [ ] `VITE_FIREBASE_PROJECT_ID` = `sloane-hub`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` = `sloane-hub.firebasestorage.app`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` = `664957061898`
- [ ] `VITE_FIREBASE_APP_ID` = `1:664957061898:web:71a4e19471132ef7ba88f3`

### 5. Add Backend Configuration Variables
- [ ] `VITE_API_URL` = `https://marketplace-firebase.vercel.app/api`
- [ ] `NODE_ENV` = `production`
- [ ] `FIREBASE_PROJECT_ID` = `sloane-hub`
- [ ] `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk-v5fhd@sloane-hub.iam.gserviceaccount.com`

### 6. Add Security Variables
- [ ] `ALLOWED_ORIGINS` = `https://marketplace-firebase.vercel.app,http://localhost:3000,http://localhost:5173`
- [ ] `SESSION_SECRET` = `29bfb0a669d5988c446d4a0065cfa44733d29ac7366bd0a7ee29ee55b691b110`

### 7. Verify Service Account File
- [ ] Ensure `secrets/sloane-hub-service-account.json` exists in project
- [ ] Verify file is NOT in `.gitignore` (needed for Vercel deployment)
- [ ] File should be included in Vercel deployment

## Deployment

### 8. Deploy to Vercel
- [ ] Commit all changes:
  ```bash
  git add .
  git commit -m "Configure Vercel environment and fix Google Auth"
  ```
- [ ] Push to main branch:
  ```bash
  git push origin main
  ```
- [ ] Wait for Vercel to build and deploy (check dashboard)

### 9. Monitor Deployment
- [ ] Check Vercel deployment status
- [ ] Review build logs for errors
- [ ] Verify deployment completed successfully
- [ ] Note the deployment URL

## Post-Deployment Verification

### 10. Frontend Checks
- [ ] Visit `https://marketplace-firebase.vercel.app`
- [ ] Page loads without errors
- [ ] Open browser DevTools → Console
- [ ] No errors about missing environment variables
- [ ] No Firebase initialization errors

### 11. Backend API Checks
- [ ] Visit `https://marketplace-firebase.vercel.app/api/health/status`
- [ ] Should return health check JSON
- [ ] Visit `https://marketplace-firebase.vercel.app/graphql`
- [ ] GraphQL playground loads (if enabled)

### 12. Google Sign-In Test
- [ ] Navigate to `https://marketplace-firebase.vercel.app/login`
- [ ] Click "Continue with Google" button
- [ ] Google sign-in page loads
- [ ] Can sign in with Google account
- [ ] Redirected back to app after sign-in
- [ ] User is logged in successfully
- [ ] No console errors during sign-in flow

### 13. CORS Verification
- [ ] Open browser DevTools → Console
- [ ] Attempt to make API calls
- [ ] No CORS errors appear
- [ ] API requests complete successfully

### 14. Authentication Flow Test
- [ ] Test email/password login
- [ ] Test Google OAuth login
- [ ] Test logout
- [ ] Test protected routes redirect to login
- [ ] Test successful login redirects to dashboard

## Troubleshooting

### If Google Sign-In Fails:
- [ ] Check browser console for error codes
- [ ] Verify Firebase authorized domains (step 1)
- [ ] Verify Google OAuth settings (step 2)
- [ ] Clear browser cache and cookies
- [ ] Try in incognito/private window
- [ ] See `VERCEL_GOOGLE_AUTH_FIX.md` for detailed troubleshooting

### If Environment Variables Not Loading:
- [ ] Verify variable names match exactly (case-sensitive)
- [ ] Check environments selected (Production/Preview/Development)
- [ ] Redeploy from Vercel dashboard
- [ ] Check build logs for errors

### If Backend API Errors:
- [ ] Check Vercel function logs
- [ ] Verify service account file deployed
- [ ] Check CORS configuration
- [ ] Verify environment variables set correctly

### If Build Fails:
- [ ] Check Vercel build logs
- [ ] Verify all dependencies installed
- [ ] Check for TypeScript errors
- [ ] Verify `vercel.json` configuration

## Final Validation

### 15. Complete System Test
- [ ] Create new user account
- [ ] Login with email/password
- [ ] Logout
- [ ] Login with Google OAuth
- [ ] Access protected pages
- [ ] Test main features/functionality
- [ ] Check mobile responsiveness
- [ ] Test in different browsers

### 16. Performance Check
- [ ] Check Vercel Analytics for performance metrics
- [ ] Test page load times
- [ ] Check Core Web Vitals
- [ ] Verify no console warnings/errors

## Success Criteria

All items below should be ✅:
- [ ] ✅ All environment variables added to Vercel
- [ ] ✅ Firebase authorized domains configured
- [ ] ✅ Google OAuth credentials configured
- [ ] ✅ Deployment successful
- [ ] ✅ Frontend loads without errors
- [ ] ✅ Backend API accessible
- [ ] ✅ Google sign-in works
- [ ] ✅ No CORS errors
- [ ] ✅ Authentication flow complete

## 🎉 Deployment Complete!

Once all checkboxes are checked, your Vercel deployment is complete and fully functional!

## 📚 Reference Documents
- **Ready to Deploy Guide:** `VERCEL_ENV_READY.md`
- **Full Setup Instructions:** `VERCEL_ENV_SETUP.md`
- **Google Auth Fix:** `VERCEL_GOOGLE_AUTH_FIX.md`
- **Quick Reference:** `VERCEL_ENV_QUICK_REF.md`

---
**Last Updated:** $(date)
**Version:** 1.0
**Status:** Ready for Production ✅
