// Phase 1 mock data for Blossom OS pages.
// Frontend-only — does not touch Supabase. Replace with live queries in Phase 2.

export interface AcademyTrack {
  id: string;
  name: string;
  description: string;
  courseCount: number;
  estimatedHours: number;
  roles: string[];
  department: string;
  completion: number;
  competencies: string[];
}

export interface BlossomCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  required: boolean;
  estimatedMinutes: number;
  status: "Not Started" | "In Progress" | "Completed";
}

export interface BlossomDepartment {
  id: string;
  name: string;
  owner: string;
  description: string;
  memberCount: number;
  trainings: number;
  resources: number;
  systems: string[];
}

export interface BlossomLocation {
  id: string;
  name: string;
  type: "State" | "Clinic";
  state: string;
  address?: string;
  staffCount: number;
  trainings: number;
  compliance: string[];
}

export interface BlossomUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  state: string;
  location: string;
  manager: string;
  status: "Active" | "Inactive" | "On Leave";
  assignedTracks: number;
  assignedCourses: number;
  completedCourses: number;
  certifications: number;
  competencies: number;
  credits: number;
  lastActive: string;
  trainingStatus: "On Track" | "Behind" | "Complete";
}

export interface BlossomReport {
  id: string;
  title: string;
  description: string;
  category: "Training" | "Certification" | "Activity" | "Compliance";
}

export const academyTracks: AcademyTrack[] = [
  { id: "intake", name: "Intake Academy", description: "Master the full client intake lifecycle from inquiry to VOB completion.", courseCount: 12, estimatedHours: 14, roles: ["Intake", "Coordinator"], department: "Intake", completion: 64, competencies: ["Lead Triage", "Insurance Verification", "Family Communication"] },
  { id: "authorizations", name: "Authorizations Academy", description: "End-to-end authorization workflows, payor portals, and reauthorization cadence.", courseCount: 9, estimatedHours: 11, roles: ["Auth Team", "BCBA"], department: "Authorizations", completion: 38, competencies: ["Initial Auth", "Treatment Auth", "Reauth Management"] },
  { id: "staffing", name: "Staffing Academy", description: "Capacity planning, RBT-client matching, and case staffing strategy.", courseCount: 8, estimatedHours: 10, roles: ["Staffing"], department: "Staffing", completion: 0, competencies: ["Match Logic", "Capacity Forecasting"] },
  { id: "qa", name: "QA Academy", description: "Documentation review, audit standards, and clinical quality assurance.", courseCount: 11, estimatedHours: 13, roles: ["QA", "BCBA"], department: "QA", completion: 22, competencies: ["Audit Workflow", "Note Quality", "Compliance Review"] },
  { id: "scheduling", name: "Scheduling Academy", description: "CentralReach scheduling, conflict resolution, and weekly forecasting.", courseCount: 7, estimatedHours: 8, roles: ["Scheduling"], department: "Scheduling", completion: 51, competencies: ["Schedule Build", "Conflict Resolution"] },
  { id: "state-director", name: "State Director Academy", description: "Multi-clinic oversight, regional KPIs, and director-level decision making.", courseCount: 14, estimatedHours: 18, roles: ["State Director"], department: "Leadership", completion: 0, competencies: ["Regional KPIs", "Clinic Oversight", "Strategic Planning"] },
  { id: "clinic-ops", name: "Clinic Operations Academy", description: "Day-to-day clinic management, parent relations, and operational excellence.", courseCount: 10, estimatedHours: 12, roles: ["Clinic Director"], department: "Clinics", completion: 78, competencies: ["Daily Operations", "Parent Relations", "Staff Management"] },
  { id: "leadership", name: "Leadership Academy", description: "Executive thinking, team development, and Blossom leadership principles.", courseCount: 16, estimatedHours: 22, roles: ["Exec", "Manager"], department: "Leadership", completion: 12, competencies: ["Coaching", "Strategic Thinking", "Communication"] },
  { id: "systems", name: "Systems Academy", description: "Master every Blossom internal system, integration, and admin workflow.", courseCount: 13, estimatedHours: 16, roles: ["Admin", "Systems"], department: "Systems", completion: 45, competencies: ["CR Admin", "Monday Admin", "Blossom OS"] },
];

export const blossomCourses: BlossomCourse[] = [
  { id: "c1", title: "HIPAA Foundations", description: "PHI handling, breach response, and compliance basics.", category: "Compliance", department: "All", required: true, estimatedMinutes: 45, status: "Completed" },
  { id: "c2", title: "CentralReach Essentials", description: "Navigation, scheduling, and documentation in CR.", category: "CentralReach", department: "All", required: true, estimatedMinutes: 60, status: "In Progress" },
  { id: "c3", title: "Monday.com for Operations", description: "Boards, automations, and project workflows.", category: "Monday.com", department: "Operations", required: false, estimatedMinutes: 35, status: "Not Started" },
  { id: "c4", title: "Viventium Payroll Basics", description: "Time entry, approvals, and pay period close.", category: "Viventium", department: "HR", required: false, estimatedMinutes: 40, status: "Not Started" },
  { id: "c5", title: "Bloom Growth Rhythm", description: "Quarterly planning and weekly L10 cadence.", category: "Bloom Growth", department: "Leadership", required: false, estimatedMinutes: 50, status: "Not Started" },
  { id: "c6", title: "Microsoft Teams Best Practices", description: "Channels, meetings, and async communication.", category: "Teams", department: "All", required: true, estimatedMinutes: 30, status: "Completed" },
  { id: "c7", title: "ABA Foundations for Operations", description: "Clinical context every operations team member needs.", category: "ABA Foundations", department: "Operations", required: true, estimatedMinutes: 75, status: "In Progress" },
  { id: "c8", title: "Parent Communication Standards", description: "Tone, cadence, and escalation paths.", category: "Parent Communication", department: "Clinics", required: true, estimatedMinutes: 40, status: "Not Started" },
  { id: "c9", title: "Documentation Quality Standards", description: "Session notes, soap format, and audit readiness.", category: "Documentation", department: "Clinical", required: true, estimatedMinutes: 55, status: "Not Started" },
  { id: "c10", title: "First-Time Manager Toolkit", description: "Coaching, feedback, and performance conversations.", category: "Leadership Training", department: "Leadership", required: false, estimatedMinutes: 90, status: "Not Started" },
];

export const blossomDepartments: BlossomDepartment[] = [
  { id: "intake", name: "Intake", owner: "Sarah Kim", description: "First touchpoint for every prospective family.", memberCount: 6, trainings: 12, resources: 18, systems: ["CentralReach", "Monday"] },
  { id: "authorizations", name: "Authorizations", owner: "Marcus Webb", description: "Insurance authorizations and reauthorization cadence.", memberCount: 5, trainings: 9, resources: 14, systems: ["Payor Portals", "CR"] },
  { id: "scheduling", name: "Scheduling", owner: "Dana Pierce", description: "Weekly schedule build and capacity planning.", memberCount: 4, trainings: 7, resources: 10, systems: ["CentralReach"] },
  { id: "staffing", name: "Staffing", owner: "Priya Patel", description: "RBT-client matching and case capacity.", memberCount: 4, trainings: 8, resources: 11, systems: ["CR", "Monday"] },
  { id: "qa", name: "QA", owner: "Jordan Hayes", description: "Documentation audit and clinical quality assurance.", memberCount: 3, trainings: 11, resources: 16, systems: ["CR", "Audit Tools"] },
  { id: "clinics", name: "Clinics", owner: "Multiple Directors", description: "Clinic operations across all locations.", memberCount: 42, trainings: 10, resources: 22, systems: ["CR", "Monday", "Teams"] },
  { id: "training", name: "Training", owner: "Avery Lin", description: "Operations Academy and Blossom Training program.", memberCount: 3, trainings: 14, resources: 30, systems: ["Blossom OS"] },
  { id: "hr", name: "Human Resources", owner: "Reese Cooper", description: "People operations, benefits, and employee experience.", memberCount: 5, trainings: 9, resources: 24, systems: ["Viventium", "Blossom HR"] },
  { id: "recruiting", name: "Recruiting", owner: "Sam Ortiz", description: "RBT and BCBA pipeline development.", memberCount: 3, trainings: 6, resources: 12, systems: ["ATS", "Indeed"] },
  { id: "payroll", name: "Payroll", owner: "Jamie Brooks", description: "Bi-weekly payroll runs and timesheet reconciliation.", memberCount: 2, trainings: 5, resources: 9, systems: ["Viventium"] },
  { id: "finance", name: "Finance", owner: "Taylor Reed", description: "Revenue, AR, and financial reporting.", memberCount: 3, trainings: 7, resources: 11, systems: ["QuickBooks", "CR Billing"] },
  { id: "marketing", name: "Marketing", owner: "Robin Vega", description: "Brand, family acquisition, and community outreach.", memberCount: 2, trainings: 4, resources: 8, systems: ["HubSpot"] },
  { id: "systems", name: "Systems", owner: "Alex Chen", description: "Internal tooling, integrations, and Blossom OS.", memberCount: 2, trainings: 13, resources: 19, systems: ["Blossom OS", "Lovable"] },
  { id: "state-directors", name: "State Directors", owner: "Regional Leadership", description: "State-level oversight and regional strategy.", memberCount: 4, trainings: 14, resources: 20, systems: ["All"] },
  { id: "case-managers", name: "Case Managers", owner: "BCBA Lead", description: "Clinical case oversight across active clients.", memberCount: 12, trainings: 11, resources: 17, systems: ["CR"] },
  { id: "behavioral", name: "Behavioral", owner: "Clinical Director", description: "BCBAs and RBTs delivering direct service.", memberCount: 84, trainings: 16, resources: 28, systems: ["CR"] },
];

export const blossomLocations: BlossomLocation[] = [
  { id: "ga", name: "Georgia", type: "State", state: "GA", staffCount: 62, trainings: 12, compliance: ["State Medicaid", "BCBA License"] },
  { id: "nc", name: "North Carolina", type: "State", state: "NC", staffCount: 24, trainings: 10, compliance: ["State Medicaid"] },
  { id: "tn", name: "Tennessee", type: "State", state: "TN", staffCount: 18, trainings: 9, compliance: ["TennCare"] },
  { id: "va", name: "Virginia", type: "State", state: "VA", staffCount: 21, trainings: 11, compliance: ["DMAS"] },
  { id: "md", name: "Maryland", type: "State", state: "MD", staffCount: 15, trainings: 10, compliance: ["MDH"] },
  { id: "peachtree", name: "Peachtree Corners Clinic", type: "Clinic", state: "GA", address: "5575 Peachtree Pkwy, Peachtree Corners, GA", staffCount: 28, trainings: 14, compliance: ["Fire Safety", "HIPAA"] },
  { id: "riverdale", name: "Riverdale Clinic", type: "Clinic", state: "GA", address: "Riverdale, GA", staffCount: 22, trainings: 14, compliance: ["Fire Safety", "HIPAA"] },
];

export const blossomUsers: BlossomUser[] = [
  { id: "u1", name: "Sarah Kim", email: "sarah.kim@blossomaba.com", role: "Intake Lead", department: "Intake", state: "GA", location: "Peachtree Corners", manager: "Avery Lin", status: "Active", assignedTracks: 2, assignedCourses: 14, completedCourses: 11, certifications: 3, competencies: 8, credits: 42, lastActive: "2h ago", trainingStatus: "On Track" },
  { id: "u2", name: "Marcus Webb", email: "marcus.webb@blossomaba.com", role: "Auth Specialist", department: "Authorizations", state: "GA", location: "Remote", manager: "Avery Lin", status: "Active", assignedTracks: 1, assignedCourses: 9, completedCourses: 4, certifications: 1, competencies: 3, credits: 18, lastActive: "1d ago", trainingStatus: "Behind" },
  { id: "u3", name: "Dana Pierce", email: "dana.pierce@blossomaba.com", role: "Scheduler", department: "Scheduling", state: "NC", location: "Remote", manager: "Avery Lin", status: "Active", assignedTracks: 1, assignedCourses: 7, completedCourses: 7, certifications: 2, competencies: 5, credits: 28, lastActive: "30m ago", trainingStatus: "Complete" },
  { id: "u4", name: "Priya Patel", email: "priya.patel@blossomaba.com", role: "Staffing Manager", department: "Staffing", state: "VA", location: "Remote", manager: "Avery Lin", status: "Active", assignedTracks: 2, assignedCourses: 12, completedCourses: 6, certifications: 2, competencies: 4, credits: 24, lastActive: "5h ago", trainingStatus: "On Track" },
  { id: "u5", name: "Jordan Hayes", email: "jordan.hayes@blossomaba.com", role: "QA Reviewer", department: "QA", state: "GA", location: "Peachtree Corners", manager: "Clinical Director", status: "Active", assignedTracks: 2, assignedCourses: 11, completedCourses: 8, certifications: 4, competencies: 7, credits: 36, lastActive: "10m ago", trainingStatus: "On Track" },
  { id: "u6", name: "Reese Cooper", email: "reese.cooper@blossomaba.com", role: "HR Director", department: "HR", state: "GA", location: "Peachtree Corners", manager: "CEO", status: "Active", assignedTracks: 3, assignedCourses: 18, completedCourses: 16, certifications: 5, competencies: 11, credits: 58, lastActive: "1h ago", trainingStatus: "On Track" },
  { id: "u7", name: "Sam Ortiz", email: "sam.ortiz@blossomaba.com", role: "Recruiter", department: "Recruiting", state: "TN", location: "Remote", manager: "Reese Cooper", status: "On Leave", assignedTracks: 1, assignedCourses: 6, completedCourses: 2, certifications: 1, competencies: 2, credits: 9, lastActive: "2w ago", trainingStatus: "Behind" },
  { id: "u8", name: "Alex Chen", email: "alex.chen@blossomaba.com", role: "Systems Admin", department: "Systems", state: "GA", location: "Remote", manager: "CEO", status: "Active", assignedTracks: 2, assignedCourses: 13, completedCourses: 12, certifications: 3, competencies: 9, credits: 48, lastActive: "Just now", trainingStatus: "On Track" },
];

export const blossomReports: BlossomReport[] = [
  { id: "r1", title: "Training Completion by Department", description: "Roll-up of completion percentages across every Blossom department.", category: "Training" },
  { id: "r2", title: "Training Completion by Location", description: "State and clinic-level completion benchmarks.", category: "Training" },
  { id: "r3", title: "Overdue Trainings", description: "Active assignments past due, grouped by employee and manager.", category: "Compliance" },
  { id: "r4", title: "Certifications Issued", description: "Certificates earned across all programs in the selected period.", category: "Certification" },
  { id: "r5", title: "Competency Completion", description: "Competencies achieved by track and by department.", category: "Certification" },
  { id: "r6", title: "Course Activity Log", description: "Granular activity per learner — opens, attempts, time spent.", category: "Activity" },
  { id: "r7", title: "Enrollment Report", description: "All active enrollments by track, course, and assignment date.", category: "Activity" },
  { id: "r8", title: "User Progress Report", description: "Per-employee progress across every assigned learning item.", category: "Activity" },
];
