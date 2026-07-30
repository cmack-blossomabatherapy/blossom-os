/**
 * Blossom OS — Intake route access model.
 *
 * Single source of truth for `allowedRoles` on every Intake and shared
 * Leads route in App.tsx. Keeping these here prevents the historic drift
 * where each route hand-rolled its own array and silently locked out (or
 * silently exposed) roles.
 */
import { ALL_INTAKE_ROLE_KEYS, DIRECTOR_OF_INTAKE_ROLE_KEYS } from "./intakeRoles";
import {
  OPERATIONS_LEADERSHIP_ROUTE_ROLES,
  STATE_DIRECTOR_ROUTE_ROLES,
} from "@/lib/os/operationsRoles";

const uniq = (roles: string[]) => Array.from(new Set(roles));

/**
 * Everyone who works inside the Intake department workspace:
 * both Intake experiences + operations/exec leadership + state directors.
 */
export const INTAKE_WORKSPACE_ROUTE_ROLES: string[] = uniq([
  ...ALL_INTAKE_ROLE_KEYS,
  ...STATE_DIRECTOR_ROUTE_ROLES,
]);

/**
 * Director-only Intake controls (CTM review & health, assignments and
 * exceptions, templates & configuration). Coordinators are excluded by
 * design — see docs role-based visibility rules.
 */
export const INTAKE_DIRECTOR_ROUTE_ROLES: string[] = uniq([
  ...DIRECTOR_OF_INTAKE_ROLE_KEYS,
  ...OPERATIONS_LEADERSHIP_ROUTE_ROLES,
]);

/**
 * Shared Leads surfaces (`/leads`, `/leads/:id`, `/leads/operations`).
 * Intake owns them, but Growth/BD, Marketing, Case Management and
 * leadership legitimately read family lead records too. Clinical
 * delivery roles (RBT/BCBA) are intentionally excluded — they never
 * need pre-admission family data.
 */
export const LEADS_ROUTE_ROLES: string[] = uniq([
  ...INTAKE_WORKSPACE_ROUTE_ROLES,
  "business_development",
  "marketing",
  "marketing_team",
  "marketing_growth_lead",
  "clinic_growth",
  "case_manager",
  "authorization_manager",
  "authorization_coordinator",
  "authorization_team",
  "authorizations",
  "clinical_director",
]);
