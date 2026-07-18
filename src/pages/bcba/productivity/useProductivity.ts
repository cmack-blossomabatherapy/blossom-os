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