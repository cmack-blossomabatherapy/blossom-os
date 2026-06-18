## What I found

I traced the most recent "Welcome to Blossom" invites (from `invite_email_logs`) and asked Resend for each message's final delivery event.

| Recipient | Resend `last_event` |
|---|---|
| eroberts@blossomabatherapy.com | **delivered** |
| mpolter@blossomabatherapy.com | **delivered** |
| mpoulter@blossomabatherapy.com | **bounced** (typo of `mpolter`) |
| dbenenfeld@blossomabatherapy.com | **delivered** |
| emillman@blossomabatherapy.com | **delivered** |

Resend domain check:
- `blossom.abacommandcenter.com` — **status: verified**, sending **enabled**.
- From address used: `Blossom ABA Therapy <welcome@blossom.abacommandcenter.com>` — matches the verified domain.

"Sent" in Resend only means Resend accepted the message from us. **"Delivered" means the recipient's mail server accepted it.** All of the recent welcome emails that went to a real address show `delivered`. So the message reached `blossomabatherapy.com`'s mail server (Google Workspace) successfully. The Resend logs and our code are working correctly.

## Most likely real cause

The emails are landing in **Spam / Junk / Google Workspace Admin Quarantine** on the recipient side, not failing to send. Contributing factors:

1. `blossom.abacommandcenter.com` is a young/low-volume sender domain — Gmail aggressively spam-folders new senders, especially when the recipient is on the same parent brand (`blossomabatherapy.com`) but a *different* domain, which looks like spoofing.
2. The template ships a temporary password in plaintext + has "Welcome to" + a CTA link — classic phishing-filter triggers.
3. No `Reply-To` header is set, and the logo is hot-linked from a `supabase.co` URL — both are mild reputation drags.
4. One bad address (`mpoulter@…`) hard-bounced. Resend now has that address on its **suppression list**, so any retry to that exact string will be silently dropped with `last_event: bounced` regardless of fixes.

## Proposed actions (no code change required to start)

**Immediate, no-code triage (do first):**

1. Ask each affected recipient to check:
   - Gmail **Spam** folder
   - Gmail **All Mail** (search `from:welcome@blossom.abacommandcenter.com`)
   - Their Google Workspace **Admin Quarantine** (a Workspace admin at Blossom must release it; users can't see it themselves)
2. Have the Blossom Google Workspace admin add an **allowlist / safe-sender** entry for `blossom.abacommandcenter.com` (Admin Console → Apps → Gmail → Spam, Phishing and Malware → Email allowlist), then re-send.
3. Fix the typo for `mpoulter@blossomabatherapy.com` → `mpolter@…` and remove `mpoulter@…` from Resend's Suppressions list before retrying that user.

**Small code improvements I can ship in build mode to improve deliverability:**

1. Add a `Reply-To: support@blossomabatherapy.com` header (or whichever real mailbox) to the Resend call in `_shared/welcome-email.ts` — improves DMARC/reply alignment and looks more legitimate to Gmail.
2. Set `tags` on the Resend send (e.g. `{ name: "type", value: "welcome-invite" }`) so we can filter analytics and identify trends.
3. Surface Resend's `last_event` in the Admin → "Resend Welcome Email" UI by calling the existing `admin-check-welcome-email` function, so when someone says "I didn't get it" an admin can instantly see `delivered` / `bounced` / `complained` / `delivery_delayed` and act accordingly.
4. Add a Suppressions check in `admin-resend-welcome-email`: before sending, query Resend's suppressions for that address and refuse with a clear message instead of silently re-sending into a suppression.
5. Optional: stop including the temporary password in the email body — instead send a one-time set-password link. This is the single biggest deliverability and security improvement.

## Technical details

- Function that sends: `supabase/functions/_shared/welcome-email.ts` → `sendBlossomWelcomeEmail()`, called from `admin-invite-user` and `admin-resend-welcome-email`.
- Logs written to: `public.invite_email_logs` (status / resend_message_id / error_message).
- Existing diagnostic function: `admin-check-welcome-email` already fetches `last_event` from Resend per user; it's not wired into the UI.

## What I need from you to proceed

Pick any combination:

- **A.** Just confirm the diagnosis and you'll have recipients check spam + Workspace quarantine.
- **B.** Have me ship the deliverability code improvements (Reply-To, tags, suppression pre-check, surface `last_event` in admin UI).
- **C.** Have me replace the temp-password flow with a one-time set-password magic link (bigger change, best long-term fix).