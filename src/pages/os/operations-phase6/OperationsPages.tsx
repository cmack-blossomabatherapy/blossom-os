import { useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ShieldCheck, CheckCircle2, XCircle, Calendar, Users, ClipboardCheck,
  HeartHandshake, AlertTriangle, ListTodo, MapPin, FileSignature,
  ClipboardList, Plus, Search, ArrowUpRight, type LucideIcon,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * NOTE:
 * The State Director command center pages (StateOperationsPage,
 * StateEscalationsPage, OperationalTasksPage) have moved to
 * `src/pages/os/stateDirector/StateDirectorPages.tsx` and are now backed by
 * the persisted state-director operating store. They are re-exported below
 * so existing App.tsx imports keep working.
 */
export {
  StateOperationsPage,
  StateEscalationsPage,
  OperationalTasksPage,
} from "@/pages/os/stateDirector/StateDirectorPages";

/* -------------------------------------------------------------------------- */
/* Layout primitives                                                          */
/* -------------------------------------------------------------------------- */

function Shell({ children }: { children: ReactNode }) {
  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">{children}</div>
    </OSShell>
  );
}

function PageHeader({
  eyebrow, title, subtitle, icon: Icon, actions,
}: {
  eyebrow: string; title: string; subtitle: string; icon: LucideIcon; actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          <Icon className="h-3.5 w-3.5" /> {eyebrow}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

function ActionRow({ actions }: { actions: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <span key={a} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-border/60 bg-muted/40 text-xs text-muted-foreground">
          {a}
        </span>
      ))}
    </div>
  );
}

function KPI({ label, value, tone = "muted" }: { label: string; value: string | number; tone?: "ok" | "warn" | "danger" | "info" | "muted" }) {
  return (
    <Card className="p-5 rounded-2xl border-border/60">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-3xl font-semibold tracking-tight mt-2",
        tone === "ok" && "text-emerald-600",
        tone === "warn" && "text-amber-600",
        tone === "danger" && "text-red-600",
        tone === "info" && "text-sky-600",
      )}>{value}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Submitted: "bg-sky-50 text-sky-700 border-sky-200",
    "In Review": "bg-sky-50 text-sky-700 border-sky-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-800 border-amber-200",
    "Missing Docs": "bg-amber-50 text-amber-800 border-amber-200",
    "Expiring Soon": "bg-amber-50 text-amber-800 border-amber-200",
    Denied: "bg-red-50 text-red-700 border-red-200",
    Escalated: "bg-red-50 text-red-700 border-red-200",
    Blocked: "bg-red-50 text-red-700 border-red-200",
    Resubmitted: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return <Badge variant="outline" className={cn(map[status] ?? "bg-muted text-muted-foreground")}>{status}</Badge>;
}

function DataTable({ columns, rows }: { columns: string[]; rows: (ReactNode | string)[][] }) {
  const [q, setQ] = useState("");
  const filtered = rows.filter((r) =>
    r.some((c) => (typeof c === "string" ? c.toLowerCase().includes(q.toLowerCase()) : false)),
  );
  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9 h-10" />
      </div>
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{columns.map((c) => <th key={c} className="text-left font-medium px-4 py-3 whitespace-nowrap">{c}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} className="border-t border-border/60 hover:bg-muted/30">
                  {row.map((cell, j) => (
                    <td key={j} className={cn("px-4 py-3 whitespace-nowrap", j === 0 ? "font-medium" : "text-muted-foreground")}>{cell}</td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">No records yet — ready for Blossom OS data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SectionCard({ title, description, children, action }: { title: string; description?: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-6 rounded-2xl border-border/60">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. State Operations                                                        */
/* -------------------------------------------------------------------------- */



/* -------------------------------------------------------------------------- */
/* 2. Authorizations                                                          */
/* -------------------------------------------------------------------------- */

const AUTH_ROWS: (string | ReactNode)[][] = [
  ["AUTH-1042", "Mia Carter", "Initial", <StatusBadge status="Submitted" />, "Ashley Tran", "Blossom GA", "Aetna", "—", "GA", "Home", "2025-01-09", "2025-01-15", "TRK-99281", "—", "—", "Awaiting payer", "In-Network", "Commercial", "Behavioral Health", "Auth Team"],
  ["AUTH-1041", "Liam Patel", "Reauth", <StatusBadge status="Missing Docs" />, "Marcus Hill", "Blossom NC", "BCBS NC", "Cigna", "NC", "Clinic", "2025-01-04", "—", "—", "—", "—", "Need recent assessment", "In-Network", "Commercial", "Behavioral Health", "Auth Team"],
  ["AUTH-1040", "Noah Brooks", "Reauth", <StatusBadge status="Approved" />, "Priya Patel", "Blossom VA", "United", "—", "VA", "Home", "2024-12-20", "2024-12-22", "TRK-99240", "2025-01-02", "2026-01-01", "Approved", "In-Network", "Commercial", "Behavioral Health", "Auth Team"],
];

/**
 * Static Phase-6 Authorizations table retired. The canonical live workspace
 * lives at `/authorizations` and reads from the merged authorization data
 * source (Monday import + Blossom OS operational overlay + CentralReach when
 * configured).
 */
export function AuthorizationsPhase6Page() {
  return <Navigate to="/authorizations" replace />;
}

/* -------------------------------------------------------------------------- */
/* 3. Approved Authorizations                                                 */
/* -------------------------------------------------------------------------- */

const APPROVED_ROWS: (string | ReactNode)[][] = [
  ["AUTH-1040", "Noah Brooks", "United", "VA", "2025-01-02", "2026-01-01", "240 hrs", <StatusBadge status="Active" />],
  ["AUTH-1037", "Ava Kim", "BCBS NC", "NC", "2024-08-15", "2025-02-15", "180 hrs", <StatusBadge status="Expiring Soon" />],
  ["AUTH-1031", "Ethan Lee", "Aetna", "GA", "2024-06-01", "2025-06-01", "300 hrs", <StatusBadge status="Active" />],
];

/** Static approved-authorizations table retired — redirects to the live workspace filtered to Approved. */
export function ApprovedAuthorizationsPage() {
  return <Navigate to="/authorizations?stage=approved" replace />;
}

/* -------------------------------------------------------------------------- */
/* 4. Denials                                                                 */
/* -------------------------------------------------------------------------- */

const DENIAL_ROWS: (string | ReactNode)[][] = [
  ["Mia Carter", "GA", "Ashley Tran", "TRK-99211", "Aetna", <StatusBadge status="Denied" />, "Medical necessity", "Reauth", "2025-01-05", "2025-02-05", "—", "2025-01-25", "Awaiting BCBA edits"],
  ["Liam Patel", "NC", "Marcus Hill", "TRK-99205", "BCBS NC", <StatusBadge status="Resubmitted" />, "Missing assessment", "Reauth", "2024-12-29", "2025-01-29", "2025-01-12", "—", "Resubmitted with updated PR"],
  ["Sophia Reyes", "VA", "Priya Patel", "TRK-99198", "United", <StatusBadge status="Escalated" />, "Service location", "Initial", "2024-12-20", "2025-01-20", "—", "—", "Escalated to payer rep"],
];

/** Static denials table retired — redirects to the live workspace filtered to Denied. */
export function DenialsPage() {
  return <Navigate to="/authorizations?stage=denied" replace />;
}

/* -------------------------------------------------------------------------- */
/* 5. Scheduling                                                              */
/* -------------------------------------------------------------------------- */

export function SchedulingPhase6Page() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Operations"
        title="Scheduling"
        subtitle="Manage schedule gaps, session coverage, cancellations, make-up sessions, and recurring coverage needs."
        icon={Calendar}
        actions={<Button size="sm">View schedule gaps</Button>}
      />
      <ActionRow actions={["View schedule gaps", "Assign coverage", "Track cancellation", "Create make-up session task", "Escalate uncovered session"]} />
      <div className="grid gap-4 md:grid-cols-4">
        <KPI label="Open gaps today" value={7} tone="warn" />
        <KPI label="Uncovered this week" value={14} tone="danger" />
        <KPI label="Cancellations" value={9} tone="warn" />
        <KPI label="Make-up sessions" value={5} tone="info" />
      </div>
      <DataTable
        columns={["Client", "State", "Session", "Status", "BCBA", "RBT", "Action"]}
        rows={[
          ["Mia Carter", "GA", "Mon 2:00–4:00", <StatusBadge status="Pending" />, "Ashley Tran", "—", "Assign RBT"],
          ["Noah Brooks", "VA", "Wed 9:00–11:00", <StatusBadge status="Blocked" />, "Priya Patel", "—", "Escalate"],
          ["Ava Kim", "NC", "Thu 3:00–5:00", <StatusBadge status="Resolved" />, "Marcus Hill", "Jordan Park", "—"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Staffing                                                                */
/* -------------------------------------------------------------------------- */

export function StaffingPhase6Page() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Operations"
        title="Staffing"
        subtitle="Match RBTs to cases, manage open staffing needs, track family preferences, and monitor coverage risk."
        icon={Users}
        actions={<Button size="sm">Match RBT</Button>}
      />
      <ActionRow actions={["View open cases", "Match RBT", "Record family preference", "Update staffing status", "Escalate hard-to-staff case", "Open patient journey"]} />
      <div className="grid gap-4 md:grid-cols-4">
        <KPI label="Open cases" value={18} tone="warn" />
        <KPI label="Matched this week" value={11} tone="ok" />
        <KPI label="Hard-to-staff" value={4} tone="danger" />
        <KPI label="Avg time to staff" value="6.2d" tone="info" />
      </div>
      <DataTable
        columns={["Client", "State", "Hours / wk", "BCBA", "Preferences", "Status", "Owner"]}
        rows={[
          ["Mia Carter", "GA", "20", "Ashley Tran", "Female RBT", <StatusBadge status="Pending" />, "Staffing"],
          ["Sophia Reyes", "VA", "15", "Priya Patel", "Bilingual ES/EN", <StatusBadge status="Escalated" />, "Staffing Lead"],
          ["Ethan Lee", "GA", "25", "Ashley Tran", "Mornings only", <StatusBadge status="Active" />, "Staffing"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. No OON Benefits                                                         */
/* -------------------------------------------------------------------------- */

export function NoOONBenefitsPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Operations"
        title="No OON Benefits"
        subtitle="Track leads or patients without out-of-network benefits, SCA status, benefit status, and follow-up path."
        icon={ShieldCheck}
        actions={<Button size="sm" variant="outline">Update VOB status</Button>}
      />
      <ActionRow actions={["Update VOB status", "Update SCA status", "Assign owner", "Add follow-up", "Link to patient journey"]} />
      <div className="grid gap-4 md:grid-cols-4">
        <KPI label="Active no-OON" value={22} tone="warn" />
        <KPI label="SCA in progress" value={6} tone="info" />
        <KPI label="SCA approved" value={4} tone="ok" />
        <KPI label="Closed lost" value={9} tone="danger" />
      </div>
      <DataTable
        columns={["Lead / Patient", "Payer", "VOB Status", "SCA Status", "State", "Owner", "Next Follow-up"]}
        rows={[
          ["Liam Patel", "Anthem (OON)", "Complete", "Requested", "NC", "Intake", "2025-01-22"],
          ["Ava Kim", "Humana (OON)", "Complete", "Negotiating", "NC", "Finance", "2025-01-19"],
          ["Jaden Howard", "Optum (OON)", "Pending", "—", "GA", "Intake", "2025-01-25"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Case Management                                                         */
/* -------------------------------------------------------------------------- */

export function CaseManagementPhase6Page() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Operations"
        title="Case Management"
        subtitle="Coordinate assigned client follow-up, family communication, case notes, evaluations, care coordination, and status visibility."
        icon={HeartHandshake}
        actions={<Button size="sm">Add case note</Button>}
      />
      <ActionRow actions={["View caseload", "Add case note", "Log family communication", "Open evaluations", "Assign follow-up", "Open patient journey"]} />
      <div className="grid gap-4 md:grid-cols-4">
        <KPI label="Active caseload" value={64} tone="info" />
        <KPI label="Needs follow-up" value={9} tone="warn" />
        <KPI label="Evaluations open" value={5} tone="info" />
        <KPI label="Escalations" value={2} tone="danger" />
      </div>
      <DataTable
        columns={["Client", "State", "Case Manager", "Last Touch", "Next Action", "Status"]}
        rows={[
          ["Mia Carter", "GA", "Sasha Long", "2 days ago", "Family check-in call", <StatusBadge status="Active" />],
          ["Sophia Reyes", "VA", "Sasha Long", "5 days ago", "Coordinate eval", <StatusBadge status="Pending" />],
          ["Noah Brooks", "VA", "Marc Vega", "8 days ago", "Escalate", <StatusBadge status="Escalated" />],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. QA Dashboard (Phase 6)                                                  */
/* -------------------------------------------------------------------------- */

export function QAPhase6OpsPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Operations"
        title="QA Dashboard"
        subtitle="Review documentation quality, session notes, compliance issues, corrections, and QA outcomes."
        icon={ClipboardCheck}
        actions={<Button size="sm" variant="outline">Export QA report</Button>}
      />
      <ActionRow actions={["Review documentation", "Flag issue", "Assign correction", "Mark resolved", "Export QA report"]} />
      <div className="grid gap-4 md:grid-cols-4">
        <KPI label="Open QA items" value={12} tone="warn" />
        <KPI label="Awaiting BCBA" value={5} tone="warn" />
        <KPI label="Resolved this week" value={18} tone="ok" />
        <KPI label="Compliance score" value="94%" tone="ok" />
      </div>
      <DataTable
        columns={["Record", "Client", "BCBA", "Issue", "Severity", "Status", "Owner"]}
        rows={[
          ["Session Note 4019", "Mia Carter", "Ashley Tran", "Missing supervision sig", "High", <StatusBadge status="Pending" />, "Ashley Tran"],
          ["PR Q4 — Liam P.", "Liam Patel", "Marcus Hill", "Goals missing data", "Medium", <StatusBadge status="In Review" />, "QA Team"],
          ["Session Note 4014", "Ava Kim", "Marcus Hill", "Late submission", "Low", <StatusBadge status="Resolved" />, "—"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 10. Family Staffing Preferences                                            */
/* -------------------------------------------------------------------------- */

export function FamilyStaffingPreferencesPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Operations"
        title="Family Staffing Preferences"
        subtitle="Track family preferences that affect staffing decisions, RBT matching, schedules, communication, and continuity of care."
        icon={HeartHandshake}
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add preference</Button>}
      />
      <ActionRow actions={["Add preference", "Update preference", "Link to client", "Link to staffing queue"]} />
      <DataTable
        columns={["Client", "Preference", "Category", "Notes", "Linked Staffing"]}
        rows={[
          ["Mia Carter", "Female RBT only", "Match", "Family request", "Open"],
          ["Sophia Reyes", "Bilingual Spanish / English", "Language", "Mother prefers Spanish", "Open"],
          ["Ethan Lee", "Mornings only", "Schedule", "School in afternoons", "Active"],
          ["Noah Brooks", "No new RBTs this quarter", "Continuity", "Behavior regression risk", "Active"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 11. State Escalations                                                      */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/* 12. Operational Tasks                                                      */
/* -------------------------------------------------------------------------- */


// Silence unused imports for icons reserved for future expansion.
void ClipboardList; void FileSignature;
