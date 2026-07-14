import { Link } from "react-router-dom";
import { Target, ArrowRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useUserGoals, useGoalMilestones, type UserGoal } from "@/hooks/useUserGoals";

const STATUS_LABEL: Record<UserGoal["status"], string> = {
  draft_milestones: "Draft milestones",
  pending_approval: "Pending approval",
  changes_requested: "Changes requested",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

function statusClass(status: UserGoal["status"]) {
  switch (status) {
    case "draft_milestones":
      return "bg-muted text-muted-foreground";
    case "pending_approval":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "changes_requested":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    case "active":
      return "bg-primary/10 text-primary";
    case "completed":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function GoalRow({ goal }: { goal: UserGoal }) {
  const { progress, milestones } = useGoalMilestones(goal.id);
  return (
    <Link
      to={`/goals?goal=${goal.id}`}
      className="block rounded-xl border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {milestones.length} milestone{milestones.length === 1 ? "" : "s"}
            {goal.target_date ? ` · due ${goal.target_date}` : ""}
          </p>
        </div>
        <Badge className={cn("shrink-0 rounded-full text-[10px] border-0", statusClass(goal.status))}>
          {STATUS_LABEL[goal.status]}
        </Badge>
      </div>
      {goal.status === "active" && milestones.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-[10px] tabular-nums text-muted-foreground">{progress}%</span>
        </div>
      )}
    </Link>
  );
}

export function MyGoalsCard() {
  const { goals, loading } = useUserGoals("mine");

  const activeGoals = goals.filter((g) => g.status !== "archived" && g.status !== "completed").slice(0, 4);
  const needsAttention = goals.filter(
    (g) => g.status === "draft_milestones" || g.status === "changes_requested",
  ).length;

  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/70 bg-card p-6 space-y-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(120% 100% at 0% 0%, hsl(var(--primary)/0.16), transparent 60%), radial-gradient(120% 100% at 100% 0%, hsl(280 85% 70% / 0.14), transparent 55%)",
        }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            My Goals
          </h2>
          {needsAttention > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-500/10 text-amber-600 border-0">
              {needsAttention} needs attention
            </Badge>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-full text-xs">
          <Link to="/goals">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {loading && goals.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6">Loading…</div>
      ) : activeGoals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 p-6 text-center">
          <Target className="mx-auto mb-2 size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No goals yet. Add a personal goal or wait for leadership to hand one down.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
            <Link to="/goals">
              <Plus className="size-3.5" /> Open Goals
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeGoals.map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </div>
      )}
    </Card>
  );
}