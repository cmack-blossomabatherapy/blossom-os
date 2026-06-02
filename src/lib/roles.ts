// Central role metadata, used by sidebar, invite dialog, team admin, settings.
// Mirrors the app_role enum + role_permissions seed in the database.

export type AppRole =
  | "admin"
  | "exec"
  | "ops_manager"
  | "intake"
  | "auth_team"
  | "qa"
  | "scheduling"
  | "staffing"
  | "clinic"
  | "finance"
  | "hr"
  | "phone_support"
  | "hr_admin"
  | "hr_manager"
  | "recruiting_assistant"
  | "payroll_admin"
  | "state_director"
  | "clinic_director"
  | "dept_manager"
  | "training_admin"
  | "rbt"
  | "bcba"
  | "staff"
  | "hr_admin_assistant"
  | "marketing"
  | "behavioral_support"
  | "viewer";

export interface RoleMeta {
  key: AppRole;
  label: string;
  group: "Leadership" | "Operations" | "Pipeline" | "Service" | "Support" | "People" | "Legacy";
  description: string;
  permissionLevel: "System Admin" | "Full Module Control" | "Edit Scoped" | "View Only";
  scope: string;
  owners: string[];
  owns: string[];
  can: string[];
  cannot?: string[];
}

export const ROLE_META: RoleMeta[] = [
  { key: "admin", label: "Super Admin / Systems", group: "Leadership", description: "Full system control for Systems & Software", permissionLevel: "System Admin", scope: "All sections, all data, all settings", owners: ["Corey"], owns: ["System design", "Permissions", "Workflows", "Automations"], can: ["Access every module", "Manage permissions", "Override anything", "Modify workflows and automations"] },
  { key: "exec", label: "Executive", group: "Leadership", description: "Read everything with limited override access", permissionLevel: "View Only", scope: "Company-wide visibility", owners: ["Chad", "Shira"], owns: ["Business oversight", "Executive decisions"], can: ["View all dashboards", "View clients, employees, finance, HR, and staffing", "Override decisions when needed"], cannot: ["Perform daily operational tasks by default"] },
  { key: "ops_manager", label: "Operations Leadership", group: "Leadership", description: "Full operational control across the business flow", permissionLevel: "Full Module Control", scope: "All operational modules", owners: ["Eli Berman", "Gabi Kaweblum", "Moipa Olentiki", "Jaz Scarponi"], owns: ["Pipeline flow", "Operational queues", "Blocker resolution"], can: ["Move clients across pipeline", "Assign staff", "Override workflows", "Manage queues and blockers"] },
  { key: "intake", label: "Intake Team", group: "Pipeline", description: "Lead to VOB ownership", permissionLevel: "Edit Scoped", scope: "Intake and early pipeline only", owners: ["Aliza", "Michal", "Michelle"], owns: ["Lead → VOB"], can: ["Create leads", "Contact families", "Send forms", "Manage missing information", "Submit to VOB"], cannot: ["Touch staffing", "Touch QA", "Submit authorizations"] },
  { key: "finance", label: "Financial / Benefits", group: "Service", description: "Financial decisions, VOB, payment plans, payroll visibility", permissionLevel: "Full Module Control", scope: "Finance, benefits, VOB, payment plans", owners: ["Gabi"], owns: ["Profitability decisions", "Payment plan decisions"], can: ["Review benefits", "Approve or reject cases", "Create payment plans", "Mark financial status", "Monitor financial tracking"] },
  { key: "auth_team", label: "Authorization Team", group: "Pipeline", description: "Revenue approval and continuity", permissionLevel: "Full Module Control", scope: "Authorization system and mid-pipeline client data", owners: ["Devorah", "Kayla", "Riki", "Miriam", "Rivky"], owns: ["Revenue approval", "Reauth continuity"], can: ["Create auth records", "Submit auths", "Track approvals and denials", "Manage reauth cycles", "Handle missing documents"] },
  { key: "qa", label: "QA Team", group: "Pipeline", description: "Quality and compliance systems", permissionLevel: "Full Module Control", scope: "QA and compliance", owners: ["Rochel", "Amanda", "Julianne", "Anje", "Raizy"], owns: ["Quality", "Compliance", "Treatment plan review"], can: ["Review treatment plans", "Flag issues", "Approve QA", "Monitor notes", "Manage compliance"], cannot: ["Assign staff", "Modify intake"] },
  { key: "staffing", label: "Staffing Team", group: "Operations", description: "Client to RBT match", permissionLevel: "Full Module Control", scope: "Staffing system", owners: ["Sara Uhr", "Hannah", "Surie"], owns: ["Client → RBT match", "Restaffing"], can: ["Match RBTs", "Assign staff", "Manage availability", "Handle restaffing"] },
  { key: "scheduling", label: "Scheduling Team", group: "Operations", description: "Ready to Active ownership", permissionLevel: "Full Module Control", scope: "Scheduling system", owners: ["Daylis", "Hannah (GA)"], owns: ["Ready → Active", "Start date preparation"], can: ["Build schedules", "Set start dates", "Manage CR entry", "Prepare activation"] },
  { key: "clinic", label: "Clinic Team (GA)", group: "Operations", description: "Clinic-specific execution", permissionLevel: "Edit Scoped", scope: "Clinic-specific data only", owners: ["Mordy", "Cymbre", "Jennifer", "Tashika"], owns: ["In-clinic execution", "Daily clinic operations"], can: ["View clinic clients", "Manage clinic schedules", "Track capacity", "Handle daily operations"] },
  { key: "payroll_admin", label: "Finance / Payroll", group: "People", description: "Expense and payout accuracy", permissionLevel: "Full Module Control", scope: "Payroll, hours, bonuses, payment tracking", owners: ["Baila Friedman", "Kaylynne Baker"], owns: ["Expense accuracy", "Payout accuracy"], can: ["View hours", "Process payroll", "Track payment plans", "Monitor revenue"] },
  { key: "hr", label: "HR / People Ops", group: "People", description: "Employee lifecycle ownership", permissionLevel: "Full Module Control", scope: "HR Suite", owners: ["Nikki Goldenberg", "Rochell Coulson"], owns: ["Employee lifecycle", "Training", "Reviews", "Performance"], can: ["Manage employees", "Track onboarding", "Track training", "Track reviews", "Monitor performance"] },
  { key: "recruiting_assistant", label: "Recruiting Team", group: "People", description: "Candidate to Ready RBT", permissionLevel: "Edit Scoped", scope: "Recruiting and onboarding handoff", owners: ["Rochell Coulson", "Surie Goldstein"], owns: ["Candidate → Ready RBT"], can: ["Manage applicants", "Schedule interviews", "Send offers", "Move candidates to onboarding"] },
  { key: "state_director", label: "State Leadership", group: "Leadership", description: "State-level performance ownership", permissionLevel: "Full Module Control", scope: "Everything in assigned state", owners: ["Gary Frank", "Eli Millman", "Levi Garfunkel"], owns: ["State-level performance", "State escalations"], can: ["View all state pipeline", "Resolve issues", "Oversee teams", "Escalate problems"] },
  { key: "phone_support", label: "Phone / Support", group: "Support", description: "Call handling and follow-up support", permissionLevel: "Edit Scoped", scope: "Phone calls, lead linking, follow-ups", owners: ["Support Team"], owns: ["Call follow-up"], can: ["Log calls", "Link calls to leads or clients", "Support intake follow-up"] },
  { key: "hr_admin", label: "HR Admin", group: "People", description: "Advanced People Ops administration", permissionLevel: "Full Module Control", scope: "HR Suite settings and sensitive employee workflows", owners: ["People Ops Admins"], owns: ["HR configuration", "Sensitive HR workflows"], can: ["Manage HR settings", "Manage employees", "Manage training", "Manage documents and reviews"] },
  { key: "hr_manager", label: "HR Manager", group: "People", description: "Employee operations and performance management", permissionLevel: "Full Module Control", scope: "Employee operations", owners: ["People Ops Managers"], owns: ["Reviews", "Cases", "Training", "Time approvals"], can: ["Manage reviews", "Manage cases", "Assign training", "Approve time workflows"] },
  { key: "clinic_director", label: "Clinic Director", group: "Operations", description: "Clinic-scoped leadership", permissionLevel: "Edit Scoped", scope: "Assigned clinic", owners: ["Clinic Directors"], owns: ["Clinic performance"], can: ["View clinic employees", "View clinic clients", "Track schedules and capacity"] },
  { key: "dept_manager", label: "Department Manager", group: "Operations", description: "Department-scoped leadership", permissionLevel: "View Only", scope: "Assigned department", owners: ["Department Managers"], owns: ["Department performance"], can: ["View department employees", "View reviews", "Track training"] },
  { key: "training_admin", label: "Training Admin", group: "People", description: "Manages training assignments, completions, and analytics", permissionLevel: "Full Module Control", scope: "Training Admin module only", owners: ["Designated Training Leads"], owns: ["Training assignments", "Training completion tracking", "Training analytics"], can: ["Assign trainings to any employee", "Track training status and completion", "View training statistics and dashboards", "Manage training catalog"], cannot: ["Access other HR modules", "Edit employee records or payroll"] },
  { key: "rbt", label: "RBT (Registered Behavior Technician)", group: "Service", description: "Direct-care behavior technician — sees the Training Hub experience", permissionLevel: "View Only", scope: "Training Hub + own training/resources", owners: ["RBTs"], owns: ["Own training journey"], can: ["Access the Training Hub", "Complete assigned trainings", "View own resources"], cannot: ["Access other HR modules", "Access general training catalog or admin tools"] },
  { key: "bcba", label: "BCBA (Board Certified Behavior Analyst)", group: "Service", description: "Clinical lead — sees the Training Hub experience tailored to BCBAs", permissionLevel: "View Only", scope: "Training Hub + own training/resources", owners: ["BCBAs"], owns: ["Own training journey", "Clinical mentorship"], can: ["Access the Training Hub", "Complete assigned trainings", "View own resources"], cannot: ["Access other HR modules", "Access general training catalog or admin tools"] },
  { key: "staff", label: "Staff", group: "Legacy", description: "Basic employee access", permissionLevel: "View Only", scope: "Own training, resources, tasks", owners: ["Staff"], owns: ["Own work"], can: ["Complete training", "View resources", "View announcements", "View assigned tasks"] },
  { key: "hr_admin_assistant", label: "HR Admin Assistant (Trainee)", group: "People", description: "New-hire trainee enrolled in the HR Admin Assistant onboarding track. No HR/admin access until graduation.", permissionLevel: "View Only", scope: "Onboarding journey + HR Admin Assistant track only", owners: ["Trainees"], owns: ["Own onboarding journey"], can: ["Complete the Welcome to Blossom journey", "Work through the HR Admin Assistant track", "View own profile and resources"], cannot: ["Access HR module", "Access Admin Hub", "View employee records or payroll"] },
  { key: "marketing", label: "Marketing Team", group: "People", description: "Marketing, growth, and campaign operations", permissionLevel: "Edit Scoped", scope: "Marketing, leads analytics, and growth reports", owners: ["Marketing Team"], owns: ["Campaigns", "Lead analytics", "Growth reports"], can: ["View lead analytics", "Manage campaigns", "View recruiting marketing", "View growth reports"], cannot: ["Access PHI", "Access payroll", "Access clinical notes"] },
  { key: "behavioral_support", label: "Behavioral Support", group: "Service", description: "Senior clinical guidance for BCBAs — reports and training only.", permissionLevel: "View Only", scope: "Reports + Training Academy", owners: ["Behavioral Support Team"], owns: ["Clinical guidance"], can: ["View reports", "Access Training Academy"], cannot: ["Access HR, scheduling, billing, or other operational modules"] },
  { key: "viewer", label: "Viewer", group: "Legacy", description: "Read-only system access", permissionLevel: "View Only", scope: "Read-only across allowed modules", owners: ["Auditors"], owns: ["No workflow ownership"], can: ["See data", "Review dashboards"], cannot: ["Edit records", "Override workflows"] },
];

export const ROLE_LOOKUP: Record<AppRole, RoleMeta> = ROLE_META.reduce(
  (acc, r) => ({ ...acc, [r.key]: r }),
  {} as Record<AppRole, RoleMeta>,
);

export function roleLabel(key: AppRole): string {
  return ROLE_LOOKUP[key]?.label ?? key;
}