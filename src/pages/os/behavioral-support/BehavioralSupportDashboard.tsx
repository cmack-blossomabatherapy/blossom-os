import { OSShell } from "../OSShell";
import { Link } from "react-router-dom";
import {
  Flame, AlertTriangle, FileSignature, Bell, Eye, HeartHandshake,
  ClipboardCheck, Phone, PlusCircle, UserCheck,
} from "lucide-react";

const SNAPSHOT = [
  { label: "Active crises",        value: "—", hint: "open now",         icon: Flame },
  { label: "High-risk families",   value: "—", hint: "watchlist",        icon: HeartHandshake },
  { label: "Open support plans",   value: "—", hint: "in progress",      icon: FileSignature },
  { label: "Follow-ups due",       value: "—", hint: "this week",        icon: Bell },
  { label: "Pending BCBA handoff", value: "—", hint: "awaiting clinical",icon: UserCheck },
  { label: "Escalations open",     value: "—", hint: "needs attention",  icon: AlertTriangle },
];

const ACTIONS = [
  { label: "Add support note",  to: "/case-manager/family-support", icon: PlusCircle },
  { label: "Create escalation", to: "/escalations-followups",       icon: Flame },
  { label: "Assign follow-up",  to: "/case-manager/follow-ups",     icon: Bell },
  { label: "Open support plan", to: "/bcba/workspace",              icon: FileSignature },
  { label: "Supervision view",  to: "/supervision-visibility",      icon: Eye },
  { label: "Phone System",      to: "/phone",                       icon: Phone },
];

export default function BehavioralSupportDashboard() {
  return (
    <OSShell>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <header>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Flame className="h-4 w-4" /> Behavioral Support
          </div>
          <h1 className="text-2xl font-semibold mt-1">Behavioral Support Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crisis queue, behavior support plans, follow-ups, and clinical handoff visibility.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SNAPSHOT.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Quick actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
            {ACTIONS.map((a) => (
              <Link
                key={a.to + a.label}
                to={a.to}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
              >
                <a.icon className="h-4 w-4" /> {a.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Crisis & escalation queue</h2>
          </div>
          <div className="p-6 text-sm text-muted-foreground text-center">
            No active crises. Live queue will populate as escalations are logged.
          </div>
        </section>
      </div>
    </OSShell>
  );
}