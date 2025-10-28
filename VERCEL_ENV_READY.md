# ✅ Vercel Environment Variables - Ready to Deploy

## 🎯 Generated Session Secret

**SESSION_SECRET:**
```
29bfb0a669d5988c446d4a0065cfa44733d29ac7366bd0a7ee29ee55b691b110
```

⚠️ **IMPORTANT:** Copy this secret now! Add it to Vercel and keep it secure.

---

## 📋 All Environment Variables (Copy-Paste to Vercel)

### 1. Frontend Firebase Configuration

| Variable | Value |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `sloane-hub.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `sloane-hub` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `sloane-hub.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `664957061898` |
| `VITE_FIREBASE_APP_ID` | `1:664957061898:web:71a4e19471132ef7ba88f3` |

### 2. Backend Configuration

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://marketplace-firebase.vercel.app/api` |
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | `sloane-hub` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-v5fhd@sloane-hub.iam.gserviceaccount.com` |

### 3. Security & CORS

| Variable | Value |
|----------|-------|
| `ALLOWED_ORIGINS` | `https://marketplace-firebase.vercel.app,http://localhost:3000,http://localhost:5173` |
| `SESSION_SECRET` | `29bfb0a669d5988c446d4a0065cfa44733d29ac7366bd0a7ee29ee55b691b110` |

---

## 🚀 Quick Setup Steps

### Step 1: Add to Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Navigate to: **Settings** → **Environment Variables**
4. Click **Add New** for each variable
5. Select environments: ✅ Production ✅ Preview ✅ Development

### Step 2: Add Variables (Copy-Paste Format)

```bash
# Frontend Firebase
VITE_FIREBASE_API_KEY=AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M
VITE_FIREBASE_AUTH_DOMAIN=sloane-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sloane-hub
VITE_FIREBASE_STORAGE_BUCKET=sloane-hub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=664957061898
VITE_FIREBASE_APP_ID=1:664957061898:web:71a4e19471132ef7ba88f3

# Backend API
VITE_API_URL=https://marketplace-firebase.vercel.app/api
NODE_ENV=production
FIREBASE_PROJECT_ID=sloane-hub
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-v5fhd@sloane-hub.iam.gserviceaccount.com

# Security
ALLOWED_ORIGINS=https://marketplace-firebase.vercel.app,http://localhost:3000,http://localhost:5173
SESSION_SECRET=29bfb0a669d5988c446d4a0065cfa44733d29ac7366bd0a7ee29ee55b691b110
```

### Step 3: Redeploy

After adding all variables, redeploy your app:

**Option A: Git Push**
```bash
git add .
git commit -m "Configure Vercel environment variables"
git push origin main
```

**Option B: Vercel Dashboard**
- Click **Deployments** → **Redeploy** (with "Use existing Build Cache" unchecked)

---

## 📝 Vercel CLI Method (Alternative)

If you prefer using the CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add each variable
echo "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M" | vercel env add VITE_FIREBASE_API_KEY production
echo "sloane-hub.firebaseapp.com" | vercel env add VITE_FIREBASE_AUTH_DOMAIN production
echo "sloane-hub" | vercel env add VITE_FIREBASE_PROJECT_ID production
echo "sloane-hub.firebasestorage.app" | vercel env add VITE_FIREBASE_STORAGE_BUCKET production
echo "664957061898" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
echo "1:664957061898:web:71a4e19471132ef7ba88f3" | vercel env add VITE_FIREBASE_APP_ID production
echo "https://marketplace-firebase.vercel.app/api" | vercel env add VITE_API_URL production
echo "production" | vercel env add NODE_ENV production
echo "sloane-hub" | vercel env add FIREBASE_PROJECT_ID production
echo "firebase-adminsdk-v5fhd@sloane-hub.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL production
echo "https://marketplace-firebase.vercel.app,http://localhost:3000,http://localhost:5173" | vercel env add ALLOWED_ORIGINS production
echo "29bfb0a669d5988c446d4a0065cfa44733d29ac7366bd0a7ee29ee55b691b110" | vercel env add SESSION_SECRET production

# Repeat for preview and development environments if needed
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at https://marketplace-firebase.vercel.app
- [ ] No console errors about missing environment variables
- [ ] Firebase initializes correctly
- [ ] Google sign-in button appears
- [ ] Backend API responds at `/api/health/status`
- [ ] CORS is working (no CORS errors in console)

---

## 🔧 Test Commands

### Generate New Secret (if needed)
```bash
npm run generate-secret
```

### Pull Vercel Env to Local
```bash
vercel env pull .env.local
```

### Test Local Build
```bash
npm run build
npm run preview
```

---

## 📚 Additional Documentation

- **Full Setup Guide:** `VERCEL_ENV_SETUP.md`
- **Quick Reference:** `VERCEL_ENV_QUICK_REF.md`
- **Google Auth Fix:** `VERCEL_GOOGLE_AUTH_FIX.md`
- **Environment Template:** `.env.vercel`

---

## 🆘 Troubleshooting

### Variables Not Loading?
1. Check variable names match exactly (case-sensitive)
2. Verify you selected correct environments
3. Redeploy after adding variables
4. Check build logs in Vercel dashboard

### Firebase Auth Errors?
1. Add domain to Firebase Console → Authorized domains
2. Update Google Cloud Console → OAuth credentials
3. See `VERCEL_GOOGLE_AUTH_FIX.md` for detailed steps

### Backend API Issues?
1. Verify service account file is in `secrets/` folder
2. Check CORS configuration
3. Review Vercel function logs

---

## ⏭️ Next Steps

1. ✅ Add all environment variables to Vercel
2. ✅ Verify service account file is deployed
3. ✅ Push code changes to trigger deployment
4. ✅ Test Google sign-in on production
5. ✅ Monitor Vercel logs for any issues

**Generated:** $(date)
**Session Secret Generated:** ✅
**Total Variables:** 12
**Status:** Ready to Deploy 🚀
