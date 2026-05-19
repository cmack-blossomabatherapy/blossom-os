import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  Sparkles, Plus, RefreshCw, Settings2, Search, ChevronLeft, ChevronRight,
  CalendarDays, Users, Video, MapPin, Link2, AlertTriangle, CheckCircle2,
  Clock, Mail, Phone, MessageSquare, Briefcase, GraduationCap, FileCheck2,
  Heart, ShieldCheck, UserCog, ClipboardCheck, UserPlus, Megaphone, Flame,
  Building2, Bot, Lightbulb, Brain, Zap, ArrowRight, X, Check, Filter,
  Bell, ExternalLink, Send, FileText, ListChecks, Cloud, ChevronDown,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import { ROLE_CALENDAR_CONFIG, type RoleCalendarConfig } from "@/lib/os/calendarConfigs";
import type { OSRole } from "@/lib/os/permissions";

/** Convert URL slug (e.g. "state-director" or "state_director") to an OSRole id. */
function slugToRole(slug?: string): OSRole | null {
  if (!slug) return null;
  const normalized = slug.replace(/-/g, "_") as OSRole;
  return normalized in ROLE_CALENDAR_CONFIG ? normalized : null;
}

export function roleToCalendarPath(role: OSRole): string {
  return `/os/calendar/${role.replace(/_/g, "-")}`;
}

/* ============ TYPES ============ */
type Source = "microsoft" | "calendly" | "blossom";
type EventType =
  | "leadership" | "huddle" | "bcba" | "rbt" | "parent" | "intake"
  | "interview" | "orientation" | "training" | "site" | "assessment"
  | "auth" | "progress" | "staffing" | "task" | "escalation" | "personal";

type CalEvent = {
  id: string;
  title: string;
  start: string;          // HH:mm
  end: string;            // HH:mm
  day: number;            // 0=Mon..6=Sun for current week
  type: EventType;
  source: Source;
  location?: string;
  link?: string;
  attendees: string[];
  notes?: string;
  related?: { kind: string; name: string };
  status?: "confirmed" | "tentative" | "needs-action";
  conflict?: boolean;
};

/* ============ EVENT TYPE META ============ */
const TYPE_META: Record<EventType, { label: string; icon: any; color: string; chip: string; bar: string }> = {
  leadership:  { label: "Leadership",      icon: Briefcase,      color: "violet", chip: "bg-violet-100 text-violet-700",   bar: "from-violet-400 to-violet-500" },
  huddle:      { label: "State Huddle",    icon: Megaphone,      color: "indigo", chip: "bg-indigo-100 text-indigo-700",   bar: "from-indigo-400 to-indigo-500" },
  bcba:        { label: "BCBA",            icon: Heart,          color: "rose",   chip: "bg-rose-100 text-rose-700",       bar: "from-rose-400 to-rose-500" },
  rbt:         { label: "RBT",             icon: UserCog,        color: "amber",  chip: "bg-amber-100 text-amber-700",     bar: "from-amber-400 to-amber-500" },
  parent:      { label: "Parent / Client", icon: Users,          color: "sky",    chip: "bg-sky-100 text-sky-700",         bar: "from-sky-400 to-sky-500" },
  intake:      { label: "Intake Follow-Up",icon: ClipboardCheck, color: "teal",   chip: "bg-teal-100 text-teal-700",       bar: "from-teal-400 to-teal-500" },
  interview:   { label: "Interview",       icon: UserPlus,       color: "fuchsia",chip: "bg-fuchsia-100 text-fuchsia-700", bar: "from-fuchsia-400 to-fuchsia-500" },
  orientation: { label: "Orientation",     icon: GraduationCap,  color: "lime",   chip: "bg-lime-100 text-lime-700",       bar: "from-lime-400 to-lime-500" },
  training:    { label: "Training",        icon: GraduationCap,  color: "emerald",chip: "bg-emerald-100 text-emerald-700", bar: "from-emerald-400 to-emerald-500" },
  site:        { label: "Site Visit",      icon: Building2,      color: "blue",   chip: "bg-blue-100 text-blue-700",       bar: "from-blue-400 to-blue-500" },
  assessment:  { label: "Assessment",      icon: ClipboardCheck, color: "cyan",   chip: "bg-cyan-100 text-cyan-700",       bar: "from-cyan-400 to-cyan-500" },
  auth:        { label: "Auth Follow-Up",  icon: FileCheck2,     color: "orange", chip: "bg-orange-100 text-orange-700",   bar: "from-orange-400 to-orange-500" },
  progress:    { label: "Progress Report", icon: FileText,       color: "purple", chip: "bg-purple-100 text-purple-700",   bar: "from-purple-400 to-purple-500" },
  staffing:    { label: "Staffing",        icon: Briefcase,      color: "yellow", chip: "bg-yellow-100 text-yellow-700",   bar: "from-yellow-400 to-yellow-500" },
  task:        { label: "Internal Task",   icon: ListChecks,     color: "slate",  chip: "bg-slate-100 text-slate-700",     bar: "from-slate-400 to-slate-500" },
  escalation:  { label: "Escalation",      icon: Flame,          color: "red",    chip: "bg-red-100 text-red-700",         bar: "from-red-400 to-red-600" },
  personal:    { label: "Personal",        icon: Heart,          color: "pink",   chip: "bg-pink-100 text-pink-700",       bar: "from-pink-400 to-pink-500" },
};

const SOURCE_META: Record<Source, { label: string; icon: any; chip: string }> = {
  microsoft: { label: "Microsoft", icon: Mail,   chip: "bg-blue-50 text-blue-700 border-blue-200" },
  calendly:  { label: "Calendly",  icon: Link2,  chip: "bg-violet-50 text-violet-700 border-violet-200" },
  blossom:   { label: "Blossom OS",icon: Sparkles,chip: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
};

/* ============ MOCK DATA ============ */
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am - 7pm

const MOCK_EVENTS: CalEvent[] = [
  { id: "e1",  title: "NC State Huddle",            day: 0, start: "08:30", end: "09:00", type: "huddle",      source: "microsoft", location: "Teams",         link: "https://teams.microsoft.com/x", attendees: ["Asst State Dir","Ops Lead","Scheduling Lead"], notes: "Weekly state operations sync.", status: "confirmed" },
  { id: "e2",  title: "BCBA 1:1 — Maria L.",         day: 0, start: "10:00", end: "10:30", type: "bcba",        source: "blossom",   location: "Charlotte",     attendees: ["Maria L."], related: { kind: "BCBA", name: "Maria L." }, status: "confirmed" },
  { id: "e3",  title: "Calendly: Parent Intake Call",day: 0, start: "11:00", end: "11:30", type: "intake",      source: "calendly",  link: "https://meet.google.com/x", attendees: ["Parent — Garcia"], related: { kind: "Lead", name: "Garcia family" }, status: "confirmed" },
  { id: "e4",  title: "Site Visit — Raleigh Clinic", day: 0, start: "13:00", end: "15:30", type: "site",        source: "blossom",   location: "Raleigh, NC",   attendees: ["Clinic Dir","QA Lead"], notes: "Quarterly clinical walkthrough." },
  { id: "e5",  title: "Auth Follow-Up — J. Park",    day: 0, start: "16:00", end: "16:20", type: "auth",        source: "blossom",   attendees: ["Auth Coord"], related: { kind: "Client", name: "J. Park" }, status: "needs-action" },

  { id: "e6",  title: "Interview — RBT Candidate (Calendly)", day: 1, start: "09:00", end: "09:45", type: "interview", source: "calendly", link: "https://zoom.us/x", attendees: ["Candidate A. Kim"], related: { kind: "Candidate", name: "A. Kim" }, status: "confirmed" },
  { id: "e7",  title: "Leadership Meeting",          day: 1, start: "10:00", end: "11:00", type: "leadership",  source: "microsoft", location: "Teams", attendees: ["State Dir","Ops VP","HR Dir"], status: "confirmed", conflict: true },
  { id: "e7b", title: "BCBA Sync — Greensboro",      day: 1, start: "10:30", end: "11:00", type: "bcba",        source: "blossom",   attendees: ["BCBA Pod B"], status: "tentative", conflict: true },
  { id: "e8",  title: "RBT Cohort Training",         day: 1, start: "13:00", end: "14:30", type: "training",    source: "blossom",   location: "Academy", attendees: ["New Hires (5)"] },
  { id: "e9",  title: "Escalation — Charlotte staffing", day: 1, start: "15:00", end: "15:30", type: "escalation", source: "blossom", attendees: ["Scheduling","Staffing"], related: { kind: "Issue", name: "INC-238" } },

  { id: "e10", title: "Progress Report Review",      day: 2, start: "09:00", end: "09:30", type: "progress",    source: "blossom",   attendees: ["BCBA Pod A"], status: "needs-action" },
  { id: "e11", title: "Interview — BCBA (Calendly)", day: 2, start: "11:00", end: "11:45", type: "interview",   source: "calendly",  link: "https://zoom.us/x", attendees: ["Candidate R. Bell"], related: { kind: "Candidate", name: "R. Bell" } },
  { id: "e12", title: "Parent Check-In — Family Patel", day: 2, start: "14:00", end: "14:30", type: "parent", source: "microsoft", attendees: ["Family Patel","BCBA Maria L."] },
  { id: "e13", title: "Assessment — New Client",     day: 2, start: "15:00", end: "16:30", type: "assessment",  source: "blossom",   location: "Charlotte", attendees: ["BCBA L. Tran"] },

  { id: "e14", title: "Operations Standup",          day: 3, start: "08:30", end: "09:00", type: "huddle",      source: "microsoft", location: "Teams", attendees: ["Ops Team"] },
  { id: "e15", title: "Calendly: Orientation Intro", day: 3, start: "10:00", end: "10:30", type: "orientation", source: "calendly",  attendees: ["New Hires (3)"] },
  { id: "e16", title: "BCBA Caseload Review",        day: 3, start: "13:00", end: "14:00", type: "bcba",        source: "blossom",   attendees: ["BCBA Pod A","Pod B"] },
  { id: "e17", title: "Staffing Follow-Up",          day: 3, start: "16:00", end: "16:30", type: "staffing",    source: "blossom",   attendees: ["Scheduling"] },

  { id: "e18", title: "State Director Check-In",     day: 4, start: "09:00", end: "09:30", type: "leadership",  source: "microsoft", attendees: ["Ops VP"] },
  { id: "e19", title: "Interview — RBT (Calendly)",  day: 4, start: "11:00", end: "11:30", type: "interview",   source: "calendly",  attendees: ["Candidate D. Ortiz"] },
  { id: "e20", title: "Training: De-escalation Refresher", day: 4, start: "14:00", end: "15:00", type: "training", source: "blossom", attendees: ["All RBTs"] },
  { id: "e21", title: "Auth Deadline Follow-Up",     day: 4, start: "16:00", end: "16:30", type: "auth",        source: "blossom",   attendees: ["Auth Coord"], status: "needs-action" },
];

const CONFLICTS = [
  { id: "c1", a: "Leadership Meeting", b: "BCBA Sync — Greensboro", time: "Tue 10:30–11:00", suggestion: "Move BCBA Sync to 11:15" },
  { id: "c2", a: "Site Visit — Raleigh", b: "Auth Follow-Up — J. Park", time: "Mon 15:30 buffer", suggestion: "Add 30m travel buffer" },
];

/* ============ ROLE → OWNED EVENT TYPES ============ */
/** Which calendar event types each role actually owns / should see by default.
 *  Leadership-tier roles (state_director, exec, ops, super_admin) see everything. */
const ROLE_EVENT_TYPES: Partial<Record<OSRole, EventType[]>> = {
  bcba:                      ["bcba", "parent", "assessment", "progress", "training", "site", "personal"],
  rbt:                       ["rbt", "training", "orientation", "parent", "personal"],
  intake_coordinator:        ["intake", "parent", "task", "personal"],
  authorization_coordinator: ["auth", "parent", "escalation", "task", "personal"],
  scheduling_team:           ["staffing", "bcba", "rbt", "escalation", "task", "personal"],
  recruiting_team:           ["interview", "orientation", "task", "personal"],
  hr_team:                   ["orientation", "training", "interview", "task", "personal"],
  billing_finance:           ["auth", "task", "personal"],
  qa_team:                   ["progress", "assessment", "bcba", "site", "task", "personal"],
  payroll_coordinator:       ["task", "personal"],
};
function eventTypesForRole(r: OSRole): EventType[] | null {
  return ROLE_EVENT_TYPES[r] ?? null; // null = see all
}

const CONNECTED = [
  { id: "ms", name: "Microsoft Calendar", email: "director@blossomaba.com", status: "connected", last: "2 min ago", events: 142, icon: Mail, color: "blue" },
  { id: "cal",name: "Calendly",           email: "director@blossomaba.com", status: "connected", last: "5 min ago", events: 38,  icon: Link2, color: "violet" },
  { id: "blo",name: "Blossom OS Internal",email: "system",                  status: "connected", last: "live",     events: 67,  icon: Sparkles, color: "fuchsia" },
];

const TEAM = [
  { name: "Asst State Dir — J. Pierce", role: "Asst State Director", busy: [[9,10.5],[13,14]], color: "violet" },
  { name: "Ops Lead — S. Howe",         role: "Operations Lead",     busy: [[8.5,9],[10,12],[15,16.5]], color: "indigo" },
  { name: "Scheduling — T. Adler",      role: "Scheduling Lead",     busy: [[8,9],[11,12.5],[14,15]], color: "sky" },
  { name: "BCBA Lead — Maria L.",       role: "BCBA Lead",           busy: [[10,11],[13,15]], color: "rose" },
  { name: "Recruiting — K. Singh",      role: "Recruiting",          busy: [[9,10],[11,11.5],[14,16]], color: "fuchsia" },
  { name: "HR Dir — A. Romero",         role: "HR Director",         busy: [[8,9],[13,14.5]], color: "amber" },
];

const TIMELINE = [
  { date: "Mon, Nov 17", items: [{ label: "NC State Huddle", time: "8:30 AM", type: "huddle" }, { label: "Site Visit — Raleigh", time: "1:00 PM", type: "site" }] },
  { date: "Tue, Nov 18", items: [{ label: "Leadership Meeting", time: "10:00 AM", type: "leadership" }, { label: "Charlotte staffing escalation", time: "3:00 PM", type: "escalation" }] },
  { date: "Wed, Nov 19", items: [{ label: "Progress Report review", time: "9:00 AM", type: "progress" }, { label: "Assessment — New Client", time: "3:00 PM", type: "assessment" }] },
  { date: "Thu, Nov 20", items: [{ label: "Operations Standup", time: "8:30 AM", type: "huddle" }, { label: "Calendly Orientation", time: "10:00 AM", type: "orientation" }] },
  { date: "Fri, Nov 21", items: [{ label: "State Director Check-In", time: "9:00 AM", type: "leadership" }, { label: "Auth Deadline", time: "4:00 PM", type: "auth" }] },
];

/* ============ HELPERS ============ */
const toMin = (s: string) => { const [h,m] = s.split(":").map(Number); return h*60+m; };
const VIEWS = ["Day", "Week", "Month", "Agenda", "Team Availability"] as const;
type ViewKind = (typeof VIEWS)[number];

/* ============ PAGE ============ */
export default function OSCalendar() {
  const { role } = useOSRole();
  const { roleSlug } = useParams<{ roleSlug?: string }>();
  const urlRole = slugToRole(roleSlug);

  // No role in URL → redirect to the viewer's own calendar.
  if (!urlRole) {
    return <Navigate to={roleToCalendarPath(role)} replace />;
  }

  // Trying to access another role's calendar → only super_admin may do so.
  if (urlRole !== role && role !== "super_admin") {
    return <Navigate to={roleToCalendarPath(role)} replace />;
  }

  const config = ROLE_CALENDAR_CONFIG[urlRole];
  const [view, setView] = useState<ViewKind>("Week");
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [activeSources, setActiveSources] = useState<Record<Source, boolean>>({ microsoft: true, calendly: true, blossom: true });
  const [showConnect, setShowConnect] = useState(false);
  const [miniMonth] = useState(new Date(2025, 10, 1)); // Nov 2025
  const [today] = useState(17);
  const [selectedDay, setSelectedDay] = useState(17);

  const allowedTypes = useMemo(() => eventTypesForRole(urlRole), [urlRole]);
  const events = useMemo(
    () =>
      MOCK_EVENTS.filter(
        (e) => activeSources[e.source] && (!allowedTypes || allowedTypes.includes(e.type)),
      ),
    [activeSources, allowedTypes],
  );

  return (
    <OSShell>
      <div className="space-y-5 pb-10">
        {/* HERO */}
        <Hero onConnect={() => setShowConnect(true)} config={config} />

        {/* VIEW TABS + DATE NAV */}
        <div className="os-glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-[12px] font-semibold transition",
                  view === v
                    ? "bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_8px_22px_-10px_hsl(265_85%_60%/0.6)]"
                    : "text-foreground/70 hover:bg-foreground/[0.05]"
                )}
              >{v}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="os-glass-icon h-9 w-9"><ChevronLeft className="h-4 w-4" /></button>
            <div className="rounded-xl bg-white/70 px-3 py-1.5 text-[12.5px] font-semibold tracking-tight">November 17 – 23, 2025</div>
            <button className="os-glass-icon h-9 w-9"><ChevronRight className="h-4 w-4" /></button>
            <button className="ml-1 rounded-xl border border-foreground/10 bg-white/70 px-3 py-1.5 text-[12px] font-semibold hover:bg-white">Today</button>
            <div className="ml-2 hidden items-center gap-1.5 rounded-xl border border-foreground/10 bg-white/70 px-2.5 py-1.5 text-[11.5px] text-muted-foreground md:flex">
              <Cloud className="h-3.5 w-3.5 text-emerald-500" /> Synced 2m ago
            </div>
          </div>
        </div>

        {/* 3-COL LAYOUT */}
        <div className="grid grid-cols-12 gap-5">
          {/* LEFT SIDEBAR */}
          <aside className="col-span-12 space-y-4 lg:col-span-3">
            <MiniCalendar today={today} selectedDay={selectedDay} onSelect={setSelectedDay} />
            <ConnectedCalendarsCard onConnect={() => setShowConnect(true)} />
            <SourceFilters active={activeSources} onToggle={(s) => setActiveSources((p) => ({ ...p, [s]: !p[s] }))} />
            <CategoryFilters />
            <TeamCalendarsCard />
          </aside>

          {/* MAIN */}
          <main className="col-span-12 space-y-4 lg:col-span-6">
            {view === "Week" && <WeekView events={events} onSelect={setSelected} />}
            {view === "Day" && <DayView events={events.filter((e) => e.day === 0)} onSelect={setSelected} />}
            {view === "Month" && <MonthView events={events} />}
            {view === "Agenda" && <AgendaView events={events} onSelect={setSelected} />}
            {view === "Team Availability" && <TeamView />}

            <StateTimeline />
          </main>

          {/* RIGHT RAIL */}
          <aside className="col-span-12 space-y-4 lg:col-span-3">
            <TodayPriorities config={config} />
            <ConflictsPanel />
            <AIPanel config={config} />
            <QuickActions />
          </aside>
        </div>
      </div>

      {/* EVENT DRAWER */}
      {selected && <EventDrawer event={selected} onClose={() => setSelected(null)} />}
      {showConnect && <ConnectModal onClose={() => setShowConnect(false)} />}
    </OSShell>
  );
}

/* ============ HERO ============ */
function Hero({ onConnect, config }: { onConnect: () => void; config: RoleCalendarConfig }) {
  return (
    <section className="os-glass-panel relative overflow-hidden rounded-3xl">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-[hsl(330_85%_70%/0.10)] blur-3xl" />
      <div className="absolute -left-16 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-[hsl(200_85%_70%/0.18)] to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-50/80 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-violet-700">
            <Sparkles className="h-3 w-3" /> {config.badge}
          </div>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">{config.title}</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">{config.subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {config.stats.map((s, i) => (
              <Stat key={i} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              className="os-glass-input h-10 w-64 rounded-xl pl-9 pr-3 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none"
              placeholder="Search meetings, interviews, clients, staff…"
            />
          </div>
          <select className="os-glass-input h-10 rounded-xl px-3 text-[12.5px] focus:outline-none">
            <option>North Carolina</option><option>South Carolina</option><option>All states</option>
          </select>
          <button onClick={onConnect} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-foreground/10 bg-white/70 px-3.5 text-[12.5px] font-semibold hover:bg-white">
            <Link2 className="h-3.5 w-3.5" /> Connect Calendar
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-foreground/10 bg-white/70 px-3 text-[12.5px] font-semibold hover:bg-white">
            <RefreshCw className="h-3.5 w-3.5" /> Sync
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-foreground/10 bg-white/70 px-3 text-[12.5px] font-semibold hover:bg-white">
            <Settings2 className="h-3.5 w-3.5" /> Availability
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] px-4 text-[12.5px] font-semibold text-white shadow-[0_10px_26px_-12px_hsl(265_85%_60%/0.55)] hover:opacity-95">
            <Plus className="h-3.5 w-3.5" /> Add Event
          </button>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-foreground/[0.06] bg-white/70 px-3 py-1.5">
      <div className={cn("grid h-7 w-7 place-items-center rounded-lg", `bg-${tone}-100 text-${tone}-600`)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-[12.5px] font-semibold tracking-tight">{value}</div>
    </div>
  );
}

/* ============ LEFT SIDEBAR ============ */
function MiniCalendar({ today, selectedDay, onSelect }: { today: number; selectedDay: number; onSelect: (d: number) => void }) {
  const month = "November 2025";
  const startDow = 6; // Nov 1 2025 = Sat (0=Sun in this layout)
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const grid: (number | null)[] = [...Array(startDow).fill(null), ...days];
  const eventDays = new Set([3,5,10,12,14,17,18,19,20,21,24,26,28]);
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold tracking-tight">{month}</p>
        <div className="flex items-center gap-1">
          <button className="os-glass-icon h-7 w-7"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <button className="os-glass-icon h-7 w-7"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            onClick={() => d && onSelect(d)}
            className={cn(
              "relative grid h-8 place-items-center rounded-lg text-[11.5px] font-medium transition",
              !d && "invisible",
              d === selectedDay && "bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_6px_16px_-8px_hsl(265_85%_60%/0.5)]",
              d && d !== selectedDay && "text-foreground/80 hover:bg-foreground/[0.05]",
              d === today && d !== selectedDay && "ring-1 ring-violet-300",
            )}
          >
            {d}
            {d && eventDays.has(d) && d !== selectedDay && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-violet-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConnectedCalendarsCard({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold tracking-tight">Connected calendars</p>
        <button onClick={onConnect} className="text-[10.5px] font-semibold text-violet-600 hover:underline">Manage</button>
      </div>
      <div className="space-y-2">
        {CONNECTED.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-foreground/[0.06] bg-white/70 px-2.5 py-2">
            <div className={cn("grid h-8 w-8 place-items-center rounded-lg", `bg-${c.color}-100 text-${c.color}-600`)}>
              <c.icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold">{c.name}</p>
              <p className="truncate text-[10.5px] text-muted-foreground">{c.email} · {c.events} events</p>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {c.last}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceFilters({ active, onToggle }: { active: Record<Source, boolean>; onToggle: (s: Source) => void }) {
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <p className="mb-3 text-[13px] font-semibold tracking-tight">Sources</p>
      <div className="space-y-1.5">
        {(Object.keys(SOURCE_META) as Source[]).map((s) => {
          const m = SOURCE_META[s];
          return (
            <button
              key={s}
              onClick={() => onToggle(s)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] hover:bg-foreground/[0.04]"
            >
              <span className={cn("grid h-4 w-4 place-items-center rounded-md border", active[s] ? "border-violet-400 bg-violet-500 text-white" : "border-foreground/20")}>
                {active[s] && <Check className="h-3 w-3" />}
              </span>
              <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryFilters() {
  const cats: EventType[] = ["leadership","huddle","bcba","rbt","interview","training","site","auth","escalation","parent","intake","assessment","progress","staffing","orientation","task","personal"];
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <p className="mb-3 text-[13px] font-semibold tracking-tight">Event categories</p>
      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => {
          const m = TYPE_META[c];
          return (
            <span key={c} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", m.chip)}>
              <m.icon className="h-3 w-3" /> {m.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TeamCalendarsCard() {
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <p className="mb-3 text-[13px] font-semibold tracking-tight">Team calendars</p>
      <div className="space-y-1">
        {TEAM.slice(0, 4).map((t) => (
          <label key={t.name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] hover:bg-foreground/[0.04]">
            <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-violet-500" />
            <span className={cn("h-2.5 w-2.5 rounded-full", `bg-${t.color}-400`)} />
            <span className="truncate font-medium">{t.name}</span>
          </label>
        ))}
        <button className="mt-1 text-[11px] font-semibold text-violet-600 hover:underline">+ Add team member</button>
      </div>
    </div>
  );
}

/* ============ WEEK VIEW ============ */
function WeekView({ events, onSelect }: { events: CalEvent[]; onSelect: (e: CalEvent) => void }) {
  const dateNums = [17, 18, 19, 20, 21, 22, 23];
  const nowMin = toMin("10:24");
  return (
    <div className="os-glass-panel overflow-hidden rounded-2xl">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-foreground/[0.06] bg-white/40">
        <div />
        {WEEK_DAYS.map((d, i) => (
          <div key={d} className="border-l border-foreground/[0.06] px-2 py-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{d}</div>
            <div className={cn("mt-0.5 inline-grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold",
              dateNums[i] === 17 ? "bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white" : "text-foreground/80")}>
              {dateNums[i]}
            </div>
          </div>
        ))}
      </div>
      <div className="relative grid grid-cols-[60px_repeat(7,1fr)] max-h-[640px] overflow-y-auto">
        {/* hour col */}
        <div>
          {HOURS.map((h) => (
            <div key={h} className="h-16 border-b border-foreground/[0.04] pr-2 text-right text-[10px] font-medium text-muted-foreground">
              <span className="relative -top-1.5">{h > 12 ? `${h-12} PM` : h === 12 ? "12 PM" : `${h} AM`}</span>
            </div>
          ))}
        </div>
        {/* days */}
        {WEEK_DAYS.map((_, di) => (
          <div key={di} className="relative border-l border-foreground/[0.06]">
            {HOURS.map((h) => (
              <div key={h} className="h-16 border-b border-foreground/[0.04] hover:bg-violet-50/30" />
            ))}
            {/* now indicator on today (Mon) */}
            {di === 0 && (
              <div className="absolute left-0 right-0 z-10" style={{ top: `${((nowMin - 7*60) / 60) * 64}px` }}>
                <div className="relative h-px bg-rose-500">
                  <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
                </div>
              </div>
            )}
            {events.filter((e) => e.day === di).map((e) => {
              const top = ((toMin(e.start) - 7*60) / 60) * 64;
              const height = ((toMin(e.end) - toMin(e.start)) / 60) * 64 - 2;
              const m = TYPE_META[e.type];
              return (
                <button
                  key={e.id}
                  onClick={() => onSelect(e)}
                  className={cn(
                    "absolute left-1 right-1 overflow-hidden rounded-lg border bg-white p-1.5 text-left shadow-[0_6px_18px_-10px_rgba(15,23,42,0.18)] transition hover:shadow-[0_10px_24px_-10px_rgba(15,23,42,0.28)]",
                    e.conflict && "ring-2 ring-red-300 animate-pulse"
                  )}
                  style={{ top: `${top}px`, height: `${Math.max(height, 28)}px`, borderColor: "hsl(var(--border))" }}
                >
                  <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-lg bg-gradient-to-b", m.bar)} />
                  <div className="pl-1.5">
                    <p className="truncate text-[10.5px] font-semibold leading-tight">{e.title}</p>
                    <p className="mt-0.5 truncate text-[9.5px] text-muted-foreground">{e.start} · {SOURCE_META[e.source].label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ DAY VIEW ============ */
function DayView({ events, onSelect }: { events: CalEvent[]; onSelect: (e: CalEvent) => void }) {
  const nowMin = toMin("10:24");
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[16px] font-semibold tracking-tight">Monday, November 17</p>
          <p className="text-[11.5px] text-muted-foreground">{events.length} events · 1 escalation · 1 site visit</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">On track</span>
      </div>
      <div className="relative grid grid-cols-[60px_1fr] max-h-[640px] overflow-y-auto">
        <div>
          {HOURS.map((h) => (
            <div key={h} className="h-16 border-b border-foreground/[0.04] pr-2 text-right text-[10px] font-medium text-muted-foreground">
              <span className="relative -top-1.5">{h > 12 ? `${h-12} PM` : h === 12 ? "12 PM" : `${h} AM`}</span>
            </div>
          ))}
        </div>
        <div className="relative border-l border-foreground/[0.06]">
          {HOURS.map((h) => (<div key={h} className="h-16 border-b border-foreground/[0.04] hover:bg-violet-50/30" />))}
          <div className="absolute left-0 right-0 z-10" style={{ top: `${((nowMin - 7*60) / 60) * 64}px` }}>
            <div className="relative h-px bg-rose-500"><span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-rose-500" /></div>
          </div>
          {events.map((e) => {
            const top = ((toMin(e.start) - 7*60) / 60) * 64;
            const height = ((toMin(e.end) - toMin(e.start)) / 60) * 64 - 2;
            const m = TYPE_META[e.type];
            const SrcIcon = SOURCE_META[e.source].icon;
            return (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className="absolute left-2 right-2 overflow-hidden rounded-xl border border-foreground/[0.06] bg-white p-3 text-left shadow-[0_8px_22px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_14px_28px_-12px_rgba(15,23,42,0.25)]"
                style={{ top: `${top}px`, height: `${Math.max(height, 50)}px` }}
              >
                <div className={cn("absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-gradient-to-b", m.bar)} />
                <div className="pl-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold tracking-tight">{e.title}</p>
                    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold", SOURCE_META[e.source].chip)}>
                      <SrcIcon className="h-2.5 w-2.5" /> {SOURCE_META[e.source].label}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{e.start} – {e.end}{e.location ? ` · ${e.location}` : ""}</p>
                  {e.attendees.length > 0 && <p className="mt-1 truncate text-[10.5px] text-muted-foreground">{e.attendees.join(", ")}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ MONTH VIEW ============ */
function MonthView({ events }: { events: CalEvent[] }) {
  const startDow = 6;
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const grid: (number | null)[] = [...Array(startDow).fill(null), ...days];
  const eventBuckets: Record<number, EventType[]> = {
    3: ["interview"], 5: ["leadership","training"], 10: ["bcba","site"], 12: ["progress","auth"],
    14: ["training"], 17: ["huddle","site","auth"], 18: ["leadership","interview","escalation"],
    19: ["progress","interview","assessment"], 20: ["huddle","orientation"], 21: ["leadership","auth"],
    24: ["bcba"], 26: ["training","interview"], 28: ["staffing"],
  };
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <p className="mb-3 text-[14px] font-semibold tracking-tight">November 2025</p>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-foreground/[0.06]">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="bg-white/70 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
        ))}
        {grid.map((d, i) => (
          <div key={i} className={cn("min-h-[88px] bg-white/80 p-1.5", d === 17 && "bg-violet-50/60")}>
            {d && (
              <>
                <div className={cn("mb-1 text-[10.5px] font-semibold", d === 17 ? "text-violet-700" : "text-foreground/70")}>{d}</div>
                <div className="space-y-0.5">
                  {(eventBuckets[d] || []).slice(0, 3).map((t, idx) => {
                    const m = TYPE_META[t];
                    return (
                      <div key={idx} className={cn("flex items-center gap-1 truncate rounded px-1 py-0.5 text-[9.5px] font-medium", m.chip)}>
                        <m.icon className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{m.label}</span>
                      </div>
                    );
                  })}
                  {(eventBuckets[d]?.length || 0) > 3 && (
                    <div className="text-[9px] font-semibold text-muted-foreground">+{eventBuckets[d].length - 3} more</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ AGENDA VIEW ============ */
function AgendaView({ events, onSelect }: { events: CalEvent[]; onSelect: (e: CalEvent) => void }) {
  const grouped = WEEK_DAYS.map((d, i) => ({ day: d, date: 17 + i, items: events.filter((e) => e.day === i).sort((a,b) => toMin(a.start) - toMin(b.start)) }));
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.day}>
            <div className="mb-2 flex items-center gap-2">
              <p className="text-[13px] font-semibold tracking-tight">{g.day}, Nov {g.date}</p>
              <span className="text-[10.5px] text-muted-foreground">· {g.items.length} events</span>
            </div>
            <div className="space-y-1.5">
              {g.items.map((e) => {
                const m = TYPE_META[e.type];
                const SrcIcon = SOURCE_META[e.source].icon;
                return (
                  <button
                    key={e.id}
                    onClick={() => onSelect(e)}
                    className="flex w-full items-center gap-3 rounded-xl border border-foreground/[0.06] bg-white/70 px-3 py-2 text-left transition hover:bg-white hover:shadow-[0_8px_22px_-12px_rgba(15,23,42,0.15)]"
                  >
                    <div className="w-14 text-[10.5px] font-semibold tabular-nums text-muted-foreground">{e.start}</div>
                    <div className={cn("h-8 w-1 rounded-full bg-gradient-to-b", m.bar)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold">{e.title}</p>
                      <p className="truncate text-[10.5px] text-muted-foreground">{m.label}{e.location ? ` · ${e.location}` : ""}{e.attendees.length ? ` · ${e.attendees.length} attendees` : ""}</p>
                    </div>
                    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold", SOURCE_META[e.source].chip)}>
                      <SrcIcon className="h-2.5 w-2.5" /> {SOURCE_META[e.source].label}
                    </span>
                    {e.link && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                        <Video className="h-2.5 w-2.5" /> Join
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ TEAM AVAILABILITY ============ */
function TeamView() {
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-semibold tracking-tight">Team availability — Mon, Nov 17</p>
        <button className="inline-flex items-center gap-1 rounded-lg border border-foreground/10 bg-white/70 px-2.5 py-1 text-[11px] font-semibold hover:bg-white">
          <Sparkles className="h-3 w-3 text-violet-500" /> Suggest meeting time
        </button>
      </div>
      <div className="grid grid-cols-[200px_1fr] gap-px overflow-hidden rounded-xl bg-foreground/[0.06]">
        <div className="bg-white/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Person</div>
        <div className="grid grid-cols-12 bg-white/80 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {Array.from({ length: 12 }, (_, i) => 8 + i).map((h) => (
            <div key={h} className="border-l border-foreground/[0.06] px-1 py-2 text-center">{h > 12 ? `${h-12}P` : `${h}A`}</div>
          ))}
        </div>
        {TEAM.map((t) => (
          <div key={t.name} className="contents">
            <div className="flex items-center gap-2 bg-white/80 px-3 py-2.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", `bg-${t.color}-400`)} />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold">{t.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{t.role}</p>
              </div>
            </div>
            <div className="relative grid grid-cols-12 bg-white/80">
              {Array.from({ length: 12 }, (_, i) => (<div key={i} className="border-l border-foreground/[0.06]" />))}
              {t.busy.map(([s, e], idx) => {
                const left = ((s - 8) / 12) * 100;
                const width = ((e - s) / 12) * 100;
                return (
                  <div
                    key={idx}
                    className={cn("absolute top-1.5 bottom-1.5 rounded-md bg-gradient-to-r", `from-${t.color}-300 to-${t.color}-400`)}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-3 text-[11.5px] text-emerald-800">
        <span className="font-semibold">Suggested free window:</span> Thursday 9:00 – 9:30 AM works for State Dir, Asst State Dir, Scheduling and HR.
      </div>
    </div>
  );
}

/* ============ STATE TIMELINE ============ */
function StateTimeline() {
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold tracking-tight">State Operations Timeline</p>
          <p className="text-[11px] text-muted-foreground">Operational deadlines, follow-ups & checkpoints for NC</p>
        </div>
        <button className="text-[11px] font-semibold text-violet-600 hover:underline">Open workflow center →</button>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
        {TIMELINE.map((d) => (
          <div key={d.date} className="rounded-xl border border-foreground/[0.06] bg-white/70 p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{d.date}</p>
            <div className="mt-2 space-y-1.5">
              {d.items.map((it, idx) => {
                const m = TYPE_META[it.type as EventType];
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <div className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md", m.chip)}>
                      <m.icon className="h-2.5 w-2.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-semibold leading-tight">{it.label}</p>
                      <p className="text-[10px] text-muted-foreground">{it.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ RIGHT RAIL ============ */
function TodayPriorities({ config }: { config: RoleCalendarConfig }) {
  const TODAY_PRIORITIES = config.todayPriorities;
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold tracking-tight">Today's priorities</p>
        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9.5px] font-bold text-violet-700">{TODAY_PRIORITIES.length}</span>
      </div>
      <div className="space-y-1.5">
        {TODAY_PRIORITIES.map((p) => (
          <div key={p.id} className="flex items-start gap-2.5 rounded-xl border border-foreground/[0.06] bg-white/70 px-2.5 py-2">
            <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", `bg-${p.tone}-100 text-${p.tone}-600`)}>
              <p.icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold leading-tight">{p.label}</p>
              <p className="text-[10.5px] text-muted-foreground">{p.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConflictsPanel() {
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-red-100 text-red-600"><AlertTriangle className="h-3.5 w-3.5" /></div>
          <p className="text-[13px] font-semibold tracking-tight">{CONFLICTS.length} conflicts detected</p>
        </div>
      </div>
      <div className="space-y-2">
        {CONFLICTS.map((c) => (
          <div key={c.id} className="rounded-xl border border-red-200/60 bg-red-50/40 p-2.5">
            <p className="text-[11.5px] font-semibold">{c.a} ⟷ {c.b}</p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">{c.time}</p>
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-[10.5px] text-rose-700">→ {c.suggestion}</p>
              <button className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-white">Resolve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIPanel({ config }: { config: RoleCalendarConfig }) {
  const AI_INSIGHTS = config.aiInsights;
  return (
    <div className="os-glass-panel relative overflow-hidden rounded-2xl p-4">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-[hsl(330_85%_70%/0.10)] blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <p className="text-[13px] font-semibold tracking-tight">AI Calendar Assistant</p>
        </div>
        <div className="space-y-2">
          {AI_INSIGHTS.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-foreground/[0.06] bg-white/70 px-2.5 py-2">
              <s.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
              <p className="text-[11.5px] leading-snug text-foreground/85">{s.text}</p>
            </div>
          ))}
        </div>
        <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-violet-200 bg-white/70 px-3 py-1.5 text-[11.5px] font-semibold text-violet-700 hover:bg-white">
          Ask AI to plan my week <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Add meeting",            icon: Plus },
    { label: "Schedule interview",     icon: UserPlus },
    { label: "BCBA check-in",          icon: Heart },
    { label: "Team huddle",            icon: Megaphone },
    { label: "Create follow-up task",  icon: ListChecks },
    { label: "Send reminder",          icon: Bell },
  ];
  return (
    <div className="os-glass-panel rounded-2xl p-4">
      <p className="mb-3 text-[13px] font-semibold tracking-tight">Quick actions</p>
      <div className="grid grid-cols-2 gap-1.5">
        {actions.map((a) => (
          <button key={a.label} className="flex items-center gap-1.5 rounded-xl border border-foreground/[0.06] bg-white/70 px-2.5 py-2 text-[11px] font-semibold hover:bg-white">
            <a.icon className="h-3 w-3 text-violet-500" />
            <span className="truncate">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============ EVENT DRAWER ============ */
function EventDrawer({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  const m = TYPE_META[event.type];
  const SrcIcon = SOURCE_META[event.source].icon;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[460px] overflow-y-auto bg-white shadow-2xl">
        <div className={cn("relative h-24 overflow-hidden bg-gradient-to-br", m.bar)}>
          <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-white/30 text-white backdrop-blur hover:bg-white/40">
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/30 text-white backdrop-blur">
              <m.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">{m.label}</p>
              <p className="text-[15px] font-semibold tracking-tight text-white">{event.title}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold", SOURCE_META[event.source].chip)}>
              <SrcIcon className="h-2.5 w-2.5" /> {SOURCE_META[event.source].label}
            </span>
            {event.status && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{event.status}</span>}
            {event.conflict && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">Conflict</span>}
          </div>

          <Row icon={Clock} label="Time" value={`${event.start} – ${event.end} · Mon Nov 17, 2025`} />
          {event.location && <Row icon={MapPin} label="Location" value={event.location} />}
          {event.link && <Row icon={Video} label="Meeting link" value={event.link} link />}
          <Row icon={Users} label="Attendees" value={event.attendees.join(", ") || "—"} />
          {event.related && <Row icon={Link2} label="Related" value={`${event.related.kind}: ${event.related.name}`} />}
          {event.notes && <Row icon={FileText} label="Notes" value={event.notes} />}

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Actions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Join meeting", icon: Video, primary: true },
                { label: "Edit event", icon: Settings2 },
                { label: "Reschedule", icon: CalendarDays },
                { label: "Cancel", icon: X },
                { label: "Add note", icon: FileText },
                { label: "Create task", icon: ListChecks },
                { label: "Send reminder", icon: Bell },
                { label: "Open record", icon: ExternalLink },
              ].map((a) => (
                <button key={a.label} className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11.5px] font-semibold transition",
                  a.primary
                    ? "bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_8px_22px_-12px_hsl(265_85%_60%/0.5)]"
                    : "border border-foreground/10 bg-white hover:bg-foreground/[0.04]"
                )}>
                  <a.icon className="h-3 w-3" /> {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-violet-200/60 bg-violet-50/40 p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-violet-700">AI suggestion</p>
            <p className="mt-1 text-[11.5px] leading-snug text-foreground/85">After this meeting, create a follow-up task for unresolved staffing item and send a recap to attendees.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-foreground/[0.06] bg-white/70 px-3 py-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("mt-0.5 break-words text-[12px] font-medium", link && "text-violet-600 hover:underline")}>{value}</p>
      </div>
    </div>
  );
}

/* ============ CONNECT MODAL ============ */
function ConnectModal({ onClose }: { onClose: () => void }) {
  const providers = [
    { id: "ms", name: "Microsoft Calendar", desc: "Sync Outlook events, attendees, Teams links, and free/busy.", icon: Mail, color: "blue", connected: true, account: "director@blossomaba.com", events: 142, last: "2 min ago" },
    { id: "cal", name: "Calendly", desc: "Sync scheduled events, invitees, and event types automatically.", icon: Link2, color: "violet", connected: true, account: "director@blossomaba.com", events: 38, last: "5 min ago" },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-foreground/[0.06] p-5">
          <div>
            <p className="text-[16px] font-semibold tracking-tight">Connected calendars</p>
            <p className="text-[11.5px] text-muted-foreground">Connect Microsoft Calendar and Calendly to unify your schedule.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-foreground/10 hover:bg-foreground/[0.04]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          {providers.map((p) => (
            <div key={p.id} className="rounded-2xl border border-foreground/[0.08] bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <div className={cn("grid h-11 w-11 place-items-center rounded-xl", `bg-${p.color}-100 text-${p.color}-600`)}>
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold tracking-tight">{p.name}</p>
                    {p.connected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">{p.desc}</p>
                  {p.connected && (
                    <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-foreground/[0.03] p-2 text-[10.5px]">
                      <div><p className="text-muted-foreground">Account</p><p className="truncate font-semibold">{p.account}</p></div>
                      <div><p className="text-muted-foreground">Events synced</p><p className="font-semibold">{p.events}</p></div>
                      <div><p className="text-muted-foreground">Last sync</p><p className="font-semibold">{p.last}</p></div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {p.connected ? (
                    <>
                      <button className="inline-flex items-center justify-center gap-1 rounded-lg border border-foreground/10 bg-white px-3 py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.04]"><RefreshCw className="h-3 w-3" /> Reconnect</button>
                      <button className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50">Disconnect</button>
                    </>
                  ) : (
                    <button className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] px-3 py-1.5 text-[11px] font-semibold text-white">Connect {p.name}</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <p className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3 text-[11px] text-muted-foreground">
            Integration architecture is ready. Microsoft Graph Calendar API and Calendly API will be wired in the next phase. Sync settings, free/busy, and event creation flows are scaffolded.
          </p>
        </div>
      </div>
    </div>
  );
}
