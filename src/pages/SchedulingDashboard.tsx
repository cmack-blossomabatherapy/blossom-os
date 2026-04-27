import { useMemo, useState } from "react";
import {
  AlertCircle, AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock, Download, Eye,
  FileCheck2, FileText, Mail, RefreshCw, Search, Send, UserCheck, Users, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

type StateCode = "GA" | "NC" | "TN" | "VA" | "MD";
type ScheduleStatus = "Pending Schedule" | "Schedule In Progress" | "Schedule Created" | "Pending Start Date" | "Ready to Activate" | "Active" | "Delayed";
type CrStatus = "Missing" | "Entered" | "Verified";
type DocStatus = "Missing" | "Generated" | "Sent" | "Verified";
type Health = "green" | "yellow" | "red";
type QueueKey = "urgent" | "today" | "blockers";
type KpiFilter = "all" | "needs" | "created" | "pending-start" | "this-week" | "delayed" | "missing-cr" | "hours-gap" | "avg-start";
type CalendarView = "Week" | "Month" | "By Scheduler" | "By RBT" | "By Clinic";

type Task = { id: string; title: string; owner: string; dueDate: string; completed: boolean };
type Document = { id: string; name: string; type: string; status: DocStatus; updatedAt: string };
type Event = { id: string; title: string; text: string; timestamp: string; user: string };
type ScheduleBlock = { id: string; day: string; start: string; end: string; hours: number; location: string; conflict?: boolean };

type SchedulingRecord = {
  id: string;
  client: string;
  parent: string;
  state: StateCode;
  clinic: string;
  location: "Clinic" | "Home" | "Hybrid";
  bcba: string;
  rbt: string;
  scheduler: string;
  status: ScheduleStatus;
  approvedHours: number;
  scheduledHours: number;
  startDate: string | null;
  rbtAssignedAt: string;
  daysWaiting: number;
  centralReachStatus: CrStatus;
  crEnteredDate: string | null;
  crVerifiedBy: string | null;
  crNotes: string;
  pairingEmail: DocStatus;
  caseCoordinationDoc: DocStatus;
  nextAction: string;
  clientAvailability: string[];
  rbtAvailability: string[];
  bcbaAvailability: string[];
  schedule: ScheduleBlock[];
  tasks: Task[];
  documents: Document[];
  communications: Event[];
  timeline: Event[];
};

const ALL = "All";
const today = new Date("2026-04-27T12:00:00Z");
const states: StateCode[] = ["GA", "NC", "TN", "VA", "MD"];
const stages: ScheduleStatus[] = ["Pending Schedule", "Schedule In Progress", "Schedule Created", "Pending Start Date", "Ready to Activate", "Active", "Delayed"];
const schedulers = ["Nina Patel", "Jordan Miles", "Avery Brooks", "Sam Rivera", "Taylor Quinn"];

const shortDate = (date?: string | null) => date ? new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const pct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const daysUntil = (date?: string | null) => date ? Math.ceil((new Date(`${date}T12:00:00Z`).getTime() - today.getTime()) / 86400000) : null;
const isThisWeek = (date?: string | null) => { const days = daysUntil(date); return days !== null && days >= 0 && days <= 6; };
const statusVariant = (status: ScheduleStatus) => status === "Active" || status === "Ready to Activate" ? "success" : status === "Delayed" ? "destructive" : status === "Pending Start Date" || status === "Schedule In Progress" ? "warning" : "info";

function makeRecord(base: Omit<SchedulingRecord, "tasks" | "documents" | "communications" | "timeline">): SchedulingRecord {
  const gap = Math.max(0, base.approvedHours - base.scheduledHours);
  return {
    ...base,
    tasks: [
      { id: `${base.id}-t1`, title: base.nextAction, owner: base.scheduler, dueDate: "2026-04-28", completed: false },
      { id: `${base.id}-t2`, title: "Confirm BCBA/RBT linked", owner: base.scheduler, dueDate: "2026-04-29", completed: base.status !== "Pending Schedule" },
      { id: `${base.id}-t3`, title: "Review approved vs scheduled hours", owner: base.bcba, dueDate: "2026-04-30", completed: gap === 0 },
    ],
    documents: [
      { id: `${base.id}-d1`, name: "Case Coordination Document", type: "Activation", status: base.caseCoordinationDoc, updatedAt: base.caseCoordinationDoc === "Generated" ? "2026-04-26" : "2026-04-22" },
      { id: `${base.id}-d2`, name: "Schedule Summary", type: "Scheduling", status: base.schedule.length ? "Generated" : "Missing", updatedAt: "2026-04-25" },
    ],
    communications: [
      { id: `${base.id}-c1`, title: "Family availability", text: `Family confirmed ${base.clientAvailability.join(", ")}`, timestamp: "2026-04-23T10:00:00Z", user: base.scheduler },
      { id: `${base.id}-c2`, title: "Pairing email", text: base.pairingEmail === "Sent" ? "Pairing email sent to family, BCBA, and RBT." : "Pairing email still pending.", timestamp: "2026-04-25T15:30:00Z", user: base.scheduler },
    ],
    timeline: [
      { id: `${base.id}-e1`, title: "RBT assigned", text: `${base.rbt} assigned to ${base.client}`, timestamp: `${base.rbtAssignedAt}T09:00:00Z`, user: "Staffing" },
      ...(base.schedule.length ? [{ id: `${base.id}-e2`, title: "Schedule started", text: `${base.schedule.length} weekly blocks drafted`, timestamp: "2026-04-24T12:00:00Z", user: base.scheduler }] : []),
      ...(base.scheduledHours ? [{ id: `${base.id}-e3`, title: "Schedule finalized", text: `${base.scheduledHours}/${base.approvedHours} approved hours scheduled`, timestamp: "2026-04-25T16:00:00Z", user: base.scheduler }] : []),
      ...(base.centralReachStatus !== "Missing" ? [{ id: `${base.id}-e4`, title: "CR entered", text: base.crNotes, timestamp: `${base.crEnteredDate ?? "2026-04-26"}T11:00:00Z`, user: base.crVerifiedBy ?? base.scheduler }] : []),
      ...(base.pairingEmail === "Sent" ? [{ id: `${base.id}-e5`, title: "Pairing email sent", text: "Activation email sent to family and care team", timestamp: "2026-04-26T14:00:00Z", user: base.scheduler }] : []),
      ...(base.startDate ? [{ id: `${base.id}-e6`, title: "Start date set", text: `Start date set for ${shortDate(base.startDate)}`, timestamp: "2026-04-26T16:30:00Z", user: base.scheduler }] : []),
      ...(base.status === "Active" ? [{ id: `${base.id}-e7`, title: "Activated", text: "Client moved into active services", timestamp: "2026-04-27T09:00:00Z", user: "System" }] : []),
    ],
  };
}

const block = (day: string, start: string, end: string, hours: number, location: string, conflict = false): ScheduleBlock => ({ id: `${day}-${start}-${location}`, day, start, end, hours, location, conflict });

const schedulingSeed: SchedulingRecord[] = [
  makeRecord({ id: "SCH-4101", client: "Emma Thompson", parent: "Janelle Thompson", state: "GA", clinic: "Peachtree Corners", location: "Clinic", bcba: "Dr. Kim", rbt: "Taylor S.", scheduler: "Nina Patel", status: "Ready to Activate", approvedHours: 25, scheduledHours: 25, startDate: "2026-04-28", rbtAssignedAt: "2026-04-20", daysWaiting: 7, centralReachStatus: "Verified", crEnteredDate: "2026-04-25", crVerifiedBy: "Nina Patel", crNotes: "Weekly schedule verified in CentralReach.", pairingEmail: "Sent", caseCoordinationDoc: "Generated", nextAction: "Monitor first service day", clientAvailability: ["Mon/Wed/Fri AM"], rbtAvailability: ["Mon/Wed/Fri AM"], bcbaAvailability: ["Wed 11a"], schedule: [block("Mon", "09:00", "14:00", 5, "Clinic"), block("Wed", "09:00", "14:00", 5, "Clinic"), block("Fri", "09:00", "14:00", 5, "Clinic"), block("Tue", "10:00", "15:00", 5, "Clinic"), block("Thu", "10:00", "15:00", 5, "Clinic")] }),
  makeRecord({ id: "SCH-4102", client: "Mason Lee", parent: "Angela Lee", state: "NC", clinic: "Charlotte Midtown", location: "Home", bcba: "Dr. Patel", rbt: "Riley Brooks", scheduler: "Jordan Miles", status: "Pending Schedule", approvedHours: 20, scheduledHours: 0, startDate: null, rbtAssignedAt: "2026-04-25", daysWaiting: 2, centralReachStatus: "Missing", crEnteredDate: null, crVerifiedBy: null, crNotes: "Cannot enter CR until schedule exists.", pairingEmail: "Missing", caseCoordinationDoc: "Missing", nextAction: "Build schedule from family and RBT availability", clientAvailability: ["Tue/Thu PM", "Sat AM"], rbtAvailability: ["Tue/Thu PM"], bcbaAvailability: ["Thu 3p"], schedule: [] }),
  makeRecord({ id: "SCH-4103", client: "Ava Brooks", parent: "Michael Brooks", state: "TN", clinic: "Nashville East", location: "Hybrid", bcba: "Dr. Lee", rbt: "Morgan K.", scheduler: "Avery Brooks", status: "Schedule In Progress", approvedHours: 30, scheduledHours: 18, startDate: null, rbtAssignedAt: "2026-04-24", daysWaiting: 3, centralReachStatus: "Missing", crEnteredDate: null, crVerifiedBy: null, crNotes: "Draft blocks not ready for CR entry.", pairingEmail: "Missing", caseCoordinationDoc: "Generated", nextAction: "Confirm RBT availability for two additional blocks", clientAvailability: ["M-F after 12p"], rbtAvailability: ["Mon/Wed/Fri PM"], bcbaAvailability: ["Tue 1p"], schedule: [block("Mon", "12:00", "18:00", 6, "Home"), block("Wed", "12:00", "18:00", 6, "Home"), block("Fri", "12:00", "18:00", 6, "Clinic")] }),
  makeRecord({ id: "SCH-4104", client: "Noah Rivera", parent: "Camila Rivera", state: "VA", clinic: "Richmond West", location: "Clinic", bcba: "Dr. Stone", rbt: "Casey P.", scheduler: "Sam Rivera", status: "Delayed", approvedHours: 15, scheduledHours: 15, startDate: "2026-04-22", rbtAssignedAt: "2026-04-18", daysWaiting: 9, centralReachStatus: "Entered", crEnteredDate: "2026-04-21", crVerifiedBy: null, crNotes: "Entered but not supervisor verified.", pairingEmail: "Sent", caseCoordinationDoc: "Generated", nextAction: "Resolve delayed start and verify CR", clientAvailability: ["Mon-Fri AM"], rbtAvailability: ["Mon/Wed/Fri AM"], bcbaAvailability: ["Mon 10a"], schedule: [block("Mon", "08:00", "11:00", 3, "Clinic"), block("Wed", "08:00", "11:00", 3, "Clinic"), block("Fri", "08:00", "11:00", 3, "Clinic"), block("Tue", "09:00", "12:00", 3, "Clinic"), block("Thu", "09:00", "12:00", 3, "Clinic")] }),
  makeRecord({ id: "SCH-4105", client: "Sophia Grant", parent: "Erin Grant", state: "MD", clinic: "Bethesda North", location: "Home", bcba: "Dr. Kim", rbt: "Jamie N.", scheduler: "Taylor Quinn", status: "Schedule Created", approvedHours: 25, scheduledHours: 18, startDate: "2026-05-01", rbtAssignedAt: "2026-04-22", daysWaiting: 5, centralReachStatus: "Missing", crEnteredDate: null, crVerifiedBy: null, crNotes: "CR entry pending final hours adjustment.", pairingEmail: "Missing", caseCoordinationDoc: "Generated", nextAction: "Fill 7-hour gap and enter CentralReach", clientAvailability: ["Mon-Thu PM"], rbtAvailability: ["Mon/Wed PM", "Thu PM"], bcbaAvailability: ["Wed 4p"], schedule: [block("Mon", "13:00", "19:00", 6, "Home"), block("Wed", "13:00", "19:00", 6, "Home"), block("Thu", "14:00", "20:00", 6, "Home")] }),
  makeRecord({ id: "SCH-4106", client: "Liam Carter", parent: "Paige Carter", state: "GA", clinic: "Riverdale", location: "Home", bcba: "Dr. Lee", rbt: "Quinn D.", scheduler: "Nina Patel", status: "Pending Start Date", approvedHours: 20, scheduledHours: 20, startDate: null, rbtAssignedAt: "2026-04-21", daysWaiting: 6, centralReachStatus: "Entered", crEnteredDate: "2026-04-26", crVerifiedBy: "Nina Patel", crNotes: "Schedule entered; start date field pending.", pairingEmail: "Sent", caseCoordinationDoc: "Generated", nextAction: "Set start date with family", clientAvailability: ["Tue/Thu AM"], rbtAvailability: ["Tue/Thu AM"], bcbaAvailability: ["Thu 9a"], schedule: [block("Tue", "08:00", "13:00", 5, "Home"), block("Thu", "08:00", "13:00", 5, "Home"), block("Mon", "09:00", "14:00", 5, "Home"), block("Wed", "09:00", "14:00", 5, "Home")] }),
  makeRecord({ id: "SCH-4107", client: "Olivia Singh", parent: "Ravi Singh", state: "NC", clinic: "Raleigh Cary", location: "Clinic", bcba: "Dr. Patel", rbt: "Devon H.", scheduler: "Jordan Miles", status: "Active", approvedHours: 28, scheduledHours: 28, startDate: "2026-04-27", rbtAssignedAt: "2026-04-15", daysWaiting: 12, centralReachStatus: "Verified", crEnteredDate: "2026-04-24", crVerifiedBy: "Jordan Miles", crNotes: "Active schedule verified.", pairingEmail: "Sent", caseCoordinationDoc: "Verified", nextAction: "No scheduling action needed", clientAvailability: ["M-F school-day"], rbtAvailability: ["M-F school-day"], bcbaAvailability: ["Tue 11a"], schedule: [block("Mon", "09:00", "15:00", 6, "Clinic"), block("Tue", "09:00", "14:00", 5, "Clinic"), block("Wed", "09:00", "15:00", 6, "Clinic"), block("Thu", "09:00", "14:00", 5, "Clinic"), block("Fri", "09:00", "15:00", 6, "Clinic")] }),
  makeRecord({ id: "SCH-4108", client: "Ethan Moore", parent: "Laura Moore", state: "TN", clinic: "Memphis Central", location: "Clinic", bcba: "Dr. Hayes", rbt: "Parker J.", scheduler: "Avery Brooks", status: "Pending Schedule", approvedHours: 10, scheduledHours: 0, startDate: null, rbtAssignedAt: "2026-04-23", daysWaiting: 4, centralReachStatus: "Missing", crEnteredDate: null, crVerifiedBy: null, crNotes: "Schedule not created.", pairingEmail: "Missing", caseCoordinationDoc: "Missing", nextAction: "Confirm family availability and build first schedule", clientAvailability: ["Unknown"], rbtAvailability: ["Mon/Fri AM"], bcbaAvailability: ["Fri 10a"], schedule: [] }),
  makeRecord({ id: "SCH-4109", client: "Mia Johnson", parent: "Terrell Johnson", state: "VA", clinic: "Norfolk Harbor", location: "Home", bcba: "Dr. Stone", rbt: "Alex M.", scheduler: "Sam Rivera", status: "Schedule Created", approvedHours: 22, scheduledHours: 22, startDate: "2026-05-04", rbtAssignedAt: "2026-04-20", daysWaiting: 7, centralReachStatus: "Entered", crEnteredDate: "2026-04-26", crVerifiedBy: null, crNotes: "Awaiting verification before activation.", pairingEmail: "Missing", caseCoordinationDoc: "Generated", nextAction: "Send pairing email and verify CR", clientAvailability: ["Mon/Wed/Fri PM"], rbtAvailability: ["Mon/Wed/Fri PM"], bcbaAvailability: ["Mon 2p"], schedule: [block("Mon", "14:00", "18:00", 4, "Home"), block("Wed", "14:00", "18:00", 4, "Home"), block("Fri", "13:00", "18:00", 5, "Home"), block("Tue", "15:00", "19:30", 4.5, "Home"), block("Thu", "15:00", "19:30", 4.5, "Home")] }),
  makeRecord({ id: "SCH-4110", client: "Jackson Reed", parent: "Nora Reed", state: "MD", clinic: "Baltimore Harbor", location: "Hybrid", bcba: "Dr. Kim", rbt: "Chris L.", scheduler: "Taylor Quinn", status: "Ready to Activate", approvedHours: 18, scheduledHours: 18, startDate: "2026-04-30", rbtAssignedAt: "2026-04-19", daysWaiting: 8, centralReachStatus: "Verified", crEnteredDate: "2026-04-26", crVerifiedBy: "Taylor Quinn", crNotes: "Hybrid location schedule verified.", pairingEmail: "Sent", caseCoordinationDoc: "Generated", nextAction: "Confirm first-day arrival plan", clientAvailability: ["Tue/Thu/Sat"], rbtAvailability: ["Tue/Thu/Sat"], bcbaAvailability: ["Thu 1p"], schedule: [block("Tue", "10:00", "16:00", 6, "Clinic"), block("Thu", "10:00", "16:00", 6, "Home"), block("Sat", "09:00", "15:00", 6, "Home")] }),
  makeRecord({ id: "SCH-4111", client: "Isabella Wilson", parent: "Carla Wilson", state: "GA", clinic: "Peachtree Corners", location: "Clinic", bcba: "Dr. Lee", rbt: "Taylor S.", scheduler: "Nina Patel", status: "Schedule In Progress", approvedHours: 30, scheduledHours: 24, startDate: "2026-05-02", rbtAssignedAt: "2026-04-23", daysWaiting: 4, centralReachStatus: "Missing", crEnteredDate: null, crVerifiedBy: null, crNotes: "Conflict warning must be cleared before CR entry.", pairingEmail: "Missing", caseCoordinationDoc: "Generated", nextAction: "Resolve RBT availability conflict", clientAvailability: ["M-F AM"], rbtAvailability: ["Mon/Wed/Fri AM"], bcbaAvailability: ["Wed 12p"], schedule: [block("Mon", "09:00", "15:00", 6, "Clinic", true), block("Tue", "09:00", "15:00", 6, "Clinic"), block("Wed", "09:00", "15:00", 6, "Clinic", true), block("Fri", "09:00", "15:00", 6, "Clinic", true)] }),
  makeRecord({ id: "SCH-4112", client: "Lucas Martin", parent: "Henry Martin", state: "NC", clinic: "Charlotte Midtown", location: "Home", bcba: "Dr. Patel", rbt: "Riley Brooks", scheduler: "Jordan Miles", status: "Delayed", approvedHours: 16, scheduledHours: 10, startDate: "2026-04-24", rbtAssignedAt: "2026-04-18", daysWaiting: 9, centralReachStatus: "Missing", crEnteredDate: null, crVerifiedBy: null, crNotes: "Start date passed without CR entry.", pairingEmail: "Missing", caseCoordinationDoc: "Missing", nextAction: "Escalate delayed start and complete activation packet", clientAvailability: ["Tue/Thu PM"], rbtAvailability: ["Tue PM only"], bcbaAvailability: ["Thu 2p"], schedule: [block("Tue", "14:00", "19:00", 5, "Home"), block("Thu", "14:00", "19:00", 5, "Home", true)] }),
  makeRecord({ id: "SCH-4113", client: "Harper Allen", parent: "Monica Allen", state: "TN", clinic: "Nashville East", location: "Home", bcba: "Dr. Hayes", rbt: "Morgan K.", scheduler: "Avery Brooks", status: "Pending Start Date", approvedHours: 24, scheduledHours: 24, startDate: null, rbtAssignedAt: "2026-04-22", daysWaiting: 5, centralReachStatus: "Verified", crEnteredDate: "2026-04-26", crVerifiedBy: "Avery Brooks", crNotes: "Schedule entered and verified; start date pending family call.", pairingEmail: "Sent", caseCoordinationDoc: "Generated", nextAction: "Call family to choose first service day", clientAvailability: ["Mon/Wed/Fri PM"], rbtAvailability: ["Mon/Wed/Fri PM"], bcbaAvailability: ["Fri 1p"], schedule: [block("Mon", "12:00", "20:00", 8, "Home"), block("Wed", "12:00", "20:00", 8, "Home"), block("Fri", "12:00", "20:00", 8, "Home")] }),
  makeRecord({ id: "SCH-4114", client: "Benjamin Hall", parent: "Tara Hall", state: "VA", clinic: "Richmond West", location: "Clinic", bcba: "Dr. Stone", rbt: "Casey P.", scheduler: "Sam Rivera", status: "Schedule Created", approvedHours: 12, scheduledHours: 12, startDate: "2026-05-03", rbtAssignedAt: "2026-04-26", daysWaiting: 1, centralReachStatus: "Missing", crEnteredDate: null, crVerifiedBy: null, crNotes: "Newly finalized schedule awaiting CR entry.", pairingEmail: "Sent", caseCoordinationDoc: "Generated", nextAction: "Mark CentralReach entered", clientAvailability: ["Weekend AM"], rbtAvailability: ["Sat/Sun AM"], bcbaAvailability: ["Sun 10a"], schedule: [block("Sat", "08:00", "14:00", 6, "Clinic"), block("Sun", "08:00", "14:00", 6, "Clinic")] }),
];

function HealthDot({ health }: { health: Health }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full", health === "green" && "bg-success", health === "yellow" && "bg-warning", health === "red" && "bg-destructive")} />;
}

function alertsFor(record: SchedulingRecord) {
  const alerts: { label: string; severity: "red" | "yellow" }[] = [];
  if (record.status === "Pending Schedule" && record.daysWaiting >= 1) alerts.push({ label: "RBT assigned, no schedule", severity: record.daysWaiting > 2 ? "red" : "yellow" });
  if (record.scheduledHours > 0 && !record.startDate) alerts.push({ label: "No start date", severity: "red" });
  if ((daysUntil(record.startDate) ?? 1) < 0 && record.status !== "Active") alerts.push({ label: "Start date passed", severity: "red" });
  if (record.centralReachStatus === "Missing") alerts.push({ label: "CR not entered", severity: "red" });
  if (record.scheduledHours < record.approvedHours) alerts.push({ label: "Hours gap", severity: "yellow" });
  if (record.schedule.some((block) => block.conflict)) alerts.push({ label: "RBT availability conflict", severity: "red" });
  if (record.pairingEmail !== "Sent") alerts.push({ label: "Pairing email missing", severity: "yellow" });
  if (record.caseCoordinationDoc === "Missing") alerts.push({ label: "Case coordination doc missing", severity: "yellow" });
  if (record.status === "Delayed") alerts.push({ label: "Client ready but delayed", severity: "red" });
  return alerts;
}

export default function SchedulingDashboard() {
  const [records, setRecords] = useState<SchedulingRecord[]>(schedulingSeed);
  const [dateRange, setDateRange] = useState("This Week");
  const [stateFilter, setStateFilter] = useState(ALL);
  const [clinicFilter, setClinicFilter] = useState(ALL);
  const [schedulerFilter, setSchedulerFilter] = useState(ALL);
  const [bcbaFilter, setBcbaFilter] = useState(ALL);
  const [rbtFilter, setRbtFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [startRange, setStartRange] = useState(ALL);
  const [query, setQuery] = useState("");
  const [activeKpi, setActiveKpi] = useState<KpiFilter>("all");
  const [queue, setQueue] = useState<QueueKey>("urgent");
  const [calendarView, setCalendarView] = useState<CalendarView>("Week");
  const [selected, setSelected] = useState<SchedulingRecord | null>(null);

  const clinics = useMemo(() => [ALL, ...Array.from(new Set(records.map((r) => r.clinic))).sort()], [records]);
  const bcbas = useMemo(() => [ALL, ...Array.from(new Set(records.map((r) => r.bcba))).sort()], [records]);
  const rbts = useMemo(() => [ALL, ...Array.from(new Set(records.map((r) => r.rbt))).sort()], [records]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return records
      .filter((r) => stateFilter === ALL || r.state === stateFilter)
      .filter((r) => clinicFilter === ALL || r.clinic === clinicFilter)
      .filter((r) => schedulerFilter === ALL || r.scheduler === schedulerFilter)
      .filter((r) => bcbaFilter === ALL || r.bcba === bcbaFilter)
      .filter((r) => rbtFilter === ALL || r.rbt === rbtFilter)
      .filter((r) => statusFilter === ALL || r.status === statusFilter)
      .filter((r) => startRange === ALL || (startRange === "Missing" ? !r.startDate : startRange === "This Week" ? isThisWeek(r.startDate) : (daysUntil(r.startDate) ?? 999) <= 30))
      .filter((r) => dateRange !== "This Week" || r.status !== "Active" || isThisWeek(r.startDate))
      .filter((r) => {
        if (activeKpi === "needs") return r.status === "Pending Schedule" || r.status === "Schedule In Progress";
        if (activeKpi === "created") return r.scheduledHours > 0;
        if (activeKpi === "pending-start") return !r.startDate && r.scheduledHours > 0;
        if (activeKpi === "this-week") return isThisWeek(r.startDate);
        if (activeKpi === "delayed") return r.status === "Delayed" || ((daysUntil(r.startDate) ?? 1) < 0 && r.status !== "Active");
        if (activeKpi === "missing-cr") return r.centralReachStatus === "Missing";
        if (activeKpi === "hours-gap") return r.scheduledHours < r.approvedHours;
        return true;
      })
      .filter((r) => !q || [r.client, r.parent, r.state, r.clinic, r.bcba, r.rbt, r.scheduler, r.status, r.nextAction].some((field) => field.toLowerCase().includes(q)));
  }, [activeKpi, bcbaFilter, clinicFilter, dateRange, query, rbtFilter, records, schedulerFilter, startRange, stateFilter, statusFilter]);

  const totalApproved = filtered.reduce((sum, r) => sum + r.approvedHours, 0);
  const totalScheduled = filtered.reduce((sum, r) => sum + r.scheduledHours, 0);
  const avgStart = avg(filtered.map((r) => r.daysWaiting));
  const kpis = [
    { key: "needs" as KpiFilter, label: "Needs Scheduling", value: filtered.filter((r) => r.status === "Pending Schedule" || r.status === "Schedule In Progress").length, subtext: "RBT assigned but schedule unfinished", health: filtered.some((r) => r.status === "Pending Schedule" && r.daysWaiting > 2) ? "red" : "yellow" as Health },
    { key: "created" as KpiFilter, label: "Schedule Created", value: filtered.filter((r) => r.scheduledHours > 0).length, subtext: "Drafted or finalized schedules", health: "green" as Health },
    { key: "pending-start" as KpiFilter, label: "Pending Start Date", value: filtered.filter((r) => !r.startDate && r.scheduledHours > 0).length, subtext: "Schedule done, start missing", health: filtered.some((r) => !r.startDate && r.scheduledHours > 0) ? "red" : "green" as Health },
    { key: "this-week" as KpiFilter, label: "Starting This Week", value: filtered.filter((r) => isThisWeek(r.startDate)).length, subtext: "Next 7 days of activations", health: "green" as Health },
    { key: "delayed" as KpiFilter, label: "Delayed Starts", value: filtered.filter((r) => r.status === "Delayed" || ((daysUntil(r.startDate) ?? 1) < 0 && r.status !== "Active")).length, subtext: "Past start or activation blocked", health: filtered.some((r) => r.status === "Delayed") ? "red" : "green" as Health },
    { key: "missing-cr" as KpiFilter, label: "Missing CentralReach Entry", value: filtered.filter((r) => r.centralReachStatus === "Missing").length, subtext: "Schedule not entered in CR", health: filtered.some((r) => r.centralReachStatus === "Missing") ? "red" : "green" as Health },
    { key: "hours-gap" as KpiFilter, label: "Approved vs Scheduled Hours Gap", value: totalApproved - totalScheduled, subtext: `${totalScheduled}/${totalApproved} weekly hours scheduled`, health: totalScheduled >= totalApproved ? "green" : totalApproved - totalScheduled > 20 ? "red" : "yellow" as Health },
    { key: "avg-start" as KpiFilter, label: "Avg Time to Start", value: `${avgStart}d`, subtext: "RBT assigned to activation", health: avgStart <= 5 ? "green" : avgStart <= 8 ? "yellow" : "red" as Health },
  ];

  const actionRows = useMemo(() => ({
    urgent: filtered.filter((r) => r.status === "Pending Schedule" || !r.startDate || r.centralReachStatus === "Missing" || r.schedule.some((s) => s.conflict) || ((daysUntil(r.startDate) ?? 1) < 0 && r.status !== "Active")),
    today: filtered.filter((r) => r.nextAction.toLowerCase().includes("confirm") || r.nextAction.toLowerCase().includes("send") || r.nextAction.toLowerCase().includes("generate") || r.pairingEmail !== "Sent" || r.caseCoordinationDoc === "Missing"),
    blockers: filtered.filter((r) => r.scheduledHours === 0 || !r.startDate || r.centralReachStatus === "Missing" || r.scheduledHours < r.approvedHours),
  }), [filtered]);

  const readiness = stages.map((stage) => {
    const rows = filtered.filter((r) => r.status === stage);
    const oldest = rows.length ? Math.max(...rows.map((r) => r.daysWaiting)) : 0;
    return { stage, count: rows.length, oldest, avgDays: avg(rows.map((r) => r.daysWaiting)), health: stage === "Delayed" && rows.length ? "red" : oldest > 5 ? "yellow" : "green" as Health };
  });

  const upcoming = filtered.filter((r) => r.startDate).sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "")).slice(0, 8);
  const coverageRows = [ALL, ...states].map((group) => {
    const rows = group === ALL ? filtered : filtered.filter((r) => r.state === group);
    const approved = rows.reduce((sum, r) => sum + r.approvedHours, 0);
    const scheduled = rows.reduce((sum, r) => sum + r.scheduledHours, 0);
    return { group: group === ALL ? "All States" : group, approved, scheduled, gap: approved - scheduled, coverage: pct(scheduled, approved) };
  }).filter((row) => row.approved > 0);
  const clinicCoverage = clinics.filter((c) => c !== ALL).map((clinic) => coverageSummary(clinic, filtered.filter((r) => r.clinic === clinic)));
  const rbtCoverage = rbts.filter((rbt) => rbt !== ALL).slice(0, 8).map((rbt) => coverageSummary(rbt, filtered.filter((r) => r.rbt === rbt)));
  const clientCoverage = filtered.slice(0, 8).map((r) => ({ group: r.client, approved: r.approvedHours, scheduled: r.scheduledHours, gap: r.approvedHours - r.scheduledHours, coverage: pct(r.scheduledHours, r.approvedHours) }));
  const schedulerRows = schedulers.map((scheduler) => {
    const rows = filtered.filter((r) => r.scheduler === scheduler);
    return { scheduler, pending: rows.filter((r) => r.status === "Pending Schedule" || r.status === "Schedule In Progress").length, created: rows.filter((r) => r.scheduledHours > 0).length, starts: rows.filter((r) => isThisWeek(r.startDate)).length, delayed: rows.filter((r) => r.status === "Delayed").length, avgTime: avg(rows.map((r) => r.daysWaiting)), missingCr: rows.filter((r) => r.centralReachStatus === "Missing").length, openTasks: rows.reduce((sum, r) => sum + r.tasks.filter((t) => !t.completed).length, 0) };
  }).filter((row) => Object.values(row).some((value) => typeof value === "number" && value > 0));

  const updateRecord = (id: string, patch: Partial<SchedulingRecord>, message: string) => {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...patch, timeline: [{ id: `${id}-${Date.now()}`, title: message, text: "Updated from Scheduling Dashboard", timestamp: today.toISOString(), user: "Dashboard user" }, ...record.timeline] } : record));
    toast.success(message);
  };
  const quickAction = (record: SchedulingRecord, action: string) => {
    if (action === "Open Schedule") setSelected(record);
    if (action === "Build Schedule") updateRecord(record.id, { status: "Schedule In Progress", scheduledHours: Math.max(record.scheduledHours, Math.min(record.approvedHours, 10)), schedule: record.schedule.length ? record.schedule : [block("Mon", "09:00", "13:00", 4, record.location)] }, "Schedule draft started");
    if (action === "Set Start Date") updateRecord(record.id, { startDate: "2026-05-04", status: record.centralReachStatus === "Missing" ? "Schedule Created" : "Ready to Activate" }, "Start date set");
    if (action === "Mark CR Entered") updateRecord(record.id, { centralReachStatus: "Entered", crEnteredDate: "2026-04-27", crNotes: "Entered from Scheduling Dashboard" }, "CentralReach marked entered");
    if (action === "Send Pairing Email") updateRecord(record.id, { pairingEmail: "Sent" }, "Pairing email sent");
    if (action === "Generate Case Coordination Doc") updateRecord(record.id, { caseCoordinationDoc: "Generated" }, "Case coordination document generated");
  };
  const exportRows = () => {
    const csv = ["Client,State,Clinic,BCBA,RBT,Status,Approved Hours,Scheduled Hours,Start Date,CR Status,Next Action", ...filtered.map((r) => [r.client, r.state, r.clinic, r.bcba, r.rbt, r.status, r.approvedHours, r.scheduledHours, r.startDate ?? "", r.centralReachStatus, r.nextAction].map((v) => `"${v}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "scheduling-dashboard.csv"; link.click(); URL.revokeObjectURL(url);
    toast.success("Scheduling export downloaded");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Scheduling Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Weekly schedules, start dates, CentralReach readiness, and activation blockers.</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={exportRows}><Download className="mr-2 h-4 w-4" />Export</Button><Button size="sm" onClick={() => { setActiveKpi("all"); setStatusFilter(ALL); toast.success("Scheduling dashboard refreshed"); }}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
        </div>
        <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[0.9fr_0.7fr_1fr_1fr_1fr_1fr_1.1fr_1fr_1.5fr]">
            <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "All Time"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={stateFilter} onValueChange={setStateFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[ALL, ...states].map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All States" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={clinicFilter} onValueChange={setClinicFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{clinics.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Clinics" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={schedulerFilter} onValueChange={setSchedulerFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[ALL, ...schedulers].map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Schedulers" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={bcbaFilter} onValueChange={setBcbaFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{bcbas.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All BCBAs" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={rbtFilter} onValueChange={setRbtFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{rbts.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All RBTs" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[ALL, ...stages].map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Scheduling Statuses" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={startRange} onValueChange={setStartRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[ALL, "This Week", "Next 30 Days", "Missing"].map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Start Dates" : item}</SelectItem>)}</SelectContent></Select>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients, staff, clinics..." className="pl-9" /></div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">{kpis.map((kpi) => <button key={kpi.key} onClick={() => setActiveKpi(activeKpi === kpi.key ? "all" : kpi.key)} className={cn("rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", activeKpi === kpi.key ? "border-primary/50 ring-2 ring-primary/15" : "border-border/60")}><div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{kpi.label}</span><HealthDot health={kpi.health} /></div><div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</div><p className="mt-1 text-xs text-muted-foreground">{kpi.subtext}</p></button>)}</section>

      <section className="grid gap-5 2xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-xl border border-border/60 bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4"><div><h2 className="text-base font-semibold text-foreground">Scheduling Action Queue</h2><p className="text-xs text-muted-foreground">Execution-ready priorities for activation work.</p></div><div className="flex rounded-lg bg-muted p-1">{([{ key: "urgent", label: "Urgent Now" }, { key: "today", label: "Follow-Up Today" }, { key: "blockers", label: "Activation Blockers" }] as const).map((item) => <button key={item.key} onClick={() => setQueue(item.key)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", queue === item.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Client", "State / Clinic", "BCBA", "RBT", "Weekly Hours", "Start", "Scheduler", "Days", "Next Action", "Quick Action"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{actionRows[queue].slice(0, 8).map((record) => <tr key={record.id} className="border-t border-border/50 hover:bg-muted/25"><td className="px-4 py-3"><button onClick={() => setSelected(record)} className="text-left"><span className="block font-medium text-foreground">{record.client}</span><span className="text-xs text-muted-foreground">{record.parent}</span></button></td><td className="px-4 py-3"><StatusBadge status={`${record.state} · ${record.clinic}`} variant="muted" /></td><td className="px-4 py-3 text-xs text-muted-foreground">{record.bcba}</td><td className="px-4 py-3 text-xs text-muted-foreground">{record.rbt}</td><td className="px-4 py-3 text-xs font-medium text-foreground">{record.scheduledHours}/{record.approvedHours}</td><td className="px-4 py-3 text-xs text-muted-foreground">{shortDate(record.startDate)}</td><td className="px-4 py-3 text-xs text-muted-foreground">{record.scheduler}</td><td className="px-4 py-3 text-xs font-medium text-foreground">{record.daysWaiting}d</td><td className="max-w-[240px] truncate px-4 py-3 text-xs text-muted-foreground">{record.nextAction}</td><td className="px-4 py-3"><Button variant="outline" size="sm" onClick={() => quickAction(record, record.scheduledHours === 0 ? "Build Schedule" : !record.startDate ? "Set Start Date" : record.centralReachStatus === "Missing" ? "Mark CR Entered" : "Open Schedule")}>{record.scheduledHours === 0 ? <CalendarDays className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}{record.scheduledHours === 0 ? "Build" : !record.startDate ? "Set Start" : record.centralReachStatus === "Missing" ? "CR Entered" : "Open"}</Button></td></tr>)}</tbody></table></div></div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Weekly Activation Snapshot</h2><p className="text-xs text-muted-foreground">Upcoming starts and activation readiness.</p></div><Zap className="h-4 w-4 text-primary" /></div><div className="grid grid-cols-2 gap-3">{[{ label: "Starting this week", value: filtered.filter((r) => isThisWeek(r.startDate)).length, icon: CalendarDays }, { label: "Delayed starts", value: filtered.filter((r) => r.status === "Delayed").length, icon: AlertTriangle }, { label: "Ready to activate", value: filtered.filter((r) => r.status === "Ready to Activate").length, icon: CheckCircle2 }, { label: "Missing start dates", value: filtered.filter((r) => !r.startDate).length, icon: Clock }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-lg border border-border/60 bg-background p-3"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div><div className="mt-4 space-y-2"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Upcoming starts</p>{upcoming.slice(0, 5).map((r) => <button key={r.id} onClick={() => setSelected(r)} className="w-full rounded-lg border border-border/60 bg-background p-3 text-left hover:bg-muted/30"><div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground">{r.client}</span><StatusBadge status={shortDate(r.startDate)} variant={r.status === "Delayed" ? "destructive" : "info"} /></div><p className="mt-1 text-xs text-muted-foreground">{r.rbt} · {r.clinic} · {r.scheduledHours}h</p></button>)}</div></div>
      </section>

      <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-foreground">Scheduling Readiness Board</h2><span className="text-xs text-muted-foreground">Oldest and average wait by stage</span></div><div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">{readiness.map((item) => <button key={item.stage} onClick={() => setStatusFilter(item.stage)} className="rounded-xl border border-border/60 bg-card p-3 text-left shadow-sm hover:shadow-md"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-foreground">{item.stage}</span><HealthDot health={item.health} /></div><div className="mt-2 text-xl font-semibold text-foreground">{item.count}</div><div className="mt-2 space-y-1 text-[11px] text-muted-foreground"><p>Oldest {item.oldest}d</p><p>Avg {item.avgDays}d</p></div></button>)}</div></section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><CalendarPanel records={filtered} view={calendarView} onViewChange={setCalendarView} onSelect={setSelected} /><CoveragePanel stateRows={coverageRows} clinicRows={clinicCoverage} rbtRows={rbtCoverage} clientRows={clientCoverage} /></section>

      <section className="rounded-xl border border-border/60 bg-card shadow-sm"><div className="border-b border-border/60 p-4"><h2 className="text-base font-semibold text-foreground">Scheduler Performance</h2><p className="text-xs text-muted-foreground">Workload, starts, delays, CR readiness, and open task load by scheduler.</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Scheduler", "Pending Schedule", "Schedules Created", "Starts This Week", "Delayed", "Avg RBT→Schedule", "Missing CR", "Open Tasks"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{schedulerRows.map((row) => <tr key={row.scheduler} className="border-t border-border/50"><td className="px-4 py-3 font-medium text-foreground">{row.scheduler}</td><td className="px-4 py-3">{row.pending}</td><td className="px-4 py-3">{row.created}</td><td className="px-4 py-3">{row.starts}</td><td className={cn("px-4 py-3 font-medium", row.delayed ? "text-destructive" : "text-muted-foreground")}>{row.delayed}</td><td className="px-4 py-3">{row.avgTime}d</td><td className={cn("px-4 py-3 font-medium", row.missingCr ? "text-destructive" : "text-muted-foreground")}>{row.missingCr}</td><td className="px-4 py-3">{row.openTasks}</td></tr>)}</tbody></table></div></section>

      <section className="rounded-xl border border-border/60 bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4"><div><h2 className="text-base font-semibold text-foreground">Scheduling Worklist</h2><p className="text-xs text-muted-foreground">{filtered.length} scheduling records match the current filters.</p></div>{activeKpi !== "all" && <Button variant="outline" size="sm" onClick={() => setActiveKpi("all")}>Clear KPI filter</Button>}</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Client", "State", "Clinic", "BCBA", "RBT", "Scheduling Status", "Approved", "Scheduled", "Start Date", "CentralReach", "Pairing", "Case Coord", "Days", "Next Action", "Alerts"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{filtered.map((record) => { const alerts = alertsFor(record); return <tr key={record.id} onClick={() => setSelected(record)} className="cursor-pointer border-t border-border/50 hover:bg-muted/25"><td className="px-4 py-3"><span className="block font-medium text-foreground">{record.client}</span><span className="text-xs text-muted-foreground">{record.id}</span></td><td className="px-4 py-3"><StatusBadge status={record.state} variant="muted" /></td><td className="px-4 py-3 text-xs text-muted-foreground">{record.clinic}</td><td className="px-4 py-3 text-xs text-muted-foreground">{record.bcba}</td><td className="px-4 py-3 text-xs text-muted-foreground">{record.rbt}</td><td className="px-4 py-3"><StatusBadge status={record.status} variant={statusVariant(record.status)} /></td><td className="px-4 py-3 text-xs font-medium text-foreground">{record.approvedHours}</td><td className="px-4 py-3 text-xs font-medium text-foreground">{record.scheduledHours}</td><td className="px-4 py-3 text-xs text-muted-foreground">{shortDate(record.startDate)}</td><td className="px-4 py-3"><StatusBadge status={record.centralReachStatus} variant={record.centralReachStatus === "Missing" ? "destructive" : record.centralReachStatus === "Verified" ? "success" : "warning"} /></td><td className="px-4 py-3"><StatusBadge status={record.pairingEmail} variant={record.pairingEmail === "Sent" ? "success" : "warning"} /></td><td className="px-4 py-3"><StatusBadge status={record.caseCoordinationDoc} variant={record.caseCoordinationDoc === "Missing" ? "destructive" : "success"} /></td><td className="px-4 py-3 text-xs font-medium text-foreground">{record.daysWaiting}d</td><td className="max-w-[240px] truncate px-4 py-3 text-xs text-muted-foreground">{record.nextAction}</td><td className="px-4 py-3">{alerts.length ? <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><AlertCircle className="h-3.5 w-3.5" />{alerts.length}</span> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}</td></tr>; })}</tbody></table></div></section>

      <SchedulingDetailSheet record={selected ? records.find((record) => record.id === selected.id) ?? selected : null} open={!!selected} onClose={() => setSelected(null)} onAction={quickAction} />
    </div>
  );
}

function coverageSummary(group: string, rows: SchedulingRecord[]) {
  const approved = rows.reduce((sum, r) => sum + r.approvedHours, 0);
  const scheduled = rows.reduce((sum, r) => sum + r.scheduledHours, 0);
  return { group, approved, scheduled, gap: approved - scheduled, coverage: pct(scheduled, approved) };
}

function CalendarPanel({ records, view, onViewChange, onSelect }: { records: SchedulingRecord[]; view: CalendarView; onViewChange: (view: CalendarView) => void; onSelect: (record: SchedulingRecord) => void }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const groups = view === "By Scheduler" ? Array.from(new Set(records.map((r) => r.scheduler))) : view === "By RBT" ? Array.from(new Set(records.map((r) => r.rbt))) : view === "By Clinic" ? Array.from(new Set(records.map((r) => r.clinic))) : days;
  return <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-foreground">Calendar / Weekly Grid</h2><p className="text-xs text-muted-foreground">Upcoming starts and recurring weekly service blocks.</p></div><div className="flex rounded-lg bg-muted p-1">{(["Week", "Month", "By Scheduler", "By RBT", "By Clinic"] as CalendarView[]).map((item) => <button key={item} onClick={() => onViewChange(item)} className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium", view === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div></div><div className="grid gap-2 xl:grid-cols-7">{groups.slice(0, 7).map((group) => { const rows = records.filter((r) => view === "By Scheduler" ? r.scheduler === group : view === "By RBT" ? r.rbt === group : view === "By Clinic" ? r.clinic === group : r.schedule.some((s) => s.day === group) || (view === "Month" && r.startDate)); return <div key={group} className="min-h-[210px] rounded-lg border border-border/60 bg-background p-2"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-foreground">{group}</span><span className="text-[11px] text-muted-foreground">{rows.length}</span></div><div className="space-y-2">{rows.slice(0, 5).map((record) => { const dayBlocks = view === "Week" ? record.schedule.filter((s) => s.day === group) : record.schedule.slice(0, 1); const label = dayBlocks[0] ? `${dayBlocks[0].start}-${dayBlocks[0].end}` : `Start ${shortDate(record.startDate)}`; return <button key={`${group}-${record.id}`} onClick={() => onSelect(record)} className={cn("w-full rounded-md border p-2 text-left text-[11px] transition-colors hover:bg-muted/30", record.schedule.some((s) => s.conflict) ? "border-destructive/40 bg-destructive/5" : "border-primary/20 bg-primary/5")}><p className="truncate font-medium text-foreground">{record.client}</p><p className="text-muted-foreground">{label}</p><p className="text-muted-foreground">{record.rbt} · {record.bcba}</p><p className="text-muted-foreground">{record.scheduledHours}h · {record.location}</p></button>; })}</div></div>; })}</div></div>;
}

function CoveragePanel({ stateRows, clinicRows, rbtRows, clientRows }: { stateRows: ReturnType<typeof coverageSummary>[]; clinicRows: ReturnType<typeof coverageSummary>[]; rbtRows: ReturnType<typeof coverageSummary>[]; clientRows: ReturnType<typeof coverageSummary>[] }) {
  const [tab, setTab] = useState("State");
  const rows = tab === "State" ? stateRows : tab === "Clinic" ? clinicRows : tab === "RBT" ? rbtRows : clientRows;
  return <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Hours Coverage</h2><p className="text-xs text-muted-foreground">Approved hours vs scheduled execution capacity.</p></div><Users className="h-4 w-4 text-primary" /></div><div className="mb-4 flex rounded-lg bg-muted p-1">{["State", "Clinic", "RBT", "Client"].map((item) => <button key={item} onClick={() => setTab(item)} className={cn("flex-1 rounded-md px-3 py-1.5 text-xs font-medium", tab === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div><div className="space-y-3">{rows.slice(0, 8).map((row) => <div key={row.group} className="rounded-lg border border-border/60 bg-background p-3"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-foreground">{row.group}</span><span className={cn("text-sm font-semibold", row.gap > 0 ? "text-warning" : "text-success")}>{row.coverage}%</span></div><Progress value={Math.min(100, row.coverage)} className="h-2" /><div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground"><span>Approved {row.approved}</span><span>Scheduled {row.scheduled}</span><span>Gap {row.gap}</span></div></div>)}</div></div>;
}

function SchedulingDetailSheet({ record, open, onClose, onAction }: { record: SchedulingRecord | null; open: boolean; onClose: () => void; onAction: (record: SchedulingRecord, action: string) => void }) {
  if (!record) return null;
  const alerts = alertsFor(record);
  return <Sheet open={open} onOpenChange={(next) => !next && onClose()}><SheetContent side="right" className="w-[640px] overflow-y-auto p-0 sm:max-w-[640px]"><div className="p-6 pb-4"><SheetHeader><SheetTitle className="text-xl">{record.client}</SheetTitle><SheetDescription>{record.state} · {record.clinic} · {record.location}-based schedule</SheetDescription></SheetHeader><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={record.status} variant={statusVariant(record.status)} />{alerts.map((alert) => <StatusBadge key={alert.label} status={alert.label} variant={alert.severity === "red" ? "destructive" : "warning"} />)}</div><div className="mt-4 grid grid-cols-3 gap-2">{["Open Schedule", "Build Schedule", "Set Start Date", "Mark CR Entered", "Send Pairing Email", "Generate Case Coordination Doc"].map((action) => <Button key={action} variant="outline" size="sm" className="h-auto flex-col gap-1 py-2 text-[10px]" onClick={() => onAction(record, action)}>{action.includes("CR") ? <FileCheck2 className="h-3.5 w-3.5" /> : action.includes("Email") ? <Mail className="h-3.5 w-3.5" /> : action.includes("Doc") ? <FileText className="h-3.5 w-3.5" /> : action.includes("Start") ? <Clock className="h-3.5 w-3.5" /> : action.includes("Build") ? <CalendarDays className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}{action}</Button>)}</div></div><Separator /><Tabs defaultValue="overview" className="p-4"><TabsList className="grid h-auto w-full grid-cols-4 gap-1 xl:grid-cols-8"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="builder">Schedule</TabsTrigger><TabsTrigger value="availability">Availability</TabsTrigger><TabsTrigger value="cr">CentralReach</TabsTrigger><TabsTrigger value="docs">Docs</TabsTrigger><TabsTrigger value="comms">Comms</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-3 pt-3"><DetailGrid rows={[["Status", record.status], ["BCBA", record.bcba], ["RBT", record.rbt], ["Scheduler", record.scheduler], ["Start date", shortDate(record.startDate)], ["Blockers", alerts.map((a) => a.label).join(", ") || "None"]]} /></TabsContent><TabsContent value="builder" className="space-y-3 pt-3"><div className="rounded-lg border border-border/60 bg-background p-3"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold text-foreground">Approved vs scheduled hours</span><span className="text-sm text-muted-foreground">{record.scheduledHours}/{record.approvedHours}h</span></div><Progress value={pct(record.scheduledHours, record.approvedHours)} className="h-2" /></div><div className="grid gap-2 sm:grid-cols-2">{record.schedule.map((slot) => <div key={slot.id} className={cn("rounded-lg border p-3 text-sm", slot.conflict ? "border-destructive/40 bg-destructive/5" : "border-border/60 bg-background")}><div className="flex items-center justify-between"><span className="font-medium text-foreground">{slot.day}</span>{slot.conflict && <StatusBadge status="Conflict" variant="destructive" />}</div><p className="mt-1 text-xs text-muted-foreground">{slot.start}-{slot.end} · {slot.hours}h · {slot.location}</p></div>)}{record.schedule.length === 0 && <p className="text-sm text-muted-foreground">No schedule blocks drafted yet.</p>}</div></TabsContent><TabsContent value="availability" className="space-y-3 pt-3"><DetailGrid rows={[["Client availability", record.clientAvailability.join(", ")], ["RBT availability", record.rbtAvailability.join(", ")], ["BCBA availability", record.bcbaAvailability.join(", ")], ["Conflict warnings", record.schedule.filter((s) => s.conflict).length ? `${record.schedule.filter((s) => s.conflict).length} conflicts` : "None"]]} /></TabsContent><TabsContent value="cr" className="space-y-3 pt-3"><DetailGrid rows={[["CR entry status", record.centralReachStatus], ["Entered date", shortDate(record.crEnteredDate)], ["Verified by", record.crVerifiedBy || "—"], ["Notes", record.crNotes]]} /></TabsContent><TabsContent value="docs" className="space-y-2 pt-3">{record.documents.map((doc) => <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3 text-sm"><span className="flex items-center gap-2 text-foreground"><FileText className="h-4 w-4 text-primary" />{doc.name}</span><StatusBadge status={doc.status} variant={doc.status === "Missing" ? "destructive" : "success"} /></div>)}</TabsContent><TabsContent value="comms" className="pt-3"><Timeline items={record.communications} /></TabsContent><TabsContent value="tasks" className="space-y-4 pt-3"><TaskList title="Open tasks" tasks={record.tasks.filter((task) => !task.completed)} /><TaskList title="Completed tasks" tasks={record.tasks.filter((task) => task.completed)} /></TabsContent><TabsContent value="timeline" className="pt-3"><Timeline items={record.timeline} /></TabsContent></Tabs></SheetContent></Sheet>;
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return <div className="grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p></div>)}</div>;
}

function TaskList({ title, tasks }: { title: string; tasks: Task[] }) {
  return <div><h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3><div className="space-y-2">{tasks.map((task) => <div key={task.id} className="rounded-lg border border-border/60 bg-background p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-medium text-foreground">{task.title}</span><StatusBadge status={task.completed ? "Done" : "Open"} variant={task.completed ? "success" : "warning"} /></div><p className="mt-1 text-xs text-muted-foreground">{task.owner} · due {shortDate(task.dueDate)}</p></div>)}{tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks in this group.</p>}</div></div>;
}

function Timeline({ items }: { items: Event[] }) {
  return <div className="space-y-3">{items.map((item) => <div key={item.id} className="relative border-l border-border/60 pl-4"><span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary" /><p className="text-sm font-medium text-foreground">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.text}</p><p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {item.user}</p></div>)}</div>;
}