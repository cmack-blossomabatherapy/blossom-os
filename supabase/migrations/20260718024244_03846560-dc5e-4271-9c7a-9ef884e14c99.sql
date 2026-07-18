
INSERT INTO public.rbt_lifecycle_stages (key, name, description, sort_order, allowed_next_keys, is_active, color)
SELECT 'first_30_days', 'First 30 Days',
       'The first 30 days after the RBT''s first active session — check-ins, coaching, and risk signals.',
       115, ARRAY['active_rbt','offboarding','leave','inactive']::text[], true, 'emerald'
WHERE NOT EXISTS (SELECT 1 FROM public.rbt_lifecycle_stages WHERE key = 'first_30_days');
