import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Target,
  Plus,
  Inbox,
  Users,
  Sparkles,
  UserRound,
  CalendarClock,
  Flag,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  useGoalMilestones,
  type UserGoal,
  type GoalType,
} from "@/hooks/useUserGoals";
import { GoalDetailDrawer } from "./GoalDetailDrawer";

// ---------- helpers ----------

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
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "changes_requested":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    case "active":
      return "bg-primary/10 text-primary";
    case "completed":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function typeMeta(type: GoalType) {
  switch (type) {
    case "personal":
      return { label: "Personal", tint: "bg-sky-500/10 text-sky-700 dark:text-sky-300", icon: UserRound };
    case "team":
      return { label: "Team", tint: "bg-violet-500/10 text-violet-700 dark:text-violet-300", icon: Users };
    default:
      return { label: "Quarterly", tint: "bg-primary/10 text-primary", icon: Flag };
  }
}

function currentQuarterLabel(): string {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

function nextQuarters(count = 4): string[] {
  const out: string[] = [];
  const now = new Date();
  let q = Math.floor(now.getMonth() / 3);
  let y = now.getFullYear();
  for (let i = 0; i < count; i++) {
    out.push(`Q${q + 1} ${y}`);
    q += 1;
    if (q > 3) {
      q = 0;
      y += 1;
    }
  }
  return out;
}

// ---------- card ----------

function GoalCard({
  goal,
  onOpen,
  ownerLabel,
}: {
  goal: UserGoal;
  onOpen: (g: UserGoal) => void;
  ownerLabel?: string;
}) {
  const { milestones, progress } = useGoalMilestones(goal.id);
  const meta = typeMeta(goal.goal_type);
  const TypeIcon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(goal)}
      className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-18px_hsl(var(--primary)/0.35)]"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 opacity-70 blur-2xl transition group-hover:opacity-90"
        style={{
          background:
            "radial-gradient(120% 100% at 0% 0%, hsl(var(--primary)/0.18), transparent 60%), radial-gradient(120% 100% at 100% 0%, hsl(280 85% 70% / 0.14), transparent 55%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium", meta.tint)}>
              <TypeIcon className="size-3" /> {meta.label}
            </span>
            {goal.quarter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
                <CalendarClock className="size-3" /> {goal.quarter}
              </span>
            )}
          </div>
          <p className="mt-2 truncate text-[15px] font-semibold tracking-tight">{goal.title}</p>
          {goal.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{goal.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {ownerLabel && <span>Owner · {ownerLabel}</span>}
            {goal.category && <span>· {goal.category}</span>}
            {goal.target_date && <span>· due {goal.target_date}</span>}
          </div>
        </div>
        <Badge className={cn("shrink-0 rounded-full border-0 text-[10px]", statusClass(goal.status))}>
          {STATUS_LABEL[goal.status]}
        </Badge>
      </div>
      {milestones.length > 0 && (
        <div className="relative mt-4 flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-[10.5px] tabular-nums text-muted-foreground">
            {milestones.filter((m) => m.status === "done").length}/{milestones.length}
          </span>
        </div>
      )}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="rounded-2xl border-dashed border-border/70 bg-muted/30 p-10 text-center">
      <Target className="mx-auto mb-2 size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}

function GoalGrid({
  goals,
  onOpen,
  users,
  emptyText,
}: {
  goals: UserGoal[];
  onOpen: (g: UserGoal) => void;
  users?: Array<{ id: string; display_name: string | null; email: string | null }>;
  emptyText: string;
}) {
  const nameFor = (id: string) => {
    const u = users?.find((x) => x.id === id);
    return u?.display_name || u?.email || "";
  };
  if (goals.length === 0) return <EmptyState text={emptyText} />;

  // Group active/assigned/team by quarter so quarterly goals surface as columns.
  const grouped = new Map<string, UserGoal[]>();
  for (const g of goals) {
    const key = g.quarter || "No quarter";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(g);
  }
  const orderedKeys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === "No quarter") return 1;
    if (b === "No quarter") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      {orderedKeys.map((q) => (
        <div key={q}>
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="size-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{q}</h3>
            <span className="text-xs text-muted-foreground">· {grouped.get(q)!.length}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {grouped.get(q)!.map((g) => (
              <GoalCard key={g.id} goal={g} onOpen={onOpen} ownerLabel={nameFor(g.owner_id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- create goal dialog (personal / team / quarterly) ----------

type CreateMode = "personal" | "team" | "quarterly";

function CreateGoalDialog({
  mode,
  trigger,
  onCreated,
}: {
  mode: CreateMode;
  trigger: React.ReactNode;
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { assignGoal, createPersonalGoal } = useUserGoals("mine");
  const { data: users } = useAssignableUsers();
  const [ownerId, setOwnerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [quarter, setQuarter] = useState<string>(currentQuarterLabel());

  const quarterOptions = useMemo(() => nextQuarters(6), []);
  const needsOwner = mode !== "personal";
  const goalType: GoalType = mode === "personal" ? "personal" : mode === "team" ? "team" : "assigned";

  const modeCopy = {
    personal: {
      title: "New personal goal",
      desc: "Personal goals are yours only. No approval needed — they go straight to Active.",
      cta: "Add personal goal",
    },
    team: {
      title: "New team goal",
      desc: "Assign a goal to someone on your team. They'll draft milestones for your approval.",
      cta: "Add team goal",
    },
    quarterly: {
      title: "New quarterly goal",
      desc: "Set a top-level goal for the quarter. The owner will draft milestones for leadership approval.",
      cta: "Add quarterly goal",
    },
  }[mode];

  const submit = async () => {
    if (needsOwner && !ownerId) return toast.error("Pick an owner.");
    if (!title.trim()) return toast.error("Title is required.");
    try {
      if (goalType === "personal") {
        await createPersonalGoal.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          target_date: targetDate || null,
          priority,
          quarter: quarter || null,
        });
        toast.success("Personal goal added.");
      } else {
        await assignGoal.mutateAsync({
          owner_id: ownerId,
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          target_date: targetDate || null,
          priority,
          goal_type: goalType,
          quarter: quarter || null,
        });
        toast.success(goalType === "team" ? "Team goal added." : "Quarterly goal added.");
      }
      setOwnerId("");
      setTitle("");
      setDescription("");
      setCategory("");
      setTargetDate("");
      setPriority("medium");
      setOpen(false);
      onCreated?.();
    } catch (e) {
      toast.error("Couldn't add goal", { description: (e as Error).message });
    }
  };

  const pending = assignGoal.isPending || createPersonalGoal.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{modeCopy.title}</DialogTitle>
          <DialogDescription>{modeCopy.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {needsOwner && (
            <Field label="Owner">
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(users ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.display_name || u.email || u.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Grow authorized hours by 15%" className="rounded-lg" />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Context and success criteria…" className="rounded-lg" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quarter">
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {quarterOptions.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Target date">
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="rounded-lg" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Category">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Growth" className="rounded-lg" />
            </Field>
            <Field label="Priority">
              <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending} className="rounded-full">
            <Plus className="size-4" /> {modeCopy.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

// ---------- page ----------

export default function GoalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "mine";
  const [tab, setTab] = useState<string>(initialTab);
  const [openGoal, setOpenGoal] = useState<UserGoal | null>(null);

  const mine = useUserGoals("mine");
  const assignedByMe = useUserGoals("assigned_by_me");
  const approvalQueue = useUserGoals("approval_queue");
  const { data: users } = useAssignableUsers();

  const isStrict = mine.isStrictLeadership;
  const isManager = mine.isPeopleManager;

  // Deep link to a specific goal
  const goalIdFromUrl = searchParams.get("goal");
  useEffect(() => {
    if (!goalIdFromUrl) return;
    const all = [...mine.goals, ...assignedByMe.goals, ...approvalQueue.goals];
    const found = all.find((g) => g.id === goalIdFromUrl);
    if (found) setOpenGoal(found);
  }, [goalIdFromUrl, mine.goals, assignedByMe.goals, approvalQueue.goals]);

  const setTabSync = (v: string) => {
    setTab(v);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", v);
      return p;
    });
  };

  // ---- KPIs ----
  const activeCount = mine.goals.filter((g) => g.status === "active").length;
  const draftCount = mine.goals.filter((g) => g.status === "draft_milestones" || g.status === "changes_requested").length;
  const doneCount = mine.goals.filter((g) => g.status === "completed").length;

  return (
    <OSShell>
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 md:py-12 space-y-8">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 md:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(80% 60% at 0% 0%, hsl(var(--primary)/0.18), transparent 60%), radial-gradient(70% 60% at 100% 20%, hsl(280 85% 70% / 0.16), transparent 60%), radial-gradient(60% 60% at 50% 120%, hsl(190 90% 65% / 0.12), transparent 60%)",
            }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Blossom OS · Goals
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
                What matters this quarter.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Quarterly goals from leadership, team goals from your manager, and personal goals from you.
                Milestones live here — draft, approve, execute.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CreateGoalDialog
                mode="personal"
                trigger={
                  <Button variant="outline" className="rounded-full">
                    <UserRound className="size-4" /> New personal goal
                  </Button>
                }
              />
              {isManager && (
                <CreateGoalDialog
                  mode="team"
                  trigger={
                    <Button variant="outline" className="rounded-full">
                      <Users className="size-4" /> New team goal
                    </Button>
                  }
                  onCreated={() => setTabSync("team")}
                />
              )}
              {isStrict && (
                <CreateGoalDialog
                  mode="quarterly"
                  trigger={
                    <Button className="rounded-full">
                      <Sparkles className="size-4" /> New quarterly goal
                    </Button>
                  }
                  onCreated={() => setTabSync("team")}
                />
              )}
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-3 md:max-w-lg">
            <Kpi label="Active" value={activeCount} tint="from-primary/15 to-primary/5" />
            <Kpi label="Drafts" value={draftCount} tint="from-amber-500/15 to-amber-500/5" />
            <Kpi label="Completed" value={doneCount} tint="from-emerald-500/15 to-emerald-500/5" />
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTabSync}>
          <TabsList className="bg-muted/60">
            <TabsTrigger value="mine"><Target className="size-4" /> My goals</TabsTrigger>
            {isStrict && (
              <TabsTrigger value="approval">
                <Inbox className="size-4" /> Approval queue
                {approvalQueue.goals.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    {approvalQueue.goals.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {(isStrict || isManager) && (
              <TabsTrigger value="team">
                <Users className="size-4" /> {isStrict ? "Quarterly & team" : "My team"}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="mine" className="mt-6">
            <GoalGrid
              goals={mine.goals}
              onOpen={setOpenGoal}
              users={users}
              emptyText="No goals yet. Add a personal goal to get started."
            />
          </TabsContent>
          {isStrict && (
            <TabsContent value="approval" className="mt-6">
              <GoalGrid
                goals={approvalQueue.goals}
                onOpen={setOpenGoal}
                users={users}
                emptyText="Nothing pending approval. You're clear."
              />
            </TabsContent>
          )}
          {(isStrict || isManager) && (
            <TabsContent value="team" className="mt-6">
              <GoalGrid
                goals={assignedByMe.goals}
                onOpen={setOpenGoal}
                users={users}
                emptyText={isStrict ? "No quarterly goals created yet." : "No team goals yet."}
              />
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

function Kpi({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-gradient-to-br p-4", tint)}>
      <p className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}