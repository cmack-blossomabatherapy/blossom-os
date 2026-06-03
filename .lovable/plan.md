## Problem

You pressed **Send test** on the After-Hours AI Calls page and got a "Test sent" toast, but no email landed in `cmack@blossomabatherapy.com`.

Two findings from the investigation:
- The verified Lovable email domain on this project is `notify.oceancountyconnect.com`, but `notify-after-hours-call` sends from `noreply@blossom.abacommandcenter.com` via the **Resend connector** (you confirmed that domain is verified in Resend, so the FROM should be acceptable).
- Edge function logs for `notify-after-hours-call` show only boot/shutdown — no invocation entries tied to the test click. That means either the deployed function is stale, the call never actually hit the function, or Resend returned a 2xx but didn't deliver and we have no visibility because we don't log anything.

The toast can show "sent" even when delivery fails because the code only checks `resendRes.ok`, and we never log the Resend response or persist a record of test sends.

## Fix plan

### 1. Make the test path observable (edge function)
In `supabase/functions/notify-after-hours-call/index.ts`, in the `test` branch:
- `console.log` the recipient, FROM address, env-key presence (booleans only, never the values), Resend HTTP status, and full Resend response JSON.
- Include the Resend response body and status in the JSON returned to the client (`{ ok, test, to, department, resend: { status, id, message } }`) so the toast can surface the real result.
- Insert a row into `phone_ai_call_notifications` for test sends too (with `call_id = null`, `department`, `recipients`, `status`, `error`) so there's an audit trail.

### 2. Make the UI surface real failures
In `src/components/phone/AfterHoursAIBoard.tsx` `sendTest`:
- If `data.resend.status >= 400` or `data.resend.id` is missing, show `toast.error` with the Resend message instead of success.
- On success, show the Resend message id in the toast so you can cross-reference it in the Resend dashboard.

### 3. Redeploy + retest
- Deploy `notify-after-hours-call`.
- Trigger Send test once.
- Pull edge function logs and the new `phone_ai_call_notifications` row, and report back:
  - what Resend actually returned (200 + id ⇒ check spam/blocklist; 4xx ⇒ FROM/domain/API-key scope problem),
  - whether `LOVABLE_API_KEY` and `RESEND_API_KEY` are present in the function env.

### 4. Likely follow-ups based on what the logs show
- **Resend 2xx with id but no inbox delivery** → it's a deliverability problem (spam folder, Resend suppression list for that recipient, or your domain's DMARC/DKIM). Action: check Resend → Emails for that message id and Resend → Suppressions for `cmack@blossomabatherapy.com`.
- **Resend 401/403** → the linked Resend connection's API key isn't scoped to `blossom.abacommandcenter.com`. Action: reconnect the Resend connector with a key that has full sending access for that domain.
- **Resend 422 "domain not verified"** → switch FROM to a verified address (e.g. `noreply@notify.blossom.abacommandcenter.com` once verified, or temporarily `onboarding@resend.dev` to prove the path).
- **Function not invoked at all** → confirm the latest function version is deployed and that the browser request isn't being blocked.

No UI redesign, no routing logic changes — only diagnostics and a more accurate success/failure signal.