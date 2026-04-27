import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { createIntakeTask, INTAKE_COORDINATORS, Lead, LeadStatus, mockLeads, TimelineEvent } from "@/data/leads";

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

const leastLoadedCoordinator = (leads: Lead[]) => {
  const counts = INTAKE_COORDINATORS.map((owner) => ({ owner, count: leads.filter((lead) => lead.owner === owner).length }));
  return counts.sort((a, b) => a.count - b.count)[0]?.owner ?? INTAKE_COORDINATORS[0];
};

const withIntakeAutomation = (lead: Lead, patch: Partial<Lead>): Lead => {
  const next: Lead = { ...lead, ...patch, updatedAt: new Date().toISOString() };
  const tasks = [...next.tasks];
  const log: string[] = [];

  if (patch.formStatus === "Sent") {
    next.status = "Sent Form";
    next.nextAction = "Follow up on intake packet";
    log.push("PandaDoc intake form sent");
  }
  if (patch.formStatus === "Complete" || patch.formStatus === "Completed") {
    next.status = "Form Received";
    next.nextAction = "Review intake packet";
    ["Review Intake Packet", "Set Insurance", "Set Form Review Status"].forEach((title) => tasks.push(createIntakeTask(title, next.owner)));
    log.push("Intake form completed — review tasks created");
  }
  if (patch.formReviewStatus === "Missing Info" || patch.formReviewStatus === "Missing Information") {
    next.status = "Missing Information";
    next.nextAction = "Collect missing info";
    tasks.push(createIntakeTask("Collect Missing Info", next.owner, 1));
    log.push("Missing information loop started");
  }
  if (patch.formReviewStatus === "Complete" && next.status === "Form Received") {
    next.status = "Sent to VOB";
    next.vobStatus = next.vobStatus === "Not Started" ? "Sent" : next.vobStatus;
    next.nextAction = "Add to Eligipro and CentralReach";
    tasks.push(createIntakeTask("Add to Eligipro", next.owner), createIntakeTask("Add to CentralReach", next.owner));
    log.push("Form review complete — sent to VOB");
  }
  if (patch.vobStatus === "Received") {
    next.status = "VOB Completed";
    next.nextAction = "Review VOB decision";
    log.push("VOB received");
  }
  if (patch.vobStatus === "Approved" || patch.vobStatus === "Payment Plan Required") {
    next.status = "VOB Completed";
    next.paymentPlanNeeded = patch.vobStatus === "Payment Plan Required";
    next.nextAction = "Ready for client conversion";
    log.push("Ready for client conversion");
  }
  if (patch.status === "Can Not Submit Auth") {
    tasks.push(createIntakeTask("Collect Missing Documentation", next.owner, 1));
    next.nextAction = "Collect missing documentation";
  }

  if (patch.status && patch.status !== lead.status) next.daysInStage = 0;
  return {
    ...next,
    tasks,
    timeline: log.length ? [makeTimelineEvent(log[log.length - 1]), ...next.timeline] : next.timeline,
    automationLog: log.length ? [...next.automationLog, ...log] : next.automationLog,
  };
};

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  const getLead = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);

  const addLead = useCallback((lead: Lead) => {
    setLeads((prev) => {
      const owner = lead.owner || leastLoadedCoordinator(prev);
      const created = withIntakeAutomation({ ...lead, owner, status: "New Lead", nextAction: "Contact Lead", tasks: lead.tasks.length ? lead.tasks : [createIntakeTask("Contact Lead", owner)] }, {});
      return [created, ...prev];
    });
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? withIntakeAutomation(l, patch) : l)));
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
