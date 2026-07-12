-- NEUTRALIZED: This migration previously issued an unconditional TRUNCATE across
-- ~180 operational tables. Re-applying it against any environment that now holds
-- real data would wipe intake leads, clients, authorizations, sessions, payroll,
-- HR activity, phone calls, escalations, and training progress.
--
-- The original purge already ran once against the target environment. This file
-- is kept (empty) so the migration history stays intact, but it is now a no-op
-- and safe to run against any database.
SELECT 1;
