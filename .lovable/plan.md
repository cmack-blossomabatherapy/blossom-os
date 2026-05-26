# Marketing Team Role — Phased Build Plan

The Marketing Team role is the final major role ecosystem for Blossom OS. Today the sidebar already lists most marketing items, but **every destination is a placeholder** (`OSPlaceholder`) and the structure doesn't quite match the spec. This plan rebuilds it correctly, in phases, on real Blossom OS data (`mockLeads`, `mockPhoneCalls`, `mockCandidates`, `useOpsIntelligence`, etc.) — no fake numbers, no analytics overload.

## Target structure (locked from your spec)

```text
HOME
  /marketing                           → Marketing Dashboard
  /marketing/training                  → Training Academy (marketing role)

GROWTH & MARKETING
  /marketing/campaigns                 → Campaigns
  /marketing/lead-sources              → Lead Sources
  /marketing/seo                       → SEO & Content
  /marketing/web-analytics             → Web Analytics
  /marketing/call-tracking             → Call Tracking

RELATIONSHIPS
  /marketing/referrals                 → Referrals
  /marketing/recruiting                → Recruiting Marketing
  /marketing/outreach                  → Community Outreach
  /marketing/reputation                → Reputation

INTELLIGENCE & ROI
  /marketing/attribution               → Attribution & ROI
  /marketing/state-growth              → State Growth

AI & AUTOMATIONS
  /ai/assistant                        → Ask Blossom AI (already global)
```

That's **12 marketing pages** to build + the global AI route. The legacy `/marketing/reports` route + `OSMarketingDashboard` will be removed.

## Phase 1 — Foundation (shared primitives + routing)
- Create `src/pages/os/marketing/_shared.tsx` (mirrors the executive/ops pattern: `MktgPage`, `MktgCard`, `MetricTile`, `HealthPill`, `AIPrompt`, `ActionPill`, `EmptyRow`).
- Create `src/hooks/useMarketingIntelligence.ts` — single hook that aggregates real signals from `mockLeads`, `mockPhoneCalls`, `mockCandidates`, `useOpsIntelligence`, and surfaces: `bySource`, `byState`, `leadVelocity`, `callVolume`, `recruitingPipeline`, `reputationSignals`.
- Restructure sidebar in `OSShell.tsx`: groups exactly as above; rename "Marketing Ops" → "Dashboard"; add Training Academy + Ask Blossom AI; remove "Marketing Reports".
- Add the 12 routes in `App.tsx`, point them at the new pages. Remove the legacy `OSMarketingDashboard` import + `/marketing-dashboard` route. Update `roleHome.ts` to point `marketing_team` → `/marketing`.

**Stop and check.** Sidebar and routes correct, every link lands on a page (initially the new shells render a clean "Coming online" skeleton from real data so nothing 404s).

## Phase 2 — HOME pages
1. **Marketing Dashboard** — growth pulse: where leads come from (real `bySource`), state pulse, call momentum, top campaigns, reputation snapshot, AI Insights strip. One screen, calm, no chart walls.
2. **Training Academy (marketing)** — role-scoped onboarding/SEO/reputation/outreach/campaign tracks. Reuses any global academy primitives if present, else lightweight cards.

## Phase 3 — GROWTH & MARKETING pages
3. Campaigns
4. Lead Sources
5. SEO & Content
6. Web Analytics
7. Call Tracking

Each: header + 1 focused "headline" card + 2–3 supporting cards + AI prompt strip + quick-action pills. All wired to real lead/call data and `useMarketingIntelligence`.

## Phase 4 — RELATIONSHIPS pages
8. Referrals
9. Recruiting Marketing (joins `mockCandidates` + recruiting source signals)
10. Community Outreach
11. Reputation

## Phase 5 — INTELLIGENCE & ROI pages
12. Attribution & ROI
13. State Growth (combines marketing + operational growth signals from `useStateWorkforce`)

## Phase 6 — Verification
- Sweep every page for hardcoded colors (must use semantic tokens).
- Verify all internal links resolve.
- Verify every page renders without runtime errors.
- Visit the role in preview, screenshot the dashboard, confirm calm, Apple-inspired feel.

## How we'll proceed
I'll execute **Phase 1** immediately so the structure is correct end-to-end, then continue through the remaining phases in order, pausing only if a real ambiguity comes up. Reply with anything to adjust before I start; otherwise I'll begin Phase 1.
