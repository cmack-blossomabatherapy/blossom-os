import { supabase } from "@/integrations/supabase/client";

export type TrainingFollowupStatus = "pending" | "completed" | "snoozed" | "skipped";
export type TrainingAudience = "rbt" | "bcba" | "both";

export interface TrainingFollowup {
  id: string;
  user_id: string;
  module_id: string;
  module_title: string;
  audience: TrainingAudience;
  due_date: string; // YYYY-MM-DD
  reminder_offsets_days: number[];
  status: TrainingFollowupStatus;
  coordinator_name: string | null;
  coordinator_email: string | null;
  notes: string | null;
  completed_at: string | null;
  last_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingModuleDefault {
  id: string;
  module_id: string;
  audience: TrainingAudience;
  module_title: string;
  default_offset_days: number;
  reminder_offsets_days: number[];
  coordinator_name: string | null;
  coordinator_email: string | null;
  coordinator_role: string | null;
  active: boolean;
}

/** Compose a stable storage key combining audience + raw module id. */
export function composeModuleKey(audience: "rbt" | "bcba", moduleId: string) {
  return `${audience}:${moduleId}`;
}

export async function listMyFollowups(userId: string) {
  const { data, error } = await supabase
    .from("training_followups")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TrainingFollowup[];
}

export async function listAllFollowups() {
  const { data, error } = await supabase
    .from("training_followups")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TrainingFollowup[];
}

export async function listDefaults() {
  const { data, error } = await supabase
    .from("training_module_defaults")
    .select("*")
    .order("module_title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TrainingModuleDefault[];
}

export async function upsertDefault(input: Omit<TrainingModuleDefault, "id"> & { id?: string }) {
  const { data, error } = await supabase
    .from("training_module_defaults")
    .upsert(input, { onConflict: "module_id,audience" })
    .select()
    .single();
  if (error) throw error;
  return data as TrainingModuleDefault;
}

export async function createFollowup(input: {
  user_id: string;
  module_id: string;
  module_title: string;
  audience: TrainingAudience;
  due_date: string;
  reminder_offsets_days?: number[];
  coordinator_name?: string | null;
  coordinator_email?: string | null;
  notes?: string | null;
}) {
  const { data, error } = await supabase
    .from("training_followups")
    .upsert(
      {
        ...input,
        reminder_offsets_days: input.reminder_offsets_days ?? [7, 1],
      },
      { onConflict: "user_id,module_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as TrainingFollowup;
}

export async function updateFollowup(id: string, patch: Partial<TrainingFollowup>) {
  const { data, error } = await supabase
    .from("training_followups")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TrainingFollowup;
}

export async function deleteFollowup(id: string) {
  const { error } = await supabase.from("training_followups").delete().eq("id", id);
  if (error) throw error;
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}