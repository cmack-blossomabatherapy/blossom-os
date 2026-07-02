import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Baby, CalendarClock, ChevronRight,
  ClipboardCheck, FileSignature, Loader2, MessageSquare,
  NotebookPen, ShieldCheck, Sparkles, Stethoscope, Users,
  CalendarDays, Activity, X,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useBcbaCaseload, daysSince, daysUntil, type Severity } from "@/hooks/useBcbaCaseload";
import type { ClientPairing } from "@/hooks/useCentralReachOps";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const sevRing: Record<Severity, string> = {
  crit: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
};
const sevDot: Record<Severity, string> = {
  crit: "bg-rose-500", warn: "bg-amber-500", info: "bg-sky-500",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function firstName(n: string | null | undefined) {
  if (!n) return "there";
  return n.trim().split(/\s+/)[0];
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card text-card-foreground border border-border/70 p-6",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {hint ? <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
      {children}
    </div>
  );
}

/* ─────────────── Workspace ─────────────── */

type ClientBucket = "attention" | "awaiting_me" | "awaiting_parent" | "awaiting_sched" | "awaiting_qa" | "stable";

interface CaseloadCard {
  client: ClientPairing;
  bucket: ClientBucket;
  badges: { label: string; tone: Severity }[];
}

const BUCKET_META: Record<ClientBucket, { label: string; hint: string }> = {
  attention:       { label: "Needs attention",   hint: "Urgent issues on this client" },
  awaiting_me:     { label: "Awaiting me",       hint: "PR / supervision on my plate" },
  awaiting_parent: { label: "Awaiting parent",   hint: "Parent training cadence overdue" },
  awaiting_sched:  { label: "Awaiting scheduling", hint: "Coverage gap or cancellations" },
  awaiting_qa:     { label: "Awaiting QA",       hint: "PR in QA / submitted" },
  stable:          { label: "Stable",            hint: "No active blockers" },
};

export default function OSBCBAWorkspace() {
  const c = useBcbaCaseload();
  const [activeClient, setActiveClient] = useState<string | null>(null);

  // Bucket each caseload client
  const cards: CaseloadCard[] = useMemo(() => {
    return c.caseload.map((client) => {
      const auth = c.authByClient.get(client.clientName.toLowerCase()) ?? null;
      const cov = c.coverageAlerts.find((x) => x.clientName === client.clientName) ?? null;
      const supDays = daysSince(client.lastBcbaSessionDate);
      const badges: { label: string; tone: Severity }[] = [];
      let bucket: ClientBucket = "stable";

      // Urgency: crit overrides
      const authDue = daysUntil(auth?.nextTaskDue ?? null);
      const authUrgent =
        auth && (auth.stage === "Denied" || auth.stage === "Expiring Soon" || (authDue !== null && authDue <= 7));
      const supUrgent = supDays !== null && supDays >= 21;
      const covUrgent = cov && cov.level === "uncovered";

      if (authUrgent || supUrgent || covUrgent) bucket = "attention";
      else if (auth && (auth.stage === "Awaiting Submission" || (authDue !== null && authDue <= 21))) bucket = "awaiting_me";
      else if (supDays !== null && supDays >= 14) bucket = "awaiting_me";
      else if (supDays !== null && supDays >= 30) bucket = "awaiting_parent";
      else if (cov && cov.level === "at_risk") bucket = "awaiting_sched";
      else if (client.cancellationsLast30d >= 2) bucket = "awaiting_sched";
      else if (auth && (auth.stage === "In QA Review" || auth.stage === "Submitted")) bucket = "awaiting_qa";

      if (auth) {
        if (auth.stage === "Denied") badges.push({ label: "Denied", tone: "crit" });
        else if (auth.stage === "Expiring Soon") badges.push({ label: "Expiring", tone: "crit" });
        else if (authDue !== null && authDue <= 7) badges.push({ label: `PR ${authDue}d`, tone: "crit" });
        else if (authDue !== null && authDue <= 21) badges.push({ label: `PR ${authDue}d`, tone: "warn" });
      }
      if (supDays === null) badges.push({ label: "No supervision", tone: "crit" });
      else if (supDays >= 21) badges.push({ label: `Sup ${supDays}d`, tone: "crit" });
      else if (supDays >= 14) badges.push({ label: `Sup ${supDays}d`, tone: "warn" });
      if (cov?.level === "uncovered") badges.push({ label: "Uncovered", tone: "crit" });
      else if (cov?.level === "at_risk") badges.push({ label: "Coverage gap", tone: "warn" });
      if (client.cancellationsLast30d >= 2) badges.push({ label: `${client.cancellationsLast30d} cxl`, tone: "warn" });

      return { client, bucket, badges };
    });
  }, [c.caseload, c.authByClient, c.coverageAlerts]);

  const byBucket = useMemo(() => {
    const m = new Map<ClientBucket, CaseloadCard[]>();
    (Object.keys(BUCKET_META) as ClientBucket[]).forEach((k) => m.set(k, []));
    for (const card of cards) m.get(card.bucket)!.push(card);
    return m;
  }, [cards]);

  // Action queue: top 8 across severities, dedup by client+title
  const queue = useMemo(() => {
    type Item = {
      key: string; sev: Severity; client: string;
      type: string; title: string; cta: { label: string; to: string };
    };
    const items: Item[] = [];
    c.authAlerts.forEach((x) => items.push({
      key: "auth-" + x.a.id, sev: x.sev, client: x.a.clientName,
      type: "PR / Auth", title: x.label,
      cta: { label: "Review PR", to: "/authorizations" },
    }));
    c.coverageAlerts.forEach((x) => items.push({
      key: "cov-" + x.clientName,
      sev: x.level === "uncovered" ? "crit" : "warn",
      client: x.clientName, type: "Scheduling", title: x.reason,
      cta: { label: "Message Scheduling", to: "/scheduling" },
    }));
    c.supervisionAlerts.forEach((x) => items.push({
      key: "sup-" + x.p.clientName, sev: x.sev, client: x.p.clientName,
      type: "Supervision", title: x.label,
      cta: { label: "Open Supervision", to: "/supervision" },
    }));
    c.ptAlerts.forEach((x) => items.push({
      key: "pt-" + x.p.clientName, sev: "warn", client: x.p.clientName,
      type: "Parent training", title: `Last BCBA touch ${x.days}d ago`,
      cta: { label: "Schedule session", to: "/parent-training" },
    }));
    const order = { crit: 0, warn: 1, info: 2 } as const;
    items.sort((a, b) => order[a.sev] - order[b.sev]);
    const seen = new Set<string>();
    return items.filter((i) => {
      const k = i.client + "::" + i.title;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 8);
  }, [c.authAlerts, c.coverageAlerts, c.supervisionAlerts, c.ptAlerts]);

  // Recent activity (synthesized from latest session dates on caseload)
  const recent = useMemo(() => {
    const items: { client: string; what: string; when: string; iso: string }[] = [];
    for (const p of c.caseload) {
      if (p.lastBcbaSessionDate) {
        items.push({
          client: p.clientName, what: "BCBA session logged",
          when: relative(p.lastBcbaSessionDate), iso: p.lastBcbaSessionDate,
        });
      }
      if (p.lastRbtSessionDate) {
        items.push({
          client: p.clientName, what: `RBT session · ${p.rbtName ?? "—"}`,
          when: relative(p.lastRbtSessionDate), iso: p.lastRbtSessionDate,
        });
      }
    }
    return items
      .sort((a, b) => (a.iso < b.iso ? 1 : -1))
      .slice(0, 8);
  }, [c.caseload]);

  const activePairing = useMemo(
    () => (activeClient ? c.caseload.find((p) => p.clientName === activeClient) ?? null : null),
    [activeClient, c.caseload]
  );
  const activeAuth = useMemo(
    () => (activeClient ? c.authByClient.get(activeClient.toLowerCase()) ?? null : null),
    [activeClient, c.authByClient]
  );

  return (
    <OSShell>
      <div className="space-y-8 px-4 pb-16 pt-6 md:px-8">

        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">BCBA Workspace</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {greeting()}, {firstName(c.profileMatched ? c.profileName : c.resolvedBcba)}.
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {c.loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading your caseload…</span>
                ) : c.caseload.length === 0 ? (
                  "No caseload activity in the last 60 days."
                ) : (
                  <>
                    <b className="text-foreground">{c.caseload.length}</b> active clients ·{" "}
                    <b className="text-foreground">{c.supervisionAlerts.length}</b> supervision ·{" "}
                    <b className="text-foreground">{c.authAlerts.length}</b> PR/auth ·{" "}
                    <b className="text-foreground">{c.coverageAlerts.length}</b> scheduling ·{" "}
                    <b className="text-foreground">{c.ptAlerts.length}</b> parent training
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 md:items-end">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                {c.profileMatched ? "Caseload" : "Viewing as"}
              </label>
              <select
                className="h-10 rounded-xl border border-border bg-muted/60 px-3 text-sm font-medium text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
                value={c.resolvedBcba ?? ""}
                onChange={(e) => c.setSelectedBcba(e.target.value || null)}
                disabled={c.bcbaOptions.length === 0}
              >
                {c.bcbaOptions.length === 0 ? (
                  <option value="">No BCBAs found</option>
                ) : (
                  c.bcbaOptions.map((b) => (
                    <option key={b.name} value={b.name}>{b.name} · {b.distinctClients} clients</option>
                  ))
                )}
              </select>
              <Link to="/bcba" className="mt-1 text-[11px] text-muted-foreground hover:text-foreground">
                Switch to dashboard view →
              </Link>
            </div>
          </div>
        </header>

        {/* Action Queue */}
        <section>
          <SectionTitle
            title="My action queue"
            hint="Sorted by urgency — work top-down."
            action={<span className="text-xs text-muted-foreground">{queue.length} items</span>}
          />
          {c.loading ? (
            <SkeletonRows />
          ) : queue.length === 0 ? (
            <EmptyLine>Your queue is clear. Nice work.</EmptyLine>
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-border/60">
                {queue.map((q) => (
                  <li key={q.key} className="flex items-center gap-4 px-5 py-4">
                    <span className={cn("size-2 shrink-0 rounded-full", sevDot[q.sev])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveClient(q.client)}
                          className="truncate text-sm font-medium text-foreground hover:underline"
                        >
                          {q.client}
                        </button>
                        <span className="text-xs text-muted-foreground">· {q.type}</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{q.title}</div>
                    </div>
                    <Link
                      to={q.cta.to}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      {q.cta.label} <ArrowRight className="size-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        {/* Caseload workflow board */}
        <section>
          <SectionTitle title="Caseload board" hint="Grouped by where each client sits in the workflow." />
          {c.loading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[0,1,2,3,4,5].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/60" />)}
            </div>
          ) : c.caseload.length === 0 ? (
            <EmptyLine>No clients on this caseload.</EmptyLine>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(Object.keys(BUCKET_META) as ClientBucket[]).map((bucket) => {
                const items = byBucket.get(bucket) ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={bucket} className="rounded-2xl bg-muted/40 p-4">
                    <div className="mb-3 flex items-baseline justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">{BUCKET_META[bucket].label}</div>
                        <div className="text-xs text-muted-foreground">{BUCKET_META[bucket].hint}</div>
                      </div>
                      <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border/60">
                        {items.length}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {items.map((card) => (
                        <li key={card.client.clientName}>
                          <button
                            type="button"
                            onClick={() => setActiveClient(card.client.clientName)}
                            className="group w-full rounded-xl border border-border/70 bg-card p-3 text-left transition hover:-translate-y-0.5 hover:border-border"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate text-sm font-medium text-foreground">
                                {card.client.clientName}
                              </div>
                              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                            </div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                              RBT: {card.client.rbtName ?? "—"}
                            </div>
                            {card.badges.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {card.badges.slice(0, 3).map((b, idx) => (
                                  <span key={idx} className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", sevRing[b.tone])}>
                                    {b.label}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Queues row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <QueueCard
            title="Supervision queue"
            hint="Clients without recent BCBA touch."
            href="/supervision"
            loading={c.loading}
            emptyText="Supervision cadence is healthy."
            rows={c.supervisionAlerts.slice(0, 6).map((x) => ({
              key: x.p.clientName,
              title: x.p.clientName,
              meta: `RBT: ${x.p.rbtName ?? "—"} · ${x.label}`,
              badge: { label: x.sev === "crit" ? "Overdue" : "At risk", tone: x.sev },
              onOpen: () => setActiveClient(x.p.clientName),
            }))}
          />
          <QueueCard
            title="PR queue"
            hint="Live from authorizations."
            href="/authorizations"
            loading={c.loading}
            emptyText="No PR or auth risks on your caseload."
            rows={c.authAlerts.slice(0, 6).map((x) => ({
              key: x.a.id,
              title: x.a.clientName,
              meta: `${x.a.payor} · ${x.label}`,
              badge: { label: x.a.stage, tone: x.sev },
              onOpen: () => setActiveClient(x.a.clientName),
            }))}
          />
          <QueueCard
            title="Parent training"
            hint="Clients without recent 97156 cadence."
            href="/parent-training"
            loading={c.loading}
            emptyText="Parent training cadence is on track."
            rows={c.ptAlerts.slice(0, 6).map((x) => ({
              key: x.p.clientName,
              title: x.p.clientName,
              meta: `Last BCBA touch ${x.days}d ago`,
              badge: { label: "Schedule", tone: "warn" },
              onOpen: () => setActiveClient(x.p.clientName),
            }))}
          />
          <QueueCard
            title="Scheduling feed"
            hint="Coverage and cancellation signals."
            href="/scheduling"
            loading={c.loading}
            emptyText="All clients are covered and stable."
            rows={[
              ...c.coverageAlerts.slice(0, 4).map((x) => ({
                key: "cov-" + x.clientName,
                title: x.clientName, meta: x.reason,
                badge: { label: x.level === "uncovered" ? "Uncovered" : "At risk", tone: (x.level === "uncovered" ? "crit" : "warn") as Severity },
                onOpen: () => setActiveClient(x.clientName),
              })),
              ...c.cancellationAlerts.slice(0, 3).map((p) => ({
                key: "can-" + p.clientName,
                title: p.clientName, meta: `${p.cancellationsLast30d} cancellations in last 30d`,
                badge: { label: "Cxl trend", tone: "warn" as Severity },
                onOpen: () => setActiveClient(p.clientName),
              })),
            ]}
          />
        </div>

        {/* Blockers + Recent activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionTitle title="Clinical blockers & escalations" hint="Things stopping care from moving." />
            {c.loading ? <SkeletonRows /> : (() => {
              const blockers = [
                ...c.authAlerts.filter((x) => x.a.missingInfo || x.a.stage === "Denied")
                  .map((x) => ({
                    key: "b-" + x.a.id, client: x.a.clientName,
                    title: x.a.missingInfo ? "Missing information on auth" : "Authorization denied",
                    tone: "crit" as Severity, cta: { label: "Open auth", to: "/authorizations" },
                  })),
                ...c.coverageAlerts.filter((x) => x.level === "uncovered")
                  .slice(0, 4).map((x) => ({
                    key: "b-cov-" + x.clientName, client: x.clientName,
                    title: x.reason, tone: "crit" as Severity,
                    cta: { label: "Message scheduling", to: "/scheduling" },
                  })),
              ].slice(0, 6);
              if (blockers.length === 0) return <EmptyLine>No active blockers on your caseload.</EmptyLine>;
              return (
                <ul className="space-y-2">
                  {blockers.map((b) => (
                    <li key={b.key} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
                      <div className="min-w-0">
                        <button onClick={() => setActiveClient(b.client)} className="truncate text-sm font-medium text-foreground hover:underline">
                          {b.client}
                        </button>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{b.title}</div>
                      </div>
                      <Link to={b.cta.to} className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                        {b.cta.label} <ArrowRight className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </Card>

          <Card>
            <SectionTitle title="Recent activity" />
            {c.loading ? <SkeletonRows /> : recent.length === 0 ? (
              <EmptyLine>No recent activity.</EmptyLine>
            ) : (
              <ul className="space-y-2">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground/40" />
                    <div className="min-w-0">
                      <button onClick={() => setActiveClient(r.client)} className="truncate text-sm text-foreground hover:underline">
                        {r.client}
                      </button>
                      <div className="truncate text-xs text-muted-foreground">{r.what} · {r.when}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Quick Actions + AI */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionTitle title="Quick workflow actions" />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Quick to="/bcba/clients" icon={Users} label="Open caseload" />
              <Quick to="/bcba/authorizations" icon={FileSignature} label="View PRs" />
              <Quick to="/bcba/supervision" icon={Stethoscope} label="Supervision" />
              <Quick to="/bcba/parent-training" icon={Baby} label="Parent training" />
              <Quick to="/bcba/scheduling" icon={CalendarDays} label="Scheduling" />
              <Quick to="/bcba/clients" icon={ClipboardCheck} label="Clients" />
              <Quick to="/bcba/authorizations" icon={NotebookPen} label="Authorizations" />
              <Quick to="/ai/assistant" icon={Sparkles} label="Operational Insights" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Insights</div>
                <div className="text-xs text-muted-foreground">Scoped to your caseload</div>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {[
                "What should I prioritize today?",
                "Which PRs are due first?",
                "Which clients are missing supervision?",
                "Summarize scheduling problems on my caseload.",
              ].map((q) => (
                <li key={q}>
                  <Link to={`/ai/assistant?q=${encodeURIComponent(q)}`} className="group flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground hover:bg-muted">
                    <span className="truncate">{q}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {c.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertTriangle className="mr-2 inline size-4" /> {c.error}
          </div>
        ) : null}
      </div>

      {/* Client side panel */}
      <Sheet open={!!activeClient} onOpenChange={(o) => { if (!o) setActiveClient(null); }}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">{activeClient ?? "Client"}</SheetTitle>
          </SheetHeader>
          {activePairing ? (
            <ClientPanel pairing={activePairing} auth={activeAuth} onClose={() => setActiveClient(null)} />
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">No live data found for this client.</p>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

/* ─────────────── Subcomponents ─────────────── */

interface QueueRow {
  key: string; title: string; meta: string;
  badge: { label: string; tone: Severity };
  onOpen?: () => void;
}
function QueueCard({
  title, hint, href, loading, emptyText, rows,
}: {
  title: string; hint: string; href: string; loading: boolean; emptyText: string; rows: QueueRow[];
}) {
  return (
    <section>
      <SectionTitle title={title} hint={hint} action={<Link to={href} className="text-sm text-primary hover:opacity-80">Open</Link>} />
      <Card className="p-0">
        {loading ? <SkeletonRows /> : rows.length === 0 ? (
          <div className="p-5"><EmptyLine>{emptyText}</EmptyLine></div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  {r.onOpen ? (
                    <button onClick={r.onOpen} className="truncate text-sm font-medium text-foreground hover:underline">{r.title}</button>
                  ) : (
                    <div className="truncate text-sm font-medium text-foreground">{r.title}</div>
                  )}
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{r.meta}</div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevRing[r.badge.tone])}>
                  {r.badge.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

function Quick({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="group flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:-translate-y-0.5 hover:bg-muted/60 hover:border-border transition">
      <Icon className="size-4 text-muted-foreground transition group-hover:text-primary" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-border/60">
      {[0,1,2,3].map(i => (
        <li key={i} className="px-5 py-4">
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted/60" />
          <div className="mt-2 h-2.5 w-2/3 animate-pulse rounded bg-muted/40" />
        </li>
      ))}
    </ul>
  );
}

function ClientPanel({
  pairing, auth, onClose,
}: { pairing: ClientPairing; auth: Authorization | null; onClose: () => void }) {
  const supDays = daysSince(pairing.lastBcbaSessionDate);
  const rbtDays = daysSince(pairing.lastRbtSessionDate);
  const prDue = daysUntil(auth?.nextTaskDue ?? null);

  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="text-xs text-muted-foreground">State</div>
        <div className="mt-0.5 text-sm font-medium text-foreground">{pairing.state ?? "—"}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Users} label="Assigned RBT" value={pairing.rbtName ?? "—"} />
        <StatTile icon={Activity} label="RBT hrs / 30d" value={pairing.rbtHoursLast30d.toFixed(1)} />
        <StatTile icon={Stethoscope} label="Last BCBA" value={supDays !== null ? `${supDays}d ago` : "—"} tone={supDays !== null && supDays >= 21 ? "crit" : supDays !== null && supDays >= 14 ? "warn" : "ok"} />
        <StatTile icon={CalendarClock} label="Last RBT" value={rbtDays !== null ? `${rbtDays}d ago` : "—"} tone={rbtDays !== null && rbtDays >= 14 ? "crit" : rbtDays !== null && rbtDays >= 7 ? "warn" : "ok"} />
      </div>

      {auth ? (
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">Authorization</div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{auth.stage}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {auth.payor} · {auth.authType}
            {auth.expirationDate ? ` · expires ${auth.expirationDate}` : ""}
            {prDue !== null ? ` · PR due in ${prDue}d` : ""}
          </div>
          <div className="mt-2 text-xs text-foreground">{auth.nextAction}</div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
          No authorization linked in Monday data.
        </div>
      )}

      {pairing.cancellationsLast30d > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          {pairing.cancellationsLast30d} cancellations in the last 30 days.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Link to="/bcba/clients" className="rounded-xl bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90">
          Open full client
        </Link>
        <Link to="/bcba/scheduling" className="rounded-xl border border-border/70 bg-card px-3 py-2 text-center text-sm font-medium text-foreground hover:bg-muted">
          Message scheduling
        </Link>
        <Link to="/bcba/authorizations" className="rounded-xl border border-border/70 bg-card px-3 py-2 text-center text-sm font-medium text-foreground hover:bg-muted">
          Open PR
        </Link>
        <button onClick={onClose} className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
          Close
        </button>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon, label, value, tone = "ok",
}: { icon: React.ElementType; label: string; value: string; tone?: "ok" | "warn" | "crit" }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3">
      <div className="flex items-center justify-between">
        <Icon className="size-4 text-muted-foreground" />
        <span className={cn("size-1.5 rounded-full",
          tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-rose-500")} />
      </div>
      <div className="mt-2 truncate text-sm font-medium text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function relative(iso: string): string {
  const d = daysSince(iso);
  if (d === null) return "—";
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}