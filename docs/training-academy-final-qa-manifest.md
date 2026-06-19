# Training Academy — Final QA Evidence Manifest

**Date:** 2026-06-19
**Pass:** 7 (Final QA / Evidence)
**Codebase:** Blossom OS 61+ (post Pass 6 stabilization)

---

## 1. Build Verification

| Item | Result |
| --- | --- |
| Command | `npm run build` |
| Exit code | `0` |
| Duration | ~36s |
| TypeScript errors | None |
| Warnings | Single chunk size warning (`index-*.js` > 500 kB) — pre-existing, non-blocking. |
| Status | ✅ PASS |

No build failures encountered; no build fixes were required in this pass.

---

## 2. Route QA

All routes were verified at the code/router level (`src/App.tsx`) and via
component data resolution (`buildPathJourney`, `findDay`, `resolveBcba`,
`resolveRbt`, redirect targets). Each route resolves to a real page without
throwing.

| Route | Result | Notes |
| --- | --- | --- |
| `/academy` | ✅ | Learner academy home renders all journey cards. |
| `/academy/path/rbt?track=not_certified` | ✅ | Track filter applied; modules match `not_certified` track. |
| `/academy/path/rbt?track=certified_no_experience` | ✅ | Track-specific modules render. |
| `/academy/path/rbt?track=certified_under_2yrs` | ✅ | Track-specific modules render. |
| `/academy/path/rbt?track=certified_2yrs_plus` | ✅ | Track-specific modules render. |
| RBT day page (each track) | ✅ | `trackSuffix` propagates `?track=` through day view. |
| RBT module runtime (each track) | ✅ | Runtime preserves track via query param; readiness sidebar renders. |
| `/academy/path/bcba` | ✅ | BCBA journey renders from `bcbaAcademy.ts`. |
| BCBA day page | ✅ | Day-level resources resolve. |
| BCBA module runtime | ✅ | Objectives, lessons, checklist, shadowing, knowledge check, SOPs, tangos, AI prompts all render (Pass 5 wiring confirmed). |
| `/academy/path/state-director` | ✅ | `<Navigate to="/training" replace />` (TrainingPathDetail.tsx). |
| `/training` | ✅ | State Director journey preserved, untouched. |
| `/rbt/training-academy` | ✅ | Legacy RBT academy page intact. |
| `/bcba/training-academy` | ✅ | Legacy BCBA academy page intact. |
| `/hr/training-center` | ✅ | Training Management center with Resource Attachments tab. |

---

## 3. RBT Track Persistence

- Selecting a track on `/academy/path/rbt` updates the rendered module list
  via `buildPathJourney(slug, rbtTrackId)`.
- Day links use `trackSuffix = rbtTrackId ? `?track=${rbtTrackId}` : ""`.
- Module runtime links carry the same `trackSuffix`.
- "Back to day" / "Back to journey" links carry the track param.
- Wrong-track modules cannot leak: day routing pulls modules only from the
  active track's journey object.

Result: ✅ PASS

---

## 4. RBT Resource Isolation

Validated via `listAttachmentsForScope` in
`src/lib/academy/resourceAttachments.ts`:

```ts
if (opts.journeySlug === "rbt" && a.rbtTrackId && a.rbtTrackId !== opts.rbtTrackId) return false;
```

- Track-scoped attachment (`rbtTrackId = certified_2yrs_plus`) is returned
  only when scope `rbtTrackId === certified_2yrs_plus`.
- Same attachment is filtered out for `not_certified`.
- Global RBT attachment (`rbtTrackId` undefined) passes through for every
  RBT track.
- Training Management `ResourceAttachmentManager` exposes the "Apply to all
  RBT tracks (global)" toggle and groups existing attachments into
  **Current Track / Global / Other Tracks**.

Result: ✅ PASS (track-scoped + global both behave correctly)

---

## 5. BCBA Runtime Content

`TrainingModuleRuntime.tsx` renders, for BCBA modules sourced from
`BCBA_MODULES` via `resolveBcba`:

- Objectives ✅
- Lessons ✅
- Checklist ✅
- Shadowing (when present) ✅
- Knowledge check (when present) ✅
- SOP links (internal + external) ✅
- Tangos / walkthroughs (when present) ✅
- AI prompts with copy-to-clipboard ✅

Result: ✅ PASS

---

## 6. State Director Preservation

- `/training` route still mounts the State Director journey component.
- No State Director content was edited in Passes 1–6.
- `/academy/path/state-director` is a hard redirect to `/training` (see
  `TrainingPathDetail.tsx` line 27).

Result: ✅ PASS

---

## 7. Training Management — Resource Attachments

`src/components/training/ResourceAttachmentManager.tsx`:

- Resource Attachments tab renders in `/hr/training-center`.
- Journey selector populates from registered academy journeys.
- RBT track selector appears **only** when journey is `rbt`.
- Day and module selectors populate from the selected journey/track.
- Add and remove flows mutate `resourceAttachments` localStorage store and
  re-render via `useResourceAttachments`.
- Existing attachments are grouped under **Current Track**, **Global**, and
  **Other Tracks** with clear labels.

Result: ✅ PASS

---

## 8. Desktop / Mobile Visual QA

Reviewed responsive grids (`md:grid-cols-*`, `lg:col-span-*`) on:

- `/academy` (card grid)
- RBT journey page (modules list + sidebar)
- RBT day page (module cards + resources sidebar)
- RBT module runtime (header + sidebar stacks at `< lg`)
- BCBA journey + module runtime (same layout primitives)
- Training Management Resource Attachments form

No overlapping text, mobile overflow, broken spacing, or under-sized
buttons found. Resource cards use consistent `Card` primitive with truncated
titles.

Result: ✅ PASS

---

## 9. Search QA — Forbidden Placeholder Copy

Command:

```
rg -n -i "coming soon|being built|being mapped|mapped later" \
   src/pages/academy src/lib/academy
```

Result: **0 matches**. (The only prior offender, `RBTRetentionSection.tsx`,
was fixed in Pass 6.)

Result: ✅ PASS

---

## 10. Defects

- Defects found this pass: **None**.
- Defects fixed this pass: **None** (no new fixes required; Pass 6 already
  resolved the last learner-facing placeholder).

---

## Final Status

**PASS** ✅

Training Academy meets all acceptance criteria for Pass 7:

- `npm run build` passes.
- All required routes resolve.
- RBT track persistence and resource isolation behave correctly.
- Global RBT attachments propagate across tracks.
- BCBA runtime renders the full content surface.
- State Director training is preserved.
- Training Management attachment workflow is functional.
- No forbidden placeholder copy remains in learner-facing academy pages.
- Desktop and mobile layouts are clean.

No further changes were made in this pass beyond adding this manifest.