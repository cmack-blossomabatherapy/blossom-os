import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Client, ClientStage, ClientTask, ClientTimelineEvent, AuthorizationRecord,
  ScheduleSlot, AuthStatus, StaffingStatus, QAStatus,
} from "@/data/clients";
import { canAdvanceToStage, canonicalPipelineStage } from "@/data/pipeline";
import { useAuth } from "@/contexts/AuthContext";

type Row<T> = T & Record<string, unknown>;

interface ClientsContextValue {
  clients: Client[];
  loading: boolean;
  getClient: (id: string) => Client | undefined;
  addClient: (client: Omit<Client, "id"> & { id?: string }) => Promise<Client | null>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  bulkUpdate: (ids: string[], patch: Partial<Client>) => Promise<void>;
  moveStage: (ids: string[], stage: ClientStage) => Promise<void>;
  revertStage: (clientId: string, previousStage: ClientStage, previousStageEnteredAt: string, automationLogEntry: string) => Promise<void>;
  assignBcba: (ids: string[], bcba: string) => Promise<void>;
  assignRbt: (ids: string[], rbt: string) => Promise<void>;
  setStartDate: (ids: string[], date: string) => Promise<void>;
  toggleTask: (clientId: string, taskId: string) => Promise<void>;
  addTask: (clientId: string, task: ClientTask) => Promise<void>;
  appendTimeline: (clientId: string, description: string, type?: ClientTimelineEvent["type"]) => Promise<void>;
  appendAutomation: (clientId: string, message: string) => Promise<void>;
  deleteClients: (ids: string[]) => Promise<void>;
  // Document & schedule helpers (DB-backed)
  addDocument: (clientId: string, name: string, type: string) => Promise<void>;
  removeDocument: (clientId: string, documentId: string) => Promise<void>;
  addScheduleSlot: (clientId: string, slot: ScheduleSlot) => Promise<void>;
  removeScheduleSlot: (clientId: string, day: ScheduleSlot["day"]) => Promise<void>;
  setSchedule: (clientId: string, slots: ScheduleSlot[]) => Promise<void>;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

const daysBetween = (iso?: string | null): number => {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};
const daysUntil = (iso?: string | null): number | null => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

/* ──────────────────────── DB ↔ Client mapping ──────────────────────── */
interface DbClient {
  id: string;
  child_name: string;
  parent_name: string;
  child_age: string | null;
  state: string;
  clinic: string;
  stage: ClientStage;
  bcba: string | null;
  rbt: string | null;
  intake_owner: string | null;
  auth_status: AuthStatus;
  staffing_status: StaffingStatus;
  qa_status: QAStatus;
  payor: string;
  next_action: string | null;
  next_task_due: string | null;
  assessment_date: string | null;
  start_date: string | null;
  stage_entered_at: string;
  vob_completed_at: string | null;
  blockers: string[];
  automation_log: string[];
  staffing_history: { date: string; event: string }[];
  created_at: string;
  updated_at: string;
}

interface DbTask { id: string; client_id: string; title: string; completed: boolean; due_date: string | null; position: number; }
interface DbDocument { id: string; client_id: string; name: string; type: string; }
interface DbTimeline { id: string; client_id: string; event_type: ClientTimelineEvent["type"]; description: string; user_name: string | null; created_at: string; }
interface DbAuth { id: string; client_id: string; kind: "Initial" | "Treatment"; status: AuthStatus; submitted_date: string | null; approved_date: string | null; expiration_date: string | null; hours: string | null; notes: string | null; }
interface DbSlot { id: string; client_id: string; day: ScheduleSlot["day"]; start_time: string; end_time: string; rbt: string | null; }

const buildClient = (
  c: DbClient,
  tasks: DbTask[],
  docs: DbDocument[],
  timeline: DbTimeline[],
  auths: DbAuth[],
  slots: DbSlot[],
): Client => ({
  id: c.id,
  childName: c.child_name,
  parentName: c.parent_name,
  childAge: c.child_age ?? "",
  state: c.state,
  clinic: c.clinic,
  stage: c.stage,
  bcba: c.bcba,
  rbt: c.rbt,
  intakeOwner: c.intake_owner ?? "",
  authStatus: c.auth_status,
  staffingStatus: c.staffing_status,
  qaStatus: c.qa_status,
  daysInStage: daysBetween(c.stage_entered_at),
  daysSinceVOB: daysBetween(c.vob_completed_at ?? c.created_at),
  daysSinceAssessment: c.assessment_date ? daysBetween(c.assessment_date) : null,
  daysToStart: c.start_date ? daysUntil(c.start_date) : null,
  assessmentDate: c.assessment_date,
  startDate: c.start_date,
  nextAction: c.next_action ?? "",
  nextTaskDue: c.next_task_due,
  lastActivity: timeline[0]?.description ?? "—",
  payor: c.payor,
  blockers: c.blockers ?? [],
  authorizations: auths.map((a) => ({
    type: a.kind, status: a.status,
    submittedDate: a.submitted_date ?? undefined,
    approvedDate: a.approved_date ?? undefined,
    expirationDate: a.expiration_date ?? undefined,
    hours: a.hours ?? undefined,
    notes: a.notes ?? undefined,
  })) as AuthorizationRecord[],
  schedule: slots.map((s) => ({ day: s.day, start: s.start_time, end: s.end_time, rbt: s.rbt ?? undefined })),
  tasks: tasks.map((t) => ({ id: t.id, title: t.title, completed: t.completed, dueDate: t.due_date ?? undefined })),
  timeline: timeline.map((t) => ({ id: t.id, type: t.event_type, description: t.description, timestamp: t.created_at, user: t.user_name ?? undefined })),
  documents: docs.map((d) => ({ name: d.name, type: d.type })),
  automationLog: c.automation_log ?? [],
  staffingHistory: c.staffing_history ?? [],
});

const clientPatchToDb = (patch: Partial<Client>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (patch.childName !== undefined) out.child_name = patch.childName;
  if (patch.parentName !== undefined) out.parent_name = patch.parentName;
  if (patch.childAge !== undefined) out.child_age = patch.childAge;
  if (patch.state !== undefined) out.state = patch.state;
  if (patch.clinic !== undefined) out.clinic = patch.clinic;
  if (patch.stage !== undefined) { out.stage = patch.stage; out.stage_entered_at = new Date().toISOString(); }
  if (patch.bcba !== undefined) out.bcba = patch.bcba;
  if (patch.rbt !== undefined) out.rbt = patch.rbt;
  if (patch.intakeOwner !== undefined) out.intake_owner = patch.intakeOwner;
  if (patch.authStatus !== undefined) out.auth_status = patch.authStatus;
  if (patch.staffingStatus !== undefined) out.staffing_status = patch.staffingStatus;
  if (patch.qaStatus !== undefined) out.qa_status = patch.qaStatus;
  if (patch.payor !== undefined) out.payor = patch.payor;
  if (patch.nextAction !== undefined) out.next_action = patch.nextAction;
  if (patch.nextTaskDue !== undefined) out.next_task_due = patch.nextTaskDue;
  if (patch.assessmentDate !== undefined) out.assessment_date = patch.assessmentDate;
  if (patch.startDate !== undefined) out.start_date = patch.startDate;
  if (patch.blockers !== undefined) out.blockers = patch.blockers;
  if (patch.automationLog !== undefined) out.automation_log = patch.automationLog;
  if (patch.staffingHistory !== undefined) out.staffing_history = patch.staffingHistory;
  return out;
};

/* ──────────────────────────── Provider ──────────────────────────── */

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setClients([]); setLoading(false); return; }
    setLoading(true);
    const [c, t, d, tl, a, s] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("client_tasks").select("*").order("position", { ascending: true }),
      supabase.from("client_documents").select("*").order("created_at", { ascending: false }),
      supabase.from("client_timeline").select("*").order("created_at", { ascending: false }),
      supabase.from("client_authorizations").select("*").order("created_at", { ascending: true }),
      supabase.from("client_schedule_slots").select("*").order("day", { ascending: true }),
    ]);
    if (c.error || t.error || d.error || tl.error || a.error || s.error) {
      console.error("Clients fetch error", { c: c.error, t: t.error, d: d.error, tl: tl.error, a: a.error, s: s.error });
      setClients([]);
      setLoading(false);
      return;
    }
    const dbClients = (c.data ?? []) as unknown as DbClient[];
    const tasks = (t.data ?? []) as unknown as DbTask[];
    const docs = (d.data ?? []) as unknown as DbDocument[];
    const timeline = (tl.data ?? []) as unknown as DbTimeline[];
    const auths = (a.data ?? []) as unknown as DbAuth[];
    const slots = (s.data ?? []) as unknown as DbSlot[];

    const built = dbClients.map((row) =>
      buildClient(
        row,
        tasks.filter((x) => x.client_id === row.id),
        docs.filter((x) => x.client_id === row.id),
        timeline.filter((x) => x.client_id === row.id),
        auths.filter((x) => x.client_id === row.id),
        slots.filter((x) => x.client_id === row.id),
      ),
    );
    setClients(built);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refetch();
  }, [authLoading, refetch]);

  // Realtime — refetch on any change to any client table
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("clients-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_tasks" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_documents" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_timeline" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_authorizations" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_schedule_slots" }, () => void refetch())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, refetch]);

  /* ──────────────── Mutations ──────────────── */

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  const insertTimeline = async (clientId: string, description: string, type: ClientTimelineEvent["type"] = "note") => {
    await supabase.from("client_timeline").insert({
      client_id: clientId, event_type: type, description, user_name: "You", created_by: user?.id,
    });
  };

  const appendAutomationLog = async (clientId: string, message: string) => {
    const c = clients.find((x) => x.id === clientId);
    const next = [...(c?.automationLog ?? []), message];
    await supabase.from("clients").update({ automation_log: next } as never).eq("id", clientId);
  };

  const addClient = useCallback(async (client: Omit<Client, "id"> & { id?: string }) => {
    if (!user) return null;
    const insertPayload = {
      ...clientPatchToDb(client as Partial<Client>),
      vob_completed_at: new Date().toISOString(),
      created_by: user.id,
    };
    const { data, error } = await supabase.from("clients").insert(insertPayload as never).select("*").single();
    if (error || !data) { console.error(error); return null; }
    const newId = (data as unknown as DbClient).id;

    // Seed tasks / docs / timeline / auths / schedule
    if (client.tasks?.length) {
      await supabase.from("client_tasks").insert(
        client.tasks.map((t, i) => ({
          client_id: newId, title: t.title, completed: t.completed, due_date: t.dueDate ?? null, position: i,
        })) as never,
      );
    }
    if (client.documents?.length) {
      await supabase.from("client_documents").insert(
        client.documents.map((d) => ({ client_id: newId, name: d.name, type: d.type })) as never,
      );
    }
    if (client.authorizations?.length) {
      await supabase.from("client_authorizations").insert(
        client.authorizations.map((a) => ({
          client_id: newId, kind: a.type, status: a.status,
          submitted_date: a.submittedDate ?? null, approved_date: a.approvedDate ?? null,
          expiration_date: a.expirationDate ?? null, hours: a.hours ?? null, notes: a.notes ?? null,
        })) as never,
      );
    }
    if (client.schedule?.length) {
      await supabase.from("client_schedule_slots").insert(
        client.schedule.map((s) => ({
          client_id: newId, day: s.day, start_time: s.start, end_time: s.end, rbt: s.rbt ?? null,
        })) as never,
      );
    }
    if (client.timeline?.length) {
      await supabase.from("client_timeline").insert(
        client.timeline.map((t) => ({
          client_id: newId, event_type: t.type, description: t.description, user_name: t.user ?? null, created_by: user.id,
        })) as never,
      );
    } else {
      await insertTimeline(newId, "Client created from lead", "system");
    }
    // Realtime will trigger refetch; return optimistic shape
    return { ...(client as Client), id: newId };
  }, [user, clients]);

  const updateClient = useCallback(async (id: string, patch: Partial<Client>) => {
    const dbPatch = clientPatchToDb(patch);
    if (Object.keys(dbPatch).length === 0) return;
    await supabase.from("clients").update(dbPatch as never).eq("id", id);
  }, []);

  const bulkUpdate = useCallback(async (ids: string[], patch: Partial<Client>) => {
    const dbPatch = clientPatchToDb(patch);
    if (Object.keys(dbPatch).length === 0 || !ids.length) return;
    await supabase.from("clients").update(dbPatch as never).in("id", ids);
  }, []);

  const moveStage = useCallback(async (ids: string[], stage: ClientStage) => {
    if (!ids.length) return;
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      if (c && !canAdvanceToStage(c.stage, stage)) {
        throw new Error(`Pipeline stages must advance in order. Move from ${canonicalPipelineStage(c.stage)} to the next stage before ${stage}.`);
      }
      const nextLog = [...(c?.automationLog ?? []), `Stage moved to ${stage} (manual)`];
      await supabase.from("clients").update({
        stage, stage_entered_at: new Date().toISOString(), automation_log: nextLog,
      } as never).eq("id", id);
      await insertTimeline(id, `Moved to ${stage}`, "stage");
    }
  }, [clients, user]);

  const revertStage = useCallback(async (
    clientId: string,
    previousStage: ClientStage,
    previousStageEnteredAt: string,
    automationLogEntry: string,
  ) => {
    const c = clients.find((x) => x.id === clientId);
    if (!c) return;
    // Strip the most recent occurrence of the original automation log entry
    const log = [...(c.automationLog ?? [])];
    const idx = log.lastIndexOf(automationLogEntry);
    if (idx >= 0) log.splice(idx, 1);
    log.push(`Stage move undone — restored to ${previousStage}`);
    await supabase.from("clients").update({
      stage: previousStage,
      stage_entered_at: previousStageEnteredAt,
      automation_log: log,
    } as never).eq("id", clientId);
    await insertTimeline(clientId, `Move undone — restored to ${previousStage}`, "stage");
  }, [clients, user]);

  const assignBcba = useCallback(async (ids: string[], bcba: string) => {
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      const advance = c?.stage === "BCBA Assignment";
      const nextLog = [...(c?.automationLog ?? []), `BCBA assigned: ${bcba}`];
      await supabase.from("clients").update({
        bcba, automation_log: nextLog,
        ...(advance ? { stage: "Pending Initial Auth" as ClientStage, stage_entered_at: new Date().toISOString() } : {}),
      } as never).eq("id", id);
      await insertTimeline(id, `BCBA ${bcba} assigned`, "staffing");
    }
  }, [clients, user]);

  const assignRbt = useCallback(async (ids: string[], rbt: string) => {
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      const advance = c?.stage === "Staffing Needed" || c?.stage === "Restaffing Needed";
      const nextLog = [...(c?.automationLog ?? []), `RBT assigned: ${rbt}`];
      await supabase.from("clients").update({
        rbt, staffing_status: "Assigned" as StaffingStatus, automation_log: nextLog,
        ...(advance ? { stage: "Pending Start Date" as ClientStage, stage_entered_at: new Date().toISOString() } : {}),
      } as never).eq("id", id);
      await insertTimeline(id, `${rbt} assigned as RBT`, "staffing");
    }
  }, [clients, user]);

  const setStartDate = useCallback(async (ids: string[], date: string) => {
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      const nextLog = [...(c?.automationLog ?? []), `Start date set to ${date}`];
      await supabase.from("clients").update({ start_date: date, automation_log: nextLog } as never).eq("id", id);
      await insertTimeline(id, `Start date set to ${date}`, "schedule");
    }
  }, [clients, user]);

  const toggleTask = useCallback(async (clientId: string, taskId: string) => {
    const c = clients.find((x) => x.id === clientId);
    const t = c?.tasks.find((x) => x.id === taskId);
    if (!t) return;
    await supabase.from("client_tasks").update({ completed: !t.completed } as never).eq("id", taskId);
  }, [clients]);

  const addTask = useCallback(async (clientId: string, task: ClientTask) => {
    const c = clients.find((x) => x.id === clientId);
    const position = (c?.tasks.length ?? 0);
    await supabase.from("client_tasks").insert({
      client_id: clientId, title: task.title, completed: task.completed,
      due_date: task.dueDate ?? null, position,
    } as never);
  }, [clients]);

  const appendTimeline = useCallback(async (
    clientId: string, description: string, type: ClientTimelineEvent["type"] = "note",
  ) => {
    await insertTimeline(clientId, description, type);
  }, [user]);

  const appendAutomation = useCallback(async (clientId: string, message: string) => {
    await appendAutomationLog(clientId, message);
  }, [clients]);

  const deleteClients = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    await supabase.from("clients").delete().in("id", ids);
  }, []);

  const addDocument = useCallback(async (clientId: string, name: string, type: string) => {
    await supabase.from("client_documents").insert({
      client_id: clientId, name, type, uploaded_by: user?.id,
    } as never);
  }, [user]);

  const removeDocument = useCallback(async (clientId: string, documentId: string) => {
    await supabase.from("client_documents").delete().eq("id", documentId);
  }, []);

  const addScheduleSlot = useCallback(async (clientId: string, slot: ScheduleSlot) => {
    await supabase.from("client_schedule_slots").insert({
      client_id: clientId, day: slot.day, start_time: slot.start, end_time: slot.end, rbt: slot.rbt ?? null,
    } as never);
  }, []);

  const removeScheduleSlot = useCallback(async (clientId: string, day: ScheduleSlot["day"]) => {
    await supabase.from("client_schedule_slots").delete().eq("client_id", clientId).eq("day", day);
  }, []);

  const setSchedule = useCallback(async (clientId: string, slots: ScheduleSlot[]) => {
    await supabase.from("client_schedule_slots").delete().eq("client_id", clientId);
    if (slots.length) {
      await supabase.from("client_schedule_slots").insert(
        slots.map((s) => ({
          client_id: clientId, day: s.day, start_time: s.start, end_time: s.end, rbt: s.rbt ?? null,
        })) as never,
      );
    }
  }, []);

  const value = useMemo<ClientsContextValue>(() => ({
    clients, loading, getClient,
    addClient, updateClient, bulkUpdate, moveStage, revertStage,
    assignBcba, assignRbt, setStartDate,
    toggleTask, addTask, appendTimeline, appendAutomation, deleteClients,
    addDocument, removeDocument, addScheduleSlot, removeScheduleSlot, setSchedule,
  }), [
    clients, loading, getClient, addClient, updateClient, bulkUpdate, moveStage, revertStage,
    assignBcba, assignRbt, setStartDate, toggleTask, addTask, appendTimeline,
    appendAutomation, deleteClients, addDocument, removeDocument, addScheduleSlot,
    removeScheduleSlot, setSchedule,
  ]);

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within <ClientsProvider>");
  return ctx;
}
