/**
 * Blossom OS — CTM call qualification (client re-export).
 *
 * The rules live in ONE place: supabase/functions/_shared/ctm/qualificationCore.ts,
 * which is imported by the edge functions AND by the browser bundle through this
 * module. Do not re-implement qualification logic here.
 */
export * from "../../../supabase/functions/_shared/ctm/qualificationCore";
