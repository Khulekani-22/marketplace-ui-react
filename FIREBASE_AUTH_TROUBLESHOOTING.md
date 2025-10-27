# 🚨 Firebase Authentication Troubleshooting

## The Error You're Seeing:
```
❌ Authentication failed: INVALID_LOGIN_CREDENTIALS
```

This means one of these issues:

---

## ✅ Solution Steps

### Step 1: Check if User Exists in Firebase

1. Go to **[Firebase Console](https://console.firebase.google.com)**
2. Select your project: **"firebase sloane hub"** (or your project name)
3. Click **Authentication** in the left sidebar
4. Click **Users** tab
5. Look for: `22onsloanedigitalteam@gmail.com`

**Is the user there?**
- ✅ **YES** → Go to Step 2 (Password issue)
- ❌ **NO** → Go to Step 3 (Create user)

---

### Step 2: Verify Password or Reset It

The password might be incorrect. Try these:

#### Option A: Reset Password
1. In Firebase Console → Authentication → Users
2. Find user: `22onsloanedigitalteam@gmail.com`
3. Click the **three dots (⋮)** on the right
4. Click **Reset password**
5. You'll get a link - open it and set a NEW password
6. Try the script again with the new password

#### Option B: Update Password via Console
1. Click the user in Firebase Console
2. Click **Reset password** or edit the user
3. Set a new password
4. Copy the new password
5. Try again

---

### Step 3: Create User if Doesn't Exist

If the user doesn't exist in Firebase:

1. Firebase Console → **Authentication** → **Users**
2. Click **Add user** button
3. Enter:
   - **Email**: `22onsloanedigitalteam@gmail.com`
   - **Password**: `#sloane22gEn` (or your preferred password)
4. Click **Add user**
5. ✅ User created!

---

### Step 4: Enable Email/Password Sign-in

Make sure Email/Password authentication is enabled:

1. Firebase Console → **Authentication**
2. Click **Sign-in method** tab
3. Look for **Email/Password**
4. Should say **"Enabled"**
5. If not:
   - Click **Email/Password**
   - Toggle **Enable**
   - Click **Save**

---

### Step 5: Check for Special Characters in Password

Your password has a `#` symbol which might cause issues in bash:

**Instead of:**
```bash
./scripts/get-firebase-token.sh 22onsloanedigitalteam@gmail.com #sloane22gEn
```

**Use quotes:**
```bash
./scripts/get-firebase-token.sh 22onsloanedigitalteam@gmail.com '#sloane22gEn'
```

Or set environment variable:
```bash
export FIREBASE_EMAIL="22onsloanedigitalteam@gmail.com"
export FIREBASE_PASSWORD="#sloane22gEn"
export FIREBASE_API_KEY="AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M"

./scripts/get-firebase-token.sh
```

---

## 🧪 Test Method: Direct curl Command

Try this to verify credentials work:

```bash
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "22onsloanedigitalteam@gmail.com",
    "password": "#sloane22gEn",
    "returnSecureToken": true
  }' | jq
```

**If this works**, you'll see:
```json
{
  "idToken": "eyJhbGc...",  // ← Your token!
  "email": "22onsloanedigitalteam@gmail.com",
  "refreshToken": "...",
  "expiresIn": "3600"
}
```

**If this fails**, you'll see an error message that tells us exactly what's wrong.

---

## 🎯 Alternative: Create a Test User

If you're having trouble with this account, create a simple test user:

1. Firebase Console → Authentication → Add user
2. Email: `test@example.com`
3. Password: `testpassword123` (simple, no special chars)
4. Try the script with test credentials:

```bash
./scripts/get-firebase-token.sh test@example.com 'testpassword123'
```

---

## 📞 Quick Checklist

Before running the script again, verify:

- [ ] User exists in Firebase Console → Authentication → Users
- [ ] Email/Password sign-in is enabled (Authentication → Sign-in method)
- [ ] Password is correct (or has been reset)
- [ ] User account is not disabled
- [ ] Special characters in password are properly quoted
- [ ] Firebase Web API Key is correct: `AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M`

---

## 🆘 Still Having Issues?

Try this diagnostic command:

```bash
# Test if Firebase Auth is working at all
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

This will tell us if your Firebase project is configured correctly.

---

## 💡 Once It Works

After fixing the issue, run:

```bash
export FIREBASE_EMAIL="22onsloanedigitalteam@gmail.com"
export FIREBASE_PASSWORD="#sloane22gEn"
export FIREBASE_API_KEY="AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M"

./scripts/get-firebase-token.sh
```

You should get your token! 🎉
