# 🚀 Quick Reference: Vercel Environment Variables

## Copy-Paste Ready Values

### Frontend Firebase Variables
```
VITE_FIREBASE_API_KEY=AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M
VITE_FIREBASE_AUTH_DOMAIN=sloane-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sloane-hub
VITE_FIREBASE_STORAGE_BUCKET=sloane-hub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=664957061898
VITE_FIREBASE_APP_ID=1:664957061898:web:71a4e19471132ef7ba88f3
```

### Backend API Variables
```
VITE_API_URL=https://marketplace-firebase.vercel.app/api
NODE_ENV=production
FIREBASE_PROJECT_ID=sloane-hub
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-v5fhd@sloane-hub.iam.gserviceaccount.com
```

### Security Variables
```
ALLOWED_ORIGINS=https://marketplace-firebase.vercel.app,http://localhost:3000,http://localhost:5173
SESSION_SECRET=[RUN: npm run generate-secret]
```

## 📝 Vercel Dashboard Steps

1. Go to: https://vercel.com/dashboard
2. Select: Your project
3. Navigate: Settings → Environment Variables
4. For each variable above:
   - Click "Add New"
   - Paste variable name and value
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click "Save"
5. Redeploy your app

## 🔧 Quick Setup Commands

### Generate Session Secret
```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/firebase sloane hub/ui/marketplace-ui-react"
./scripts/generate-session-secret.sh
```

### Pull Vercel Env to Local
```bash
vercel env pull .env.local
```

### Test Build Locally
```bash
npm run build
npm run preview
```

## ✅ Verification Checklist

After adding variables and redeploying:

- [ ] Frontend loads without errors
- [ ] Firebase auth initializes correctly
- [ ] Google sign-in redirects properly
- [ ] Backend API is accessible
- [ ] No CORS errors in console
- [ ] Service account authenticated

## 🆘 Quick Troubleshooting

### If Google Sign-In Still Fails:
1. Check Firebase Console → Authorized domains
2. Check Google Cloud Console → OAuth credentials
3. Clear browser cache and cookies
4. Check browser console for errors

### If Backend Errors:
1. Check Vercel deployment logs
2. Verify service account file uploaded
3. Check environment variables are set
4. Verify CORS origins match

## 📚 Related Documentation

- Full Setup Guide: `VERCEL_ENV_SETUP.md`
- Google Auth Fix: `VERCEL_GOOGLE_AUTH_FIX.md`
- Environment Template: `.env.vercel`
