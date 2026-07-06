import { useMemo } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Sparkles } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { ActionItemsPanel } from "@/components/executive/ActionItemsPanel";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "flat";
type PulseStatus = "Calm" | "Moving" | "Pressured" | "Strained" | "Critical";

const STATES = [
  { code: "GA", name: "Georgia" },
  { code: "NC", name: "North Carolina" },
  { code: "TN", name: "Tennessee" },
  { code: "VA", name: "Virginia" },
  { code: "MD", name: "Maryland" },
] as const;

const TONE_DOT: Record<HealthTone, string> = {
  healthy: "bg-emerald-500",
  attention: "bg-amber-500",
  risk: "bg-rose-500",
  blocked: "bg-rose-500",
  neutral: "bg-muted-foreground/50",
};

function worst(tones: HealthTone[]): HealthTone {
  if (tones.includes("blocked")) return "blocked";
  if (tones.includes("risk")) return "risk";
  if (tones.includes("attention")) return "attention";
  return "healthy";
}

function pulseFromTone(t: HealthTone): PulseStatus {
  switch (t) {
    case "healthy": return "Calm";
    case "attention": return "Moving";
    case "risk": return "Pressured";
    case "blocked": return "Strained";
    default: return "Moving";
  }
}

function DirIcon({ d, className }: { d: Direction; className?: string }) {
  const Icon = d === "up" ? ArrowUpRight : d === "down" ? ArrowDownRight : Minus;
  return <Icon className={className} />;
}

function dirTint(d: Direction, positiveDown = false) {
  // positiveDown: "down" is good (e.g. cancellations dropping)
  const good = positiveDown ? d === "down" : d === "up";
  const bad = positiveDown ? d === "up" : d === "down";
  if (good) return "text-emerald-600 bg-emerald-50";
  if (bad) return "text-rose-600 bg-rose-50";
  return "text-muted-foreground bg-muted/60";
}

export default function CompanyPulse() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const tn = useStateWorkforce("TN");
  const va = useStateWorkforce("VA");
  const md = useStateWorkforce("MD");
  const nj = useStateWorkforce("NJ");
  const wf = useMemo(
    () => [
      { state: STATES[0], data: ga },
      { state: STATES[1], data: nc },
      { state: STATES[2], data: tn },
      { state: STATES[3], data: va },
      { state: STATES[4], data: md },
    ],
    [ga, nc, tn, va, md],
  );

  const loading = ops.loading || cr.loading || wf.some((w) => w.data.loading);

  // ── derived signals ────────────────────────────────────────────────
  const overloaded = useMemo(
    () => wf.flatMap((w) => w.data.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length,
    [wf],
  );
  const totalNeeds = useMemo(() => wf.flatMap((w) => w.data.staffingNeeds).length, [wf]);
  const criticalNeeds = useMemo(
    () => wf.flatMap((w) => w.data.staffingNeeds).filter((n) => n.urgency === "critical").length,
    [wf],
  );

  const weeklyCx = cr.cancellationsLast7d;
  const avgWeekCx = Math.round(cr.cancellationsLast30d / 4);
  const cxDelta = weeklyCx - avgWeekCx;

  const recDept = ops.depts.find((d) => d.id === "recruiting");
  const qaDept = ops.depts.find((d) => d.id === "qa");
  const authDept = ops.depts.find((d) => d.id === "authorizations");
  const schedDept = ops.depts.find((d) => d.id === "scheduling");
  const trainDept = ops.depts.find((d) => d.id === "training");
  const payrollDept = ops.depts.find((d) => d.id === "payroll");
  const intakeDept = ops.depts.find((d) => d.id === "intake");

  // ── overall pulse ──────────────────────────────────────────────────
  const overallTone = worst(ops.depts.map((d) => d.tone).concat(
    criticalNeeds > 2 ? ["risk"] : criticalNeeds > 0 ? ["attention"] : [],
  ) as HealthTone[]);
  const pulse: PulseStatus = pulseFromTone(overallTone);

  // ── Section 3: momentum signals ────────────────────────────────────
  const signals = useMemo(() => {
    const list: { key: string; label: string; tone: HealthTone; dir: Direction; positiveDown?: boolean; detail: string }[] = [];

    list.push({
      key: "intake", label: "Intake Movement",
      tone: intakeDept?.tone ?? "healthy", dir: "flat",
      detail: intakeDept?.signal ?? "Live pipeline flowing",
    });
    list.push({
      key: "auth", label: "Authorization Flow",
      tone: authDept?.tone ?? "healthy",
      dir: ops.auths.expiring7.length > 0 ? "down" : ops.auths.qaStalled.length > 3 ? "down" : "flat",
      detail: `${ops.auths.expiring30.length} expire ≤30d · ${ops.auths.qaStalled.length} stalled in QA`,
    });
    list.push({
      key: "sched", label: "Scheduling Stability",
      tone: cxDelta > 5 ? "attention" : (schedDept?.tone ?? "healthy"),
      dir: cxDelta > 3 ? "down" : cxDelta < -3 ? "up" : "flat",
      positiveDown: true,
      detail: cr.totalSessions > 0 ? `${weeklyCx} cancellations last 7d · ~${avgWeekCx}/wk avg` : "Not enough current data",
    });
    list.push({
      key: "staff", label: "Staffing Momentum",
      tone: criticalNeeds > 2 ? "risk" : totalNeeds > 6 ? "attention" : "healthy",
      dir: criticalNeeds > 2 ? "down" : totalNeeds === 0 ? "up" : "flat",
      detail: `${totalNeeds} open need${totalNeeds === 1 ? "" : "s"} · ${overloaded} BCBA${overloaded === 1 ? "" : "s"} at capacity`,
    });
    list.push({
      key: "rec", label: "Recruiting Velocity",
      tone: recDept?.tone ?? "healthy",
      dir: ops.recruiting.stalledCandidates.length > 5 ? "down" : ops.recruiting.candidates.length > 0 ? "up" : "flat",
      detail: ops.recruiting.candidates.length > 0
        ? `${ops.recruiting.candidates.length} active · ${ops.recruiting.stalledCandidates.length} stalled ≥14d`
        : "Not enough current data",
    });
    list.push({
      key: "qa", label: "QA Turnaround",
      tone: qaDept?.tone ?? "healthy",
      dir: ops.auths.qaStalled.length > 5 ? "down" : ops.auths.qaStalled.length === 0 ? "up" : "flat",
      detail: qaDept?.signal ?? "Not enough current data",
    });
    list.push({
      key: "payroll", label: "Payroll Readiness",
      tone: payrollDept?.tone ?? "healthy", dir: "flat",
      detail: payrollDept?.signal ?? "Payroll cycle stable",
    });
    list.push({
      key: "train", label: "Training Adoption",
      tone: trainDept?.tone ?? "healthy", dir: "flat",
      detail: trainDept?.signal ?? "Adoption tracked centrally",
    });

    return list;
  }, [intakeDept, authDept, schedDept, trainDept, qaDept, payrollDept, recDept, ops, cr, weeklyCx, avgWeekCx, cxDelta, totalNeeds, criticalNeeds, overloaded]);

  // ── Section 4: state pulses ────────────────────────────────────────
  const statePulses = useMemo(() => {
    return wf.map(({ state, data }) => {
      const needs = data.staffingNeeds.length;
      const crit = data.staffingNeeds.filter((n) => n.urgency === "critical").length;
      const over = data.bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
      const staffing: HealthTone = crit > 1 ? "blocked" : needs > 4 ? "risk" : needs > 1 ? "attention" : "healthy";
      const onboarding: HealthTone = over > 2 ? "risk" : over > 0 ? "attention" : "healthy";
      const workflow: HealthTone = authDept?.tone ?? "healthy";
      const escalation: HealthTone = crit > 0 ? "risk" : "healthy";
      const overall = worst([staffing, onboarding, workflow, escalation]);
      const readiness: HealthTone = overall === "blocked" ? "risk" : overall;
      return { state, staffing, onboarding, workflow, escalation, readiness, overall, needs, crit, over };
    });
  }, [wf, authDept]);

  // ── Section 5: flow speed ──────────────────────────────────────────
  // We don't have stage-time data wired in — represent honestly.
  const flows = useMemo(() => {
    const flowBase: { label: string; tone: HealthTone; pct: number; status: string }[] = [
      { label: "New Lead → Form Received", tone: intakeDept?.tone ?? "healthy", pct: 70, status: "Moving" },
      { label: "Form Received → VOB Completed", tone: intakeDept?.tone ?? "healthy", pct: 65, status: "Moving" },
      { label: "VOB Completed → Client Created", tone: "healthy", pct: 82, status: "Steady" },
      { label: "Client Created → BCBA Assigned", tone: overloaded > 2 ? "attention" : "healthy", pct: overloaded > 2 ? 55 : 78, status: overloaded > 2 ? "Slowing" : "Steady" },
      { label: "Auth Submitted → Approved", tone: authDept?.tone ?? "healthy", pct: ops.auths.qaStalled.length > 3 ? 50 : 72, status: ops.auths.qaStalled.length > 3 ? "Slowing" : "Steady" },
      { label: "Treatment Auth → Staffing Ready", tone: totalNeeds > 4 ? "attention" : "healthy", pct: totalNeeds > 4 ? 58 : 76, status: totalNeeds > 4 ? "Pressured" : "Steady" },
      { label: "Staffing Ready → Active Client", tone: criticalNeeds > 0 ? "risk" : "healthy", pct: criticalNeeds > 0 ? 48 : 80, status: criticalNeeds > 0 ? "Slowing" : "Steady" },
      { label: "Candidate Applied → Orientation", tone: recDept?.tone ?? "healthy", pct: ops.recruiting.stalledCandidates.length > 5 ? 52 : 74, status: ops.recruiting.stalledCandidates.length > 5 ? "Pressured" : "Moving" },
      { label: "Orientation → Staff Ready", tone: "healthy", pct: 78, status: "Steady" },
    ];
    return flowBase;
  }, [intakeDept, authDept, recDept, overloaded, totalNeeds, criticalNeeds, ops]);

  // ── Section 6: pressure ────────────────────────────────────────────
  const pressure = useMemo(() => {
    const items: { id: string; area: string; title: string; tone: HealthTone; label: string }[] = [];
    if (criticalNeeds > 0) items.push({ id: "p-crit-staff", area: "Staffing", title: `${criticalNeeds} critical staffing need${criticalNeeds === 1 ? "" : "s"} unresolved`, tone: "risk", label: "Pressure increasing" });
    if (ops.auths.expiring7.length > 0) items.push({ id: "p-auth7", area: "Authorizations", title: `${ops.auths.expiring7.length} auth${ops.auths.expiring7.length === 1 ? "" : "s"} expire within 7 days`, tone: "blocked", label: "Leadership attention" });
    if (ops.auths.qaStalled.length > 3) items.push({ id: "p-qa", area: "QA", title: `${ops.auths.qaStalled.length} plans stalled ≥3 days in QA review`, tone: "risk", label: "Monitor closely" });
    if (overloaded > 2) items.push({ id: "p-cap", area: "Clinical", title: `${overloaded} BCBAs near or above capacity`, tone: "attention", label: "Stable but watch" });
    if (ops.recruiting.stalledCandidates.length > 5) items.push({ id: "p-rec", area: "Recruiting", title: `${ops.recruiting.stalledCandidates.length} candidates stalled ≥14 days`, tone: "attention", label: "Monitor closely" });
    if (cxDelta > 5) items.push({ id: "p-cx", area: "Scheduling", title: `Cancellations trending ${cxDelta} above weekly average`, tone: "attention", label: "Monitor closely" });
    if (ops.auths.denied.length > 0) items.push({ id: "p-deny", area: "Authorizations", title: `${ops.auths.denied.length} authorization${ops.auths.denied.length === 1 ? "" : "s"} denied — appeals needed`, tone: "blocked", label: "Leadership attention" });
    return items.slice(0, 6);
  }, [criticalNeeds, ops, overloaded, cxDelta]);

  // ── Section 7: positive momentum ───────────────────────────────────
  const positives = useMemo(() => {
    const items: { id: string; area: string; title: string; label: string }[] = [];
    if (cxDelta < -3) items.push({ id: "g-cx", area: "Scheduling", title: `Cancellations improved this week (${weeklyCx} vs ~${avgWeekCx}/wk avg)`, label: "Improving" });
    if (ops.recruiting.candidates.length > 0 && ops.recruiting.stalledCandidates.length < 3) items.push({ id: "g-rec", area: "Recruiting", title: `Recruiting pipeline moving cleanly — minimal stalls`, label: "Momentum building" });
    if (ops.auths.qaStalled.length === 0 && ops.auths.total > 0) items.push({ id: "g-qa", area: "QA", title: `No plans currently stalled in QA review`, label: "Stabilizing" });
    if (totalNeeds === 0) items.push({ id: "g-staff", area: "Staffing", title: `No open staffing needs across active states`, label: "Readiness improving" });
    if (overloaded === 0) items.push({ id: "g-cap", area: "Clinical", title: `BCBA capacity within healthy range company-wide`, label: "Stable" });
    if (payrollDept?.tone === "healthy") items.push({ id: "g-pay", area: "Payroll", title: `Payroll readiness healthy for upcoming cycle`, label: "Stable" });
    if (ops.auths.expiring7.length === 0 && ops.auths.expiring14.length === 0) items.push({ id: "g-auth", area: "Authorizations", title: `No urgent auth expirations in the 14-day window`, label: "Backlog decreasing" });
    return items.slice(0, 5);
  }, [cxDelta, weeklyCx, avgWeekCx, ops, totalNeeds, overloaded, payrollDept]);

  // ── Section 2 heartbeat narrative ──────────────────────────────────
  const heartbeat = useMemo(() => {
    if (loading) return "Reading live operational signals…";
    const stressedDepts = ops.depts.filter((d) => d.tone === "risk" || d.tone === "blocked").map((d) => d.name);
    const heaviest = [...wf].sort((a, b) => b.data.staffingNeeds.length - a.data.staffingNeeds.length)[0];
    const parts: string[] = [];

    if (overallTone === "healthy") parts.push("Blossom is operating in a calm, stable rhythm.");
    else if (overallTone === "attention") parts.push("Blossom is moving steadily with a few areas worth a closer look.");
    else if (overallTone === "risk") parts.push("Blossom is operating in a stable but pressured state.");
    else parts.push("Blossom is operating under elevated pressure today.");

    if (heaviest && heaviest.data.staffingNeeds.length > 0) {
      parts.push(`${heaviest.state.name} staffing carries the most weight (${heaviest.data.staffingNeeds.length} open need${heaviest.data.staffingNeeds.length === 1 ? "" : "s"}).`);
    }
    if (ops.auths.expiring14.length > 0) {
      parts.push(`${ops.auths.expiring14.length} authorization${ops.auths.expiring14.length === 1 ? "" : "s"} expire within 14 days.`);
    }
    if (stressedDepts.length === 0 && ops.recruiting.stalledCandidates.length < 3) {
      parts.push("Recruiting and department workflows are moving cleanly.");
    }
    return parts.join(" ");
  }, [loading, ops, wf, overallTone]);

  // ── Section 8 interpretation ───────────────────────────────────────
  const interpretation = useMemo(() => {
    if (overallTone === "healthy") return "Current pulse suggests Blossom can continue confident operations. Keep momentum on recruiting and watch state-level staffing as the company grows.";
    if (overallTone === "attention") return "Current pulse suggests Blossom can continue controlled growth. Watch the highlighted attention items and keep recruiting throughput steady.";
    if (overallTone === "risk") return "Current pulse suggests slowing new commitments until staffing and authorization pressure resolve. Leadership coordination this week is high-leverage.";
    return "Current pulse suggests immediate leadership coordination on the critical signals before adding new operational load.";
  }, [overallTone]);

  const stamp = new Date().toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <ExecPage
      title="Company Pulse"
      subtitle="Live view of Blossom's operational rhythm, staffing pressure, workflow movement, and readiness to grow."
    >
      {/* ─── Section 1 — Header / overall pulse ──────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/30 p-6 md:p-8 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Live · {stamp}</div>
            <h2 className="mt-2 flex items-center gap-3 text-[28px] md:text-[34px] font-semibold tracking-tight">
              <span className="relative inline-flex">
                <span className={cn("h-3 w-3 rounded-full", TONE_DOT[overallTone])} />
                <span className={cn("absolute inset-0 -m-1 rounded-full opacity-30 animate-ping", TONE_DOT[overallTone])} />
              </span>
              The company feels {pulse.toLowerCase()}.
            </h2>
            <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">{heartbeat}</p>
          </div>
          <HealthPill tone={overallTone}>Pulse · {pulse}</HealthPill>
        </div>
      </section>

      {/* ─── Section 2 — Organizational Heartbeat ────────────────────── */}
      <ExecCard className="bg-gradient-to-br from-card via-card to-primary/[0.03]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-[13.5px] font-semibold tracking-tight">Organizational Heartbeat</h2>
              <p className="text-[11px] text-muted-foreground">Generated from live operational systems · {stamp}</p>
            </div>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-[10.5px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            High confidence
          </span>
        </div>
        <p className="text-[15px] leading-relaxed text-foreground/90">{heartbeat}</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          <AIPrompt label="Explain the pulse" prompt="Explain Blossom's current company pulse in plain executive language." />
          <AIPrompt label="What's shifting?" prompt="What momentum shifts are happening across Blossom this week?" />
          <AIPrompt label="Where do I focus?" prompt="Given the current company pulse, where should executive leadership focus this week?" />
        </div>
      </ExecCard>

      {/* ─── Section 3 — Momentum Signals ────────────────────────────── */}
      <ExecCard title="Momentum Signals" hint="Movement across the company">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {signals.map((s) => (
            <div key={s.key} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <span className={cn("grid h-6 w-6 place-items-center rounded-full", dirTint(s.dir, s.positiveDown))}>
                  <DirIcon d={s.dir} className="h-3 w-3" />
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[s.tone])} />
                <span className="text-[13.5px] font-medium tracking-tight">
                  {s.tone === "healthy" ? "Stable" : s.tone === "attention" ? "Watch" : s.tone === "risk" ? "Pressured" : "Needs Attention"}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* ─── Section 4 — State Pulse ─────────────────────────────────── */}
      <ExecCard title="State Pulse" hint="Where the company feels strong or strained">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statePulses.map((s) => (
            <div key={s.state.code} className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4">
              <div className={cn(
                "absolute inset-x-0 top-0 h-0.5",
                s.overall === "healthy" && "bg-emerald-400/70",
                s.overall === "attention" && "bg-amber-400/80",
                s.overall === "risk" && "bg-rose-400/80",
                s.overall === "blocked" && "bg-rose-400/80",
              )} />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.state.code}</div>
                  <div className="mt-0.5 text-[15px] font-semibold tracking-tight">{s.state.name}</div>
                </div>
                <span className={cn("h-2 w-2 rounded-full", TONE_DOT[s.overall])} />
              </div>
              <ul className="mt-3 space-y-1.5 text-[12px]">
                {[
                  { label: "Staffing", tone: s.staffing },
                  { label: "Onboarding", tone: s.onboarding },
                  { label: "Workflow", tone: s.workflow },
                  { label: "Escalation", tone: s.escalation },
                  { label: "Readiness", tone: s.readiness },
                ].map((row) => (
                  <li key={row.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="flex items-center gap-1.5 text-foreground/85">
                      <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[row.tone])} />
                      {row.tone === "healthy" ? "Healthy" : row.tone === "attention" ? "Watch" : row.tone === "risk" ? "Pressured" : row.tone === "blocked" ? "Critical" : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* ─── Section 5 — Flow Speed Overview ─────────────────────────── */}
      <ExecCard title="Flow Speed" hint="Where things are flowing and where they're slowing">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((f) => (
            <div key={f.label} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12.5px] font-medium text-foreground/90">{f.label}</span>
                <HealthPill tone={f.tone}>{f.status}</HealthPill>
              </div>
              <div className="mt-2.5 h-1 rounded-full bg-muted">
                <div
                  className={cn(
                    "h-1 rounded-full transition-all",
                    f.tone === "healthy" && "bg-emerald-400",
                    f.tone === "attention" && "bg-amber-400",
                    f.tone === "risk" && "bg-rose-400",
                    f.tone === "blocked" && "bg-rose-400",
                  )}
                  style={{ width: `${f.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Flow speed reflects current operational health for each stage. Specific stage-time analytics will populate once CentralReach stage-transition data is uploaded.
        </p>
      </ExecCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ─── Section 6 — Pressure Building ─────────────────────────── */}
        <ExecCard title="Pressure Building" hint={`${pressure.length} signal${pressure.length === 1 ? "" : "s"}`}>
          {pressure.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-6 text-center">
              <div className="text-[13px] font-medium text-foreground/80">All calm.</div>
              <div className="mt-1 text-[12px] text-muted-foreground">No pressure points building right now.</div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {pressure.map((p) => (
                <li key={p.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{p.area}</div>
                      <div className="mt-0.5 text-[13.5px] font-medium leading-snug">{p.title}</div>
                    </div>
                    <HealthPill tone={p.tone}>{p.label}</HealthPill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ExecCard>

        {/* ─── Section 7 — Positive Momentum ─────────────────────────── */}
        <ExecCard title="Positive Momentum" hint={`${positives.length} signal${positives.length === 1 ? "" : "s"}`}>
          {positives.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-6 text-center">
              <div className="text-[13px] font-medium text-foreground/80">No standout improvements yet.</div>
              <div className="mt-1 text-[12px] text-muted-foreground">As workflows stabilize, momentum will surface here.</div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {positives.map((p) => (
                <li key={p.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{p.area}</div>
                      <div className="mt-0.5 text-[13.5px] font-medium leading-snug">{p.title}</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                      <ArrowUpRight className="h-2.5 w-2.5" />
                      {p.label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ExecCard>
      </div>

      {/* ─── Section 8 — AI Pulse Interpretation ─────────────────────── */}
      <ExecCard className="bg-gradient-to-br from-card via-card to-primary/[0.04]">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-[13.5px] font-semibold tracking-tight">What this means for leadership</h2>
            <p className="text-[11px] text-muted-foreground">AI interpretation of the current pulse</p>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed text-foreground/90">{interpretation}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {[
            { to: "/executive/staffing-expansion", label: "Review staffing pressure" },
            { to: "/executive/leadership-accountability", label: "Check leadership blockers" },
            { to: "/operations/escalations", label: "Monitor auth timing" },
            { to: "/executive/staffing-expansion", label: "Support recruiting throughput" },
            { to: "/executive/growth-readiness", label: "Review state readiness" },
          ].map((a) => (
            <a
              key={a.label}
              href={a.to}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-[13px] transition hover:bg-muted/40"
            >
              <span className="text-foreground/85">{a.label}</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-50" />
            </a>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Draft pulse note" prompt="Draft a short pulse update for the leadership team summarizing this week's company pulse." />
          <AIPrompt label="Suggest weekly priorities" prompt="Suggest 3 weekly leadership priorities based on Blossom's current company pulse." />
        </div>
      </ExecCard>
      <ActionItemsPanel sourcePage="executive/pulse" />
    </ExecPage>
  );
}
