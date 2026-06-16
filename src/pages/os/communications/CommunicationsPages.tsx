import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Phone, PhoneCall, Users as UsersIcon, ClipboardList, Activity, HeartHandshake,
  Search, Plus, ArrowUpRight, BookUser, type LucideIcon,
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
    Open: "bg-sky-50 text-sky-700 border-sky-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Follow-up needed": "bg-amber-50 text-amber-800 border-amber-200",
    Urgent: "bg-red-50 text-red-700 border-red-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-800 border-amber-200",
    Denied: "bg-red-50 text-red-700 border-red-200",
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

function JourneyLink() {
  return (
    <Link to="/patient-journey" className="inline-flex items-center gap-1 text-primary hover:underline">
      Open Patient Journey <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Call Logs                                                                  */
/* -------------------------------------------------------------------------- */

export function CallLogsPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Communications"
        title="Call Logs"
        subtitle="Search and review call activity across Blossom, including source, owner, outcome, urgency, follow-up status, and related patient or lead."
        icon={PhoneCall}
        actions={<Button size="sm" variant="outline">Export</Button>}
      />
      <ActionRow actions={["Assign follow-up", "Mark follow-up complete", "Link to patient journey", "Add note", "Escalate urgent call"]} />
      <DataTable
        columns={["Caller", "Phone", "Date / Time", "Stage", "Caller Type", "Outcome", "Urgency", "Follow-up", "Owner", "State", "Related", "Recording"]}
        rows={[
          ["Mia's mother", "(404) 555-0117", "Today 10:42", "After-hours", "Family", "Voicemail", <StatusBadge status="Urgent" />, <StatusBadge status="Follow-up needed" />, "Sasha Long", "GA", <JourneyLink />, "Play"],
          ["Dr. Patel (referral)", "(919) 555-0184", "Today 09:15", "New referral", "Provider", "Connected", "Normal", <StatusBadge status="Complete" />, "Intake", "NC", <JourneyLink />, "Play"],
          ["Unknown", "(703) 555-0142", "Yesterday 16:30", "Inbound", "Lead", "No answer", "Normal", <StatusBadge status="Open" />, "Intake", "VA", "—", "Play"],
          ["Aetna rep", "(800) 555-2284", "Yesterday 13:02", "Payer", "Insurance", "Connected", "Normal", <StatusBadge status="Resolved" />, "Auth Team", "GA", "AUTH-1042", "Play"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Phone Requests (top-level wrapper)                                         */
/* -------------------------------------------------------------------------- */

export function PhoneRequestsTopPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Communications"
        title="Phone Requests"
        subtitle="Submit, track, approve, and resolve phone-related requests for users, departments, shared lines, and communication workflows."
        icon={ClipboardList}
        actions={
          <>
            <Button asChild size="sm" variant="outline"><Link to="/phone/requests">Open queue</Link></Button>
            <Button asChild size="sm"><Link to="/phone/requests/new"><Plus className="h-4 w-4 mr-1.5" />Submit request</Link></Button>
          </>
        }
      />
      <ActionRow actions={["Submit request", "Assign request", "Update status", "Approve / deny request", "Mark resolved"]} />
      <DataTable
        columns={["Request", "Requester", "Department", "Type", "Status", "Submitted"]}
        rows={[
          ["PR-204", "Devon Ross", "Scheduling", "New shared line", <StatusBadge status="Pending" />, "2 days ago"],
          ["PR-203", "Maria Lopez", "Intake", "Forward number", <StatusBadge status="Approved" />, "5 days ago"],
          ["PR-201", "Ashley Tran", "Clinical", "Voicemail box", <StatusBadge status="Resolved" />, "1 week ago"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Directory (top-level wrapper)                                              */
/* -------------------------------------------------------------------------- */

export function DirectoryTopPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Communications"
        title="Directory"
        subtitle="Search internal users, departments, shared lines, contact ownership, and communication routing details."
        icon={BookUser}
        actions={<Button asChild size="sm" variant="outline"><Link to="/phone/directory">Open full directory</Link></Button>}
      />
      <ActionRow actions={["Search directory", "Filter by department", "Open employee profile", "Open shared line", "Copy contact details"]} />
      <DataTable
        columns={["Name", "Role", "Department", "State", "Email", "Phone", "Shared line"]}
        rows={[
          ["Lauren Brewer", "Executive", "Executive", "GA", "lauren@blossomaba.com", "(404) 555-1010", "—"],
          ["Briana Diaz", "Operations Leadership", "Operations", "Multi", "briana@blossomaba.com", "(404) 555-1011", "ops@"],
          ["Maria Lopez", "Intake Coordinator", "Intake", "GA", "intake@blossomaba.com", "(404) 555-1020", "intake@"],
          ["Devon Ross", "Scheduling Lead", "Scheduling", "NC", "scheduling@blossomaba.com", "(919) 555-1030", "scheduling@"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* User Activity Log                                                          */
/* -------------------------------------------------------------------------- */

const USER_ACTIVITY_TYPES = [
  "Login", "Role switch", "Record viewed", "Record edited", "Task created", "Task completed",
  "Note added", "Follow-up assigned", "Status changed", "Export generated",
  "Protected login vault accessed", "NFC badge updated",
];

export function UserActivityLogPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Communications"
        title="User Activity Log"
        subtitle="Track internal user actions across Blossom OS so leadership can understand ownership, updates, follow-up, and system activity."
        icon={Activity}
        actions={<Button size="sm" variant="outline">Export audit log</Button>}
      />
      <ActionRow actions={["Search user activity", "Filter by user", "Filter by action type", "Filter by date", "Open related record", "Export audit log"]} />
      <div className="text-xs text-muted-foreground">
        UI scaffold ready for backend logging. Activity types covered: {USER_ACTIVITY_TYPES.join(" · ")}.
      </div>
      <DataTable
        columns={["When", "User", "Action", "Record", "Department", "Detail"]}
        rows={[
          ["10:42 AM", "Lauren Brewer", "Protected login vault accessed", "Vault", "Executive", "Viewed CentralReach"],
          ["10:31 AM", "Briana Diaz", "Status changed", "AUTH-1042", "Authorizations", "Submitted → In Review"],
          ["10:14 AM", "Devon Ross", "Follow-up assigned", "Sophia Reyes", "Staffing", "Hard-to-staff escalation"],
          ["09:58 AM", "Maria Lopez", "Note added", "Lead L-2018", "Intake", "VOB requested"],
          ["09:21 AM", "Ashley Tran", "Record edited", "PR Q4 — Liam P.", "Clinical", "Goals updated"],
          ["08:55 AM", "Sasha Long", "Login", "—", "Case Management", "From new device"],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Patient Activity Log                                                       */
/* -------------------------------------------------------------------------- */

const PATIENT_ACTIVITY_TYPES = [
  "Lead created", "Referral received", "Call logged", "Email logged", "Form submitted",
  "Intake status changed", "Benefit status updated", "Authorization status changed",
  "Denial logged", "Staffing update", "Scheduling update", "Evaluation update",
  "Case note added", "Clinical note added", "Family communication logged",
];

export function PatientActivityLogPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Communications"
        title="Patient Activity Log"
        subtitle="Track patient and lead activity across calls, emails, forms, intake, authorizations, staffing, scheduling, clinical work, case management, and internal notes."
        icon={HeartHandshake}
        actions={<Button size="sm" variant="outline">Export activity history</Button>}
      />
      <ActionRow actions={["Search patient activity", "Filter by patient", "Filter by activity type", "Filter by date", "Open Patient Lifetime Journey", "Export activity history"]} />
      <div className="text-xs text-muted-foreground">
        UI scaffold ready for backend logging. Activity types covered: {PATIENT_ACTIVITY_TYPES.join(" · ")}.
      </div>
      <DataTable
        columns={["When", "Patient / Lead", "Activity", "Detail", "Owner", "Journey"]}
        rows={[
          ["10:42 AM", "Mia Carter", "Call logged", "After-hours voicemail from mother", "Sasha Long", <JourneyLink />],
          ["09:30 AM", "Liam Patel", "Authorization status changed", "Reauth → Missing docs", "Auth Team", <JourneyLink />],
          ["Yesterday", "Sophia Reyes", "Staffing update", "Escalated — hard to staff", "Staffing Lead", <JourneyLink />],
          ["Yesterday", "Ava Kim", "Family communication logged", "Schedule confirmation call", "Sasha Long", <JourneyLink />],
          ["2 days ago", "Jaden Howard", "Lead created", "Referral via website form", "Intake", <JourneyLink />],
          ["3 days ago", "Noah Brooks", "Case note added", "Behavior plan adjustment", "Marc Vega", <JourneyLink />],
        ]}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Phone System landing copy refresher                                        */
/* -------------------------------------------------------------------------- */

export function PhoneSystemIntroBanner() {
  return (
    <Card className="p-5 rounded-2xl border-border/60 bg-muted/30 flex items-start gap-4">
      <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center"><Phone className="h-5 w-5 text-primary" /></div>
      <div className="text-sm">
        <div className="font-medium">Phone System</div>
        <div className="text-muted-foreground mt-1">
          Manage Blossom phone activity, shared lines, call requests, directory records, after-hours calls, and follow-up visibility.
        </div>
      </div>
    </Card>
  );
}

// silence unused import
void UsersIcon;
