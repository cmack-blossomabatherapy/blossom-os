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

| # | Path | Pass 6A status | **Pass 6B decision** | Target (if redirected) | Reason |
|---|------|----------------|----------------------|------------------------|--------|
| 1  | `/credentialing`      | Hidden from nav | **direct-only placeholder** | — | May become a real Credentialing module (clinical staff + provider credentialing). No existing canonical home — do not redirect. |
| 2  | `/employee-ops`       | Hidden from nav | **direct-only placeholder** | — | Drill-ins from State Director KPIs land here. Needs product decision before folding into HR Suite. Keep route as a stable target. |
| 3  | `/billing`            | Hidden from nav | **redirect** | `/billing-finance` | Real billing surface already lives at `/billing-finance`; push deep links already target it. No distinct billing module planned. |
| 4  | `/revenue`            | Hidden from nav | **redirect** | `/billing-finance` | Revenue analytics is covered by the Finance Dashboard today. No distinct revenue module. |
| 5  | `/insurance`          | Hidden from nav | **redirect** | `/authorizations` | Payer / insurance tracking is currently surfaced through Authorizations + VOB. No standalone insurance workspace. |
| 6  | `/workflows`          | Hidden from nav | **direct-only placeholder** | — | Workflow Engine is a platform concept with no canonical workspace yet. Drill-ins from State Director KPIs must keep resolving. |
| 7  | `/analytics`          | Not in nav | **redirect** | `/reports` | Reports Center is the canonical analytics home. State Director KPI drill-ins ("Open State Benchmarks") now land in Reports. |
| 8  | `/tech-requests`      | Hidden from nav | **needs product decision** | — | Belongs in HR Suite or a future Internal Ops module; do not redirect blindly. |
| 9  | `/internal-requests`  | Hidden from nav | **needs product decision** | — | Same as above. |
| 10 | `/open-issues`        | Hidden from nav | **direct-only placeholder** | — | State Director KPI drill-ins target this path. Keep route stable until Internal Ops is scoped. |
| 11 | `/projects`           | Not in nav | **needs product decision** | — | Internal projects module is not scoped. |
| 12 | `/ai/assistant`       | Visible in nav | **keep visible** | — | Canonical landing for every "Ask Blossom AI" CTA across the app. `OSComingSoon` is intentional. |
| 13 | `/ai/automations`     | Hidden from nav | **redirect** | `/automations` | The real Automations page already exists at `/automations`. |
| 14 | `/ai/predictive`      | Hidden from nav | **direct-only placeholder** | — | No existing predictive-alerts surface to redirect to. |
| 15 | `/ai/workflows`       | Hidden from nav | **direct-only placeholder** | — | No existing AI-workflow surface to redirect to. |
| 16 | `/state-management`   | Hidden from nav | **direct-only placeholder** | — | Multi-state setup module needs design before redirecting. |

### Decision legend

- **direct-only placeholder** — route still resolves to `OSPlaceholder`; hidden from primary nav; reachable via direct URL / drill-ins.
- **redirect** — route now `<Navigate to="…" replace />` to the canonical workspace.
- **keep visible** — left in primary nav, no behavior change.
- **needs product decision** — direct-only for now; should not be linked from anywhere until the product call is made.
- **ready for buildout** — placeholder is the next slot to build into a real workspace (none in this pass).

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

---

## 6 · Code changes shipped in Pass 6B

- `src/App.tsx` · converted 5 placeholder routes into redirects:
  - `/billing` → `/billing-finance`
  - `/revenue` → `/billing-finance`
  - `/insurance` → `/authorizations`
  - `/analytics` → `/reports`
  - `/ai/automations` → `/automations`
- `src/test/placeholderRoutes.test.ts` · updated to verify redirects, direct-only placeholders, and canonical routes.

No components were deleted. No permissions were changed. `/ai/assistant` remains visible in the primary OS sidebar. Hidden placeholder paths from Pass 6A remain hidden.