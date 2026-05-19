import { useState } from "react";
import {
  Users, UsersRound, TrendingUp, Clock, CalendarDays, Upload, Plus, Filter, Download,
  Phone, MessageSquare, Mail, FileText, MoreHorizontal, ChevronDown, Sparkles,
  ArrowUpRight, ArrowDownRight, ChevronLeft, X, StickyNote, ListChecks, Activity,
  Send, FilePlus2, BarChart3, FileSpreadsheet,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";

/* ──────────────────────── MOCK DATA ──────────────────────── */

type Stage = "new" | "contacted" | "qualified" | "scheduled" | "converted";
type Lead = {
  id: string; name: string; type: string; city: string;
  initials: string; ago: string; insurance: string; urgency: "high" | "med" | "low";
  coordinator: string; stage: Stage;
};

const leads: Lead[] = [
  { id: "1", name: "Emily R.",    type: "Parent", city: "Boca Raton, FL",     initials: "ER", ago: "Just now", insurance: "Aetna",     urgency: "high", coordinator: "Intake Team",  stage: "new" },
  { id: "2", name: "Michael T.",  type: "Parent", city: "Coral Springs, FL",  initials: "MT", ago: "15m ago",  insurance: "BCBS",      urgency: "med",  coordinator: "Lisa W.",      stage: "new" },
  { id: "3", name: "Jessica L.",  type: "Parent", city: "West Palm Beach, FL",initials: "JL", ago: "1h ago",   insurance: "Cigna",     urgency: "med",  coordinator: "Intake Team",  stage: "new" },
  { id: "4", name: "David K.",    type: "Parent", city: "Wellington, FL",     initials: "DK", ago: "2h ago",   insurance: "Aetna",     urgency: "low",  coordinator: "Lisa W.",      stage: "new" },
  { id: "5", name: "Sarah M.",    type: "Parent", city: "Delray Beach, FL",   initials: "SM", ago: "2h ago",   insurance: "BCBS",      urgency: "high", coordinator: "Mark P.",      stage: "contacted" },
  { id: "6", name: "Brian J.",    type: "Parent", city: "Boynton Beach, FL",  initials: "BJ", ago: "3h ago",   insurance: "United",    urgency: "med",  coordinator: "Mark P.",      stage: "contacted" },
  { id: "7", name: "Amanda S.",   type: "Parent", city: "Boca Raton, FL",     initials: "AS", ago: "4h ago",   insurance: "Aetna",     urgency: "low",  coordinator: "Intake Team",  stage: "contacted" },
  { id: "8", name: "Jason P.",    type: "Parent", city: "Lake Worth, FL",     initials: "JP", ago: "5h ago",   insurance: "Tricare",   urgency: "med",  coordinator: "Lisa W.",      stage: "contacted" },
  { id: "9", name: "Olivia C.",   type: "Parent", city: "Boca Raton, FL",     initials: "OC", ago: "1d ago",   insurance: "Aetna",     urgency: "high", coordinator: "Mark P.",      stage: "qualified" },
  { id: "10", name: "Matthew W.", type: "Parent", city: "Parkland, FL",       initials: "MW", ago: "1d ago",   insurance: "BCBS",      urgency: "med",  coordinator: "Mark P.",      stage: "qualified" },
  { id: "11", name: "Lauren G.",  type: "Parent", city: "Coral Springs, FL",  initials: "LG", ago: "1d ago",   insurance: "Cigna",     urgency: "med",  coordinator: "Lisa W.",      stage: "qualified" },
  { id: "12", name: "Steven B.",  type: "Parent", city: "Weston, FL",         initials: "SB", ago: "2d ago",   insurance: "Aetna",     urgency: "low",  coordinator: "Intake Team",  stage: "qualified" },
  { id: "13", name: "Nicole H.",  type: "Parent", city: "Delray Beach, FL",   initials: "NH", ago: "May 14",   insurance: "BCBS",      urgency: "high", coordinator: "Mark P.",      stage: "scheduled" },
  { id: "14", name: "Chris D.",   type: "Client", city: "Boca Raton, FL",     initials: "CD", ago: "May 15",   insurance: "Aetna",     urgency: "med",  coordinator: "Lisa W.",      stage: "scheduled" },
  { id: "15", name: "Danielle M.",type: "Parent", city: "Boynton Beach, FL",  initials: "DM", ago: "May 16",   insurance: "United",    urgency: "med",  coordinator: "Mark P.",      stage: "scheduled" },
  { id: "16", name: "Tyler S.",   type: "Parent", city: "Wellington, FL",     initials: "TS", ago: "May 16",   insurance: "BCBS",      urgency: "low",  coordinator: "Intake Team",  stage: "scheduled" },
  { id: "17", name: "Jacob T.",   type: "Client", city: "Boca Raton, FL",     initials: "JT", ago: "May 14",   insurance: "Aetna",     urgency: "low",  coordinator: "Mark P.",      stage: "converted" },
  { id: "18", name: "Chloe B.",   type: "Client", city: "Parkland, FL",       initials: "CB", ago: "May 15",   insurance: "BCBS",      urgency: "low",  coordinator: "Lisa W.",      stage: "converted" },
  { id: "19", name: "Aiden R.",   type: "Client", city: "Coral Springs, FL",  initials: "AR", ago: "May 13",   insurance: "Cigna",     urgency: "low",  coordinator: "Mark P.",      stage: "converted" },
  { id: "20", name: "Sophia L.",  type: "Client", city: "Delray Beach, FL",   initials: "SL", ago: "May 16",   insurance: "Aetna",     urgency: "low",  coordinator: "Intake Team",  stage: "converted" },
];

const columns: { id: Stage; label: string; count: number; revenue?: string; dot: string }[] = [
  { id: "new",        label: "New Lead",        count: 128, dot: "hsl(265 85% 65%)" },
  { id: "contacted",  label: "Contacted",       count: 96, revenue: "$84,000",  dot: "hsl(210 85% 60%)" },
  { id: "qualified",  label: "Qualified",       count: 74, revenue: "$112,000", dot: "hsl(330 75% 62%)" },
  { id: "scheduled",  label: "Appt. Scheduled", count: 38, revenue: "$76,000",  dot: "hsl(30 90% 60%)" },
  { id: "converted",  label: "Converted",       count: 22, revenue: "$58,000",  dot: "hsl(155 60% 50%)" },
];

const sources = [
  { name: "Website",     value: 289, pct: 45, color: "hsl(265 85% 65%)" },
  { name: "Google Ads",  value: 161, pct: 25, color: "hsl(210 85% 60%)" },
  { name: "Referrals",   value: 96,  pct: 15, color: "hsl(330 75% 62%)" },
  { name: "Facebook Ads",value: 64,  pct: 10, color: "hsl(30 90% 60%)" },
  { name: "Other",       value: 32,  pct: 5,  color: "hsl(155 60% 50%)" },
];

const trend = [
  { d: "May 1", v: 18 }, { d: "May 4", v: 42 }, { d: "May 8", v: 78 },
  { d: "May 11", v: 95 }, { d: "May 15", v: 122 }, { d: "May 18", v: 138 },
  { d: "May 22", v: 156 }, { d: "May 25", v: 174 }, { d: "May 29", v: 196 },
];

const funnel = [
  { label: "Total Leads",      value: 642, pct: 100, color: "hsl(265 85% 65%)" },
  { label: "Contacted (46%)",  value: 296, pct: 78,  color: "hsl(210 85% 60%)" },
  { label: "Qualified (23%)",  value: 148, pct: 56,  color: "hsl(330 75% 62%)" },
  { label: "Appt. Scheduled (9%)", value: 60, pct: 34, color: "hsl(30 90% 60%)" },
  { label: "Converted (3%)",   value: 22,  pct: 14,  color: "hsl(155 60% 50%)" },
];

const quickActions = [
  { label: "Add New Lead",      icon: Plus,         tone: "os-tone-violet" },
  { label: "Schedule Appt",     icon: CalendarDays, tone: "os-tone-sky" },
  { label: "Send Text",         icon: MessageSquare,tone: "os-tone-mint" },
  { label: "Send Email",        icon: Mail,         tone: "os-tone-rose" },
  { label: "Create Intake",     icon: FilePlus2,    tone: "os-tone-amber" },
  { label: "Add Note",          icon: StickyNote,   tone: "os-tone-lilac" },
  { label: "View Reports",      icon: BarChart3,    tone: "os-tone-coral" },
];

/* ──────────────────────── HELPERS ──────────────────────── */

const urgencyDot: Record<Lead["urgency"], string> = {
  high: "bg-[hsl(355_75%_60%)]",
  med:  "bg-[hsl(30_90%_60%)]",
  low:  "bg-[hsl(155_55%_50%)]",
};

const avatarPalette = [
  "from-[hsl(265_80%_75%)] to-[hsl(285_80%_80%)] text-[hsl(265_60%_35%)]",
  "from-[hsl(330_80%_82%)] to-[hsl(345_80%_85%)] text-[hsl(335_60%_35%)]",
  "from-[hsl(210_80%_82%)] to-[hsl(225_80%_85%)] text-[hsl(215_60%_35%)]",
  "from-[hsl(155_60%_82%)] to-[hsl(165_60%_85%)] text-[hsl(155_50%_25%)]",
  "from-[hsl(30_90%_85%)]  to-[hsl(20_90%_88%)]  text-[hsl(25_70%_35%)]",
];
function avatarTone(i: string) {
  const sum = i.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarPalette[sum % avatarPalette.length];
}

/* ──────────────────────── SMALL COMPONENTS ──────────────────────── */

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

function LeadCard({ lead, active, onClick }: { lead: Lead; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded-2xl border bg-white/80 p-3 text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_hsl(265_60%_50%/0.35)]",
        active
          ? "border-[hsl(265_70%_70%)] bg-white shadow-[0_18px_36px_-22px_hsl(265_60%_50%/0.4),0_0_0_1px_hsl(265_70%_70%)]"
          : "border-white/80",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[11px] font-bold",
          avatarTone(lead.initials),
        )}>
          {lead.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-semibold leading-tight">{lead.name}</p>
            <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", urgencyDot[lead.urgency])} title={`${lead.urgency} urgency`} />
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{lead.type}</p>
        </div>
        <span className="shrink-0 text-[10.5px] font-medium text-muted-foreground">{lead.ago}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <p className="truncate text-[11px] text-muted-foreground">{lead.city}</p>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Phone className="h-3 w-3 opacity-60 transition group-hover:opacity-100" />
          <Mail className="h-3 w-3 opacity-60 transition group-hover:opacity-100" />
        </div>
      </div>
    </button>
  );
}

function PipelineColumn({ col, active, onSelect }: { col: typeof columns[number]; active: string; onSelect: (l: Lead) => void }) {
  const colLeads = leads.filter((l) => l.stage === col.id);
  return (
    <div className="flex w-[260px] shrink-0 flex-col gap-3 snap-start">
      <header className="flex items-start justify-between rounded-2xl border border-white/80 bg-white/70 px-3 py-2.5 backdrop-blur">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: col.dot }} />
            <p className="text-[12.5px] font-semibold tracking-tight">{col.label}</p>
          </div>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">
            {col.count} Leads{col.revenue && <span> &middot; <span className="tabular-nums">{col.revenue}</span></span>}
          </p>
        </div>
      </header>
      <div className="flex flex-col gap-2.5">
        {colLeads.map((l) => (
          <LeadCard key={l.id} lead={l} active={active === l.id} onClick={() => onSelect(l)} />
        ))}
        <button className="rounded-2xl border border-dashed border-[hsl(265_50%_85%)] bg-white/40 py-2 text-[11.5px] font-medium text-[hsl(265_70%_55%)] transition hover:bg-white/70">
          + Add Lead
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────── DETAIL PANEL ──────────────────────── */

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "activity" | "notes" | "tasks" | "files">("overview");

  const actions = [
    { label: "Call",  icon: Phone, tone: "os-tone-mint" },
    { label: "Text",  icon: MessageSquare, tone: "os-tone-sky" },
    { label: "Email", icon: Mail, tone: "os-tone-rose" },
    { label: "Notes", icon: StickyNote, tone: "os-tone-lilac" },
    { label: "More",  icon: MoreHorizontal, tone: "os-tone-violet" },
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
            <h3 className="truncate text-[16px] font-semibold tracking-tight">{lead.name}</h3>
            <span className="shrink-0 rounded-full bg-[hsl(265_100%_95%)] px-2 py-0.5 text-[10px] font-semibold text-[hsl(265_70%_50%)]">
              {lead.stage === "new" ? "New Lead" : lead.stage === "contacted" ? "Contacted" : lead.stage === "qualified" ? "Qualified" : lead.stage === "scheduled" ? "Scheduled" : "Converted"}
            </span>
          </div>
          <button onClick={onClose} className="os-glass-icon h-8 w-8 rounded-xl">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-[13px] font-bold", avatarTone(lead.initials))}>
            {lead.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium">{lead.type === "Parent" ? "Parent of Potential Client" : "Active Client"}</p>
            <p className="text-[11.5px] text-muted-foreground">{lead.city}</p>
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
          {(["overview","activity","notes","tasks","files"] as const).map((t) => (
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

        {/* Overview content */}
        {tab === "overview" && (
          <dl className="mt-4 divide-y divide-foreground/5">
            {[
              ["Lead Source", "Website Form"],
              ["Date Received", "May 14, 2024 9:32 AM"],
              ["Interested In", "ABA Therapy"],
              ["Preferred Start", "ASAP"],
              ["Insurance", lead.insurance],
              ["Assigned To", lead.coordinator],
              ["Lead Score", "High"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5">
                <dt className="text-[12px] text-muted-foreground">{k}</dt>
                <dd className="text-[12.5px] font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {tab === "activity" && (
          <div className="mt-4 space-y-3">
            {[
              { t: "Lead created from Website Form", who: "System", when: "Just now" },
              { t: "SMS sent: Welcome to Blossom", who: "Lisa W.", when: "5m ago" },
              { t: "Voicemail left", who: "Mark P.", when: "1h ago" },
            ].map((a) => (
              <div key={a.t} className="flex items-start gap-3 rounded-xl border border-white/70 bg-white/60 p-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[hsl(265_100%_95%)] text-[hsl(265_70%_55%)]"><Activity className="h-3.5 w-3.5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium">{a.t}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.who} &middot; {a.when}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "notes" && <EmptyTab icon={StickyNote} title="No notes yet" hint="Add the first note to track context." />}
        {tab === "tasks" && <EmptyTab icon={ListChecks} title="No tasks yet" hint="Create a follow-up task to keep momentum." />}
        {tab === "files" && <EmptyTab icon={FileText} title="No files yet" hint="Drop intake forms, insurance cards, and IDs here." />}
      </section>

      {/* Next Step */}
      <section className="os-card">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-[13.5px] font-semibold tracking-tight">Next Step</h3>
        </header>
        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-gradient-to-br from-white/85 to-[hsl(265_100%_98%)] p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(265_100%_94%)] text-[hsl(265_70%_55%)]">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">Schedule Discovery Call</p>
            <p className="text-[11px] text-muted-foreground">May 16, 2024 at 10:00 AM</p>
          </div>
        </div>
        <button className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[hsl(265_85%_62%)] to-[hsl(280_85%_68%)] text-[12.5px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.6)] transition hover:brightness-105">
          View Details
        </button>
      </section>

      {/* Notes preview */}
      <section className="os-card">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-[13.5px] font-semibold tracking-tight">Notes Preview</h3>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View All Notes</button>
        </header>
        <div className="rounded-2xl border border-white/70 bg-white/60 p-3">
          <p className="text-[12.5px] leading-relaxed text-foreground/85">
            Parent is interested in in-home ABA for their 4-year-old son. Looking for after-school availability.
          </p>
          <p className="mt-2 text-[10.5px] text-muted-foreground">1d ago &middot; Shira L.</p>
        </div>
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

/* ──────────────────────── MAIN PAGE ──────────────────────── */

export default function OSLeads() {
  const [selected, setSelected] = useState<Lead | null>(leads[0]);

  return (
    <OSShell rightRail={selected ? <LeadDetail lead={selected} onClose={() => setSelected(null)} /> : undefined}>
      {/* Header */}
      <header className="os-rise flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-semibold tracking-tight md:text-[32px]">
            Leads <Sparkles className="h-5 w-5 text-[hsl(265_70%_60%)]" />
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Manage and track all incoming leads throughout the intake pipeline.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="os-glass-input inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-foreground/80 hover:text-foreground">
            <Upload className="h-3.5 w-3.5" /> Import Leads
          </button>
          <button className="os-glass-input inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-foreground/80 hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[hsl(265_85%_62%)] to-[hsl(280_85%_68%)] px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.6)] transition hover:brightness-105">
            <Plus className="h-3.5 w-3.5" /> Add New Lead
          </button>
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={UsersRound}   tone="os-tone-violet" label="New Leads"          value="128"  delta="18%" up   hint="vs last 7 days" />
        <Kpi icon={Users}        tone="os-tone-lilac"  label="Total Leads"        value="642"  delta="12%" up   hint="vs last 7 days" />
        <Kpi icon={TrendingUp}   tone="os-tone-mint"   label="Conversion Rate"    value="28%"  delta="6%"  up   hint="vs last 30 days" />
        <Kpi icon={Clock}        tone="os-tone-amber"  label="Avg. Response Time" value="18m"  delta="8m"  up={false} hint="vs last 30 days" />
        <Kpi icon={CalendarDays} tone="os-tone-sky"    label="Appts Scheduled"    value="156"  delta="14%" up   hint="vs last 7 days" />
      </div>

      {/* Pipeline */}
      <section className="os-card">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight">Pipeline View</h2>
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill>All Sources</FilterPill>
            <FilterPill>All Teams</FilterPill>
            <FilterPill>This Month</FilterPill>
            <button className="os-glass-input inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-foreground/80">
              <Filter className="h-3 w-3" /> Filters
            </button>
          </div>
        </header>
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
          {columns.map((c) => (
            <PipelineColumn key={c.id} col={c} active={selected?.id ?? ""} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Analytics row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Lead Sources */}
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight">Lead Sources</h3>
            <FilterPill>This Month</FilterPill>
          </header>
          <div className="flex items-center gap-4">
            <div className="relative h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={sources} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                    {sources.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-[20px] font-semibold leading-none tabular-nums">642</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-2">
              {sources.map((s) => (
                <li key={s.name} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1 truncate font-medium">{s.name}</span>
                  <span className="tabular-nums text-foreground/80">{s.pct}%</span>
                  <span className="w-10 tabular-nums text-right text-muted-foreground">({s.value})</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Trend */}
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight">Lead Trend</h3>
            <FilterPill>This Month</FilterPill>
          </header>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(265 85% 65%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(265 85% 65%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 55%)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 55%)" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(255 30% 92%)" }} />
                <Area type="monotone" dataKey="v" stroke="hsl(265 85% 60%)" strokeWidth={2.5} fill="url(#lt)" dot={{ r: 0 }} activeDot={{ r: 5, fill: "hsl(265 85% 60%)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Funnel */}
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight">Conversion Funnel</h3>
          </header>
          <ul className="space-y-2.5">
            {funnel.map((f) => (
              <li key={f.label}>
                <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
                  <span className="truncate text-muted-foreground">{f.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{f.value}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-foreground/[0.05]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${f.pct}%`, background: `linear-gradient(90deg, ${f.color}, ${f.color} 70%, ${f.color}cc)` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">Quick Actions</h3>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
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