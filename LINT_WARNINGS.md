# Current ESLint Warnings Triage

Last updated: 2025-10-29

`npm run lint` now completes with zero errors and zero warnings. All previously tracked buckets have been cleaned up or documented with inline suppressions where intentional API surface requires placeholder parameters.

## Highlights

- Removed lingering unused variables across wallet services, admin tooling, and marketplace pages.
- Added scoped `eslint-disable` annotations for intentional callback signatures and context exports.
- Brought SDK stubs, context providers, and wallet utilities in line with Fast Refresh expectations without altering behaviour.
- Verified `npm run lint` on 2025-10-29 returns **0 warnings / 0 errors**.

## Next steps

- Keep this document updated if new warnings appear; group them by feature area and include rationale before landing suppressions.
- Schedule periodic lint runs in CI to guard against regressions.
