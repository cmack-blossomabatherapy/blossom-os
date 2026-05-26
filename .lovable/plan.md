# Blossom OS AI — Super Admin Control Center

A new section under **System → Blossom OS AI**, accessible only to Super Admins. Consolidates the existing Knowledge Base + AI Audit Log pages and adds 6 more, all sharing one premium, Apple-inspired shell with a left rail of categories and a Spotlight-style universal search.

## Scope

Eight pages, one shared shell, one access guard, role-aware data. No employee-facing changes.

### 1. Shared shell (`/admin/ai/*`)
- New layout `AiAdminShell` with a slim left rail (page navigation), top universal search bar (Spotlight-style ⌘K), and content surface.
- Hard guard: only `super_admin` may enter; everyone else sees a calm "Restricted" screen and an `ai_audit_log` entry is written.
- Sidebar grouping under **System**: a single "Blossom OS AI" parent with 8 children (collapsed by default, super-admin-only).

### 2. AI Dashboard (`/admin/ai`)
Mission-control overview built from `ai_audit_log` + `knowledge_documents`:
- Today's queries, unique users, avg latency, failure rate, permission blocks.
- Most-searched topics (from prompt snippets), most-referenced documents, unresolved questions (low-similarity or 0-source responses).
- Health strip: KB ready/processing/failed, embeddings coverage, last ingest.
- Recent uploads + recent failed queries.

### 3. Knowledge Base (`/admin/ai/knowledge`)
Rebuild of the current page as a **category-driven** explorer:
- Left rail: fixed top-level categories (Company, HR, Recruiting, Intake, Authorizations, Scheduling, QA, Clinical, Finance, Systems, Training Academy) — derived from the existing `category` enum, extended to cover the requested set.
- Center: document cards with preview, tags, role visibility chips, AI-visible toggle, status, last updated, uploaded by.
- Per-card actions: edit metadata, replace file, re-ingest (retrain), archive, delete, view chunks.
- Upload dialog already supports PDF/TXT/MD + paste-as-text; extend to accept DOCX (text extraction in `extract-pdf-knowledge`) and external links (URL + title stored as text).
- Auto-tag + summary: after ingest, call a small AI pass to suggest tags/summary stored in `knowledge_documents.metadata`.

### 4. AI Permissions (`/admin/ai/permissions`)
Visual role × category matrix backed by a new `ai_role_category_access` table. Rows = roles, columns = KB categories. Toggle cells; changes are written immediately. Read-only preview of `aiPermissions.ts` defaults below the matrix.

### 5. AI Training Center (`/admin/ai/training`)
- Bulk actions: re-index all, re-index by category, rebuild embeddings for a document.
- "Approved answers" editor: a new `ai_approved_answers` table (question pattern → canonical answer + citations) consulted by the `chat` function before LLM fallback.
- "Bad answer" review queue (flagged messages from `chat_messages`, surfaced when added later — table-ready now).

### 6. AI Audit Log (`/admin/ai/audit`)
Move the existing `/admin/ai-audit` page into the new shell. Add filters for role, category, risk level (failed / blocked / sensitive), and date range.

### 7. AI Memory (`/admin/ai/memory`)
- New `ai_memory_entries` table: scope (`global` | `role` | `department`), content, pinned, created_by.
- UI to add / pin / disable / delete memory entries. The `chat` function prepends pinned global + role-scoped memories to its system prompt.

### 8. AI Analytics (`/admin/ai/analytics`)
Charts derived from `ai_audit_log`:
- Top searched topics, weakest knowledge areas (queries with 0 sources), adoption by role, usage by state (joined via `user_roles`), satisfaction trend (placeholder for future thumbs feedback), document effectiveness (citations per doc).

### 9. AI Appearance (`/admin/ai/appearance`)
Form backed by a new `ai_appearance_settings` singleton row: greeting, tone (concise / friendly / formal), suggested prompts, dashboard widget visibility. `OSAskBlossom` reads this on mount.

### Universal Search
Top bar component (Spotlight modal, ⌘K) that queries: knowledge docs (title/category), audit log (prompt snippet), memory entries, permission roles. Pure client-side fetch with debounced queries.

## Technical details

**New DB tables (one migration):**
- `ai_role_category_access(role app_role, category kb_category, allowed bool, PK(role, category))`
- `ai_approved_answers(id, question_pattern text, answer text, citations jsonb, active bool, created_by, timestamps)`
- `ai_memory_entries(id, scope text check in ('global','role','department'), scope_value text, content text, pinned bool, active bool, created_by, timestamps)`
- `ai_appearance_settings(id=1 singleton, greeting, tone, suggested_prompts jsonb, widgets jsonb, updated_by, updated_at)`
- All RLS: only `has_role(auth.uid(),'super_admin')` may select/insert/update/delete. `chat` edge function uses service role, unaffected.

**Edge function updates:**
- `chat/index.ts`: load pinned memories + role memory + approved-answer match before generating; if approved answer matches, return it directly with its citations.
- `extract-pdf-knowledge`: add DOCX text extraction (simple unzip + `word/document.xml` parse) and URL fetching.

**Frontend:**
- `src/components/admin/ai/AiAdminShell.tsx` — layout + rail + Spotlight + guard.
- `src/pages/admin/ai/{Dashboard,KnowledgeHub,Permissions,Training,AuditLog,Memory,Analytics,Appearance}.tsx`.
- Sidebar: add "Blossom OS AI" group under System, all items `superAdminOnly`.
- Redirect old `/admin/knowledge-base` and `/admin/ai-audit` to the new routes.

**Out of scope for this pass (call out if user wants them):**
- Knowledge graph visualization of related SOPs (placeholder card).
- Version history (schema-ready field; UI deferred).
- Video / Loom / Tango embed ingestion (URL stored, but no transcript extraction).
- Real "satisfaction" scores (no feedback signal exists yet).

## Files

````text
supabase/migrations/<ts>_blossom_os_ai_admin.sql                NEW
supabase/functions/chat/index.ts                                EDIT (memory + approved answers)
supabase/functions/extract-pdf-knowledge/index.ts               EDIT (docx + url)
src/components/admin/ai/AiAdminShell.tsx                        NEW
src/components/admin/ai/UniversalSearch.tsx                     NEW
src/pages/admin/ai/Dashboard.tsx                                NEW
src/pages/admin/ai/KnowledgeHub.tsx                             NEW (replaces KnowledgeBase.tsx)
src/pages/admin/ai/Permissions.tsx                              NEW
src/pages/admin/ai/Training.tsx                                 NEW
src/pages/admin/ai/AuditLog.tsx                                 NEW (replaces AiAuditLog.tsx)
src/pages/admin/ai/Memory.tsx                                   NEW
src/pages/admin/ai/Analytics.tsx                                NEW
src/pages/admin/ai/Appearance.tsx                               NEW
src/App.tsx                                                     EDIT (routes + redirects)
src/components/layout/AppSidebar.tsx                            EDIT (System → Blossom OS AI group)
````

This is a large build (~1 long working session). Approve and I'll execute end-to-end; or tell me to slice (e.g. "shell + dashboard + knowledge first, rest after").
