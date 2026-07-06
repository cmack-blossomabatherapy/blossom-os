import { useState, type ReactNode } from "react";
import {
  Workflow, Inbox, Bug, Search, Plus, type LucideIcon,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Shell({ children }: { children: ReactNode }) {
  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">{children}</div>
    </OSShell>
  );
}

function PageHeader({ eyebrow, title, subtitle, icon: Icon, actions }: {
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
        <span key={a} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-border/60 bg-muted/40 text-xs text-muted-foreground">{a}</span>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Planned: "bg-sky-50 text-sky-700 border-sky-200",
    "In Build": "bg-sky-50 text-sky-700 border-sky-200",
    Replaced: "bg-muted text-muted-foreground",
    Inactive: "bg-muted text-muted-foreground",
    Open: "bg-sky-50 text-sky-700 border-sky-200",
    Triage: "bg-amber-50 text-amber-800 border-amber-200",
    "In Progress": "bg-sky-50 text-sky-700 border-sky-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Blocked: "bg-red-50 text-red-700 border-red-200",
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-800 border-amber-200",
    Low: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={cn(map[status] ?? "bg-muted text-muted-foreground")}>{status}</Badge>;
}

function DataTable({ columns, rows }: { columns: string[]; rows: (ReactNode | string)[][] }) {
  const [q, setQ] = useState("");
  const filtered = rows.filter((r) => r.some((c) => typeof c === "string" && c.toLowerCase().includes(q.toLowerCase())));
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
                <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">No records — ready for Blossom OS data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Workflow Inventory                                                         */
/* -------------------------------------------------------------------------- */

export function WorkflowInventoryPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="System Tools"
        title="Workflow Inventory"
        subtitle="Document current and planned Blossom OS workflows, owners, statuses, data sources, and build priority."
        icon={Workflow}
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add workflow</Button>}
      />
      <ActionRow actions={["Add workflow", "Edit workflow", "Mark active", "Mark inactive", "Mark replaced", "Assign owner"]} />
      <DataTable
        columns={["Workflow", "Department", "Owner", "Current Source", "Future Blossom OS Module", "Status", "Priority", "Notes"]}
        rows={[
          ["Intake → VOB handoff", "Intake", "Maria Lopez", "Spreadsheet", "Intake / VOB", <StatusBadge status="In Build" />, <StatusBadge status="High" />, "Phase 6"],
          ["Authorization submission", "Authorizations", "Briana Diaz", "External tracker", "Authorizations", <StatusBadge status="In Build" />, <StatusBadge status="High" />, "Phase 6"],
          ["Denials follow-up", "Authorizations", "Briana Diaz", "Spreadsheet", "Denials", <StatusBadge status="Planned" />, <StatusBadge status="High" />, "Phase 6"],
          ["Staffing match", "Staffing", "Devon Ross", "External board", "Staffing", <StatusBadge status="In Build" />, <StatusBadge status="High" />, "Phase 6"],
          ["Family preferences", "Case Mgmt", "Sasha Long", "Notes", "Family Staffing Preferences", <StatusBadge status="Active" />, <StatusBadge status="Medium" />, "Phase 6"],
          ["NFC badge issuance", "HR / Ops", "HR Lead", "Manual", "NFC Badge Mgmt", <StatusBadge status="Active" />, <StatusBadge status="Medium" />, "Phase 5"],
          ["Device requests", "HR / IT", "Ops", "Email", "Device Requests", <StatusBadge status="Active" />, <StatusBadge status="Medium" />, "Phase 5"],
          ["Lead routing", "Marketing", "Growth Lead", "External form", "Referral CRM", <StatusBadge status="In Build" />, <StatusBadge status="Medium" />, "Phase 4"],
          ["After-hours call triage", "Communications", "Ops", "External", "Phone System", <StatusBadge status="Active" />, <StatusBadge status="Medium" />, "Live"],
          ["Old project board", "Operations", "—", "External board", "Operational Tasks", <StatusBadge status="Replaced" />, <StatusBadge status="Low" />, "Sunset"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Request Intake                                                             */
/* -------------------------------------------------------------------------- */

export function RequestIntakePage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="System Tools"
        title="Request Intake"
        subtitle="Submit and track requests for Blossom OS improvements, workflow changes, access needs, bugs, and new module ideas."
        icon={Inbox}
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Submit request</Button>}
      />
      <ActionRow actions={["Submit request", "Categorize request", "Assign owner", "Set priority", "Update status", "Mark resolved"]} />
      <SystemRequestsPanel />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Issue Tracker                                                              */
/* -------------------------------------------------------------------------- */

export function IssueTrackerPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="System Tools"
        title="Issue Tracker"
        subtitle="Track system issues, broken workflows, access problems, data issues, and operational blockers."
        icon={Bug}
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add issue</Button>}
      />
      <ActionRow actions={["Add issue", "Assign issue", "Set priority", "Update status", "Add notes", "Mark resolved"]} />
      <DataTable
        columns={["Issue", "Area", "Reported by", "Owner", "Priority", "Status", "Notes"]}
        rows={[
          ["Sidebar collapses on mobile rotate", "UI / Sidebar", "Devon Ross", "Engineering", <StatusBadge status="Medium" />, <StatusBadge status="Open" />, "Repro on iOS"],
          ["Auth queue export missing tracking #", "Authorizations", "Briana Diaz", "Engineering", <StatusBadge status="High" />, <StatusBadge status="In Progress" />, "—"],
          ["Stale role label in directory", "Directory", "HR Lead", "Admin", <StatusBadge status="Low" />, <StatusBadge status="Triage" />, "—"],
          ["Vault audit log not visible", "Vault", "Lauren Brewer", "Engineering", <StatusBadge status="High" />, <StatusBadge status="Blocked" />, "Backend pending"],
        ]}
      />
    </Shell>
  );
}
