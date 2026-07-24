import { useMemo, useState } from "react";
import {
  Search, Sparkles, Brain, Send, Download, Bell, Plus, RefreshCw,
  Flame, Clock, CheckCircle2, MessageSquare, UserPlus, ArrowRight,
  AlertTriangle, X, Calendar, ClipboardList, MapPin, Megaphone,
  Inbox, MailWarning, MailCheck, MoreHorizontal,
} from "lucide-react";
import { OSShell } from "./OSShell";
import {
  recruitingRecruiters,
  recruitingStates,
  staffingDemandByRegion,
  type RecruitingCandidate,
} from "@/data/recruitingDashboard";
import { useLegacyRecruitingCandidates } from "@/hooks/useLegacyRecruitingCandidates";
import { useRecruitingMutations } from "@/hooks/useRecruitingMutations";
import { toast } from "sonner";
import {
  useRecruitingMessages,
  type RecruitingMessage,
  type RecruitingCandidate as DbRecruitingCandidate,
} from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { cn } from "@/lib/utils";
import { useOperatorDialogs } from "@/components/os/OperatorDialogs";

// Recruiting → Communication → Messages & Updates

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

type MsgType =
  | "Candidate Message"
  | "Interview Reminder"
  | "Onboarding Reminder"
  | "Orientation Reminder"
  | "Orientation Confirmation"
  | "Staffing Coordination"
  | "Staffing Ready"
  | "Missing Document"
  | "Escalation"
  | "Recruiter Note";

type Direction = "in" | "out" | "system";

type Msg = {
  id: string;
  candidateId: string;
  candidate: RecruitingCandidate;
  type: MsgType;
  direction: Direction;
  sender: string;
  recipient: string;
  preview: string;
  hoursAgo: number;
  unread: boolean;
  awaitingResponse: boolean;
  noResponseDays: number;
  urgency: "High" | "Medium" | "Low";
  staffingImpact: boolean;
  escalated: boolean;
  source: "Apploi" | "SMS" | "Email" | "Monday" | "Internal" | "Calendly";
};

function urgencyFor(c: RecruitingCandidate): "High" | "Medium" | "Low" {
  const key = `${c.state}-${c.region}`;
  const demand = staffingDemandByRegion[key]?.demand ?? 0;
  if (c.readinessStatus === "Blocked" || demand >= 4) return "High";
  if (c.daysInStage >= 5 || demand >= 3) return "Medium";
  return "Low";
}

function relTime(h: number): string {
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function buildSuggestedMessages(candidates: RecruitingCandidate[]): Msg[] {
  const out: Msg[] = [];
  const push = (c: RecruitingCandidate, m: Omit<Msg, "id" | "candidateId" | "candidate" | "urgency">) => {
    out.push({
      id: `${c.id}-${m.type}-${m.direction}-${out.length}`,
      candidateId: c.id,
      candidate: c,
      urgency: urgencyFor(c),
      ...m,
    });
  };

  candidates.forEach((c) => {
    const recruiter = c.recruiter;
    const cand = c.name;
    const dis = Math.max(1, c.daysInStage);

    // Interview related
    if (c.interviewStatus === "Today") {
      push(c, {
        type: "Interview Reminder", direction: "out", sender: recruiter, recipient: cand,
        preview: `Reminder: your interview is today. Reply YES to confirm.`,
        hoursAgo: 4, unread: false, awaitingResponse: true, noResponseDays: 0,
        staffingImpact: false, escalated: false, source: "SMS",
      });
    }
    if (c.interviewStatus === "No-Show") {
      push(c, {
        type: "Candidate Message", direction: "out", sender: recruiter, recipient: cand,
        preview: `Sorry we missed you — happy to reschedule. What day works?`,
        hoursAgo: dis * 24, unread: false, awaitingResponse: true, noResponseDays: dis,
        staffingImpact: false, escalated: dis >= 3, source: "SMS",
      });
    }
    if (c.interviewStatus === "Needs Outcome") {
      push(c, {
        type: "Recruiter Note", direction: "system", sender: "System", recipient: recruiter,
        preview: `Interview outcome missing for ${cand} — enter result.`,
        hoursAgo: dis * 24, unread: true, awaitingResponse: false, noResponseDays: 0,
        staffingImpact: false, escalated: false, source: "Internal",
      });
    }

    // Offer
    if (c.offerStatus === "Unsigned") {
      push(c, {
        type: "Candidate Message", direction: "out", sender: recruiter, recipient: cand,
        preview: `Following up on your offer — any questions before signing?`,
        hoursAgo: dis * 24, unread: false, awaitingResponse: true, noResponseDays: dis,
        staffingImpact: true, escalated: dis >= 4, source: "Email",
      });
    }

    // Onboarding handoff stalled
    if (c.candidateStatus === "Onboarding Handoff" && c.onboardingStatus !== "Complete" && c.daysInStage >= 2) {
      push(c, {
        type: "Onboarding Reminder", direction: "out", sender: "Onboarding Bot", recipient: cand,
        preview: `Your Viventium onboarding link is ready. Please complete I-9 and direct deposit.`,
        hoursAgo: 18, unread: false, awaitingResponse: true, noResponseDays: Math.max(0, dis - 1),
        staffingImpact: true, escalated: dis >= 5, source: "Email",
      });
    }

    // Background check
    if (c.backgroundCheck === "Delayed" || (c.backgroundCheck === "Pending" && c.daysInStage >= 5)) {
      push(c, {
        type: "Missing Document", direction: "system", sender: "System", recipient: recruiter,
        preview: `Background check delayed for ${cand} — escalate to vendor.`,
        hoursAgo: 6, unread: true, awaitingResponse: false, noResponseDays: 0,
        staffingImpact: true, escalated: true, source: "Internal",
      });
    }

    // Orientation
    if (c.backgroundCheck === "Clear" && c.orientation === "Not Scheduled") {
      push(c, {
        type: "Orientation Reminder", direction: "out", sender: recruiter, recipient: cand,
        preview: `Pick an orientation slot: link to Calendly inside.`,
        hoursAgo: 12, unread: false, awaitingResponse: true, noResponseDays: Math.max(0, dis - 1),
        staffingImpact: true, escalated: false, source: "Calendly",
      });
    }
    if (c.orientation === "Scheduled") {
      push(c, {
        type: "Orientation Confirmation", direction: "in", sender: cand, recipient: recruiter,
        preview: `Confirmed for orientation. See you there.`,
        hoursAgo: 22, unread: true, awaitingResponse: false, noResponseDays: 0,
        staffingImpact: false, escalated: false, source: "SMS",
      });
    }
    if (c.candidateStatus === "Orientation" && c.orientation !== "Complete" && c.daysInStage >= 3) {
      push(c, {
        type: "Orientation Reminder", direction: "out", sender: recruiter, recipient: cand,
        preview: `We missed you at orientation — let's get you on the next session.`,
        hoursAgo: dis * 18, unread: false, awaitingResponse: true, noResponseDays: Math.max(1, dis - 2),
        staffingImpact: true, escalated: true, source: "SMS",
      });
    }

    // Staffing
    if (c.readinessStatus === "Ready for Staffing" && c.candidateStatus !== "Ready for Staffing") {
      push(c, {
        type: "Staffing Coordination", direction: "system", sender: "System", recipient: "Staffing",
        preview: `${cand} is ready — handoff to staffing pending.`,
        hoursAgo: 8, unread: true, awaitingResponse: false, noResponseDays: 0,
        staffingImpact: true, escalated: dis >= 2, source: "Internal",
      });
    }
    if (c.candidateStatus === "Ready for Staffing") {
      push(c, {
        type: "Staffing Ready", direction: "out", sender: recruiter, recipient: "Staffing",
        preview: `${cand} cleared and ready for placement in ${c.region}.`,
        hoursAgo: 3, unread: false, awaitingResponse: false, noResponseDays: 0,
        staffingImpact: true, escalated: false, source: "Internal",
      });
    }

    // Candidate no response
    if (c.followUps && c.followUps.length > 0 && c.daysInStage >= 3) {
      push(c, {
        type: "Candidate Message", direction: "out", sender: recruiter, recipient: cand,
        preview: c.followUps[0] || `Checking in — haven't heard back.`,
        hoursAgo: dis * 24, unread: false, awaitingResponse: true, noResponseDays: dis - 1,
        staffingImpact: false, escalated: dis >= 6, source: "SMS",
      });
    }

    // Inbound candidate replies (newly screened)
    if (c.candidateStatus === "New Applicant" && c.daysInStage <= 2) {
      push(c, {
        type: "Candidate Message", direction: "in", sender: cand, recipient: recruiter,
        preview: `Hi, I'd love to learn more about the ${c.role} role.`,
        hoursAgo: 5, unread: true, awaitingResponse: true, noResponseDays: 0,
        staffingImpact: false, escalated: false, source: "Apploi",
      });
    }
  });

  return out;
}

// Map a live recruiting_messages row into the visual Msg view-model.
function mapLiveMessageToViewModel(
  row: RecruitingMessage,
  findCandidate: (id: string | null | undefined) => DbRecruitingCandidate | null,
  legacyCandidates: RecruitingCandidate[],
): Msg {
  const liveCand = row.candidate_id ? findCandidate(row.candidate_id) : null;
  const fallback: RecruitingCandidate =
    legacyCandidates.find((c) => c.id === row.candidate_id) ??
    ({
      id: row.candidate_id ?? row.id,
      name: liveCand ? `${liveCand.first_name} ${liveCand.last_name}`.trim() : (row.sender || "Unknown candidate"),
      role: (liveCand?.role ?? "RBT") as any,
      state: (liveCand?.state ?? "GA") as any,
      region: liveCand?.city ?? "—",
      recruiter: liveCand?.recruiter ?? row.sender ?? "Unassigned",
      candidateStatus: "New Applicant",
      readinessStatus: "Active",
      daysInStage: 0,
      nextAction: "—",
      interviewStatus: "Not Scheduled",
      offerStatus: "None",
      backgroundCheck: "Not Started",
      orientation: "Not Scheduled",
      onboardingStatus: "Pending",
      followUps: [],
    } as unknown as RecruitingCandidate);

  const sentMs = row.sent_at ? new Date(row.sent_at).getTime() : Date.now();
  const hoursAgo = Math.max(0, Math.floor((Date.now() - sentMs) / (1000 * 60 * 60)));
  const direction: Direction =
    row.direction === "inbound" || row.direction === "in" ? "in"
    : row.direction === "system" ? "system"
    : "out";
  const status = (row.status ?? "").toLowerCase();
  const unread = !(status === "read" || status === "handled");
  const channelMap: Record<string, Msg["source"]> = {
    sms: "SMS", email: "Email", apploi: "Apploi", monday: "Monday",
    internal: "Internal", calendly: "Calendly",
  };
  const source = channelMap[(row.channel ?? "").toLowerCase()] ?? "Email";
  const escalated = status === "escalated";
  const noResponseDays = direction === "out" && unread ? Math.floor(hoursAgo / 24) : 0;
  const urgency: Msg["urgency"] = escalated || noResponseDays >= 5 ? "High" : noResponseDays >= 2 || unread ? "Medium" : "Low";

  return {
    id: row.id,
    candidateId: row.candidate_id ?? row.id,
    candidate: fallback,
    type: "Candidate Message",
    direction,
    sender: row.sender ?? (direction === "in" ? fallback.name : fallback.recruiter ?? "System"),
    recipient: direction === "in" ? (fallback.recruiter ?? "Recruiter") : fallback.name,
    preview: row.subject ?? row.body?.slice(0, 140) ?? "",
    hoursAgo,
    unread,
    awaitingResponse: direction === "out" && unread,
    noResponseDays,
    urgency,
    staffingImpact: false,
    escalated,
    source,
  };
}

function toneFor(m: Msg): Tone {
  if (m.escalated || m.urgency === "High") return "crit";
  if (m.unread || m.noResponseDays >= 3 || m.urgency === "Medium") return "warn";
  if (m.direction === "in") return "info";
  return "muted";
}
function toneClass(t: Tone) {
  switch (t) {
    case "crit":  return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn":  return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "info":  return "bg-primary/10 text-primary border-primary/20";
    case "muted": return "bg-muted text-muted-foreground border-border/60";
    default:      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}
function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap", toneClass(tone), className)}>
      {children}
    </span>
  );
}

const CHIPS = [
  { key: "all",          label: "All Messages" },
  { key: "candidate",    label: "Candidate Messages" },
  { key: "interview",    label: "Interview Updates" },
  { key: "onboarding",   label: "Onboarding Updates" },
  { key: "orientation",  label: "Orientation Updates" },
  { key: "staffing",     label: "Staffing Updates" },
  { key: "escalated",    label: "Escalations" },
  { key: "unread",       label: "Unread" },
  { key: "waiting",      label: "Waiting on Response" },
  { key: "high",         label: "High Priority" },
];

const ANNOUNCEMENTS = [
  { id: "a1", title: "New orientation cohort opens Monday", body: "Wave 17 has 14 slots across GA/NC. Coordinate with staffing on regional priorities.", who: "Recruiting Ops", when: "2h ago", tone: "info" as Tone },
  { id: "a3", title: "Background vendor SLA change", body: "New SLA is 72h — escalate anything older than 5 days.", who: "Leadership", when: "2d ago", tone: "warn" as Tone },
];

const QUICK_ACTIONS = [
  { label: "Send Candidate Message",   icon: Send },
  { label: "Send Onboarding Reminder", icon: MailWarning },
  { label: "Send Orientation Reminder",icon: Bell },
  { label: "Notify Staffing",          icon: UserPlus },
  { label: "Escalate Communication",   icon: Flame },
  { label: "Assign Recruiter",         icon: UserPlus },
  { label: "Export Feed",              icon: Download },
  { label: "Create Operational Update",icon: Megaphone },
];

export default function OSRecruitingMessages() {
  const { promptOperator } = useOperatorDialogs();
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveMessages, loading: liveMessagesLoading } = useRecruitingMessages();
  const { find: findCandidate } = useRecruitingCandidateLookup();

  // Active feed = live recruiting_messages rows.
  const baseMessages = useMemo<Msg[]>(
    () => liveMessages.map((row) => mapLiveMessageToViewModel(row, findCandidate, recruitingCandidates)),
    [liveMessages, findCandidate, recruitingCandidates],
  );

  // Suggested outreach = candidate-derived items for candidates without any live messages.
  const suggestedMessages = useMemo<Msg[]>(() => {
    const liveCandidateIds = new Set(
      liveMessages.map((r) => r.candidate_id).filter((x): x is string => Boolean(x)),
    );
    return buildSuggestedMessages(recruitingCandidates).filter(
      (s) => !liveCandidateIds.has(s.candidateId),
    );
  }, [liveMessages, recruitingCandidates]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [activeChip, setActiveChip] = useState("all");
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [typeF, setTypeF] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [optimisticReadMap, setOptimisticReadMap] = useState<Record<string, boolean>>({});
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQ, setAiQ] = useState("");

  const isUnread = (m: Msg) => (optimisticReadMap[m.id] !== undefined ? !optimisticReadMap[m.id] : m.unread);

  const filtered = useMemo(() => {
    return baseMessages.filter((m) => {
      if (stateF !== "all" && m.candidate.state !== stateF) return false;
      if (recruiterF !== "all" && m.candidate.recruiter !== recruiterF) return false;
      if (typeF !== "all" && m.type !== typeF) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [m.candidate.name, m.candidate.recruiter, m.type, m.preview, m.candidate.state, m.candidate.region, m.sender, m.recipient].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      switch (activeChip) {
        case "all":         return true;
        case "candidate":   return m.type === "Candidate Message";
        case "interview":   return m.type.startsWith("Interview");
        case "onboarding":  return m.type === "Onboarding Reminder" || m.type === "Missing Document";
        case "orientation": return m.type.startsWith("Orientation");
        case "staffing":    return m.type === "Staffing Coordination" || m.type === "Staffing Ready" || m.staffingImpact;
        case "escalated":   return m.escalated;
        case "unread":      return isUnread(m);
        case "waiting":     return m.awaitingResponse;
        case "high":        return m.urgency === "High";
        default:            return true;
      }
    }).sort((a, b) => {
      // unread first, then escalated, then by recency
      const ua = isUnread(a) ? 0 : 1, ub = isUnread(b) ? 0 : 1;
      if (ua !== ub) return ua - ub;
      if (a.escalated !== b.escalated) return a.escalated ? -1 : 1;
      return a.hoursAgo - b.hoursAgo;
    });
  }, [baseMessages, activeChip, search, stateF, recruiterF, typeF, optimisticReadMap]);

  const summary = useMemo(() => {
    const has = (pred: (m: Msg) => boolean) => baseMessages.filter(pred).length;
    return {
      unread:       has((m) => isUnread(m) && m.type === "Candidate Message" && m.direction === "in"),
      interview:    has((m) => m.type === "Interview Reminder"),
      onboarding:   has((m) => m.type === "Onboarding Reminder"),
      orientation:  has((m) => m.type.startsWith("Orientation")),
      staffing:     has((m) => m.type === "Staffing Coordination" || m.type === "Staffing Ready"),
      escalated:    has((m) => m.escalated),
      noResponse:   has((m) => m.noResponseDays >= 3),
      high:         has((m) => m.urgency === "High"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMessages, optimisticReadMap]);

  const staffingFeed = useMemo(
    () => baseMessages
      .filter((m) => m.type === "Staffing Coordination" || m.type === "Staffing Ready" || m.type === "Orientation Confirmation" || m.type.startsWith("Orientation"))
      .sort((a, b) => a.hoursAgo - b.hoursAgo)
      .slice(0, 8),
    [baseMessages]
  );

  const recruiterTasks = useMemo(
    () => baseMessages
      .filter((m) => m.awaitingResponse || m.escalated || (m.direction === "system" && isUnread(m)))
      .sort((a, b) => b.noResponseDays - a.noResponseDays)
      .slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseMessages, optimisticReadMap]
  );

  const selected = selectedId ? baseMessages.find((m) => m.id === selectedId) ?? null : null;
  const selectedThread = useMemo(() => {
    if (!selected) return [];
    return baseMessages
      .filter((m) => m.candidateId === selected.candidateId)
      .sort((a, b) => b.hoursAgo - a.hoursAgo);
  }, [baseMessages, selected]);

  function toggleRead(id: string, val: boolean) {
    setOptimisticReadMap((m) => ({ ...m, [id]: val }));
  }
  function persistMessageStatus(id: string, status: 'read' | 'handled') {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      if (status === 'read') void mutations.markMessageRead(id);
      else void mutations.markMessageHandled(id);
    }
  }

  async function sendFromSuggestion(s: Msg) {
    const cid = s.candidate.id;
    if (!/^[0-9a-f-]{36}$/i.test(cid)) return;
    setSendingId(s.id);
    try {
      await mutations.logMessage({
        candidate_id: cid,
        direction: s.direction === "in" ? "inbound" : s.direction === "system" ? "system" : "outbound",
        channel: (s.source ?? "Email").toLowerCase(),
        subject: s.type,
        body: s.preview,
        sender: s.sender,
      });
    } finally {
      setSendingId(null);
    }
  }

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Messages &amp; Updates</h1>
            <p className="text-muted-foreground mt-1 text-[15px] max-w-2xl">
              Track candidate communication, onboarding updates, staffing coordination, and operational recruiting activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={stateF} onChange={(e) => setStateF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All states</option>
              {recruitingStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={recruiterF} onChange={(e) => setRecruiterF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All recruiters</option>
              {recruitingRecruiters.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All types</option>
              {["Candidate Message","Interview Reminder","Onboarding Reminder","Orientation Reminder","Orientation Confirmation","Staffing Coordination","Staffing Ready","Missing Document","Escalation","Recruiter Note"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Sync Communication
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <Send className="size-4" /> Send Message
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="rounded-2xl bg-card border border-border/70 p-3 flex items-center gap-3">
          <Search className="size-4 text-muted-foreground ml-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates, recruiters, communication types, updates…"
            className="flex-1 bg-transparent outline-none text-sm h-9 placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Priority summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SumCard label="Unread candidate messages" value={summary.unread} icon={Inbox} tone={summary.unread > 0 ? "warn" : "muted"} onClick={() => setActiveChip("unread")} hint="Inbound, not yet read" />
          <SumCard label="Interview reminders" value={summary.interview} icon={Calendar} tone="info" onClick={() => { setActiveChip("interview"); }} hint="Sent today" />
          <SumCard label="Onboarding reminders" value={summary.onboarding} icon={MailWarning} tone={summary.onboarding > 2 ? "warn" : "info"} onClick={() => setActiveChip("onboarding")} hint="Awaiting completion" />
          <SumCard label="Orientation reminders" value={summary.orientation} icon={Bell} tone="info" onClick={() => setActiveChip("orientation")} hint="Sent / pending" />
          <SumCard label="Staffing coordination" value={summary.staffing} icon={UserPlus} tone={summary.staffing > 0 ? "info" : "muted"} onClick={() => setActiveChip("staffing")} hint="Handoff updates" />
          <SumCard label="Escalated" value={summary.escalated} icon={Flame} tone={summary.escalated > 0 ? "crit" : "muted"} onClick={() => setActiveChip("escalated")} hint="Needs attention" />
          <SumCard label="No response 3+ days" value={summary.noResponse} icon={Clock} tone={summary.noResponse > 0 ? "warn" : "muted"} onClick={() => setActiveChip("waiting")} hint="Candidate ghosting risk" />
          <SumCard label="High priority alerts" value={summary.high} icon={AlertTriangle} tone={summary.high > 0 ? "crit" : "muted"} onClick={() => setActiveChip("high")} hint="Operational risk" />
        </section>

        {/* Filter chips */}
        {liveMessagesLoading && (
          <div className="text-xs text-muted-foreground">Loading live messages…</div>
        )}
        {!liveMessagesLoading && baseMessages.length === 0 && suggestedMessages.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
            No live messages yet. Use the <span className="font-medium text-foreground">Suggested Outreach</span> section below to log one from a candidate signal.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveChip(c.key)}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium border transition",
                activeChip === c.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border/70 hover:bg-muted"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Communication feed + Staffing & orientation updates */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Operational communication</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Candidate messages, reminders, staffing updates, and escalations.</p>
              </div>
              <Pill tone="info">{filtered.length} items</Pill>
            </div>
            <div className="space-y-2">
              {filtered.length === 0 && (
                <div className="rounded-xl bg-muted/40 border border-border/60 p-8 text-center">
                  <MailCheck className="size-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No unread recruiting communication right now.</p>
                </div>
              )}
              {filtered.slice(0, 30).map((m) => (
                <MessageRow
                  key={m.id}
                  msg={m}
                  unread={isUnread(m)}
                  onOpen={() => { setSelectedId(m.id); toggleRead(m.id, true); }}
                  onMarkRead={() => toggleRead(m.id, true)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Staffing &amp; orientation</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Recruiting ↔ Staffing handoff stream.</p>
              </div>
              <UserPlus className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {staffingFeed.length === 0 && (
                <div className="rounded-xl bg-muted/40 border border-border/60 p-6 text-center">
                  <p className="text-xs text-muted-foreground">No staffing coordination alerts currently.</p>
                </div>
              )}
              {staffingFeed.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="w-full text-left rounded-xl bg-muted/40 border border-border/60 p-3 hover:bg-muted transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium truncate">{m.candidate.name}</span>
                    <Pill tone={toneFor(m)}>{m.type}</Pill>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{m.preview}</p>
                  <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-2">
                    <MapPin className="size-3" /> {m.candidate.state} · {m.candidate.region}
                    <span className="ml-auto">{relTime(m.hoursAgo)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Recruiter tasks + Announcements */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Recruiter communication tasks</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Candidates awaiting response, reminders due, stalled chains.</p>
              </div>
              <ClipboardList className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {recruiterTasks.length === 0 && (
                <div className="rounded-xl bg-muted/40 border border-border/60 p-6 text-center">
                  <p className="text-xs text-muted-foreground">No overdue communication follow-ups detected.</p>
                </div>
              )}
              {recruiterTasks.map((m) => (
                <div key={m.id} className="rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center gap-3">
                  <div className="size-8 rounded-full bg-card border border-border/60 grid place-items-center text-[10px] font-semibold">
                    {m.candidate.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{m.candidate.name}</span>
                      <Pill tone={toneFor(m)}>{m.type}</Pill>
                      {m.noResponseDays >= 3 && <Pill tone="warn">{m.noResponseDays}d no reply</Pill>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{m.preview}</p>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {m.candidate.recruiter} · {m.candidate.state} · {relTime(m.hoursAgo)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedId(m.id)} className="h-8 px-3 rounded-lg text-xs bg-secondary border border-border/60 hover:bg-muted transition inline-flex items-center gap-1">
                      <Send className="size-3" /> Send
                    </button>
                    <button onClick={() => toggleRead(m.id, true)} className="size-8 rounded-lg grid place-items-center hover:bg-muted transition" title="Mark complete">
                      <CheckCircle2 className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Operational announcements</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Internal updates &amp; process changes.</p>
              </div>
              <Megaphone className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {ANNOUNCEMENTS.map((a) => (
                <div key={a.id} className="rounded-xl bg-muted/40 border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{a.title}</span>
                    <Pill tone={a.tone}>{a.who}</Pill>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{a.body}</p>
                  <div className="text-[10px] text-muted-foreground mt-1.5">{a.when}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Suggested outreach (candidate-derived, not yet in recruiting_messages) */}
        <section className="rounded-2xl bg-card border border-border/70 p-4 space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Suggested Outreach</h2>
              <p className="text-xs text-muted-foreground">
                Candidate-derived suggestions. Click <span className="font-medium text-foreground">Log</span> to record in recruiting_messages.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{suggestedMessages.length} suggested</span>
          </header>
          {suggestedMessages.length === 0 ? (
            <div className="text-xs text-muted-foreground">No suggestions right now.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {suggestedMessages.slice(0, 12).map((s) => {
                const canLog = /^[0-9a-f-]{36}$/i.test(s.candidate.id);
                const isSending = sendingId === s.id;
                return (
                  <li key={s.id} className="flex items-center justify-between py-2 gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.candidate.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.type} · {s.source} · {s.preview}
                      </div>
                    </div>
                    <button
                      disabled={!canLog || isSending}
                      onClick={() => void sendFromSuggestion(s)}
                      className="h-8 px-3 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                      title={canLog ? "Log to recruiting_messages" : "Candidate not in live table yet"}
                    >
                      <Send className="size-3" /> {isSending ? "Logging…" : "Log"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Quick actions + AI */}
        <section className="grid lg:grid-cols-3 gap-4">
          {/* (intentional: suggested outreach lives just above) */}
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base font-semibold tracking-tight">Quick actions</h2>
              <span className="text-xs text-muted-foreground">Operational shortcuts</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {QUICK_ACTIONS.map((q) => (
                <button key={q.label} className="h-12 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted transition flex items-center gap-2 px-3 text-left">
                  <q.icon className="size-4 text-muted-foreground" />
                  <span className="text-xs font-medium truncate">{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Brain className="size-4 text-primary" />
                <h2 className="text-base font-semibold tracking-tight">Operational Insights</h2>
              </div>
              <Sparkles className="size-4 text-primary/70" />
            </div>
            <div className="space-y-1.5 mb-3">
              {[
                "Which candidates have not responded?",
                "Show onboarding reminders due.",
                "Which staffing updates are high priority?",
                "What communication chains are stalled?",
                "Who missed orientation reminders?",
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => { setAiQ(p); setAiOpen(true); }}
                  className="w-full text-left text-xs rounded-lg bg-card border border-border/60 px-3 py-2 hover:bg-muted transition"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={aiQ}
                onChange={(e) => setAiQ(e.target.value)}
                placeholder="Ask about recruiting communication…"
                className="flex-1 h-9 rounded-lg bg-card border border-border px-3 text-xs outline-none"
              />
              <button onClick={() => setAiOpen(true)} className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
                <ArrowRight className="size-4" />
              </button>
            </div>
            {aiOpen && (
              <div className="mt-3 rounded-lg bg-card border border-border/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Blossom AI</p>
                <p>Reviewing recruiting communication across {recruitingCandidates.length} candidates… I'll surface stalled chains, overdue reminders, and high-priority staffing updates in this view.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Slide-out drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-foreground/20 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <aside className="w-full max-w-md bg-card border-l border-border/70 overflow-y-auto">
            <header className="p-5 border-b border-border/70 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{selected.candidate.name}</h3>
                  <Pill tone={toneFor(selected)}>{selected.urgency}</Pill>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selected.candidate.role} · {selected.candidate.state} · {selected.candidate.region}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recruiter: {selected.candidate.recruiter}
                </p>
              </div>
              <button onClick={() => setSelectedId(null)} className="size-8 rounded-lg grid place-items-center hover:bg-muted transition">
                <X className="size-4" />
              </button>
            </header>

            <div className="p-5 space-y-5">
              {/* Overview */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="Hiring stage" value={selected.candidate.candidateStatus} />
                <Stat label="Onboarding" value={selected.candidate.onboardingStatus} />
                <Stat label="Orientation" value={selected.candidate.orientation} />
                <Stat label="Readiness" value={selected.candidate.readinessStatus} />
              </div>

              {/* Thread */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Communication thread</p>
                <div className="space-y-2">
                  {selectedThread.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-xl border p-3 text-xs",
                        m.direction === "in"
                          ? "bg-muted/40 border-border/60"
                          : m.direction === "out"
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card border-border/60"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium">{m.sender} → {m.recipient}</span>
                        <Pill tone={toneFor(m)}>{m.type}</Pill>
                      </div>
                      <p className="text-muted-foreground">{m.preview}</p>
                      <div className="text-[10px] text-muted-foreground mt-1">{m.source} · {relTime(m.hoursAgo)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational visibility */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Operational visibility</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {selected.noResponseDays >= 3 && <li>· No candidate response for {selected.noResponseDays} days</li>}
                  {selected.escalated && <li>· Communication escalated</li>}
                  {selected.staffingImpact && <li>· Affecting staffing coordination</li>}
                  {(selected.candidate.blockers || []).map((b, i) => <li key={i}>· {b}</li>)}
                  {!selected.escalated && !selected.staffingImpact && selected.noResponseDays < 3 && (selected.candidate.blockers?.length ?? 0) === 0 && (
                    <li>· No blockers detected</li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const cid = selected.candidate.id;
                  const isLiveMsg = /^[0-9a-f-]{36}$/i.test(selected.id);
                  const logIntent = async (kind: string, extra?: Record<string, unknown>) => {
                    await mutations.logActivity(cid, "recruiting_messages", isLiveMsg ? selected.id : null, kind, null, null, extra);
                    toast.success(`Logged: ${kind.replace(/_/g, " ")}`);
                  };
                  return (
                    <>
                      <DAction icon={Send} label="Send message" primary onClick={() => logIntent("message_send_intent")} />
                      <DAction icon={MailWarning} label="Resend onboarding" onClick={() => logIntent("onboarding_resend")} />
                      <DAction icon={Bell} label="Resend orientation" onClick={() => logIntent("orientation_resend")} />
                      <DAction icon={Flame} label="Escalate" onClick={async () => {
                        await mutations.createEscalation(cid, { title: `Escalation from Messages: ${selected.candidate.name}`, severity: "High" } as any);
                        toast.success("Escalation opened");
                      }} />
                      <DAction icon={UserPlus} label="Notify staffing" onClick={() => logIntent("staffing_notified")} />
                      <DAction icon={CheckCircle2} label="Complete follow-up" onClick={async () => {
                        if (isLiveMsg) await mutations.markMessageHandled(selected.id);
                        else await logIntent("followup_completed");
                        toast.success("Follow-up marked complete");
                      }} />
                      <DAction icon={Clock} label="Snooze reminder" onClick={() => logIntent("reminder_snoozed")} />
                      <DAction icon={Plus} label="Add internal note" onClick={async () => {
                        const note = window.prompt("Internal note");
                        if (!note) return;
                        await logIntent("note_added", { note });
                      }} />
                    </>
                  );
                })()}
              </div>
            </div>
          </aside>
        </div>
      )}
    </OSShell>
  );
}

function SumCard({
  label, value, icon: Icon, tone, hint, onClick,
}: { label: string; value: number; icon: any; tone: Tone; hint?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("size-7 rounded-lg grid place-items-center border", toneClass(tone))}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-2">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </button>
  );
}

function MessageRow({ msg, unread, onOpen, onMarkRead }: { msg: Msg; unread: boolean; onOpen: () => void; onMarkRead: () => void }) {
  const t = toneFor(msg);
  return (
    <div className={cn(
      "rounded-xl border p-3 flex items-start gap-3 hover:bg-muted/40 transition",
      unread ? "bg-card border-border" : "bg-muted/30 border-border/60"
    )}>
      <button onClick={onOpen} className="flex items-start gap-3 flex-1 text-left min-w-0">
        <div className="relative">
          <div className="size-9 rounded-full bg-muted border border-border/60 grid place-items-center text-[10px] font-semibold">
            {msg.candidate.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          {unread && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary border-2 border-card" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-sm truncate", unread ? "font-semibold" : "font-medium")}>{msg.candidate.name}</span>
            <Pill tone={t}>{msg.type}</Pill>
            {msg.direction === "in" && <Pill tone="info">Candidate</Pill>}
            {msg.escalated && <Pill tone="crit">Escalated</Pill>}
            {msg.staffingImpact && <Pill tone="warn">Staffing</Pill>}
            {msg.noResponseDays >= 3 && <Pill tone="warn">{msg.noResponseDays}d no reply</Pill>}
          </div>
          <p className={cn("text-xs mt-0.5 truncate", unread ? "text-foreground" : "text-muted-foreground")}>{msg.preview}</p>
          <div className="text-[10px] text-muted-foreground mt-1">
            {msg.sender} → {msg.recipient} · {msg.candidate.state} · {msg.source} · {relTime(msg.hoursAgo)}
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1">
        {unread && (
          <button onClick={onMarkRead} className="size-8 rounded-lg grid place-items-center hover:bg-muted transition" title="Mark read">
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </button>
        )}
        <button onClick={onOpen} className="size-8 rounded-lg grid place-items-center hover:bg-muted transition" title="Open">
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xs font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}

function DAction({ icon: Icon, label, primary, onClick }: { icon: any; label: string; primary?: boolean; onClick?: () => void }) {
  const disabled = !onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Not available" : undefined}
      className={cn(
        "h-10 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-2 transition",
        primary ? "bg-primary text-primary-foreground border-primary hover:opacity-90" : "bg-muted/40 border-border/60 hover:bg-muted",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}