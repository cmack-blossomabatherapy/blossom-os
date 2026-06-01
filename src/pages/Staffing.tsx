import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Download,
  FilePlus2,
  Filter,
  FolderKanban,
  Map,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/contexts/ClientsContext";
import { mockClients, type Client } from "@/data/clients";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";

type ViewMode = "queue" | "table" | "matching" | "capacity" | "restaffing" | "coverage";
type StaffingStatus = "Staffing Needed" | "Matching in Progress" | "Confirmation Pending" | "RBT Assigned" | "Ready for Scheduling" | "Restaffing Needed" | "No Match Available";
type Urgency = "Critical" | "High" | "Medium" | "Low";
type Readiness = "Ready" | "Needs Review" | "Incomplete";
type RbtStatus = "Available" | "Near Capacity" | "Full" | "Inactive";
type AvailabilitySlot = "Morning" | "Afternoon" | "Evening";
type MatchWeights = { region: number; availability: number; compliance: number; capacity: number };

type RbtRecord = {
  id: string;
  name: string;
  state: string;
  clinic: string;
  region: string;
  location: string;
  travelRadius: number;
  availability: AvailabilitySlot[];
  currentHours: number;
  maxHours: number;
  assignedClients: string[];
  compliance: Readiness;
  training: Readiness;
  onboarding: "Complete" | "In Progress" | "Blocked";
  experience: "Junior" | "Mid" | "Senior";
  status: RbtStatus;
  active: boolean;
};

type StaffingRecord = {
  id: string;
  clientId: string;
  clientName: string;
  parentName: string;
  state: string;
  clinic: string;
  location: string;
  serviceType: "Clinic" | "Home" | "Hybrid";
  region: string;
  bcba: string;
  requiredHours: number;
  approvedHours: number;
  availability: AvailabilitySlot[];
  status: StaffingStatus;
  urgency: Urgency;
  owner: string;
  assignedRbtId?: string;
  suggestedRbtId?: string;
  matchScore: number;
  daysWaiting: number;
  nextAction: string;
  alerts: string[];
  blockers: string[];
  notes: string;
  previousRbt?: string;
  restaffingReason?: string;
  lastServiceDate?: string;
  familyNotified?: boolean;
  tasks: { id: string; title: string; owner: string; due: string; completed: boolean }[];
  communications: { id: string; channel: string; note: string; at: string; owner: string }[];
  timeline: { id: string; event: string; at: string; owner: string }[];
  schedulingReady: boolean;
};

type SchedulingRecord = { id: string; clientId: string; clientName: string; status: "Ready for Scheduling" | "Pending Schedule"; assignedRbt: string; requiredHours: number };

const states = ["All", "GA", "NC", "VA", "TN", "MD", "NJ"];
const owners = ["All", "Maria L.", "Dante R.", "Priya S.", "Noelle C.", "Marcus H."];
const bcbaNames = ["Dr. Kim", "Dr. Lee", "Dr. Patel", "Dr. Moore", "Dr. Price", "Dr. Nguyen"];
const statusOptions: ("All" | StaffingStatus)[] = ["All", "Staffing Needed", "Matching in Progress", "Confirmation Pending", "RBT Assigned", "Ready for Scheduling", "Restaffing Needed", "No Match Available"];
const urgencyOptions: ("All" | Urgency)[] = ["All", "Critical", "High", "Medium", "Low"];
const staffingOwnerSchema = z.string().trim().refine((owner) => owners.includes(owner) && owner !== "All", "Choose a valid staffing owner.");
const staffingStatusSchema = z.string().trim().refine((status): status is StaffingStatus => statusOptions.includes(status as StaffingStatus) && status !== "All", "Choose a valid staffing status.");
const bulkSelectionSchema = z.array(z.string().regex(/^STF-\d{4}$/)).min(1, "Select at least one staffing record.").max(100, "Bulk edit is limited to 100 records.");
const escalationReasonSchema = z.enum(["WAITING_OVER_7_DAYS", "NO_RBT_MATCH", "REGIONAL_CAPACITY_GAP"]);
const escalationReasonLabels: Record<z.infer<typeof escalationReasonSchema>, string> = {
  WAITING_OVER_7_DAYS: "Client waiting over 7 days",
  NO_RBT_MATCH: "No RBT match exists",
  REGIONAL_CAPACITY_GAP: "Regional capacity gap",
};
const viewModes: { id: ViewMode; label: string; icon: typeof FolderKanban }[] = [
  { id: "queue", label: "Queue View", icon: FolderKanban },
  { id: "table", label: "Table View", icon: BriefcaseBusiness },
  { id: "matching", label: "Matching View", icon: Sparkles },
  { id: "capacity", label: "RBT Capacity View", icon: Users },
  { id: "restaffing", label: "Restaffing View", icon: ShieldAlert },
  { id: "coverage", label: "Region Coverage View", icon: Map },
];

const names = [
  ["Harper Wilson", "GA", "Peachtree Corners", "Norcross", "Clinic"], ["Mason Clark", "GA", "Riverdale", "Jonesboro", "Home"],
  ["Ella Martin", "GA", "Peachtree Corners", "Duluth", "Hybrid"], ["Logan Davis", "GA", "Riverdale", "Stockbridge", "Clinic"],
  ["Mila Robinson", "NC", "Charlotte", "SouthPark", "Clinic"], ["Ethan Hall", "NC", "Raleigh", "Cary", "Home"],
  ["Avery Young", "NC", "Charlotte", "Matthews", "Hybrid"], ["Jackson Allen", "NC", "Raleigh", "Apex", "Home"],
  ["Scarlett King", "TN", "Nashville", "Franklin", "Clinic"], ["Lucas Wright", "TN", "Memphis", "Germantown", "Home"],
  ["Grace Scott", "TN", "Nashville", "Murfreesboro", "Hybrid"], ["Henry Green", "TN", "Memphis", "Bartlett", "Clinic"],
  ["Chloe Baker", "VA", "Richmond", "Short Pump", "Clinic"], ["Owen Adams", "VA", "Norfolk", "Chesapeake", "Home"],
  ["Lily Nelson", "VA", "Richmond", "Midlothian", "Hybrid"], ["Wyatt Carter", "VA", "Norfolk", "Virginia Beach", "Home"],
  ["Nora Mitchell", "MD", "Baltimore", "Towson", "Clinic"], ["Levi Perez", "MD", "Silver Spring", "Bethesda", "Home"],
  ["Isla Roberts", "MD", "Baltimore", "Columbia", "Hybrid"], ["Leo Turner", "MD", "Silver Spring", "Rockville", "Clinic"],
] as const;

const rbtSeed = [
  ["Taylor S.", "GA", "Peachtree Corners", "Norcross", 24, 32, "Ready", "Ready", "Senior"], ["Jordan M.", "GA", "Riverdale", "Jonesboro", 18, 32, "Ready", "Ready", "Mid"],
  ["Quinn D.", "GA", "Peachtree Corners", "Duluth", 6, 25, "Needs Review", "Ready", "Junior"], ["Casey R.", "GA", "Riverdale", "Stockbridge", 31, 32, "Ready", "Ready", "Senior"], ["Parker N.", "GA", "Peachtree Corners", "Roswell", 0, 20, "Incomplete", "Needs Review", "Junior"],
  ["Morgan K.", "NC", "Charlotte", "SouthPark", 20, 35, "Ready", "Ready", "Senior"], ["Riley B.", "NC", "Raleigh", "Cary", 26, 30, "Ready", "Needs Review", "Mid"], ["Skylar T.", "NC", "Charlotte", "Matthews", 8, 28, "Ready", "Ready", "Junior"], ["Drew W.", "NC", "Raleigh", "Apex", 34, 34, "Ready", "Ready", "Senior"], ["Ari C.", "NC", "Charlotte", "Concord", 0, 24, "Incomplete", "Ready", "Junior"],
  ["Samira J.", "TN", "Nashville", "Franklin", 12, 32, "Ready", "Ready", "Mid"], ["Eli P.", "TN", "Memphis", "Germantown", 29, 32, "Ready", "Ready", "Senior"], ["Devon L.", "TN", "Nashville", "Murfreesboro", 4, 24, "Needs Review", "Ready", "Junior"], ["Maya F.", "TN", "Memphis", "Bartlett", 32, 32, "Ready", "Needs Review", "Mid"], ["Rowan H.", "TN", "Nashville", "Brentwood", 0, 20, "Incomplete", "Incomplete", "Junior"],
  ["Kai M.", "VA", "Richmond", "Short Pump", 14, 30, "Ready", "Ready", "Senior"], ["Tessa V.", "VA", "Norfolk", "Chesapeake", 24, 32, "Ready", "Ready", "Mid"], ["Blake G.", "VA", "Richmond", "Midlothian", 6, 26, "Needs Review", "Ready", "Junior"], ["Jules A.", "VA", "Norfolk", "Virginia Beach", 33, 34, "Ready", "Ready", "Senior"], ["Nico S.", "VA", "Richmond", "Henrico", 0, 24, "Ready", "Incomplete", "Junior"],
  ["Alexis O.", "MD", "Baltimore", "Towson", 16, 32, "Ready", "Ready", "Senior"], ["Noah B.", "MD", "Silver Spring", "Bethesda", 22, 30, "Ready", "Ready", "Mid"], ["Ivy Q.", "MD", "Baltimore", "Columbia", 7, 25, "Needs Review", "Ready", "Junior"], ["Reese E.", "MD", "Silver Spring", "Rockville", 30, 30, "Ready", "Ready", "Senior"], ["Cam D.", "MD", "Baltimore", "Catonsville", 0, 20, "Incomplete", "Needs Review", "Junior"],
] as const;

const slotSets: AvailabilitySlot[][] = [["Morning", "Afternoon"], ["Afternoon", "Evening"], ["Morning"], ["Evening"], ["Morning", "Afternoon", "Evening"]];

const buildRbts = (): RbtRecord[] => rbtSeed.map((r, index) => {
  const status: RbtStatus = !r[8] ? "Inactive" : Number(r[4]) >= Number(r[5]) ? "Full" : Number(r[5]) - Number(r[4]) <= 5 ? "Near Capacity" : "Available";
  return {
    id: `RBT-${String(index + 1).padStart(3, "0")}`,
    name: String(r[0]), state: String(r[1]), clinic: String(r[2]), region: `${r[1]} · ${r[3]}`, location: String(r[3]),
    travelRadius: [12, 18, 22, 16, 10][index % 5], availability: slotSets[index % slotSets.length],
    currentHours: Number(r[4]), maxHours: Number(r[5]), assignedClients: index % 3 === 0 ? [names[index % names.length][0]] : index % 4 === 0 ? [names[(index + 3) % names.length][0], names[(index + 8) % names.length][0]] : [],
    compliance: r[6] as Readiness, training: r[7] as Readiness, onboarding: r[6] === "Ready" ? "Complete" : r[6] === "Needs Review" ? "In Progress" : "Blocked", experience: r[8] as RbtRecord["experience"], status, active: index !== 24,
  };
});

const calcScore = (record: StaffingRecord, rbt: RbtRecord) => {
  const overlap = rbt.availability.filter((a) => record.availability.includes(a)).length;
  const capacity = Math.max(0, rbt.maxHours - rbt.currentHours);
  const location = rbt.state === record.state ? (rbt.clinic === record.clinic ? 25 : 17) : 0;
  const availability = Math.min(24, overlap * 12);
  const capacityScore = Math.min(22, (capacity / Math.max(record.requiredHours, 1)) * 22);
  const readiness = (rbt.compliance === "Ready" ? 12 : rbt.compliance === "Needs Review" ? 6 : 0) + (rbt.training === "Ready" ? 9 : rbt.training === "Needs Review" ? 4 : 0);
  const urgency = record.urgency === "Critical" ? 8 : record.urgency === "High" ? 5 : 2;
  return Math.round(location + availability + capacityScore + readiness + urgency);
};

const calcWeightedScore = (record: StaffingRecord, rbt: RbtRecord, weights: MatchWeights) => {
  const overlap = rbt.availability.filter((a) => record.availability.includes(a)).length;
  const capacity = Math.max(0, rbt.maxHours - rbt.currentHours);
  const regionRaw = rbt.state === record.state ? (rbt.clinic === record.clinic ? 1 : 0.68) : 0;
  const availabilityRaw = Math.min(1, overlap / Math.max(record.availability.length, 1));
  const complianceRaw = ((rbt.compliance === "Ready" ? 0.57 : rbt.compliance === "Needs Review" ? 0.29 : 0) + (rbt.training === "Ready" ? 0.43 : rbt.training === "Needs Review" ? 0.19 : 0));
  const capacityRaw = Math.min(1, capacity / Math.max(record.requiredHours, 1));
  const totalWeight = Math.max(1, weights.region + weights.availability + weights.compliance + weights.capacity);
  return Math.round(((regionRaw * weights.region) + (availabilityRaw * weights.availability) + (complianceRaw * weights.compliance) + (capacityRaw * weights.capacity)) / totalWeight * 100);
};

const buildRecords = (clients: Client[], rbts: RbtRecord[]): StaffingRecord[] => {
  const existing = clients.filter((c) => c.authStatus === "Approved" && (c.staffingStatus !== "Not Needed" || c.stage.includes("Staffing") || c.stage === "RBT Assigned" || c.stage === "Pending Start Date"));
  const connected = names.map((n, index) => {
    const client = existing[index % Math.max(existing.length, 1)] ?? mockClients[index % mockClients.length];
    const statusCycle: StaffingStatus[] = ["Staffing Needed", "Matching in Progress", "Confirmation Pending", "RBT Assigned", "Ready for Scheduling", "Restaffing Needed", "No Match Available"];
    const status = index < existing.length ? (client.stage === "Restaffing Needed" ? "Restaffing Needed" : client.stage === "Matching in Progress" ? "Matching in Progress" : client.stage === "RBT Assigned" ? "RBT Assigned" : client.stage === "Pending Start Date" ? "Ready for Scheduling" : client.rbt ? "RBT Assigned" : "Staffing Needed") : statusCycle[index % statusCycle.length];
    const state = String(n[1]);
    const clinic = String(n[2]);
    const suggested = rbts.filter((r) => r.state === state).sort((a, b) => (b.maxHours - b.currentHours) - (a.maxHours - a.currentHours))[index % 3];
    const assigned = status === "RBT Assigned" || status === "Ready for Scheduling" ? suggested : undefined;
    const daysWaiting = [2, 4, 8, 1, 6, 11, 5][index % 7];
    const urgency: Urgency = daysWaiting > 7 || status === "Restaffing Needed" ? "Critical" : daysWaiting > 3 ? "High" : index % 3 === 0 ? "Medium" : "Low";
    const availability = slotSets[(index + 1) % slotSets.length];
    const requiredHours = [12, 15, 18, 20, 25, 30][index % 6];
    const record: StaffingRecord = {
      id: `STF-${String(index + 1).padStart(4, "0")}`,
      clientId: client?.id ?? `DEMO-${index + 1}`,
      clientName: index < existing.length ? client.childName : String(n[0]),
      parentName: index < existing.length ? client.parentName : ["Patricia", "Miguel", "Lauren", "Andre", "Sophia"][index % 5] + " Family",
      state, clinic, location: String(n[3]), serviceType: n[4] as StaffingRecord["serviceType"], region: `${state} · ${n[3]}`,
      bcba: client?.bcba ?? bcbaNames[index % bcbaNames.length], requiredHours, approvedHours: requiredHours, availability,
      status, urgency, owner: owners[(index % (owners.length - 1)) + 1], assignedRbtId: assigned?.id, suggestedRbtId: suggested?.id,
      matchScore: suggested ? 0 : 0, daysWaiting, nextAction: status === "Ready for Scheduling" ? "Send scheduling handoff" : status === "No Match Available" ? "Escalate regional capacity gap" : status === "Restaffing Needed" ? "Open replacement match" : status === "Confirmation Pending" ? "Confirm RBT acceptance" : "Open match recommendations",
      alerts: [], blockers: status === "No Match Available" ? ["No compliant RBT with enough capacity"] : [], notes: index % 2 ? "Family prefers after-school availability and consistent RBT pairing." : "BCBA requested clinic proximity and strong early learner experience.",
      previousRbt: status === "Restaffing Needed" ? rbts[(index + 5) % rbts.length].name : undefined,
      restaffingReason: status === "Restaffing Needed" ? ["RBT resignation", "Schedule conflict", "Family requested change"][index % 3] : undefined,
      lastServiceDate: status === "Restaffing Needed" ? `2026-04-${String(8 + (index % 10)).padStart(2, "0")}` : undefined,
      familyNotified: status === "Restaffing Needed" ? index % 2 === 0 : undefined,
      tasks: [
        { id: `task-${index}-1`, title: "Review match recommendation", owner: owners[(index % 5) + 1], due: "Today", completed: ["RBT Assigned", "Ready for Scheduling"].includes(status) },
        { id: `task-${index}-2`, title: "Confirm RBT availability", owner: owners[((index + 1) % 5) + 1], due: "Tomorrow", completed: status === "Ready for Scheduling" },
      ],
      communications: [{ id: `com-${index}`, channel: "Internal", note: "Staffing queue reviewed during morning standup.", at: "Today 9:12 AM", owner: owners[(index % 5) + 1] }],
      timeline: [
        { id: `tl-${index}-1`, event: "Treatment auth approved", at: `2026-04-${String(1 + (index % 12)).padStart(2, "0")}`, owner: "System" },
        { id: `tl-${index}-2`, event: status === "Staffing Needed" ? "Staffing needed" : status, at: "Today", owner: owners[(index % 5) + 1] },
      ],
      schedulingReady: status === "Ready for Scheduling",
    };
    record.matchScore = suggested ? calcScore(record, suggested) : 0;
    const available = suggested ? suggested.maxHours - suggested.currentHours : 0;
    record.alerts = [
      daysWaiting > 3 ? "Client waiting > 3 days" : "",
      daysWaiting > 7 ? "Client waiting > 7 days" : "",
      status === "Restaffing Needed" ? "Restaffing urgent" : "",
      status === "No Match Available" ? "No RBT match available" : "",
      suggested?.compliance !== "Ready" ? "RBT compliance incomplete" : "",
      suggested?.training !== "Ready" ? "Training incomplete" : "",
      available < requiredHours && suggested ? "RBT over capacity risk" : "",
      availability.length === 1 ? "Client availability too limited" : "",
      !record.owner ? "Staffing owner missing" : "",
      status === "Staffing Needed" && daysWaiting > 0 ? "Treatment auth approved but no staffing action" : "",
    ].filter(Boolean);
    return record;
  });
  return connected;
};

const statusVariant = (status: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  if (["Ready", "Ready for Scheduling", "RBT Assigned", "Available"].includes(status)) return "success";
  if (["Critical", "Restaffing Needed", "No Match Available", "Full", "Incomplete"].includes(status)) return "destructive";
  if (["High", "Matching in Progress", "Confirmation Pending", "Near Capacity", "Needs Review"].includes(status)) return "warning";
  if (["Medium", "Staffing Needed"].includes(status)) return "info";
  return "muted";
};

const queueGroups: { id: string; title: string; description: string; test: (r: StaffingRecord) => boolean }[] = [
  { id: "urgent", title: "Urgent Now", description: "Aging, restaffing, no-match, and treatment-auth blockers", test: (r) => r.urgency === "Critical" || r.alerts.some((a) => a.includes("> 3") || a.includes("Restaffing") || a.includes("No RBT") || a.includes("auth")) },
  { id: "needed", title: "Staffing Needed", description: "Approved treatment auths awaiting first action", test: (r) => r.status === "Staffing Needed" },
  { id: "match", title: "Match Today", description: "Records with usable match recommendations", test: (r) => ["Matching in Progress", "Staffing Needed"].includes(r.status) && r.matchScore >= 55 },
  { id: "restaff", title: "Restaffing Needed", description: "Clients who lost an RBT or need replacement", test: (r) => r.status === "Restaffing Needed" },
  { id: "confirm", title: "Confirmation Pending", description: "RBT outreach and acceptance pending", test: (r) => r.status === "Confirmation Pending" },
  { id: "ready", title: "Ready for Scheduling", description: "Assigned and ready for scheduling handoff", test: (r) => r.status === "Ready for Scheduling" || r.status === "RBT Assigned" },
];

export default function Staffing() {
  const { clients, updateClient, appendTimeline, addTask } = useClients();
  const [viewMode, setViewMode] = useState<ViewMode>("queue");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ state: "All", clinic: "All", owner: "All", status: "All", urgency: "All", rbt: "All", bcba: "All", region: "All", availability: "All", compliance: "All" });
  const [rbts, setRbts] = useState<RbtRecord[]>(() => buildRbts());
  const [records, setRecords] = useState<StaffingRecord[]>(() => buildRecords(clients.length ? clients : mockClients, buildRbts()));
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? "");
  const [checked, setChecked] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<keyof StaffingRecord>("daysWaiting");
  const [sideOpen, setSideOpen] = useState(false);
  const [note, setNote] = useState("");
  const [schedulingRecords, setSchedulingRecords] = useState<SchedulingRecord[]>([]);
  const [capacityFocusKey, setCapacityFocusKey] = useState<string | null>(null);
  const [matchWeights, setMatchWeights] = useState<MatchWeights>({ region: 25, availability: 25, compliance: 25, capacity: 25 });

  const selected = records.find((r) => r.id === selectedId) ?? records[0];
  const selectedRbt = rbts.find((r) => r.id === selected?.assignedRbtId) ?? rbts.find((r) => r.id === selected?.suggestedRbtId);

  const clinics = ["All", ...Array.from(new Set(records.map((r) => r.clinic)))];
  const rbtNames = ["All", ...rbts.map((r) => r.name)];
  const regions = ["All", ...Array.from(new Set(records.map((r) => r.region)))];

  const coverageRows = useMemo(() => {
    const areas = Array.from(new Set(records.map((r) => `${r.state}|${r.region}|${r.clinic}`)));
    return areas.map((area) => {
      const [state, region, clinic] = area.split("|");
      const areaRecords = records.filter((r) => r.state === state && r.region === region && r.clinic === clinic);
      const areaRbts = rbts.filter((r) => r.state === state && (r.clinic === clinic || r.region === region));
      const required = areaRecords.reduce((sum, r) => sum + r.requiredHours, 0);
      const available = areaRbts.reduce((sum, r) => sum + Math.max(0, r.maxHours - r.currentHours), 0);
      const assigned = areaRbts.reduce((sum, r) => sum + r.currentHours, 0);
      const gap = available - required;
      return { state, region, clinic, required, available, assigned, gap, coverage: required ? Math.min(100, Math.round((available / required) * 100)) : 100, unstaffed: areaRecords.filter((r) => ["Staffing Needed", "Restaffing Needed", "No Match Available"].includes(r.status)).length, rbts: areaRbts.filter((r) => r.status === "Available").length };
    }).sort((a, b) => a.gap - b.gap || b.unstaffed - a.unstaffed);
  }, [records, rbts]);

  function focusCapacityRow(row: typeof coverageRows[number]) {
    setCapacityFocusKey(`${row.state}|${row.region}|${row.clinic}`);
    setFilters((current) => ({ ...current, state: row.state, region: row.region, clinic: row.clinic }));
    setViewMode("queue");
    toast.info(`${row.region} filtered`, { description: `${row.gap}h gap · ${row.unstaffed} unstaffed clients highlighted.` });
  }

  const rankedMatches = (record: StaffingRecord) => rbts
    .map((rbt) => ({ rbt, score: calcWeightedScore(record, rbt, matchWeights), overlap: rbt.availability.filter((a) => record.availability.includes(a)), available: rbt.maxHours - rbt.currentHours }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const matchBreakdown = (record: StaffingRecord, rbt: RbtRecord) => {
    const overlap = rbt.availability.filter((a) => record.availability.includes(a));
    const available = Math.max(0, rbt.maxHours - rbt.currentHours);
    const regionScore = rbt.state === record.state ? (rbt.clinic === record.clinic ? 25 : 17) : 0;
    const availabilityScore = Math.min(24, overlap.length * 12);
    const complianceScore = (rbt.compliance === "Ready" ? 12 : rbt.compliance === "Needs Review" ? 6 : 0) + (rbt.training === "Ready" ? 9 : rbt.training === "Needs Review" ? 4 : 0);
    const capacityScore = Math.round(Math.min(22, (available / Math.max(record.requiredHours, 1)) * 22));
    return [
      { label: "Region fit", value: regionScore, max: 25, weight: matchWeights.region, note: rbt.clinic === record.clinic ? "Same clinic" : rbt.state === record.state ? "Same state" : "Out of region" },
      { label: "Availability overlap", value: availabilityScore, max: 24, weight: matchWeights.availability, note: overlap.length ? overlap.join(", ") : "No shared slots" },
      { label: "Compliance readiness", value: complianceScore, max: 21, weight: matchWeights.compliance, note: `${rbt.compliance} compliance · ${rbt.training} training` },
      { label: "Capacity fit", value: capacityScore, max: 22, weight: matchWeights.capacity, note: `${available}h available / ${record.requiredHours}h needed` },
    ];
  };

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => !search || [r.clientName, r.state, r.clinic, r.bcba, r.owner, rbts.find((x) => x.id === r.assignedRbtId)?.name, rbts.find((x) => x.id === r.suggestedRbtId)?.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter((r) => filters.state === "All" || r.state === filters.state)
      .filter((r) => filters.clinic === "All" || r.clinic === filters.clinic)
      .filter((r) => filters.owner === "All" || r.owner === filters.owner)
      .filter((r) => filters.status === "All" || r.status === filters.status)
      .filter((r) => filters.urgency === "All" || r.urgency === filters.urgency)
      .filter((r) => filters.rbt === "All" || [r.assignedRbtId, r.suggestedRbtId].some((id) => rbts.find((x) => x.id === id)?.name === filters.rbt))
      .filter((r) => filters.bcba === "All" || r.bcba === filters.bcba)
      .filter((r) => filters.region === "All" || r.region === filters.region)
      .filter((r) => filters.availability === "All" || r.availability.includes(filters.availability as AvailabilitySlot))
      .filter((r) => filters.compliance === "All" || rbts.find((x) => x.id === r.suggestedRbtId)?.compliance === filters.compliance)
      .sort((a, b) => String(b[sortKey]).localeCompare(String(a[sortKey]), undefined, { numeric: true }));
  }, [records, search, filters, rbts, sortKey]);

  const kpis = [
    { label: "Staffing Needed", value: records.filter((r) => r.status === "Staffing Needed").length, mode: "queue" as ViewMode, filter: "Staffing Needed" },
    { label: "Restaffing Needed", value: records.filter((r) => r.status === "Restaffing Needed").length, mode: "restaffing" as ViewMode, filter: "Restaffing Needed" },
    { label: "Matching in Progress", value: records.filter((r) => r.status === "Matching in Progress").length, mode: "matching" as ViewMode, filter: "Matching in Progress" },
    { label: "RBT Assigned", value: records.filter((r) => r.status === "RBT Assigned").length, mode: "queue" as ViewMode, filter: "RBT Assigned" },
    { label: "No Match Available", value: records.filter((r) => r.status === "No Match Available").length, mode: "queue" as ViewMode, filter: "No Match Available" },
    { label: "Ready for Scheduling", value: records.filter((r) => r.status === "Ready for Scheduling").length, mode: "queue" as ViewMode, filter: "Ready for Scheduling" },
    { label: "Available RBTs", value: rbts.filter((r) => r.status === "Available" && r.compliance === "Ready" && r.training === "Ready").length, mode: "capacity" as ViewMode, filter: "All" },
    { label: "Capacity Gap", value: coverageRows.filter((r) => r.gap < 0).length, mode: "coverage" as ViewMode, filter: "All" },
  ];

  function patchRecord(id: string, patch: Partial<StaffingRecord>, event?: string) {
    setRecords((current) => current.map((record) => record.id === id ? {
      ...record,
      ...patch,
      timeline: event ? [{ id: `tl-${Date.now()}`, event, at: "Just now", owner: "Staffing OS" }, ...record.timeline] : record.timeline,
    } : record));
  }

  async function syncClient(record: StaffingRecord, status: StaffingStatus, rbtName?: string) {
    const clientExists = clients.some((c) => c.id === record.clientId);
    if (!clientExists) return;
    const patch = status === "Ready for Scheduling" || status === "RBT Assigned"
      ? { stage: "Pending Start Date" as const, staffingStatus: "Assigned" as const, rbt: rbtName, schedulingStatus: "Pending Schedule" as const, nextAction: "Build schedule and confirm start date" }
      : status === "Matching in Progress"
        ? { stage: "Matching in Progress" as const, staffingStatus: "In Progress" as const, nextAction: "Compare RBT matches" }
        : status === "Restaffing Needed"
          ? { stage: "Restaffing Needed" as const, staffingStatus: "Needed" as const, rbt: null, activeStaffingStatus: "Needs Restaffing" as const, nextAction: "Find replacement RBT" }
          : { stage: "Staffing Needed" as const, staffingStatus: "Needed" as const, nextAction: record.nextAction };
    await updateClient(record.clientId, patch);
    await appendTimeline(record.clientId, `Staffing updated: ${status}${rbtName ? ` (${rbtName})` : ""}`, "staffing");
  }

  function validateAssignment(record: StaffingRecord, rbt: RbtRecord) {
    const available = rbt.maxHours - rbt.currentHours;
    const overlap = rbt.availability.filter((a) => record.availability.includes(a));
    if (rbt.compliance !== "Ready") return `Assignment blocked: ${rbt.name} has incomplete compliance.`;
    if (rbt.training !== "Ready") return `Assignment blocked: ${rbt.name} has incomplete training.`;
    if (available <= 0) return `Assignment blocked: ${rbt.name} is at capacity.`;
    if (overlap.length === 0) return `Assignment blocked: no availability overlap.`;
    if (available < record.requiredHours) return `Capacity warning: ${rbt.name} only has ${available} hours available.`;
    if (overlap.length === 1) return `Availability warning: overlap is limited to ${overlap[0]}.`;
    return null;
  }

  async function assignRbt(record: StaffingRecord, rbt: RbtRecord, force = false) {
    const warning = validateAssignment(record, rbt);
    if (warning && !force && warning.includes("blocked")) {
      toast.error(warning);
      return;
    }
    if (warning && !force) toast.warning(warning);
    const score = calcScore(record, rbt);
    setRbts((current) => current.map((item) => item.id === rbt.id ? { ...item, currentHours: Math.min(item.maxHours, item.currentHours + record.requiredHours), assignedClients: Array.from(new Set([...item.assignedClients, record.clientName])), status: item.currentHours + record.requiredHours >= item.maxHours ? "Full" : item.maxHours - (item.currentHours + record.requiredHours) <= 5 ? "Near Capacity" : "Available" } : item));
    patchRecord(record.id, {
      status: "Ready for Scheduling",
      assignedRbtId: rbt.id,
      suggestedRbtId: rbt.id,
      matchScore: score,
      nextAction: "Scheduling handoff ready",
      schedulingReady: true,
      alerts: record.alerts.filter((a) => !a.includes("not assigned") && !a.includes("auth")),
      tasks: record.tasks.map((t) => t.title.includes("Review") || t.title.includes("availability") ? { ...t, completed: true } : t),
      communications: [{ id: `com-${Date.now()}`, channel: "RBT Outreach", note: `${rbt.name} accepted staffing assignment.`, at: "Just now", owner: record.owner }, ...record.communications],
    }, `${rbt.name} assigned; record moved to Ready for Scheduling`);
    setSchedulingRecords((current) => [{ id: `SCH-${record.id}`, clientId: record.clientId, clientName: record.clientName, status: "Ready for Scheduling", assignedRbt: rbt.name, requiredHours: record.requiredHours }, ...current.filter((s) => s.clientId !== record.clientId)]);
    await syncClient(record, "Ready for Scheduling", rbt.name);
    toast.success(`${rbt.name} assigned`, { description: `${record.clientName} is ready for scheduling.` });
  }

  async function setStatus(record: StaffingRecord, status: StaffingStatus) {
    const extra = status === "No Match Available" ? { alerts: Array.from(new Set([...record.alerts, "No RBT match available", "Region capacity gap"])), tasks: [{ id: `task-${Date.now()}`, title: "Escalate regional capacity gap", owner: "State Director", due: "Today", completed: false }, ...record.tasks], nextAction: "Escalate to State Director" } : {};
    patchRecord(record.id, { status, ...extra }, `Status changed to ${status}`);
    await syncClient(record, status);
    toast.success(`Moved to ${status}`);
  }

  function escalationReasonFor(record: StaffingRecord): z.infer<typeof escalationReasonSchema> | null {
    if (record.daysWaiting > 7) return "WAITING_OVER_7_DAYS";
    if (record.status === "No Match Available" || record.alerts.some((alert) => alert.includes("No RBT") || alert.includes("No match"))) return "NO_RBT_MATCH";
    if (record.alerts.some((alert) => alert.includes("capacity gap"))) return "REGIONAL_CAPACITY_GAP";
    return null;
  }

  function escalate(record: StaffingRecord) {
    const reason = escalationReasonFor(record);
    const parsedReason = escalationReasonSchema.safeParse(reason);
    if (!parsedReason.success) {
      toast.error("Escalation blocked", { description: "Escalations require either waiting over 7 days or no RBT match available." });
      return;
    }
    const reasonLabel = escalationReasonLabels[parsedReason.data];
    patchRecord(record.id, {
      urgency: "Critical",
      alerts: Array.from(new Set([...record.alerts, "Escalated to Operations leadership", reasonLabel])),
      nextAction: "Leadership escalation review",
      tasks: [{ id: `task-${Date.now()}`, title: `Leadership review: ${reasonLabel}`, owner: "Operations leadership", due: "Today", completed: false }, ...record.tasks],
      communications: [{ id: `com-${Date.now()}`, channel: "Leadership Escalation", note: `Escalated with reason code ${parsedReason.data}: ${reasonLabel}.`, at: "Just now", owner: record.owner }, ...record.communications],
    }, `Escalation task created for Operations leadership · ${parsedReason.data}`);
    toast.success("Escalation created", { description: reasonLabel });
  }

  function addNote(record: StaffingRecord) {
    if (!note.trim()) return;
    patchRecord(record.id, { communications: [{ id: `com-${Date.now()}`, channel: "Internal Note", note, at: "Just now", owner: record.owner }, ...record.communications] }, "Note added");
    setNote("");
    toast.success("Note added");
  }

  function openRecord(record: StaffingRecord) {
    setSelectedId(record.id);
    setSideOpen(true);
  }

  function exportCsv() {
    const header = ["Client", "State", "Clinic", "Required Hours", "Status", "Owner", "Assigned RBT", "Match Score", "Days Waiting", "Urgency"];
    const rows = filteredRecords.map((r) => [r.clientName, r.state, r.clinic, r.requiredHours, r.status, r.owner, rbts.find((x) => x.id === r.assignedRbtId)?.name ?? "", r.matchScore, r.daysWaiting, r.urgency]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "blossom-staffing-workspace.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success("Staffing export downloaded");
  }

  function validateBulkSelection() {
    const parsed = bulkSelectionSchema.safeParse(checked);
    if (!parsed.success) {
      toast.error("Bulk edit blocked", { description: parsed.error.issues[0]?.message ?? "Select valid staffing records first." });
      return null;
    }
    return parsed.data;
  }

  function bulkUpdateStatus(status: string) {
    const ids = validateBulkSelection();
    const parsedStatus = staffingStatusSchema.safeParse(status);
    if (!ids || !parsedStatus.success) {
      if (!parsedStatus.success) toast.error("Bulk status update blocked", { description: parsedStatus.error.issues[0]?.message });
      return;
    }
    const selectedRecords = records.filter((record) => ids.includes(record.id));
    const blocked = selectedRecords.filter((record) => parsedStatus.data === "Ready for Scheduling" && !record.assignedRbtId);
    if (blocked.length) {
      toast.error("Status update blocked", { description: `${blocked.length} selected clients need an assigned RBT before Ready for Scheduling.` });
      return;
    }
    const alertText = parsedStatus.data === "No Match Available" ? "No RBT match available" : parsedStatus.data === "Restaffing Needed" ? "Restaffing urgent" : "Bulk status updated";
    setRecords((current) => current.map((record) => ids.includes(record.id) ? {
      ...record,
      status: parsedStatus.data,
      urgency: ["No Match Available", "Restaffing Needed"].includes(parsedStatus.data) ? "Critical" : record.urgency,
      alerts: Array.from(new Set([...record.alerts, alertText])),
      nextAction: parsedStatus.data === "No Match Available" ? "Escalate regional capacity gap" : parsedStatus.data === "Matching in Progress" ? "Compare RBT matches" : record.nextAction,
      timeline: [{ id: `tl-${Date.now()}-${record.id}`, event: `Bulk status updated to ${parsedStatus.data}`, at: "Just now", owner: "Staffing OS" }, ...record.timeline],
    } : record));
    toast.success(`${ids.length} records updated`, { description: `Status set to ${parsedStatus.data}; affected records were flagged for review.` });
    setChecked([]);
  }

  function bulkAssignOwner(owner: string) {
    const ids = validateBulkSelection();
    const parsedOwner = staffingOwnerSchema.safeParse(owner);
    if (!ids || !parsedOwner.success) {
      if (!parsedOwner.success) toast.error("Bulk owner update blocked", { description: parsedOwner.error.issues[0]?.message });
      return;
    }
    setRecords((current) => current.map((record) => ids.includes(record.id) ? {
      ...record,
      owner: parsedOwner.data,
      alerts: record.owner === "" ? Array.from(new Set([...record.alerts, "Staffing owner assigned"])) : record.alerts,
      timeline: [{ id: `tl-${Date.now()}-${record.id}`, event: `Bulk assigned to ${parsedOwner.data}`, at: "Just now", owner: "Staffing OS" }, ...record.timeline],
    } : record));
    toast.success(`${ids.length} records assigned`, { description: `Staffing owner set to ${parsedOwner.data}.` });
  }

  const MiniCard = ({ label, value, mode, filter }: typeof kpis[number]) => (
    <button onClick={() => { setViewMode(mode); setFilters((f) => ({ ...f, status: filter })); }} className="rounded-xl border border-border/60 bg-card px-3 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </button>
  );

  const RecordRow = ({ record }: { record: StaffingRecord }) => {
    const suggested = rbts.find((r) => r.id === record.suggestedRbtId);
    const assigned = rbts.find((r) => r.id === record.assignedRbtId);
    return (
      <tr className="border-b border-border/40 transition-colors hover:bg-muted/25" onClick={() => openRecord(record)}>
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={checked.includes(record.id)} onCheckedChange={(v) => setChecked((current) => v ? [...current, record.id] : current.filter((id) => id !== record.id))} /></td>
        <td className="px-3 py-3"><div className="font-medium text-foreground">{record.clientName}</div><div className="text-[11px] text-muted-foreground">{record.serviceType} · {record.location}</div></td>
        <td className="px-3 py-3 text-muted-foreground">{record.state}</td>
        <td className="px-3 py-3 text-muted-foreground">{record.clinic}</td>
        <td className="px-3 py-3 text-muted-foreground">{record.requiredHours}h</td>
        <td className="px-3 py-3 text-muted-foreground">{record.availability.join(", ")}</td>
        <td className="px-3 py-3"><StatusBadge status={record.status} variant={statusVariant(record.status)} /></td>
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><Select value={record.owner} onValueChange={(owner) => patchRecord(record.id, { owner }, "Owner changed")}><SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger><SelectContent>{owners.filter((o) => o !== "All").map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></td>
        <td className="px-3 py-3 text-muted-foreground">{assigned?.name ?? "—"}</td>
        <td className="px-3 py-3 text-muted-foreground">{suggested?.name ?? "—"}</td>
        <td className="px-3 py-3"><span className="font-semibold text-foreground">{record.matchScore}%</span></td>
        <td className={cn("px-3 py-3 font-medium", record.daysWaiting > 7 ? "text-destructive" : record.daysWaiting > 3 ? "text-warning" : "text-muted-foreground")}>{record.daysWaiting}d</td>
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><Select value={record.urgency} onValueChange={(urgency) => patchRecord(record.id, { urgency: urgency as Urgency }, "Urgency changed")}><SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger><SelectContent>{urgencyOptions.filter((u) => u !== "All").map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></td>
        <td className="px-3 py-3 text-muted-foreground">{record.nextAction}</td>
        <td className="px-3 py-3"><div className="flex max-w-48 flex-wrap gap-1">{record.alerts.slice(0, 2).map((a) => <StatusBadge key={a} status={a} variant={a.includes("7") || a.includes("No") || a.includes("urgent") ? "destructive" : "warning"} />)}</div></td>
      </tr>
    );
  };

  return (
    <PageShell
      title="Staffing"
      description="Match RBTs to clients, manage capacity, resolve restaffing, and prepare cases for scheduling."
      icon={UserPlus}
      actions={<div className="flex flex-wrap items-center gap-2"><Button size="sm"><Plus className="mr-1.5 h-4 w-4" />New Staffing Request</Button><Button size="sm" variant="outline" disabled={!checked.length}>Bulk Actions</Button><Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />Export</Button><Button size="sm" variant="outline">Saved Views</Button><Button size="sm" variant="outline" onClick={() => setViewMode("coverage")}>Capacity Map</Button><Button size="sm" variant="outline" onClick={() => setViewMode("capacity")}>RBT Directory</Button></div>}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1"><Search className="absolute z-10 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client, RBT, BCBA, owner, clinic..." className="pl-9" /></div>
            {[['state', states], ['clinic', clinics], ['owner', owners], ['status', statusOptions], ['urgency', urgencyOptions], ['rbt', rbtNames], ['bcba', ['All', ...bcbaNames]], ['region', regions], ['availability', ['All', 'Morning', 'Afternoon', 'Evening']], ['compliance', ['All', 'Ready', 'Needs Review', 'Incomplete']]].map(([key, values]) => (
              <Select key={key as string} value={filters[key as keyof typeof filters]} onValueChange={(value) => setFilters((f) => ({ ...f, [key as string]: value }))}>
                <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder={String(key)} /></SelectTrigger>
                <SelectContent>{(values as string[]).map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            ))}
            <Button variant="outline" size="sm" className="h-9"><Filter className="mr-1.5 h-4 w-4" />Filters</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {viewModes.map((mode) => <button key={mode.id} onClick={() => setViewMode(mode.id)} className={cn("inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors", viewMode === mode.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground")}><mode.icon className="h-4 w-4" />{mode.label}</button>)}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">{kpis.map((kpi) => <MiniCard key={kpi.label} {...kpi} />)}</div>

        {capacityFocusKey && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3"><div><p className="text-sm font-semibold text-foreground">Capacity focus active</p><p className="text-xs text-muted-foreground">Filtered to {filters.region}; unstaffed clients and coverage gaps are highlighted.</p></div><Button size="sm" variant="outline" onClick={() => { setCapacityFocusKey(null); setFilters((f) => ({ ...f, state: "All", region: "All", clinic: "All" })); }}>Clear capacity focus</Button></div>}

        {checked.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3"><span className="text-sm font-medium text-foreground">{checked.length} selected</span><Select onValueChange={bulkAssignOwner}><SelectTrigger className="h-8 w-48"><SelectValue placeholder="Assign staffing owner" /></SelectTrigger><SelectContent>{owners.filter((o) => o !== "All").map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><Select onValueChange={bulkUpdateStatus}><SelectTrigger className="h-8 w-52"><SelectValue placeholder="Update staffing status" /></SelectTrigger><SelectContent>{statusOptions.filter((status) => status !== "All").map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("Matching in Progress")}>Mark Matching</Button><Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("No Match Available")}>Mark No Match</Button><Button size="sm" variant="ghost" onClick={() => setChecked([])}>Clear</Button></div>}

        {viewMode === "queue" && <div className="space-y-4">{queueGroups.map((group) => { const items = filteredRecords.filter(group.test); return <section key={group.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div><h3 className="font-semibold text-foreground">{group.title}</h3><p className="text-xs text-muted-foreground">{group.description}</p></div><StatusBadge status={`${items.length}`} variant={items.length ? "info" : "muted"} /></div><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-sm"><thead><tr className="border-b border-border/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">{["", "Client", "State / Clinic", "Location", "Required", "Availability", "Owner", "Suggested RBT", "Score", "Days", "Next Action", "Alert", "Quick Action"].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr></thead><tbody>{items.map((record) => { const suggested = rbts.find((r) => r.id === record.suggestedRbtId); return <tr key={record.id} className={cn("border-b border-border/30 hover:bg-muted/25", checked.includes(record.id) && "bg-primary/5", capacityFocusKey === `${record.state}|${record.region}|${record.clinic}` && ["Staffing Needed", "Restaffing Needed", "No Match Available"].includes(record.status) && "bg-destructive/5")} onClick={() => openRecord(record)}><td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={checked.includes(record.id)} onCheckedChange={(v) => setChecked((current) => v ? Array.from(new Set([...current, record.id])) : current.filter((id) => id !== record.id))} /></td><td className="px-4 py-3"><div className="font-medium text-foreground">{record.clientName}</div><div className="text-[11px] text-muted-foreground">{record.bcba}</div></td><td className="px-4 py-3 text-muted-foreground">{record.state} · {record.clinic}</td><td className="px-4 py-3 text-muted-foreground">{record.serviceType} · {record.location}</td><td className="px-4 py-3 text-muted-foreground">{record.requiredHours}h</td><td className="px-4 py-3 text-muted-foreground">{record.availability.join(", ")}</td><td className="px-4 py-3 text-muted-foreground">{record.owner}</td><td className="px-4 py-3 text-muted-foreground">{suggested?.name ?? "—"}</td><td className="px-4 py-3 font-semibold text-foreground">{record.matchScore}%</td><td className={cn("px-4 py-3 font-medium", record.daysWaiting > 7 ? "text-destructive" : record.daysWaiting > 3 ? "text-warning" : "text-muted-foreground")}>{record.daysWaiting}d</td><td className="px-4 py-3 text-muted-foreground">{record.nextAction}</td><td className="px-4 py-3">{record.alerts[0] ? <StatusBadge status={record.alerts[0]} variant={record.alerts[0].includes("7") || record.alerts[0].includes("No") ? "destructive" : "warning"} /> : <span className="text-muted-foreground">—</span>}</td><td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><div className="flex gap-1"><Button size="sm" variant="outline" className="h-8" onClick={() => { setSelectedId(record.id); setViewMode("matching"); }}>Open Match</Button>{suggested && <Button size="sm" className="h-8" onClick={() => assignRbt(record, suggested)}>Assign</Button>}<Button size="sm" variant="ghost" className="h-8" onClick={() => setStatus(record, "No Match Available")}>No Match</Button><Button size="sm" variant="ghost" className="h-8" onClick={() => escalate(record)}>Escalate</Button></div></td></tr>; })}</tbody></table>{items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No records in this queue.</p>}</div></section>; })}</div>}

        {viewMode === "table" && <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-sm"><thead><tr className="border-b border-border/50 bg-muted/20 text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3"><Checkbox checked={checked.length === filteredRecords.length && filteredRecords.length > 0} onCheckedChange={(v) => setChecked(v ? filteredRecords.map((r) => r.id) : [])} /></th>{["clientName", "state", "clinic", "location", "requiredHours", "availability", "status", "owner", "assignedRbtId", "suggestedRbtId", "matchScore", "daysWaiting", "urgency", "nextAction", "alerts"].map((h) => <th key={h} className="px-3 py-3 font-medium"><button onClick={() => setSortKey(h as keyof StaffingRecord)}>{h.replace(/([A-Z])/g, " $1")}</button></th>)}</tr></thead><tbody>{filteredRecords.map((record) => <RecordRow key={record.id} record={record} />)}</tbody></table></div></div>}

        {viewMode === "matching" && selected && <div className="grid gap-4 xl:grid-cols-12"><div className="space-y-4 xl:col-span-4"><div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><h3 className="font-semibold text-foreground">Client Demand</h3><div className="mt-3 space-y-2">{filteredRecords.filter((r) => ["Staffing Needed", "Matching in Progress", "Confirmation Pending", "Restaffing Needed", "No Match Available"].includes(r.status)).map((record) => <button key={record.id} onClick={() => setSelectedId(record.id)} className={cn("w-full rounded-xl border p-3 text-left transition-colors", selected.id === record.id ? "border-primary bg-primary/10" : "border-border/50 bg-background hover:border-primary/40")}><div className="flex items-center justify-between"><span className="font-medium text-foreground">{record.clientName}</span><StatusBadge status={record.urgency} variant={statusVariant(record.urgency)} /></div><p className="mt-1 text-xs text-muted-foreground">{record.state} · {record.clinic} · {record.region}</p><div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>{record.requiredHours} required hrs</span><span>{record.approvedHours} approved hrs</span><span>{record.availability.join(", ")}</span><span>{record.daysWaiting}d waiting</span></div>{record.blockers.length > 0 && <p className="mt-2 text-xs text-destructive">{record.blockers.join(", ")}</p>}</button>)}</div></div><MatchWeightsPanel weights={matchWeights} onChange={setMatchWeights} /></div><div className="xl:col-span-8 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-foreground">Ranked RBT Supply</h3><p className="text-sm text-muted-foreground">{selected.clientName} · {selected.requiredHours}h/week · {selected.availability.join(", ")}</p></div><Button size="sm" variant="outline" onClick={() => setStatus(selected, "Matching in Progress")}><Sparkles className="mr-1.5 h-4 w-4" />Mark Matching</Button></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{rankedMatches(selected).map(({ rbt, score, overlap, available }, index) => <div key={rbt.id} className="rounded-xl border border-border/60 bg-background p-4"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><h4 className="font-semibold text-foreground">{rbt.name}</h4>{index === 0 && <StatusBadge status="Top Match" />}</div><p className="text-xs text-muted-foreground">{rbt.state} · {rbt.region} · {rbt.travelRadius} mi radius</p></div><div className="text-right"><p className="text-2xl font-semibold text-foreground">{score}%</p><p className="text-[11px] text-muted-foreground">weighted score</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Overlap: {overlap.join(", ") || "None"}</span><span>Hours: {rbt.currentHours}/{rbt.maxHours}</span><span>Available: {available}h</span><span>Experience: {rbt.experience}</span><span>Compliance: {rbt.compliance}</span><span>Training: {rbt.training}</span></div><div className="mt-3 rounded-lg border border-border/50 bg-muted/20 p-3"><p className="text-xs font-semibold text-foreground">Match score breakdown</p><div className="mt-2 space-y-2">{matchBreakdown(selected, rbt).map((part) => <div key={part.label}><div className="mb-1 flex items-center justify-between gap-2 text-[11px]"><span className="font-medium text-foreground">{part.label}</span><span className="text-muted-foreground">{part.value}/{part.max} · weight {part.weight}% · {part.note}</span></div><Progress value={(part.value / part.max) * 100} className="h-1.5" /></div>)}</div></div><Progress value={(rbt.currentHours / rbt.maxHours) * 100} className="mt-3 h-2" /><div className="mt-3 flex gap-2"><Button size="sm" className="flex-1" onClick={() => assignRbt(selected, rbt)}>Assign</Button><Button size="sm" variant="outline" onClick={() => patchRecord(selected.id, { alerts: [...selected.alerts, `${rbt.name} rejected for match`] }, `${rbt.name} rejected`)}>Reject</Button><Button size="sm" variant="outline" onClick={() => patchRecord(selected.id, { communications: [{ id: `com-${Date.now()}`, channel: "RBT Outreach", note: `Contacted ${rbt.name} about assignment.`, at: "Just now", owner: selected.owner }, ...selected.communications] }, `${rbt.name} contacted`)}><Phone className="h-4 w-4" /></Button></div></div>)}</div></div></div>}

        {viewMode === "capacity" && <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"><table className="w-full min-w-[1100px] text-sm"><thead><tr className="border-b border-border/50 bg-muted/20 text-left text-[11px] uppercase tracking-wide text-muted-foreground">{["RBT", "State", "Region", "Status", "Current", "Max", "Available", "Assigned Clients", "Availability", "Compliance", "Training", "Alerts"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{rbts.map((rbt) => { const available = rbt.maxHours - rbt.currentHours; return <tr key={rbt.id} className="border-b border-border/40 hover:bg-muted/25"><td className="px-4 py-3 font-medium text-foreground">{rbt.name}<div className="text-[11px] text-muted-foreground">{rbt.experience}</div></td><td className="px-4 py-3 text-muted-foreground">{rbt.state}</td><td className="px-4 py-3 text-muted-foreground">{rbt.region}</td><td className="px-4 py-3"><StatusBadge status={rbt.status} variant={statusVariant(rbt.status)} /></td><td className="px-4 py-3 text-muted-foreground">{rbt.currentHours}h</td><td className="px-4 py-3 text-muted-foreground">{rbt.maxHours}h</td><td className="px-4 py-3 font-medium text-foreground">{available}h</td><td className="px-4 py-3 text-muted-foreground">{rbt.assignedClients.join(", ") || "—"}</td><td className="px-4 py-3 text-muted-foreground">{rbt.availability.join(", ")}</td><td className="px-4 py-3"><StatusBadge status={rbt.compliance} variant={statusVariant(rbt.compliance)} /></td><td className="px-4 py-3"><StatusBadge status={rbt.training} variant={statusVariant(rbt.training)} /></td><td className="px-4 py-3">{available <= 0 ? <StatusBadge status="Full/overloaded" variant="destructive" /> : rbt.compliance !== "Ready" ? <StatusBadge status="Compliance incomplete" variant="warning" /> : rbt.training !== "Ready" ? <StatusBadge status="Training incomplete" variant="warning" /> : <StatusBadge status="Ready" variant="success" />}</td></tr>; })}</tbody></table></div>}

        {viewMode === "restaffing" && <div className="grid gap-4 xl:grid-cols-2">{["Urgent Restaffing", "Replacement Match Needed", "Family Notified", "Replacement Assigned", "Back to Scheduling"].map((section) => { const items = filteredRecords.filter((r) => r.status === "Restaffing Needed" || (section === "Replacement Assigned" && r.status === "RBT Assigned") || (section === "Back to Scheduling" && r.status === "Ready for Scheduling")).slice(0, 6); return <section key={section} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><h3 className="font-semibold text-foreground">{section}</h3><div className="mt-3 space-y-2">{items.map((record) => <button key={`${section}-${record.id}`} onClick={() => openRecord(record)} className="w-full rounded-xl border border-border/50 bg-background p-3 text-left hover:border-primary/40"><div className="flex items-center justify-between"><span className="font-medium text-foreground">{record.clientName}</span><StatusBadge status={`${record.daysWaiting}d`} variant={record.daysWaiting > 7 ? "destructive" : "warning"} /></div><p className="mt-1 text-xs text-muted-foreground">Previous: {record.previousRbt ?? rbts.find((r) => r.id === record.assignedRbtId)?.name ?? "—"} · {record.restaffingReason ?? "Replacement needed"}</p><p className="mt-1 text-xs text-muted-foreground">Last service: {record.lastServiceDate ?? "—"} · {record.requiredHours}h · Suggested: {rbts.find((r) => r.id === record.suggestedRbtId)?.name ?? "—"}</p><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" className="h-7" onClick={(e) => { e.stopPropagation(); setSelectedId(record.id); setViewMode("matching"); }}>Open Match</Button><Button size="sm" variant="outline" className="h-7" onClick={(e) => { e.stopPropagation(); patchRecord(record.id, { familyNotified: true }, "Family notified about restaffing"); }}>Notify Family</Button></div></button>)}</div></section>; })}</div>}

        {viewMode === "coverage" && <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div><h3 className="font-semibold text-foreground">Capacity Map</h3><p className="text-xs text-muted-foreground">Click a region to filter staffing queues and surface coverage gaps.</p></div><StatusBadge status={`${coverageRows.filter((row) => row.gap < 0 || row.unstaffed > 0).length} gaps`} variant="warning" /></div><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-border/50 bg-muted/20 text-left text-[11px] uppercase tracking-wide text-muted-foreground">{["State", "Region", "Clinic", "Required Client Hours", "Available RBT Hours", "Assigned Hours", "Gap", "Coverage", "Unstaffed Clients", "Available RBTs"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{coverageRows.map((row) => { const isFocused = capacityFocusKey === `${row.state}|${row.region}|${row.clinic}`; const hasGap = row.gap < 0 || row.unstaffed > 0; return <tr key={`${row.state}-${row.region}-${row.clinic}`} onClick={() => focusCapacityRow(row)} className={cn("cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/25", isFocused && "bg-primary/10", hasGap && !isFocused && "bg-destructive/5")}><td className="px-4 py-3 font-medium text-foreground">{row.state}</td><td className="px-4 py-3 text-muted-foreground">{row.region}</td><td className="px-4 py-3 text-muted-foreground">{row.clinic}</td><td className="px-4 py-3 text-muted-foreground">{row.required}h</td><td className="px-4 py-3 text-muted-foreground">{row.available}h</td><td className="px-4 py-3 text-muted-foreground">{row.assigned}h</td><td className={cn("px-4 py-3 font-semibold", row.gap < 0 ? "text-destructive" : "text-success")}>{row.gap}h</td><td className="px-4 py-3"><div className="flex items-center gap-2"><Progress value={row.coverage} className="h-2 w-24" /><span className="text-xs text-muted-foreground">{row.coverage}%</span></div></td><td className="px-4 py-3">{row.unstaffed > 0 ? <StatusBadge status={`${row.unstaffed} unstaffed`} variant="destructive" /> : <span className="text-muted-foreground">0</span>}</td><td className="px-4 py-3 text-muted-foreground">{row.rbts}</td></tr>; })}</tbody></table></div>}
      </div>

      {selected && <Sheet open={sideOpen} onOpenChange={setSideOpen}><SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl"><SheetHeader className="border-b border-border/60 bg-card p-6 text-left"><div className="flex items-start justify-between gap-4 pr-8"><div><SheetTitle className="text-2xl">{selected.clientName}</SheetTitle><SheetDescription>{selected.state} · {selected.clinic} · {selected.requiredHours} required hours</SheetDescription><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={selected.status} variant={statusVariant(selected.status)} /><StatusBadge status={selected.urgency} variant={statusVariant(selected.urgency)} /><StatusBadge status={`Owner: ${selected.owner}`} variant="muted" />{selectedRbt && <StatusBadge status={`RBT: ${selectedRbt.name}`} variant="success" />}</div></div></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => toast.info("Client record opened in demo context")}>Open Client</Button><Button size="sm" variant="outline" onClick={() => { setViewMode("matching"); setSideOpen(false); }}>Open Matching</Button>{selectedRbt && <Button size="sm" onClick={() => assignRbt(selected, selectedRbt)}>Assign RBT</Button>}<Button size="sm" variant="outline" onClick={() => selectedRbt && patchRecord(selected.id, { communications: [{ id: `com-${Date.now()}`, channel: "RBT Outreach", note: `Contacted ${selectedRbt.name}.`, at: "Just now", owner: selected.owner }, ...selected.communications] }, "RBT contacted")}><MessageSquare className="mr-1.5 h-4 w-4" />Contact RBT</Button><Button size="sm" variant="outline" onClick={() => setStatus(selected, "No Match Available")}>Mark No Match</Button><Button size="sm" variant="outline" onClick={() => escalate(selected)}>Escalate</Button><Button size="sm" variant="outline" onClick={() => patchRecord(selected.id, { tasks: [{ id: `task-${Date.now()}`, title: "Manual staffing follow-up", owner: selected.owner, due: "Tomorrow", completed: false }, ...selected.tasks] }, "Task created")}>Create Task</Button></div></SheetHeader><div className="p-6"><Tabs defaultValue="overview"><TabsList className="grid h-auto w-full grid-cols-4 lg:grid-cols-8"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="matching">Matching</TabsTrigger><TabsTrigger value="availability">Availability</TabsTrigger><TabsTrigger value="rbt">RBT Profile</TabsTrigger><TabsTrigger value="capacity">Capacity</TabsTrigger><TabsTrigger value="communications">Comms</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-4 pt-4"><div className="grid grid-cols-2 gap-3">{[["Current status", selected.status], ["Required hours", `${selected.requiredHours}h`], ["Approved hours", `${selected.approvedHours}h`], ["Assigned RBT", selectedRbt?.name ?? "—"], ["Days waiting", `${selected.daysWaiting}d`], ["Next action", selected.nextAction], ["BCBA", selected.bcba], ["Risk level", selected.urgency]].map(([k, v]) => <div key={k} className="rounded-xl border border-border/50 bg-card p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p><p className="mt-1 font-medium text-foreground">{v}</p></div>)}</div><div className="rounded-xl border border-border/50 bg-card p-4"><h4 className="font-semibold text-foreground">Blockers & Alerts</h4><div className="mt-2 flex flex-wrap gap-2">{[...selected.blockers, ...selected.alerts].map((a) => <StatusBadge key={a} status={a} variant={a.includes("No") || a.includes("7") || a.includes("urgent") ? "destructive" : "warning"} />)}</div></div></TabsContent><TabsContent value="matching" className="space-y-3 pt-4">{rankedMatches(selected).map(({ rbt, score, overlap, available }) => <div key={rbt.id} className="rounded-xl border border-border/50 bg-card p-4"><div className="flex items-center justify-between"><div><p className="font-semibold text-foreground">{rbt.name}</p><p className="text-xs text-muted-foreground">{rbt.region} · {available}h available · overlap {overlap.join(", ") || "None"}</p></div><div className="flex items-center gap-2"><span className="text-lg font-semibold text-foreground">{score}%</span><Button size="sm" onClick={() => assignRbt(selected, rbt)}>Assign</Button><Button size="sm" variant="outline">Reject</Button></div></div></div>)}</TabsContent><TabsContent value="availability" className="pt-4"><div className="rounded-xl border border-border/50 bg-card p-4"><h4 className="font-semibold text-foreground">Client Availability</h4><div className="mt-3 grid grid-cols-5 gap-2">{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => <div key={day} className="rounded-lg border border-border/50 p-2"><p className="text-xs font-medium text-muted-foreground">{day}</p>{["Morning", "Afternoon", "Evening"].map((slot) => <div key={slot} className={cn("mt-2 rounded-md px-2 py-1 text-center text-xs", selected.availability.includes(slot as AvailabilitySlot) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>{slot}</div>)}</div>)}</div><p className="mt-3 text-sm text-muted-foreground">{selected.notes}</p></div></TabsContent><TabsContent value="rbt" className="pt-4">{selectedRbt ? <div className="rounded-xl border border-border/50 bg-card p-4"><h4 className="font-semibold text-foreground">{selectedRbt.name}</h4><div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground"><span>Current: {selectedRbt.currentHours}h</span><span>Max: {selectedRbt.maxHours}h</span><span>Available: {selectedRbt.maxHours - selectedRbt.currentHours}h</span><span>Assigned: {selectedRbt.assignedClients.join(", ") || "—"}</span><span>Compliance: {selectedRbt.compliance}</span><span>Training: {selectedRbt.training}</span><span>Onboarding: {selectedRbt.onboarding}</span><span>Status: {selectedRbt.status}</span></div></div> : <p className="text-sm text-muted-foreground">No RBT selected.</p>}</TabsContent><TabsContent value="capacity" className="pt-4"><div className="rounded-xl border border-border/50 bg-card p-4"><h4 className="font-semibold text-foreground">Regional Supply / Demand</h4>{coverageRows.filter((r) => r.state === selected.state).slice(0, 3).map((row) => <div key={row.region} className="mt-3 rounded-lg bg-muted/30 p-3"><div className="flex justify-between text-sm"><span className="font-medium text-foreground">{row.region}</span><span className={row.gap < 0 ? "text-destructive" : "text-success"}>{row.gap}h gap</span></div><Progress value={row.coverage} className="mt-2 h-2" /></div>)}</div></TabsContent><TabsContent value="communications" className="space-y-3 pt-4"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add RBT outreach, family, BCBA, or internal staffing note..." /><Button size="sm" onClick={() => addNote(selected)}><Send className="mr-1.5 h-4 w-4" />Add Note</Button>{selected.communications.map((c) => <div key={c.id} className="rounded-xl border border-border/50 bg-card p-3"><p className="font-medium text-foreground">{c.channel}</p><p className="text-sm text-muted-foreground">{c.note}</p><p className="mt-1 text-xs text-muted-foreground">{c.at} · {c.owner}</p></div>)}</TabsContent><TabsContent value="tasks" className="space-y-2 pt-4">{selected.tasks.map((t) => <div key={t.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3"><div className="flex items-center gap-2"><Checkbox checked={t.completed} onCheckedChange={() => patchRecord(selected.id, { tasks: selected.tasks.map((task) => task.id === t.id ? { ...task, completed: !task.completed } : task) }, `${t.title} ${t.completed ? "reopened" : "completed"}`)} /><div><p className={cn("font-medium", t.completed ? "text-muted-foreground line-through" : "text-foreground")}>{t.title}</p><p className="text-xs text-muted-foreground">{t.owner} · {t.due}</p></div></div>{t.completed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-warning" />}</div>)}</TabsContent><TabsContent value="timeline" className="space-y-3 pt-4">{selected.timeline.map((item) => <div key={item.id} className="flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-primary" /><div><p className="font-medium text-foreground">{item.event}</p><p className="text-xs text-muted-foreground">{item.at} · {item.owner}</p></div></div>)}{schedulingRecords.filter((s) => s.clientId === selected.clientId).map((s) => <div key={s.id} className="flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-success" /><div><p className="font-medium text-foreground">Scheduling record created: {s.status}</p><p className="text-xs text-muted-foreground">{s.assignedRbt} · {s.requiredHours}h</p></div></div>)}</TabsContent></Tabs></div></SheetContent></Sheet>}
    </PageShell>
  );
}

function MatchWeightsPanel({ weights, onChange }: { weights: MatchWeights; onChange: (weights: MatchWeights) => void }) {
  const items: { key: keyof MatchWeights; label: string; detail: string }[] = [
    { key: "region", label: "Region fit", detail: "State, clinic, and territory proximity" },
    { key: "availability", label: "Availability", detail: "Client/RBT schedule overlap" },
    { key: "compliance", label: "Compliance", detail: "Compliance and training readiness" },
    { key: "capacity", label: "Capacity", detail: "Open hours against required hours" },
  ];
  const update = (key: keyof MatchWeights, value: number[]) => onChange({ ...weights, [key]: value[0] ?? weights[key] });
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Match Weight Controls</h3>
          <p className="text-xs text-muted-foreground">Adjust priorities to re-rank suggested RBTs in real time.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => onChange({ region: 25, availability: 25, compliance: 25, capacity: 25 })}>Reset</Button>
      </div>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs font-medium text-foreground">{item.label}</Label>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{weights[item.key]}%</span>
            </div>
            <Slider value={[weights[item.key]]} min={0} max={60} step={5} onValueChange={(value) => update(item.key, value)} />
            <p className="text-[11px] text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
