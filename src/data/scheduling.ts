import { mockClients, type Client } from "./clients";

export type SchedulingStatus =
  | "Unscheduled Assessment"
  | "Assessment Scheduled"
  | "Ready to Schedule"
  | "Schedule Built"
  | "Pending Start Date"
  | "Active"
  | "Blocked";

export type Availability = "morning" | "afternoon" | "evening";

export interface RBT {
  id: string;
  name: string;
  state: string;
  clinic: string;
  experience: "Junior" | "Mid" | "Senior";
  capacityHours: number;
  assignedHours: number;
  availability: Availability[];
  schedule: { day: string; start: string; end: string; clientId?: string }[];
}

export interface AssessmentSlot {
  id: string;
  clientId: string;
  clientName: string;
  bcba: string;
  state: string;
  date: string | null;
  time: string | null;
  status: "Unscheduled" | "Scheduled" | "Completed";
  requestDate: string;
}

export const mockRBTs: RBT[] = [
  {
    id: "RBT-001", name: "Taylor S.", state: "GA", clinic: "Peachtree Corners",
    experience: "Senior", capacityHours: 30, assignedHours: 24,
    availability: ["morning", "afternoon"],
    schedule: [
      { day: "Mon", start: "09:00", end: "13:00", clientId: "C-0421" },
      { day: "Wed", start: "09:00", end: "13:00", clientId: "C-0421" },
      { day: "Fri", start: "09:00", end: "13:00", clientId: "C-0421" },
    ],
  },
  {
    id: "RBT-002", name: "Jordan M.", state: "GA", clinic: "Riverdale",
    experience: "Mid", capacityHours: 32, assignedHours: 12,
    availability: ["morning", "afternoon", "evening"],
    schedule: [
      { day: "Tue", start: "14:00", end: "18:00" },
      { day: "Thu", start: "14:00", end: "18:00" },
    ],
  },
  {
    id: "RBT-003", name: "Morgan K.", state: "TX", clinic: "Austin Central",
    experience: "Senior", capacityHours: 35, assignedHours: 30,
    availability: ["morning", "afternoon"],
    schedule: [
      { day: "Mon", start: "08:00", end: "14:00" },
      { day: "Tue", start: "08:00", end: "14:00" },
      { day: "Wed", start: "08:00", end: "14:00" },
    ],
  },
  {
    id: "RBT-004", name: "Casey P.", state: "TX", clinic: "Austin Central",
    experience: "Junior", capacityHours: 25, assignedHours: 0,
    availability: ["afternoon", "evening"],
    schedule: [],
  },
  {
    id: "RBT-005", name: "Riley B.", state: "AZ", clinic: "Phoenix North",
    experience: "Mid", capacityHours: 28, assignedHours: 16,
    availability: ["morning", "evening"],
    schedule: [
      { day: "Mon", start: "16:00", end: "20:00" },
      { day: "Wed", start: "16:00", end: "20:00" },
    ],
  },
  {
    id: "RBT-006", name: "Quinn D.", state: "GA", clinic: "Peachtree Corners",
    experience: "Junior", capacityHours: 20, assignedHours: 0,
    availability: ["morning"],
    schedule: [],
  },
];

export const mockAssessments: AssessmentSlot[] = [
  { id: "A-1", clientId: "C-0510", clientName: "Aiden Patel", bcba: "Dr. Lee", state: "TX", date: null, time: null, status: "Unscheduled", requestDate: "2026-04-12" },
  { id: "A-2", clientId: "C-0511", clientName: "Noah Williams", bcba: "Dr. Kim", state: "TX", date: null, time: null, status: "Unscheduled", requestDate: "2026-04-14" },
  { id: "A-3", clientId: "C-0508", clientName: "Liam Chen", bcba: "Dr. Patel", state: "AZ", date: "2026-04-22", time: "10:00", status: "Scheduled", requestDate: "2026-04-08" },
  { id: "A-4", clientId: "C-0507", clientName: "Olivia Brown", bcba: "Dr. Lee", state: "GA", date: "2026-04-18", time: "14:00", status: "Scheduled", requestDate: "2026-04-05" },
  { id: "A-5", clientId: "C-0512", clientName: "Mason Garcia", bcba: "Dr. Kim", state: "GA", date: "2026-04-20", time: "09:00", status: "Scheduled", requestDate: "2026-04-10" },
];

export type SchedulingClientStatus = {
  client: Client;
  status: SchedulingStatus;
  blockers: string[];
  readinessChecklist: { label: string; done: boolean }[];
};

export const getSchedulingStatus = (c: Client): SchedulingClientStatus => {
  const blockers: string[] = [];
  if (!c.bcba) blockers.push("No BCBA assigned");
  if (c.staffingStatus === "Needed" || c.stage === "Staffing Needed") blockers.push("No RBT assigned");
  if (c.stage === "Pending Treatment Auth") blockers.push("Awaiting auth approval");
  if (!c.assessmentDate && c.stage === "Schedule Assessment") blockers.push("Assessment not scheduled");

  let status: SchedulingStatus = "Ready to Schedule";
  if (c.stage === "Active") status = "Active";
  else if (c.stage === "Pending Start Date") status = "Pending Start Date";
  else if (c.stage === "Schedule Assessment") status = "Unscheduled Assessment";
  else if (c.stage === "Assessment Scheduled") status = "Assessment Scheduled";
  else if (c.schedule.length > 0) status = "Schedule Built";
  if (blockers.length > 0 && status !== "Active") status = "Blocked";

  const readinessChecklist = [
    { label: "BCBA Assigned", done: !!c.bcba },
    { label: "Auth Approved", done: c.authStatus === "Approved" },
    { label: "RBT Assigned", done: !!c.rbt },
    { label: "Schedule Completed", done: c.schedule.length > 0 },
    { label: "Start Date Set", done: !!c.startDate },
  ];

  return { client: c, status, blockers, readinessChecklist };
};

export const schedulingVariant = (s: SchedulingStatus): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<SchedulingStatus, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    "Unscheduled Assessment": "warning",
    "Assessment Scheduled": "info",
    "Ready to Schedule": "info",
    "Schedule Built": "default",
    "Pending Start Date": "warning",
    "Active": "success",
    "Blocked": "destructive",
  };
  return m[s];
};

export const allSchedulingClients = (): SchedulingClientStatus[] =>
  mockClients.map(getSchedulingStatus);

// Suggest matches for an unstaffed client
export const suggestMatches = (client: Client): RBT[] => {
  return mockRBTs
    .filter((r) => r.state === client.state)
    .filter((r) => r.assignedHours < r.capacityHours)
    .sort((a, b) => (b.capacityHours - b.assignedHours) - (a.capacityHours - a.assignedHours))
    .slice(0, 3);
};

export const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
