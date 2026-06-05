import { useNavigate } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  AlertTriangle,
  Users,
  ShieldCheck,
  ArrowRight,
  Plus,
  Sparkles,
  Upload,
  BookOpen,
  Building2,
} from "lucide-react";
import {
  trainingJourneys,
  trainingAssignments,
  formatRelative,
} from "@/lib/hr/trainingCenterData";

const newHires = [
  { name: "Aiden Brooks", role: "RBT", state: "GA", startedDaysAgo: 3 },
  { name: "Priya Shah", role: "BCBA", state: "NC", startedDaysAgo: 7 },
  { name: "Marcus Lee", role: "Intake Coordinator", state: "GA", startedDaysAgo: 12 },
];

const complianceAlerts = [
  { label: "CPR expiring", count: 4, tone: "amber" as const },
  { label: "HIPAA training overdue", count: 2, tone: "red" as const },
  { label: "Background check pending", count: 3, tone: "amber" as const },
];

export default function HRSuiteHome() {
  const navigate = useNavigate();

  const totalAssigned = trainingAssignments.reduce((s, a) => s + a.assigned, 0);
  const totalCompleted = trainingAssignments.reduce((s, a) => s + a.completed, 0);
  const totalOverdue = trainingAssignments.reduce((s, a) => s + a.overdue, 0);
  const completionPct = Math.round((totalCompleted / Math.max(totalAssigned, 1)) * 100);

  return (
    <OSShell>
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              HR Suite
            </p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-foreground md:text-[32px]">
              People, training, and operational readiness.
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">
              The home for HR operations — see training health, onboarding momentum,
              and compliance risk at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate("/hr/training-center")}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Training
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => navigate("/hr/training-center")}
            >
              <GraduationCap className="mr-2 h-4 w-4" /> Open Training Center
            </Button>
          </div>
        </header>

        {/* Overview tiles */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <OverviewTile
            label="Active employees"
            value="142"
            sub="Across 6 states"
            icon={Users}
          />
          <OverviewTile
            label="Training completion"
            value={`${completionPct}%`}
            sub={`${totalCompleted}/${totalAssigned} required`}
            icon={GraduationCap}
          />
          <OverviewTile
            label="Overdue trainings"
            value={String(totalOverdue)}
            sub="Across all roles"
            icon={AlertTriangle}
            tone="amber"
          />
          <OverviewTile
            label="Compliance alerts"
            value={String(
              complianceAlerts.reduce((s, a) => s + a.count, 0),
            )}
            sub="Need review"
            icon={ShieldCheck}
            tone="red"
          />
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Training Status */}
          <div className="lg:col-span-2 rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_30%/0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">
                  Training status by journey
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Role journeys are the backbone of operational learning.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-[13px]"
                onClick={() => navigate("/hr/training-center")}
              >
                Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-5 space-y-4">
              {trainingJourneys.slice(0, 5).map((j) => (
                <div key={j.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-foreground">{j.title}</span>
                    <span className="text-muted-foreground">
                      {j.completionPct}% · {j.assignedCount} assigned
                    </span>
                  </div>
                  <Progress value={j.completionPct} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Alerts */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_30%/0.08)]">
            <h2 className="text-[16px] font-semibold tracking-tight">
              Compliance alerts
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Items that need follow-up this week.
            </p>
            <ul className="mt-5 space-y-3">
              {complianceAlerts.map((a) => (
                <li
                  key={a.label}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5"
                >
                  <span className="text-[13px] text-foreground">{a.label}</span>
                  <Badge
                    variant="outline"
                    className={
                      a.tone === "red"
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }
                  >
                    {a.count}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* New hires + overdue */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-6">
            <h2 className="text-[16px] font-semibold tracking-tight">New employees</h2>
            <p className="text-[13px] text-muted-foreground">
              Started in the last 14 days.
            </p>
            <ul className="mt-4 divide-y divide-border/60">
              {newHires.map((h) => (
                <li key={h.name} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13.5px] font-medium text-foreground">
                      {h.name}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {h.role} · {h.state}
                    </p>
                  </div>
                  <span className="text-[12px] text-muted-foreground">
                    Day {h.startedDaysAgo}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-6">
            <h2 className="text-[16px] font-semibold tracking-tight">
              Overdue trainings
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Past due across roles and departments.
            </p>
            <ul className="mt-4 divide-y divide-border/60">
              {trainingAssignments
                .filter((a) => a.overdue > 0)
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-[13.5px] font-medium text-foreground">
                        {a.trainingTitle}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {a.scope} · {a.target}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-destructive/30 bg-destructive/10 text-destructive"
                    >
                      {a.overdue} overdue
                    </Badge>
                  </li>
                ))}
            </ul>
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl border border-border/70 bg-card p-6">
          <h2 className="text-[16px] font-semibold tracking-tight">Quick actions</h2>
          <p className="text-[13px] text-muted-foreground">
            Jump directly into the most common HR workflows.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-5">
            <QuickAction
              icon={Plus}
              label="Create training"
              onClick={() => navigate("/hr/training-center?action=create")}
            />
            <QuickAction
              icon={GraduationCap}
              label="Create journey"
              onClick={() => navigate("/hr/training-center?action=journey")}
            />
            <QuickAction
              icon={Users}
              label="Assign training"
              onClick={() => navigate("/hr/training-center?action=assign")}
            />
            <QuickAction
              icon={Upload}
              label="Upload Resource"
              onClick={() => navigate("/hr/resource-management#bulk-upload")}
            />
            <QuickAction
              icon={BookOpen}
              label="Open Training Academy"
              onClick={() => navigate("/training")}
            />
            <QuickAction
              icon={BookOpen}
              label="Resource Management"
              onClick={() => navigate("/hr/resource-management")}
            />
          </div>
        </section>

        {/* Modules placeholder */}
        <section className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
          <Building2 className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-[13px] text-muted-foreground">
            More HR modules — Employee Records, Evaluations, Onboarding, SOP
            Management, AI Training Insights — coming next.
          </p>
        </section>
      </div>
    </OSShell>
  );
}

function OverviewTile({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Users;
  tone?: "amber" | "red";
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_30%/0.08)]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div
          className={
            "grid h-8 w-8 place-items-center rounded-lg " +
            (tone === "red"
              ? "bg-destructive/10 text-destructive"
              : tone === "amber"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                : "bg-primary/10 text-primary")
          }
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-[26px] font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="text-[12.5px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_20px_-12px_hsl(265_60%_50%/0.25)]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 truncate">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}