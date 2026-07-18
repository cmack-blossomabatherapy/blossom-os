import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductivitySnapshot, CapacitySnapshot } from "./pipeline";

export function useMyProductivitySnapshot(bcbaId?: string | null) {
  return useQuery({
    queryKey: ["bcba-productivity", "mine", bcbaId ?? "self"],
    enabled: !!bcbaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_productivity_snapshots")
        .select("*")
        .eq("bcba_id", bcbaId!)
        .order("period_end", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ProductivitySnapshot) ?? null;
    },
  });
}

export function useMyCapacitySnapshot(bcbaId?: string | null) {
  return useQuery({
    queryKey: ["bcba-capacity", "mine", bcbaId ?? "self"],
    enabled: !!bcbaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_capacity_snapshots")
        .select("*")
        .eq("bcba_id", bcbaId!)
        .order("period_end", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as CapacitySnapshot) ?? null;
    },
  });
}

export function useAllProductivity() {
  return useQuery({
    queryKey: ["bcba-productivity", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_productivity_snapshots")
        .select("*")
        .order("period_end", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as unknown as ProductivitySnapshot[]) ?? [];
    },
  });
}

export function useAllCapacity() {
  return useQuery({
    queryKey: ["bcba-capacity", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_capacity_snapshots")
        .select("*")
        .order("period_end", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as unknown as CapacitySnapshot[]) ?? [];
    },
  });
}

export function useReportDiscrepancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      snapshot_id: string;
      bcba_id: string;
      metric_key: string;
      reported_value?: string;
      expected_value?: string;
      detail?: string;
      impacted_metric_keys?: string[];
    }) => {
      // Create task first so we can link it
      const { data: task, error: taskErr } = await supabase
        .from("user_tasks")
        .insert({
          title: `BCBA productivity discrepancy — ${payload.metric_key}`,
          description: payload.detail ?? "",
          priority: "high",
          status: "todo",
          source: "bcba_productivity",
          owner_id: payload.bcba_id,
        } as any)
        .select("id")
        .single();
      if (taskErr) throw taskErr;

      const impacted = Array.from(
        new Set([
          payload.metric_key,
          ...(payload.impacted_metric_keys ?? []),
        ].filter(Boolean)),
      );

      const { data, error } = await supabase
        .from("bcba_productivity_discrepancies")
        .insert({
          snapshot_id: payload.snapshot_id,
          bcba_id: payload.bcba_id,
          metric_key: payload.metric_key,
          reported_value: payload.reported_value ?? null,
          expected_value: payload.expected_value ?? null,
          detail: payload.detail ?? null,
          task_id: task?.id ?? null,
          impacted_metric_keys: impacted,
        } as any)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bcba-productivity"] });
    },
  });
}

export interface DiscrepancyRow {
  id: string;
  snapshot_id: string | null;
  bcba_id: string;
  metric_key: string;
  impacted_metric_keys: string[];
  source_timestamps: Record<string, string>;
  status: string;
  detail: string | null;
  reported_value: string | null;
  expected_value: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch a single discrepancy row with its linked metric keys + source timestamps.
 */
export function useDiscrepancy(discrepancyId?: string | null) {
  return useQuery({
    queryKey: ["bcba-disc", discrepancyId],
    enabled: !!discrepancyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_productivity_discrepancies")
        .select(
          "id, snapshot_id, bcba_id, metric_key, impacted_metric_keys, source_timestamps, status, detail, reported_value, expected_value, created_at, updated_at",
        )
        .eq("id", discrepancyId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as DiscrepancyRow | null;
    },
  });
}

// ---- Discrepancy detail: events, attachments, resolve ----

export interface DiscrepancyEvent {
  id: string;
  discrepancy_id: string;
  actor_id: string | null;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  comment: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DiscrepancyAttachment {
  id: string;
  discrepancy_id: string;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export function useDiscrepancyEvents(discrepancyId?: string | null) {
  return useQuery({
    queryKey: ["bcba-disc-events", discrepancyId],
    enabled: !!discrepancyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_productivity_discrepancy_events" as any)
        .select("*")
        .eq("discrepancy_id", discrepancyId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as DiscrepancyEvent[];
    },
  });
}

export function useDiscrepancyAttachments(discrepancyId?: string | null) {
  return useQuery({
    queryKey: ["bcba-disc-attachments", discrepancyId],
    enabled: !!discrepancyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_productivity_discrepancy_attachments" as any)
        .select("*")
        .eq("discrepancy_id", discrepancyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DiscrepancyAttachment[];
    },
  });
}

export function useAddDiscrepancyComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { discrepancy_id: string; comment: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("bcba_productivity_discrepancy_events" as any)
        .insert({
          discrepancy_id: p.discrepancy_id,
          actor_id: auth.user?.id ?? null,
          event_type: "comment",
          comment: p.comment,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["bcba-disc-events", v.discrepancy_id] });
    },
  });
}

export function useUpdateDiscrepancyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      discrepancy_id: string;
      status: "open" | "investigating" | "resolved" | "rejected";
      resolution_note?: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const patch: any = { status: p.status, resolution_note: p.resolution_note ?? null };
      if (p.status === "resolved") {
        patch.resolved_at = new Date().toISOString();
        patch.resolved_by = auth.user?.id ?? null;
      } else {
        patch.resolved_at = null;
        patch.resolved_by = null;
      }
      const { error } = await supabase
        .from("bcba_productivity_discrepancies")
        .update(patch)
        .eq("id", p.discrepancy_id);
      if (error) throw error;
    },
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["bcba-disc-events", v.discrepancy_id] });
      qc.invalidateQueries({ queryKey: ["bcba-productivity"] });
    },
  });
}

export function useUploadDiscrepancyEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { discrepancy_id: string; file: File }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      const safeName = p.file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${p.discrepancy_id}/${crypto.randomUUID()}-${safeName}`;
      const up = await supabase.storage
        .from("bcba-discrepancy-evidence")
        .upload(path, p.file, { contentType: p.file.type, upsert: false });
      if (up.error) throw up.error;
      const { error } = await supabase
        .from("bcba_productivity_discrepancy_attachments" as any)
        .insert({
          discrepancy_id: p.discrepancy_id,
          uploaded_by: uid,
          storage_path: path,
          file_name: p.file.name,
          content_type: p.file.type || null,
          size_bytes: p.file.size,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["bcba-disc-attachments", v.discrepancy_id] });
      qc.invalidateQueries({ queryKey: ["bcba-disc-events", v.discrepancy_id] });
    },
  });
}

export function useDeleteDiscrepancyAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { attachment_id: string; discrepancy_id: string; storage_path: string }) => {
      await supabase.storage.from("bcba-discrepancy-evidence").remove([p.storage_path]);
      const { error } = await supabase
        .from("bcba_productivity_discrepancy_attachments" as any)
        .delete()
        .eq("id", p.attachment_id);
      if (error) throw error;
    },
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["bcba-disc-attachments", v.discrepancy_id] });
      qc.invalidateQueries({ queryKey: ["bcba-disc-events", v.discrepancy_id] });
    },
  });
}

export async function getDiscrepancyEvidenceUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from("bcba-discrepancy-evidence")
    .createSignedUrl(storagePath, 300);
  if (error) throw error;
  return data.signedUrl;
}