import type { OSState } from "@/contexts/OSRoleContext";

/**
 * Per-state operational dataset. Every widget in the State Director Command
 * Center reads from here so State Directors only ever see data for the state
 * they are assigned to (or actively scoped to).
 */

export type Tone = "ok" | "warn" | "crit";

export interface KpiSeed {
  key: string; value: string; delta: string; up: boolean; status: Tone;
  hint: string; spark: number[];
}
export interface DepartmentSeed {
  name: string; status: Tone; score: number; workload: number;
  overdue: number; completion: number; ai: string;
}
export interface BottleneckSeed {
  severity: "crit" | "warn"; title: string; dept: string; owner: string; action: string;
}
export interface RegionSeed {
  name: string; clients: number; fill: number; recruit: number; ops: number;
  trend: "up" | "down"; status: Tone; note: string;
}
export interface FillRowSeed { s: string; fill: number; need: number }
export interface SupportSeed { who: string; role: string; tone: string }
export interface AiInsightSeed {
  kind: "alert" | "warn" | "trend" | "idea" | "flow";
  title: string; body: string; cta: string;
}
export interface ActivitySeed {
  who: string; what: string; when: string;
  kind: "lead" | "schedule" | "cred" | "auth" | "offer" | "client" | "training";
}
export interface TaskSeed {
  title: string; owner: string; dept: string; due: string;
  priority: "High" | "Medium" | "Low";
  bucket: "Urgent" | "Team" | "Waiting" | "Escalations";
}
export interface MeetingSeed { title: string; time: string; tone: string }
export interface ApprovalSeed { what: string; who: string; due: string }

export interface StateOpsData {
  code: OSState; name: string; hubCity: string;
  opsScore: number; opsLabel: "Healthy" | "Stable" | "Watch" | "Critical";
  briefing: string;
  childrenServed: number; alerts: number; escalations: number;
  insightsCount: number; openNeeds: number;
  kpis: KpiSeed[];
  departments: DepartmentSeed[];
  bottlenecks: BottleneckSeed[];
  regions: RegionSeed[];
  staffing: FillRowSeed[];
  utilization: { d: string; v: number }[];
  cancellation: { d: string; v: number }[];
  leadConv: { m: string; v: number }[];
  recruitFunnel: { stage: string; v: number }[];
  orientationDept: { dept: string; v: number }[];
  support: SupportSeed[];
  ai: AiInsightSeed[];
  activity: ActivitySeed[];
  tasks: TaskSeed[];
  meetings: MeetingSeed[];
  approvals: ApprovalSeed[];
  training: { name: string; pct: number }[];
  highlights: {
    topRegion: string; newHires: number;
    parentSat: string; engagement: string; outcomes: string;
  };
}

export const STATE_DATA: Partial<Record<OSState, StateOpsData>> & Record<string, StateOpsData> = {
  NC: {
    code: "NC", name: "North Carolina", hubCity: "Charlotte",
    opsScore: 82, opsLabel: "Stable",
    briefing: "NC intake conversion improved +11% this week, however Charlotte staffing shortages may impact scheduling within 5 days.",
    childrenServed: 184, alerts: 6, escalations: 2, insightsCount: 5, openNeeds: 18,
    kpis: [
      { key: "Active Clients", value: "184", delta: "+9", up: true, status: "ok", hint: "NC · Waitlist 22", spark: [160,164,168,172,176,178,180,182,184] },
      { key: "New Leads (7d)", value: "28", delta: "+18%", up: true, status: "ok", hint: "vs prior week", spark: [12,14,16,18,20,22,25,27,28] },
      { key: "Clients Awaiting Staffing", value: "12", delta: "+3", up: false, status: "warn", hint: "Charlotte 7 · Raleigh 5", spark: [6,7,8,9,10,11,11,12,12] },
      { key: "Scheduling Fill Rate", value: "89%", delta: "+6%", up: true, status: "ok", hint: "Target ≥ 92%", spark: [80,82,83,85,86,87,88,89,89] },
      { key: "Open Authorizations", value: "31", delta: "+4", up: false, status: "warn", hint: "8 awaiting submit", spark: [22,24,26,27,28,29,30,31,31] },
      { key: "Expiring Auths (30d)", value: "11", delta: "+2", up: false, status: "warn", hint: "3 within 7 days", spark: [4,5,6,7,8,9,10,11,11] },
      { key: "Active RBTs", value: "62", delta: "+4", up: true, status: "ok", hint: "8 onboarding", spark: [54,55,56,58,59,60,61,62,62] },
      { key: "Active BCBAs", value: "14", delta: "+1", up: true, status: "ok", hint: "2 awaiting cred.", spark: [12,12,13,13,13,13,14,14,14] },
      { key: "Recruiting Pipeline", value: "47", delta: "+11%", up: true, status: "ok", hint: "18 offers out", spark: [30,33,36,38,40,42,44,46,47] },
      { key: "Orientation Completion", value: "82%", delta: "-3%", up: false, status: "warn", hint: "5 new hires backlog", spark: [88,87,86,85,84,83,82,82,82] },
      { key: "Client Retention (90d)", value: "94%", delta: "+1%", up: true, status: "ok", hint: "State avg 91%", spark: [90,91,91,92,92,93,93,94,94] },
      { key: "Session Completion", value: "93%", delta: "+2%", up: true, status: "ok", hint: "Target ≥ 95%", spark: [88,89,90,91,91,92,92,93,93] },
    ],
    departments: [
      { name: "Intake", status: "ok", score: 93, workload: 14, overdue: 1, completion: 95, ai: "NC response time 16m · improving" },
      { name: "Scheduling", status: "warn", score: 84, workload: 22, overdue: 4, completion: 89, ai: "Charlotte has 18 uncovered hours" },
      { name: "Staffing", status: "warn", score: 78, workload: 12, overdue: 3, completion: 82, ai: "12 clients awaiting RBT match" },
      { name: "Recruiting", status: "ok", score: 87, workload: 47, overdue: 2, completion: 88, ai: "Pipeline healthy · 18 offers out" },
      { name: "Credentialing", status: "crit", score: 62, workload: 7, overdue: 3, completion: 58, ai: "3 BCBAs awaiting payer approval" },
      { name: "Authorizations", status: "warn", score: 80, workload: 31, overdue: 5, completion: 84, ai: "11 expiring in 30 days" },
      { name: "QA", status: "ok", score: 90, workload: 9, overdue: 0, completion: 93, ai: "Reports on schedule" },
      { name: "Training", status: "warn", score: 82, workload: 11, overdue: 4, completion: 84, ai: "5 new hires awaiting orientation" },
      { name: "Parent Comms", status: "ok", score: 91, workload: 8, overdue: 1, completion: 94, ai: "Escalation volume low" },
      { name: "Operations", status: "ok", score: 88, workload: 16, overdue: 2, completion: 90, ai: "Daily standups on track" },
    ],
    bottlenecks: [
      { severity: "crit", title: "Charlotte — 18 uncovered hours this week", dept: "Scheduling", owner: "Jacob T.", action: "Open coverage matching" },
      { severity: "crit", title: "3 BCBAs pending insurance credentialing", dept: "Credentialing", owner: "Olivia C.", action: "Escalate to payer reps" },
      { severity: "warn", title: "RBT shortage detected in Raleigh", dept: "Staffing", owner: "Marcus W.", action: "Activate recruiting sprint" },
      { severity: "warn", title: "11 authorizations expiring within 30 days", dept: "Authorizations", owner: "Priya N.", action: "Batch renewal workflow" },
      { severity: "warn", title: "5 leads stalled awaiting intake forms", dept: "Intake", owner: "Emily R.", action: "Send reminder + follow-up" },
      { severity: "warn", title: "2 parent escalations open > 48h", dept: "Parent Comms", owner: "Ezra (you)", action: "Schedule outreach calls" },
    ],
    regions: [
      { name: "Charlotte", clients: 58, fill: 78, recruit: 64, ops: 71, trend: "down", status: "warn", note: "RBT shortage risk" },
      { name: "Raleigh", clients: 47, fill: 84, recruit: 70, ops: 79, trend: "down", status: "warn", note: "Hiring velocity slowing" },
      { name: "Greensboro", clients: 32, fill: 92, recruit: 88, ops: 91, trend: "up", status: "ok", note: "Top performer this month" },
      { name: "Durham", clients: 28, fill: 88, recruit: 82, ops: 86, trend: "up", status: "ok", note: "Stable & growing" },
      { name: "Wilmington", clients: 14, fill: 81, recruit: 58, ops: 73, trend: "down", status: "warn", note: "Pipeline below target" },
      { name: "Asheville", clients: 5, fill: 95, recruit: 90, ops: 93, trend: "up", status: "ok", note: "Excellent operational score" },
    ],
    staffing: [
      { s: "Charlotte", fill: 78, need: 7 },
      { s: "Raleigh", fill: 84, need: 5 },
      { s: "Greensboro", fill: 92, need: 2 },
      { s: "Durham", fill: 88, need: 3 },
      { s: "Asheville", fill: 95, need: 1 },
    ],
    utilization: [
      { d: "Mon", v: 82 }, { d: "Tue", v: 85 }, { d: "Wed", v: 88 },
      { d: "Thu", v: 86 }, { d: "Fri", v: 91 }, { d: "Sat", v: 78 }, { d: "Sun", v: 72 },
    ],
    cancellation: [
      { d: "W1", v: 6.2 }, { d: "W2", v: 5.8 }, { d: "W3", v: 5.1 },
      { d: "W4", v: 4.6 }, { d: "W5", v: 4.2 }, { d: "W6", v: 4.0 }, { d: "W7", v: 3.8 },
    ],
    leadConv: [{ m: "Mar", v: 47 }, { m: "Apr", v: 52 }, { m: "May", v: 58 }],
    recruitFunnel: [
      { stage: "Applicants", v: 412 }, { stage: "Screened", v: 218 },
      { stage: "Interviewed", v: 124 }, { stage: "Offered", v: 71 }, { stage: "Hired", v: 41 },
    ],
    orientationDept: [
      { dept: "Intake", v: 96 }, { dept: "Sched", v: 92 }, { dept: "RBT", v: 84 },
      { dept: "BCBA", v: 78 }, { dept: "Billing", v: 91 }, { dept: "QA", v: 82 },
    ],
    support: [
      { who: "Marisol Chen", role: "VP State Operations", tone: "os-tone-violet" },
      { who: "James Okafor", role: "Asst. State Director", tone: "os-tone-sky" },
      { who: "Priya Nair", role: "Auth Ops Lead", tone: "os-tone-amber" },
      { who: "Jacob Thomas", role: "Scheduling Lead", tone: "os-tone-mint" },
    ],
    ai: [
      { kind: "alert", title: "NC staffing demand rising", body: "Charlotte demand likely to grow next week — staffing buffer is below threshold.", cta: "Open coverage" },
      { kind: "warn", title: "Credentialing → client starts", body: "3 BCBA credential delays may impact 8 client starts within 10 days.", cta: "See forecast" },
      { kind: "trend", title: "Fill rate projection", body: "Scheduling fill rate projected to decline 4 pts if Raleigh RBT pipeline doesn't close.", cta: "View trend" },
      { kind: "idea", title: "Recruiting pipeline gap", body: "Pipeline insufficient for projected NC growth — add 6 candidates this week.", cta: "Action plan" },
      { kind: "flow", title: "Workflow optimization", body: "Auto-assign Charlotte intake to local pod — could save ~9h/week of triage.", cta: "Apply rule" },
    ],
    activity: [
      { who: "Emily R.", what: "submitted a new lead (Charlotte)", when: "3m", kind: "lead" },
      { who: "Jacob T.", what: "resolved Raleigh scheduling conflict", when: "14m", kind: "schedule" },
      { who: "Olivia C.", what: "approved RBT credential · NC", when: "28m", kind: "cred" },
      { who: "BCBS NC", what: "approved auth #A-2841", when: "41m", kind: "auth" },
      { who: "Sarah M.", what: "offer letter signed · Greensboro RBT", when: "1h", kind: "offer" },
      { who: "System", what: "client staffed · Durham", when: "2h", kind: "client" },
      { who: "Marcus W.", what: "completed orientation module", when: "3h", kind: "training" },
    ],
    tasks: [
      { title: "Approve Charlotte coverage matching plan", owner: "Ezra", dept: "Scheduling", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Follow up on BCBA credentialing (3 pending)", owner: "Olivia", dept: "Credentialing", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Call parent — escalation #NC-218", owner: "Ezra", dept: "Parent Comms", due: "Today", priority: "High", bucket: "Escalations" },
      { title: "Sign off on Raleigh intake auto-assign", owner: "Emily", dept: "Intake", due: "Tomorrow", priority: "Medium", bucket: "Team" },
      { title: "Review recruiting velocity plan", owner: "Sarah", dept: "Recruiting", due: "Fri", priority: "Medium", bucket: "Waiting" },
      { title: "Orientation kickoff — 5 new hires", owner: "HR Ops", dept: "Training", due: "Mon", priority: "Medium", bucket: "Team" },
    ],
    meetings: [
      { title: "NC Daily Standup", time: "8:30 – 9:00 AM", tone: "os-tone-sky" },
      { title: "Charlotte Scheduling Sync", time: "10:00 – 10:30", tone: "os-tone-violet" },
      { title: "1:1 — Assistant Director", time: "1:00 – 1:30 PM", tone: "os-tone-rose" },
      { title: "Parent Escalation Call", time: "3:30 – 4:00 PM", tone: "os-tone-amber" },
    ],
    approvals: [
      { what: "Recruiting offer · BCBA · Charlotte", who: "Sarah M.", due: "Today" },
      { what: "Coverage swap · Raleigh pod", who: "Jacob T.", due: "Today" },
      { what: "Credentialing submission · 2 RBTs", who: "Olivia C.", due: "Tomorrow" },
    ],
    training: [
      { name: "Scheduling Team", pct: 94 },
      { name: "Intake Team", pct: 88 },
      { name: "NC RBT Onboarding", pct: 82 },
      { name: "NC BCBA Documentation", pct: 71 },
    ],
    highlights: { topRegion: "Greensboro", newHires: 9, parentSat: "4.8 / 5", engagement: "92%", outcomes: "+14%" },
  },
  FL: {
    code: "FL", name: "Florida", hubCity: "Orlando",
    opsScore: 88, opsLabel: "Healthy",
    briefing: "FL census reached a record 312 active clients. Miami fill rate is the regional standout; Tampa BCBA bench is thinning.",
    childrenServed: 312, alerts: 4, escalations: 1, insightsCount: 5, openNeeds: 14,
    kpis: [
      { key: "Active Clients", value: "312", delta: "+14", up: true, status: "ok", hint: "FL · Waitlist 31", spark: [280,286,292,298,302,306,308,310,312] },
      { key: "New Leads (7d)", value: "46", delta: "+22%", up: true, status: "ok", hint: "vs prior week", spark: [22,26,30,34,38,40,42,44,46] },
      { key: "Clients Awaiting Staffing", value: "9", delta: "-2", up: true, status: "ok", hint: "Miami 3 · Tampa 4", spark: [14,13,12,11,10,10,9,9,9] },
      { key: "Scheduling Fill Rate", value: "93%", delta: "+3%", up: true, status: "ok", hint: "Target ≥ 92%", spark: [86,87,88,90,91,92,92,93,93] },
      { key: "Open Authorizations", value: "44", delta: "+6", up: false, status: "warn", hint: "12 awaiting submit", spark: [30,33,36,38,40,41,42,43,44] },
      { key: "Expiring Auths (30d)", value: "15", delta: "+3", up: false, status: "warn", hint: "5 within 7 days", spark: [6,7,9,11,12,13,14,15,15] },
      { key: "Active RBTs", value: "98", delta: "+6", up: true, status: "ok", hint: "12 onboarding", spark: [86,88,90,92,94,95,96,97,98] },
      { key: "Active BCBAs", value: "22", delta: "+2", up: true, status: "ok", hint: "1 awaiting cred.", spark: [18,19,19,20,20,21,21,22,22] },
      { key: "Recruiting Pipeline", value: "71", delta: "+8%", up: true, status: "ok", hint: "24 offers out", spark: [48,52,56,60,63,66,68,70,71] },
      { key: "Orientation Completion", value: "90%", delta: "+4%", up: true, status: "ok", hint: "2 new hires backlog", spark: [84,85,86,87,88,89,89,90,90] },
      { key: "Client Retention (90d)", value: "95%", delta: "+1%", up: true, status: "ok", hint: "State avg 91%", spark: [91,92,92,93,93,94,94,95,95] },
      { key: "Session Completion", value: "95%", delta: "+1%", up: true, status: "ok", hint: "Target ≥ 95%", spark: [91,92,92,93,94,94,95,95,95] },
    ],
    departments: [
      { name: "Intake", status: "ok", score: 95, workload: 22, overdue: 0, completion: 97, ai: "FL leads converting +22% WoW" },
      { name: "Scheduling", status: "ok", score: 91, workload: 28, overdue: 2, completion: 93, ai: "Miami pod fully covered" },
      { name: "Staffing", status: "ok", score: 88, workload: 9, overdue: 1, completion: 90, ai: "9 clients awaiting RBT match" },
      { name: "Recruiting", status: "ok", score: 90, workload: 71, overdue: 1, completion: 92, ai: "24 offers out · pipeline strong" },
      { name: "Credentialing", status: "warn", score: 76, workload: 6, overdue: 2, completion: 72, ai: "Tampa BCBA bench thin" },
      { name: "Authorizations", status: "warn", score: 82, workload: 44, overdue: 6, completion: 85, ai: "15 expiring in 30 days" },
      { name: "QA", status: "ok", score: 92, workload: 11, overdue: 0, completion: 94, ai: "All reports on schedule" },
      { name: "Training", status: "ok", score: 89, workload: 8, overdue: 1, completion: 90, ai: "Orientation backlog clearing" },
      { name: "Parent Comms", status: "ok", score: 93, workload: 6, overdue: 0, completion: 95, ai: "Escalation volume low" },
      { name: "Operations", status: "ok", score: 90, workload: 18, overdue: 1, completion: 92, ai: "Daily standups on track" },
    ],
    bottlenecks: [
      { severity: "crit", title: "Tampa — BCBA bench at 1 (need 3)", dept: "Credentialing", owner: "Olivia C.", action: "Fast-track 2 BCBA credentials" },
      { severity: "warn", title: "15 authorizations expiring within 30 days", dept: "Authorizations", owner: "Priya N.", action: "Batch renewal workflow" },
      { severity: "warn", title: "Jacksonville lead response > 1h", dept: "Intake", owner: "Emily R.", action: "Reassign to Orlando pod" },
      { severity: "warn", title: "1 parent escalation open > 48h", dept: "Parent Comms", owner: "Ezra (you)", action: "Schedule outreach call" },
    ],
    regions: [
      { name: "Miami", clients: 92, fill: 95, recruit: 88, ops: 93, trend: "up", status: "ok", note: "Top performer this month" },
      { name: "Orlando", clients: 78, fill: 92, recruit: 84, ops: 90, trend: "up", status: "ok", note: "Stable & growing" },
      { name: "Tampa", clients: 64, fill: 86, recruit: 70, ops: 78, trend: "down", status: "warn", note: "BCBA bench thinning" },
      { name: "Jacksonville", clients: 48, fill: 89, recruit: 76, ops: 84, trend: "up", status: "ok", note: "Improving response time" },
      { name: "Fort Lauderdale", clients: 22, fill: 90, recruit: 80, ops: 86, trend: "up", status: "ok", note: "Healthy operational score" },
      { name: "Tallahassee", clients: 8, fill: 82, recruit: 60, ops: 74, trend: "down", status: "warn", note: "Pipeline below target" },
    ],
    staffing: [
      { s: "Miami", fill: 95, need: 2 },
      { s: "Orlando", fill: 92, need: 3 },
      { s: "Tampa", fill: 86, need: 5 },
      { s: "Jacksonville", fill: 89, need: 3 },
      { s: "Tallahassee", fill: 82, need: 1 },
    ],
    utilization: [
      { d: "Mon", v: 85 }, { d: "Tue", v: 88 }, { d: "Wed", v: 91 },
      { d: "Thu", v: 90 }, { d: "Fri", v: 93 }, { d: "Sat", v: 81 }, { d: "Sun", v: 74 },
    ],
    cancellation: [
      { d: "W1", v: 5.4 }, { d: "W2", v: 5.0 }, { d: "W3", v: 4.4 },
      { d: "W4", v: 4.0 }, { d: "W5", v: 3.6 }, { d: "W6", v: 3.3 }, { d: "W7", v: 3.1 },
    ],
    leadConv: [{ m: "Mar", v: 54 }, { m: "Apr", v: 58 }, { m: "May", v: 64 }],
    recruitFunnel: [
      { stage: "Applicants", v: 624 }, { stage: "Screened", v: 348 },
      { stage: "Interviewed", v: 198 }, { stage: "Offered", v: 112 }, { stage: "Hired", v: 68 },
    ],
    orientationDept: [
      { dept: "Intake", v: 98 }, { dept: "Sched", v: 95 }, { dept: "RBT", v: 90 },
      { dept: "BCBA", v: 84 }, { dept: "Billing", v: 93 }, { dept: "QA", v: 88 },
    ],
    support: [
      { who: "Marisol Chen", role: "VP State Operations", tone: "os-tone-violet" },
      { who: "Daniela Cruz", role: "Asst. State Director", tone: "os-tone-sky" },
      { who: "Priya Nair", role: "Auth Ops Lead", tone: "os-tone-amber" },
      { who: "Andre Pierre", role: "Scheduling Lead", tone: "os-tone-mint" },
    ],
    ai: [
      { kind: "alert", title: "Tampa BCBA bench at risk", body: "Only 1 BCBA available — 4 client starts at risk within 14 days.", cta: "Open credentialing" },
      { kind: "warn", title: "Auth expirations climbing", body: "15 auths expire in 30 days · 5 inside 7 days. Initiate batch renewal.", cta: "Batch renew" },
      { kind: "trend", title: "Miami fill rate leading", body: "Miami at 95% — replicate covering model across other Florida regions.", cta: "View playbook" },
      { kind: "idea", title: "Jacksonville triage handoff", body: "Auto-routing Jacksonville leads to Orlando pod reduces response time by 38%.", cta: "Apply rule" },
      { kind: "flow", title: "Recruiting velocity strong", body: "Pipeline supports +20 clients per quarter at current conversion.", cta: "Forecast" },
    ],
    activity: [
      { who: "Emily R.", what: "submitted a new lead (Miami)", when: "4m", kind: "lead" },
      { who: "Andre P.", what: "resolved Tampa scheduling conflict", when: "18m", kind: "schedule" },
      { who: "Olivia C.", what: "approved RBT credential · FL", when: "32m", kind: "cred" },
      { who: "Aetna FL", what: "approved auth #A-5512", when: "48m", kind: "auth" },
      { who: "Sarah M.", what: "offer letter signed · Miami BCBA", when: "1h", kind: "offer" },
      { who: "System", what: "client staffed · Orlando", when: "2h", kind: "client" },
      { who: "Daniela C.", what: "completed orientation module", when: "3h", kind: "training" },
    ],
    tasks: [
      { title: "Approve Tampa BCBA fast-track plan", owner: "Ezra", dept: "Credentialing", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Sign off on Miami coverage playbook rollout", owner: "Ezra", dept: "Scheduling", due: "Today", priority: "High", bucket: "Team" },
      { title: "Call parent — escalation #FL-104", owner: "Ezra", dept: "Parent Comms", due: "Today", priority: "High", bucket: "Escalations" },
      { title: "Review auth renewal batch", owner: "Priya", dept: "Authorizations", due: "Tomorrow", priority: "Medium", bucket: "Waiting" },
      { title: "Approve Jacksonville triage automation", owner: "Emily", dept: "Intake", due: "Wed", priority: "Medium", bucket: "Team" },
      { title: "Orientation kickoff — 2 new hires", owner: "HR Ops", dept: "Training", due: "Mon", priority: "Low", bucket: "Team" },
    ],
    meetings: [
      { title: "FL Daily Standup", time: "8:30 – 9:00 AM", tone: "os-tone-sky" },
      { title: "Tampa Credentialing Sync", time: "10:00 – 10:30", tone: "os-tone-violet" },
      { title: "1:1 — Asst. Director", time: "1:00 – 1:30 PM", tone: "os-tone-rose" },
      { title: "Miami Region Review", time: "3:30 – 4:00 PM", tone: "os-tone-amber" },
    ],
    approvals: [
      { what: "Recruiting offer · BCBA · Tampa", who: "Sarah M.", due: "Today" },
      { what: "Coverage playbook · Miami", who: "Andre P.", due: "Today" },
      { what: "Credentialing submission · 1 BCBA", who: "Olivia C.", due: "Tomorrow" },
    ],
    training: [
      { name: "Scheduling Team", pct: 96 },
      { name: "Intake Team", pct: 92 },
      { name: "FL RBT Onboarding", pct: 90 },
      { name: "FL BCBA Documentation", pct: 84 },
    ],
    highlights: { topRegion: "Miami", newHires: 14, parentSat: "4.9 / 5", engagement: "94%", outcomes: "+17%" },
  },
  GA: {
    code: "GA", name: "Georgia", hubCity: "Atlanta",
    opsScore: 79, opsLabel: "Watch",
    briefing: "Atlanta growth is healthy, but Savannah scheduling fill is below target and authorizations are accumulating statewide.",
    childrenServed: 142, alerts: 7, escalations: 2, insightsCount: 5, openNeeds: 21,
    kpis: [
      { key: "Active Clients", value: "142", delta: "+6", up: true, status: "ok", hint: "GA · Waitlist 19", spark: [122,126,130,134,136,138,140,141,142] },
      { key: "New Leads (7d)", value: "22", delta: "+9%", up: true, status: "ok", hint: "vs prior week", spark: [12,13,15,17,18,19,20,21,22] },
      { key: "Clients Awaiting Staffing", value: "15", delta: "+4", up: false, status: "warn", hint: "Atlanta 8 · Savannah 5", spark: [8,9,10,11,12,13,14,14,15] },
      { key: "Scheduling Fill Rate", value: "84%", delta: "-2%", up: false, status: "warn", hint: "Target ≥ 92%", spark: [88,87,86,86,85,85,84,84,84] },
      { key: "Open Authorizations", value: "37", delta: "+8", up: false, status: "warn", hint: "14 awaiting submit", spark: [22,25,28,30,32,34,35,36,37] },
      { key: "Expiring Auths (30d)", value: "14", delta: "+4", up: false, status: "crit", hint: "6 within 7 days", spark: [6,7,9,10,11,12,13,14,14] },
      { key: "Active RBTs", value: "48", delta: "+2", up: true, status: "ok", hint: "6 onboarding", spark: [40,41,43,44,45,46,47,47,48] },
      { key: "Active BCBAs", value: "11", delta: "0", up: true, status: "warn", hint: "3 awaiting cred.", spark: [10,10,11,11,11,11,11,11,11] },
      { key: "Recruiting Pipeline", value: "34", delta: "+5%", up: true, status: "ok", hint: "12 offers out", spark: [22,24,26,28,30,31,32,33,34] },
      { key: "Orientation Completion", value: "78%", delta: "-5%", up: false, status: "warn", hint: "7 new hires backlog", spark: [86,85,83,82,80,79,78,78,78] },
      { key: "Client Retention (90d)", value: "92%", delta: "0%", up: true, status: "ok", hint: "State avg 91%", spark: [91,91,92,92,92,92,92,92,92] },
      { key: "Session Completion", value: "90%", delta: "+1%", up: true, status: "ok", hint: "Target ≥ 95%", spark: [86,87,88,88,89,89,90,90,90] },
    ],
    departments: [
      { name: "Intake", status: "ok", score: 89, workload: 12, overdue: 1, completion: 91, ai: "Atlanta response time 22m" },
      { name: "Scheduling", status: "warn", score: 80, workload: 25, overdue: 5, completion: 86, ai: "Savannah fill 76% · below target" },
      { name: "Staffing", status: "warn", score: 74, workload: 15, overdue: 4, completion: 78, ai: "15 clients awaiting RBT match" },
      { name: "Recruiting", status: "ok", score: 83, workload: 34, overdue: 2, completion: 85, ai: "Pipeline steady · 12 offers" },
      { name: "Credentialing", status: "crit", score: 58, workload: 8, overdue: 4, completion: 54, ai: "3 BCBAs awaiting payer approval" },
      { name: "Authorizations", status: "warn", score: 76, workload: 37, overdue: 7, completion: 80, ai: "14 expiring in 30 days" },
      { name: "QA", status: "ok", score: 88, workload: 7, overdue: 0, completion: 91, ai: "Reports on schedule" },
      { name: "Training", status: "warn", score: 78, workload: 13, overdue: 5, completion: 80, ai: "7 new hires awaiting orientation" },
      { name: "Parent Comms", status: "warn", score: 84, workload: 9, overdue: 2, completion: 88, ai: "2 escalations open" },
      { name: "Operations", status: "ok", score: 86, workload: 14, overdue: 2, completion: 88, ai: "Daily standups on track" },
    ],
    bottlenecks: [
      { severity: "crit", title: "Savannah — 14 uncovered hours this week", dept: "Scheduling", owner: "Andre P.", action: "Open coverage matching" },
      { severity: "crit", title: "3 BCBAs pending insurance credentialing", dept: "Credentialing", owner: "Olivia C.", action: "Escalate to payer reps" },
      { severity: "warn", title: "RBT shortage detected in Atlanta", dept: "Staffing", owner: "Marcus W.", action: "Activate recruiting sprint" },
      { severity: "warn", title: "14 authorizations expiring within 30 days", dept: "Authorizations", owner: "Priya N.", action: "Batch renewal workflow" },
      { severity: "warn", title: "7 leads stalled awaiting intake forms", dept: "Intake", owner: "Emily R.", action: "Send reminder + follow-up" },
      { severity: "warn", title: "2 parent escalations open > 48h", dept: "Parent Comms", owner: "Ezra (you)", action: "Schedule outreach calls" },
    ],
    regions: [
      { name: "Atlanta", clients: 64, fill: 86, recruit: 78, ops: 84, trend: "up", status: "ok", note: "Growing steadily" },
      { name: "Savannah", clients: 28, fill: 76, recruit: 62, ops: 70, trend: "down", status: "warn", note: "Coverage gap risk" },
      { name: "Augusta", clients: 22, fill: 88, recruit: 74, ops: 82, trend: "up", status: "ok", note: "Healthy region" },
      { name: "Columbus", clients: 16, fill: 84, recruit: 70, ops: 78, trend: "up", status: "ok", note: "Stable" },
      { name: "Macon", clients: 8, fill: 80, recruit: 58, ops: 72, trend: "down", status: "warn", note: "Pipeline below target" },
      { name: "Athens", clients: 4, fill: 92, recruit: 84, ops: 88, trend: "up", status: "ok", note: "Top operational score" },
    ],
    staffing: [
      { s: "Atlanta", fill: 86, need: 8 },
      { s: "Savannah", fill: 76, need: 6 },
      { s: "Augusta", fill: 88, need: 3 },
      { s: "Columbus", fill: 84, need: 3 },
      { s: "Athens", fill: 92, need: 1 },
    ],
    utilization: [
      { d: "Mon", v: 78 }, { d: "Tue", v: 82 }, { d: "Wed", v: 84 },
      { d: "Thu", v: 83 }, { d: "Fri", v: 86 }, { d: "Sat", v: 74 }, { d: "Sun", v: 68 },
    ],
    cancellation: [
      { d: "W1", v: 7.0 }, { d: "W2", v: 6.6 }, { d: "W3", v: 6.2 },
      { d: "W4", v: 5.8 }, { d: "W5", v: 5.4 }, { d: "W6", v: 5.1 }, { d: "W7", v: 4.9 },
    ],
    leadConv: [{ m: "Mar", v: 42 }, { m: "Apr", v: 46 }, { m: "May", v: 50 }],
    recruitFunnel: [
      { stage: "Applicants", v: 318 }, { stage: "Screened", v: 168 },
      { stage: "Interviewed", v: 92 }, { stage: "Offered", v: 52 }, { stage: "Hired", v: 28 },
    ],
    orientationDept: [
      { dept: "Intake", v: 92 }, { dept: "Sched", v: 88 }, { dept: "RBT", v: 78 },
      { dept: "BCBA", v: 72 }, { dept: "Billing", v: 88 }, { dept: "QA", v: 80 },
    ],
    support: [
      { who: "Marisol Chen", role: "VP State Operations", tone: "os-tone-violet" },
      { who: "Terrence Brown", role: "Asst. State Director", tone: "os-tone-sky" },
      { who: "Priya Nair", role: "Auth Ops Lead", tone: "os-tone-amber" },
      { who: "Andre Pierre", role: "Scheduling Lead", tone: "os-tone-mint" },
    ],
    ai: [
      { kind: "alert", title: "Savannah coverage at risk", body: "14 uncovered hours · fill rate 76% — escalate scheduling sprint.", cta: "Open coverage" },
      { kind: "warn", title: "Auth expirations climbing", body: "14 auths expire in 30 days · 6 inside 7 days.", cta: "Batch renew" },
      { kind: "trend", title: "Atlanta growth healthy", body: "Lead conversion +19% trailing 30 days — capacity headroom remains.", cta: "Forecast" },
      { kind: "idea", title: "Macon recruiting boost", body: "Add 4 candidates this week to keep Macon staffing on track.", cta: "Action plan" },
      { kind: "flow", title: "Orientation backlog", body: "Stand up parallel orientation track to clear 7-hire backlog.", cta: "Apply rule" },
    ],
    activity: [
      { who: "Emily R.", what: "submitted a new lead (Atlanta)", when: "5m", kind: "lead" },
      { who: "Andre P.", what: "resolved Savannah scheduling conflict", when: "16m", kind: "schedule" },
      { who: "Olivia C.", what: "approved RBT credential · GA", when: "30m", kind: "cred" },
      { who: "BCBS GA", what: "approved auth #A-3320", when: "44m", kind: "auth" },
      { who: "Sarah M.", what: "offer letter signed · Atlanta RBT", when: "1h", kind: "offer" },
      { who: "System", what: "client staffed · Augusta", when: "2h", kind: "client" },
      { who: "Marcus W.", what: "completed orientation module", when: "3h", kind: "training" },
    ],
    tasks: [
      { title: "Approve Savannah coverage sprint", owner: "Ezra", dept: "Scheduling", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Follow up on BCBA credentialing (3)", owner: "Olivia", dept: "Credentialing", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Call parent — escalation #GA-118", owner: "Ezra", dept: "Parent Comms", due: "Today", priority: "High", bucket: "Escalations" },
      { title: "Review Atlanta intake automation", owner: "Emily", dept: "Intake", due: "Tomorrow", priority: "Medium", bucket: "Team" },
      { title: "Review recruiting velocity plan", owner: "Sarah", dept: "Recruiting", due: "Fri", priority: "Medium", bucket: "Waiting" },
      { title: "Orientation kickoff — 7 new hires", owner: "HR Ops", dept: "Training", due: "Mon", priority: "Medium", bucket: "Team" },
    ],
    meetings: [
      { title: "GA Daily Standup", time: "8:30 – 9:00 AM", tone: "os-tone-sky" },
      { title: "Savannah Scheduling Sync", time: "10:00 – 10:30", tone: "os-tone-violet" },
      { title: "1:1 — Asst. Director", time: "1:00 – 1:30 PM", tone: "os-tone-rose" },
      { title: "Parent Escalation Call", time: "3:30 – 4:00 PM", tone: "os-tone-amber" },
    ],
    approvals: [
      { what: "Recruiting offer · BCBA · Atlanta", who: "Sarah M.", due: "Today" },
      { what: "Coverage sprint · Savannah", who: "Andre P.", due: "Today" },
      { what: "Credentialing submission · 2 RBTs", who: "Olivia C.", due: "Tomorrow" },
    ],
    training: [
      { name: "Scheduling Team", pct: 90 },
      { name: "Intake Team", pct: 86 },
      { name: "GA RBT Onboarding", pct: 78 },
      { name: "GA BCBA Documentation", pct: 68 },
    ],
    highlights: { topRegion: "Athens", newHires: 6, parentSat: "4.7 / 5", engagement: "89%", outcomes: "+11%" },
  },
  TX: {
    code: "TX", name: "Texas", hubCity: "Dallas",
    opsScore: 85, opsLabel: "Stable",
    briefing: "Texas remains the largest census. Houston demand is outpacing recruiting; Austin and Dallas are the regional standouts.",
    childrenServed: 256, alerts: 5, escalations: 2, insightsCount: 5, openNeeds: 19,
    kpis: [
      { key: "Active Clients", value: "256", delta: "+12", up: true, status: "ok", hint: "TX · Waitlist 28", spark: [220,228,234,240,244,248,250,253,256] },
      { key: "New Leads (7d)", value: "38", delta: "+15%", up: true, status: "ok", hint: "vs prior week", spark: [18,22,26,28,30,32,34,36,38] },
      { key: "Clients Awaiting Staffing", value: "17", delta: "+5", up: false, status: "warn", hint: "Houston 9 · Dallas 5", spark: [9,10,12,13,14,15,16,17,17] },
      { key: "Scheduling Fill Rate", value: "90%", delta: "+2%", up: true, status: "ok", hint: "Target ≥ 92%", spark: [84,85,86,87,88,89,89,90,90] },
      { key: "Open Authorizations", value: "42", delta: "+7", up: false, status: "warn", hint: "11 awaiting submit", spark: [28,31,34,36,38,40,41,42,42] },
      { key: "Expiring Auths (30d)", value: "13", delta: "+3", up: false, status: "warn", hint: "4 within 7 days", spark: [5,6,8,9,10,11,12,13,13] },
      { key: "Active RBTs", value: "82", delta: "+5", up: true, status: "ok", hint: "10 onboarding", spark: [70,72,74,76,78,80,81,82,82] },
      { key: "Active BCBAs", value: "19", delta: "+1", up: true, status: "ok", hint: "2 awaiting cred.", spark: [16,16,17,17,18,18,19,19,19] },
      { key: "Recruiting Pipeline", value: "58", delta: "+9%", up: true, status: "ok", hint: "22 offers out", spark: [38,42,46,49,52,54,56,57,58] },
      { key: "Orientation Completion", value: "85%", delta: "+1%", up: true, status: "ok", hint: "3 new hires backlog", spark: [82,83,83,84,84,85,85,85,85] },
      { key: "Client Retention (90d)", value: "93%", delta: "+1%", up: true, status: "ok", hint: "State avg 91%", spark: [89,90,90,91,91,92,92,93,93] },
      { key: "Session Completion", value: "94%", delta: "+2%", up: true, status: "ok", hint: "Target ≥ 95%", spark: [89,90,91,92,92,93,93,94,94] },
    ],
    departments: [
      { name: "Intake", status: "ok", score: 91, workload: 18, overdue: 1, completion: 93, ai: "TX response time 18m · improving" },
      { name: "Scheduling", status: "ok", score: 88, workload: 26, overdue: 3, completion: 91, ai: "Houston pod 92% covered" },
      { name: "Staffing", status: "warn", score: 80, workload: 17, overdue: 4, completion: 84, ai: "17 clients awaiting RBT match" },
      { name: "Recruiting", status: "ok", score: 88, workload: 58, overdue: 2, completion: 90, ai: "22 offers out · strong pipeline" },
      { name: "Credentialing", status: "warn", score: 72, workload: 7, overdue: 3, completion: 68, ai: "2 BCBAs awaiting payer approval" },
      { name: "Authorizations", status: "warn", score: 80, workload: 42, overdue: 6, completion: 84, ai: "13 expiring in 30 days" },
      { name: "QA", status: "ok", score: 91, workload: 10, overdue: 0, completion: 93, ai: "Reports on schedule" },
      { name: "Training", status: "ok", score: 86, workload: 10, overdue: 2, completion: 88, ai: "Orientation backlog clearing" },
      { name: "Parent Comms", status: "warn", score: 85, workload: 8, overdue: 2, completion: 88, ai: "2 escalations open" },
      { name: "Operations", status: "ok", score: 89, workload: 16, overdue: 2, completion: 91, ai: "Daily standups on track" },
    ],
    bottlenecks: [
      { severity: "crit", title: "Houston — RBT demand outpacing hiring", dept: "Staffing", owner: "Marcus W.", action: "Activate recruiting sprint" },
      { severity: "crit", title: "2 BCBAs pending insurance credentialing", dept: "Credentialing", owner: "Olivia C.", action: "Escalate to payer reps" },
      { severity: "warn", title: "13 authorizations expiring within 30 days", dept: "Authorizations", owner: "Priya N.", action: "Batch renewal workflow" },
      { severity: "warn", title: "Dallas scheduling — 9 uncovered hours", dept: "Scheduling", owner: "Jacob T.", action: "Open coverage matching" },
      { severity: "warn", title: "6 leads stalled awaiting intake forms", dept: "Intake", owner: "Emily R.", action: "Send reminder + follow-up" },
      { severity: "warn", title: "2 parent escalations open > 48h", dept: "Parent Comms", owner: "Ezra (you)", action: "Schedule outreach calls" },
    ],
    regions: [
      { name: "Houston", clients: 78, fill: 84, recruit: 70, ops: 78, trend: "down", status: "warn", note: "Demand outpacing hiring" },
      { name: "Dallas", clients: 72, fill: 90, recruit: 82, ops: 88, trend: "up", status: "ok", note: "Top performer this month" },
      { name: "Austin", clients: 54, fill: 94, recruit: 86, ops: 92, trend: "up", status: "ok", note: "Excellent operational score" },
      { name: "San Antonio", clients: 32, fill: 88, recruit: 78, ops: 84, trend: "up", status: "ok", note: "Stable & growing" },
      { name: "Fort Worth", clients: 14, fill: 86, recruit: 74, ops: 82, trend: "up", status: "ok", note: "Healthy region" },
      { name: "El Paso", clients: 6, fill: 80, recruit: 62, ops: 74, trend: "down", status: "warn", note: "Pipeline below target" },
    ],
    staffing: [
      { s: "Houston", fill: 84, need: 9 },
      { s: "Dallas", fill: 90, need: 5 },
      { s: "Austin", fill: 94, need: 2 },
      { s: "San Antonio", fill: 88, need: 2 },
      { s: "El Paso", fill: 80, need: 1 },
    ],
    utilization: [
      { d: "Mon", v: 84 }, { d: "Tue", v: 86 }, { d: "Wed", v: 89 },
      { d: "Thu", v: 87 }, { d: "Fri", v: 92 }, { d: "Sat", v: 79 }, { d: "Sun", v: 73 },
    ],
    cancellation: [
      { d: "W1", v: 5.8 }, { d: "W2", v: 5.4 }, { d: "W3", v: 4.9 },
      { d: "W4", v: 4.5 }, { d: "W5", v: 4.1 }, { d: "W6", v: 3.8 }, { d: "W7", v: 3.6 },
    ],
    leadConv: [{ m: "Mar", v: 49 }, { m: "Apr", v: 54 }, { m: "May", v: 60 }],
    recruitFunnel: [
      { stage: "Applicants", v: 524 }, { stage: "Screened", v: 282 },
      { stage: "Interviewed", v: 158 }, { stage: "Offered", v: 92 }, { stage: "Hired", v: 54 },
    ],
    orientationDept: [
      { dept: "Intake", v: 95 }, { dept: "Sched", v: 92 }, { dept: "RBT", v: 86 },
      { dept: "BCBA", v: 80 }, { dept: "Billing", v: 92 }, { dept: "QA", v: 86 },
    ],
    support: [
      { who: "Marisol Chen", role: "VP State Operations", tone: "os-tone-violet" },
      { who: "Carlos Reyes", role: "Asst. State Director", tone: "os-tone-sky" },
      { who: "Priya Nair", role: "Auth Ops Lead", tone: "os-tone-amber" },
      { who: "Jacob Thomas", role: "Scheduling Lead", tone: "os-tone-mint" },
    ],
    ai: [
      { kind: "alert", title: "Houston demand surge", body: "Lead growth +18% — recruiting must add 8 RBTs to keep pace.", cta: "Open recruiting" },
      { kind: "warn", title: "Credentialing → client starts", body: "2 BCBA delays may impact 5 client starts in 10 days.", cta: "See forecast" },
      { kind: "trend", title: "Austin operating model wins", body: "Austin ops score 92 — replicate playbook in Dallas and Houston.", cta: "View playbook" },
      { kind: "idea", title: "Auth submission batch", body: "Bundle 11 pending auth submissions to clear backlog this week.", cta: "Batch submit" },
      { kind: "flow", title: "Workflow optimization", body: "Auto-route El Paso intake to San Antonio pod to recover capacity.", cta: "Apply rule" },
    ],
    activity: [
      { who: "Emily R.", what: "submitted a new lead (Houston)", when: "4m", kind: "lead" },
      { who: "Jacob T.", what: "resolved Dallas scheduling conflict", when: "16m", kind: "schedule" },
      { who: "Olivia C.", what: "approved RBT credential · TX", when: "30m", kind: "cred" },
      { who: "BCBS TX", what: "approved auth #A-6610", when: "44m", kind: "auth" },
      { who: "Sarah M.", what: "offer letter signed · Austin BCBA", when: "1h", kind: "offer" },
      { who: "System", what: "client staffed · San Antonio", when: "2h", kind: "client" },
      { who: "Marcus W.", what: "completed orientation module", when: "3h", kind: "training" },
    ],
    tasks: [
      { title: "Approve Houston recruiting sprint", owner: "Ezra", dept: "Recruiting", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Follow up on BCBA credentialing (2)", owner: "Olivia", dept: "Credentialing", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Call parent — escalation #TX-204", owner: "Ezra", dept: "Parent Comms", due: "Today", priority: "High", bucket: "Escalations" },
      { title: "Sign off on Dallas coverage swap", owner: "Jacob", dept: "Scheduling", due: "Tomorrow", priority: "Medium", bucket: "Team" },
      { title: "Review recruiting velocity plan", owner: "Sarah", dept: "Recruiting", due: "Fri", priority: "Medium", bucket: "Waiting" },
      { title: "Orientation kickoff — 3 new hires", owner: "HR Ops", dept: "Training", due: "Mon", priority: "Low", bucket: "Team" },
    ],
    meetings: [
      { title: "TX Daily Standup", time: "8:30 – 9:00 AM", tone: "os-tone-sky" },
      { title: "Houston Recruiting Sync", time: "10:00 – 10:30", tone: "os-tone-violet" },
      { title: "1:1 — Asst. Director", time: "1:00 – 1:30 PM", tone: "os-tone-rose" },
      { title: "Parent Escalation Call", time: "3:30 – 4:00 PM", tone: "os-tone-amber" },
    ],
    approvals: [
      { what: "Recruiting offer · BCBA · Austin", who: "Sarah M.", due: "Today" },
      { what: "Coverage swap · Dallas pod", who: "Jacob T.", due: "Today" },
      { what: "Credentialing submission · 1 BCBA", who: "Olivia C.", due: "Tomorrow" },
    ],
    training: [
      { name: "Scheduling Team", pct: 93 },
      { name: "Intake Team", pct: 90 },
      { name: "TX RBT Onboarding", pct: 86 },
      { name: "TX BCBA Documentation", pct: 76 },
    ],
    highlights: { topRegion: "Austin", newHires: 11, parentSat: "4.8 / 5", engagement: "91%", outcomes: "+13%" },
  },
  VA: {
    code: "VA", name: "Virginia", hubCity: "Richmond",
    opsScore: 81, opsLabel: "Stable",
    briefing: "Virginia operations are steady. Norfolk recruiting pipeline is below plan; Richmond intake conversion is leading the state.",
    childrenServed: 108, alerts: 5, escalations: 1, insightsCount: 5, openNeeds: 12,
    kpis: [
      { key: "Active Clients", value: "108", delta: "+5", up: true, status: "ok", hint: "VA · Waitlist 14", spark: [92,96,98,100,102,104,106,107,108] },
      { key: "New Leads (7d)", value: "19", delta: "+11%", up: true, status: "ok", hint: "vs prior week", spark: [10,11,13,14,15,16,17,18,19] },
      { key: "Clients Awaiting Staffing", value: "8", delta: "+1", up: false, status: "warn", hint: "Richmond 4 · Norfolk 4", spark: [5,5,6,6,7,7,8,8,8] },
      { key: "Scheduling Fill Rate", value: "87%", delta: "+3%", up: true, status: "ok", hint: "Target ≥ 92%", spark: [80,81,82,83,84,85,86,87,87] },
      { key: "Open Authorizations", value: "24", delta: "+3", up: false, status: "warn", hint: "6 awaiting submit", spark: [16,18,19,20,21,22,23,24,24] },
      { key: "Expiring Auths (30d)", value: "8", delta: "+1", up: false, status: "warn", hint: "2 within 7 days", spark: [3,4,5,6,6,7,7,8,8] },
      { key: "Active RBTs", value: "42", delta: "+3", up: true, status: "ok", hint: "5 onboarding", spark: [34,35,36,38,39,40,41,42,42] },
      { key: "Active BCBAs", value: "10", delta: "+1", up: true, status: "ok", hint: "1 awaiting cred.", spark: [8,8,9,9,9,9,10,10,10] },
      { key: "Recruiting Pipeline", value: "28", delta: "+4%", up: true, status: "warn", hint: "8 offers out", spark: [18,20,22,23,24,25,26,27,28] },
      { key: "Orientation Completion", value: "84%", delta: "+1%", up: true, status: "ok", hint: "3 new hires backlog", spark: [80,81,82,82,83,83,84,84,84] },
      { key: "Client Retention (90d)", value: "93%", delta: "+1%", up: true, status: "ok", hint: "State avg 91%", spark: [89,90,91,91,92,92,93,93,93] },
      { key: "Session Completion", value: "92%", delta: "+2%", up: true, status: "ok", hint: "Target ≥ 95%", spark: [87,88,89,90,90,91,91,92,92] },
    ],
    departments: [
      { name: "Intake", status: "ok", score: 92, workload: 10, overdue: 0, completion: 94, ai: "Richmond conversion leading" },
      { name: "Scheduling", status: "ok", score: 85, workload: 18, overdue: 2, completion: 88, ai: "Norfolk coverage tightening" },
      { name: "Staffing", status: "warn", score: 80, workload: 8, overdue: 2, completion: 84, ai: "8 clients awaiting RBT match" },
      { name: "Recruiting", status: "warn", score: 78, workload: 28, overdue: 3, completion: 80, ai: "Pipeline below plan in Norfolk" },
      { name: "Credentialing", status: "warn", score: 74, workload: 5, overdue: 2, completion: 70, ai: "1 BCBA awaiting payer approval" },
      { name: "Authorizations", status: "warn", score: 81, workload: 24, overdue: 4, completion: 84, ai: "8 expiring in 30 days" },
      { name: "QA", status: "ok", score: 90, workload: 7, overdue: 0, completion: 92, ai: "Reports on schedule" },
      { name: "Training", status: "ok", score: 86, workload: 8, overdue: 1, completion: 88, ai: "Orientation backlog small" },
      { name: "Parent Comms", status: "ok", score: 89, workload: 6, overdue: 1, completion: 92, ai: "Escalation volume low" },
      { name: "Operations", status: "ok", score: 87, workload: 12, overdue: 1, completion: 90, ai: "Daily standups on track" },
    ],
    bottlenecks: [
      { severity: "crit", title: "Norfolk — recruiting pipeline below plan", dept: "Recruiting", owner: "Sarah M.", action: "Run targeted recruiting sprint" },
      { severity: "warn", title: "1 BCBA pending insurance credentialing", dept: "Credentialing", owner: "Olivia C.", action: "Escalate to payer rep" },
      { severity: "warn", title: "8 authorizations expiring within 30 days", dept: "Authorizations", owner: "Priya N.", action: "Batch renewal workflow" },
      { severity: "warn", title: "RBT shortage detected in Norfolk", dept: "Staffing", owner: "Marcus W.", action: "Activate recruiting sprint" },
      { severity: "warn", title: "1 parent escalation open > 48h", dept: "Parent Comms", owner: "Ezra (you)", action: "Schedule outreach call" },
    ],
    regions: [
      { name: "Richmond", clients: 42, fill: 92, recruit: 84, ops: 90, trend: "up", status: "ok", note: "Top performer this month" },
      { name: "Norfolk", clients: 28, fill: 80, recruit: 60, ops: 72, trend: "down", status: "warn", note: "Pipeline below plan" },
      { name: "Arlington", clients: 18, fill: 90, recruit: 82, ops: 88, trend: "up", status: "ok", note: "Healthy region" },
      { name: "Virginia Beach", clients: 12, fill: 86, recruit: 74, ops: 82, trend: "up", status: "ok", note: "Stable" },
      { name: "Roanoke", clients: 6, fill: 84, recruit: 68, ops: 78, trend: "up", status: "ok", note: "Improving" },
      { name: "Charlottesville", clients: 2, fill: 88, recruit: 76, ops: 84, trend: "up", status: "ok", note: "New site" },
    ],
    staffing: [
      { s: "Richmond", fill: 92, need: 2 },
      { s: "Norfolk", fill: 80, need: 4 },
      { s: "Arlington", fill: 90, need: 2 },
      { s: "Virginia Beach", fill: 86, need: 2 },
      { s: "Roanoke", fill: 84, need: 2 },
    ],
    utilization: [
      { d: "Mon", v: 80 }, { d: "Tue", v: 83 }, { d: "Wed", v: 86 },
      { d: "Thu", v: 85 }, { d: "Fri", v: 89 }, { d: "Sat", v: 76 }, { d: "Sun", v: 70 },
    ],
    cancellation: [
      { d: "W1", v: 6.0 }, { d: "W2", v: 5.6 }, { d: "W3", v: 5.0 },
      { d: "W4", v: 4.6 }, { d: "W5", v: 4.2 }, { d: "W6", v: 4.0 }, { d: "W7", v: 3.8 },
    ],
    leadConv: [{ m: "Mar", v: 44 }, { m: "Apr", v: 48 }, { m: "May", v: 54 }],
    recruitFunnel: [
      { stage: "Applicants", v: 268 }, { stage: "Screened", v: 142 },
      { stage: "Interviewed", v: 78 }, { stage: "Offered", v: 44 }, { stage: "Hired", v: 24 },
    ],
    orientationDept: [
      { dept: "Intake", v: 94 }, { dept: "Sched", v: 90 }, { dept: "RBT", v: 82 },
      { dept: "BCBA", v: 78 }, { dept: "Billing", v: 90 }, { dept: "QA", v: 84 },
    ],
    support: [
      { who: "Marisol Chen", role: "VP State Operations", tone: "os-tone-violet" },
      { who: "Hannah Park", role: "Asst. State Director", tone: "os-tone-sky" },
      { who: "Priya Nair", role: "Auth Ops Lead", tone: "os-tone-amber" },
      { who: "Jacob Thomas", role: "Scheduling Lead", tone: "os-tone-mint" },
    ],
    ai: [
      { kind: "alert", title: "Norfolk recruiting gap", body: "Pipeline 22% below plan — add 5 candidates this week to recover.", cta: "Action plan" },
      { kind: "warn", title: "Auth expirations climbing", body: "8 auths expire in 30 days · 2 inside 7 days.", cta: "Batch renew" },
      { kind: "trend", title: "Richmond intake leading", body: "Conversion 54% — replicate scripts across Norfolk + Roanoke.", cta: "View playbook" },
      { kind: "idea", title: "Arlington capacity headroom", body: "10 client capacity available — coordinate with intake on Northern VA leads.", cta: "Open intake" },
      { kind: "flow", title: "Workflow optimization", body: "Auto-assign Roanoke intake to Richmond pod — saves ~5h/week.", cta: "Apply rule" },
    ],
    activity: [
      { who: "Emily R.", what: "submitted a new lead (Richmond)", when: "5m", kind: "lead" },
      { who: "Jacob T.", what: "resolved Norfolk scheduling conflict", when: "18m", kind: "schedule" },
      { who: "Olivia C.", what: "approved RBT credential · VA", when: "32m", kind: "cred" },
      { who: "Anthem VA", what: "approved auth #A-7720", when: "46m", kind: "auth" },
      { who: "Sarah M.", what: "offer letter signed · Arlington RBT", when: "1h", kind: "offer" },
      { who: "System", what: "client staffed · Virginia Beach", when: "2h", kind: "client" },
      { who: "Marcus W.", what: "completed orientation module", when: "3h", kind: "training" },
    ],
    tasks: [
      { title: "Approve Norfolk recruiting sprint", owner: "Ezra", dept: "Recruiting", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Follow up on BCBA credentialing", owner: "Olivia", dept: "Credentialing", due: "Today", priority: "High", bucket: "Urgent" },
      { title: "Call parent — escalation #VA-87", owner: "Ezra", dept: "Parent Comms", due: "Today", priority: "High", bucket: "Escalations" },
      { title: "Sign off on Roanoke intake auto-assign", owner: "Emily", dept: "Intake", due: "Tomorrow", priority: "Medium", bucket: "Team" },
      { title: "Review recruiting velocity plan", owner: "Sarah", dept: "Recruiting", due: "Fri", priority: "Medium", bucket: "Waiting" },
      { title: "Orientation kickoff — 3 new hires", owner: "HR Ops", dept: "Training", due: "Mon", priority: "Low", bucket: "Team" },
    ],
    meetings: [
      { title: "VA Daily Standup", time: "8:30 – 9:00 AM", tone: "os-tone-sky" },
      { title: "Norfolk Recruiting Sync", time: "10:00 – 10:30", tone: "os-tone-violet" },
      { title: "1:1 — Asst. Director", time: "1:00 – 1:30 PM", tone: "os-tone-rose" },
      { title: "Parent Escalation Call", time: "3:30 – 4:00 PM", tone: "os-tone-amber" },
    ],
    approvals: [
      { what: "Recruiting offer · BCBA · Richmond", who: "Sarah M.", due: "Today" },
      { what: "Coverage swap · Norfolk pod", who: "Jacob T.", due: "Today" },
      { what: "Credentialing submission · 1 RBT", who: "Olivia C.", due: "Tomorrow" },
    ],
    training: [
      { name: "Scheduling Team", pct: 91 },
      { name: "Intake Team", pct: 88 },
      { name: "VA RBT Onboarding", pct: 84 },
      { name: "VA BCBA Documentation", pct: 74 },
    ],
    highlights: { topRegion: "Richmond", newHires: 5, parentSat: "4.8 / 5", engagement: "90%", outcomes: "+12%" },
  },
};

export function getStateData(code: OSState): StateOpsData {
  return STATE_DATA[code] ?? STATE_DATA.NC!;
}
