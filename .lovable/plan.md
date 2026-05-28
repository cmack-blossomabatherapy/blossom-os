
# Evaluation & Outreach Email Plan

Two separate email lanes, each with the right tool for the job.

## Lane 1 — Automated notifications via Resend (already connected)

Resend is linked. We just need to actually drain the `evaluation_emails` queue and send.

1. **New edge function `send-evaluation-emails`**
   - Reads `evaluation_emails` rows where `status = 'Queued'` and `scheduled_send_at <= now()`
   - Renders branded HTML per `template_key` (self-eval request, reviewer assignment, reminder, overdue, completion) using the Blossom email design system
   - Sends via Resend gateway (same pattern as `send-training-assignment-email`)
   - Updates row to `Sent` with `sent_at`, or `Failed` with `failed_reason`
   - Idempotency by `evaluation_emails.id`

2. **Cron schedule** every 5 min via `pg_cron` + `pg_net` to invoke the function.

3. **"Send now" button** in the existing `EmailQueueTab` to dispatch a single row on demand.

4. **From address**: `notifications@<your-resend-domain>` — confirm which Resend-verified domain we should use (the connection is "ABACommandCenter.com Resend", so likely `notifications@abacommandcenter.com`).

## Lane 2 — Reviewer outreach via personal Outlook (per-user OAuth)

This is the bigger piece. The Microsoft Outlook **workspace connector only authenticates one shared mailbox** — it cannot send "as" each reviewer. For each BCBA/HR person to send from their own Outlook (so replies land in their inbox and the message appears in their Sent folder), we need per-user Microsoft OAuth.

**What this requires:**

1. **Azure app registration** (one-time, done by you in Microsoft Entra)
   - Redirect URI: `https://<project>.supabase.co/functions/v1/outlook-oauth-callback`
   - Microsoft Graph delegated scopes: `Mail.Send`, `offline_access`, `User.Read`
   - You provide `MS_CLIENT_ID` + `MS_CLIENT_SECRET` as secrets

2. **New table `outlook_connections`**
   - `user_id`, `ms_email`, `access_token` (encrypted), `refresh_token` (encrypted), `expires_at`, `scope`
   - RLS: each user reads/writes only their own row

3. **Edge functions**
   - `outlook-oauth-start` → builds Microsoft consent URL, returns it to client
   - `outlook-oauth-callback` → exchanges code for tokens, stores in `outlook_connections`
   - `send-outlook-email` → loads caller's tokens, refreshes if expired, POSTs to `https://graph.microsoft.com/v1.0/me/sendMail`
   - `outlook-disconnect` → revokes/removes the row

4. **UI**
   - **Profile / Settings**: "Connect Outlook" button → after consent shows connected mailbox + Disconnect
   - **Staff profile drawer** (1:1 outreach): "Email via Outlook" composer (To prefilled, Subject, Body, optional template); on send → `send-outlook-email`; log to `evaluation_emails` with `email_type='outreach'`, `template_key='outlook_manual'`
   - **Cycle page** (bulk outreach): multi-select staff → compose once → loops `send-outlook-email` per recipient (sequential, 1/sec to respect Graph throttling), shows per-row success/fail, logs each to `evaluation_emails`
   - Gracefully disabled with "Connect Outlook to send outreach" if the user has no `outlook_connections` row

5. **Reply handling**: replies go to the reviewer's real Outlook inbox — no app-side ingestion in v1.

## Routing summary

| Email | Sender | How |
|---|---|---|
| Self-eval request to staff | Resend | Queue → cron dispatcher |
| Reviewer assignment | Resend | Queue → cron dispatcher |
| Reminder / overdue / completion | Resend | Queue → cron dispatcher |
| 1:1 reviewer outreach from staff profile | Outlook (reviewer's mailbox) | On-demand `send-outlook-email` |
| Bulk cycle outreach from HR | Outlook (HR user's mailbox) | Loop `send-outlook-email`, logged per-recipient |

## Open questions before I build

1. **Resend From address** — confirm the verified domain & sender (e.g. `notifications@abacommandcenter.com`).
2. **Azure app** — do you already have an Entra/Azure AD app, or do I include step-by-step instructions for creating one and you'll provide `MS_CLIENT_ID` / `MS_CLIENT_SECRET`?
3. **Scope of v1** — should I build both lanes in one pass, or ship Lane 1 (Resend dispatcher) first and add Lane 2 (Outlook OAuth) after you've created the Azure app?
