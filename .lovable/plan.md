# Fix Blossom AI + Clean Up the Chat UI

## Why it's broken today

Root cause of "No approved Blossom resource was found…":

- `knowledge_chunks` has **312 rows, and every single one has `embedding IS NULL`**.
- `match_resource_chunks` explicitly requires `embedding IS NOT NULL`, so retrieval always returns 0 rows.
- With 0 KB hits and a preview chat model (`google/gemini-3-flash-preview`), the model falls back to a canned "no approved resource" refusal even though the system prompt says "do NOT flat-refuse."
- The AI also can't answer "who works here / who is this customer" because those tools aren't wired: today it only exposes `search_leads / search_clients / search_employees / list_my_tasks / list_my_goals / list_expiring_authorizations`. There's nothing for RBTs, BCBAs, staffing coverage, or org-chart lookups.

So the fix is 3 things: (1) actually populate embeddings, (2) make the chat function smarter about retrieval + records + refusal, (3) rebuild the visible chat UI so it doesn't feel like a debug panel.

---

## 1. Get the knowledge base actually searchable

- Run `blossom-ai-embed-backfill` for **all 312 orphan chunks** (it already exists and pages through `embedding IS NULL`). Add a guarded auto-run trigger: when the chat function detects `kb_hits = 0` for a super_admin call, log an `ai_ops_alert` row so the admin page shows a red banner instead of silently returning nothing.
- Add a real content pipeline for the ~8,800 items in the Resource Library (Intake, Recruiting, BCBA, RBT, QA, Case Manager, Behavioral Support, State Director, Assistant State Director, Auth, Scheduling, Staffing, Credentialing, Parent Comms). For each bucket that has files but no `knowledge_chunks` rows, enqueue an ingest via `resource-library-ingest` so PDFs get chunked and embedded.
- Verify with a SQL check that `count(*) filter (where embedding is null) = 0` before we call it done.

## 2. Make the chat function stop refusing and know more

Edit `supabase/functions/blossom-ai-chat/index.ts`:

- **Swap the chat model** from `google/gemini-3-flash-preview` (preview, weakest at instruction-following) to `openai/gpt-5.5` per the default in the AI models catalog. That alone stops most of the refusal behavior.
- **Lower the retrieval threshold**: today we take top-8 with no minimum similarity. Move to top-12 and always attach whatever comes back, plus fall through to `match_knowledge_chunks_v2` if `match_resource_chunks` returns 0.
- **Add a second retrieval pass** over `employees`, `clients`, `intake_leads`, `org_chart_nodes` when the question looks like a name lookup ("who is X", "who owns Y", "tell me about client X"). This is what lets the AI answer "know everything about customers, people in the company."
- **Expand the tool set** so the model can actually reach people/resource data on demand:
  - `find_person` (union over `employees` + `org_chart_nodes` + `auth.users` display name)
  - `describe_client` (client header + active auths + assigned BCBA/RBT, RLS-scoped)
  - `describe_lead` (lead header + next step + owner)
  - `search_resource_library` (title/description ilike over `knowledge_documents` and bucket file listings so it can find a SOP by name even when embeddings miss)
  - `who_owns` (department/role → owner from org chart)
- **Kill the refusal path**: if the model returns a message that matches `/no approved.*resource|contact the owning team/i`, we retry once with an explicit "answer from the Blossom OS brief and general knowledge; never refuse just because retrieval was empty" nudge before returning. Also hard-strip that phrase if it still slips through and replace with a helpful fallback that lists the closest 3 titles we did find.
- Keep the existing HIPAA / draft / no-secrets / no-quiz guardrails intact.

## 3. Redesign the chat UI (`/ai/assistant`)

Today the page shows a left rail with "New Conversation" + "Search Chats" + a raw conversation list, then a bare chat pane. It reads like an internal debug tool. Rework `src/pages/os/OSAskBlossom.tsx` to use AI Elements primitives so it matches the rest of Blossom OS:

- Install AI Elements components: `conversation`, `message`, `prompt-input`, `shimmer`, `tool` (via `bun x ai-elements@latest add ...`).
- Rebuild the transcript with `Conversation` / `ConversationContent` / `ConversationScrollButton` and `Message` / `MessageContent` / `MessageResponse`. Assistant messages render on the page surface (no bubble); user messages get a `primary` / `primary-foreground` bubble.
- Replace the current composer with `PromptInput` + `PromptInputTextarea` + `PromptInputFooter` holding attach, mic, and submit as `size="icon-sm"`. Keeps the textarea focused after send / new conversation / thread switch.
- Refactor the left rail into a proper thread sidebar (matches the existing "one conversation per thread" model): pinned section, today / this week / older groupings, inline rename, delete, and a single search box. New "+ New chat" primary button at the top.
- Add a subtle "Blossom AI" identity chip (gradient avatar we already use in the drawer) and a starter grid of role-aware quick prompts on empty state — no `Sparkles` logo.
- Show streaming state with `Shimmer` ("Thinking…"), and render each tool call inside a collapsed `<Tool defaultOpen={false}>` so power users can inspect but the transcript stays clean.
- Also apply the composer + message styling changes to the docked `BlossomAIAssistant` drawer so both surfaces feel like the same product.

## 4. Verification

- SQL: `select count(*) from knowledge_chunks where embedding is null` returns 0.
- Manual QA against `docs/blossom-ai-qa.md` — all 10 canonical questions answer without the refusal string. Q1–3 cite the system pack, Q4–7 hit tools, Q8 cites Library, Q9–10 refuse the specific action only (draft, no quiz answers).
- Ask "who is <a real employee>" and "tell me about client <name>" and confirm the AI finds them via the new tools.
- Visual pass on `/ai/assistant` and the floating drawer: no `Sparkles` mark, AI Elements composer, clean thread list, no debug-looking labels.
- Run vitest (`blossomAiChatFunctionality.test.ts`, `blossomAiQaLaunchReadiness.test.ts`) and update assertions for the new default model + new tool names.

## Files that will change

- `supabase/functions/blossom-ai-chat/index.ts` (model, retrieval fallback, tool expansion, refusal guard)
- `supabase/functions/blossom-ai-embed-backfill/index.ts` (only if we need a batch-size bump; likely no code change, just invoke)
- New migration to ensure `match_resource_chunks` returns even when `filter_department`/`filter_resource_type` are stale, plus any grants for new RPCs used by the tools.
- `src/pages/os/OSAskBlossom.tsx` (UI rebuild with AI Elements)
- `src/components/ai/BlossomAIAssistant.tsx` (composer + message styling parity)
- `src/components/ai/…` new small pieces (thread list, quick-prompt grid) as needed
- `src/test/blossomAiChatFunctionality.test.ts` + `src/test/blossomAiQaLaunchReadiness.test.ts` (assertion updates for new model + tools)

## Out of scope (call out explicitly)

- No changes to CentralReach data or clinical documentation — Blossom AI stays operational-only.
- No new PII exposure: every new tool goes through the caller's JWT and relies on existing RLS.
- No changes to `LOVABLE_API_KEY` handling — it stays server-side.
