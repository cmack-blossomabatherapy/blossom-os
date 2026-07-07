/**
 * SystemRequestsPanel
 *
 * Persistent submit/track UI for Blossom OS system requests
 * (bugs, access, improvements, module ideas). Backed by the canonical
 * `system_issues` table.
 *
 * Operations Leadership Pass adds:
 *   - Full Submit / Edit request dialog with the operational fields
 *     (department/role/state/route/impact/desired outcome/due date).
 *   - Filters (status, priority, department, state) + search.
 *   - Primary "Convert to Work Queue" action that creates an
 *     operations_work_items row, logs a `system_request_converted_to_work_item`
 *     event, and links back via `system_issues.linked_work_item_id`.
 *   - Secondary "Convert to workflow inventory" kept as a legacy option.
 *   - Link from request row → linked Work Queue item.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, Plus, ArrowRightLeft, Workflow, Bug, Check, Filter, Search,
  Pencil, ExternalLink, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { ExecCard } from "@/pages/os/executive/_shared";
import {
  useSystemIssues, useSystemWorkflows, logSystemToolAction,
  type SystemIssue,
} from "@/hooks/useSystemTools";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function mapPriorityToWorkflow(p: string): string {
  switch (p) {
    case "urgent":
    case "high": return "High";
    case "low": return "Low";
    default: return "Medium";
  }
}

function mapPriorityToWorkItem(p: string): "low" | "normal" | "high" | "urgent" {
  if (p === "urgent" || p === "high" || p === "low" || p === "normal") return p;
  return "normal";
}

const CATEGORIES = ["Improvement", "Bug", "Access", "Module idea", "Workflow change", "Other"];
const REQUEST_TYPES = ["Bug", "Improvement", "Access", "New module", "Workflow change", "Data fix", "Other"];
const STATUSES = ["open", "triage", "in_progress", "blocked", "resolved"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const DEPARTMENTS = [
  "Operations Leadership", "Intake", "Authorizations", "Scheduling", "Staffing",
  "Recruiting", "HR", "QA", "Billing & Finance", "Marketing", "IT / Systems",
  "Clinical", "State Director", "Other",
];
const STATES = ["GA", "NC", "TN", "VA", "MD", "Multi-state", "Other"];
const ROLES = [
  "Executive", "Operations Leadership", "State Director", "Assistant State Director",
  "BCBA", "RBT", "Intake", "Authorizations", "Scheduling", "Recruiting",
  "HR", "Finance", "QA", "Marketing", "IT / Systems", "Other",
];

interface RequestFormState {
  title: string;
  request_type: string;
  area: string;
  priority: string;
  status: string;
  affected_department: string;
  affected_role: string;
  affected_state: string;
  affected_route: string;
  impact: string;
  desired_outcome: string;
  due_date: string;
  owner_name: string;
  description: string;
}

function emptyForm(): RequestFormState {
  return {
    title: "", request_type: "Improvement", area: "Improvement",
    priority: "normal", status: "open",
    affected_department: "", affected_role: "", affected_state: "", affected_route: "",
    impact: "", desired_outcome: "", due_date: "", owner_name: "", description: "",
  };
}

function fromIssue(i: SystemIssue): RequestFormState {
  return {
    title: i.title ?? "",
    request_type: i.request_type ?? "Improvement",
    area: i.area ?? "Improvement",
    priority: i.priority ?? "normal",
    status: i.status ?? "open",
    affected_department: i.affected_department ?? "",
    affected_role: i.affected_role ?? "",
    affected_state: i.affected_state ?? "",
    affected_route: i.affected_route ?? "",
    impact: i.impact ?? "",
    desired_outcome: i.desired_outcome ?? "",
    due_date: i.due_date ? i.due_date.slice(0, 10) : "",
    owner_name: i.owner_name ?? "",
    description: i.description ?? "",
  };
}

function toPayload(f: RequestFormState): Partial<SystemIssue> {
  return {
    title: f.title.trim(),
    request_type: f.request_type || null,
    area: f.area || null,
    priority: f.priority,
    status: f.status,
    affected_department: f.affected_department || null,
    affected_role: f.affected_role || null,
    affected_state: f.affected_state || null,
    affected_route: f.affected_route || null,
    impact: f.impact || null,
    desired_outcome: f.desired_outcome || null,
    due_date: f.due_date ? new Date(f.due_date).toISOString() : null,
    owner_name: f.owner_name || null,
    description: f.description || null,
  };
}

function RequestDialog({
  trigger, existing, onSave,
}: {
  trigger: React.ReactNode;
  existing?: SystemIssue;
  onSave: (payload: Partial<SystemIssue>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RequestFormState>(existing ? fromIssue(existing) : emptyForm());
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof RequestFormState>(k: K, v: RequestFormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) setForm(existing ? fromIssue(existing) : emptyForm());
  };

  const submit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await onSave(toPayload(form));
      toast.success(existing ? "Request updated" : "Request submitted");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit request" : "Submit request"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="Short, action-oriented summary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Request type</Label>
              <Select value={form.request_type} onValueChange={(v) => set("request_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REQUEST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category / area</Label>
              <Select value={form.area} onValueChange={(v) => set("area", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Affected department</Label>
              <Select value={form.affected_department || "__none"} onValueChange={(v) => set("affected_department", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Affected role</Label>
              <Select value={form.affected_role || "__none"} onValueChange={(v) => set("affected_role", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Affected state</Label>
              <Select value={form.affected_state || "__none"} onValueChange={(v) => set("affected_state", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Affected route / page</Label>
              <Input value={form.affected_route} onChange={(e) => set("affected_route", e.target.value)}
                placeholder="/authorizations, /scheduling, ..." />
            </div>
          </div>
          <div>
            <Label>Impact</Label>
            <Textarea value={form.impact} onChange={(e) => set("impact", e.target.value)} rows={2}
              placeholder="Who and what this affects today" />
          </div>
          <div>
            <Label>Desired outcome</Label>
            <Textarea value={form.desired_outcome} onChange={(e) => set("desired_outcome", e.target.value)} rows={2}
              placeholder="What good looks like when this is done" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
            <div>
              <Label>Owner / assignee</Label>
              <Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)}
                placeholder="Name of the person picking this up" />
            </div>
          </div>
          <div>
            <Label>Description / notes</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4}
              placeholder="Additional context, screenshots, links..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {existing ? "Save changes" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SystemRequestsPanel() {
  return <SystemRequestsPanelInner />;
}

/**
 * Header-friendly Submit Request button. Uses the same full-form dialog as
 * the intake panel so admins and end users get identical intake surfaces.
 */
export function SubmitSystemRequestButton({
  label = "Submit request", size = "sm",
}: { label?: string; size?: "sm" | "default" }) {
  const { create } = useSystemIssues();
  return (
    <RequestDialog
      trigger={
        <Button size={size}>
          <Plus className="mr-1.5 h-4 w-4" /> {label}
        </Button>
      }
      onSave={async (payload) => { await create(payload); }}
    />
  );
}

function SystemRequestsPanelInner() {
  const { rows, loading, create, update } = useSystemIssues();
  const { create: createWorkflow } = useSystemWorkflows();
  const { isAdmin, displayName } = useAuth();
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fPriority, setFPriority] = useState<string>("all");
  const [fDept, setFDept] = useState<string>("all");
  const [fState, setFState] = useState<string>("all");

  const items = useMemo(() => {
    let list = rows ?? [];
    if (fStatus !== "all") list = list.filter((r) => r.status === fStatus);
    if (fPriority !== "all") list = list.filter((r) => r.priority === fPriority);
    if (fDept !== "all") list = list.filter((r) => (r.affected_department ?? r.area) === fDept);
    if (fState !== "all") list = list.filter((r) => r.affected_state === fState);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((r) =>
        [r.title, r.description, r.area, r.affected_department, r.affected_state, r.affected_route, r.owner_name]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)),
      );
    }
    return list;
  }, [rows, fStatus, fPriority, fDept, fState, q]);

  const setStatus = async (id: string, status: string) => {
    try {
      await update(id, { status });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update");
    }
  };

  /* --------------------- Convert → Operations Work Queue ------------------ */
  const convertToWorkQueue = async (req: SystemIssue) => {
    setConvertingId(req.id);
    try {
      const meta = {
        source: "system_request",
        system_issue_id: req.id,
        request_type: req.request_type ?? null,
        description: req.description ?? null,
        impact: req.impact ?? null,
        desired_outcome: req.desired_outcome ?? null,
        affected_route: req.affected_route ?? null,
        affected_role: req.affected_role ?? null,
        area: req.area ?? null,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyClient = supabase as any;
      const { data: authUser } = await anyClient.auth.getUser();
      const created = await anyClient
        .from("operations_work_items")
        .insert({
          title: req.title,
          description: req.description ?? null,
          type: "general_task",
          department: req.affected_department ?? req.area ?? "Operations Leadership",
          state: req.affected_state ?? null,
          priority: mapPriorityToWorkItem(req.priority),
          status: "open",
          due_date: req.due_date ?? null,
          owner_id: req.owner_id ?? null,
          owner_name: req.owner_name ?? null,
          source_system: "system_request",
          metadata: meta,
          created_by: authUser?.user?.id ?? null,
        })
        .select("id")
        .single();
      if (created.error) throw new Error(created.error.message);
      const workItemId = created.data?.id as string;

      await anyClient.from("operations_work_item_events").insert({
        work_item_id: workItemId,
        event_type: "system_request_converted_to_work_item",
        message: `Converted from system request "${req.title}" by ${displayName ?? "admin"}.`,
        actor_name: displayName ?? null,
        actor_id: authUser?.user?.id ?? null,
        metadata: { system_issue_id: req.id },
      });

      await update(req.id, {
        linked_work_item_id: workItemId,
        status: "in_progress",
        notes: [req.notes ?? "", `Converted to Operations Work Queue item ${workItemId.slice(0, 8)}.`]
          .filter(Boolean).join("\n"),
      });

      void logSystemToolAction({
        tool_area: "request_intake",
        action: "convert_to_work_queue",
        entity_table: "system_issues",
        entity_id: req.id,
        previous_value: { status: req.status, linked_work_item_id: req.linked_work_item_id ?? null },
        new_value: { status: "in_progress", linked_work_item_id: workItemId, target: "operations_work_items" },
        metadata: { title: req.title },
      });

      toast.success("Converted to Work Queue item");
    } catch (err: any) {
      toast.error(err?.message ?? "Conversion failed");
    } finally { setConvertingId(null); }
  };

  const convertToWorkflow = async (req: SystemIssue) => {
    setConvertingId(req.id);
    try {
      await createWorkflow({
        name: req.title,
        department: req.area ?? null,
        owner_name: req.owner_name ?? null,
        current_source: "System request",
        future_module: null,
        status: "Planned",
        priority: mapPriorityToWorkflow(req.priority),
        notes: [
          req.description ?? "",
          `Converted from request "${req.title}" (${req.id.slice(0, 8)}) by ${displayName ?? "admin"} on ${new Date().toLocaleDateString()}.`,
        ].filter(Boolean).join("\n\n"),
      });
      await update(req.id, {
        status: "resolved",
        resolved_at: new Date().toISOString(),
        notes: [req.notes ?? "", `Converted to workflow inventory item.`].filter(Boolean).join("\n"),
      });
      void logSystemToolAction({
        tool_area: "request_intake",
        action: "convert_to_workflow",
        entity_table: "system_issues",
        entity_id: req.id,
        previous_value: { status: req.status },
        new_value: { status: "resolved", target: "system_workflows" },
        metadata: { title: req.title },
      });
      toast.success("Converted to workflow inventory item");
    } catch (err: any) {
      toast.error(err?.message ?? "Conversion failed");
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <ExecCard title="System requests" hint="Persisted intake — bugs, access, ideas">
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <RequestDialog
          trigger={
            <Button size="sm" className="h-8">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Submit request
            </Button>
          }
          onSave={async (payload) => { await create(payload); }}
        />
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, description, route..." className="h-8 pl-7 text-[13px]" />
        </div>
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fPriority} onValueChange={setFPriority}>
          <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fDept} onValueChange={setFDept}>
          <SelectTrigger className="h-8 w-[170px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fState} onValueChange={setFState}>
          <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center text-[13px] text-muted-foreground">
          No requests match — try clearing filters or submit a new one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Request</th>
                <th className="px-3 py-2 text-left">Dept / area</th>
                <th className="px-3 py-2 text-left">State</th>
                <th className="px-3 py-2 text-left">Priority</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-border/60">
                  <td className="px-3 py-2 text-foreground/90">
                    <div className="flex flex-col">
                      <span>{i.title}</span>
                      {i.affected_route ? (
                        <span className="text-[11px] text-muted-foreground">{i.affected_route}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {i.affected_department ?? i.area ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{i.affected_state ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.priority}</td>
                  <td className="px-3 py-2">
                    <select
                      value={i.status}
                      onChange={(e) => setStatus(i.id, e.target.value)}
                      className="rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[12px]"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                      {!STATUSES.includes(i.status) && (
                        <option value={i.status}>{i.status}</option>
                      )}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {i.linked_work_item_id ? (
                        <Link
                          to={`/work-queue?item=${i.linked_work_item_id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-foreground/90 hover:bg-muted"
                          title="Open linked Work Queue item"
                        >
                          <ExternalLink className="h-3 w-3" /> Work item
                        </Link>
                      ) : null}
                      <RequestDialog
                        existing={i}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-foreground/90 hover:bg-muted"
                            title="Edit request"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        }
                        onSave={async (payload) => { await update(i.id, payload); }}
                      />
                      {isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              disabled={convertingId === i.id}
                              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-foreground px-2 py-0.5 text-[11px] font-medium text-background hover:opacity-90 disabled:opacity-40"
                            >
                              {convertingId === i.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ArrowRightLeft className="h-3 w-3" />
                              )}
                              Convert
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60">
                            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Convert request
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => convertToWorkQueue(i)}
                              disabled={Boolean(i.linked_work_item_id)}
                            >
                              <ListChecks className="mr-2 h-4 w-4" />
                              {i.linked_work_item_id ? "Already in Work Queue" : "To Operations Work Queue"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Secondary
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => convertToWorkflow(i)}>
                              <Workflow className="mr-2 h-4 w-4" />
                              To workflow inventory
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span
                          title="Admins can convert requests into Work Queue items"
                          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground opacity-60"
                        >
                          <ArrowRightLeft className="h-3 w-3" /> Admin only
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ExecCard>
  );
}