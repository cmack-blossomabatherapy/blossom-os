DROP POLICY IF EXISTS "View academy content" ON public.academy_tracks;
DROP POLICY IF EXISTS "View academy phases" ON public.academy_phases;
DROP POLICY IF EXISTS "View academy weeks" ON public.academy_weeks;
DROP POLICY IF EXISTS "View academy modules" ON public.academy_modules;

CREATE POLICY "Authenticated can view academy tracks" ON public.academy_tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view academy phases" ON public.academy_phases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view academy weeks" ON public.academy_weeks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view academy modules" ON public.academy_modules FOR SELECT TO authenticated USING (true);