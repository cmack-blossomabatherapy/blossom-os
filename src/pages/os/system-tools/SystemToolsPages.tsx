import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Workflow, Inbox, Bug, Search, Plus, Pencil, Trash2, ExternalLink, Plug,
  CheckCircle2, PauseCircle, ShieldAlert, Play, RefreshCw, ArchiveRestore,
  ArrowRightCircle, type LucideIcon,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SystemRequestsPanel, SubmitSystemRequestButton } from "@/components/executive/SystemRequestsPanel";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useSystemIssues, useSystemWorkflows,
  type SystemIssue, type SystemWorkflow,
} from "@/hooks/useSystemTools";
import { SystemToolAuditPanel, AuditHistoryButton } from "@/components/system-tools/SystemToolAuditPanel";

function Shell({ children }: { children: ReactNode }) {
  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">{children}</div>
    </OSShell>
  );
}

function PageHeader({ eyebrow, title, subtitle, icon: Icon, actions }: {
  eyebrow: string; title: string; subtitle: string; icon: LucideIcon; actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          <Icon className="h-3.5 w-3.5" /> {eyebrow}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

function ActionRow({ actions }: { actions: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <span key={a} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-border/60 bg-muted/40 text-xs text-muted-foreground">{a}</span>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Planned: "bg-sky-50 text-sky-700 border-sky-200",
    "In Build": "bg-sky-50 text-sky-700 border-sky-200",
    Replaced: "bg-muted text-muted-foreground",
    Inactive: "bg-muted text-muted-foreground",
    Open: "bg-sky-50 text-sky-700 border-sky-200",
    Triage: "bg-amber-50 text-amber-800 border-amber-200",
    "In Progress": "bg-sky-50 text-sky-700 border-sky-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Blocked: "bg-red-50 text-red-700 border-red-200",
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-800 border-amber-200",
    Low: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={cn(map[status] ?? "bg-muted text-muted-foreground")}>{status}</Badge>;
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-sm">
      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search..." className="pl-9 h-10" />
    </div>
  );
}

function TableShell({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <Card className="rounded-2xl border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{columns.map((c) => <th key={c} className="text-left font-medium px-4 py-3 whitespace-nowrap">{c}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

function EmptyRow({ span, label }: { span: number; label: string }) {
  return (
    <tr>
      <td colSpan={span} className="px-4 py-10 text-center text-sm text-muted-foreground">{label}</td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Workflow Inventory                                                         */
/* -------------------------------------------------------------------------- */

const WORKFLOW_STATUSES = ["Planned", "In Build", "Active", "Inactive", "Replaced"];
const PRIORITIES = ["Low", "Medium", "High"];
const RISK_LEVELS = ["Low", "Medium", "High", "Critical"];
const ALL_OPTION = "__all__";

function SelectFilter({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground whitespace-nowrap">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_OPTION}>All</SelectItem>
          {options.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick, tone }: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger" ? "text-red-600 hover:bg-red-50" :
    tone === "success" ? "text-emerald-700 hover:bg-emerald-50" :
    "text-muted-foreground hover:text-foreground";
  return (
    <Button
      size="icon" variant="ghost" className={cn("h-8 w-8", toneClass)}
      title={label} aria-label={label} onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function WorkflowDialog({
  trigger, initial, onSubmit,
}: {
  trigger: ReactNode;
  initial?: Partial<SystemWorkflow>;
  onSubmit: (patch: Partial<SystemWorkflow>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [owner, setOwner] = useState(initial?.owner_name ?? "");
  const [source, setSource] = useState(initial?.current_source ?? "");
  const [future, setFuture] = useState(initial?.future_module ?? "");
  const [status, setStatus] = useState(initial?.status ?? "Planned");
  const [priority, setPriority] = useState(initial?.priority ?? "Medium");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [relatedRoute, setRelatedRoute] = useState(initial?.related_route ?? "");
  const [riskLevel, setRiskLevel] = useState(initial?.risk_level ?? "");
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        department: department || null,
        owner_name: owner || null,
        current_source: source || null,
        future_module: future || null,
        status, priority,
        notes: notes || null,
        related_route: relatedRoute || null,
        risk_level: riskLevel || null,
      });
      setOpen(false);
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initial?.id ? "Edit workflow" : "Add workflow"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Workflow name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Department</Label><Input value={department ?? ""} onChange={(e) => setDepartment(e.target.value)} /></div>
            <div><Label>Owner</Label><Input value={owner ?? ""} onChange={(e) => setOwner(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Current source</Label><Input value={source ?? ""} onChange={(e) => setSource(e.target.value)} /></div>
            <div><Label>Future module</Label><Input value={future ?? ""} onChange={(e) => setFuture(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WORKFLOW_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Related route</Label><Input value={relatedRoute ?? ""} onChange={(e) => setRelatedRoute(e.target.value)} placeholder="/ops/staffing" /></div>
            <div>
              <Label>Risk level</Label>
              <Select value={riskLevel || ""} onValueChange={(v) => setRiskLevel(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {RISK_LEVELS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkflowInventoryPage() {
  const { isAdmin } = useAuth();
  const { rows, loading, create, update, remove } = useSystemWorkflows();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_OPTION);
  const [priorityFilter, setPriorityFilter] = useState(ALL_OPTION);
  const [riskFilter, setRiskFilter] = useState(ALL_OPTION);
  const [departmentFilter, setDepartmentFilter] = useState(ALL_OPTION);

  const departments = useMemo(
    () => Array.from(new Set(rows.map((r) => r.department).filter(Boolean))) as string[],
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== ALL_OPTION && r.status !== statusFilter) return false;
      if (priorityFilter !== ALL_OPTION && r.priority !== priorityFilter) return false;
      if (riskFilter !== ALL_OPTION && (r.risk_level ?? "") !== riskFilter) return false;
      if (departmentFilter !== ALL_OPTION && (r.department ?? "") !== departmentFilter) return false;
      if (!needle) return true;
      return [r.name, r.department, r.owner_name, r.current_source, r.future_module, r.notes, r.related_route]
        .filter(Boolean).some((s) => String(s).toLowerCase().includes(needle));
    });
  }, [rows, q, statusFilter, priorityFilter, riskFilter, departmentFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow?")) return;
    try { await remove(id); }
    catch (e) { toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" }); }
  }

  async function quickStatus(id: string, next: string, action: string) {
    try {
      await update(id, { status: next });
      toast({ title: `Marked ${action}` });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function quickVerify(id: string) {
    try {
      await update(id, { last_verified_at: new Date().toISOString() });
      toast({ title: "Marked verified" });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="System Tools"
        title="Workflow Inventory"
        subtitle="Document current and planned Blossom OS workflows, owners, statuses, data sources, and build priority."
        icon={Workflow}
        actions={isAdmin ? (
          <WorkflowDialog
            trigger={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add workflow</Button>}
            onSubmit={create}
          />
        ) : null}
      />
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={q} onChange={setQ} />
        <SelectFilter label="Status" value={statusFilter} onChange={setStatusFilter} options={WORKFLOW_STATUSES} />
        <SelectFilter label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={PRIORITIES} />
        <SelectFilter label="Risk" value={riskFilter} onChange={setRiskFilter} options={RISK_LEVELS} />
        {departments.length > 0 ? (
          <SelectFilter label="Dept" value={departmentFilter} onChange={setDepartmentFilter} options={departments} />
        ) : null}
      </div>
      <TableShell columns={["Workflow", "Department", "Owner", "Status", "Priority", "Risk", "Related", "Last verified", ""]}>
        {loading ? (
          <EmptyRow span={9} label="Loading…" />
        ) : filtered.length === 0 ? (
          <EmptyRow span={9} label={rows.length === 0 ? "No workflows yet. Add the first entry to start the inventory." : "No results."} />
        ) : filtered.map((r) => (
          <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
            <td className="px-4 py-3 font-medium">{r.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{r.department ?? "—"}</td>
            <td className="px-4 py-3 text-muted-foreground">{r.owner_name ?? "—"}</td>
            <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
            <td className="px-4 py-3"><StatusBadge status={r.priority} /></td>
            <td className="px-4 py-3">{r.risk_level ? <StatusBadge status={r.risk_level} /> : <span className="text-muted-foreground">—</span>}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {r.related_route ? (
                <Link to={r.related_route} className="inline-flex items-center gap-1 hover:text-foreground">
                  <ExternalLink className="h-3 w-3" />{r.related_route}
                </Link>
              ) : "—"}
            </td>
            <td className="px-4 py-3 text-muted-foreground text-xs">
              {r.last_verified_at ? new Date(r.last_verified_at).toLocaleDateString() : "—"}
            </td>
            <td className="px-4 py-3 text-right">
              {isAdmin ? (
                <div className="flex items-center gap-1 justify-end">
                  {r.status !== "Active" ? (
                    <QuickActionButton icon={CheckCircle2} label="Mark active" tone="success" onClick={() => quickStatus(r.id, "Active", "active")} />
                  ) : null}
                  {r.status !== "Inactive" ? (
                    <QuickActionButton icon={PauseCircle} label="Mark needs review" onClick={() => quickStatus(r.id, "Inactive", "needs review")} />
                  ) : null}
                  {r.status !== "Replaced" ? (
                    <QuickActionButton icon={ArchiveRestore} label="Mark deprecated" onClick={() => quickStatus(r.id, "Replaced", "deprecated")} />
                  ) : null}
                  <QuickActionButton icon={ShieldAlert} label="Mark verified" onClick={() => quickVerify(r.id)} />
                  <AuditHistoryButton
                    toolArea="workflow_inventory"
                    entityId={r.id}
                    entityLabel={r.name}
                  />
                  <WorkflowDialog
                    initial={r}
                    trigger={<Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>}
                    onSubmit={(patch) => update(r.id, patch)}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </td>
          </tr>
        ))}
      </TableShell>
      {isAdmin ? (
        <SystemToolAuditPanel toolArea="workflow_inventory" />
      ) : null}
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Request Intake                                                             */
/* -------------------------------------------------------------------------- */

export function RequestIntakePage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="System Tools"
        title="Request Intake"
        subtitle="Submit and track requests for Blossom OS improvements, workflow changes, access needs, bugs, and new module ideas."
        icon={Inbox}
        actions={<SubmitSystemRequestButton />}
      />
      <ActionRow actions={["Submit request", "Assign owner", "Filter by department / state", "Set priority", "Convert to Work Queue", "Mark resolved"]} />
      <SystemRequestsPanel />
      <SystemToolAuditPanel title="All System Tools activity" />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Issue Tracker                                                              */
/* -------------------------------------------------------------------------- */

const ISSUE_STATUSES = ["Open", "Triage", "In Progress", "Blocked", "Resolved"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

function IssueSubmitDialog({
  trigger, onSubmit, defaultReporter,
}: {
  trigger: ReactNode;
  onSubmit: (patch: Partial<SystemIssue>) => Promise<void>;
  defaultReporter?: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [severity, setSeverity] = useState("Medium");
  const [reproduction, setReproduction] = useState("");
  const [relatedRoute, setRelatedRoute] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    if (!title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        area: area || null,
        description: description || null,
        priority,
        severity,
        reproduction_steps: reproduction || null,
        related_route: relatedRoute || null,
        status: "Open",
        reported_by_name: defaultReporter ?? null,
      });
      setOpen(false);
      setTitle(""); setArea(""); setDescription(""); setPriority("Medium");
      setSeverity("Medium"); setReproduction(""); setRelatedRoute("");
      toast({ title: "Issue submitted" });
    } catch (e) {
      toast({ title: "Submit failed", description: (e as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Report an issue</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" /></div>
          <div><Label>Area</Label><Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Authorizations, Sidebar" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What happened? Steps to reproduce?" /></div>
          <div><Label>Reproduction steps</Label><Textarea value={reproduction} onChange={(e) => setReproduction(e.target.value)} rows={3} placeholder="1. Go to... 2. Click... 3. Expected... Actual..." /></div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Related route</Label><Input value={relatedRoute} onChange={(e) => setRelatedRoute(e.target.value)} placeholder="/scheduling/board" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Submitting…" : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IssueTriageDialog({
  trigger, issue, onSubmit,
}: {
  trigger: ReactNode;
  issue: SystemIssue;
  onSubmit: (patch: Partial<SystemIssue>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState(issue.owner_name ?? "");
  const [priority, setPriority] = useState(issue.priority);
  const [status, setStatus] = useState(issue.status);
  const [notes, setNotes] = useState(issue.notes ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    try {
      await onSubmit({
        owner_name: owner || null,
        priority, status,
        notes: notes || null,
        resolved_at: status === "Resolved" ? new Date().toISOString() : null,
      });
      setOpen(false);
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Triage: {issue.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ISSUE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IssueTrackerPage() {
  const { isAdmin, displayName } = useAuth();
  const { rows, loading, create, update, remove } = useSystemIssues();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_OPTION);
  const [priorityFilter, setPriorityFilter] = useState(ALL_OPTION);
  const [severityFilter, setSeverityFilter] = useState(ALL_OPTION);
  const [areaFilter, setAreaFilter] = useState(ALL_OPTION);
  const [resolveTarget, setResolveTarget] = useState<SystemIssue | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");

  const areas = useMemo(
    () => Array.from(new Set(rows.map((r) => r.area).filter(Boolean))) as string[],
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== ALL_OPTION && r.status !== statusFilter) return false;
      if (priorityFilter !== ALL_OPTION && r.priority !== priorityFilter) return false;
      if (severityFilter !== ALL_OPTION && (r.severity ?? "") !== severityFilter) return false;
      if (areaFilter !== ALL_OPTION && (r.area ?? "") !== areaFilter) return false;
      if (!needle) return true;
      return [r.title, r.area, r.description, r.owner_name, r.reported_by_name, r.notes, r.related_route]
        .filter(Boolean).some((s) => String(s).toLowerCase().includes(needle));
    });
  }, [rows, q, statusFilter, priorityFilter, severityFilter, areaFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this issue?")) return;
    try { await remove(id); }
    catch (e) { toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" }); }
  }

  async function quickStatus(r: SystemIssue, next: string, action: string) {
    if (next === "Resolved") {
      setResolveTarget(r);
      setResolveNotes(r.resolution_notes ?? "");
      return;
    }
    try {
      await update(r.id, {
        status: next,
        resolved_at: null,
      });
      toast({ title: `Marked ${action}` });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function confirmResolve() {
    if (!resolveTarget) return;
    if (!resolveNotes.trim()) {
      toast({ title: "Resolution notes are required", variant: "destructive" });
      return;
    }
    try {
      await update(resolveTarget.id, {
        status: "Resolved",
        resolution_notes: resolveNotes.trim(),
        resolved_at: new Date().toISOString(),
      });
      setResolveTarget(null);
      setResolveNotes("");
      toast({ title: "Issue resolved" });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function convertRequestToIssue(r: SystemIssue) {
    try {
      await update(r.id, {
        request_type: null,
        status: r.status === "Open" ? "Triage" : r.status,
      });
      toast({ title: "Converted to tracked issue" });
    } catch (e) {
      toast({ title: "Convert failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="System Tools"
        title="Issue Tracker"
        subtitle="Track system issues, broken workflows, access problems, data issues, and operational blockers."
        icon={Bug}
        actions={
          <IssueSubmitDialog
            trigger={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Report issue</Button>}
            onSubmit={create}
            defaultReporter={displayName}
          />
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={q} onChange={setQ} />
        <SelectFilter label="Status" value={statusFilter} onChange={setStatusFilter} options={ISSUE_STATUSES} />
        <SelectFilter label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={PRIORITIES} />
        <SelectFilter label="Severity" value={severityFilter} onChange={setSeverityFilter} options={SEVERITIES} />
        {areas.length > 0 ? (
          <SelectFilter label="Area" value={areaFilter} onChange={setAreaFilter} options={areas} />
        ) : null}
      </div>
      <TableShell columns={["Issue", "Area", "Owner", "Priority", "Severity", "Status", "Related", ""]}>
        {loading ? (
          <EmptyRow span={8} label="Loading…" />
        ) : filtered.length === 0 ? (
          <EmptyRow span={8} label={rows.length === 0 ? "No issues reported yet." : "No results."} />
        ) : filtered.map((r) => (
          <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
            <td className="px-4 py-3 font-medium">{r.title}</td>
            <td className="px-4 py-3 text-muted-foreground">{r.area ?? "—"}</td>
            <td className="px-4 py-3 text-muted-foreground">{r.owner_name ?? "—"}</td>
            <td className="px-4 py-3"><StatusBadge status={r.priority} /></td>
            <td className="px-4 py-3">{r.severity ? <StatusBadge status={r.severity} /> : <span className="text-muted-foreground">—</span>}</td>
            <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
            <td className="px-4 py-3 text-muted-foreground text-xs">
              {r.related_route ? (
                <Link to={r.related_route} className="inline-flex items-center gap-1 hover:text-foreground">
                  <ExternalLink className="h-3 w-3" />route
                </Link>
              ) : null}
              {r.related_integration_id ? (
                <Link to={`/admin/integrations?id=${r.related_integration_id}`} className="ml-2 inline-flex items-center gap-1 hover:text-foreground">
                  <Plug className="h-3 w-3" />integration
                </Link>
              ) : null}
              {!r.related_route && !r.related_integration_id ? "—" : null}
            </td>
            <td className="px-4 py-3 text-right">
              {isAdmin ? (
                <div className="flex items-center gap-1 justify-end">
                  {r.status === "Open" ? (
                    <QuickActionButton icon={PauseCircle} label="Triage" onClick={() => quickStatus(r, "Triage", "for triage")} />
                  ) : null}
                  {(r.status === "Open" || r.status === "Triage") ? (
                    <QuickActionButton icon={Play} label="Start work" onClick={() => quickStatus(r, "In Progress", "in progress")} />
                  ) : null}
                  {r.status !== "Blocked" && r.status !== "Resolved" ? (
                    <QuickActionButton icon={ShieldAlert} label="Mark blocked" tone="danger" onClick={() => quickStatus(r, "Blocked", "blocked")} />
                  ) : null}
                  {r.status !== "Resolved" ? (
                    <QuickActionButton icon={CheckCircle2} label="Resolve" tone="success" onClick={() => quickStatus(r, "Resolved", "resolved")} />
                  ) : (
                    <QuickActionButton icon={RefreshCw} label="Reopen" onClick={() => quickStatus(r, "Open", "reopened")} />
                  )}
                  {r.request_type ? (
                    <QuickActionButton icon={ArrowRightCircle} label="Convert to tracked issue" onClick={() => convertRequestToIssue(r)} />
                  ) : null}
                  <AuditHistoryButton
                    toolArea="issue_tracker"
                    entityId={r.id}
                    entityLabel={r.title}
                  />
                  <IssueTriageDialog
                    issue={r}
                    onSubmit={(patch) => update(r.id, patch)}
                    trigger={<Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </td>
          </tr>
        ))}
      </TableShell>
      {isAdmin ? (
        <SystemToolAuditPanel toolArea="issue_tracker" />
      ) : null}

      <Dialog open={!!resolveTarget} onOpenChange={(o) => { if (!o) { setResolveTarget(null); setResolveNotes(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Resolve: {resolveTarget?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Resolution notes <span className="text-red-600">*</span></Label>
              <Textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={5}
                placeholder="What was done to resolve this? Link to fix, migration, or PR if applicable."
              />
              <p className="text-xs text-muted-foreground mt-1.5">Required — the audit log captures who resolved and how.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveTarget(null); setResolveNotes(""); }}>Cancel</Button>
            <Button onClick={confirmResolve} disabled={!resolveNotes.trim()}>Resolve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
