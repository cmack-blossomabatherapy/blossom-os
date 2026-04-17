import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { Client, ClientStage, ClientTask, mockClients } from "@/data/clients";

interface ClientsContextValue {
  clients: Client[];
  getClient: (id: string) => Client | undefined;
  addClient: (client: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  bulkUpdate: (ids: string[], patch: Partial<Client>) => void;
  moveStage: (ids: string[], stage: ClientStage) => void;
  assignBcba: (ids: string[], bcba: string) => void;
  assignRbt: (ids: string[], rbt: string) => void;
  setStartDate: (ids: string[], date: string) => void;
  toggleTask: (clientId: string, taskId: string) => void;
  addTask: (clientId: string, task: ClientTask) => void;
  appendTimeline: (clientId: string, description: string, type?: "system" | "auth" | "staffing" | "schedule" | "qa" | "note" | "stage") => void;
  appendAutomation: (clientId: string, message: string) => void;
  deleteClients: (ids: string[]) => void;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(mockClients);

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  const addClient = useCallback((client: Client) => {
    setClients((prev) => [client, ...prev]);
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const bulkUpdate = useCallback((ids: string[], patch: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, ...patch } : c)));
  }, []);

  const moveStage = useCallback((ids: string[], stage: ClientStage) => {
    setClients((prev) => prev.map((c) => (ids.includes(c.id) ? {
      ...c, stage, daysInStage: 0,
      automationLog: [...c.automationLog, `Stage moved to ${stage} (manual)`],
      timeline: [
        { id: `tl-${Date.now()}`, type: "stage" as const, description: `Moved to ${stage}`, timestamp: new Date().toISOString(), user: "You" },
        ...c.timeline,
      ],
    } : c)));
  }, []);

  const assignBcba = useCallback((ids: string[], bcba: string) => {
    setClients((prev) => prev.map((c) => (ids.includes(c.id) ? {
      ...c, bcba,
      automationLog: [...c.automationLog, `BCBA assigned: ${bcba}`],
      timeline: [
        { id: `tl-${Date.now()}`, type: "staffing" as const, description: `BCBA ${bcba} assigned`, timestamp: new Date().toISOString(), user: "You" },
        ...c.timeline,
      ],
      // Auto-advance from BCBA Assignment per SOP
      stage: c.stage === "BCBA Assignment" ? "Pending Initial Auth" : c.stage,
    } : c)));
  }, []);

  const assignRbt = useCallback((ids: string[], rbt: string) => {
    setClients((prev) => prev.map((c) => (ids.includes(c.id) ? {
      ...c, rbt, staffingStatus: "Assigned" as const,
      automationLog: [...c.automationLog, `RBT assigned: ${rbt}`],
      timeline: [
        { id: `tl-${Date.now()}`, type: "staffing" as const, description: `${rbt} assigned as RBT`, timestamp: new Date().toISOString(), user: "You" },
        ...c.timeline,
      ],
      stage: c.stage === "Staffing Needed" || c.stage === "Restaffing Needed" ? "Pending Start Date" : c.stage,
    } : c)));
  }, []);

  const setStartDate = useCallback((ids: string[], date: string) => {
    setClients((prev) => prev.map((c) => (ids.includes(c.id) ? {
      ...c, startDate: date,
      automationLog: [...c.automationLog, `Start date set to ${date}`],
      timeline: [
        { id: `tl-${Date.now()}`, type: "schedule" as const, description: `Start date set to ${date}`, timestamp: new Date().toISOString(), user: "You" },
        ...c.timeline,
      ],
    } : c)));
  }, []);

  const toggleTask = useCallback((clientId: string, taskId: string) => {
    setClients((prev) => prev.map((c) => (c.id === clientId ? {
      ...c,
      tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    } : c)));
  }, []);

  const addTask = useCallback((clientId: string, task: ClientTask) => {
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, tasks: [...c.tasks, task] } : c)));
  }, []);

  const appendTimeline = useCallback((clientId: string, description: string, type: "system" | "auth" | "staffing" | "schedule" | "qa" | "note" | "stage" = "note") => {
    setClients((prev) => prev.map((c) => (c.id === clientId ? {
      ...c, timeline: [
        { id: `tl-${Date.now()}`, type, description, timestamp: new Date().toISOString(), user: "You" },
        ...c.timeline,
      ],
    } : c)));
  }, []);

  const appendAutomation = useCallback((clientId: string, message: string) => {
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, automationLog: [...c.automationLog, message] } : c)));
  }, []);

  const deleteClients = useCallback((ids: string[]) => {
    setClients((prev) => prev.filter((c) => !ids.includes(c.id)));
  }, []);

  const value = useMemo(() => ({
    clients, getClient, addClient, updateClient, bulkUpdate, moveStage,
    assignBcba, assignRbt, setStartDate, toggleTask, addTask, appendTimeline, appendAutomation, deleteClients,
  }), [clients, getClient, addClient, updateClient, bulkUpdate, moveStage, assignBcba, assignRbt, setStartDate, toggleTask, addTask, appendTimeline, appendAutomation, deleteClients]);

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within <ClientsProvider>");
  return ctx;
}
