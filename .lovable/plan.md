## Goal

Right now Teams write and Outlook Calendar write are gated by env secrets (`EMAIL_CC_TEAMS_WRITE`, `EMAIL_CC_CALENDAR_WRITE`). Those can only be flipped by editing project secrets. We'll move them to a database-backed settings row so a Super Admin / Admin can toggle them directly from **System Tools → Email Command Center → Microsoft Integrations** and have them take effect on the next action — no redeploy, no secret juggling.

We'll also surface the current OAuth scope state (Mail / Calendar / Teams) so an admin can see at a glance what's actually granted and reconnect if needed.

## What gets added

1. **DB-backed feature flags** (replaces env reads)
   - New table `public.email_cc_settings` (single-row, `id text primary key default 'global'`):
     - `teams_write_enabled boolean not null default false`
     - `calendar_write_enabled boolean not null default false`
     - `updated_at timestamptz`, `updated_by uuid`
   - GRANTs + RLS: `authenticated` can SELECT; only `has_role(auth.uid(),'admin')` / `'super_admin'` can UPDATE. `service_role` ALL.
   - Seed one row with `id = 'global'`.

2. **`mail-action` edge function**
   - Stop reading `Deno.env.get("EMAIL_CC_TEAMS_WRITE" / "EMAIL_CC_CALENDAR_WRITE")`.
   - Read flags from `email_cc_settings` (via service role). Env values, if set, act as a fallback override only (so existing secret-based deployments don't break).
   - Same `Needs Teams configuration` / `Needs Calendar configuration` audit messages when disabled.

3. **Admin UI: "Microsoft Integrations" card** on `/system/email-command-center`
   - Visible only to Super Admin / Admin (we already gate the page that way).
   - Shows three rows:
     - **Outlook Mail** — green/connected pill if `Mail.ReadWrite` + `Mail.Send` scopes present on the linked MS365 connection.
     - **Outlook Calendar** — scope pill (`Calendars.ReadWrite`) + a **Calendar write** toggle that writes to `email_cc_settings.calendar_write_enabled`. If scope missing, toggle is disabled with a "Reconnect Microsoft 365 with Calendars.ReadWrite" hint and a Reconnect button.
     - **Microsoft Teams** — scope pill (`ChannelMessage.Send`) + a **Teams write** toggle. If scope missing, toggle is disabled with the same reconnect pattern. Admin note explains Teams requires per-user `ChannelMessage.Send` (admin-consent Graph permission).
   - Each toggle calls a small RPC (`set_email_cc_setting(key text, value boolean)`) that re-checks the admin role server-side and updates the row.
   - "Last changed by … at …" line under each toggle.

4. **Client helpers** in `src/lib/os/emailCommand/settings.ts`
   - `getEmailCcSettings()` and `setEmailCcSetting(key, value)`.
   - Used by the new card; cached in component state and refetched on save.

5. **Tests**
   - Migration sanity: row exists, GRANTs present, only admins can UPDATE.
   - Edge function: when `teams_write_enabled = false` → returns `Needs Teams configuration`; when `true` and scope present → proceeds.
   - UI gating: non-admin user does not see the toggles; admin sees them and toggling persists.

## What this does NOT change

- OAuth scope set in `microsoft-oauth-start` already requests `Calendars.ReadWrite`. Adding `ChannelMessage.Send` to that scope list is a one-line follow-up; in this pass the UI just exposes the gap and prompts reconnect.
- No new automations. All Teams / Calendar sends still require human approval in the action queue.

## Technical details

```text
DB
  └─ public.email_cc_settings (single row 'global')
      ├─ teams_write_enabled    bool
      ├─ calendar_write_enabled bool
      └─ updated_at / updated_by
  └─ RPC public.set_email_cc_setting(text, bool)  -- SECURITY DEFINER, admin-only

Edge function (mail-action)
  └─ reads flags from email_cc_settings instead of env
  └─ env vars still honored as override for back-compat

UI (src/pages/os/system/EmailCommandCenter.tsx)
  └─ new <MicrosoftIntegrationsCard/> rendered above the queue
  └─ uses src/lib/os/emailCommand/settings.ts
```

After this, the only thing that still requires *Microsoft-side* configuration is granting the `ChannelMessage.Send` admin-consent scope in Entra (and reconnecting). Everything else — turning Teams or Calendar write on/off — happens in the admin UI immediately.
