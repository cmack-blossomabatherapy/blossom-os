-- 1) Retire legacy duplicate pathways
UPDATE public.rbt_pathways SET is_active = false, updated_at = now()
WHERE key IN ('certification','developing');

-- 2) Fourth bucket: certified with no experience
UPDATE public.rbt_pathways
SET name = 'Certified RBT — No Experience',
    description = 'Certified RBTs who are new to hands-on ABA delivery. Full competency, documentation and first-case support.',
    is_active = true,
    updated_at = now()
WHERE key = 'fast_track';

CREATE OR REPLACE FUNCTION public.resolve_rbt_pathway_key(_cert_status text, _years numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _cert_status = 'not_certified' THEN 'new_rbt_certification'
    WHEN _cert_status = 'certified' AND COALESCE(_years, 0) <= 0 THEN 'fast_track'
    WHEN _cert_status = 'certified' AND _years > 0 AND _years < 2 THEN 'under_2_years'
    WHEN _cert_status = 'certified' AND _years >= 2 THEN 'experienced_rbt'
    ELSE NULL
  END
$$;

-- 3) Welcome to Blossom is always the first step
INSERT INTO public.rbt_pathway_steps
  (pathway_id, order_index, key, title, description, required, kind, component_type, estimated_days, delivery_mode, capabilities)
SELECT p.id, 0, 'welcome_to_blossom', 'Welcome to Blossom',
       'Who we are, how we work, and what your first weeks look like. Everyone starts here.',
       true, 'orientation', 'welcome', 1, 'self_paced', '["orientation","culture"]'::jsonb
FROM public.rbt_pathways p
WHERE p.key IN ('new_rbt_certification','fast_track','under_2_years','experienced_rbt')
  AND NOT EXISTS (
    SELECT 1 FROM public.rbt_pathway_steps s
    WHERE s.pathway_id = p.id AND s.key = 'welcome_to_blossom'
  );

-- 4) Hard readiness gates — no soft clears
UPDATE public.rbt_pathway_steps s
SET blocks_readiness_gate = g.gate, required = true, updated_at = now()
FROM (
  SELECT s2.id,
    CASE
      WHEN s2.key = 'welcome_to_blossom'                                    THEN 'orientation_complete'
      WHEN s2.kind = 'orientation' OR s2.component_type = 'orientation'     THEN 'orientation_complete'
      WHEN s2.kind = 'exam'                                                 THEN 'certification_verified'
      WHEN s2.title ILIKE '%role-play%' OR s2.kind = 'practice'             THEN 'role_play_complete'
      WHEN s2.title ILIKE '%session-note%' OR s2.title ILIKE '%session note%' THEN 'session_note_practice_reviewed'
      WHEN s2.title ILIKE '%competency%' OR s2.kind = 'demonstration'       THEN 'competency_complete'
      WHEN s2.kind = 'signoff' OR s2.title ILIKE '%signoff%'                THEN 'bcba_signoff_complete'
      WHEN s2.title ILIKE '%readiness%'                                     THEN 'readiness_evaluation_complete'
      WHEN s2.title ILIKE '%staff the case%' OR s2.title ILIKE '%ready to staff%' THEN 'staffing_approval_complete'
      WHEN s2.kind IN ('lesson','training') OR s2.component_type IN ('zoom_learning_day','aba_fundamentals','competency_prep') THEN 'required_courses_complete'
      ELSE NULL
    END AS gate
  FROM public.rbt_pathway_steps s2
  JOIN public.rbt_pathways p2 ON p2.id = s2.pathway_id
  WHERE p2.key IN ('new_rbt_certification','fast_track','under_2_years','experienced_rbt')
) g
WHERE g.id = s.id AND g.gate IS NOT NULL;