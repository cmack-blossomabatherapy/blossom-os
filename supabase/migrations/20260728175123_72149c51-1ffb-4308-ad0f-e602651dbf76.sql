UPDATE public.rbt_pathways SET name = 'Not Certified' WHERE key = 'new_rbt_certification';
UPDATE public.rbt_pathways SET name = 'Certified — No Experience' WHERE key = 'fast_track';
UPDATE public.rbt_pathways SET name = 'Certified — Under 2 Years' WHERE key = 'under_2_years';
UPDATE public.rbt_pathways SET name = 'Certified — 2+ Years' WHERE key = 'experienced_rbt';