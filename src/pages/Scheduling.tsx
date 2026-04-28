import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  FileCheck2,
  Filter,
  Grid3X3,
  ListChecks,
  MailCheck,
  PanelRightOpen,
  Plus,
  Search,
  Send,
  Sparkles,
  Table2,
  UserRoundCheck,
  X,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClients } from "@/contexts/ClientsContext";
import type { Client, ClientSchedulingStatus, ClientStage, ScheduleSlot } from "@/data/clients";
import { calculateWeeklyHours, getApprovedWeeklyHours } from "@/data/scheduling";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "queue" | "table" | "calendar" | "grid" | "pending" | "centralreach";
type ScheduleStatus = "Pending Schedule" | "Schedule In Progress" | "Schedule Created" | "Pending Start Date" | "Starting This Week" | "Delayed Start" | "Ready to Activate" | "Active";
type CRStatus = "Not Entered" | "Entered" | "Verified" | "Error / Needs Fix";
type PairingStatus = "Not Sent" | "Drafted" | "Sent";
type RiskLevel = "Low" | "Medium" | "High" | "Critical";
type PanelTab = "Overview" | "Schedule Builder" | "Availability" | "CentralReach" | "Documents" | "Communications" | "Tasks" | "Timeline";
type SortKey = "client" | "state" | "clinic" | "status" | "start" | "waiting";

type ScheduleTask = { id: string; title: string; owner: string; dueDate: string; completed: boolean };
type ScheduleEvent = { id: string; label: string; at: string; owner?: string };
type ScheduleBlock = ScheduleSlot & { id: string; status: "Pending" | "Confirmed" | "Starting Soon" | "Delayed" | "Active"; clientId: string; clientName: string; bcba: string; hours: number };

type ScheduleRecord = {
  id: string;
  clientId: string;
  clientName: string;
  parentName: string;
  state: string;
  clinic: string;
  bcba: string;
  rbt: string;
  scheduler: string;
  status: ScheduleStatus;
  approvedHours: number;
  scheduledHours: number;
  startDate?: string;
  crStatus: CRStatus;
  crEnteredBy?: string;
  crEnteredDate?: string;
  crVerifiedBy?: string;
  crVerifiedDate?: string;
  crNotes: string;
  pairingEmail: PairingStatus;
  caseCoordinationDoc: boolean;
  daysWaiting: number;
  nextAction: string;
  blocks: ScheduleBlock[];
  tasks: ScheduleTask[];
  timeline: ScheduleEvent[];
  documents: { name: string; status: "Missing" | "Ready" | "Generated" | "Uploaded" }[];
  clientAvailability: string[];
  rbtAvailability: string[];
  bcbaNotes: string;
  overlapScore: number;
  conflictNotes: string[];
  clientStage: ClientStage;
};

const today = new Date("2026-04-28T12:00:00Z");
const isoToday = today.toISOString().slice(0, 10);
const addDays = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
const daysUntil = (date?: string) => date ? Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000) : null;
const daysFrom = (date?: string | null) => date ? Math.max(0, Math.floor((today.getTime() - new Date(date).getTime()) / 86400000)) : 0;
const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

const states = ["GA", "NC", "TN", "VA", "MD"];
const schedulers = ["Alyssa Carter", "Monica Ruiz", "Kayla Morris", "Jordan Mills", "Scheduling Team"];
const rbts = ["Taylor S.", "Jordan M.", "Riley B.", "Casey P.", "Morgan K.", "Quinn D.", "Samira W.", "No RBT Assigned"];
const bcbas = ["Dr. Kim", "Dr. Patel", "Avery Stone", "Maya Reynolds", "Dr. Lee", "Clinical Team"];
const clinics = ["Peachtree Corners", "Riverdale", "Raleigh", "Nashville", "Richmond", "Bethesda"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const timeBlocks = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const statuses: ScheduleStatus[] = ["Pending Schedule", "Schedule In Progress", "Schedule Created", "Pending Start Date", "Starting This Week", "Delayed Start", "Ready to Activate", "Active"];
const crStatuses: CRStatus[] = ["Not Entered", "Entered", "Verified", "Error / Needs Fix"];
const panelTabs: PanelTab[] = ["Overview", "Schedule Builder", "Availability", "CentralReach", "Documents", "Communications", "Tasks", "Timeline"];

const statusVariant = (status: ScheduleStatus) => {
  if (["Active", "Ready to Activate", "Starting This Week"].includes(status)) return "success";
  if (["Delayed Start"].includes(status)) return "destructive";
  if (["Pending Start Date", "Schedule Created", "Schedule In Progress"].includes(status)) return "warning";
  return "info";
};

const crVariant = (status: CRStatus) => status === "Verified" ? "success" : status === "Error / Needs Fix" ? "destructive" : status === "Entered" ? "warning" : "muted";

const schedulingStatusToClient = (status: ScheduleStatus): ClientSchedulingStatus => {
  if (status === "Active") return "Active";
  if (["Pending Start Date", "Starting This Week", "Delayed Start", "Ready to Activate"].includes(status)) return "Pending Start";
  if (status === "Schedule Created") return "Schedule Created";
  return "Pending Schedule";
};

const makeBlocks = (client: Client, recordIndex: number): ScheduleBlock[] => {
  const source = client.schedule.length ? client.schedule : recordIndex % 3 === 0 ? [] : [
    { day: "Mon" as const, start: "09:00", end: "12:00", rbt: client.rbt || rbts[recordIndex % rbts.length], location: recordIndex % 2 ? "Clinic" : "Home" },
    { day: "Wed" as const, start: "09:00", end: "12:00", rbt: client.rbt || rbts[recordIndex % rbts.length], location: recordIndex % 2 ? "Clinic" : "Home" },
    { day: "Fri" as const, start: "09:00", end: "12:00", rbt: client.rbt || rbts[recordIndex % rbts.length], location: recordIndex % 2 ? "Clinic" : "Home" },
  ];
  return source.map((slot, index) => {
    const [startH, startM] = slot.start.split(":").map(Number);
    const [endH, endM] = slot.end.split(":").map(Number);
    const hours = Math.max(0, (endH * 60 + endM - startH * 60 - startM) / 60);
    return {
      ...slot,
      id: `${client.id}-block-${index}`,
      clientId: client.id,
      clientName: client.childName,
      bcba: client.bcba || bcbas[recordIndex % bcbas.length],
      rbt: slot.rbt || client.rbt || rbts[recordIndex % rbts.length],
      location: slot.location || "Clinic",
      status: client.stage === "Active" ? "Active" : client.startDate && (daysUntil(client.startDate) ?? 99) <= 7 ? "Starting Soon" : "Confirmed",
      hours,
    };
  });
};

const inferStatus = (client: Client, blocks: ScheduleBlock[], index: number): ScheduleStatus => {
  const startDays = daysUntil(client.startDate || undefined);
  if (client.stage === "Active" || client.schedulingStatus === "Active") return "Active";
  if (startDays !== null && startDays < 0) return "Delayed Start";
  if (startDays !== null && startDays <= 7) return "Starting This Week";
  if (client.startDate) return "Pending Start Date";
  if (blocks.length) return index % 5 === 0 ? "Schedule In Progress" : "Schedule Created";
  return "Pending Schedule";
};

const buildRecords = (clients: Client[]): ScheduleRecord[] => {
  const pool = clients.length ? clients : [];
  const records = pool.map((client, index) => {
    const blocks = makeBlocks(client, index);
    const approvedHours = client.approvedWeeklyHours || getApprovedWeeklyHours(client) || 20;
    const scheduledHours = blocks.length ? blocks.reduce((sum, block) => sum + block.hours, 0) : calculateWeeklyHours(client);
    const status = inferStatus(client, blocks, index);
    const crStatus: CRStatus = client.centralReachSyncStatus?.includes("Verified") ? "Verified" : client.centralReachSyncStatus?.includes("Error") ? "Error / Needs Fix" : client.centralReachSyncStatus?.includes("Entered") || index % 4 === 0 ? "Entered" : status === "Active" ? "Verified" : "Not Entered";
    const pairingEmail: PairingStatus = client.pairingEmailSent ? "Sent" : index % 4 === 0 ? "Drafted" : "Not Sent";
    return {
      id: `SCH-${client.id}`,
      clientId: client.id,
      clientName: client.childName,
      parentName: client.parentName,
      state: client.state || states[index % states.length],
      clinic: client.clinic || clinics[index % clinics.length],
      bcba: client.bcba || bcbas[index % bcbas.length],
      rbt: client.rbt || rbts[index % rbts.length],
      scheduler: schedulers[index % schedulers.length],
      status,
      approvedHours,
      scheduledHours,
      startDate: client.startDate || (["Pending Start Date", "Starting This Week", "Delayed Start", "Ready to Activate"].includes(status) ? addDays(index % 4 === 0 ? -2 : index + 1) : undefined),
      crStatus,
      crEnteredBy: crStatus !== "Not Entered" ? schedulers[index % schedulers.length] : undefined,
      crEnteredDate: crStatus !== "Not Entered" ? addDays(-2 - index) : undefined,
      crVerifiedBy: crStatus === "Verified" ? "Operations QA" : undefined,
      crVerifiedDate: crStatus === "Verified" ? addDays(-1) : undefined,
      crNotes: crStatus === "Error / Needs Fix" ? "CPT units do not match approved weekly hours." : "CentralReach schedule mirrors approved plan once verified.",
      pairingEmail,
      caseCoordinationDoc: Boolean(client.caseCoordinationDocumentGenerated) || index % 3 === 0,
      daysWaiting: Math.max(1, client.daysInStage || index + 1),
      nextAction: status === "Pending Schedule" ? "Build weekly schedule" : status === "Schedule Created" ? "Set start date and enter CentralReach" : status === "Pending Start Date" ? "Verify CR and send pairing email" : status === "Ready to Activate" ? "Move client to Active" : "Resolve scheduling blockers",
      blocks,
      tasks: [
        { id: `${client.id}-task-1`, title: "Generate Case Coordination Document", owner: schedulers[index % schedulers.length], dueDate: addDays(1), completed: Boolean(client.caseCoordinationDocumentGenerated) },
        { id: `${client.id}-task-2`, title: "Send Pairing Email", owner: schedulers[index % schedulers.length], dueDate: addDays(2), completed: Boolean(client.pairingEmailSent) },
        { id: `${client.id}-task-3`, title: "Confirm CentralReach Entry", owner: schedulers[index % schedulers.length], dueDate: addDays(3), completed: crStatus === "Verified" },
      ],
      timeline: [
        { id: `${client.id}-tl-1`, label: "RBT assigned", at: addDays(-8 - index), owner: "Staffing" },
        { id: `${client.id}-tl-2`, label: "Scheduling started", at: addDays(-5 - index), owner: schedulers[index % schedulers.length] },
        ...(blocks.length ? [{ id: `${client.id}-tl-3`, label: "Weekly schedule created", at: addDays(-3), owner: schedulers[index % schedulers.length] }] : []),
      ],
      documents: [
        { name: "Case Coordination Document", status: Boolean(client.caseCoordinationDocumentGenerated) ? "Generated" : "Missing" },
        { name: "Schedule Summary", status: blocks.length ? "Ready" : "Missing" },
        { name: "Consent Forms", status: client.consentComplete ? "Uploaded" : "Missing" },
        { name: "Auth Approval Docs", status: client.authStatus === "Approved" ? "Uploaded" : "Missing" },
      ],
      clientAvailability: index % 2 ? ["Mon AM", "Wed AM", "Fri AM"] : ["Tue PM", "Thu PM", "Sat AM"],
      rbtAvailability: index % 3 ? ["Mon AM", "Wed AM", "Fri AM"] : ["Tue PM", "Thu PM"],
      bcbaNotes: "BCBA can supervise during initial pairing window and review first-week plan.",
      overlapScore: index % 4 === 0 ? 58 : 84,
      conflictNotes: index % 4 === 0 ? ["RBT availability conflict on Friday", "Approved hours not fully scheduled"] : [],
      clientStage: client.stage,
    } satisfies ScheduleRecord;
  });

  const seeded = [...records];
  while (seeded.length < 18 && pool.length) {
    const client = pool[seeded.length % pool.length];
    const i = seeded.length;
    const status = statuses[i % statuses.length];
    const blocks = status === "Pending Schedule" ? [] : makeBlocks(client, i);
    seeded.push({
      id: `SCH-SEED-${i}`,
      clientId: client.id,
      clientName: client.childName,
      parentName: client.parentName,
      state: states[i % states.length],
      clinic: clinics[i % clinics.length],
      bcba: client.bcba || bcbas[i % bcbas.length],
      rbt: client.rbt || rbts[i % rbts.length],
      scheduler: schedulers[i % schedulers.length],
      status,
      approvedHours: 20 + (i % 4) * 5,
      scheduledHours: blocks.reduce((sum, block) => sum + block.hours, 0),
      startDate: ["Pending Start Date", "Starting This Week", "Delayed Start", "Ready to Activate", "Active"].includes(status) ? addDays(status === "Delayed Start" ? -3 : i % 6) : undefined,
      crStatus: i % 5 === 0 ? "Error / Needs Fix" : i % 3 === 0 ? "Verified" : i % 2 === 0 ? "Entered" : "Not Entered",
      crNotes: "Seeded CentralReach workflow record.",
      pairingEmail: i % 3 === 0 ? "Sent" : "Not Sent",
      caseCoordinationDoc: i % 2 === 0,
      daysWaiting: 1 + i,
      nextAction: status === "Ready to Activate" ? "Move client to Active" : "Complete scheduling workflow",
      blocks,
      tasks: [{ id: `seed-task-${i}`, title: "Complete scheduling readiness", owner: schedulers[i % schedulers.length], dueDate: addDays(2), completed: false }],
      timeline: [{ id: `seed-tl-${i}`, label: "Scheduling record created", at: addDays(-i), owner: "System" }],
      documents: ["Case Coordination Document", "Schedule Summary", "Consent Forms", "Auth Approval Docs"].map((name, docIndex) => ({ name, status: docIndex < 2 ? "Ready" : "Missing" as "Ready" | "Missing" })),
      clientAvailability: ["Mon AM", "Wed AM", "Fri AM"],
      rbtAvailability: ["Mon AM", "Wed AM"],
      bcbaNotes: "Seeded BCBA coverage notes.",
      overlapScore: 72,
      conflictNotes: i % 4 === 0 ? ["Schedule conflict warning"] : [],
      clientStage: client.stage,
    });
  }
  return seeded;
};

const alertsFor = (record: ScheduleRecord) => {
  const alerts: string[] = [];
  const startDays = daysUntil(record.startDate);
  if (record.rbt !== "No RBT Assigned" && record.blocks.length === 0 && record.daysWaiting > 1) alerts.push("RBT assigned but no schedule");
  if (["Schedule Created", "Pending Start Date"].includes(record.status) && !record.startDate) alerts.push("Start date missing");
  if (startDays !== null && startDays < 0 && record.status !== "Active") alerts.push("Start date passed");
  if (record.crStatus === "Not Entered") alerts.push("CentralReach not entered");
  if (record.crStatus === "Entered") alerts.push("CentralReach not verified");
  if (record.scheduledHours < record.approvedHours && record.blocks.length > 0) alerts.push("Under-scheduled hours");
  if (record.scheduledHours > record.approvedHours) alerts.push("Exceeds approved hours");
  if (record.conflictNotes.some((note) => note.toLowerCase().includes("rbt"))) alerts.push("RBT availability conflict");
  if (record.conflictNotes.some((note) => note.toLowerCase().includes("client"))) alerts.push("Client availability conflict");
  if (record.pairingEmail !== "Sent") alerts.push("Missing pairing email");
  if (!record.caseCoordinationDoc) alerts.push("Missing case coordination doc");
  if (record.status === "Ready to Activate" && alerts.length) alerts.push("Client ready but delayed");
  if (!record.scheduler || record.scheduler === "Scheduling Team") alerts.push("No scheduler assigned");
  return alerts;
};

const riskFor = (record: ScheduleRecord): RiskLevel => {
  const alerts = alertsFor(record);
  if (record.status === "Delayed Start" || record.crStatus === "Error / Needs Fix" || alerts.length >= 4) return "Critical";
  if (alerts.length >= 2 || record.daysWaiting > 7) return "High";
  if (alerts.length === 1 || record.daysWaiting > 3) return "Medium";
  return "Low";
};

export default function Scheduling() {
  const navigate = useNavigate();
  const { clients, updateClient, appendTimeline, addTask } = useClients();
  const [records, setRecords] = useState<ScheduleRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("queue");
  const [activeKpi, setActiveKpi] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("Overview");
  const [sortKey, setSortKey] = useState<SortKey>("waiting");
  const [calendarMode, setCalendarMode] = useState("Week");
  const [filters, setFilters] = useState({ state: "All", clinic: "All", scheduler: "All", bcba: "All", rbt: "All", status: "All", start: "All", cr: "All", missingStart: "All" });

  useEffect(() => {
    if (!clients.length) return;
    setRecords((current) => current.length ? current : buildRecords(clients));
  }, [clients]);

  const selected = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const options = useMemo(() => ({
    states: ["All", ...Array.from(new Set(records.map((record) => record.state)))],
    clinics: ["All", ...Array.from(new Set(records.map((record) => record.clinic)))],
    schedulers: ["All", ...Array.from(new Set(records.map((record) => record.scheduler)))],
    bcbas: ["All", ...Array.from(new Set(records.map((record) => record.bcba)))],
    rbts: ["All", ...Array.from(new Set(records.map((record) => record.rbt)))],
  }), [records]);

  const filtered = useMemo(() => {
    let rows = records;
    const q = query.toLowerCase().trim();
    if (q) rows = rows.filter((record) => [record.clientName, record.parentName, record.state, record.clinic, record.bcba, record.rbt, record.scheduler, record.status, record.nextAction].join(" ").toLowerCase().includes(q));
    if (filters.state !== "All") rows = rows.filter((record) => record.state === filters.state);
    if (filters.clinic !== "All") rows = rows.filter((record) => record.clinic === filters.clinic);
    if (filters.scheduler !== "All") rows = rows.filter((record) => record.scheduler === filters.scheduler);
    if (filters.bcba !== "All") rows = rows.filter((record) => record.bcba === filters.bcba);
    if (filters.rbt !== "All") rows = rows.filter((record) => record.rbt === filters.rbt);
    if (filters.status !== "All") rows = rows.filter((record) => record.status === filters.status);
    if (filters.cr !== "All") rows = rows.filter((record) => record.crStatus === filters.cr);
    if (filters.missingStart !== "All") rows = rows.filter((record) => filters.missingStart === "Yes" ? !record.startDate : Boolean(record.startDate));
    if (filters.start !== "All") rows = rows.filter((record) => {
      const days = daysUntil(record.startDate);
      if (days === null) return false;
      if (filters.start === "This Week") return days >= 0 && days <= 7;
      if (filters.start === "Passed") return days < 0;
      return days > 7 && days <= 30;
    });
    if (activeKpi !== "all") rows = rows.filter((record) => {
      if (activeKpi === "Pending Schedule") return record.status === "Pending Schedule";
      if (activeKpi === "Schedule In Progress") return record.status === "Schedule In Progress";
      if (activeKpi === "Schedule Created") return record.status === "Schedule Created";
      if (activeKpi === "Pending Start Date") return record.status === "Pending Start Date" || (record.blocks.length > 0 && !record.startDate);
      if (activeKpi === "Starting This Week") return record.status === "Starting This Week" || ((daysUntil(record.startDate) ?? 999) <= 7 && (daysUntil(record.startDate) ?? -1) >= 0);
      if (activeKpi === "Delayed Starts") return record.status === "Delayed Start" || (daysUntil(record.startDate) ?? 0) < 0;
      if (activeKpi === "Missing CR Entry") return record.crStatus === "Not Entered" || record.crStatus === "Error / Needs Fix";
      if (activeKpi === "Ready to Activate") return canActivate(record);
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sortKey === "client") return a.clientName.localeCompare(b.clientName);
      if (sortKey === "state") return a.state.localeCompare(b.state);
      if (sortKey === "clinic") return a.clinic.localeCompare(b.clinic);
      if (sortKey === "status") return a.status.localeCompare(b.status);
      if (sortKey === "start") return (new Date(a.startDate || "2099-01-01").getTime()) - (new Date(b.startDate || "2099-01-01").getTime());
      return b.daysWaiting - a.daysWaiting;
    });
  }, [records, query, filters, activeKpi, sortKey]);

  const metrics = useMemo(() => [
    { label: "Pending Schedule", value: records.filter((r) => r.status === "Pending Schedule").length, icon: ListChecks },
    { label: "Schedule In Progress", value: records.filter((r) => r.status === "Schedule In Progress").length, icon: Clock },
    { label: "Schedule Created", value: records.filter((r) => r.status === "Schedule Created").length, icon: CalendarDays },
    { label: "Pending Start Date", value: records.filter((r) => r.status === "Pending Start Date" || (r.blocks.length > 0 && !r.startDate)).length, icon: ClipboardCheck },
    { label: "Starting This Week", value: records.filter((r) => (daysUntil(r.startDate) ?? 999) <= 7 && (daysUntil(r.startDate) ?? -1) >= 0).length, icon: CheckCircle2 },
    { label: "Delayed Starts", value: records.filter((r) => r.status === "Delayed Start" || (daysUntil(r.startDate) ?? 0) < 0).length, icon: AlertTriangle },
    { label: "Missing CR Entry", value: records.filter((r) => r.crStatus === "Not Entered" || r.crStatus === "Error / Needs Fix").length, icon: FileCheck2 },
    { label: "Ready to Activate", value: records.filter(canActivate).length, icon: UserRoundCheck },
  ], [records]);

  const patchRecord = (id: string, patch: Partial<ScheduleRecord>, event: string) => {
    setRecords((current) => current.map((record) => record.id === id ? {
      ...record,
      ...patch,
      timeline: [{ id: `tl-${Date.now()}`, label: event, at: isoToday, owner: "You" }, ...record.timeline],
    } : record));
  };

  const addDefaultBlocks = (record: ScheduleRecord) => {
    const blocks: ScheduleBlock[] = ["Mon", "Wed", "Fri"].map((day, index) => ({
      id: `${record.id}-new-${Date.now()}-${index}`,
      clientId: record.clientId,
      clientName: record.clientName,
      bcba: record.bcba,
      rbt: record.rbt,
      day: day as ScheduleSlot["day"],
      start: "09:00",
      end: "13:00",
      location: "Clinic",
      status: "Confirmed",
      hours: 4,
    }));
    return blocks;
  };

  const createTasksForSchedule = (record: ScheduleRecord) => [
    { id: `doc-${Date.now()}`, title: "Generate Case Coordination Document", owner: record.scheduler, dueDate: addDays(1), completed: record.caseCoordinationDoc },
    { id: `email-${Date.now()}`, title: "Send Pairing Email", owner: record.scheduler, dueDate: addDays(1), completed: record.pairingEmail === "Sent" },
    { id: `cr-${Date.now()}`, title: "Confirm CentralReach Entry", owner: record.scheduler, dueDate: addDays(2), completed: record.crStatus === "Verified" },
    ...record.tasks,
  ];

  const buildSchedule = async (record: ScheduleRecord) => {
    const blocks = record.blocks.length ? record.blocks : addDefaultBlocks(record);
    const scheduledHours = blocks.reduce((sum, block) => sum + block.hours, 0);
    patchRecord(record.id, { blocks, scheduledHours, status: scheduledHours > 0 ? "Schedule Created" : "Schedule In Progress", tasks: createTasksForSchedule(record), nextAction: "Set start date and enter CentralReach" }, "Schedule built");
    await addTask(record.clientId, { id: `schedule-${Date.now()}`, title: "Confirm CentralReach Entry", completed: false, dueDate: addDays(2) });
    toast.success("Schedule built");
  };

  const setStartDate = async (record: ScheduleRecord, startDate = addDays(3)) => {
    const nextStatus: ScheduleStatus = (daysUntil(startDate) ?? 99) <= 7 ? "Starting This Week" : "Pending Start Date";
    patchRecord(record.id, { startDate, status: nextStatus, nextAction: "Verify CentralReach and pairing email" }, "Start date set");
    await updateClient(record.clientId, { startDate, schedulingStatus: "Pending Start" });
    await appendTimeline(record.clientId, `Start date set for ${startDate}`, "schedule");
    toast.success("Start date set");
  };

  const markCr = async (record: ScheduleRecord, status: CRStatus) => {
    const patch: Partial<ScheduleRecord> = status === "Entered" ? { crStatus: status, crEnteredBy: record.scheduler, crEnteredDate: isoToday, nextAction: "Verify CentralReach entry" } : { crStatus: status, crVerifiedBy: "Operations QA", crVerifiedDate: isoToday, nextAction: "Confirm start readiness" };
    patchRecord(record.id, patch, `CentralReach ${status}`);
    await updateClient(record.clientId, { centralReachSyncStatus: status });
    await appendTimeline(record.clientId, `CentralReach ${status}`, "schedule");
    toast.success(`CentralReach ${status}`);
  };

  const sendPairingEmail = async (record: ScheduleRecord) => {
    patchRecord(record.id, { pairingEmail: "Sent", nextAction: "Confirm start readiness" }, "Pairing email sent");
    await updateClient(record.clientId, { pairingEmailSent: true });
    await appendTimeline(record.clientId, "Pairing email sent", "schedule");
    toast.success("Pairing email sent");
  };

  const generateDoc = async (record: ScheduleRecord) => {
    patchRecord(record.id, { caseCoordinationDoc: true, documents: record.documents.map((doc) => doc.name === "Case Coordination Document" ? { ...doc, status: "Generated" } : doc) }, "Case coordination document generated");
    await updateClient(record.clientId, { caseCoordinationDocumentGenerated: true });
    await appendTimeline(record.clientId, "Case coordination document generated", "schedule");
    toast.success("Case coordination document generated");
  };

  const moveActive = async (record: ScheduleRecord) => {
    if (!canActivate(record)) {
      toast.error("Resolve schedule, CR, document, email, and conflict blockers first");
      return;
    }
    patchRecord(record.id, { status: "Active", tasks: record.tasks.map((task) => ({ ...task, completed: true })), nextAction: "Monitor active services" }, "Client activated");
    await updateClient(record.clientId, { stage: "Active", schedulingStatus: "Active", activeServiceStatus: "Active" });
    await appendTimeline(record.clientId, "Client activated from Scheduling", "stage");
    localStorage.setItem("blossom-active-services-refresh", JSON.stringify({ clientId: record.clientId, activatedAt: isoToday }));
    toast.success(`${record.clientName} moved to Active`);
  };

  const quickTask = (record: ScheduleRecord, title: string) => {
    patchRecord(record.id, { tasks: [{ id: `task-${Date.now()}`, title, owner: record.scheduler, dueDate: addDays(2), completed: false }, ...record.tasks], nextAction: title }, title);
    toast.success(title);
  };

  const bulkCr = () => {
    setRecords((current) => current.map((record) => selectedIds.includes(record.id) ? { ...record, crStatus: "Entered", crEnteredBy: record.scheduler, crEnteredDate: isoToday, timeline: [{ id: `bulk-${Date.now()}`, label: "Bulk marked CR entered", at: isoToday, owner: "You" }, ...record.timeline] } : record));
    toast.success(`${selectedIds.length} records marked CR entered`);
    setSelectedIds([]);
  };

  const bulkStart = (date = addDays(5)) => {
    setRecords((current) => current.map((record) => selectedIds.includes(record.id) ? { ...record, startDate: date, status: "Pending Start Date", timeline: [{ id: `bulk-start-${Date.now()}`, label: `Bulk start date set for ${date}`, at: isoToday, owner: "You" }, ...record.timeline] } : record));
    toast.success(`${selectedIds.length} start dates updated`);
    setSelectedIds([]);
  };

  return (
    <PageShell title="Scheduling" description="Build weekly schedules, confirm availability, prepare CentralReach, and activate client starts." icon={CalendarDays}>
      <section className="space-y-4 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button className="gap-2"><Plus className="h-4 w-4" />New Schedule</Button>
            <Button variant="outline" className="gap-2" disabled={!selectedIds.length} onClick={bulkCr}><Filter className="h-4 w-4" />Bulk Actions</Button>
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export</Button>
            <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" />Saved Views</Button>
            <Button variant="outline" className="gap-2" onClick={() => setViewMode("calendar")}><CalendarDays className="h-4 w-4" />Calendar View</Button>
            <Button variant="outline" className="gap-2" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" />Schedule Builder</Button>
          </div>
          <div className="relative min-w-0 xl:w-[380px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, BCBA, RBT, scheduler…" className="pl-9" />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-5 xl:grid-cols-10">
          <FilterSelect label="State" value={filters.state} options={options.states} onChange={(value) => setFilters({ ...filters, state: value })} />
          <FilterSelect label="Clinic" value={filters.clinic} options={options.clinics} onChange={(value) => setFilters({ ...filters, clinic: value })} />
          <FilterSelect label="Scheduler" value={filters.scheduler} options={options.schedulers} onChange={(value) => setFilters({ ...filters, scheduler: value })} />
          <FilterSelect label="BCBA" value={filters.bcba} options={options.bcbas} onChange={(value) => setFilters({ ...filters, bcba: value })} />
          <FilterSelect label="RBT" value={filters.rbt} options={options.rbts} onChange={(value) => setFilters({ ...filters, rbt: value })} />
          <FilterSelect label="Client" value="All" options={["All", ...records.slice(0, 12).map((record) => record.clientName)]} onChange={(value) => setQuery(value === "All" ? "" : value)} />
          <FilterSelect label="Status" value={filters.status} options={["All", ...statuses]} onChange={(value) => setFilters({ ...filters, status: value })} />
          <FilterSelect label="Start Range" value={filters.start} options={["All", "This Week", "Passed", "Next 30"]} onChange={(value) => setFilters({ ...filters, start: value })} />
          <FilterSelect label="CR Status" value={filters.cr} options={["All", ...crStatuses]} onChange={(value) => setFilters({ ...filters, cr: value })} />
          <FilterSelect label="Missing Start" value={filters.missingStart} options={["All", "Yes", "No"]} onChange={(value) => setFilters({ ...filters, missingStart: value })} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
            {([
              ["queue", "Queue View", ListChecks],
              ["table", "Table View", Table2],
              ["calendar", "Calendar View", CalendarDays],
              ["grid", "Weekly Grid View", Grid3X3],
              ["pending", "Pending Start View", Clock],
              ["centralreach", "CentralReach View", FileCheck2],
            ] as [ViewMode, string, LucideIcon][]).map(([mode, label, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={cn("inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors", viewMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground")}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
          <button onClick={() => { setActiveKpi("all"); setFilters({ state: "All", clinic: "All", scheduler: "All", bcba: "All", rbt: "All", status: "All", start: "All", cr: "All", missingStart: "All" }); }} className="text-xs font-medium text-muted-foreground hover:text-foreground">Reset filters</button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        {metrics.map(({ label, value, icon: Icon }) => <MetricCard key={label} label={label} value={value} icon={Icon} active={activeKpi === label} onClick={() => setActiveKpi(activeKpi === label ? "all" : label)} />)}
      </section>

      {selectedIds.length > 0 && <BulkBar count={selectedIds.length} onClear={() => setSelectedIds([])} onCr={bulkCr} onStart={bulkStart} />}

      {viewMode === "queue" && <QueueView records={filtered} onOpen={(record) => { setSelectedId(record.id); setPanelTab("Overview"); }} onBuild={buildSchedule} onStart={setStartDate} onCr={markCr} onEmail={sendPairingEmail} onDoc={generateDoc} onActive={moveActive} />}
      {viewMode === "table" && <TableView records={filtered} selectedIds={selectedIds} setSelectedIds={setSelectedIds} sortKey={sortKey} setSortKey={setSortKey} onOpen={(record) => setSelectedId(record.id)} onPatch={patchRecord} />}
      {viewMode === "calendar" && <CalendarView records={filtered} mode={calendarMode} setMode={setCalendarMode} onOpen={(record) => setSelectedId(record.id)} />}
      {viewMode === "grid" && <WeeklyGridView records={filtered} onOpen={(record) => setSelectedId(record.id)} onPatch={patchRecord} />}
      {viewMode === "pending" && <PendingStartView records={filtered.filter((record) => record.status !== "Active" && (record.startDate || record.blocks.length > 0))} onOpen={(record) => setSelectedId(record.id)} onActive={moveActive} onStart={setStartDate} />}
      {viewMode === "centralreach" && <CentralReachView records={filtered} onOpen={(record) => setSelectedId(record.id)} onCr={markCr} />}

      {selected && <ScheduleSidePanel record={selected} tab={panelTab} setTab={setPanelTab} onClose={() => setSelectedId(null)} onClient={() => navigate(`/clients/${selected.clientId}`)} onBuild={buildSchedule} onStart={setStartDate} onCr={markCr} onEmail={sendPairingEmail} onDoc={generateDoc} onTask={quickTask} onPatch={patchRecord} />}
    </PageShell>
  );
}

const canActivate = (record: ScheduleRecord) => Boolean(record.startDate && (daysUntil(record.startDate) ?? 1) <= 0 && record.blocks.length > 0 && record.crStatus === "Verified" && record.pairingEmail === "Sent" && record.caseCoordinationDoc && !record.conflictNotes.length && record.scheduledHours >= record.approvedHours * 0.8);

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="space-y-1"><span className="text-[11px] font-medium text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none transition-colors focus:border-primary">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function MetricCard({ label, value, icon: Icon, active, onClick }: { label: string; value: number; icon: LucideIcon; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={cn("rounded-lg border border-border/60 bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md", active && "border-primary/40 bg-primary/5 shadow-sm")}><div className="mb-3 flex items-center justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></button>;
}

function AlertPill({ record }: { record: ScheduleRecord }) {
  const alerts = alertsFor(record);
  if (!alerts.length) return <span className="text-xs text-muted-foreground">Clear</span>;
  return <span className={cn("inline-flex max-w-[240px] items-center gap-1 rounded-md px-2 py-1 text-xs", riskFor(record) === "Critical" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3 shrink-0" /><span className="truncate">{alerts[0]}</span></span>;
}

function QueueView({ records, onOpen, onBuild, onStart, onCr, onEmail, onDoc, onActive }: { records: ScheduleRecord[]; onOpen: (record: ScheduleRecord) => void; onBuild: (record: ScheduleRecord) => void; onStart: (record: ScheduleRecord) => void; onCr: (record: ScheduleRecord, status: CRStatus) => void; onEmail: (record: ScheduleRecord) => void; onDoc: (record: ScheduleRecord) => void; onActive: (record: ScheduleRecord) => void }) {
  const sections = [
    { title: "Urgent Now", filter: (r: ScheduleRecord) => riskFor(r) === "Critical" || alertsFor(r).some((alert) => ["Start date passed", "CentralReach not entered", "RBT assigned but no schedule", "Under-scheduled hours"].includes(alert)) },
    { title: "Needs Scheduling", filter: (r: ScheduleRecord) => r.status === "Pending Schedule" },
    { title: "Schedule In Progress", filter: (r: ScheduleRecord) => r.status === "Schedule In Progress" || r.status === "Schedule Created" },
    { title: "Pending Start Date", filter: (r: ScheduleRecord) => r.status === "Pending Start Date" || (r.blocks.length > 0 && !r.startDate) },
    { title: "CentralReach Entry", filter: (r: ScheduleRecord) => r.crStatus !== "Verified" },
    { title: "Ready to Activate", filter: canActivate },
  ];
  return <div className="space-y-4">{sections.map((section) => { const items = records.filter(section.filter); return <section key={section.title} className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div><h3 className="text-sm font-semibold text-foreground">{section.title}</h3><p className="text-xs text-muted-foreground">{items.length} schedule records</p></div><StatusBadge status={`${items.length}`} variant={items.length ? "warning" : "muted"} /></div><div className="divide-y divide-border/50">{items.slice(0, 10).map((record) => <ScheduleQueueRow key={record.id} record={record} onOpen={onOpen} onBuild={onBuild} onStart={onStart} onCr={onCr} onEmail={onEmail} onDoc={onDoc} onActive={onActive} />)}{!items.length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No records in this queue</p>}</div></section>; })}</div>;
}

function ScheduleQueueRow({ record, onOpen, onBuild, onStart, onCr, onEmail, onDoc, onActive }: { record: ScheduleRecord; onOpen: (record: ScheduleRecord) => void; onBuild: (record: ScheduleRecord) => void; onStart: (record: ScheduleRecord) => void; onCr: (record: ScheduleRecord, status: CRStatus) => void; onEmail: (record: ScheduleRecord) => void; onDoc: (record: ScheduleRecord) => void; onActive: (record: ScheduleRecord) => void }) {
  return <div className="grid gap-3 px-4 py-3 xl:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr_0.7fr_0.7fr_0.8fr_0.45fr_1fr_1.45fr] xl:items-center"><button onClick={() => onOpen(record)} className="text-left"><p className="font-medium text-foreground hover:text-primary">{record.clientName}</p><p className="text-xs text-muted-foreground">{record.parentName}</p></button><span className="text-sm text-muted-foreground">{record.state} / {record.clinic}</span><span className="text-sm text-muted-foreground">{record.bcba}</span><span className="text-sm text-muted-foreground">{record.rbt}</span><span className="text-sm text-muted-foreground">{record.scheduler}</span><span className="text-sm text-muted-foreground">{record.approvedHours}h</span><span className="text-sm text-muted-foreground">{record.scheduledHours}h</span><span className="text-sm text-muted-foreground">{record.startDate ?? "—"}</span><StatusBadge status={record.crStatus} variant={crVariant(record.crStatus)} /><span className="text-sm text-muted-foreground">{record.daysWaiting}d</span><div><AlertPill record={record} /><p className="mt-1 truncate text-xs text-muted-foreground">{record.nextAction}</p></div><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => onOpen(record)}><PanelRightOpen className="h-3.5 w-3.5" /></Button><Button size="sm" variant="outline" onClick={() => onBuild(record)}>Build</Button><Button size="sm" variant="outline" onClick={() => onStart(record)}>Start</Button><Button size="sm" variant="outline" onClick={() => onCr(record, "Entered")}>CR Entered</Button><Button size="sm" variant="outline" onClick={() => onCr(record, "Verified")}>Verified</Button><Button size="sm" variant="outline" onClick={() => onEmail(record)}>Email</Button><Button size="sm" variant="outline" onClick={() => onDoc(record)}>Doc</Button><Button size="sm" variant="outline" onClick={() => onActive(record)}>Active</Button></div></div>;
}

function TableView({ records, selectedIds, setSelectedIds, sortKey, setSortKey, onOpen, onPatch }: { records: ScheduleRecord[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; sortKey: SortKey; setSortKey: (key: SortKey) => void; onOpen: (record: ScheduleRecord) => void; onPatch: (id: string, patch: Partial<ScheduleRecord>, event: string) => void }) {
  const allSelected = records.length > 0 && records.every((record) => selectedIds.includes(record.id));
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><p className="text-sm font-semibold text-foreground">Scheduling table</p><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Sort</span><select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="h-8 rounded-md border border-input bg-background px-2 text-xs"><option value="waiting">Days Waiting</option><option value="client">Client</option><option value="state">State</option><option value="clinic">Clinic</option><option value="status">Status</option><option value="start">Start Date</option></select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[1450px] text-sm"><thead><tr className="border-b border-border/60 bg-muted/20"><th className="px-3 py-2 text-left"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : records.map((record) => record.id))} /></th>{["Client", "State", "Clinic", "BCBA", "RBT", "Scheduler", "Scheduling Status", "Approved", "Scheduled", "Start Date", "CentralReach", "Pairing Email", "Case Doc", "Days", "Next Action", "Alerts"].map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{header}</th>)}</tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds(selectedIds.includes(record.id) ? selectedIds.filter((id) => id !== record.id) : [...selectedIds, record.id])} /></td><td className="px-3 py-3"><button onClick={() => onOpen(record)} className="font-medium text-foreground hover:text-primary">{record.clientName}</button></td><td className="px-3 py-3 text-muted-foreground">{record.state}</td><td className="px-3 py-3 text-muted-foreground">{record.clinic}</td><td className="px-3 py-3 text-muted-foreground">{record.bcba}</td><td className="px-3 py-3 text-muted-foreground">{record.rbt}</td><td className="px-3 py-3"><Input value={record.scheduler} onChange={(event) => onPatch(record.id, { scheduler: event.target.value }, "Scheduler updated")} className="h-8 w-36 text-xs" /></td><td className="px-3 py-3"><select value={record.status} onChange={(event) => onPatch(record.id, { status: event.target.value as ScheduleStatus }, `Status changed to ${event.target.value}`)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">{statuses.map((status) => <option key={status}>{status}</option>)}</select></td><td className="px-3 py-3 text-muted-foreground">{record.approvedHours}</td><td className="px-3 py-3"><Input type="number" value={record.scheduledHours} onChange={(event) => onPatch(record.id, { scheduledHours: Number(event.target.value) }, "Scheduled hours updated")} className="h-8 w-20 text-xs" /></td><td className="px-3 py-3"><Input type="date" value={record.startDate ?? ""} onChange={(event) => onPatch(record.id, { startDate: event.target.value, status: "Pending Start Date" }, "Start date updated")} className="h-8 w-36 text-xs" /></td><td className="px-3 py-3"><select value={record.crStatus} onChange={(event) => onPatch(record.id, { crStatus: event.target.value as CRStatus }, `CR status changed to ${event.target.value}`)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">{crStatuses.map((status) => <option key={status}>{status}</option>)}</select></td><td className="px-3 py-3"><StatusBadge status={record.pairingEmail} variant={record.pairingEmail === "Sent" ? "success" : "warning"} /></td><td className="px-3 py-3"><StatusBadge status={record.caseCoordinationDoc ? "Generated" : "Missing"} variant={record.caseCoordinationDoc ? "success" : "destructive"} /></td><td className="px-3 py-3 text-muted-foreground">{record.daysWaiting}</td><td className="px-3 py-3"><Input value={record.nextAction} onChange={(event) => onPatch(record.id, { nextAction: event.target.value }, "Next action updated")} className="h-8 w-56 text-xs" /></td><td className="px-3 py-3"><AlertPill record={record} /></td></tr>)}</tbody></table></div></div>;
}

function CalendarView({ records, mode, setMode, onOpen }: { records: ScheduleRecord[]; mode: string; setMode: (mode: string) => void; onOpen: (record: ScheduleRecord) => void }) {
  const blocks = records.flatMap((record) => record.blocks.map((block) => ({ record, block })));
  return <section className="rounded-lg border border-border/60 bg-card p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Scheduling calendar</h3><p className="text-xs text-muted-foreground">Today · week and month operations by owner, RBT, BCBA, and clinic</p></div><div className="flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">{["Today", "Week", "Month", "By Scheduler", "By RBT", "By BCBA", "By Clinic"].map((item) => <button key={item} onClick={() => setMode(item)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", mode === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60")}>{item}</button>)}</div></div><div className="grid gap-3 lg:grid-cols-7">{shortDays.map((day) => <div key={day} className="min-h-[340px] rounded-lg border border-border/60 bg-background p-2"><p className="mb-2 text-xs font-semibold text-muted-foreground">{day}</p><div className="space-y-2">{blocks.filter(({ block }) => block.day === day).map(({ record, block }) => <button key={block.id} onClick={() => onOpen(record)} className={cn("w-full rounded-md border p-2 text-left transition-colors hover:bg-muted/30", block.status === "Active" ? "border-success/30 bg-success/10" : block.status === "Delayed" ? "border-destructive/30 bg-destructive/10" : block.status === "Starting Soon" ? "border-primary/30 bg-primary/10" : "border-border bg-card")}><p className="truncate text-xs font-semibold text-foreground">{record.clientName}</p><p className="text-[11px] text-muted-foreground">{block.start}-{block.end}</p><p className="truncate text-[11px] text-muted-foreground">{record.rbt} · {record.bcba}</p><StatusBadge status={block.status} variant={block.status === "Active" ? "success" : block.status === "Delayed" ? "destructive" : "info"} /></button>)}</div></div>)}</div></section>;
}

function WeeklyGridView({ records, onOpen, onPatch }: { records: ScheduleRecord[]; onOpen: (record: ScheduleRecord) => void; onPatch: (id: string, patch: Partial<ScheduleRecord>, event: string) => void }) {
  const [draftDay, setDraftDay] = useState<ScheduleSlot["day"]>("Mon");
  const addBlock = (record: ScheduleRecord) => {
    const block: ScheduleBlock = { id: `block-${Date.now()}`, clientId: record.clientId, clientName: record.clientName, bcba: record.bcba, rbt: record.rbt, day: draftDay, start: "14:00", end: "17:00", location: "Clinic", status: "Pending", hours: 3 };
    const blocks = [...record.blocks, block];
    onPatch(record.id, { blocks, scheduledHours: blocks.reduce((sum, item) => sum + item.hours, 0), status: "Schedule Created" }, "Schedule block added");
  };
  return <section className="rounded-lg border border-border/60 bg-card p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Weekly schedule builder</h3><p className="text-xs text-muted-foreground">Add, edit, delete, and move blocks across the week; conflicts surface automatically</p></div><div className="flex items-center gap-2"><select value={draftDay} onChange={(event) => setDraftDay(event.target.value as ScheduleSlot["day"])} className="h-9 rounded-md border border-input bg-background px-2 text-xs">{shortDays.map((day) => <option key={day}>{day}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse"><thead><tr><th className="sticky left-0 z-10 w-24 bg-card p-2 text-left text-xs text-muted-foreground">Time</th>{weekdays.map((day) => <th key={day} className="min-w-[130px] border-b border-border/60 p-2 text-left text-xs text-muted-foreground">{day}</th>)}</tr></thead><tbody>{timeBlocks.map((time) => <tr key={time} className="border-b border-border/40"><td className="sticky left-0 bg-card p-2 text-xs font-medium text-muted-foreground">{time}</td>{shortDays.map((day) => { const slots = records.flatMap((record) => record.blocks.filter((block) => block.day === day && block.start <= time && block.end > time).map((block) => ({ record, block }))); return <td key={day} className="h-20 border-l border-border/40 p-1 align-top">{slots.slice(0, 3).map(({ record, block }) => <div key={block.id} className="mb-1 rounded-md border border-primary/30 bg-primary/10 p-1.5"><button onClick={() => onOpen(record)} className="block w-full text-left"><p className="truncate text-[11px] font-semibold text-primary">{record.clientName}</p><p className="truncate text-[10px] text-muted-foreground">{record.rbt} · {record.bcba}</p><p className="text-[10px] text-muted-foreground">{block.hours}h · {block.location}</p></button><div className="mt-1 flex gap-1"><button onClick={() => onPatch(record.id, { blocks: record.blocks.map((item) => item.id === block.id ? { ...item, day: day === "Mon" ? "Tue" : "Mon" } : item) }, "Block dragged to another day") } className="text-[10px] text-primary">Move</button><button onClick={() => onPatch(record.id, { blocks: record.blocks.filter((item) => item.id !== block.id), scheduledHours: record.blocks.filter((item) => item.id !== block.id).reduce((sum, item) => sum + item.hours, 0) }, "Schedule block deleted") } className="text-[10px] text-destructive">Delete</button></div></div>)}</td>; })}</tr>)}</tbody></table></div><div className="mt-4 grid gap-2 md:grid-cols-3">{records.slice(0, 6).map((record) => <div key={record.id} className="rounded-lg border border-border/60 bg-background p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{record.clientName}</p><Button size="sm" variant="outline" onClick={() => addBlock(record)}>Add block</Button></div><p className="mt-1 text-xs text-muted-foreground">{record.scheduledHours}/{record.approvedHours}h scheduled</p>{record.conflictNotes.length > 0 && <p className="mt-2 text-xs text-destructive">{record.conflictNotes[0]}</p>}</div>)}</div></section>;
}

function PendingStartView({ records, onOpen, onActive, onStart }: { records: ScheduleRecord[]; onOpen: (record: ScheduleRecord) => void; onActive: (record: ScheduleRecord) => void; onStart: (record: ScheduleRecord) => void }) {
  const groups = [{ title: "Missing Start Date", filter: (r: ScheduleRecord) => !r.startDate }, { title: "Starting This Week", filter: (r: ScheduleRecord) => { const d = daysUntil(r.startDate); return d !== null && d >= 0 && d <= 7; } }, { title: "Start Date Passed", filter: (r: ScheduleRecord) => (daysUntil(r.startDate) ?? 1) < 0 }, { title: "Ready to Activate", filter: canActivate }];
  return <div className="space-y-4">{groups.map((group) => { const items = records.filter(group.filter); return <section key={group.title} className="rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 bg-muted/20 px-4 py-3"><h3 className="text-sm font-semibold text-foreground">{group.title}</h3></div><div className="divide-y divide-border/50">{items.map((record) => <div key={record.id} className="grid gap-3 px-4 py-3 xl:grid-cols-[1fr_0.8fr_0.8fr_0.7fr_0.8fr_1fr] xl:items-center"><button onClick={() => onOpen(record)} className="text-left font-medium text-foreground hover:text-primary">{record.clientName}</button><span className="text-sm text-muted-foreground">{record.startDate ?? "—"}</span><StatusBadge status={record.crStatus} variant={crVariant(record.crStatus)} /><span className="text-sm text-muted-foreground">{record.scheduledHours}/{record.approvedHours}h</span><AlertPill record={record} /><div className="flex gap-1.5"><Button size="sm" variant="outline" onClick={() => onStart(record)}>Set Start</Button><Button size="sm" variant="outline" onClick={() => onActive(record)}>Move Active</Button></div></div>)}{!items.length && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No records here</p>}</div></section>; })}</div>;
}

function CentralReachView({ records, onOpen, onCr }: { records: ScheduleRecord[]; onOpen: (record: ScheduleRecord) => void; onCr: (record: ScheduleRecord, status: CRStatus) => void }) {
  return <div className="grid gap-4 xl:grid-cols-2">{crStatuses.map((status) => { const items = records.filter((record) => record.crStatus === status); return <section key={status} className="rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 bg-muted/20 px-4 py-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">{status}</h3><StatusBadge status={`${items.length}`} variant={crVariant(status)} /></div></div><div className="divide-y divide-border/50">{items.map((record) => <div key={record.id} className="p-4"><div className="flex items-start justify-between gap-3"><button onClick={() => onOpen(record)} className="text-left"><p className="font-medium text-foreground hover:text-primary">{record.clientName}</p><p className="text-xs text-muted-foreground">Start {record.startDate ?? "—"} · {record.scheduledHours} weekly hours</p></button><div className="flex gap-1.5"><Button size="sm" variant="outline" onClick={() => onCr(record, "Entered")}>Entered</Button><Button size="sm" variant="outline" onClick={() => onCr(record, "Verified")}>Verified</Button></div></div><div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2"><span>Entered by {record.crEnteredBy ?? "—"}</span><span>Entered {record.crEnteredDate ?? "—"}</span><span>Verified by {record.crVerifiedBy ?? "—"}</span><span>{record.crNotes}</span></div></div>)}{!items.length && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No CR records</p>}</div></section>; })}</div>;
}

function BulkBar({ count, onClear, onCr, onStart }: { count: number; onClear: () => void; onCr: () => void; onStart: () => void }) {
  return <div className="sticky top-3 z-20 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 shadow-lg backdrop-blur"><p className="text-sm font-medium text-foreground">{count} selected</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline">Assign scheduler</Button><Button size="sm" variant="outline" onClick={() => onStart()}>Bulk start date</Button><Button size="sm" variant="outline" onClick={onCr}>Mark CR entered</Button><Button size="sm" variant="ghost" onClick={onClear}>Clear</Button></div></div>;
}

function ScheduleSidePanel({ record, tab, setTab, onClose, onClient, onBuild, onStart, onCr, onEmail, onDoc, onTask, onPatch }: { record: ScheduleRecord; tab: PanelTab; setTab: (tab: PanelTab) => void; onClose: () => void; onClient: () => void; onBuild: (record: ScheduleRecord) => void; onStart: (record: ScheduleRecord) => void; onCr: (record: ScheduleRecord, status: CRStatus) => void; onEmail: (record: ScheduleRecord) => void; onDoc: (record: ScheduleRecord) => void; onTask: (record: ScheduleRecord, title: string) => void; onPatch: (id: string, patch: Partial<ScheduleRecord>, event: string) => void }) {
  return <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl"><div className="border-b border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-foreground">{record.clientName}</h2><StatusBadge status={record.status} variant={statusVariant(record.status)} /></div><p className="mt-1 text-sm text-muted-foreground">{record.state} / {record.clinic} · {record.bcba} · {record.rbt} · {record.scheduler}</p><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={`Start ${record.startDate ?? "missing"}`} variant={record.startDate ? "info" : "destructive"} /><StatusBadge status={`${riskFor(record)} risk`} variant={riskFor(record) === "Critical" ? "destructive" : riskFor(record) === "High" ? "warning" : "info"} /><StatusBadge status={record.crStatus} variant={crVariant(record.crStatus)} /></div></div><button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={onClient}><UserRoundCheck className="h-3.5 w-3.5" />Open Client</Button><Button size="sm" variant="outline" onClick={() => onBuild(record)}>Build Schedule</Button><Button size="sm" variant="outline" onClick={() => onStart(record)}>Set Start Date</Button><Button size="sm" variant="outline" onClick={() => onCr(record, "Entered")}>Mark CR Entered</Button><Button size="sm" variant="outline" onClick={() => onEmail(record)}>Send Pairing Email</Button><Button size="sm" variant="outline" onClick={() => onDoc(record)}>Generate Case Coordination Doc</Button><Button size="sm" variant="outline" onClick={() => onTask(record, "Create scheduling task")}>Create Task</Button><Button size="sm" variant="outline" onClick={() => onTask(record, "Add scheduling note")}>Add Note</Button></div></div><div className="border-b border-border bg-card px-5 py-2"><div className="flex gap-1 overflow-x-auto">{panelTabs.map((item) => <button key={item} onClick={() => setTab(item)} className={cn("whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors", tab === item ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{item}</button>)}</div></div><div className="flex-1 overflow-y-auto p-5"><PanelContent record={record} tab={tab} onPatch={onPatch} onCr={onCr} onEmail={onEmail} /></div></aside>;
}

function PanelContent({ record, tab, onPatch, onCr, onEmail }: { record: ScheduleRecord; tab: PanelTab; onPatch: (id: string, patch: Partial<ScheduleRecord>, event: string) => void; onCr: (record: ScheduleRecord, status: CRStatus) => void; onEmail: (record: ScheduleRecord) => void }) {
  if (tab === "Overview") return <PanelGrid items={[["Current scheduling status", record.status], ["Assigned BCBA", record.bcba], ["Assigned RBT", record.rbt], ["Approved hours", `${record.approvedHours}`], ["Scheduled hours", `${record.scheduledHours}`], ["Start date", record.startDate ?? "Missing"], ["Blockers", alertsFor(record).join(", ") || "None"], ["Next action", record.nextAction], ["Days waiting", `${record.daysWaiting}`]]} />;
  if (tab === "Schedule Builder") return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-3"><Stat label="Approved" value={`${record.approvedHours}h`} /><Stat label="Scheduled" value={`${record.scheduledHours}h`} /><Stat label="Completeness" value={`${Math.min(100, Math.round((record.scheduledHours / Math.max(1, record.approvedHours)) * 100))}%`} /></div><div className="space-y-2">{record.blocks.map((block) => <div key={block.id} className="rounded-lg border border-border/60 bg-card p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{block.day} · {block.start}-{block.end}</p><button onClick={() => onPatch(record.id, { blocks: record.blocks.filter((item) => item.id !== block.id), scheduledHours: record.blocks.filter((item) => item.id !== block.id).reduce((sum, item) => sum + item.hours, 0) }, "Schedule block deleted") } className="text-xs text-destructive">Delete</button></div><p className="text-xs text-muted-foreground">{record.clientName} · {record.rbt} · {record.bcba} · {block.hours}h · {block.location}</p></div>))}</div>{record.conflictNotes.map((note) => <p key={note} className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{note}</p>)}</div>;
  if (tab === "Availability") return <PanelGrid items={[["Client availability", record.clientAvailability.join(", ")], ["RBT availability", record.rbtAvailability.join(", ")], ["BCBA notes", record.bcbaNotes], ["Overlap score", `${record.overlapScore}%`], ["Conflict notes", record.conflictNotes.join(", ") || "None"]]} />;
  if (tab === "CentralReach") return <div className="space-y-4"><PanelGrid items={[["CR Entry Status", record.crStatus], ["Entered by", record.crEnteredBy ?? "—"], ["Entered date", record.crEnteredDate ?? "—"], ["Verified by", record.crVerifiedBy ?? "—"], ["Verification date", record.crVerifiedDate ?? "—"], ["CR notes", record.crNotes]]} /><div className="flex gap-2"><Button variant="outline" onClick={() => onCr(record, "Entered")}>Mark Entered</Button><Button variant="outline" onClick={() => onCr(record, "Verified")}>Mark Verified</Button></div></div>;
  if (tab === "Documents") return <div className="space-y-3">{record.documents.map((doc) => <div key={doc.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3"><span className="text-sm font-medium text-foreground">{doc.name}</span><StatusBadge status={doc.status} variant={doc.status === "Missing" ? "destructive" : "success"} /></div>)}<div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Upload area</div></div>;
  if (tab === "Communications") return <div className="space-y-4"><PanelGrid items={[["Pairing email status", record.pairingEmail], ["Family notes", "Family needs final start confirmation and first-week expectations."], ["RBT notes", "RBT confirmed availability for pairing window."], ["BCBA notes", record.bcbaNotes]]} /><Button variant="outline" onClick={() => onEmail(record)}><Send className="mr-2 h-4 w-4" />Send Pairing Email</Button></div>;
  if (tab === "Tasks") return <div className="space-y-2">{record.tasks.map((task) => <div key={task.id} className="rounded-lg border border-border/60 bg-card p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{task.title}</p><StatusBadge status={task.completed ? "Done" : "Open"} variant={task.completed ? "success" : "warning"} /></div><p className="mt-1 text-xs text-muted-foreground">{task.owner} · due {task.dueDate}</p></div>)}</div>;
  return <div className="space-y-2">{record.timeline.map((event) => <div key={event.id} className="rounded-lg border border-border/60 bg-card p-3"><p className="text-sm font-medium text-foreground">{event.label}</p><p className="mt-1 text-xs text-muted-foreground">{event.at} · {event.owner ?? "System"}</p></div>)}</div>;
}

function PanelGrid({ items }: { items: [string, string][] }) {
  return <div className="grid gap-3 md:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-card p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-sm font-semibold text-foreground">{value}</p></div>)}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border/60 bg-background p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold text-foreground">{value}</p></div>;
}
