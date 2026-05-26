import { useMemo, useState } from "react";
import {
  Search, Play, Upload, BookOpen, Download, ShieldCheck,
  Clock, Wallet, CheckCircle2, CreditCard, ShieldOff, XCircle, MapPin,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOSRole } from "@/contexts/OSRoleContext";
import { VobQueueCard } from "@/components/vob/VobQueueCard";
import { VobWorkspace } from "@/components/vob/VobWorkspace";
import { VobAiPanel } from "@/components/vob/VobAiPanel";
import { VOB_REVIEWS, STATUS_LABELS, type VobReview, type VobStatus } from "@/lib/vob/mockData";
import { useVobReviews } from "@/hooks/useVobReviews";

type KpiKey = "ready" | "finance_review" | "approved" | "payment_plan" | "no_oon" | "declined";

const KPI_DEFS: { key: KpiKey; label: string; icon: React.ElementType; tone: string; matches: VobStatus[] }[] = [
  { key: "ready",          label: "Awaiting Review",     icon: Clock,         tone: "bg-sky-50 text-sky-700 ring-sky-200/70",           matches: ["ready"] },
  { key: "finance_review", label: "Finance Review",      icon: Wallet,        tone: "bg-amber-50 text-amber-700 ring-amber-200/70",     matches: ["finance_review"] },
  { key: "approved",       label: "Approved",            icon: CheckCircle2,  tone: "bg-emerald-50 text-emerald-700 ring-emerald-200/70", matches: ["approved"] },
  { key: "payment_plan",   label: "Payment Plans",       icon: CreditCard,    tone: "bg-violet-50 text-violet-700 ring-violet-200/70",  matches: ["payment_plan"] },
  { key: "no_oon",         label: "No OON Benefits",     icon: ShieldOff,     tone: "bg-rose-50 text-rose-700 ring-rose-200/70",        matches: ["no_oon"] },
  { key: "declined",       label: "Flaked / Declined",   icon: XCircle,       tone: "bg-rose-50 text-rose-700 ring-rose-200/70",        matches: ["declined"] },
];

const STATUS_FILTERS: (VobStatus | "all")[] = ["all", "ready", "finance_review", "payment_plan", "approved", "needs_info", "no_oon", "declined"];

export default function OSVobDecisionCenter() {
  const { activeState } = useOSRole();
  const { reviews, loading, usingMock } = useVobReviews();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VobStatus | "all">("all");
  const [kpiFilter, setKpiFilter] = useState<KpiKey | null>(null);

  const stateScoped: VobReview[] = useMemo(() => {
    if (!activeState) return reviews;
    const matched = reviews.filter(r => r.state === activeState);
    // Fall back to all reviews when the active state has no cases (keeps the workspace useful).
    return matched.length > 0 ? matched : reviews;
  }, [activeState, reviews]);

  const queue = useMemo(() => {
    let list = stateScoped;
    if (kpiFilter) {
      const def = KPI_DEFS.find(k => k.key === kpiFilter)!;
      list = list.filter(r => def.matches.includes(r.status));
    } else if (statusFilter !== "all") {
      list = list.filter(r => r.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(r =>
      r.parentName.toLowerCase().includes(q) ||
      r.childName.toLowerCase().includes(q) ||
      r.payor.toLowerCase().includes(q) ||
      r.policyId.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q),
    );
    return list;
  }, [stateScoped, statusFilter, kpiFilter, query]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = queue.find(r => r.id === activeId) ?? queue[0];

  const kpiCounts = useMemo(() => {
    const counts: Record<KpiKey, number> = { ready: 0, finance_review: 0, approved: 0, payment_plan: 0, no_oon: 0, declined: 0 };
    for (const r of stateScoped) {
      for (const k of KPI_DEFS) if (k.matches.includes(r.status)) counts[k.key]++;
    }
    return counts;
  }, [stateScoped]);

  function exportDecisions() {
    const header = ["Parent", "Child", "State", "Payor", "INN/OON", "Deductible", "Coinsurance", "Hours", "Status", "Reviewer"];
    const rows = stateScoped.map(r => [
      r.parentName, r.childName, r.state, r.payor, r.innOon,
      r.deductible, `${r.coinsurance}%`, r.requestedHours, STATUS_LABELS[r.status], r.assignedReviewer,
    ]);
    const csv = [header, ...rows].map(row => row.map(c => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vob-decisions-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("VOB decisions exported");
  }

  return (
    <OSShell>
      {/* ============ HEADER ============ */}
      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(220_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[hsl(265_70%_70%/0.25)] blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_45%)]">
              <ShieldCheck className="mr-1 h-3 w-3" /> Decision Center
            </Badge>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">VOB Decision Center</h1>
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
              Review insurance benefits, operational feasibility, and payment plan requirements — one guided workspace for every new case.
            </p>
            {usingMock && !loading && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-medium text-amber-700 ring-1 ring-amber-200/70">
                Sample data — no intake leads in pipeline yet
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <Button size="sm" className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]" onClick={() => toast.success("Starting next review", { description: `${queue[0]?.parentName ?? "Queue empty"}` })}>
                <Play className="mr-1 h-3.5 w-3.5" /> Start Review
              </Button>
              <Button size="sm" variant="outline" className="border-white/70 bg-white/70 backdrop-blur" onClick={() => toast.info("Upload VOB", { description: "Drop a VOB PDF or paste payor reply." })}>
                <Upload className="mr-1 h-3.5 w-3.5" /> Upload VOB
              </Button>
              <Button size="sm" variant="outline" className="border-white/70 bg-white/70 backdrop-blur" onClick={() => toast.info("Insurance guide opening")}>
                <BookOpen className="mr-1 h-3.5 w-3.5" /> Insurance Guide
              </Button>
              <Button size="sm" variant="outline" className="border-white/70 bg-white/70 backdrop-blur" onClick={exportDecisions}>
                <Download className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11.5px] backdrop-blur">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients, payors, policies, states…"
                className="w-72 bg-transparent text-[11.5px] outline-none placeholder:text-muted-foreground/70"
              />
              {activeState && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[hsl(265_85%_96%)] px-2 py-0.5 text-[10px] font-semibold text-[hsl(265_70%_45%)]">
                  <MapPin className="h-2.5 w-2.5" /> {activeState}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ KPI ROW ============ */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {KPI_DEFS.map(k => {
          const active = kpiFilter === k.key;
          return (
            <button
              key={k.key}
              onClick={() => setKpiFilter(active ? null : k.key)}
              className={cn(
                "group rounded-2xl border border-border/50 bg-card/80 p-3.5 text-left backdrop-blur transition-all",
                "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_hsl(265_70%_55%/0.35)]",
                active && "ring-2 ring-[hsl(265_85%_65%/0.5)] border-transparent",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ring-1", k.tone)}>
                  <k.icon className="h-3 w-3" /> {k.label}
                </span>
              </div>
              <p className="mt-2 text-[26px] font-semibold tracking-tight tabular-nums">{kpiCounts[k.key]}</p>
              <p className="text-[10.5px] text-muted-foreground">Tap to filter queue</p>
            </button>
          );
        })}
      </section>

      {/* ============ MAIN GRID ============ */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        {/* LEFT: queue */}
        <aside className="rounded-2xl border border-border/50 bg-card/70 p-3 backdrop-blur">
          <div className="px-1 pb-2">
            <h2 className="text-[13px] font-semibold tracking-tight">Review queue</h2>
            <p className="text-[10.5px] text-muted-foreground">
              {queue.length} case{queue.length === 1 ? "" : "s"}
              {kpiFilter ? ` · ${KPI_DEFS.find(k => k.key === kpiFilter)?.label}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 px-1 pb-2">
            {STATUS_FILTERS.map(f => (
              <button key={f}
                onClick={() => { setStatusFilter(f); setKpiFilter(null); }}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10.5px] font-medium transition",
                  statusFilter === f && !kpiFilter
                    ? "bg-[hsl(265_85%_96%)] text-[hsl(265_70%_45%)]"
                    : "text-muted-foreground hover:bg-secondary/40",
                )}>
                {f === "all" ? "All" : STATUS_LABELS[f as VobStatus]}
              </button>
            ))}
          </div>
          <div className="space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-360px)]">
            {queue.map(r => (
              <VobQueueCard key={r.id} review={r} active={active?.id === r.id} onSelect={() => setActiveId(r.id)} />
            ))}
            {queue.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 px-3 py-6 text-center text-[12px] text-muted-foreground">
                No cases match your filters.
              </div>
            )}
          </div>
        </aside>

        {/* CENTER: workspace */}
        <div className="min-w-0">
          {active ? <VobWorkspace review={active} /> : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-10 text-center text-muted-foreground">
              Select a case from the queue to begin review.
            </div>
          )}
        </div>

        {/* RIGHT: AI + knowledge */}
        <aside className="space-y-4">
          {active && <VobAiPanel review={active} />}
        </aside>
      </section>
    </OSShell>
  );
}
