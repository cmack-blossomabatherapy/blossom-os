import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { Lead, LeadStatus, mockLeads, TimelineEvent } from "@/data/leads";

interface LeadsContextValue {
  leads: Lead[];
  getLead: (id: string) => Lead | undefined;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  bulkUpdate: (ids: string[], patch: Partial<Lead>) => void;
  moveStage: (ids: string[], status: LeadStatus) => void;
  revertStage: (
    id: string,
    previousStatus: LeadStatus,
    previousDaysInStage: number,
    automationLogEntry: string,
  ) => void;
  assignOwner: (ids: string[], owner: string) => void;
  addTag: (ids: string[], tag: string) => void;
  deleteLeads: (ids: string[]) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

const makeTimelineEvent = (description: string): TimelineEvent => ({
  id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: "system",
  description,
  timestamp: new Date().toISOString(),
  user: "You",
});

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  const getLead = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);

  const addLead = useCallback((lead: Lead) => {
    setLeads((prev) => [lead, ...prev]);
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)));
  }, []);

  const bulkUpdate = useCallback((ids: string[], patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)));
  }, []);

  const moveStage = useCallback((ids: string[], status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => {
      if (!ids.includes(l.id)) return l;
      const event = makeTimelineEvent(`Stage moved to ${status}`);
      return {
        ...l,
        status,
        daysInStage: 0,
        automationLog: [...l.automationLog, `Stage moved to ${status} (manual)`],
        timeline: [event, ...l.timeline],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const revertStage = useCallback((
    id: string,
    previousStatus: LeadStatus,
    previousDaysInStage: number,
    automationLogEntry: string,
  ) => {
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const log = [...l.automationLog];
      const idx = log.lastIndexOf(automationLogEntry);
      if (idx >= 0) log.splice(idx, 1);
      log.push(`Stage move undone — restored to ${previousStatus}`);
      const event = makeTimelineEvent(`Move undone — restored to ${previousStatus}`);
      return {
        ...l,
        status: previousStatus,
        daysInStage: previousDaysInStage,
        automationLog: log,
        timeline: [event, ...l.timeline],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const assignOwner = useCallback((ids: string[], owner: string) => {
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? {
      ...l, owner,
      automationLog: [...l.automationLog, `Reassigned to ${owner}`],
    } : l)));
  }, []);

  const addTag = useCallback((ids: string[], tag: string) => {
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? {
      ...l, tags: Array.from(new Set([...(l.tags ?? []), tag])),
    } : l)));
  }, []);

  const deleteLeads = useCallback((ids: string[]) => {
    setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
  }, []);

  const value = useMemo(
    () => ({ leads, getLead, addLead, updateLead, bulkUpdate, moveStage, revertStage, assignOwner, addTag, deleteLeads }),
    [leads, getLead, addLead, updateLead, bulkUpdate, moveStage, revertStage, assignOwner, addTag, deleteLeads],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within <LeadsProvider>");
  return ctx;
}

interface LeadsContextValue {
  leads: Lead[];
  getLead: (id: string) => Lead | undefined;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  bulkUpdate: (ids: string[], patch: Partial<Lead>) => void;
  moveStage: (ids: string[], status: LeadStatus) => void;
  assignOwner: (ids: string[], owner: string) => void;
  addTag: (ids: string[], tag: string) => void;
  deleteLeads: (ids: string[]) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  const getLead = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);

  const addLead = useCallback((lead: Lead) => {
    setLeads((prev) => [lead, ...prev]);
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)));
  }, []);

  const bulkUpdate = useCallback((ids: string[], patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)));
  }, []);

  const moveStage = useCallback((ids: string[], status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? {
      ...l, status, daysInStage: 0,
      automationLog: [...l.automationLog, `Stage moved to ${status} (manual)`],
      updatedAt: new Date().toISOString(),
    } : l)));
  }, []);

  const assignOwner = useCallback((ids: string[], owner: string) => {
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? {
      ...l, owner,
      automationLog: [...l.automationLog, `Reassigned to ${owner}`],
    } : l)));
  }, []);

  const addTag = useCallback((ids: string[], tag: string) => {
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? {
      ...l, tags: Array.from(new Set([...(l.tags ?? []), tag])),
    } : l)));
  }, []);

  const deleteLeads = useCallback((ids: string[]) => {
    setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
  }, []);

  const value = useMemo(
    () => ({ leads, getLead, addLead, updateLead, bulkUpdate, moveStage, assignOwner, addTag, deleteLeads }),
    [leads, getLead, addLead, updateLead, bulkUpdate, moveStage, assignOwner, addTag, deleteLeads],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within <LeadsProvider>");
  return ctx;
}
