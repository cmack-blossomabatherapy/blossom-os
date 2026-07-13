import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Target, Plus, Inbox, Users, ClipboardList } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useUserGoals,
  useAssignableUsers,
  type UserGoal,
} from "@/hooks/useUserGoals";
import { GoalDetailDrawer } from "./GoalDetailDrawer";

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

function GoalCard({ goal, onOpen, ownerLabel }: { goal: UserGoal; onOpen: (g: UserGoal) => void; ownerLabel?: string }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(goal)}
      className="w-full text-left rounded-2xl border border-border/60 bg-card p-4 hover:-translate-y-0.5 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{goal.title}</p>
          {goal.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{goal.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {ownerLabel && <span>Owner: {ownerLabel}</span>}
            {goal.category && <span>· {goal.category}</span>}
            {goal.target_date && <span>· due {goal.target_date}</span>}
          </div>
        </div>
        <Badge className={cn("shrink-0 rounded-full text-[10px] border-0", statusClass(goal.status))}>
          {STATUS_LABEL[goal.status]}
        </Badge>
      </div>
    </button>
  );
}

function GoalGrid({ goals, onOpen, users }: { goals: UserGoal[]; onOpen: (g: UserGoal) => void; users?: Array<{ id: string; display_name: string | null; email: string | null }> }) {
  const nameFor = (id: string) => {
    const u = users?.find((x) => x.id === id);
    return u?.display_name || u?.email || "";
  };
  if (goals.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-border/70 bg-muted/30 p-10 text-center">
        <Target className="mx-auto mb-2 size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No goals here yet.</p>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} onOpen={onOpen} ownerLabel={nameFor(g.owner_id)} />
      ))}
    </div>
  );
}

function AssignForm({ onCreated }: { onCreated: () => void }) {
  const { assignGoal } = useUserGoals("assigned_by_me");
  const { data: users } = useAssignableUsers();
  const [ownerId, setOwnerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const submit = async () => {
    if (!ownerId || !title.trim()) {
      toast.error("Owner and title are required.");
      return;
    }
    try {
      await assignGoal.mutateAsync({
        owner_id: ownerId,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        target_date: targetDate || null,
        priority,
      });
      toast.success("Goal assigned. Owner will draft milestones.");
      setOwnerId("");
      setTitle("");
      setDescription("");
      setCategory("");
      setTargetDate("");
      setPriority("medium");
      onCreated();
    } catch (e) {
      toast.error("Couldn't assign goal", { description: (e as Error).message });
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card p-6 max-w-xl">
      <h2 className="text-base font-semibold mb-4">Assign a new goal</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Owner</label>
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger className="mt-1 rounded-lg">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(users ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.display_name || u.email || u.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grow authorized hours by 15%"
            className="mt-1 rounded-lg"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Context and success criteria for this goal…"
            rows={3}
            className="mt-1 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Growth"
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Target date</label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
              <SelectTrigger className="mt-1 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={submit} disabled={assignGoal.isPending} className="rounded-full">
          <Plus className="size-4" /> Assign goal
        </Button>
      </div>
    </Card>
  );
}

export default function GoalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "mine";
  const [tab, setTab] = useState<string>(initialTab);
  const [openGoal, setOpenGoal] = useState<UserGoal | null>(null);

  const mine = useUserGoals("mine");
  const assignedByMe = useUserGoals("assigned_by_me");
  const approvalQueue = useUserGoals("approval_queue");
  const { data: users } = useAssignableUsers();

  const isLeadership = mine.isLeadership;

  const goalIdFromUrl = searchParams.get("goal");
  useEffect(() => {
    if (!goalIdFromUrl) return;
    const all = [...mine.goals, ...assignedByMe.goals, ...approvalQueue.goals];
    const found = all.find((g) => g.id === goalIdFromUrl);
    if (found) setOpenGoal(found);
  }, [goalIdFromUrl, mine.goals, assignedByMe.goals, approvalQueue.goals]);

  return (
    <OSShell>
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 md:py-12 space-y-8">
        <header>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Blossom OS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Assigned by leadership, milestones built by you, approved, then executed. Track what
            actually matters this quarter.
          </p>
        </header>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set("tab", v); return p; }); }}>
          <TabsList>
            <TabsTrigger value="mine"><Target className="size-4" /> My goals</TabsTrigger>
            {isLeadership && (
              <TabsTrigger value="approval">
                <Inbox className="size-4" /> Approval queue
                {approvalQueue.goals.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    {approvalQueue.goals.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {isLeadership && (
              <TabsTrigger value="team"><Users className="size-4" /> Team goals</TabsTrigger>
            )}
            {isLeadership && (
              <TabsTrigger value="assign"><ClipboardList className="size-4" /> Assign</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="mine" className="mt-5">
            <GoalGrid goals={mine.goals} onOpen={setOpenGoal} users={users} />
          </TabsContent>
          {isLeadership && (
            <TabsContent value="approval" className="mt-5">
              <GoalGrid goals={approvalQueue.goals} onOpen={setOpenGoal} users={users} />
            </TabsContent>
          )}
          {isLeadership && (
            <TabsContent value="team" className="mt-5">
              <GoalGrid goals={assignedByMe.goals} onOpen={setOpenGoal} users={users} />
            </TabsContent>
          )}
          {isLeadership && (
            <TabsContent value="assign" className="mt-5">
              <AssignForm onCreated={() => setTab("team")} />
            </TabsContent>
          )}
        </Tabs>

        <GoalDetailDrawer
          goal={openGoal}
          onClose={() => {
            setOpenGoal(null);
            if (searchParams.get("goal")) {
              const p = new URLSearchParams(searchParams);
              p.delete("goal");
              setSearchParams(p);
            }
          }}
        />
      </div>
    </OSShell>
  );
}