# Blossom OS — Placeholder / Coming-Soon Route Inventory

Generated: Cleanup Pass 6A · Placeholder Governance Inventory.

This document inventories every route that currently renders incomplete /
placeholder / coming-soon content, plus reusable placeholder UI primitives
used elsewhere in the app. **No routes or components have been deleted.**

Code changes in this pass are limited to hiding clearly-placeholder routes
from the primary OS sidebar (`src/pages/os/OSShell.tsx` → `DEFAULT_SECTIONS`).
The routes themselves remain reachable by direct URL so deep links, drill-ins,
and saved bookmarks keep working.

---

## 1 · Placeholder routes rendered via `OSPlaceholder` / `OSComingSoon`

All routes below are declared in `src/App.tsx` (lines 603–655) and render
the shared placeholder shells `src/pages/os/OSPlaceholder.tsx` and
`src/pages/os/OSComingSoon.tsx`.

| # | Path | Component | Source (route) | Nav visibility | Business area | Recommendation | Reason |
|---|------|-----------|----------------|----------------|---------------|----------------|--------|
| 1 | `/credentialing` | `OSPlaceholder` (Credentialing) | `src/App.tsx:603` | OSShell `Clinical Staff` (`OSShell.tsx:86`) | Clinical Staff / Credentialing | **Hide from nav** | Stub page; not yet built. Removed from OS sidebar — route still reachable. |
| 2 | `/employee-ops` | `OSPlaceholder` (Employee Operations) | `src/App.tsx:604` | OSShell `Clinical Staff` (`OSShell.tsx:87`); also drilled to from `data/stateDirectorReports.ts` | HR / Employee Ops | **Hide from nav** | Stub; drill-ins from state director KPIs left intact (they navigate by URL). |
| 3 | `/billing` | `OSPlaceholder` (Billing) | `src/App.tsx:609` | OSShell `Financial Operations` (`OSShell.tsx:126`) | Finance / Billing | **Hide from nav** | Real billing surface is `/billing-finance`. Push deep link in `lib/push/sanitizeDeepLink.ts` already targets `/billing-finance`. |
| 4 | `/revenue` | `OSPlaceholder` (Revenue Analytics) | `src/App.tsx:611` | OSShell `Financial Operations` (`OSShell.tsx:128`) | Finance / Analytics | **Hide from nav** | Stub; covered by Reports + Finance Dashboard today. Revisit when revenue analytics is scoped. |
| 5 | `/insurance` | `OSPlaceholder` (Insurance Tracking) | `src/App.tsx:612` | OSShell `Financial Operations` (`OSShell.tsx:129`) | Finance / Insurance | **Hide from nav** | Stub; payer / insurance tracking is currently surfaced through Authorizations + VOB. |
| 6 | `/workflows` | `OSPlaceholder` (Workflow Center) | `src/App.tsx:632` | OSShell `Operations & Intelligence` (`OSShell.tsx:95`); drilled to from state director KPIs | Operations / Workflow Engine | **Hide from nav** | Concept exists at platform level; surface is not yet built. |
| 7 | `/analytics` | `OSPlaceholder` (Analytics Hub) | `src/App.tsx:636` | Not in primary nav; drilled to from state director KPIs (`data/stateDirectorReports.ts:255`) | Intelligence | **Keep visible** (not in nav) | Already not in sidebar. Existing drill-ins are fine while we decide the canonical analytics home. |
| 8 | `/tech-requests` | `OSPlaceholder` (Tech Requests) | `src/App.tsx:637` | OSShell `Internal Operations` (`OSShell.tsx:134`) | Internal Ops | **Hide from nav** | Stub. |
| 9 | `/internal-requests` | `OSPlaceholder` (Internal Requests) | `src/App.tsx:638` | OSShell `Internal Operations` (`OSShell.tsx:135`) | Internal Ops | **Hide from nav** | Stub. |
| 10 | `/open-issues` | `OSPlaceholder` (Open Issues) | `src/App.tsx:639` | OSShell `Internal Operations` (`OSShell.tsx:136`); drilled to from state director KPIs | Internal Ops | **Hide from nav** | Stub; keep drill-ins working. |
| 11 | `/projects` | `OSPlaceholder` (Project Tracking) | `src/App.tsx:640` | Not in any nav surface | Internal Ops | **Keep visible** (not in nav) | Already invisible. Needs product decision before nav placement. |
| 12 | `/ai/assistant` | `OSComingSoon` (Ask Blossom AI) | `src/App.tsx:641` | OSShell `AI & Automations` + many in-page CTAs (Authorizations, BCBA, QA, Recruiting, Payroll, Resource Library, Academy) | AI / Operational Copilot | **Keep visible** — needs product decision | Heavily integrated as the target for every "Ask Blossom AI" CTA across working pages. The page itself is `OSComingSoon`, which is intentional — it's the published landing for the upcoming assistant. Do not hide. |
| 13 | `/ai/automations` | `OSPlaceholder` (Automation Center) | `src/App.tsx:644` | OSShell `AI & Automations` (`OSShell.tsx:143`) | AI / Automation | **Hide from nav** | Stub; `/automations` already exists for the working automations page. |
| 14 | `/ai/predictive` | `OSPlaceholder` (Predictive Alerts) | `src/App.tsx:645` | OSShell `AI & Automations` (`OSShell.tsx:144`) | AI / Alerts | **Hide from nav** | Stub. |
| 15 | `/ai/workflows` | `OSPlaceholder` (AI Workflows) | `src/App.tsx:646` | OSShell `AI & Automations` (`OSShell.tsx:145`) | AI / Workflows | **Hide from nav** | Stub. |
| 16 | `/state-management` | `OSPlaceholder` (State Management) | `src/App.tsx:655` | OSShell `System` (`OSShell.tsx:163`) | Admin / Multi-state | **Hide from nav** | Stub; multi-state setup not yet built. |

---

## 2 · Pages that are "real" but contain coming-soon sub-surfaces

These pages are working and should **not** be hidden, but contain
coming-soon scaffolding worth tracking.

| Path | File | What's coming soon | Recommendation |
|------|------|--------------------|----------------|
| `/catalog` | `src/pages/TrainingCatalog.tsx` | Whole page is a "no live courses yet" empty state | **Keep visible** — intentional empty state during Academy rollout |
| `/my-learning` | `src/pages/MyLearning.tsx` | "Live trainings are coming soon" panel | **Keep visible** — working page |
| `/hr/notifications` | `src/pages/hr/NotificationSettings.tsx` | Some categories rendered as "coming soon" | **Keep visible** |
| `/blossom/departments/:id` | `src/pages/blossom/DepartmentDetail.tsx` | "Team list coming soon" subsection | **Keep visible** |
| Onboarding video intros | `src/components/onboarding/VideoIntroCard.tsx` | Branded "coming soon" placeholder when video missing | **Keep** — intentional graceful fallback |
| HR Employee Profile tabs | `src/components/hr/profile/PlaceholderTab.tsx` used in `src/pages/hr/EmployeeProfile.tsx` | Tabs gated by permission render a "no access" placeholder; "Communication Timeline" reserved for Phase 4 | **Keep** — these are permission states, not stubs |
| Many OS workspaces | `OSAuthorizations`, `OSAuthRiskCenter`, `OSClientsOperations`, `OSPayrollAdjustments`, etc. | Some toolbar buttons toast "— coming soon" (Saved views, Export, New) | **Keep visible** — pages are real; individual buttons are scoped follow-ups |
| Role scorecards | `src/components/scorecards/RoleScorecardPlaceholder.tsx` | Empty-state KPI scorecard for roles whose KPIs aren't defined yet | **Keep** — intentional empty state |
| Case Manager surfaces | `src/pages/os/case-manager/CaseManagerComingSoon.tsx` and `pages.tsx` | `CMCommunityReferrals`, `CMResources` render `CaseManagerComingSoon` shell | **Keep visible** — Case Manager role rollout is in progress; these are role-scoped, not in primary nav |

---

## 3 · Sidebar items wired to `path: "#"` ("Coming Soon" placeholders)

These items are already shown as disabled "Soon" pills in the sidebar; no
route exists yet. They serve as navigation signposts and should remain.

- `src/pages/os/OSShell.tsx:371`, `:463`, `:521`, `:553` — `"Training (Coming Soon)"`
- `src/components/layout/AppSidebar.tsx:444`, `:479`, `:541`, `:594`, `:642` — `"Ask Blossom AI (Coming Soon)"`
- `src/components/layout/AppSidebar.tsx:660` — `"Training (Coming Soon)"`
- `src/components/layout/AppSidebar.tsx:272` — adds `(Coming Soon)` suffix when an item is AI-scoped

These are intentional and visibly marked. **No action.**

---

## 4 · Recommended cleanup order after this pass

1. **Pass 6B (next):** Decide canonical home for `/credentialing`, `/employee-ops`, and `/insurance`. Likely candidates: fold credentialing into Recruiting / HR Compliance, fold employee-ops into HR Workspace, fold insurance into Authorizations + VOB.
2. **Pass 6C:** Decide if `/billing`, `/revenue`, `/analytics` survive at all, or should redirect to `/billing-finance` and `/reports`.
3. **Pass 6D:** Replace `/ai/automations`, `/ai/predictive`, `/ai/workflows` with the real AI surfaces once scoped, or fold into `/automations`.
4. **Pass 6E:** Once `/ai/assistant` ships, swap `OSComingSoon` for the real `OSAskBlossom` page.
5. **Pass 6F:** Decide whether `/internal-requests`, `/tech-requests`, `/open-issues`, `/projects` belong in HR Suite, a future Internal Ops module, or get retired.
6. **Pass 6G:** Delete `OSPlaceholder` and its 13 routes once each has a real destination or redirect.

---

## 5 · Code changes shipped in Pass 6A

- `src/pages/os/OSShell.tsx` · removed 13 placeholder items from `DEFAULT_SECTIONS`. Routes still resolve directly. Sections that became empty are auto-filtered by existing render logic (`sections.filter((s) => s.items.length > 0)` at `OSShell.tsx:559`).
- `src/test/placeholderRoutes.test.ts` · new test verifying (a) placeholder routes still exist in `App.tsx`, (b) hidden placeholder paths no longer appear in `OSShell.tsx` `DEFAULT_SECTIONS`, (c) canonical routes from prior passes still resolve.

No components were deleted. No permissions were changed. No legacy redirect routes were touched.