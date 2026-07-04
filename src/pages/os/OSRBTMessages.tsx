import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, CheckCircle2, BellRing, Clock } from "lucide-react";
import { OSShell } from "./OSShell";
import { useRbtWorkflow, type RbtMessage } from "@/hooks/useRbtWorkflow";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread" | "actions" | "completed";

function relatedLink(m: RbtMessage): { to: string; label: string } | null {
  if (m.related_session_id) return { to: `/rbt/schedule?session=${m.related_session_id}`, label: "Open session" };
  if (m.related_client_id) return { to: `/rbt/clients?client=${m.related_client_id}`, label: "Open client" };
  if ((m as any).related_training_module_id) return { to: `/rbt/training-academy?module=${(m as any).related_training_module_id}`, label: "Open training" };
  return null;
}

export default function OSRBTMessages() {
  const wf = useRbtWorkflow();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return wf.messages.filter((m) => {
      if (filter === "unread") return !m.read_at;
      if (filter === "actions") return m.action_required && !m.completed_at;
      if (filter === "completed") return !!m.completed_at;
      return true;
    });
  }, [wf.messages, filter]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-4xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <MessageSquare className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">RBT Messages</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Alerts, BCBA messages, scheduling changes, training reminders, and required actions.
            </p>
          </div>
        </header>

        <div className="mb-4 flex items-center gap-2">
          {(["all", "unread", "actions", "completed"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("h-9 px-3 rounded-xl text-[12.5px] border", filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border/70 bg-card hover:bg-muted")}>
              {f === "all" ? "All" : f === "unread" ? `Unread (${wf.messages.filter((m) => !m.read_at).length})` : f === "actions" ? "Action required" : "Completed"}
            </button>
          ))}
        </div>

        {wf.loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading messages…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
            No messages here.
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
            {filtered.map((m) => {
              const link = relatedLink(m);
              const unread = !m.read_at;
              return (
                <div key={m.id} className={cn("p-4 flex flex-col md:flex-row md:items-start gap-3", unread && "bg-primary/5")}>
                  <div className="pt-0.5">
                    {m.action_required ? <BellRing className="h-4 w-4 text-amber-600" /> : <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[13px] tracking-tight truncate", unread ? "font-semibold" : "font-medium")}>{m.title}</p>
                      {m.priority === "high" && (
                        <span className="text-[10px] rounded-full border border-destructive/20 bg-destructive/10 text-destructive px-1.5 py-0.5">HIGH</span>
                      )}
                    </div>
                    {m.body && <p className="text-[12.5px] text-muted-foreground mt-1 whitespace-pre-line">{m.body}</p>}
                    <p className="text-[10.5px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{new Date(m.created_at).toLocaleString()}
                      {m.due_at && ` · due ${new Date(m.due_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {unread && (
                      <button onClick={async () => { await wf.markMessageRead(m.id); }}
                        className="h-8 px-2.5 rounded-lg text-[12px] border border-border/70 bg-card hover:bg-muted">Mark read</button>
                    )}
                    {m.action_required && !m.completed_at && (
                      <button onClick={async () => { await wf.markMessageComplete(m.id); toast({ title: "Marked complete" }); }}
                        className="h-8 px-2.5 rounded-lg text-[12px] bg-primary text-primary-foreground hover:opacity-90">Complete</button>
                    )}
                    {m.completed_at && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" />Done
                      </span>
                    )}
                    {link && <Link to={link.to} className="h-8 px-2.5 rounded-lg text-[12px] border border-border/70 bg-card hover:bg-muted inline-flex items-center">{link.label}</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </OSShell>
  );
}
