export type HrState = "GA" | "NC" | "VA" | "TN" | "MD" | "NJ";
export type HrDepartment = "Clinical" | "Intake" | "Authorizations" | "QA" | "Scheduling" | "Clinic Ops" | "Leadership" | "HR / Payroll";
export type HrRole = "RBT" | "BCBA" | "Intake Coordinator" | "Authorization Specialist" | "QA Specialist" | "Scheduler" | "Clinic Manager" | "Director" | "HR Specialist" | "Payroll Specialist";
export type EmployeeStatus = "Pre-Hire" | "Onboarding" | "Training" | "Active" | "Review Due" | "At Risk" | "Inactive" | "Terminated";
export type OnboardingStatus = "Not Started" | "In Progress" | "Missing Docs" | "Ready for Orientation" | "Ready for Assignment" | "Active";
export type TrainingStatus = "Complete" | "In Progress" | "Overdue" | "Not Assigned";
export type ReviewStatus = "Current" | "Due Soon" | "Overdue" | "Completed";
export type TimeClockStatus = "Clean" | "Missing Punch" | "Late Approval" | "Exception";
export type PayrollStatus = "Ready" | "Exception" | "Needs Review";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface HrTask { id: string; title: string; owner: string; dueDate: string; completed: boolean; type: "Training" | "Review" | "Document" | "Payroll" | "Onboarding" | "Communication"; }
export interface HrTraining { name: string; category: "Department" | "State" | "Role" | "Compliance"; status: TrainingStatus; dueDate: string; certificate?: string; }
export interface HrReview { name: string; status: ReviewStatus; dueDate: string; score?: number; bonusEligible?: boolean; notes: string; }
export interface HrDocument { name: string; category: "HR" | "Compliance" | "Signed Form"; status: "Complete" | "Missing" | "Requested" | "Expired"; }
export interface HrTimeEntry { date: string; hours: number; status: TimeClockStatus; note: string; }
export interface HrCommunication { author: string; note: string; date: string; type: "HR" | "Manager" | "Employee"; }
export interface HrTimelineEvent { title: string; date: string; detail: string; }
export interface HrEmployee {
  id: string; employee: string; email: string; role: HrRole; state: HrState; department: HrDepartment; manager: string | null; status: EmployeeStatus;
  onboardingStatus: OnboardingStatus; trainingStatus: TrainingStatus; reviewStatus: ReviewStatus; timeClockStatus: TimeClockStatus; payrollStatus: PayrollStatus;
  startDate: string; stageEnteredAt: string; workload: number; riskLevel: RiskLevel; staffingReady: boolean; nextAction: string;
  onboarding: { viventium: boolean; backgroundCheck: boolean; i9: boolean; orientation: boolean; stateTraining: boolean; centralReach: boolean; complianceDocs: boolean; };
  trainings: HrTraining[]; reviews: HrReview[]; documents: HrDocument[]; timeEntries: HrTimeEntry[]; communications: HrCommunication[]; tasks: HrTask[]; timeline: HrTimelineEvent[];
}

const task = (id: string, title: string, type: HrTask["type"], dueDate = "Today", owner = "HR Ops", completed = false): HrTask => ({ id, title, type, dueDate, owner, completed });
const training = (name: string, status: TrainingStatus, dueDate: string, category: HrTraining["category"] = "Compliance", certificate?: string): HrTraining => ({ name, status, dueDate, category, certificate });
const review = (name: string, status: ReviewStatus, dueDate: string, score: number | undefined, bonusEligible: boolean, notes: string): HrReview => ({ name, status, dueDate, score, bonusEligible, notes });
const doc = (name: string, status: HrDocument["status"], category: HrDocument["category"] = "Compliance"): HrDocument => ({ name, status, category });
const timeEntry = (date: string, hours: number, status: TimeClockStatus, note: string): HrTimeEntry => ({ date, hours, status, note });
const comm = (author: string, note: string, date: string, type: HrCommunication["type"] = "HR"): HrCommunication => ({ author, note, date, type });
const event = (title: string, date: string, detail: string): HrTimelineEvent => ({ title, date, detail });

function employee(base: Omit<HrEmployee, "tasks" | "timeline" | "communications" | "timeEntries"> & { tasks?: HrTask[]; timeline?: HrTimelineEvent[]; communications?: HrCommunication[]; timeEntries?: HrTimeEntry[] }): HrEmployee {
  return {
    ...base,
    tasks: base.tasks ?? [task(`${base.id}-t1`, base.nextAction, "Onboarding", "Today", base.manager ?? "HR Ops")],
    timeline: base.timeline ?? [event("Hired", base.startDate, `${base.employee} joined Blossom ABA.`), event("Current status", base.stageEnteredAt, base.status)],
    communications: base.communications ?? [comm(base.manager ?? "HR Ops", base.nextAction, "Apr 27")],
    timeEntries: base.timeEntries ?? [timeEntry("Apr 26", 7.5, base.timeClockStatus, base.timeClockStatus === "Clean" ? "Approved" : "Needs correction")],
  };
}

export const hrEmployees: HrEmployee[] = [];
