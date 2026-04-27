import { useMemo, useState } from "react";
import {
  AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Clock, Download, Eye, FileText, RefreshCw,
  Search, Send, ShieldCheck, UserPlus, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

type AuthType = "Initial" | "Treatment" | "Reauth";
type AuthStatus = "Awaiting Submission" | "Submitted" | "Approved" | "Denied" | "Missing Documentation" | "Expiring Soon";
type Health = "green" | "yellow" | "red";
type KpiFilter = "all" | "awaiting" | "submitted" | "approved" | "denied" | "expiring" | "missing" | "submit-time" | "approval-time";
type QueueKey = "urgent" | "today" | "blockers";

type AuthTask = { id: string; title: string; owner: string; dueDate?: string; completed: boolean };
type AuthDoc = { name: string; type: string; status: "Received" | "Missing" | "Requested" };
type AuthEvent = { id: string; title: string; text: string; timestamp: string; user?: string };

type AuthRecord = {
  id: string;
  client: string;
  parent: string;
  state: "GA" | "NC" | "TN" | "VA" | "MD";
  bcba: string;
  payor: string;
  authType: AuthType;
  status: AuthStatus;
  coordinator: string;
  submittedDate: string | null;
  approvedDate: string | null;
  expirationDate: string | null;
  daysInStage: number;
  avgSubmitDays: number;
  avgApprovalDays: number;
  missingDocs: string[];
  nextAction: string;
  submissionMethod: string;
  portalNotes: string;
  referenceNumber: string | null;
  followUpDate: string | null;
  progressReportStatus: "Not Started" | "In Progress" | "Received" | "Overdue";
  qaStatus: "Not Started" | "In Review" | "Complete" | "Blocked";
  clientStage: string;
  blocking: string;
  nextMovement: string;
  documents: AuthDoc[];
  tasks: AuthTask[];
  timeline: AuthEvent[];
};

const ALL = "All";
const today = new Date("2026-04-27T12:00:00Z");
const coordinators = ["Priya K.", "Marcus T.", "Kayla R.", "Riki S.", "Devon M."];
const states = ["GA", "NC", "TN", "VA", "MD"];

const docs = (missing: string[] = []): AuthDoc[] => [
  "Treatment Plan", "Insurance Card", "Diagnostic Evaluation", "Prescription / Referral", "Approval Letter",
].map((name) => ({ name, type: name.includes("Letter") ? "Authorization" : name.includes("Plan") ? "Clinical" : "Insurance", status: missing.includes(name) ? "Missing" : name === "Approval Letter" ? "Requested" : "Received" } as AuthDoc));

const authSeed: AuthRecord[] = [
  seed("AUTH-3001", "Emma Thompson", "Janelle Thompson", "GA", "Dr. Kim", "Anthem BCBS", "Treatment", "Approved", "Priya K.", "2026-03-22", "2026-04-02", "2026-10-02", 25, 2, 11, [], "Advance client to staffing confirmation", "Availity portal", "Approved after clinical review.", "ANT-88210", "2026-07-05", "Received", "Complete", "Treatment Auth – Approved", "None", "Staffing can finalize schedule"),
  seed("AUTH-3002", "Mason Lee", "Angela Lee", "NC", "Dr. Patel", "Aetna", "Initial", "Awaiting Submission", "Kayla R.", null, null, null, 4, 4, 0, [], "Submit initial assessment auth today", "Aetna provider portal", "Ready for portal entry.", null, "2026-04-27", "Not Started", "Complete", "Pending Initial Auth", "Assessment cannot be scheduled", "Move to Initial Auth Submitted"),
  seed("AUTH-3003", "Ava Brooks", "Michael Brooks", "TN", "Dr. Lee", "United Healthcare", "Treatment", "Submitted", "Marcus T.", "2026-04-13", null, null, 14, 3, 0, [], "Escalate payer follow-up", "UHC portal", "No status update since submission.", "UHC-55218", "2026-04-27", "Received", "Complete", "Treatment Auth – Submitted", "Staffing start held until approval", "Move to Treatment Auth Approved"),
  seed("AUTH-3004", "Noah Rivera", "Camila Rivera", "VA", "Dr. Stone", "Medicaid", "Initial", "Denied", "Devon M.", "2026-04-08", null, null, 9, 2, 0, [], "Prepare appeal packet with medical necessity addendum", "State Medicaid portal", "Denied for medical necessity wording.", "VA-MCD-1182", "2026-04-29", "Not Started", "Not Started", "Initial Auth – Submitted", "Initial assessment blocked by denial", "Appeal or return to intake review"),
  seed("AUTH-3005", "Sophia Grant", "Erin Grant", "MD", "Dr. Kim", "CareFirst", "Treatment", "Missing Documentation", "Riki S.", null, null, null, 5, 5, 0, ["Treatment Plan", "Prescription / Referral"], "Request signed treatment plan and referral", "CareFirst portal", "Portal saved as draft pending documents.", null, "2026-04-28", "Not Started", "Blocked", "Can Not Submit Auth", "Treatment auth cannot be submitted", "Submit once documents arrive"),
  seed("AUTH-3006", "Liam Carter", "Paige Carter", "GA", "Dr. Lee", "Cigna", "Reauth", "Expiring Soon", "Priya K.", "2025-11-10", "2025-11-19", "2026-05-14", 7, 2, 9, [], "Progress report overdue — notify BCBA", "Cigna portal", "Reauth packet not started; expiration near.", "CIG-44192", "2026-04-27", "Overdue", "In Review", "Reauth Triggered", "Existing services at risk", "Reauth submission required"),
  seed("AUTH-3007", "Olivia Singh", "Ravi Singh", "NC", "Dr. Patel", "Trillium", "Treatment", "Approved", "Kayla R.", "2026-03-29", "2026-04-09", "2026-08-09", 18, 3, 11, [], "Confirm schedule block and start date", "Email + portal", "Approved for clinic services.", "TRI-7820", "2026-06-10", "Received", "Complete", "Treatment Auth – Approved", "None", "Move to Scheduling"),
  seed("AUTH-3008", "Ethan Moore", "Laura Moore", "TN", "Dr. Hayes", "BlueCare TN", "Initial", "Submitted", "Marcus T.", "2026-04-22", null, null, 5, 2, 0, [], "Follow up if no payer response tomorrow", "BlueCare portal", "Submission confirmation received.", "BCT-9033", "2026-04-28", "Not Started", "Not Started", "Initial Auth – Submitted", "Assessment start pending auth", "Move to assessment scheduling"),
  seed("AUTH-3009", "Mia Johnson", "Terrell Johnson", "VA", "Dr. Stone", "Anthem HealthKeepers", "Treatment", "Awaiting Submission", "Devon M.", null, null, null, 3, 3, 0, [], "Submit after same-day coordinator review", "Availity portal", "All documents received.", null, "2026-04-27", "Received", "Complete", "Treatment Auth – Awaiting Submission", "Staffing cannot begin", "Move to Submitted"),
  seed("AUTH-3010", "Jackson Reed", "Nora Reed", "MD", "Dr. Kim", "Kaiser Mid-Atlantic", "Reauth", "Expiring Soon", "Riki S.", "2025-12-01", "2025-12-08", "2026-06-08", 6, 2, 7, [], "Start 60-day reauth packet", "Kaiser portal", "BCBA notified; report draft in progress.", "KAI-3381", "2026-05-01", "In Progress", "Not Started", "Reauth Triggered", "Services risk if report slips", "QA review then reauth submission"),
  seed("AUTH-3011", "Isabella Wilson", "Carla Wilson", "GA", "Dr. Lee", "United Healthcare", "Treatment", "Submitted", "Priya K.", "2026-04-05", null, null, 22, 2, 0, [], "Supervisor escalation for payer response", "UHC portal", "Three follow-ups logged without determination.", "UHC-87991", "2026-04-27", "Received", "Complete", "Treatment Auth – Submitted", "Client stuck before staffing start", "Move to approval or appeal"),
  seed("AUTH-3012", "Lucas Martin", "Henry Martin", "NC", "Dr. Patel", "Medicaid", "Initial", "Missing Documentation", "Kayla R.", null, null, null, 2, 2, 0, ["Diagnostic Evaluation"], "Request diagnostic evaluation from family", "NCTracks", "Cannot submit without diagnostic evaluation.", null, "2026-04-28", "Not Started", "Not Started", "Can Not Submit Auth", "Initial auth blocked", "Return to awaiting submission"),
  seed("AUTH-3013", "Harper Allen", "Monica Allen", "TN", "Dr. Hayes", "Cigna", "Reauth", "Expiring Soon", "Marcus T.", "2025-12-15", "2025-12-29", "2026-07-12", 3, 2, 14, [], "Prepare upcoming 90-day reauth checklist", "Cigna portal", "Upcoming window; no immediate blocker.", "CIG-78510", "2026-05-10", "Not Started", "Complete", "Reauth Upcoming", "Future services renewal", "Notify BCBA at 9-week mark"),
  seed("AUTH-3014", "Benjamin Hall", "Tara Hall", "VA", "Dr. Stone", "Aetna Better Health", "Treatment", "Approved", "Devon M.", "2026-04-01", "2026-04-18", "2026-10-18", 9, 3, 17, [], "Send approval letter to scheduling", "Aetna portal", "Partial hour approval; schedule adjusted.", "ABH-2210", "2026-07-18", "Received", "Complete", "Treatment Auth – Approved", "Schedule needs approved hours", "Move to active services"),
  seed("AUTH-3015", "Charlotte Davis", "Wendy Davis", "MD", "Dr. Kim", "CareFirst", "Initial", "Denied", "Riki S.", "2026-04-11", null, null, 6, 2, 0, [], "Call CareFirst and resubmit with corrected CPT", "CareFirst portal", "Denied for CPT mismatch.", "CF-6601", "2026-04-29", "Not Started", "Not Started", "Initial Auth – Submitted", "Assessment authorization denied", "Correct and resubmit"),
  seed("AUTH-3016", "Elijah Perez", "Diana Perez", "GA", "Dr. Kim", "Amerigroup", "Treatment", "Awaiting Submission", "", null, null, null, 6, 6, 0, [], "Assign coordinator and submit treatment auth", "Availity portal", "No assigned coordinator yet.", null, "2026-04-27", "Received", "Complete", "Treatment Auth – Awaiting Submission", "Client stuck because auth owner is missing", "Assign owner then submit"),
];

function seed(id: string, client: string, parent: string, state: AuthRecord["state"], bcba: string, payor: string, authType: AuthType, status: AuthStatus, coordinator: string, submittedDate: string | null, approvedDate: string | null, expirationDate: string | null, daysInStage: number, avgSubmitDays: number, avgApprovalDays: number, missingDocs: string[], nextAction: string, submissionMethod: string, portalNotes: string, referenceNumber: string | null, followUpDate: string | null, progressReportStatus: AuthRecord["progressReportStatus"], qaStatus: AuthRecord["qaStatus"], clientStage: string, blocking: string, nextMovement: string): AuthRecord {
  return {
    id, client, parent, state, bcba, payor, authType, status, coordinator, submittedDate, approvedDate, expirationDate, daysInStage, avgSubmitDays, avgApprovalDays, missingDocs, nextAction, submissionMethod, portalNotes, referenceNumber, followUpDate, progressReportStatus, qaStatus, clientStage, blocking, nextMovement,
    documents: docs(missingDocs),
    tasks: [
      { id: `${id}-t1`, title: nextAction, owner: coordinator || "Unassigned", dueDate: followUpDate || "2026-04-30", completed: false },
      { id: `${id}-t2`, title: status === "Approved" ? "File approval letter" : "Review auth record", owner: bcba, completed: status === "Approved", dueDate: approvedDate || undefined },
    ],
    timeline: [
      { id: `${id}-e1`, title: "Auth created", text: `${authType} authorization opened for ${payor}`, timestamp: "2026-04-01T09:00:00Z", user: "System" },
      ...(submittedDate ? [{ id: `${id}-e2`, title: "Submitted", text: `Submitted via ${submissionMethod}`, timestamp: `${submittedDate}T15:00:00Z`, user: coordinator || "Unassigned" }] : []),
      ...(status === "Denied" ? [{ id: `${id}-e3`, title: "Denied", text: nextAction, timestamp: "2026-04-20T10:00:00Z", user: "Payor" }] : []),
      ...(approvedDate ? [{ id: `${id}-e4`, title: "Approved", text: `Approved by ${payor}`, timestamp: `${approvedDate}T11:00:00Z`, user: "Payor" }] : []),
      ...(status === "Expiring Soon" ? [{ id: `${id}-e5`, title: "Reauth triggered", text: `Expiration window opened for ${expirationDate}`, timestamp: "2026-04-24T08:00:00Z", user: "System" }] : []),
    ],
  };
}

const statusVariant = (status: AuthStatus) => status === "Approved" ? "success" : status === "Denied" || status === "Missing Documentation" ? "destructive" : status === "Submitted" ? "info" : "warning";
const pct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const shortDate = (date?: string | null) => date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
const daysRemaining = (date?: string | null) => date ? Math.ceil((new Date(`${date}T12:00:00Z`).getTime() - today.getTime()) / 86400000) : null;

function alertsFor(auth: AuthRecord) {
  const alerts: { label: string; severity: "red" | "yellow" }[] = [];
  const remaining = daysRemaining(auth.expirationDate);
  if (auth.status === "Awaiting Submission" && auth.daysInStage > 2) alerts.push({ label: "Awaiting submission over 2d", severity: "yellow" });
  if (auth.status === "Submitted" && auth.daysInStage > 10) alerts.push({ label: "Submitted over 10d", severity: "red" });
  if (auth.status === "Denied") alerts.push({ label: "Denied authorization", severity: "red" });
  if (auth.missingDocs.length || auth.status === "Missing Documentation") alerts.push({ label: "Missing documentation", severity: "red" });
  if (remaining !== null && remaining <= 90) alerts.push({ label: `Expiring in ${remaining}d`, severity: remaining <= 30 ? "red" : "yellow" });
  if (auth.progressReportStatus === "Overdue") alerts.push({ label: "Progress report not received", severity: "red" });
  if (auth.qaStatus === "Blocked") alerts.push({ label: "QA blocking submission", severity: "red" });
  if (!auth.coordinator) alerts.push({ label: "No coordinator assigned", severity: "red" });
  if (auth.blocking !== "None") alerts.push({ label: "Client stuck because of auth", severity: "yellow" });
  return alerts;
}

function HealthDot({ health }: { health: Health }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full", health === "green" && "bg-success", health === "yellow" && "bg-warning", health === "red" && "bg-destructive")} />;
}

export default function AuthorizationsDashboard() {
  const [auths, setAuths] = useState<AuthRecord[]>(authSeed);
  const [dateRange, setDateRange] = useState("This Month");
  const [stateFilter, setStateFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [payorFilter, setPayorFilter] = useState(ALL);
  const [ownerFilter, setOwnerFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [activeKpi, setActiveKpi] = useState<KpiFilter>("all");
  const [queue, setQueue] = useState<QueueKey>("urgent");
  const [query, setQuery] = useState("");
  const [selectedAuth, setSelectedAuth] = useState<AuthRecord | null>(null);

  const payors = useMemo(() => [ALL, ...Array.from(new Set(auths.map((a) => a.payor))).sort()], [auths]);
  const owners = useMemo(() => [ALL, "Unassigned", ...Array.from(new Set(auths.map((a) => a.coordinator).filter(Boolean))).sort()], [auths]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return auths
      .filter((a) => stateFilter === ALL || a.state === stateFilter)
      .filter((a) => typeFilter === ALL || a.authType === typeFilter)
      .filter((a) => payorFilter === ALL || a.payor === payorFilter)
      .filter((a) => ownerFilter === ALL || (ownerFilter === "Unassigned" ? !a.coordinator : a.coordinator === ownerFilter))
      .filter((a) => statusFilter === ALL || a.status === statusFilter)
      .filter((a) => dateRange !== "Next 90 Days" || (daysRemaining(a.expirationDate) ?? 999) <= 90)
      .filter((a) => {
        if (activeKpi === "awaiting") return a.status === "Awaiting Submission";
        if (activeKpi === "submitted") return a.status === "Submitted";
        if (activeKpi === "approved") return a.status === "Approved";
        if (activeKpi === "denied") return a.status === "Denied";
        if (activeKpi === "expiring") return (daysRemaining(a.expirationDate) ?? 999) <= 90 || a.status === "Expiring Soon";
        if (activeKpi === "missing") return a.missingDocs.length > 0 || a.status === "Missing Documentation";
        if (activeKpi === "submit-time") return a.status === "Awaiting Submission" || a.submittedDate !== null;
        if (activeKpi === "approval-time") return a.status === "Submitted" || a.status === "Approved";
        return true;
      })
      .filter((a) => !q || [a.client, a.parent, a.state, a.payor, a.authType, a.status, a.coordinator, a.bcba, a.nextAction].some((field) => field.toLowerCase().includes(q)));
  }, [activeKpi, auths, dateRange, ownerFilter, payorFilter, query, stateFilter, statusFilter, typeFilter]);

  const kpis = [
    { key: "awaiting" as KpiFilter, label: "Awaiting Submission", value: filtered.filter((a) => a.status === "Awaiting Submission").length, subtext: "Ready or nearly ready to submit", health: filtered.some((a) => a.status === "Awaiting Submission" && a.daysInStage > 2) ? "yellow" : "green" as Health },
    { key: "submitted" as KpiFilter, label: "Submitted", value: filtered.filter((a) => a.status === "Submitted").length, subtext: "With payors awaiting determination", health: filtered.some((a) => a.status === "Submitted" && a.daysInStage > 10) ? "red" : "yellow" as Health },
    { key: "approved" as KpiFilter, label: "Approved", value: filtered.filter((a) => a.status === "Approved").length, subtext: "Revenue gates cleared", health: "green" as Health },
    { key: "denied" as KpiFilter, label: "Denied", value: filtered.filter((a) => a.status === "Denied").length, subtext: "Needs appeal or correction", health: filtered.some((a) => a.status === "Denied") ? "red" : "green" as Health },
    { key: "expiring" as KpiFilter, label: "Expiring Soon", value: filtered.filter((a) => (daysRemaining(a.expirationDate) ?? 999) <= 90 || a.status === "Expiring Soon").length, subtext: "Inside 90-day reauth window", health: filtered.some((a) => (daysRemaining(a.expirationDate) ?? 999) <= 30) ? "red" : "yellow" as Health },
    { key: "missing" as KpiFilter, label: "Missing Documentation", value: filtered.filter((a) => a.missingDocs.length || a.status === "Missing Documentation").length, subtext: "Blocking clean submission", health: filtered.some((a) => a.missingDocs.length) ? "red" : "green" as Health },
    { key: "submit-time" as KpiFilter, label: "Avg Time to Submit", value: `${avg(filtered.map((a) => a.avgSubmitDays).filter(Boolean))}d`, subtext: "Record creation to submission", health: avg(filtered.map((a) => a.avgSubmitDays).filter(Boolean)) <= 2 ? "green" : "yellow" as Health },
    { key: "approval-time" as KpiFilter, label: "Avg Time to Approval", value: `${avg(filtered.filter((a) => a.avgApprovalDays).map((a) => a.avgApprovalDays))}d`, subtext: "Submission to payer approval", health: avg(filtered.filter((a) => a.avgApprovalDays).map((a) => a.avgApprovalDays)) <= 10 ? "green" : "yellow" as Health },
  ];

  const actionRows = useMemo(() => ({
    urgent: filtered.filter((a) => a.status === "Denied" || a.missingDocs.length || (daysRemaining(a.expirationDate) ?? 999) < 30 || (a.status === "Awaiting Submission" && a.daysInStage > 2) || (a.status === "Submitted" && a.daysInStage > 10)),
    today: filtered.filter((a) => a.status === "Submitted" || a.progressReportStatus === "Overdue" || a.nextAction.toLowerCase().includes("bcba") || a.followUpDate === "2026-04-27"),
    blockers: filtered.filter((a) => a.blocking !== "None" || a.clientStage.includes("Pending") || a.clientStage.includes("Awaiting") || a.clientStage.includes("Submitted")),
  }), [filtered]);

  const queueRows = actionRows[queue].slice(0, 8);
  const total = filtered.length;
  const funnel = ["Awaiting Submission", "Submitted", "Approved", "Client Advanced"].map((stage, index) => {
    const rows = stage === "Client Advanced" ? filtered.filter((a) => a.status === "Approved" && a.nextMovement.toLowerCase().includes("move")) : filtered.filter((a) => a.status === stage);
    const previous = index === 0 ? total : index === 3 ? filtered.filter((a) => a.status === "Approved").length : filtered.filter((a) => a.status === ["Awaiting Submission", "Submitted", "Approved"][index - 1]).length;
    return { stage, count: rows.length, conversion: pct(rows.length, total), avgDays: avg(rows.map((a) => a.daysInStage)), issue: Math.max(0, 100 - pct(rows.length, previous)) };
  });
  const failureRows = filtered.filter((a) => a.status === "Denied" || a.status === "Missing Documentation" || a.missingDocs.length);

  const reauth = filtered.filter((a) => (daysRemaining(a.expirationDate) ?? 999) <= 90).sort((a, b) => (daysRemaining(a.expirationDate) ?? 999) - (daysRemaining(b.expirationDate) ?? 999));
  const payorRows = payors.filter((p) => p !== ALL).map((payor) => {
    const rows = filtered.filter((a) => a.payor === payor);
    return { payor, total: rows.length, approval: pct(rows.filter((a) => a.status === "Approved" || a.status === "Expiring Soon").length, rows.length), denial: pct(rows.filter((a) => a.status === "Denied").length, rows.length), avgApproval: avg(rows.filter((a) => a.avgApprovalDays).map((a) => a.avgApprovalDays)), missing: pct(rows.filter((a) => a.missingDocs.length).length, rows.length), method: rows[0]?.submissionMethod ?? "—", notes: rows.some((a) => a.status === "Submitted" && a.daysInStage > 10) ? "Slow response watch" : rows.some((a) => a.status === "Denied") ? "Denial pattern review" : "Stable" };
  }).filter((row) => row.total > 0);
  const coordinatorRows = ["Unassigned", ...coordinators].map((owner) => {
    const rows = filtered.filter((a) => owner === "Unassigned" ? !a.coordinator : a.coordinator === owner);
    return { owner, assigned: rows.length, awaiting: rows.filter((a) => a.status === "Awaiting Submission").length, submitted: rows.filter((a) => a.status === "Submitted").length, approved: rows.filter((a) => a.status === "Approved" || a.status === "Expiring Soon").length, denied: rows.filter((a) => a.status === "Denied").length, submit: avg(rows.map((a) => a.avgSubmitDays).filter(Boolean)), overdue: rows.filter((a) => a.status === "Submitted" && a.daysInStage > 10).length, risk: rows.filter((a) => (daysRemaining(a.expirationDate) ?? 999) <= 60).length };
  }).filter((row) => row.assigned > 0);

  const updateAuth = (id: string, patch: Partial<AuthRecord>, message: string) => {
    setAuths((current) => current.map((auth) => auth.id === id ? { ...auth, ...patch, timeline: [{ id: `${id}-${Date.now()}`, title: message, text: "Updated from Authorizations Dashboard", timestamp: today.toISOString(), user: "Dashboard user" }, ...auth.timeline] } : auth));
    toast.success(message);
  };
  const quickAction = (auth: AuthRecord, action: string) => {
    if (action === "Open Auth") setSelectedAuth(auth);
    if (action === "Mark Submitted") updateAuth(auth.id, { status: "Submitted", submittedDate: "2026-04-27", daysInStage: 0, nextAction: "Follow up with payer" }, "Authorization marked submitted");
    if (action === "Mark Approved") updateAuth(auth.id, { status: "Approved", approvedDate: "2026-04-27", daysInStage: 0, nextAction: "Advance client movement" }, "Authorization marked approved");
    if (action === "Mark Denied") updateAuth(auth.id, { status: "Denied", daysInStage: 0, nextAction: "Prepare appeal packet" }, "Authorization marked denied");
    if (action === "Request Missing Docs") updateAuth(auth.id, { status: "Missing Documentation", missingDocs: auth.missingDocs.length ? auth.missingDocs : ["Treatment Plan"], nextAction: "Request missing documents" }, "Missing documents requested");
    if (action === "Follow Up") updateAuth(auth.id, { followUpDate: "2026-04-27", nextAction: "Follow-up logged with payer" }, "Follow-up logged");
    if (action === "Assign Owner") updateAuth(auth.id, { coordinator: auth.coordinator ? coordinators[(coordinators.indexOf(auth.coordinator) + 1) % coordinators.length] : "Priya K." }, "Owner assigned");
  };
  const exportRows = () => {
    const csv = ["Client,State,Payor,Auth Type,Status,Coordinator,Next Action", ...filtered.map((a) => [a.client, a.state, a.payor, a.authType, a.status, a.coordinator || "Unassigned", a.nextAction].map((v) => `"${v}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = "authorizations-dashboard.csv"; link.click(); URL.revokeObjectURL(url);
    toast.success("Authorizations export downloaded");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Authorizations Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Submission tracking, approvals, denials, reauth risk, and revenue blockers.</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={exportRows}><Download className="mr-2 h-4 w-4" />Export</Button><Button size="sm" onClick={() => { setActiveKpi("all"); setStatusFilter(ALL); toast.success("Dashboard refreshed"); }}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
        </div>
        <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_0.8fr_1fr_1fr_1.2fr_1fr_1.5fr]">
            <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "Next 90 Days", "All Time"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={stateFilter} onValueChange={setStateFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[ALL, ...states].map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All States" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[ALL, "Initial", "Treatment", "Reauth"].map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Auth Types" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={payorFilter} onValueChange={setPayorFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{payors.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Payors" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{owners.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Coordinators" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[ALL, "Awaiting Submission", "Submitted", "Approved", "Denied", "Missing Documentation", "Expiring Soon"].map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Statuses" : item}</SelectItem>)}</SelectContent></Select>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients, payors, owners..." className="pl-9" /></div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">{kpis.map((kpi) => <button key={kpi.key} onClick={() => setActiveKpi(activeKpi === kpi.key ? "all" : kpi.key)} className={cn("rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", activeKpi === kpi.key ? "border-primary/50 ring-2 ring-primary/15" : "border-border/60")}><div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{kpi.label}</span><HealthDot health={kpi.health} /></div><div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</div><p className="mt-1 text-xs text-muted-foreground">{kpi.subtext}</p></button>)}</section>

      <section className="grid gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-border/60 bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4"><div><h2 className="text-base font-semibold text-foreground">Authorization Action Queue</h2><p className="text-xs text-muted-foreground">Prioritized work across submissions, follow-ups, and client blockers.</p></div><div className="flex rounded-lg bg-muted p-1">{([{ key: "urgent", label: "Urgent Now" }, { key: "today", label: "Follow-Up Today" }, { key: "blockers", label: "Revenue Blockers" }] as const).map((item) => <button key={item.key} onClick={() => setQueue(item.key)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", queue === item.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Client", "State", "Payor", "Auth Type", "Status", "Owner", "Days", "Next Action", "Quick Action"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{queueRows.map((auth) => <tr key={auth.id} className="border-t border-border/50 hover:bg-muted/25"><td className="px-4 py-3"><button onClick={() => setSelectedAuth(auth)} className="text-left"><span className="block font-medium text-foreground">{auth.client}</span><span className="text-xs text-muted-foreground">{auth.id} · {auth.bcba}</span></button></td><td className="px-4 py-3"><StatusBadge status={auth.state} variant="muted" /></td><td className="px-4 py-3 text-xs text-muted-foreground">{auth.payor}</td><td className="px-4 py-3 text-xs text-muted-foreground">{auth.authType}</td><td className="px-4 py-3"><StatusBadge status={auth.status} variant={statusVariant(auth.status)} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{auth.coordinator || "Unassigned"}</td><td className="px-4 py-3 text-xs font-medium text-foreground">{auth.daysInStage}d</td><td className="max-w-[260px] truncate px-4 py-3 text-xs text-muted-foreground">{auth.nextAction}</td><td className="px-4 py-3"><Button variant="outline" size="sm" onClick={() => quickAction(auth, auth.status === "Awaiting Submission" ? "Mark Submitted" : auth.status === "Submitted" ? "Follow Up" : "Open Auth")}>{auth.status === "Awaiting Submission" ? <Send className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}{auth.status === "Awaiting Submission" ? "Submit" : auth.status === "Submitted" ? "Follow Up" : "Open"}</Button></td></tr>)}</tbody></table></div></div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Authorization Funnel</h2><p className="text-xs text-muted-foreground">Revenue-control flow and failure branch.</p></div><Zap className="h-4 w-4 text-primary" /></div><div className="space-y-3">{funnel.map((step, index) => <div key={step.stage} className="rounded-lg border border-border/60 bg-background p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><span className="text-sm font-medium text-foreground">{step.stage}</span></div><span className="text-lg font-semibold text-foreground">{step.count}</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground"><span>Conv {step.conversion}%</span><span>Avg {step.avgDays}d</span><span>Issue {step.issue}%</span></div></div>)}<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground">Denied / Missing Docs</span><span className="text-lg font-semibold text-destructive">{failureRows.length}</span></div><p className="mt-2 text-[11px] text-muted-foreground">Failure branch from submitted or pre-submission QA.</p></div></div></div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Reauth Risk</h2><p className="text-xs text-muted-foreground">Critical windows tied to BCBA progress reports and QA readiness.</p></div><ShieldCheck className="h-4 w-4 text-primary" /></div><div className="grid gap-3 xl:grid-cols-3">{([{ title: "Critical", max: 30, min: -999 }, { title: "At Risk", min: 31, max: 60 }, { title: "Upcoming", min: 61, max: 90 }] as const).map((group) => <div key={group.title} className="rounded-lg border border-border/60 bg-background p-3"><h3 className="mb-3 text-sm font-semibold text-foreground">{group.title}</h3><div className="space-y-2">{reauth.filter((a) => { const d = daysRemaining(a.expirationDate) ?? 999; return d >= group.min && d <= group.max; }).map((auth) => <button key={auth.id} onClick={() => setSelectedAuth(auth)} className="w-full rounded-md border border-border/50 p-3 text-left hover:bg-muted/30"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-foreground">{auth.client}</span><StatusBadge status={`${daysRemaining(auth.expirationDate)}d`} variant={(daysRemaining(auth.expirationDate) ?? 999) <= 30 ? "destructive" : "warning"} /></div><div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground"><span>{auth.bcba}</span><span>{auth.payor}</span><span>Expires {shortDate(auth.expirationDate)}</span><span>{auth.coordinator || "Unassigned"}</span><span>Report {auth.progressReportStatus}</span><span>QA {auth.qaStatus}</span></div></button>)}{reauth.filter((a) => { const d = daysRemaining(a.expirationDate) ?? 999; return d >= group.min && d <= group.max; }).length === 0 && <p className="text-sm text-muted-foreground">No records in this window.</p>}</div></div>)}</div></section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><PerformanceTable title="Payor Performance" headers={["Payor", "Total", "Approval", "Denial", "Avg Approval", "Missing Docs", "Method", "Notes"]} rows={payorRows.map((r) => [r.payor, String(r.total), `${r.approval}%`, `${r.denial}%`, `${r.avgApproval}d`, `${r.missing}%`, r.method, r.notes])} /><PerformanceTable title="Authorization Coordinator Performance" headers={["Coordinator", "Assigned", "Awaiting", "Submitted", "Approved", "Denied", "Avg Submit", "Overdue", "Reauth Risk"]} rows={coordinatorRows.map((r) => [r.owner, String(r.assigned), String(r.awaiting), String(r.submitted), String(r.approved), String(r.denied), `${r.submit}d`, String(r.overdue), String(r.risk)])} /></section>

      <section className="rounded-xl border border-border/60 bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4"><div><h2 className="text-base font-semibold text-foreground">Authorization Worklist</h2><p className="text-xs text-muted-foreground">{filtered.length} authorizations match the current dashboard filters.</p></div>{activeKpi !== "all" && <Button variant="outline" size="sm" onClick={() => setActiveKpi("all")}>Clear KPI filter</Button>}</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Client", "State", "Payor", "Auth Type", "Status", "Coordinator", "Submission", "Approval", "Expiration", "Days", "Missing Docs", "Next Action", "Alerts"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{filtered.map((auth) => { const alerts = alertsFor(auth); return <tr key={auth.id} onClick={() => setSelectedAuth(auth)} className="cursor-pointer border-t border-border/50 hover:bg-muted/25"><td className="px-4 py-3"><span className="block font-medium text-foreground">{auth.client}</span><span className="text-xs text-muted-foreground">{auth.id}</span></td><td className="px-4 py-3"><StatusBadge status={auth.state} variant="muted" /></td><td className="px-4 py-3 text-xs text-muted-foreground">{auth.payor}</td><td className="px-4 py-3 text-xs text-muted-foreground">{auth.authType}</td><td className="px-4 py-3"><StatusBadge status={auth.status} variant={statusVariant(auth.status)} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{auth.coordinator || "Unassigned"}</td><td className="px-4 py-3 text-xs text-muted-foreground">{shortDate(auth.submittedDate)}</td><td className="px-4 py-3 text-xs text-muted-foreground">{shortDate(auth.approvedDate)}</td><td className="px-4 py-3 text-xs text-muted-foreground">{shortDate(auth.expirationDate)}</td><td className="px-4 py-3 text-xs font-medium text-foreground">{auth.daysInStage}d</td><td className="px-4 py-3 text-xs text-muted-foreground">{auth.missingDocs.length ? auth.missingDocs.length : "—"}</td><td className="max-w-[260px] truncate px-4 py-3 text-xs text-muted-foreground">{auth.nextAction}</td><td className="px-4 py-3">{alerts.length ? <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><AlertCircle className="h-3.5 w-3.5" />{alerts.length}</span> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}</td></tr>; })}</tbody></table></div></section>

      <AuthDetailSheet auth={selectedAuth ? auths.find((a) => a.id === selectedAuth.id) ?? selectedAuth : null} open={!!selectedAuth} onClose={() => setSelectedAuth(null)} onAction={quickAction} />
    </div>
  );
}

function PerformanceTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return <div className="rounded-xl border border-border/60 bg-card shadow-sm"><div className="border-b border-border/60 p-4"><h2 className="text-base font-semibold text-foreground">{title}</h2></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{headers.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.join("-")} className="border-t border-border/50">{row.map((cell, index) => <td key={`${cell}-${index}`} className={cn("whitespace-nowrap px-4 py-3 text-xs", index === 0 ? "font-medium text-foreground" : "text-muted-foreground")}>{cell}</td>)}</tr>)}</tbody></table></div></div>;
}

function AuthDetailSheet({ auth, open, onClose, onAction }: { auth: AuthRecord | null; open: boolean; onClose: () => void; onAction: (auth: AuthRecord, action: string) => void }) {
  if (!auth) return null;
  const alerts = alertsFor(auth);
  const openTasks = auth.tasks.filter((task) => !task.completed);
  const completeTasks = auth.tasks.filter((task) => task.completed);
  return <Sheet open={open} onOpenChange={(next) => !next && onClose()}><SheetContent side="right" className="w-[640px] overflow-y-auto p-0 sm:max-w-[640px]"><div className="p-6 pb-4"><SheetHeader><SheetTitle className="text-xl">{auth.client}</SheetTitle><SheetDescription>{auth.id} · {auth.state} · {auth.payor} · {auth.authType}</SheetDescription></SheetHeader><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={auth.status} variant={statusVariant(auth.status)} /><StatusBadge status={auth.coordinator || "Unassigned"} variant={auth.coordinator ? "info" : "destructive"} />{alerts.map((alert) => <StatusBadge key={alert.label} status={alert.label} variant={alert.severity === "red" ? "destructive" : "warning"} />)}</div><div className="mt-4 grid grid-cols-3 gap-2">{["Mark Submitted", "Mark Approved", "Mark Denied", "Request Missing Docs", "Follow Up", "Assign Owner"].map((action) => <Button key={action} variant="outline" size="sm" className="h-auto flex-col gap-1 py-2 text-[10px]" onClick={() => onAction(auth, action)}>{action === "Assign Owner" ? <UserPlus className="h-3.5 w-3.5" /> : action.includes("Submitted") ? <Send className="h-3.5 w-3.5" /> : action.includes("Approved") ? <CheckCircle2 className="h-3.5 w-3.5" /> : action.includes("Denied") || action.includes("Missing") ? <AlertTriangle className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}{action}</Button>)}</div></div><Separator /><Tabs defaultValue="overview" className="p-4"><TabsList className="grid h-auto w-full grid-cols-4 gap-1 xl:grid-cols-7"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="submission">Submission</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger><TabsTrigger value="reauth">Reauth</TabsTrigger><TabsTrigger value="client">Client</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-3 pt-3"><DetailGrid rows={[["Client", auth.client], ["Payor", auth.payor], ["Auth type", auth.authType], ["Status", auth.status], ["Owner", auth.coordinator || "Unassigned"], ["Days in stage", `${auth.daysInStage} days`], ["Next action", auth.nextAction], ["Blockers", alerts.map((a) => a.label).join(", ") || "None"]]} /></TabsContent><TabsContent value="submission" className="space-y-3 pt-3"><DetailGrid rows={[["Submission method", auth.submissionMethod], ["Portal notes", auth.portalNotes], ["Submitted date", shortDate(auth.submittedDate)], ["Reference number", auth.referenceNumber || "—"], ["Follow-up date", shortDate(auth.followUpDate)]]} /></TabsContent><TabsContent value="documents" className="space-y-2 pt-3">{auth.documents.map((doc) => <div key={doc.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3 text-sm"><span className="flex items-center gap-2 text-foreground"><FileText className="h-4 w-4 text-primary" />{doc.name}</span><StatusBadge status={doc.status} variant={doc.status === "Received" ? "success" : doc.status === "Missing" ? "destructive" : "warning"} /></div>)}</TabsContent><TabsContent value="reauth" className="space-y-3 pt-3"><DetailGrid rows={[["Expiration date", shortDate(auth.expirationDate)], ["Days remaining", String(daysRemaining(auth.expirationDate) ?? "—")], ["Progress report", auth.progressReportStatus], ["BCBA notified", auth.progressReportStatus === "Not Started" ? "No" : "Yes"], ["QA review", auth.qaStatus], ["Owner", auth.coordinator || "Unassigned"]]} /></TabsContent><TabsContent value="client" className="space-y-3 pt-3"><DetailGrid rows={[["Linked client stage", auth.clientStage], ["What auth is blocking", auth.blocking], ["Next movement", auth.nextMovement], ["BCBA", auth.bcba], ["Parent", auth.parent]]} /></TabsContent><TabsContent value="tasks" className="space-y-4 pt-3"><TaskList title="Open tasks" tasks={openTasks} /><TaskList title="Completed tasks" tasks={completeTasks} /></TabsContent><TabsContent value="timeline" className="pt-3"><Timeline items={auth.timeline} /></TabsContent></Tabs></SheetContent></Sheet>;
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return <div className="grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p></div>)}</div>;
}

function TaskList({ title, tasks }: { title: string; tasks: AuthTask[] }) {
  return <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4><div className="space-y-2">{tasks.length ? tasks.map((task) => <div key={task.id} className="rounded-lg border border-border/60 bg-background p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className={task.completed ? "text-muted-foreground line-through" : "text-foreground"}>{task.title}</span><span className="text-xs text-muted-foreground">{shortDate(task.dueDate)}</span></div><p className="mt-1 text-xs text-muted-foreground">Owner: {task.owner}</p></div>) : <p className="text-sm text-muted-foreground">None</p>}</div></div>;
}

function Timeline({ items }: { items: AuthEvent[] }) {
  return <div className="space-y-3">{items.map((item) => <div key={item.id} className="flex gap-3"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10"><Clock className="h-3.5 w-3.5 text-primary" /></span><div><p className="text-sm font-medium text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.text}</p><p className="mt-1 text-[11px] text-muted-foreground">{shortDate(item.timestamp)}{item.user ? ` · ${item.user}` : ""}</p></div></div>)}</div>;
}
