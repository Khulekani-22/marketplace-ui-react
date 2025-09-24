# Marketplace UI React - Developer Instructions

**ALWAYS** reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository

**Node.js Requirements:**
- Install Node.js version 18+ (tested with v20.19.5)
- Install npm version 8+ (tested with v10.8.2)

**Frontend Setup:**
- `cd /home/runner/work/marketplace-ui-react/marketplace-ui-react`
- `npm install` -- takes 20-30 seconds. May show deprecation warnings (safe to ignore).
- `npm run build` -- takes 15-20 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
- `npm run lint` -- takes 5-10 seconds. Shows many existing linting issues (not your responsibility to fix unless directly related to your task).

**Backend Setup:**
- `cd /home/runner/work/marketplace-ui-react/marketplace-ui-react/backend`
- `npm install` -- takes 10-15 seconds.
- `npm start` -- starts immediately on port 5000 (or 5001 if 5000 is busy).

### Run the Application

**Development Mode (recommended):**
1. **ALWAYS** run backend first:
   - `cd backend && npm start`
   - Confirms startup with message: "SCDM backend running on http://127.0.0.1:5000"
   - Backend serves API on port 5000 (or auto-increments to 5001, 5500 if busy)

2. **Then** run frontend:
   - `cd /home/runner/work/marketplace-ui-react/marketplace-ui-react && npm run dev`
   - Frontend serves on http://localhost:5173 with API proxy to backend
   - Shows message: "Local: http://localhost:5173/"

**Production Preview:**
- `npm run build` -- creates dist/ folder in ~15 seconds
- `npm run preview` -- serves built app on http://localhost:4173

### Environment Configuration

**Frontend (.env):**
- Copy `.env.example` to `.env` if needed
- `VITE_PROXY_TARGET=http://localhost:5000` -- points dev server proxy to backend

**Backend (.env):**
- Copy `backend/.env.example` to `backend/.env` if needed  
- `PORT=5000` -- backend server port
- `CORS_ORIGIN=http://localhost:5173` -- allows frontend dev server

## Validation

**MANUAL VALIDATION REQUIREMENT:**
- **ALWAYS** test complete user scenarios after making changes to ensure full functionality
- Navigate to http://localhost:5173 and verify the landing page loads with marketplace listings
- Click "Get Started" to test navigation to login page (/login)
- Verify tenant selector shows "vendor" option
- Test that listings display properly with categories and ratings
- **DO NOT** just start and stop the application - exercise real workflows

**Build Validation:**
- `npm run build` must complete successfully in ~15 seconds
- `npm run lint` will show existing issues but should not crash
- Backend `npm start` must start without errors

**Application Architecture:**
- Frontend: React 18 with Vite for development and building
- Backend: Express.js with file-based JSON storage (appData.json)
- UI Framework: Bootstrap 5 with custom styling
- State Management: React Context API (AppSyncContext)
- Routing: React Router v6
- Authentication: Firebase Auth integration

## Common Tasks

### Key Project Structure
```
/home/runner/work/marketplace-ui-react/marketplace-ui-react/
├── src/                          # React frontend source
│   ├── components/               # Reusable components
│   ├── pages/                    # Page components (80+ pages)
│   ├── masterLayout/             # Layout components (MasterLayout.jsx)
│   ├── context/                  # React context providers
│   └── App.jsx                   # Main app component
├── backend/                      # Express.js API server
│   ├── routes/                   # API route handlers
│   ├── middleware/               # Authentication, CORS, etc.
│   ├── appData.json              # Main data store
│   └── server.js                 # Main server file
├── public/                       # Static assets
├── dist/                         # Built frontend (after npm run build)
├── package.json                  # Frontend dependencies and scripts
├── vite.config.js                # Vite build configuration
└── eslint.config.js              # ESLint configuration
```

### Important Files and Locations
- **Main Layout:** `src/masterLayout/MasterLayout.jsx` (case sensitive!)
- **App Routes:** `src/App.jsx` - defines all application routes
- **API Server:** `backend/server.js` - Express server with all endpoints
- **Data Storage:** `backend/appData.json` - file-based data store
- **Environment Config:** `.env.example` and `backend/.env.example`
- **Frontend Config:** `vite.config.js` - includes proxy configuration to backend

### Build and Deployment Commands
- `npm run dev` -- start development server (frontend)
- `npm run build` -- build for production (~15 seconds)
- `npm run preview` -- preview production build
- `npm run lint` -- run ESLint (shows many existing issues)
- `backend/npm start` -- start backend server
- `backend/npm run dev` -- start backend with nodemon (auto-reload)

### Known Issues and Workarounds
- **Case Sensitivity:** Import paths are case-sensitive. Use `masterLayout/MasterLayout.jsx` not `MasterLayout/MasterLayout.jsx`
- **Linting:** Many existing linting issues in the codebase (487 errors, 26 warnings). Do not fix unless directly related to your task.
- **Backend Port:** Backend tries port 5000 first, then 5001, 5500 if busy
- **API Proxy:** Frontend dev server proxies `/api/*` requests to backend automatically
- **External Resources:** Some external image/font URLs may be blocked in development (safe to ignore)

### Testing Your Changes
1. **NEVER CANCEL** any build commands - they complete quickly (~15-20 seconds)
2. **ALWAYS** run full validation scenarios:
   - Start backend: `cd backend && npm start`
   - Start frontend: `npm run dev`
   - Navigate to http://localhost:5173
   - Test core functionality: browsing listings, navigation, login page
   - Verify no JavaScript errors in browser console (ignore external resource blocks)
3. **Run linting:** `npm run lint` - ensure no new errors introduced
4. **Test build:** `npm run build` - ensure build completes successfully

### Application Features Overview
The application is a marketplace platform called "22 ON SLOANE" featuring:
- **Landing Page:** Service listings with categories (Tech & Programming, SaaS, Business, Legal, Marketing, Video & Animation, Writing & Translation)
- **Authentication:** Login/signup with tenant selection (vendor/admin)
- **User Roles:** Vendor, Admin, Member with different permissions
- **Marketplace:** Browse, subscribe to, and review services
- **Vendor Tools:** Add listings, manage profiles, view analytics
- **Admin Tools:** User management, listing moderation, audit logs
- **LMS Integration:** Learning management system features
- **Multi-tenant:** Support for different organization contexts

### Time Expectations
- **Frontend npm install:** 20-30 seconds
- **Backend npm install:** 10-15 seconds  
- **Frontend build:** 15-20 seconds (NEVER CANCEL - set 120+ second timeout)
- **Backend startup:** 2-3 seconds
- **Frontend dev server startup:** 5-10 seconds
- **Linting:** 5-10 seconds

**CRITICAL REMINDERS:**
- **NEVER CANCEL** build or long-running commands
- **ALWAYS** validate changes with real user scenarios, not just start/stop
- **Case-sensitive imports** - use correct paths for masterLayout
- **Start backend before frontend** for proper API communication
- Reference these instructions first before exploring or searching