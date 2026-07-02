import { Link } from "react-router-dom";
import {
  HeartHandshake, MessageSquare, CalendarDays, ShieldCheck,
  Users, Flame, Activity, ChevronRight, ArrowUpRight, Heart, UserCheck, Bell,
  PlusCircle, CalendarClock, ShieldAlert, Send, Loader2, Inbox,
} from "lucide-react";
import { OSShell } from "../OSShell";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";

/**
 * Case Manager → Dashboard
 * Real-time counts from case_manager_* workflow tables via
 * useCaseManagerWorkspace(). All quick actions route to real, working pages.
 */

const TONE: Record<string, string> = {
  warm:   "from-[hsl(330_100%_96%)] to-[hsl(20_100%_96%)] text-[hsl(330_60%_50%)]",
  cool:   "from-[hsl(210_100%_97%)] to-[hsl(195_100%_96%)] text-[hsl(210_70%_50%)]",
  alert:  "from-[hsl(15_100%_96%)] to-[hsl(0_100%_97%)] text-[hsl(10_75%_55%)]",
  calm:   "from-[hsl(160_60%_95%)] to-[hsl(180_60%_96%)] text-[hsl(165_55%_38%)]",
  violet: "from-[hsl(265_100%_97%)] to-[hsl(285_100%_97%)] text-[hsl(265_60%_55%)]",
  amber:  "from-[hsl(40_100%_94%)] to-[hsl(28_100%_95%)] text-[hsl(28_85%_45%)]",
};

const QUICK_ACTIONS: { label: string; icon: any; to: string }[] = [
  { label: "Log follow-up",       icon: PlusCircle,     to: "/case-manager/follow-ups" },
  { label: "Assigned families",   icon: HeartHandshake, to: "/case-manager/families" },
  { label: "Review escalations",  icon: Flame,          to: "/case-manager/escalations" },
  { label: "Log parent contact",  icon: Send,           to: "/case-manager/communication" },
  { label: "Service issues",      icon: ShieldAlert,    to: "/case-manager/service-issues" },
  { label: "Add case note",       icon: MessageSquare,  to: "/case-manager/family-support" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function today() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function ToneBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    alert:  "bg-[hsl(10_85%_96%)] text-[hsl(10_75%_45%)] border-[hsl(10_85%_88%)]",
    amber:  "bg-[hsl(38_100%_94%)] text-[hsl(28_85%_40%)] border-[hsl(38_85%_85%)]",
    warm:   "bg-[hsl(330_100%_96%)] text-[hsl(330_60%_45%)] border-[hsl(330_85%_90%)]",
    cool:   "bg-[hsl(210_100%_96%)] text-[hsl(210_70%_42%)] border-[hsl(210_85%_88%)]",
    calm:   "bg-[hsl(160_50%_94%)] text-[hsl(165_55%_32%)] border-[hsl(160_50%_85%)]",
    violet: "bg-[hsl(265_100%_97%)] text-[hsl(265_60%_50%)] border-[hsl(265_85%_90%)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${map[tone] ?? map.calm}`}>
      {children}
    </span>
  );
}

function SectionHeader({ title, hint, action, actionTo }: { title: string; hint?: string; action?: string; actionTo?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 text-[12px] text-muted-foreground">{hint}</p>}
      </div>
      {action && actionTo ? (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-foreground/80 backdrop-blur transition hover:border-[hsl(330_80%_85%)] hover:text-[hsl(330_60%_45%)]"
        >
          {action} <ChevronRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, hint }: { icon: any; title: string; hint?: string }) {
  return (
    <div className="col-span-full flex flex-col items-center rounded-2xl border border-dashed border-border/60 bg-white/60 p-6 text-center">
      <Icon className="mb-2 h-5 w-5 text-muted-foreground" />
      <p className="text-[13px] font-medium">{title}</p>
      {hint ? <p className="mt-1 text-[11.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function OSCaseManager() {
  const {
    loading, error, kpis, followUps, communications, escalations, assignments,
  } = useCaseManagerWorkspace();

  const snapshot = [
    { title: "Assigned families",   value: kpis.assignedFamilies,     hint: "on your caseload",   icon: HeartHandshake, tone: "warm",   to: "/case-manager/families" },
    { title: "Follow-ups due",      value: kpis.followUpsDueThisWeek, hint: "this week",          icon: Activity,       tone: "calm",   to: "/case-manager/follow-ups" },
    { title: "Overdue follow-ups",  value: kpis.overdueFollowUps,     hint: "action needed",      icon: Bell,           tone: "alert",  to: "/case-manager/follow-ups" },
    { title: "Awaiting response",   value: kpis.awaitingCommResponse, hint: "parent messages",    icon: MessageSquare,  tone: "cool",   to: "/case-manager/communication" },
    { title: "Open service issues", value: kpis.openServiceIssues,    hint: "in progress",        icon: ShieldAlert,    tone: "amber",  to: "/case-manager/service-issues" },
    { title: "Open handoffs",       value: kpis.openHandoffs,         hint: "cross-department",   icon: CalendarClock,  tone: "violet", to: "/case-manager/scheduling" },
    { title: "Open escalations",    value: kpis.openEscalations,      hint: "needs coordination", icon: Flame,          tone: "alert",  to: "/case-manager/escalations" },
  ];

  const upcomingFollowUps = [...followUps]
    .filter((f) => f.status === "open" && f.due_at)
    .sort((a, b) => new Date(a.due_at as string).getTime() - new Date(b.due_at as string).getTime())
    .slice(0, 5);

  const recentComms = communications.slice(0, 4);
  const recentEscalations = escalations.filter((e) => !["resolved", "closed"].includes(e.status)).slice(0, 3);
  const attentionFamilies = assignments.slice(0, 4);

  return (
    <OSShell>
      {/* HERO */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[hsl(330_100%_98%)] via-white to-[hsl(265_100%_98%)] p-6 md:p-8 shadow-[0_18px_50px_-30px_hsl(330_40%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[hsl(330_100%_92%)]/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-24 h-52 w-52 rounded-full bg-[hsl(265_100%_94%)]/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(330_70%_55%)]">Case Manager · Family Relationship Hub</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[36px]">{greeting()}.</h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">{today()} — here's what gently needs your attention today.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {[
                { label: "Follow-ups due",    value: kpis.followUpsDueThisWeek },
                { label: "Awaiting response", value: kpis.awaitingCommResponse },
                { label: "Service issues",    value: kpis.openServiceIssues },
                { label: "Escalations",       value: kpis.openEscalations },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 backdrop-blur">
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-foreground/90">
                    {loading ? "—" : s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[hsl(210_60%_88%)] bg-white/80 px-3 py-1.5 text-[11.5px] font-medium text-[hsl(210_60%_45%)] backdrop-blur md:self-end">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading case data
            </div>
          ) : (
            <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[hsl(160_50%_82%)] bg-white/80 px-3 py-1.5 text-[11.5px] font-medium text-[hsl(165_55%_32%)] backdrop-blur md:self-end">
              <span className="h-2 w-2 rounded-full bg-[hsl(160_60%_55%)]" /> Live · Blossom OS
            </div>
          )}
        </div>
        {error ? (
          <p className="relative mt-4 rounded-xl border border-[hsl(10_85%_88%)] bg-[hsl(10_85%_98%)] px-3 py-2 text-[12px] text-[hsl(10_75%_40%)]">
            {error}
          </p>
        ) : null}
      </header>

      {/* SNAPSHOT */}
      <section className="mt-6">
        <SectionHeader title="Operational snapshot" hint="A calm, glanceable view of what's moving today." />
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {snapshot.map((s) => (
            <Link
              to={s.to}
              key={s.title}
              className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-3.5 shadow-[0_6px_20px_-16px_hsl(265_50%_40%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${TONE[s.tone]}`}>
                <s.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <p className="mt-2.5 text-[12px] font-medium text-muted-foreground">{s.title}</p>
              <p className="mt-0.5 text-[22px] font-semibold tracking-tight text-foreground/90">
                {loading ? "—" : s.value}
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">{s.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAMILIES + COMMS */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeader title="Assigned families" hint="People — not tickets. Surfaced with care." action="Open all" actionTo="/case-manager/families" />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {attentionFamilies.length === 0 ? (
              <EmptyBlock icon={HeartHandshake} title="No assigned families yet" hint="Ops leadership can route caseload from the assignments view." />
            ) : attentionFamilies.map((f) => {
              const label = f.client_name ?? "Unnamed client";
              const initials = label.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link
                  to={`/case-manager/families?client=${f.client_id ?? ""}`}
                  key={f.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_8px_24px_-18px_hsl(330_40%_45%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[hsl(330_100%_96%)] to-[hsl(20_100%_96%)] text-[12px] font-semibold text-[hsl(330_60%_50%)]">
                      {initials || "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13.5px] font-semibold tracking-tight">{label}</p>
                        {f.state ? <ToneBadge tone="calm">{f.state}</ToneBadge> : null}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {f.centralreach_client_id ? `CR ID · ${f.centralreach_client_id}` : "CentralReach not linked"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <ToneBadge tone={f.is_primary ? "warm" : "cool"}>{f.is_primary ? "Primary" : "Secondary"}</ToneBadge>
                        <span className="text-[10.5px] text-muted-foreground">
                          Source · {f.centralreach_sync_status === "synced" ? "CentralReach" : "Blossom OS"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> Relationship</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Scheduling</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Staffing</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader title="Parent communication" hint="Conversations that need warmth." action="Open inbox" actionTo="/case-manager/communication" />
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_8px_24px_-18px_hsl(210_50%_40%/0.18)] backdrop-blur-md">
            {recentComms.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-4 w-4" /> No parent communications logged yet.
              </div>
            ) : recentComms.map((m, i) => {
              const name = m.contact_name ?? m.client_name ?? "Family contact";
              return (
                <div key={m.id} className={`flex items-start gap-3 p-3.5 ${i < recentComms.length - 1 ? "border-b border-border/60" : ""}`}>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[hsl(210_100%_94%)] to-[hsl(265_100%_96%)] text-[11px] font-semibold text-[hsl(210_70%_45%)]">
                    {name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "—"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px] font-semibold">{name}</p>
                      <span className="shrink-0 text-[10.5px] text-muted-foreground">
                        {new Date(m.occurred_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">{m.summary}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <ToneBadge tone="cool">{m.channel} · {m.direction}</ToneBadge>
                      {m.needs_followup ? <ToneBadge tone="amber">Follow-up needed</ToneBadge> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* CROSS-DEPT LINKS */}
      <section className="mt-8">
        <SectionHeader title="Cross-department visibility" hint="Handoff and coordination surfaces around your families." />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { title: "Scheduling coordination", to: "/case-manager/scheduling",     icon: CalendarClock, tone: "cool"   },
            { title: "Staffing coordination",   to: "/case-manager/staffing",       icon: UserCheck,     tone: "violet" },
            { title: "Authorizations",          to: "/case-manager/authorizations", icon: ShieldCheck,   tone: "amber"  },
          ].map((c) => (
            <Link
              to={c.to}
              key={c.title}
              className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_8px_24px_-18px_hsl(265_50%_40%/0.16)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${TONE[c.tone]}`}>
                    <c.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <p className="text-[13.5px] font-semibold tracking-tight">{c.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-[12px] text-muted-foreground">
                Visibility plus request/handoff — Case Managers coordinate, other teams execute.
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ESCALATIONS + QUICK ACTIONS */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeader title="Escalations & risks" hint="Calmly tracked. Nothing slips." action="Open queue" actionTo="/case-manager/escalations" />
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_8px_24px_-18px_hsl(10_50%_45%/0.18)] backdrop-blur-md">
            {recentEscalations.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-4 w-4" /> No open escalations. You're all caught up.
              </div>
            ) : recentEscalations.map((e, i) => {
              const toneKey = e.severity === "urgent" || e.severity === "high" ? "alert" : e.severity === "low" ? "calm" : "amber";
              return (
                <div key={e.id} className={`flex items-center gap-3 p-4 ${i < recentEscalations.length - 1 ? "border-b border-border/60" : ""}`}>
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${TONE[toneKey]}`}>
                    <Flame className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ToneBadge tone={toneKey}>{e.severity}</ToneBadge>
                      <p className="truncate text-[13px] font-semibold">{e.reason}</p>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {e.client_name ?? "Unassigned client"} · {e.status} · opened {new Date(e.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader title="Quick actions" hint="One tap to the next right step." />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 p-3 text-left shadow-[0_6px_18px_-14px_hsl(265_50%_40%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(330_80%_88%)]"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[hsl(330_100%_96%)] to-[hsl(265_100%_97%)] text-[hsl(330_60%_50%)]">
                  <a.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="text-[12.5px] font-medium tracking-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* UPCOMING FOLLOW-UPS */}
      <section className="mt-8 mb-2">
        <SectionHeader title="Upcoming follow-ups" hint="A gentle timeline of what's next." action="Open all" actionTo="/case-manager/follow-ups" />
        <div className="mt-3 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_8px_24px_-18px_hsl(210_50%_40%/0.16)] backdrop-blur-md">
          {upcomingFollowUps.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Inbox className="mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-[13px] text-foreground/80">No follow-ups scheduled.</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">Create one from the Follow-Ups page.</p>
              <Link to="/case-manager/follow-ups" className="mt-3 text-[12px] font-medium text-[hsl(330_60%_50%)] underline-offset-4 hover:underline">
                Open Follow-Ups →
              </Link>
            </div>
          ) : (
            <ol className="relative space-y-4 border-l border-border/60 pl-5">
              {upcomingFollowUps.map((t) => (
                <li key={t.id} className="relative">
                  <span className="absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full border border-white bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(330_85%_70%)] shadow-[0_0_0_3px_hsl(265_100%_97%)]" />
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {t.due_at ? new Date(t.due_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "No due date"}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold tracking-tight">{t.title}</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {t.client_name ?? "No client linked"} · {t.category.replace(/_/g, " ")}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </OSShell>
  );
}