export type PipelineSectionKey =
  | "intake"
  | "financial"
  | "clientSetup"
  | "initialAuth"
  | "assessment"
  | "qa"
  | "treatmentAuth"
  | "staffing"
  | "scheduling"
  | "activeServices"
  | "reauth";

export type PipelineStageVariant = "default" | "success" | "warning" | "destructive" | "info" | "muted";

export interface PipelineStageDefinition {
  name: string;
  variant: PipelineStageVariant;
  owner: string;
}

export interface PipelineSectionDefinition {
  key: PipelineSectionKey;
  title: string;
  summary: string;
  stages: PipelineStageDefinition[];
}

export const masterPipelineSections: PipelineSectionDefinition[] = [
  {
    key: "intake",
    title: "Intake",
    summary: "Lead phase",
    stages: [
      { name: "New Lead", variant: "info", owner: "Intake" },
      { name: "In Contact", variant: "default", owner: "Intake" },
      { name: "Sent Form", variant: "default", owner: "Intake" },
      { name: "Missing Information", variant: "warning", owner: "Intake" },
      { name: "Form Received", variant: "success", owner: "Intake" },
      { name: "Sent to VOB", variant: "default", owner: "Benefits" },
    ],
  },
  {
    key: "financial",
    title: "Benefits & Financial",
    summary: "Decision layer",
    stages: [
      { name: "VOB Pending", variant: "warning", owner: "Benefits" },
      { name: "VOB Received", variant: "success", owner: "Benefits" },
      { name: "Financial Review", variant: "info", owner: "Finance" },
      { name: "Payment Plan Required", variant: "warning", owner: "Finance" },
      { name: "Payment Plan Received", variant: "success", owner: "Finance" },
      { name: "Approved for Services", variant: "success", owner: "Finance" },
      { name: "Not Qualified", variant: "destructive", owner: "Finance" },
    ],
  },
  {
    key: "clientSetup",
    title: "Onboarding to Client",
    summary: "Client creation",
    stages: [
      { name: "Converted to Client", variant: "success", owner: "Operations" },
      { name: "BCBA Assignment", variant: "info", owner: "Clinical" },
      { name: "Pending Initial Authorization", variant: "warning", owner: "Authorization" },
    ],
  },
  {
    key: "initialAuth",
    title: "Authorization",
    summary: "Initial auth",
    stages: [
      { name: "Initial Auth – Awaiting Submission", variant: "warning", owner: "Authorization" },
      { name: "Initial Auth – Submitted", variant: "warning", owner: "Authorization" },
      { name: "Initial Auth – Approved", variant: "success", owner: "Authorization" },
      { name: "Waiting on Consent", variant: "warning", owner: "Intake" },
    ],
  },
  {
    key: "assessment",
    title: "Assessment",
    summary: "Clinical assessment",
    stages: [
      { name: "Schedule Assessment", variant: "info", owner: "Scheduling" },
      { name: "Assessment Scheduled", variant: "default", owner: "Clinical" },
      { name: "Assessment Completed", variant: "success", owner: "Clinical" },
      { name: "Treatment Plan Pending", variant: "warning", owner: "Clinical" },
    ],
  },
  {
    key: "qa",
    title: "QA",
    summary: "Quality control",
    stages: [
      { name: "QA Review", variant: "default", owner: "QA" },
      { name: "QA Issues / Fix Required", variant: "destructive", owner: "Clinical" },
      { name: "QA Approved", variant: "success", owner: "QA" },
    ],
  },
  {
    key: "treatmentAuth",
    title: "Treatment Authorization",
    summary: "Revenue approval",
    stages: [
      { name: "Treatment Auth – Awaiting Submission", variant: "warning", owner: "Authorization" },
      { name: "Treatment Auth – Submitted", variant: "warning", owner: "Authorization" },
      { name: "Treatment Auth – Approved", variant: "success", owner: "Authorization" },
      { name: "Treatment Auth – Denied", variant: "destructive", owner: "Authorization" },
    ],
  },
  {
    key: "staffing",
    title: "Staffing",
    summary: "Supply side",
    stages: [
      { name: "Staffing Needed", variant: "destructive", owner: "Staffing" },
      { name: "Matching in Progress", variant: "warning", owner: "Staffing" },
      { name: "RBT Assigned", variant: "success", owner: "Staffing" },
      { name: "Restaffing Needed", variant: "warning", owner: "Staffing" },
    ],
  },
  {
    key: "scheduling",
    title: "Scheduling",
    summary: "Execution setup",
    stages: [
      { name: "Pending Schedule", variant: "warning", owner: "Scheduling" },
      { name: "Schedule Created", variant: "success", owner: "Scheduling" },
      { name: "Pending Start Date", variant: "info", owner: "Operations" },
    ],
  },
  {
    key: "activeServices",
    title: "Active Services",
    summary: "Execution",
    stages: [
      { name: "Active", variant: "success", owner: "Clinic" },
      { name: "Services on Pause", variant: "warning", owner: "Clinic" },
      { name: "Flaked", variant: "destructive", owner: "Clinic" },
      { name: "Discharged", variant: "muted", owner: "Clinic" },
    ],
  },
  {
    key: "reauth",
    title: "Reauth Loop",
    summary: "Revenue protection",
    stages: [
      { name: "Reauth Triggered", variant: "warning", owner: "Authorization" },
      { name: "Progress Report Needed", variant: "warning", owner: "Clinical" },
      { name: "Progress Report Received", variant: "success", owner: "Clinical" },
      { name: "Reauth Submitted", variant: "warning", owner: "Authorization" },
      { name: "Reauth Approved", variant: "success", owner: "Authorization" },
    ],
  },
];

export const masterPipelineStages = masterPipelineSections.flatMap((section) => section.stages);

export const masterPipelineStageNames = masterPipelineStages.map((stage) => stage.name);

export const legacyStageAliases: Record<string, string> = {
  "Pending Initial Auth": "Initial Auth – Awaiting Submission",
  "Waiting on Consent Forms": "Waiting on Consent",
  "In QA": "QA Review",
  "Pending Treatment Auth": "Treatment Auth – Awaiting Submission",
  "VOB Completed": "VOB Received",
};

export const canonicalPipelineStage = (stage: string): string => legacyStageAliases[stage] ?? stage;

export const getPipelineStageIndex = (stage: string): number => masterPipelineStageNames.indexOf(canonicalPipelineStage(stage));

export const getNextPipelineStage = (stage: string): string | null => {
  const current = getPipelineStageIndex(stage);
  if (current < 0) return null;
  return masterPipelineStageNames[current + 1] ?? null;
};

export const canAdvanceToStage = (currentStage: string, targetStage: string): boolean => {
  const current = getPipelineStageIndex(currentStage);
  const target = getPipelineStageIndex(targetStage);
  if (current < 0 || target < 0) return false;
  return target === current + 1;
};