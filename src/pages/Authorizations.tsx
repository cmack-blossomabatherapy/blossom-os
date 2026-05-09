import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Filter,
  FolderOpen,
  LayoutGrid,
  ListChecks,
  MessageSquarePlus,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { useClients } from "@/contexts/ClientsContext";
import { AuthorizationRecord, Client, ClientStage, QAStatus, authVariant } from "@/data/clients";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AuthType = "Initial" | "Treatment" | "Reauth";
type WorkspaceStatus =
  | "Awaiting Submission"
  | "Submitted"
  | "Approved"
  | "Denied"
  | "Expiring Soon"
  | "In QA Review"
  | "Missing Documentation"
  | "Flaked Client";
type ViewMode = "queue" | "table" | "pipeline" | "reauth" | "payor" | "missing";
type RiskLevel = "Low" | "Medium" | "High" | "Critical";
type PanelTab = "Overview" | "Submission" | "Documents" | "QA Connection" | "Reauth" | "Payor Rules" | "Client Impact" | "Tasks" | "Timeline";
type SortKey = "client" | "state" | "payor" | "status" | "days" | "expiration";

type AuthTask = { id: string; title: string; owner: string; dueDate: string; completed: boolean };
type TimelineEvent = { id: string; label: string; at: string; owner?: string };

type AuthWorkspaceRecord = {
  id: string;
  clientId: string;
  clientName: string;
  parentName: string;
  clientStage: ClientStage;
  state: string;
  payor: string;
  authType: AuthType;
  status: WorkspaceStatus;
  coordinator: string;
  bcba: string;
  qaOwner: string;
  qaStatus: QAStatus | "Blocked" | "Ready";
  submissionMethod: string;
  submittedDate?: string;
  approvalDate?: string;
  expirationDate?: string;
  followUpDate?: string;
  referenceNumber?: string;
  denialReason?: string;
  progressReportStatus: "Not Started" | "Requested" | "In Progress" | "Received" | "QA Review" | "Ready to Submit";
  requiredDocs: { name: string; received: boolean }[];
  missingDocs: string[];
  treatmentPlanStatus: "Missing" | "Draft" | "Received" | "QA Approved";
  daysInStage: number;
  nextAction: string;
  notes: string;
  blockers: string[];
  tasks: AuthTask[];
  timeline: TimelineEvent[];
  consentComplete: boolean;
  staffingStatus: "Needs RBT" | "RBT Confirmed" | "Not Needed" | "In Progress";
  revenueRisk: number;
  flaked: boolean;
};

type PayorRule = {
  payor: string;
  submissionMethod: string;
  portal: string;
  requiredDocs: string[];
  avgApprovalDays: number;
  denialRate: number;
  missingDocsRate: number;
  notes: string;
};

const today = new Date("2026-04-28T12:00:00Z");
const isoToday = today.toISOString().slice(0, 10);
const addDays = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
const daysUntil = (date?: string) => (date ? Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000) : null);
const avg = (values: number[]) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0);

const statuses: WorkspaceStatus[] = ["Awaiting Submission", "Submitted", "Approved", "Denied", "Expiring Soon", "In QA Review", "Missing Documentation", "Flaked Client"];
const states = ["GA", "NC", "TN", "VA", "MD"];
const coordinators = ["Kayla Morris", "Riki Hall", "Nina Brooks", "Marcus Lee", "Auth Team"];
const panelTabs: PanelTab[] = ["Overview", "Submission", "Documents", "QA Connection", "Reauth", "Payor Rules", "Client Impact", "Tasks", "Timeline"];

const payorRules: PayorRule[] = [
  { payor: "BCBS", submissionMethod: "Direct portal preferred", portal: "Portal placeholder", requiredDocs: ["Treatment plan", "Insurance card", "Clinical notes", "Diagnosis"], avgApprovalDays: 8, denialRate: 7, missingDocsRate: 11, notes: "Fastest path is direct portal submission with reference number captured same day." },
  { payor: "Aetna", submissionMethod: "Portal + phone follow-up", portal: "Portal placeholder", requiredDocs: ["Assessment", "Treatment plan", "Parent consent", "CPT request"], avgApprovalDays: 10, denialRate: 9, missingDocsRate: 14, notes: "Call after day 5 if no acknowledgement appears in portal." },
  { payor: "United Healthcare", submissionMethod: "Portal upload", portal: "Portal placeholder", requiredDocs: ["Treatment plan", "Progress report", "Session schedule"], avgApprovalDays: 12, denialRate: 11, missingDocsRate: 16, notes: "Attach progress report for reauths before internal handoff to avoid recycle." },
  { payor: "Medicaid", submissionMethod: "State-specific portal", portal: "Portal placeholder", requiredDocs: ["Medicaid card", "Plan of care", "Assessment", "Provider form"], avgApprovalDays: 15, denialRate: 13, missingDocsRate: 19, notes: "NC and GA workflows differ; direct portal is often faster than waiting on internal routing." },
  { payor: "Cigna", submissionMethod: "Fax + portal confirmation", portal: "Portal placeholder", requiredDocs: ["Treatment plan", "Insurance card", "Clinical summary"], avgApprovalDays: 9, denialRate: 8, missingDocsRate: 10, notes: "Fax packet, then confirm receipt in portal within 24 hours." },
  { payor: "Tricare", submissionMethod: "Portal submission", portal: "Portal placeholder", requiredDocs: ["Referral", "Treatment plan", "Progress report", "Diagnosis"], avgApprovalDays: 14, denialRate: 10, missingDocsRate: 17, notes: "Reauths need progress report before QA review; escalate at 45 days remaining." },
];

const statusToAuthStatus = (status: WorkspaceStatus): AuthorizationRecord["status"] => {
  if (status === "Approved") return "Approved";
  if (status === "Denied") return "Denied";
  if (status === "Submitted") return "Submitted";
  if (status === "Expiring Soon") return "Expiring Soon";
  return "Not Submitted";
};

const displayVariant = (status: WorkspaceStatus) => {
  if (status === "Approved") return "success";
  if (["Denied", "Missing Documentation", "Flaked Client"].includes(status)) return "destructive";
  if (["Submitted", "Expiring Soon", "In QA Review"].includes(status)) return "warning";
  return "muted";
};

const coordinatorFor = (client: Client, auth: AuthorizationRecord, index: number) =>
  auth.assignedAuthCoordinator || (client.state === "GA" ? "Kayla Morris" : client.payor.toLowerCase().includes("medicaid") ? "Medicaid Auth Team" : coordinators[index % coordinators.length]);

const normalizeStatus = (client: Client, auth: AuthorizationRecord, index: number): WorkspaceStatus => {
  if (client.stage === "Flaked") return "Flaked Client";
  if ((auth.missingDocs?.length ?? 0) > 0 || auth.requiredDocsReceived === false) return "Missing Documentation";
  if (auth.qaStatus === "In Review") return "In QA Review";
  const remaining = daysUntil(auth.expirationDate);
  if (remaining !== null && remaining <= 90 && auth.status === "Approved") return "Expiring Soon";
  if (auth.status === "Not Submitted") return "Awaiting Submission";
  if (auth.status === "Expired") return "Expiring Soon";
  return (auth.status as WorkspaceStatus) || statuses[index % statuses.length];
};

const buildAlerts = (auth: AuthWorkspaceRecord) => {
  const alerts: string[] = [];
  const remaining = daysUntil(auth.expirationDate);
  if (auth.status === "Awaiting Submission" && auth.daysInStage > 2) alerts.push(`Awaiting submission ${auth.daysInStage}d`);
  if (auth.status === "Submitted" && auth.daysInStage > 10) alerts.push("Payor follow-up overdue");
  if (auth.status === "Denied") alerts.push("Denied authorization");
  if (auth.missingDocs.length) alerts.push("Missing documentation");
  if (remaining !== null && remaining <= 90) alerts.push(`Expiring in ${remaining}d`);
  if (auth.progressReportStatus !== "Received" && auth.authType === "Reauth") alerts.push("Progress report not received");
  if (["In QA Review", "Blocked"].includes(String(auth.qaStatus))) alerts.push("QA blocking submission");
  if (!auth.coordinator || auth.coordinator === "Unassigned") alerts.push("No coordinator assigned");
  if (["Pending Initial Authorization", "Can Not Submit Auth", "Treatment Auth – Awaiting Submission"].includes(auth.clientStage)) alerts.push("Client stuck because of auth");
  if (auth.payor.includes("Medicaid") && auth.status === "Submitted") alerts.push("Payor delay risk");
  return alerts;
};

const riskFor = (auth: AuthWorkspaceRecord): RiskLevel => {
  const alerts = buildAlerts(auth).length;
  const remaining = daysUntil(auth.expirationDate);
  if (auth.status === "Denied" || auth.status === "Missing Documentation" || (remaining !== null && remaining <= 30)) return "Critical";
  if (alerts >= 2 || auth.daysInStage > 10) return "High";
  if (alerts === 1 || auth.daysInStage > 5) return "Medium";
  return "Low";
};

const authDate = (auth: AuthWorkspaceRecord) => auth.expirationDate ? new Date(auth.expirationDate).getTime() : Number.MAX_SAFE_INTEGER;

const buildWorkspaceRecords = (clients: Client[]): AuthWorkspaceRecord[] => {
  const clientPool = clients.length ? clients : [];
  const rows = clientPool.flatMap((client, clientIndex) => {
    const auths = client.authorizations.length ? client.authorizations : [{ type: "Initial", status: client.authStatus }] as AuthorizationRecord[];
    return auths.map((auth, authIndex) => {
      const serial = clientIndex * 3 + authIndex;
      const status = normalizeStatus(client, auth, serial);
      const payor = auth.payor || client.payor || payorRules[serial % payorRules.length].payor;
      const missingDocs = auth.missingDocs?.length ? auth.missingDocs : status === "Missing Documentation" ? ["Insurance card", serial % 2 ? "Treatment plan signature" : "Parent consent"] : [];
      const exp = auth.expirationDate || (auth.type === "Reauth" || status === "Expiring Soon" ? addDays([24, 47, 76, 88][serial % 4]) : auth.status === "Approved" ? addDays(120 + serial * 8) : undefined);
      return {
        id: auth.id || `${client.id}-${auth.type}-${authIndex}`,
        clientId: client.id,
        clientName: client.childName,
        parentName: client.parentName,
        clientStage: client.stage,
        state: auth.state || client.state || states[serial % states.length],
        payor,
        authType: auth.type,
        status,
        coordinator: coordinatorFor(client, auth, serial),
        bcba: client.bcba || ["Dr. Kim", "Avery Stone", "Dr. Patel", "Maya Reynolds"][serial % 4],
        qaOwner: auth.qaOwner || ["QA Team", "Dr. Kim", "Nina Brooks", "Clinical QA"][serial % 4],
        qaStatus: status === "In QA Review" ? "In Review" : auth.qaStatus || (auth.treatmentPlanLinked ? "Complete" : "Not Started"),
        submissionMethod: payorRules.find((rule) => payor.includes(rule.payor))?.submissionMethod || "Portal submission",
        submittedDate: auth.submittedDate,
        approvalDate: auth.approvedDate,
        expirationDate: exp,
        followUpDate: status === "Submitted" ? addDays(2 + (serial % 5)) : undefined,
        referenceNumber: auth.submittedDate ? `REF-${client.id.replace(/\D/g, "")}-${serial + 44}` : undefined,
        denialReason: status === "Denied" ? "Medical necessity wording needs revision" : undefined,
        progressReportStatus: auth.progressReportStatus === "Received" ? "Received" : auth.type === "Reauth" ? (["Not Started", "Requested", "In Progress", "QA Review"] as const)[serial % 4] : "Not Started",
        requiredDocs: [
          { name: "Insurance card", received: !missingDocs.includes("Insurance card") },
          { name: "Treatment plan", received: auth.treatmentPlanReceived !== false && !missingDocs.some((doc) => doc.includes("Treatment")) },
          { name: "Consent forms", received: client.consentComplete || !missingDocs.some((doc) => doc.includes("consent")) },
          { name: "Clinical notes", received: serial % 5 !== 0 },
          { name: "Approval letter", received: auth.approvalLetterReceived || status === "Approved" },
        ],
        missingDocs,
        treatmentPlanStatus: auth.treatmentPlanLinked ? "QA Approved" : auth.treatmentPlanReceived ? "Received" : status === "In QA Review" ? "Draft" : "Missing",
        daysInStage: auth.daysInStage ?? Math.max(1, client.daysInStage + authIndex - 2),
        nextAction: auth.nextAction || (status === "Submitted" ? "Follow up with payor" : status === "Denied" ? "Fix and resubmit packet" : status === "Missing Documentation" ? "Collect missing documentation" : "Submit authorization"),
        notes: auth.notes || "Connected Blossom demo record with client, clinical, financial, QA, staffing, and timeline context.",
        blockers: auth.blockers || (missingDocs.length ? ["Missing documentation"] : []),
        tasks: [
          { id: `${client.id}-task-${authIndex}-1`, title: status === "Submitted" ? "Call payor for status" : "Prepare auth packet", owner: coordinatorFor(client, auth, serial), dueDate: addDays(serial % 4), completed: status === "Approved" },
          { id: `${client.id}-task-${authIndex}-2`, title: auth.type === "Reauth" ? "Request progress report" : "Verify required documents", owner: auth.qaOwner || "QA Team", dueDate: addDays(3 + serial), completed: auth.treatmentPlanLinked || false },
        ],
        timeline: [
          { id: `${client.id}-tl-${authIndex}-1`, label: `${auth.type} authorization created`, at: "2026-04-01", owner: "System" },
          ...(auth.submittedDate ? [{ id: `${client.id}-tl-${authIndex}-2`, label: "Submitted to payor", at: auth.submittedDate, owner: coordinatorFor(client, auth, serial) }] : []),
          ...(auth.approvedDate ? [{ id: `${client.id}-tl-${authIndex}-3`, label: "Authorization approved", at: auth.approvedDate, owner: "Payor" }] : []),
        ],
        consentComplete: Boolean(client.consentComplete),
        staffingStatus: client.staffingStatus === "Assigned" ? "RBT Confirmed" : client.staffingStatus === "Needed" ? "Needs RBT" : client.staffingStatus === "In Progress" ? "In Progress" : "Not Needed",
        revenueRisk: status === "Approved" ? 0 : auth.type === "Treatment" ? 4200 + serial * 175 : 1200 + serial * 90,
        flaked: client.stage === "Flaked",
      } satisfies AuthWorkspaceRecord;
    });
  });

  const seeded = rows.length >= 20 ? rows : [...rows];
  while (seeded.length < 20 && clientPool.length) {
    const client = clientPool[seeded.length % clientPool.length];
    const serial = seeded.length;
    const type: AuthType = serial % 3 === 0 ? "Initial" : serial % 3 === 1 ? "Treatment" : "Reauth";
    const status = statuses[serial % statuses.length];
    seeded.push({
      id: `${client.id}-synthetic-${serial}`,
      clientId: client.id,
      clientName: client.childName,
      parentName: client.parentName,
      clientStage: status === "Flaked Client" ? "Flaked" : client.stage,
      state: states[serial % states.length],
      payor: payorRules[serial % payorRules.length].payor,
      authType: type,
      status,
      coordinator: coordinators[serial % coordinators.length],
      bcba: client.bcba || "Dr. Kim",
      qaOwner: "Clinical QA",
      qaStatus: status === "In QA Review" ? "In Review" : "Not Started",
      submissionMethod: payorRules[serial % payorRules.length].submissionMethod,
      submittedDate: ["Submitted", "Approved", "Denied"].includes(status) ? addDays(-serial - 3) : undefined,
      approvalDate: status === "Approved" ? addDays(-serial) : undefined,
      expirationDate: type === "Reauth" || status === "Expiring Soon" ? addDays([18, 42, 69, 87][serial % 4]) : undefined,
      followUpDate: status === "Submitted" ? addDays(2) : undefined,
      referenceNumber: status === "Submitted" ? `REF-${serial}28` : undefined,
      denialReason: status === "Denied" ? "Missing clinical justification" : undefined,
      progressReportStatus: type === "Reauth" ? "Requested" : "Not Started",
      requiredDocs: ["Insurance card", "Treatment plan", "Consent forms", "Clinical notes", "Approval letter"].map((name, i) => ({ name, received: status !== "Missing Documentation" || i > 1 })),
      missingDocs: status === "Missing Documentation" ? ["Insurance card", "Treatment plan"] : [],
      treatmentPlanStatus: status === "In QA Review" ? "Draft" : "Received",
      daysInStage: 2 + serial,
      nextAction: status === "Denied" ? "Fix and resubmit" : status === "Submitted" ? "Follow up with payor" : "Submit authorization",
      notes: "Seeded connected auth record for operations workflow coverage.",
      blockers: status === "Missing Documentation" ? ["Missing docs"] : [],
      tasks: [{ id: `seed-task-${serial}`, title: "Work next authorization action", owner: coordinators[serial % coordinators.length], dueDate: addDays(1), completed: false }],
      timeline: [{ id: `seed-tl-${serial}`, label: `${type} auth opened`, at: addDays(-serial), owner: "System" }],
      consentComplete: Boolean(client.consentComplete),
      staffingStatus: client.staffingStatus === "Assigned" ? "RBT Confirmed" : "Needs RBT",
      revenueRisk: 2500 + serial * 110,
      flaked: status === "Flaked Client",
    });
  }
  return seeded.slice(0, Math.max(20, seeded.length));
};

export default function Authorizations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients, updateClient, addTask, appendTimeline } = useClients();
  const [records, setRecords] = useState<AuthWorkspaceRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("queue");
  const [activeKpi, setActiveKpi] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("Overview");
  const [sortKey, setSortKey] = useState<SortKey>("days");
  const [filters, setFilters] = useState({ state: "All", payor: "All", type: "All", status: "All", coordinator: "All", qa: "All", expiration: "All", missingDocs: "All" });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const typeFilter = searchParams.get("type") === "treatment" ? "Treatment" : searchParams.get("type") === "initial" ? "Initial" : null;

  useEffect(() => {
    if (!clients.length) return;
    setRecords((current) => current.length ? current : buildWorkspaceRecords(clients));
  }, [clients]);

  const selected = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const options = useMemo(() => ({
    states: ["All", ...Array.from(new Set(records.map((record) => record.state)))],
    payors: ["All", ...Array.from(new Set(records.map((record) => record.payor)))],
    coordinators: ["All", ...Array.from(new Set(records.map((record) => record.coordinator)))],
  }), [records]);

  const filtered = useMemo(() => {
    let rows = records.filter((record) => !typeFilter || record.authType === typeFilter);
    const q = query.toLowerCase().trim();
    if (q) rows = rows.filter((record) => [record.clientName, record.parentName, record.payor, record.state, record.coordinator, record.status, record.nextAction].join(" ").toLowerCase().includes(q));
    if (filters.state !== "All") rows = rows.filter((record) => record.state === filters.state);
    if (filters.payor !== "All") rows = rows.filter((record) => record.payor === filters.payor);
    if (filters.type !== "All") rows = rows.filter((record) => record.authType === filters.type);
    if (filters.status !== "All") rows = rows.filter((record) => record.status === filters.status);
    if (filters.coordinator !== "All") rows = rows.filter((record) => record.coordinator === filters.coordinator);
    if (filters.qa !== "All") rows = rows.filter((record) => String(record.qaStatus) === filters.qa);
    if (filters.expiration !== "All") {
      rows = rows.filter((record) => {
        const days = daysUntil(record.expirationDate);
        if (days === null) return false;
        if (filters.expiration === "<30") return days <= 30;
        if (filters.expiration === "31-60") return days > 30 && days <= 60;
        return days > 60 && days <= 90;
      });
    }
    if (filters.missingDocs !== "All") rows = rows.filter((record) => filters.missingDocs === "Yes" ? record.missingDocs.length > 0 : record.missingDocs.length === 0);
    if (activeKpi !== "all") {
      rows = rows.filter((record) => {
        if (activeKpi === "Missing Docs") return record.missingDocs.length > 0;
        if (activeKpi === "Reauth Needed") return record.authType === "Reauth" || (daysUntil(record.expirationDate) ?? 999) <= 90;
        if (activeKpi === "QA Blocking") return ["In QA Review", "Blocked"].includes(String(record.qaStatus)) || record.status === "In QA Review";
        return record.status === activeKpi;
      });
    }
    return [...rows].sort((a, b) => {
      if (sortKey === "client") return a.clientName.localeCompare(b.clientName);
      if (sortKey === "state") return a.state.localeCompare(b.state);
      if (sortKey === "payor") return a.payor.localeCompare(b.payor);
      if (sortKey === "status") return a.status.localeCompare(b.status);
      if (sortKey === "expiration") return authDate(a) - authDate(b);
      return b.daysInStage - a.daysInStage;
    });
  }, [records, typeFilter, query, filters, activeKpi, sortKey]);

  const metrics = useMemo(() => [
    { label: "Awaiting Submission", value: records.filter((r) => r.status === "Awaiting Submission").length, icon: Send },
    { label: "Submitted", value: records.filter((r) => r.status === "Submitted").length, icon: Clock },
    { label: "Approved", value: records.filter((r) => r.status === "Approved").length, icon: CheckCircle2 },
    { label: "Denied", value: records.filter((r) => r.status === "Denied").length, icon: AlertTriangle },
    { label: "Missing Docs", value: records.filter((r) => r.missingDocs.length > 0).length, icon: FileText },
    { label: "Expiring Soon", value: records.filter((r) => (daysUntil(r.expirationDate) ?? 999) <= 90).length, icon: RefreshCw },
    { label: "Reauth Needed", value: records.filter((r) => r.authType === "Reauth" || (daysUntil(r.expirationDate) ?? 999) <= 90).length, icon: ClipboardCheck },
    { label: "QA Blocking", value: records.filter((r) => r.status === "In QA Review" || r.qaStatus === "Blocked" || r.qaStatus === "In Review").length, icon: ShieldCheck },
  ], [records]);

  const updateRecord = (id: string, patch: Partial<AuthWorkspaceRecord>, event: string) => {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...patch, timeline: [{ id: `tl-${Date.now()}`, label: event, at: isoToday, owner: "You" }, ...record.timeline] } : record));
  };

  const applyStatus = async (auth: AuthWorkspaceRecord, status: WorkspaceStatus) => {
    const patch: Partial<AuthWorkspaceRecord> = { status, daysInStage: 0 };
    let clientPatch: Partial<Client> = { authStatus: statusToAuthStatus(status), nextAction: auth.nextAction };
    if (status === "Submitted") Object.assign(patch, { submittedDate: isoToday, followUpDate: addDays(5), referenceNumber: `REF-${Date.now().toString().slice(-5)}`, nextAction: "Follow up with payor" });
    if (status === "Approved") {
      Object.assign(patch, { approvalDate: isoToday, nextAction: "Advance linked client" });
      if (auth.authType === "Initial") clientPatch = { ...clientPatch, stage: auth.consentComplete ? "Schedule Assessment" : "Waiting on Consent", nextAction: auth.consentComplete ? "Schedule assessment" : "Collect consent forms" };
      if (auth.authType === "Treatment") clientPatch = { ...clientPatch, stage: auth.staffingStatus === "Needs RBT" ? "Staffing Needed" : "Pending Start Date", nextAction: auth.staffingStatus === "Needs RBT" ? "Assign RBT" : "Set start date" };
    }
    if (status === "Denied") {
      Object.assign(patch, { denialReason: "Needs documentation revision", nextAction: "Fix and resubmit packet", tasks: [{ id: `fix-${Date.now()}`, title: "Fix / resubmit authorization", owner: auth.coordinator, dueDate: addDays(1), completed: false }, ...auth.tasks] });
      await addTask(auth.clientId, { id: `fix-${Date.now()}`, title: "Fix / Resubmit Authorization", completed: false, dueDate: addDays(1) });
    }
    if (status === "Missing Documentation") {
      Object.assign(patch, { missingDocs: auth.missingDocs.length ? auth.missingDocs : ["Insurance card", "Treatment plan"], nextAction: "Collect missing documentation", tasks: [{ id: `docs-${Date.now()}`, title: "Collect Missing Documentation", owner: auth.coordinator, dueDate: addDays(1), completed: false }, ...auth.tasks] });
      clientPatch = { ...clientPatch, stage: "Can Not Submit Auth", blockers: Array.from(new Set([...(clients.find((c) => c.id === auth.clientId)?.blockers ?? []), "Missing documentation"])), nextAction: "Collect missing documentation" };
      await addTask(auth.clientId, { id: `docs-${Date.now()}`, title: "Collect Missing Documentation", completed: false, dueDate: addDays(1) });
    }
    updateRecord(auth.id, patch, `${auth.authType} authorization marked ${status}`);
    await updateClient(auth.clientId, clientPatch);
    await appendTimeline(auth.clientId, `${auth.authType} authorization marked ${status}`, "auth");
    toast.success(`${auth.clientName} moved to ${status}`);
  };

  const quickTask = (auth: AuthWorkspaceRecord, title: string) => {
    updateRecord(auth.id, { tasks: [{ id: `task-${Date.now()}`, title, owner: auth.coordinator, dueDate: addDays(2), completed: false }, ...auth.tasks], nextAction: title }, title);
    toast.success(title);
  };

  const bulkUpdateStatus = (status: WorkspaceStatus) => {
    setRecords((current) => current.map((record) => selectedIds.includes(record.id) ? { ...record, status, daysInStage: 0, timeline: [{ id: `bulk-${Date.now()}`, label: `Bulk updated to ${status}`, at: isoToday, owner: "You" }, ...record.timeline] } : record));
    toast.success(`${selectedIds.length} authorizations updated`);
    setSelectedIds([]);
  };

  return (
    <PageShell title="Authorizations" description="Manage initial auths, treatment auths, reauths, submissions, denials, and revenue blockers." icon={ShieldCheck}>
      <section className="space-y-4 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button className="gap-2"><Plus className="h-4 w-4" />New Authorization</Button>
            <Button variant="outline" className="gap-2" disabled={!selectedIds.length} onClick={() => bulkUpdateStatus("Submitted")}><SlidersHorizontal className="h-4 w-4" />Bulk Actions</Button>
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export</Button>
            <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" />Saved Views</Button>
            <Button variant="outline" className="gap-2" onClick={() => setViewMode("payor")}><FolderOpen className="h-4 w-4" />Payor Rules</Button>
          </div>
          <div className="relative min-w-0 xl:w-[360px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, payor, status, coordinator…" className="pl-9" />
          </div>
        </div>

        <FilterChipsBar
          filters={filters}
          onClear={() => setFilters({ state: "All", payor: "All", type: "All", status: "All", coordinator: "All", qa: "All", expiration: "All", missingDocs: "All" })}
          onClearKey={(key) => setFilters({ ...filters, [key]: "All" })}
          onOpen={() => { setDraftFilters(filters); setFilterDrawerOpen(true); }}
        />

        <AuthFilterDrawer
          open={filterDrawerOpen}
          onOpenChange={setFilterDrawerOpen}
          draft={draftFilters}
          setDraft={setDraftFilters}
          options={{
            states: options.states,
            payors: options.payors,
            coordinators: options.coordinators,
            statuses: ["All", ...statuses],
          }}
          onApply={() => { setFilters(draftFilters); setFilterDrawerOpen(false); }}
          onClear={() => setDraftFilters({ state: "All", payor: "All", type: "All", status: "All", coordinator: "All", qa: "All", expiration: "All", missingDocs: "All" })}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
            {([
              ["queue", "Queue View", ListChecks],
              ["table", "Table View", ArrowUpDown],
              ["pipeline", "Pipeline View", LayoutGrid],
              ["reauth", "Reauth View", RefreshCw],
              ["payor", "Payor View", FolderOpen],
              ["missing", "Missing Docs View", FileText],
            ] as [ViewMode, string, LucideIcon][]).map(([mode, label, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={cn("inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors", viewMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground")}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
          <button onClick={() => { setActiveKpi("all"); setFilters({ state: "All", payor: "All", type: "All", status: "All", coordinator: "All", qa: "All", expiration: "All", missingDocs: "All" }); }} className="text-xs font-medium text-muted-foreground hover:text-foreground">Reset filters</button>
        </div>
      </section>

      <section className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        {metrics.map(({ label, value, icon: Icon }) => <MetricCard key={label} label={label} value={value} icon={Icon} active={activeKpi === label} onClick={() => setActiveKpi(activeKpi === label ? "all" : label)} />)}
      </section>

      {selectedIds.length > 0 && <BulkBar count={selectedIds.length} onClear={() => setSelectedIds([])} onStatus={bulkUpdateStatus} />}

      {viewMode === "queue" && <QueueView records={filtered} onOpen={(record) => { setSelectedId(record.id); setPanelTab("Overview"); }} onAction={applyStatus} onTask={quickTask} onClient={(id) => navigate(`/clients/${id}`)} />}
      {viewMode === "table" && <TableView records={filtered} selectedIds={selectedIds} setSelectedIds={setSelectedIds} sortKey={sortKey} setSortKey={setSortKey} onOpen={(record) => setSelectedId(record.id)} onEdit={updateRecord} />}
      {viewMode === "pipeline" && <PipelineView records={filtered} onOpen={(record) => setSelectedId(record.id)} onMove={(record, status) => void applyStatus(record, status)} />}
      {viewMode === "reauth" && <ReauthView records={filtered.filter((record) => record.authType === "Reauth" || (daysUntil(record.expirationDate) ?? 999) <= 90)} onOpen={(record) => setSelectedId(record.id)} onAction={applyStatus} />}
      {viewMode === "payor" && <PayorView records={records} />}
      {viewMode === "missing" && <MissingDocsView records={filtered.filter((record) => record.missingDocs.length > 0 || record.status === "Missing Documentation")} onOpen={(record) => setSelectedId(record.id)} onTask={quickTask} />}

      {selected && <AuthSidePanel auth={selected} tab={panelTab} setTab={setPanelTab} onClose={() => setSelectedId(null)} onAction={applyStatus} onTask={quickTask} onClient={() => navigate(`/clients/${selected.clientId}`)} onPatch={(patch, event) => updateRecord(selected.id, patch, event)} />}
    </PageShell>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="space-y-1"><span className="text-[11px] font-medium text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none transition-colors focus:border-primary">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

type AuthFilters = { state: string; payor: string; type: string; status: string; coordinator: string; qa: string; expiration: string; missingDocs: string };
const FILTER_LABELS: Record<keyof AuthFilters, string> = { state: "State", payor: "Payor", type: "Auth Type", status: "Auth Status", coordinator: "Coordinator", qa: "QA Status", expiration: "Expiration", missingDocs: "Missing Docs" };

function FilterChipsBar({ filters, onClear, onClearKey, onOpen }: { filters: AuthFilters; onClear: () => void; onClearKey: (key: keyof AuthFilters) => void; onOpen: () => void }) {
  const active = (Object.keys(filters) as (keyof AuthFilters)[]).filter((key) => filters[key] !== "All");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" className="h-9 gap-2" onClick={onOpen}>
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {active.length > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{active.length}</span>}
      </Button>
      {active.map((key) => (
        <button key={key} onClick={() => onClearKey(key)} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15">
          <span className="text-muted-foreground">{FILTER_LABELS[key]}:</span>
          <span>{filters[key]}</span>
          <X className="h-3 w-3" />
        </button>
      ))}
      {active.length > 0 && (
        <button onClick={onClear} className="text-xs font-medium text-muted-foreground hover:text-foreground">Clear all</button>
      )}
    </div>
  );
}

function AuthFilterDrawer({
  open, onOpenChange, draft, setDraft, options, onApply, onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: AuthFilters;
  setDraft: (f: AuthFilters) => void;
  options: { states: string[]; payors: string[]; coordinators: string[]; statuses: string[] };
  onApply: () => void;
  onClear: () => void;
}) {
  const groups: { key: keyof AuthFilters; label: string; values: string[] }[] = [
    { key: "state", label: "State", values: options.states },
    { key: "payor", label: "Payor", values: options.payors },
    { key: "type", label: "Auth Type", values: ["All", "Initial", "Treatment", "Reauth"] },
    { key: "status", label: "Auth Status", values: options.statuses },
    { key: "coordinator", label: "Coordinator", values: options.coordinators },
    { key: "qa", label: "QA Status", values: ["All", "Not Started", "In Review", "Complete", "Blocked", "Ready"] },
    { key: "expiration", label: "Expiration", values: ["All", "<30", "31-60", "61-90"] },
    { key: "missingDocs", label: "Missing Docs", values: ["All", "Yes", "No"] },
  ];
  const activeCount = (Object.keys(draft) as (keyof AuthFilters)[]).filter((k) => draft[k] !== "All").length;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-hidden rounded-t-2xl p-0">
        <div className="flex h-full max-h-[85vh] flex-col">
          <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-primary" />
              Filter Authorizations
            </SheetTitle>
            <SheetDescription>
              {activeCount === 0 ? "Pick chips to narrow the queue, then apply." : `${activeCount} filter${activeCount === 1 ? "" : "s"} selected`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {groups.map((group) => (
              <div key={group.key} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const selected = draft[group.key] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setDraft({ ...draft, [group.key]: value })}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <SheetFooter className="border-t border-border/60 bg-muted/20 px-6 py-3 sm:flex-row sm:justify-between sm:gap-3">
            <Button variant="ghost" onClick={onClear} className="text-muted-foreground">Clear all</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={onApply}>Apply filters</Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetricCard({ label, value, icon: Icon, active, onClick }: { label: string; value: number; icon: LucideIcon; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={cn("rounded-lg border border-border/60 bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md", active && "border-primary/40 bg-primary/5 shadow-sm")}><div className="mb-3 flex items-center justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></button>;
}

function AlertPill({ auth }: { auth: AuthWorkspaceRecord }) {
  const alerts = buildAlerts(auth);
  if (!alerts.length) return <span className="text-xs text-muted-foreground">Clear</span>;
  return <span className={cn("inline-flex max-w-[240px] items-center gap-1 rounded-md px-2 py-1 text-xs", riskFor(auth) === "Critical" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3 shrink-0" /><span className="truncate">{alerts[0]}</span></span>;
}

function QueueView({ records, onOpen, onAction, onTask, onClient }: { records: AuthWorkspaceRecord[]; onOpen: (record: AuthWorkspaceRecord) => void; onAction: (record: AuthWorkspaceRecord, status: WorkspaceStatus) => void; onTask: (record: AuthWorkspaceRecord, title: string) => void; onClient: (id: string) => void }) {
  const sections = [
    { title: "Urgent Now", filter: (r: AuthWorkspaceRecord) => riskFor(r) === "Critical" || buildAlerts(r).length >= 2 },
    { title: "Awaiting Submission", filter: (r: AuthWorkspaceRecord) => r.status === "Awaiting Submission" },
    { title: "Submitted / Follow-Up", filter: (r: AuthWorkspaceRecord) => r.status === "Submitted" },
    { title: "Denials & Fixes", filter: (r: AuthWorkspaceRecord) => r.status === "Denied" },
    { title: "Reauth / Expiring Soon", filter: (r: AuthWorkspaceRecord) => r.authType === "Reauth" || r.status === "Expiring Soon" || (daysUntil(r.expirationDate) ?? 999) <= 90 },
    { title: "Missing Documentation", filter: (r: AuthWorkspaceRecord) => r.status === "Missing Documentation" || r.missingDocs.length > 0 },
  ];
  return <div className="space-y-4">{sections.map((section) => { const items = records.filter(section.filter); return <section key={section.title} className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div><h3 className="text-sm font-semibold text-foreground">{section.title}</h3><p className="text-xs text-muted-foreground">{items.length} authorization records</p></div><StatusBadge status={`${items.length}`} variant={items.length ? "warning" : "muted"} /></div><div className="divide-y divide-border/50">{items.slice(0, 10).map((auth) => <AuthQueueRow key={auth.id} auth={auth} onOpen={onOpen} onAction={onAction} onTask={onTask} onClient={onClient} />)}{!items.length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No records in this queue</p>}</div></section>; })}</div>;
}

function AuthQueueRow({ auth, onOpen, onAction, onTask, onClient }: { auth: AuthWorkspaceRecord; onOpen: (record: AuthWorkspaceRecord) => void; onAction: (record: AuthWorkspaceRecord, status: WorkspaceStatus) => void; onTask: (record: AuthWorkspaceRecord, title: string) => void; onClient: (id: string) => void }) {
  return <div className="grid gap-3 px-4 py-3 xl:grid-cols-[1.2fr_0.5fr_0.8fr_0.7fr_0.8fr_0.45fr_0.7fr_1fr_1.2fr] xl:items-center"><button onClick={() => onOpen(auth)} className="text-left"><p className="font-medium text-foreground hover:text-primary">{auth.clientName}</p><p className="text-xs text-muted-foreground">{auth.parentName}</p></button><span className="text-sm text-muted-foreground">{auth.state}</span><span className="text-sm text-muted-foreground">{auth.payor}</span><span className="text-sm text-muted-foreground">{auth.authType}</span><div><StatusBadge status={auth.status} variant={displayVariant(auth.status)} /></div><span className="text-sm text-muted-foreground">{auth.daysInStage}d</span><span className="text-sm text-muted-foreground">{auth.expirationDate ?? "—"}</span><div><AlertPill auth={auth} /><p className="mt-1 truncate text-xs text-muted-foreground">{auth.nextAction}</p></div><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => onOpen(auth)}><PanelRightOpen className="h-3.5 w-3.5" /></Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Submitted")}>Submit</Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Denied")}>Deny</Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Missing Documentation")}>Docs</Button><Button size="sm" variant="outline" onClick={() => onTask(auth, "Create payor follow-up")}>Follow-Up</Button><Button size="sm" variant="outline" onClick={() => onClient(auth.clientId)}>Client</Button></div></div>;
}

function TableView({ records, selectedIds, setSelectedIds, sortKey, setSortKey, onOpen, onEdit }: { records: AuthWorkspaceRecord[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; sortKey: SortKey; setSortKey: (key: SortKey) => void; onOpen: (record: AuthWorkspaceRecord) => void; onEdit: (id: string, patch: Partial<AuthWorkspaceRecord>, event: string) => void }) {
  const allSelected = records.length > 0 && records.every((record) => selectedIds.includes(record.id));
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold text-foreground">Authorization table</p></div><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Sort</span><select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="h-8 rounded-md border border-input bg-background px-2 text-xs"><option value="days">Days in Stage</option><option value="client">Client</option><option value="state">State</option><option value="payor">Payor</option><option value="status">Status</option><option value="expiration">Expiration</option></select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-sm"><thead><tr className="border-b border-border/60 bg-muted/20"><th className="px-3 py-2 text-left"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : records.map((record) => record.id))} /></th>{["Client", "State", "Payor", "Auth Type", "Status", "Coordinator", "Submission Method", "Submission Date", "Approval Date", "Expiration Date", "Days", "Missing Docs", "QA Status", "Progress Report", "Next Action", "Alerts"].map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">{header}</th>)}</tr></thead><tbody>{records.map((auth) => <tr key={auth.id} className="border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(auth.id)} onChange={() => setSelectedIds(selectedIds.includes(auth.id) ? selectedIds.filter((id) => id !== auth.id) : [...selectedIds, auth.id])} /></td><td className="px-3 py-3"><button onClick={() => onOpen(auth)} className="font-medium text-foreground hover:text-primary">{auth.clientName}</button></td><td className="px-3 py-3 text-muted-foreground">{auth.state}</td><td className="px-3 py-3 text-muted-foreground">{auth.payor}</td><td className="px-3 py-3 text-muted-foreground">{auth.authType}</td><td className="px-3 py-3"><select value={auth.status} onChange={(event) => onEdit(auth.id, { status: event.target.value as WorkspaceStatus }, `Status changed to ${event.target.value}`)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">{statuses.map((status) => <option key={status}>{status}</option>)}</select></td><td className="px-3 py-3"><Input value={auth.coordinator} onChange={(event) => onEdit(auth.id, { coordinator: event.target.value }, "Coordinator updated")} className="h-8 w-36 text-xs" /></td><td className="px-3 py-3 text-muted-foreground">{auth.submissionMethod}</td><td className="px-3 py-3 text-muted-foreground">{auth.submittedDate ?? "—"}</td><td className="px-3 py-3 text-muted-foreground">{auth.approvalDate ?? "—"}</td><td className="px-3 py-3 text-muted-foreground">{auth.expirationDate ?? "—"}</td><td className="px-3 py-3 text-muted-foreground">{auth.daysInStage}</td><td className="px-3 py-3"><Input value={auth.missingDocs.join(", ")} onChange={(event) => onEdit(auth.id, { missingDocs: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) }, "Missing docs edited")} className="h-8 w-44 text-xs" /></td><td className="px-3 py-3 text-muted-foreground">{auth.qaStatus}</td><td className="px-3 py-3 text-muted-foreground">{auth.progressReportStatus}</td><td className="px-3 py-3"><Input value={auth.nextAction} onChange={(event) => onEdit(auth.id, { nextAction: event.target.value }, "Next action updated")} className="h-8 w-56 text-xs" /></td><td className="px-3 py-3"><AlertPill auth={auth} /></td></tr>)}</tbody></table></div></div>;
}

function PipelineView({ records, onOpen, onMove }: { records: AuthWorkspaceRecord[]; onOpen: (record: AuthWorkspaceRecord) => void; onMove: (record: AuthWorkspaceRecord, status: WorkspaceStatus) => void }) {
  return <div className="grid gap-3 xl:grid-cols-4 2xl:grid-cols-8">{statuses.map((stage) => { const items = records.filter((record) => record.status === stage); return <section key={stage} className="min-h-[420px] rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 p-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">{stage}</h3><StatusBadge status={`${items.length}`} variant={items.length ? displayVariant(stage) : "muted"} /></div><p className="mt-1 text-xs text-muted-foreground">Oldest {items.length ? Math.max(...items.map((item) => item.daysInStage)) : 0}d · avg {avg(items.map((item) => item.daysInStage))}d</p></div><div className="space-y-2 p-2">{items.map((auth) => <button key={auth.id} onClick={() => onOpen(auth)} className="w-full rounded-md border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/30"><div className="flex items-start justify-between gap-2"><p className="font-medium text-foreground">{auth.clientName}</p><span className="text-xs text-muted-foreground">{auth.daysInStage}d</span></div><p className="text-xs text-muted-foreground">{auth.payor} · {auth.authType}</p><p className="mt-2 text-xs text-muted-foreground">{auth.coordinator}</p><div className="mt-2"><AlertPill auth={auth} /></div><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{auth.nextAction}</p><select value={auth.status} onClick={(event) => event.stopPropagation()} onChange={(event) => onMove(auth, event.target.value as WorkspaceStatus)} className="mt-3 h-8 w-full rounded-md border border-input bg-background px-2 text-xs">{statuses.map((status) => <option key={status}>{status}</option>)}</select></button>)}</div></section>; })}</div>;
}

function ReauthView({ records, onOpen, onAction }: { records: AuthWorkspaceRecord[]; onOpen: (record: AuthWorkspaceRecord) => void; onAction: (record: AuthWorkspaceRecord, status: WorkspaceStatus) => void }) {
  const groups = [{ title: "Critical: under 30 days", filter: (r: AuthWorkspaceRecord) => (daysUntil(r.expirationDate) ?? 999) <= 30 }, { title: "At Risk: 31–60 days", filter: (r: AuthWorkspaceRecord) => { const d = daysUntil(r.expirationDate) ?? 999; return d > 30 && d <= 60; } }, { title: "Upcoming: 61–90 days", filter: (r: AuthWorkspaceRecord) => { const d = daysUntil(r.expirationDate) ?? 999; return d > 60 && d <= 90; } }, { title: "Progress Report Needed", filter: (r: AuthWorkspaceRecord) => r.progressReportStatus !== "Received" }, { title: "QA Review", filter: (r: AuthWorkspaceRecord) => r.progressReportStatus === "QA Review" || r.status === "In QA Review" }, { title: "Ready to Submit", filter: (r: AuthWorkspaceRecord) => r.progressReportStatus === "Ready to Submit" || r.qaStatus === "Complete" }];
  return <div className="space-y-4">{groups.map((group) => { const items = records.filter(group.filter); return <section key={group.title} className="rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 bg-muted/20 px-4 py-3"><h3 className="text-sm font-semibold text-foreground">{group.title}</h3></div><div className="divide-y divide-border/50">{items.map((auth) => <div key={auth.id} className="grid gap-3 px-4 py-3 xl:grid-cols-[1fr_0.8fr_0.4fr_0.8fr_0.7fr_0.5fr_0.8fr_0.6fr_0.8fr_0.8fr_1fr] xl:items-center"><button onClick={() => onOpen(auth)} className="text-left font-medium text-foreground hover:text-primary">{auth.clientName}</button><span className="text-sm text-muted-foreground">{auth.bcba}</span><span className="text-sm text-muted-foreground">{auth.state}</span><span className="text-sm text-muted-foreground">{auth.payor}</span><span className="text-sm text-muted-foreground">{auth.expirationDate ?? "—"}</span><span className="text-sm text-muted-foreground">{daysUntil(auth.expirationDate) ?? "—"}d</span><span className="text-sm text-muted-foreground">{auth.progressReportStatus}</span><span className="text-sm text-muted-foreground">{auth.qaStatus}</span><span className="text-sm text-muted-foreground">{auth.coordinator}</span><StatusBadge status={riskFor(auth)} variant={riskFor(auth) === "Critical" ? "destructive" : riskFor(auth) === "High" ? "warning" : "muted"} /><div className="flex gap-1.5"><Button size="sm" variant="outline" onClick={() => onAction(auth, "In QA Review")}>QA</Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Awaiting Submission")}>Ready</Button></div></div>)}{!items.length && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No reauth records here</p>}</div></section>; })}</div>;
}

function PayorView({ records }: { records: AuthWorkspaceRecord[] }) {
  return <div className="grid gap-4 xl:grid-cols-2">{payorRules.map((rule) => { const related = records.filter((record) => record.payor.includes(rule.payor)); return <section key={rule.payor} className="rounded-lg border border-border/60 bg-card p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-foreground">{rule.payor}</h3><p className="text-sm text-muted-foreground">{rule.submissionMethod}</p></div><StatusBadge status={`${related.length} active`} variant="info" /></div><div className="mt-4 grid gap-3 md:grid-cols-3"><Stat label="Avg approval" value={`${rule.avgApprovalDays}d`} /><Stat label="Denial rate" value={`${rule.denialRate}%`} /><Stat label="Missing docs" value={`${rule.missingDocsRate}%`} /></div><div className="mt-4 rounded-md border border-border/60 bg-muted/20 p-3"><p className="text-xs font-medium text-muted-foreground">Portal link placeholder</p><p className="mt-1 text-sm text-foreground">{rule.portal}</p></div><div className="mt-4"><p className="text-xs font-medium text-muted-foreground">Required documents</p><div className="mt-2 flex flex-wrap gap-1.5">{rule.requiredDocs.map((doc) => <span key={doc} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{doc}</span>)}</div></div><p className="mt-4 text-sm text-muted-foreground">{rule.notes}</p></section>; })}</div>;
}

function MissingDocsView({ records, onOpen, onTask }: { records: AuthWorkspaceRecord[]; onOpen: (record: AuthWorkspaceRecord) => void; onTask: (record: AuthWorkspaceRecord, title: string) => void }) {
  return <section className="rounded-lg border border-border/60 bg-card"><div className="border-b border-border/60 bg-muted/20 px-4 py-3"><h3 className="text-sm font-semibold text-foreground">Missing Documentation Command Queue</h3><p className="text-xs text-muted-foreground">Linked client impact, required docs, owners, and collection tasks</p></div><div className="divide-y divide-border/50">{records.map((auth) => <div key={auth.id} className="grid gap-3 px-4 py-3 xl:grid-cols-[1fr_0.8fr_1.3fr_1fr_1fr_1fr] xl:items-center"><button onClick={() => onOpen(auth)} className="text-left font-medium text-foreground hover:text-primary">{auth.clientName}</button><div><StatusBadge status={auth.status} variant="destructive" /><p className="mt-1 text-xs text-muted-foreground">{auth.clientStage}</p></div><div className="flex flex-wrap gap-1.5">{auth.missingDocs.map((doc) => <span key={doc} className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">{doc}</span>)}</div><span className="text-sm text-muted-foreground">Owner: {auth.coordinator}</span><span className="text-sm text-muted-foreground">Blocks: {auth.authType === "Initial" ? "Assessment" : "Start / billing"}</span><Button size="sm" variant="outline" onClick={() => onTask(auth, "Collect missing documentation")}>Create Task</Button></div>)}{!records.length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No missing documentation records</p>}</div></section>;
}

function BulkBar({ count, onClear, onStatus }: { count: number; onClear: () => void; onStatus: (status: WorkspaceStatus) => void }) {
  return <div className="sticky top-3 z-20 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 shadow-lg backdrop-blur"><p className="text-sm font-medium text-foreground">{count} selected</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onStatus("Submitted")}>Bulk submit</Button><Button size="sm" variant="outline" onClick={() => onStatus("Approved")}>Bulk approve</Button><Button size="sm" variant="outline" onClick={() => onStatus("Missing Documentation")}>Need docs</Button><Button size="sm" variant="ghost" onClick={onClear}>Clear</Button></div></div>;
}

function AuthSidePanel({ auth, tab, setTab, onClose, onAction, onTask, onClient, onPatch }: { auth: AuthWorkspaceRecord; tab: PanelTab; setTab: (tab: PanelTab) => void; onClose: () => void; onAction: (record: AuthWorkspaceRecord, status: WorkspaceStatus) => void; onTask: (record: AuthWorkspaceRecord, title: string) => void; onClient: () => void; onPatch: (patch: Partial<AuthWorkspaceRecord>, event: string) => void }) {
  const rule = payorRules.find((item) => auth.payor.includes(item.payor)) ?? payorRules[0];
  return <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl"><div className="border-b border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-foreground">{auth.clientName}</h2><StatusBadge status={auth.status} variant={displayVariant(auth.status)} /></div><p className="mt-1 text-sm text-muted-foreground">{auth.authType} · {auth.payor} · {auth.state} · {auth.coordinator}</p><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={`${auth.daysInStage}d in stage`} variant="muted" /><StatusBadge status={`${riskFor(auth)} risk`} variant={riskFor(auth) === "Critical" ? "destructive" : riskFor(auth) === "High" ? "warning" : "info"} /><StatusBadge status={`QA ${auth.qaStatus}`} variant={auth.qaStatus === "Complete" ? "success" : "warning"} /></div></div><button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={onClient}><UserRoundCheck className="h-3.5 w-3.5" />Open Client</Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Submitted")}>Mark Submitted</Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Approved")}>Mark Approved</Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Denied")}>Mark Denied</Button><Button size="sm" variant="outline" onClick={() => onAction(auth, "Missing Documentation")}>Request Docs</Button><Button size="sm" variant="outline" onClick={() => onTask(auth, "Add authorization note")}>Add Note</Button><Button size="sm" variant="outline" onClick={() => onTask(auth, "Create authorization task")}>Create Task</Button><Button size="sm" variant="outline" onClick={() => onPatch({ requiredDocs: auth.requiredDocs.map((doc) => doc.name === "Approval letter" ? { ...doc, received: true } : doc) }, "Document uploaded")}>Upload Document</Button></div></div><div className="border-b border-border bg-card px-5 py-2"><div className="flex gap-1 overflow-x-auto">{panelTabs.map((item) => <button key={item} onClick={() => setTab(item)} className={cn("whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors", tab === item ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{item}</button>)}</div></div><div className="flex-1 overflow-y-auto p-5"><PanelContent auth={auth} tab={tab} rule={rule} onPatch={onPatch} /></div></aside>;
}

function PanelContent({ auth, tab, rule, onPatch }: { auth: AuthWorkspaceRecord; tab: PanelTab; rule: PayorRule; onPatch: (patch: Partial<AuthWorkspaceRecord>, event: string) => void }) {
  if (tab === "Overview") return <PanelGrid items={[["Current status", auth.status], ["Auth type", auth.authType], ["Payor", auth.payor], ["Coordinator", auth.coordinator], ["Next action", auth.nextAction], ["Days in stage", `${auth.daysInStage}`], ["Risk level", riskFor(auth)], ["Blockers", auth.blockers.join(", ") || "None"]]} />;
  if (tab === "Submission") return <PanelGrid items={[["Submission method", auth.submissionMethod], ["Portal notes", rule.notes], ["Submitted date", auth.submittedDate ?? "—"], ["Reference number", auth.referenceNumber ?? "—"], ["Follow-up date", auth.followUpDate ?? "—"], ["Approval date", auth.approvalDate ?? "—"], ["Denial reason", auth.denialReason ?? "—"]]} />;
  if (tab === "Documents") return <div className="space-y-3">{auth.requiredDocs.map((doc) => <button key={doc.name} onClick={() => onPatch({ requiredDocs: auth.requiredDocs.map((item) => item.name === doc.name ? { ...item, received: !item.received } : item), missingDocs: doc.received ? [...auth.missingDocs, doc.name] : auth.missingDocs.filter((item) => item !== doc.name) }, `${doc.name} checklist changed`) } className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-card p-3 text-left"><span className="text-sm font-medium text-foreground">{doc.name}</span><StatusBadge status={doc.received ? "Received" : "Missing"} variant={doc.received ? "success" : "destructive"} /></button>)}<div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Upload area</div></div>;
  if (tab === "QA Connection") return <PanelGrid items={[["Linked QA record", `${auth.clientId}-QA`], ["Treatment plan status", auth.treatmentPlanStatus], ["QA owner", auth.qaOwner], ["QA readiness", auth.qaStatus], ["Issues blocking submission", buildAlerts(auth).filter((item) => item.includes("QA") || item.includes("Progress")).join(", ") || "None"]]} />;
  if (tab === "Reauth") return <PanelGrid items={[["Expiration date", auth.expirationDate ?? "—"], ["Days remaining", `${daysUntil(auth.expirationDate) ?? "—"}`], ["Progress report status", auth.progressReportStatus], ["BCBA notified", auth.progressReportStatus === "Not Started" ? "No" : "Yes"], ["9-week reminder", (daysUntil(auth.expirationDate) ?? 999) <= 63 ? "Sent" : "Pending"], ["6-week escalation", (daysUntil(auth.expirationDate) ?? 999) <= 42 ? "Active" : "Pending"], ["QA review status", String(auth.qaStatus)]]} />;
  if (tab === "Payor Rules") return <PanelGrid items={[["Recommendation", rule.submissionMethod], ["Required documents", rule.requiredDocs.join(", ")], ["Known notes", rule.notes], ["Average timeline", `${rule.avgApprovalDays} days`], ["Portal preference", rule.portal]]} />;
  if (tab === "Client Impact") return <PanelGrid items={[["Linked client stage", auth.clientStage], ["Blocking", auth.authType === "Initial" ? "Assessment scheduling" : auth.authType === "Treatment" ? "Staffing, start date, and billing" : "Continuity of care"], ["Next movement after approval", auth.authType === "Initial" ? (auth.consentComplete ? "Schedule Assessment" : "Waiting on Consent") : auth.staffingStatus === "Needs RBT" ? "Staffing Needed" : "Pending Start Date"], ["Revenue risk", `$${auth.revenueRisk.toLocaleString()}`]]} />;
  if (tab === "Tasks") return <div className="space-y-2">{auth.tasks.map((task) => <div key={task.id} className="rounded-lg border border-border/60 bg-card p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{task.title}</p><StatusBadge status={task.completed ? "Done" : "Open"} variant={task.completed ? "success" : "warning"} /></div><p className="mt-1 text-xs text-muted-foreground">{task.owner} · due {task.dueDate}</p></div>)}</div>;
  return <div className="space-y-2">{auth.timeline.map((event) => <div key={event.id} className="rounded-lg border border-border/60 bg-card p-3"><p className="text-sm font-medium text-foreground">{event.label}</p><p className="mt-1 text-xs text-muted-foreground">{event.at} · {event.owner ?? "System"}</p></div>)}</div>;
}

function PanelGrid({ items }: { items: [string, string][] }) {
  return <div className="grid gap-3 md:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-card p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-sm font-semibold text-foreground">{value}</p></div>)}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border/60 bg-background p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold text-foreground">{value}</p></div>;
}
