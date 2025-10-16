# Backend Server Management

## Quick Start

### Start Backend Server (Simple)
```bash
npm run backend
```

### Start Backend Server (With PM2 - Recommended)
```bash
npm run backend:pm2
```

PM2 will keep the backend running in the background and automatically restart it if it crashes.

### Stop Backend Server
```bash
npm run backend:stop
```

### View Backend Logs
```bash
npm run backend:logs
# or
tail -f backend.log
```

### Restart Backend Server
```bash
npm run backend:restart
```

## Common Issues

### Issue: "Network error. Check your connection and try again"
**Cause**: Backend server on port 5055 is not running  
**Solution**: Start the backend server using `npm run backend` or `npm run backend:pm2`

### Issue: "Failed to redeem credits"
**Possible Causes**:
1. Backend server not running (see above)
2. Not authenticated (make sure you're logged in)
3. Insufficient credits in wallet

**Debug Steps**:
1. Check backend is running: `curl http://127.0.0.1:5055/api/lms/live`
2. Check backend logs: `tail -100 backend.log`
3. Check browser console for detailed error messages

### Issue: Backend keeps stopping
**Solution**: Use PM2 to keep it running automatically
```bash
npm run backend:pm2
```

## Development Workflow

### Running Both Frontend and Backend
Terminal 1:
```bash
npm run backend:pm2  # Start backend with PM2
```

Terminal 2:
```bash
npm run dev  # Start frontend (Vite)
```

### Viewing Logs
```bash
# Backend logs
npm run backend:logs

# Or directly
tail -f backend.log
```

## Ports
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Express)**: http://localhost:5055

## API Endpoints
- `/api/lms/live` - Get all app data from Firestore
- `/api/subscriptions/my` - Get user's subscriptions
- `/api/subscriptions/service` - Subscribe to a service
- `/api/wallets/me` - Get user's wallet
- `/api/wallets/me/redeem` - Redeem credits from wallet

All endpoints require Firebase authentication token.
