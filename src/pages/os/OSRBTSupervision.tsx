import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, CalendarClock, CheckCircle2, GraduationCap } from "lucide-react";
import { OSShell } from "./OSShell";
import { useRbtWorkflow } from "@/hooks/useRbtWorkflow";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function OSRBTSupervision() {
  const wf = useRbtWorkflow();
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = useMemo(() => wf.supervision.filter((s) => s.supervision_date >= today), [wf.supervision, today]);
  const recent = useMemo(() => wf.supervision.filter((s) => s.supervision_date < today).slice(0, 12), [wf.supervision, today]);
  const pendingAck = useMemo(() => wf.supervision.filter((s) => s.signed_by_bcba_at && !s.acknowledged_by_rbt_at), [wf.supervision]);
  const competencies = useMemo(() => {
    const m = new Map<string, number>();
    wf.supervision.forEach((s) => { if (s.competency_area) m.set(s.competency_area, (m.get(s.competency_area) ?? 0) + 1); });
    return Array.from(m.entries()).sort(([, a], [, b]) => b - a);
  }, [wf.supervision]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Supervision</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Upcoming supervision, BCBA feedback, and competency signoffs. Acknowledge feedback so your BCBA knows you've reviewed it.
            </p>
          </div>
        </header>

        {wf.loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading supervision…</div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <section>
                <h2 className="text-[13px] font-medium tracking-tight mb-2">Awaiting your acknowledgement ({pendingAck.length})</h2>
                {pendingAck.length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground text-center">Nothing waiting.</div>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
                    {pendingAck.map((s) => (
                      <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium">{s.supervision_type || "Supervision"} · {s.supervision_date}</p>
                          {s.competency_area && <p className="text-[11px] text-muted-foreground mt-0.5">Competency: {s.competency_area}</p>}
                          {s.feedback && <p className="text-[12.5px] mt-2 whitespace-pre-line">{s.feedback}</p>}
                        </div>
                        <button onClick={async () => { await wf.acknowledgeSupervision(s.id); toast({ title: "Acknowledged" }); }}
                          className="h-9 px-3 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 shrink-0">
                          Acknowledge
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-[13px] font-medium tracking-tight mb-2">Upcoming</h2>
                {upcoming.length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground text-center">No supervision scheduled.</div>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
                    {upcoming.map((s) => (
                      <div key={s.id} className="p-4 flex items-start gap-3">
                        <CalendarClock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium">{s.supervision_type || "Supervision"} · {s.supervision_date}</p>
                          {s.notes && <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{s.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-[13px] font-medium tracking-tight mb-2">Recent feedback</h2>
                {recent.length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground text-center">No recent supervision.</div>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
                    {recent.map((s) => (
                      <div key={s.id} className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-medium">{s.supervision_type || "Supervision"} · {s.supervision_date}</p>
                          {s.acknowledged_by_rbt_at && (
                            <span className="text-[10.5px] inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5">
                              <CheckCircle2 className="h-3 w-3" />Acknowledged
                            </span>
                          )}
                        </div>
                        {s.competency_area && <p className="text-[11px] text-muted-foreground mt-0.5">Competency: {s.competency_area}</p>}
                        {s.feedback && <p className="text-[12.5px] mt-2 whitespace-pre-line line-clamp-4">{s.feedback}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Competency areas</p>
                {competencies.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No competency data yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {competencies.slice(0, 8).map(([area, count]) => (
                      <div key={area} className="flex items-center justify-between text-[12.5px]">
                        <span>{area}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Grow with training</p>
                <p className="text-[12px] text-muted-foreground">Turn supervision feedback into training progress.</p>
                <Link to="/rbt/training-academy" className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">
                  <GraduationCap className="h-3.5 w-3.5" />Open Training Academy
                </Link>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Need supervision sooner?</p>
                <Link to="/rbt/help?category=bcba" className={cn("mt-1 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90")}>
                  Request supervision
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </OSShell>
  );
}
