import { OSShell } from "../OSShell";
import { Link } from "react-router-dom";
import {
  Stethoscope, UserCheck, Eye, FileCheck2, BarChart3, ClipboardCheck,
  AlertTriangle, ShieldCheck, Phone, Plug, ArrowUpRight,
} from "lucide-react";

const SNAPSHOT = [
  { label: "BCBAs under oversight", value: "—", hint: "active caseloads", icon: UserCheck },
  { label: "Supervision risk",      value: "—", hint: "behind / at risk",  icon: Eye },
  { label: "Treatment plans queued",value: "—", hint: "awaiting review",   icon: FileCheck2 },
  { label: "Progress reports due",  value: "—", hint: "next 14 days",      icon: BarChart3 },
  { label: "Open evaluations",      value: "—", hint: "in process",        icon: ClipboardCheck },
  { label: "Clinical escalations",  value: "—", hint: "needs attention",   icon: AlertTriangle },
];

const ACTIONS = [
  { label: "BCBA Oversight",         to: "/assigned-bcbas",         icon: UserCheck },
  { label: "Supervision Visibility", to: "/supervision-visibility", icon: Eye },
  { label: "Treatment Plan Reviews", to: "/treatment-plan-reviews", icon: FileCheck2 },
  { label: "Progress Reports",       to: "/progress-reports",       icon: BarChart3 },
  { label: "Evaluations",            to: "/evaluations",            icon: ClipboardCheck },
  { label: "Clinical Escalations",   to: "/escalations-followups",  icon: AlertTriangle },
  { label: "QA Dashboard",           to: "/qa-team",                icon: ShieldCheck },
  { label: "Phone System",           to: "/phone",                  icon: Phone },
];

export default function ClinicalDirectorDashboard() {
  return (
    <OSShell>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Stethoscope className="h-4 w-4" /> Clinical Director
            </div>
            <h1 className="text-2xl font-semibold mt-1">Clinical Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Oversight of clinical quality, supervision health, treatment plans, and escalations.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <ArrowUpRight className="h-4 w-4" /> Export clinical summary
          </button>
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
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Clinical actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3">
            {ACTIONS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
              >
                <a.icon className="h-4 w-4" /> {a.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Plug className="h-4 w-4" /> CentralReach integration
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Clinical data sync with CentralReach is integration-ready. Live wiring will populate
            supervision, treatment plan, and progress report queues automatically.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted px-2 py-0.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Not connected
          </div>
        </section>
      </div>
    </OSShell>
  );
}