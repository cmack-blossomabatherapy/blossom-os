-- Pass 6: replace broad USING(true) SELECT policies on Scheduling overlay
-- tables with permission-scoped read policies (scheduling.view or clients.view).

DROP POLICY IF EXISTS "sched_overrides_select_authenticated" ON public.scheduling_client_overrides;
CREATE POLICY "sched_overrides_select_with_permission"
ON public.scheduling_client_overrides
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'scheduling.view')
  OR public.has_permission(auth.uid(), 'clients.view')
);

DROP POLICY IF EXISTS "sched_slots_select_authenticated" ON public.scheduling_client_schedule_slots;
CREATE POLICY "sched_slots_select_with_permission"
ON public.scheduling_client_schedule_slots
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'scheduling.view')
  OR public.has_permission(auth.uid(), 'clients.view')
);
