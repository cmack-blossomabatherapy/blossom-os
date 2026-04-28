import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  Filter,
  ListChecks,
  MessageSquare,
  PanelRightOpen,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table2,
  UserCheck,
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
import { useClients } from "@/contexts/ClientsContext";
import type { Client } from "@/data/clients";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WorkMode = "queue" | "sla" | "table" | "flow" | "plan" | "notes" | "rbt" | "progress";
type QAStatus = "Awaiting Review" | "In Review" | "Issues Found" | "Corrections Needed" | "Ready for Submission" | "Submitted to Auth" | "Overdue";
type PlanStatus = "Missing" | "Submitted" | "In Review" | "Correction Requested" | "Approved";
type NoteStatus = "Clean" | "Flagged" | "Correction Due" | "Resolved";
type Severity = "Low" | "Medium" | "High" | "Critical";
type Risk = "Low" | "Moderate" | "High" | "Critical";
type IssueType = "None" | "Missing Treatment Plan" | "Missing Docs" | "Clinical Accuracy" | "Formatting" | "Signatures" | "NoteGuard Flag" | "Amerigroup Issue" | "Missing Notes" | "Progress Report Risk";

type ChecklistKey =
  | "planReceived"
  | "clientInfo"
  | "diagnosis"
  | "assessmentDate"
  | "goals"
  | "serviceHours"
  | "signatures"
  | "formatting"
  | "clinicalAccuracy"
  | "readyForAuth";

interface QARecord {
  id: string;
  clientId: string;
  clientName: string;
  parentName: string;
  provenance: string;
  state: string;
  clinic: string;
  payor: string;
  bcba: string;
  rbt: string;
  qaOwner: string;
  status: QAStatus;
  planStatus: PlanStatus;
  noteStatus: NoteStatus;
  issueType: IssueType;
  severity: Severity;
  risk: Risk;
  daysSinceAssessment: number;
  daysInQA: number;
  daysInStage: number;
  treatmentPlanSubmitted: string;
  dueDate: string;
  authExpiration: string;
  authStatus: "Not Submitted" | "Awaiting Submission" | "Submitted" | "Approved";
  authReadiness: "Blocked" | "Needs QA" | "Ready" | "Sent";
  nextAction: string;
  alerts: string[];
  notesFlagged: number;
  correctionOwner: string;
  correctionDue: string;
  newRbt: boolean;
  rbtStartDate: string;
  rbtCheckInStatus: "Due" | "Missed" | "Complete" | "Cleared";
  trainingStatus: "In Training" | "Supported" | "Cleared";
  progressReportStatus: "Not Needed" | "Received" | "Awaiting QA" | "Corrections Needed" | "Ready for Reauth";
  checklist: Record<ChecklistKey, boolean>;
  issues: { id: string; type: IssueType; description: string; owner: string; dueDate: string; resolved: boolean }[];
  documents: { name: string; type: string; present: boolean; required?: boolean; reason?: string }[];
  tasks: { id: string; title: string; owner: string; dueDate: string; completed: boolean }[];
  timeline: { date: string; event: string }[];
  comments: string[];
}

interface StarterQaSettings {
  taskTitle: string;
  dueOffsetDays: number;
  qaOwner: string;
}

const QA_OWNERS = ["Anje", "Mordy G.", "Lisa W.", "Priya N.", "QA Team", "Clinical Director"];
const BCBAS = ["Dr. Mia Hart", "Elena Ruiz", "Jordan Klein", "Nora Patel", "Caleb Stone", "Avery Brooks"];
const RBTS = ["Sofia Miles", "Noah Grant", "Camila Reed", "Ethan Fox", "Maya Chen", "Liam Price", "Harper Cole"];
const STATES = ["GA", "NC", "TN", "VA", "MD"];
const ISSUE_TYPES: IssueType[] = ["None", "Missing Treatment Plan", "Missing Docs", "Clinical Accuracy", "Formatting", "Signatures", "NoteGuard Flag", "Amerigroup Issue", "Missing Notes", "Progress Report Risk"];
const CHECKLIST: { key: ChecklistKey; label: string }[] = [
  { key: "planReceived", label: "Treatment plan received" },
  { key: "clientInfo", label: "Client info correct" },
  { key: "diagnosis", label: "Diagnosis info present" },
  { key: "assessmentDate", label: "Assessment date present" },
  { key: "goals", label: "Goals included" },
  { key: "serviceHours", label: "Service hours included" },
  { key: "signatures", label: "Required signatures present" },
  { key: "formatting", label: "Formatting complete" },
  { key: "clinicalAccuracy", label: "Clinical accuracy checked" },
  { key: "readyForAuth", label: "Ready for auth submission" },
];

const today = new Date("2026-04-28T12:00:00");
const isoDaysAgo = (days: number) => new Date(today.getTime() - days * 86400000).toISOString().slice(0, 10);
const isoDaysAhead = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
const missingChecklistItems = (record: QARecord) => CHECKLIST.filter((item) => !record.checklist[item.key]);
const allChecked = (record: QARecord) => Object.values(record.checklist).every(Boolean) && record.issues.every((issue) => issue.resolved);
const qaWaitingOverSla = (record: QARecord) => record.daysInQA >= 3 && record.status !== "Ready for Submission" && record.status !== "Submitted to Auth";
const treatmentPlanOverdue = (record: QARecord) => record.daysSinceAssessment >= 14 && record.status !== "Submitted to Auth" && record.planStatus !== "Approved";
const slaRulesFor = (record: QARecord) => [
  qaWaitingOverSla(record) ? "3+ days waiting in QA" : "",
  treatmentPlanOverdue(record) ? "Treatment plan overdue 14+ days" : "",
  record.status === "Overdue" ? "Overdue status" : "",
  record.alerts.find((alert) => alert.toLowerCase().includes("overdue")) ?? "",
].filter(Boolean);
const correctionTaskFor = (record: QARecord, title: string, dueInDays = 2) => ({
  id: `task-${Date.now()}`,
  title,
  owner: record.correctionOwner || record.bcba,
  dueDate: isoDaysAhead(dueInDays),
  completed: false,
});

const hasClientDocument = (client: Client, terms: string[]) => client.documents.some((doc) => {
  const value = `${doc.name} ${doc.type}`.toLowerCase();
  return terms.some((term) => value.includes(term));
});

const documentRequirementsFor = (client: Client, treatmentPlanReceived: boolean) => [
  { name: "Treatment plan", type: "Treatment Plan", present: treatmentPlanReceived || hasClientDocument(client, ["treatment plan", "plan"]), checklistKey: "planReceived" as ChecklistKey, reason: "Required before QA can approve auth handoff." },
  { name: "Assessment report", type: "Assessment", present: hasClientDocument(client, ["assessment", "eval", "evaluation"]) || Boolean(client.assessmentDate), checklistKey: "assessmentDate" as ChecklistKey, reason: "Required to verify assessment date and clinical source data." },
  { name: "Parent consent", type: "Supporting", present: hasClientDocument(client, ["consent"]) || Boolean(client.consentComplete), checklistKey: "clientInfo" as ChecklistKey, reason: "Required to validate family consent and client demographics." },
  { name: "Initial authorization letter", type: "Authorization", present: hasClientDocument(client, ["auth letter", "authorization letter", "initial auth"]), checklistKey: "readyForAuth" as ChecklistKey, reason: "Required to confirm the plan is tied to the approved assessment authorization." },
  { name: "BCBA signature page", type: "Signature", present: hasClientDocument(client, ["signature", "signed", "bcba"]), checklistKey: "signatures" as ChecklistKey, reason: "Required for clinical sign-off before submission." },
];

const statusVariant = (status: QAStatus): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  if (status === "Ready for Submission" || status === "Submitted to Auth") return "success";
  if (status === "In Review") return "warning";
  if (status === "Awaiting Review") return "info";
  if (status === "Overdue" || status === "Issues Found" || status === "Corrections Needed") return "destructive";
  return "muted";
};

const noteVariant = (status: NoteStatus): "success" | "warning" | "destructive" | "muted" => {
  if (status === "Resolved" || status === "Clean") return "success";
  if (status === "Correction Due") return "warning";
  return "destructive";
};

const buildRecords = (clients: Client[]): QARecord[] => {
  const baseClients = clients.length ? clients : [];
  const statuses: QAStatus[] = ["Awaiting Review", "In Review", "Issues Found", "Corrections Needed", "Ready for Submission", "Submitted to Auth", "Overdue"];
  return Array.from({ length: 22 }).map((_, index) => {
    const client = baseClients[index % Math.max(baseClients.length, 1)];
    const status = statuses[index % statuses.length];
    const issueType: IssueType = status === "Issues Found" ? ISSUE_TYPES[(index % 8) + 2] : status === "Corrections Needed" ? "Clinical Accuracy" : index % 6 === 0 ? "Amerigroup Issue" : index % 5 === 0 ? "NoteGuard Flag" : "None";
    const isReady = status === "Ready for Submission" || status === "Submitted to Auth";
    const daysInQA = [1, 2, 4, 6, 0, 3, 15][index % 7];
    const checklist = CHECKLIST.reduce((acc, item, cIndex) => ({ ...acc, [item.key]: isReady || cIndex < (index % 9) + 1 }), {} as Record<ChecklistKey, boolean>);
    const alerts = [
      daysInQA > 3 && status !== "Submitted to Auth" ? "QA review waiting over 3 days" : "",
      status === "Overdue" ? "Treatment plan overdue after 14 days" : "",
      issueType === "Amerigroup Issue" ? "Amerigroup note issue" : "",
      issueType === "NoteGuard Flag" ? "NoteGuard flag" : "",
      index % 9 === 0 ? "New RBT check-in missed" : "",
      index % 8 === 0 ? "Missing required documents" : "",
      status === "Corrections Needed" ? "Issues unresolved over 2 days" : "",
      status !== "Ready for Submission" && status !== "Submitted to Auth" ? "QA blocking auth submission" : "",
      index % 11 === 0 ? "No QA owner assigned" : "",
    ].filter(Boolean);
    const name = client?.childName ?? `Client ${index + 1}`;
    return {
      id: `qa-${index + 1}`,
      clientId: client?.id ?? `client-${index + 1}`,
      clientName: name,
      parentName: client?.parentName ?? "Parent contact",
      provenance: client?.assessmentDate ? `Assessment ${client.assessmentDate}` : "Demo assessment/treatment plan",
      state: client?.state ?? STATES[index % STATES.length],
      clinic: client?.clinic ?? `${STATES[index % STATES.length]} Clinic`,
      payor: client?.payor ?? ["Amerigroup", "Aetna", "BCBS", "United", "Medicaid"][index % 5],
      bcba: client?.bcba ?? BCBAS[index % BCBAS.length],
      rbt: client?.rbt ?? RBTS[index % RBTS.length],
      qaOwner: index % 11 === 0 ? "Unassigned" : QA_OWNERS[index % QA_OWNERS.length],
      status,
      planStatus: status === "Overdue" ? "Missing" : status === "Corrections Needed" ? "Correction Requested" : isReady ? "Approved" : "In Review",
      noteStatus: issueType === "NoteGuard Flag" || issueType === "Amerigroup Issue" || issueType === "Missing Notes" ? "Flagged" : index % 4 === 0 ? "Correction Due" : "Clean",
      issueType,
      severity: alerts.length > 2 ? "Critical" : alerts.length ? "High" : index % 3 === 0 ? "Medium" : "Low",
      risk: alerts.length > 2 ? "Critical" : alerts.length ? "High" : "Moderate",
      daysSinceAssessment: 5 + index,
      daysInQA,
      daysInStage: daysInQA || 1,
      treatmentPlanSubmitted: status === "Overdue" ? "—" : isoDaysAgo(2 + index),
      dueDate: isoDaysAhead(index % 4 - 1),
      authExpiration: isoDaysAhead(18 + index * 3),
      authStatus: status === "Submitted to Auth" ? "Awaiting Submission" : "Not Submitted",
      authReadiness: status === "Submitted to Auth" ? "Sent" : isReady ? "Ready" : status === "Awaiting Review" ? "Needs QA" : "Blocked",
      nextAction: status === "Awaiting Review" ? "Start QA review" : status === "In Review" ? "Complete checklist" : status === "Issues Found" ? "Create fix task" : status === "Corrections Needed" ? "Notify BCBA for corrections" : isReady ? "Send to authorization" : "Escalate overdue plan",
      alerts,
      notesFlagged: issueType === "None" ? index % 2 : (index % 4) + 1,
      correctionOwner: status === "Corrections Needed" ? BCBAS[index % BCBAS.length] : QA_OWNERS[index % QA_OWNERS.length],
      correctionDue: isoDaysAhead((index % 3) + 1),
      newRbt: index % 5 === 0 || Boolean(client?.newRbtStartDate),
      rbtStartDate: client?.newRbtStartDate ?? isoDaysAgo(index % 10),
      rbtCheckInStatus: index % 9 === 0 ? "Missed" : index % 5 === 0 ? "Due" : index % 4 === 0 ? "Cleared" : "Complete",
      trainingStatus: index % 5 === 0 ? "Supported" : index % 4 === 0 ? "Cleared" : "In Training",
      progressReportStatus: index % 6 === 0 ? "Received" : index % 6 === 1 ? "Awaiting QA" : index % 6 === 2 ? "Corrections Needed" : index % 6 === 3 ? "Ready for Reauth" : "Not Needed",
      checklist,
      issues: issueType === "None" ? [] : [{ id: `issue-${index}`, type: issueType, description: `${issueType} requires QA correction before auth handoff.`, owner: BCBAS[index % BCBAS.length], dueDate: isoDaysAhead(2), resolved: false }],
      documents: [
        { name: "Treatment plan", type: "Treatment Plan", present: status !== "Overdue" },
        { name: "Assessment report", type: "Assessment", present: true },
        { name: "Parent consent", type: "Supporting", present: index % 8 !== 0 },
        { name: "Progress report", type: "Reauth", present: index % 6 < 4 },
        { name: "QA notes", type: "QA", present: true },
      ],
      tasks: [
        { id: `task-${index}-1`, title: "Review treatment plan", owner: QA_OWNERS[index % QA_OWNERS.length], dueDate: isoDaysAhead(1), completed: isReady },
        { id: `task-${index}-2`, title: "Resolve documentation issue", owner: BCBAS[index % BCBAS.length], dueDate: isoDaysAhead(2), completed: issueType === "None" },
        { id: `task-${index}-3`, title: "Prepare auth handoff", owner: "Authorization Team", dueDate: isoDaysAhead(3), completed: status === "Submitted to Auth" },
      ],
      timeline: [
        { date: isoDaysAgo(14 + index), event: "Assessment completed" },
        { date: isoDaysAgo(10 + index), event: "Treatment plan due" },
        { date: status === "Overdue" ? "—" : isoDaysAgo(4 + index), event: "Treatment plan submitted" },
        { date: isoDaysAgo(daysInQA), event: "QA started" },
        ...(issueType !== "None" ? [{ date: isoDaysAgo(1), event: `Issue found: ${issueType}` }] : []),
      ],
      comments: ["Connected QA record generated from Blossom demo client data."],
    };
  });
};

const qaRecordFromClient = (client: Client, index: number, starterSettings: StarterQaSettings): QARecord => {
  const treatmentAuth = client.authorizations.find((auth) => auth.type === "Treatment" || auth.treatmentPlanReceived || auth.treatmentPlanLinked);
  const treatmentPlanReceived = Boolean(treatmentAuth?.treatmentPlanReceived || treatmentAuth?.treatmentPlanLinked);
  const requirements = documentRequirementsFor(client, treatmentPlanReceived);
  const missingRequirements = requirements.filter((requirement) => !requirement.present);
  const checklist = CHECKLIST.reduce((acc, item) => ({
    ...acc,
    [item.key]: item.key === "planReceived" ? requirements.find((requirement) => requirement.checklistKey === "planReceived")?.present ?? false : !requirements.some((requirement) => requirement.checklistKey === item.key && !requirement.present),
  }), {} as Record<ChecklistKey, boolean>);
  const missingAlerts = missingRequirements.map((requirement) => `Missing ${requirement.name}`);
  const missingTasks = missingRequirements.map((requirement, requirementIndex) => ({ id: `task-doc-${Date.now()}-${requirementIndex}`, title: `Upload ${requirement.name}`, owner: client.bcba ?? "Clinical Team", dueDate: isoDaysAhead(requirementIndex === 0 ? 1 : 2), completed: false }));
  const missingIssues = missingRequirements.map((requirement, requirementIndex) => ({ id: `issue-doc-${Date.now()}-${requirementIndex}`, type: requirement.name === "Treatment plan" ? "Missing Treatment Plan" as IssueType : "Missing Docs" as IssueType, description: `${requirement.name} is required. ${requirement.reason}`, owner: client.bcba ?? "Clinical Team", dueDate: isoDaysAhead(requirementIndex === 0 ? 1 : 2), resolved: false }));
  const provenanceDate = treatmentAuth?.submittedDate ?? treatmentAuth?.approvedDate ?? client.assessmentDate ?? "date pending";
  const provenance = treatmentAuth ? `${treatmentAuth.payor ?? client.payor} treatment plan · ${provenanceDate}` : `Assessment · ${provenanceDate}`;
  return {
    id: `qa-new-${Date.now()}`,
    clientId: client.id,
    clientName: client.childName,
    parentName: client.parentName,
    provenance,
    state: client.state,
    clinic: client.clinic,
    payor: treatmentAuth?.payor ?? client.payor,
    bcba: client.bcba ?? BCBAS[index % BCBAS.length],
    rbt: client.rbt ?? "Unassigned",
    qaOwner: starterSettings.qaOwner,
    status: "Awaiting Review",
    planStatus: treatmentPlanReceived ? "Submitted" : "Missing",
    noteStatus: client.notesComplianceStatus === "Flagged" ? "Flagged" : "Clean",
    issueType: missingRequirements.some((requirement) => requirement.name === "Treatment plan") ? "Missing Treatment Plan" : missingRequirements.length ? "Missing Docs" : "None",
    severity: missingRequirements.length > 2 ? "Critical" : missingRequirements.length ? "High" : "Medium",
    risk: missingRequirements.length > 2 ? "Critical" : missingRequirements.length ? "High" : "Moderate",
    daysSinceAssessment: client.daysSinceAssessment ?? 0,
    daysInQA: 0,
    daysInStage: 0,
    treatmentPlanSubmitted: treatmentPlanReceived ? isoDaysAgo(0) : "—",
    dueDate: isoDaysAhead(3),
    authExpiration: treatmentAuth?.expirationDate ?? isoDaysAhead(30),
    authStatus: "Not Submitted",
    authReadiness: missingRequirements.length ? "Blocked" : "Needs QA",
    nextAction: missingRequirements.length ? "Upload missing QA attachments" : "Start QA review",
    alerts: ["Awaiting QA Review", ...missingAlerts, ...(missingRequirements.length ? ["QA blocking auth submission"] : [])],
    notesFlagged: client.noteguardFlags ?? 0,
    correctionOwner: client.bcba ?? "Clinical Team",
    correctionDue: isoDaysAhead(2),
    newRbt: Boolean(client.newRbtStartDate),
    rbtStartDate: client.newRbtStartDate ?? isoDaysAgo(0),
    rbtCheckInStatus: "Complete",
    trainingStatus: "Supported",
    progressReportStatus: "Not Needed",
    checklist,
    issues: missingIssues,
    documents: [...requirements.map(({ checklistKey, ...requirement }) => ({ ...requirement, required: true })), { name: "QA notes", type: "QA", present: true, required: false }],
    tasks: [{ id: `task-${Date.now()}`, title: starterSettings.taskTitle, owner: starterSettings.qaOwner, dueDate: isoDaysAhead(starterSettings.dueOffsetDays), completed: false }, ...missingTasks],
    timeline: [
      { date: client.assessmentDate ?? isoDaysAgo(client.daysSinceAssessment ?? 0), event: "Assessment/treatment plan selected for QA" },
      ...(missingRequirements.length ? [{ date: isoDaysAgo(0), event: `Document requirements generated: ${missingRequirements.map((requirement) => requirement.name).join(", ")}` }] : []),
      { date: isoDaysAgo(0), event: "New QA Review created: Awaiting QA Review" },
    ],
    comments: ["QA review created from existing assessment/treatment plan."],
  };
};

export default function QA() {
  const navigate = useNavigate();
  const { clients, updateClient, addTask, appendTimeline, appendAutomation } = useClients();
  const [records, setRecords] = useState<QARecord[]>(() => buildRecords(clients));
  const [mode, setMode] = useState<WorkMode>("queue");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>(records[0]?.id ?? "");
  const [panelTab, setPanelTab] = useState("overview");
  const [filters, setFilters] = useState({ state: "all", owner: "all", bcba: "all", rbt: "all", payor: "all", status: "all", issue: "all", plan: "all", note: "all", date: "all" });
  const [comment, setComment] = useState("");
  const [newReviewOpen, setNewReviewOpen] = useState(false);
  const [newReviewClientId, setNewReviewClientId] = useState(clients[0]?.id ?? "");
  const [starterSettings, setStarterSettings] = useState<StarterQaSettings>({ taskTitle: "Start treatment plan QA review", dueOffsetDays: 1, qaOwner: "QA Team" });

  const selected = records.find((record) => record.id === selectedId) ?? records[0];
  const bcbas = useMemo(() => Array.from(new Set(records.map((r) => r.bcba))).sort(), [records]);
  const rbts = useMemo(() => Array.from(new Set(records.map((r) => r.rbt))).sort(), [records]);
  const payors = useMemo(() => Array.from(new Set(records.map((r) => r.payor))).sort(), [records]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter((r) => {
      const matchesQuery = !q || [r.clientName, r.parentName, r.bcba, r.rbt, r.qaOwner, r.payor, r.nextAction].some((v) => v.toLowerCase().includes(q));
      return matchesQuery &&
        (filters.state === "all" || r.state === filters.state) &&
        (filters.owner === "all" || r.qaOwner === filters.owner) &&
        (filters.bcba === "all" || r.bcba === filters.bcba) &&
        (filters.rbt === "all" || r.rbt === filters.rbt) &&
        (filters.payor === "all" || r.payor === filters.payor) &&
        (filters.status === "all" || r.status === filters.status) &&
        (filters.issue === "all" || r.issueType === filters.issue) &&
        (filters.plan === "all" || r.planStatus === filters.plan) &&
        (filters.note === "all" || r.noteStatus === filters.note);
    });
  }, [filters, query, records]);

  const metrics = [
    { label: "Awaiting Review", value: records.filter((r) => r.status === "Awaiting Review").length, mode: "queue" as WorkMode, filter: "Awaiting Review", icon: ClipboardCheck },
    { label: "In Review", value: records.filter((r) => r.status === "In Review").length, mode: "flow" as WorkMode, filter: "In Review", icon: ListChecks },
    { label: "Issues Found", value: records.filter((r) => r.status === "Issues Found").length, mode: "queue" as WorkMode, filter: "Issues Found", icon: ShieldAlert },
    { label: "Corrections Needed", value: records.filter((r) => r.status === "Corrections Needed").length, mode: "queue" as WorkMode, filter: "Corrections Needed", icon: MessageSquare },
    { label: "Ready for Submission", value: records.filter((r) => r.status === "Ready for Submission").length, mode: "plan" as WorkMode, filter: "Ready for Submission", icon: ShieldCheck },
    { label: "SLA Alerts", value: records.filter((r) => slaRulesFor(r).length > 0).length, mode: "sla" as WorkMode, filter: "all", icon: AlertTriangle },
    { label: "Notes Flagged", value: records.filter((r) => r.noteStatus === "Flagged" || r.notesFlagged > 0).length, mode: "notes" as WorkMode, filter: "all", icon: FileText },
    { label: "New RBT Check-ins", value: records.filter((r) => r.newRbt && r.rbtCheckInStatus !== "Cleared").length, mode: "rbt" as WorkMode, filter: "all", icon: UserCheck },
  ];

  const patchRecord = (id: string, patch: Partial<QARecord>, event?: string) => {
    if (patch.status === "Ready for Submission") {
      const record = records.find((item) => item.id === id);
      if (record && !allChecked(record)) {
        const missing = missingChecklistItems(record).map((item) => item.label);
        toast.error("Treatment Plan Review gate incomplete", {
          description: missing.length ? `Finish: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` +${missing.length - 3} more` : ""}` : "Resolve all QA issues before marking ready.",
        });
        return;
      }
    }
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...patch, timeline: event ? [...record.timeline, { date: isoDaysAgo(0), event }] : record.timeline } : record));
  };

  const bulkPatch = (patch: Partial<QARecord>, message: string) => {
    setRecords((current) => current.map((record) => selectedIds.includes(record.id) ? { ...record, ...patch, timeline: [...record.timeline, { date: isoDaysAgo(0), event: message }] } : record));
    toast.success(`${selectedIds.length} QA records updated`);
  };

  const startReview = (record: QARecord) => {
    patchRecord(record.id, { status: "In Review", planStatus: "In Review", daysInQA: Math.max(1, record.daysInQA), nextAction: "Complete QA checklist" }, "QA started");
    toast.success("QA review started");
  };

  const markIssues = async (record: QARecord, issue: IssueType = "Clinical Accuracy") => {
    const correctionTask = correctionTaskFor(record, `Correct QA issue: ${issue}`, 2);
    patchRecord(record.id, {
      status: "Issues Found",
      issueType: issue,
      severity: "High",
      risk: "High",
      authReadiness: "Blocked",
      alerts: Array.from(new Set([...record.alerts, "Issues unresolved over 2 days", "QA blocking auth submission"])),
      issues: [...record.issues, { id: `issue-${Date.now()}`, type: issue, description: `${issue} correction required.`, owner: record.bcba, dueDate: isoDaysAhead(2), resolved: false }],
      tasks: [correctionTask, ...record.tasks],
      nextAction: `Correction due ${correctionTask.dueDate}`,
    }, `Issues found: ${issue}; correction task due ${correctionTask.dueDate}`);
    await addTask(record.clientId, { id: `qa-fix-${Date.now()}`, title: correctionTask.title, dueDate: correctionTask.dueDate, completed: false });
    await appendAutomation(record.clientId, `QA issue automation created correction task due ${correctionTask.dueDate}`);
    toast.error("Issue logged and correction task created", { description: `Due ${correctionTask.dueDate}` });
  };

  const requestCorrection = async (record: QARecord) => {
    const correctionTask = correctionTaskFor(record, "Complete QA requested treatment plan correction", 2);
    patchRecord(record.id, { status: "Corrections Needed", planStatus: "Correction Requested", nextAction: `Correction due ${correctionTask.dueDate}`, alerts: Array.from(new Set([...record.alerts, "Issues unresolved over 2 days"])), tasks: [correctionTask, ...record.tasks] }, `Correction requested; task due ${correctionTask.dueDate}`);
    await addTask(record.clientId, { id: `qa-correction-${Date.now()}`, title: correctionTask.title, dueDate: correctionTask.dueDate, completed: false });
    await appendTimeline(record.clientId, "QA requested BCBA correction", "qa");
    await appendAutomation(record.clientId, `QA correction automation created task due ${correctionTask.dueDate}`);
    toast.success("BCBA correction task created", { description: `Due ${correctionTask.dueDate}` });
  };

  const resolveIssue = (record: QARecord, issueId?: string) => {
    const issues = record.issues.map((issue) => !issueId || issue.id === issueId ? { ...issue, resolved: true } : issue);
    patchRecord(record.id, { issues, status: "In Review", issueType: issues.every((i) => i.resolved) ? "None" : record.issueType, nextAction: "Complete final QA review" }, "Issue resolved; returned to In Review");
    toast.success("Issue resolved");
  };

  const toggleChecklist = (record: QARecord, key: ChecklistKey, value: boolean) => {
    const checklist = { ...record.checklist, [key]: value };
    const ready = Object.values(checklist).every(Boolean) && record.issues.every((i) => i.resolved);
    patchRecord(record.id, { checklist, nextAction: ready ? "Mark ready for submission" : "Complete QA checklist" }, ready ? "Checklist complete" : undefined);
  };

  const markReady = async (record: QARecord) => {
    if (!allChecked(record)) {
      const missing = missingChecklistItems(record).map((item) => item.label);
      toast.error("Treatment Plan Review gate incomplete", {
        description: missing.length ? `Finish: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` +${missing.length - 3} more` : ""}` : "Resolve all QA issues before marking ready.",
      });
      return;
    }
    patchRecord(record.id, { status: "Ready for Submission", planStatus: "Approved", authReadiness: "Ready", risk: "Low", nextAction: "Send to Auth", tasks: record.tasks.map((task) => task.title.includes("Review") || task.title.includes("Resolve") ? { ...task, completed: true } : task) }, "QA approved and ready for auth submission");
    await updateClient(record.clientId, { stage: "Treatment Auth – Awaiting Submission", qaStatus: "Complete", nextAction: "Submit treatment authorization", readyForAuth: true });
    await appendTimeline(record.clientId, "QA marked treatment plan ready for submission", "qa");
    await appendAutomation(record.clientId, "QA approval updated treatment authorization readiness");
    toast.success("QA ready for submission");
  };

  const sendToAuth = async (record: QARecord) => {
    const readyRecord = allChecked(record) || record.status === "Ready for Submission";
    if (!readyRecord) {
      toast.error("QA must be ready before sending to Auth");
      return;
    }
    patchRecord(record.id, { status: "Submitted to Auth", authStatus: "Awaiting Submission", authReadiness: "Sent", nextAction: "Auth team submission queued", tasks: record.tasks.map((task) => task.title.includes("auth") || task.title.includes("handoff") || task.title.includes("Prepare") ? { ...task, completed: true } : task) }, "Sent to authorization workspace");
    await updateClient(record.clientId, { stage: "Treatment Auth – Awaiting Submission", authStatus: "Not Submitted", qaStatus: "Complete", nextAction: "Authorization awaiting submission", readyForAuth: true });
    await appendTimeline(record.clientId, "QA sent treatment auth package to authorization", "auth");
    toast.success("Sent to Authorization");
  };

  const resolveNote = async (record: QARecord) => {
    patchRecord(record.id, { noteStatus: "Resolved", notesFlagged: 0, alerts: record.alerts.filter((a) => !a.includes("note") && !a.includes("Amerigroup") && !a.includes("NoteGuard")), nextAction: "Continue QA review" }, "Note compliance issue resolved");
    await appendTimeline(record.clientId, "QA marked note compliance issue resolved", "qa");
    await appendAutomation(record.clientId, "Note compliance resolution updated QA timeline");
    toast.success("Note issue resolved");
  };

  const createCorrectionTask = async (record: QARecord) => {
    const task = correctionTaskFor(record, "Resolve note compliance correction", 1);
    patchRecord(record.id, { tasks: [task, ...record.tasks], nextAction: `Note correction due ${task.dueDate}` }, `Note correction task created; due ${task.dueDate}`);
    await addTask(record.clientId, { id: `qa-task-${Date.now()}`, title: task.title, dueDate: task.dueDate, completed: false });
    await appendTimeline(record.clientId, `QA created note correction task due ${task.dueDate}`, "qa");
    await appendAutomation(record.clientId, `Note compliance automation created correction task due ${task.dueDate}`);
    toast.success("Correction task created", { description: `Due ${task.dueDate}` });
  };

  const notifyNoteOwner = async (record: QARecord, owner: "RBT" | "BCBA") => {
    const recipient = owner === "RBT" ? record.rbt : record.bcba;
    patchRecord(record.id, { nextAction: `${owner} notified for note correction`, alerts: Array.from(new Set([...record.alerts, `${owner} notified for note correction`])) }, `${owner} notified: ${recipient}`);
    await appendTimeline(record.clientId, `QA notified ${owner} ${recipient} for note correction`, "qa");
    await appendAutomation(record.clientId, `Note compliance notification sent to ${owner}`);
    toast.success(`${owner} notified`, { description: recipient });
  };

  const addComment = (record: QARecord) => {
    if (!comment.trim()) return;
    patchRecord(record.id, { comments: [...record.comments, comment.trim()] }, `QA comment added: ${comment.trim()}`);
    setComment("");
    toast.success("QA comment added");
  };

  const openRecord = (record: QARecord) => {
    setSelectedId(record.id);
    setPanelTab("overview");
  };

  const focusQaRecord = (record: QARecord, tab = "checklist") => {
    setSelectedId(record.id);
    setSelectedIds([record.id]);
    setPanelTab(tab);
    setMode("queue");
    setQuery("");
    setFilters((current) => ({ ...current, status: "all", issue: "all", plan: "all", note: "all" }));
    setNewReviewOpen(false);
  };

  const createQaReview = async () => {
    const client = clients.find((item) => item.id === newReviewClientId);
    if (!client) return toast.error("Select an assessment or treatment plan first");
    const record = qaRecordFromClient(client, records.length, starterSettings);
    setRecords((current) => [record, ...current]);
    focusQaRecord(record);
    setFilters((current) => ({ ...current, status: "Awaiting Review", issue: "all", plan: "all", note: "all" }));
    await updateClient(client.id, { stage: "QA Review", qaStatus: "In Review", nextAction: record.issues.length ? "Upload missing QA attachments" : "Start QA review" });
    await addTask(client.id, { id: `qa-start-${Date.now()}`, title: starterSettings.taskTitle, dueDate: isoDaysAhead(starterSettings.dueOffsetDays), completed: false });
    await Promise.all(record.tasks.filter((task) => task.title.startsWith("Upload ")).map((task) => addTask(client.id, task)));
    await appendTimeline(client.id, "New QA Review created from existing assessment/treatment plan", "qa");
    if (record.issues.length) await appendTimeline(client.id, `QA document requirements generated: ${record.documents.filter((doc) => doc.required && !doc.present).map((doc) => doc.name).join(", ")}`, "qa");
    toast.success("New QA Review created", { description: "Initial status set to Awaiting QA Review." });
  };

  const reuseQaReview = (record: QARecord) => {
    focusQaRecord(record);
    toast.info("Existing QA Review opened", { description: `${record.clientName} is focused on the checklist tab.` });
  };

  return (
    <PageShell
      title="QA & Compliance"
      description="Review treatment plans, resolve documentation issues, monitor notes, and prepare cases for auth submission."
      icon={ClipboardCheck}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setNewReviewOpen(true)}><Plus className="h-4 w-4" />New QA Review</Button>
          <Button size="sm" variant="outline" onClick={() => selectedIds.length ? bulkPatch({ qaOwner: "QA Team" }, "Bulk assigned QA owner") : toast.info("Select rows first")}>Bulk Actions</Button>
          <Button size="sm" variant="outline"><Download className="h-4 w-4" />Export</Button>
          <Button size="sm" variant="outline"><Sparkles className="h-4 w-4" />Saved Views</Button>
          <Button size="sm" variant="outline"><ListChecks className="h-4 w-4" />QA Checklist Templates</Button>
          <Button size="sm" variant="outline" onClick={() => setMode("notes")}><FileText className="h-4 w-4" />Note Review Queue</Button>
        </div>
      }
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {metrics.map(({ label, value, mode: nextMode, filter, icon: Icon }) => (
          <button key={label} type="button" onClick={() => { setMode(nextMode); setFilters((f) => ({ ...f, status: filter === "all" ? "all" : filter })); }} className="rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30">
            <div className="mb-3 flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
            <p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p>
          </button>
        ))}
      </section>

      <section className="rounded-lg border border-border/60 bg-card p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-[280px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client, QA owner, BCBA, RBT, payor, next action…" className="pl-9" /></div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect value={filters.state} onChange={(v) => setFilters((f) => ({ ...f, state: v }))} label="State" items={STATES} />
            <FilterSelect value={filters.owner} onChange={(v) => setFilters((f) => ({ ...f, owner: v }))} label="QA Owner" items={["Unassigned", ...QA_OWNERS]} />
            <FilterSelect value={filters.bcba} onChange={(v) => setFilters((f) => ({ ...f, bcba: v }))} label="BCBA" items={bcbas} />
            <FilterSelect value={filters.rbt} onChange={(v) => setFilters((f) => ({ ...f, rbt: v }))} label="RBT" items={rbts} />
            <FilterSelect value={filters.payor} onChange={(v) => setFilters((f) => ({ ...f, payor: v }))} label="Payor" items={payors} />
            <FilterSelect value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} label="QA Status" items={["Awaiting Review", "In Review", "Issues Found", "Corrections Needed", "Ready for Submission", "Submitted to Auth", "Overdue"]} />
            <FilterSelect value={filters.issue} onChange={(v) => setFilters((f) => ({ ...f, issue: v }))} label="Issue Type" items={ISSUE_TYPES} />
            <FilterSelect value={filters.plan} onChange={(v) => setFilters((f) => ({ ...f, plan: v }))} label="Plan Status" items={["Missing", "Submitted", "In Review", "Correction Requested", "Approved"]} />
            <FilterSelect value={filters.note} onChange={(v) => setFilters((f) => ({ ...f, note: v }))} label="Note Status" items={["Clean", "Flagged", "Correction Due", "Resolved"]} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["queue", "Queue View", ClipboardCheck], ["sla", "SLA Queue", AlertTriangle], ["table", "Table View", Table2], ["flow", "QA Flow View", PanelRightOpen], ["plan", "Treatment Plan Review", FileCheck2], ["notes", "Note Compliance View", FileText], ["rbt", "New RBT Monitoring", UserCheck], ["progress", "Progress Report Review", ShieldCheck],
          ].map(([key, label, Icon]) => (
            <Button key={key as string} size="sm" variant={mode === key ? "default" : "outline"} onClick={() => setMode(key as WorkMode)}><Icon className="h-4 w-4" />{label as string}</Button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          {mode === "queue" && <QueueView records={filtered} onOpen={openRecord} onStart={startReview} onIssue={markIssues} onCorrection={requestCorrection} onReady={markReady} onAuth={sendToAuth} onTask={createCorrectionTask} onOpenClient={(id) => navigate(`/clients/${id}`)} />}
          {mode === "sla" && <SlaQueueView records={filtered} onOpen={openRecord} onStart={startReview} onIssue={markIssues} onCorrection={requestCorrection} onTask={createCorrectionTask} />}
          {mode === "table" && <TableView records={filtered} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onOpen={openRecord} onPatch={patchRecord} onBulkNotify={() => bulkPatch({ nextAction: "BCBA notified" }, "Bulk notified BCBA")} />}
          {mode === "flow" && <FlowView records={filtered} onOpen={openRecord} onPatch={patchRecord} />}
          {mode === "plan" && <TreatmentPlanView record={selected} onToggle={toggleChecklist} onReady={markReady} onCorrection={requestCorrection} onComment={addComment} comment={comment} setComment={setComment} />}
          {mode === "notes" && <NotesView records={filtered.filter((r) => r.noteStatus !== "Clean" || r.notesFlagged > 0 || r.issueType === "Amerigroup Issue")} onOpen={openRecord} onResolve={resolveNote} onTask={createCorrectionTask} onNotify={notifyNoteOwner} onEscalate={(r) => markIssues(r, r.issueType === "None" ? "NoteGuard Flag" : r.issueType)} />}
          {mode === "rbt" && <RbtMonitoringView records={filtered.filter((r) => r.newRbt)} onOpen={openRecord} onPatch={patchRecord} />}
          {mode === "progress" && <ProgressReportView records={filtered.filter((r) => r.progressReportStatus !== "Not Needed")} onOpen={openRecord} onReady={markReady} onAuth={sendToAuth} />}
        </div>
        <DetailPanel record={selected} panelTab={panelTab} setPanelTab={setPanelTab} onOpenClient={() => navigate(`/clients/${selected.clientId}`)} onStart={startReview} onCorrection={requestCorrection} onReady={markReady} onAuth={sendToAuth} onTask={createCorrectionTask} onToggle={toggleChecklist} onResolveIssue={resolveIssue} onResolveNote={resolveNote} comment={comment} setComment={setComment} onComment={addComment} />
      </section>
      {newReviewOpen && <NewQaReviewDialog clients={clients} records={records} selectedId={newReviewClientId} onSelect={setNewReviewClientId} onClose={() => setNewReviewOpen(false)} onCreate={createQaReview} onReuse={reuseQaReview} />}
    </PageShell>
  );
}

function FilterSelect({ value, onChange, label, items }: { value: string; onChange: (value: string) => void; label: string; items: string[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder={label} /></SelectTrigger><SelectContent><SelectItem value="all">{label}</SelectItem>{items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>;
}

function NewQaReviewDialog({ clients, records, selectedId, onSelect, onClose, onCreate, onReuse }: { clients: Client[]; records: QARecord[]; selectedId: string; onSelect: (id: string) => void; onClose: () => void; onCreate: () => void; onReuse: (record: QARecord) => void }) {
  const selected = clients.find((client) => client.id === selectedId);
  const options = clients.filter((client) => client.assessmentDate || client.stage === "Assessment Completed" || client.stage === "Treatment Plan Pending" || client.stage === "QA Review" || client.authorizations.some((auth) => auth.type === "Treatment"));
  const treatmentAuth = selected?.authorizations.find((auth) => auth.type === "Treatment" || auth.treatmentPlanReceived || auth.treatmentPlanLinked);
  const requirements = selected ? documentRequirementsFor(selected, Boolean(treatmentAuth?.treatmentPlanReceived || treatmentAuth?.treatmentPlanLinked)) : [];
  const duplicate = selected ? records.find((record) => record.clientId === selected.id && record.timeline.some((event) => event.event.includes("Assessment/treatment plan selected for QA") || event.event.includes("New QA Review created"))) : undefined;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl"><div className="border-b border-border p-5"><h2 className="text-lg font-semibold text-foreground">New QA Review</h2><p className="text-sm text-muted-foreground">Create a QA item from an existing assessment or treatment plan.</p></div><div className="space-y-4 p-5"><label className="space-y-2"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assessment / Treatment Plan</span><Select value={selectedId} onValueChange={onSelect}><SelectTrigger><SelectValue placeholder="Select client assessment" /></SelectTrigger><SelectContent>{options.map((client) => <SelectItem key={client.id} value={client.id}>{client.childName} · {client.state} · {client.stage}</SelectItem>)}</SelectContent></Select></label>{selected && <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/20 p-4"><div><p className="text-xs text-muted-foreground">Client</p><p className="text-sm font-medium text-foreground">{selected.childName}</p></div><div><p className="text-xs text-muted-foreground">Assessment Date</p><p className="text-sm font-medium text-foreground">{selected.assessmentDate ?? "Not set"}</p></div><div><p className="text-xs text-muted-foreground">BCBA</p><p className="text-sm font-medium text-foreground">{selected.bcba ?? "Unassigned"}</p></div><div><p className="text-xs text-muted-foreground">Treatment Auth</p><p className="text-sm font-medium text-foreground">{treatmentAuth ? "Available" : "Missing plan"}</p></div></div>}{duplicate && <div className="rounded-lg border border-warning/40 bg-warning/10 p-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><div className="min-w-0"><p className="text-sm font-semibold text-foreground">Possible duplicate QA Review</p><p className="mt-1 text-xs text-muted-foreground">{duplicate.clientName} already has a QA review for this assessment/treatment plan: {duplicate.status} · owner {duplicate.qaOwner} · next action {duplicate.nextAction}.</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onReuse(duplicate)}>Reuse existing</Button><Button size="sm" onClick={onCreate}>Create new anyway</Button></div></div></div></div>}{requirements.length > 0 && <div className="rounded-lg border border-border/60 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Generated document requirements</p><div className="mt-3 space-y-2">{requirements.map((requirement) => <div key={requirement.name} className="flex items-center justify-between rounded-md bg-muted/30 p-2"><div><p className="text-sm font-medium text-foreground">{requirement.name}</p><p className="text-xs text-muted-foreground">{requirement.reason}</p></div><StatusBadge status={requirement.present ? "Present" : "Missing"} variant={requirement.present ? "success" : "destructive"} /></div>)}</div></div>}<div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">New records are created with initial status Awaiting QA Review and a starter QA task due tomorrow.</div></div><div className="flex justify-end gap-2 border-t border-border p-4"><Button variant="outline" onClick={onClose}>Cancel</Button>{duplicate ? <Button variant="outline" onClick={() => onReuse(duplicate)}>Reuse Existing</Button> : null}<Button onClick={onCreate}>{duplicate ? "Create New Anyway" : "Create QA Review"}</Button></div></div></div>;
}

function SlaQueueView(props: { records: QARecord[]; onOpen: (r: QARecord) => void; onStart: (r: QARecord) => void; onIssue: (r: QARecord) => void; onCorrection: (r: QARecord) => void; onTask: (r: QARecord) => void }) {
  const sections = [
    { title: "3+ Days Waiting", description: "QA reviews waiting beyond the internal response SLA", filter: qaWaitingOverSla },
    { title: "Treatment Plans Overdue 14+ Days", description: "Assessment-to-plan cycle has crossed the 14 day limit", filter: treatmentPlanOverdue },
    { title: "All SLA Breaches", description: "Any record matching overdue QA or treatment plan rules", filter: (r: QARecord) => slaRulesFor(r).length > 0 },
  ];
  return <div className="space-y-4">{sections.map((section) => { const rows = props.records.filter(section.filter); return <div key={section.title} className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div><h3 className="text-sm font-semibold text-foreground">{section.title}</h3><p className="text-xs text-muted-foreground">{section.description}</p></div><StatusBadge status={`${rows.length} alerts`} variant={rows.length ? "destructive" : "success"} /></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/50">{["Client", "Owner", "Status", "Days in QA", "Days Since Assessment", "SLA Badges", "Next Action", "Actions"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={`${section.title}-${r.id}`} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3"><button onClick={() => props.onOpen(r)} className="font-medium text-foreground hover:text-primary">{r.clientName}</button><p className="text-xs text-muted-foreground">{r.state} · {r.bcba}</p></td><td className="px-3 py-3 text-muted-foreground">{r.qaOwner}</td><td className="px-3 py-3"><StatusBadge status={r.status} variant={statusVariant(r.status)} /></td><td className="px-3 py-3 font-medium text-muted-foreground">{r.daysInQA}d</td><td className="px-3 py-3 font-medium text-muted-foreground">{r.daysSinceAssessment}d</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5">{slaRulesFor(r).map((rule) => <span key={rule} className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3 w-3" />{rule}</span>)}</div></td><td className="px-3 py-3 text-muted-foreground">{r.nextAction}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => props.onOpen(r)}>Open</Button>{r.status === "Awaiting Review" && <Button size="sm" variant="outline" onClick={() => props.onStart(r)}>Start</Button>}<Button size="sm" variant="outline" onClick={() => props.onTask(r)}>Task</Button><Button size="sm" variant="outline" onClick={() => props.onCorrection(r)}>Notify</Button><Button size="sm" variant="outline" onClick={() => props.onIssue(r)}>Issue</Button></div></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No SLA alerts in this group.</p>}</div>; })}</div>;
}

function QueueView(props: { records: QARecord[]; onOpen: (r: QARecord) => void; onStart: (r: QARecord) => void; onIssue: (r: QARecord) => void; onCorrection: (r: QARecord) => void; onReady: (r: QARecord) => void; onAuth: (r: QARecord) => void; onTask: (r: QARecord) => void; onOpenClient: (id: string) => void }) {
  const sections = [
    { title: "Urgent Now", filter: (r: QARecord) => r.alerts.length > 0 || r.risk === "Critical" || r.status === "Overdue" },
    { title: "Awaiting QA Review", filter: (r: QARecord) => r.status === "Awaiting Review" },
    { title: "In Review", filter: (r: QARecord) => r.status === "In Review" },
    { title: "Corrections Needed", filter: (r: QARecord) => r.status === "Corrections Needed" || r.status === "Issues Found" },
    { title: "Note Compliance", filter: (r: QARecord) => r.noteStatus !== "Clean" || r.notesFlagged > 0 },
    { title: "Ready for Auth Submission", filter: (r: QARecord) => r.status === "Ready for Submission" },
  ];
  return <div className="space-y-4">{sections.map((section) => { const rows = props.records.filter(section.filter); return <div key={section.title} className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div><h3 className="text-sm font-semibold text-foreground">{section.title}</h3><p className="text-xs text-muted-foreground">{rows.length} active QA items</p></div><StatusBadge status={String(rows.length)} variant={rows.length ? "info" : "muted"} /></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/50">{["Client", "State", "BCBA / RBT", "Owner", "Status", "Plan", "Issue", "Days", "Next Action", "Alert", "Quick Action"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={`${section.title}-${r.id}`} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3"><button onClick={() => props.onOpen(r)} className="font-medium text-foreground hover:text-primary">{r.clientName}</button><p className="text-xs text-muted-foreground">{r.parentName}</p></td><td className="px-3 py-3 text-muted-foreground">{r.state}</td><td className="px-3 py-3 text-muted-foreground"><p>{r.bcba}</p><p className="text-xs">{r.rbt}</p></td><td className="px-3 py-3 text-muted-foreground">{r.qaOwner}</td><td className="px-3 py-3"><StatusBadge status={r.status} variant={statusVariant(r.status)} /></td><td className="px-3 py-3 text-muted-foreground">{r.planStatus}</td><td className="px-3 py-3 text-muted-foreground">{r.issueType}</td><td className="px-3 py-3 text-muted-foreground">{r.daysInQA}d</td><td className="px-3 py-3 text-muted-foreground">{r.nextAction}</td><td className="px-3 py-3">{r.alerts[0] ? <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />{r.alerts[0]}</span> : <span className="text-xs text-muted-foreground">—</span>}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => props.onOpen(r)}>Open QA</Button>{r.status === "Awaiting Review" && <Button size="sm" variant="outline" onClick={() => props.onStart(r)}>Start</Button>}<Button size="sm" variant="outline" onClick={() => props.onIssue(r)}>Issues</Button><Button size="sm" variant="outline" onClick={() => props.onTask(r)}>Fix Task</Button><Button size="sm" variant="outline" onClick={() => props.onCorrection(r)}>Notify</Button><Button size="sm" variant="outline" onClick={() => props.onReady(r)}>Ready</Button><Button size="sm" variant="outline" onClick={() => props.onAuth(r)}>Auth</Button><Button size="sm" variant="outline" onClick={() => props.onOpenClient(r.clientId)}>Client</Button></div></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No records in this queue.</p>}</div>; })}</div>;
}

function TableView({ records, selectedIds, setSelectedIds, onOpen, onPatch, onBulkNotify }: { records: QARecord[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; onOpen: (r: QARecord) => void; onPatch: (id: string, patch: Partial<QARecord>, event?: string) => void; onBulkNotify: () => void }) {
  const sorted = [...records].sort((a, b) => b.daysInQA - a.daysInQA);
  const toggleAll = (checked: boolean) => setSelectedIds(checked ? records.map((r) => r.id) : []);
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 px-4 py-3"><div><h3 className="text-sm font-semibold text-foreground">QA Operations Table</h3><p className="text-xs text-muted-foreground">Sort by risk, multi-select, bulk notify, and inline edit owner/status/issues.</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={onBulkNotify}>Bulk notify BCBA</Button><Button size="sm" variant="outline" onClick={() => toast.success("Bulk status update applied")}>Bulk status update</Button></div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/50 bg-muted/20">{["", "Client", "State", "BCBA", "RBT", "QA Owner", "QA Status", "Treatment Plan", "Days Since Assessment", "Days in QA", "Issue", "Notes", "Auth", "Next Action", "Alerts"].map((h, i) => <th key={`${h}-${i}`} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{i === 0 ? <Checkbox checked={selectedIds.length === records.length && records.length > 0} onCheckedChange={(v) => toggleAll(Boolean(v))} /> : h}</th>)}</tr></thead><tbody>{sorted.map((r) => <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3"><Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={(v) => setSelectedIds(v ? [...selectedIds, r.id] : selectedIds.filter((id) => id !== r.id))} /></td><td className="px-3 py-3"><button onClick={() => onOpen(r)} className="font-medium text-foreground hover:text-primary">{r.clientName}</button></td><td className="px-3 py-3 text-muted-foreground">{r.state}</td><td className="px-3 py-3 text-muted-foreground">{r.bcba}</td><td className="px-3 py-3 text-muted-foreground">{r.rbt}</td><td className="px-3 py-3"><InlineSelect value={r.qaOwner} items={["Unassigned", ...QA_OWNERS]} onChange={(v) => onPatch(r.id, { qaOwner: v }, "QA owner updated")} /></td><td className="px-3 py-3"><InlineSelect value={r.status} items={["Awaiting Review", "In Review", "Issues Found", "Corrections Needed", "Ready for Submission", "Submitted to Auth", "Overdue"]} onChange={(v) => onPatch(r.id, { status: v as QAStatus }, "QA status updated")} /></td><td className="px-3 py-3 text-muted-foreground">{r.planStatus}</td><td className="px-3 py-3 text-muted-foreground">{r.daysSinceAssessment}d</td><td className="px-3 py-3 text-muted-foreground">{r.daysInQA}d</td><td className="px-3 py-3"><InlineSelect value={r.issueType} items={ISSUE_TYPES} onChange={(v) => onPatch(r.id, { issueType: v as IssueType }, "Issue type updated")} /></td><td className="px-3 py-3 text-muted-foreground">{r.notesFlagged}</td><td className="px-3 py-3"><StatusBadge status={r.authReadiness} variant={r.authReadiness === "Ready" || r.authReadiness === "Sent" ? "success" : "warning"} /></td><td className="px-3 py-3"><Input value={r.nextAction} onChange={(e) => onPatch(r.id, { nextAction: e.target.value })} className="h-8 min-w-[180px]" /></td><td className="px-3 py-3 text-muted-foreground">{r.alerts.length || "—"}</td></tr>)}</tbody></table></div></div>;
}

function InlineSelect({ value, items, onChange }: { value: string; items: string[]; onChange: (v: string) => void }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="h-8 min-w-[150px]"><SelectValue /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>;
}

function FlowView({ records, onOpen, onPatch }: { records: QARecord[]; onOpen: (r: QARecord) => void; onPatch: (id: string, patch: Partial<QARecord>, event?: string) => void }) {
  const stages: QAStatus[] = ["Awaiting Review", "In Review", "Issues Found", "Corrections Needed", "Ready for Submission", "Submitted to Auth", "Overdue"];
  return <div className="grid gap-3 xl:grid-cols-7">{stages.map((stage) => { const rows = records.filter((r) => r.status === stage); const oldest = rows.length ? Math.max(...rows.map((r) => r.daysInStage)) : 0; const avg = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.daysInStage, 0) / rows.length) : 0; return <div key={stage} className="rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 p-3"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-foreground">{stage}</h3><StatusBadge status={String(rows.length)} variant={statusVariant(stage)} /></div><p className="mt-1 text-[11px] text-muted-foreground">Oldest {oldest}d · Avg {avg}d</p></div><div className="min-h-[520px] space-y-2 p-2">{rows.map((r) => <button key={r.id} onClick={() => onOpen(r)} className="w-full rounded-md border border-border/50 bg-background p-3 text-left transition-colors hover:border-primary/40"><p className="text-sm font-medium text-foreground">{r.clientName}</p><p className="text-xs text-muted-foreground">{r.bcba} · {r.qaOwner}</p><div className="mt-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">{r.daysInStage}d</span><span className="text-muted-foreground">{r.nextAction}</span></div>{r.alerts[0] && <p className="mt-2 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">{r.alerts[0]}</p>}<Select value={r.status} onValueChange={(v) => onPatch(r.id, { status: v as QAStatus }, `Moved to ${v}`)}><SelectTrigger className="mt-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></button>)}</div></div>; })}</div>;
}

function TreatmentPlanView({ record, onToggle, onReady, onCorrection, onComment, comment, setComment }: { record: QARecord; onToggle: (r: QARecord, key: ChecklistKey, value: boolean) => void; onReady: (r: QARecord) => void; onCorrection: (r: QARecord) => void; onComment: (r: QARecord) => void; comment: string; setComment: (v: string) => void }) {
  if (!record) return null;
  const missingItems = missingChecklistItems(record);
  const unresolvedIssues = record.issues.filter((issue) => !issue.resolved);
  const canMarkReady = missingItems.length === 0 && unresolvedIssues.length === 0;
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]"><div className="rounded-lg border border-border/60 bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-base font-semibold text-foreground">Treatment plan preview</h3><p className="text-xs text-muted-foreground">{record.clientName} · {record.treatmentPlanSubmitted}</p></div><StatusBadge status={record.planStatus} variant={record.planStatus === "Approved" ? "success" : record.planStatus === "Missing" ? "destructive" : "warning"} /></div><div className="min-h-[620px] rounded-lg border border-dashed border-border bg-muted/20 p-8"><div className="mx-auto max-w-2xl space-y-5 rounded-lg border border-border/60 bg-background p-6"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blossom ABA Therapy</p><h2 className="mt-2 text-2xl font-semibold text-foreground">Treatment Plan QA Packet</h2><p className="text-sm text-muted-foreground">Client info, diagnosis, assessment date, goals, service hours, signatures, formatting, and clinical accuracy are reviewed here.</p></div>{["Assessment summary", "Clinical goals", "Service authorization request", "Caregiver participation", "BCBA signature"].map((line) => <div key={line} className="rounded-md bg-muted/40 p-4"><p className="text-sm font-medium text-foreground">{line}</p><p className="mt-2 h-2 w-full rounded bg-muted" /><p className="mt-2 h-2 w-3/4 rounded bg-muted" /></div>)}</div></div></div><div className="rounded-lg border border-border/60 bg-card p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-foreground">QA checklist</h3><StatusBadge status={canMarkReady ? "Gate clear" : `${missingItems.length + unresolvedIssues.length} blocked`} variant={canMarkReady ? "success" : "warning"} /></div>{!canMarkReady && <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 p-3"><p className="text-xs font-medium text-warning">Mark Ready for Submission is locked until all required checklist items are complete and QA issues are resolved.</p>{missingItems.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Missing: {missingItems.map((item) => item.label).join(", ")}</p>}{unresolvedIssues.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Unresolved issues: {unresolvedIssues.map((issue) => issue.type).join(", ")}</p>}</div>}<div className="mt-4 space-y-3">{CHECKLIST.map((item) => <label key={item.key} className={cn("flex items-center gap-3 rounded-md border p-3 text-sm", record.checklist[item.key] ? "border-success/30 bg-success/5" : "border-warning/40 bg-warning/5")}><Checkbox checked={record.checklist[item.key]} onCheckedChange={(v) => onToggle(record, item.key, Boolean(v))} /><span className="text-foreground">{item.label}</span></label>)}</div><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add QA comment…" className="mt-4" /><div className="mt-3 grid gap-2"><Button onClick={() => toast.success("Review saved")}>Save Review</Button><Button variant="outline" onClick={() => onCorrection(record)}>Request Correction</Button><Button variant={canMarkReady ? "default" : "outline"} disabled={!canMarkReady} onClick={() => onReady(record)}>Mark Ready for Submission</Button><Button variant="outline" onClick={() => onComment(record)}>Add QA Comment</Button></div></div></div>;
}

function NotesView({ records, onOpen, onResolve, onTask, onNotify, onEscalate }: { records: QARecord[]; onOpen: (r: QARecord) => void; onResolve: (r: QARecord) => void; onTask: (r: QARecord) => void; onNotify: (r: QARecord, owner: "RBT" | "BCBA") => void; onEscalate: (r: QARecord) => void }) {
  return <SimpleTable title="Note Compliance Queue" subtitle="NoteGuard flags, Amerigroup reviews, missing notes, repeated note errors, and correction tasks." headers={["Client", "RBT", "BCBA", "Payor", "Note Date", "Issue", "Severity", "Owner", "Due", "Status", "Actions"]}>{records.map((r) => <tr key={r.id} className="border-b border-border/40"><td className="px-3 py-3"><button onClick={() => onOpen(r)} className="font-medium text-foreground hover:text-primary">{r.clientName}</button></td><td className="px-3 py-3 text-muted-foreground">{r.rbt}</td><td className="px-3 py-3 text-muted-foreground">{r.bcba}</td><td className="px-3 py-3 text-muted-foreground">{r.payor}</td><td className="px-3 py-3 text-muted-foreground">{isoDaysAgo(r.daysInQA + 1)}</td><td className="px-3 py-3 text-muted-foreground">{r.issueType}</td><td className="px-3 py-3"><StatusBadge status={r.severity} variant={r.severity === "Critical" || r.severity === "High" ? "destructive" : "warning"} /></td><td className="px-3 py-3 text-muted-foreground">{r.correctionOwner}</td><td className="px-3 py-3 text-muted-foreground">{r.correctionDue}</td><td className="px-3 py-3"><StatusBadge status={r.noteStatus} variant={noteVariant(r.noteStatus)} /></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => onTask(r)}>Create Correction Task</Button><Button size="sm" variant="outline" onClick={() => onNotify(r, "RBT")}>Notify RBT</Button><Button size="sm" variant="outline" onClick={() => onNotify(r, "BCBA")}>Notify BCBA</Button><Button size="sm" variant="outline" onClick={() => onResolve(r)}>Resolved</Button><Button size="sm" variant="outline" onClick={() => onEscalate(r)}>Escalate</Button></div></td></tr>)}</SimpleTable>;
}

function RbtMonitoringView({ records, onOpen, onPatch }: { records: QARecord[]; onOpen: (r: QARecord) => void; onPatch: (id: string, patch: Partial<QARecord>, event?: string) => void }) {
  const sections = ["Daily Check-ins Due", "First Week Monitoring", "Biweekly Monitoring", "Early Compliance Issues", "Cleared from Monitoring"];
  return <div className="space-y-4">{sections.map((section) => { const rows = records.filter((r) => section === "Cleared from Monitoring" ? r.rbtCheckInStatus === "Cleared" : section === "Early Compliance Issues" ? r.noteStatus !== "Clean" : section === "Daily Check-ins Due" ? ["Due", "Missed"].includes(r.rbtCheckInStatus) : r.rbtCheckInStatus !== "Cleared"); return <SimpleTable key={section} title={section} subtitle={`${rows.length} RBT monitoring records`} headers={["RBT", "State", "Start Date", "Assigned Clients", "Check-in", "Notes Issues", "Training", "Next Check-in", "Alert", "Action"]}>{rows.map((r) => <tr key={`${section}-${r.id}`} className="border-b border-border/40"><td className="px-3 py-3"><button onClick={() => onOpen(r)} className="font-medium text-foreground hover:text-primary">{r.rbt}</button></td><td className="px-3 py-3 text-muted-foreground">{r.state}</td><td className="px-3 py-3 text-muted-foreground">{r.rbtStartDate}</td><td className="px-3 py-3 text-muted-foreground">{r.clientName}</td><td className="px-3 py-3"><StatusBadge status={r.rbtCheckInStatus} variant={r.rbtCheckInStatus === "Missed" ? "destructive" : r.rbtCheckInStatus === "Cleared" ? "success" : "warning"} /></td><td className="px-3 py-3 text-muted-foreground">{r.notesFlagged}</td><td className="px-3 py-3 text-muted-foreground">{r.trainingStatus}</td><td className="px-3 py-3 text-muted-foreground">{isoDaysAhead(1)}</td><td className="px-3 py-3 text-muted-foreground">{r.alerts.find((a) => a.includes("RBT")) ?? "—"}</td><td className="px-3 py-3"><Button size="sm" variant="outline" onClick={() => onPatch(r.id, { rbtCheckInStatus: "Complete" }, "RBT check-in completed")}>Complete</Button></td></tr>)}</SimpleTable>; })}</div>;
}

function ProgressReportView({ records, onOpen, onReady, onAuth }: { records: QARecord[]; onOpen: (r: QARecord) => void; onReady: (r: QARecord) => void; onAuth: (r: QARecord) => void }) {
  const sections = ["Progress Reports Received", "Awaiting QA Review", "Corrections Needed", "Ready for Reauth Submission"];
  return <div className="space-y-4">{sections.map((section) => { const rows = records.filter((r) => section === "Progress Reports Received" ? r.progressReportStatus === "Received" : section === "Awaiting QA Review" ? r.progressReportStatus === "Awaiting QA" : section === "Corrections Needed" ? r.progressReportStatus === "Corrections Needed" : r.progressReportStatus === "Ready for Reauth"); return <SimpleTable key={section} title={section} subtitle="Reauth QA workflow" headers={["Client", "BCBA", "Payor", "Auth Expiration", "Days Remaining", "Report", "QA Status", "Next Action", "Actions"]}>{rows.map((r) => <tr key={`${section}-${r.id}`} className="border-b border-border/40"><td className="px-3 py-3"><button onClick={() => onOpen(r)} className="font-medium text-foreground hover:text-primary">{r.clientName}</button></td><td className="px-3 py-3 text-muted-foreground">{r.bcba}</td><td className="px-3 py-3 text-muted-foreground">{r.payor}</td><td className="px-3 py-3 text-muted-foreground">{r.authExpiration}</td><td className="px-3 py-3 text-muted-foreground">{Math.max(1, Math.round((new Date(r.authExpiration).getTime() - today.getTime()) / 86400000))}d</td><td className="px-3 py-3 text-muted-foreground">{r.progressReportStatus}</td><td className="px-3 py-3"><StatusBadge status={r.status} variant={statusVariant(r.status)} /></td><td className="px-3 py-3 text-muted-foreground">{r.nextAction}</td><td className="px-3 py-3"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onReady(r)}>Approve QA</Button><Button size="sm" variant="outline" onClick={() => onAuth(r)}>Reauth</Button></div></td></tr>)}</SimpleTable>; })}</div>;
}

function SimpleTable({ title, subtitle, headers, children }: { title: string; subtitle: string; headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 px-4 py-3"><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="text-xs text-muted-foreground">{subtitle}</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/50 bg-muted/20">{headers.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div></div>;
}

function DetailPanel({ record, panelTab, setPanelTab, onOpenClient, onStart, onCorrection, onReady, onAuth, onTask, onToggle, onResolveIssue, onResolveNote, comment, setComment, onComment }: { record: QARecord; panelTab: string; setPanelTab: (v: string) => void; onOpenClient: () => void; onStart: (r: QARecord) => void; onCorrection: (r: QARecord) => void; onReady: (r: QARecord) => void; onAuth: (r: QARecord) => void; onTask: (r: QARecord) => void; onToggle: (r: QARecord, key: ChecklistKey, value: boolean) => void; onResolveIssue: (r: QARecord, id?: string) => void; onResolveNote: (r: QARecord) => void; comment: string; setComment: (v: string) => void; onComment: (r: QARecord) => void }) {
  if (!record) return <aside className="rounded-lg border border-border/60 bg-card p-5 text-sm text-muted-foreground">Select a QA record.</aside>;
  return <aside className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-hidden rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-foreground">{record.clientName}</h2><p className="text-xs text-muted-foreground">{record.state} · {record.bcba} · {record.qaOwner} · {record.daysInQA}d in QA</p><p className="mt-1 text-xs text-muted-foreground">Source: {record.provenance}</p></div><StatusBadge status={record.status} variant={statusVariant(record.status)} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><Info label="Auth readiness" value={record.authReadiness} /><Info label="Risk" value={record.risk} /><Info label="Plan" value={record.planStatus} /><Info label="Notes" value={record.noteStatus} /></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={onOpenClient}>Open Client</Button><Button size="sm" variant="outline" onClick={() => onStart(record)}>Start Review</Button><Button size="sm" variant="outline" onClick={() => onCorrection(record)}>Request Correction</Button><Button size="sm" variant="outline" onClick={() => toast.success("BCBA notified")}>Notify BCBA</Button><Button size="sm" variant="outline" onClick={() => onReady(record)}>Ready</Button><Button size="sm" variant="outline" onClick={() => onAuth(record)}>Send to Auth</Button><Button size="sm" variant="outline" onClick={() => onTask(record)}>Create Task</Button></div></div><Tabs value={panelTab} onValueChange={setPanelTab} className="flex h-[calc(100vh-22rem)] flex-col"><div className="overflow-x-auto border-b border-border/60 px-3 py-2"><TabsList className="h-auto w-max justify-start"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="plan">Treatment Plan</TabsTrigger><TabsTrigger value="checklist">Checklist</TabsTrigger><TabsTrigger value="issues">Issues</TabsTrigger><TabsTrigger value="notes">Notes Compliance</TabsTrigger><TabsTrigger value="rbt">New RBT Monitoring</TabsTrigger><TabsTrigger value="auth">Auth Connection</TabsTrigger><TabsTrigger value="docs">Documents</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger></TabsList></div><div className="flex-1 overflow-y-auto p-4"><TabsContent value="overview" className="mt-0 space-y-3"><Info label="Current QA status" value={record.status} /><Info label="Treatment plan status" value={record.planStatus} /><Info label="Days since assessment" value={`${record.daysSinceAssessment} days`} /><Info label="Blockers" value={record.alerts.join(", ") || "None"} /><Info label="Next action" value={record.nextAction} /><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add note…" /><Button size="sm" onClick={() => onComment(record)}>Add Note</Button></TabsContent><TabsContent value="plan" className="mt-0 space-y-3"><Info label="Submitted date" value={record.treatmentPlanSubmitted} /><Info label="Due date" value={record.dueDate} /><Info label="Document link" value="Treatment plan packet.pdf" /><Info label="Version history" value="v3 current · v2 corrected · v1 submitted" />{record.comments.map((c) => <p key={c} className="rounded-md bg-muted/40 p-2 text-sm text-muted-foreground">{c}</p>)}<Button size="sm" variant="outline">Upload / replace document</Button></TabsContent><TabsContent value="checklist" className="mt-0 space-y-2">{CHECKLIST.map((item) => <label key={item.key} className="flex items-center gap-3 rounded-md border border-border/50 p-3 text-sm"><Checkbox checked={record.checklist[item.key]} onCheckedChange={(v) => onToggle(record, item.key, Boolean(v))} /><span>{item.label}</span></label>)}<Button className="mt-2 w-full" onClick={() => onReady(record)}>Mark Ready for Submission</Button></TabsContent><TabsContent value="issues" className="mt-0 space-y-3">{record.issues.map((issue) => <div key={issue.id} className="rounded-md border border-border/50 p-3"><div className="flex items-center justify-between"><StatusBadge status={issue.type} variant={issue.resolved ? "success" : "destructive"} /><Button size="sm" variant="outline" onClick={() => onResolveIssue(record, issue.id)}>Mark resolved</Button></div><p className="mt-2 text-sm text-foreground">{issue.description}</p><p className="text-xs text-muted-foreground">Owner {issue.owner} · Due {issue.dueDate}</p></div>)}<Button size="sm" variant="outline" onClick={() => onTask(record)}>Add issue button</Button></TabsContent><TabsContent value="notes" className="mt-0 space-y-3"><Info label="Flagged notes" value={String(record.notesFlagged)} /><Info label="NoteGuard issues" value={record.issueType === "NoteGuard Flag" ? "Open" : "None"} /><Info label="Amerigroup notes" value={record.issueType === "Amerigroup Issue" ? "Daily review required" : "Current"} /><Info label="Missing notes" value={record.issueType === "Missing Notes" ? "Yes" : "No"} /><Button size="sm" onClick={() => onResolveNote(record)}>Resolve issue</Button></TabsContent><TabsContent value="rbt" className="mt-0 space-y-3"><Info label="Monitoring start" value={record.rbtStartDate} /><Info label="Daily check-in" value={record.rbtCheckInStatus} /><Info label="First week status" value={record.trainingStatus} /><Info label="Biweekly check-in" value={record.rbtCheckInStatus === "Cleared" ? "Cleared" : "Scheduled"} /><Info label="Early compliance notes" value={record.alerts.find((a) => a.includes("RBT")) ?? "No early concerns"} /></TabsContent><TabsContent value="auth" className="mt-0 space-y-3"><Info label="Linked treatment auth" value={`AUTH-${record.id.toUpperCase()}`} /><Info label="Auth status" value={record.authStatus} /><Info label="QA blocking" value={record.authReadiness === "Blocked" ? record.alerts.join(", ") || record.issueType : "None"} /><Info label="Submission readiness" value={record.authReadiness} /><Button onClick={() => onAuth(record)}>Move auth to Awaiting Submission</Button></TabsContent><TabsContent value="docs" className="mt-0 space-y-2">{record.documents.map((doc) => <div key={doc.name} className="flex items-center justify-between rounded-md border border-border/50 p-3"><div><p className="text-sm font-medium text-foreground">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.type}</p></div><StatusBadge status={doc.present ? "Present" : "Missing"} variant={doc.present ? "success" : "destructive"} /></div>)}<Button size="sm" variant="outline">Upload area</Button></TabsContent><TabsContent value="tasks" className="mt-0 space-y-2">{record.tasks.map((task) => <div key={task.id} className="rounded-md border border-border/50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{task.title}</p><StatusBadge status={task.completed ? "Done" : "Open"} variant={task.completed ? "success" : "warning"} /></div><p className="text-xs text-muted-foreground">{task.owner} · {task.dueDate}</p></div>)}</TabsContent><TabsContent value="timeline" className="mt-0 space-y-3">{record.timeline.map((event, index) => <div key={`${event.date}-${event.event}-${index}`} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-primary" /><div><p className="text-sm text-foreground">{event.event}</p><p className="text-xs text-muted-foreground">{event.date}</p></div></div>)}</TabsContent></div></Tabs></aside>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-muted/30 p-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value || "—"}</p></div>;
}
