import { useMemo } from "react";
import {
  ArrowUpRight, ArrowDownRight, AlertTriangle, CalendarDays, ChevronRight,
  Users, Heart, FileCheck2, UserCog, ShieldCheck, BadgeCheck, GraduationCap,
  Sparkles, Activity, Flame, ArrowRight, CheckCircle2, Brain,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import { getStateData, type Tone } from "@/lib/os/stateData";

/* ---------- tone helpers ---------- */
const toneText = (t: Tone) =>
  t === "ok" ? "text-[hsl(155_55%_38%)]" : t === "warn" ? "text-[hsl(30_85%_45%)]" : "text-[hsl(355_72%_52%)]";
const toneBg = (t: Tone) =>
  t === "ok" ? "bg-[hsl(150_70%_94%)]" : t === "warn" ? "bg-[hsl(40_100%_94%)]" : "bg-[hsl(355_100%_95%)]";
const toneDot = (t: Tone) =>
  t === "ok" ? "bg-[hsl(155_60%_50%)]" : t === "warn" ? "bg-[hsl(35_90%_55%)]" : "bg-[hsl(355_75%_58%)]";
const toneRing = (t: Tone) =>
  t === "ok"
    ? "shadow-[0_0_0_1px_hsl(155_55%_55%/0.18),0_18px_44px_-24px_hsl(155_55%_40%/0.30)]"
    : t === "warn"
    ? "shadow-[0_0_0_1px_hsl(35_90%_60%/0.24),0_18px_44px_-24px_hsl(35_85%_50%/0.35)]"
    : "shadow-[0_0_0_1px_hsl(355_75%_65%/0.28),0_18px_44px_-24px_hsl(355_72%_55%/0.40)]";

/* ---------- Health Ring (Apple-Health style) ---------- */
function HealthRing({ score, label }: { score: number; label: string }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * pct;
  const tone: Tone = score >= 85 ? "ok" : score >= 70 ? "warn" : "crit";
  const stroke =
    tone === "ok" ? "hsl(155 60% 48%)" : tone === "warn" ? "hsl(35 90% 55%)" : "hsl(355 75% 58%)";
  const stroke2 =
    tone === "ok" ? "hsl(170 70% 55%)" : tone === "warn" ? "hsl(20 90% 60%)" : "hsl(345 80% 62%)";

  return (
    <div className="relative h-[200px] w-[200px]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stroke} />
            <stop offset="100%" stopColor={stroke2} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="hsl(240 10% 92%)" strokeWidth="16" />
        <circle
          cx="100" cy="100" r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-[52px] font-semibold leading-none tracking-tight tabular-nums">{score}</p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function OSStateDirector() {
  const { user } = useAuth();
  const { activeState } = useOSRole();
  const d = getStateData(activeState);
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Ezra").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const deptCounts = d.departments.reduce(
    (a, dep) => { a[dep.status] += 1; return a; },
    { ok: 0, warn: 0, crit: 0 } as Record<Tone, number>,
  );

  // Operational pulse: blend utilization with active clients trend
  const pulse = useMemo(() => {
    const baseClients = d.childrenServed;
    return d.utilization.map((u, i) => ({
      d: u.d,
      hours: u.v,
      clients: Math.round(baseClients - (d.utilization.length - 1 - i) * 1.2),
    }));
  }, [d]);

  // Attention: top 4 bottlenecks
  const attention = d.bottlenecks.slice(0, 4);

  // Team & staffing health summary
  const kpiMap = Object.fromEntries(d.kpis.map((k) => [k.key, k]));
  const teamStats = [
    { label: "Active BCBAs", key: "Active BCBAs", icon: ShieldCheck },
    { label: "Active RBTs", key: "Active RBTs", icon: UserCog },
    { label: "Fill Rate", key: "Scheduling Fill Rate", icon: CalendarDays },
    { label: "Awaiting Staffing", key: "Clients Awaiting Staffing", icon: Users },
  ].map((t) => ({ ...t, k: kpiMap[t.key] }));

  // Priorities: urgent + escalations
  const priorities = d.tasks
    .filter((t) => t.bucket === "Urgent" || t.bucket === "Escalations")
    .slice(0, 5);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1180px] space-y-8 pb-12">
        {/* ============ GREETING ============ */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {today} · {d.name}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, {name}.
            </h1>
            <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
              {d.briefing}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-foreground/70 backdrop-blur">
              <Activity className="h-3 w-3" /> Live
            </span>
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold",
              toneBg(d.opsScore >= 85 ? "ok" : d.opsScore >= 70 ? "warn" : "crit"),
              toneText(d.opsScore >= 85 ? "ok" : d.opsScore >= 70 ? "warn" : "crit"),
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", toneDot(d.opsScore >= 85 ? "ok" : d.opsScore >= 70 ? "warn" : "crit"))} />
              {d.opsLabel}
            </span>
          </div>
        </header>

        {/* ============ 1. STATE HEALTH ============ */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-white to-[hsl(220_45%_98%)] p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_30px_70px_-40px_hsl(220_40%_30%/0.25)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-[hsl(155_70%_70%/0.18)] to-transparent blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
            <div className="grid place-items-center">
              <HealthRing score={d.opsScore} label={d.opsLabel} />
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {d.code} · State Health
                </p>
                <h2 className="mt-1 text-[22px] font-semibold tracking-tight md:text-[26px]">
                  Operations are <span className={toneText(d.opsScore >= 85 ? "ok" : d.opsScore >= 70 ? "warn" : "crit")}>{d.opsLabel.toLowerCase()}</span> across {d.departments.length} departments.
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {([
                  { tone: "ok" as Tone, label: "Healthy", count: deptCounts.ok },
                  { tone: "warn" as Tone, label: "Watch", count: deptCounts.warn },
                  { tone: "crit" as Tone, label: "Critical", count: deptCounts.crit },
                ]).map((s) => (
                  <div key={s.label} className={cn("rounded-2xl p-4", toneBg(s.tone))}>
                    <p className={cn("text-[28px] font-semibold leading-none tabular-nums", toneText(s.tone))}>{s.count}</p>
                    <p className={cn("mt-1.5 text-[11px] font-semibold uppercase tracking-wider", toneText(s.tone))}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-muted-foreground">
                <span><b className="text-foreground tabular-nums">{d.childrenServed}</b> children served</span>
                <span className="h-1 w-1 self-center rounded-full bg-foreground/20" />
                <span><b className="text-foreground tabular-nums">{d.openNeeds}</b> open needs</span>
                <span className="h-1 w-1 self-center rounded-full bg-foreground/20" />
                <span><b className="text-foreground tabular-nums">{d.escalations}</b> escalations</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 2. OPERATIONAL PULSE ============ */}
        <section className="rounded-[24px] border border-white/70 bg-white/80 p-6 backdrop-blur shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_24px_60px_-40px_hsl(220_40%_30%/0.18)]">
          <header className="mb-5 flex items-end justify-between gap-2">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Operational Pulse</h3>
              <p className="text-[12px] text-muted-foreground">Active clients vs. service hours · last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-[hsl(265_80%_62%)]" /> Clients
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-[hsl(180_65%_45%)]" /> Service hrs
              </span>
            </div>
          </header>

          <div className="h-[240px]">
            <ResponsiveContainer>
              <AreaChart data={pulse} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(265 80% 62%)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="hsl(265 80% 62%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(180 65% 45%)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="hsl(180 65% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(240 10% 92%)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 50%)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 50%)" }} width={40} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12, border: "1px solid hsl(240 10% 90%)",
                    boxShadow: "0 12px 32px -16px hsl(220 40% 30% / 0.25)", fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="clients" stroke="hsl(265 80% 62%)" strokeWidth={2.25} fill="url(#gClients)" />
                <Area type="monotone" dataKey="hours" stroke="hsl(180 65% 45%)" strokeWidth={2.25} fill="url(#gHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ============ 3. ATTENTION REQUIRED ============ */}
        <section>
          <header className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Attention Required</h3>
              <p className="text-[12px] text-muted-foreground">The few things that actually need you today</p>
            </div>
            <button className="inline-flex items-center gap-1 text-[12px] font-semibold text-foreground/60 hover:text-foreground">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </header>

          <div className="grid gap-3 md:grid-cols-2">
            {attention.map((b) => {
              const tone: Tone = b.severity === "crit" ? "crit" : "warn";
              return (
                <article
                  key={b.title}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur transition hover:-translate-y-0.5",
                    toneRing(tone),
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneBg(tone), toneText(tone))}>
                      {tone === "crit" ? <Flame className="h-4.5 w-4.5" /> : <AlertTriangle className="h-4.5 w-4.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", toneBg(tone), toneText(tone))}>
                          <span className={cn("h-1 w-1 rounded-full", toneDot(tone))} />
                          {tone === "crit" ? "Critical" : "Watch"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{b.dept}</span>
                      </div>
                      <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">{b.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">Owner · {b.owner}</p>
                      <button className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-foreground/80 hover:text-foreground">
                        {b.action} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ============ 4. TEAM & STAFFING HEALTH ============ */}
        <section>
          <header className="mb-4">
            <h3 className="text-[17px] font-semibold tracking-tight">Team & Staffing Health</h3>
            <p className="text-[12px] text-muted-foreground">Capacity at a glance</p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {teamStats.map(({ label, k, icon: Icon }) => {
              if (!k) return null;
              return (
                <div
                  key={label}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur transition hover:-translate-y-0.5",
                    toneRing(k.status),
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn("grid h-9 w-9 place-items-center rounded-xl", toneBg(k.status), toneText(k.status))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", k.up ? "text-[hsl(155_55%_38%)]" : "text-[hsl(355_72%_52%)]")}>
                      {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {k.delta}
                    </span>
                  </div>
                  <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{k.value}</p>
                  <p className="mt-1.5 text-[12px] font-medium text-foreground/80">{label}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{k.hint}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============ 5. MY PRIORITIES ============ */}
        <section className="rounded-[24px] border border-white/70 bg-white/80 p-6 backdrop-blur shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_24px_60px_-40px_hsl(220_40%_30%/0.18)]">
          <header className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">My Priorities</h3>
              <p className="text-[12px] text-muted-foreground">What only you can move forward</p>
            </div>
            <span className="rounded-full bg-foreground/[0.05] px-2.5 py-1 text-[11px] font-semibold text-foreground/70">
              {priorities.length} open
            </span>
          </header>

          <ul className="divide-y divide-foreground/[0.06]">
            {priorities.map((t, i) => (
              <li key={t.title} className="group flex items-center gap-4 py-3.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-foreground/[0.04] text-[12px] font-semibold tabular-nums text-foreground/60">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold leading-tight">{t.title}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {t.dept} · {t.owner} · Due {t.due}
                  </p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  t.bucket === "Escalations" ? "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_50%)]" : "bg-[hsl(40_100%_94%)] text-[hsl(30_80%_42%)]",
                )}>
                  {t.bucket}
                </span>
                <button className="grid h-8 w-8 place-items-center rounded-xl bg-foreground/[0.04] text-foreground/60 transition hover:bg-foreground/[0.08] hover:text-foreground">
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* footer whisper */}
        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3" />
          Everything else lives a click deeper — this screen stays calm on purpose.
        </p>
      </div>
    </OSShell>
  );
}
