import { supabase } from "@/integrations/supabase/client";
import type {
  AcademyTrack, AcademyPhase, AcademyWeek, AcademyModule,
  AcademyEnrollment, AcademyProgress, AcademyShadowSession, AcademyCheckin,
} from "./types";

export interface AcademyCurriculum {
  track: AcademyTrack;
  phases: (AcademyPhase & { weeks: (AcademyWeek & { modules: AcademyModule[] })[] })[];
}

export async function loadCurriculum(): Promise<AcademyCurriculum | null> {
  const { data: tracks } = await supabase.from("academy_tracks").select("*").eq("is_active", true).limit(1);
  const track = tracks?.[0] as AcademyTrack | undefined;
  if (!track) return null;
  const [{ data: phases }, { data: weeks }, { data: modules }] = await Promise.all([
    supabase.from("academy_phases").select("*").eq("track_id", track.id).order("position"),
    supabase.from("academy_weeks").select("*, phase:academy_phases!inner(track_id)").eq("phase.track_id", track.id).order("week_number"),
    supabase.from("academy_modules").select("*").order("position"),
  ]);
  const weeksByPhase = new Map<string, (AcademyWeek & { modules: AcademyModule[] })[]>();
  for (const w of (weeks ?? []) as any[]) {
    const wk: AcademyWeek & { modules: AcademyModule[] } = { ...(w as AcademyWeek), modules: [] };
    const arr = weeksByPhase.get(w.phase_id) ?? [];
    arr.push(wk); weeksByPhase.set(w.phase_id, arr);
  }
  const allWeeks = Array.from(weeksByPhase.values()).flat();
  for (const m of (modules ?? []) as AcademyModule[]) {
    const w = allWeeks.find((x) => x.id === m.week_id);
    if (w) w.modules.push(m);
  }
  return {
    track,
    phases: (phases ?? []).map((p) => ({ ...(p as AcademyPhase), weeks: weeksByPhase.get(p.id) ?? [] })),
  };
}

export async function getMyEnrollment(employeeId: string): Promise<AcademyEnrollment | null> {
  const { data } = await supabase.from("academy_enrollments").select("*").eq("employee_id", employeeId).maybeSingle();
  return (data as AcademyEnrollment) ?? null;
}

export async function listEnrollments(): Promise<(AcademyEnrollment & { employee?: any })[]> {
  const { data } = await supabase
    .from("academy_enrollments")
    .select("*, employee:employees(id, first_name, last_name, job_title, state, work_setting, avatar_url)")
    .order("created_at", { ascending: false });
  return (data ?? []) as any;
}

export async function enrollEmployee(input: { employee_id: string; track_id: string; path: "new_state" | "existing_state"; assigned_state?: string | null; mentor_employee_id?: string | null; }) {
  return supabase.from("academy_enrollments").insert({
    employee_id: input.employee_id,
    track_id: input.track_id,
    path: input.path,
    assigned_state: input.assigned_state ?? null,
    mentor_employee_id: input.mentor_employee_id ?? null,
    status: "active",
  }).select("*").single();
}

export async function listProgress(enrollmentId: string): Promise<AcademyProgress[]> {
  const { data } = await supabase.from("academy_progress").select("*").eq("enrollment_id", enrollmentId);
  return (data ?? []) as AcademyProgress[];
}

export async function upsertProgress(enrollmentId: string, moduleId: string, patch: Partial<AcademyProgress>) {
  return supabase.from("academy_progress").upsert(
    { enrollment_id: enrollmentId, module_id: moduleId, ...patch },
    { onConflict: "enrollment_id,module_id" }
  ).select("*").single();
}

export async function listShadowSessions(enrollmentId: string): Promise<AcademyShadowSession[]> {
  const { data } = await supabase.from("academy_shadow_sessions").select("*").eq("enrollment_id", enrollmentId).order("session_date", { ascending: false });
  return (data ?? []) as AcademyShadowSession[];
}

export async function logShadowSession(row: Partial<AcademyShadowSession> & { enrollment_id: string }) {
  return supabase.from("academy_shadow_sessions").insert(row).select("*").single();
}

export async function listCheckins(enrollmentId: string): Promise<AcademyCheckin[]> {
  const { data } = await supabase.from("academy_checkins").select("*").eq("enrollment_id", enrollmentId).order("meeting_date", { ascending: false });
  return (data ?? []) as AcademyCheckin[];
}

export async function logCheckin(row: Partial<AcademyCheckin> & { enrollment_id: string }) {
  return supabase.from("academy_checkins").insert(row).select("*").single();
}

export interface ReadinessBreakdown {
  training: number; shadowing: number; immersion: number; mentor: number; quiz: number; overall: number;
}

export function computeReadiness(opts: {
  modules: AcademyModule[];
  progress: AcademyProgress[];
  shadowHours: number;
  checkins: AcademyCheckin[];
  path: "new_state" | "existing_state";
}): ReadinessBreakdown {
  const applies = (m: AcademyModule) =>
    m.applies_to === "either" || m.applies_to === opts.path;
  const required = opts.modules.filter((m) => applies(m) && m.is_required);
  const completed = (id: string) => opts.progress.find((p) => p.module_id === id)?.status === "completed";

  const trainingMods = required.filter((m) => ["training","video","sop","task","meeting"].includes(m.module_type));
  const shadowMods = required.filter((m) => m.module_type === "shadowing");
  const quizMods = required.filter((m) => m.module_type === "quiz");
  const reflectionMods = required.filter((m) => m.module_type === "reflection");

  const pct = (arr: AcademyModule[]) => (arr.length === 0 ? 100 : Math.round((arr.filter((m) => completed(m.id)).length / arr.length) * 100));

  const training = pct(trainingMods);
  const shadowing = shadowMods.length === 0 ? Math.min(100, Math.round((opts.shadowHours / 8) * 100)) : pct(shadowMods);
  const immersion = pct(reflectionMods);
  const ratings = opts.checkins.map((c) => c.leader_rating).filter((r): r is number => typeof r === "number");
  const mentor = ratings.length === 0 ? 60 : Math.round((ratings.reduce((a,b)=>a+b,0) / ratings.length / 5) * 100);
  const quiz = quizMods.length === 0 ? 100 : (() => {
    const scores = quizMods.map((m) => opts.progress.find((p) => p.module_id === m.id)?.score ?? null).filter((s): s is number => s !== null);
    return scores.length === 0 ? 0 : Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
  })();

  const overall = Math.round(0.40*training + 0.20*shadowing + 0.15*immersion + 0.15*mentor + 0.10*quiz);
  return { training, shadowing, immersion, mentor, quiz, overall };
}