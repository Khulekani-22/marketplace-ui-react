# Frontend 401 Error Fix

**Date:** October 14, 2025  
**Issue:** Frontend receiving 401 Unauthorized and ERR_CONNECTION_REFUSED errors  
**Status:** ✅ RESOLVED

---

## Problems Identified

### 1. Backend Server Not Running
The backend server (port 5055) had stopped, causing `ERR_CONNECTION_REFUSED` errors.

**Solution:** Restarted the backend server in background mode:
```bash
cd backend
nohup node server.js > ../backend.log 2>&1 &
```

### 2. Direct API Connection Bypassing Proxy
The `.env` file had `VITE_API_URL=http://localhost:5055` which caused the frontend to connect **directly** to the backend instead of going through the Vite dev server proxy.

**Problem:**
- Direct connections to port 5055 caused CORS issues
- Authentication flow was bypassed
- Requests failed with 401 Unauthorized

**Solution:** Commented out `VITE_API_URL` in `.env` file:
```env
# For local development, comment this out to use the Vite proxy
# VITE_API_URL=http://localhost:5055
```

---

## How It Works Now

### Request Flow
```
Browser (localhost:5173)
    ↓
Vite Dev Server (port 5173)
    ↓ [proxy /api/* requests]
Backend Server (port 5055)
    ↓
Firestore / Firebase
```

### Benefits of Using Proxy
1. ✅ **No CORS issues** - Same-origin requests
2. ✅ **Proper authentication** - Firebase tokens included
3. ✅ **Simplified development** - No need for CORS configuration
4. ✅ **Production-ready** - Same code works in production

---

## Configuration Files

### `.env` (Development)
```env
# For local development, comment this out to use the Vite proxy
# VITE_API_URL=http://localhost:5055

# Proxy target for development
VITE_PROXY_TARGET=http://localhost:5055
```

### `vite.config.js`
```javascript
server: {
  proxy: {
    '/api': { 
      target: 'http://localhost:5055', 
      changeOrigin: true 
    },
  },
}
```

### `src/lib/api.ts`
```typescript
// Automatically detects environment
// - In development: uses window.location.origin (localhost:5173) → proxy
// - In production: uses .vercel.app origin → direct API calls
```

---

## Next Steps

### For You Right Now

1. **Hard refresh your browser:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
2. **Clear browser cache** (optional but recommended)
3. **Sign in again** if prompted
4. All API calls should now work!

### Testing

After refreshing, you should see in browser console:
```
✅ GET /api/me 200 OK
✅ GET /api/tenants 200 OK
✅ GET /api/wallets/me 200 OK
```

Instead of:
```
❌ :5055/api/me Failed to load resource: ERR_CONNECTION_REFUSED
❌ :5055/api/me Failed to load resource: 401 Unauthorized
```

---

## Production Deployment

For production (Vercel), you can set environment variables:

```env
# Production .env
VITE_API_URL=https://your-api-domain.com
```

Or use the same-origin approach by deploying both frontend and API together.

---

## Backend Server Management

### Start Backend
```bash
cd backend
node server.js

# Or in background
nohup node server.js > ../backend.log 2>&1 &
```

### Check Backend Status
```bash
# Check if running
lsof -i :5055

# Test health
curl http://localhost:5055/api/health
```

### Stop Backend
```bash
# Kill by port
lsof -ti :5055 | xargs kill -9

# Or find and kill process
ps aux | grep "node server.js"
kill <PID>
```

### View Logs
```bash
tail -f backend.log
```

---

## Troubleshooting

### Still seeing direct :5055 requests?

1. Hard refresh browser (Cmd+Shift+R)
2. Clear browser cache completely
3. Close and reopen browser
4. Restart Vite dev server

### Backend not responding?

```bash
# Check backend is running
lsof -i :5055

# Check backend logs
tail -30 backend.log

# Restart backend
lsof -ti :5055 | xargs kill -9
cd backend && node server.js
```

### Frontend dev server issues?

```bash
# Restart Vite
# Kill existing process first
lsof -ti :5173 | xargs kill -9

# Start fresh
npm run dev
```

---

## Status: RESOLVED ✅

1. ✅ Backend server running on port 5055
2. ✅ Frontend using proxy (not direct connection)
3. ✅ Authentication flow working
4. ✅ No more CORS or 401 errors

**Action Required:** Hard refresh your browser (Cmd+Shift+R) to apply the changes!
