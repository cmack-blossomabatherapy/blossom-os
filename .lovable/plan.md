## Goal
Detect newly critical overdue items every 5 minutes and deliver Web Push notifications to subscribed users with a deep-link payload that opens the right record.

## Scope decisions (confirmed)
- Trigger: any alert with `severity = 'critical'` that is overdue, regardless of category.
- Detection: production path — alerts persisted in the database, scheduled edge function runs every 5 min.
- iOS: add minimal manifest + service worker so iOS PWAs can receive push. No in-app "Add to Home Screen" UI.

## Architecture

```text
[ pg_cron every 5 min ]
        │
        ▼
[ edge fn: scan-critical-alerts ]
   1. SELECT critical+overdue alerts not yet pushed
   2. For each alert × subscribed user → web push
   3. Mark alert as pushed (push_state)
        │
        ▼
[ web-push (VAPID) → browser ]
        │
        ▼
[ /public/sw.js → showNotification → click → deep_link route ]
```

## Database (new tables)

`critical_alerts` — canonical list the scanner reads
- `id uuid pk`
- `category text` (`authorization`, `qa`, `scheduling`, `lead`, `client`, …)
- `severity text` check in (`info`,`warning`,`critical`)
- `title text`, `message text`
- `record_id uuid` (the underlying client/auth/qa row)
- `record_type text`
- `deep_link text` (e.g. `/authorizations/<id>`)
- `due_at timestamptz`
- `is_overdue bool generated` (or computed in scanner)
- `status text` (`open`, `acknowledged`, `resolved`)
- `assignee_user_id uuid null`
- `created_at`, `updated_at`
- `pushed_at timestamptz null` ← scanner writes this once a push fires (dedupe key)
- RLS: any signed-in user can `SELECT`; only admins can write. Scanner uses service role.

`push_subscriptions` — one row per browser/device per user
- `id uuid pk`
- `user_id uuid` (auth.users)
- `endpoint text unique`
- `p256dh text`, `auth text`
- `user_agent text`
- `created_at`
- RLS: users can manage only their own rows.

## Edge functions

1. `push-subscribe` (POST) — auth-required, upserts a `push_subscriptions` row for `auth.uid()`.
2. `push-unsubscribe` (POST) — auth-required, deletes by endpoint.
3. `scan-critical-alerts` (cron) — service role:
   - `SELECT * FROM critical_alerts WHERE severity='critical' AND due_at <= now() AND pushed_at IS NULL`
   - For each alert: pick subscription set (assignee if set, else all admins).
   - Send web push with payload `{ title, body, url: deep_link, alertId, category }` using VAPID.
   - Update `pushed_at = now()` on success; drop expired/410 subscriptions.
4. Scheduled via `pg_cron` + `pg_net` to call the edge function every 5 minutes (uses `supabase--insert` so the cron SQL doesn't ship in migrations).

## Secrets needed
- `VAPID_PUBLIC_KEY` (also exposed to client via a tiny edge fn `push-public-key` so we don't bake it in)
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (mailto:)

I'll generate the VAPID pair locally (`npx web-push generate-vapid-keys`) and use `add_secret` to request the user enters them.

## Frontend

- `public/sw.js` — handles `push` event (showNotification with deep-link in `data.url`) and `notificationclick` (focuses an existing tab and posts a navigate message, or opens a new window at `data.url`).
- `public/manifest.webmanifest` — minimal: `name`, `short_name`, `start_url:'/'`, `display:'standalone'`, `theme_color`, `background_color`, two icons (use existing favicon as 192/512 placeholder).
- `index.html` — link manifest, set `apple-mobile-web-app-capable`, theme color, single 180×180 apple-touch-icon.
- `src/lib/push/registerPush.ts` — registers `sw.js` in production-only contexts (skip iframes / `id-preview--*` / `lovableproject.com` per PWA guidance), fetches the public VAPID key, calls `pushManager.subscribe`, posts to `push-subscribe`.
- `src/components/settings/PushNotificationsCard.tsx` — Settings panel showing permission status, an "Enable push notifications" button, and per-device list with "Disable on this device".
- Deep-link handling lives in `App.tsx` via a small effect that listens for `navigator.serviceWorker` `message` events and calls `navigate(url)`.

## Service-worker safety
- Worker only registered when not in iframe and not on Lovable preview hosts (matches existing PWA guidance — prevents preview-cache pollution).
- No Workbox / vite-plugin-pwa. Hand-rolled `sw.js` only handles `push` and `notificationclick` — no fetch caching at all, so it cannot serve stale HTML.

## Demo seeding (since data is currently mock)
- Add a tiny "Generate test critical alert" admin-only button on Settings that inserts a row into `critical_alerts` with `due_at = now() - 1 minute`. Within 5 min the scanner picks it up and pushes.

## What I will NOT change
- No edits to existing mock pages beyond hooking into deep links.
- No refactor of the alert/“active alerts” UI surfaces — that's a separate request.

## Out of scope
- Translating every existing mock alert source into rows in `critical_alerts` (would require business-rule decisions per module). The schema is ready for it; population is incremental.
- Native iOS/Android apps; APNs/FCM. Web Push only.
