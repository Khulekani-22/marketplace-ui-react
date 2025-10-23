# Vercel Blank Screen Debug Checklist

If your React app builds successfully but displays a blank white screen on Vercel, use this checklist to debug:

## 1. Check for Runtime Errors
- Open browser dev tools (Console + Network tabs)
- Look for red errors, failed requests, or 404s
- Common issues: missing environment variables, API errors, CORS, or JS exceptions

## 2. Confirm Vercel Build Output
- Ensure Vercel is using the correct build command (`npm run build`)
- Check Vercel dashboard for build logs and deployment status
- Confirm `dist/` or `build/` folder is present in output

## 3. Validate Routing
- If using React Router, ensure Vercel is configured for SPA routing
- Add a `vercel.json` with:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- This ensures all routes serve `index.html` for client-side navigation

## 4. Check for Environment Variables
- Are required env vars set in Vercel dashboard?
- Missing or misconfigured env vars can break API calls and cause blank screens

## 5. Test Locally
- Run `npm run build` and `npx serve dist` (or `build`) locally
- Visit all routes to confirm no blank screens

## 6. Review API Endpoints
- If your app fetches data from `/api`, ensure Vercel is proxying or serving these endpoints
- Check for 404s or CORS errors in browser console

## 7. Check for SSR/CSR Mismatch
- If using SSR, ensure all required data is available at build time
- For CSR, ensure all assets are loaded correctly

## 8. Fallbacks and Error Boundaries
- Add error boundaries to catch rendering errors
- Add fallback UI for missing data or failed requests

---

**Next Steps:**
- Open browser dev tools on the Vercel deployment
- Share any error messages or failed network requests for targeted help
- Confirm if the issue is only on Vercel or also occurs locally
