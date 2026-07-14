## Why Blossom AI answers nothing today

Root cause found in the data:
- `knowledge_chunks` has **8,870 rows, 0 with embeddings** (`embedding IS NULL` for all).
- `match_resource_chunks` filters `WHERE embedding IS NOT NULL`, so it returns **0 rows on every query**.
- The chat function's system prompt says *"Answer ONLY from the provided KNOWLEDGE excerpts... if none, refuse"*, so with 0 hits it always replies **"No approved Blossom resource was found for that."**

Secondary issues:
- The knowledge base is limited to Resource Library files. It has no awareness of operational data (leads, clients, tasks, employees, workflows, roles/menus, SOPs described elsewhere in code).
- The refuse-if-no-cite prompt is too strict for questions like "How does intake work?" or "What is Blossom OS?" — even with data, weak similarity forces a refusal.

## Plan

### 1. Backfill embeddings (the actual blocker)
- Add a new edge function `blossom-ai-embed-backfill` (super_admin only) that:
  - Selects `knowledge_chunks` where `embedding IS NULL` in batches of 96.
  - Calls Lovable AI Gateway `openai/text-embedding-3-small` (1536 dims — matches the column).
  - Updates each chunk's `embedding`.
  - Returns `{ processed, remaining }` so it can be re-invoked until 0.
- Add a Super Admin trigger button on `/admin/blossom-ai` that loops calls until `remaining === 0`, with a progress bar.
- Also fix `blossom-ai-ingest` so future ingests never leave `embedding = NULL` (retry once, then mark the chunk row with `metadata.embed_error` instead of silently inserting a null-embedding row).

### 2. Broaden Blossom AI's knowledge
Give it three retrieval sources, merged into the model context:

a. **Resource Library RAG** (existing path, once embeddings work).

b. **System knowledge pack** — a curated, always-included short brief describing Blossom OS itself: what it is, the roles, the modules, the CentralReach boundary, key workflows (intake → VOB → auth → scheduling → RBT → QA), and the top-level menu map. Generated from `src/lib/os/roleMenus.ts` + a hand-written `docs/blossom-os-overview.md`, embedded once and always retrieved with a small system-scope boost.

c. **Operational tools** (role-scoped, RLS-enforced) exposed to the model via a lightweight tool-router pattern already used elsewhere:
   - `search_leads(query, status?)` 
   - `search_clients(query)`
   - `search_employees(query, role?)`
   - `list_my_tasks(status?)`
   - `list_my_goals()`
   - `lookup_authorization(clientOrId)`
   - `describe_workflow(name)` — reads from the SOP/knowledge pack
  All go through `supabase` client bound to the caller's JWT, so RLS naturally scopes each role. Results are compacted (top 5 rows, key columns) before being fed to the model.

### 3. Rewrite the system prompt
- Keep HIPAA + role rules and "never invent PHI/PII/staff/clients".
- Remove the hard "refuse unless cited" rule. New behavior:
  - If tools or KB return relevant data → answer + cite.
  - If nothing returned but the question is about *how Blossom OS works* → answer from the system knowledge pack.
  - Only refuse when the question is about a specific record the user cannot see, or clearly outside Blossom.
- Keep draft/action guardrails, quiz-answer refusal, and secret redaction.

### 4. Chat function upgrades (`blossom-ai-chat`)
- Run KB retrieval + system-pack retrieval in parallel.
- Add a small tool-calling loop (max 3 tool steps) using the Lovable AI Gateway chat-completions tool format.
- Preserve current conversation persistence (`chat_conversations` / `chat_messages`) and audit log.
- Return `sources` = KB citations **plus** operational records touched (id + type + label), so the UI can render "Referenced: Lead #123" chips.

### 5. UI polish on `/ai/assistant`
- Add a subtle "Thinking… searching Resource Library / looking up leads / …" step indicator driven by the tool calls returned.
- Update the empty-state suggested prompts to reflect the new abilities ("Summarize my open tasks", "Which leads are stuck in VOB?", "Explain the RBT onboarding journey").
- Keep the current sidebar history and record-context injection.

### 6. Validation
- `src/test/blossomAiChatFunctionality.test.ts` (new): asserts prompt no longer contains the hard-refuse clause, tool router registered, embed-backfill function exists, RPC still filters null embeddings.
- Manual QA script in `docs/blossom-ai-qa.md`: 10 canonical questions (system, KB, operational, out-of-scope, PHI attempt) with expected behaviors.
- After deploy: run the backfill button once, then verify `select count(*) from knowledge_chunks where embedding is not null;` = 8,870.

## Files touched

```text
supabase/functions/blossom-ai-embed-backfill/index.ts   (new)
supabase/functions/blossom-ai-chat/index.ts             (prompt, tools, parallel retrieval)
supabase/functions/blossom-ai-ingest/index.ts           (never leave null embeddings)
src/pages/admin/BlossomAIAdmin.tsx                       (backfill button + progress)
src/lib/ai/askBlossomAdapter.ts                          (pass tool-step trace to UI)
src/pages/os/OSAskBlossom.tsx                            (step indicator, new suggestions)
src/lib/ai/systemKnowledgePack.ts                        (new — compiled Blossom OS brief)
docs/blossom-os-overview.md                              (new — canonical company brief)
docs/blossom-ai-qa.md                                    (new)
src/test/blossomAiChatFunctionality.test.ts              (new)
```

No schema changes required — the `knowledge_chunks` table already supports everything; we're just filling the `embedding` column and adding a backfill entry point.
