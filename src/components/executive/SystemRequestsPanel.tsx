/**
 * SystemRequestsPanel
 *
 * Persistent submit/track UI for Blossom OS system requests
 * (bugs, access, improvements, module ideas). Backed by the canonical
 * `system_issues` table (Executive Leadership Pass 2 consolidation).
 *
 * Any authenticated user may submit; admin / super_admin roles can
 * triage/edit per the `system_issues` RLS policies. Executive follow-up
 * work items live separately in `executive_work_items` and can link back
 * via metadata / source_record fields when leadership takes action.
 */
import { useMemo, useState } from "react";
import { Loader2, Plus, ArrowRightLeft, Workflow, Bug, Check } from "lucide-react";
import { toast } from "sonner";
import { ExecCard } from "@/pages/os/executive/_shared";
import { useSystemIssues, useSystemWorkflows, logSystemToolAction, type SystemIssue } from "@/hooks/useSystemTools";
import { useAuth } from "@/contexts/AuthContext";
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

const CATEGORIES = ["Improvement", "Bug", "Access", "Module idea", "Other"];
const STATUSES = ["open", "triage", "in_progress", "blocked", "resolved"];

export function SystemRequestsPanel() {
  const { rows, loading, create, update } = useSystemIssues();
  const { create: createWorkflow } = useSystemWorkflows();
  const { isAdmin, displayName } = useAuth();
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const items = useMemo(() => rows ?? [], [rows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setSubmitting(true);
    try {
      await create({
        title: t,
        area: category,
        priority,
        status: "open",
      });
      setTitle("");
      setPriority("normal");
      toast.success("Request submitted");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await update(id, { status });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update");
    }
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

  const convertToIssue = async (req: SystemIssue) => {
    setConvertingId(req.id);
    try {
      await update(req.id, {
        area: req.area && req.area !== "Improvement" && req.area !== "Module idea" ? req.area : "Bug",
        status: "triage",
        notes: [req.notes ?? "", `Promoted to tracked issue by ${displayName ?? "admin"} on ${new Date().toLocaleDateString()}.`].filter(Boolean).join("\n"),
      });
      void logSystemToolAction({
        tool_area: "request_intake",
        action: "convert_to_issue",
        entity_table: "system_issues",
        entity_id: req.id,
        previous_value: { status: req.status, area: req.area },
        new_value: { status: "triage", area: "Bug" },
        metadata: { title: req.title },
      });
      toast.success("Promoted to tracked issue");
    } catch (err: any) {
      toast.error(err?.message ?? "Conversion failed");
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <ExecCard title="System requests" hint="Persisted intake — bugs, access, ideas">
      <form
        onSubmit={handleSubmit}
        className="mb-4 rounded-xl border border-border/60 bg-background/40 p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Describe the request…"
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-[12px] font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Submit
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center text-[13px] text-muted-foreground">
          No requests yet — submit one above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Request</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Priority</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Convert</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-border/60">
                  <td className="px-3 py-2 text-foreground/90">{i.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.area ?? "—"}</td>
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
                  <td className="px-3 py-2 text-right">
                    {isAdmin ? (
                      i.status === "resolved" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Check className="h-3 w-3" /> Converted
                        </span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              disabled={convertingId === i.id}
                              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[12px] text-foreground/90 hover:bg-muted disabled:opacity-40"
                            >
                              {convertingId === i.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ArrowRightLeft className="h-3 w-3" />
                              )}
                              Convert
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Convert request
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => convertToWorkflow(i)}>
                              <Workflow className="mr-2 h-4 w-4" />
                              To workflow inventory
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => convertToIssue(i)}>
                              <Bug className="mr-2 h-4 w-4" />
                              To tracked issue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    ) : (
                      <span
                        title="Admins can convert requests into workflow items or issues"
                        className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground opacity-60"
                      >
                        <ArrowRightLeft className="h-3 w-3" /> Admin only
                      </span>
                    )}
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