export type RecruitingState = "GA" | "NC" | "VA" | "TN" | "MD" | "NJ";
export type RecruitingRole = "RBT" | "BCBA";
export type RecruitingSource = "Apploi" | "Indeed" | "Website" | "Email" | "Phone" | "Referral";
export type CandidateStage = "New Applicant" | "Screening" | "Interview Scheduled" | "Interview Completed" | "Offer Sent" | "Offer Accepted" | "Onboarding Handoff" | "Background Check" | "Orientation" | "Training" | "Ready for Staffing" | "Not Qualified";
export type InterviewStatus = "Not Scheduled" | "Scheduled" | "Today" | "Completed" | "Needs Outcome" | "No-Show";
export type OfferStatus = "Not Sent" | "Sent" | "Unsigned" | "Accepted" | "Declined";
export type OnboardingStatus = "Not Started" | "Handoff Needed" | "Viventium Sent" | "Background Pending" | "Orientation Scheduled" | "Training Assigned" | "Complete";
export type ReadinessStatus = "Not Ready" | "Onboarding" | "Ready This Week" | "Ready for Staffing" | "Blocked";

export type CandidateTask = { id: string; title: string; owner: string; due: string; completed: boolean };
export type CandidateTimelineEvent = { id: string; date: string; title: string; detail: string; actor: string; type: "milestone" | "task" | "alert" | "system" };

export type RecruitingCandidate = {
  id: string;
  name: string;
  role: RecruitingRole;
  state: RecruitingState;
  region: string;
  city: string;
  source: RecruitingSource;
  recruiter: string;
  interviewer: string;
  candidateStatus: CandidateStage;
  interviewStatus: InterviewStatus;
  offerStatus: OfferStatus;
  onboardingStatus: OnboardingStatus;
  readinessStatus: ReadinessStatus;
  appliedDate: string;
  daysInStage: number;
  nextAction: string;
  resume: "Received" | "Missing";
  certification: "Verified" | "Pending" | "Missing" | "Not Required";
  bacbCheck: "Clear" | "Pending" | "Not Started" | "N/A";
  kidsExperience: "High" | "Moderate" | "Entry";
  screeningOutcome: "Pass" | "Pending" | "Fail";
  eligibility: "Eligible" | "Review" | "Not Eligible";
  notQualifiedReason?: string;
  interviewAt?: string;
  interviewNotes: string;
  noShow: boolean;
  offerSentAt?: string;
  payRate?: number;
  followUps: string[];
  viventium: "Not Started" | "Transitioned" | "Sent" | "Complete";
  backgroundCheck: "Not Sent" | "Sent" | "Pending" | "Clear" | "Delayed";
  orientation: "Not Scheduled" | "Scheduled" | "Complete";
  training: "Not Assigned" | "Assigned" | "Incomplete" | "Complete";
  i9: "Not Started" | "Incomplete" | "Complete";
  everify: "Not Started" | "Incomplete" | "Complete";
  centralReach: "Needed" | "Requested" | "Active";
  availability: string;
  travelRadius: number;
  preferredHours: string;
  blockers: string[];
  tasks: CandidateTask[];
  timeline: CandidateTimelineEvent[];
};

const recruiters = ["Sarah Chen", "Marcus Webb", "Nina Patel", "Avery Brooks", "Jordan Miles"];
const interviewers = ["Dr. Kim", "Dr. Patel", "Dr. Lee", "Taylor Quinn", "Sam Rivera"];

const candidateSpecs: Array<Pick<RecruitingCandidate, "id" | "name" | "role" | "state" | "region" | "city" | "source" | "recruiter" | "interviewer" | "candidateStatus" | "interviewStatus" | "offerStatus" | "onboardingStatus" | "readinessStatus" | "daysInStage" | "nextAction" | "resume" | "certification" | "bacbCheck" | "kidsExperience" | "screeningOutcome" | "eligibility" | "noShow" | "viventium" | "backgroundCheck" | "orientation" | "training" | "i9" | "everify" | "centralReach" | "availability" | "travelRadius" | "preferredHours"> & { blockers?: string[]; payRate?: number; notQualifiedReason?: string; sourceDate: string; interviewAt?: string }> = [
  { id: "RC-1001", name: "Maya Robinson", role: "RBT", state: "GA", region: "Atlanta Metro", city: "Duluth", source: "Apploi", recruiter: "Sarah Chen", interviewer: "Dr. Kim", candidateStatus: "New Applicant", interviewStatus: "Not Scheduled", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 2, nextAction: "Complete first screen", resume: "Received", certification: "Not Required", bacbCheck: "N/A", kidsExperience: "Moderate", screeningOutcome: "Pending", eligibility: "Review", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Weekday mornings", travelRadius: 18, preferredHours: "25 hrs/week", sourceDate: "2026-04-25", blockers: ["New applicant not screened within 24 hours"] },
  { id: "RC-1002", name: "Devon Brooks", role: "RBT", state: "GA", region: "Atlanta South", city: "Riverdale", source: "Indeed", recruiter: "Sarah Chen", interviewer: "Taylor Quinn", candidateStatus: "Interview Scheduled", interviewStatus: "Today", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 1, nextAction: "Send interview reminder", resume: "Received", certification: "Pending", bacbCheck: "Pending", kidsExperience: "High", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Afternoons and evenings", travelRadius: 30, preferredHours: "32 hrs/week", sourceDate: "2026-04-20", interviewAt: "2026-04-27T14:00:00", blockers: ["Interview today"] },
  { id: "RC-1003", name: "Priya Nair", role: "BCBA", state: "VA", region: "Richmond", city: "Midlothian", source: "Referral", recruiter: "Nina Patel", interviewer: "Dr. Lee", candidateStatus: "Offer Sent", interviewStatus: "Completed", offerStatus: "Unsigned", onboardingStatus: "Not Started", readinessStatus: "Blocked", daysInStage: 4, nextAction: "Follow up on unsigned offer", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "High", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Full-time", travelRadius: 22, preferredHours: "40 hrs/week", sourceDate: "2026-04-12", payRate: 78, blockers: ["Offer unsigned after 48 hours"] },
  { id: "RC-1004", name: "Andre Hill", role: "RBT", state: "NC", region: "Charlotte", city: "Matthews", source: "Website", recruiter: "Marcus Webb", interviewer: "Dr. Patel", candidateStatus: "Onboarding Handoff", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Handoff Needed", readinessStatus: "Onboarding", daysInStage: 5, nextAction: "Transition to Viventium", resume: "Received", certification: "Pending", bacbCheck: "Pending", kidsExperience: "Moderate", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Tue/Thu PM, Sat AM", travelRadius: 16, preferredHours: "28 hrs/week", sourceDate: "2026-04-10", payRate: 24, blockers: ["Candidate stuck in onboarding handoff"] },
  { id: "RC-1005", name: "Noelle Price", role: "RBT", state: "MD", region: "Bethesda", city: "Rockville", source: "Apploi", recruiter: "Jordan Miles", interviewer: "Sam Rivera", candidateStatus: "Ready for Staffing", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Complete", readinessStatus: "Ready for Staffing", daysInStage: 1, nextAction: "Notify staffing owner", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "High", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Complete", backgroundCheck: "Clear", orientation: "Complete", training: "Complete", i9: "Complete", everify: "Complete", centralReach: "Active", availability: "Mon/Wed/Thu PM", travelRadius: 12, preferredHours: "20 hrs/week", sourceDate: "2026-03-30", payRate: 25, blockers: ["Candidate ready but not sent to staffing"] },
  { id: "RC-1006", name: "Elena Morgan", role: "RBT", state: "TN", region: "Nashville", city: "Hermitage", source: "Email", recruiter: "Avery Brooks", interviewer: "Dr. Lee", candidateStatus: "Background Check", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Background Pending", readinessStatus: "Onboarding", daysInStage: 7, nextAction: "Escalate background check", resume: "Received", certification: "Pending", bacbCheck: "Pending", kidsExperience: "Moderate", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Sent", backgroundCheck: "Delayed", orientation: "Not Scheduled", training: "Assigned", i9: "Incomplete", everify: "Incomplete", centralReach: "Requested", availability: "Mon/Wed/Fri PM", travelRadius: 20, preferredHours: "30 hrs/week", sourceDate: "2026-04-02", payRate: 23, blockers: ["Background check pending too long", "Orientation not scheduled"] },
  { id: "RC-1007", name: "Camila Torres", role: "BCBA", state: "GA", region: "Atlanta Metro", city: "Atlanta", source: "Indeed", recruiter: "Nina Patel", interviewer: "Dr. Kim", candidateStatus: "Interview Completed", interviewStatus: "Needs Outcome", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 3, nextAction: "Enter interview outcome", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "High", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Full-time", travelRadius: 25, preferredHours: "40 hrs/week", sourceDate: "2026-04-14", blockers: ["Interview completed but no outcome"] },
  { id: "RC-1008", name: "Jules Carter", role: "RBT", state: "NC", region: "Raleigh", city: "Cary", source: "Phone", recruiter: "Marcus Webb", interviewer: "Taylor Quinn", candidateStatus: "Training", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Training Assigned", readinessStatus: "Ready This Week", daysInStage: 3, nextAction: "Finish RBT training modules", resume: "Received", certification: "Pending", bacbCheck: "Clear", kidsExperience: "Entry", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Complete", backgroundCheck: "Clear", orientation: "Complete", training: "Incomplete", i9: "Complete", everify: "Complete", centralReach: "Requested", availability: "Weekends, Tue/Thu PM", travelRadius: 14, preferredHours: "25 hrs/week", sourceDate: "2026-04-01", payRate: 22, blockers: ["Training incomplete", "CentralReach account missing"] },
  { id: "RC-1009", name: "Owen Blake", role: "RBT", state: "TN", region: "Memphis", city: "Germantown", source: "Referral", recruiter: "Avery Brooks", interviewer: "Sam Rivera", candidateStatus: "Orientation", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Orientation Scheduled", readinessStatus: "Ready This Week", daysInStage: 2, nextAction: "Confirm orientation attendance", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "Moderate", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Complete", backgroundCheck: "Clear", orientation: "Scheduled", training: "Assigned", i9: "Complete", everify: "Complete", centralReach: "Requested", availability: "Tue/Thu PM", travelRadius: 10, preferredHours: "24 hrs/week", sourceDate: "2026-04-04", payRate: 23 },
  { id: "RC-1010", name: "Grace Turner", role: "RBT", state: "VA", region: "Norfolk", city: "Virginia Beach", source: "Apploi", recruiter: "Jordan Miles", interviewer: "Dr. Patel", candidateStatus: "Ready for Staffing", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Complete", readinessStatus: "Ready for Staffing", daysInStage: 0, nextAction: "Send to staffing for Norfolk demand", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "High", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Complete", backgroundCheck: "Clear", orientation: "Complete", training: "Complete", i9: "Complete", everify: "Complete", centralReach: "Active", availability: "Mon/Wed/Fri AM, Sat AM", travelRadius: 18, preferredHours: "26 hrs/week", sourceDate: "2026-03-28", payRate: 24 },
  { id: "RC-1011", name: "Sienna Ray", role: "RBT", state: "MD", region: "Baltimore", city: "Baltimore", source: "Website", recruiter: "Sarah Chen", interviewer: "Dr. Kim", candidateStatus: "Screening", interviewStatus: "Not Scheduled", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 1, nextAction: "Complete phone screen", resume: "Missing", certification: "Missing", bacbCheck: "Not Started", kidsExperience: "Entry", screeningOutcome: "Pending", eligibility: "Review", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Tue/Thu AM", travelRadius: 22, preferredHours: "28 hrs/week", sourceDate: "2026-04-24", blockers: ["Missing resume/certification"] },
  { id: "RC-1012", name: "Riley Brooks", role: "RBT", state: "GA", region: "Atlanta Metro", city: "Suwanee", source: "Apploi", recruiter: "Nina Patel", interviewer: "Taylor Quinn", candidateStatus: "Interview Scheduled", interviewStatus: "No-Show", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Blocked", daysInStage: 2, nextAction: "Reschedule or disposition", resume: "Received", certification: "Pending", bacbCheck: "Pending", kidsExperience: "Moderate", screeningOutcome: "Pass", eligibility: "Eligible", noShow: true, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Mon PM, Wed PM", travelRadius: 18, preferredHours: "30 hrs/week", sourceDate: "2026-04-18", interviewAt: "2026-04-26T10:00:00", blockers: ["Interview no-show"] },
  { id: "RC-1013", name: "Malik Johnson", role: "BCBA", state: "NC", region: "Charlotte", city: "Charlotte", source: "Indeed", recruiter: "Marcus Webb", interviewer: "Dr. Patel", candidateStatus: "Offer Accepted", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Viventium Sent", readinessStatus: "Onboarding", daysInStage: 2, nextAction: "Confirm Viventium completion", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "High", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Sent", backgroundCheck: "Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Incomplete", everify: "Incomplete", centralReach: "Needed", availability: "Full-time", travelRadius: 25, preferredHours: "40 hrs/week", sourceDate: "2026-04-08", payRate: 76, blockers: ["I-9 / E-Verify incomplete"] },
  { id: "RC-1014", name: "Tessa Green", role: "RBT", state: "NC", region: "Raleigh", city: "Apex", source: "Email", recruiter: "Jordan Miles", interviewer: "Sam Rivera", candidateStatus: "Offer Sent", interviewStatus: "Completed", offerStatus: "Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 1, nextAction: "Confirm offer receipt", resume: "Received", certification: "Pending", bacbCheck: "Clear", kidsExperience: "Moderate", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Weekend AM, Tue/Thu PM", travelRadius: 16, preferredHours: "22 hrs/week", sourceDate: "2026-04-16", payRate: 23 },
  { id: "RC-1015", name: "Eli Morgan", role: "RBT", state: "GA", region: "Atlanta Metro", city: "Norcross", source: "Referral", recruiter: "Sarah Chen", interviewer: "Dr. Lee", candidateStatus: "Ready for Staffing", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Complete", readinessStatus: "Ready for Staffing", daysInStage: 1, nextAction: "Notify staffing owner", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "High", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Complete", backgroundCheck: "Clear", orientation: "Complete", training: "Complete", i9: "Complete", everify: "Complete", centralReach: "Active", availability: "Mon-Thu PM", travelRadius: 18, preferredHours: "30 hrs/week", sourceDate: "2026-03-26", payRate: 24 },
  { id: "RC-1016", name: "Hannah Patel", role: "RBT", state: "VA", region: "Richmond", city: "Short Pump", source: "Apploi", recruiter: "Avery Brooks", interviewer: "Dr. Kim", candidateStatus: "Not Qualified", interviewStatus: "Completed", offerStatus: "Declined", onboardingStatus: "Not Started", readinessStatus: "Blocked", daysInStage: 0, nextAction: "Archive candidate", resume: "Received", certification: "Missing", bacbCheck: "N/A", kidsExperience: "Entry", screeningOutcome: "Fail", eligibility: "Not Eligible", notQualifiedReason: "Unable to meet minimum weekly availability", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "One evening only", travelRadius: 8, preferredHours: "6 hrs/week", sourceDate: "2026-04-22" },
  { id: "RC-1017", name: "Leah Stewart", role: "BCBA", state: "MD", region: "Bethesda", city: "Bethesda", source: "Website", recruiter: "Nina Patel", interviewer: "Dr. Patel", candidateStatus: "Interview Scheduled", interviewStatus: "Scheduled", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 1, nextAction: "Prep interviewer packet", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "High", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Full-time", travelRadius: 20, preferredHours: "40 hrs/week", sourceDate: "2026-04-19", interviewAt: "2026-04-29T11:00:00" },
  { id: "RC-1018", name: "Chris Lane", role: "RBT", state: "TN", region: "Memphis", city: "Memphis", source: "Indeed", recruiter: "Marcus Webb", interviewer: "Taylor Quinn", candidateStatus: "New Applicant", interviewStatus: "Not Scheduled", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 3, nextAction: "Screen for Memphis shortage", resume: "Received", certification: "Not Required", bacbCheck: "N/A", kidsExperience: "Entry", screeningOutcome: "Pending", eligibility: "Review", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Tue/Thu/Sat AM", travelRadius: 22, preferredHours: "28 hrs/week", sourceDate: "2026-04-23", blockers: ["New applicant not screened within 24 hours", "RBT shortage in state/region"] },
  { id: "RC-1019", name: "Ari Coleman", role: "RBT", state: "MD", region: "Baltimore", city: "Towson", source: "Phone", recruiter: "Jordan Miles", interviewer: "Sam Rivera", candidateStatus: "Screening", interviewStatus: "Not Scheduled", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 4, nextAction: "Collect certification and resume", resume: "Missing", certification: "Missing", bacbCheck: "Not Started", kidsExperience: "Moderate", screeningOutcome: "Pending", eligibility: "Review", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Mon/Wed PM", travelRadius: 18, preferredHours: "18 hrs/week", sourceDate: "2026-04-21", blockers: ["Missing resume/certification"] },
  { id: "RC-1020", name: "Kara Wilson", role: "RBT", state: "VA", region: "Norfolk", city: "Norfolk", source: "Apploi", recruiter: "Avery Brooks", interviewer: "Dr. Lee", candidateStatus: "Offer Accepted", interviewStatus: "Completed", offerStatus: "Accepted", onboardingStatus: "Background Pending", readinessStatus: "Onboarding", daysInStage: 6, nextAction: "Push background vendor update", resume: "Received", certification: "Pending", bacbCheck: "Pending", kidsExperience: "Moderate", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Transitioned", backgroundCheck: "Pending", orientation: "Not Scheduled", training: "Assigned", i9: "Incomplete", everify: "Incomplete", centralReach: "Requested", availability: "Mon/Wed/Fri PM", travelRadius: 20, preferredHours: "30 hrs/week", sourceDate: "2026-04-05", payRate: 23, blockers: ["Background check pending too long", "I-9 / E-Verify incomplete"] },
  { id: "RC-1021", name: "Nora Ellis", role: "BCBA", state: "TN", region: "Nashville", city: "Franklin", source: "Referral", recruiter: "Nina Patel", interviewer: "Dr. Kim", candidateStatus: "Screening", interviewStatus: "Not Scheduled", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 1, nextAction: "Book clinical screen", resume: "Received", certification: "Verified", bacbCheck: "Clear", kidsExperience: "High", screeningOutcome: "Pending", eligibility: "Eligible", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Full-time", travelRadius: 25, preferredHours: "40 hrs/week", sourceDate: "2026-04-24" },
  { id: "RC-1022", name: "Miles Carter", role: "RBT", state: "NC", region: "Charlotte", city: "Huntersville", source: "Apploi", recruiter: "Sarah Chen", interviewer: "Taylor Quinn", candidateStatus: "Interview Completed", interviewStatus: "Completed", offerStatus: "Not Sent", onboardingStatus: "Not Started", readinessStatus: "Not Ready", daysInStage: 1, nextAction: "Send offer letter", resume: "Received", certification: "Pending", bacbCheck: "Clear", kidsExperience: "Moderate", screeningOutcome: "Pass", eligibility: "Eligible", noShow: false, viventium: "Not Started", backgroundCheck: "Not Sent", orientation: "Not Scheduled", training: "Not Assigned", i9: "Not Started", everify: "Not Started", centralReach: "Needed", availability: "Tue/Thu/Sat AM", travelRadius: 16, preferredHours: "25 hrs/week", sourceDate: "2026-04-17", payRate: 23 },
];

const makeTasks = (c: typeof candidateSpecs[number]): CandidateTask[] => [
  { id: `${c.id}-task-1`, title: c.nextAction, owner: c.recruiter, due: c.interviewStatus === "Today" ? "Today" : "2026-04-28", completed: false },
  { id: `${c.id}-task-2`, title: c.resume === "Missing" ? "Collect resume" : "Verify candidate file", owner: c.recruiter, due: "2026-04-29", completed: c.resume !== "Missing" },
  { id: `${c.id}-task-3`, title: "Staffing readiness review", owner: "Staffing Ops", due: "2026-04-30", completed: c.readinessStatus === "Ready for Staffing" },
];

const makeTimeline = (c: typeof candidateSpecs[number]): CandidateTimelineEvent[] => [
  { id: `${c.id}-tl-1`, date: c.sourceDate, title: "Applied", detail: `Application received from ${c.source}.`, actor: "Apploi Sync", type: "system" },
  ...(c.screeningOutcome !== "Pending" ? [{ id: `${c.id}-tl-2`, date: "2026-04-20", title: "Screened", detail: `${c.screeningOutcome} screening outcome recorded.`, actor: c.recruiter, type: "milestone" as const }] : []),
  ...(c.interviewStatus !== "Not Scheduled" ? [{ id: `${c.id}-tl-3`, date: c.interviewAt ?? "2026-04-24", title: "Interview scheduled", detail: `Interview status: ${c.interviewStatus}.`, actor: c.recruiter, type: c.noShow ? "alert" as const : "milestone" as const }] : []),
  ...(["Offer Sent", "Offer Accepted", "Ready for Staffing"].includes(c.candidateStatus) ? [{ id: `${c.id}-tl-4`, date: "2026-04-25", title: "Offer updated", detail: `Offer status: ${c.offerStatus}.`, actor: c.recruiter, type: "milestone" as const }] : []),
  ...(c.readinessStatus === "Ready for Staffing" ? [{ id: `${c.id}-tl-5`, date: "2026-04-27", title: "Ready for staffing", detail: "Candidate cleared for assignment handoff.", actor: "People Ops", type: "milestone" as const }] : []),
];

export const recruitingCandidates: RecruitingCandidate[] = candidateSpecs.map((c) => ({
  ...c,
  appliedDate: c.sourceDate,
  blockers: c.blockers ?? [],
  interviewNotes: c.interviewStatus === "Completed" || c.interviewStatus === "Needs Outcome" ? "Strong values alignment; confirm scheduling reliability and documentation habits." : "Pending interview notes.",
  followUps: c.offerStatus === "Unsigned" || c.offerStatus === "Sent" ? ["Email sent", "Text reminder queued"] : [],
  tasks: makeTasks(c),
  timeline: makeTimeline(c),
}));

export const recruitingStages: CandidateStage[] = [];
export const recruitingStates: RecruitingState[] = [];
export const recruitingRoles: RecruitingRole[] = [];
export const recruitingSources: RecruitingSource[] = [];
export const recruitingRecruiters = recruiters;
export const recruitingInterviewers = interviewers;

export const staffingDemandByRegion: Record<string, { demand: number; priorityRole: RecruitingRole }> = {
  "GA-Atlanta Metro": { demand: 5, priorityRole: "RBT" },
  "GA-Atlanta South": { demand: 3, priorityRole: "RBT" },
  "NC-Charlotte": { demand: 4, priorityRole: "RBT" },
  "NC-Raleigh": { demand: 3, priorityRole: "RBT" },
  "TN-Nashville": { demand: 4, priorityRole: "RBT" },
  "TN-Memphis": { demand: 3, priorityRole: "RBT" },
  "VA-Richmond": { demand: 3, priorityRole: "BCBA" },
  "VA-Norfolk": { demand: 4, priorityRole: "RBT" },
  "MD-Bethesda": { demand: 3, priorityRole: "BCBA" },
  "MD-Baltimore": { demand: 3, priorityRole: "RBT" },
};

export const toStaffingRbtProfile = (candidate: RecruitingCandidate) => ({
  id: `RBT-${candidate.id}`,
  name: candidate.name,
  state: candidate.state,
  region: candidate.region,
  clinic: candidate.region,
  location: candidate.city,
  radius: candidate.travelRadius,
  availability: candidate.availability.split(", "),
  currentHours: 0,
  maxHours: Number(candidate.preferredHours.match(/\d+/)?.[0] ?? 25),
  assignedClients: [],
  experience: [candidate.kidsExperience, candidate.source],
  compliance: candidate.centralReach === "Active" && candidate.i9 === "Complete" ? "Ready" : "Incomplete",
  onboarding: "Offer Accepted",
});
