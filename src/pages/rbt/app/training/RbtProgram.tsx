import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Clock, AlertTriangle, LifeBuoy, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRbtIdentity } from "../useRbtIdentity";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProgram } from "./useProgram";
import { STEP_META, type StepRow } from "./types";
import { ProgramSetupJourney } from "./ProgramSetupJourney";
import { useExperienceLab } from "../useExperienceLab";

export default function RbtProgram() {
  const { employeeId, writableEmployeeId, isPreviewing, loading: idLoading } = useRbtIdentity();
  const lab = useExperienceLab();
  const { pathway, rows, remediation, stats, loading, reload } = useProgram(employeeId);
  // Track selection by step id (not row reference). Row references can drift
  // between renders / memo re-computations while step ids are stable, so
  // Up Next / Blocked / Roadmap all resolve to the intended step even if
  // `stats.current` and `rows` are computed in different memos.
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const selected = selectedStepId
    ? rows.find((r) => r.step.id === selectedStepId) ?? null
    : null;
  const openStep = (row: StepRow | null) => setSelectedStepId(row?.step.id ?? null);
  const [retrying, setRetrying] = useState(false);

  if (loading || idLoading) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;

  if (!pathway) {
    return (
      <ProgramSetupJourney
        employeeLinked={Boolean(employeeId)}
        retrying={retrying}
        onRetry={async () => {
          setRetrying(true);
          try { await reload(); } finally { setRetrying(false); }
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your program</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{pathway.name}</p>
        {pathway.description && <p className="mt-1 text-sm text-muted-foreground">{pathway.description}</p>}
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">{stats.complete}</span>
          <span className="text-sm text-muted-foreground">of {stats.total} stages complete</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${stats.percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Expected timeline: ~{stats.totalDays} day{stats.totalDays === 1 ? "" : "s"} of focused work.
        </p>
      </section>

      {stats.current && (
        <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5">
          <p className="text-xs uppercase tracking-widest text-primary">Up next</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{stats.current.step.title}</p>
          {stats.current.step.description && (
            <p className="mt-1 text-sm text-muted-foreground">{stats.current.step.description}</p>
          )}
          <Button
            className="mt-3"
            data-testid="rbt-upnext-open"
            data-step-id={stats.current.step.id}
            onClick={() => openStep(stats.current)}
          >
            Open <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </section>
      )}

      {stats.blocked && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-start gap-3">
          <LifeBuoy className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Support needed on {stats.blocked.step.title}</p>
            <p className="text-xs text-muted-foreground">A trainer will follow up. You can also add a note.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-testid="rbt-blocked-open"
            data-step-id={stats.blocked.step.id}
            onClick={() => openStep(stats.blocked)}
          >Open</Button>
        </section>
      )}

      {remediation && remediation.length > 0 && (
        <section className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Extra practice assigned</p>
          <ul className="space-y-2">
            {remediation.map((r) => (
              <li key={r.id} className="text-sm flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  {r.reason && <p className="text-xs text-muted-foreground truncate">{r.reason}</p>}
                </div>
                <span className="text-xs text-muted-foreground capitalize">{r.status.replace("_"," ")}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Extra practice doesn't reset your program.</p>
        </section>
      )}

      <section>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1">Roadmap</p>
        <ol className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
          {rows.map((r) => {
            const status = r.progress.status;
            const Icon = status === "complete" ? CheckCircle2
              : status === "blocked" || status === "needs_support" ? AlertTriangle
              : status !== "not_started" ? Clock : Circle;
            return (
              <li key={r.step.id}>
                <button
                  data-testid="rbt-roadmap-row"
                  data-step-id={r.step.id}
                  onClick={() => openStep(r)}
                  className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/50 transition"
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      status === "complete" ? "text-primary"
                      : status === "blocked" ? "text-destructive"
                      : status === "needs_support" ? "text-amber-600"
                      : status !== "not_started" ? "text-blue-600"
                      : "text-muted-foreground"}`}
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.step.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      <span className={STEP_META[status].tone}>{STEP_META[status].label}</span>
                      {r.step.delivery_mode && <> · {r.step.delivery_mode.replace("_"," ")}</>}
                      {r.step.estimated_days && <> · ~{r.step.estimated_days}d</>}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <Link
        to="/rbt/app/passport"
        className="block text-center text-sm text-primary underline underline-offset-4"
      >
        View your Skill Passport →
      </Link>

      {selected && (
        <StepSheet
          key={selected.step.id}
          row={selected}
          onClose={() => setSelectedStepId(null)}
          onSaved={() => { setSelectedStepId(null); void reload(); }}
          canWrite={Boolean(writableEmployeeId) && !isPreviewing && !lab.active}
        />
      )}
    </div>
  );
}

function StepSheet({ row, onClose, onSaved, canWrite }:
  { row: StepRow; onClose: () => void; onSaved: () => void; canWrite: boolean }) {
  const [note, setNote] = useState(row.progress.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function update(status: "in_progress" | "submitted" | "needs_support") {
    if (!canWrite) return;
    setSaving(true);
    const { error } = await supabase.from("rbt_pathway_progress" as any)
      .update({ status, notes: note.trim() || null })
      .eq("id", row.progress.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(status === "needs_support" ? "A trainer will reach out." : "Updated");
    onSaved();
  }

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>{row.step.title}</SheetTitle></SheetHeader>
        <div className="mt-3 space-y-4">
          {row.step.description && <p className="text-sm text-muted-foreground">{row.step.description}</p>}
          <div className="flex flex-wrap gap-1.5">
            {(row.step.capabilities ?? []).map((c) => (
              <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground capitalize">
                {c.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Your notes</p>
            <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reflection, questions, or blockers." />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => update("in_progress")} disabled={saving || !canWrite}>Working on it</Button>
            <Button onClick={() => update("submitted")} disabled={saving || !canWrite}>Mark ready</Button>
            <Button variant="outline" onClick={() => update("needs_support")} disabled={saving || !canWrite}>Need help</Button>
          </div>
          {!canWrite && (
            <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
              Preview mode — you can review your program but changes are disabled.
            </p>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Only your trainer or BCBA can mark a stage complete.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}