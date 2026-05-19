import {
  UserPlus, Heart, CalendarDays, DollarSign, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Circle, ClipboardList, Users, FolderKanban, FileText,
  MessageSquare, BarChart3, Plus, Send, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const revenueData = [
  { d: "May 1", v: 420000 }, { d: "May 4", v: 480000 }, { d: "May 8", v: 560000 },
  { d: "May 11", v: 640000 }, { d: "May 15", v: 720000 }, { d: "May 18", v: 820000 },
  { d: "May 22", v: 940000 }, { d: "May 25", v: 1060000 }, { d: "May 29", v: 1240000 },
];

const pipeline = [
  { name: "New", value: 32, pct: 25, color: "hsl(265 85% 65%)" },
  { name: "Contacted", value: 28, pct: 22, color: "hsl(210 85% 60%)" },
  { name: "Qualified", value: 40, pct: 31, color: "hsl(330 75% 62%)" },
  { name: "Proposal", value: 18, pct: 14, color: "hsl(30 90% 60%)" },
  { name: "Won", value: 10, pct: 8, color: "hsl(155 60% 50%)" },
];

const tasks = [
  { title: "Follow up with 5 new leads", due: "Due today", priority: "High", done: false },
  { title: "BCBA interviews", due: "Due today", priority: "Medium", done: false },
  { title: "Verify insurance – 3 clients", due: "Due tomorrow", priority: "Medium", done: false },
  { title: "Intake documents review", due: "Due May 22", priority: "Low", done: false },
];

const meetings = [
  { title: "Team Standup", time: "9:00 AM – 9:30 AM", tone: "os-tone-sky" },
  { title: "Leadership Meeting", time: "11:00 AM – 12:00 PM", tone: "os-tone-violet" },
  { title: "BCBA Interviews", time: "2:00 PM – 4:00 PM", tone: "os-tone-rose" },
  { title: "Client Consult: J. Smith", time: "4:30 PM – 5:00 PM", tone: "os-tone-amber" },
];

const activity = [
  { who: "Emily R.", what: "New lead received", when: "2 min ago" },
  { who: "Jacob T.", what: "Intake completed", when: "18 min ago" },
  { who: "Olivia C.", what: "New client added", when: "1 hr ago" },
  { who: "Sarah M.", what: "RBT hired", when: "2 hr ago" },
];

const departments = [
  { name: "Intake", value: "24", hint: "Tasks in progress", trend: "+15% vs last week", up: true, icon: ClipboardList, tone: "os-tone-rose" },
  { name: "Scheduling", value: "92%", hint: "Appt. fill rate", trend: "+8% vs last week", up: true, icon: CalendarDays, tone: "os-tone-sky" },
  { name: "RBT / BCBA", value: "156", hint: "Active staff", trend: "+12% vs last week", up: true, icon: Users, tone: "os-tone-lilac" },
  { name: "Billing", value: "$320K", hint: "Unpaid claims", trend: "-5% vs last week", up: false, icon: DollarSign, tone: "os-tone-amber" },
  { name: "Case Management", value: "68", hint: "Active cases", trend: "+7% vs last week", up: true, icon: FolderKanban, tone: "os-tone-mint" },
];

const quickActions = [
  { label: "Add New Lead", icon: UserPlus, tone: "os-tone-rose" },
  { label: "Schedule Appt", icon: CalendarDays, tone: "os-tone-sky" },
  { label: "Create Client", icon: Users, tone: "os-tone-violet" },
  { label: "New Intake", icon: FileText, tone: "os-tone-amber" },
  { label: "Send Message", icon: Send, tone: "os-tone-mint" },
  { label: "Generate Report", icon: BarChart3, tone: "os-tone-lilac" },
];

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
}

function Kpi({ icon: Icon, tone, label, value, delta, up, hint }: any) {
  return (
    <div className="os-card os-rise">
      <div className="flex items-start gap-3">
        <div className={cn("os-kpi-icon", tone)}><Icon className="h-5 w-5" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[26px] font-semibold tracking-tight leading-none">{value}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-[11.5px] font-medium">
        {up ? <ArrowUpRight className="h-3.5 w-3.5 os-trend-up" /> : <ArrowDownRight className="h-3.5 w-3.5 os-trend-down" />}
        <span className={up ? "os-trend-up" : "os-trend-down"}>{delta}</span>
        <span className="text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}

export default function OSDashboard() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <OSShell
      rightRail={
        <>
          {/* My Tasks */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">My Tasks</h3>
              <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View all</button>
            </header>
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t.title} className="flex items-start gap-3">
                  <Circle className="mt-0.5 h-4 w-4 text-muted-foreground/60 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium leading-tight">{t.title}</p>
                      <span className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                        t.priority === "High" && "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_50%)]",
                        t.priority === "Medium" && "bg-[hsl(30_100%_94%)] text-[hsl(30_80%_45%)]",
                        t.priority === "Low" && "bg-[hsl(210_100%_95%)] text-[hsl(215_70%_50%)]",
                      )}>{t.priority}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{t.due}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Upcoming Calendar */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Upcoming Calendar</h3>
              <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View all</button>
            </header>
            <ul className="space-y-3">
              {meetings.map((m) => (
                <li key={m.title} className="flex items-center gap-3">
                  <div className={cn("os-kpi-icon h-10 w-10 shrink-0", m.tone)}>
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium leading-tight">{m.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{m.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Recent Activity */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Recent Activity</h3>
              <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View all</button>
            </header>
            <ul className="space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[hsl(265_70%_85%)] to-[hsl(285_70%_88%)] text-[11px] font-bold text-[hsl(265_60%_40%)]">
                    {a.who.split(" ").map((p) => p[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium leading-tight">{a.what}: <span className="text-muted-foreground">{a.who}</span></p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      }
    >
      {/* Greeting */}
      <header className="os-rise">
        <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">
          {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">Here's what's happening across Blossom today.</p>
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={UserPlus}   tone="os-tone-violet" label="New Leads"     value="128"    delta="18%" up   hint="vs last 7 days" />
        <Kpi icon={Heart}      tone="os-tone-rose"   label="Active Clients" value="842"    delta="12%" up   hint="vs last 7 days" />
        <Kpi icon={CalendarDays} tone="os-tone-sky"  label="Today's Appts" value="56"     delta="View calendar" up hint="" />
        <Kpi icon={DollarSign} tone="os-tone-mint"   label="Revenue (MTD)" value="$1.24M" delta="9%"  up   hint="vs last month" />
      </div>

      {/* Revenue + Pipeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="os-card">
          <header className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-[14px] font-semibold tracking-tight">Revenue Overview</h3>
              <p className="mt-1 text-[26px] font-semibold tracking-tight">$1,240,000</p>
              <p className="text-[11.5px] text-muted-foreground">Month to date</p>
            </div>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[12px] font-medium">This Month ▾</button>
          </header>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(265 85% 65%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(265 85% 65%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 55%)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 55%)" }} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(255 30% 92%)", boxShadow: "0 10px 30px -10px hsl(265 60% 50% / 0.2)" }}
                  formatter={(v: number) => fmtMoney(v)}
                />
                <Area type="monotone" dataKey="v" stroke="hsl(265 85% 60%)" strokeWidth={2.5} fill="url(#rev)" dot={{ r: 0 }} activeDot={{ r: 5, fill: "hsl(265 85% 60%)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="os-card">
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight">Lead Pipeline</h3>
          </header>
          <div className="flex items-center gap-4">
            <div className="relative h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pipeline} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                    {pipeline.map((p) => <Cell key={p.name} fill={p.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-[22px] font-semibold leading-none">128</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-2">
              {pipeline.map((p) => (
                <li key={p.name} className="flex items-center gap-2 text-[12.5px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="flex-1 font-medium">{p.name}</span>
                  <span className="tabular-nums text-muted-foreground">{p.value} ({p.pct}%)</span>
                </li>
              ))}
            </ul>
          </div>
          <button className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[hsl(265_70%_55%)] hover:underline">
            View full pipeline <ArrowUpRight className="h-3 w-3" />
          </button>
        </section>
      </div>

      {/* Department Overview */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">Department Overview</h3>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View all departments</button>
        </header>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {departments.map((d) => (
            <div key={d.name} className="rounded-2xl border border-white/70 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_hsl(265_60%_50%/0.25)]">
              <div className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-xl", d.tone)}>
                  <d.icon className="h-4 w-4" />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">{d.name}</span>
              </div>
              <p className="mt-3 text-[22px] font-semibold tracking-tight">{d.value}</p>
              <p className="text-[11px] text-muted-foreground">{d.hint}</p>
              <p className={cn("mt-1.5 flex items-center gap-1 text-[11px] font-medium", d.up ? "os-trend-up" : "os-trend-down")}>
                {d.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {d.trend}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">Quick Actions</h3>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((a) => (
            <button
              key={a.label}
              className="group flex flex-col items-start gap-2.5 rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_hsl(265_60%_50%/0.25)]"
            >
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl", a.tone)}>
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-[12.5px] font-semibold tracking-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </section>
    </OSShell>
  );
}