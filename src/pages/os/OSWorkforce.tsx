import { useMemo, useState } from "react";
import {
  Users, UserCog, UserPlus, Search, Filter, Download, FileText, CalendarDays,
  ClipboardCheck, AlertTriangle, ShieldAlert, Sparkles, ChevronRight, MapPin,
  CheckCircle2, Activity, Bot, PlusCircle, ArrowRight, Briefcase, GraduationCap,
  Clock, Flame, Inbox,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

/* ----------------- design atoms ----------------- */

const STATE_NAMES: Record<string, string> = {
  NC: "North Carolina", GA: "Georgia", VA: "Virginia", TN: "Tennessee", MD: "Maryland",
};
const REGIONS_BY_STATE: Record<string, string[]> = {
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham"],
  GA: ["Atlanta", "Savannah", "Augusta", "Columbus"],
  VA: ["Richmond", "Norfolk", "Arlington", "Roanoke"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  MD: ["Baltimore", "Bethesda", "Annapolis", "Frederick"],
};

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/70 bg-white/80 backdrop-blur",
        "shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_22px_50px_-34px_hsl(220_40%_30%/0.18)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({ icon: Icon, title, sub, action }: {
  icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(210_85%_96%)] to-white text-[hsl(212_70%_45%)] ring-1 ring-[hsl(210_60%_88%)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-[15.5px] font-semibold tracking-tight leading-tight">{title}</h3>
          {sub && <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-snug">{sub}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

type Tone = "ok" | "warn" | "bad" | "neutral";
const toneText: Record<Tone, string> = {
  ok: "text-[hsl(155_55%_38%)]",
  warn: "text-[hsl(28_85%_45%)]",
  bad: "text-[hsl(355_72%_52%)]",
  neutral: "text-foreground",
};
const tonePill: Record<Tone, string> = {
  ok: "bg-[hsl(150_70%_94%)] text-[hsl(155_55%_32%)]",
  warn: "bg-[hsl(40_100%_94%)] text-[hsl(30_80%_42%)]",
  bad: "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_48%)]",
  neutral: "bg-foreground/[0.05] text-foreground/70",
};
const toneDot: Record<Tone, string> = {
  ok: "bg-[hsl(150_60%_45%)]",
  warn: "bg-[hsl(30_90%_55%)]",
  bad: "bg-[hsl(355_75%_55%)]",
  neutral: "bg-foreground/40",
};

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", tonePill[tone])}>{children}</span>;
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-foreground/75 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-white hover:text-foreground"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function HeaderButton({ icon: Icon, label, primary }: { icon: React.ComponentType<{ className?: string }>; label: string; primary?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition hover:-translate-y-0.5",
        primary
          ? "bg-foreground text-background shadow-[0_8px_24px_-12px_hsl(220_40%_20%/0.5)] hover:bg-foreground/90"
          : "border border-foreground/10 bg-white/70 text-foreground/80 hover:bg-white hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ----------------- data shapes ----------------- */

type BCBAStatus = "Healthy" | "Near Capacity" | "Overloaded" | "Needs Attention";
type RBTStatus = "Healthy" | "Underutilized" | "Needs Support" | "At Risk";

type BCBA = {
  id: string; name: string; region: string;
  caseload: number; capacity: number;
  hours: number; supervisionPct: number; overduePR: number;
  staffingGaps: number; status: BCBAStatus;
  clients: { name: string; hours: number; risk: "ok" | "watch" | "risk" }[];
  authRisks: number; trainingComplete: number; onboarding: "complete" | "in-progress";
};

type RBT = {
  id: string; name: string; region: string;
  bcba: string; clients: number; scheduledHours: number; targetHours: number;
  utilization: number; trainingComplete: number; supervisionDue: boolean;
  status: RBTStatus;
  upcoming: { day: string; client: string; hours: number }[];
  attendanceConcerns: number; onboarding: "complete" | "in-progress";
};

function statusToBcbaTone(s: BCBAStatus): Tone {
  if (s === "Healthy") return "ok";
  if (s === "Near Capacity") return "warn";
  if (s === "Overloaded") return "bad";
  return "warn";
}
function statusToRbtTone(s: RBTStatus): Tone {
  if (s === "Healthy") return "ok";
  if (s === "Underutilized") return "neutral";
  if (s === "Needs Support") return "warn";
  return "bad";
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

/* ----------------- mock data scoped by state ----------------- */

function buildBcbas(state: string): BCBA[] {
  const r = REGIONS_BY_STATE[state] ?? REGIONS_BY_STATE.NC;
  return [
    { id: "b1", name: "Dr. Maya Patel", region: r[0], caseload: 14, capacity: 12, hours: 38.5,
      supervisionPct: 78, overduePR: 3, staffingGaps: 2, status: "Overloaded",
      authRisks: 2, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "J. Carter", hours: 18, risk: "risk" },
        { name: "A. Mendez", hours: 22, risk: "watch" },
        { name: "T. Nguyen", hours: 14, risk: "ok" },
        { name: "S. Rivera", hours: 20, risk: "watch" },
      ] },
    { id: "b2", name: "Jordan Lee, BCBA", region: r[1], caseload: 11, capacity: 12, hours: 34,
      supervisionPct: 92, overduePR: 0, staffingGaps: 0, status: "Healthy",
      authRisks: 0, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "M. Brooks", hours: 16, risk: "ok" },
        { name: "E. Tran", hours: 18, risk: "ok" },
        { name: "L. Kim", hours: 12, risk: "ok" },
      ] },
    { id: "b3", name: "Camila Ortiz, BCBA", region: r[2], caseload: 12, capacity: 12, hours: 36.2,
      supervisionPct: 84, overduePR: 1, staffingGaps: 1, status: "Near Capacity",
      authRisks: 1, trainingComplete: 90, onboarding: "complete",
      clients: [
        { name: "R. Patel", hours: 20, risk: "watch" },
        { name: "D. Foster", hours: 16, risk: "ok" },
      ] },
    { id: "b4", name: "Marcus Hill, BCBA", region: r[3], caseload: 9, capacity: 12, hours: 28,
      supervisionPct: 65, overduePR: 2, staffingGaps: 0, status: "Needs Attention",
      authRisks: 0, trainingComplete: 80, onboarding: "complete",
      clients: [
        { name: "K. Wallace", hours: 14, risk: "watch" },
        { name: "P. Singh", hours: 14, risk: "ok" },
      ] },
    { id: "b5", name: "Priya Shah, BCBA", region: r[0], caseload: 13, capacity: 12, hours: 37,
      supervisionPct: 88, overduePR: 0, staffingGaps: 1, status: "Near Capacity",
      authRisks: 1, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "I. Khan", hours: 18, risk: "ok" },
        { name: "B. Cole", hours: 19, risk: "watch" },
      ] },
  ];
}

function buildRbts(state: string): RBT[] {
  const r = REGIONS_BY_STATE[state] ?? REGIONS_BY_STATE.NC;
  return [
    { id: "r1", name: "Ava Thompson", region: r[0], bcba: "Dr. Maya Patel",
      clients: 3, scheduledHours: 32, targetHours: 32, utilization: 100,
      trainingComplete: 100, supervisionDue: false, status: "Healthy",
      upcoming: [{ day: "Mon", client: "J. Carter", hours: 4 }, { day: "Tue", client: "A. Mendez", hours: 3 }],
      attendanceConcerns: 0, onboarding: "complete" },
    { id: "r2", name: "Diego Ramirez", region: r[1], bcba: "Jordan Lee, BCBA",
      clients: 2, scheduledHours: 18, targetHours: 30, utilization: 60,
      trainingComplete: 100, supervisionDue: false, status: "Underutilized",
      upcoming: [{ day: "Mon", client: "M. Brooks", hours: 3 }],
      attendanceConcerns: 0, onboarding: "complete" },
    { id: "r3", name: "Sara Bennett", region: r[2], bcba: "Camila Ortiz, BCBA",
      clients: 3, scheduledHours: 28, targetHours: 32, utilization: 88,
      trainingComplete: 85, supervisionDue: true, status: "Needs Support",
      upcoming: [{ day: "Tue", client: "R. Patel", hours: 4 }, { day: "Wed", client: "D. Foster", hours: 3 }],
      attendanceConcerns: 1, onboarding: "complete" },
    { id: "r4", name: "Noah Kim", region: r[3], bcba: "Marcus Hill, BCBA",
      clients: 2, scheduledHours: 12, targetHours: 30, utilization: 40,
      trainingComplete: 70, supervisionDue: true, status: "At Risk",
      upcoming: [{ day: "Thu", client: "K. Wallace", hours: 3 }],
      attendanceConcerns: 2, onboarding: "in-progress" },
    { id: "r5", name: "Hannah Foster", region: r[0], bcba: "Priya Shah, BCBA",
      clients: 3, scheduledHours: 30, targetHours: 32, utilization: 94,
      trainingComplete: 100, supervisionDue: false, status: "Healthy",
      upcoming: [{ day: "Mon", client: "I. Khan", hours: 4 }],
      attendanceConcerns: 0, onboarding: "complete" },
    { id: "r6", name: "Liam Garcia", region: r[1], bcba: "Jordan Lee, BCBA",
      clients: 1, scheduledHours: 10, targetHours: 25, utilization: 40,
      trainingComplete: 95, supervisionDue: false, status: "Underutilized",
      upcoming: [{ day: "Wed", client: "E. Tran", hours: 3 }],
      attendanceConcerns: 0, onboarding: "complete" },
  ];
}

function buildStaffingNeeds(state: string) {
  const r = REGIONS_BY_STATE[state] ?? REGIONS_BY_STATE.NC;
  return [
    { id: "s1", client: "J. Carter", region: r[0], hoursNeeded: 8, need: "RBT", urgency: "critical" as const, owner: "Scheduling" },
    { id: "s2", client: "K. Wallace", region: r[3], hoursNeeded: 12, need: "RBT", urgency: "high" as const, owner: "Recruiting" },
    { id: "s3", client: "T. Nguyen", region: r[0], hoursNeeded: 6, need: "Partial", urgency: "watch" as const, owner: "Scheduling" },
    { id: "s4", client: "L. Kim", region: r[1], hoursNeeded: 20, need: "BCBA", urgency: "high" as const, owner: "Staffing" },
    { id: "s5", client: "B. Cole", region: r[2], hoursNeeded: 4, need: "Partial", urgency: "watch" as const, owner: "Scheduling" },
  ];
}

function buildRisks(state: string) {
  const r = REGIONS_BY_STATE[state] ?? REGIONS_BY_STATE.NC;
  return [
    { id: "k1", kind: "Overdue PRs", staff: "Dr. Maya Patel", region: r[0], detail: "3 PRs > 7 days", tone: "bad" as Tone, icon: FileText },
    { id: "k2", kind: "Missing Supervision", staff: "Sara Bennett", region: r[2], detail: "Supervision overdue by 5 days", tone: "warn" as Tone, icon: ClipboardCheck },
    { id: "k3", kind: "BCBA Overload", staff: "Dr. Maya Patel", region: r[0], detail: "Caseload 14/12", tone: "bad" as Tone, icon: Flame },
    { id: "k4", kind: "Underutilized RBT", staff: "Diego Ramirez", region: r[1], detail: "60% utilization · 12 hrs available", tone: "neutral" as Tone, icon: Clock },
    { id: "k5", kind: "Onboarding Incomplete", staff: "Noah Kim", region: r[3], detail: "Orientation outstanding > 10 days", tone: "warn" as Tone, icon: Briefcase },
    { id: "k6", kind: "Training Overdue", staff: "Sara Bennett", region: r[2], detail: "2 modules past due", tone: "warn" as Tone, icon: GraduationCap },
  ];
}

/* ----------------- main page ----------------- */

export default function OSWorkforce() {
  const { activeState } = useOSRole();
  const state = activeState ?? "NC";
  const stateName = STATE_NAMES[state] ?? state;

  const bcbas = useMemo(() => buildBcbas(state), [state]);
  const rbts = useMemo(() => buildRbts(state), [state]);
  const needs = useMemo(() => buildStaffingNeeds(state), [state]);
  const risks = useMemo(() => buildRisks(state), [state]);

  const [query, setQuery] = useState("");
  const [selectedBcba, setSelectedBcba] = useState<BCBA | null>(null);
  const [selectedRbt, setSelectedRbt] = useState<RBT | null>(null);

  const q = query.trim().toLowerCase();
  const filteredBcbas = q ? bcbas.filter(b => `${b.name} ${b.region}`.toLowerCase().includes(q)) : bcbas;
  const filteredRbts = q ? rbts.filter(b => `${b.name} ${b.region} ${b.bcba}`.toLowerCase().includes(q)) : rbts;

  const kpis = useMemo(() => {
    const overloaded = bcbas.filter(b => b.status === "Overloaded").length;
    const supervisionRisks = rbts.filter(r => r.supervisionDue).length + bcbas.filter(b => b.supervisionPct < 80).length;
    return {
      bcbas: bcbas.length,
      rbts: rbts.length,
      awaiting: needs.length,
      overloaded,
      openRbtPositions: 4,
      supervisionRisks,
    };
  }, [bcbas, rbts, needs]);

  return (
    <OSShell>
      <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[hsl(220_50%_98%)] via-white to-[hsl(220_50%_98%)] pb-20">
        {/* ambient gradient */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_20%_0%,hsl(210_90%_94%)_0%,transparent_60%),radial-gradient(50%_50%_at_85%_0%,hsl(265_90%_96%)_0%,transparent_55%)]" />

        <div className="relative mx-auto max-w-[1440px] px-6 pt-6">
          {/* HEADER */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {stateName} · Workforce Operations
              </div>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight leading-tight">BCBA / RBT</h1>
              <p className="mt-1 text-[13px] text-muted-foreground max-w-2xl">
                Manage staffing health, caseload support, supervision, and operational workforce visibility.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <HeaderButton icon={PlusCircle} label="Add Staff Note" />
              <HeaderButton icon={CalendarDays} label="Open Scheduling" />
              <HeaderButton icon={UserPlus} label="Open Recruiting" />
              <HeaderButton icon={Download} label="Export" />
              <HeaderButton icon={Filter} label="Filters" />
            </div>
          </div>

          {/* SEARCH */}
          <div className="mt-5">
            <Card className="px-4 py-3 flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search BCBAs, RBTs, clients, regions…"
                className="border-0 bg-transparent focus-visible:ring-0 px-0 text-[13px]"
              />
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <kbd className="rounded-md border border-foreground/10 bg-white/80 px-1.5 py-0.5">⌘</kbd>
                <kbd className="rounded-md border border-foreground/10 bg-white/80 px-1.5 py-0.5">K</kbd>
              </div>
            </Card>
          </div>

          {/* KPIs */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <KpiCard label="Active BCBAs" value={kpis.bcbas} hint={`${bcbas.filter(b=>b.status==="Healthy").length} healthy`} tone="ok" icon={UserCog} />
            <KpiCard label="Active RBTs" value={kpis.rbts} hint={`${rbts.filter(r=>r.status==="Healthy").length} healthy`} tone="ok" icon={Users} />
            <KpiCard label="Clients Awaiting Staffing" value={kpis.awaiting} hint="12 clients awaiting RBT staffing" tone="warn" icon={Inbox} />
            <KpiCard label="Overloaded BCBAs" value={kpis.overloaded} hint={`${kpis.overloaded} over target caseload`} tone="bad" icon={Flame} />
            <KpiCard label="Open RBT Positions" value={kpis.openRbtPositions} hint="Recruiting in progress" tone="warn" icon={UserPlus} />
            <KpiCard label="Supervision Risks" value={kpis.supervisionRisks} hint="Behind on cadence" tone="warn" icon={ShieldAlert} />
          </div>

          {/* MAIN GRID */}
          <div className="mt-6 grid grid-cols-12 gap-5">
            {/* BCBA OVERVIEW */}
            <Card className="col-span-12 xl:col-span-6 pb-5">
              <SectionHeader
                icon={UserCog} title="BCBA Overview"
                sub={`${bcbas.length} BCBAs across ${stateName}`}
                action={<button className="text-[11.5px] font-semibold text-foreground/60 hover:text-foreground inline-flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></button>}
              />
              <div className="mt-4 px-5 space-y-3">
                {filteredBcbas.map((b) => (
                  <BcbaCard key={b.id} b={b} onOpen={() => setSelectedBcba(b)} />
                ))}
              </div>
            </Card>

            {/* RBT OVERVIEW */}
            <Card className="col-span-12 xl:col-span-6 pb-5">
              <SectionHeader
                icon={Users} title="RBT Overview"
                sub={`${rbts.length} RBTs across ${stateName}`}
                action={<button className="text-[11.5px] font-semibold text-foreground/60 hover:text-foreground inline-flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></button>}
              />
              <div className="mt-4 px-5 space-y-3">
                {filteredRbts.map((r) => (
                  <RbtCard key={r.id} r={r} onOpen={() => setSelectedRbt(r)} />
                ))}
              </div>
            </Card>

            {/* STAFFING NEEDS */}
            <Card className="col-span-12 lg:col-span-7 pb-5">
              <SectionHeader
                icon={Inbox} title="Staffing Needs"
                sub="Clients waiting on BCBA, RBT, or partial coverage"
              />
              <div className="mt-4 px-5 space-y-2">
                {needs.map((n) => {
                  const tone: Tone = n.urgency === "critical" ? "bad" : n.urgency === "high" ? "warn" : "neutral";
                  return (
                    <div key={n.id} className="group flex items-center justify-between gap-3 rounded-xl border border-foreground/[0.06] bg-white/70 px-4 py-3 hover:bg-white transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", toneDot[tone])} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold tracking-tight truncate">{n.client}</p>
                          <p className="text-[11.5px] text-muted-foreground truncate">{n.region} · {n.hoursNeeded} hrs needed · owner {n.owner}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Pill tone={tone === "bad" ? "bad" : tone === "warn" ? "warn" : "neutral"}>{n.need}</Pill>
                        <QuickAction icon={CalendarDays} label="Schedule" />
                        <QuickAction icon={UserPlus} label="Recruit" />
                        <QuickAction icon={ShieldAlert} label="Escalate" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* OPERATIONAL RISKS */}
            <Card className="col-span-12 lg:col-span-5 pb-5">
              <SectionHeader icon={AlertTriangle} title="Operational Risks" sub="Items to resolve this week" />
              <div className="mt-4 px-5 grid grid-cols-1 gap-2">
                {risks.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-foreground/[0.06] bg-white/70 px-3.5 py-2.5 hover:bg-white transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("grid h-8 w-8 place-items-center rounded-lg ring-1", 
                        r.tone === "bad" ? "bg-[hsl(355_100%_96%)] text-[hsl(355_72%_50%)] ring-[hsl(355_70%_88%)]" :
                        r.tone === "warn" ? "bg-[hsl(40_100%_95%)] text-[hsl(30_85%_45%)] ring-[hsl(30_80%_85%)]" :
                        "bg-[hsl(220_60%_96%)] text-[hsl(220_60%_45%)] ring-[hsl(220_50%_88%)]"
                      )}>
                        <r.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold tracking-tight truncate">{r.kind}</p>
                        <p className="text-[11.5px] text-muted-foreground truncate">{r.staff} · {r.region} · {r.detail}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground/40" />
                  </div>
                ))}
              </div>
            </Card>

            {/* AI INSIGHTS */}
            <Card className="col-span-12 pb-5 relative overflow-hidden">
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(40%_60%_at_100%_0%,hsl(265_90%_94%)_0%,transparent_60%)]" />
              <div className="relative">
                <SectionHeader
                  icon={Sparkles} title="AI Workforce Insights"
                  sub="Patterns Blossom AI is watching across your state"
                />
                <div className="mt-4 px-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
                  <AiInsight icon={Flame} tone="bad" title="BCBA caseload risk detected" detail="Dr. Maya Patel running 14/12 caseload + 3 overdue PRs." />
                  <AiInsight icon={MapPin} tone="warn" title="RBT availability low" detail={`Tight RBT coverage in ${REGIONS_BY_STATE[state]?.[0] ?? "Charlotte"} — 12 hrs unassigned.`} />
                  <AiInsight icon={FileText} tone="warn" title="2 PRs overdue > 7 days" detail="Held in QA queue. Billing impact projected." />
                  <AiInsight icon={Clock} tone="neutral" title="Underutilized RBT capacity" detail="2 RBTs available — 30 hrs of capacity to redeploy." />
                </div>
                <div className="mt-4 px-5 flex flex-wrap gap-2">
                  <QuickAction icon={ShieldAlert} label="Find Staffing Risks" />
                  <QuickAction icon={Users} label="Recommend Pairings" />
                  <QuickAction icon={Flame} label="Identify Overload" />
                  <QuickAction icon={UserPlus} label="Suggest Recruiting Focus" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FLOATING QUICK ACTIONS */}
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full border border-foreground/10 bg-white/90 px-2 py-1.5 backdrop-blur-xl shadow-[0_22px_60px_-26px_hsl(220_40%_30%/0.45)]">
            <FloatBtn icon={CalendarDays} label="Scheduling" />
            <FloatBtn icon={UserPlus} label="Recruiting" />
            <FloatBtn icon={ClipboardCheck} label="Staffing Task" />
            <FloatBtn icon={PlusCircle} label="Add Note" />
            <FloatBtn icon={FileText} label="Reports" />
          </div>
        </div>

        {/* DRAWERS */}
        <BcbaDrawer bcba={selectedBcba} onClose={() => setSelectedBcba(null)} />
        <RbtDrawer rbt={selectedRbt} onClose={() => setSelectedRbt(null)} />
      </div>
    </OSShell>
  );
}

/* ----------------- subcomponents ----------------- */

function KpiCard({ label, value, hint, tone, icon: Icon }: {
  label: string; value: number | string; hint?: string; tone: Tone; icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-4 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className={cn("mt-2 text-[26px] font-semibold tabular-nums leading-none tracking-tight", toneText[tone])}>{value}</p>
          {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("grid h-8 w-8 place-items-center rounded-xl ring-1",
          tone === "ok" ? "bg-[hsl(150_70%_95%)] text-[hsl(155_55%_35%)] ring-[hsl(150_50%_85%)]" :
          tone === "warn" ? "bg-[hsl(40_100%_95%)] text-[hsl(30_85%_42%)] ring-[hsl(30_80%_85%)]" :
          tone === "bad" ? "bg-[hsl(355_100%_96%)] text-[hsl(355_72%_50%)] ring-[hsl(355_70%_88%)]" :
          "bg-foreground/[0.04] text-foreground/70 ring-foreground/10"
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

function CapacityBar({ value, capacity, tone }: { value: number; capacity: number; tone: Tone }) {
  const pct = Math.min(100, Math.round((value / capacity) * 100));
  return (
    <div className="w-full">
      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", 
          tone === "bad" ? "bg-[hsl(355_75%_55%)]" :
          tone === "warn" ? "bg-[hsl(30_90%_55%)]" :
          "bg-[hsl(150_60%_45%)]")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BcbaCard({ b, onOpen }: { b: BCBA; onOpen: () => void }) {
  const tone = statusToBcbaTone(b.status);
  return (
    <button onClick={onOpen}
      className="w-full text-left rounded-2xl border border-foreground/[0.06] bg-gradient-to-b from-white to-white/70 p-4 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-26px_hsl(220_40%_30%/0.25)] transition">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 ring-1 ring-foreground/10">
          <AvatarFallback className="bg-gradient-to-br from-[hsl(210_85%_94%)] to-[hsl(265_85%_96%)] text-[hsl(212_70%_40%)] font-semibold text-[12px]">{initials(b.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold tracking-tight truncate">{b.name}</p>
            <Pill tone={tone}><span className={cn("h-1.5 w-1.5 rounded-full", toneDot[tone])} />{b.status}</Pill>
          </div>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">{b.region} · {b.hours} hrs this week</p>

          <div className="mt-3 grid grid-cols-4 gap-3 text-[11px]">
            <Metric label="Caseload" value={`${b.caseload}/${b.capacity}`} tone={tone} />
            <Metric label="Supervision" value={`${b.supervisionPct}%`} tone={b.supervisionPct >= 85 ? "ok" : "warn"} />
            <Metric label="Overdue PRs" value={b.overduePR} tone={b.overduePR === 0 ? "ok" : b.overduePR > 2 ? "bad" : "warn"} />
            <Metric label="Staffing Gaps" value={b.staffingGaps} tone={b.staffingGaps === 0 ? "ok" : "warn"} />
          </div>

          <div className="mt-3"><CapacityBar value={b.caseload} capacity={b.capacity} tone={tone} /></div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <QuickAction icon={Users} label="Caseload" />
            <QuickAction icon={FileText} label="Review PRs" />
            <QuickAction icon={CalendarDays} label="Staffing" />
            <QuickAction icon={PlusCircle} label="Add Note" />
          </div>
        </div>
      </div>
    </button>
  );
}

function RbtCard({ r, onOpen }: { r: RBT; onOpen: () => void }) {
  const tone = statusToRbtTone(r.status);
  return (
    <button onClick={onOpen}
      className="w-full text-left rounded-2xl border border-foreground/[0.06] bg-gradient-to-b from-white to-white/70 p-4 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-26px_hsl(220_40%_30%/0.25)] transition">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 ring-1 ring-foreground/10">
          <AvatarFallback className="bg-gradient-to-br from-[hsl(155_70%_94%)] to-[hsl(210_85%_96%)] text-[hsl(155_55%_35%)] font-semibold text-[12px]">{initials(r.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold tracking-tight truncate">{r.name}</p>
            <Pill tone={tone}><span className={cn("h-1.5 w-1.5 rounded-full", toneDot[tone])} />{r.status}</Pill>
          </div>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">{r.region} · BCBA {r.bcba}</p>

          <div className="mt-3 grid grid-cols-4 gap-3 text-[11px]">
            <Metric label="Clients" value={r.clients} tone="neutral" />
            <Metric label="Hours" value={`${r.scheduledHours}/${r.targetHours}`} tone={r.utilization >= 85 ? "ok" : r.utilization >= 60 ? "warn" : "bad"} />
            <Metric label="Utilization" value={`${r.utilization}%`} tone={r.utilization >= 85 ? "ok" : r.utilization >= 60 ? "warn" : "bad"} />
            <Metric label="Training" value={`${r.trainingComplete}%`} tone={r.trainingComplete >= 95 ? "ok" : "warn"} />
          </div>

          <div className="mt-3"><CapacityBar value={r.scheduledHours} capacity={r.targetHours} tone={tone === "neutral" ? "warn" : tone} /></div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <QuickAction icon={CalendarDays} label="Schedule" />
            <QuickAction icon={Users} label="Staffing" />
            <QuickAction icon={GraduationCap} label="Training" />
            <QuickAction icon={PlusCircle} label="Add Note" />
          </div>
        </div>
      </div>
    </button>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: Tone }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-[13px] font-semibold tabular-nums tracking-tight", toneText[tone])}>{value}</p>
    </div>
  );
}

function AiInsight({ icon: Icon, title, detail, tone }: {
  icon: React.ComponentType<{ className?: string }>; title: string; detail: string; tone: Tone;
}) {
  return (
    <div className="rounded-xl border border-foreground/[0.06] bg-white/70 p-3 hover:bg-white transition">
      <div className="flex items-start gap-2.5">
        <div className={cn("grid h-7 w-7 place-items-center rounded-lg ring-1",
          tone === "bad" ? "bg-[hsl(355_100%_96%)] text-[hsl(355_72%_50%)] ring-[hsl(355_70%_88%)]" :
          tone === "warn" ? "bg-[hsl(40_100%_95%)] text-[hsl(30_85%_45%)] ring-[hsl(30_80%_85%)]" :
          "bg-[hsl(265_90%_96%)] text-[hsl(265_70%_50%)] ring-[hsl(265_60%_88%)]"
        )}><Icon className="h-3.5 w-3.5" /></div>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function FloatBtn({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-foreground/75 hover:bg-foreground/[0.04] hover:text-foreground transition">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ----------------- drawers ----------------- */

function BcbaDrawer({ bcba, onClose }: { bcba: BCBA | null; onClose: () => void }) {
  const open = !!bcba;
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto bg-gradient-to-b from-white to-[hsl(220_50%_98%)]">
        {bcba && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-1 ring-foreground/10">
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(210_85%_94%)] to-[hsl(265_85%_96%)] text-[hsl(212_70%_40%)] font-semibold">{initials(bcba.name)}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-[15px] font-semibold tracking-tight">{bcba.name}</p>
                  <p className="text-[11.5px] font-normal text-muted-foreground">{bcba.region} · BCBA</p>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-4 gap-3">
              <Metric label="Caseload" value={`${bcba.caseload}/${bcba.capacity}`} tone={statusToBcbaTone(bcba.status)} />
              <Metric label="Supervision" value={`${bcba.supervisionPct}%`} tone={bcba.supervisionPct >= 85 ? "ok" : "warn"} />
              <Metric label="Overdue PRs" value={bcba.overduePR} tone={bcba.overduePR === 0 ? "ok" : "bad"} />
              <Metric label="Auth Risks" value={bcba.authRisks} tone={bcba.authRisks === 0 ? "ok" : "warn"} />
            </div>

            <DrawerSection title="Assigned Clients">
              <div className="space-y-1.5">
                {bcba.clients.map((c) => (
                  <div key={c.name} className="flex items-center justify-between rounded-lg border border-foreground/[0.06] bg-white/70 px-3 py-2">
                    <p className="text-[12.5px] font-semibold tracking-tight">{c.name}</p>
                    <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                      <span>{c.hours} hrs/wk</span>
                      <Pill tone={c.risk === "risk" ? "bad" : c.risk === "watch" ? "warn" : "ok"}>{c.risk}</Pill>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection title="Operational Alerts">
              <ul className="space-y-1.5 text-[12.5px]">
                {bcba.overduePR > 0 && <Alert tone="bad">{bcba.overduePR} progress reports overdue</Alert>}
                {bcba.staffingGaps > 0 && <Alert tone="warn">{bcba.staffingGaps} caseload staffing gap(s)</Alert>}
                {bcba.supervisionPct < 85 && <Alert tone="warn">Supervision cadence below 85%</Alert>}
                {bcba.authRisks > 0 && <Alert tone="warn">{bcba.authRisks} authorization risk(s)</Alert>}
                {bcba.status === "Overloaded" && <Alert tone="bad">Caseload exceeds capacity</Alert>}
              </ul>
            </DrawerSection>

            <DrawerSection title="Training & Onboarding">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-muted-foreground">Training</span>
                <span className="font-semibold">{bcba.trainingComplete}% complete</span>
              </div>
              <div className="mt-1.5"><CapacityBar value={bcba.trainingComplete} capacity={100} tone={bcba.trainingComplete >= 95 ? "ok" : "warn"} /></div>
              <p className="mt-3 text-[11.5px] text-muted-foreground">Onboarding: <span className="font-semibold text-foreground">{bcba.onboarding === "complete" ? "Complete" : "In progress"}</span></p>
            </DrawerSection>

            <div className="mt-6 flex flex-wrap gap-2">
              <HeaderButton icon={CalendarDays} label="Schedule Meeting" />
              <HeaderButton icon={FileText} label="View Reports" />
              <HeaderButton icon={PlusCircle} label="Create Task" />
              <HeaderButton icon={ShieldAlert} label="Escalate" primary />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RbtDrawer({ rbt, onClose }: { rbt: RBT | null; onClose: () => void }) {
  const open = !!rbt;
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto bg-gradient-to-b from-white to-[hsl(220_50%_98%)]">
        {rbt && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-1 ring-foreground/10">
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(155_70%_94%)] to-[hsl(210_85%_96%)] text-[hsl(155_55%_35%)] font-semibold">{initials(rbt.name)}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-[15px] font-semibold tracking-tight">{rbt.name}</p>
                  <p className="text-[11.5px] font-normal text-muted-foreground">{rbt.region} · RBT · BCBA {rbt.bcba}</p>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-4 gap-3">
              <Metric label="Clients" value={rbt.clients} tone="neutral" />
              <Metric label="Hours" value={`${rbt.scheduledHours}/${rbt.targetHours}`} tone={rbt.utilization >= 85 ? "ok" : "warn"} />
              <Metric label="Utilization" value={`${rbt.utilization}%`} tone={rbt.utilization >= 85 ? "ok" : rbt.utilization >= 60 ? "warn" : "bad"} />
              <Metric label="Training" value={`${rbt.trainingComplete}%`} tone={rbt.trainingComplete >= 95 ? "ok" : "warn"} />
            </div>

            <DrawerSection title="Upcoming Schedule">
              <div className="space-y-1.5">
                {rbt.upcoming.map((u, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-foreground/[0.06] bg-white/70 px-3 py-2 text-[12.5px]">
                    <span><span className="font-semibold">{u.day}</span> · {u.client}</span>
                    <span className="text-muted-foreground">{u.hours} hrs</span>
                  </div>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection title="Supervision & Training">
              <div className="space-y-2 text-[12.5px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Supervision</span><span className={cn("font-semibold", rbt.supervisionDue ? "text-[hsl(355_72%_50%)]" : "text-[hsl(155_55%_38%)]")}>{rbt.supervisionDue ? "Overdue" : "On track"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Training</span><span className="font-semibold">{rbt.trainingComplete}% complete</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Onboarding</span><span className="font-semibold">{rbt.onboarding === "complete" ? "Complete" : "In progress"}</span></div>
              </div>
            </DrawerSection>

            <DrawerSection title="Concerns">
              <ul className="space-y-1.5 text-[12.5px]">
                {rbt.attendanceConcerns > 0 && <Alert tone="warn">{rbt.attendanceConcerns} attendance concern(s) this month</Alert>}
                {rbt.supervisionDue && <Alert tone="warn">Supervision cycle overdue</Alert>}
                {rbt.utilization < 60 && <Alert tone="neutral">Underutilized — {rbt.targetHours - rbt.scheduledHours} hrs available</Alert>}
                {rbt.onboarding !== "complete" && <Alert tone="warn">Onboarding incomplete</Alert>}
              </ul>
            </DrawerSection>

            <div className="mt-6 flex flex-wrap gap-2">
              <HeaderButton icon={CalendarDays} label="Open Schedule" />
              <HeaderButton icon={GraduationCap} label="View Trainings" />
              <HeaderButton icon={PlusCircle} label="Create Follow-Up" primary />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">{title}</p>
      {children}
    </div>
  );
}

function Alert({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2 rounded-lg px-3 py-2",
      tone === "bad" ? "bg-[hsl(355_100%_96%)] text-[hsl(355_72%_42%)]" :
      tone === "warn" ? "bg-[hsl(40_100%_95%)] text-[hsl(30_85%_38%)]" :
      "bg-foreground/[0.04] text-foreground/75")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[tone])} />
      {children}
    </li>
  );
}