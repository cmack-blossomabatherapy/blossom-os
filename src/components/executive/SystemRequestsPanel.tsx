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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ExecCard } from "@/pages/os/executive/_shared";
import { useSystemIssues } from "@/hooks/useSystemTools";

const CATEGORIES = ["Improvement", "Bug", "Access", "Module idea", "Other"];
const STATUSES = ["open", "triage", "in_progress", "blocked", "resolved"];

export function SystemRequestsPanel() {
  const { rows, loading, create, update } = useSystemIssues();
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ExecCard>
  );
}