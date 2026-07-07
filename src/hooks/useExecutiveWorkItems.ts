/**
 * React Query bindings for the executive operating layer.
 * Backed by src/lib/os/executive/executiveService.ts.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExecutiveDecision,
  createExecutiveRisk,
  createExecutiveUpdate,
  createExecutiveWorkItem,
  listExecutiveDecisions,
  listExecutiveRisks,
  listExecutiveUpdates,
  listExecutiveWorkItems,
  listRecentExecutiveActivity,
  updateExecutiveWorkItem,
  updateExecutiveDecision,
  updateExecutiveRisk,
  resolveExecutiveRisk,
  updateExecutiveUpdate,
  publishExecutiveUpdate,
  createExecutiveBriefing,
  listExecutiveBriefings,
  updateExecutiveBriefing,
  captureExecutiveKpiSnapshot,
  listExecutiveKpiSnapshots,
  type ExecutiveWorkItemInput,
} from "@/lib/os/executive/executiveService";

const KEY = {
  workItems: (f?: object) => ["exec", "work-items", f ?? null] as const,
  decisions: () => ["exec", "decisions"] as const,
  risks: (status?: string) => ["exec", "risks", status ?? null] as const,
  updates: () => ["exec", "updates"] as const,
  activity: () => ["exec", "activity"] as const,
  briefings: () => ["exec", "briefings"] as const,
  kpiSnapshots: () => ["exec", "kpi-snapshots"] as const,
};

export function useExecutiveWorkItems(filters?: {
  status?: string;
  department?: string;
  state_code?: string;
  limit?: number;
}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: KEY.workItems(filters),
    queryFn: () => listExecutiveWorkItems(filters),
  });
  const create = useMutation({
    mutationFn: (input: ExecutiveWorkItemInput) => createExecutiveWorkItem(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec", "work-items"] });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  const update = useMutation({
    mutationFn: (v: { id: string; patch: Partial<ExecutiveWorkItemInput> & { status?: string } }) =>
      updateExecutiveWorkItem(v.id, v.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec", "work-items"] });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  return { ...query, create, update };
}

export function useExecutiveRisks(status?: string) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY.risks(status), queryFn: () => listExecutiveRisks(status) });
  const create = useMutation({
    mutationFn: createExecutiveRisk,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec", "risks"] });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  const update = useMutation({
    mutationFn: (v: { id: string; patch: Parameters<typeof updateExecutiveRisk>[1] }) =>
      updateExecutiveRisk(v.id, v.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec", "risks"] });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  const resolve = useMutation({
    mutationFn: (v: { id: string; status?: "resolved" | "mitigated" | "closed" }) =>
      resolveExecutiveRisk(v.id, v.status ?? "resolved"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec", "risks"] });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  return { ...query, create, update, resolve };
}

export function useExecutiveDecisions() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY.decisions(), queryFn: () => listExecutiveDecisions() });
  const create = useMutation({
    mutationFn: createExecutiveDecision,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.decisions() });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  const update = useMutation({
    mutationFn: (v: { id: string; patch: Parameters<typeof updateExecutiveDecision>[1] }) =>
      updateExecutiveDecision(v.id, v.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.decisions() });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  return { ...query, create, update };
}

export function useExecutiveUpdates() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY.updates(), queryFn: () => listExecutiveUpdates() });
  const create = useMutation({
    mutationFn: createExecutiveUpdate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.updates() });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  const update = useMutation({
    mutationFn: (v: { id: string; patch: Parameters<typeof updateExecutiveUpdate>[1] }) =>
      updateExecutiveUpdate(v.id, v.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.updates() });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  const publish = useMutation({
    mutationFn: (id: string) => publishExecutiveUpdate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.updates() });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  return { ...query, create, update, publish };
}

export function useExecutiveBriefings(limit = 25) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY.briefings(), queryFn: () => listExecutiveBriefings(limit) });
  const create = useMutation({
    mutationFn: createExecutiveBriefing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.briefings() });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  const update = useMutation({
    mutationFn: (v: { id: string; patch: Parameters<typeof updateExecutiveBriefing>[1] }) =>
      updateExecutiveBriefing(v.id, v.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.briefings() });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  return { ...query, create, update };
}

export function useExecutiveKpiSnapshots(limit = 50) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY.kpiSnapshots(), queryFn: () => listExecutiveKpiSnapshots(limit) });
  const capture = useMutation({
    mutationFn: captureExecutiveKpiSnapshot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.kpiSnapshots() });
      qc.invalidateQueries({ queryKey: KEY.activity() });
    },
  });
  return { ...query, capture };
}

export function useExecutiveActivity(limit = 20) {
  return useQuery({ queryKey: KEY.activity(), queryFn: () => listRecentExecutiveActivity(limit) });
}