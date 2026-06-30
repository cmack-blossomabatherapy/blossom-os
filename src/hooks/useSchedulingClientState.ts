import { supabase } from "@/integrations/supabase/client";
import type { ScheduleSlot } from "@/data/clients";

/**
 * Durable Scheduling overlay state.
 *
 * Scheduling clients in Blossom OS are loaded from `monday_clients_raw`,
 * so their ids are NOT real `public.clients.id` values. We therefore key
 * everything by a stable text `client_key` (the Monday item id or raw row id)
 * and store overlay fields here so they survive refresh and Monday re-import.
 *
 * These helpers never claim CentralReach has been synced — that is a
 * separate worker that does not yet exist.
 */

export interface SchedulingClientOverrideRow {
  id: string;
  client_key: string;
  client_name: string | null;
  source_system: string;
  source_record_id: string | null;
  state: string | null;
  rbt_name: string | null;
  start_date: string | null;
  staffing_status: string | null;
  scheduling_status: string | null;
  centralreach_sync_status: string;
  metadata: Record<string, unknown> | null;
  updated_at: string;
}

export interface SchedulingScheduleSlotRow {
  id: string;
  client_key: string;
  client_name: string | null;
  source_system: string;
  source_record_id: string | null;
  state: string | null;
  day: ScheduleSlot["day"];
  start_time: string;
  end_time: string;
  rbt_name: string | null;
  location: string | null;
  notes: string | null;
  centralreach_sync_status: string;
}

// Anonymous helper used internally to coerce `any` chain types without
// pulling generated names that don't exist until types.ts regenerates.
const t = () => supabase as unknown as {
  from: (name: string) => {
    select: (cols: string) => {
      in: (col: string, values: string[]) => Promise<{ data: unknown[] | null; error: Error | null }>;
    };
  };
};

export interface UpsertClientOverrideParams {
  clientKey: string;
  clientName?: string | null;
  state?: string | null;
  sourceSystem?: string;
  sourceRecordId?: string | null;
  rbtName?: string | null;
  startDate?: string | null;
  staffingStatus?: string | null;
  schedulingStatus?: string | null;
  centralReachSyncStatus?: string;
  metadata?: Record<string, unknown>;
}

export async function listSchedulingClientOverrides(
  clientKeys?: string[],
): Promise<SchedulingClientOverrideRow[]> {
  if (clientKeys && clientKeys.length === 0) return [];
  const cols =
    "id, client_key, client_name, source_system, source_record_id, state, rbt_name, start_date, staffing_status, scheduling_status, centralreach_sync_status, metadata, updated_at";
  if (clientKeys && clientKeys.length > 0) {
    const { data, error } = await t().from("scheduling_client_overrides").select(cols).in("client_key", clientKeys);
    if (error) throw error;
    return (data ?? []) as unknown as SchedulingClientOverrideRow[];
  }
  const { data, error } = await (supabase as unknown as { from: (n: string) => { select: (c: string) => Promise<{ data: unknown[] | null; error: Error | null }> } })
    .from("scheduling_client_overrides").select(cols);
  if (error) throw error;
  return (data ?? []) as unknown as SchedulingClientOverrideRow[];
}

export async function upsertSchedulingClientOverride(
  p: UpsertClientOverrideParams,
): Promise<void> {
  const key = (p.clientKey ?? "").trim();
  if (!key) throw new Error("client_key required");
  const { data: { user } = { user: null } } = await supabase.auth.getUser();
  const row: Record<string, unknown> = {
    client_key: key,
    source_system: p.sourceSystem ?? "monday_clients_raw",
    centralreach_sync_status: p.centralReachSyncStatus ?? "not_ready",
    updated_by: user?.id ?? null,
  };
  if (p.clientName !== undefined) row.client_name = p.clientName;
  if (p.state !== undefined) row.state = p.state;
  if (p.sourceRecordId !== undefined) row.source_record_id = p.sourceRecordId;
  if (p.rbtName !== undefined) row.rbt_name = p.rbtName;
  if (p.startDate !== undefined) row.start_date = p.startDate;
  if (p.staffingStatus !== undefined) row.staffing_status = p.staffingStatus;
  if (p.schedulingStatus !== undefined) row.scheduling_status = p.schedulingStatus;
  if (p.metadata !== undefined) row.metadata = p.metadata;

  // upsert on client_key
  const client = supabase as unknown as {
    from: (n: string) => {
      upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: Error | null }>;
    };
  };
  const { error } = await client.from("scheduling_client_overrides").upsert(row, { onConflict: "client_key" });
  if (error) throw error;
}

export async function listSchedulingScheduleSlots(
  clientKeys?: string[],
): Promise<SchedulingScheduleSlotRow[]> {
  if (clientKeys && clientKeys.length === 0) return [];
  const cols =
    "id, client_key, client_name, source_system, source_record_id, state, day, start_time, end_time, rbt_name, location, notes, centralreach_sync_status";
  if (clientKeys && clientKeys.length > 0) {
    const { data, error } = await t().from("scheduling_client_schedule_slots").select(cols).in("client_key", clientKeys);
    if (error) throw error;
    return (data ?? []) as unknown as SchedulingScheduleSlotRow[];
  }
  const { data, error } = await (supabase as unknown as { from: (n: string) => { select: (c: string) => Promise<{ data: unknown[] | null; error: Error | null }> } })
    .from("scheduling_client_schedule_slots").select(cols);
  if (error) throw error;
  return (data ?? []) as unknown as SchedulingScheduleSlotRow[];
}

export interface UpsertScheduleSlotParams {
  clientKey: string;
  clientName?: string | null;
  state?: string | null;
  sourceSystem?: string;
  sourceRecordId?: string | null;
  slot: ScheduleSlot;
}

export async function upsertSchedulingScheduleSlot(p: UpsertScheduleSlotParams): Promise<void> {
  const key = (p.clientKey ?? "").trim();
  if (!key) throw new Error("client_key required");
  if (!p.slot?.day || !p.slot.start || !p.slot.end) throw new Error("day/start/end required");
  const { data: { user } = { user: null } } = await supabase.auth.getUser();
  const row = {
    client_key: key,
    client_name: p.clientName ?? null,
    source_system: p.sourceSystem ?? "monday_clients_raw",
    source_record_id: p.sourceRecordId ?? null,
    state: p.state ?? null,
    day: p.slot.day,
    start_time: p.slot.start,
    end_time: p.slot.end,
    rbt_name: p.slot.rbt ?? null,
    location: p.slot.location ?? null,
    notes: p.slot.notes ?? null,
    centralreach_sync_status: "not_ready",
    updated_by: user?.id ?? null,
  };
  const client = supabase as unknown as {
    from: (n: string) => {
      upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: Error | null }>;
    };
  };
  const { error } = await client.from("scheduling_client_schedule_slots")
    .upsert(row, { onConflict: "client_key,day,start_time,end_time" });
  if (error) throw error;
}

export async function removeSchedulingScheduleSlotsByClientDay(
  clientKey: string,
  day: ScheduleSlot["day"],
): Promise<void> {
  const client = supabase as unknown as {
    from: (n: string) => {
      delete: () => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => Promise<{ error: Error | null }>;
        };
      };
    };
  };
  const { error } = await client.from("scheduling_client_schedule_slots")
    .delete().eq("client_key", clientKey).eq("day", day);
  if (error) throw error;
}

export async function setSchedulingSchedule(
  params: { clientKey: string; clientName?: string | null; state?: string | null; sourceRecordId?: string | null },
  slots: ScheduleSlot[],
): Promise<void> {
  const key = params.clientKey.trim();
  if (!key) throw new Error("client_key required");
  // Replace: delete all, then insert.
  const client = supabase as unknown as {
    from: (n: string) => {
      delete: () => { eq: (col: string, val: string) => Promise<{ error: Error | null }> };
    };
  };
  const del = await client.from("scheduling_client_schedule_slots").delete().eq("client_key", key);
  if (del.error) throw del.error;
  for (const slot of slots) {
    await upsertSchedulingScheduleSlot({
      clientKey: key,
      clientName: params.clientName ?? null,
      state: params.state ?? null,
      sourceRecordId: params.sourceRecordId ?? null,
      slot,
    });
  }
}