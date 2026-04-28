import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, Building2, CheckCircle2, Clock, Download, Eye, Home, MapPin,
  MessageSquare, Navigation, Phone, RefreshCw, Route, Search, Send, ShieldCheck, Sparkles, UserCheck, UserPlus, Users, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type StateCode = "GA" | "NC" | "TN" | "VA" | "MD";
type LocationType = "Clinic" | "Home" | "Hybrid";
type StaffingStatus = "Staffing Needed" | "Matching in Progress" | "Offer / Confirmation Pending" | "RBT Assigned" | "Restaffing Needed" | "No Match Available" | "Ready for Scheduling";
type Urgency = "Routine" | "Elevated" | "High" | "Critical";
type Health = "green" | "yellow" | "red";
type QueueKey = "urgent" | "today" | "capacity";
type KpiKey = "all" | "needed" | "restaffing" | "matching" | "assigned" | "avg" | "available" | "gap" | "urgent";

type Task = { id: string; title: string; owner: string; dueDate: string; completed: boolean };
type Note = { id: string; type: "RBT outreach" | "Family" | "Internal"; text: string; timestamp: string; user: string };
type TimelineEvent = { id: string; title: string; text: string; timestamp: string; user: string };
type MatchBreakdown = { region: number; availability: number; compliance: number; capacity: number; experience: number; urgency: number; penalty: number };
type MatchDecision = {
  id: string; rbtId: string; rbtName: string; decision: "Selected" | "Rejected"; score: number; breakdown: MatchBreakdown;
  reasons: string[]; weights: Pick<MatchBreakdown, "region" | "availability" | "compliance" | "capacity">; decidedAt: string; decidedBy: string; note: string;
};
type Rbt = {
  id: string; name: string; state: StateCode; region: string; clinic: string; location: string; radius: number; availability: string[];
  currentHours: number; maxHours: number; assignedClients: string[]; experience: string[]; compliance: "Ready" | "Expiring" | "Incomplete"; onboarding: "Active" | "Clearing" | "Offer Accepted";
};
type StaffingRecord = {
  id: string; client: string; parent: string; state: StateCode; region: string; clinic: string; location: LocationType; bcba: string; owner: string;
  status: StaffingStatus; requiredHours: number; approvedHours: number; availability: string[]; priority: Urgency; daysWaiting: number;
  assignedRbtId?: string; rejectedRbtIds: string[]; clinicalNotes: string; startUrgency: string; nextAction: string; blockers: string[];
  authStatus: "Approved" | "Reauth pending" | "Pending start"; tasks: Task[]; notes: Note[]; timeline: TimelineEvent[]; decisionHistory: MatchDecision[];
};
type Match = { rbt: Rbt; score: number; overlap: number; distanceFit: number; capacityFit: number; ready: boolean; reasons: string[]; breakdown: MatchBreakdown };
type MapPoint = { x: number; y: number };
type MapZoom = "regional" | "local" | "street";
type MapFilters = { unassignedOnly: boolean; readyRbtsOnly: boolean; urgentLocalOnly: boolean };
type ClientCluster = { id: string; x: number; y: number; records: StaffingRecord[]; best?: Match; route?: ReturnType<typeof routeStats> };
type RbtCluster = { id: string; x: number; y: number; rbts: Rbt[]; best: Match; route: ReturnType<typeof routeStats> };

const ALL = "All";
const STAFFING_RECORDS_KEY = "blossom.staffing.records.v1";
const STAFFING_RBTS_KEY = "blossom.staffing.rbts.v1";
const STAFFING_MAP_STATE_KEY = "blossom.staffing.map-state.v1";
const auditWeights = { region: 18, availability: 35, compliance: 14, capacity: 25 };
const today = new Date("2026-04-27T12:00:00Z");
const states: StateCode[] = ["GA", "NC", "TN", "VA", "MD"];
const statuses: StaffingStatus[] = ["Staffing Needed", "Matching in Progress", "Offer / Confirmation Pending", "RBT Assigned", "Restaffing Needed", "No Match Available", "Ready for Scheduling"];
const owners = ["Nina Patel", "Jordan Miles", "Avery Brooks", "Sam Rivera", "Taylor Quinn"];
const bcbas = ["Dr. Kim", "Dr. Patel", "Dr. Lee", "Dr. Stone", "Dr. Hayes"];
const shortDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const pct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const availableHours = (rbt: Rbt) => Math.max(0, rbt.maxHours - rbt.currentHours);
const stageHealth = (count: number, oldest: number) => count === 0 ? "green" : oldest > 7 ? "red" : oldest > 3 ? "yellow" : "green";
const clamp = (value: number, min = 7, max = 93) => Math.max(min, Math.min(max, value));

const rbtSeed: Rbt[] = [
  { id: "RBT-101", name: "Taylor S.", state: "GA", region: "Atlanta Metro", clinic: "Peachtree Corners", location: "Norcross", radius: 18, availability: ["Mon AM", "Tue AM", "Wed AM", "Thu AM", "Fri AM"], currentHours: 27, maxHours: 32, assignedClients: ["Emma Thompson"], experience: ["Early intervention", "Clinic"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-102", name: "Quinn D.", state: "GA", region: "Atlanta South", clinic: "Riverdale", location: "Riverdale", radius: 22, availability: ["Mon PM", "Wed PM", "Fri PM", "Sat AM"], currentHours: 18, maxHours: 35, assignedClients: ["Liam Carter"], experience: ["Home", "Feeding"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-103", name: "Maya Chen", state: "GA", region: "Atlanta Metro", clinic: "Peachtree Corners", location: "Duluth", radius: 15, availability: ["Tue PM", "Thu PM", "Sat AM"], currentHours: 10, maxHours: 28, assignedClients: [], experience: ["Severe behavior", "Mand training"], compliance: "Expiring", onboarding: "Active" },
  { id: "RBT-104", name: "Andre Hill", state: "GA", region: "Atlanta South", clinic: "Riverdale", location: "Jonesboro", radius: 20, availability: ["Mon AM", "Wed AM", "Fri AM"], currentHours: 34, maxHours: 35, assignedClients: ["Noah Bell", "Ivy Clark"], experience: ["Clinic", "School readiness"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-105", name: "Riley Brooks", state: "NC", region: "Charlotte", clinic: "Charlotte Midtown", location: "Charlotte", radius: 16, availability: ["Tue PM", "Thu PM", "Sat AM"], currentHours: 14, maxHours: 30, assignedClients: [], experience: ["Home", "NET"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-106", name: "Devon H.", state: "NC", region: "Raleigh", clinic: "Raleigh Cary", location: "Cary", radius: 18, availability: ["Mon AM", "Tue AM", "Wed AM", "Thu AM", "Fri AM"], currentHours: 29, maxHours: 32, assignedClients: ["Olivia Singh"], experience: ["Clinic", "School-day"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-107", name: "Jules Carter", state: "NC", region: "Charlotte", clinic: "Charlotte Midtown", location: "Matthews", radius: 14, availability: ["Mon PM", "Wed PM", "Fri PM"], currentHours: 7, maxHours: 25, assignedClients: [], experience: ["Parent training support"], compliance: "Incomplete", onboarding: "Clearing" },
  { id: "RBT-108", name: "Morgan K.", state: "TN", region: "Nashville", clinic: "Nashville East", location: "Hermitage", radius: 20, availability: ["Mon PM", "Wed PM", "Fri PM"], currentHours: 22, maxHours: 32, assignedClients: ["Harper Allen"], experience: ["Home", "Language"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-109", name: "Parker J.", state: "TN", region: "Memphis", clinic: "Memphis Central", location: "Memphis", radius: 18, availability: ["Mon AM", "Fri AM", "Sat AM"], currentHours: 8, maxHours: 24, assignedClients: [], experience: ["Clinic", "First starts"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-110", name: "Sienna Ray", state: "TN", region: "Nashville", clinic: "Nashville East", location: "Madison", radius: 12, availability: ["Tue AM", "Thu AM"], currentHours: 20, maxHours: 20, assignedClients: ["Caleb West"], experience: ["Clinic"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-111", name: "Casey P.", state: "VA", region: "Richmond", clinic: "Richmond West", location: "Short Pump", radius: 15, availability: ["Mon AM", "Wed AM", "Fri AM"], currentHours: 16, maxHours: 30, assignedClients: [], experience: ["Clinic", "Transition plans"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-112", name: "Alex M.", state: "VA", region: "Norfolk", clinic: "Norfolk Harbor", location: "Norfolk", radius: 20, availability: ["Mon PM", "Wed PM", "Fri PM"], currentHours: 23, maxHours: 30, assignedClients: ["Mia Johnson"], experience: ["Home", "Older learners"], compliance: "Expiring", onboarding: "Active" },
  { id: "RBT-113", name: "Priya Nair", state: "VA", region: "Richmond", clinic: "Richmond West", location: "Midlothian", radius: 18, availability: ["Tue PM", "Thu PM", "Weekend AM"], currentHours: 5, maxHours: 24, assignedClients: [], experience: ["Clinic", "Toilet training"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-114", name: "Jamie N.", state: "MD", region: "Bethesda", clinic: "Bethesda North", location: "Bethesda", radius: 14, availability: ["Mon PM", "Wed PM", "Thu PM"], currentHours: 19, maxHours: 30, assignedClients: [], experience: ["Home", "Early intervention"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-115", name: "Chris L.", state: "MD", region: "Baltimore", clinic: "Baltimore Harbor", location: "Baltimore", radius: 22, availability: ["Tue AM", "Thu AM", "Sat AM"], currentHours: 18, maxHours: 28, assignedClients: ["Jackson Reed"], experience: ["Hybrid", "Community"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-116", name: "Noelle Price", state: "MD", region: "Bethesda", clinic: "Bethesda North", location: "Rockville", radius: 12, availability: ["Tue PM", "Thu PM"], currentHours: 0, maxHours: 20, assignedClients: [], experience: ["New hire", "Shadow complete"], compliance: "Incomplete", onboarding: "Offer Accepted" },
  { id: "RBT-117", name: "Eli Morgan", state: "GA", region: "Atlanta Metro", clinic: "Peachtree Corners", location: "Suwanee", radius: 18, availability: ["Mon PM", "Tue PM", "Wed PM", "Thu PM"], currentHours: 12, maxHours: 30, assignedClients: [], experience: ["Home", "Clinic"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-118", name: "Tessa Green", state: "NC", region: "Raleigh", clinic: "Raleigh Cary", location: "Apex", radius: 16, availability: ["Weekend AM", "Tue PM", "Thu PM"], currentHours: 6, maxHours: 22, assignedClients: [], experience: ["Weekend coverage"], compliance: "Ready", onboarding: "Active" },
  { id: "RBT-119", name: "Owen Blake", state: "TN", region: "Memphis", clinic: "Memphis Central", location: "Germantown", radius: 10, availability: ["Tue PM", "Thu PM"], currentHours: 21, maxHours: 24, assignedClients: ["Ethan Moore"], experience: ["Clinic"], compliance: "Incomplete", onboarding: "Active" },
  { id: "RBT-120", name: "Grace Turner", state: "VA", region: "Norfolk", clinic: "Norfolk Harbor", location: "Virginia Beach", radius: 18, availability: ["Mon AM", "Wed AM", "Fri AM", "Sat AM"], currentHours: 11, maxHours: 26, assignedClients: [], experience: ["Home", "Safety care"], compliance: "Ready", onboarding: "Active" },
];

function baseTimeline(id: string, owner: string, status: StaffingStatus, client: string): TimelineEvent[] {
  return [
    { id: `${id}-e1`, title: "Treatment auth approved", text: `${client} cleared for staffing handoff.`, timestamp: "2026-04-22T10:00:00Z", user: "Authorizations" },
    { id: `${id}-e2`, title: "Staffing needed", text: `Staffing owner ${owner} assigned.`, timestamp: "2026-04-23T09:00:00Z", user: "Pipeline" },
    ...(status !== "Staffing Needed" ? [{ id: `${id}-e3`, title: "Matching started", text: "Matching engine reviewed RBT availability and capacity.", timestamp: "2026-04-24T13:00:00Z", user: owner }] : []),
    ...(status === "RBT Assigned" || status === "Ready for Scheduling" ? [{ id: `${id}-e4`, title: "RBT assigned", text: "RBT assignment confirmed and handed to scheduling.", timestamp: "2026-04-26T15:00:00Z", user: owner }] : []),
  ];
}

function makeRecord(base: Omit<StaffingRecord, "tasks" | "notes" | "timeline" | "rejectedRbtIds" | "decisionHistory"> & { rejectedRbtIds?: string[]; decisionHistory?: MatchDecision[] }): StaffingRecord {
  return {
    ...base,
    rejectedRbtIds: base.rejectedRbtIds ?? [],
    tasks: [
      { id: `${base.id}-t1`, title: base.nextAction, owner: base.owner, dueDate: "2026-04-28", completed: false },
      { id: `${base.id}-t2`, title: "Confirm BCBA clinical fit", owner: base.bcba, dueDate: "2026-04-29", completed: base.status === "RBT Assigned" || base.status === "Ready for Scheduling" },
      { id: `${base.id}-t3`, title: "Document family availability", owner: base.owner, dueDate: "2026-04-30", completed: base.availability.length > 1 },
    ],
    notes: [
      { id: `${base.id}-n1`, type: "Family", text: `Family availability: ${base.availability.join(", ")}.`, timestamp: "2026-04-24T10:00:00Z", user: base.owner },
      { id: `${base.id}-n2`, type: "Internal", text: base.clinicalNotes, timestamp: "2026-04-25T12:30:00Z", user: base.bcba },
      { id: `${base.id}-n3`, type: "RBT outreach", text: base.assignedRbtId ? "Assigned RBT accepted match." : "Outreach pending from staffing queue.", timestamp: "2026-04-26T14:00:00Z", user: base.owner },
    ],
    timeline: baseTimeline(base.id, base.owner, base.status, base.client),
    decisionHistory: base.decisionHistory ?? [],
  };
}

const staffingSeed: StaffingRecord[] = [
  makeRecord({ id: "STF-5101", client: "Emma Thompson", parent: "Janelle Thompson", state: "GA", region: "Atlanta Metro", clinic: "Peachtree Corners", location: "Clinic", bcba: "Dr. Kim", owner: "Nina Patel", status: "Ready for Scheduling", requiredHours: 25, approvedHours: 25, availability: ["Mon AM", "Wed AM", "Fri AM"], priority: "High", daysWaiting: 2, assignedRbtId: "RBT-101", authStatus: "Approved", clinicalNotes: "Strong clinic fit; maintain predictable transitions.", startUrgency: "Start this week", nextAction: "Send to scheduling", blockers: [] }),
  makeRecord({ id: "STF-5102", client: "Mason Lee", parent: "Angela Lee", state: "NC", region: "Charlotte", clinic: "Charlotte Midtown", location: "Home", bcba: "Dr. Patel", owner: "Jordan Miles", status: "Staffing Needed", requiredHours: 20, approvedHours: 20, availability: ["Tue PM", "Thu PM", "Sat AM"], priority: "High", daysWaiting: 5, authStatus: "Approved", clinicalNotes: "Home case; needs RBT comfortable with parent coaching.", startUrgency: "Needs start date in 5 days", nextAction: "Open match and contact top RBT", blockers: ["No assignment yet"] }),
  makeRecord({ id: "STF-5103", client: "Ava Brooks", parent: "Michael Brooks", state: "TN", region: "Nashville", clinic: "Nashville East", location: "Hybrid", bcba: "Dr. Lee", owner: "Avery Brooks", status: "Matching in Progress", requiredHours: 30, approvedHours: 30, availability: ["Mon PM", "Wed PM", "Fri PM"], priority: "Critical", daysWaiting: 8, authStatus: "Approved", clinicalNotes: "High-priority hybrid case; needs strong safety-care background.", startUrgency: "Past internal SLA", nextAction: "Escalate partial match coverage", blockers: ["Only partial availability", "Urgent start"] }),
  makeRecord({ id: "STF-5104", client: "Noah Rivera", parent: "Camila Rivera", state: "VA", region: "Richmond", clinic: "Richmond West", location: "Clinic", bcba: "Dr. Stone", owner: "Sam Rivera", status: "Restaffing Needed", requiredHours: 15, approvedHours: 15, availability: ["Mon AM", "Wed AM", "Fri AM"], priority: "Critical", daysWaiting: 9, assignedRbtId: "RBT-104", authStatus: "Approved", clinicalNotes: "Prior RBT resigned; avoid service gap this week.", startUrgency: "Immediate restaff", nextAction: "Escalate restaff and assign replacement", blockers: ["Restaffing urgent", "Current RBT unavailable"] }),
  makeRecord({ id: "STF-5105", client: "Sophia Grant", parent: "Erin Grant", state: "MD", region: "Bethesda", clinic: "Bethesda North", location: "Home", bcba: "Dr. Kim", owner: "Taylor Quinn", status: "Offer / Confirmation Pending", requiredHours: 25, approvedHours: 25, availability: ["Mon PM", "Wed PM", "Thu PM"], priority: "Elevated", daysWaiting: 4, authStatus: "Approved", clinicalNotes: "Home-based early learner; preference for RBT within 20 minutes.", startUrgency: "Start next week", nextAction: "Confirm Jamie accepts 18/25 hours", blockers: ["Partial hours only"] }),
  makeRecord({ id: "STF-5106", client: "Liam Carter", parent: "Paige Carter", state: "GA", region: "Atlanta South", clinic: "Riverdale", location: "Home", bcba: "Dr. Lee", owner: "Nina Patel", status: "RBT Assigned", requiredHours: 20, approvedHours: 20, availability: ["Mon PM", "Wed PM", "Fri PM"], priority: "Routine", daysWaiting: 3, assignedRbtId: "RBT-102", authStatus: "Approved", clinicalNotes: "Home case with consistent caregiver availability.", startUrgency: "Ready for schedule build", nextAction: "Confirm scheduling handoff", blockers: [] }),
  makeRecord({ id: "STF-5107", client: "Olivia Singh", parent: "Ravi Singh", state: "NC", region: "Raleigh", clinic: "Raleigh Cary", location: "Clinic", bcba: "Dr. Patel", owner: "Jordan Miles", status: "RBT Assigned", requiredHours: 28, approvedHours: 28, availability: ["Mon AM", "Tue AM", "Wed AM", "Thu AM", "Fri AM"], priority: "Routine", daysWaiting: 1, assignedRbtId: "RBT-106", authStatus: "Approved", clinicalNotes: "School-day clinic schedule; current match is at capacity.", startUrgency: "Start active", nextAction: "Monitor capacity", blockers: ["RBT near max hours"] }),
  makeRecord({ id: "STF-5108", client: "Ethan Moore", parent: "Laura Moore", state: "TN", region: "Memphis", clinic: "Memphis Central", location: "Clinic", bcba: "Dr. Hayes", owner: "Avery Brooks", status: "No Match Available", requiredHours: 10, approvedHours: 10, availability: ["Tue PM", "Thu PM"], priority: "High", daysWaiting: 6, authStatus: "Approved", clinicalNotes: "Clinic case but local RBT compliance is incomplete.", startUrgency: "Needs coverage before Friday", nextAction: "Request recruiting backup coverage", blockers: ["No compliant RBT available", "Region capacity gap"] }),
  makeRecord({ id: "STF-5109", client: "Mia Johnson", parent: "Terrell Johnson", state: "VA", region: "Norfolk", clinic: "Norfolk Harbor", location: "Home", bcba: "Dr. Stone", owner: "Sam Rivera", status: "Matching in Progress", requiredHours: 22, approvedHours: 22, availability: ["Mon PM", "Wed PM", "Fri PM"], priority: "Elevated", daysWaiting: 7, authStatus: "Approved", clinicalNotes: "Older learner; needs RBT comfortable with community goals.", startUrgency: "Start in 7 days", nextAction: "Contact Grace and Alex for split coverage", blockers: ["RBT compliance expiring"] }),
  makeRecord({ id: "STF-5110", client: "Jackson Reed", parent: "Nora Reed", state: "MD", region: "Baltimore", clinic: "Baltimore Harbor", location: "Hybrid", bcba: "Dr. Kim", owner: "Taylor Quinn", status: "Ready for Scheduling", requiredHours: 18, approvedHours: 18, availability: ["Tue AM", "Thu AM", "Sat AM"], priority: "Routine", daysWaiting: 2, assignedRbtId: "RBT-115", authStatus: "Approved", clinicalNotes: "Hybrid location accepted by family and RBT.", startUrgency: "Start this week", nextAction: "Move to scheduling", blockers: [] }),
  makeRecord({ id: "STF-5111", client: "Isabella Wilson", parent: "Carla Wilson", state: "GA", region: "Atlanta Metro", clinic: "Peachtree Corners", location: "Clinic", bcba: "Dr. Lee", owner: "Nina Patel", status: "Matching in Progress", requiredHours: 30, approvedHours: 30, availability: ["Mon AM", "Wed AM", "Fri AM"], priority: "High", daysWaiting: 4, authStatus: "Approved", clinicalNotes: "Clinic learner; morning availability conflicts with current supply.", startUrgency: "Start next week", nextAction: "Resolve RBT availability conflict", blockers: ["Availability conflict", "Capacity gap"] }),
  makeRecord({ id: "STF-5112", client: "Lucas Martin", parent: "Henry Martin", state: "NC", region: "Charlotte", clinic: "Charlotte Midtown", location: "Home", bcba: "Dr. Patel", owner: "Jordan Miles", status: "Restaffing Needed", requiredHours: 16, approvedHours: 16, availability: ["Tue PM", "Thu PM"], priority: "Critical", daysWaiting: 10, authStatus: "Approved", clinicalNotes: "Restaffing required after family requested reassignment.", startUrgency: "Service gap active", nextAction: "Escalate and assign Riley if available", blockers: ["Restaffing urgent", "Family requested change"] }),
  makeRecord({ id: "STF-5113", client: "Harper Allen", parent: "Monica Allen", state: "TN", region: "Nashville", clinic: "Nashville East", location: "Home", bcba: "Dr. Hayes", owner: "Avery Brooks", status: "Offer / Confirmation Pending", requiredHours: 24, approvedHours: 24, availability: ["Mon PM", "Wed PM", "Fri PM"], priority: "Elevated", daysWaiting: 5, assignedRbtId: "RBT-108", authStatus: "Approved", clinicalNotes: "Awaiting written acceptance from RBT.", startUrgency: "Start next week", nextAction: "Confirm RBT acceptance", blockers: ["Confirmation pending"] }),
  makeRecord({ id: "STF-5114", client: "Benjamin Hall", parent: "Tara Hall", state: "VA", region: "Richmond", clinic: "Richmond West", location: "Clinic", bcba: "Dr. Stone", owner: "Sam Rivera", status: "Staffing Needed", requiredHours: 12, approvedHours: 12, availability: ["Weekend AM"], priority: "Elevated", daysWaiting: 2, authStatus: "Approved", clinicalNotes: "Weekend clinic availability only.", startUrgency: "Start in 10 days", nextAction: "Match weekend-ready RBT", blockers: ["Limited availability"] }),
  makeRecord({ id: "STF-5115", client: "Amelia Torres", parent: "Rosa Torres", state: "MD", region: "Bethesda", clinic: "Bethesda North", location: "Home", bcba: "Dr. Kim", owner: "Taylor Quinn", status: "Staffing Needed", requiredHours: 20, approvedHours: 20, availability: ["Tue PM", "Thu PM"], priority: "High", daysWaiting: 7, authStatus: "Reauth pending", clinicalNotes: "Bilingual family preference; can start after reauth confirmation.", startUrgency: "Reauth blocks start", nextAction: "Hold match and confirm auth", blockers: ["Reauth pending", "Limited RBT supply"] }),
  makeRecord({ id: "STF-5116", client: "Henry Park", parent: "Min Park", state: "GA", region: "Atlanta Metro", clinic: "Peachtree Corners", location: "Hybrid", bcba: "Dr. Kim", owner: "Nina Patel", status: "No Match Available", requiredHours: 18, approvedHours: 18, availability: ["Tue AM", "Thu AM"], priority: "Critical", daysWaiting: 11, authStatus: "Approved", clinicalNotes: "High-intensity morning case; no ready RBT with enough AM capacity.", startUrgency: "Critical wait", nextAction: "Escalate to recruiting and leadership", blockers: ["No RBT match available", "Region capacity gap", "High-priority no match"] }),
];

function scoreMatch(record: StaffingRecord, rbt: Rbt): Match {
  const overlap = record.availability.filter((slot) => rbt.availability.includes(slot)).length;
  const overlapScore = Math.min(35, overlap * 14);
  const capacity = availableHours(rbt);
  const capacityFit = capacity >= record.requiredHours ? 25 : Math.round((capacity / record.requiredHours) * 20);
  const distanceFit = rbt.state === record.state ? (rbt.clinic === record.clinic ? 18 : rbt.region === record.region ? 14 : 8) : 0;
  const readyScore = rbt.compliance === "Ready" && rbt.onboarding === "Active" ? 14 : rbt.compliance === "Expiring" ? 7 : 0;
  const experienceScore = rbt.experience.some((skill) => skill === record.location || record.clinicalNotes.toLowerCase().includes(skill.toLowerCase())) ? 8 : 4;
  const urgencyScore = record.priority === "Critical" ? 5 : record.priority === "High" ? 4 : 2;
  const penalty = record.rejectedRbtIds.includes(rbt.id) ? 20 : 0;
  const score = Math.max(0, Math.min(99, distanceFit + overlapScore + capacityFit + readyScore + experienceScore + urgencyScore - penalty));
  return {
    rbt, score, overlap, distanceFit, capacityFit, ready: rbt.compliance === "Ready" && rbt.onboarding === "Active",
    reasons: [rbt.clinic === record.clinic ? "Clinic fit" : rbt.region === record.region ? "Region fit" : "State backup", `${overlap} overlap slots`, `${capacity}h capacity`, rbt.compliance],
    breakdown: { region: distanceFit, availability: overlapScore, compliance: readyScore, capacity: capacityFit, experience: experienceScore, urgency: urgencyScore, penalty },
  };
}

function HealthDot({ health }: { health: Health }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full", health === "green" && "bg-success", health === "yellow" && "bg-warning", health === "red" && "bg-destructive")} />;
}
function StatusPill({ children, tone = "muted" }: { children: string; tone?: "success" | "warning" | "destructive" | "primary" | "muted" }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", tone === "success" && "border-success/30 bg-success/10 text-success", tone === "warning" && "border-warning/30 bg-warning/10 text-warning", tone === "destructive" && "border-destructive/30 bg-destructive/10 text-destructive", tone === "primary" && "border-primary/30 bg-primary/10 text-primary", tone === "muted" && "border-border bg-muted text-muted-foreground")}>{children}</span>;
}
function urgencyTone(urgency: Urgency) { return urgency === "Critical" ? "destructive" : urgency === "High" ? "warning" : urgency === "Elevated" ? "primary" : "muted"; }
function statusTone(status: StaffingStatus) { return status === "RBT Assigned" || status === "Ready for Scheduling" ? "success" : status === "Restaffing Needed" || status === "No Match Available" ? "destructive" : status === "Matching in Progress" || status === "Offer / Confirmation Pending" ? "warning" : "primary"; }
function alertsFor(record: StaffingRecord, matches: Match[], assigned?: Rbt) {
  const alerts: { label: string; severity: "red" | "yellow" }[] = [];
  if (record.daysWaiting > 7) alerts.push({ label: "Waiting over 7 days", severity: "red" });
  else if (record.daysWaiting > 3) alerts.push({ label: "Waiting over 3 days", severity: "yellow" });
  if (record.status === "Restaffing Needed") alerts.push({ label: "Restaffing urgent", severity: "red" });
  if (!matches.some((m) => m.score >= 70 && m.ready)) alerts.push({ label: "No ready RBT match", severity: "red" });
  if (assigned && availableHours(assigned) <= 2) alerts.push({ label: "RBT near capacity", severity: "yellow" });
  if (assigned && assigned.compliance !== "Ready") alerts.push({ label: "Compliance incomplete", severity: "red" });
  if (matches[0]?.overlap === 0) alerts.push({ label: "Availability conflict", severity: "red" });
  if (!record.owner) alerts.push({ label: "Owner missing", severity: "red" });
  if (!record.assignedRbtId && ["Critical", "High"].includes(record.priority)) alerts.push({ label: "Ready but not assigned", severity: "yellow" });
  if (record.blockers.some((b) => b.toLowerCase().includes("capacity gap"))) alerts.push({ label: "Region capacity gap", severity: "red" });
  return alerts;
}

function decisionEntry(match: Match, decision: MatchDecision["decision"], note: string): MatchDecision {
  return {
    id: `${match.rbt.id}-${Date.now()}`,
    rbtId: match.rbt.id,
    rbtName: match.rbt.name,
    decision,
    score: match.score,
    breakdown: match.breakdown,
    reasons: match.reasons,
    weights: auditWeights,
    decidedAt: today.toISOString(),
    decidedBy: "Dashboard user",
    note,
  };
}

function hydrateRecords(records: StaffingRecord[]) {
  return records.map((record) => ({ ...record, decisionHistory: record.decisionHistory ?? [] }));
}

function storedMapState() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(STAFFING_MAP_STATE_KEY) ?? "null") as null | Record<string, string | MapFilters>; } catch { return null; }
}

const regionAnchors: Record<string, MapPoint> = {
  "Atlanta Metro": { x: 28, y: 68 }, "Atlanta South": { x: 24, y: 77 }, Charlotte: { x: 45, y: 51 }, Raleigh: { x: 57, y: 48 }, Nashville: { x: 36, y: 38 }, Memphis: { x: 18, y: 43 }, Richmond: { x: 67, y: 32 }, Norfolk: { x: 78, y: 40 }, Bethesda: { x: 69, y: 20 }, Baltimore: { x: 76, y: 17 },
};

function pointFor(seed: string, region: string, kind: "client" | "rbt"): MapPoint {
  const anchor = regionAnchors[region] ?? { x: 50, y: 50 };
  const hash = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const spread = kind === "client" ? 5 : 9;
  return { x: clamp(anchor.x + ((hash % 11) - 5) * 0.8 + (kind === "client" ? 1.8 : -1.2), 5, 95), y: clamp(anchor.y + (((hash / 7) % 11) - 5) * spread * 0.16, 5, 95) };
}

function routeStats(client: StaffingRecord, rbt: Rbt) {
  const clientPoint = pointFor(client.id, client.region, "client");
  const rbtPoint = pointFor(rbt.id, rbt.region, "rbt");
  const direct = Math.hypot(clientPoint.x - rbtPoint.x, clientPoint.y - rbtPoint.y);
  const sameClinic = client.clinic === rbt.clinic;
  const sameRegion = client.region === rbt.region;
  const miles = Math.max(2, Math.round(direct * (sameClinic ? 0.42 : sameRegion ? 0.62 : 1.05) + (client.location === "Home" ? 3 : 1)));
  const minutes = Math.round(miles * (sameClinic ? 2.4 : sameRegion ? 2.8 : 3.2) + (client.priority === "Critical" ? 4 : 0));
  return { clientPoint, rbtPoint, miles, minutes, withinRadius: miles <= rbt.radius };
}

function clusterItems<T>(items: T[], pointForItem: (item: T) => MapPoint, bucketSize: number) {
  const groups = new Map<string, { x: number; y: number; items: T[] }>();
  items.forEach((item) => {
    const point = pointForItem(item);
    const key = `${Math.floor(point.x / bucketSize)}-${Math.floor(point.y / bucketSize)}`;
    const group = groups.get(key);
    if (group) {
      group.x += point.x;
      group.y += point.y;
      group.items.push(item);
    } else {
      groups.set(key, { x: point.x, y: point.y, items: [item] });
    }
  });
  return Array.from(groups.entries()).map(([id, group]) => ({ id, x: group.x / group.items.length, y: group.y / group.items.length, items: group.items }));
}

function StaffingMap({ records, rbts, selected, activeMatch, mapFocus, mapZoom, mapFilters, routeRefreshCount, setMapFocus, setMapZoom, setMapFilters, onRefreshRoutes, onSelectRecord, onSelectRbt, onAssign }: { records: StaffingRecord[]; rbts: Rbt[]; selected: StaffingRecord; activeMatch?: Match; mapFocus: "all" | "ready" | "urgent"; mapZoom: MapZoom; mapFilters: MapFilters; routeRefreshCount: number; setMapFocus: (focus: "all" | "ready" | "urgent") => void; setMapZoom: (zoom: MapZoom) => void; setMapFilters: (filters: MapFilters) => void; onRefreshRoutes: () => void; onSelectRecord: (record: StaffingRecord, match?: Match) => void; onSelectRbt: (id: string) => void; onAssign: (record: StaffingRecord, rbt: Rbt) => void }) {
  const mapMatches = rbts
    .map((rbt) => ({ match: scoreMatch(selected, rbt), route: routeStats(selected, rbt) }))
    .filter((item) => item.match.rbt.state === selected.state)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 6);
  const selectedRoute = activeMatch ? routeStats(selected, activeMatch.rbt) : mapMatches[0]?.route;
  const shouldCluster = mapZoom !== "street" && (records.length > 45 || rbts.length > 35);
  const bucketSize = mapZoom === "regional" ? 12 : 7;
  const clientClusters = useMemo<ClientCluster[]>(() => clusterItems(records, (record) => pointFor(record.id, record.region, "client"), bucketSize).map((cluster) => {
    const lead = cluster.items.sort((a, b) => b.daysWaiting - a.daysWaiting)[0];
    const best = rbts.map((rbt) => scoreMatch(lead, rbt)).filter((match) => match.rbt.state === lead.state).sort((a, b) => b.score - a.score)[0];
    return { id: cluster.id, x: cluster.x, y: cluster.y, records: cluster.items, best, route: best ? routeStats(lead, best.rbt) : undefined };
  }), [records, rbts, bucketSize, routeRefreshCount]);
  const rbtClusters = useMemo<RbtCluster[]>(() => clusterItems(rbts, (rbt) => pointFor(rbt.id, rbt.region, "rbt"), bucketSize).map((cluster) => {
    const scored = cluster.items.map((rbt) => scoreMatch(selected, rbt)).sort((a, b) => b.score - a.score);
    const best = scored[0];
    return { id: cluster.id, x: cluster.x, y: cluster.y, rbts: cluster.items, best, route: routeStats(selected, best.rbt) };
  }), [rbts, selected, bucketSize, routeRefreshCount]);
  const breakdownRows = (breakdown: MatchBreakdown) => [
    ["Region", breakdown.region],
    ["Availability", breakdown.availability],
    ["Compliance", breakdown.compliance],
    ["Capacity", breakdown.capacity],
  ] as const;
  const MarkerTooltip = ({ title, route, match }: { title: string; route: ReturnType<typeof routeStats>; match: Match }) => (
    <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-left text-popover-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[11px]">
        <div className="rounded-md bg-muted/50 p-1.5"><p className="font-semibold">{route.minutes}m</p><p className="text-muted-foreground">drive</p></div>
        <div className="rounded-md bg-muted/50 p-1.5"><p className="font-semibold">{route.miles} mi</p><p className="text-muted-foreground">distance</p></div>
        <div className="rounded-md bg-muted/50 p-1.5"><p className="font-semibold">{match.score}</p><p className="text-muted-foreground">score</p></div>
      </div>
      <div className="mt-2 space-y-1">
        {breakdownRows(match.breakdown).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{route.withinRadius ? "Within service radius" : "Travel exception may be needed"}</p>
    </div>
  );
  const toggleMapFilter = (key: keyof MapFilters) => setMapFilters({ ...mapFilters, [key]: !mapFilters[key] });

  return (
    <section className="mt-6 overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" />Interactive Staffing Map</h2>
          <p className="text-xs text-muted-foreground">Live RBT and client geography with estimated route time, coverage radius, and assignment shortcuts.</p>
        </div>
        <div className="flex flex-wrap gap-2"><div className="flex rounded-md border bg-muted/40 p-1">
          {(["ready", "urgent", "all"] as const).map((focus) => (
            <button key={focus} onClick={() => setMapFocus(focus)} className={cn("rounded px-3 py-1.5 text-xs font-medium capitalize", mapFocus === focus ? "bg-card shadow-sm" : "text-muted-foreground")}>{focus}</button>
          ))}
        </div><div className="flex rounded-md border bg-muted/40 p-1">{(["regional", "local", "street"] as const).map((zoom) => <button key={zoom} onClick={() => setMapZoom(zoom)} className={cn("rounded px-3 py-1.5 text-xs font-medium capitalize", mapZoom === zoom ? "bg-card shadow-sm" : "text-muted-foreground")}>{zoom}</button>)}</div></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <span className="text-xs font-medium text-muted-foreground">Map filters</span>
        <Button size="sm" variant={mapFilters.unassignedOnly ? "default" : "outline"} onClick={() => toggleMapFilter("unassignedOnly")}>Clients without assignments</Button>
        <Button size="sm" variant={mapFilters.readyRbtsOnly ? "default" : "outline"} onClick={() => toggleMapFilter("readyRbtsOnly")}>Ready RBTs only</Button>
        <Button size="sm" variant={mapFilters.urgentLocalOnly ? "default" : "outline"} onClick={() => toggleMapFilter("urgentLocalOnly")}>Urgent in my state/region</Button>
        {(mapFilters.unassignedOnly || mapFilters.readyRbtsOnly || mapFilters.urgentLocalOnly) && <Button size="sm" variant="outline" onClick={() => setMapFilters({ unassignedOnly: false, readyRbtsOnly: false, urgentLocalOnly: false })}>Clear</Button>}
      </div>
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative min-h-[560px] overflow-hidden bg-muted/20">
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(hsl(var(--border) / 0.45) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.45) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_70%,hsl(var(--primary)/0.12),transparent_26%),radial-gradient(circle_at_75%_24%,hsl(var(--accent)/0.12),transparent_24%)]" />
          {Object.entries(regionAnchors).map(([region, point]) => (
            <div key={region} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm" style={{ left: `${point.x}%`, top: `${point.y}%` }}>{region}</div>
          ))}
          {selectedRoute && activeMatch && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              <line x1={`${selectedRoute.rbtPoint.x}%`} y1={`${selectedRoute.rbtPoint.y}%`} x2={`${selectedRoute.clientPoint.x}%`} y2={`${selectedRoute.clientPoint.y}%`} stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="8 7" strokeLinecap="round" />
              <circle cx={`${selectedRoute.rbtPoint.x}%`} cy={`${selectedRoute.rbtPoint.y}%`} r="46" fill="none" stroke="hsl(var(--primary) / 0.22)" strokeWidth="2" />
            </svg>
          )}
          {shouldCluster ? clientClusters.map((cluster) => {
            const lead = cluster.records[0];
            return (
              <button key={`client-cluster-${cluster.id}`} onClick={() => onSelectRecord(lead, cluster.best)} className={cn("group absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border shadow-sm transition hover:z-40 hover:scale-110", cluster.records.some((record) => record.id === selected.id) ? "border-primary bg-primary text-primary-foreground" : cluster.records.some((record) => record.priority === "Critical" || record.status === "Restaffing Needed") ? "border-destructive/40 bg-destructive text-destructive-foreground" : "border-warning/40 bg-warning text-warning-foreground")} style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}>
                <span className="text-xs font-semibold">{cluster.records.length}</span>
                {cluster.best && cluster.route && <MarkerTooltip title={`${cluster.records.length} clients · top ${lead.client} → ${cluster.best.rbt.name}`} route={cluster.route} match={cluster.best} />}
              </button>
            );
          }) : records.map((record) => {
            const point = pointFor(record.id, record.region, "client");
            const best = rbts.map((rbt) => scoreMatch(record, rbt)).filter((match) => match.rbt.state === record.state).sort((a, b) => b.score - a.score)[0];
            const route = best ? routeStats(record, best.rbt) : undefined;
            return (
              <button key={record.id} onClick={() => onSelectRecord(record, best)} className={cn("group absolute z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border shadow-sm transition hover:z-40 hover:scale-110", selected.id === record.id ? "border-primary bg-primary text-primary-foreground" : record.priority === "Critical" || record.status === "Restaffing Needed" ? "border-destructive/40 bg-destructive text-destructive-foreground" : "border-warning/40 bg-warning text-warning-foreground")} style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                {record.location === "Home" ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                {best && route && <MarkerTooltip title={`${record.client} → ${best.rbt.name}`} route={route} match={best} />}
              </button>
            );
          })}
          {shouldCluster ? rbtClusters.map((cluster) => {
            const isActive = cluster.rbts.some((rbt) => activeMatch?.rbt.id === rbt.id);
            return (
              <button key={`rbt-cluster-${cluster.id}`} onClick={() => onSelectRbt(cluster.best.rbt.id)} className={cn("group absolute z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition hover:z-40 hover:scale-110", isActive ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20" : cluster.rbts.some((rbt) => rbt.compliance === "Ready") ? "border-success/40 bg-success text-success-foreground" : "border-border bg-background text-muted-foreground")} style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}>
                <span className="text-xs font-semibold">{cluster.rbts.length}</span>
                <MarkerTooltip title={`${cluster.rbts.length} RBTs · top ${cluster.best.rbt.name} → ${selected.client}`} route={cluster.route} match={cluster.best} />
              </button>
            );
          }) : rbts.map((rbt) => {
            const point = pointFor(rbt.id, rbt.region, "rbt");
            const isActive = activeMatch?.rbt.id === rbt.id;
            const match = scoreMatch(selected, rbt);
            const route = routeStats(selected, rbt);
            return (
              <button key={rbt.id} onClick={() => onSelectRbt(rbt.id)} className={cn("group absolute z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition hover:z-40 hover:scale-110", isActive ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20" : rbt.compliance === "Ready" ? "border-success/40 bg-success text-success-foreground" : "border-border bg-background text-muted-foreground")} style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                <Users className="h-3.5 w-3.5" />
                <MarkerTooltip title={`${rbt.name} → ${selected.client}`} route={route} match={match} />
              </button>
            );
          })}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-lg border bg-background/90 p-2 text-xs shadow-sm backdrop-blur"><span className="inline-flex items-center gap-1"><Home className="h-3 w-3 text-warning" />Client home</span><span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3 text-destructive" />Clinic/urgent</span><span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-success" />RBT</span><span className="inline-flex items-center gap-1"><Route className="h-3 w-3 text-primary" />Selected route</span></div>
        </div>
        <aside className="border-t p-4 xl:border-l xl:border-t-0"><div className="rounded-lg border bg-muted/20 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{selected.client}</p><p className="text-xs text-muted-foreground">{selected.region} · {selected.location} · {selected.requiredHours}h needed</p></div><StatusPill tone={urgencyTone(selected.priority)}>{selected.priority}</StatusPill></div>{activeMatch && selectedRoute && <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-md border bg-background p-2"><Navigation className="mx-auto mb-1 h-3.5 w-3.5 text-primary" /><p className="font-semibold">{selectedRoute.miles} mi</p><p className="text-muted-foreground">drive</p></div><div className="rounded-md border bg-background p-2"><Clock className="mx-auto mb-1 h-3.5 w-3.5 text-primary" /><p className="font-semibold">{selectedRoute.minutes}m</p><p className="text-muted-foreground">ETA</p></div><div className="rounded-md border bg-background p-2"><ShieldCheck className="mx-auto mb-1 h-3.5 w-3.5 text-primary" /><p className="font-semibold">{selectedRoute.withinRadius ? "Inside" : "Outside"}</p><p className="text-muted-foreground">radius</p></div></div>}</div><div className="mt-4 space-y-3"><h3 className="text-sm font-semibold">Fastest viable RBTs</h3>{mapMatches.map(({ match, route }) => <button key={match.rbt.id} onClick={() => onSelectRbt(match.rbt.id)} className={cn("w-full rounded-lg border p-3 text-left transition hover:bg-muted/40", activeMatch?.rbt.id === match.rbt.id && "border-primary bg-primary/5")}><div className="flex items-center justify-between"><div><p className="font-medium">{match.rbt.name}</p><p className="text-xs text-muted-foreground">{route.minutes} min · {route.miles} mi · {availableHours(match.rbt)}h open</p></div><span className="text-lg font-semibold">{match.score}</span></div><div className="mt-2 flex flex-wrap gap-1.5"><StatusPill tone={route.withinRadius ? "success" : "warning"}>{route.withinRadius ? "Within radius" : "Travel exception"}</StatusPill><StatusPill tone={match.ready ? "success" : "destructive"}>{match.rbt.compliance}</StatusPill></div></button>)}</div>{activeMatch && <Button className="mt-4 w-full" onClick={() => onAssign(selected, activeMatch.rbt)}><UserCheck className="mr-2 h-4 w-4" />Assign {activeMatch.rbt.name}</Button>}</aside>
      </div>
    </section>
  );
}

export default function StaffingDashboard() {
  const initialMapState = storedMapState();
  const [records, setRecords] = useState<StaffingRecord[]>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STAFFING_RECORDS_KEY) : null;
    return saved ? hydrateRecords(JSON.parse(saved) as StaffingRecord[]) : staffingSeed;
  });
  const [rbts, setRbts] = useState<Rbt[]>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STAFFING_RBTS_KEY) : null;
    return saved ? JSON.parse(saved) as Rbt[] : rbtSeed;
  });
  const [selectedId, setSelectedId] = useState<string>(typeof initialMapState?.selectedId === "string" ? initialMapState.selectedId : staffingSeed[1].id);
  const [dateRange, setDateRange] = useState("This Week");
  const [stateFilter, setStateFilter] = useState(ALL);
  const [clinicFilter, setClinicFilter] = useState(ALL);
  const [ownerFilter, setOwnerFilter] = useState(ALL);
  const [rbtFilter, setRbtFilter] = useState(ALL);
  const [bcbaFilter, setBcbaFilter] = useState(ALL);
  const [clientStatus, setClientStatus] = useState(ALL);
  const [staffingStatus, setStaffingStatus] = useState(ALL);
  const [urgencyFilter, setUrgencyFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const [activeKpi, setActiveKpi] = useState<KpiKey>("all");
  const [queue, setQueue] = useState<QueueKey>("urgent");
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(typeof initialMapState?.activeMatchId === "string" ? initialMapState.activeMatchId : null);
  const [mapFocus, setMapFocus] = useState<"all" | "ready" | "urgent">(["all", "ready", "urgent"].includes(String(initialMapState?.mapFocus)) ? initialMapState?.mapFocus as "all" | "ready" | "urgent" : "ready");
  const [mapZoom, setMapZoom] = useState<MapZoom>(["regional", "local", "street"].includes(String(initialMapState?.mapZoom)) ? initialMapState?.mapZoom as MapZoom : "regional");
  const [mapFilters, setMapFilters] = useState<MapFilters>(() => ({ unassignedOnly: false, readyRbtsOnly: false, urgentLocalOnly: false, ...((initialMapState?.mapFilters as Partial<MapFilters>) ?? {}) }));

  const clinics = useMemo(() => [ALL, ...Array.from(new Set(records.map((r) => r.clinic))).sort()], [records]);
  const rbtNames = useMemo(() => [ALL, ...rbts.map((r) => r.name).sort()], [rbts]);
  const selected = records.find((r) => r.id === selectedId) ?? records[0];
  const matchesFor = (record: StaffingRecord) => rbts.map((rbt) => scoreMatch(record, rbt)).filter((m) => m.rbt.state === record.state && !record.rejectedRbtIds.includes(m.rbt.id)).sort((a, b) => b.score - a.score).slice(0, 5);
  const selectedMatches = useMemo(() => matchesFor(selected), [selected, rbts]);
  const activeMatch = selectedMatches.find((m) => m.rbt.id === activeMatchId) ?? selectedMatches[0];
  const mapRbts = useMemo(() => rbts
    .filter((rbt) => stateFilter === ALL || rbt.state === stateFilter)
    .filter((rbt) => !mapFilters.readyRbtsOnly || rbt.compliance === "Ready")
    .filter((rbt) => !mapFilters.urgentLocalOnly || rbt.state === selected.state || rbt.region === selected.region), [rbts, stateFilter, mapFilters.readyRbtsOnly, mapFilters.urgentLocalOnly, selected.state, selected.region]);

  useEffect(() => { window.localStorage.setItem(STAFFING_RECORDS_KEY, JSON.stringify(records)); }, [records]);
  useEffect(() => { window.localStorage.setItem(STAFFING_RBTS_KEY, JSON.stringify(rbts)); }, [rbts]);
  useEffect(() => {
    window.localStorage.setItem(STAFFING_MAP_STATE_KEY, JSON.stringify({ selectedId, activeMatchId, mapFocus, mapZoom, mapFilters }));
  }, [activeMatchId, mapFilters, mapFocus, mapZoom, selectedId]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter((r) => stateFilter === ALL || r.state === stateFilter)
      .filter((r) => clinicFilter === ALL || r.clinic === clinicFilter)
      .filter((r) => ownerFilter === ALL || r.owner === ownerFilter)
      .filter((r) => rbtFilter === ALL || (r.assignedRbtId && rbts.find((x) => x.id === r.assignedRbtId)?.name === rbtFilter))
      .filter((r) => bcbaFilter === ALL || r.bcba === bcbaFilter)
      .filter((r) => clientStatus === ALL || r.authStatus === clientStatus)
      .filter((r) => staffingStatus === ALL || r.status === staffingStatus)
      .filter((r) => urgencyFilter === ALL || r.priority === urgencyFilter)
      .filter((r) => activeKpi === "all" || (activeKpi === "needed" && r.status === "Staffing Needed") || (activeKpi === "restaffing" && r.status === "Restaffing Needed") || (activeKpi === "matching" && r.status === "Matching in Progress") || (activeKpi === "assigned" && r.status === "RBT Assigned") || (activeKpi === "urgent" && (r.priority === "Critical" || r.daysWaiting > 7)) || activeKpi === "avg" || activeKpi === "available" || activeKpi === "gap")
      .filter((r) => !q || [r.client, r.parent, r.state, r.clinic, r.region, r.owner, r.bcba, r.status, r.nextAction].some((field) => field.toLowerCase().includes(q)));
  }, [activeKpi, bcbaFilter, clientStatus, clinicFilter, ownerFilter, query, rbtFilter, rbts, records, staffingStatus, stateFilter, urgencyFilter]);
  const mapClients = useMemo(() => filtered
    .filter((record) => mapFocus === "all" || (mapFocus === "ready" && !record.assignedRbtId) || (mapFocus === "urgent" && (record.priority === "Critical" || record.daysWaiting > 7 || record.status === "Restaffing Needed")))
    .filter((record) => !mapFilters.unassignedOnly || !record.assignedRbtId)
    .filter((record) => !mapFilters.urgentLocalOnly || ((record.priority === "Critical" || record.daysWaiting > 7 || record.status === "Restaffing Needed") && (record.state === selected.state || record.region === selected.region))), [filtered, mapFocus, mapFilters.unassignedOnly, mapFilters.urgentLocalOnly, selected.state, selected.region]);

  const demandHours = filtered.filter((r) => !r.assignedRbtId || r.status !== "Ready for Scheduling").reduce((sum, r) => sum + r.requiredHours, 0);
  const availableSupply = rbts.filter((r) => stateFilter === ALL || r.state === stateFilter).reduce((sum, r) => sum + availableHours(r), 0);
  const urgentRows = filtered.filter((r) => r.daysWaiting > 3 || r.status === "Restaffing Needed" || r.status === "No Match Available" || (r.priority === "Critical" && !r.assignedRbtId));
  const kpis = [
    { key: "needed" as KpiKey, label: "Staffing Needed", value: filtered.filter((r) => r.status === "Staffing Needed").length, subtext: "Clients ready for RBT match", health: filtered.some((r) => r.status === "Staffing Needed" && r.daysWaiting > 3) ? "yellow" : "green" as Health },
    { key: "restaffing" as KpiKey, label: "Restaffing Needed", value: filtered.filter((r) => r.status === "Restaffing Needed").length, subtext: "Service gaps requiring replacement", health: filtered.some((r) => r.status === "Restaffing Needed") ? "red" : "green" as Health },
    { key: "matching" as KpiKey, label: "Matching in Progress", value: filtered.filter((r) => r.status === "Matching in Progress").length, subtext: "Open matching workflows", health: "yellow" as Health },
    { key: "assigned" as KpiKey, label: "RBT Assigned", value: filtered.filter((r) => r.status === "RBT Assigned" || r.status === "Ready for Scheduling").length, subtext: "Confirmed or ready for schedule", health: "green" as Health },
    { key: "avg" as KpiKey, label: "Avg Days Waiting", value: `${avg(filtered.map((r) => r.daysWaiting))}d`, subtext: "Auth approval to assignment", health: avg(filtered.map((r) => r.daysWaiting)) > 7 ? "red" : avg(filtered.map((r) => r.daysWaiting)) > 3 ? "yellow" : "green" as Health },
    { key: "available" as KpiKey, label: "Available RBTs", value: rbts.filter((r) => availableHours(r) >= 8 && r.compliance === "Ready").length, subtext: `${availableSupply} open weekly hours`, health: availableSupply >= demandHours ? "green" : "yellow" as Health },
    { key: "gap" as KpiKey, label: "Capacity Gap", value: Math.max(0, demandHours - availableSupply), subtext: `${demandHours}h demand vs ${availableSupply}h supply`, health: demandHours > availableSupply ? "red" : "green" as Health },
    { key: "urgent" as KpiKey, label: "Urgent Cases", value: urgentRows.length, subtext: "Critical, aging, no match, restaff", health: urgentRows.length > 4 ? "red" : urgentRows.length ? "yellow" : "green" as Health },
  ];

  const queueRows = {
    urgent: urgentRows,
    today: filtered.filter((r) => ["Staffing Needed", "Matching in Progress", "Offer / Confirmation Pending"].includes(r.status) && matchesFor(r)[0]?.score >= 60),
    capacity: filtered.filter((r) => r.blockers.some((b) => b.toLowerCase().includes("capacity") || b.toLowerCase().includes("availability")) || matchesFor(r)[0]?.capacityFit < 18),
  };
  const readiness = statuses.map((status) => {
    const rows = filtered.filter((r) => r.status === status);
    const oldest = rows.length ? Math.max(...rows.map((r) => r.daysWaiting)) : 0;
    return { status, count: rows.length, oldest, avgDays: avg(rows.map((r) => r.daysWaiting)), health: stageHealth(rows.length, oldest) };
  });
  const coverage = states.flatMap((state) => Array.from(new Set(records.filter((r) => r.state === state).map((r) => r.region))).map((region) => {
    const demand = records.filter((r) => r.state === state && r.region === region && r.status !== "Ready for Scheduling").reduce((s, r) => s + r.requiredHours, 0);
    const supply = rbts.filter((r) => r.state === state && r.region === region).reduce((s, r) => s + availableHours(r), 0);
    const assigned = rbts.filter((r) => r.state === state && r.region === region).reduce((s, r) => s + r.currentHours, 0);
    return { state, region, clinic: records.find((r) => r.state === state && r.region === region)?.clinic ?? "—", demand, supply, assigned, gap: Math.max(0, demand - supply), coverage: pct(supply, demand) };
  }));
  const ownerPerformance = owners.map((owner) => {
    const rows = records.filter((r) => r.owner === owner);
    return { owner, needs: rows.filter((r) => !r.assignedRbtId).length, matches: rows.filter((r) => r.assignedRbtId).length, restaffs: rows.filter((r) => r.status === "Restaffing Needed").length, avgAssign: avg(rows.map((r) => r.daysWaiting)), urgent: rows.filter((r) => r.priority === "Critical" || r.daysWaiting > 7).length, gap: rows.reduce((sum, r) => sum + Math.max(0, r.requiredHours - (r.assignedRbtId ? r.requiredHours : 0)), 0), tasks: rows.reduce((sum, r) => sum + r.tasks.filter((t) => !t.completed).length, 0) };
  });

  const updateRecord = (id: string, patch: Partial<StaffingRecord>, message: string) => {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...patch, timeline: [{ id: `${id}-${Date.now()}`, title: message, text: "Updated from Staffing Dashboard", timestamp: today.toISOString(), user: "Dashboard user" }, ...record.timeline] } : record));
    toast.success(message);
  };
  const assignRbt = (record: StaffingRecord, rbt: Rbt) => {
    const match = scoreMatch(record, rbt);
    const hoursToAdd = Math.min(record.requiredHours, availableHours(rbt));
    const decision = decisionEntry(match, "Selected", `Selected for ${match.score} score with ${match.overlap} matching availability slot${match.overlap === 1 ? "" : "s"}.`);
    setRbts((current) => current.map((item) => item.id === rbt.id ? { ...item, currentHours: item.currentHours + hoursToAdd, assignedClients: Array.from(new Set([...item.assignedClients, record.client])) } : item));
    updateRecord(record.id, { assignedRbtId: rbt.id, status: "Ready for Scheduling", nextAction: "Send client to scheduling", blockers: record.blockers.filter((b) => !b.toLowerCase().includes("no rbt")), decisionHistory: [decision, ...record.decisionHistory] }, `${rbt.name} assigned to ${record.client}`);
  };
  const rejectMatch = (record: StaffingRecord, rbt: Rbt) => {
    const match = scoreMatch(record, rbt);
    const decision = decisionEntry(match, "Rejected", `Rejected despite ${match.score} score; next best match required.`);
    updateRecord(record.id, { rejectedRbtIds: Array.from(new Set([...record.rejectedRbtIds, rbt.id])), decisionHistory: [decision, ...record.decisionHistory], nextAction: `Rejected ${rbt.name}; review next best match` }, `${rbt.name} rejected for ${record.client}`);
  };
  const exportCsv = () => {
    const rows = filtered.map((r) => [r.client, r.state, r.clinic, r.requiredHours, r.status, rbts.find((x) => x.id === r.assignedRbtId)?.name ?? "", matchesFor(r)[0]?.rbt.name ?? "", matchesFor(r)[0]?.score ?? 0, r.daysWaiting, r.priority, r.nextAction]);
    const csv = [["Client", "State", "Clinic", "Required Hours", "Status", "Assigned RBT", "Suggested RBT", "Match Score", "Days Waiting", "Urgency", "Next Action"], ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "staffing-dashboard.csv"; link.click(); URL.revokeObjectURL(url);
    toast.success("Staffing dashboard exported");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-20 -mx-6 -mt-6 border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-semibold tracking-tight">Staffing Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">RBT matching, availability, capacity, and client staffing blockers.</p></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => toast.success("Staffing data refreshed")}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5 xl:grid-cols-9">
          {[{ v: dateRange, s: setDateRange, o: ["Today", "This Week", "Next 14 Days", "This Month"] }, { v: stateFilter, s: setStateFilter, o: [ALL, ...states] }, { v: clinicFilter, s: setClinicFilter, o: clinics }, { v: ownerFilter, s: setOwnerFilter, o: [ALL, ...owners] }, { v: rbtFilter, s: setRbtFilter, o: rbtNames }, { v: bcbaFilter, s: setBcbaFilter, o: [ALL, ...bcbas] }, { v: clientStatus, s: setClientStatus, o: [ALL, "Approved", "Reauth pending", "Pending start"] }, { v: staffingStatus, s: setStaffingStatus, o: [ALL, ...statuses] }, { v: urgencyFilter, s: setUrgencyFilter, o: [ALL, "Routine", "Elevated", "High", "Critical"] }].map((filter, index) => (
            <Select key={index} value={filter.v} onValueChange={filter.s}><SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger><SelectContent>{filter.o.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        {kpis.map((kpi) => <button key={kpi.key} onClick={() => setActiveKpi(activeKpi === kpi.key ? "all" : kpi.key)} className={cn("rounded-lg border bg-card p-4 text-left shadow-sm transition hover:shadow-md", activeKpi === kpi.key && "border-primary ring-2 ring-primary/20")}><div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{kpi.label}</span><HealthDot health={kpi.health} /></div><div className="mt-2 text-2xl font-semibold">{kpi.value}</div><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{kpi.subtext}</p></button>)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Staffing Action Queue</h2><p className="text-xs text-muted-foreground">Urgent cases, match-ready clients, and capacity risks.</p></div><div className="flex rounded-md border bg-muted/40 p-1">{[["urgent", "Urgent Now"], ["today", "Match Today"], ["capacity", "Capacity Risks"]].map(([key, label]) => <button key={key} onClick={() => setQueue(key as QueueKey)} className={cn("rounded px-3 py-1.5 text-xs font-medium", queue === key ? "bg-card shadow-sm" : "text-muted-foreground")}>{label}</button>)}</div></div>
          <div className="divide-y">
            {queueRows[queue].slice(0, 7).map((record) => { const matches = matchesFor(record); const best = matches[0]; return <div key={record.id} onClick={() => { setSelectedId(record.id); setActiveMatchId(best?.rbt.id ?? null); }} className={cn("grid cursor-pointer grid-cols-[1.1fr_0.8fr_0.7fr_0.7fr_0.7fr_1fr_auto] items-center gap-3 p-4 text-sm hover:bg-muted/40", selectedId === record.id && "bg-primary/5")}><div><div className="font-medium">{record.client}</div><div className="text-xs text-muted-foreground">{record.state} / {record.clinic} · {record.location}</div></div><div className="text-xs"><div>{record.requiredHours}h required</div><div className="text-muted-foreground">{record.availability.join(", ")}</div></div><div className="text-xs">{record.owner}<div className="text-muted-foreground">{record.daysWaiting}d waiting</div></div><div><StatusPill tone={urgencyTone(record.priority)}>{record.priority}</StatusPill></div><div className="text-xs"><div>{best?.rbt.name ?? "No match"}</div><div className="text-muted-foreground">Score {best?.score ?? 0}</div></div><div className="text-xs text-muted-foreground">{record.nextAction}</div><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}>Open Match</Button>{best && <Button size="sm" onClick={(e) => { e.stopPropagation(); assignRbt(record, best.rbt); }}>Assign</Button>}</div></div>; })}
          </div>
        </section>

        <aside className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">Matching Engine Snapshot</h2><p className="text-xs text-muted-foreground">Selected client demand and top RBT matches.</p></div><Sparkles className="h-5 w-5 text-primary" /></div>
          <div className="mt-4 rounded-lg border bg-muted/30 p-3"><div className="flex items-start justify-between"><div><div className="font-medium">{selected.client}</div><div className="text-xs text-muted-foreground">{selected.state} / {selected.clinic} · {selected.requiredHours}h · {selected.location}</div></div><StatusPill tone={urgencyTone(selected.priority)}>{selected.priority}</StatusPill></div><p className="mt-3 text-xs text-muted-foreground">{selected.clinicalNotes}</p></div>
          <div className="mt-4 space-y-3">{selectedMatches.slice(0, 3).map((match) => <button key={match.rbt.id} onClick={() => setActiveMatchId(match.rbt.id)} className={cn("w-full rounded-lg border p-3 text-left transition hover:bg-muted/40", activeMatch?.rbt.id === match.rbt.id && "border-primary bg-primary/5")}><div className="flex items-center justify-between"><div className="font-medium">{match.rbt.name}</div><span className="text-lg font-semibold">{match.score}</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground"><span>{match.overlap} overlap</span><span>{availableHours(match.rbt)}h open</span><span>{match.rbt.compliance}</span></div><Progress value={match.score} className="mt-2 h-1.5" /><Button size="sm" className="mt-3 w-full" onClick={(e) => { e.stopPropagation(); assignRbt(selected, match.rbt); }}>Assign {match.rbt.name}</Button></button>)}</div>
        </aside>
      </div>

      <StaffingMap records={mapClients} rbts={mapRbts} selected={selected} activeMatch={activeMatch} mapFocus={mapFocus} mapZoom={mapZoom} mapFilters={mapFilters} setMapFocus={setMapFocus} setMapZoom={setMapZoom} setMapFilters={setMapFilters} onSelectRecord={(record, match) => { setSelectedId(record.id); setActiveMatchId(match?.rbt.id ?? null); }} onSelectRbt={setActiveMatchId} onAssign={assignRbt} />

      <section className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-7">{readiness.map((stage) => <button key={stage.status} onClick={() => setStaffingStatus(stage.status)} className="rounded-lg border bg-card p-4 text-left shadow-sm hover:shadow-md"><div className="flex items-center justify-between"><HealthDot health={stage.health as Health} /><ArrowRight className="h-4 w-4 text-muted-foreground" /></div><div className="mt-3 text-xl font-semibold">{stage.count}</div><div className="text-xs font-medium">{stage.status}</div><div className="mt-2 text-[11px] text-muted-foreground">Oldest {stage.oldest}d · Avg {stage.avgDays}d</div></button>)}</section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
        <div className="rounded-lg border bg-card p-4 shadow-sm"><h2 className="font-semibold">Client Demand</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Client</span><span className="font-medium">{selected.client}</span></div><div className="flex justify-between"><span className="text-muted-foreground">State / Clinic</span><span>{selected.state} / {selected.clinic}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{selected.location}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Required / approved</span><span>{selected.requiredHours}h / {selected.approvedHours}h</span></div><div className="flex justify-between"><span className="text-muted-foreground">Priority</span><StatusPill tone={urgencyTone(selected.priority)}>{selected.priority}</StatusPill></div><div className="flex justify-between"><span className="text-muted-foreground">Start urgency</span><span>{selected.startUrgency}</span></div></div><div className="mt-4 grid grid-cols-3 gap-2">{selected.availability.map((slot) => <div key={slot} className="rounded-md border bg-primary/5 p-2 text-center text-xs text-primary">{slot}</div>)}</div><p className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">{selected.clinicalNotes}</p></div>
        <div className="rounded-lg border bg-card p-4 shadow-sm"><h2 className="font-semibold">RBT Supply</h2><div className="mt-4 space-y-3">{selectedMatches.map((match) => <div key={match.rbt.id} className="rounded-lg border p-3"><div className="flex items-center justify-between"><div><div className="font-medium">{match.rbt.name}</div><div className="text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{match.rbt.location} · {match.rbt.radius} mi · {match.rbt.experience.join(", ")}</div></div><div className="text-right"><div className="text-xl font-semibold">{match.score}</div><div className="text-[11px] text-muted-foreground">match score</div></div></div><div className="mt-3 grid grid-cols-5 gap-2 text-xs"><span>{match.overlap} overlap</span><span>{match.rbt.currentHours}/{match.rbt.maxHours}h</span><span>{availableHours(match.rbt)}h open</span><span>{match.rbt.compliance}</span><span>{match.rbt.onboarding}</span></div><div className="mt-3 flex flex-wrap gap-2">{match.reasons.map((reason) => <StatusPill key={reason}>{reason}</StatusPill>)}<Button size="sm" className="ml-auto" onClick={() => assignRbt(selected, match.rbt)}>Assign</Button><Button variant="outline" size="sm" onClick={() => rejectMatch(selected, match.rbt)}>Reject</Button></div></div>)}</div></div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 shadow-sm"><h2 className="font-semibold">Capacity Map / Coverage</h2><div className="mt-4 overflow-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">State</th><th>Region</th><th>Clinic</th><th>Required</th><th>Available</th><th>Assigned</th><th>Gap</th><th>Coverage</th></tr></thead><tbody>{coverage.map((row) => <tr key={`${row.state}-${row.region}`} className="border-t"><td className="py-2">{row.state}</td><td>{row.region}</td><td>{row.clinic}</td><td>{row.demand}h</td><td>{row.supply}h</td><td>{row.assigned}h</td><td className={row.gap ? "text-destructive" : "text-success"}>{row.gap}h</td><td><Progress value={Math.min(row.coverage, 100)} className="h-2" /></td></tr>)}</tbody></table></div></div>
        <div className="rounded-lg border bg-card p-4 shadow-sm"><h2 className="font-semibold">Staffing Owner Performance</h2><div className="mt-4 overflow-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">Owner</th><th>Needing</th><th>Matches</th><th>Restaffs</th><th>Avg Assign</th><th>Urgent</th><th>Gap Managed</th><th>Tasks</th></tr></thead><tbody>{ownerPerformance.map((row) => <tr key={row.owner} className="border-t"><td className="py-2 font-medium">{row.owner}</td><td>{row.needs}</td><td>{row.matches}</td><td>{row.restaffs}</td><td>{row.avgAssign}d</td><td>{row.urgent}</td><td>{row.gap}h</td><td>{row.tasks}</td></tr>)}</tbody></table></div></div>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">RBT Capacity Table</h2><p className="text-xs text-muted-foreground">Supply readiness, compliance, and available weekly capacity.</p></div><div className="relative w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search clients, owners, clinics..." value={query} onChange={(e) => setQuery(e.target.value)} /></div></div><div className="mt-4 overflow-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">RBT</th><th>State</th><th>Region</th><th>Status</th><th>Current</th><th>Max</th><th>Available</th><th>Clients</th><th>Availability</th><th>Compliance</th><th>Alerts</th></tr></thead><tbody>{rbts.map((rbt) => <tr key={rbt.id} className="border-t"><td className="py-2 font-medium">{rbt.name}</td><td>{rbt.state}</td><td>{rbt.region}</td><td>{rbt.onboarding}</td><td>{rbt.currentHours}h</td><td>{rbt.maxHours}h</td><td>{availableHours(rbt)}h</td><td>{rbt.assignedClients.length}</td><td className="max-w-52 truncate">{rbt.availability.join(", ")}</td><td><StatusPill tone={rbt.compliance === "Ready" ? "success" : rbt.compliance === "Expiring" ? "warning" : "destructive"}>{rbt.compliance}</StatusPill></td><td>{availableHours(rbt) <= 2 ? <StatusPill tone="warning">Near max</StatusPill> : rbt.compliance !== "Ready" ? <StatusPill tone="destructive">Not ready</StatusPill> : <StatusPill tone="success">Ready</StatusPill>}</td></tr>)}</tbody></table></div></section>

      <section className="mt-6 rounded-lg border bg-card p-4 shadow-sm"><h2 className="font-semibold">Staffing Worklist</h2><div className="mt-4 overflow-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">Client</th><th>State</th><th>Clinic</th><th>Hours</th><th>Availability</th><th>Status</th><th>Assigned RBT</th><th>Suggested</th><th>Score</th><th>Waiting</th><th>Urgency</th><th>Next Action</th><th>Alerts</th></tr></thead><tbody>{filtered.map((record) => { const matches = matchesFor(record); const best = matches[0]; const assigned = rbts.find((r) => r.id === record.assignedRbtId); const alerts = alertsFor(record, matches, assigned); return <tr key={record.id} onClick={() => { setSelectedId(record.id); setActiveMatchId(best?.rbt.id ?? null); setDetailOpen(true); }} className="cursor-pointer border-t hover:bg-muted/40"><td className="py-3 font-medium">{record.client}</td><td>{record.state}</td><td>{record.clinic}</td><td>{record.requiredHours}h</td><td className="max-w-44 truncate">{record.availability.join(", ")}</td><td><StatusPill tone={statusTone(record.status)}>{record.status}</StatusPill></td><td>{assigned?.name ?? "—"}</td><td>{best?.rbt.name ?? "—"}</td><td>{best?.score ?? 0}</td><td>{record.daysWaiting}d</td><td><StatusPill tone={urgencyTone(record.priority)}>{record.priority}</StatusPill></td><td className="max-w-56 truncate">{record.nextAction}</td><td><div className="flex gap-1">{alerts.slice(0, 2).map((a) => <AlertTriangle key={a.label} className={cn("h-4 w-4", a.severity === "red" ? "text-destructive" : "text-warning")} />)}</div></td></tr>; })}</tbody></table></div></section>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}><SheetContent className="w-[720px] max-w-[92vw] overflow-y-auto sm:max-w-[720px]"><SheetHeader><SheetTitle>{selected.client}</SheetTitle><SheetDescription>{selected.state} / {selected.clinic} · {selected.status} · {selected.requiredHours} weekly hours</SheetDescription></SheetHeader><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => activeMatch && assignRbt(selected, activeMatch.rbt)}><UserCheck className="mr-2 h-4 w-4" />Assign Top Match</Button><Button variant="outline" size="sm" onClick={() => updateRecord(selected.id, { status: "Matching in Progress" }, "Marked matching in progress")}><Sparkles className="mr-2 h-4 w-4" />Mark Matching</Button><Button variant="outline" size="sm" onClick={() => updateRecord(selected.id, { priority: "Critical", nextAction: "Escalated to leadership" }, "Case escalated")}><AlertTriangle className="mr-2 h-4 w-4" />Escalate</Button></div><Separator className="my-4" /><Tabs defaultValue="overview"><TabsList className="grid w-full grid-cols-4"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="matching">Matching</TabsTrigger><TabsTrigger value="availability">Availability</TabsTrigger><TabsTrigger value="profile">RBT Profile</TabsTrigger></TabsList><TabsList className="mt-2 grid w-full grid-cols-4"><TabsTrigger value="communications">Communications</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger><TabsTrigger value="audit">Audit</TabsTrigger></TabsList>
        <TabsContent value="overview" className="space-y-3 pt-4"><div className="grid grid-cols-2 gap-3">{[["Status", selected.status], ["Owner", selected.owner], ["Required hours", `${selected.requiredHours}h`], ["Days waiting", `${selected.daysWaiting}d`], ["Auth", selected.authStatus], ["BCBA", selected.bcba]].map(([label, value]) => <div key={label} className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div>)}</div><div className="rounded-lg border p-3"><div className="text-xs font-medium text-muted-foreground">Blockers</div><div className="mt-2 flex flex-wrap gap-2">{selected.blockers.length ? selected.blockers.map((b) => <StatusPill key={b} tone="destructive">{b}</StatusPill>) : <StatusPill tone="success">No active blockers</StatusPill>}</div></div></TabsContent>
        <TabsContent value="matching" className="space-y-3 pt-4">{selectedMatches.map((match) => <div key={match.rbt.id} className="rounded-lg border p-3"><div className="flex items-center justify-between"><div><div className="font-medium">{match.rbt.name}</div><div className="text-xs text-muted-foreground">{match.rbt.location} · {match.rbt.experience.join(", ")}</div></div><div className="text-xl font-semibold">{match.score}</div></div><Progress value={match.score} className="mt-2 h-2" /><div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">{[["Region", match.breakdown.region], ["Availability", match.breakdown.availability], ["Compliance", match.breakdown.compliance], ["Capacity", match.breakdown.capacity]].map(([label, value]) => <div key={String(label)} className="rounded-md border bg-muted/30 p-2"><div>{label}</div><div className="font-medium text-foreground">{value}/{auditWeights[label.toString().toLowerCase() as keyof typeof auditWeights]}</div></div>)}</div><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => assignRbt(selected, match.rbt)}><CheckCircle2 className="mr-2 h-4 w-4" />Assign</Button><Button variant="outline" size="sm" onClick={() => rejectMatch(selected, match.rbt)}><XCircle className="mr-2 h-4 w-4" />Reject</Button><Button variant="outline" size="sm" onClick={() => toast.success(`Outreach logged for ${match.rbt.name}`)}><Phone className="mr-2 h-4 w-4" />Contact RBT</Button></div></div>)}</TabsContent>
        <TabsContent value="availability" className="pt-4"><div className="grid grid-cols-4 gap-2">{["Mon AM", "Mon PM", "Tue AM", "Tue PM", "Wed AM", "Wed PM", "Thu AM", "Thu PM", "Fri AM", "Fri PM", "Sat AM", "Weekend AM"].map((slot) => <div key={slot} className={cn("rounded-md border p-2 text-center text-xs", selected.availability.includes(slot) ? "bg-primary/10 text-primary" : "bg-muted/40 text-muted-foreground")}>{slot}</div>)}</div><p className="mt-4 text-sm text-muted-foreground">Preferred times: {selected.availability.join(", ")} · Required hours: {selected.requiredHours}</p></TabsContent>
        <TabsContent value="profile" className="pt-4">{activeMatch ? <div className="rounded-lg border p-4"><div className="flex items-center justify-between"><div><div className="text-lg font-semibold">{activeMatch.rbt.name}</div><div className="text-sm text-muted-foreground">{activeMatch.rbt.location} · {activeMatch.rbt.radius} mile radius</div></div><StatusPill tone={activeMatch.rbt.compliance === "Ready" ? "success" : "destructive"}>{activeMatch.rbt.compliance}</StatusPill></div><div className="mt-4 grid grid-cols-3 gap-3 text-sm"><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Capacity</div><div>{activeMatch.rbt.currentHours}/{activeMatch.rbt.maxHours}h</div></div><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Available</div><div>{availableHours(activeMatch.rbt)}h</div></div><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Clients</div><div>{activeMatch.rbt.assignedClients.length}</div></div></div></div> : null}</TabsContent>
        <TabsContent value="communications" className="space-y-3 pt-4">{selected.notes.map((note) => <div key={note.id} className="rounded-lg border p-3"><div className="flex justify-between"><StatusPill>{note.type}</StatusPill><span className="text-xs text-muted-foreground">{shortDate(note.timestamp)}</span></div><p className="mt-2 text-sm">{note.text}</p><div className="mt-1 text-xs text-muted-foreground">{note.user}</div></div>)}</TabsContent>
        <TabsContent value="tasks" className="space-y-2 pt-4">{selected.tasks.map((task) => <div key={task.id} className="flex items-center justify-between rounded-lg border p-3"><div><div className="font-medium">{task.title}</div><div className="text-xs text-muted-foreground">{task.owner} · Due {task.dueDate}</div></div><StatusPill tone={task.completed ? "success" : "warning"}>{task.completed ? "Complete" : "Open"}</StatusPill></div>)}</TabsContent>
        <TabsContent value="timeline" className="space-y-3 pt-4">{selected.timeline.map((event) => <div key={event.id} className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" /><div><div className="font-medium">{event.title}</div><div className="text-sm text-muted-foreground">{event.text}</div><div className="text-xs text-muted-foreground">{shortDate(event.timestamp)} · {event.user}</div></div></div>)}</TabsContent>
        <TabsContent value="audit" className="space-y-3 pt-4">{selected.decisionHistory.length ? selected.decisionHistory.map((entry) => <div key={entry.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{entry.rbtName} {entry.decision.toLowerCase()}</div><div className="text-xs text-muted-foreground">{shortDate(entry.decidedAt)} · {entry.decidedBy}</div></div><StatusPill tone={entry.decision === "Selected" ? "success" : "destructive"}>{entry.decision}</StatusPill></div><p className="mt-2 text-sm text-muted-foreground">{entry.note}</p><div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">{[["Region", entry.breakdown.region, entry.weights.region], ["Availability", entry.breakdown.availability, entry.weights.availability], ["Compliance", entry.breakdown.compliance, entry.weights.compliance], ["Capacity", entry.breakdown.capacity, entry.weights.capacity]].map(([label, value, max]) => <div key={String(label)} className="rounded-md border bg-muted/30 p-2"><div>{label}</div><div className="font-medium text-foreground">{value}/{max}</div></div>)}</div><div className="mt-3 flex flex-wrap gap-2">{entry.reasons.map((reason) => <StatusPill key={`${entry.id}-${reason}`}>{reason}</StatusPill>)}<StatusPill tone="primary">{`Score ${entry.score}`}</StatusPill></div></div>) : <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No assignment decisions logged yet.</div>}</TabsContent>
      </Tabs></SheetContent></Sheet>
    </div>
  );
}
