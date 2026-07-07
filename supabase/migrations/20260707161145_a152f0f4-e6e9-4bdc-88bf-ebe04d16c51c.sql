
-- Add missing CEO role alias
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ceo';
