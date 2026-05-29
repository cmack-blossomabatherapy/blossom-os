
# Blossom Identity System (BIS)

Goal: Turn the existing employee profile, directory, org chart, NFC badge, and business card pieces into **one connected identity ecosystem** — driven by the May 2026 org chart, with role-aware NFC profiles and a profile completion score.

This is large. I'll deliver it in **four phases** so you see progress fast and can course-correct between phases. Each phase ships working UI.

---

## Phase 1 — Identity data model + org-chart sync (foundation)

**Schema additions** (migration) to the existing `employees` table:
- `preferred_name`, `extension`, `bio`, `about_me`, `expertise` (text[]), `skills` (text[]), `certifications` (text[]), `languages` (text[])
- `manager_employee_id` (FK → employees), `leadership_chain` cached
- `nfc_settings` jsonb: `{ public, internal, business_card, emergency, enabled }`
- `profile_completion_score` (computed view)

**Org-chart sync seed**: a one-time migration that updates every existing employee to match the **May 2026 chart** (department, role, job title, manager, state assignment). Includes Chad Kaufman → CEO/COO, Mordy Gobioff → Asst State Director (VA), Corey Mack → Systems & Software, etc. Fills in the new people (Elie Mintz, Gabi Kaweblum / Director of RCM, Lauren Dawson, Rochell Coulson, Julia Pinder/Behavioral, Cymbre Brumbeloe/Clinic, Jaz Scarponi, Kaylynne Baker).

**Profile completion view**: percentage out of 5 buckets — photo, bio, skills, contact methods, emergency info.

---

## Phase 2 — Employee profile page (the hero surface)

Rebuild `/os/users/:id` (EmployeeProfile.tsx) as the canonical identity surface:
- **Hero**: photo, name, role, dept, state, bio + actions (Email · Call · Teams · Book Meeting · Share · Download vCard)
- **Org section**: Reports To, Direct Reports, Department, Leadership chain (mini interactive org chart slice)
- **Expertise & Skills**: tag cloud
- **NFC settings tile**: toggle public / internal / business card / emergency profiles, with the current NFC URL and "Write to tag" action (keeps existing flow)
- **Profile Completion Score** card with checklist
- **Internal-only panel** (gated): employee #, manager, training status, equipment, PTO, system access

---

## Phase 3 — Directory + Org Chart sync

- `/user-management` directory: Apple-style search + filters (Department, Role, State, Manager, Status). Card shows photo, name, role, dept, state, contact pop, "View Profile".
- Interactive **org chart** page mirroring the May 2026 chart, clickable nodes → profile.
- Admin **Identity Dashboard**: totals by dept/state/role, NFC activated, cards activated, profiles completed, missing photos / managers / departments.

---

## Phase 4 — NFC Smart Profile (role-aware) + Digital Business Card

Replace `NfcPublicProfile.tsx` with a **router** that picks one of 15 role layouts:

| Role | Layout focus |
|---|---|
| Super Admin / Exec / Ops Leadership | Leadership card + meeting scheduler |
| State Director | State + escalation contact |
| Intake / Auth / Scheduling | Service-specific support CTAs |
| Recruiting | Apply Now + careers |
| HR / Payroll / Billing / QA | Department support requests |
| BCBA (public) | Credentials + parent contact; (internal) caseload |
| RBT (public) | Parent safety badge (existing) + assigned BCBA |
| Marketing | Partnership / referral CTAs |

**Digital Business Card** view shared across all roles: photo, title, dept, email/phone/Teams/website, QR, Download vCard, Share. Apple/Google Wallet shape kept ready (not generated yet — flagged future).

Public vs Internal view is decided by auth state at scan time.

---

## What I need from you before I start

This plan touches a lot of files and adds a migration. To keep momentum, **I'll start Phase 1 immediately** unless you say otherwise. After Phase 1's migration applies, I'll continue straight into Phase 2 in the same turn-loop, then check in before Phase 3/4 (since those are the most opinionated UI).

Three quick confirmations would help:

1. **Org-chart authority** — Treat the attached May 2026 chart as the *truth* and overwrite any conflicting current employee fields (department, manager, job title)? Or merge-only (fill blanks, never overwrite)?
2. **Public profile default** — When NFC is enabled for a new employee, default `public` profile = **ON** for clinical (BCBA/RBT) and **business card** = ON for everyone else? (Matches what we built last round.)
3. **Org chart page** — OK to add it as a new route `/org-chart` under HR/Operations, or do you want it embedded inside the existing directory page?

If you just say "go", I'll assume: **overwrite from chart**, **defaults as above**, **new `/org-chart` route**.
