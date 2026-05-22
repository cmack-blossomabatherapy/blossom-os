// Mock data for the HR Training Management Center.
// All data is static for now — replace with backend tables later
// (training_journeys, training_modules, training_module_sections,
// training_assignments, training_sops, training_tangos).

export type TrainingStatus = "Draft" | "In Review" | "Published" | "Archived";
export type ModuleType =
  | "SOP"
  | "Workflow"
  | "Tango"
  | "Video"
  | "Quick Guide"
  | "Checklist"
  | "Resource Collection";

export type TrainingCategory =
  | "Operations"
  | "Intake"
  | "Scheduling"
  | "QA"
  | "Authorizations"
  | "Recruiting"
  | "HR"
  | "Clinical"
  | "Leadership"
  | "Systems & Software";

export type RoleKey =
  | "intake"
  | "state_director"
  | "scheduling"
  | "qa"
  | "recruiting"
  | "bcba"
  | "rbt"
  | "authorizations"
  | "hr"
  | "leadership";

export const ROLE_LABEL: Record<RoleKey, string> = {
  intake: "Intake Coordinator",
  state_director: "State Director",
  scheduling: "Scheduling",
  qa: "QA",
  recruiting: "Recruiting",
  bcba: "BCBA",
  rbt: "RBT",
  authorizations: "Authorizations",
  hr: "HR",
  leadership: "Leadership",
};

export type TrainingModule = {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  category: TrainingCategory;
  estimatedMinutes: number;
  required: boolean;
  status: TrainingStatus;
  updatedAt: string; // ISO
  owner: string;
  tags: string[];
};

export type TrainingJourney = {
  id: string;
  title: string;
  description: string;
  role: RoleKey;
  category: TrainingCategory;
  status: TrainingStatus;
  moduleIds: string[];
  assignedCount: number;
  completionPct: number; // average across assignees
  updatedAt: string;
  owner: string;
};

export type TrainingSop = {
  id: string;
  title: string;
  department: TrainingCategory;
  owner: string;
  version: string;
  updatedAt: string;
  linkedModuleIds: string[];
};

export type TrainingTango = {
  id: string;
  title: string;
  url: string;
  linkedModuleId?: string;
  durationMinutes: number;
};

export type TrainingAssignment = {
  id: string;
  trainingId: string; // module or journey id
  trainingTitle: string;
  scope: "role" | "department" | "state" | "employee";
  target: string;
  assigned: number;
  completed: number;
  overdue: number;
  dueDate?: string;
};

const today = new Date();
const daysAgo = (d: number) =>
  new Date(today.getTime() - d * 86400000).toISOString();

export const trainingModules: TrainingModule[] = [
  {
    id: "m_intake_phone",
    title: "Phone Calls & New Leads",
    description:
      "How to take inbound intake calls, log leads, and route to the right team.",
    type: "Workflow",
    category: "Intake",
    estimatedMinutes: 12,
    required: true,
    status: "Published",
    updatedAt: daysAgo(4),
    owner: "Lauren Hart",
    tags: ["intake", "phones", "leads"],
  },
  {
    id: "m_intake_workflow",
    title: "Intake Workflow End-to-End",
    description: "From first contact through VOB and client setup.",
    type: "SOP",
    category: "Intake",
    estimatedMinutes: 22,
    required: true,
    status: "Published",
    updatedAt: daysAgo(11),
    owner: "Lauren Hart",
    tags: ["intake"],
  },
  {
    id: "m_vob_basics",
    title: "VOB Basics",
    description: "How to read benefits, flag risk, and request review.",
    type: "Quick Guide",
    category: "Authorizations",
    estimatedMinutes: 9,
    required: true,
    status: "Published",
    updatedAt: daysAgo(2),
    owner: "Megan O.",
    tags: ["vob", "auths"],
  },
  {
    id: "m_client_setup",
    title: "Client Setup in CentralReach",
    description: "Creating a client record cleanly the first time.",
    type: "Tango",
    category: "Systems & Software",
    estimatedMinutes: 7,
    required: false,
    status: "Published",
    updatedAt: daysAgo(6),
    owner: "Lauren Hart",
    tags: ["centralreach"],
  },
  {
    id: "m_state_ops_rhythm",
    title: "State Operations Rhythm",
    description: "Daily, weekly, and monthly cadence for State Directors.",
    type: "Workflow",
    category: "Leadership",
    estimatedMinutes: 18,
    required: true,
    status: "Published",
    updatedAt: daysAgo(8),
    owner: "Operations",
    tags: ["state director", "rhythm"],
  },
  {
    id: "m_kpi_review",
    title: "KPI Review",
    description: "Reading the scorecard and acting on the deltas.",
    type: "Workflow",
    category: "Leadership",
    estimatedMinutes: 14,
    required: true,
    status: "Published",
    updatedAt: daysAgo(15),
    owner: "Operations",
    tags: ["kpi"],
  },
  {
    id: "m_staffing_mgmt",
    title: "Staffing Management",
    description: "Identifying gaps and reassigning quickly.",
    type: "SOP",
    category: "Scheduling",
    estimatedMinutes: 16,
    required: true,
    status: "Published",
    updatedAt: daysAgo(3),
    owner: "Scheduling",
    tags: ["staffing"],
  },
  {
    id: "m_recruiting_oversight",
    title: "Recruiting Oversight",
    description: "What State Directors review in the recruiting pipeline.",
    type: "Quick Guide",
    category: "Recruiting",
    estimatedMinutes: 8,
    required: false,
    status: "Draft",
    updatedAt: daysAgo(1),
    owner: "Recruiting",
    tags: ["recruiting"],
  },
  {
    id: "m_vob_decision",
    title: "VOB Decision Center",
    description: "Routing VOBs, escalations, and approvals.",
    type: "Workflow",
    category: "Authorizations",
    estimatedMinutes: 12,
    required: true,
    status: "Published",
    updatedAt: daysAgo(5),
    owner: "Megan O.",
    tags: ["vob"],
  },
  {
    id: "m_qa_pr_workflow",
    title: "PR Workflow & QA Review",
    description: "How PRs flow, what QA looks for, and overdue handling.",
    type: "SOP",
    category: "QA",
    estimatedMinutes: 20,
    required: true,
    status: "Published",
    updatedAt: daysAgo(10),
    owner: "QA Lead",
    tags: ["qa", "pr"],
  },
  {
    id: "m_rbt_session_basics",
    title: "RBT Session Basics",
    description: "Starting a session, notes, and parent handoff.",
    type: "Checklist",
    category: "Clinical",
    estimatedMinutes: 10,
    required: true,
    status: "Published",
    updatedAt: daysAgo(20),
    owner: "Clinical",
    tags: ["rbt"],
  },
  {
    id: "m_bcba_supervision",
    title: "BCBA Supervision Rhythm",
    description: "Weekly supervision, documentation, and PR pacing.",
    type: "Workflow",
    category: "Clinical",
    estimatedMinutes: 18,
    required: true,
    status: "Published",
    updatedAt: daysAgo(14),
    owner: "Clinical",
    tags: ["bcba"],
  },
];

export const trainingJourneys: TrainingJourney[] = [
  {
    id: "j_intake",
    title: "Intake Coordinator Journey",
    description:
      "Everything a new Intake Coordinator needs to take calls, run intake, and set up clients confidently.",
    role: "intake",
    category: "Intake",
    status: "Published",
    moduleIds: ["m_intake_phone", "m_intake_workflow", "m_vob_basics", "m_client_setup"],
    assignedCount: 6,
    completionPct: 68,
    updatedAt: daysAgo(4),
    owner: "Lauren Hart",
  },
  {
    id: "j_state_director",
    title: "State Director Journey",
    description: "Operational rhythm and oversight for new State Directors.",
    role: "state_director",
    category: "Leadership",
    status: "Published",
    moduleIds: [
      "m_state_ops_rhythm",
      "m_kpi_review",
      "m_staffing_mgmt",
      "m_recruiting_oversight",
      "m_vob_decision",
    ],
    assignedCount: 4,
    completionPct: 52,
    updatedAt: daysAgo(8),
    owner: "Operations",
  },
  {
    id: "j_scheduling",
    title: "Scheduling Journey",
    description: "Building schedules, resolving conflicts, and pairing staff.",
    role: "scheduling",
    category: "Scheduling",
    status: "Published",
    moduleIds: ["m_staffing_mgmt"],
    assignedCount: 5,
    completionPct: 81,
    updatedAt: daysAgo(3),
    owner: "Scheduling",
  },
  {
    id: "j_qa",
    title: "QA Journey",
    description: "PR workflow, supervision quality, and compliance pacing.",
    role: "qa",
    category: "QA",
    status: "Published",
    moduleIds: ["m_qa_pr_workflow"],
    assignedCount: 3,
    completionPct: 74,
    updatedAt: daysAgo(10),
    owner: "QA Lead",
  },
  {
    id: "j_recruiting",
    title: "Recruiting Journey",
    description: "Intake to interview to offer, with clean handoffs.",
    role: "recruiting",
    category: "Recruiting",
    status: "Draft",
    moduleIds: ["m_recruiting_oversight"],
    assignedCount: 0,
    completionPct: 0,
    updatedAt: daysAgo(1),
    owner: "Recruiting",
  },
  {
    id: "j_bcba",
    title: "BCBA Journey",
    description: "Clinical rhythm, supervision, and documentation flow.",
    role: "bcba",
    category: "Clinical",
    status: "Published",
    moduleIds: ["m_bcba_supervision"],
    assignedCount: 22,
    completionPct: 61,
    updatedAt: daysAgo(14),
    owner: "Clinical",
  },
  {
    id: "j_rbt",
    title: "RBT Journey",
    description: "Session basics, notes, and parent communication.",
    role: "rbt",
    category: "Clinical",
    status: "Published",
    moduleIds: ["m_rbt_session_basics"],
    assignedCount: 48,
    completionPct: 87,
    updatedAt: daysAgo(20),
    owner: "Clinical",
  },
];

export const trainingSops: TrainingSop[] = [
  {
    id: "sop_intake",
    title: "Intake Workflow SOP",
    department: "Intake",
    owner: "Lauren Hart",
    version: "v3.2",
    updatedAt: daysAgo(11),
    linkedModuleIds: ["m_intake_workflow", "m_intake_phone"],
  },
  {
    id: "sop_vob",
    title: "VOB Standard Operating Procedure",
    department: "Authorizations",
    owner: "Megan O.",
    version: "v2.1",
    updatedAt: daysAgo(5),
    linkedModuleIds: ["m_vob_basics", "m_vob_decision"],
  },
  {
    id: "sop_pr",
    title: "PR Review SOP",
    department: "QA",
    owner: "QA Lead",
    version: "v1.8",
    updatedAt: daysAgo(10),
    linkedModuleIds: ["m_qa_pr_workflow"],
  },
  {
    id: "sop_staffing",
    title: "Staffing Coverage SOP",
    department: "Scheduling",
    owner: "Scheduling",
    version: "v2.0",
    updatedAt: daysAgo(3),
    linkedModuleIds: ["m_staffing_mgmt"],
  },
];

export const trainingTangos: TrainingTango[] = [
  {
    id: "tg_cr_setup",
    title: "Client Setup in CentralReach",
    url: "https://app.tango.us/app/workflow/placeholder",
    linkedModuleId: "m_client_setup",
    durationMinutes: 6,
  },
  {
    id: "tg_vob",
    title: "Running a VOB",
    url: "https://app.tango.us/app/workflow/placeholder",
    linkedModuleId: "m_vob_basics",
    durationMinutes: 8,
  },
  {
    id: "tg_scorecard",
    title: "Reviewing the State Scorecard",
    url: "https://app.tango.us/app/workflow/placeholder",
    linkedModuleId: "m_kpi_review",
    durationMinutes: 5,
  },
];

export const trainingAssignments: TrainingAssignment[] = [
  {
    id: "a_1",
    trainingId: "j_intake",
    trainingTitle: "Intake Coordinator Journey",
    scope: "role",
    target: "Intake Coordinator",
    assigned: 6,
    completed: 4,
    overdue: 1,
    dueDate: daysAgo(-14),
  },
  {
    id: "a_2",
    trainingId: "j_state_director",
    trainingTitle: "State Director Journey",
    scope: "role",
    target: "State Director",
    assigned: 4,
    completed: 2,
    overdue: 0,
  },
  {
    id: "a_3",
    trainingId: "m_vob_basics",
    trainingTitle: "VOB Basics",
    scope: "department",
    target: "Authorizations",
    assigned: 9,
    completed: 7,
    overdue: 1,
  },
  {
    id: "a_4",
    trainingId: "j_rbt",
    trainingTitle: "RBT Journey",
    scope: "role",
    target: "RBT",
    assigned: 48,
    completed: 42,
    overdue: 3,
    dueDate: daysAgo(-30),
  },
];

export const trainingCategories: TrainingCategory[] = [
  "Operations",
  "Intake",
  "Scheduling",
  "QA",
  "Authorizations",
  "Recruiting",
  "HR",
  "Clinical",
  "Leadership",
  "Systems & Software",
];

export type TrainingTemplate = {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
};

export const trainingTemplates: TrainingTemplate[] = [
  { id: "tpl_sop", title: "SOP Module", description: "Rich text SOP with checklist.", type: "SOP" },
  { id: "tpl_workflow", title: "Workflow Training", description: "Step-by-step workflow with Tango.", type: "Workflow" },
  { id: "tpl_systems", title: "Systems Tutorial", description: "Tool walkthrough with screenshots.", type: "Tango" },
  { id: "tpl_checklist", title: "Checklist Workflow", description: "Operational checklist module.", type: "Checklist" },
  { id: "tpl_video", title: "Video Guide", description: "Embedded video with summary.", type: "Video" },
];

export function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}