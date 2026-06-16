import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, ShieldCheck, AlertTriangle, Compass, UserCircle2,
  ClipboardCheck, FileText, Search, ArrowRight, CircleDot,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import {
  useTrainees, summarize, READINESS_TONE,
  type ReadinessStatus,
} from "@/lib/training/rbtReadiness";

const STATUS_ORDER: ReadinessStatus[] = [
  "Blocked",
  "Needs Coaching",
  "Awaiting BCBA Signoff",
  "Awaiting Lead RBT Signoff",
  "In Training",
  "Not Started",
  "Ready for Independent Assignment",
];

const STATE_CHIPS = ["All", "GA", "NC", "TN", "VA", "MD"] as const;

export default function OSRBTReadinessBoard() {
  const trainees = useTrainees();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<(typeof STATE_CHIPS)[number]>("All");
  const [status, setStatus] = useState<ReadinessStatus | "All">("All");

  const rows = useMemo(() => {
    return trainees.map((t) => ({ t, s: summarize(t) }))
      .filter(({ t }) => state === "All" || t.state === state)
      .filter(({ t, s }) => {
        if (status !== "All" && s.status !== status) return false;
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          (t.leadRbtTrainer ?? "").toLowerCase().includes(q) ||
          (t.bcba ?? "").toLowerCase().includes(q) ||
          s.path.label.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.s.status) - STATUS_ORDER.indexOf(b.s.status),
      );
  }, [trainees, query, state, status]);

  const counts = useMemo(() => {
    const acc: Record<ReadinessStatus, number> = {
      "Not Started": 0, "In Training": 0, "Needs Coaching": 0,
      "Awaiting Lead RBT Signoff": 0, "Awaiting BCBA Signoff": 0,
      "Ready for Independent Assignment": 0, Blocked: 0,
    };
    trainees.forEach((t) => { acc[summarize(t).status]++; });
    return acc;
  }, [trainees]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-24 pt-5 md:px-6 md:pt-8">
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt/training-academy" className="hover:text-foreground transition-colors">RBT Training Academy</Link>
          <ChevronRight className="size-3" />
          <span>Readiness Board</span>
        </div>

        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Trainer & Scheduling view</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">RBT Readiness Board</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Scheduling cannot treat an RBT as independently ready until every required signoff is complete —
            Lead RBT Trainer, BCBA, Training Admin, and Documentation Reviewer where needed.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(status === s ? "All" : s)}
                className={cn(
                  "rounded-xl border bg-card p-3 text-left transition hover:bg-muted",
                  status === s ? "border-primary/60 ring-2 ring-primary/20" : "border-border/70",
                )}
              >
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s}</p>
                <p className="mt-1 text-lg font-semibold">{counts[s]}</p>
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trainee, trainer, BCBA, or path…"
              className="w-full rounded-xl border border-border/70 bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1">
            {STATE_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setState(c)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                  state === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
              No trainees match the current filters.
            </div>
          ) : (
            rows.map(({ t, s }) => (
              <article
                key={t.id}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_18px_-10px_oklch(0.2_0.02_260/0.08)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold tracking-tight">{t.name}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t.state}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                        {s.path.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Started {new Date(t.startDate).toLocaleDateString()} · {s.currentPhaseTitle}
                    </p>
                  </div>
                  <StatusPill status={s.status} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Field icon={CircleDot} label="Current module" value={s.currentModuleTitle} />
                  <Field icon={Compass}   label="Lead RBT Trainer" value={t.leadRbtTrainer ?? "Unassigned"} muted={!t.leadRbtTrainer} />
                  <Field icon={UserCircle2} label="BCBA Supervisor" value={t.bcba ?? "Unassigned"} muted={!t.bcba} />
                  <Field icon={ClipboardCheck} label="Training Admin" value={t.trainingAdmin ?? "Unassigned"} muted={!t.trainingAdmin} />
                  <Field icon={FileText} label="Documentation Reviewer" value={t.documentationReviewer ?? "Unassigned"} muted={!t.documentationReviewer} />
                  <Field icon={ShieldCheck} label="Required signoffs" value={`${s.signedCount} / ${s.requiredCount} signed`} />
                </div>

                {t.flags?.blocked && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span><span className="font-semibold">Blocked:</span> {t.flags.blocked.reason}</span>
                  </div>
                )}

                {s.missing.length > 0 && (
                  <div className="mt-4 rounded-xl border border-border/70 bg-secondary/40 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Missing requirements ({s.missing.length})
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {s.missing.map((m) => (
                        <li key={m} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {s.independentReady
                      ? "Cleared by all required roles — Scheduling may assign independently."
                      : "Scheduling: do not treat as independently ready until all required signoffs are complete."}
                  </p>
                  <Link
                    to="/rbt/training-academy"
                    className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    Open path <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </OSShell>
  );
}

function Field({
  icon: Icon, label, value, muted,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className={cn("mt-1 text-sm font-medium", muted ? "text-muted-foreground italic" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: ReadinessStatus }) {
  const tone = READINESS_TONE[status];
  const cls =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
      : tone === "warn"
        ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
        : tone === "bad"
          ? "bg-destructive/10 text-destructive border-destructive/30"
          : "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cls)}>
      <ShieldCheck className="size-3.5" />
      {status}
    </span>
  );
}