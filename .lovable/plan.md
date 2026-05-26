# Blossom OS — System Reset & Data Removal

This is a large, destructive cleanup. Before I start deleting routes, components, tables, and mock datasets across the codebase, I want to confirm scope so we don't break things you still want.

## What I will do

### 1. Remove the Uploads / Imports architecture
- Delete any pages, routes, sidebar entries, and components related to:
  - Data Uploads / Import Data / Upload Center
  - CSV / monday.com / CentralReach uploads
  - Upload history, mapping tools, parsing UI, upload dashboards
- Remove related edge functions (e.g. `parse-monday-export`, `import-bcba-sessions`, anything upload-only)
- Drop related Supabase tables (upload queues, staging, import logs, mapping)

### 2. Wipe imported / mock operational data
- Truncate real DB rows that came from imports (leads, clients, authorizations, scheduling, QA, staffing, recruiting, payroll, tasks, notes, activities, KPIs)
- Delete static mock datasets in `src/data/*` (leads, clients, authorizations, scheduling, staffing, recruiting, tasks, scorecards, hrDashboard, leadershipDashboard, stateDirectorReports, operations, pipeline, calls, documents, automations, blossomEnterprise, blossomIntelligence, blossomOS, teamDirectory, clinics, training mock data, etc.)
- Remove mock hook fixtures (`useLive*`, `useStateOps`, `useMarketingIntelligence`, mock workforce, etc.)

### 3. Replace mock-driven UI with empty states
- Every dashboard/page that consumed mock data gets a calm Apple-style empty state:
  - "Connect CTM", "Connect LeadTrap", "Waiting for CentralReach sync", "Connect Apploi", "Connect Viventium", etc.
- Build one shared `<IntegrationEmptyState />` component used across modules
- Preserve all navigation, role architecture, layouts, design system, branding

### 4. Clean navigation & routing
- Remove dead sidebar/mobile-nav/command-palette/search entries for upload pages
- Remove dead routes in `App.tsx` / role page registries
- Keep all real operational modules

### 5. Preserve
- Role architecture, permissions, navigation framework
- Design system, tokens, Apple-style UI, mobile responsiveness
- Auth, profiles, user_roles, training academy structure, journeys
- All real schema for future live integrations

## What I will NOT touch (confirm if wrong)
- **Training Academy content** (modules, journeys, Welcome to Blossom, videos, SOPs) — this is real curriculum, not mock ops data
- **Auth / profiles / user_roles / role audit / access requests**
- **Knowledge base / AI assistant / Ask Blossom / SOP repository** (these are real, not import-based)
- **Design tokens, layouts, shells, shared UI primitives**
- **Onboarding flow pages** (the user-facing onboarding journey)
- **Edge functions unrelated to uploads** (push, welcome email, ai chat, knowledge ingest from real sources, etc.)

## Questions before I execute

Because this is a one-way destructive operation, please confirm:

1. **Database wipe scope** — Should I `TRUNCATE` all rows in operational tables (leads, clients, authorizations, scheduling, QA, recruiting, payroll, tasks, etc.) and keep the *schema*, or should I also DROP staging/upload tables entirely? My plan: keep operational schemas (they're the real architecture), truncate their rows, and DROP only upload/staging/import tables.

2. **Mock data files in `src/data/*`** — Delete the files entirely, or keep the TypeScript types and export empty arrays so existing imports don't break? My plan: keep type exports, export empty arrays, so the UI compiles and renders empty states without a massive refactor.

3. **Knowledge base content** — The `knowledge_chunks` / `knowledge_documents` tables contain ingested SOPs and training material. Keep these (real content) or wipe them too? My plan: **keep** — they're real knowledge, not imports.

4. **Training Academy + Journeys** — Keep all module content, videos, journey assignments? My plan: **keep** — this is real curriculum we just built.

Reply with answers (or "go ahead with your plan" to accept all defaults) and I'll execute in one pass.
