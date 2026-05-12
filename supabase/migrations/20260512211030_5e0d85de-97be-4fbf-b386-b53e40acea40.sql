
create table if not exists public.bcba_billable_imports (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  filename text,
  row_count integer not null default 0,
  is_active boolean not null default false,
  notes text
);

create table if not exists public.bcba_billable_sessions (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.bcba_billable_imports(id) on delete cascade,
  source_id text,
  date_of_service date,
  client_first text,
  client_last text,
  client_full text generated always as (trim(coalesce(client_first,'') || ' ' || coalesce(client_last,''))) stored,
  bcba_name text,
  provider_first text,
  provider_last text,
  provider_full text generated always as (trim(coalesce(provider_first,'') || ' ' || coalesce(provider_last,''))) stored,
  procedure_code text,
  procedure_description text,
  hours numeric(10,2) not null default 0,
  raw_labels text,
  created_at timestamptz not null default now()
);

create index if not exists idx_bbs_import on public.bcba_billable_sessions(import_id);
create index if not exists idx_bbs_bcba on public.bcba_billable_sessions(bcba_name);
create index if not exists idx_bbs_code on public.bcba_billable_sessions(procedure_code);
create index if not exists idx_bbs_date on public.bcba_billable_sessions(date_of_service);
create index if not exists idx_bbs_client on public.bcba_billable_sessions(client_full);

alter table public.bcba_billable_imports enable row level security;
alter table public.bcba_billable_sessions enable row level security;

create policy "admins read imports" on public.bcba_billable_imports
  for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins write imports" on public.bcba_billable_imports
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "admins read sessions" on public.bcba_billable_sessions
  for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins write sessions" on public.bcba_billable_sessions
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
