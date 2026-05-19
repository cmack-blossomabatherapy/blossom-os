import { useState, useMemo } from "react";
import {
  Users, UsersRound, UserPlus, Clock4, ShieldCheck, DollarSign,
  Plus, Filter, Download, Phone, MessageSquare, Mail, FileText, StickyNote,
  MoreHorizontal, ChevronDown, ChevronLeft, X, Sparkles, ArrowUpRight, ArrowDownRight,
  CalendarDays, ClipboardCheck, UserCog, BarChart3, Search, Grid2x2, List as ListIcon,
  CheckCircle2, AlertTriangle, Heart,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";

/* ─────────── MOCK DATA ─────────── */

type Status = "active" | "waitlist" | "inactive" | "discharged";
type AuthState = "active" | "pending" | "expired";

type Client = {
  id: string; name: string; dob: string; age: string; initials: string;
  status: Status; diagnosis: string;
  bcba: string; rbt: string; teamCount: number;
  nextApptDate: string; nextApptTime: string; nextApptWith: string;
  auth: AuthState; authExp: string; authNumber: string;
  authStart: string; authEnd: string; unitsApproved: number; unitsUsed: number;
  progress: number;
  guardian: string; phone: string; email: string; address: string;
  insurance: string; preferredStart: string;
  service: "In-Home ABA" | "Center-Based ABA" | "School / Consult" | "Other";
};

const clients: Client[] = [
  { id: "C-10234", name: "James Smith",  dob: "06/14/2019", age: "4 y/o", initials: "JS", status: "active", diagnosis: "F84.0 Autism Spectrum Disorder", bcba: "Amanda R.", rbt: "Maya P.", teamCount: 2, nextApptDate: "May 16, 2024", nextApptTime: "3:30 PM", nextApptWith: "Amanda R.", auth: "active", authExp: "07/16/24", authNumber: "AET123456789", authStart: "04/16/2024", authEnd: "07/16/2024", unitsApproved: 2400, unitsUsed: 1728, progress: 72, guardian: "Sarah Smith (Mother)", phone: "(561) 555-0123", email: "sarahsmith@email.com", address: "123 SW 2nd Ave, Boca Raton, FL 33432", insurance: "Aetna Better Health", preferredStart: "ASAP", service: "In-Home ABA" },
  { id: "C-10235", name: "Olivia Johnson", dob: "09/22/2018", age: "5 y/o", initials: "OJ", status: "active", diagnosis: "F84.0 Autism Spectrum Disorder", bcba: "David L.", rbt: "Carmen V.", teamCount: 1, nextApptDate: "May 17, 2024", nextApptTime: "10:00 AM", nextApptWith: "Carmen V.", auth: "active", authExp: "07/20/24", authNumber: "BCB987654321", authStart: "04/20/2024", authEnd: "07/20/2024", unitsApproved: 1800, unitsUsed: 1224, progress: 68, guardian: "Marcus Johnson (Father)", phone: "(561) 555-0145", email: "mjohnson@email.com", address: "742 NE 5th St, Delray Beach, FL", insurance: "BCBS Florida", preferredStart: "Next month", service: "Center-Based ABA" },
  { id: "C-10236", name: "Liam Williams", dob: "03/11/2020", age: "4 y/o", initials: "LW", status: "waitlist", diagnosis: "F84.0 Autism Spectrum Disorder", bcba: "—", rbt: "—", teamCount: 0, nextApptDate: "—", nextApptTime: "", nextApptWith: "Pending intake", auth: "pending", authExp: "Submitted 05/01", authNumber: "—", authStart: "—", authEnd: "—", unitsApproved: 0, unitsUsed: 0, progress: 0, guardian: "Tasha Williams (Mother)", phone: "(561) 555-0167", email: "twilliams@email.com", address: "98 Palmetto Park Rd, Boca Raton, FL", insurance: "Cigna", preferredStart: "ASAP", service: "In-Home ABA" },
  { id: "C-10237", name: "Noah Brown",   dob: "07/30/2019", age: "4 y/o", initials: "NB", status: "active", diagnosis: "F84.0 Autism Spectrum Disorder", bcba: "Amanda R.", rbt: "Jordan T.", teamCount: 3, nextApptDate: "May 15, 2024", nextApptTime: "1:00 PM",  nextApptWith: "Jordan T.", auth: "active", authExp: "06/30/24", authNumber: "UHC774551020", authStart: "03/30/2024", authEnd: "06/30/2024", unitsApproved: 2200, unitsUsed: 1782, progress: 81, guardian: "Erica Brown (Mother)", phone: "(561) 555-0192", email: "ericabrown@email.com", address: "411 Yamato Rd, Boca Raton, FL", insurance: "United Healthcare", preferredStart: "ASAP", service: "In-Home ABA" },
  { id: "C-10238", name: "Emma Davis",   dob: "11/05/2018", age: "5 y/o", initials: "ED", status: "active", diagnosis: "F84.1 Autism Spectrum Disorder", bcba: "Priya N.", rbt: "Sam K.", teamCount: 1, nextApptDate: "May 16, 2024", nextApptTime: "2:00 PM", nextApptWith: "Sam K.", auth: "active", authExp: "07/10/24", authNumber: "AET445520011", authStart: "04/10/2024", authEnd: "07/10/2024", unitsApproved: 2000, unitsUsed: 1300, progress: 65, guardian: "Hannah Davis (Mother)", phone: "(561) 555-0102", email: "hannahd@email.com", address: "210 Glades Rd, Boca Raton, FL", insurance: "Aetna", preferredStart: "ASAP", service: "Center-Based ABA" },
  { id: "C-10239", name: "Elijah Martinez", dob: "01/18/2020", age: "4 y/o", initials: "EM", status: "inactive", diagnosis: "F84.0 Autism Spectrum Disorder", bcba: "David L.", rbt: "—", teamCount: 2, nextApptDate: "—", nextApptTime: "", nextApptWith: "On pause", auth: "expired", authExp: "Expired 04/20/24", authNumber: "BCB221100543", authStart: "01/20/2024", authEnd: "04/20/2024", unitsApproved: 1600, unitsUsed: 1480, progress: 92, guardian: "Carlos Martinez (Father)", phone: "(561) 555-0188", email: "carlosm@email.com", address: "55 Federal Hwy, Boynton Beach, FL", insurance: "BCBS", preferredStart: "On hold", service: "School / Consult" },
  { id: "C-10240", name: "Ava Wilson",   dob: "05/27/2019", age: "4 y/o", initials: "AW", status: "active", diagnosis: "F84.0 Autism Spectrum Disorder", bcba: "Priya N.", rbt: "Maya P.", teamCount: 2, nextApptDate: "May 18, 2024", nextApptTime: "11:00 AM", nextApptWith: "Maya P.", auth: "active", authExp: "07/25/24", authNumber: "CIG998877665", authStart: "04/25/2024", authEnd: "07/25/2024", unitsApproved: 2400, unitsUsed: 1776, progress: 74, guardian: "Megan Wilson (Mother)", phone: "(561) 555-0151", email: "meganw@email.com", address: "318 Linton Blvd, Delray Beach, FL", insurance: "Cigna", preferredStart: "ASAP", service: "In-Home ABA" },
];

const distribution = [
  { name: "Active",   value: 712, pct: 85, color: "hsl(265 85% 65%)" },
  { name: "Waitlist", value: 78,  pct: 9,  color: "hsl(30 90% 60%)" },
  { name: "Inactive", value: 52,  pct: 6,  color: "hsl(220 15% 70%)" },
];

const ageBuckets = [
  { age: "0-2",  v: 56 },  { age: "3-5",  v: 198 },
  { age: "6-10", v: 264 }, { age: "11-14", v: 152 }, { age: "15+", v: 118 },
];

const services = [
  { name: "In-Home ABA",      value: 58, color: "hsl(265 85% 65%)" },
  { name: "Center-Based ABA", value: 22, color: "hsl(210 85% 60%)" },
  { name: "School / Consult", value: 12, color: "hsl(330 75% 62%)" },
  { name: "Other",            value: 8,  color: "hsl(30 90% 60%)" },
];

const tabs: { id: Status | "all"; label: string; count: number }[] = [
  { id: "all",        label: "All Clients", count: 842 },
  { id: "active",     label: "Active",      count: 712 },
  { id: "inactive",   label: "Inactive",    count: 132 },
  { id: "discharged", label: "Discharged",  count: 56 },
  { id: "waitlist",   label: "Waitlist",    count: 78 },
];

const quickActions = [
  { label: "Add New Client",    icon: UserPlus,       tone: "os-tone-violet" },
  { label: "Schedule Appt",     icon: CalendarDays,   tone: "os-tone-sky" },
  { label: "Create Intake",     icon: ClipboardCheck, tone: "os-tone-mint" },
  { label: "Verify Insurance",  icon: ShieldCheck,    tone: "os-tone-amber" },
  { label: "Assign RBT / BCBA", icon: UserCog,        tone: "os-tone-lilac" },
  { label: "View Reports",      icon: BarChart3,      tone: "os-tone-coral" },
];

/* ─────────── HELPERS ─────────── */

const avatarPalette = [
  "from-[hsl(265_80%_80%)] to-[hsl(285_80%_85%)] text-[hsl(265_60%_35%)]",
  "from-[hsl(330_80%_85%)] to-[hsl(345_80%_88%)] text-[hsl(335_60%_35%)]",
  "from-[hsl(210_80%_85%)] to-[hsl(225_80%_88%)] text-[hsl(215_60%_35%)]",
  "from-[hsl(155_60%_82%)] to-[hsl(165_60%_85%)] text-[hsl(155_50%_25%)]",
  "from-[hsl(30_90%_85%)]  to-[hsl(20_90%_88%)]  text-[hsl(25_70%_35%)]",
];
function avatarTone(s: string) {
  const sum = s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarPalette[sum % avatarPalette.length];
}

const statusPill: Record<Status, { label: string; cls: string }> = {
  active:     { label: "Active",     cls: "bg-[hsl(155_70%_92%)] text-[hsl(155_55%_30%)]" },
  waitlist:   { label: "Waitlist",   cls: "bg-[hsl(30_100%_92%)] text-[hsl(25_70%_38%)]" },
  inactive:   { label: "Inactive",   cls: "bg-[hsl(220_15%_92%)] text-[hsl(220_15%_40%)]" },
  discharged: { label: "Discharged", cls: "bg-[hsl(355_70%_94%)] text-[hsl(355_60%_42%)]" },
};

const authPill: Record<AuthState, { label: string; dot: string; cls: string }> = {
  active:  { label: "Active",  dot: "bg-[hsl(155_60%_50%)]", cls: "text-[hsl(155_55%_28%)]" },
  pending: { label: "Pending", dot: "bg-[hsl(30_90%_60%)]",  cls: "text-[hsl(25_70%_38%)]" },
  expired: { label: "Expired", dot: "bg-[hsl(355_75%_60%)]", cls: "text-[hsl(355_60%_42%)]" },
};

/* ─────────── SMALL COMPONENTS ─────────── */

function Kpi({ icon: Icon, tone, label, value, delta, up, hint }: any) {
  return (
    <div className="os-card os-rise">
      <div className="flex items-start gap-3">
        <div className={cn("os-kpi-icon", tone)}><Icon className="h-5 w-5" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[26px] font-semibold tracking-tight leading-none tabular-nums">{value}</p>
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

function FilterPill({ children }: { children: React.ReactNode }) {
  return (
    <button className="os-glass-input flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium text-foreground/80 hover:text-foreground">
      {children} <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

function ProgressRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="hsl(265 30% 92%)" strokeWidth="3" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="hsl(265 85% 62%)" strokeWidth="3" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms ease" }} />
      </svg>
      <span className="absolute text-[10px] font-semibold tabular-nums">{pct}%</span>
    </div>
  );
}

function ClientRow({ c, active, onClick }: { c: Client; active: boolean; onClick: () => void }) {
  const auth = authPill[c.auth];
  return (
    <button
      onClick={onClick}
      className={cn(
        "group grid w-full grid-cols-[1.6fr_0.7fr_1.4fr_0.9fr_1.1fr_1fr_0.8fr_auto] items-center gap-3 rounded-2xl border bg-white/70 px-3 py-2.5 text-left transition-all",
        "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_36px_-22px_hsl(265_60%_50%/0.35)]",
        active ? "border-[hsl(265_70%_70%)] bg-white shadow-[0_18px_36px_-22px_hsl(265_60%_50%/0.4),0_0_0_1px_hsl(265_70%_70%)]" : "border-white/80",
      )}
    >
      {/* Client */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[11px] font-bold", avatarTone(c.initials))}>
          {c.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight">{c.name}</p>
          <p className="truncate text-[10.5px] text-muted-foreground">DOB: {c.dob} &middot; ID: {c.id}</p>
        </div>
      </div>
      {/* Status */}
      <span className={cn("inline-flex w-fit rounded-full px-2 py-0.5 text-[10.5px] font-semibold", statusPill[c.status].cls)}>
        {statusPill[c.status].label}
      </span>
      {/* Diagnosis */}
      <p className="truncate text-[12px] text-foreground/80">{c.diagnosis}</p>
      {/* Team */}
      <div className="flex items-center -space-x-1.5">
        {[c.bcba, c.rbt].filter((x) => x !== "—").slice(0, 2).map((p, i) => (
          <div key={p+i} className={cn("grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br text-[9px] font-bold ring-2 ring-white", avatarTone(p))}>
            {p.split(" ").map((n) => n[0]).join("").slice(0,2)}
          </div>
        ))}
        {c.teamCount > 2 && (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground/[0.06] text-[9px] font-bold text-foreground/70 ring-2 ring-white">+{c.teamCount - 2}</span>
        )}
        {c.teamCount === 0 && <span className="text-[11px] text-muted-foreground">Unassigned</span>}
      </div>
      {/* Next appt */}
      <div className="min-w-0">
        {c.nextApptDate === "—" ? (
          <p className="text-[12px] text-muted-foreground">—</p>
        ) : (
          <>
            <p className="text-[12px] font-medium">{c.nextApptDate}</p>
            <p className="text-[10.5px] text-muted-foreground">{c.nextApptTime}</p>
          </>
        )}
      </div>
      {/* Auth */}
      <div className="min-w-0">
        <div className={cn("flex items-center gap-1.5 text-[12px] font-medium", auth.cls)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", auth.dot)} />
          {auth.label}
        </div>
        <p className="text-[10.5px] text-muted-foreground">Exp. {c.authExp}</p>
      </div>
      {/* Progress */}
      <div className="flex items-center justify-start">
        {c.progress > 0 ? <ProgressRing pct={c.progress} /> : <span className="text-[11px] text-muted-foreground">—</span>}
      </div>
      {/* Actions */}
      <div className="opacity-60 transition group-hover:opacity-100">
        <span className="grid h-7 w-7 place-items-center rounded-lg hover:bg-foreground/5"><MoreHorizontal className="h-4 w-4" /></span>
      </div>
    </button>
  );
}

/* ─────────── DETAIL PANEL ─────────── */

function ClientPanel({ c, onClose }: { c: Client; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "services" | "team" | "notes" | "files">("overview");
  const usedPct = c.unitsApproved ? Math.round((c.unitsUsed / c.unitsApproved) * 100) : 0;

  const actions = [
    { label: "Message", icon: MessageSquare, tone: "os-tone-sky" },
    { label: "Call",    icon: Phone,         tone: "os-tone-mint" },
    { label: "Email",   icon: Mail,          tone: "os-tone-rose" },
    { label: "Note",    icon: StickyNote,    tone: "os-tone-lilac" },
    { label: "More",    icon: MoreHorizontal,tone: "os-tone-violet" },
  ];

  return (
    <>
      {/* Header */}
      <section className="os-card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button onClick={onClose} className="os-glass-icon h-8 w-8 rounded-xl xl:hidden">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className="truncate text-[16px] font-semibold tracking-tight">{c.name}</h3>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", statusPill[c.status].cls)}>
              {statusPill[c.status].label} Client
            </span>
          </div>
          <button onClick={onClose} className="os-glass-icon h-8 w-8 rounded-xl">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn("grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-[15px] font-bold", avatarTone(c.initials))}>
            {c.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] text-muted-foreground">DOB: {c.dob} ({c.age})</p>
            <p className="text-[11.5px] text-muted-foreground">Client ID: {c.id}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {actions.map((a) => (
            <button key={a.label} className="flex flex-col items-center gap-1.5 rounded-xl py-2 text-[10.5px] font-medium text-foreground/75 transition hover:bg-foreground/[0.04] hover:text-foreground">
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl", a.tone)}>
                <a.icon className="h-4 w-4" />
              </div>
              {a.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 rounded-xl bg-foreground/[0.04] p-1">
          {(["overview","services","team","notes","files"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold capitalize transition",
                tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <dl className="mt-4 divide-y divide-foreground/5">
            {[
              ["Guardian",  c.guardian],
              ["Phone",     c.phone],
              ["Email",     c.email],
              ["Address",   c.address],
              ["Primary Diagnosis", c.diagnosis],
              ["Insurance", c.insurance],
              ["Preferred Start", c.preferredStart],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 py-2.5">
                <dt className="shrink-0 text-[12px] text-muted-foreground">{k}</dt>
                <dd className="text-right text-[12.5px] font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {tab === "services" && (
          <div className="mt-4 space-y-2.5">
            <div className="rounded-2xl border border-white/70 bg-white/60 p-3">
              <p className="text-[12.5px] font-semibold">{c.service}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Primary service modality</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/60 p-3">
              <p className="text-[12.5px] font-semibold">Parent Training</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Weekly · 1.0 hr</p>
            </div>
          </div>
        )}
        {tab === "team" && (
          <div className="mt-4 space-y-2.5">
            {[
              { role: "BCBA", name: c.bcba },
              { role: "RBT",  name: c.rbt },
            ].map((m) => (
              <div key={m.role} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 p-3">
                <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-[11px] font-bold", avatarTone(m.name))}>
                  {m.name === "—" ? "?" : m.name.split(" ").map((n) => n[0]).join("").slice(0,2)}
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold">{m.name}</p>
                  <p className="text-[10.5px] text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "notes" && <EmptyTab icon={StickyNote} title="No notes yet" hint="Add the first note to track context." />}
        {tab === "files" && <EmptyTab icon={FileText}   title="No files yet" hint="Drop intake forms, insurance cards, and IDs here." />}
      </section>

      {/* Authorization */}
      <section className="os-card">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-[13.5px] font-semibold tracking-tight">Authorization Status</h3>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View All</button>
        </header>
        <dl className="divide-y divide-foreground/5">
          {[
            ["Status", <span key="s" className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", statusPill.active.cls)}>Active</span>],
            ["Auth #", c.authNumber],
            ["Start Date", c.authStart],
            ["End Date",   c.authEnd],
            ["Units Approved", c.unitsApproved.toLocaleString()],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex items-center justify-between py-2">
              <dt className="text-[12px] text-muted-foreground">{k}</dt>
              <dd className="text-[12.5px] font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-muted-foreground">Units Used</span>
            <span className="font-semibold tabular-nums">{c.unitsUsed.toLocaleString()} ({usedPct}%)</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_62%)] to-[hsl(280_85%_68%)]" style={{ width: `${usedPct}%` }} />
          </div>
        </div>
      </section>

      {/* Next appointment */}
      <section className="os-card">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-[13.5px] font-semibold tracking-tight">Next Appointment</h3>
        </header>
        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-gradient-to-br from-white/85 to-[hsl(265_100%_98%)] p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(265_100%_94%)] text-[hsl(265_70%_55%)]">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">{c.nextApptDate} at {c.nextApptTime}</p>
            <p className="text-[11px] text-muted-foreground">Therapy with {c.nextApptWith}</p>
          </div>
        </div>
        <button className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[hsl(265_85%_62%)] to-[hsl(280_85%_68%)] text-[12.5px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.6)] transition hover:brightness-105">
          View Schedule
        </button>
      </section>
    </>
  );
}

function EmptyTab({ icon: Icon, title, hint }: any) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-foreground/10 bg-white/40 py-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(285_100%_97%)] text-[hsl(265_70%_55%)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-[13px] font-semibold">{title}</p>
      <p className="mt-1 max-w-[220px] text-[11.5px] text-muted-foreground">{hint}</p>
    </div>
  );
}

/* ─────────── MAIN PAGE ─────────── */

export default function OSClients() {
  const [selected, setSelected] = useState<Client | null>(clients[0]);
  const [tab, setTab] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (tab !== "all" && c.status !== tab) return false;
      if (query && !`${c.name} ${c.id} ${c.guardian}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [tab, query]);

  return (
    <OSShell rightRail={selected ? <ClientPanel c={selected} onClose={() => setSelected(null)} /> : undefined}>
      {/* Header */}
      <header className="os-rise flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-semibold tracking-tight md:text-[32px]">
            Clients <Heart className="h-5 w-5 text-[hsl(330_75%_62%)]" />
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Manage client information, services, progress and team assignments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="os-glass-input inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-foreground/80 hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="os-glass-input inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-foreground/80 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[hsl(265_85%_62%)] to-[hsl(280_85%_68%)] px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.6)] transition hover:brightness-105">
            <Plus className="h-3.5 w-3.5" /> Add New Client
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="os-glass-input flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients, guardians, notes, appointments…"
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/80"
        />
        <kbd className="hidden rounded-md border border-foreground/10 bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline">⌘ K</kbd>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={UsersRound}  tone="os-tone-violet" label="Active Clients"     value="842"    delta="12%" up   hint="vs last 7 days" />
        <Kpi icon={Users}       tone="os-tone-lilac"  label="Total Clients"      value="1,024"  delta="8%"  up   hint="vs last 7 days" />
        <Kpi icon={Clock4}      tone="os-tone-amber"  label="Clients on Waitlist" value="78"    delta="5%"  up   hint="vs last 7 days" />
        <Kpi icon={ShieldCheck} tone="os-tone-mint"   label="Active Auths"       value="152"    delta="14%" up   hint="vs last 7 days" />
        <Kpi icon={DollarSign}  tone="os-tone-sky"    label="Revenue (MTD)"      value="$1.24M" delta="9%"  up   hint="vs last month" />
      </div>

      {/* Client Management */}
      <section className="os-card">
        <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-foreground/[0.04] p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
                  tab === t.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className={cn("ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  tab === t.id ? "bg-[hsl(265_100%_94%)] text-[hsl(265_70%_50%)]" : "bg-foreground/[0.05] text-muted-foreground")}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill>Group by: Status</FilterPill>
            <div className="flex rounded-xl bg-foreground/[0.04] p-1">
              <button onClick={() => setView("list")} className={cn("grid h-7 w-7 place-items-center rounded-lg transition", view === "list" ? "bg-white shadow-sm" : "text-muted-foreground")}>
                <ListIcon className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView("grid")} className={cn("grid h-7 w-7 place-items-center rounded-lg transition", view === "grid" ? "bg-white shadow-sm" : "text-muted-foreground")}>
                <Grid2x2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Column labels */}
        <div className="hidden xl:grid grid-cols-[1.6fr_0.7fr_1.4fr_0.9fr_1.1fr_1fr_0.8fr_auto] gap-3 px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Client</span><span>Status</span><span>Primary Diagnosis</span><span>Team</span>
          <span>Next Appointment</span><span>Auth Status</span><span>Progress</span><span></span>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-2 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-foreground/10 bg-white/40 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(285_100%_97%)] text-[hsl(265_70%_55%)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[13px] font-semibold">No clients match</p>
              <p className="mt-1 max-w-[260px] text-[11.5px] text-muted-foreground">Try a different filter or search term.</p>
            </div>
          ) : (
            <div className="min-w-[860px] xl:min-w-0">
              {filtered.map((c) => (
                <div key={c.id} className="mb-2">
                  <ClientRow c={c} active={selected?.id === c.id} onClick={() => setSelected(c)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
          <span>Showing 1–{filtered.length} of 842 clients</span>
          <div className="flex items-center gap-1">
            {["‹","1","2","3","…","121","›"].map((p, i) => (
              <button key={i} className={cn("h-7 min-w-7 rounded-lg px-2 text-[11.5px] font-semibold transition",
                p === "1" ? "bg-[hsl(265_100%_94%)] text-[hsl(265_70%_50%)]" : "text-muted-foreground hover:bg-foreground/5")}>
                {p}
              </button>
            ))}
          </div>
        </footer>
      </section>

      {/* Analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Distribution */}
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight">Client Distribution</h3>
            <FilterPill>This Month</FilterPill>
          </header>
          <div className="flex items-center gap-4">
            <div className="relative h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={distribution} dataKey="value" innerRadius={52} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                    {distribution.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[18px] font-semibold tabular-nums">842</p>
                <p className="text-[10px] text-muted-foreground">Total Clients</p>
              </div>
            </div>
            <ul className="flex-1 space-y-1.5">
              {distribution.map((s) => (
                <li key={s.name} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{s.value} ({s.pct}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Age Distribution */}
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight">Age Distribution</h3>
            <FilterPill>All Clients</FilterPill>
          </header>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <BarChart data={ageBuckets} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="cAgeBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(265 85% 65%)" />
                    <stop offset="100%" stopColor="hsl(285 85% 78%)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="age" stroke="hsl(220 10% 60%)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(220 10% 60%)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(265 100% 96%)" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(265 30% 90%)", fontSize: 12 }} />
                <Bar dataKey="v" fill="url(#cAgeBar)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Service Type */}
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight">Service Type Distribution</h3>
            <FilterPill>This Month</FilterPill>
          </header>
          <div className="flex items-center gap-4">
            <div className="relative h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={services} dataKey="value" innerRadius={52} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                    {services.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5">
              {services.map((s) => (
                <li key={s.name} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Quick actions */}
      <section className="os-card">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">Quick Actions</h3>
          <span className="text-[11px] text-muted-foreground">Operational shortcuts</span>
        </header>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((a) => (
            <button key={a.label} className="group flex flex-col items-start gap-2 rounded-2xl border border-white/80 bg-white/70 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_36px_-22px_hsl(265_60%_50%/0.35)]">
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl", a.tone)}>
                <a.icon className="h-4 w-4" />
              </div>
              <p className="text-[12.5px] font-semibold">{a.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* AI cue */}
      <section className="relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-white/85 via-[hsl(265_100%_98%)] to-[hsl(285_100%_98%)] p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_62%)] to-[hsl(285_85%_70%)] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">Ask Blossom AI about your clients</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Summarize history, surface expiring auths, flag staffing gaps, or suggest next actions.</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-foreground/[0.06] px-3 py-2 text-[12px] font-semibold text-foreground/80 hover:bg-foreground/[0.09]">
            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(30_90%_55%)]" /> 3 auths expire this week
          </button>
        </div>
      </section>
    </OSShell>
  );
}
