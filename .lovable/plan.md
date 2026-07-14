
# Make the Blossom AI page actually work

Three concrete problems on `/ai/assistant` right now:

1. The **microphone** button in the composer is hardcoded `disabled` with `title="Voice (coming soon)"` (`OSAskBlossom.tsx:399`).
2. The **attachment / paperclip** button is hardcoded `disabled` with `title="Attach (coming soon)"` (`OSAskBlossom.tsx:400`).
3. The **AI Insights** panel (right rail + full "AI Insights" tab) is 100% fake — it comes from `mockInsightsFor()` in `askBlossomAdapter.ts:205`, hardcoded strings like "3 auths are at risk", "Staffing shortage predicted Thursday", "97156 compliance up 6 pts". None of that is a real query. Users see the same made-up copy no matter their state, role, or actual operations.

## 1. Voice / microphone button — live dictation

- Replace the disabled button with a real toggle that uses the browser's `SpeechRecognition` (`webkitSpeechRecognition` fallback) — no server cost, no ElevenLabs bill, runs entirely client-side, requests mic permission on click.
- While recording, the button turns red with a pulse, the input placeholder becomes "Listening…", and interim results stream directly into the input field.
- Auto-stop on final result or when the user clicks again; on unsupported browsers (mostly Firefox), show a tooltip "Voice dictation isn't supported in this browser" instead of pretending it works.
- Nothing is sent to the model until the user hits Send — dictation just fills the composer.

## 2. Attachment / paperclip button — real file context

- Wire the paperclip to a hidden `<input type="file" multiple accept=".txt,.md,.csv,.json,.log,.pdf,image/*">` (max 3 files, 5 MB each, enforced client-side).
- For each file we can read as text (txt/md/csv/json/log), read it in the browser and append as `\n\n--- Attached: <filename> ---\n<contents, truncated to ~20k chars>` at the end of the user prompt sent to `blossom-ai-chat`.
- For PDFs and images, send a small note ("[attached <filename>, <size> — content not yet indexed]") so the AI acknowledges the attachment; real PDF/image parsing is out of scope for this pass and will be called out in the response.
- Show attached files as removable chips above the composer before sending; clear the chips once the message is sent.
- No backend changes are required for text attachments — they ride inside the existing `prompt` field, which the edge function already accepts.

## 3. AI Insights — real, role-scoped, honest

Delete the reliance on `mockInsightsFor` on this page. Build a new `useBlossomAiInsights(role, state)` hook (in `src/hooks/useBlossomAiInsights.ts`) that runs a handful of parallel Supabase queries under the caller's session so RLS naturally scopes results:

| Insight | Source query | Severity |
|---|---|---|
| Authorizations expiring ≤ 30 days | `client_authorizations` where `end_date` between now and now+30d and `status` active, count + earliest date, filtered by state when the role is state-scoped | risk if any, watch otherwise |
| Open critical alerts | `critical_alerts` where `status = 'open'`, count + newest title | risk if any |
| Open coverage / staffing cases | `scheduling_coverage_cases` where `status in ('open','in_progress')`, count | watch |
| My overdue tasks | `user_tasks` where `assignee = auth.uid()`, `due_at < now()`, `status != 'done'` | risk if >0 |
| Stalled recruiting candidates | `recruiting_candidates` `updated_at < now()-14d` AND stage not terminal | watch |
| Recent high-severity ops work items | `operations_work_items` where `severity='high'` and `status='open'` created in last 7d | watch |
| "No issues" empty state | when every query returns 0, show a single info card: "No risks flagged in your scope right now." | info |

Rules:
- Every card gets a real deep link (Authorizations → `/authorizations?filter=expiring30`, Alerts → `/admin/alerts`, Tasks → `/tasks?filter=overdue`, etc.); clicking the card navigates.
- Numbers come from the query, not from a template. The detail line is composed from the row it summarizes ("BCBS #4471 expires in 6 days — Client A. Nunez").
- Role-scope which insights show at all: RBT only sees their own tasks and trainings, State Director sees state-scoped auths/alerts/coverage, Leadership sees everything.
- Add a small refresh icon in the panel header — TanStack Query with a 60s staleTime.
- The right-rail panel and the full "AI Insights" tab both consume the same hook, so they can never disagree again.
- Loading state = shimmering skeleton cards, not blank.
- Error state = a single amber card "Couldn't load live insights — <short error>" instead of silently showing nothing.

## 4. Small correctness pass while we're here

- Fix the outdated Sparkles copy under the header that says "Ask, summarize, and decide — beautifully." remains, but the empty-state prompt list is fine.
- Remove `mockInsightsFor` export from `askBlossomAdapter.ts` once no page imports it (grep the repo first).
- Add a Vitest suite `src/test/blossomAiComposerAndInsights.test.ts` covering: (a) mic button is no longer permanently disabled, (b) paperclip triggers a file input, (c) `useBlossomAiInsights` shape includes required fields and honors role scope, (d) the page no longer imports `mockInsightsFor`.

## Files touched

- `src/pages/os/OSAskBlossom.tsx` — real mic button, real paperclip, attachment chips, swap insights source, wire refresh, both rail + tab consume the new hook, honest empty/error states.
- `src/hooks/useBlossomAiInsights.ts` — new hook with the six queries above under TanStack Query.
- `src/lib/ai/askBlossomAdapter.ts` — deprecate/remove `mockInsightsFor` once unused.
- `src/test/blossomAiComposerAndInsights.test.ts` — new tests.

## Explicitly out of scope this pass

- Server-side transcription (ElevenLabs, Whisper). Browser dictation is enough for now; we'll call this out in the response.
- PDF/image content extraction on attachments — the file is acknowledged but not indexed; will be added when the ingestion pipeline supports on-the-fly parsing.
- Any changes to `blossom-ai-chat` edge function — attachments ride inside the existing prompt, insights are a separate read path.
