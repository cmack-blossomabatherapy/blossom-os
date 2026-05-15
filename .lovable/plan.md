## Problem

The BCBA Performance dashboard reads from `bcba_billable_imports` and `bcba_billable_sessions`. Both tables have RLS policies that only allow `admin`:

```
SELECT/ALL  USING has_role(auth.uid(), 'admin')
```

The user is signed in as Executive (`exec` role only, no `admin`). The route now permits `exec`, the sidebar shows the link, but every Supabase query returns zero rows because RLS blocks them. That's why the dashboard renders empty.

## Fix

Add SELECT policies for the `exec` role on both tables (read-only — execs view the dashboard but don't upload CSVs).

### Migration

```sql
CREATE POLICY "execs read imports"
  ON public.bcba_billable_imports
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'exec'::app_role));

CREATE POLICY "execs read sessions"
  ON public.bcba_billable_sessions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'exec'::app_role));
```

Admin write/upload policies remain unchanged — execs cannot import or modify data, only view it.

## Files

- New migration under `supabase/migrations/` adding the two SELECT policies above.

No frontend changes required; the dashboard will populate as soon as RLS allows the read.
