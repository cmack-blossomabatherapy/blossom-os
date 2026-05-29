## Make Smart Badge work for every employee — two badge styles

### Root cause

The public `/nfc/:code` page calls `useEmployeeDirectory`, which selects from `v_employee_directory`. The view is granted to `anon`, but the underlying tables (`employees`, `hr_departments`) are not — Postgres views run with the **invoker's** privileges by default, so anon gets an empty result. The tag lookup succeeds, but the employee record never resolves → "This badge isn't recognized."

### Fix in two parts

### Part 1 — Secure public lookup (one migration)

Create a small, security-definer SQL function that returns ONLY the safe public fields:

```sql
create or replace function public.get_nfc_badge(_code text)
returns table (
  employee_id uuid,
  display_name text,
  job_title text,
  credential text,
  photo_url text,
  department_name text,
  states text[],
  badge_style text   -- 'parent_safety' | 'business_card'
)
language sql stable security definer set search_path = public as $$
  select e.id, ..., 
    case
      when lower(coalesce(e.job_title,'')) ~ '(rbt|bcba|bcaba|behavior tech|therapist|behavior analyst)'
        then 'parent_safety'
      else 'business_card'
    end as badge_style
  from public.employee_nfc_tags t
  join public.employees e on e.id = t.employee_id
  left join public.hr_departments d on d.id = e.department_id
  where t.is_active = true
    and (t.tag_code = _code or e.id::text = _code or e.employee_code = _code);
$$;
grant execute on function public.get_nfc_badge(text) to anon, authenticated;
```

Replaces the directory-hook dependency on the public page with a single RPC call that works for both `NFC-XXXX` codes and direct uuid/slug fallbacks. No PHI exposed — only badge-safe fields.

### Part 2 — Two badge layouts (one file)

`src/pages/nfc/NfcPublicProfile.tsx` — switch on `badge_style` returned by the RPC:

**Parent Safety badge (RBTs, BCBAs, Behavior Techs, Therapists)** — current layout:
- Photo + name + role
- "Verified Blossom employee" pill
- Department + state
- **Contact Blossom** button (tel)
- **Report concern** button (mailto)
- Footer: "Personal contact info is never shown"

**Business Card badge (everyone else — admin, ops, leadership, intake, recruiting, marketing, etc.)** — new layout:
- Photo + name + title + credential
- Department + state
- **Email** button (mailto: their work email)
- **Call** button (tel: their work phone, if present)
- **Save to Contacts** button — generates a vCard (.vcf) inline with name, title, email, phone, org "Blossom ABA Therapy"
- **Visit Blossom** link to `blossomabatherapy.com`
- Same Blossom branding header + verified pill

Both share: brand header, verified pill, identical card chrome, OG tags, "Opening Blossom Smart Badge…" loading state.

### Override (optional, low risk)

Add a `badge_style` text column to `employees` (nullable). If set, it overrides the auto-classification. Surfaced as a small toggle in the NFC tab on the employee profile: "Badge style: Parent Safety / Business Card / Auto". Not required for v1 — auto-classification covers it.

### Out of scope

- Photo upload changes
- New auth or login flow
- Per-tag custom URLs or vanity slugs
