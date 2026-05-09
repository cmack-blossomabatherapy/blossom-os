## Phase 6 — Enterprise Intelligence & AI Augmentation Layer

Final phase. Adds an "Enterprise" sidebar group plus targeted polish across existing modules. Preserves all Phase 1–5 routes, components, data, Supabase schema, auth, automations, intelligence, culture, HR Training Admin, Operations Academy, CRM modules, and the existing AssistantWidget.

### New sidebar group: "Enterprise" (between Culture and Operate)
1. Workforce Readiness Index — `/enterprise/readiness`
2. Compliance & Audit Center — `/enterprise/compliance`
3. AI Course Studio — `/enterprise/course-studio`
4. SOP Intelligence — `/enterprise/sop-intelligence`
5. Smart Recommendations — `/enterprise/recommendations`
6. Simulation Training — `/enterprise/simulations`
7. Simulation Detail — `/enterprise/simulations/:id`
8. Advanced Automations — `/enterprise/automations`
9. Approvals & Workflows — `/enterprise/approvals`
10. Enterprise Reports — `/enterprise/reports`
11. Permissions Matrix — `/enterprise/permissions`
12. Scalability Map — `/enterprise/scalability`

### New pages (12)
- **Workforce Readiness Index** — flagship gauge (composite score), breakdowns by department/state/manager, contributing factors (onboarding, compliance, competencies, certs, engagement, tasks), trend sparkline.
- **Compliance & Audit Center** — audit-readiness dashboard, certification expirations, policy acknowledgements, signature queue, retraining queue, downloadable audit packet (mock CTA), historical timeline.
- **AI Course Studio** — source picker (SOP / Tango / Loom / PDF / Video / Notes), generated outline preview (modules, objectives, quizzes, voiceover script, scenarios), tone/level/role adapters, regenerate buttons. Mock-only generation (no AI call yet).
- **SOP Intelligence** — semantic search bar, AI answer card with cited SOPs, related trainings, "What changed?" diff card, workflow extraction list.
- **Smart Recommendations** — feed of operational insights (declining QA, GA onboarding slowing, SOP needs update, Leadership Academy lifted performance) with severity, owner, action chips.
- **Simulations** — gallery of scenario cards (Intake call, Parent comm, Insurance, Scheduling conflict, QA review, Leadership decision), difficulty/time/score.
- **Simulation Detail** — branching decision walkthrough (mock), per-step feedback, scenario score summary.
- **Advanced Automations** — templates, multi-step builder preview (read-only), department automations, escalation/approval chain visuals. Links to existing `/blossom/ops/automations` for live engine.
- **Approvals & Workflows** — pending approval queue, chain visualization, history, filters.
- **Enterprise Reports** — scheduled/recurring exports, executive summaries, compliance audit exports, workforce readiness reports — all mock CTAs.
- **Permissions Matrix** — role × capability matrix (super admin / exec / dept admin / manager / trainer / HR / employee / contractor) with read/write toggles (read-only mock; admin gating via `isAdmin`).
- **Scalability Map** — US map placeholder with state cards (clinics, departments, employees, readiness), "Add state / clinic" CTA mock.

### Polish across existing modules (light, additive only)
- **TopBar** — add a global "⌘K" search trigger that opens a `GlobalSearchDialog` (client-side mock fuzzy search across SOPs, courses, users, departments, resources, workflows, reports, announcements, competencies — sourced from existing data files + new `enterpriseSearchIndex`).
- **Dashboard** — add a single "Workforce Readiness" headline card linking to `/enterprise/readiness`. No layout overhaul.
- No changes to Phase 5 culture pages, intelligence, ops, CRM, training admin, or auth.

### New components (`src/components/enterprise/`)
`ReadinessGauge`, `ReadinessBreakdownRow`, `ComplianceTimeline`, `AuditChecklistItem`, `CourseStudioStepper`, `GeneratedModuleCard`, `SopAnswerCard`, `SopDiffCard`, `RecommendationCard`, `SimulationCard`, `SimulationStep`, `ApprovalRow`, `AutomationTemplateCard`, `PermissionsMatrix`, `ScalabilityStateCard`, `GlobalSearchDialog`, `EnterpriseStatChip`. All use existing GlassPageShell / Card / semantic tokens. Subtle micro-interactions via existing keyframes.

### New data (`src/data/blossomEnterprise.ts`)
Typed mocks: `readinessScore`, `readinessBreakdowns[]`, `complianceItems[]`, `auditPackets[]`, `courseSources[]`, `generatedCourse`, `sopAnswers[]`, `sopChanges[]`, `recommendations[]`, `simulations[]`, `simulationSteps[]`, `automationTemplates[]`, `approvalRequests[]`, `enterpriseReports[]`, `permissionsMatrix`, `scalabilityStates[]`, `enterpriseSearchIndex[]`. Shapes mirror eventual tables (readiness_scores, audit_logs, ai_generations, sop_intelligence, recommendations, simulations, scenario_steps, approvals, permissions_matrix, enterprise_reports).

### Wiring
- `src/App.tsx` — 12 new routes inside existing layout under `ProtectedRoute`.
- `src/components/layout/AppSidebar.tsx` — new "Enterprise" group with lucide icons (Gauge, ShieldCheck, Wand2, BookOpen, Lightbulb, Gamepad2, Workflow, CheckCircle2, FileBarChart, Lock, MapPin).
- `src/components/layout/TopBar.tsx` — add ⌘K search button and dialog mount.

### Preserved
All Phase 1–5 work, all existing routes, AssistantWidget, Supabase schema, auth, edge functions, automations, intelligence, culture, training, HR, CRM. No Supabase migrations. No edits to `client.ts` / `types.ts` / `.env`. No destructive changes.

### Role gating
All enterprise pages render for everyone, but admin-only controls (regenerate course, approve/reject, edit permissions matrix, add state, schedule report) gated via `useAuth().isAdmin`.

### Files
~17 new components + 1 data file + 12 new pages + 3 edited (App.tsx, AppSidebar.tsx, TopBar.tsx) + 1 lightly edited (Dashboard.tsx). TypeScript builds cleanly.
