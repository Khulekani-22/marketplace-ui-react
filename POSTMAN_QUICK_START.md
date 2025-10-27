# 🎯 POSTMAN TESTING - QUICK START

## Your Postman Collection
https://khulekani-22-1484809.postman.co/workspace/My-Workspace~d63ac943-fc58-4da6-b36b-83f09c0025db/collection/49552589-18690b8d-1718-4df2-8299-882d491c0c72

---

## ⚡ 3-Step Setup

### Step 1: Set Variables in Postman

1. Open your collection in Postman
2. Click **Variables** tab
3. Set these:
   - `base_url` = `http://localhost:5055`
   - `firebase_token` = `[Get from command below]`
4. **Save**

### Step 2: Get Your Firebase Token

```bash
python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com '#sloane@22gEn'
```

**Copy the token and paste it into the `firebase_token` variable in Postman!**

### Step 3: Start Testing!

#### Test 1: Health Check (No Auth)
- Folder: **Phase 12: Health & Monitoring**
- Request: **Liveness Probe**
- Click **Send**
- ✅ Should return: `{"status": "ok"}`

#### Test 2: Get Your Profile (With Auth)
- Folder: **REST API - Users**
- Request: **Get Current User**
- Click **Send**
- ✅ Should return your user info

#### Test 3: Get Services
- Folder: **REST API - Services**
- Request: **Get All Services**
- Click **Send**
- ✅ Should return list of services

---

## 🔧 Backend Server Status

**Note:** Your backend may need some import fixes. For now, test the endpoints that are working.

### If you need to start the backend:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/firebase\ sloane\ hub/ui/marketplace-ui-react
node backend/server.js
```

---

## 📚 Full Guide

See **POSTMAN_TESTING_GUIDE.md** for complete testing instructions for all 12 phases!

---

## 🆘 Quick Fixes

### "Connection Refused"
Server not running. Start it with command above.

### "401 Unauthorized"
Token expired. Get new token:
```bash
python3 scripts/get-firebase-token.py 22onsloanedigitalteam@gmail.com '#sloane@22gEn'
```

### "Network Error"
Check if server is on port 5055:
```bash
lsof -i:5055
```

---

**You're ready to test! Start with the 3 tests above.** 🚀
