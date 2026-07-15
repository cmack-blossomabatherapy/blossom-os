import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, BookOpen, Briefcase, ClipboardCheck, Compass, FileText,
  GraduationCap, HeartHandshake, History as HistoryIcon, Megaphone, Settings, UserCheck,
  ShieldCheck, Sparkles, UsersRound, Wallet, Workflow, Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { canAccessAdminHub } from "@/lib/adminAccess";

type AdminLink = {
  to: string;
  label: string;
  desc: string;
  icon: typeof UsersRound;
  badge?: string;
};

type AdminGroup = {
  title: string;
  description: string;
  icon: typeof UsersRound;
  links: AdminLink[];
};

const groups: AdminGroup[] = [
  {
    title: "People & Access",
    description: "Manage users, roles, and permissions across the platform.",
    icon: UsersRound,
    links: [
      { to: "/user-management", label: "User Management", desc: "Invite, edit, manage logins & NFC badges, assign roles", icon: UsersRound },
      { to: "/admin/access-requests", label: "Access Requests", desc: "Review pending sign-up requests", icon: UserCheck, badge: "New" },
      { to: "/admin/onboarding-progress", label: "Onboarding Progress", desc: "Search users, view completion & certificates", icon: GraduationCap },
      { to: "/user-management", label: "Employee Directory", desc: "Full company directory (now unified with User Management)", icon: UsersRound },
      { to: "/hr/org-chart", label: "Org Chart", desc: "Reporting structure", icon: Workflow },
      { to: "/admin/role-audit", label: "Role Audit Log", desc: "Track permission changes", icon: HistoryIcon },
    ],
  },
  {
    title: "Academy & Training",
    description: "Build courses, assign learning, and monitor progress.",
    icon: GraduationCap,
    links: [
      { to: "/admin/training-dashboard", label: "Course Management", desc: "All courses & modules", icon: GraduationCap },
      { to: "/admin/training-assign", label: "Assign Trainings", desc: "Push courses to teams", icon: ClipboardCheck },
      { to: "/admin/training-statistics", label: "Training Statistics", desc: "Engagement & completion", icon: BarChart3 },
      { to: "/training/academy/editor", label: "Academy Editor", desc: "Edit onboarding journey", icon: Compass },
      { to: "/admin/journey-editor", label: "Welcome to Blossom Editor", desc: "Edit phases, add videos, hide modules", icon: Sparkles, badge: "New" },
      { to: "/enterprise/course-studio", label: "AI Course Studio", desc: "Generate courses with AI", icon: Sparkles, badge: "AI" },
      { to: "/enterprise/sop-intelligence", label: "SOP Intelligence", desc: "Searchable knowledge base", icon: BookOpen },
    ],
  },
  {
    title: "HR Operations",
    description: "People operations, payroll, and engagement.",
    icon: HeartHandshake,
    links: [
      { to: "/hr", label: "HR Dashboard", desc: "Workforce snapshot", icon: HeartHandshake },
      { to: "/hr/onboarding", label: "Onboarding Center", desc: "New hire pipeline", icon: GraduationCap },
      { to: "/hr/reviews", label: "Reviews", desc: "Performance cycles", icon: ClipboardCheck },
      { to: "/hr/payroll", label: "Payroll", desc: "Pay runs & timesheets", icon: Wallet },
      { to: "/hr/announcements", label: "Announcements", desc: "Company-wide messaging", icon: Megaphone },
      { to: "/hr/recognition", label: "Recognition", desc: "Awards & shoutouts", icon: Sparkles },
    ],
  },
  {
    title: "Reporting & Insights",
    description: "Operational, training, and workforce analytics.",
    icon: BarChart3,
    links: [
      { to: "/reports", label: "Reports", desc: "Standard reports & exports", icon: FileText },
      { to: "/intelligence", label: "Executive Center", desc: "Leadership intelligence", icon: BarChart3 },
      { to: "/intelligence/training", label: "Training Intelligence", desc: "Learning analytics", icon: GraduationCap },
      { to: "/intelligence/compliance", label: "Compliance Intelligence", desc: "Audit readiness", icon: ShieldCheck },
      { to: "/reports", label: "Report Builder", desc: "Custom reports", icon: FileText },
    ],
  },
  {
    title: "Automation & System",
    description: "Workflows, integrations, and platform settings.",
    icon: Zap,
    links: [
      { to: "/automations", label: "Automations", desc: "Workflow rules & triggers", icon: Zap },
      { to: "/enterprise/automations", label: "Enterprise Automations", desc: "Cross-org playbooks", icon: Workflow },
      { to: "/enterprise/recommendations", label: "AI Recommendations", desc: "System-wide suggestions", icon: Sparkles, badge: "AI" },
      { to: "/settings", label: "Academy Settings", desc: "Branding & defaults", icon: Settings },
      { to: "/hr/settings", label: "HR Settings", desc: "People ops configuration", icon: Briefcase },
    ],
  },
];

export default function AdminHub() {
  const { user, roles } = useAuth();

  if (!canAccessAdminHub(user, roles)) {
    return <Navigate to="/" replace />;
  }

  const totalTools = groups.reduce((n, g) => n + g.links.length, 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      {/* Premium hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin Hub
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Run Blossom, beautifully.</h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
              The single command center for people, training, operations, and insights — built for admins and HR.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {[
              { l: "Tool groups", v: groups.length },
              { l: "Admin tools", v: totalTools },
              { l: "AI-assisted", v: 3 },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md">
                <p className="text-2xl font-semibold">{s.v}</p>
                <p className="text-[11px] text-primary-foreground/85">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/team">Manage users <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              <Link to="/intelligence">Open executive center</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Group cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.title}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <group.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground">{group.title}</h2>
                <p className="text-xs text-muted-foreground">{group.description}</p>
              </div>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group flex h-full items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <link.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-foreground">{link.label}</p>
                        {link.badge && <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{link.badge}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{link.desc}</p>
                    </div>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Need a new admin tool here? It's easy to add — this hub is designed to grow with Blossom.
      </p>
    </div>
  );
}