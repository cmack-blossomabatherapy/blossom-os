## Root cause

The four pages white-screen with:

> Error: cannot add `postgres_changes` callbacks for realtime:marketing-source-events-live after `subscribe()`.

Several of our realtime hooks create a Supabase channel using a **fixed, hard-coded name**. When two components on the same page each mount the same hook (very common — a page-level hook plus a child panel that uses the same hook), Supabase returns the *same* channel instance for the second caller. That second caller then tries to attach a `.on("postgres_changes", …)` handler after the channel has already `.subscribe()`d — which Supabase now rejects by throwing. The throw during render kills the whole React tree → white screen.

Why exactly these four pages:

- `/marketing/lead-sources` — `SourceManagerCard`, `SourceOpsPanel`, and `IntegrationReadinessPanel` (via `useMarketingIntegrationHealth → useMarketingSourceEvents`) all mount `useMarketingSourceEvents`, colliding on channel `marketing-source-events-live`.
- `/marketing/call-tracking` — `CallQueueSection` plus other panels mount `useMarketingCallEvents` twice, colliding on `marketing-call-events-live`.
- `/marketing/seo` and `/marketing/web-analytics` — the page and its embedded `WebMetricsPanel` both mount `useMarketingWebMetrics`, colliding on `mwm-${sourceSystem ?? "all"}`.

Pages like Reputation and MarketingDashboard don't crash because their realtime channel names already vary per instance / per filter and only one caller mounts them.

## Fix

Make every realtime channel name unique per hook instance so parallel callers each get their own channel.

Files to update (all in `src/hooks/`):

1. `useMarketingSourceEvents.ts` — replace `.channel("marketing-source-events-live")` with a per-instance name.
2. `useMarketingCallEvents.ts` — replace `.channel("marketing-call-events-live")` with a per-instance name.
3. `useMarketingWebMetrics.ts` — replace `.channel(\`mwm-${sourceSystem ?? "all"}\`)` with a per-instance name.
4. `useMarketingReputationEvents.ts` — apply the same fix defensively (already dynamic, but two callers with the same `sourceSystem` filter would collide).
5. `useMarketingWorkItems.ts` — apply the same fix defensively.

Pattern (per hook):

```ts
import { useEffect, useMemo, ... } from "react";

// stable per-hook-instance suffix
const channelId = useMemo(
  () => (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)),
  [],
);

useEffect(() => {
  const channel = supabase
    .channel(`marketing-source-events-live-${channelId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "marketing_source_events" }, () => { void load(); })
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}, [load, channelId]);
```

No component/page changes needed — the callers keep working exactly as they do today.

## Verification

- Reload `/marketing/lead-sources`, `/marketing/call-tracking`, `/marketing/seo`, and `/marketing/web-analytics` — each should render instead of white-screening; the "cannot add postgres_changes callbacks … after subscribe()" console error should be gone.
- Live updates still work: inserting a row into `marketing_source_events` should still trigger a refetch in `SourceManagerCard` / `IntegrationReadinessPanel`.
- No regressions on Reputation / Marketing Dashboard / Campaigns.

## Out of scope

No schema/RLS changes, no UI redesign, no dependency changes. Purely a fix to five realtime hook definitions.
