# Resource Library — Loading Audit (Pass 1)

Source of truth for what the Blossom OS Resource Library catalog contains,
how it is loaded, where it renders, and what is intentionally excluded.

## Current implementation

- **Data**: `src/lib/resources/resourceData.ts` — static `resources: Resource[]`
  seed. No database table is wired up yet; UI consumes this list directly.
- **Routes that render resources**:
  - `/resource-library` → `src/pages/os/OSResourceLibrary.tsx` (canonical
    user-facing Resource Library).
  - `/sop` → redirects to `/resource-library`.
  - Department-scoped resource pages (read-only views into the same list):
    `src/pages/os/operations/OpsResourceLibrary.tsx`,
    `src/pages/os/executive/ExecResourceLibrary.tsx`,
    `src/pages/os/OSHRResources.tsx`,
    `src/pages/os/OSRecruitingResources.tsx`,
    `src/pages/os/OSPayrollResources.tsx`,
    `src/pages/os/OSBCBAResources.tsx`.
  - `src/pages/hr/ResourceManagement.tsx` — HR admin view.
- **Visibility helper**: `isVisibleToRole(resource, role, state)` in
  `resourceData.ts` (role-based + state-based filtering).
- **Training Academy linkage**: SOPs referenced by the State Director
  Training Academy are catalogued from `SD_SOPS_BY_WEEK` in
  `src/lib/training/academyData.ts`. Pass 1 generates one Resource entry
  per canonical SOP automatically.

## Categories

| ID | Name | Purpose |
| --- | --- | --- |
| `sops` | SOPs | Standard operating procedures |
| `workflows` | Workflows | End-to-end operational processes |
| `templates` | Templates | Documents, emails, message templates |
| `insurance` | Insurance Resources | Payer guides, VOB tools |
| `communication` | Communication Templates | Family/team scripts |
| `systems` | Systems & Software | Tools and platform references |
| `training` | Training Materials | Academy quick guides |
| `hr` | HR Resources | Handbooks, policies, benefits |
| `operational` | Operational Guides | Playbooks |
| `leadership` | Leadership Resources | Strategy & planning |

All ten core categories required by Pass 1 (SOPs, HR, Training, Insurance,
Systems, Workflows, Templates, Leadership, Operations, Communication) are
present.

## New fields (Pass 1)

Added to the `Resource` interface — all optional, no breaking changes:

- `resourceType`: `sop | handbook | template | workflow | guide | policy | checklist | training | reference`
- `sensitivity`: `public_internal | role_restricted | admin_only | excluded`
- `attachmentStatus`: `available | pending_upload | excluded`
- `sourceNote`: friendly label only (no sensitive local paths exposed in UI)

`isVisibleToRole` now also hides any resource with
`sensitivity: "excluded"`, `attachmentStatus: "excluded"`, or
`sensitivity: "admin_only"` (admin_only is still visible to `super_admin`).

## Loaded resource groups (Pass 1 expansion)

All seeded with `attachmentStatus: "pending_upload"` until the actual file
is wired up. The Resource Library detail panel renders pending entries as
a calm `Attachment pending` placeholder instead of a broken `href="#"`.

- **HR handbooks**: Employee Handbook, RBT Handbook, BCBA Handbook, State
  Director Handbook.
- **HR policies / forms**: HR Policies & Procedures, HR Forms & Templates,
  RBT Certification & Pay/Wage Guidance.
- **Recruiting**: Recruiting Workflow, Offer Letter Template, Recruiting
  Onboarding Checklist (plus existing Recruiting SOP and Phone Screen
  Script).
- **Scheduling**: CentralReach Scheduling Guide, Coverage Gap Management
  SOP (plus existing Scheduling Workflow and Pair-Up Guide).
- **Authorizations**: Utilization Management SOP, Payer Reference Guide
  (plus existing Authorization Renewal Checklist).
- **Intake / Insurance / VOB / EOB / Leads**: VOB/EOB Workflow, Lead
  Lifecycle Workflow (plus existing Intake Workflow SOP, Insurance Cheat
  Sheet, VOB Decision Guide, Family Communication Templates, Missing
  Information Checklist).
- **Phone system**: Phone System Operational Guide.
- **Training Academy**: Training Academy Operations SOP.
- **State Director onboarding & launch readiness**: State Director Launch
  Readiness Checklist, State Director Onboarding SOP.
- **Finance / billing / payroll (safe overviews)**: Billing Operations
  Overview, Payroll Operations Overview. No PII, no wage tables, no
  individual identifiers.
- **State Director SOP catalog**: One Resource entry per unique SOP listed
  in `SD_SOPS_BY_WEEK` (covers ~100 canonical SD SOPs across the 5-week /
  25-day journey). Each is `category: "sops"`, `resourceType: "sop"`,
  `attachmentStatus: "pending_upload"`, scoped to State Director,
  Operations Leadership, Executive Leadership, Super Admin.

## Pending vs. available counts

At any time you can introspect the current state by importing `resources`
and grouping by `attachmentStatus`. Pass 1 expectation:

- Available: the pre-existing seeded entries (intake, scheduling, etc.).
- Pending upload: every handbook, every department SOP, every State
  Director SOP, all launch/training docs above.
- Excluded: see below.

## Excluded resources (security)

The following are **never** surfaced through the standard Resource
Library, even when a user has admin privileges:

- Anything under `_Sensitive_Not_For_Shared_Context` (never ingested).
- Credential, password, login, portal-access, or vault-like documents.
- The existing `r-system-logins` "Systems & Logins Directory" entry is
  flagged `sensitivity: "admin_only"` + `attachmentStatus: "excluded"` and
  is filtered out by `isVisibleToRole` for non-super_admin roles. Its
  contents continue to live in an admin-only vault, not in the Resource
  Library.
- Any future system/logins directory (e.g. `Systems/Logins/`) should be
  excluded from normal seeding and tracked separately as vault-only.

## Training Academy ↔ Resource Library relationship

- The State Director Training Academy references SOPs by **name**
  (`SD_SOPS_BY_WEEK`). Each named SOP now has a corresponding Resource
  entry in the Resource Library (`r-sd-sop-…`), even if the attachment is
  still pending.
- Pending attachments do not block learner progress — `ModuleCard`
  already renders friendly "Attachment pending" copy and the Mark
  complete action is not gated on URL presence.
- When an SOP is published, the same `id` can be updated to set
  `url`/`fileUrl` and `attachmentStatus: "available"`; no other code
  needs to change.

## Missing / not yet covered

- Per-state SOPs are still represented at the company level. State-scoped
  overrides can be added later via the `states` field.
- A real database table (e.g. `library_resources`) replacing the static
  seed is out of scope for Pass 1 — no schema change required.
- A formal admin-only "Vault" surface for credentials / logins is
  intentionally not built; raise as a separate, scoped pass with explicit
  access-control design.

## Unchanged

- Existing routes (`/resource-library`, department resource pages) are
  untouched aside from the pending-attachment UI fix.
- RBAC behaviour is unchanged. The new visibility filter only hides
  resources that were already not meant to be exposed.