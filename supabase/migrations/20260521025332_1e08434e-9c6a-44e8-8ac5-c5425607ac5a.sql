grant select on table public.bcba_billable_sessions to authenticated;
grant select on table public.bcba_billable_imports to authenticated;

drop policy if exists "state_directors read sessions" on public.bcba_billable_sessions;
create policy "role scoped read sessions"
on public.bcba_billable_sessions
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'exec')
  or public.has_role(auth.uid(), 'ops_manager')
  or public.has_role(auth.uid(), 'qa')
  or public.has_role(auth.uid(), 'auth_team')
  or public.has_role(auth.uid(), 'scheduling')
  or (
    public.has_role(auth.uid(), 'state_director')
    and state = (
      select p.state
      from public.profiles p
      where p.user_id = auth.uid()
      limit 1
    )
  )
);

drop policy if exists "state_directors read imports" on public.bcba_billable_imports;
create policy "role scoped read imports"
on public.bcba_billable_imports
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'exec')
  or public.has_role(auth.uid(), 'ops_manager')
  or public.has_role(auth.uid(), 'qa')
  or public.has_role(auth.uid(), 'auth_team')
  or public.has_role(auth.uid(), 'scheduling')
  or public.has_role(auth.uid(), 'state_director')
);