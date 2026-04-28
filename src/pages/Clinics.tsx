import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileUp,
  Filter,
  Grid3X3,
  ListChecks,
  MessageSquarePlus,
  PanelRightOpen,
  Plus,
  Search,
  Sparkles,
  Table2,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ClinicMode = "queue" | "table" | "board" | "schedule" | "capacity" | "rooms" | "daily";
type ClientStatus = "Active Clinic Client" | "Pending Clinic Start" | "Pending Start Date" | "Ready to Activate" | "Delayed Start";
type ScheduleStatus = "Not Built" | "Partial" | "Built" | "Conflict" | "Completed";
type StaffingStatus = "Missing RBT" | "Missing BCBA" | "Staffed" | "Backup Needed" | "Over Capacity";
type CrStatus = "Missing" | "Entered";
type Risk = "Low" | "Moderate" | "High" | "Critical";

interface ClinicClient {
  id: string;
  clientName: string;
  linkedClientStatus: string;
  clinic: "Peachtree Corners" | "Riverdale";
  state: "GA";
  clinicDirector: string;
  clinicAdmin: string;
  roomProgram: string;
  programType: string;
  ageGroup: string;
  stage: ClientStatus;
  bcba: string;
  rbt: string;
  backupStaff: string;
  schedule: string;
  scheduleStatus: ScheduleStatus;
  staffingStatus: StaffingStatus;
  authStatus: string;
  qaStatus: string;
  weeklyHours: number;
  scheduledHours: number;
  startDate: string;
  crStatus: CrStatus;
  daysWaiting: number;
  nextAction: string;
  risk: Risk;
  documents: { name: string; present: boolean }[];
  notes: string[];
  tasks: { id: string; title: string; owner: string; due: string; completed: boolean }[];
  timeline: { date: string; event: string }[];
}

interface SessionBlock {
  id: string;
  clientId: string;
  client: string;
  clinic: ClinicClient["clinic"];
  roomProgram: string;
  rbt: string;
  bcba: string;
  time: string;
  day: string;
  status: "Scheduled" | "Conflict" | "Completed" | "Needs Staff";
  notes: string;
}

interface RoomProgram {
  id: string;
  name: string;
  clinic: ClinicClient["clinic"];
  programType: string;
  ageGroup: string;
  capacity: number;
  staff: string[];
  notes: string;
}

const today = new Date("2026-04-28T12:00:00");
const isoDaysAhead = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
const isoDaysAgo = (days: number) => new Date(today.getTime() - days * 86400000).toISOString().slice(0, 10);

const CLINICS = ["Peachtree Corners", "Riverdale"] as const;
const DIRECTORS = ["Mia Hart", "Nora Patel"];
const ADMINS = ["Anje B.", "Lisa W.", "Priya N."];
const BCBAS = ["Dr. Mia Hart", "Elena Ruiz", "Jordan Klein", "Nora Patel", "Caleb Stone", "Avery Brooks"];
const RBTS = ["Sofia Miles", "Noah Grant", "Camila Reed", "Ethan Fox", "Maya Chen", "Liam Price", "Harper Cole", "Jon Bell", "Talia Moss"];

const initialRooms: RoomProgram[] = [
  { id: "pc-early", name: "Early Learners A", clinic: "Peachtree Corners", programType: "Early Intervention", ageGroup: "2-5", capacity: 8, staff: ["Sofia Miles", "Maya Chen"], notes: "Best fit for new-start AM blocks." },
  { id: "pc-school", name: "School Readiness", clinic: "Peachtree Corners", programType: "School Readiness", ageGroup: "4-7", capacity: 7, staff: ["Noah Grant", "Harper Cole"], notes: "Near capacity on Tue/Thu." },
  { id: "pc-social", name: "Social Skills Pod", clinic: "Peachtree Corners", programType: "Social Skills", ageGroup: "6-10", capacity: 6, staff: ["Camila Reed"], notes: "Open PM slots." },
  { id: "rv-early", name: "Early Learners B", clinic: "Riverdale", programType: "Early Intervention", ageGroup: "2-5", capacity: 7, staff: ["Ethan Fox", "Talia Moss"], notes: "Needs BCBA overlap Friday." },
  { id: "rv-school", name: "School Readiness Lab", clinic: "Riverdale", programType: "School Readiness", ageGroup: "4-8", capacity: 6, staff: ["Liam Price"], notes: "Growth opportunity if second RBT assigned." },
  { id: "rv-feeding", name: "Adaptive Skills Suite", clinic: "Riverdale", programType: "Adaptive Skills", ageGroup: "5-12", capacity: 5, staff: ["Jon Bell"], notes: "Watch room conflicts after 2 PM." },
];

const names = ["Ava Thompson", "Liam Carter", "Maya Johnson", "Noah Brooks", "Emma Wilson", "Ethan Davis", "Sophia Martinez", "Lucas Brown", "Olivia Clark", "Mason Lee", "Isabella King", "Jackson Hall", "Amelia Young", "Logan Allen", "Charlotte Scott", "Henry Adams", "Mila Baker", "Owen Nelson"];

const initialClients: ClinicClient[] = names.map((name, index) => {
  const clinic = index % 2 === 0 ? "Peachtree Corners" : "Riverdale";
  const room = initialRooms.filter((r) => r.clinic === clinic)[index % 3];
  const status: ClientStatus[] = ["Active Clinic Client", "Pending Clinic Start", "Ready to Activate", "Delayed Start", "Pending Start Date", "Active Clinic Client"];
  const scheduleStatus: ScheduleStatus[] = ["Built", "Not Built", "Partial", "Conflict", "Built", "Partial"];
  const staffingStatus: StaffingStatus[] = ["Staffed", "Missing RBT", "Staffed", "Missing BCBA", "Backup Needed", "Over Capacity"];
  const weeklyHours = [20, 25, 30, 15, 18, 28][index % 6];
  const scheduledHours = Math.max(0, weeklyHours - [0, 8, 4, 12, 0, 6][index % 6]);
  return {
    id: `clinic-client-${index + 1}`,
    clientName: name,
    linkedClientStatus: status[index % status.length] === "Active Clinic Client" ? "Active Services" : "Clinic Onboarding",
    clinic,
    state: "GA",
    clinicDirector: clinic === "Peachtree Corners" ? DIRECTORS[0] : DIRECTORS[1],
    clinicAdmin: ADMINS[index % ADMINS.length],
    roomProgram: room.name,
    programType: room.programType,
    ageGroup: room.ageGroup,
    stage: status[index % status.length],
    bcba: index % 7 === 3 ? "Unassigned" : BCBAS[index % BCBAS.length],
    rbt: index % 5 === 1 ? "Unassigned" : RBTS[index % RBTS.length],
    backupStaff: RBTS[(index + 2) % RBTS.length],
    schedule: scheduleStatus[index % scheduleStatus.length] === "Not Built" ? "Not scheduled" : ["Mon/Wed/Fri 9-1", "Tue/Thu 12-4", "Mon-Fri 8-11", "Mon/Wed 2-5"][index % 4],
    scheduleStatus: scheduleStatus[index % scheduleStatus.length],
    staffingStatus: index % 5 === 1 ? "Missing RBT" : index % 7 === 3 ? "Missing BCBA" : staffingStatus[index % staffingStatus.length],
    authStatus: index % 4 === 0 ? "Approved" : "Approved - partial hours",
    qaStatus: index % 3 === 0 ? "Complete" : "Awaiting QA Review",
    weeklyHours,
    scheduledHours,
    startDate: index % 4 === 3 ? isoDaysAgo(2) : isoDaysAhead((index % 8) - 1),
    crStatus: index % 4 === 2 ? "Missing" : "Entered",
    daysWaiting: [0, 3, 6, 11, 2, 8][index % 6],
    nextAction: index % 5 === 1 ? "Assign RBT" : scheduleStatus[index % scheduleStatus.length] === "Not Built" ? "Build clinic schedule" : index % 4 === 2 ? "Enter CentralReach" : status[index % status.length] === "Ready to Activate" ? "Move to active" : "Monitor today",
    risk: index % 4 === 3 ? "Critical" : index % 5 === 1 ? "High" : index % 3 === 2 ? "Moderate" : "Low",
    documents: [
      { name: "Case coordination doc", present: index % 5 !== 0 },
      { name: "Consent forms", present: true },
      { name: "Auth approval docs", present: index % 4 !== 1 },
      { name: "Clinic notes", present: true },
    ],
    notes: [`Clinic placement connected to ${clinic}.`],
    tasks: [
      { id: `task-${index}-1`, title: "Confirm clinic schedule", owner: ADMINS[index % ADMINS.length], due: isoDaysAhead(1), completed: scheduleStatus[index % scheduleStatus.length] === "Built" },
      { id: `task-${index}-2`, title: "Validate room/program fit", owner: BCBAS[index % BCBAS.length], due: isoDaysAhead(2), completed: index % 3 === 0 },
    ],
    timeline: [
      { date: isoDaysAgo(12 + index), event: "Clinic assigned" },
      { date: isoDaysAgo(9 + index), event: "Room/program assigned" },
      { date: isoDaysAgo(5), event: "Staffing review updated" },
    ],
  };
});

const initialSessions: SessionBlock[] = initialClients.slice(0, 14).map((client, index) => ({
  id: `session-${index + 1}`,
  clientId: client.id,
  client: client.clientName,
  clinic: client.clinic,
  roomProgram: client.roomProgram,
  rbt: client.rbt,
  bcba: client.bcba,
  time: ["8:00-10:00", "9:00-12:00", "12:00-2:00", "2:00-5:00"][index % 4],
  day: ["Today", "Mon", "Tue", "Wed", "Thu", "Fri"][index % 6],
  status: client.rbt === "Unassigned" ? "Needs Staff" : client.scheduleStatus === "Conflict" ? "Conflict" : index % 5 === 0 ? "Completed" : "Scheduled",
  notes: index % 4 === 0 ? "Parent confirmed drop-off." : "",
}));

const variantFor = (status: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  if (["Active Clinic Client", "Built", "Staffed", "Entered", "Completed", "Low"].includes(status)) return "success";
  if (["Pending Clinic Start", "Pending Start Date", "Partial", "Backup Needed", "Moderate", "Scheduled"].includes(status)) return "warning";
  if (["Delayed Start", "Missing RBT", "Missing BCBA", "Over Capacity", "Missing", "Conflict", "Critical", "Needs Staff"].includes(status)) return "destructive";
  if (["Ready to Activate", "High"].includes(status)) return "info";
  return "muted";
};

export default function Clinics() {
  const [records, setRecords] = useState<ClinicClient[]>(initialClients);
  const [rooms, setRooms] = useState<RoomProgram[]>(initialRooms);
  const [sessions, setSessions] = useState<SessionBlock[]>(initialSessions);
  const [mode, setMode] = useState<ClinicMode>("queue");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState(records[0].id);
  const [panelTab, setPanelTab] = useState("overview");
  const [note, setNote] = useState("");
  const [scheduleView, setScheduleView] = useState("Today");
  const [filters, setFilters] = useState({ clinic: "all", state: "all", director: "all", admin: "all", bcba: "all", rbt: "all", status: "all", room: "all", schedule: "all", staffing: "all", start: "all" });

  const selected = records.find((r) => r.id === selectedId) ?? records[0];
  const roomCounts = useMemo(() => rooms.map((room) => ({ room, assigned: records.filter((r) => r.clinic === room.clinic && r.roomProgram === room.name && r.stage !== "Delayed Start").length })), [records, rooms]);

  const alertsFor = (record: ClinicClient) => {
    const room = roomCounts.find((r) => r.room.name === record.roomProgram && r.room.clinic === record.clinic);
    return [
      record.rbt === "Unassigned" ? "Missing RBT" : "",
      record.bcba === "Unassigned" ? "Missing BCBA" : "",
      record.scheduleStatus === "Not Built" ? "Client ready but not scheduled" : "",
      record.scheduleStatus === "Conflict" ? "Room/program conflict" : "",
      record.stage === "Delayed Start" ? "Start date delayed" : "",
      record.crStatus === "Missing" ? "CentralReach entry missing" : "",
      record.scheduledHours < record.weeklyHours ? "Approved hours not scheduled" : "",
      room && room.assigned > room.room.capacity ? "Clinic over capacity" : "",
      record.staffingStatus === "Over Capacity" ? "Staff over capacity" : "",
    ].filter(Boolean);
  };

  const filtered = records.filter((record) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || [record.clientName, record.clinic, record.roomProgram, record.bcba, record.rbt, record.nextAction].some((v) => v.toLowerCase().includes(q));
    return matchesQuery &&
      (filters.clinic === "all" || record.clinic === filters.clinic) &&
      (filters.state === "all" || record.state === filters.state) &&
      (filters.director === "all" || record.clinicDirector === filters.director) &&
      (filters.admin === "all" || record.clinicAdmin === filters.admin) &&
      (filters.bcba === "all" || record.bcba === filters.bcba) &&
      (filters.rbt === "all" || record.rbt === filters.rbt) &&
      (filters.status === "all" || record.stage === filters.status) &&
      (filters.room === "all" || record.roomProgram === filters.room) &&
      (filters.schedule === "all" || record.scheduleStatus === filters.schedule) &&
      (filters.staffing === "all" || record.staffingStatus === filters.staffing) &&
      (filters.start === "all" || (filters.start === "delayed" ? record.stage === "Delayed Start" : record.startDate >= isoDaysAgo(0)));
  });

  const clinicMetrics = CLINICS.map((clinic) => {
    const clinicRecords = records.filter((r) => r.clinic === clinic);
    const capacity = rooms.filter((r) => r.clinic === clinic).reduce((sum, room) => sum + room.capacity, 0);
    const active = clinicRecords.filter((r) => r.stage === "Active Clinic Client").length;
    const openSlots = Math.max(0, capacity - clinicRecords.filter((r) => r.stage !== "Delayed Start").length);
    const gaps = clinicRecords.filter((r) => r.staffingStatus !== "Staffed").length;
    return { clinic, records: clinicRecords, capacity, active, pending: clinicRecords.filter((r) => r.stage !== "Active Clinic Client").length, openSlots, utilization: Math.round((clinicRecords.length / capacity) * 100), staff: new Set(clinicRecords.flatMap((r) => [r.rbt, r.bcba]).filter((v) => v !== "Unassigned")).size, sessions: sessions.filter((s) => s.clinic === clinic).length, gaps, alerts: clinicRecords.flatMap(alertsFor).length };
  });

  const kpis = [
    { label: "Active Clinic Clients", value: records.filter((r) => r.stage === "Active Clinic Client").length, filter: { status: "Active Clinic Client" } },
    { label: "Pending Starts", value: records.filter((r) => r.stage.includes("Pending")).length, filter: { status: "Pending Clinic Start" } },
    { label: "Open Slots", value: clinicMetrics.reduce((sum, c) => sum + c.openSlots, 0), filter: { status: "all" }, mode: "capacity" as ClinicMode },
    { label: "Capacity Utilization", value: `${Math.round(clinicMetrics.reduce((sum, c) => sum + c.utilization, 0) / clinicMetrics.length)}%`, filter: { status: "all" }, mode: "capacity" as ClinicMode },
    { label: "Staffing Gaps", value: records.filter((r) => r.staffingStatus !== "Staffed").length, filter: { staffing: "Missing RBT" } },
    { label: "Sessions Today", value: sessions.filter((s) => s.day === "Today").length, filter: { status: "all" }, mode: "daily" as ClinicMode },
    { label: "Delayed Starts", value: records.filter((r) => r.stage === "Delayed Start").length, filter: { status: "Delayed Start" } },
    { label: "Ready to Activate", value: records.filter((r) => r.stage === "Ready to Activate").length, filter: { status: "Ready to Activate" } },
  ];

  const patchRecord = (id: string, patch: Partial<ClinicClient>, event?: string) => {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...patch, timeline: event ? [...record.timeline, { date: isoDaysAgo(0), event }] : record.timeline } : record));
  };

  const openRecord = (record: ClinicClient, tab = "overview") => {
    setSelectedId(record.id);
    setPanelTab(tab);
  };

  const addNote = (record: ClinicClient) => {
    const value = note.trim() || "Clinic note added from operations workspace.";
    patchRecord(record.id, { notes: [value, ...record.notes], nextAction: "Review clinic note" }, `Clinic note added: ${value}`);
    setNote("");
    toast.success("Clinic note added");
  };

  const assignRbt = (record: ClinicClient) => {
    const rbt = RBTS.find((candidate) => candidate !== record.rbt) ?? RBTS[0];
    patchRecord(record.id, { rbt, staffingStatus: record.bcba === "Unassigned" ? "Missing BCBA" : "Staffed", nextAction: record.scheduleStatus === "Not Built" ? "Build clinic schedule" : "Monitor readiness" }, `RBT assigned: ${rbt}`);
    toast.success("RBT assigned", { description: rbt });
  };

  const assignRoom = (record: ClinicClient) => {
    const nextRoom = rooms.find((room) => room.clinic === record.clinic && room.name !== record.roomProgram) ?? rooms[0];
    patchRecord(record.id, { roomProgram: nextRoom.name, programType: nextRoom.programType, ageGroup: nextRoom.ageGroup, nextAction: "Validate room capacity" }, `Room/program assigned: ${nextRoom.name}`);
    toast.success("Room/program assigned", { description: nextRoom.name });
  };

  const buildSchedule = (record: ClinicClient) => {
    const block: SessionBlock = { id: `session-${Date.now()}`, clientId: record.id, client: record.clientName, clinic: record.clinic, roomProgram: record.roomProgram, rbt: record.rbt, bcba: record.bcba, time: "9:00-12:00", day: "Today", status: record.rbt === "Unassigned" ? "Needs Staff" : "Scheduled", notes: "Created from clinic operations." };
    setSessions((current) => [block, ...current]);
    patchRecord(record.id, { schedule: "Mon/Wed/Fri 9-12", scheduleStatus: record.rbt === "Unassigned" ? "Partial" : "Built", scheduledHours: record.weeklyHours, nextAction: record.crStatus === "Missing" ? "Enter CentralReach" : "Move to active" }, "Schedule built and session block added");
    toast.success("Schedule built");
  };

  const markCr = (record: ClinicClient) => {
    patchRecord(record.id, { crStatus: "Entered", nextAction: record.stage === "Ready to Activate" ? "Move to active" : "Monitor today" }, "CR entered");
    toast.success("CentralReach marked entered");
  };

  const setStartDate = (record: ClinicClient) => {
    patchRecord(record.id, { startDate: isoDaysAhead(1), stage: "Pending Start Date", nextAction: "Confirm first session" }, "Start date set");
    toast.success("Start date set", { description: isoDaysAhead(1) });
  };

  const moveActive = (record: ClinicClient) => {
    patchRecord(record.id, { stage: "Active Clinic Client", linkedClientStatus: "Active Services", nextAction: "Active clinic services started", tasks: record.tasks.map((task) => ({ ...task, completed: true })) }, "Moved to active clinic client; active services demo status updated");
    toast.success("Moved to Active Clinic Client");
  };

  const createTask = (record: ClinicClient) => {
    const task = { id: `task-${Date.now()}`, title: "Follow up on clinic operations blocker", owner: record.clinicAdmin, due: isoDaysAhead(1), completed: false };
    patchRecord(record.id, { tasks: [task, ...record.tasks], nextAction: task.title }, `Task created: ${task.title}`);
    toast.success("Clinic task created");
  };

  const bulkUpdate = (patch: Partial<ClinicClient>, label: string) => {
    setRecords((current) => current.map((record) => selectedIds.includes(record.id) ? { ...record, ...patch, timeline: [...record.timeline, { date: isoDaysAgo(0), event: label }] } : record));
    toast.success(`${selectedIds.length} clinic records updated`);
  };

  const actions = { openRecord, assignRbt, assignRoom, buildSchedule, markCr, setStartDate, moveActive, addNote, createTask };

  return (
    <PageShell
      title="Clinics"
      description="Manage clinic capacity, schedules, staffing, daily operations, and client readiness."
      icon={Building2}
      actions={<div className="flex flex-wrap items-center gap-2"><Button size="sm"><Plus className="h-4 w-4" />New Clinic Client</Button><Button size="sm" variant="outline" onClick={() => addNote(selected)}><MessageSquarePlus className="h-4 w-4" />Add Clinic Note</Button><Button size="sm" variant="outline" onClick={() => setMode("rooms")}><Grid3X3 className="h-4 w-4" />Manage Rooms</Button><Button size="sm" variant="outline" onClick={() => setMode("capacity")}><PanelRightOpen className="h-4 w-4" />Capacity Planner</Button><Button size="sm" variant="outline" onClick={() => selectedIds.length ? bulkUpdate({ clinicAdmin: "Anje B." }, "Bulk assigned clinic admin") : toast.info("Select records first")}>Bulk Actions</Button><Button size="sm" variant="outline"><Download className="h-4 w-4" />Export</Button><Button size="sm" variant="outline"><Sparkles className="h-4 w-4" />Saved Views</Button></div>}
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {kpis.map((kpi) => <button key={kpi.label} onClick={() => { setMode(kpi.mode ?? "queue"); setFilters((f) => ({ ...f, ...kpi.filter })); }} className="rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"><div className="mb-3 flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div><p className="text-2xl font-semibold text-foreground">{kpi.value}</p><p className="text-xs text-muted-foreground">{kpi.label}</p></button>)}
      </section>

      <section className="rounded-lg border border-border/60 bg-card p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="relative min-w-[300px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client, clinic, room, staff, next action…" className="pl-9" /></div><div className="flex flex-wrap gap-2"><FilterSelect value={filters.clinic} onChange={(v) => setFilters((f) => ({ ...f, clinic: v }))} label="Clinic" items={[...CLINICS]} /><FilterSelect value={filters.state} onChange={(v) => setFilters((f) => ({ ...f, state: v }))} label="State" items={["GA"]} /><FilterSelect value={filters.director} onChange={(v) => setFilters((f) => ({ ...f, director: v }))} label="Director" items={DIRECTORS} /><FilterSelect value={filters.admin} onChange={(v) => setFilters((f) => ({ ...f, admin: v }))} label="Admin" items={ADMINS} /><FilterSelect value={filters.bcba} onChange={(v) => setFilters((f) => ({ ...f, bcba: v }))} label="BCBA" items={["Unassigned", ...BCBAS]} /><FilterSelect value={filters.rbt} onChange={(v) => setFilters((f) => ({ ...f, rbt: v }))} label="RBT" items={["Unassigned", ...RBTS]} /><FilterSelect value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} label="Client Status" items={["Active Clinic Client", "Pending Clinic Start", "Pending Start Date", "Ready to Activate", "Delayed Start"]} /><FilterSelect value={filters.room} onChange={(v) => setFilters((f) => ({ ...f, room: v }))} label="Room / Program" items={rooms.map((r) => r.name)} /><FilterSelect value={filters.schedule} onChange={(v) => setFilters((f) => ({ ...f, schedule: v }))} label="Schedule" items={["Not Built", "Partial", "Built", "Conflict", "Completed"]} /><FilterSelect value={filters.staffing} onChange={(v) => setFilters((f) => ({ ...f, staffing: v }))} label="Staffing" items={["Missing RBT", "Missing BCBA", "Staffed", "Backup Needed", "Over Capacity"]} /><FilterSelect value={filters.start} onChange={(v) => setFilters((f) => ({ ...f, start: v }))} label="Start Date" items={["upcoming", "delayed"]} /></div></div>
        <div className="mt-3 flex flex-wrap gap-2">{[["queue", "Queue View", ListChecks], ["table", "Table View", Table2], ["board", "Clinic Board", Building2], ["schedule", "Schedule Grid", CalendarClock], ["capacity", "Capacity View", PanelRightOpen], ["rooms", "Room / Program View", Grid3X3], ["daily", "Daily Operations", ClipboardList]].map(([key, label, Icon]) => <Button key={key as string} size="sm" variant={mode === key ? "default" : "outline"} onClick={() => setMode(key as ClinicMode)}><Icon className="h-4 w-4" />{label as string}</Button>)}</div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="min-w-0">
          {mode === "queue" && <QueueView records={filtered} alertsFor={alertsFor} actions={actions} />}
          {mode === "table" && <TableView records={filtered} selectedIds={selectedIds} setSelectedIds={setSelectedIds} patchRecord={patchRecord} bulkUpdate={bulkUpdate} actions={actions} />}
          {mode === "board" && <ClinicBoard metrics={clinicMetrics} setClinic={(clinic) => { setFilters((f) => ({ ...f, clinic })); setMode("queue"); }} />}
          {mode === "schedule" && <ScheduleGrid sessions={sessions} setSessions={setSessions} view={scheduleView} setView={setScheduleView} records={records} actions={actions} />}
          {mode === "capacity" && <CapacityView rooms={rooms} records={records} roomCounts={roomCounts} clinicMetrics={clinicMetrics} />}
          {mode === "rooms" && <RoomProgramView rooms={rooms} setRooms={setRooms} roomCounts={roomCounts} records={records} actions={actions} />}
          {mode === "daily" && <DailyOperationsView sessions={sessions} setSessions={setSessions} records={records} actions={actions} />}
        </div>
        <DetailPanel record={selected} rooms={rooms} sessions={sessions.filter((s) => s.clientId === selected.id)} alerts={alertsFor(selected)} panelTab={panelTab} setPanelTab={setPanelTab} note={note} setNote={setNote} actions={actions} />
      </section>
    </PageShell>
  );
}

function FilterSelect({ value, onChange, label, items }: { value: string; onChange: (value: string) => void; label: string; items: string[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder={label} /></SelectTrigger><SelectContent><SelectItem value="all">{label}</SelectItem>{items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>;
}

function AlertPills({ alerts }: { alerts: string[] }) {
  return <div className="flex flex-wrap gap-1.5">{alerts.length ? alerts.slice(0, 3).map((alert) => <span key={alert} className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />{alert}</span>) : <span className="text-xs text-muted-foreground">No blockers</span>}</div>;
}

function QuickActions({ record, actions }: { record: ClinicClient; actions: Actions }) {
  return <div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => actions.openRecord(record)}>Open Client</Button><Button size="sm" variant="outline" onClick={() => actions.assignRbt(record)}>Assign RBT</Button><Button size="sm" variant="outline" onClick={() => actions.buildSchedule(record)}>Build Schedule</Button><Button size="sm" variant="outline" onClick={() => actions.setStartDate(record)}>Set Start Date</Button><Button size="sm" variant="outline" onClick={() => actions.markCr(record)}>Mark CR Entered</Button><Button size="sm" variant="outline" onClick={() => actions.addNote(record)}>Add Note</Button><Button size="sm" variant="outline" onClick={() => actions.assignRoom(record)}>Assign Room</Button><Button size="sm" variant="outline" onClick={() => actions.moveActive(record)}>Move Active</Button></div>;
}

type Actions = { openRecord: (r: ClinicClient, tab?: string) => void; assignRbt: (r: ClinicClient) => void; assignRoom: (r: ClinicClient) => void; buildSchedule: (r: ClinicClient) => void; markCr: (r: ClinicClient) => void; setStartDate: (r: ClinicClient) => void; moveActive: (r: ClinicClient) => void; addNote: (r: ClinicClient) => void; createTask: (r: ClinicClient) => void };

function QueueView({ records, alertsFor, actions }: { records: ClinicClient[]; alertsFor: (r: ClinicClient) => string[]; actions: Actions }) {
  const sections = [
    { title: "Urgent Now", filter: (r: ClinicClient) => alertsFor(r).some((a) => !["Open slot available"].includes(a)) || r.risk === "Critical" },
    { title: "Pending Clinic Starts", filter: (r: ClinicClient) => r.stage === "Pending Clinic Start" || r.stage === "Pending Start Date" },
    { title: "Today’s Clinic Operations", filter: (r: ClinicClient) => r.stage === "Active Clinic Client" },
    { title: "Staffing / Schedule Gaps", filter: (r: ClinicClient) => r.staffingStatus !== "Staffed" || r.scheduleStatus !== "Built" },
    { title: "Open Capacity Opportunities", filter: (r: ClinicClient) => r.stage !== "Active Clinic Client" && r.staffingStatus === "Staffed" },
    { title: "Ready to Activate", filter: (r: ClinicClient) => r.stage === "Ready to Activate" || (r.crStatus === "Entered" && r.scheduleStatus === "Built" && r.staffingStatus === "Staffed") },
  ];
  return <div className="space-y-4">{sections.map((section) => { const rows = records.filter(section.filter); return <div key={section.title} className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div><h3 className="text-sm font-semibold text-foreground">{section.title}</h3><p className="text-xs text-muted-foreground">{rows.length} clinic operations records</p></div><StatusBadge status={String(rows.length)} variant={rows.length ? "info" : "muted"} /></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/50">{["Client", "Clinic", "Room / Program", "BCBA", "RBT", "Schedule", "Start Date", "Status", "Days", "Next Action", "Alert", "Quick Action"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={`${section.title}-${r.id}`} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3"><button onClick={() => actions.openRecord(r)} className="font-medium text-foreground hover:text-primary">{r.clientName}</button><p className="text-xs text-muted-foreground">{r.linkedClientStatus}</p></td><td className="px-3 py-3 text-muted-foreground">{r.clinic}</td><td className="px-3 py-3 text-muted-foreground">{r.roomProgram}</td><td className="px-3 py-3 text-muted-foreground">{r.bcba}</td><td className="px-3 py-3 text-muted-foreground">{r.rbt}</td><td className="px-3 py-3"><StatusBadge status={r.scheduleStatus} variant={variantFor(r.scheduleStatus)} /></td><td className="px-3 py-3 text-muted-foreground">{r.startDate}</td><td className="px-3 py-3"><StatusBadge status={r.stage} variant={variantFor(r.stage)} /></td><td className="px-3 py-3 text-muted-foreground">{r.daysWaiting}d</td><td className="px-3 py-3 text-muted-foreground">{r.nextAction}</td><td className="px-3 py-3"><AlertPills alerts={alertsFor(r)} /></td><td className="px-3 py-3"><QuickActions record={r} actions={actions} /></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No records in this queue.</p>}</div>; })}</div>;
}

function TableView({ records, selectedIds, setSelectedIds, patchRecord, bulkUpdate, actions }: { records: ClinicClient[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; patchRecord: (id: string, patch: Partial<ClinicClient>, event?: string) => void; bulkUpdate: (patch: Partial<ClinicClient>, label: string) => void; actions: Actions }) {
  const sorted = [...records].sort((a, b) => b.daysWaiting - a.daysWaiting);
  const toggle = (id: string, checked: boolean) => setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((item) => item !== id));
  return <div className="rounded-lg border border-border/60 bg-card"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 p-3"><div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium text-foreground">Clinic client table</span></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => bulkUpdate({ roomProgram: "School Readiness" }, "Bulk assigned room/program")}>Bulk room</Button><Button size="sm" variant="outline" onClick={() => bulkUpdate({ clinicAdmin: "Lisa W." }, "Bulk assigned clinic admin")}>Bulk admin</Button><Button size="sm" variant="outline" onClick={() => bulkUpdate({ scheduleStatus: "Built" }, "Bulk updated schedule status")}>Bulk schedule</Button></div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/50"><th className="px-3 py-2"><Checkbox checked={selectedIds.length === records.length && records.length > 0} onCheckedChange={(v) => setSelectedIds(v ? records.map((r) => r.id) : [])} /></th>{["Client", "Clinic", "Room / Program", "Current Stage", "BCBA", "RBT", "Schedule", "Staffing", "Auth", "QA", "Weekly Hours", "Start Date", "CR", "Days", "Next Action", "Alerts"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{sorted.map((r) => <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3"><Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={(v) => toggle(r.id, Boolean(v))} /></td><td className="px-3 py-3"><button onClick={() => actions.openRecord(r)} className="font-medium text-foreground hover:text-primary">{r.clientName}</button></td><td className="px-3 py-3"><Select value={r.clinic} onValueChange={(v) => patchRecord(r.id, { clinic: v as ClinicClient["clinic"] }, `Clinic changed to ${v}`)}><SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger><SelectContent>{CLINICS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></td><td className="px-3 py-3"><Input className="h-8 w-[170px]" value={r.roomProgram} onChange={(e) => patchRecord(r.id, { roomProgram: e.target.value }, "Room/program edited")} /></td><td className="px-3 py-3"><StatusBadge status={r.stage} variant={variantFor(r.stage)} /></td><td className="px-3 py-3"><Input className="h-8 w-[150px]" value={r.bcba} onChange={(e) => patchRecord(r.id, { bcba: e.target.value }, "BCBA edited")} /></td><td className="px-3 py-3"><Input className="h-8 w-[140px]" value={r.rbt} onChange={(e) => patchRecord(r.id, { rbt: e.target.value }, "RBT edited")} /></td><td className="px-3 py-3"><StatusBadge status={r.scheduleStatus} variant={variantFor(r.scheduleStatus)} /></td><td className="px-3 py-3"><StatusBadge status={r.staffingStatus} variant={variantFor(r.staffingStatus)} /></td><td className="px-3 py-3 text-muted-foreground">{r.authStatus}</td><td className="px-3 py-3 text-muted-foreground">{r.qaStatus}</td><td className="px-3 py-3 text-muted-foreground">{r.scheduledHours}/{r.weeklyHours}</td><td className="px-3 py-3"><Input className="h-8 w-[130px]" value={r.startDate} onChange={(e) => patchRecord(r.id, { startDate: e.target.value }, "Start date edited")} /></td><td className="px-3 py-3"><StatusBadge status={r.crStatus} variant={variantFor(r.crStatus)} /></td><td className="px-3 py-3 text-muted-foreground">{r.daysWaiting}</td><td className="px-3 py-3"><Input className="h-8 w-[180px]" value={r.nextAction} onChange={(e) => patchRecord(r.id, { nextAction: e.target.value }, "Clinic note/next action edited")} /></td><td className="px-3 py-3 text-muted-foreground">{r.risk}</td></tr>)}</tbody></table></div></div>;
}

function ClinicBoard({ metrics, setClinic }: { metrics: ReturnType<typeof Clinics> extends never ? never : { clinic: string; active: number; pending: number; openSlots: number; utilization: number; staff: number; sessions: number; gaps: number; alerts: number }[]; setClinic: (clinic: string) => void }) {
  return <div className="grid gap-4 xl:grid-cols-2">{metrics.map((clinic) => <button key={clinic.clinic} onClick={() => setClinic(clinic.clinic)} className="rounded-lg border border-border/60 bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"><div className="flex items-start justify-between"><div><h3 className="text-lg font-semibold text-foreground">{clinic.clinic}</h3><p className="text-xs text-muted-foreground">Location operations board</p></div><StatusBadge status={`${clinic.utilization}% utilized`} variant={clinic.utilization > 100 ? "destructive" : clinic.utilization > 85 ? "warning" : "success"} /></div><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[["Active", clinic.active], ["Pending", clinic.pending], ["Open slots", clinic.openSlots], ["Staff", clinic.staff], ["Sessions today", clinic.sessions], ["Staffing gaps", clinic.gaps], ["Alerts", clinic.alerts], ["Utilization", `${clinic.utilization}%`]].map(([label, value]) => <div key={label} className="rounded-md border border-border/50 bg-muted/20 p-3"><p className="text-lg font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div></button>)}</div>;
}

function ScheduleGrid({ sessions, setSessions, view, setView, records, actions }: { sessions: SessionBlock[]; setSessions: React.Dispatch<React.SetStateAction<SessionBlock[]>>; view: string; setView: (v: string) => void; records: ClinicClient[]; actions: Actions }) {
  const addSession = () => { const record = records[0]; setSessions((current) => [{ id: `session-${Date.now()}`, clientId: record.id, client: record.clientName, clinic: record.clinic, roomProgram: record.roomProgram, rbt: record.rbt, bcba: record.bcba, time: "3:00-5:00", day: "Today", status: "Scheduled", notes: "Manual block" }, ...current]); toast.success("Session block added"); };
  const updateSession = (id: string, patch: Partial<SessionBlock>) => setSessions((current) => current.map((session) => session.id === id ? { ...session, ...patch } : session));
  return <div className="rounded-lg border border-border/60 bg-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-3"><Tabs value={view} onValueChange={setView}><TabsList>{["Today", "Week", "By Room", "By Program", "By RBT", "By BCBA"].map((v) => <TabsTrigger key={v} value={v}>{v}</TabsTrigger>)}</TabsList></Tabs><Button size="sm" onClick={addSession}><Plus className="h-4 w-4" />Add session block</Button></div><div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">{sessions.map((session) => <div key={session.id} className="rounded-lg border border-border/60 bg-muted/20 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-medium text-foreground">{session.client}</p><p className="text-xs text-muted-foreground">{session.time} · {session.roomProgram}</p></div><StatusBadge status={session.status} variant={variantFor(session.status)} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>RBT: {session.rbt}</span><span>BCBA: {session.bcba}</span><span>{session.clinic}</span><span>{session.day}</span></div><div className="mt-3 flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => updateSession(session.id, { time: "10:00-1:00", notes: "Edited session time" })}>Edit</Button><Button size="sm" variant="outline" onClick={() => updateSession(session.id, { day: "Thu", notes: "Moved session" })}>Move</Button><Button size="sm" variant="outline" onClick={() => updateSession(session.id, { status: "Conflict" })}>Flag conflict</Button><Button size="sm" variant="outline" onClick={() => updateSession(session.id, { status: "Completed" })}>Complete</Button><Button size="sm" variant="outline" onClick={() => { const record = records.find((r) => r.id === session.clientId); if (record) actions.openRecord(record, "schedule"); }}>Open</Button></div></div>)}</div></div>;
}

function CapacityView({ rooms, records, roomCounts, clinicMetrics }: { rooms: RoomProgram[]; records: ClinicClient[]; roomCounts: { room: RoomProgram; assigned: number }[]; clinicMetrics: { clinic: string; utilization: number; openSlots: number; active: number; pending: number; capacity: number }[] }) {
  return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2">{clinicMetrics.map((clinic) => <div key={clinic.clinic} className="rounded-lg border border-border/60 bg-card p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-foreground">{clinic.clinic}</h3><StatusBadge status={`${clinic.utilization}%`} variant={clinic.utilization > 100 ? "destructive" : clinic.utilization > 85 ? "warning" : clinic.openSlots > 3 ? "info" : "success"} /></div><div className="mt-3 grid grid-cols-4 gap-2 text-xs"><Info label="Capacity" value={String(clinic.capacity)} /><Info label="Active" value={String(clinic.active)} /><Info label="Pending" value={String(clinic.pending)} /><Info label="Open slots" value={String(clinic.openSlots)} /></div></div>)}</div><div className="rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 p-3"><h3 className="text-sm font-semibold text-foreground">Capacity by room, program, day, and time block</h3></div><div className="grid gap-3 p-4 xl:grid-cols-2">{rooms.map((room) => { const count = roomCounts.find((c) => c.room.id === room.id)?.assigned ?? 0; const util = Math.round((count / room.capacity) * 100); const staffedHours = room.staff.length * 25; const scheduledHours = records.filter((r) => r.roomProgram === room.name).reduce((sum, r) => sum + r.scheduledHours, 0); return <div key={room.id} className="rounded-lg border border-border/50 p-3"><div className="flex items-center justify-between"><div><p className="font-medium text-foreground">{room.name}</p><p className="text-xs text-muted-foreground">{room.clinic} · {room.programType} · Today AM/PM</p></div><StatusBadge status={util > 100 ? "Over capacity" : util > 85 ? "Near capacity" : count < room.capacity - 2 ? "Growth opportunity" : "Available"} variant={util > 100 ? "destructive" : util > 85 ? "warning" : count < room.capacity - 2 ? "info" : "success"} /></div><div className="mt-3 grid grid-cols-4 gap-2 text-xs"><Info label="Total" value={String(room.capacity)} /><Info label="Active" value={String(count)} /><Info label="Open" value={String(Math.max(0, room.capacity - count))} /><Info label="Util" value={`${util}%`} /><Info label="Staffed hrs" value={String(staffedHours)} /><Info label="Sched hrs" value={String(scheduledHours)} /><Info label="Gap" value={String(staffedHours - scheduledHours)} /><Info label="Day" value="Tue" /></div></div>; })}</div></div></div>;
}

function RoomProgramView({ rooms, setRooms, roomCounts, records, actions }: { rooms: RoomProgram[]; setRooms: React.Dispatch<React.SetStateAction<RoomProgram[]>>; roomCounts: { room: RoomProgram; assigned: number }[]; records: ClinicClient[]; actions: Actions }) {
  return <div className="rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 p-3"><h3 className="text-sm font-semibold text-foreground">Room / Program workspace</h3></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/50">{["Room / Program", "Clinic", "Capacity", "Assigned Clients", "Assigned Staff", "Open Slots", "Conflicts", "Notes", "Action"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rooms.map((room) => { const assigned = roomCounts.find((c) => c.room.id === room.id)?.assigned ?? 0; const conflicts = records.filter((r) => r.roomProgram === room.name && r.scheduleStatus === "Conflict").length; return <tr key={room.id} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3"><p className="font-medium text-foreground">{room.name}</p><p className="text-xs text-muted-foreground">{room.programType} · {room.ageGroup}</p></td><td className="px-3 py-3 text-muted-foreground">{room.clinic}</td><td className="px-3 py-3"><Input className="h-8 w-20" value={room.capacity} onChange={(e) => setRooms((current) => current.map((r) => r.id === room.id ? { ...r, capacity: Number(e.target.value) || r.capacity } : r))} /></td><td className="px-3 py-3 text-muted-foreground">{assigned}</td><td className="px-3 py-3 text-muted-foreground">{room.staff.join(", ")}</td><td className="px-3 py-3"><StatusBadge status={String(Math.max(0, room.capacity - assigned))} variant={room.capacity - assigned > 2 ? "info" : room.capacity - assigned < 0 ? "destructive" : "success"} /></td><td className="px-3 py-3"><StatusBadge status={String(conflicts)} variant={conflicts ? "destructive" : "success"} /></td><td className="px-3 py-3"><Input className="h-8 w-[220px]" value={room.notes} onChange={(e) => setRooms((current) => current.map((r) => r.id === room.id ? { ...r, notes: e.target.value } : r))} /></td><td className="px-3 py-3"><Button size="sm" variant="outline" onClick={() => { const record = records.find((r) => r.roomProgram === room.name); if (record) actions.openRecord(record, "placement"); }}>Open clients</Button></td></tr>; })}</tbody></table></div></div>;
}

function DailyOperationsView({ sessions, setSessions, records, actions }: { sessions: SessionBlock[]; setSessions: React.Dispatch<React.SetStateAction<SessionBlock[]>>; records: ClinicClient[]; actions: Actions }) {
  const update = (id: string, patch: Partial<SessionBlock>) => setSessions((current) => current.map((s) => s.id === id ? { ...s, ...patch } : s));
  const sections = ["Today’s Sessions", "Staff On Site", "New Starts Today", "Parent / Team Communications", "Issues / Incidents", "Open Tasks"];
  return <div className="space-y-4">{sections.map((section) => <div key={section} className="rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><h3 className="text-sm font-semibold text-foreground">{section}</h3><StatusBadge status={section === "Issues / Incidents" ? "2" : String(sessions.length)} variant={section === "Issues / Incidents" ? "warning" : "info"} /></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/50">{["Time", "Client", "Staff", "Room/program", "Status", "Notes", "Action"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{sessions.slice(0, 8).map((session) => <tr key={`${section}-${session.id}`} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3 text-muted-foreground">{session.time}</td><td className="px-3 py-3"><button className="font-medium text-foreground hover:text-primary" onClick={() => { const record = records.find((r) => r.id === session.clientId); if (record) actions.openRecord(record); }}>{session.client}</button></td><td className="px-3 py-3 text-muted-foreground">{session.rbt}</td><td className="px-3 py-3 text-muted-foreground">{session.roomProgram}</td><td className="px-3 py-3"><StatusBadge status={session.status} variant={variantFor(session.status)} /></td><td className="px-3 py-3"><Input className="h-8 w-[200px]" value={session.notes} onChange={(e) => update(session.id, { notes: e.target.value })} /></td><td className="px-3 py-3"><div className="flex gap-1.5"><Button size="sm" variant="outline" onClick={() => update(session.id, { status: "Completed" })}>Complete</Button><Button size="sm" variant="outline" onClick={() => update(session.id, { status: "Conflict" })}>Issue</Button></div></td></tr>)}</tbody></table></div></div>)}</div>;
}

function DetailPanel({ record, rooms, sessions, alerts, panelTab, setPanelTab, note, setNote, actions }: { record: ClinicClient; rooms: RoomProgram[]; sessions: SessionBlock[]; alerts: string[]; panelTab: string; setPanelTab: (v: string) => void; note: string; setNote: (v: string) => void; actions: Actions }) {
  const room = rooms.find((r) => r.name === record.roomProgram);
  return <aside className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-hidden rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-foreground">{record.clientName}</h2><p className="text-xs text-muted-foreground">{record.clinic} · {record.roomProgram} · {record.stage}</p><p className="mt-1 text-xs text-muted-foreground">BCBA {record.bcba} · RBT {record.rbt} · Start {record.startDate}</p></div><StatusBadge status={record.risk} variant={variantFor(record.risk)} /></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => toast.success("Client record opened")}>Open Client</Button><Button size="sm" variant="outline" onClick={() => actions.assignRoom(record)}>Assign Room</Button><Button size="sm" variant="outline" onClick={() => actions.assignRbt(record)}>Assign RBT</Button><Button size="sm" variant="outline" onClick={() => actions.buildSchedule(record)}>Build Schedule</Button><Button size="sm" variant="outline" onClick={() => actions.setStartDate(record)}>Set Start Date</Button><Button size="sm" variant="outline" onClick={() => actions.addNote(record)}>Add Note</Button><Button size="sm" variant="outline" onClick={() => actions.createTask(record)}>Create Task</Button><Button size="sm" variant="outline" onClick={() => toast.success("Upload area opened")}><FileUp className="h-4 w-4" />Upload</Button></div></div><Tabs value={panelTab} onValueChange={setPanelTab} className="flex h-[calc(100vh-25rem)] flex-col"><div className="overflow-x-auto border-b border-border/60 px-3 py-2"><TabsList className="h-auto w-max justify-start">{[["overview", "Overview"], ["placement", "Clinic Placement"], ["schedule", "Schedule"], ["staffing", "Staffing"], ["capacity", "Capacity"], ["documents", "Documents"], ["communications", "Communications"], ["tasks", "Tasks"], ["timeline", "Timeline"]].map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}</TabsList></div><div className="flex-1 overflow-y-auto p-4"><TabsContent value="overview" className="mt-0 space-y-3"><Info label="Current clinic status" value={record.stage} /><Info label="Clinic" value={record.clinic} /><Info label="Room/program" value={record.roomProgram} /><Info label="Assigned staff" value={`${record.bcba} / ${record.rbt}`} /><Info label="Weekly hours" value={`${record.scheduledHours}/${record.weeklyHours}`} /><Info label="Start date" value={record.startDate} /><Info label="Blockers" value={alerts.join(", ") || "None"} /><Info label="Next action" value={record.nextAction} /><Info label="Days waiting" value={`${record.daysWaiting} days`} /></TabsContent><TabsContent value="placement" className="mt-0 space-y-3"><Info label="Clinic assigned" value={record.clinic} /><Info label="Room/program assigned" value={record.roomProgram} /><Info label="Placement notes" value={room?.notes ?? "No room note"} /><Info label="Capacity status" value={alerts.includes("Clinic over capacity") ? "Over capacity" : "Within capacity"} /><Info label="Program fit" value={`${record.programType} · age ${record.ageGroup}`} /><Button size="sm" onClick={() => actions.assignRoom(record)}>Move clinic/program</Button></TabsContent><TabsContent value="schedule" className="mt-0 space-y-3"><Info label="Weekly schedule" value={record.schedule} /><Info label="Approved vs scheduled hours" value={`${record.weeklyHours} approved · ${record.scheduledHours} scheduled`} /><Info label="CR entry status" value={record.crStatus} /><Info label="Conflicts" value={record.scheduleStatus === "Conflict" ? "Open conflict" : "None"} />{sessions.map((s) => <Info key={s.id} label={s.time} value={`${s.roomProgram} · ${s.status}`} />)}<Button size="sm" onClick={() => actions.buildSchedule(record)}>Build schedule</Button></TabsContent><TabsContent value="staffing" className="mt-0 space-y-3"><Info label="Assigned RBT" value={record.rbt} /><Info label="Assigned BCBA" value={record.bcba} /><Info label="Backup staff" value={record.backupStaff} /><Info label="RBT readiness" value={record.rbt === "Unassigned" ? "Missing" : "Ready"} /><Info label="Staff capacity" value={record.staffingStatus} /><Info label="Staffing notes" value={alerts.includes("Staff over capacity") ? "Staff capacity alert" : "Coverage looks workable"} /><Button size="sm" onClick={() => actions.assignRbt(record)}>Assign RBT</Button></TabsContent><TabsContent value="capacity" className="mt-0 space-y-3"><Info label="Clinic utilization" value={record.clinic} /><Info label="Room/program utilization" value={record.roomProgram} /><Info label="Open slots" value={room ? String(Math.max(0, room.capacity - 1)) : "—"} /><Info label="Capacity warnings" value={alerts.filter((a) => a.includes("capacity") || a.includes("slot")).join(", ") || "None"} /><Info label="Growth opportunity notes" value="Open slots are available when staff coverage is confirmed." /></TabsContent><TabsContent value="documents" className="mt-0 space-y-2">{record.documents.map((doc) => <div key={doc.name} className="flex items-center justify-between rounded-md border border-border/50 p-3"><span className="text-sm text-foreground">{doc.name}</span><StatusBadge status={doc.present ? "Present" : "Missing"} variant={doc.present ? "success" : "destructive"} /></div>)}<Button size="sm" variant="outline">Upload area</Button></TabsContent><TabsContent value="communications" className="mt-0 space-y-3"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add parent, staff, or internal clinic update…" /> <Button size="sm" onClick={() => actions.addNote(record)}>Add communication</Button>{record.notes.map((item, index) => <p key={`${item}-${index}`} className="rounded-md bg-muted/30 p-2 text-sm text-muted-foreground">{item}</p>)}</TabsContent><TabsContent value="tasks" className="mt-0 space-y-2">{record.tasks.map((task) => <div key={task.id} className="rounded-md border border-border/50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{task.title}</p><StatusBadge status={task.completed ? "Done" : "Open"} variant={task.completed ? "success" : "warning"} /></div><p className="text-xs text-muted-foreground">{task.owner} · {task.due}</p></div>)}</TabsContent><TabsContent value="timeline" className="mt-0 space-y-3">{record.timeline.map((event, index) => <div key={`${event.date}-${event.event}-${index}`} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-primary" /><div><p className="text-sm text-foreground">{event.event}</p><p className="text-xs text-muted-foreground">{event.date}</p></div></div>)}</TabsContent></div></Tabs></aside>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-border/50 bg-muted/20 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>;
}
