create table public.training_track_enrollments (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.training_tracks(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  assigned_by uuid,
  due_date date,
  status text not null default 'assigned',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track_id, employee_id)
);

create index idx_tte_track on public.training_track_enrollments(track_id);
create index idx_tte_employee on public.training_track_enrollments(employee_id);

alter table public.training_track_enrollments enable row level security;

create policy "Managers can manage track enrollments"
  on public.training_track_enrollments
  for all
  to authenticated
  using (public.has_permission(auth.uid(), 'hr.training.assign') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_permission(auth.uid(), 'hr.training.assign') or public.has_role(auth.uid(), 'admin'));

create policy "Employees can view their own track enrollments"
  on public.training_track_enrollments
  for select
  to authenticated
  using (
    employee_id in (select id from public.employees where user_id = auth.uid())
  );

create trigger trg_tte_touch
  before update on public.training_track_enrollments
  for each row execute function public.touch_updated_at();
