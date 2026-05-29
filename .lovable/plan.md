# User Management Rebuild — Blossom OS

Build a polished, Apple-inspired User Management module with a redesigned directory page and a 9-tab employee profile (Overview, Employment, Training Academy, Evaluations, Devices, Logins, NFC ID, Permissions, Activity).

## Scope

**In scope (frontend/presentation):**
- Redesigned User Management directory at `/os/users` (or refresh existing Team/Users page) with hero header, global search, filter rail, modern employee cards.
- New `EmployeeProfile` page with 9 tabs following the spec exactly.
- All tabs built as polished, calm, card-based UIs using existing design tokens.
- Wire to existing data sources where available (`useEmployeeDirectory`, `useLiveTeam`, training/evaluation/onboarding hooks). Where no data exists yet (Devices, Logins, NFC, Activity), render with realistic placeholder structures + empty states clearly marked, ready for backend wiring later.
- NFC public parent-facing view at `/nfc/:employeeCode` (branded, minimal, safe fields only) + employee-tap quick links view (when authenticated).

**Out of scope:**
- Backend tables for Devices/Logins/NFC/Activity (placeholder data only — user said "build this now" for NFC but didn't request schema; I'll stub data structures so we can layer DB later).
- Changes to permissions logic, role definitions, Training Academy journeys themselves, or evaluation engine.
- Viventium/CentralReach integrations (informational only).

## Files

**New:**
- `src/pages/os/users/UsersHome.tsx` — directory homepage
- `src/pages/os/users/EmployeeProfile.tsx` — profile shell + tab router
- `src/pages/os/users/tabs/OverviewTab.tsx`
- `src/pages/os/users/tabs/EmploymentTab.tsx`
- `src/pages/os/users/tabs/TrainingTab.tsx`
- `src/pages/os/users/tabs/EvaluationsTab.tsx`
- `src/pages/os/users/tabs/DevicesTab.tsx`
- `src/pages/os/users/tabs/LoginsTab.tsx`
- `src/pages/os/users/tabs/NfcTab.tsx`
- `src/pages/os/users/tabs/PermissionsTab.tsx`
- `src/pages/os/users/tabs/ActivityTab.tsx`
- `src/pages/nfc/NfcPublicProfile.tsx` — parent-tap view
- `src/components/os/users/EmployeeCard.tsx`
- `src/components/os/users/SetupChecklist.tsx`
- `src/components/os/users/SnapshotCards.tsx`

**Edited:**
- `src/App.tsx` — add routes: `/os/users`, `/os/users/:employeeId`, `/nfc/:code`
- Sidebar nav (`OSShell.tsx`) — point "Users" to new `/os/users`

## Design

- White/near-white surfaces, hairline borders (`border-border/70`), `rounded-2xl`, soft shadows.
- Single primary accent for CTAs only.
- 40px between major sections, 24px inside cards.
- Status badges use semantic tone (success/warning/destructive).
- Tabs use a sticky pill nav; profile header stays fixed at top with avatar + name + role + quick actions.
- Empty states are friendly single-line messages with one ghost action.

## Data wiring

- Pull employees via `useEmployeeDirectory` (existing hook).
- Training: hook into `useOnboardingStatus` / journey overrides for progress %.
- Evaluations: link to existing evaluation tables if reachable; otherwise show "No evaluations yet" empty state.
- Devices/Logins/NFC/Activity: render with typed placeholder arrays + "Coming soon — connect device inventory" hint where appropriate. NFC tab generates a profile URL pattern (`/nfc/{employeeCode}`) and shows QR placeholder.

## Acceptance

- `/os/users` shows polished employee grid with working search + filters.
- Clicking a card opens `/os/users/:id` with all 9 tabs rendering without errors.
- NFC public URL renders a branded, safe-fields-only parent view.
- No raw color classes; uses semantic tokens only.
- Responsive down to mobile.
