
-- ============================================================
-- RBT Training Academy — Foundation
-- Canonical source: rbt_pathways / rbt_pathway_steps / rbt_pathway_progress
-- ============================================================

-- 1. New roles for training operations
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lead_rbt';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'floater_rbt';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'traveling_lead_rbt';

COMMIT;
