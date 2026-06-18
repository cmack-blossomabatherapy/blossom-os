import { useCallback, useEffect, useState } from "react";
import {
  assignWorkItem as storeAssign,
  completeWorkItem as storeComplete,
  createWorkItem as storeCreate,
  escalateWorkItem as storeEscalate,
  listWorkItems,
  resolveEscalation as storeResolveEsc,
  setWorkItemStatus,
  snoozeWorkItem as storeSnooze,
  subscribeWorkItems,
  updateWorkItem as storeUpdate,
} from "@/lib/workQueue/workQueueStore";
import type {
  WorkItem,
  WorkItemStatus,
} from "@/lib/workQueue/workQueueModel";

export interface UseWorkQueueValue {
  items: WorkItem[];
  loading: boolean;
  createWorkItem: (input: Partial<WorkItem>) => WorkItem;
  updateWorkItem: (id: string, patch: Partial<WorkItem>) => WorkItem | undefined;
  assignWorkItem: (id: string, ownerName: string, ownerId?: string) => WorkItem | undefined;
  setStatus: (id: string, status: WorkItemStatus) => WorkItem | undefined;
  completeWorkItem: (id: string, notes?: string) => WorkItem | undefined;
  snoozeWorkItem: (id: string, untilIso: string) => WorkItem | undefined;
  escalateWorkItem: (id: string, reason: string, level?: 1 | 2 | 3 | 4) => WorkItem | undefined;
  resolveEscalation: (id: string, notes?: string) => WorkItem | undefined;
  refresh: () => void;
}

export function useWorkQueue(): UseWorkQueueValue {
  const [items, setItems] = useState<WorkItem[]>(() => listWorkItems());
  const [loading, setLoading] = useState(false);

  useEffect(() => subscribeWorkItems(setItems), []);

  const refresh = useCallback(() => {
    setLoading(true);
    setItems(listWorkItems());
    setLoading(false);
  }, []);

  return {
    items,
    loading,
    createWorkItem: storeCreate,
    updateWorkItem: storeUpdate,
    assignWorkItem: storeAssign,
    setStatus: setWorkItemStatus,
    completeWorkItem: storeComplete,
    snoozeWorkItem: storeSnooze,
    escalateWorkItem: storeEscalate,
    resolveEscalation: storeResolveEsc,
    refresh,
  };
}