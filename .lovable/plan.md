# Ask Blossom AI — Operational Brain for Blossom OS

This builds the full **Ask Blossom AI** experience as a first-class module inside Blossom OS — workspace, global access points, role-aware UX, and the knowledge/permissions scaffolding. No live AI calls are wired; responses are mocked through a single adapter so we can swap in real AI later without touching the UI.

---

## Scope (this round)

**In:** Full-screen AI workspace, global access points, role-aware mock responses, knowledge base structure, audit/permissions scaffolding, page-level AI embeds on 3 key pages.
**Out (later):** Real model calls, true streaming, RAG over live DB, voice, file upload processing, AI actions execution.

---

## 1. Routes & Navigation

New route inside OS shell: **`/os/ask-blossom`** → `OSAskBlossom.tsx`
- Add as a top-tier nav item in `AppSidebar` (and OS sidebar) with a `Sparkles` glyph and "AI" badge.
- Sub-routes within the workspace (tab state, not nested routes for v1):
  - Conversations (default)
  - Saved Prompts
  - Shortcuts
  - Insights
  - Knowledge Base
- Deep-link param: `?q=...&context=intake|auth|scheduling|...` so page embeds can hand off context.

Existing `AssistantWidget` (floating Sparkles button) is upgraded into the **global entry point**:
- Quick chat in the sheet (as today).
- New "Open full workspace" button → routes to `/os/ask-blossom`.
- Command Palette (`⌘K`) gets an "Ask Blossom AI…" entry that opens the workspace pre-filled.

---

## 2. Workspace Layout (`OSAskBlossom.tsx`)

Apple-inspired, calm, glassmorphic. Three-column on ≥1280px, collapses gracefully.

```text
┌────────────────────────────────────────────────────────────────────┐
│  Top bar: Universal AI command/search ▸  mode selector ▸ voice ▸ ↑ │
├──────────┬───────────────────────────────────┬────────────────────┤
│ LEFT     │  CENTER: Conversation             │ RIGHT: Context     │
│ • New    │  • Streaming-style message stream │ • AI Insights      │
│ • Pinned │  • Multi-turn, markdown, sources  │ • Suggested        │
│ • Recent │  • Empty state: prompt cards grid │   actions          │
│ • Saved  │                                   │ • Attached records │
│ • Shorts │                                   │ • Knowledge refs   │
└──────────┴───────────────────────────────────┴────────────────────┘
```

- Empty-state prompt grid: role-specific quick prompts (Summarize My State, Show Staffing Risks, Find Stuck Clients, Review PR Risks, Explain This Workflow, Generate Weekly Summary, Draft Team Message, Show Open Escalations).
- "Attach" affordance shows record chips (Client, Auth, Report) — UI only; payload placeholder.
- Messages render via existing markdown pipeline; tool/source chips reused from `AssistantWidget`.

---

## 3. Page-Level AI Embeds

Reusable `<AskBlossomInline context={...} prompts={[...]} />` card placed on:
- **Intake dashboard** → "Summarize Intake Risks", "Find Stuck Leads"
- **Authorizations** → "Find Expiring Auths", "Show Overdue PRs"
- **Scheduling** → "Identify Staffing Gaps"
- **Reports / KPI Scorecards** → "Generate Weekly Summary"

Each card: 1-line prompt input + 2–3 suggested chips. Clicking routes to `/os/ask-blossom?q=...&context=...`.

---

## 4. Role-Aware Permissions (mock layer)

New file `src/lib/ai/aiPermissions.ts`:
- `getAiScope(role)` → returns allowed knowledge categories, record types, and PHI mask rules.
- `filterContextForRole(role, payload)` → strips disallowed fields.
- Scopes by role: RBT (self caseload, no $, no HR), BCBA (caseload + supervision), State Director (state-scoped ops), Leadership (company-wide), Super Admin (all).
- Mock adapter `askBlossom(prompt, ctx)` calls `filterContextForRole` before responding — so every mock answer is already role-respecting.

Visible UI: small "Scoped to: State Director · NC" chip on the command bar.

---

## 5. Knowledge Base Structure

New `src/lib/ai/knowledgeBase.ts` — typed in-memory KB seeded from existing sources we already have in the repo (SOPs, training, insurance cheats, VOB, org/employee directory, state ops). Entries:

```ts
type KBEntry = {
  id: string;
  category: 'sop' | 'training' | 'insurance' | 'state' | 'workflow'
          | 'policy' | 'terminology' | 'role' | 'faq' | 'directory';
  title: string;
  content: string;        // short, plain-text summary for now
  sourceType: string;     // 'sop_library' | 'academy' | 'vob' | ...
  sourceId?: string;
  updatedAt: string;
  roles: OSRole[];        // who can see it
};
```

- `searchKnowledge(query, role)` → simple keyword + tag match for v1.
- "Knowledge Base" tab in the workspace renders categorized cards with search.

**Employee directory exposure rules** enforced in `kb/directory.ts`: only name, role, department, state, company email, extension, supervisor. Personal phone/address/payroll/HR records explicitly excluded.

---

## 6. Mock AI Adapter

`src/lib/ai/askBlossomAdapter.ts`:
- Single function `streamMockAnswer(prompt, ctx)` returning an async iterator of tokens (simulated typing).
- Intent router matches keywords ("expiring auths", "staffing", "summarize state", "who handles…") to canned operational answers built from existing mock data (`stateDirectorReports`, `staffing`, `authorizations`, `recruitingDashboard`, `teamDirectory`, etc.).
- Each answer returns `{ content, sources: KBEntry[], suggestedActions: AiAction[] }`.
- `AiAction` is UI-only ({ id, label, kind: 'create_task' | 'draft_message' | 'open_workflow' | … }); buttons render but only toast "Coming soon" for now.

This means the UI already speaks the real shape we'll need when a real model is wired in.

---

## 7. Audit Logging Scaffolding

`src/lib/ai/aiAudit.ts`:
- `logAiQuery({ userId, role, prompt, recordsAccessed, kbHits, timestamp })`
- Writes to `localStorage` for v1 + console; structured so it can be repointed to a Supabase `ai_activity_logs` table later.
- Tiny admin view at workspace **Insights → Activity** showing the last 50 entries (visible to leadership/admin only via `PermissionGate`).

---

## 8. Visual System

Reuse existing semantic tokens. Add a few AI-specific ones in `index.css`:
- `--ai-glow`, `--ai-surface`, `--ai-gradient` (subtle purple → primary blue).
- Glassmorphic panels via `bg-card/60 backdrop-blur-xl border-border/60`.
- Streaming caret, soft glow on the command bar focus state, animated prompt cards on hover.

No hardcoded colors in components.

---

## 9. Files to Add / Edit

**Add**
- `src/pages/os/OSAskBlossom.tsx` — workspace shell
- `src/components/ai/AskBlossomWorkspace.tsx` — 3-column layout
- `src/components/ai/AiCommandBar.tsx`
- `src/components/ai/AiConversationList.tsx`
- `src/components/ai/AiMessageStream.tsx`
- `src/components/ai/AiPromptGrid.tsx`
- `src/components/ai/AiInsightsPanel.tsx`
- `src/components/ai/AiKnowledgeBaseView.tsx`
- `src/components/ai/AiSavedPrompts.tsx`
- `src/components/ai/AskBlossomInline.tsx` — page embed
- `src/lib/ai/aiPermissions.ts`
- `src/lib/ai/knowledgeBase.ts`
- `src/lib/ai/askBlossomAdapter.ts`
- `src/lib/ai/aiAudit.ts`
- `src/lib/ai/quickPrompts.ts` — role-keyed prompts
- `src/lib/ai/types.ts`

**Edit**
- `src/pages/os/OSShell.tsx` — add route + nav entry + command palette hook
- `src/components/assistant/AssistantWidget.tsx` — add "Open full workspace" button + deep-link
- Intake / Authorizations / Scheduling / Reports pages — drop in `<AskBlossomInline />`

---

## 10. What's intentionally deferred

- Real model calls and streaming (adapter is mock).
- Supabase tables (`ai_conversations`, `ai_messages`, …) — schemas defined in comments only; we'll migrate when we go live so we don't pollute the DB with throwaway shapes.
- File upload, voice transcription, AI actions execution — UI affordances only.
- Per-record RLS for AI — covered by the role scope layer for now; real RLS gets added with the DB.

---

## Acceptance

- New "Ask Blossom AI" item in the OS sidebar opens a full workspace at `/os/ask-blossom`.
- Empty state shows role-specific prompt cards; clicking one streams a mocked, role-scoped answer with sources and suggested actions.
- Floating widget gets an "Open workspace" affordance and command palette entry.
- Inline AI cards appear on Intake, Auths, Scheduling, and Reports.
- Role switcher visibly changes scope chip and which prompts/answers are available.
- No real network calls; everything is mock + local.
