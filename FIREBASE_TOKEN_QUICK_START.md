# 🎯 Quick Start: Get Firebase Token in 60 Seconds

## The Fastest Way (Using our script):

```bash
# 1. Set your credentials
export FIREBASE_EMAIL="your-email@example.com"
export FIREBASE_PASSWORD="your-password"
export FIREBASE_API_KEY="your_firebase_web_api_key"

# 2. Run the script
./scripts/get-firebase-token.sh

# 3. Copy the token and paste it into Postman!
```

## Or Use This One-Liner (curl):

```bash
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword","returnSecureToken":true}' \
  | jq -r '.idToken'
```

## Get Your Firebase Web API Key:

1. Go to https://console.firebase.google.com
2. Click your project
3. Click ⚙️ **Project Settings**
4. Copy the **Web API Key** (under General tab)

## Use in Postman:

1. Open collection → **Variables** tab
2. Set `firebase_token` = `[paste your token]`
3. Save and test! ✅

## Token Expires?

Just run the script again! Tokens last 1 hour.

---

📚 **Full Documentation:** See [GET_FIREBASE_TOKEN.md](./GET_FIREBASE_TOKEN.md)
