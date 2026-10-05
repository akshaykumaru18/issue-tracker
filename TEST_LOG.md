# Test log

Date: 2026-10-05

Project: `issue-tracker`

## Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test:coverage`
- `npm run analyze` (lint, typecheck, and coverage together)
- UI flow: `npm run test -- src/components/issues/IssueBoard.test.tsx`
- Page check: `curl http://localhost:3000` while `npm run dev` was running

## Results

- ESLint: pass
- TypeScript: pass
- Tests: 42 passed (8 files)
- Logic coverage for `src/lib/**/*.ts`: 100% statements (169/169), branches (85/85), functions (51/51), lines (147/147)
- HTML coverage report: `coverage/index.html`
- Dev server returned the tracker shell, including the "Issue tracker" heading, "New issue" button, and loading state

The in-IDE browser could not be driven (tool startup timed out). The create, search, update, filter, and delete flow was exercised in `IssueBoard.test.tsx` with happy-dom instead.

## Defects fixed

1. Invalid create initialized storage
   - `createLocalStorageIssueRepository` read storage before validation. On an empty store that read writes the seed, so a rejected draft still created browser data.
   - Validation now runs before the read. Covered by "does not write when a create is invalid or stored json cannot be parsed".

2. Typecheck failed on an invalid issue fixture
   - `as Issue` on a row with status `"closed"` produced TS2352.
   - The fixture now casts through `unknown`.

3. Vitest cleanup API
   - `vi.unstubGlobal` is not a Vitest 4 method (TS2551).
   - The browser-storage test uses `vi.unstubAllGlobals()`.

4. jsdom cannot start on Node v22.7.0
   - The worker failed with `ERR_REQUIRE_ESM` inside `@csstools/css-calc`.
   - The screen test runs under happy-dom. jsdom is not a direct dependency.

5. Turbopack root warning
   - Dev startup ignored a `package-lock.json` outside this repo.
   - `next.config.ts` sets `turbopack.root` to the project directory. After restart the warning was gone.

6. Issue cards put paragraphs inside buttons
   - Replaced with spans that use the `heading2` and `body2` classes, which keeps the card a valid button.

## Login API — 2026-10-05

Feature: JWT login, expiry 5 minutes (300 seconds).

### Commands

- Backend: `npm test` in `backend` (Jest coverage)
- Frontend: `npm run analyze` in `issue-tracker`
- Browser: `http://localhost:3000/login` against the API on port 4000

### Results

- Backend Jest: 5 passed. Statements 100%, branches 95%, functions 100%, lines 100%. `src/config/env.js` line 4 is the unused `PORT` fallback when `PORT` is already set. Not a defect.
- Frontend ESLint, TypeScript, and Vitest: pass. 52 tests. Logic coverage 97.35% statements, 95.06% branches, 100% functions, 99.55% lines.
- Browser: wrong password shows "Email or password is incorrect." Valid login stores a Bearer token with `exp - iat === 300` and `sub` `user-ada`. Reload keeps the signed-in screen. Sign out returns the form. The issue list still loads. At 390px the login page does not scroll sideways.

### Defects fixed

1. Restoring the session with `setState` inside an effect failed ESLint (`react-hooks/set-state-in-effect`).
   - The form now reads `sessionStorage` through `useSyncExternalStore`. A refresh shows a session that has not expired.

2. The browser-session unit used an expiry of 10:05 UTC, which was already past when the test ran, so `getBrowserSession()` returned null.
   - That case now uses an expiry in 2099.
