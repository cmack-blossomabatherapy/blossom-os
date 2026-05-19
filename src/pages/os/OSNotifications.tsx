import { useMemo, useState } from "react";
import {
  Bell, MessageSquare, Search, Plus, Megaphone, CheckCheck, Settings2,
  Inbox, AtSign, UserCheck, Flame, ShieldCheck, Archive, Pin, BellOff,
  Hash, Users, Building2, MapPin, ListChecks, GraduationCap, CalendarDays,
  UserPlus, Heart, FileCheck2, Clock, DollarSign, ClipboardCheck,
  HeartHandshake, Bot, Sparkles, Brain, Zap, Lightbulb, ArrowRight, X,
  Send, Paperclip, Smile, AtSign as At, Link2, MoreHorizontal, Check,
  ChevronRight, Star, AlertTriangle, CheckCircle2, FolderKanban, Workflow,
  Reply, Forward, BookmarkPlus, Bookmark, Phone, Video, Circle, FileText,
  Filter, ChevronDown,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";

/* ============ TYPES ============ */
type Priority = "low" | "normal" | "important" | "urgent" | "critical";
type Category =
  | "task" | "training" | "mention" | "dm" | "group" | "announcement"
  | "calendar" | "lead" | "client" | "auth" | "scheduling" | "recruiting"
  | "billing" | "qa" | "hr" | "system" | "approval" | "ai";

type Item = {
  id: string;
  kind: "notification" | "message";
  category: Category;
  priority: Priority;
  title: string;
  preview: string;
  sender?: { name: string; initials: string; color: string; online?: boolean };
  source: string;
  time: string;
  unread?: boolean;
  pinned?: boolean;
  archived?: boolean;
  mention?: boolean;
  assigned?: boolean;
  related?: { kind: string; name: string }[];
  body?: string;
  thread?: { from: string; initials: string; color: string; time: string; text: string; me?: boolean }[];
};

/* ============ CATEGORY META ============ */
const CAT: Record<Category, { label: string; icon: any; chip: string; bar: string }> = {
  task:         { label: "Task",          icon: ListChecks,     chip: "bg-violet-100 text-violet-700",   bar: "from-violet-400 to-violet-500" },
  training:     { label: "Training",      icon: GraduationCap,  chip: "bg-emerald-100 text-emerald-700", bar: "from-emerald-400 to-emerald-500" },
  mention:      { label: "Mention",       icon: AtSign,         chip: "bg-fuchsia-100 text-fuchsia-700", bar: "from-fuchsia-400 to-fuchsia-500" },
  dm:           { label: "Direct Msg",    icon: MessageSquare,  chip: "bg-sky-100 text-sky-700",         bar: "from-sky-400 to-sky-500" },
  group:        { label: "Group",         icon: Users,          chip: "bg-indigo-100 text-indigo-700",   bar: "from-indigo-400 to-indigo-500" },
  announcement: { label: "Announcement",  icon: Megaphone,      chip: "bg-purple-100 text-purple-700",   bar: "from-purple-400 to-purple-500" },
  calendar:     { label: "Calendar",      icon: CalendarDays,   chip: "bg-cyan-100 text-cyan-700",       bar: "from-cyan-400 to-cyan-500" },
  lead:         { label: "Lead",          icon: UserPlus,       chip: "bg-teal-100 text-teal-700",       bar: "from-teal-400 to-teal-500" },
  client:       { label: "Client",        icon: Heart,          chip: "bg-rose-100 text-rose-700",       bar: "from-rose-400 to-rose-500" },
  auth:         { label: "Authorization", icon: FileCheck2,     chip: "bg-orange-100 text-orange-700",   bar: "from-orange-400 to-orange-500" },
  scheduling:   { label: "Scheduling",    icon: CalendarDays,   chip: "bg-blue-100 text-blue-700",       bar: "from-blue-400 to-blue-500" },
  recruiting:   { label: "Recruiting",    icon: UserPlus,       chip: "bg-pink-100 text-pink-700",       bar: "from-pink-400 to-pink-500" },
  billing:      { label: "Billing",       icon: DollarSign,     chip: "bg-amber-100 text-amber-700",     bar: "from-amber-400 to-amber-500" },
  qa:           { label: "QA",            icon: ShieldCheck,    chip: "bg-lime-100 text-lime-700",       bar: "from-lime-400 to-lime-500" },
  hr:           { label: "HR",            icon: HeartHandshake, chip: "bg-rose-100 text-rose-700",       bar: "from-rose-400 to-rose-500" },
  system:       { label: "System",        icon: Bell,           chip: "bg-slate-100 text-slate-700",     bar: "from-slate-400 to-slate-500" },
  approval:     { label: "Approval",      icon: CheckCircle2,   chip: "bg-yellow-100 text-yellow-700",   bar: "from-yellow-400 to-yellow-500" },
  ai:           { label: "AI Insight",    icon: Sparkles,       chip: "bg-violet-100 text-violet-700",   bar: "from-violet-400 to-fuchsia-500" },
};

const PRIO: Record<Priority, { label: string; chip: string; dot: string }> = {
  low:       { label: "Low",       chip: "bg-slate-100 text-slate-600",   dot: "bg-slate-400" },
  normal:    { label: "Normal",    chip: "bg-blue-100 text-blue-700",     dot: "bg-blue-400" },
  important: { label: "Important", chip: "bg-amber-100 text-amber-700",   dot: "bg-amber-500" },
  urgent:    { label: "Urgent",    chip: "bg-orange-100 text-orange-700", dot: "bg-orange-500 animate-pulse" },
  critical:  { label: "Critical",  chip: "bg-red-100 text-red-700",       dot: "bg-red-500 animate-pulse" },
};

/* ============ MOCK DATA ============ */
const NAV_SECTIONS = [
  {
    label: "Inbox",
    items: [
      { id: "all",       label: "All",          icon: Inbox,     count: 47 },
      { id: "unread",    label: "Unread",       icon: Circle,    count: 12, accent: true },
      { id: "mentions",  label: "Mentions",     icon: AtSign,    count: 4 },
      { id: "assigned",  label: "Assigned to me", icon: UserCheck, count: 6 },
      { id: "urgent",    label: "Urgent",       icon: Flame,     count: 3, urgent: true },
      { id: "approvals", label: "Approvals",    icon: ShieldCheck, count: 2 },
      { id: "archived",  label: "Archived",     icon: Archive,   count: 0 },
    ],
  },
  {
    label: "Messages",
    items: [
      { id: "dm",       label: "Direct Messages", icon: MessageSquare, count: 5 },
      { id: "groups",   label: "Group Chats",     icon: Users,         count: 3 },
      { id: "depts",    label: "Departments",     icon: Building2,     count: 8 },
      { id: "states",   label: "State Channels",  icon: MapPin,        count: 2 },
    ],
  },
  {
    label: "Operational alerts",
    items: [
      { id: "tasks",      label: "Tasks",          icon: ListChecks,     count: 9 },
      { id: "training",   label: "Training",       icon: GraduationCap,  count: 4 },
      { id: "calendar",   label: "Calendar",       icon: CalendarDays,   count: 3 },
      { id: "leads",      label: "Leads",          icon: UserPlus,       count: 2 },
      { id: "clients",    label: "Clients",        icon: Heart,          count: 5 },
      { id: "auths",      label: "Authorizations", icon: FileCheck2,     count: 6 },
      { id: "sched",      label: "Scheduling",     icon: CalendarDays,   count: 4 },
      { id: "recruiting", label: "Recruiting",     icon: UserPlus,       count: 1 },
      { id: "billing",    label: "Billing",        icon: DollarSign,     count: 2 },
      { id: "qa",         label: "QA",             icon: ShieldCheck,    count: 1 },
      { id: "hr",         label: "HR",             icon: HeartHandshake, count: 0 },
    ],
  },
  {
    label: "Announcements",
    items: [
      { id: "company", label: "Company-wide", icon: Megaphone, count: 1 },
      { id: "dept",    label: "Department",   icon: Building2, count: 2 },
      { id: "state",   label: "State",        icon: MapPin,    count: 1 },
      { id: "lead",    label: "Leadership",   icon: ShieldCheck, count: 0 },
    ],
  },
  {
    label: "Saved",
    items: [
      { id: "pinned",     label: "Pinned",         icon: Pin,         count: 3 },
      { id: "saved",      label: "Saved Messages", icon: Bookmark,    count: 5 },
      { id: "followups",  label: "Follow-ups",     icon: BookmarkPlus, count: 4 },
    ],
  },
];

const CHANNELS = [
  { id: "ch1", name: "leadership",     icon: ShieldCheck,  unread: 0 },
  { id: "ch2", name: "operations",     icon: Workflow,     unread: 3 },
  { id: "ch3", name: "intake",         icon: ClipboardCheck, unread: 1 },
  { id: "ch4", name: "authorizations", icon: FileCheck2,   unread: 2 },
  { id: "ch5", name: "scheduling",     icon: CalendarDays, unread: 0 },
  { id: "ch6", name: "recruiting",     icon: UserPlus,     unread: 1 },
  { id: "ch7", name: "billing-finance",icon: DollarSign,   unread: 0 },
  { id: "ch8", name: "qa-compliance",  icon: ShieldCheck,  unread: 0 },
  { id: "ch9", name: "training",       icon: GraduationCap,unread: 4 },
];

const DMS = [
  { id: "u1", name: "Shira Lasry",   role: "COO",            initials: "SL", color: "violet",  online: true,  unread: 2, last: "Can you review the Charlotte staffing escalation?" },
  { id: "u2", name: "Corey Allen",   role: "State Director", initials: "CA", color: "fuchsia", online: true,  unread: 0, last: "Sent the NC weekly update" },
  { id: "u3", name: "Maria Lopez",   role: "BCBA Lead",      initials: "ML", color: "rose",    online: false, unread: 1, last: "Auth follow-up confirmed for J. Park" },
  { id: "u4", name: "Tyler Adler",   role: "Scheduling",     initials: "TA", color: "sky",     online: true,  unread: 0, last: "8 open hours covered for tomorrow" },
  { id: "u5", name: "Asha Romero",   role: "HR Director",    initials: "AR", color: "amber",   online: false, unread: 0, last: "New hire orientation deck attached" },
];

const ITEMS: Item[] = [
  {
    id: "n1", kind: "notification", category: "auth", priority: "critical",
    title: "Auth expiring in 4 days — James Smith",
    preview: "AET123456789 · 8 units remaining · Coordinator: Maya P.",
    source: "Authorizations",
    time: "12m",
    unread: true,
    mention: false,
    assigned: true,
    related: [{ kind: "Client", name: "James Smith" }, { kind: "Auth", name: "AET123456789" }],
    body: "Authorization AET123456789 for James Smith is set to expire on Nov 21, 2025. 8 units remain. Coordinator Maya P. flagged this as high priority due to ongoing weekly sessions.",
  },
  {
    id: "n2", kind: "message", category: "dm", priority: "important",
    title: "Shira Lasry",
    preview: "Can you review the Charlotte staffing escalation? Need a decision by EOD.",
    sender: { name: "Shira Lasry", initials: "SL", color: "violet", online: true },
    source: "Direct Message",
    time: "25m",
    unread: true,
    mention: true,
    related: [{ kind: "Issue", name: "INC-238" }],
    thread: [
      { from: "Shira Lasry", initials: "SL", color: "violet", time: "10:18 AM", text: "Hey — got a sec to look at the Charlotte staffing escalation?" },
      { from: "Shira Lasry", initials: "SL", color: "violet", time: "10:19 AM", text: "Two open shifts tomorrow, no RBT coverage. Tyler's flagged it." },
      { from: "Shira Lasry", initials: "SL", color: "violet", time: "10:24 AM", text: "Can you review and decide on the temp coverage option by EOD?" },
    ],
  },
  {
    id: "n3", kind: "notification", category: "task", priority: "urgent",
    title: "Task assigned: Review staffing escalation (INC-238)",
    preview: "Due today · Assigned by Shira Lasry · Priority: Urgent",
    source: "Tasks",
    time: "32m",
    unread: true,
    assigned: true,
    related: [{ kind: "Task", name: "TASK-2241" }],
    body: "Review Charlotte staffing escalation INC-238 and approve temporary coverage option. Due today by 5 PM.",
  },
  {
    id: "n4", kind: "notification", category: "training", priority: "important",
    title: "Training due: Intake Workflow v3",
    preview: "Due in 3 days · 18 min · Required for all coordinators",
    source: "Training Academy",
    time: "1h",
    unread: true,
    body: "Complete the Intake Workflow v3 training before Nov 20. The module covers the updated VOB and onboarding routing introduced last week.",
  },
  {
    id: "n5", kind: "notification", category: "calendar", priority: "normal",
    title: "Reminder: BCBA Check-In with Maria L.",
    preview: "Starts in 25 min · Teams · 30 minute meeting",
    source: "Calendar",
    time: "1h",
    unread: true,
    related: [{ kind: "Event", name: "BCBA Check-In" }],
  },
  {
    id: "n6", kind: "notification", category: "approval", priority: "important",
    title: "Approval needed: Publish new SOP — Auth Follow-Up Flow",
    preview: "Requested by QA Team · 12 pages",
    source: "SOP Library",
    time: "2h",
    unread: true,
    related: [{ kind: "SOP", name: "SOP-AUTH-014" }],
    body: "QA Team has submitted SOP-AUTH-014 (Auth Follow-Up Flow) for your review and publish approval.",
  },
  {
    id: "n7", kind: "notification", category: "mention", priority: "important",
    title: "Corey Allen mentioned you in #nc-state",
    preview: "@you — heads up, we need a final read on the Greensboro plan before Friday's huddle.",
    sender: { name: "Corey Allen", initials: "CA", color: "fuchsia", online: true },
    source: "#nc-state",
    time: "2h",
    unread: true,
    mention: true,
    related: [{ kind: "Channel", name: "#nc-state" }],
  },
  {
    id: "n8", kind: "notification", category: "client", priority: "normal",
    title: "New comment on Client: Olivia Johnson",
    preview: "Maria Lopez added a clinical note to the session log.",
    sender: { name: "Maria Lopez", initials: "ML", color: "rose" },
    source: "Clients",
    time: "3h",
    related: [{ kind: "Client", name: "Olivia Johnson" }],
  },
  {
    id: "n9", kind: "notification", category: "ai", priority: "important",
    title: "AI Insight: 3 leads at risk of going cold",
    preview: "No outreach in 5+ days. Suggest assigning to intake coordinator.",
    source: "Blossom AI",
    time: "3h",
    related: [{ kind: "Module", name: "Leads" }],
    body: "Three leads (Garcia, Patel, Nguyen) have had no outreach in 5+ days. Historical patterns suggest a 38% drop in conversion past this window. Recommend reassigning to active coordinator and scheduling outreach within 24h.",
  },
  {
    id: "n10", kind: "notification", category: "announcement", priority: "important",
    title: "Company-wide: New PTO policy effective Dec 1",
    preview: "Please review and acknowledge by Nov 30.",
    source: "Leadership",
    time: "5h",
    unread: false,
    body: "We're updating the PTO policy effective December 1, 2025. Highlights: new floating holiday, simplified request flow, and quarterly carryover. Please review the policy document and acknowledge in the HR module by Nov 30.",
  },
  {
    id: "n11", kind: "notification", category: "scheduling", priority: "urgent",
    title: "Scheduling conflict: 2 RBTs overlap for client Avery R.",
    preview: "Tomorrow 2:00 PM — auto-resolve suggested",
    source: "Scheduling",
    time: "6h",
    related: [{ kind: "Client", name: "Avery R." }],
  },
  {
    id: "n12", kind: "notification", category: "recruiting", priority: "normal",
    title: "Calendly interview booked: RBT Candidate D. Ortiz",
    preview: "Fri Nov 21 · 11:00 AM · Zoom",
    source: "Recruiting",
    time: "7h",
    related: [{ kind: "Candidate", name: "D. Ortiz" }],
  },
];

const AI_BRIEF = [
  { icon: Flame, text: "2 critical auth alerts need action today.", tone: "red" },
  { icon: MessageSquare, text: "3 unread direct messages from leadership.", tone: "violet" },
  { icon: GraduationCap, text: "2 trainings due this week — Intake Workflow v3 due in 3 days.", tone: "emerald" },
  { icon: CalendarDays, text: "5 meetings today. Next: BCBA Check-In in 25 min.", tone: "cyan" },
];

const ACKS = [
  { name: "PTO policy update", viewed: 142, total: 198, ack: 96 },
  { name: "Q4 state goals brief", viewed: 88, total: 124, ack: 71 },
];

/* ============ PAGE ============ */
export default function OSNotifications() {
  const [activeSection, setActiveSection] = useState("all");
  const [selectedId, setSelectedId] = useState<string>(ITEMS[1].id);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const filtered = useMemo(() => {
    if (activeSection === "unread") return ITEMS.filter((i) => i.unread);
    if (activeSection === "mentions") return ITEMS.filter((i) => i.mention);
    if (activeSection === "assigned") return ITEMS.filter((i) => i.assigned);
    if (activeSection === "urgent") return ITEMS.filter((i) => i.priority === "urgent" || i.priority === "critical");
    if (activeSection === "approvals") return ITEMS.filter((i) => i.category === "approval");
    if (activeSection === "dm") return ITEMS.filter((i) => i.category === "dm");
    return ITEMS;
  }, [activeSection]);

  const selected = ITEMS.find((i) => i.id === selectedId) || filtered[0];

  return (
    <OSShell>
      <div className="space-y-5 pb-10">
        <Hero onCompose={() => setShowCompose(true)} onSettings={() => setShowSettings(true)} />

        <div className="grid grid-cols-12 gap-4">
          {/* LEFT NAV */}
          <aside className="col-span-12 lg:col-span-3">
            <LeftNav active={activeSection} onSelect={setActiveSection} />
          </aside>

          {/* CENTER LIST */}
          <section className="col-span-12 lg:col-span-4">
            <InboxList items={filtered} selectedId={selected?.id} onSelect={setSelectedId} />
          </section>

          {/* RIGHT DETAIL */}
          <section className="col-span-12 lg:col-span-5">
            {selected ? (
              selected.kind === "message" ? (
                <MessageThread item={selected} />
              ) : (
                <NotificationDetail item={selected} />
              )
            ) : (
              <EmptyDetail />
            )}
          </section>
        </div>

        {/* Bottom row: AI brief + announcements tracker */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7"><AIDailyBrief /></div>
          <div className="col-span-12 lg:col-span-5"><AnnouncementsTracker /></div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
    </OSShell>
  );
}

/* ============ HERO ============ */
function Hero({ onCompose, onSettings }: { onCompose: () => void; onSettings: () => void }) {
  return (
    <section className="os-glass-panel relative overflow-hidden rounded-3xl">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-[hsl(330_85%_70%/0.10)] blur-3xl" />
      <div className="absolute -left-16 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-[hsl(200_85%_70%/0.18)] to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-50/80 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-violet-700">
            <Bell className="h-3 w-3" /> Communication Hub
          </div>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">Notifications & Messages</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            Stay on top of alerts, team communication, tasks, and workflow updates — unified for every role.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Stat icon={Inbox} label="Unread" value="12" tone="violet" />
            <Stat icon={AtSign} label="Mentions" value="4" tone="fuchsia" />
            <Stat icon={Flame} label="Urgent" value="3" tone="red" />
            <Stat icon={ShieldCheck} label="Approvals" value="2" tone="amber" />
            <Stat icon={MessageSquare} label="Active chats" value="11" tone="sky" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              className="os-glass-input h-10 w-72 rounded-xl pl-9 pr-12 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none"
              placeholder="Search messages, alerts, people, tasks…"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-border/70 bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
          </div>
          <button onClick={onCompose} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] px-4 text-[12.5px] font-semibold text-white shadow-[0_10px_26px_-12px_hsl(265_85%_60%/0.55)] hover:opacity-95">
            <Plus className="h-3.5 w-3.5" /> New message
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-foreground/10 bg-white/70 px-3 text-[12.5px] font-semibold hover:bg-white">
            <Megaphone className="h-3.5 w-3.5" /> Announcement
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-foreground/10 bg-white/70 px-3 text-[12.5px] font-semibold hover:bg-white">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
          <button onClick={onSettings} className="os-glass-icon h-10 w-10"><Settings2 className="h-4 w-4 text-muted-foreground" /></button>
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

/* ============ LEFT NAV ============ */
function LeftNav({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-3">
      {NAV_SECTIONS.map((sec) => (
        <div key={sec.label} className="os-glass-panel rounded-2xl p-3">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{sec.label}</p>
          <div className="space-y-0.5">
            {sec.items.map((it: any) => (
              <button
                key={it.id}
                onClick={() => onSelect(it.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12.5px] font-medium transition",
                  active === it.id
                    ? "bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_8px_22px_-12px_hsl(265_85%_60%/0.5)]"
                    : "text-foreground/80 hover:bg-foreground/[0.04]"
                )}
              >
                <it.icon className={cn("h-3.5 w-3.5 shrink-0", active === it.id ? "text-white" : "text-muted-foreground")} />
                <span className="flex-1 truncate">{it.label}</span>
                {it.count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    active === it.id ? "bg-white/25 text-white"
                      : it.urgent ? "bg-red-100 text-red-700"
                      : it.accent ? "bg-violet-100 text-violet-700"
                      : "bg-foreground/[0.06] text-muted-foreground"
                  )}>{it.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Direct Messages */}
      <div className="os-glass-panel rounded-2xl p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Direct messages</p>
          <button className="text-[10.5px] font-semibold text-violet-600 hover:underline">+ New</button>
        </div>
        <div className="space-y-0.5">
          {DMS.map((u) => (
            <button key={u.id} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-foreground/[0.04]">
              <Avatar initials={u.initials} color={u.color} online={u.online} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold">{u.name}</p>
                <p className="truncate text-[10.5px] text-muted-foreground">{u.role}</p>
              </div>
              {u.unread > 0 && <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-[9.5px] font-bold text-white">{u.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Channels */}
      <div className="os-glass-panel rounded-2xl p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Channels</p>
          <button className="text-[10.5px] font-semibold text-violet-600 hover:underline">Browse</button>
        </div>
        <div className="space-y-0.5">
          {CHANNELS.map((c) => (
            <button key={c.id} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-foreground/[0.04]">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate text-[12px] font-medium">{c.name}</span>
              {c.unread > 0 && <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9.5px] font-bold text-violet-700">{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Avatar({ initials, color, online, size = "sm" }: { initials: string; color: string; online?: boolean; size?: "sm" | "md" }) {
  return (
    <div className="relative shrink-0">
      <div className={cn("grid place-items-center rounded-full text-white font-bold",
        size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-[11.5px]",
        `bg-gradient-to-br from-${color}-400 to-${color}-500`)}>{initials}</div>
      {online !== undefined && (
        <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white", online ? "bg-emerald-500" : "bg-slate-300")} />
      )}
    </div>
  );
}

/* ============ INBOX LIST ============ */
function InboxList({ items, selectedId, onSelect }: { items: Item[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <div className="os-glass-panel flex h-[760px] flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-foreground/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold tracking-tight">Inbox</p>
          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">{items.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="os-glass-icon h-7 w-7"><Filter className="h-3.5 w-3.5 text-muted-foreground" /></button>
          <button className="inline-flex items-center gap-1 rounded-lg border border-foreground/10 bg-white/70 px-2 py-1 text-[10.5px] font-semibold hover:bg-white">
            Newest <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-600"><CheckCircle2 className="h-5 w-5" /></div>
              <p className="mt-3 text-[14px] font-semibold">You're all caught up.</p>
              <p className="text-[11.5px] text-muted-foreground">No items in this view.</p>
            </div>
          </div>
        ) : items.map((it) => {
          const m = CAT[it.category];
          const active = it.id === selectedId;
          return (
            <button
              key={it.id}
              onClick={() => onSelect(it.id)}
              className={cn(
                "group flex w-full gap-3 border-b border-foreground/[0.05] px-4 py-3 text-left transition",
                active ? "bg-gradient-to-r from-violet-50/80 to-transparent" : "hover:bg-foreground/[0.025]"
              )}
            >
              <div className="relative shrink-0">
                {it.sender ? (
                  <Avatar initials={it.sender.initials} color={it.sender.color} online={it.sender.online} />
                ) : (
                  <div className={cn("grid h-9 w-9 place-items-center rounded-xl", m.chip)}>
                    <m.icon className="h-4 w-4" />
                  </div>
                )}
                {it.unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-violet-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("truncate text-[12.5px] leading-tight", it.unread ? "font-semibold" : "font-medium text-foreground/85")}>{it.title}</p>
                  <span className="shrink-0 text-[10.5px] text-muted-foreground tabular-nums">{it.time}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{it.preview}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold", m.chip)}>
                    <m.icon className="h-2.5 w-2.5" /> {m.label}
                  </span>
                  {(it.priority === "urgent" || it.priority === "critical" || it.priority === "important") && (
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold", PRIO[it.priority].chip)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", PRIO[it.priority].dot)} />
                      {PRIO[it.priority].label}
                    </span>
                  )}
                  {it.mention && <span className="rounded-full bg-fuchsia-100 px-1.5 py-0.5 text-[9.5px] font-bold text-fuchsia-700">@mention</span>}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button className="grid h-6 w-6 place-items-center rounded-md hover:bg-foreground/[0.06]"><Pin className="h-3 w-3 text-muted-foreground" /></button>
                <button className="grid h-6 w-6 place-items-center rounded-md hover:bg-foreground/[0.06]"><Archive className="h-3 w-3 text-muted-foreground" /></button>
                <button className="grid h-6 w-6 place-items-center rounded-md hover:bg-foreground/[0.06]"><BellOff className="h-3 w-3 text-muted-foreground" /></button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ NOTIFICATION DETAIL ============ */
function NotificationDetail({ item }: { item: Item }) {
  const m = CAT[item.category];
  return (
    <div className="os-glass-panel flex h-[760px] flex-col overflow-hidden rounded-2xl">
      <div className={cn("relative h-24 overflow-hidden bg-gradient-to-br", m.bar)}>
        <div className="absolute bottom-3 left-5 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/30 text-white backdrop-blur">
            <m.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">{m.label} · {item.source}</p>
            <p className="text-[16px] font-semibold tracking-tight text-white">{item.title}</p>
          </div>
        </div>
        <button className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-white hover:bg-white/30"><MoreHorizontal className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold", PRIO[item.priority].chip)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", PRIO[item.priority].dot)} /> {PRIO[item.priority].label}
          </span>
          <span className="rounded-full border border-foreground/10 bg-white/70 px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">{item.time} ago</span>
          {item.related?.map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-violet-200/60 bg-violet-50 px-2 py-0.5 text-[10.5px] font-semibold text-violet-700">
              <Link2 className="h-2.5 w-2.5" /> {r.kind}: {r.name}
            </span>
          ))}
        </div>

        <div className="rounded-xl border border-foreground/[0.06] bg-white/70 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Message</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
            {item.body || item.preview}
          </p>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Smart actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {smartActions(item.category).map((a, i) => (
              <button key={i} className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11.5px] font-semibold transition",
                i === 0
                  ? "bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_8px_22px_-12px_hsl(265_85%_60%/0.5)]"
                  : "border border-foreground/10 bg-white hover:bg-foreground/[0.04]"
              )}>
                <a.icon className="h-3 w-3" /> {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Activity</p>
          <div className="space-y-2">
            {[
              { who: "Blossom OS", text: `Notification created · ${item.source}`, time: item.time + " ago" },
              { who: "System", text: "Routed by priority + role rules", time: item.time + " ago" },
              { who: "You", text: "Opened notification", time: "just now" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-foreground/[0.05] bg-white/60 px-3 py-2">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-semibold">{a.who}</p>
                  <p className="text-[11px] text-muted-foreground">{a.text}</p>
                </div>
                <span className="text-[10.5px] text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-violet-200/60 bg-violet-50/50 p-3">
          <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-violet-600" /><p className="text-[10.5px] font-semibold uppercase tracking-wider text-violet-700">AI suggestion</p></div>
          <p className="mt-1 text-[12px] leading-snug text-foreground/85">{aiSuggestion(item.category)}</p>
        </div>
      </div>
    </div>
  );
}

function smartActions(cat: Category): { label: string; icon: any }[] {
  switch (cat) {
    case "task":     return [{ label: "Open task", icon: ListChecks }, { label: "Complete", icon: Check }, { label: "Reassign", icon: UserCheck }, { label: "Snooze", icon: Clock }];
    case "training": return [{ label: "Open training", icon: GraduationCap }, { label: "Mark complete", icon: Check }, { label: "Snooze", icon: Clock }, { label: "Archive", icon: Archive }];
    case "calendar": return [{ label: "View event", icon: CalendarDays }, { label: "Join meeting", icon: Video }, { label: "Reschedule", icon: Clock }, { label: "Snooze", icon: BellOff }];
    case "auth":     return [{ label: "Open authorization", icon: FileCheck2 }, { label: "Assign follow-up", icon: UserCheck }, { label: "Message coordinator", icon: MessageSquare }, { label: "Escalate", icon: Flame }];
    case "client":   return [{ label: "Open client", icon: Heart }, { label: "Add note", icon: FileText }, { label: "Message team", icon: MessageSquare }, { label: "Archive", icon: Archive }];
    case "approval": return [{ label: "Approve", icon: Check }, { label: "Request changes", icon: Reply }, { label: "Open record", icon: ChevronRight }, { label: "Snooze", icon: Clock }];
    case "mention":  return [{ label: "Reply", icon: Reply }, { label: "Open channel", icon: Hash }, { label: "Pin", icon: Pin }, { label: "Mute", icon: BellOff }];
    case "ai":       return [{ label: "Take action", icon: Zap }, { label: "Open module", icon: ChevronRight }, { label: "Dismiss", icon: X }, { label: "Save insight", icon: Bookmark }];
    default:         return [{ label: "Open record", icon: ChevronRight }, { label: "Reply", icon: Reply }, { label: "Snooze", icon: Clock }, { label: "Archive", icon: Archive }];
  }
}

function aiSuggestion(cat: Category): string {
  switch (cat) {
    case "auth":     return "Auto-draft a follow-up message to the parent and schedule a re-auth task for the coordinator. Want me to prepare it?";
    case "task":     return "This task overlaps with two open calendar blocks today — I can move it to your protected work block at 4:00 PM.";
    case "calendar": return "After this meeting, create a recap task and send Maria L. the action items.";
    case "approval": return "QA flagged 2 minor items. I can list them inline so you can approve with comments in one click.";
    default:         return "Want me to summarize related conversations and prepare a quick reply?";
  }
}

/* ============ MESSAGE THREAD ============ */
function MessageThread({ item }: { item: Item }) {
  const messages = item.thread || [];
  return (
    <div className="os-glass-panel flex h-[760px] flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-foreground/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          {item.sender && <Avatar initials={item.sender.initials} color={item.sender.color} online={item.sender.online} size="md" />}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-semibold tracking-tight">{item.sender?.name || item.title}</p>
              {item.sender?.online && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">Online</span>}
            </div>
            <p className="text-[11px] text-muted-foreground">Direct message · Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="os-glass-icon h-8 w-8"><Phone className="h-3.5 w-3.5 text-muted-foreground" /></button>
          <button className="os-glass-icon h-8 w-8"><Video className="h-3.5 w-3.5 text-muted-foreground" /></button>
          <button className="os-glass-icon h-8 w-8"><Pin className="h-3.5 w-3.5 text-muted-foreground" /></button>
          <button className="os-glass-icon h-8 w-8"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>

      {item.related && item.related.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-foreground/[0.06] bg-white/40 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Related</span>
          {item.related.map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-violet-200/60 bg-violet-50 px-2 py-0.5 text-[10.5px] font-semibold text-violet-700">
              <Link2 className="h-2.5 w-2.5" /> {r.kind}: {r.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid place-items-center">
          <span className="rounded-full border border-foreground/10 bg-white/70 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Today</span>
        </div>
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} />
        ))}
        <Bubble msg={{ from: "You", initials: "YO", color: "fuchsia", time: "10:26 AM", text: "Looking at it now — pulling Tyler in for context.", me: true }} />
        <div className="flex items-center gap-2 px-1">
          <Avatar initials="SL" color="violet" online />
          <div className="rounded-2xl bg-foreground/[0.04] px-3 py-2">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "120ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "240ms" }} />
            </div>
          </div>
          <span className="text-[10.5px] text-muted-foreground">Shira is typing…</span>
        </div>
      </div>

      <div className="border-t border-foreground/[0.06] p-3">
        <div className="rounded-2xl border border-foreground/10 bg-white/70 p-2">
          <textarea
            rows={2}
            placeholder="Message Shira Lasry…"
            className="w-full resize-none bg-transparent px-2 py-1 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <div className="flex items-center justify-between border-t border-foreground/[0.05] pt-2">
            <div className="flex items-center gap-1">
              <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-foreground/[0.06]"><Paperclip className="h-3.5 w-3.5 text-muted-foreground" /></button>
              <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-foreground/[0.06]"><At className="h-3.5 w-3.5 text-muted-foreground" /></button>
              <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-foreground/[0.06]"><Link2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
              <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-foreground/[0.06]"><Smile className="h-3.5 w-3.5 text-muted-foreground" /></button>
              <div className="mx-1 h-4 w-px bg-foreground/10" />
              <button className="inline-flex items-center gap-1 rounded-md border border-foreground/10 bg-white px-1.5 py-0.5 text-[10px] font-semibold hover:bg-foreground/[0.04]">
                <ListChecks className="h-3 w-3 text-violet-500" /> Create task
              </button>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] px-3 py-1.5 text-[11.5px] font-semibold text-white">
              Send <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: { from: string; initials: string; color: string; time: string; text: string; me?: boolean } }) {
  return (
    <div className={cn("flex items-end gap-2", msg.me && "flex-row-reverse")}>
      <Avatar initials={msg.initials} color={msg.color} />
      <div className={cn("max-w-[78%]")}>
        <div className={cn("flex items-center gap-1.5 px-1 pb-0.5", msg.me && "justify-end")}>
          <span className="text-[10.5px] font-semibold">{msg.from}</span>
          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
        </div>
        <div className={cn(
          "rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed shadow-[0_6px_16px_-12px_rgba(15,23,42,0.18)]",
          msg.me
            ? "bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white rounded-br-md"
            : "bg-white border border-foreground/[0.06] text-foreground/85 rounded-bl-md"
        )}>
          {msg.text}
        </div>
        {!msg.me && (
          <div className="mt-1 flex items-center gap-1 px-1">
            <button className="rounded-full border border-foreground/10 bg-white/70 px-1.5 py-0.5 text-[10px] hover:bg-white">👍</button>
            <button className="rounded-full border border-foreground/10 bg-white/70 px-1.5 py-0.5 text-[10px] hover:bg-white">✅</button>
            <button className="rounded-full border border-foreground/10 bg-white/70 px-1.5 py-0.5 text-[10px] hover:bg-white">＋</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="os-glass-panel grid h-[760px] place-items-center rounded-2xl">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-600"><MessageSquare className="h-5 w-5" /></div>
        <p className="mt-3 text-[14px] font-semibold">Select a notification or message</p>
        <p className="text-[11.5px] text-muted-foreground">Choose an item from the inbox to view details.</p>
      </div>
    </div>
  );
}

/* ============ AI DAILY BRIEF ============ */
function AIDailyBrief() {
  return (
    <div className="os-glass-panel relative overflow-hidden rounded-2xl p-5">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.2)] to-[hsl(330_85%_70%/0.12)] blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-semibold tracking-tight">AI Daily Brief</p>
              <p className="text-[11px] text-muted-foreground">Curated by Blossom AI · refreshes every hour</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-50">
              <Zap className="h-3 w-3" /> Prioritize my day
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-foreground/10 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white">
              <Flame className="h-3 w-3" /> Urgent only
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-foreground/10 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white">
              <Reply className="h-3 w-3" /> Draft replies
            </button>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-foreground/85">
          You have <b>7 items needing attention</b>: 2 urgent authorization alerts, 3 unread messages from leadership, and 2 trainings due this week. The Charlotte staffing escalation is the highest-leverage item this morning.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {AI_BRIEF.map((b, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-foreground/[0.06] bg-white/70 px-2.5 py-2">
              <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", `bg-${b.tone}-100 text-${b.tone}-600`)}>
                <b.icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-[11px] leading-snug text-foreground/85">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ ANNOUNCEMENTS TRACKER ============ */
function AnnouncementsTracker() {
  return (
    <div className="os-glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-100 text-purple-600"><Megaphone className="h-4 w-4" /></div>
          <div>
            <p className="text-[14px] font-semibold tracking-tight">Announcements</p>
            <p className="text-[11px] text-muted-foreground">Acknowledgement tracking</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] px-3 py-1.5 text-[11px] font-semibold text-white">
          <Plus className="h-3 w-3" /> New
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {ACKS.map((a) => {
          const pct = Math.round((a.ack / a.total) * 100);
          return (
            <div key={a.name} className="rounded-xl border border-foreground/[0.06] bg-white/70 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold">{a.name}</p>
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{pct}% ack</span>
              </div>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">Viewed {a.viewed} · Acknowledged {a.ack} of {a.total}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ SETTINGS MODAL ============ */
function SettingsModal({ onClose }: { onClose: () => void }) {
  const cats: Category[] = ["task","training","mention","dm","announcement","calendar","auth","scheduling","billing","ai"];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[720px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-foreground/[0.06] p-5">
          <div>
            <p className="text-[16px] font-semibold tracking-tight">Notification settings</p>
            <p className="text-[11.5px] text-muted-foreground">Control how Blossom OS reaches you across every channel.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-foreground/10 hover:bg-foreground/[0.04]"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quiet hours</p>
            <div className="flex items-center gap-2 rounded-xl border border-foreground/[0.06] bg-white/70 p-3">
              <input className="os-glass-input h-9 w-28 rounded-lg px-2 text-[12px]" defaultValue="9:00 PM" />
              <span className="text-[11px] text-muted-foreground">to</span>
              <input className="os-glass-input h-9 w-28 rounded-lg px-2 text-[12px]" defaultValue="7:00 AM" />
              <span className="ml-auto text-[11px] text-muted-foreground">Only urgent + critical break through</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Digest frequency</p>
            <div className="flex flex-wrap gap-1.5">
              {["Real-time","Hourly","Twice daily","Daily","Off"].map((d, i) => (
                <button key={d} className={cn(
                  "rounded-xl border px-3 py-1.5 text-[11.5px] font-semibold",
                  i === 0 ? "border-violet-300 bg-violet-50 text-violet-700" : "border-foreground/10 bg-white/70 hover:bg-white"
                )}>{d}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Channels by category</p>
            <div className="overflow-hidden rounded-xl border border-foreground/[0.06]">
              <div className="grid grid-cols-[1fr_repeat(4,90px)] bg-foreground/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Category</span><span className="text-center">In-app</span><span className="text-center">Email</span><span className="text-center">SMS</span><span className="text-center">Desktop</span>
              </div>
              {cats.map((c) => {
                const m = CAT[c];
                return (
                  <div key={c} className="grid grid-cols-[1fr_repeat(4,90px)] items-center border-t border-foreground/[0.05] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("grid h-6 w-6 place-items-center rounded-md", m.chip)}><m.icon className="h-3 w-3" /></div>
                      <span className="text-[12px] font-medium">{m.label}</span>
                    </div>
                    {[true, c === "task" || c === "auth", c === "auth", true].map((on, i) => (
                      <div key={i} className="grid place-items-center">
                        <span className={cn("relative h-4 w-7 rounded-full transition", on ? "bg-violet-500" : "bg-foreground/15")}>
                          <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition", on ? "left-3" : "left-0.5")} />
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3 text-[11px] text-muted-foreground">
            Integration architecture is ready. Microsoft Teams, Outlook email, SMS, and push delivery will be wired in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============ COMPOSE MODAL ============ */
function ComposeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-foreground/[0.06] p-5">
          <div>
            <p className="text-[16px] font-semibold tracking-tight">New message</p>
            <p className="text-[11.5px] text-muted-foreground">Direct message, group chat, or post to a channel.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-foreground/10 hover:bg-foreground/[0.04]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-1.5">
            {["Direct","Group","Channel","Announcement"].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl border px-3 py-1.5 text-[11.5px] font-semibold",
                i === 0 ? "border-violet-300 bg-violet-50 text-violet-700" : "border-foreground/10 bg-white/70 hover:bg-white"
              )}>{t}</button>
            ))}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To</p>
            <input className="os-glass-input h-10 w-full rounded-xl px-3 text-[12.5px]" placeholder="Search people or channels…" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Link record (optional)</p>
            <input className="os-glass-input h-10 w-full rounded-xl px-3 text-[12.5px]" placeholder="Client, lead, auth, task…" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Message</p>
            <textarea rows={5} className="os-glass-input w-full rounded-xl px-3 py-2 text-[12.5px]" placeholder="Type your message…" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button className="grid h-8 w-8 place-items-center rounded-lg border border-foreground/10 hover:bg-foreground/[0.04]"><Paperclip className="h-3.5 w-3.5 text-muted-foreground" /></button>
              <button className="grid h-8 w-8 place-items-center rounded-lg border border-foreground/10 hover:bg-foreground/[0.04]"><At className="h-3.5 w-3.5 text-muted-foreground" /></button>
              <button className="grid h-8 w-8 place-items-center rounded-lg border border-foreground/10 hover:bg-foreground/[0.04]"><Smile className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_22px_-12px_hsl(265_85%_60%/0.5)]">
              Send <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
