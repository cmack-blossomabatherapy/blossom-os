# Blossom AI Access — RBT hidden, BCBA scoped

Align Blossom AI with the role model: RBTs never see it, BCBAs get a caseload-scoped copilot instead of the full operational workspace.

## 1. Hide Blossom AI for RBTs

- `src/lib/os/roleMenus.ts`: confirm `rbt` menu has no AI entry (already 5 tabs — Home/Schedule/Learn/Support/Me). No change expected; verify.
- `src/App.tsx`: wrap the `/ai/assistant` route in a `PermissionRoute` that denies `rbt` (and any RBT-only permission). RBTs hitting the URL directly get bounced to `/rbt/app/home`.
- `src/components/layout/AppLayout.tsx`: existing RBT redirect already keeps them inside `/rbt/app/*`; confirm `/ai/assistant` is not in an allow-list.
- Any global launcher (top-bar AI button, command palette entry, floating trigger) — hide when `osRole?.role === "rbt"`, same pattern used for `FloatingEscalationChat`.

## 2. Scoped BCBA copilot (not the full workspace)

- Route: block BCBAs from `/ai/assistant` (the general operational assistant) via `PermissionRoute`.
- Add a new BCBA-only entry `/bcba/copilot` inside `BcbaShell.tsx` menu.
- New page `src/pages/bcba/copilot/BcbaCopilotPage.tsx` reusing the AI Elements composer/transcript pattern already established in `/ai/assistant`, but with a constrained system prompt and constrained retrieval scope:
  - Allowed data sources: the signed-in BCBA's caseload, supervision logs, PR status, treatment plans, parent training, productivity/capacity snapshots, assigned QA feedback, and SOPs/training content.
  - Disallowed: staffing across other BCBAs, recruiting, finance, HR, cross-caseload PHI, executive/state reports.
- Server side (edge function backing the copilot): enforce scoping in the query layer — filter every tool/RAG call by `auth.uid()` → BCBA's caseload, mirroring existing RLS on `bcba_*` tables. Do not rely on prompt instructions alone.
- Suggested prompts tailored to BCBAs: "Which of my clients need a PR this month?", "Summarize my capacity", "What QA corrections are open on my caseload?", "Draft parent training talking points for {client}".

## 3. Guardrails and audit

- Reuse the existing AI audit log path so every BCBA copilot call is logged with user, prompt, and tool calls.
- Add a small "Scope: your caseload only" chip in the copilot header so BCBAs understand the boundary.
- No changes to the general `/ai/assistant` for Leadership/Ops/State Directors/etc.

## 4. Tests

- Unit/route test: RBT session → `/ai/assistant` and `/bcba/copilot` both redirect away; RBT menu contains no AI item.
- Route test: BCBA session → `/ai/assistant` denied, `/bcba/copilot` renders.
- Server test: BCBA copilot query for a client not on their caseload returns an empty/denied result (not a filtered "no rows" that leaks existence).

## Files touched (expected)

- `src/App.tsx` (route guards)
- `src/lib/os/roleMenus.ts` (BCBA menu adds Copilot; verify RBT has no AI)
- `src/pages/bcba/copilot/BcbaCopilotPage.tsx` (new)
- `src/pages/bcba/shell.tsx` or equivalent (nav entry)
- Edge function powering the copilot (new or forked from the existing assistant function) with caseload-scoped tools
- Wherever the global AI launcher lives (hide for RBT + BCBA; BCBA goes to `/bcba/copilot` instead)

## Out of scope

- No new RBT-facing AI helper this pass (per your answer).
- No changes to Leadership/Ops Blossom AI experience.
