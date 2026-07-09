# Plan: Live Org Chart + Company Home

## 1. Live Org Chart — make it work, not "coming soon"

The route `/org-chart` already renders `src/pages/os/org/OrgChartPage.tsx` (React Flow, backed by the existing `org_chart_nodes` table). The "coming soon" feel comes from (a) role-guard bounces on roles not in the allow list and (b) an empty table on first load.

Fixes:
- **Open access to view** — expand the `PermissionRoute` allow list on `/org-chart` in `src/App.tsx` so every authenticated role can view (read-only). Editing stays limited to `super_admin`, `admin`, `systems_admin`, `hr_team`, `hr_lead` (matches `EDITOR_ROLES` in the page).
- **Better empty state** — replace "No one on the chart yet" with a real onboarding block: "Build your org chart" + primary CTA "Add first person" for editors, and a calm "Your HR team hasn't set this up yet" for viewers.
- **Seed helper** — add an "Import from Employees" button (editors only) that pulls active rows from `employees` + `hr_departments` and inserts a starter set into `org_chart_nodes` with auto-laid-out positions, so HR can get a real chart in one click instead of adding people one by one.
- **Sidebar/menu link** — make sure every leadership role menu in `src/lib/os/roleMenus.ts` points to `/org-chart` (already true for Exec/Ops/HR; add for State Director + Clinical Director so they can view).
- **Remove stale "coming soon" copy** on the Org Chart tile if any surfaces show it (spot-check `AppSidebar.tsx` `comingSoon` flag for org chart — clear it).

No schema changes needed — `org_chart_nodes` already exists with 14 columns and 4 policies.

## 2. Company Home — calendar + updates + highlights

New page at `/home` that becomes the default post-login landing.

### UI (single page, three calm sections)
- **Hero:** Company logo/name, today's date, one-line "What's happening at Blossom today."
- **Company Calendar (left, 60%):** Month grid + upcoming list. Click a day to see events. Categories: Holiday, Company Event, Training, PTO Block, Deadline. Color-coded chips.
- **Updates (right, 40%):** Reverse-chronological company updates (title + short body + author + posted date). Pinned updates stick to top.
- **Highlights strip (bottom):** Horizontal cards for shout-outs / wins / new hires (title, short blurb, optional photo).

Blossom OS design system: glass cards, `rounded-2xl`, hairline borders, one primary accent, generous spacing.

### HR admin panel
New page at `/home/manage` (gated to `hr_team`, `hr_lead`, `super_admin`, `admin`, `systems_admin`):
- Tabs: Calendar / Updates / Highlights.
- Simple create/edit/delete forms per tab (title, date/date range, body, category, pin, publish toggle).
- Reachable from a small "Manage" button on the Company Home for authorized users.

### Post-login landing
- Change `ROLE_HOME` in `src/lib/os/roleHome.ts` so every role lands on `/home` by default (keep the current role dashboards as second-click destinations from the sidebar). Super Admin keeps `/dashboard/legacy` if we want power-user landing — will confirm during build if it should also route to `/home`.

### Data model — one migration

```sql
create table public.company_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'company_event',   -- holiday | company_event | training | pto_block | deadline
  starts_on date not null,
  ends_on date,
  all_day boolean not null default true,
  location text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_name text,
  pinned boolean not null default false,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_highlights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_url text,
  link_url text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Grants + RLS (same pattern for all three):
- `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL ... TO service_role;`
- Enable RLS.
- Policies:
  - SELECT: any authenticated user (published only for updates/highlights; all rows for calendar).
  - INSERT/UPDATE/DELETE: `has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'systems_admin') OR has_role(auth.uid(),'hr_lead') OR has_role(auth.uid(),'hr_team')`.

### Files to add / edit

- `supabase/migrations/<ts>_company_home.sql` — three tables + grants + RLS.
- `src/pages/os/home/CompanyHome.tsx` — the landing page.
- `src/pages/os/home/CompanyHomeManage.tsx` — HR admin panel (tabs for events/updates/highlights).
- `src/hooks/useCompanyCalendar.ts`, `useCompanyUpdates.ts`, `useCompanyHighlights.ts` — thin data hooks (Supabase select + realtime channel).
- `src/App.tsx` — add `/home` and `/home/manage` routes; widen `/org-chart` view allow list.
- `src/lib/os/roleHome.ts` — set every role's home to `/home`.
- `src/pages/os/org/OrgChartPage.tsx` — improved empty state + "Import from Employees" action.
- `src/lib/os/roleMenus.ts` — ensure "Company Home" tops each role's menu; add Org Chart link for State/Clinical Director menus.
- Small test: `src/test/companyHomeAndOrgChart.test.ts` verifying routes exist, `/home` is role home for all roles, and org chart page renders for viewer roles.

### Out of scope (per "don't go crazy")
- No RSVPs, no attendee lists, no ICS export, no email digest.
- No rich-text editor — plain textarea for updates/highlights.
- No image uploads for highlights v1 — accept a URL field; can add Storage upload later.
