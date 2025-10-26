````markdown
# Marketplace UI (Vite + React)

## 📚 Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Quick Start Guide](./API_QUICK_START.md)** - Get started quickly
- **[OpenAPI Spec](./openapi.yaml)** - OpenAPI 3.0 specification
- **[Postman Collection](./postman_collection.json)** - Import into Postman

## Local Development

```bash
npm install
npm run dev
```

The dev server runs with HMR enabled. Update the values in a local `.env` file if you need to override the defaults from `vite.config.js` (for example `VITE_PROXY_TARGET` for API requests).

## Building Locally

```bash
npm run build
npm run preview
```

The production bundle is emitted to `dist/`.

## Deploying to Vercel

1. Commit and push the latest changes, including the provided `vercel.json` file.
2. In the Vercel dashboard, import the repository (or use `vercel` CLI) and pick the project root at `firebase sloane hub/ui/marketplace-ui-react`.
3. When prompted, keep the default build settings:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. If you rely on runtime configuration, add the required environment variables under **Project Settings → Environment Variables**. Remember that Vite only exposes variables that start with the `VITE_` prefix (for example `VITE_PROXY_TARGET`).
5. Trigger a deployment. The `vercel.json` rewrite rule ensures that client-side routing falls back to `index.html`, so deep links will work without additional configuration.

### Deploying With the Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

The first `vercel` call creates a preview deployment; `vercel --prod` promotes the latest build to production.

<--help Force deployment: Tue Oct  7 16:05:12 SAST 2025 -->
