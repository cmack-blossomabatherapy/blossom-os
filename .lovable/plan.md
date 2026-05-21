## Goal

Make the OS routes live at the root path. `/os/state-director` becomes `/state-director`, `/os/reports` becomes `/reports`, etc. `/` becomes the OS dashboard. The `/os/*` URLs keep working as permanent redirects so existing links and bookmarks don't break.

## Scope

- Re-mount every `/os/...` route in `src/App.tsx` at the equivalent root path (`/state-director`, `/reports`, `/training`, `/user-management`, all coming-soon, placeholder, marketing, AI, calendar, scheduling, etc. routes — ~60 routes total).
- `/` renders `OSDashboard` inside the `OSOutlet` shell (replacing today's `Navigate to="/os"`).
- Add a catch-all redirect: any inbound `/os/*` URL 301-style redirects to the same path without the `/os` prefix (via a single `<Route path="/os/*" element={<OsPrefixRedirect />} />`).
- Update internal link generators so the sidebar, role-home logic, and permissions point to the new paths:
  - `src/lib/os/roleHome.ts` — role → landing path map
  - `src/lib/os/permissions.ts` — permission → path map
  - `src/pages/os/OSShell.tsx` — sidebar nav hrefs and the active-route matcher
  - `src/pages/os/OSPermissions.tsx` and `src/pages/os/reports/ReportDetail.tsx` — any hardcoded `/os/...` links
- Legacy non-OS routes that already live at root (`/academy`, `/profile`, `/admin/*`, `/onboarding/*`, `/auth`, `/reset-password`, etc.) stay exactly where they are. The `AppLayout` shell is no longer the default — it only renders for those legacy routes.
- The legacy-dashboard redirects added last round (`/leadership-dashboard`, `/intake-dashboard`, etc.) get retargeted to the new root paths (`/state-director`, `/reports/bcba-performance`, …).

## Out of scope

- No changes to page contents, data, auth, RLS, or the State Director hero.
- No file deletions; `WelcomeHome`, old dashboards, and the legacy `AppLayout` stay on disk for the redirect targets that still need them (none after this change for OS, but kept for safety).
- No sidebar redesign — only href values change.

## Technical notes

- Implementation is a single `App.tsx` rewrite of the OS `<Route>` block: strip `/os` from every `path=`, keep the element, keep them all nested inside the `OSOutlet` protected route. Add `<Route path="/os/*" element={<Navigate to={location.pathname.replace(/^\/os/, '') || '/'} replace />} />` (wrapped in a small component to read `useLocation`).
- For the sidebar, replace the hardcoded `/os/...` strings with a small `osPath(slug)` helper or just remove the prefix in `OSShell.tsx`. Same surgical edit in `roleHome.ts` and `permissions.ts`.
- Confirm there's no collision between an OS route and a legacy root route. `OSDashboard` takes over `/`, so the existing `/` (which already redirects to `/os`) is replaced. No other collisions today: legacy uses `/academy`, `/my-learning`, `/catalog`, `/announcements`, `/profile`, `/notification-preferences`, `/admin/*`, `/onboarding/*` — none of which exist under `/os/*`.
- Test path after build: visit `/`, `/state-director`, `/reports/bcba-performance`, `/training`, `/user-management`, then `/os/state-director` to confirm the redirect.
