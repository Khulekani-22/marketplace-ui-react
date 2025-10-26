# 🔐 Getting Firebase ID Token for Postman Testing

This guide shows you how to get a Firebase ID token to authenticate your Postman API requests.

## 📋 Quick Summary

A Firebase ID token is a JWT (JSON Web Token) that proves you're authenticated with Firebase. It expires after 1 hour and must be refreshed.

---

## 🚀 Method 1: Using the Token Helper Script (Easiest)

We've created helper scripts for you!

### Option A: Bash Script (Mac/Linux)

```bash
# Set your credentials
export FIREBASE_EMAIL="your-email@example.com"
export FIREBASE_PASSWORD="your-password"
export FIREBASE_API_KEY="your_web_api_key"

# Run the script
./scripts/get-firebase-token.sh
```

**Or pass credentials directly:**

```bash
./scripts/get-firebase-token.sh your-email@example.com your-password
```

### Option B: Node.js Script

```bash
# Install dependencies if needed
npm install firebase

# Run the script
node scripts/get-firebase-token.mjs your-email@example.com your-password
```

**The script will:**
- ✅ Sign you in to Firebase
- ✅ Get a fresh ID token
- ✅ Display the token clearly
- ✅ Show token expiry time (1 hour)
- ✅ Optionally save to `.env.firebase-token`

---

## 🌐 Method 2: Using Firebase REST API (No Dependencies)

### Step 1: Get Your Firebase Web API Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **⚙️ Project Settings**
4. Under **General** tab → Find **Web API Key**
5. Copy the key (looks like: `AIzaSyD...`)

### Step 2: Create a Postman Request

Create a new request in Postman or use this `curl` command:

```bash
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password",
    "returnSecureToken": true
  }'
```

### Step 3: Extract the Token

**Response:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",  // ← Copy this!
  "email": "your-email@example.com",
  "refreshToken": "AOEOulZ...",
  "expiresIn": "3600",
  "localId": "abc123..."
}
```

Copy the `idToken` value!

---

## 🖥️ Method 3: From Your React App (Browser Console)

If your app is running with Firebase Auth:

### Modern SDK (v9+):

```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  user.getIdToken(true).then(token => {
    console.log('🎫 Firebase Token:');
    console.log(token);
    
    // Copy to clipboard
    navigator.clipboard.writeText(token);
    alert('Token copied to clipboard! ✅');
  });
} else {
  console.log('No user signed in');
}
```

### Legacy SDK (v8):

```javascript
firebase.auth().currentUser.getIdToken(true)
  .then(token => {
    console.log('🎫 Firebase Token:', token);
    navigator.clipboard.writeText(token);
    alert('Token copied! ✅');
  });
```

**Steps:**
1. Open your React app in browser
2. Sign in with Firebase Auth
3. Open Developer Console (F12)
4. Paste the code above
5. Token is copied to clipboard!

---

## 📱 Method 4: Using Firebase CLI

```bash
# Login to Firebase
firebase login

# Get auth token
firebase login:ci

# Or use this to get user token
firebase auth:export --format=JSON
```

---

## 📝 Using the Token in Postman

### Option 1: Collection Variables (Recommended)

1. Open your Postman collection
2. Click **Variables** tab
3. Add/edit variable:
   - Variable: `firebase_token`
   - Initial Value: `[paste your token]`
   - Current Value: `[paste your token]`
4. Save the collection

Now all requests using `{{firebase_token}}` will work!

### Option 2: Environment Variables

1. Click **Environments** in Postman
2. Create/select an environment
3. Add variable:
   - Variable: `firebase_token`
   - Value: `[paste your token]`
4. Select this environment

### Option 3: Direct Authorization

For individual requests:
1. Go to **Authorization** tab
2. Type: **Bearer Token**
3. Token: Paste your ID token

---

## 🔄 Refreshing Expired Tokens

Firebase ID tokens expire after **1 hour**. When you get `401 Unauthorized`:

### Quick Refresh:

```bash
# Using our script
./scripts/get-firebase-token.sh

# Or using curl
curl -X POST \
  "https://securetoken.googleapis.com/v1/token?key=YOUR_WEB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 🧪 Testing Your Token

### Test 1: Health Check (No Auth Required)

```bash
curl http://localhost:5055/health/live
```

Should return: `{"status": "ok"}`

### Test 2: Authenticated Endpoint

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:5055/api/me
```

Should return your user profile.

### Test 3: In Postman

1. Import the collection: `Sloane_Marketplace_API_Complete.postman_collection.json`
2. Set `firebase_token` variable
3. Try the request: **REST API - Users → Get Current User**

---

## 🛠️ Troubleshooting

### Error: "Invalid API key"
- Check your `FIREBASE_API_KEY` is correct
- Get it from Firebase Console → Project Settings → Web API Key

### Error: "Email not found" / "Wrong password"
- Verify your credentials
- Make sure the user exists in Firebase Auth
- Check Firebase Console → Authentication → Users

### Error: "Token expired"
- Tokens expire after 1 hour
- Run the script again to get a fresh token
- Or use the refresh token to get a new ID token

### Error: "Authentication failed"
- Make sure Firebase Auth is enabled in your project
- Check that Email/Password sign-in is enabled
- Verify your user account is not disabled

---

## 📚 Additional Resources

### Where to Find Your Firebase Config:

1. **Web API Key**: Firebase Console → Project Settings → General → Web API Key
2. **Project ID**: Firebase Console → Project Settings → General → Project ID
3. **Auth Domain**: `{project-id}.firebaseapp.com`

### Firebase REST API Documentation:
- [Sign in with email/password](https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password)
- [Exchange refresh token](https://firebase.google.com/docs/reference/rest/auth#section-refresh-token)

### Postman Variables:
- [Using variables](https://learning.postman.com/docs/sending-requests/variables/)
- [Environment variables](https://learning.postman.com/docs/sending-requests/managing-environments/)

---

## 🎯 Quick Start Commands

```bash
# 1. Get your Firebase Web API Key from Firebase Console

# 2. Set environment variables
export FIREBASE_EMAIL="your-email@example.com"
export FIREBASE_PASSWORD="your-password"
export FIREBASE_API_KEY="AIzaSy..."

# 3. Run the token script
./scripts/get-firebase-token.sh

# 4. Copy the token to Postman
# 5. Start testing your API! 🚀
```

---

## 💡 Pro Tips

1. **Save your refresh token** - Use it to get new ID tokens without re-entering credentials
2. **Use environment variables** - Keep tokens out of your collection for security
3. **Automate token refresh** - Set up a Postman pre-request script to auto-refresh
4. **Test without auth first** - Try health endpoints to verify your API is running
5. **Check token expiry** - Decode your JWT at [jwt.io](https://jwt.io) to see expiry time

---

## 🔒 Security Notes

- ⚠️ **Never commit tokens to git** - Add `.env.firebase-token` to `.gitignore`
- ⚠️ **Don't share tokens** - Each developer should get their own
- ⚠️ **Use environment variables** - Don't hardcode in Postman collections
- ⚠️ **Rotate regularly** - Get fresh tokens, don't reuse old ones
- ⚠️ **Keep credentials secure** - Use environment variables for email/password

---

## 🎉 You're Ready!

You now have everything you need to authenticate with Firebase and test your API in Postman! 

**Next Steps:**
1. Get your token using one of the methods above
2. Set it in Postman as `firebase_token` variable
3. Start testing endpoints in the collection
4. Explore all 12 phases of the API platform!

Happy testing! 🚀
