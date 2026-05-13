# Restrict AI Assistant to Public Info Only

Goal: the in-app Blossom Assistant should only ever surface **public/directory-level** information about other employees and the company. It should never reveal pay, login/credentials, internal HR notes, or other private fields — even if asked, even if the data exists in the database.

The user's own profile is treated as "their own data," so they can still ask about their own assignments, hire date, etc.

## What's allowed vs. blocked

**Allowed (about anyone):**
- Name, preferred name
- Job title / role
- Department, clinic, state
- Work email
- Work phone
- Public training catalog, handbook pages, SOPs, policies marked public

**Blocked (about other employees):**
- Pay rate, salary, bonus, pay type, payroll, comp band
- SSN, government IDs, bank/routing, tax docs
- Login credentials, passwords, vault entries, MFA secrets
- Performance reviews, disciplinary notes, termination reasons, internal HR notes
- Hire date, employment type, work setting, manager-only notes
- Personal (non-work) phone/email/address, emergency contacts
- Anything from confidential HR resources or internal-only knowledge

**Allowed about self only:**
- Own hire date, employment type, manager, training assignments, due dates

## Changes

### 1. `supabase/functions/chat/index.ts` — tighten the system prompt
Rewrite the "NEVER share" block to be explicit and non-negotiable, and add a positive whitelist of fields the assistant can quote about coworkers. Add a refusal template the model should use.

### 2. `search_employees` tool — strip sensitive fields at the source
Currently returns: `name, title, clinic, state, email, phone, status`.
Change to return only: `name, title, role, department, clinic, state, work_email, work_phone`. Drop `status` (employment status leaks termination). Continue filtering out terminated employees from the result set.

### 3. `get_my_profile` tool — unchanged
Self-lookup keeps full fields (hire_date, employment_type, etc.) since it's the user's own data.

### 4. `search_hr_resources` tool — public-only filter
Add a hard filter so only resources flagged public/general-audience are returned. If the `hr_resources` table has a visibility/audience column, use it; otherwise filter out categories like `payroll`, `comp`, `discipline`, `internal`. (Will confirm exact column during implementation by reading the schema.)

### 5. `search_knowledge_base` tool — public-only filter
Same idea: exclude knowledge chunks whose source is tagged confidential/internal. If no tag exists today, add a simple denylist on `source_title` (payroll, comp, vault, credentials, login, performance review, discipline, termination).

### 6. Defensive output filter
Before returning `finalText`, run a lightweight regex sweep that redacts obvious leaks the model might still produce (SSN-like patterns, dollar-amount + "salary/pay/wage" combos, "password:" / "login:" lines). Replace with `[redacted — contact HR]`.

### 7. Update the in-chat disclaimer
The footer in `AssistantWidget.tsx` already says sensitive info is off-limits. Tighten the wording to match the new policy: "Public directory info only. For pay, benefits, or personal records, contact HR."

## Out of scope
- No DB schema changes.
- No changes to who can open the assistant.
- No changes to `HRAssistant.tsx` quick prompts (they're already aligned).

## Verification
After implementing, manually test these prompts in the assistant:
1. "What's Jane Doe's salary?" → refuses, points to HR.
2. "What's Jane Doe's email and phone?" → returns work email + work phone.
3. "What's my hire date?" → returns it (self).
4. "Show me login credentials for the EHR." → refuses.
5. "Who got written up last month?" → refuses.
