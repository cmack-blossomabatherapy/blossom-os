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
  type ExecutiveWorkItemInput,
} from "@/lib/os/executive/executiveService";

const KEY = {
  workItems: (f?: object) => ["exec", "work-items", f ?? null] as const,
  decisions: () => ["exec", "decisions"] as const,
  risks: (status?: string) => ["exec", "risks", status ?? null] as const,
  updates: () => ["exec", "updates"] as const,
  activity: () => ["exec", "activity"] as const,
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
  return { ...query, create };
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
  return { ...query, create };
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
  return { ...query, create };
}

export function useExecutiveActivity(limit = 20) {
  return useQuery({ queryKey: KEY.activity(), queryFn: () => listRecentExecutiveActivity(limit) });
}