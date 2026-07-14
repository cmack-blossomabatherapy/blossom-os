import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Activity, AlertTriangle, CheckCircle2, ClipboardList, Inbox,
  ListTodo, Plus, Sparkles, Workflow, X,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { useWorkQueue } from "@/hooks/useWorkQueue";
import {
  filterWorkItems, getEscalationRoute, getRecommendedWorkAction,
  getWorkItemDueStatus, isWorkItemEscalated, isWorkItemOverdue,
  sortWorkItemsByUrgency,
  type WorkDepartment, type WorkItem, type WorkItemPriority,
  type WorkItemStatus, type WorkItemType,
} from "@/lib/workQueue/workQueueModel";
import { DueCell, KpiCard, PriorityBadge, RecommendedAction, StatusBadge, WorkItemMeta } from "./WorkQueueShared";
import { WorkItemTimeline } from "@/components/workQueue/WorkItemTimeline";

const DEPARTMENTS: (WorkDepartment | "all")[] = [
  "all", "Intake", "Marketing", "Business Development", "Authorizations",
  "Scheduling", "Staffing", "Credentialing", "HR", "QA", "Clinical",
  "State Operations", "Operations Leadership", "System",
];
const PRIORITIES: (WorkItemPriority | "all")[] = ["all", "critical", "urgent", "high", "normal", "low"];
const STATUSES: (WorkItemStatus | "all" | "active")[] = [
  "all", "active", "new", "open", "in_progress", "waiting", "blocked", "escalated", "resolved",
];
const TYPES: (WorkItemType | "all")[] = [
  "all", "lead_follow_up", "missing_information", "source_review", "auth_issue",
  "denial_follow_up", "scheduling_gap", "staffing_gap", "credentialing_item",
  "hr_item", "qa_review", "clinical_risk", "state_escalation", "general_task",
];

function isToday(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function withinDays(iso?: string, days = 7) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < days * 86_400_000;
}

function CreateWorkItemDialog({ onCreate }: { onCreate: (input: Partial<WorkItem>) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dept, setDept] = useState<WorkDepartment>("Intake");
  const [type, setType] = useState<WorkItemType>("general_task");
  const [priority, setPriority] = useState<WorkItemPriority>("normal");
  const [state, setState] = useState("");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");

  function submit() {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: desc.trim() || undefined,
      department: dept,
      type,
      priority,
      state: state.trim() || undefined,
      ownerName: owner.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status: "open",
    });
    setOpen(false);
    setTitle(""); setDesc(""); setState(""); setOwner(""); setDueDate("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Create work item</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create work item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to happen?" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Department</label>
              <Select value={dept} onValueChange={(v) => setDept(v as WorkDepartment)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.filter((d) => d !== "all").map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as WorkItemType)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.filter((t) => t !== "all").map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as WorkItemPriority)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.filter((p) => p !== "all").map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">State</label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="GA" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Owner</label>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Due date</label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EscalateDialog({ item, onEscalate }: {
  item: WorkItem;
  onEscalate: (reason: string, level: 1 | 2 | 3 | 4) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(2);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Escalate</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Escalate “{item.title}”</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Reason</label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Level</label>
            <Select value={String(level)} onValueChange={(v) => setLevel(Number(v) as 1 | 2 | 3 | 4)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">L1 — Department owner</SelectItem>
                <SelectItem value="2">L2 — Department lead</SelectItem>
                <SelectItem value="3">L3 — Ops Leadership / State Director visibility</SelectItem>
                <SelectItem value="4">L4 — Executive / Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { if (reason.trim()) { onEscalate(reason.trim(), level); setOpen(false); setReason(""); } }} disabled={!reason.trim()}>Escalate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkQueuePage() {
  const wq = useWorkQueue();
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get("view") as "all" | "my" | "department" | "escalations" | "overdue" | null) ?? "all";
  const initialPriority = (searchParams.get("priority") as WorkItemPriority | "all" | null) ?? "all";
  const initialStatus = (searchParams.get("status") as WorkItemStatus | "all" | "active" | null) ?? "active";
  const initialDept = (searchParams.get("department") as WorkDepartment | "all" | null) ?? "all";
  const initialSelectedId = searchParams.get("selected");
  const [view, setView] = useState<"all" | "my" | "department" | "escalations" | "overdue">(initialView);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<WorkDepartment | "all">(initialDept);
  const [priority, setPriority] = useState<WorkItemPriority | "all">(initialPriority);
  const [status, setStatus] = useState<WorkItemStatus | "all" | "active">(initialStatus);
  const [type, setType] = useState<WorkItemType | "all">("all");
  const [selected, setSelected] = useState<WorkItem | null>(null);

  const filtered = useMemo(
    () =>
      sortWorkItemsByUrgency(
        filterWorkItems(wq.items, {
          view, search, department, priority, status, type,
        }),
      ),
    [wq.items, view, search, department, priority, status, type],
  );

  // keep selected in sync with latest state
  useEffect(() => {
    if (!selected) return;
    const fresh = wq.items.find((i) => i.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
    if (!fresh) setSelected(null);
  }, [wq.items, selected]);

  // Deep-link ?selected=<id> auto-selects the item once items load.
  useEffect(() => {
    if (!initialSelectedId || selected) return;
    const match = wq.items.find((i) => i.id === initialSelectedId);
    if (match) setSelected(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedId, wq.items]);

  const kpi = useMemo(() => ({
    open: wq.items.filter((i) => !["resolved", "closed", "ignored"].includes(i.status)).length,
    overdue: wq.items.filter(isWorkItemOverdue).length,
    escalated: wq.items.filter(isWorkItemEscalated).length,
    critical: wq.items.filter((i) => i.priority === "critical").length,
    dueToday: wq.items.filter((i) => getWorkItemDueStatus(i) === "due_today").length,
    resolvedThisWeek: wq.items.filter((i) => i.resolvedAt && withinDays(i.resolvedAt, 7)).length,
  }), [wq.items]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <Workflow className="h-3.5 w-3.5" /> Operations
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Work Queue</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Owned operational work across Intake, Marketing, Business Development, Authorizations,
              Scheduling, Staffing, Credentialing, HR, QA, Clinical, and State Operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/work-queue/escalations">Escalations</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/communications/activity-center">Activity Center</Link></Button>
            <CreateWorkItemDialog onCreate={wq.createWorkItem} />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={ListTodo} label="Open work" value={kpi.open} tone="bg-primary/10 text-primary" />
          <KpiCard icon={AlertTriangle} label="Overdue" value={kpi.overdue} tone="bg-red-50 text-red-700" />
          <KpiCard icon={Sparkles} label="Escalated" value={kpi.escalated} tone="bg-red-50 text-red-700" />
          <KpiCard icon={AlertTriangle} label="Critical" value={kpi.critical} tone="bg-red-100 text-red-800" />
          <KpiCard icon={ClipboardList} label="Due today" value={kpi.dueToday} tone="bg-amber-50 text-amber-700" />
          <KpiCard icon={CheckCircle2} label="Resolved this week" value={kpi.resolvedThisWeek} tone="bg-emerald-50 text-emerald-700" />
        </div>

        <Card className="p-3 rounded-2xl border-border/60">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="all">All work</TabsTrigger>
              <TabsTrigger value="my">My work</TabsTrigger>
              <TabsTrigger value="department">Department</TabsTrigger>
              <TabsTrigger value="escalations">Escalations</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        <Card className="p-4 rounded-2xl border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work…" className="h-9 max-w-xs"
            />
            <Select value={department} onValueChange={(v) => setDepartment(v as WorkDepartment | "all")}>
              <SelectTrigger className="h-9 w-[170px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d === "all" ? "All departments" : d}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as WorkItemPriority | "all")}>
              <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p === "all" ? "Any priority" : p}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as WorkItemStatus | "all" | "active")}>
              <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "Any status" : s === "active" ? "Active only" : s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => setType(v as WorkItemType | "all")}>
              <SelectTrigger className="h-9 w-[170px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">{TYPES.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "Any type" : t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {wq.items.length}</div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <Card className="rounded-2xl border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2.5">Priority</th>
                    <th className="text-left font-medium px-3 py-2.5">Title</th>
                    <th className="text-left font-medium px-3 py-2.5">Department</th>
                    <th className="text-left font-medium px-3 py-2.5">Owner</th>
                    <th className="text-left font-medium px-3 py-2.5">State</th>
                    <th className="text-left font-medium px-3 py-2.5">Due</th>
                    <th className="text-left font-medium px-3 py-2.5">Status</th>
                    <th className="text-left font-medium px-3 py-2.5">Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No work matches the current filters. You're all caught up here.</td></tr>
                  )}
                  {filtered.map((i) => (
                    <tr
                      key={i.id}
                      className={`border-t border-border/60 hover:bg-muted/30 cursor-pointer ${selected?.id === i.id ? "bg-muted/40" : ""}`}
                      onClick={() => setSelected(i)}
                    >
                      <td className="px-3 py-2.5"><PriorityBadge priority={i.priority} /></td>
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        <div className="truncate max-w-[320px]">{i.title}</div>
                        {i.description && <div className="text-[11px] text-muted-foreground truncate max-w-[320px]">{i.description}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{i.department}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{i.ownerName ?? "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{i.state ?? "—"}</td>
                      <td className="px-3 py-2.5"><DueCell item={i} /></td>
                      <td className="px-3 py-2.5"><StatusBadge status={i.status} /></td>
                      <td className="px-3 py-2.5"><RecommendedAction item={i} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border-border/60 lg:sticky lg:top-4 h-fit">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">{selected.department}</div>
                    <h3 className="text-base font-semibold leading-tight">{selected.title}</h3>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <WorkItemMeta item={selected} />
                {selected.description && (
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><div className="text-muted-foreground">Owner</div><div>{selected.ownerName ?? "Unassigned"}</div></div>
                  <div><div className="text-muted-foreground">State</div><div>{selected.state ?? "—"}</div></div>
                  <div><div className="text-muted-foreground">Due</div><div><DueCell item={selected} /></div></div>
                  <div><div className="text-muted-foreground">Created</div><div>{new Date(selected.createdAt).toLocaleDateString()}</div></div>
                </div>

                {isWorkItemEscalated(selected) && (
                  <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 text-xs">
                    <div className="font-medium text-red-800 inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Escalation</div>
                    {selected.escalationReason && <div className="mt-1 text-red-900/90">{selected.escalationReason}</div>}
                    <div className="mt-2 text-red-900/80">Route: {getEscalationRoute(selected).join(" → ")}</div>
                  </div>
                )}

                <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground inline-flex items-start gap-1.5">
                  <Activity className="h-3 w-3 mt-0.5" />
                  Recommended next: {getRecommendedWorkAction(selected)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => wq.setStatus(selected.id, "in_progress")}>Start</Button>
                  <Button size="sm" variant="outline" onClick={() => wq.setStatus(selected.id, "waiting")}>Waiting</Button>
                  <Button size="sm" variant="outline" onClick={() => wq.setStatus(selected.id, "blocked")}>Block</Button>
                  <Button size="sm" variant="outline" onClick={() => wq.completeWorkItem(selected.id, "Resolved from Work Queue")}>Complete</Button>
                  <Button size="sm" variant="outline" onClick={() => wq.snoozeWorkItem(selected.id, new Date(Date.now() + 24 * 3600 * 1000).toISOString())}>Snooze 1d</Button>
                  {isWorkItemEscalated(selected) ? (
                    <Button size="sm" variant="outline" onClick={() => wq.resolveEscalation(selected.id, "Escalation resolved")}>Resolve escalation</Button>
                  ) : (
                    <EscalateDialog item={selected} onEscalate={(reason, level) => wq.escalateWorkItem(selected.id, reason, level)} />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.relatedLeadId && (
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/patient-journey?leadId=${selected.relatedLeadId}`}>
                        <Inbox className="h-3.5 w-3.5 mr-1" /> Open patient journey
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60">
                  <WorkItemTimeline workItemId={selected.id} />
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <Badge variant="outline" className="text-[10px] mb-2">Detail</Badge>
                <div>Select a work item to see ownership, escalation route, related lead/patient, and recommended next action.</div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </OSShell>
  );
}