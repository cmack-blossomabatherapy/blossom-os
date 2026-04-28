import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, ArrowRight, BarChart3, Calendar, CheckCircle2, ClipboardCheck, Clock, Download, ExternalLink,
  FileText, Filter, Flag, Layers3, MessageSquare, Plus, Search, ShieldCheck, Sparkles, Upload, Users, Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useClients } from "@/contexts/ClientsContext";
import { Client } from "@/data/clients";
import { cn } from "@/lib/utils";

const ALL = "All";
type ViewMode = "Lifecycle" | "Board" | "Table" | "Bottleneck" | "Timeline" | "Revenue";
type Priority = "Routine" | "Elevated" | "High" | "Critical";
type RecordType = "Lead" | "Client";
type Risk = "Low" | "Medium" | "High" | "Critical";
type ComparisonPeriod = "Last week" | "Last month";

type PipelineTask = { id: string; title: string; owner: string; dueDate: string; completed: boolean; blocker?: boolean };
type PipelineEvent = { id: string; title: string; description: string; date: string; type: string; user: string };
type PipelineRecord = {
  id: string; sourceClientId?: string; name: string; parent: string; type: RecordType; state: string; clinic: string; section: string; stage: string;
  owner: string; payor: string; bcba: string; rbt: string; priority: Priority; risk: Risk; daysInStage: number; totalDays: number;
  nextAction: string; blockers: string[]; revenue: number; revenueRisk: number; createdDate: string; dates: Record<string, string | null>;
  tasks: PipelineTask[]; documents: { name: string; stage: string; status: string }[]; communications: { type: string; text: string; date: string; user: string }[];
  timeline: PipelineEvent[]; financial: { vob: string; paymentPlan: string; estimate: number }; auth: { initial: string; treatment: string; reauth: string };
  qa: { status: string; issues: string[] }; staffing: { status: string; assignedRbt: string }; scheduling: { status: string; startDate: string | null; centralReach: string };
  reauth: { nextDate: string | null; progressReport: string; risk: Risk };
};

type Filters = { dateRange: string; state: string; clinic: string; stage: string; owner: string; payor: string; bcba: string; rbt: string; priority: string; atRiskOnly: boolean; stuckOnly: boolean };
type SlaAlert = { id: string; record: PipelineRecord; title: string; detail: string; severity: "warning" | "critical"; daysOver: number; threshold: number; section: string };

const lifecycleSections = ["Intake", "Benefits & Financial", "Onboarding to Client", "Authorization", "Assessment", "QA", "Treatment Authorization", "Staffing", "Scheduling", "Active Services", "Reauth Loop"];
const blockerOptions = ["Missing intake info", "Payment plan not signed", "Consent missing", "Treatment plan overdue", "QA delayed", "No RBT assigned", "Schedule missing", "Revenue at risk"];
const stageGroups: Record<string, string[]> = {
  Intake: ["New Lead", "In Contact", "Sent Form", "Missing Information", "Form Received", "Sent to VOB", "VOB Completed"],
  "Benefits & Financial": ["VOB Pending", "Financial Review", "Payment Plan Required", "Payment Plan Received", "Approved for Services", "Not Qualified"],
  "Onboarding to Client": ["Converted to Client", "BCBA Assignment", "Pending Initial Authorization"],
  Authorization: ["Initial Auth Awaiting Submission", "Initial Auth Submitted", "Initial Auth Approved", "Waiting on Consent"],
  Assessment: ["Schedule Assessment", "Assessment Scheduled", "Assessment Completed", "Treatment Plan Pending"],
  QA: ["Awaiting QA Review", "In QA Review", "Issues Found", "QA Approved"],
  "Treatment Authorization": ["Treatment Auth Awaiting Submission", "Treatment Auth Submitted", "Treatment Auth Approved", "Treatment Auth Denied"],
  Staffing: ["Staffing Needed", "Matching in Progress", "RBT Assigned", "Restaffing Needed"],
  Scheduling: ["Pending Schedule", "Schedule Created", "Pending Start Date", "Ready to Activate"],
  "Active Services": ["Active", "Services on Pause", "Flaked", "Discharged"],
  "Reauth Loop": ["Reauth Triggered", "Progress Report Needed", "QA Review", "Reauth Submitted", "Reauth Approved"],
};
const bottleneckDefs = [
  ["Stuck in Intake", "Intake"], ["Waiting on Financial Review", "Benefits & Financial"], ["Pending Initial Auth", "Authorization"], ["Assessment Delays", "Assessment"], ["QA Delays", "QA"], ["Treatment Auth Delays", "Treatment Authorization"], ["Staffing Delays", "Staffing"], ["Scheduling Delays", "Scheduling"], ["Reauth Risk", "Reauth Loop"],
] as const;
const owners = ["Nina Patel", "Jordan Miles", "Avery Brooks", "Sam Rivera", "Taylor Quinn", "Morgan Lee", "Priya Shah"];
const bcbas = ["Dr. Kim", "Dr. Patel", "Dr. Lee", "Dr. Stone", "Dr. Hayes", "Dr. Morgan"];
const rbts = ["Taylor S.", "Quinn D.", "Maya Chen", "Andre Hill", "Riley Brooks", "Devon H.", "Jamie N.", "Unassigned"];
const states = ["GA", "NC", "TN", "VA", "MD"];
const clinics = ["Peachtree Corners", "Riverdale", "Charlotte Midtown", "Raleigh Cary", "Nashville East", "Memphis Central", "Richmond West", "Norfolk Harbor", "Bethesda North", "Baltimore Harbor"];
const payors = ["Aetna", "BCBS", "United", "Cigna", "Amerigroup", "Medicaid"];
const names = ["Emma Thompson", "Mason Lee", "Ava Brooks", "Noah Rivera", "Sophia Grant", "Liam Carter", "Olivia Singh", "Ethan Moore", "Mia Johnson", "Jackson Reed", "Harper Allen", "Caleb West", "Ivy Clark", "Aiden Patel", "Sofia Garcia", "Liam Chen", "Olivia Brown", "Noah Williams", "Marcus Johnson", "Zoe Rivera", "Ben Carter", "Hannah Park", "Layla Brooks", "Amelia Ross", "Grayson Hall", "Ella Murphy", "James Wright", "Aria Scott", "Lucas Green", "Nora Adams", "Miles Baker", "Chloe Nelson", "Henry Cooper", "Leah Torres", "Owen Blake", "Grace Turner"];

const today = new Date("2026-04-28T12:00:00Z");
const sectionSlaDays: Record<string, number> = { Intake: 3, "Benefits & Financial": 5, "Onboarding to Client": 4, Authorization: 7, Assessment: 6, QA: 5, "Treatment Authorization": 7, Staffing: 6, Scheduling: 4, "Active Services": 30, "Reauth Loop": 5 };
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmt = (date: string | null) => date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
const isoDaysAgo = (days: number) => new Date(today.getTime() - days * 86400000).toISOString();
const isoDaysFrom = (days: number) => new Date(today.getTime() + days * 86400000).toISOString();
const pct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const daysUntil = (date: string | null) => date ? Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000) : null;
const health = (count: number, avg: number, blocked: number) => blocked > 2 || avg > 10 ? "critical" : blocked > 0 || avg > 6 ? "warning" : count ? "success" : "muted";
const riskTone = (risk: Risk) => risk === "Critical" ? "destructive" : risk === "High" ? "warning" : risk === "Medium" ? "info" : "success";
const priorityTone = (priority: Priority) => priority === "Critical" ? "destructive" : priority === "High" ? "warning" : priority === "Elevated" ? "info" : "muted";
const sectionForStage = (stage: string) => lifecycleSections.find((section) => stageGroups[section].includes(stage)) ?? "Intake";
const stageIndex = (stage: string) => lifecycleSections.flatMap((section) => stageGroups[section]).indexOf(stage);
const sectionIndex = (section: string) => lifecycleSections.indexOf(section);

function buildRecord(index: number, client?: Client): PipelineRecord {
  const allStages = lifecycleSections.flatMap((section) => stageGroups[section]);
  const stage = client ? normalizeStage(client.stage) : allStages[index % allStages.length];
  const section = sectionForStage(stage);
  const state = client?.state && states.includes(client.state) ? client.state : states[index % states.length];
  const clinic = client?.clinic && !["Remote"].includes(client.clinic) ? client.clinic : clinics[index % clinics.length];
  const days = client?.daysInStage ?? ((index * 3) % 18) + 1;
  const priority: Priority = days > 14 ? "Critical" : days > 9 ? "High" : days > 5 ? "Elevated" : "Routine";
  const risk: Risk = section === "Reauth Loop" || days > 14 ? "Critical" : ["Staffing", "Scheduling", "Treatment Authorization", "QA"].includes(section) && days > 7 ? "High" : days > 5 ? "Medium" : "Low";
  const blockers = buildBlockers(stage, days, risk);
  const revenue = sectionIndex(section) >= 1 ? 28000 + (index % 9) * 4200 : 9000 + (index % 5) * 2200;
  const createdDate = isoDaysAgo(days + 8 + index);
  const name = client?.childName ?? names[index % names.length];
  const owner = client?.intakeOwner ?? owners[index % owners.length];
  const bcba = client?.bcba ?? (sectionIndex(section) >= 2 ? bcbas[index % bcbas.length] : "Unassigned");
  const rbt = client?.rbt ?? (sectionIndex(section) >= 7 && !["Staffing Needed", "Matching in Progress", "Restaffing Needed"].includes(stage) ? rbts[index % (rbts.length - 1)] : "Unassigned");
  const dates = buildDates(section, days, index);
  const nextAction = nextActionFor(stage, blockers);
  return {
    id: client?.id ?? `PIPE-${String(index + 1001).padStart(4, "0")}`, sourceClientId: client?.id, name, parent: client?.parentName ?? `${name.split(" ")[0]} Family`,
    type: sectionIndex(section) < 2 ? "Lead" : "Client", state, clinic, section, stage, owner, payor: client?.payor ?? payors[index % payors.length], bcba, rbt,
    priority, risk, daysInStage: days, totalDays: days + 8 + index, nextAction, blockers, revenue, revenueRisk: blockers.length || risk !== "Low" ? Math.round(revenue * 0.65) : 0, createdDate, dates,
    tasks: buildTasks(stage, owner, blockers, index), documents: buildDocuments(section, blockers), communications: buildCommunications(owner, name, index),
    timeline: buildTimeline(name, section, stage, createdDate, dates, blockers), financial: { vob: sectionIndex(section) >= 1 ? "Completed" : "Pending", paymentPlan: blockers.some((b) => b.includes("Payment")) ? "Required" : "Not required", estimate: revenue },
    auth: { initial: sectionIndex(section) >= 4 ? "Approved" : section === "Authorization" ? stage : "Not submitted", treatment: sectionIndex(section) >= 7 ? "Approved" : section === "Treatment Authorization" ? stage : "Not submitted", reauth: section === "Reauth Loop" ? stage : "Not started" },
    qa: { status: section === "QA" ? stage : sectionIndex(section) > 5 ? "QA Approved" : "Not started", issues: blockers.filter((b) => b.includes("QA") || b.includes("Treatment plan")) },
    staffing: { status: section === "Staffing" ? stage : rbt === "Unassigned" ? "Not assigned" : "Assigned", assignedRbt: rbt },
    scheduling: { status: section === "Scheduling" ? stage : sectionIndex(section) > 8 ? "Active" : "Pending", startDate: dates.startDate, centralReach: sectionIndex(section) >= 8 ? "Synced" : "Not ready" },
    reauth: { nextDate: section === "Reauth Loop" ? isoDaysFrom(24 - (index % 10)) : section === "Active Services" ? isoDaysFrom(35 + index) : null, progressReport: section === "Reauth Loop" ? (stage.includes("Progress") ? "Needed" : "In progress") : "Not started", risk },
  };
}

function normalizeStage(stage: string) {
  const aliases: Record<string, string> = { "VOB Received": "VOB Completed", "Pending Initial Auth": "Initial Auth Awaiting Submission", "Initial Auth – Awaiting Submission": "Initial Auth Awaiting Submission", "Initial Auth – Submitted": "Initial Auth Submitted", "Initial Auth – Approved": "Initial Auth Approved", "Waiting on Consent Forms": "Waiting on Consent", "QA Review": "In QA Review", "QA Issues / Fix Required": "Issues Found", "Pending Treatment Auth": "Treatment Auth Awaiting Submission", "Treatment Auth – Awaiting Submission": "Treatment Auth Awaiting Submission", "Treatment Auth – Submitted": "Treatment Auth Submitted", "Treatment Auth – Approved": "Treatment Auth Approved", "Treatment Auth – Denied": "Treatment Auth Denied" };
  return aliases[stage] ?? stage;
}
function buildBlockers(stage: string, days: number, risk: Risk) {
  const blockers: string[] = [];
  if (stage === "New Lead" && days > 2) blockers.push("Lead not contacted");
  if (stage === "Missing Information") blockers.push("Missing intake info");
  if (stage === "Payment Plan Required") blockers.push("Payment plan not signed");
  if (stage.includes("Auth") && days > 7) blockers.push(stage.includes("Treatment") ? "Treatment auth delayed" : "Initial auth delayed");
  if (stage === "Waiting on Consent") blockers.push("Consent missing");
  if (stage === "Schedule Assessment") blockers.push("Assessment not scheduled");
  if (stage === "Treatment Plan Pending") blockers.push("Treatment plan overdue");
  if (["Awaiting QA Review", "In QA Review", "Issues Found", "QA Review"].includes(stage) && days > 5) blockers.push("QA delayed");
  if (["Staffing Needed", "Matching in Progress", "Restaffing Needed"].includes(stage)) blockers.push("No RBT assigned");
  if (["Pending Schedule", "Pending Start Date"].includes(stage)) blockers.push("Schedule missing");
  if (stage === "Ready to Activate" && days > 4) blockers.push("Start date passed");
  if (["Reauth Triggered", "Progress Report Needed", "Reauth Submitted"].includes(stage)) blockers.push("Reauth within 30 days");
  if (["High", "Critical"].includes(risk)) blockers.push("Revenue at risk");
  return Array.from(new Set(blockers));
}
function nextActionFor(stage: string, blockers: string[]) { return blockers[0] ? `Resolve ${blockers[0].toLowerCase()}` : stage.includes("Approved") ? "Move to next lifecycle stage" : `Complete ${stage.toLowerCase()} requirements`; }
function buildDates(section: string, days: number, index: number) {
  const pos = sectionIndex(section);
  return { lead: isoDaysAgo(days + 20), vob: pos >= 1 ? isoDaysAgo(days + 16) : null, conversion: pos >= 2 ? isoDaysAgo(days + 13) : null, auth: pos >= 4 ? isoDaysAgo(days + 10) : null, assessment: pos >= 5 ? isoDaysAgo(days + 8) : null, qa: pos >= 6 ? isoDaysAgo(days + 6) : null, treatmentAuth: pos >= 7 ? isoDaysAgo(days + 4) : null, rbt: pos >= 8 ? isoDaysAgo(days + 2) : null, startDate: pos >= 9 ? isoDaysAgo(Math.max(0, days - 1)) : pos === 8 ? isoDaysFrom(3 + (index % 7)) : null, active: pos >= 9 ? isoDaysAgo(Math.max(0, days - 2)) : null };
}
function buildTasks(stage: string, owner: string, blockers: string[], index: number): PipelineTask[] { return [{ id: `t-${index}-1`, title: blockers[0] ?? `Complete ${stage} checklist`, owner, dueDate: isoDaysFrom((index % 5) + 1), completed: false, blocker: Boolean(blockers[0]) }, { id: `t-${index}-2`, title: "Update lifecycle notes", owner, dueDate: isoDaysFrom((index % 8) + 2), completed: index % 3 === 0 }]; }
function buildDocuments(section: string, blockers: string[]) { return [{ name: "Intake packet", stage: "Intake", status: blockers.includes("Missing intake info") ? "Missing" : "Received" }, { name: "VOB summary", stage: "Benefits & Financial", status: sectionIndex(section) >= 1 ? "Received" : "Pending" }, { name: "Treatment plan", stage: "QA", status: sectionIndex(section) >= 5 ? "Under review" : "Not ready" }, { name: "Auth approval letter", stage: "Treatment Authorization", status: sectionIndex(section) >= 7 ? "Received" : "Pending" }]; }
function buildCommunications(owner: string, name: string, index: number) { return [{ type: "Call", text: `Spoke with ${name.split(" ")[0]} family about next steps.`, date: isoDaysAgo(index % 6), user: owner }, { type: "Email", text: "Sent lifecycle status update and outstanding requirements.", date: isoDaysAgo((index % 8) + 1), user: owner }]; }
function buildTimeline(name: string, section: string, stage: string, createdDate: string, dates: Record<string, string | null>, blockers: string[]): PipelineEvent[] {
  const events = [{ id: `${name}-lead`, title: "Lead created", description: `${name} entered Blossom pipeline.`, date: createdDate, type: "stage", user: "Intake" }];
  Object.entries({ "VOB completed": dates.vob, "Client conversion": dates.conversion, "Auth approval": dates.auth, "Assessment completed": dates.assessment, "QA approved": dates.qa, "Treatment auth approved": dates.treatmentAuth, "RBT assigned": dates.rbt, "Start date": dates.startDate, "Active date": dates.active }).forEach(([title, date]) => date && events.push({ id: `${name}-${title}`, title, description: `${section} milestone recorded.`, date, type: "stage", user: "System" }));
  blockers.forEach((blocker, i) => events.push({ id: `${name}-b-${i}`, title: blocker, description: `Blocker linked to ${stage}.`, date: isoDaysAgo(i + 1), type: "blocker", user: "Pipeline" }));
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
function buildPipelineData(clients: Client[]) {
  const mapped = clients.slice(0, 12).map((client, index) => buildRecord(index, client));
  const start = mapped.length;
  return [...mapped, ...Array.from({ length: Math.max(35 - mapped.length, 0) }, (_, i) => buildRecord(start + i))];
}

function requirementIssues(record: PipelineRecord) {
  const issues = [...record.blockers];
  if (record.tasks.some((task) => !task.completed && task.blocker)) issues.push("Open blocker task");
  if (record.documents.some((document) => document.status === "Missing")) issues.push("Missing required document");
  return Array.from(new Set(issues));
}

function slaAlertsForRecord(record: PipelineRecord): SlaAlert[] {
  const alerts: SlaAlert[] = [];
  const sectionThreshold = sectionSlaDays[record.section] ?? 7;
  const add = (title: string, detail: string, daysOver: number, threshold = sectionThreshold, severity: "warning" | "critical" = daysOver >= 3 || record.risk === "Critical" ? "critical" : "warning") => {
    alerts.push({ id: `${record.id}-${title}`, record, title, detail, severity, daysOver: Math.max(daysOver, 0), threshold, section: record.section });
  };
  if (["Authorization", "Treatment Authorization"].includes(record.section) && record.daysInStage > 7) add(record.section === "Authorization" ? "Initial auth delayed" : "Treatment auth delayed", `${record.daysInStage} days in ${record.stage}; payor ${record.payor}.`, record.daysInStage - 7, 7);
  if (record.section === "QA" && record.daysInStage > 5) add("QA delayed", `${record.qa.status} has exceeded the 5 day SLA.`, record.daysInStage - 5, 5);
  const startDelta = daysUntil(record.scheduling.startDate);
  if (["Scheduling", "Active Services"].includes(record.section) && startDelta !== null && startDelta < 0 && record.stage !== "Active") add("Start date passed", `Planned start was ${fmt(record.scheduling.startDate)} and the record is still ${record.stage}.`, Math.abs(startDelta), 0, "critical");
  const reauthDelta = daysUntil(record.reauth.nextDate);
  if (record.section === "Reauth Loop" && reauthDelta !== null && reauthDelta <= 14) add("Reauth deadline approaching", `${reauthDelta} days until reauthorization; ${record.reauth.progressReport.toLowerCase()}.`, Math.max(14 - reauthDelta, 0), 14, reauthDelta <= 7 ? "critical" : "warning");
  if (record.daysInStage > sectionThreshold && !alerts.some((alert) => alert.title.includes("delayed") || alert.title.includes("passed"))) add("Section SLA exceeded", `${record.daysInStage} days in ${record.section}; target is ${sectionThreshold} days.`, record.daysInStage - sectionThreshold, sectionThreshold);
  return alerts;
}
function buildSlaAlerts(records: PipelineRecord[]) { return records.flatMap(slaAlertsForRecord).sort((a, b) => (b.severity === "critical" ? 1 : 0) - (a.severity === "critical" ? 1 : 0) || b.daysOver - a.daysOver); }
function healthMetrics(records: PipelineRecord[]) { return { stuck: records.filter((r) => r.daysInStage >= 8 || r.blockers.length).length, avgDays: Math.round(records.reduce((s, r) => s + r.totalDays, 0) / Math.max(records.length, 1)), reauthRisk: records.filter((r) => r.section === "Reauth Loop" || r.reauth.risk !== "Low").length }; }
function buildHealthComparison(records: PipelineRecord[], period: ComparisonPeriod) { const todayMetrics = healthMetrics(records); const offset = period === "Last week" ? 1 : 3; const previous = { stuck: Math.max(0, todayMetrics.stuck - offset + (records.length % 3)), avgDays: Math.max(1, todayMetrics.avgDays - offset), reauthRisk: Math.max(0, todayMetrics.reauthRisk - (period === "Last week" ? 1 : 2)) }; return { period, rows: [["Stuck records", todayMetrics.stuck, previous.stuck, "records"], ["Avg days to active", todayMetrics.avgDays, previous.avgDays, "days"], ["Reauth risk", todayMetrics.reauthRisk, previous.reauthRisk, "records"]] as [string, number, number, string][] }; }

export default function Pipeline() {
  const navigate = useNavigate();
  const { clients } = useClients();
  const [records, setRecords] = useState<PipelineRecord[]>(() => buildPipelineData(clients));
  const [view, setView] = useState<ViewMode>("Lifecycle");
  const [query, setQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>(ALL);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [pendingBatch, setPendingBatch] = useState<{ type: "move" | "blocker"; blocker?: string } | null>(null);
  const [sortKey, setSortKey] = useState<"risk" | "days" | "revenue" | "name">("risk");
  const [savedView, setSavedView] = useState("Executive Health");
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>("Last week");
  const [filters, setFilters] = useState<Filters>({ dateRange: "This Month", state: ALL, clinic: ALL, stage: ALL, owner: ALL, payor: ALL, bcba: ALL, rbt: ALL, priority: ALL, atRiskOnly: false, stuckOnly: false });

  const filterOptions = useMemo(() => ({
    states: [ALL, ...Array.from(new Set(records.map((r) => r.state))).sort()], clinics: [ALL, ...Array.from(new Set(records.map((r) => r.clinic))).sort()], stages: [ALL, ...lifecycleSections],
    owners: [ALL, ...Array.from(new Set(records.map((r) => r.owner))).sort()], payors: [ALL, ...Array.from(new Set(records.map((r) => r.payor))).sort()], bcbas: [ALL, ...Array.from(new Set(records.map((r) => r.bcba))).sort()], rbts: [ALL, ...Array.from(new Set(records.map((r) => r.rbt))).sort()], priorities: [ALL, "Routine", "Elevated", "High", "Critical"],
  }), [records]);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return records
      .filter((r) => selectedSection === ALL || r.section === selectedSection)
      .filter((r) => filters.state === ALL || r.state === filters.state)
      .filter((r) => filters.clinic === ALL || r.clinic === filters.clinic)
      .filter((r) => filters.stage === ALL || r.section === filters.stage)
      .filter((r) => filters.owner === ALL || r.owner === filters.owner)
      .filter((r) => filters.payor === ALL || r.payor === filters.payor)
      .filter((r) => filters.bcba === ALL || r.bcba === filters.bcba)
      .filter((r) => filters.rbt === ALL || r.rbt === filters.rbt)
      .filter((r) => filters.priority === ALL || r.priority === filters.priority)
      .filter((r) => !filters.atRiskOnly || r.risk === "High" || r.risk === "Critical" || r.revenueRisk > 0)
      .filter((r) => !filters.stuckOnly || r.daysInStage >= 8 || r.blockers.length > 0)
      .filter((r) => !q || [r.name, r.parent, r.id, r.owner, r.payor, r.bcba, r.rbt, r.stage, r.nextAction].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => sortKey === "days" ? b.daysInStage - a.daysInStage : sortKey === "revenue" ? b.revenueRisk - a.revenueRisk : sortKey === "name" ? a.name.localeCompare(b.name) : ["Critical", "High", "Medium", "Low"].indexOf(a.risk) - ["Critical", "High", "Medium", "Low"].indexOf(b.risk));
  }, [records, selectedSection, filters, query, sortKey]);
  const selected = records.find((r) => r.id === selectedRecordId) ?? null;
  const selectedBatchRecords = records.filter((record) => selectedIds.includes(record.id));
  const summary = useMemo(() => buildSummary(filtered), [filtered]);
  const slaAlerts = useMemo(() => buildSlaAlerts(filtered), [filtered]);
  const healthComparison = useMemo(() => buildHealthComparison(filtered, comparisonPeriod), [filtered, comparisonPeriod]);
  const kpis = [
    ["Total In Pipeline", filtered.length, "all"], ["New Leads", filtered.filter((r) => r.stage === "New Lead").length, "Intake"], ["Pending Auth", filtered.filter((r) => r.section === "Authorization" || r.section === "Treatment Authorization").length, "Authorization"], ["In QA", filtered.filter((r) => r.section === "QA").length, "QA"], ["Staffing Needed", filtered.filter((r) => r.section === "Staffing" && r.rbt === "Unassigned").length, "Staffing"], ["Pending Start", filtered.filter((r) => r.section === "Scheduling").length, "Scheduling"], ["Active Clients", filtered.filter((r) => r.stage === "Active").length, "Active Services"], ["Reauth Risk", filtered.filter((r) => r.section === "Reauth Loop" || r.reauth.risk !== "Low").length, "Reauth Loop"], ["Stuck Records", filtered.filter((r) => r.daysInStage >= 8 || r.blockers.length).length, "stuck"], ["Avg Time to Active", `${Math.round(filtered.reduce((s, r) => s + r.totalDays, 0) / Math.max(filtered.length, 1))}d`, "all"],
  ] as const;

  const updateFilter = (key: keyof Filters, value: string | boolean) => setFilters((current) => ({ ...current, [key]: value }));
  const openRecord = (record: PipelineRecord) => setSelectedRecordId(record.id);
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const moveForward = (record: PipelineRecord) => {
    const issues = requirementIssues(record);
    if (issues.length) {
      toast.error("Missing requirements", { description: issues[0] ?? "Complete required stage tasks before moving forward." });
      return;
    }
    const stages = lifecycleSections.flatMap((section) => stageGroups[section]);
    const nextStage = stages[stageIndex(record.stage) + 1];
    if (!nextStage) return toast.info("Record is already at the end of the lifecycle.");
    setRecords((current) => current.map((item) => item.id === record.id ? { ...item, stage: nextStage, section: sectionForStage(nextStage), daysInStage: 0, nextAction: nextActionFor(nextStage, []), timeline: [{ id: `${item.id}-${Date.now()}`, title: "Stage changed", description: `Moved from ${item.stage} to ${nextStage}.`, date: today.toISOString(), type: "stage", user: "Pipeline user" }, ...item.timeline] } : item));
    toast.success(`${record.name} moved to ${nextStage}`);
  };
  const addTask = (record: PipelineRecord) => setRecords((current) => current.map((item) => item.id === record.id ? { ...item, tasks: [{ id: `${item.id}-task-${Date.now()}`, title: "Follow up on pipeline requirement", owner: item.owner, dueDate: isoDaysFrom(2), completed: false }, ...item.tasks] } : item));
  const escalate = (record: PipelineRecord) => setRecords((current) => current.map((item) => item.id === record.id ? { ...item, priority: "Critical", risk: "Critical", blockers: Array.from(new Set([...item.blockers, "Escalated by pipeline leadership"])), timeline: [{ id: `${item.id}-esc-${Date.now()}`, title: "Case escalated", description: "Leadership escalation added from Pipeline.", date: today.toISOString(), type: "blocker", user: "Pipeline user" }, ...item.timeline] } : item));
  const confirmBatch = () => {
    if (!pendingBatch || selectedBatchRecords.length === 0) return;
    if (pendingBatch.type === "move") {
      const eligible = selectedBatchRecords.filter((record) => requirementIssues(record).length === 0 && stageIndex(record.stage) < lifecycleSections.flatMap((section) => stageGroups[section]).length - 1);
      const blocked = selectedBatchRecords.length - eligible.length;
      setRecords((current) => current.map((item) => {
        if (!eligible.some((record) => record.id === item.id)) return item;
        const stages = lifecycleSections.flatMap((section) => stageGroups[section]);
        const nextStage = stages[stageIndex(item.stage) + 1];
        return { ...item, stage: nextStage, section: sectionForStage(nextStage), daysInStage: 0, nextAction: nextActionFor(nextStage, []), timeline: [{ id: `${item.id}-${Date.now()}`, title: "Batch stage changed", description: `Moved from ${item.stage} to ${nextStage}.`, date: today.toISOString(), type: "stage", user: "Pipeline user" }, ...item.timeline] };
      }));
      toast.success(`${eligible.length} records moved forward`, { description: blocked ? `${blocked} blocked by missing requirements.` : "All selected records passed requirement checks." });
    } else {
      const blocker = pendingBatch.blocker ?? blockerOptions[0];
      setRecords((current) => current.map((item) => selectedIds.includes(item.id) ? { ...item, blockers: Array.from(new Set([...item.blockers, blocker])), risk: item.risk === "Low" ? "Medium" : item.risk, revenueRisk: item.revenueRisk || Math.round(item.revenue * 0.35), tasks: [{ id: `${item.id}-blocker-${Date.now()}`, title: `Resolve ${blocker.toLowerCase()}`, owner: item.owner, dueDate: isoDaysFrom(2), completed: false, blocker: true }, ...item.tasks], timeline: [{ id: `${item.id}-blocker-${Date.now()}`, title: blocker, description: "Batch blocker added with linked task.", date: today.toISOString(), type: "blocker", user: "Pipeline user" }, ...item.timeline] } : item));
      toast.success(`${blocker} added to ${selectedBatchRecords.length} records`);
    }
    setPendingBatch(null); setBatchOpen(false); setSelectedIds([]);
  };

  return (
    <PageShell title="Pipeline" description="Full lifecycle view from lead intake through active services and reauthorization." icon={Workflow}>
      <div className="sticky top-0 z-30 -mx-1 space-y-3 border-b border-border/40 bg-background/95 px-1 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => toast.success("New lead intake opened")}><Plus className="mr-2 h-4 w-4" />New Lead</Button><Button size="sm" variant="outline" onClick={() => toast.success("Pipeline export prepared")}><Download className="mr-2 h-4 w-4" />Export</Button><Select value={savedView} onValueChange={setSavedView}><SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger><SelectContent>{["Executive Health", "At-Risk Clients", "Auth Watch", "Revenue Risk"].map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={() => setView("Lifecycle")}><ShieldCheck className="mr-2 h-4 w-4" />Pipeline Health</Button><Button size="sm" variant="outline" onClick={() => setView("Bottleneck")}><AlertCircle className="mr-2 h-4 w-4" />Bottleneck Report</Button></div>
          <div className="flex rounded-md border bg-muted/40 p-1">{(["Lifecycle", "Board", "Table", "Bottleneck", "Timeline", "Revenue"] as ViewMode[]).map((mode) => <button key={mode} onClick={() => setView(mode)} className={cn("rounded px-3 py-1.5 text-xs font-medium", view === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{mode} View</button>)}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5 xl:grid-cols-10">
          <Select value={filters.dateRange} onValueChange={(v) => updateFilter("dateRange", v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "Quarter"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
          {([ ["state", filterOptions.states], ["clinic", filterOptions.clinics], ["stage", filterOptions.stages], ["owner", filterOptions.owners], ["payor", filterOptions.payors], ["bcba", filterOptions.bcbas], ["rbt", filterOptions.rbts], ["priority", filterOptions.priorities] ] as [keyof Filters, string[]][]).map(([key, options]) => <Select key={key} value={String(filters[key])} onValueChange={(v) => updateFilter(key, v)}><SelectTrigger className="h-9 capitalize"><SelectValue /></SelectTrigger><SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>)}
          <Button variant={filters.atRiskOnly ? "default" : "outline"} size="sm" onClick={() => updateFilter("atRiskOnly", !filters.atRiskOnly)}>At-risk only</Button><Button variant={filters.stuckOnly ? "default" : "outline"} size="sm" onClick={() => updateFilter("stuckOnly", !filters.stuckOnly)}>Stuck only</Button>
        </div>
      </div>

      <PipelineHealthComparison comparison={healthComparison} period={comparisonPeriod} setPeriod={setComparisonPeriod} />

      <section className="grid gap-3 md:grid-cols-5 xl:grid-cols-10">{kpis.map(([label, value, target]) => <button key={label} onClick={() => { if (target === "stuck") updateFilter("stuckOnly", true); else setSelectedSection(target === "all" ? ALL : target); }} className="rounded-lg border bg-card p-3 text-left shadow-sm transition hover:shadow-md"><p className="text-[11px] font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold text-foreground">{value}</p></button>)}</section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
        <div><p className="text-sm font-semibold">Batch actions</p><p className="text-xs text-muted-foreground">{selectedIds.length} selected · controlled stage movement only</p></div>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedIds(filtered.map((record) => record.id))}>Select visible</Button><Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Clear</Button><Button size="sm" disabled={!selectedIds.length} onClick={() => { setPendingBatch({ type: "move" }); setBatchOpen(true); }}><ArrowRight className="mr-2 h-4 w-4" />Move forward</Button><Select disabled={!selectedIds.length} onValueChange={(blocker) => { setPendingBatch({ type: "blocker", blocker }); setBatchOpen(true); }}><SelectTrigger className="h-9 w-[210px]"><SelectValue placeholder="Add blocker…" /></SelectTrigger><SelectContent>{blockerOptions.map((blocker) => <SelectItem key={blocker} value={blocker}>{blocker}</SelectItem>)}</SelectContent></Select></div>
      </section>

      <LiveAlertPanel alerts={slaAlerts} setSelectedSection={setSelectedSection} openRecord={openRecord} />

      {view === "Lifecycle" && <LifecycleView records={filtered} summary={summary} selectedSection={selectedSection} setSelectedSection={setSelectedSection} openRecord={openRecord} selectedIds={selectedIds} toggleSelected={toggleSelected} />}
      {view === "Board" && <BoardView records={filtered} openRecord={openRecord} selectedIds={selectedIds} toggleSelected={toggleSelected} />}
      {view === "Table" && <TableView records={filtered} query={query} setQuery={setQuery} sortKey={sortKey} setSortKey={setSortKey} openRecord={openRecord} selectedIds={selectedIds} toggleSelected={toggleSelected} />}
      {view === "Bottleneck" && <BottleneckView records={filtered} setSelectedSection={setSelectedSection} setView={setView} />}
      {view === "Timeline" && <TimelineView records={filtered} openRecord={openRecord} />}
      {view === "Revenue" && <RevenueView records={filtered} setSelectedSection={setSelectedSection} />}

      <Sheet open={batchOpen} onOpenChange={setBatchOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Confirm batch action</SheetTitle><SheetDescription>{selectedBatchRecords.length} selected records · controlled action with requirement checks</SheetDescription></SheetHeader>{pendingBatch && <div className="mt-5 space-y-4"><div className="rounded-lg border bg-muted/30 p-4"><p className="text-sm font-semibold">{pendingBatch.type === "move" ? "Move eligible records forward" : `Add blocker: ${pendingBatch.blocker}`}</p><p className="mt-1 text-xs text-muted-foreground">{pendingBatch.type === "move" ? "Records with blockers, blocker tasks, or missing required documents will be skipped." : "This creates a linked blocker task and timeline event for each selected record."}</p></div><div className="space-y-2">{selectedBatchRecords.slice(0, 8).map((record) => { const issues = requirementIssues(record); return <div key={record.id} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{record.name}</p><p className="text-xs text-muted-foreground">{record.stage} · {record.owner}</p></div><TonePill tone={pendingBatch.type === "move" && issues.length ? "destructive" : "success"}>{pendingBatch.type === "move" && issues.length ? "Blocked" : "Ready"}</TonePill></div>{pendingBatch.type === "move" && issues.length > 0 && <p className="mt-2 text-xs text-destructive">{issues.join(", ")}</p>}</div>; })}</div>{selectedBatchRecords.length > 8 && <p className="text-xs text-muted-foreground">+{selectedBatchRecords.length - 8} more selected records</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setBatchOpen(false)}>Cancel</Button><Button onClick={confirmBatch}>{pendingBatch.type === "move" ? "Move eligible records" : "Add blocker"}</Button></div></div>}</SheetContent></Sheet>

      <DetailPanel record={selected} onClose={() => setSelectedRecordId(null)} onOpenClient={() => selected?.sourceClientId ? navigate(`/clients/${selected.sourceClientId}`) : toast.info("Demo lead record has no full client profile yet")} onCreateTask={() => selected && addTask(selected)} onEscalate={() => selected && escalate(selected)} onMove={() => selected && moveForward(selected)} />
    </PageShell>
  );
}

function buildSummary(records: PipelineRecord[]) { return lifecycleSections.map((section) => { const rows = records.filter((r) => r.section === section); const alerts = rows.flatMap(slaAlertsForRecord); const avg = Math.round(rows.reduce((s, r) => s + r.daysInStage, 0) / Math.max(rows.length, 1)); const blocked = rows.filter((r) => r.blockers.length).length; return { section, count: rows.length, avg, oldest: rows.reduce((max, r) => Math.max(max, r.daysInStage), 0), blocked, revenue: rows.reduce((s, r) => s + r.revenue, 0), slaBreaches: alerts.length, maxDaysOver: alerts.reduce((max, alert) => Math.max(max, alert.daysOver), 0), tone: alerts.some((alert) => alert.severity === "critical") ? "critical" : alerts.length ? "warning" : health(rows.length, avg, blocked) }; }); }
function TonePill({ children, tone = "muted" }: { children: React.ReactNode; tone?: string }) { return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium", tone === "destructive" || tone === "critical" ? "bg-destructive/10 text-destructive" : tone === "warning" ? "bg-warning/10 text-warning" : tone === "success" ? "bg-success/10 text-success" : tone === "info" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{children}</span>; }
function LifecycleView({ records, summary, selectedSection, setSelectedSection, openRecord, selectedIds, toggleSelected }: { records: PipelineRecord[]; summary: ReturnType<typeof buildSummary>; selectedSection: string; setSelectedSection: (s: string) => void; openRecord: (r: PipelineRecord) => void; selectedIds: string[]; toggleSelected: (id: string) => void }) { return <div className="space-y-5"><section className="overflow-x-auto"><div className="flex min-w-max gap-3">{summary.map((item, index) => <button key={item.section} onClick={() => setSelectedSection(selectedSection === item.section ? ALL : item.section)} className={cn("w-64 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:shadow-md", selectedSection === item.section && "border-primary ring-2 ring-primary/20")}><div className="flex items-center justify-between"><TonePill tone={item.tone}>{item.section}</TonePill><span className="text-xs text-muted-foreground">{index + 1}/11</span></div><div className="mt-3 flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5"><span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Clock className="h-3.5 w-3.5" />SLA timer</span><TonePill tone={item.slaBreaches ? item.tone : "success"}>{item.slaBreaches ? `${item.slaBreaches} alert${item.slaBreaches === 1 ? "" : "s"} · +${item.maxDaysOver}d` : "On track"}</TonePill></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Count" value={String(item.count)} /><Info label="Avg days" value={`${item.avg}d`} /><Info label="Oldest" value={`${item.oldest}d`} /><Info label="Blocked" value={String(item.blocked)} /></div><p className="mt-3 text-xs font-medium text-muted-foreground">{currency.format(item.revenue)} pipeline value</p><Progress className="mt-3 h-1.5" value={pct(item.count, Math.max(records.length, 1))} /></button>)}</div></section><RecordList title="Lifecycle records" records={records.slice(0, 12)} openRecord={openRecord} selectedIds={selectedIds} toggleSelected={toggleSelected} /></div>; }
function BoardView({ records, openRecord, selectedIds, toggleSelected }: { records: PipelineRecord[]; openRecord: (r: PipelineRecord) => void; selectedIds: string[]; toggleSelected: (id: string) => void }) { return <div className="overflow-x-auto pb-4"><div className="flex min-w-max gap-3">{Object.entries(stageGroups).map(([section, stages]) => <section key={section} className="w-[360px] shrink-0 rounded-lg border bg-card"><div className="border-b p-3"><h2 className="text-sm font-semibold">{section}</h2><p className="text-xs text-muted-foreground">{records.filter((r) => r.section === section).length} records</p></div><div className="max-h-[720px] space-y-3 overflow-y-auto p-3">{stages.map((stage) => <div key={stage} className="rounded-lg border bg-muted/20 p-2"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold">{stage}</p><span className="text-[11px] text-muted-foreground">{records.filter((r) => r.stage === stage).length}</span></div>{records.filter((r) => r.stage === stage).slice(0, 4).map((record) => <RecordCard key={record.id} record={record} onClick={() => openRecord(record)} selected={selectedIds.includes(record.id)} onSelect={() => toggleSelected(record.id)} />)}</div>)}</div></section>)}</div></div>; }
function PipelineHealthComparison({ comparison, period, setPeriod }: { comparison: ReturnType<typeof buildHealthComparison>; period: ComparisonPeriod; setPeriod: (period: ComparisonPeriod) => void }) { return <section className="rounded-lg border bg-card p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Pipeline Health comparison</h2><p className="text-xs text-muted-foreground">Today compared with {comparison.period.toLowerCase()}</p></div><div className="flex rounded-md border bg-muted/40 p-1">{(["Last week", "Last month"] as ComparisonPeriod[]).map((option) => <button key={option} onClick={() => setPeriod(option)} className={cn("rounded px-3 py-1.5 text-xs font-medium", period === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{option}</button>)}</div></div><div className="mt-4 grid gap-3 md:grid-cols-3">{comparison.rows.map(([label, current, previous, unit]) => { const delta = current - previous; const better = label === "Avg days to active" ? delta <= 0 : delta <= 0; return <div key={label} className="rounded-lg border bg-background p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{current}{unit === "days" ? "d" : ""}</p></div><TonePill tone={delta === 0 ? "muted" : better ? "success" : "warning"}>{delta > 0 ? "+" : ""}{delta}{unit === "days" ? "d" : ""}</TonePill></div><p className="mt-2 text-xs text-muted-foreground">{previous}{unit === "days" ? "d" : ""} {comparison.period.toLowerCase()}</p></div>; })}</div></section>; }
function TableView({ records, query, setQuery, sortKey, setSortKey, openRecord, selectedIds, toggleSelected }: { records: PipelineRecord[]; query: string; setQuery: (q: string) => void; sortKey: "risk" | "days" | "revenue" | "name"; setSortKey: (s: "risk" | "days" | "revenue" | "name") => void; openRecord: (r: PipelineRecord) => void; selectedIds: string[]; toggleSelected: (id: string) => void }) { return <section className="rounded-lg border bg-card p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="relative w-96 max-w-full"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pipeline records…" /></div><Select value={sortKey} onValueChange={(v) => setSortKey(v as typeof sortKey)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{[["risk", "Risk"], ["days", "Days in Stage"], ["revenue", "Revenue Risk"], ["name", "Name"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div><div className="overflow-auto"><table className="w-full min-w-[1520px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Select", "Name", "Type", "State", "Clinic", "Current Pipeline Section", "Current Stage", "Owner", "Payor", "BCBA", "RBT", "Days in Stage", "Total Days", "Next Action", "Blockers", "Revenue Risk", "Alerts"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y">{records.map((r) => <tr key={r.id} onClick={() => openRecord(r)} className="cursor-pointer hover:bg-muted/40"><td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelected(r.id)} onClick={(event) => event.stopPropagation()} className="h-4 w-4 accent-primary" /></td><td className="px-3 py-3 font-medium">{r.name}</td><td>{r.type}</td><td>{r.state}</td><td>{r.clinic}</td><td>{r.section}</td><td>{r.stage}</td><td>{r.owner}</td><td>{r.payor}</td><td>{r.bcba}</td><td>{r.rbt}</td><td>{r.daysInStage}d</td><td>{r.totalDays}d</td><td className="max-w-64 truncate">{r.nextAction}</td><td>{r.blockers.length}</td><td>{currency.format(r.revenueRisk)}</td><td><TonePill tone={riskTone(r.risk)}>{r.risk}</TonePill></td></tr>)}</tbody></table></div></section>; }
function BottleneckView({ records, setSelectedSection, setView }: { records: PipelineRecord[]; setSelectedSection: (s: string) => void; setView: (v: ViewMode) => void }) { return <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">{bottleneckDefs.map(([title, section]) => { const rows = records.filter((r) => r.section === section && (r.daysInStage >= 6 || r.blockers.length || r.risk !== "Low")); return <button key={title} onClick={() => { setSelectedSection(section); setView("Table"); }} className="rounded-lg border bg-card p-4 text-left shadow-sm hover:shadow-md"><TonePill tone={rows.length ? "warning" : "success"}>{title}</TonePill><p className="mt-4 text-3xl font-semibold">{rows.length}</p><div className="mt-3 space-y-2 text-xs text-muted-foreground"><p>Oldest item: {rows[0]?.name ?? "—"}</p><p>Avg delay: {Math.round(rows.reduce((s, r) => s + r.daysInStage, 0) / Math.max(rows.length, 1))}d</p><p>Revenue impact: {currency.format(rows.reduce((s, r) => s + r.revenueRisk, 0))}</p><p>Primary owner: {rows[0]?.owner ?? "—"}</p></div></button>; })}</section>; }
function TimelineView({ records, openRecord }: { records: PipelineRecord[]; openRecord: (r: PipelineRecord) => void }) { const milestones = [["Lead created", "lead"], ["VOB completed", "vob"], ["Client conversion", "conversion"], ["Auth approval", "auth"], ["Assessment", "assessment"], ["QA approved", "qa"], ["Treatment auth", "treatmentAuth"], ["RBT assigned", "rbt"], ["Start date", "startDate"], ["Active", "active"]] as const; return <section className="rounded-lg border bg-card p-4"><div className="overflow-auto"><table className="w-full min-w-[1280px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="px-3 py-2">Record</th>{milestones.map(([label]) => <th key={label}>{label}</th>)}</tr></thead><tbody className="divide-y">{records.map((record) => <tr key={record.id} onClick={() => openRecord(record)} className="cursor-pointer hover:bg-muted/40"><td className="px-3 py-3 font-medium"><p>{record.name}</p><p className="text-xs text-muted-foreground">{record.section}</p></td>{milestones.map(([label, key]) => <td key={label}><span className={cn("rounded-md px-2 py-1 text-xs", record.dates[key] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{fmt(record.dates[key])}</span></td>)}</tr>)}</tbody></table></div></section>; }
function RevenueView({ records, setSelectedSection }: { records: PipelineRecord[]; setSelectedSection: (s: string) => void }) { const buckets = [["Expected revenue in financial review", "Benefits & Financial"], ["Revenue blocked by auth", "Authorization"], ["Revenue blocked by QA", "QA"], ["Revenue blocked by staffing", "Staffing"], ["Revenue blocked by scheduling", "Scheduling"], ["Active revenue", "Active Services"], ["Revenue at risk from reauth", "Reauth Loop"]] as const; const total = records.reduce((s, r) => s + r.revenue, 0); return <section className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr]"><div className="space-y-3">{buckets.map(([label, section]) => { const value = records.filter((r) => r.section === section).reduce((s, r) => s + (section === "Active Services" ? r.revenue : r.revenueRisk || r.revenue), 0); return <button key={label} onClick={() => setSelectedSection(section)} className="w-full rounded-lg border bg-card p-4 text-left hover:shadow-md"><div className="flex items-center justify-between"><p className="font-medium">{label}</p><p className="text-xl font-semibold">{currency.format(value)}</p></div><Progress className="mt-3 h-2" value={pct(value, Math.max(total, 1))} /></button>; })}</div><RecordList title="Revenue-linked records" records={[...records].sort((a, b) => b.revenueRisk - a.revenueRisk).slice(0, 12)} openRecord={() => {}} /></section>; }
function LiveAlertPanel({ alerts, setSelectedSection, openRecord }: { alerts: SlaAlert[]; setSelectedSection: (s: string) => void; openRecord: (r: PipelineRecord) => void }) { const top = alerts.slice(0, 6); const counts = { critical: alerts.filter((alert) => alert.severity === "critical").length, warning: alerts.filter((alert) => alert.severity === "warning").length }; return <section className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm xl:grid-cols-[280px_1fr]"><div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10 text-destructive"><AlertCircle className="h-5 w-5" /></span><div><h2 className="font-semibold">Live SLA alerts</h2><p className="text-xs text-muted-foreground">Updates from current records and filters</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><InfoBox label="Critical" value={String(counts.critical)} tone="destructive" /><InfoBox label="Warning" value={String(counts.warning)} tone="warning" /></div></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{top.length ? top.map((alert) => <button key={alert.id} onClick={() => openRecord(alert.record)} className="rounded-lg border bg-background p-3 text-left transition hover:bg-muted/40"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{alert.title}</p><p className="mt-1 text-xs text-muted-foreground">{alert.record.name} · {alert.record.owner}</p></div><TonePill tone={alert.severity === "critical" ? "destructive" : "warning"}>+{alert.daysOver}d</TonePill></div><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{alert.detail}</p><div className="mt-3 flex items-center justify-between"><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedSection(alert.section); }} className="text-xs font-medium text-primary hover:underline">Show {alert.section}</button><span className="text-[11px] text-muted-foreground">SLA {alert.threshold}d</span></div></button>) : <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">No SLA alerts in the current view.</div>}</div></section>; }
function RecordList({ title, records, openRecord, selectedIds = [], toggleSelected }: { title: string; records: PipelineRecord[]; openRecord: (r: PipelineRecord) => void; selectedIds?: string[]; toggleSelected?: (id: string) => void }) { return <section className="rounded-lg border bg-card p-4"><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{records.map((record) => <RecordCard key={record.id} record={record} onClick={() => openRecord(record)} selected={selectedIds.includes(record.id)} onSelect={toggleSelected ? () => toggleSelected(record.id) : undefined} />)}</div></section>; }
function RecordCard({ record, onClick, selected = false, onSelect }: { record: PipelineRecord; onClick: () => void; selected?: boolean; onSelect?: () => void }) { const sla = slaAlertsForRecord(record)[0]; return <button onClick={onClick} className={cn("w-full rounded-lg border bg-background p-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected && "border-primary bg-primary/5")}><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 gap-2">{onSelect && <input type="checkbox" checked={selected} onChange={onSelect} onClick={(event) => event.stopPropagation()} className="mt-0.5 h-4 w-4 accent-primary" />}<div className="min-w-0"><p className="truncate font-medium">{record.name}</p><p className="text-xs text-muted-foreground">{record.state} · {record.owner} · {record.daysInStage}d</p></div></div><TonePill tone={priorityTone(record.priority)}>{record.priority}</TonePill></div><p className="mt-2 text-xs text-muted-foreground">{record.nextAction}</p><div className="mt-3 flex flex-wrap gap-1.5"><TonePill tone={riskTone(record.risk)}>{record.risk}</TonePill>{sla && <TonePill tone={sla.severity === "critical" ? "destructive" : "warning"}>SLA +{sla.daysOver}d</TonePill>}{record.revenueRisk > 0 && <TonePill tone="warning">{currency.format(record.revenueRisk)} risk</TonePill>}{record.blockers[0] && <TonePill tone="destructive">{record.blockers[0]}</TonePill>}</div></button>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm text-foreground">{value}</p></div>; }
function DetailPanel({ record, onClose, onOpenClient, onCreateTask, onEscalate, onMove }: { record: PipelineRecord | null; onClose: () => void; onOpenClient: () => void; onCreateTask: () => void; onEscalate: () => void; onMove: () => void }) { return <Sheet open={Boolean(record)} onOpenChange={(open) => !open && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-3xl">{record && <><SheetHeader><SheetTitle>{record.name}</SheetTitle><SheetDescription>{record.section} · {record.stage} · {record.state} / {record.clinic} · Owner: {record.owner}</SheetDescription></SheetHeader><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={onOpenClient}><ExternalLink className="mr-2 h-4 w-4" />Open Full Client Record</Button><Button size="sm" variant="outline" onClick={() => { onCreateTask(); toast.success("Task created"); }}><Plus className="mr-2 h-4 w-4" />Create Task</Button><Button size="sm" variant="outline" onClick={() => toast.success("Note added to timeline") }><MessageSquare className="mr-2 h-4 w-4" />Add Note</Button><Button size="sm" variant="outline" onClick={() => toast.success("Document upload queued") }><Upload className="mr-2 h-4 w-4" />Upload Document</Button><Button size="sm" variant="outline" onClick={() => { onEscalate(); toast.success("Record escalated"); }}><Flag className="mr-2 h-4 w-4" />Escalate</Button><Button size="sm" onClick={onMove}><ArrowRight className="mr-2 h-4 w-4" />Move Stage</Button></div><div className="mt-4 grid grid-cols-4 gap-3"><InfoBox label="Risk" value={record.risk} tone={riskTone(record.risk)} /><InfoBox label="Days in stage" value={`${record.daysInStage}d`} /><InfoBox label="Revenue risk" value={currency.format(record.revenueRisk)} /><InfoBox label="Priority" value={record.priority} tone={priorityTone(record.priority)} /></div><Separator className="my-4" /><Tabs defaultValue="overview"><TabsList className="grid w-full grid-cols-6"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="stage">Stage Details</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger><TabsTrigger value="communications">Comms</TabsTrigger></TabsList><TabsList className="mt-2 grid w-full grid-cols-6"><TabsTrigger value="financial">Financial</TabsTrigger><TabsTrigger value="auth">Auth</TabsTrigger><TabsTrigger value="qa">QA</TabsTrigger><TabsTrigger value="staffing">Staffing</TabsTrigger><TabsTrigger value="scheduling">Scheduling</TabsTrigger><TabsTrigger value="reauth">Reauth</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-4 pt-4"><InfoGrid items={[["Current lifecycle position", record.section], ["Next action", record.nextAction], ["Owner", record.owner], ["Blockers", record.blockers.join(", ") || "None"], ["Days in stage", `${record.daysInStage}d`], ["Total days", `${record.totalDays}d`]]} /></TabsContent><TabsContent value="stage" className="pt-4"><Checklist record={record} /></TabsContent><TabsContent value="timeline" className="space-y-3 pt-4">{record.timeline.map((event) => <TimelineItem key={event.id} event={event} />)}</TabsContent><TabsContent value="tasks" className="space-y-2 pt-4">{record.tasks.map((task) => <Row key={task.id} title={task.title} meta={`${task.owner} · Due ${fmt(task.dueDate)}`} tone={task.completed ? "success" : task.blocker ? "destructive" : "warning"} label={task.completed ? "Complete" : "Open"} />)}</TabsContent><TabsContent value="documents" className="space-y-2 pt-4">{record.documents.map((doc) => <Row key={doc.name} title={doc.name} meta={doc.stage} label={doc.status} tone={doc.status === "Missing" ? "destructive" : doc.status === "Received" ? "success" : "warning"} />)}</TabsContent><TabsContent value="communications" className="space-y-2 pt-4">{record.communications.map((comm) => <Row key={`${comm.type}-${comm.date}`} title={`${comm.type} · ${comm.user}`} meta={`${fmt(comm.date)} · ${comm.text}`} label="Logged" />)}</TabsContent><TabsContent value="financial" className="pt-4"><InfoGrid items={[["VOB", record.financial.vob], ["Payment plan", record.financial.paymentPlan], ["Revenue estimate", currency.format(record.financial.estimate)], ["Revenue risk", currency.format(record.revenueRisk)]]} /></TabsContent><TabsContent value="auth" className="pt-4"><InfoGrid items={[["Initial auth", record.auth.initial], ["Treatment auth", record.auth.treatment], ["Reauth", record.auth.reauth], ["Payor", record.payor]]} /></TabsContent><TabsContent value="qa" className="pt-4"><InfoGrid items={[["Treatment plan status", record.qa.status], ["QA status", record.qa.status], ["Issues", record.qa.issues.join(", ") || "None"]]} /></TabsContent><TabsContent value="staffing" className="pt-4"><InfoGrid items={[["Assigned RBT", record.staffing.assignedRbt], ["Matching status", record.staffing.status], ["Restaffing", record.stage === "Restaffing Needed" ? "Required" : "No"]]} /></TabsContent><TabsContent value="scheduling" className="pt-4"><InfoGrid items={[["Schedule status", record.scheduling.status], ["Start date", fmt(record.scheduling.startDate)], ["CentralReach status", record.scheduling.centralReach]]} /></TabsContent><TabsContent value="reauth" className="pt-4"><InfoGrid items={[["Next reauth date", fmt(record.reauth.nextDate)], ["Progress report", record.reauth.progressReport], ["Risk level", record.reauth.risk]]} /></TabsContent></Tabs></>}</SheetContent></Sheet>; }
function InfoBox({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={cn("mt-1 font-semibold", tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-foreground")}>{value}</p></div>; }
function InfoGrid({ items }: { items: [string, string][] }) { return <div className="grid grid-cols-2 gap-3">{items.map(([label, value]) => <div key={label} className="rounded-lg border p-3"><Info label={label} value={value} /></div>)}</div>; }
function Checklist({ record }: { record: PipelineRecord }) { const required = ["Required tasks complete", "Required fields complete", "Required documents received", "No active blockers"]; const done = [record.tasks.every((t) => t.completed), record.bcba !== "Unassigned" || record.section === "Intake", !record.documents.some((d) => d.status === "Missing"), record.blockers.length === 0]; return <div className="space-y-2">{required.map((item, index) => <div key={item} className="flex items-center justify-between rounded-lg border p-3"><span>{item}</span><TonePill tone={done[index] ? "success" : "warning"}>{done[index] ? "Complete" : "Needed"}</TonePill></div>)}</div>; }
function TimelineItem({ event }: { event: PipelineEvent }) { return <div className="flex gap-3 rounded-lg border p-3"><div className={cn("mt-1 flex h-7 w-7 items-center justify-center rounded-md", event.type === "blocker" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>{event.type === "blocker" ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}</div><div><p className="font-medium">{event.title}</p><p className="text-sm text-muted-foreground">{event.description}</p><p className="text-xs text-muted-foreground">{fmt(event.date)} · {event.user}</p></div></div>; }
function Row({ title, meta, label, tone = "muted" }: { title: string; meta: string; label: string; tone?: string }) { return <div className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{meta}</p></div><TonePill tone={tone}>{label}</TonePill></div>; }
