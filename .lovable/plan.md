This is a large build, so here's the plan before I start. I'll do it in two passes — Training Admin first, AI Chat second — but in this single approval.

## 1. Training Admin (HR Suite → `/hr/training`)

Turn the existing `/hr/training` page into the central **Training Command Center** with full CRUD and a much richer toolset.

### Layout (Apple glass design, matches Operations Academy)
- Hero header: stats (Active Courses, Assignments Due, Avg Completion, Overdue), big CTAs: **+ New Course**, **Generate with AI**, **Assign**.
- Tabs: **Catalog · Tracks · Assignments · Lessons & Content · Quizzes · Reports**.
- Pinned section at top of Catalog (admin can pin/unpin courses to surface them in Training Hub for staff).

### Catalog tab
- Filterable, searchable table/grid of `training_courses` with: title, type, difficulty, role visibility, est. minutes, required, pinned, status, # lessons, # assigned.
- Row actions: **Edit · Duplicate · Pin/Unpin · Archive · Delete · Assign · Open lessons**.
- Edit drawer: all course metadata, role visibility multi-select (RBT, BCBA, Admin, HR, etc.), department, renewal months, external URL, required default.
- Bulk select → bulk assign / bulk archive.

### Tracks tab (NEW)
- A **Track** = curated ordered list of courses targeted at a role group.
- Pre-seed two tracks: **RBT Track** and **BCBA Track**. Admins can create more (e.g. "New Hire", "Leadership").
- For each track: drag-to-reorder courses, set due-after-hire days per course, mark required.
- "Auto-assign on hire" toggle → when an employee with matching role is created, assignments are seeded.

### Assignments tab
- Table of all `training_assignments` with filters: status (Not started / In progress / Complete / Overdue), role, department, due window.
- Quick assign panel: pick course(s) → assign by **User**, **Role** (RBT/BCBA/etc), **Department**, or **Track**. Set due date, required flag, notes.
- Inline reassign / extend due / remove.

### Lessons & Content tab
- Pick course → manage `training_lessons` (drag reorder, edit, delete, add). Lesson types: Written SOP, Video, Tango walkthrough, External link, Quiz.
- Inline rich-text editor for SOP content; URL fields for video/Tango.

### Quizzes tab
- Pick course → manage `training_quizzes` + `training_quiz_questions` (multiple choice / true-false), set passing score.

### AI Generation (NEW edge function `generate-training`)
- Modal: prompt (e.g. "Create a 4-lesson onboarding for handling parent escalations") + role targets + difficulty + minutes.
- Calls Lovable AI (`google/gemini-3-flash-preview`) with structured tool-calling to return `{ course, lessons[], quiz_questions[] }`.
- Preview screen → admin reviews and clicks **Save as draft** (creates course + lessons + quiz). Nothing auto-published.
- Also available as **"AI: Improve this course"** on existing courses (regenerates lessons / suggests quiz).

### Reports tab
- Reuse existing TrainingStatistics charts inside this tab (completion by role, overdue list, top courses).

### Schema additions (migration)
- `training_courses`: add `is_pinned boolean default false`, `pinned_at timestamptz`.
- New table `training_tracks` (id, name, description, role_targets text[], auto_assign_on_hire bool, is_active, created_by, timestamps).
- New table `training_track_courses` (track_id, course_id, sort_order, due_after_days, required).
- RLS: managers (`hr.training.assign` or admin/exec/ops_manager) can manage; signed-in users can `SELECT` tracks/track_courses.

### Sidebar
Keep `Training Admin` link (already there) — make it the canonical entry. The standalone `/admin/training-*` pages stay but become deep-links from inside the new center (we won't remove them this pass).

---

## 2. AI Chat — site-wide Blossom Assistant

A floating chat button on every authenticated page (bottom-right) that opens a slide-over panel.

### Capabilities
- Answer employee questions about training, SOPs, the handbook, HR policies, and any uploaded resource.
- Keeps **conversation history** per user (persisted).
- Streaming responses (SSE) using Lovable AI Gateway, model `google/gemini-3-flash-preview`.
- RAG over uploaded knowledge: every `hr_resources` document, training lesson SOP content, and academy module content is indexed into a `knowledge_chunks` table with embeddings; the chat function does vector search and feeds top chunks as context.
- New uploads/edits trigger an `ingest-knowledge` edge function that chunks + embeds the text (extract text from PDFs/docs via simple text or `pdf-parse`-style approach for now: text already stored in `content`/`description` is indexed; binary PDFs in storage are queued — we'll start with text-based content and resource descriptions to keep this pass scoped, and add PDF extraction immediately after).

### Schema (migration)
- `chat_conversations` (id, user_id, title, last_message_at, timestamps). RLS: owner only.
- `chat_messages` (id, conversation_id, role text check in user/assistant/system, content, created_at). RLS via conversation owner.
- `knowledge_chunks` (id, source_type text, source_id uuid, source_title text, source_url text, chunk_index int, content text, embedding vector(1536), metadata jsonb, timestamps). Enable `pgvector`. RLS: any signed-in user can SELECT (knowledge is org-wide); only service role inserts.
- Indexes: ivfflat on embedding.

### Edge functions
- `chat` — streaming. Loads conversation, runs vector search via embedding the user query (Lovable AI `text-embedding`-equivalent: we'll use `openai/gpt-5-nano` for embedding generation through gateway? *Note:* Lovable AI Gateway exposes chat models. For embeddings we'll use OpenAI-style endpoint via gateway if available; fallback: ask the model to do "search by keyword" via a tool call. **Decision:** use simple lexical full-text search (Postgres `tsvector`) on `knowledge_chunks.content` for v1 — fast, no embedding dependency — and design the schema so we can swap to vector later. (`embedding` column kept nullable for the upgrade path.)
- `ingest-knowledge` — called from triggers/UI when a resource or lesson is created/updated. Splits content into ~800-char chunks, inserts into `knowledge_chunks` with `tsvector`-indexed content. Replaces existing chunks for that source.

### UI
- `<AssistantWidget />` mounted in `App.tsx` (auth-gated). Floating glass button → side sheet with markdown rendering, conversation list, "New chat", suggested prompts ("What's the dress code?", "How do I submit a session note?", "Show me onboarding modules for RBTs").
- React-markdown for rendering.

### Hooks / wiring
- When admin creates/edits `hr_resources`, `training_lessons`, or `training_courses`, frontend calls `ingest-knowledge` with the new text content.

---

## Technical notes (for the dev)
- Frontend stack: existing React + shadcn + glass tokens.
- New deps: `react-markdown`.
- All new tables get RLS; admin/manage paths gated by `hr.training.assign` (already exists).
- AI generation + chat both use existing `LOVABLE_API_KEY` (already configured).

## Out of scope this pass (will follow up if you want)
- Real PDF text extraction from binary files in `journey-resources` storage (v1 indexes text content + descriptions + lesson bodies).
- Vector embeddings (column reserved; v1 uses Postgres FTS for retrieval).
- Auto-assign-on-hire trigger (UI + table ready; trigger added in follow-up once you confirm hire detection logic).

Approve to proceed and I'll execute the migration, edge functions, and all UI.