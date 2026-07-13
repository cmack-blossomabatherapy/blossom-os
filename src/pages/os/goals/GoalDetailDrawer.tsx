import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Circle, Plus, Trash2, Send, MessageSquareWarning, ThumbsUp, Activity } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useGoalMilestones,
  useGoalActivity,
  useUserGoals,
  type UserGoal,
} from "@/hooks/useUserGoals";
import { useAuth } from "@/contexts/AuthContext";

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
    case "pending_approval":
      return "bg-amber-500/10 text-amber-600";
    case "changes_requested":
      return "bg-rose-500/10 text-rose-600";
    case "active":
      return "bg-primary/10 text-primary";
    case "completed":
      return "bg-emerald-500/10 text-emerald-600";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function GoalDetailDrawer({
  goal,
  onClose,
}: {
  goal: UserGoal | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { submitForApproval, approveGoal, requestChanges, completeGoal, isLeadership } =
    useUserGoals("mine");
  const {
    milestones,
    progress,
    addMilestone,
    updateMilestone,
    completeMilestone,
    deleteMilestone,
  } = useGoalMilestones(goal?.id ?? null);
  const { data: activity } = useGoalActivity(goal?.id ?? null);

  const [newTitle, setNewTitle] = useState("");
  const [newCriteria, setNewCriteria] = useState("");
  const [newDate, setNewDate] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    setNewTitle("");
    setNewCriteria("");
    setNewDate("");
    setReviewNote("");
  }, [goal?.id]);

  if (!goal) return null;

  const isOwner = goal.owner_id === user?.id;
  const canEditMilestones =
    isOwner &&
    (goal.status === "draft_milestones" || goal.status === "changes_requested");
  const canSubmit = canEditMilestones && milestones.length > 0;
  const canReview = isLeadership && goal.status === "pending_approval";
  const canComplete = isOwner && goal.status === "active" && progress === 100;

  const handleAdd = async () => {
    const t = newTitle.trim();
    if (!t) return;
    try {
      await addMilestone.mutateAsync({
        title: t,
        success_criteria: newCriteria.trim() || undefined,
        target_date: newDate || null,
        order_index: milestones.length,
      });
      setNewTitle("");
      setNewCriteria("");
      setNewDate("");
    } catch (e) {
      toast.error("Couldn't add milestone", { description: (e as Error).message });
    }
  };

  return (
    <Sheet open={!!goal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl">{goal.title}</SheetTitle>
              <SheetDescription>
                {goal.description || "No description."}
              </SheetDescription>
            </div>
            <Badge className={cn("shrink-0 rounded-full text-[10px] border-0", statusClass(goal.status))}>
              {STATUS_LABEL[goal.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 text-[11px] text-muted-foreground">
            {goal.category && <span>Category: {goal.category}</span>}
            {goal.target_date && <span>Target: {goal.target_date}</span>}
            <span>Priority: {goal.priority}</span>
          </div>
        </SheetHeader>

        {goal.status === "active" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="tabular-nums font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {goal.approval_notes && goal.status === "changes_requested" && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-sm">
            <p className="text-[11px] uppercase tracking-widest text-rose-600 mb-1">
              Changes requested
            </p>
            <p>{goal.approval_notes}</p>
          </div>
        )}

        <Separator className="my-5" />

        <div>
          <h3 className="text-sm font-medium mb-3">Milestones</h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-3">
              {canEditMilestones
                ? "Add milestones below to break this goal into actionable steps."
                : "No milestones yet."}
            </p>
          ) : (
            <ul className="space-y-2 mb-3">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <button
                    type="button"
                    disabled={!isOwner || goal.status !== "active"}
                    onClick={() => completeMilestone.mutate(m.id)}
                    className="mt-0.5 disabled:opacity-40"
                    aria-label="Toggle milestone"
                  >
                    {m.status === "done" ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        m.status === "done" && "line-through text-muted-foreground",
                      )}
                    >
                      {m.title}
                    </p>
                    {m.success_criteria && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {m.success_criteria}
                      </p>
                    )}
                    {m.target_date && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Target: {m.target_date}
                      </p>
                    )}
                  </div>
                  {canEditMilestones && (
                    <button
                      type="button"
                      onClick={() => deleteMilestone.mutate(m.id)}
                      className="text-muted-foreground hover:text-rose-500"
                      aria-label="Delete milestone"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEditMilestones && (
            <div className="space-y-2 rounded-xl border border-dashed border-border/70 p-3">
              <Input
                placeholder="Milestone title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-9 rounded-lg"
              />
              <Textarea
                placeholder="Success criteria (optional)"
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                rows={2}
                className="rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-9 rounded-lg flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newTitle.trim() || addMilestone.isPending}
                  className="h-9 rounded-lg"
                >
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            </div>
          )}
        </div>

        {(canSubmit || canReview || canComplete) && (
          <>
            <Separator className="my-5" />
            <div className="space-y-2">
              {canReview && (
                <Textarea
                  placeholder="Optional feedback for the owner…"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                  className="rounded-lg text-sm"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {canSubmit && (
                  <Button
                    onClick={() =>
                      submitForApproval.mutateAsync(goal.id).then(
                        () => toast.success("Submitted for approval"),
                        (e) => toast.error("Failed", { description: (e as Error).message }),
                      )
                    }
                    disabled={submitForApproval.isPending}
                    className="rounded-full"
                  >
                    <Send className="size-4" /> Submit for approval
                  </Button>
                )}
                {canReview && (
                  <>
                    <Button
                      onClick={() =>
                        approveGoal
                          .mutateAsync({ goalId: goal.id, note: reviewNote || undefined })
                          .then(
                            () => toast.success("Goal approved"),
                            (e) => toast.error("Failed", { description: (e as Error).message }),
                          )
                      }
                      disabled={approveGoal.isPending}
                      className="rounded-full"
                    >
                      <ThumbsUp className="size-4" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!reviewNote.trim()) {
                          toast.error("Add a note explaining the changes needed.");
                          return;
                        }
                        requestChanges
                          .mutateAsync({ goalId: goal.id, note: reviewNote })
                          .then(
                            () => toast.success("Changes requested"),
                            (e) => toast.error("Failed", { description: (e as Error).message }),
                          );
                      }}
                      disabled={requestChanges.isPending}
                      className="rounded-full"
                    >
                      <MessageSquareWarning className="size-4" /> Request changes
                    </Button>
                  </>
                )}
                {canComplete && (
                  <Button
                    onClick={() =>
                      completeGoal.mutateAsync(goal.id).then(
                        () => toast.success("Goal completed!"),
                        (e) => toast.error("Failed", { description: (e as Error).message }),
                      )
                    }
                    variant="outline"
                    className="rounded-full"
                  >
                    <CheckCircle2 className="size-4" /> Mark goal complete
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {(activity ?? []).length > 0 && (
          <>
            <Separator className="my-5" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Activity</h3>
              </div>
              <ul className="space-y-2">
                {(activity ?? []).slice(0, 10).map((a) => (
                  <li key={a.id} className="text-[12px] text-muted-foreground">
                    <span className="font-medium capitalize text-foreground">
                      {a.action.replace(/_/g, " ")}
                    </span>{" "}
                    · {format(parseISO(a.created_at), "MMM d, h:mma")}
                    {a.note ? <div className="pl-2 mt-0.5">"{a.note}"</div> : null}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}