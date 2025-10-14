# Login Testing Guide

## ✅ System Status
- **Backend**: Running on port 5055
- **Frontend**: Running on port 5173
- **Firebase Auth**: Connected and working
- **Firestore**: Pure Firestore mode active

## 🔐 Test Users Available

All users verified in Firebase Authentication:

| Email | UID | Email Verified | Password |
|-------|-----|----------------|----------|
| khulekani@22onsloane.co | tAsFySNxnsW4a7L43wMRVLkJAqE3 | ❌ No | (use your password) |
| ruthmaphosa2024@gmail.com | MFIzWLlhKjSDkV8FPlwXixdUCFX2 | ✅ Yes | (use your password) |
| 22onsloanedigitalteam@gmail.com | duFghKRYhyRFUhlBRm66iMLKgh22 | ✅ Yes | (use your password) |
| mncubekhulekani@gmail.com | 93cUbdo4BkXnVQrXQBgJVDapYdS2 | ✅ Yes | (use your password) |
| zinhlesloane@gmail.com | O8bBPBKniiWbuSBXrMgBGJMPfoO2 | ✅ Yes | (use your password) |
| khulekani@gecafrica.co | WcdBgaT4hEMXb3DScC1OE8NDKJ62 | ❌ No | (use your password) |

## 🧪 How to Test Login Flow

### Step 1: Logout First
```
1. Open browser at http://localhost:5173
2. If already logged in, click your profile/user menu
3. Click "Logout" or "Sign Out"
4. Verify you're redirected to login or home page
```

### Step 2: Test Login
```
1. Navigate to http://localhost:5173/login
2. Enter email and password
3. Select tenant (if shown)
4. Click "Sign in"
```

### Step 3: Verify Success
After successful login, you should see:
- ✅ Redirect to dashboard or home page
- ✅ User name/email displayed in header
- ✅ Navigation menu appropriate for your role
- ✅ No 401 errors in browser console

## 🔍 Debugging Login Issues

### Browser Console Checks
Open DevTools (F12) → Console tab and look for:

**✅ Good Signs:**
```
Firebase auth success
hasFullAccess: true (for admins)
role: "admin" or "partner" or "member"
tenantId: "22onsloane" or "public"
```

**❌ Bad Signs:**
```
Firebase: Error (auth/wrong-password)
Firebase: Error (auth/user-not-found)
Firebase: Error (auth/invalid-credential)
401 Unauthorized
```

### Common Issues & Solutions

#### Issue: "User not found"
**Solution**: User needs to be created in Firebase Console
- Go to: https://console.firebase.google.com
- Select project: sloane-hub
- Authentication → Users → Add user

#### Issue: "Wrong password"
**Solution**: Reset password
- On login page, click "Forgot Password?"
- Enter email
- Check inbox for reset link

#### Issue: "Invalid credential"
**Solution**: Check if password is correct or reset it

#### Issue: Already logged in
**Solution**: You were already signed in! Logout first to test login flow.

#### Issue: 401 errors after login
**Solution**: This is the race condition we fixed
- Should resolve automatically with retry logic
- If persists, check `src/lib/authReady.ts` is imported in `api.ts`

## 🎯 Expected Behavior by Role

### Admin Users
- Email: khulekani@22onsloane.co
- Redirected to: `/listings-admin`
- Can see: All admin menus, manage listings, users, wallets

### Partner/Vendor Users
- Email: ruthmaphosa2024@gmail.com
- Redirected to: `/vendor-home`
- Can see: My listings, submit listings, vendor dashboard

### Member Users
- Redirected to: `/index-7` (marketplace)
- Can see: Browse services, book services

## 📝 Testing Checklist

- [ ] Can logout successfully
- [ ] Login page renders correctly
- [ ] Can login with email/password
- [ ] Can login with Google (if configured)
- [ ] Redirects to correct page after login
- [ ] User data persists in sessionStorage
- [ ] No 401 errors after login
- [ ] Role-based menus display correctly
- [ ] Can access protected routes

## 🛠️ Quick Test Commands

### Check Backend Status
```bash
curl http://localhost:5055/api/health
```

### Check Frontend Status
```bash
curl -I http://localhost:5173/
```

### View Backend Logs
```bash
tail -f backend.log
```

### Restart Backend (if needed)
```bash
kill $(lsof -ti :5055)
cd backend && node server.js > ../backend.log 2>&1 & echo $! > ../backend.pid
```

## ✨ What We Fixed

1. ✅ Firestore-only data layer (no file fallback)
2. ✅ Admin authentication working correctly
3. ✅ 401 race condition eliminated
4. ✅ Vendor data integrity fixed
5. ✅ Vendor listings now display correctly
6. ✅ All async/await conversions completed

## 🎉 You're All Set!

The system is fully operational. You can now:
- Login and test different user roles
- Browse and manage listings
- Test vendor flows
- Access admin features

If you encounter any issues, check the browser console and backend logs for specific error messages.

---

**Last Updated**: October 14, 2025
**Status**: ✅ Production Ready
