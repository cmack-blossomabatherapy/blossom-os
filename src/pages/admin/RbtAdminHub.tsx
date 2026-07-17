import { Link, Navigate } from "react-router-dom";
import {
  Activity, GraduationCap, UserCheck, ShieldAlert, CalendarClock,
  Users, Sparkles, LifeBuoy, RefreshCw, ArrowRight, Compass,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { canAccessAdminHub } from "@/lib/adminAccess";

const centers = [
  {
    group: "Journey",
    items: [
      { to: "/admin/rbt/journey", title: "RBT Journey Command Center", desc: "One row per RBT: lifecycle, readiness, staffing, first session, 30/60/90, risk, next action.", icon: Compass },
      { to: "/admin/rbt-lifecycle", title: "Lifecycle Configuration", desc: "Configure stages, gates and lifecycle rules.", icon: Activity },
      { to: "/admin/rbt-preboarding", title: "Preboarding Console", desc: "Track preboarding items and requirement completion.", icon: UserCheck },
    ],
  },
  {
    group: "Training & Trainers",
    items: [
      { to: "/admin/rbt-training", title: "Training Command Center", desc: "Orientation, courses, live training, role-play, competencies, exams, evaluations, remediation.", icon: GraduationCap },
      { to: "/admin/rbt/trainers", title: "Trainer / Lead RBT Dashboard", desc: "Assigned trainees, upcoming events, evaluations & competencies due, follow-ups.", icon: Users },
    ],
  },
  {
    group: "Readiness & First Case",
    items: [
      { to: "/admin/rbt-readiness", title: "Staffing Readiness Dashboard", desc: "Ready-for-staffing pipeline, unstaffed alerts, blocking gates.", icon: ShieldAlert },
      { to: "/admin/rbt/first-90", title: "First 90 Days Dashboard", desc: "Check-ins, missed check-ins, risk indicators, outreach & resolution.", icon: CalendarClock },
    ],
  },
  {
    group: "Workforce & Growth",
    items: [
      { to: "/admin/rbt/workforce", title: "Active RBT Workforce Dashboard", desc: "Active roster, credential expirations, supervision attention, training overdue, turnover risk.", icon: Users },
      { to: "/admin/rbt-growth", title: "Growth & Fellowship Dashboard", desc: "Career stages, interests, Fellowship applications and pipeline.", icon: Sparkles },
    ],
  },
  {
    group: "Support & Data",
    items: [
      { to: "/admin/rbt-support", title: "Support Operations Dashboard", desc: "Support tickets, urgent routing, resolution SLAs, satisfaction.", icon: LifeBuoy },
      { to: "/admin/centralreach-sync", title: "CentralReach Sync Dashboard", desc: "Import history, freshness, mapping templates and rollback.", icon: RefreshCw },
    ],
  },
];

export default function RbtAdminHub() {
  const { user, roles } = useAuth();
  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 sm:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Compass className="h-3.5 w-3.5" /> RBT Admin
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Run the RBT experience.</h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
              Focused command centers — not one giant table. Each dashboard surfaces only the exceptions that need action, with drill-downs, assignment, and audit history.
            </p>
          </div>
        </div>
      </section>

      {centers.map((g) => (
        <section key={g.group} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{g.group}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {g.items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <it.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{it.title}</p>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{it.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}