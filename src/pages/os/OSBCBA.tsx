import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, CalendarClock, ChevronRight, FileSignature, Heart,
  MessageSquare, NotebookPen, Sparkles, Stethoscope, UserCog, Users,
  CalendarDays, ClipboardCheck, ArrowRight, Baby, ShieldCheck, Loader2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCentralReachOps, type ClientPairing } from "@/hooks/useCentralReachOps";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { cn } from "@/lib/utils";

type Severity = "crit" | "warn" | "info";

const sevRing: Record<Severity, string> = {
  crit: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
};

const sevDot: Record<Severity, string> = {
  crit: "bg-rose-500",
  warn: "bg-amber-500",
  info: "bg-sky-500",
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function firstName(name: string | null | undefined): string {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0];
}
function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
}

/** Card */
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

/* ─────────────── Main page ─────────────── */

export default function OSBCBA() {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [selectedBcba, setSelectedBcba] = useState<string | null>(null);

  // Load logged-in user profile display_name
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setProfileName(data?.display_name ?? null);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const cr = useCentralReachOps();
  const auths = useLiveAuthorizations();

  // Build BCBA roster (real names only, excludes empty) for caseload selection.
  const bcbaOptions = useMemo(
    () => cr.bcbaRoster.filter((b) => b.name && b.name.trim().length > 1),
    [cr.bcbaRoster]
  );

  // Resolve which BCBA's caseload to show.
  // Priority: user-selected → profile display_name match → largest caseload.
  const resolvedBcba = useMemo(() => {
    if (selectedBcba) return selectedBcba;
    if (profileName) {
      const lower = profileName.toLowerCase();
      const match = bcbaOptions.find((b) => b.name.toLowerCase() === lower);
      if (match) return match.name;
    }
    return bcbaOptions[0]?.name ?? null;
  }, [selectedBcba, profileName, bcbaOptions]);

  const profileMatched = useMemo(() => {
    if (!profileName) return false;
    return bcbaOptions.some((b) => b.name.toLowerCase() === profileName.toLowerCase());
  }, [profileName, bcbaOptions]);

  // Caseload pairings for selected BCBA
  const caseload: ClientPairing[] = useMemo(() => {
    if (!resolvedBcba) return [];
    const list: ClientPairing[] = [];
    for (const p of cr.pairingsByClient.values()) {
      if (p.bcbaName && p.bcbaName.toLowerCase() === resolvedBcba.toLowerCase()) {
        list.push(p);
      }
    }
    return list.sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [cr.pairingsByClient, resolvedBcba]);

  const caseloadClientSet = useMemo(
    () => new Set(caseload.map((c) => c.clientName.toLowerCase())),
    [caseload]
  );

  // Auths for this BCBA — match by liveBcba mapping OR by client name in caseload.
  const myAuths = useMemo(() => {
    if (!resolvedBcba) return [];
    const lower = resolvedBcba.toLowerCase();
    return auths.items.filter((a) => {
      const live = auths.bcbaById.get(a.id);
      if (live && live.toLowerCase() === lower) return true;
      if (caseloadClientSet.has(a.clientName.toLowerCase())) return true;
      return false;
    });
  }, [auths.items, auths.bcbaById, resolvedBcba, caseloadClientSet]);

  // ───── Derived alert buckets ─────

  // Supervision: client where last BCBA session > 21 days, or none at all in 60d window.
  const supervisionAlerts = useMemo(() => {
    return caseload
      .map((p) => {
        const d = daysSince(p.lastBcbaSessionDate);
        if (d === null) {
          return { p, days: null, sev: "crit" as Severity, label: "No BCBA session in 60d window" };
        }
        if (d >= 21) return { p, days: d, sev: "crit" as Severity, label: `Last supervision ${d}d ago` };
        if (d >= 14) return { p, days: d, sev: "warn" as Severity, label: `Last supervision ${d}d ago` };
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => (b.days ?? 999) - (a.days ?? 999));
  }, [caseload]);

  // Coverage / scheduling: clients in caseload with uncovered/at-risk RBT coverage.
  const coverageAlerts = useMemo(() => {
    return cr.coverageRisks
      .filter((r) => caseloadClientSet.has(r.clientName.toLowerCase()))
      .slice(0, 12);
  }, [cr.coverageRisks, caseloadClientSet]);

  // PR / Auth alerts: PR due ≤ 21d, expiring soon, denied, missing info.
  const authAlerts = useMemo(() => {
    const list = myAuths
      .map((a) => {
        const d = daysUntil(a.nextTaskDue);
        let sev: Severity = "info";
        let label = a.nextAction ?? "Review";
        if (a.stage === "Denied") {
          sev = "crit";
          label = a.denialReason ? `Denied · ${a.denialReason}` : "Denied — address denial";
        } else if (a.stage === "Expiring Soon" || (d !== null && d <= 14)) {
          sev = d !== null && d <= 7 ? "crit" : "warn";
          label = d !== null ? `Due in ${d}d · ${a.nextAction ?? "Review"}` : a.nextAction ?? "Review";
        } else if (a.missingInfo) {
          sev = "warn";
          label = "Missing information from Monday";
        } else if (a.stage === "In QA Review") {
          sev = "info";
          label = "In QA review";
        } else {
          return null;
        }
        return { a, sev, label, due: d };
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => {
        const order = { crit: 0, warn: 1, info: 2 } as const;
        if (order[a.sev] !== order[b.sev]) return order[a.sev] - order[b.sev];
        return (a.due ?? 999) - (b.due ?? 999);
      });
    return list;
  }, [myAuths]);

  // Parent training / cancellation signals from pairings
  const ptAlerts = useMemo(() => {
    // Approximated via BCBA session freshness — BCBA bucket includes 97156 parent training.
    // Flag clients with no BCBA touch in >30d as missing parent training cadence.
    return caseload
      .map((p) => {
        const d = daysSince(p.lastBcbaSessionDate);
        if (d !== null && d >= 30) return { p, days: d };
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => b.days - a.days)
      .slice(0, 8);
  }, [caseload]);

  const cancellationAlerts = useMemo(
    () => caseload.filter((p) => p.cancellationsLast30d >= 2)
      .sort((a, b) => b.cancellationsLast30d - a.cancellationsLast30d)
      .slice(0, 8),
    [caseload]
  );

  // Today's priorities — top 6 across all buckets, severity-weighted.
  const todays = useMemo(() => {
    type Item = {
      key: string; sev: Severity; client: string; title: string;
      cta: { label: string; to: string };
    };
    const items: Item[] = [];
    authAlerts.slice(0, 6).forEach((x) =>
      items.push({
        key: "auth-" + x.a.id, sev: x.sev, client: x.a.clientName,
        title: x.label,
        cta: { label: "Review PR", to: `/authorizations` },
      })
    );
    coverageAlerts.slice(0, 6).forEach((x) =>
      items.push({
        key: "cov-" + x.clientName,
        sev: x.level === "uncovered" ? "crit" : "warn",
        client: x.clientName,
        title: x.reason,
        cta: { label: "Message Scheduling", to: `/scheduling` },
      })
    );
    supervisionAlerts.slice(0, 6).forEach((x) =>
      items.push({
        key: "sup-" + x.p.clientName, sev: x.sev, client: x.p.clientName,
        title: x.label,
        cta: { label: "Open Supervision", to: `/supervision` },
      })
    );
    // Stable sort by severity then unique key.
    const order = { crit: 0, warn: 1, info: 2 } as const;
    items.sort((a, b) => order[a.sev] - order[b.sev]);
    // Dedup by client+title.
    const seen = new Set<string>();
    return items.filter((i) => {
      const k = i.client + "::" + i.title;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 6);
  }, [authAlerts, coverageAlerts, supervisionAlerts]);

  const loading = cr.loading || auths.loading;

  // Caseload snapshot numbers
  const snapshot = useMemo(() => {
    const activeRbts = new Set(caseload.map((c) => c.rbtName).filter(Boolean) as string[]);
    return {
      activeClients: caseload.length,
      activeRbts: activeRbts.size,
      supervisionAlerts: supervisionAlerts.length,
      prDueThisMonth: authAlerts.filter((x) => x.due !== null && x.due >= 0 && x.due <= 30).length,
      parentTrainingDue: ptAlerts.length,
      schedulingRisks: coverageAlerts.length,
    };
  }, [caseload, supervisionAlerts, authAlerts, ptAlerts, coverageAlerts]);

  return (
    <OSShell>
      <div className="space-y-8 px-4 pb-16 pt-6 md:px-8">
        {/* ── Welcome header ── */}
        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {greeting()}, {firstName(profileMatched ? profileName : resolvedBcba)}.
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Loading your caseload…
                  </span>
                ) : caseload.length === 0 ? (
                  "No caseload activity found in the last 60 days of CentralReach data."
                ) : (
                  <>
                    You have <b className="text-foreground">{snapshot.activeClients}</b> active clients,{" "}
                    <b className="text-foreground">{snapshot.prDueThisMonth}</b> PRs due in the next 30 days,{" "}
                    <b className="text-foreground">{snapshot.supervisionAlerts}</b> supervision risks, and{" "}
                    <b className="text-foreground">{snapshot.schedulingRisks}</b> coverage issues to review.
                  </>
                )}
              </p>
            </div>

            {/* Viewing-as selector */}
            <div className="flex flex-col items-start gap-1 md:items-end">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                {profileMatched ? "Caseload" : "Viewing as"}
              </label>
              <select
                className="h-10 rounded-xl border border-border bg-muted/60 px-3 text-sm font-medium text-foreground transition focus:border-transparent focus:ring-2 focus:ring-ring"
                value={resolvedBcba ?? ""}
                onChange={(e) => setSelectedBcba(e.target.value || null)}
                disabled={bcbaOptions.length === 0}
              >
                {bcbaOptions.length === 0 ? (
                  <option value="">No BCBAs found</option>
                ) : (
                  bcbaOptions.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} · {b.distinctClients} clients
                    </option>
                  ))
                )}
              </select>
              {!profileMatched && profileName ? (
                <span className="text-[11px] text-muted-foreground">
                  Signed in as {profileName} — preview any BCBA caseload above.
                </span>
              ) : null}
            </div>
          </div>
        </header>

        {/* ── Today's Priorities ── */}
        <section>
          <SectionTitle
            title="Today's priorities"
            hint="The few things that need attention right now."
          />
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/60" />
              ))}
            </div>
          ) : todays.length === 0 ? (
            <EmptyLine>You're clear — no urgent issues on your caseload.</EmptyLine>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {todays.map((t) => (
                <Card key={t.key} className="flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", sevDot[t.sev])} />
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevRing[t.sev])}>
                        {t.sev === "crit" ? "Urgent" : t.sev === "warn" ? "Upcoming" : "FYI"}
                      </span>
                    </div>
                    <h3 className="mt-3 truncate text-[15px] font-medium text-foreground">{t.client}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{t.title}</p>
                  </div>
                  <Link
                    to={t.cta.to}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
                  >
                    {t.cta.label} <ArrowRight className="size-3.5" />
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ── Caseload Snapshot ── */}
        <section>
          <SectionTitle title="Caseload snapshot" hint="A calm read on how your operation is holding." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Snap icon={Heart} label="Active clients" value={snapshot.activeClients} />
            <Snap icon={Users} label="Active RBTs" value={snapshot.activeRbts} />
            <Snap icon={Stethoscope} label="Supervision alerts" value={snapshot.supervisionAlerts} tone={snapshot.supervisionAlerts > 0 ? "warn" : "ok"} />
            <Snap icon={NotebookPen} label="PRs due (30d)" value={snapshot.prDueThisMonth} tone={snapshot.prDueThisMonth > 0 ? "warn" : "ok"} />
            <Snap icon={Baby} label="Parent training due" value={snapshot.parentTrainingDue} tone={snapshot.parentTrainingDue > 0 ? "warn" : "ok"} />
            <Snap icon={CalendarClock} label="Scheduling risks" value={snapshot.schedulingRisks} tone={snapshot.schedulingRisks > 0 ? "crit" : "ok"} />
          </div>
        </section>

        {/* ── Two-column body ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Supervision */}
          <section>
            <SectionTitle
              title="Supervision alerts"
              hint="Clients without recent BCBA touch."
              action={<Link to="/bcba/supervision" className="text-sm text-primary hover:opacity-80">Open</Link>}
            />
            <Card className="p-0">
              {loading ? (
                <SkeletonRows />
              ) : supervisionAlerts.length === 0 ? (
                <div className="p-5"><EmptyLine>Supervision cadence looks healthy.</EmptyLine></div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {supervisionAlerts.slice(0, 6).map((x) => (
                    <li key={x.p.clientName} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{x.p.clientName}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          RBT: {x.p.rbtName ?? "—"} · {x.label}
                        </div>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevRing[x.sev])}>
                        {x.sev === "crit" ? "Overdue" : "At risk"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          {/* PR / Authorization */}
          <section>
            <SectionTitle
              title="PR & authorization alerts"
              hint="Live from authorization workspace."
              action={<Link to="/bcba/authorizations" className="text-sm text-primary hover:opacity-80">Open</Link>}
            />
            <Card className="p-0">
              {loading ? (
                <SkeletonRows />
              ) : authAlerts.length === 0 ? (
                <div className="p-5"><EmptyLine>No PR or auth risks on your caseload.</EmptyLine></div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {authAlerts.slice(0, 6).map((x) => (
                    <li key={x.a.id} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{x.a.clientName}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {x.a.payor} · {x.label}
                        </div>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevRing[x.sev])}>
                        {x.a.stage}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          {/* Parent Training */}
          <section>
            <SectionTitle
              title="Parent training alerts"
              hint="Clients without recent 97156 cadence."
              action={<Link to="/bcba/parent-training" className="text-sm text-primary hover:opacity-80">Open</Link>}
            />
            <Card className="p-0">
              {loading ? (
                <SkeletonRows />
              ) : ptAlerts.length === 0 ? (
                <div className="p-5"><EmptyLine>Parent training cadence is on track.</EmptyLine></div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {ptAlerts.map((x) => (
                    <li key={x.p.clientName} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{x.p.clientName}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Last BCBA touch {x.days}d ago
                        </div>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevRing.warn)}>
                        Schedule
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          {/* Scheduling / Coverage */}
          <section>
            <SectionTitle
              title="Scheduling issues"
              hint="Coverage gaps on your caseload."
              action={<Link to="/bcba/scheduling" className="text-sm text-primary hover:opacity-80">Open</Link>}
            />
            <Card className="p-0">
              {loading ? (
                <SkeletonRows />
              ) : coverageAlerts.length === 0 && cancellationAlerts.length === 0 ? (
                <div className="p-5"><EmptyLine>All clients are covered and stable.</EmptyLine></div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {coverageAlerts.slice(0, 4).map((x) => (
                    <li key={"cov-" + x.clientName} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{x.clientName}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{x.reason}</div>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        sevRing[x.level === "uncovered" ? "crit" : "warn"]
                      )}>
                        {x.level === "uncovered" ? "Uncovered" : "At risk"}
                      </span>
                    </li>
                  ))}
                  {cancellationAlerts.slice(0, 3).map((p) => (
                    <li key={"can-" + p.clientName} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{p.clientName}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {p.cancellationsLast30d} cancellations in last 30d
                        </div>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevRing.warn)}>
                        Trend
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>

        {/* ── Quick actions + AI ── */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionTitle title="Quick actions" />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              <Quick to="/bcba/clients" icon={Users} label="Open caseload" />
              <Quick to="/bcba/supervision" icon={Stethoscope} label="Supervision" />
              <Quick to="/bcba/parent-training" icon={Baby} label="Parent training" />
              <Quick to="/bcba/scheduling" icon={CalendarDays} label="Scheduling" />
              <Quick to="/bcba/authorizations" icon={FileSignature} label="View PRs" />
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
                "Which clients should I prioritize today?",
                "Which PRs are due first this month?",
                "Which clients are missing supervision?",
                "Summarize my scheduling issues.",
              ].map((q) => (
                <li key={q}>
                  <Link
                    to={`/ai/assistant?q=${encodeURIComponent(q)}`}
                    className="group flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                  >
                    <span className="truncate">{q}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {cr.error || auths.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertTriangle className="mr-2 inline size-4" />
            {cr.error ?? auths.error}
          </div>
        ) : null}
      </div>
    </OSShell>
  );
}

/* ─────────────── Sub components ─────────────── */

function Snap({
  icon: Icon, label, value, tone = "ok",
}: {
  icon: React.ElementType; label: string; value: number; tone?: "ok" | "warn" | "crit";
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center justify-between">
        <Icon className="size-4 text-muted-foreground" />
        <span className={cn(
          "size-1.5 rounded-full",
          tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-rose-500"
        )} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Quick({
  to, icon: Icon, label,
}: {
  to: string; icon: React.ElementType; label: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-border hover:bg-muted/60"
    >
      <Icon className="size-4 text-muted-foreground transition group-hover:text-primary" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-border/60">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="px-5 py-4">
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted/60" />
          <div className="mt-2 h-2.5 w-2/3 animate-pulse rounded bg-muted/40" />
        </li>
      ))}
    </ul>
  );
}