import { useState, useMemo } from "react";
import { CalendarClock, Plus, CheckCircle2, RotateCcw, Undo2 } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { CMPage, Pill, FilterBar, FormDialog } from "./_shared";
import { priorityTone, statusTone, familySelectOptions, familyOptionByValue, familyContext, stringValue, dateTimeIsoOrNull, type CMFormValues } from "./_utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["family_check_in","scheduling","staffing","authorization","clinical","other"];
const PRIORITIES = ["low","normal","high","urgent"];

export default function ProgressFollowUpsPage() {
  const w = useCaseManagerWorkspace();
  const [tab, setTab] = useState<"today"|"overdue"|"week"|"waiting"|"completed"|"all">("today");
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const options = familySelectOptions(w.assignments);
  const pickFamily = (v: CMFormValues) => familyOptionByValue(w.assignments, stringValue(v.family));

  const now = Date.now();
  const startToday = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }, []);
  const endToday = startToday + 86400000;
  const endWeek = startToday + 7 * 86400000;

  const filtered = w.followUps.filter((f) => {
    if (priority !== "all" && f.priority !== priority) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![f.title, f.description, f.client_name].some((x) => (x ?? "").toLowerCase().includes(s))) return false;
    }
    const t = f.due_at ? new Date(f.due_at).getTime() : null;
    if (tab === "today") return f.status === "open" && t !== null && t >= startToday && t < endToday;
    if (tab === "overdue") return f.status === "open" && t !== null && t < now;
    if (tab === "week") return f.status === "open" && t !== null && t >= startToday && t <= endWeek;
    if (tab === "waiting") return f.status === "waiting";
    if (tab === "completed") return f.status === "completed";
    return true;
  });

  const counts = {
    today: w.followUps.filter((f) => f.status === "open" && f.due_at && new Date(f.due_at).getTime() >= startToday && new Date(f.due_at).getTime() < endToday).length,
    overdue: w.overdueFollowUps.length,
    week: w.dueThisWeekFollowUps.length,
    waiting: w.followUps.filter((f) => f.status === "waiting").length,
    completed: w.followUps.filter((f) => f.status === "completed").length,
    all: w.followUps.length,
  };

  return (
    <CMPage
      eyebrow="Case Manager · Follow-ups"
      title="Progress & Follow-ups"
      description="Nothing slips. Every promise to a family, tracked."
      loading={w.loading}
      error={w.error}
      actions={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> New follow-up</Button>}
    >
      <FilterBar>
        {(["today","overdue","week","waiting","completed","all"] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t} <span className="ml-1.5 rounded-full bg-muted/60 px-1.5 text-[10px]">{counts[t]}</span>
          </Button>
        ))}
      </FilterBar>
      <FilterBar>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={priority} onValueChange={setPriority}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any priority</SelectItem>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-white/60 p-8 text-center text-[13px] text-muted-foreground">
          <CalendarClock className="mx-auto mb-2 h-5 w-5" /> No follow-ups in this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 divide-y divide-border/60">
          {filtered.map((f) => {
            const t = f.due_at ? new Date(f.due_at).getTime() : null;
            const overdue = f.status === "open" && t !== null && t < now;
            return (
              <div key={f.id} className="flex items-start justify-between gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">{f.client_name ?? "—"}{f.category ? ` · ${f.category}` : ""}{f.due_at ? ` · due ${new Date(f.due_at).toLocaleString()}` : ""}</p>
                  {f.description && <p className="mt-1 text-[12px] text-foreground/80 line-clamp-2">{f.description}</p>}
                  {f.completion_note && <p className="mt-1 rounded-md bg-muted/40 p-2 text-[11.5px]"><span className="text-muted-foreground">Completed: </span>{f.completion_note}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Pill tone={statusTone(f.status)}>{f.status}</Pill>
                    <Pill tone={priorityTone(f.priority)}>{f.priority}</Pill>
                    {overdue && <Pill tone="alert">Overdue</Pill>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {f.status !== "completed" ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setCompleteId(f.id)}><CheckCircle2 className="mr-1 h-3 w-3" /> Complete</Button>
                      <Button size="sm" variant="ghost" onClick={() => setRescheduleId(f.id)}><RotateCcw className="mr-1 h-3 w-3" /> Reschedule</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={async () => { await w.updateFollowUp(f.id, { status: "open", completed_at: null }); toast.success("Reopened"); }}><Undo2 className="mr-1 h-3 w-3" /> Reopen</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormDialog
        open={addOpen} onOpenChange={setAddOpen}
        title="New follow-up" submitLabel="Create"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "title", label: "Title", required: true },
          { key: "description", label: "Details", type: "textarea" },
          { key: "category", label: "Category", type: "select", options: CATEGORIES, defaultValue: "family_check_in" },
          { key: "priority", label: "Priority", type: "select", options: PRIORITIES, defaultValue: "normal" },
          { key: "due_at", label: "Due", type: "datetime" },
        ]}
        onSubmit={async (v) => {
          const { family: _f, ...rest } = v;
          await w.createFollowUp({ ...rest, ...familyContext(pickFamily(v)), status: "open", due_at: dateTimeIsoOrNull(v.due_at) } as unknown as Parameters<typeof w.createFollowUp>[0]);
          toast.success("Follow-up created");
        }}
      />
      <FormDialog
        open={!!completeId} onOpenChange={(o) => !o && setCompleteId(null)}
        title="Complete follow-up" submitLabel="Mark complete"
        fields={[{ key: "completion_note", label: "Completion note", type: "textarea" }]}
        onSubmit={async (v) => { if (!completeId) return; await w.completeFollowUp(completeId, stringValue(v.completion_note) || undefined); toast.success("Completed"); }}
      />
      <FormDialog
        open={!!rescheduleId} onOpenChange={(o) => !o && setRescheduleId(null)}
        title="Reschedule follow-up" submitLabel="Reschedule"
        fields={[{ key: "due_at", label: "New due", type: "datetime", required: true }]}
        onSubmit={async (v) => { if (!rescheduleId) return; const iso = dateTimeIsoOrNull(v.due_at); if (!iso) return; await w.rescheduleFollowUp(rescheduleId, iso); toast.success("Rescheduled"); }}
      />
    </CMPage>
  );
}