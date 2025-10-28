# Current ESLint Warnings Triage

Last updated: 2025-10-28

The remaining lint warnings fall into a few predictable buckets. They are tracked here to clarify why they are still present and how we plan to resolve them.

## 1. Hook dependency warnings

- Files: `src/components/AdminWalletCreditsLayer.tsx`, `src/components/AdminWalletCreditsLayerNew.tsx`, `src/components/DeveloperPortal/ApiKeysManager.jsx`, `src/components/DeveloperPortal/UsageDashboard.jsx`, `src/components/MarketplaceDetailsLayer.tsx`, `src/components/OAuth/OAuthConsent.jsx`, `src/pages/AllDataTable.tsx`, `src/pages/Market1.tsx`, `src/pages/SloaneAcademyPage.tsx`, `src/pages/VendorDashboardPage.tsx`, `src/pages/VendorMyListings.tsx`
- Reason: Hooks intentionally omit dependencies to avoid re-fetch storms or rely on memoised callbacks that still need reshaping.
- Action: Refactor the relevant hooks to expose memoised callbacks (via `useCallback`) and effects that can safely include all dependencies. Each screen needs manual testing, so this is planned as a follow-up refactor.

## 2. Generated SDK stubs

- Files: `sdks/javascript/src/errors.ts`, `sdks/javascript/src/webhooks.ts`
- Reason: These files mirror the public SDK surface; unused parameters keep type compatibility with the backend. They should be linted with relaxed rules or auto-generated.
- Action: Consider moving sdk build output under a dedicated lint config or injecting inline eslint-disable comments for signature placeholders.

## 3. Legacy admin wallet layers

- Files: `src/components/AdminWalletCreditsLayer.tsx`, `src/components/AdminWalletCreditsLayerNew.tsx`, `src/components/AdminWalletCreditsLayerOld.tsx`, `src/components/shared/AdminWalletManager.tsx`, `src/components/shared/WalletComponents.tsx`
- Reason: These modules export helper constants alongside components for reuse; ESLint warns about Fast Refresh constraints and unused overloads.
- Action: Break helpers into separate utility files and re-export components only, or configure per-file disables once ownership is confirmed.

## 4. Context scaffolding

- Files: `src/context/*.tsx`
- Reason: Context providers expose helper functions that are wired in other bundles but unused in web-only scenarios. Keeping them available avoids breaking the API surface.
- Action: Revisit after the context consumption story stabilises. Optionally split shared types into dedicated files to remove React Fast Refresh complaints.

## 5. API layer warnings

- Files: `api/paymentRoutes.js`, `api/services/firestoreWalletService.js`, `api/test-firebase-connection.js`, `api/migrations/appDataToFirestore.js`
- Reason: Express error callbacks still include unused `err` arguments so function signatures match Node expectations; a few helper variables are placeholders for future options.
- Action: Convert to `_err` naming convention or rework handlers when revisiting the API. Safe to defer.

Keeping this list close to the codebase should help the next clean-up pass focus on the highest-value fixes.
