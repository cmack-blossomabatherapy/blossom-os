# State Director Training Academy — Launch Checklist

Use this checklist before a new State Director starts. It complements
`docs/training-academy-audit.md` and `docs/department-access-model.md`.

No RBAC, route, or DB schema changes are required to use this checklist —
everything here is operational setup.

## 1. Pre-launch setup

Owner: Operations Leadership + Training Admin.

- [ ] Trainee has been hired and confirmed start date.
- [ ] State assignment confirmed (existing state vs. brand-new state).
- [ ] Mentor identified and notified.
- [ ] Slack / Teams / email / calendar access provisioned (handled outside Blossom OS).

## 2. Employee / user account requirements

- [ ] Auth user created in Lovable Cloud for the new State Director.
- [ ] Employee record exists in `employees` table.
- [ ] **Employee record is linked to the auth user** (this is required for the
      academy progress UI to load for this person).
- [ ] Job title set to "State Director" (or equivalent recognized title).
- [ ] Department / role assigned per `src/lib/rbac.ts`.

## 3. State Director Academy enrollment

- [ ] Assign the State Director Academy enrollment to the employee.
- [ ] Choose path: `existing_state` or `new_state`.
- [ ] Set `assigned_state` (e.g. GA, NC, TN, VA, MD).
- [ ] Set `mentor_employee_id`.
- [ ] Status: `active`.

The Launch Setup panel on `/training/academy/leadership` will surface any
missing setup step automatically.

## 4. Welcome to Blossom assets

Week 1 Day 1 must start with "Welcome to Blossom". The following assets
are tracked by `src/lib/academy/launchAssets.ts` and surfaced on the
leadership dashboard:

- [ ] Welcome Video from Blossom (link when available)
- [ ] Mission & Vision
- [ ] Core Values
- [ ] Meet the Team
- [ ] How Blossom Works
- [ ] Welcome from Chad Kaufman (video link when available)
- [ ] A Note from Shira Lasry (video link when available)

If a welcome video is not yet linked, the asset shows as **Pending** and
the learner sees: *"Video link pending. You can continue with the written
guidance and mark complete when reviewed with your mentor."*

Pending videos **do not block** training. Pending videos **do not block**
the launch — the trainee can continue with written guidance and mentor
review.

## 5. SOP resources from the Resource Library

- [ ] Each SOP module has a linked resource (URL) where available.
- [ ] SOP modules without URLs render as **Pending** attachments —
      visible to leadership in the "SOP resources pending" panel.
- [ ] Plan a follow-up pass to attach the canonical SOP names listed in
      the State Director journey (see `SD_SOPS_BY_WEEK` in
      `src/lib/training/academyData.ts`).

## 6. Verify Week 1 readiness

- [ ] Open `/training/academy` as the new State Director.
- [ ] Week 1 Day 1 shows **Welcome to Blossom** at the top.
- [ ] Welcome video shows the pending-video copy if no URL exists.
- [ ] Written guidance ("Why this matters", "What to do",
      "How to complete") renders on every module.
- [ ] "Start here" / "Review with your mentor" guidance appears on the
      journey dashboard.

## 7. Verify leadership visibility

- [ ] Open `/training/academy/leadership` as a leadership user.
- [ ] Trainee appears as a TraineeCard.
- [ ] Launch Setup panel shows all setup checks (employee linked,
      enrollment active, path selected, state assigned, mentor assigned,
      welcome videos, SOP resources, first week ready, leadership
      visibility).
- [ ] Welcome to Blossom — assets panel renders all 7 items.
- [ ] Launch Readiness checklist renders all 12 items.
- [ ] "Copy readiness summary" copies a plain-text summary to clipboard.
- [ ] At-risk signals render only when truly at risk (calm by default).

## 8. Day-one walkthrough script

Suggested 30-minute kickoff with the new State Director and their mentor:

1. **Welcome (5 min)** — Open `/training/academy`. Walk through the
   5-week / 25-day journey overview. Highlight the "Current focus" and
   "Next action" cards.
2. **Welcome to Blossom (10 min)** — Play any linked welcome videos
   together. If videos are still pending, read the Mission & Vision and
   Core Values modules out loud and mark them complete after discussion.
3. **Mentor expectations (5 min)** — Explain the mentor check-in cadence
   (target 3+ logged check-ins) and the shadowing target (8h minimum).
4. **Tour the leadership dashboard (5 min)** — Show the trainee what
   leadership will see: readiness %, launch checklist, at-risk signals.
   Normalize the at-risk chips — they are coaching prompts, not alarms.
5. **First week plan (5 min)** — Block calendar time for Week 1 modules.
   Confirm next mentor check-in.

## 9. Post-launch QA (Week 1)

- [ ] Confirm modules can be marked complete even when a video link is
      pending (already verified by automated tests; verify manually).
- [ ] Confirm progress shows on the leadership dashboard within 24h.
- [ ] Confirm the trainee is not blocked by any pending asset.
- [ ] If a critical asset is missing, raise it to Operations Leadership
      — do not delete or hide the module.

## Out of scope

The following are explicitly **not** required to launch:

- New RBAC roles
- New routes
- New DB tables or columns
- Changes to the 5-week / 25-day journey structure
- Ingesting sensitive materials marked
  `_Sensitive_Not_For_Shared_Context`