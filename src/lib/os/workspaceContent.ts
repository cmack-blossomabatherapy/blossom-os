import type { WorkspaceConfig } from "@/components/os/workspace/WorkspaceShell";
import { Plus, Send, Filter, MessageSquare, FileSpreadsheet, Phone } from "lucide-react";

/** Shared state filter chips used by most workspaces. */
const STATE_CHIPS = [
  { label: "All", value: "all" },
  { label: "GA", value: "GA" },
  { label: "NC", value: "NC" },
  { label: "TN", value: "TN" },
  { label: "VA", value: "VA" },
  { label: "MD", value: "MD" },
];
const DATE_CHIPS = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
];

/** A tiny helper to keep configs short. */
const r = (id: string, urgency: NonNullable<WorkspaceConfig["tabs"][0]["rows"][0]["urgency"]>, cells: Record<string, string>, nextAction?: string) =>
  ({ id, urgency, cells, nextAction });

export const WORKSPACE_CONFIGS: Record<string, WorkspaceConfig> = {
  // ---------- EXECUTIVE ----------
  executive: {
    id: "executive",
    title: "Executive",
    subtitle: "Company-wide visibility, scorecard, and risks across all states.",
    quickActions: [
      { label: "Open Briefing", variant: "primary" },
      { label: "Message Leadership", icon: MessageSquare, variant: "secondary" },
      { label: "Export Scorecard", icon: FileSpreadsheet, variant: "ghost" },
    ],
    filters: [
      { label: "Period", chips: DATE_CHIPS },
      { label: "State", chips: STATE_CHIPS },
    ],
    kpis: [
      { label: "Active Clients", value: "412", delta: "+18 MoM", trend: "up" },
      { label: "Revenue (MTD)", value: "$1.84M", delta: "+6.4%", trend: "up" },
      { label: "Auth Hours Used", value: "78%", delta: "Target 85%", trend: "down" },
      { label: "Open Roles", value: "27", delta: "+5 vs last wk", trend: "up" },
      { label: "Onboarding Days", value: "14.2", delta: "Goal 12", trend: "down" },
      { label: "QA On-Time", value: "92%", delta: "+1.3%", trend: "up" },
    ],
    tabs: [
      {
        id: "dashboard",
        label: "Executive Dashboard",
        queueTitle: "Department health snapshot",
        columns: [
          { key: "dept", label: "Department" },
          { key: "owner", label: "Owner" },
          { key: "kpi", label: "KPI" },
          { key: "status", label: "Status" },
          { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("e1", "high",     { dept: "Intake",        owner: "Maya R.",   kpi: "Lead → VOB 48h",   status: "62% (goal 80%)", blocker: "Family follow-up" }, "Review queue"),
          r("e2", "critical", { dept: "Authorizations",owner: "Jordan S.", kpi: "Expiring < 14d",   status: "9 cases",        blocker: "Aetna portal down" }, "Escalate to payer"),
          r("e3", "medium",   { dept: "Scheduling",    owner: "Devon P.",  kpi: "Uncovered hours",  status: "146h",           blocker: "RBT availability" }, "Open staffing"),
          r("e4", "ok",       { dept: "QA",            owner: "Priya N.",  kpi: "PR on-time",       status: "94%",            blocker: "—" }, "View"),
          r("e5", "high",     { dept: "Recruiting",    owner: "Casey L.",  kpi: "Time to hire",     status: "38d (goal 28)",  blocker: "Offer accept rate" }, "Open pipeline"),
        ],
      },
      {
        id: "risks", label: "Risks & Escalations", queueTitle: "Top strategic risks",
        columns: [
          { key: "risk", label: "Risk" }, { key: "owner", label: "Owner" }, { key: "impact", label: "Impact" }, { key: "due", label: "Resolve by" },
        ],
        rows: [
          r("r1", "critical", { risk: "GA auth backlog", owner: "Jordan S.", impact: "$220K at risk", due: "Jun 22" }, "Open"),
          r("r2", "high",     { risk: "NC staffing gap", owner: "Devon P.",  impact: "12 clients",     due: "Jun 24" }, "Open"),
          r("r3", "medium",   { risk: "RBT attrition Q2", owner: "HR Lead",  impact: "Trend -3%",      due: "Jul 01" }, "Open"),
        ],
      },
      {
        id: "meetings", label: "Meetings", queueTitle: "Bloom Growth cadence",
        columns: [{ key: "meeting", label: "Meeting" }, { key: "owner", label: "Owner" }, { key: "when", label: "When" }, { key: "status", label: "Prep" }],
        rows: [
          r("m1", "medium", { meeting: "Executive L10", owner: "Shira",  when: "Mon 9:00", status: "Prep ready" }, "Open"),
          r("m2", "high",   { meeting: "State Roll-up", owner: "Shira",  when: "Tue 10:00", status: "Needs scorecard" }, "Prep"),
        ],
      },
    ],
    alerts: [
      { id: "a1", title: "Aetna portal degraded", meta: "Authorizations · 3h ago", urgency: "critical" },
      { id: "a2", title: "NC uncovered hours rising", meta: "Scheduling · today", urgency: "high" },
      { id: "a3", title: "Bloom Growth scorecard due", meta: "Tomorrow 9am", urgency: "medium" },
    ],
    escalations: [
      { id: "e1", title: "Director attention: GA auth backlog", meta: "From Jordan · 1d", urgency: "critical" },
    ],
    activity: [
      { id: "ac1", who: "Shira",   what: "approved Q3 hiring plan",  when: "1h ago" },
      { id: "ac2", who: "Jordan",  what: "flagged Aetna issue",      when: "3h ago" },
      { id: "ac3", who: "Priya",   what: "closed 12 QA reviews",     when: "yesterday" },
    ],
    ai: [
      { id: "s1", text: "Summarize this week's risks for the L10." },
      { id: "s2", text: "Which state is most off-target this month?" },
      { id: "s3", text: "Draft an executive update for the board." },
    ],
    reports: [
      { label: "Company Scorecard", path: "/reports?view=scorecard" },
      { label: "Growth & Revenue", path: "/reports?view=growth" },
      { label: "State Health", path: "/reports?view=states" },
    ],
    resources: [
      { label: "Leadership SOP Library", path: "/resources?cat=leadership" },
      { label: "Bloom Growth Playbook",  path: "/resources?cat=bloom" },
    ],
    related: [
      { label: "Operations Workspace", path: "/ws/operations" },
      { label: "State Command Center", path: "/ws/state-command" },
    ],
  },

  // ---------- OPERATIONS ----------
  operations: {
    id: "operations",
    title: "Operations Command Center",
    subtitle: "Cadence, blockers, KPI exceptions and cross-department escalations.",
    quickActions: [
      { label: "Create Task", icon: Plus, variant: "primary" },
      { label: "Send Update", icon: Send, variant: "secondary" },
      { label: "Filter", icon: Filter, variant: "ghost" },
    ],
    filters: [
      { label: "Period", chips: DATE_CHIPS }, { label: "State", chips: STATE_CHIPS },
    ],
    kpis: [
      { label: "Open Escalations", value: "14", delta: "+3 vs last wk", trend: "up" },
      { label: "KPI Exceptions",   value: "9",  delta: "-2",            trend: "down" },
      { label: "Workflows On-Track", value: "82%", delta: "Goal 90%",   trend: "down" },
      { label: "Cadence Adherence", value: "96%", delta: "+1.2%",       trend: "up" },
      { label: "Cross-Dept Handoffs", value: "47", delta: "Today",      trend: "flat" },
      { label: "Active Initiatives", value: "12", delta: "3 at risk",   trend: "flat" },
    ],
    tabs: [
      {
        id: "queue", label: "Operations Queue",
        queueTitle: "Items requiring DoO attention",
        columns: [
          { key: "item", label: "Item" }, { key: "dept", label: "Dept" }, { key: "owner", label: "Owner" },
          { key: "due", label: "Due" }, { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("o1", "critical", { item: "Aetna portal incident response", dept: "Auths", owner: "Jordan", due: "Today", blocker: "Vendor SLA" }, "Open"),
          r("o2", "high",     { item: "NC staffing escalation",        dept: "Sched", owner: "Devon",  due: "Today", blocker: "Availability" }, "Open"),
          r("o3", "medium",   { item: "VOB SLA dip",                   dept: "Intake",owner: "Maya",   due: "Tomorrow", blocker: "Solum delay" }, "Open"),
          r("o4", "low",      { item: "Training adoption (RBT)",       dept: "HR",    owner: "HR Lead", due: "Fri", blocker: "Reminders" }, "Open"),
        ],
      },
      { id: "kpi", label: "KPI Exceptions", queueTitle: "KPIs off-target",
        columns: [{ key: "kpi", label: "KPI" }, { key: "owner", label: "Owner" }, { key: "actual", label: "Actual" }, { key: "target", label: "Target" }, { key: "trend", label: "Trend" }],
        rows: [
          r("k1", "high",   { kpi: "Lead → VOB 48h", owner: "Maya",   actual: "62%", target: "80%", trend: "↓" }, "Open"),
          r("k2", "medium", { kpi: "Time to Hire",  owner: "Casey",  actual: "38d", target: "28d", trend: "→" }, "Open"),
        ],
      },
      { id: "escalations", label: "Escalations", queueTitle: "Open escalations",
        columns: [{ key: "topic", label: "Topic" }, { key: "from", label: "From" }, { key: "owner", label: "Owner" }, { key: "age", label: "Age" }],
        rows: [
          r("es1", "critical", { topic: "Auth backlog GA", from: "Jordan", owner: "Shira", age: "1d" }, "Open"),
          r("es2", "high",     { topic: "RBT attrition",   from: "HR",     owner: "Shira", age: "3d" }, "Open"),
        ],
      },
    ],
    alerts: [
      { id: "oa1", title: "3 KPIs slipped overnight", meta: "Auths, Intake, Sched", urgency: "high" },
      { id: "oa2", title: "Workflow risk: VOB → Auth handoff", meta: "12 stuck cases", urgency: "medium" },
    ],
    escalations: [
      { id: "oe1", title: "GA auth backlog", meta: "Owner: Shira · 1d", urgency: "critical" },
    ],
    activity: [
      { id: "oac1", who: "Shira", what: "added a task for QA",      when: "20m ago" },
      { id: "oac2", who: "Devon", what: "resolved 4 staffing gaps", when: "2h ago" },
    ],
    ai: [
      { id: "oai1", text: "Which workflows have the highest handoff drop-off?" },
      { id: "oai2", text: "Draft a Monday cadence note for department leads." },
    ],
    reports: [
      { label: "Department Health", path: "/reports?view=department-health" },
      { label: "Workflow Risks",    path: "/reports?view=workflow-risks" },
    ],
    resources: [{ label: "Operations SOPs", path: "/resources?cat=ops" }],
    related:   [{ label: "Executive Workspace", path: "/ws/executive" }],
  },

  // ---------- MARKETING ----------
  marketing: {
    id: "marketing",
    title: "Marketing & Growth",
    subtitle: "Lead sources, campaigns, attribution and state growth.",
    quickActions: [
      { label: "New Campaign", icon: Plus, variant: "primary" },
      { label: "Export Leads", icon: FileSpreadsheet, variant: "secondary" },
    ],
    filters: [{ label: "Period", chips: DATE_CHIPS }, { label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "New Leads (MTD)", value: "318", delta: "+12%", trend: "up" },
      { label: "Cost / Lead",     value: "$42",  delta: "-$3",   trend: "down" },
      { label: "Web → Intake",    value: "34%",  delta: "+2.1%", trend: "up" },
      { label: "Active Campaigns",value: "8",    delta: "2 paused", trend: "flat" },
      { label: "Calls (CTM)",     value: "421",  delta: "This wk", trend: "flat" },
      { label: "Referrals",       value: "62",   delta: "+9",       trend: "up" },
    ],
    tabs: [
      { id: "sources", label: "Lead Sources", queueTitle: "Top sources this period",
        columns: [{ key: "src", label: "Source" }, { key: "leads", label: "Leads" }, { key: "vob", label: "→ VOB %" }, { key: "cpl", label: "CPL" }, { key: "owner", label: "Owner" }],
        rows: [
          r("ms1", "ok",      { src: "Google Ads", leads: "112", vob: "41%", cpl: "$38", owner: "Marketing" }, "Open"),
          r("ms2", "medium",  { src: "Referrals",  leads: "62",  vob: "58%", cpl: "$12", owner: "Referral CRM" }, "Open"),
          r("ms3", "high",    { src: "Facebook",   leads: "44",  vob: "21%", cpl: "$72", owner: "Marketing" }, "Investigate"),
          r("ms4", "low",     { src: "Web Organic",leads: "100", vob: "33%", cpl: "—",   owner: "SEO" }, "Open"),
        ],
      },
      { id: "campaigns", label: "Campaigns", queueTitle: "Active campaigns",
        columns: [{ key: "name", label: "Campaign" }, { key: "channel", label: "Channel" }, { key: "spend", label: "Spend" }, { key: "leads", label: "Leads" }, { key: "owner", label: "Owner" }],
        rows: [
          r("mc1", "ok",   { name: "GA Spring Brand",  channel: "Google",    spend: "$8.2K", leads: "94", owner: "Marketing" }, "Open"),
          r("mc2", "high", { name: "NC Hiring Boost",  channel: "Facebook",  spend: "$3.1K", leads: "18", owner: "Marketing" }, "Adjust"),
        ],
      },
      { id: "referral-crm", label: "Referral CRM", queueTitle: "Referral activity",
        columns: [{ key: "partner", label: "Partner" }, { key: "state", label: "State" }, { key: "leads", label: "Leads (90d)" }, { key: "last", label: "Last touch" }],
        rows: [
          r("mr1", "medium", { partner: "Atlanta Peds Group", state: "GA", leads: "14", last: "5d ago" }, "Reach out"),
          r("mr2", "high",   { partner: "Raleigh Schools",    state: "NC", leads: "3",  last: "21d ago" }, "Reach out"),
        ],
      },
    ],
    alerts: [{ id: "mal1", title: "Facebook CPL spiked", meta: "+88% vs 7d avg", urgency: "high" }],
    escalations: [],
    activity: [
      { id: "mac1", who: "Marketing", what: "launched 'NC Hiring Boost'", when: "yesterday" },
      { id: "mac2", who: "Intake",    what: "tagged 14 leads as low-quality", when: "2d ago" },
    ],
    ai: [
      { id: "mai1", text: "Which campaigns drive the best VOB conversion?" },
      { id: "mai2", text: "Draft outreach to Raleigh Schools." },
    ],
    reports: [
      { label: "Attribution ROI", path: "/reports?view=attribution" },
      { label: "State Growth",    path: "/reports?view=state-growth" },
    ],
    resources: [{ label: "Brand & Messaging", path: "/resources?cat=brand" }],
    related:   [{ label: "Intake Workspace", path: "/ws/intake" }],
  },

  // ---------- INTAKE ----------
  intake: {
    id: "intake",
    title: "Intake",
    subtitle: "Leads, VOB readiness, family follow-ups and handoffs.",
    quickActions: [
      { label: "Add Lead",     icon: Plus, variant: "primary" },
      { label: "Call Family",  icon: Phone, variant: "secondary" },
    ],
    filters: [{ label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "Open Leads",        value: "84",  delta: "+12 this wk", trend: "up" },
      { label: "VOB Ready %",       value: "61%", delta: "Goal 80%", trend: "down" },
      { label: "Avg Lead → VOB",    value: "3.4d", delta: "Goal 2d", trend: "down" },
      { label: "Missing Info",      value: "18", delta: "Today",     trend: "flat" },
      { label: "Handoffs (wk)",     value: "22", delta: "On track",  trend: "flat" },
      { label: "Stale > 7d",        value: "9",  delta: "-3",        trend: "down" },
    ],
    tabs: [
      { id: "queue", label: "Intake Queue",
        queueTitle: "Active leads requiring action",
        columns: [
          { key: "family", label: "Family" }, { key: "state", label: "State" },
          { key: "stage", label: "Stage" }, { key: "owner", label: "Owner" },
          { key: "due", label: "Due" }, { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("i1", "critical", { family: "Mendez", state: "GA", stage: "VOB", owner: "Maya", due: "Today", blocker: "Insurance card" }, "Call family"),
          r("i2", "high",     { family: "Patel",  state: "NC", stage: "New", owner: "Maya", due: "Today", blocker: "No phone answer" }, "Retry"),
          r("i3", "medium",   { family: "Nguyen", state: "GA", stage: "Docs",owner: "Riley",due: "Tomorrow", blocker: "Dx report" }, "Email"),
          r("i4", "low",      { family: "Brooks", state: "TN", stage: "Handoff", owner: "Riley", due: "Fri", blocker: "—" }, "Hand off"),
        ],
      },
      { id: "follow-up", label: "Family Follow-Up", queueTitle: "Follow-up cadence",
        columns: [{ key: "family", label: "Family" }, { key: "last", label: "Last touch" }, { key: "channel", label: "Channel" }, { key: "owner", label: "Owner" }],
        rows: [
          r("if1", "high",   { family: "Lopez", last: "4d ago", channel: "Call",  owner: "Maya" }, "Call"),
          r("if2", "medium", { family: "Khan",  last: "2d ago", channel: "Email", owner: "Riley" }, "Email"),
        ],
      },
      { id: "vob", label: "VOB Readiness", queueTitle: "Ready for VOB submission",
        columns: [{ key: "family", label: "Family" }, { key: "payer", label: "Payer" }, { key: "ready", label: "Ready?" }, { key: "owner", label: "Owner" }],
        rows: [
          r("iv1", "ok",     { family: "Hall",   payer: "Aetna",     ready: "Yes",         owner: "Maya" }, "Submit"),
          r("iv2", "high",   { family: "Reyes",  payer: "Cigna",     ready: "Missing dx",  owner: "Maya" }, "Request"),
        ],
      },
    ],
    alerts: [
      { id: "ial1", title: "9 leads stale > 7 days", meta: "Avg age 12d", urgency: "high" },
    ],
    escalations: [
      { id: "ie1", title: "Mendez family — payer denial risk", meta: "Owner: Maya", urgency: "critical" },
    ],
    activity: [
      { id: "iac1", who: "Maya",  what: "moved 4 leads to VOB",       when: "30m ago" },
      { id: "iac2", who: "Riley", what: "handed off Brooks to Auths", when: "2h ago" },
    ],
    ai: [
      { id: "iai1", text: "List leads missing dx reports." },
      { id: "iai2", text: "Which payer denials are trending?" },
    ],
    reports: [{ label: "Intake Funnel", path: "/reports?view=intake-funnel" }],
    resources: [{ label: "Intake Scripts", path: "/resources?cat=intake" }],
    related: [{ label: "Authorizations", path: "/ws/authorizations" }, { label: "Finance / Benefits", path: "/ws/finance" }],
  },

  // ---------- AUTHORIZATIONS ----------
  authorizations: {
    id: "authorizations",
    title: "Authorizations",
    subtitle: "Pipeline, expiring auths, missing docs and payer portals.",
    quickActions: [
      { label: "New Auth", icon: Plus, variant: "primary" },
      { label: "Open Payer Portals", variant: "secondary" },
    ],
    filters: [{ label: "State", chips: STATE_CHIPS }, { label: "Payer", chips: [
      { label: "All", value: "all" }, { label: "Aetna", value: "aetna" }, { label: "Cigna", value: "cigna" }, { label: "BCBS", value: "bcbs" }, { label: "Medicaid", value: "mcd" },
    ] }],
    kpis: [
      { label: "Open Auths",     value: "186", delta: "+11 wk",   trend: "up" },
      { label: "Expiring < 14d", value: "9",   delta: "+3",       trend: "up" },
      { label: "Missing Docs",   value: "22",  delta: "Today",    trend: "flat" },
      { label: "Avg Days to Auth", value: "12d", delta: "Goal 8d",trend: "down" },
      { label: "Utilization",    value: "78%", delta: "Goal 85%", trend: "down" },
      { label: "Denial Rate",    value: "4.1%",delta: "-0.6%",    trend: "down" },
    ],
    tabs: [
      { id: "queue", label: "Auth Queue", queueTitle: "Active authorizations",
        columns: [
          { key: "client", label: "Client" }, { key: "payer", label: "Payer" },
          { key: "type", label: "Type" }, { key: "owner", label: "Owner" },
          { key: "due", label: "Due" }, { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("au1", "critical", { client: "Mendez, A.", payer: "Aetna",  type: "Reauth", owner: "Jordan", due: "Jun 22", blocker: "Portal down" }, "Escalate"),
          r("au2", "high",     { client: "Patel, R.",  payer: "Cigna",  type: "Initial",owner: "Jordan", due: "Jun 25", blocker: "Missing TP" }, "Request"),
          r("au3", "medium",   { client: "Nguyen, T.", payer: "BCBS",   type: "Treatment", owner: "Jordan", due: "Jul 02", blocker: "—" }, "Submit"),
          r("au4", "ok",       { client: "Brooks, M.", payer: "Medicaid",type: "Reauth",owner: "Jordan", due: "Jul 05", blocker: "—" }, "Submit"),
        ],
      },
      { id: "expiring", label: "Expiring Auths", queueTitle: "Expiring within 30 days",
        columns: [{ key: "client", label: "Client" }, { key: "payer", label: "Payer" }, { key: "expires", label: "Expires" }, { key: "owner", label: "Owner" }],
        rows: [
          r("ae1", "critical", { client: "Mendez, A.", payer: "Aetna", expires: "Jun 22", owner: "Jordan" }, "Reauth now"),
          r("ae2", "high",     { client: "Lopez, S.",  payer: "BCBS",  expires: "Jun 29", owner: "Jordan" }, "Reauth"),
        ],
      },
      { id: "missing-docs", label: "Missing Docs", queueTitle: "Cases blocked on docs",
        columns: [{ key: "client", label: "Client" }, { key: "need", label: "Needed" }, { key: "owner", label: "Owner" }, { key: "age", label: "Age" }],
        rows: [
          r("am1", "high", { client: "Patel, R.",  need: "Treatment Plan", owner: "BCBA: K. Owens", age: "4d" }, "Ping BCBA"),
          r("am2", "medium", { client: "Khan, F.", need: "Dx Report",      owner: "Intake", age: "6d" }, "Request"),
        ],
      },
    ],
    alerts: [
      { id: "aa1", title: "Aetna portal degraded", meta: "Vendor incident", urgency: "critical" },
      { id: "aa2", title: "3 reauths within 7 days", meta: "Critical path", urgency: "high" },
    ],
    escalations: [{ id: "ae1", title: "Aetna SLA breach", meta: "Escalated to COO", urgency: "critical" }],
    activity: [
      { id: "aac1", who: "Jordan", what: "submitted 7 auths to BCBS", when: "1h ago" },
    ],
    ai: [
      { id: "aai1", text: "Which payers have the longest TAT this month?" },
      { id: "aai2", text: "List reauths needing BCBA action this week." },
    ],
    reports: [{ label: "Auth Utilization", path: "/reports?view=auth-utilization" }, { label: "Denial Trends", path: "/reports?view=denials" }],
    resources: [{ label: "Payer Playbooks", path: "/resources?cat=payers" }],
    related: [{ label: "QA / Compliance", path: "/ws/qa" }, { label: "Billing / Credentialing", path: "/ws/billing-credentialing" }],
  },

  // ---------- QA ----------
  qa: {
    id: "qa",
    title: "QA / Compliance",
    subtitle: "Treatment plans, progress reports and compliance checks.",
    quickActions: [{ label: "Assign Reviewer", icon: Plus, variant: "primary" }],
    filters: [{ label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "Open Reviews",   value: "37", delta: "+5",    trend: "up" },
      { label: "Overdue",        value: "4",  delta: "Today", trend: "flat" },
      { label: "On-Time %",      value: "92%",delta: "+1.3%", trend: "up" },
      { label: "Avg Review Time",value: "1.8d",delta: "Goal 1d", trend: "down" },
      { label: "Compliance",     value: "98%", delta: "—",    trend: "flat" },
      { label: "BCBA Follow-ups",value: "11",  delta: "Open", trend: "flat" },
    ],
    tabs: [
      { id: "queue", label: "QA Queue", queueTitle: "Items awaiting review",
        columns: [
          { key: "item", label: "Item" }, { key: "type", label: "Type" },
          { key: "bcba", label: "BCBA" }, { key: "due", label: "Due" }, { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("q1", "critical", { item: "Mendez TP",    type: "Treatment Plan", bcba: "K. Owens", due: "Today", blocker: "Goals incomplete" }, "Return to BCBA"),
          r("q2", "high",     { item: "Patel PR",     type: "Progress Report",bcba: "K. Owens", due: "Today", blocker: "Data missing" }, "Request"),
          r("q3", "medium",   { item: "Brooks PR",    type: "Progress Report",bcba: "S. Patel", due: "Tomorrow", blocker: "—" }, "Approve"),
        ],
      },
      { id: "treatment-plans", label: "Treatment Plans", queueTitle: "Treatment plan reviews",
        columns: [{ key: "client", label: "Client" }, { key: "bcba", label: "BCBA" }, { key: "stage", label: "Stage" }, { key: "due", label: "Due" }],
        rows: [
          r("qt1", "high", { client: "Mendez, A.", bcba: "K. Owens", stage: "Revisions", due: "Today" }, "Open"),
        ],
      },
      { id: "compliance", label: "Compliance", queueTitle: "Compliance checks",
        columns: [{ key: "check", label: "Check" }, { key: "scope", label: "Scope" }, { key: "result", label: "Result" }, { key: "owner", label: "Owner" }],
        rows: [
          r("qc1", "ok", { check: "Supervision %",  scope: "GA", result: "OK", owner: "QA" }, "View"),
          r("qc2", "high", { check: "Note timeliness", scope: "NC", result: "3 RBTs flagged", owner: "QA" }, "Open"),
        ],
      },
    ],
    alerts: [{ id: "qa1", title: "4 reviews overdue", meta: "All GA", urgency: "high" }],
    escalations: [],
    activity: [{ id: "qac1", who: "Priya", what: "closed 12 reviews", when: "yesterday" }],
    ai: [{ id: "qai1", text: "Which BCBAs have the most return-for-revision rate?" }],
    reports: [{ label: "QA Throughput", path: "/reports?view=qa-throughput" }],
    resources: [{ label: "Clinical SOPs", path: "/resources?cat=clinical" }],
    related: [{ label: "Authorizations", path: "/ws/authorizations" }],
  },

  // ---------- SCHEDULING ----------
  scheduling: {
    id: "scheduling",
    title: "Scheduling & Staffing",
    subtitle: "Coverage, availability and staffing risk across all clients.",
    quickActions: [{ label: "Open CR Sync", variant: "primary" }, { label: "Add Availability", icon: Plus, variant: "secondary" }],
    filters: [{ label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "Uncovered Hours", value: "146h", delta: "+22 vs wk", trend: "up" },
      { label: "Pending Starts",  value: "12",   delta: "This wk",   trend: "flat" },
      { label: "Active Pairings", value: "284",  delta: "+6",        trend: "up" },
      { label: "RBT Availability",value: "76%",  delta: "Goal 85%",  trend: "down" },
      { label: "Restaffing Open", value: "9",    delta: "Today",     trend: "flat" },
      { label: "CR Sync Lag",     value: "12m",  delta: "OK",        trend: "flat" },
    ],
    tabs: [
      { id: "queue", label: "Scheduling Queue", queueTitle: "Items requiring action",
        columns: [
          { key: "client", label: "Client" }, { key: "need", label: "Need" }, { key: "owner", label: "Owner" },
          { key: "due", label: "Due" }, { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("s1", "critical", { client: "Lopez, S.",  need: "RBT 12h/wk", owner: "Devon", due: "Today", blocker: "No availability" }, "Open"),
          r("s2", "high",     { client: "Reyes, J.",  need: "Pair swap",  owner: "Devon", due: "Today", blocker: "Family request" }, "Open"),
          r("s3", "medium",   { client: "Brooks, M.", need: "Onboarding", owner: "Devon", due: "Tomorrow", blocker: "—" }, "Open"),
        ],
      },
      { id: "pending-starts", label: "Pending Starts", queueTitle: "Awaiting first session",
        columns: [{ key: "client", label: "Client" }, { key: "hours", label: "Hours" }, { key: "owner", label: "Owner" }, { key: "due", label: "Target start" }],
        rows: [
          r("sp1", "high", { client: "Mendez, A.", hours: "15h/wk", owner: "Devon", due: "Mon" }, "Pair RBT"),
        ],
      },
      { id: "uncovered", label: "Uncovered Hours", queueTitle: "Uncovered this week",
        columns: [{ key: "client", label: "Client" }, { key: "hours", label: "Hours" }, { key: "reason", label: "Reason" }],
        rows: [
          r("su1", "critical", { client: "Lopez, S.", hours: "12h", reason: "RBT out" }, "Open"),
        ],
      },
    ],
    alerts: [{ id: "sa1", title: "GA uncovered hours rising", meta: "+22 wk over wk", urgency: "high" }],
    escalations: [{ id: "se1", title: "Lopez family — uncovered 12h", meta: "Escalated", urgency: "critical" }],
    activity: [{ id: "sac1", who: "Devon", what: "covered 4 sessions for Patel", when: "1h ago" }],
    ai: [{ id: "sai1", text: "Which RBTs have spare capacity in GA?" }],
    reports: [{ label: "Coverage & Capacity", path: "/reports?view=coverage" }],
    resources: [{ label: "Scheduling SOPs", path: "/resources?cat=scheduling" }],
    related: [
      { label: "RBT Readiness Board", path: "/training/rbt-readiness" },
      { label: "RBT Academy Admin", path: "/training/rbt-admin" },
      { label: "Recruiting", path: "/ws/recruiting" },
    ],
  },

  // ---------- RECRUITING ----------
  recruiting: {
    id: "recruiting",
    title: "Recruiting",
    subtitle: "Pipeline, interviews, offers and onboarding.",
    quickActions: [{ label: "Add Candidate", icon: Plus, variant: "primary" }, { label: "Open Roles", variant: "secondary" }],
    filters: [{ label: "Role", chips: [
      { label: "All", value: "all" }, { label: "RBT", value: "rbt" }, { label: "BCBA", value: "bcba" }, { label: "Admin", value: "admin" },
    ] }, { label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "Open Roles",       value: "27",  delta: "+5",     trend: "up" },
      { label: "Active Candidates",value: "146", delta: "+18 wk", trend: "up" },
      { label: "Time to Hire",     value: "38d", delta: "Goal 28",trend: "down" },
      { label: "Offer Accept %",   value: "71%", delta: "-4%",    trend: "down" },
      { label: "Background Pending",value: "9",  delta: "Today",  trend: "flat" },
      { label: "Orientation This Wk", value: "6", delta: "Mon 9am", trend: "flat" },
    ],
    tabs: [
      { id: "pipeline", label: "Pipeline", queueTitle: "Candidates in pipeline",
        columns: [
          { key: "name", label: "Candidate" }, { key: "role", label: "Role" },
          { key: "stage", label: "Stage" }, { key: "owner", label: "Owner" },
          { key: "due", label: "Next step" }, { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("rc1", "high",     { name: "Avery K.",  role: "RBT",  stage: "Interview", owner: "Casey", due: "Today",   blocker: "—" }, "Schedule"),
          r("rc2", "medium",   { name: "Marcus T.", role: "BCBA", stage: "Offer",     owner: "Casey", due: "Tomorrow",blocker: "Comp ask" }, "Open"),
          r("rc3", "critical", { name: "Sara P.",   role: "RBT",  stage: "Background",owner: "Casey", due: "Today",   blocker: "Vendor delay" }, "Chase"),
        ],
      },
      { id: "interviews", label: "Interviews", queueTitle: "Upcoming interviews",
        columns: [{ key: "name", label: "Candidate" }, { key: "when", label: "When" }, { key: "interviewer", label: "Interviewer" }],
        rows: [
          r("ri1", "medium", { name: "Avery K.", when: "Today 2pm", interviewer: "K. Owens" }, "Open"),
        ],
      },
      { id: "orientation", label: "Orientation", queueTitle: "Next orientation cohort",
        columns: [{ key: "name", label: "Hire" }, { key: "role", label: "Role" }, { key: "start", label: "Start" }],
        rows: [
          r("ro1", "ok", { name: "Jenna R.", role: "RBT", start: "Mon 9am" }, "Open"),
        ],
      },
    ],
    alerts: [{ id: "ral1", title: "Background checks SLA slipping", meta: "Vendor", urgency: "high" }],
    escalations: [],
    activity: [{ id: "rac1", who: "Casey", what: "made offers to 3 RBTs", when: "yesterday" }],
    ai: [{ id: "rai1", text: "Which sources convert best for BCBAs?" }],
    reports: [{ label: "Pipeline Health", path: "/reports?view=recruiting" }],
    resources: [{ label: "Interview Guides", path: "/resources?cat=interviews" }],
    related: [{ label: "HR / Payroll", path: "/ws/hr" }, { label: "Scheduling", path: "/ws/scheduling" }],
  },

  // ---------- HR ----------
  hr: {
    id: "hr",
    title: "HR / Payroll",
    subtitle: "People, payroll, training and compliance.",
    quickActions: [{ label: "New Hire", icon: Plus, variant: "primary" }, { label: "Run Payroll", variant: "secondary" }],
    filters: [{ label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "Active Employees", value: "318", delta: "+9 wk",   trend: "up" },
      { label: "Onboarding",       value: "14",  delta: "This wk", trend: "flat" },
      { label: "Compliance %",     value: "97%", delta: "Goal 100%", trend: "flat" },
      { label: "Training Overdue", value: "23",  delta: "-5",      trend: "down" },
      { label: "Reviews Due",      value: "11",  delta: "30d",     trend: "flat" },
      { label: "Payroll Variances",value: "3",   delta: "Open",    trend: "flat" },
    ],
    tabs: [
      { id: "directory", label: "Directory", queueTitle: "Employees requiring action",
        columns: [
          { key: "name", label: "Employee" }, { key: "role", label: "Role" },
          { key: "owner", label: "Owner" }, { key: "due", label: "Due" }, { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("h1", "high",   { name: "J. Rivera", role: "RBT",  owner: "HR", due: "Today",    blocker: "Cert expiring" }, "Renew"),
          r("h2", "medium", { name: "K. Owens",  role: "BCBA", owner: "HR", due: "Tomorrow", blocker: "Review due" }, "Schedule"),
        ],
      },
      { id: "payroll", label: "Payroll Queue", queueTitle: "This pay period",
        columns: [{ key: "name", label: "Employee" }, { key: "issue", label: "Issue" }, { key: "amount", label: "Amount" }, { key: "owner", label: "Owner" }],
        rows: [
          r("hp1", "critical", { name: "J. Rivera", issue: "Unvalidated OT", amount: "$420", owner: "Payroll" }, "Validate"),
          r("hp2", "medium",   { name: "M. Lee",    issue: "Missing notes",  amount: "—",    owner: "Payroll" }, "Chase"),
        ],
      },
      { id: "viventium", label: "Viventium Readiness", queueTitle: "Pre-export checks",
        columns: [{ key: "check", label: "Check" }, { key: "status", label: "Status" }, { key: "owner", label: "Owner" }],
        rows: [
          r("hv1", "ok", { check: "Hours validated", status: "OK", owner: "Payroll" }, "View"),
          r("hv2", "high", { check: "Variances cleared", status: "3 open", owner: "Payroll" }, "Open"),
        ],
      },
    ],
    alerts: [{ id: "hal1", title: "23 trainings overdue", meta: "RBT cert tracks", urgency: "medium" }],
    escalations: [],
    activity: [{ id: "hac1", who: "HR", what: "onboarded 4 new RBTs", when: "yesterday" }],
    ai: [{ id: "hai1", text: "Who has certifications expiring in 30 days?" }],
    reports: [{ label: "Payroll Variances", path: "/reports?view=payroll" }, { label: "Training Compliance", path: "/reports?view=training" }],
    resources: [{ label: "Employee Handbook", path: "/resources?cat=hr" }],
    related: [{ label: "Recruiting", path: "/ws/recruiting" }],
  },

  // ---------- BILLING / CREDENTIALING ----------
  "billing-credentialing": {
    id: "billing-credentialing",
    title: "Billing / Credentialing",
    subtitle: "Claims, payer issues and credentialing status.",
    quickActions: [{ label: "Submit Claims", icon: Send, variant: "primary" }],
    filters: [{ label: "Payer", chips: [
      { label: "All", value: "all" }, { label: "Aetna", value: "aetna" }, { label: "Cigna", value: "cigna" }, { label: "BCBS", value: "bcbs" },
    ] }, { label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "Claims in Queue", value: "412", delta: "+22",   trend: "up" },
      { label: "Denials",         value: "31",  delta: "-4",    trend: "down" },
      { label: "AR > 60d",        value: "$184K", delta: "-$12K", trend: "down" },
      { label: "Credentialing Open", value: "9", delta: "Today", trend: "flat" },
      { label: "Payer Problems",  value: "5",   delta: "Active",trend: "flat" },
      { label: "Clean Claim Rate",value: "96%", delta: "+0.8%", trend: "up" },
    ],
    tabs: [
      { id: "queue", label: "Billing Queue", queueTitle: "Claims requiring action",
        columns: [
          { key: "client", label: "Client" }, { key: "payer", label: "Payer" },
          { key: "amount", label: "Amount" }, { key: "issue", label: "Issue" },
          { key: "owner", label: "Owner" }, { key: "age", label: "Age" },
        ],
        rows: [
          r("b1", "critical", { client: "Mendez, A.", payer: "Aetna",  amount: "$2,140", issue: "Auth mismatch",  owner: "RCM", age: "12d" }, "Rebill"),
          r("b2", "high",     { client: "Patel, R.",  payer: "Cigna",  amount: "$1,860", issue: "Missing modifier",owner: "RCM", age: "7d" }, "Fix"),
          r("b3", "medium",   { client: "Brooks, M.", payer: "BCBS",   amount: "$980",   issue: "—",               owner: "RCM", age: "2d" }, "Submit"),
        ],
      },
      { id: "credentialing", label: "Credentialing", queueTitle: "Credentialing in flight",
        columns: [{ key: "provider", label: "Provider" }, { key: "payer", label: "Payer" }, { key: "stage", label: "Stage" }, { key: "due", label: "Due" }],
        rows: [
          r("bc1", "high", { provider: "K. Owens", payer: "Aetna", stage: "Submitted", due: "Jul 10" }, "Follow up"),
        ],
      },
      { id: "payer-problems", label: "Payer Problems", queueTitle: "Open payer issues",
        columns: [{ key: "payer", label: "Payer" }, { key: "issue", label: "Issue" }, { key: "owner", label: "Owner" }, { key: "age", label: "Age" }],
        rows: [
          r("bp1", "critical", { payer: "Aetna", issue: "Portal degraded", owner: "RCM", age: "1d" }, "Open"),
        ],
      },
    ],
    alerts: [{ id: "bal1", title: "$184K AR > 60d", meta: "Trending down", urgency: "high" }],
    escalations: [{ id: "be1", title: "Aetna portal escalation", meta: "Joint w/ Auths", urgency: "critical" }],
    activity: [{ id: "bac1", who: "RCM", what: "rebilled 14 Aetna claims", when: "today" }],
    ai: [{ id: "bai1", text: "What's driving Cigna denials this month?" }],
    reports: [{ label: "RCM Scorecard", path: "/reports?view=rcm" }, { label: "AR Aging", path: "/reports?view=ar" }],
    resources: [{ label: "Coding Playbooks", path: "/resources?cat=coding" }],
    related: [{ label: "Authorizations", path: "/ws/authorizations" }, { label: "Finance / Benefits", path: "/ws/finance" }],
  },

  // ---------- FINANCE / BENEFITS ----------
  finance: {
    id: "finance",
    title: "Finance / Benefits",
    subtitle: "VOB review, benefits, payment plans and case approvals.",
    quickActions: [{ label: "New VOB", icon: Plus, variant: "primary" }],
    filters: [{ label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "VOBs in Review",   value: "44",  delta: "+8",     trend: "up" },
      { label: "Approved Cases",   value: "12",  delta: "This wk",trend: "flat" },
      { label: "Payment Plans",    value: "23",  delta: "Active", trend: "flat" },
      { label: "Avg VOB Cycle",    value: "1.8d",delta: "Goal 1d",trend: "down" },
      { label: "Case Approvals Due", value: "6", delta: "Today",  trend: "flat" },
      { label: "Open Finance Notes", value: "9", delta: "—",      trend: "flat" },
    ],
    tabs: [
      { id: "vob", label: "VOB Review", queueTitle: "VOBs needing decision",
        columns: [
          { key: "client", label: "Client" }, { key: "payer", label: "Payer" },
          { key: "owner", label: "Owner" }, { key: "due", label: "Due" },
          { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("f1", "high",   { client: "Mendez, A.", payer: "Aetna",  owner: "Finance", due: "Today",    blocker: "Benefits unclear" }, "Open"),
          r("f2", "medium", { client: "Patel, R.",  payer: "Cigna",  owner: "Finance", due: "Tomorrow", blocker: "—" }, "Approve"),
        ],
      },
      { id: "case-approvals", label: "Case Approvals", queueTitle: "Cases awaiting approval",
        columns: [{ key: "client", label: "Client" }, { key: "amount", label: "Est. cost" }, { key: "owner", label: "Owner" }],
        rows: [
          r("fc1", "high", { client: "Reyes, J.", amount: "$18K/yr", owner: "Finance Lead" }, "Approve"),
        ],
      },
      { id: "payment-plans", label: "Payment Plans", queueTitle: "Active plans",
        columns: [{ key: "family", label: "Family" }, { key: "balance", label: "Balance" }, { key: "status", label: "Status" }],
        rows: [
          r("fp1", "ok", { family: "Brooks", balance: "$1,200", status: "On track" }, "View"),
        ],
      },
    ],
    alerts: [{ id: "fal1", title: "6 case approvals due today", meta: "Finance Lead", urgency: "high" }],
    escalations: [],
    activity: [{ id: "fac1", who: "Finance", what: "approved 4 VOBs", when: "1h ago" }],
    ai: [{ id: "fai1", text: "Summarize benefits across pending VOBs." }],
    reports: [{ label: "VOB Throughput", path: "/reports?view=vob" }],
    resources: [{ label: "Benefits References", path: "/resources?cat=benefits" }],
    related: [{ label: "Billing / Credentialing", path: "/ws/billing-credentialing" }, { label: "Intake", path: "/ws/intake" }],
  },

  // ---------- STATE COMMAND ----------
  "state-command": {
    id: "state-command",
    title: "State Command Center",
    subtitle: "State-level visibility for the State Director.",
    quickActions: [{ label: "Message Team", icon: MessageSquare, variant: "primary" }, { label: "Open Scorecard", variant: "secondary" }],
    filters: [{ label: "State", chips: STATE_CHIPS }],
    kpis: [
      { label: "State Clients",   value: "118", delta: "+6 wk",  trend: "up" },
      { label: "Pipeline",        value: "37",  delta: "+9",     trend: "up" },
      { label: "Staffing Risk",   value: "Med", delta: "2 yellow",trend: "flat" },
      { label: "Open Roles",      value: "8",   delta: "RBT-heavy",trend: "flat" },
      { label: "Escalations",     value: "3",   delta: "Active", trend: "flat" },
      { label: "Scorecard",       value: "84",  delta: "Goal 90",trend: "down" },
    ],
    tabs: [
      { id: "queue", label: "State Work Queue", queueTitle: "State items requiring attention",
        columns: [
          { key: "item", label: "Item" }, { key: "area", label: "Area" },
          { key: "owner", label: "Owner" }, { key: "due", label: "Due" }, { key: "blocker", label: "Blocker" },
        ],
        rows: [
          r("st1", "high",   { item: "Lopez uncovered hours", area: "Scheduling", owner: "Devon", due: "Today", blocker: "RBT capacity" }, "Open"),
          r("st2", "critical", { item: "Aetna portal — GA",   area: "Auths",       owner: "Jordan", due: "Today", blocker: "Vendor" }, "Open"),
          r("st3", "medium", { item: "New referrals",         area: "Growth",      owner: "State Dir.", due: "Wk", blocker: "—" }, "Open"),
        ],
      },
      { id: "pipeline", label: "Pipeline", queueTitle: "State intake pipeline",
        columns: [{ key: "family", label: "Family" }, { key: "stage", label: "Stage" }, { key: "owner", label: "Owner" }],
        rows: [
          r("stp1", "medium", { family: "Patel", stage: "VOB", owner: "Maya" }, "Open"),
        ],
      },
      { id: "relationships", label: "Local Relationships", queueTitle: "Community partners",
        columns: [{ key: "partner", label: "Partner" }, { key: "last", label: "Last touch" }, { key: "owner", label: "Owner" }],
        rows: [
          r("str1", "low", { partner: "Atlanta Peds Group", last: "5d ago", owner: "State Dir." }, "Reach out"),
        ],
      },
    ],
    alerts: [{ id: "stal1", title: "GA scorecard slipping", meta: "84 vs 90 goal", urgency: "high" }],
    escalations: [{ id: "ste1", title: "Aetna portal — joint w/ COO", meta: "Owner: State Dir.", urgency: "critical" }],
    activity: [{ id: "stac1", who: "State Dir.", what: "approved 3 staffing changes", when: "today" }],
    ai: [{ id: "stai1", text: "What's driving GA scorecard regression?" }],
    reports: [{ label: "State Scorecard", path: "/reports?view=state-scorecard" }],
    resources: [{ label: "State Playbook", path: "/resources?cat=state" }],
    related: [{ label: "Operations", path: "/ws/operations" }, { label: "Executive", path: "/ws/executive" }],
  },
};

/** Workspaces that have wireframe configs and a `/ws/:id` route. */
export const WIREFRAME_WORKSPACE_IDS = Object.keys(WORKSPACE_CONFIGS);