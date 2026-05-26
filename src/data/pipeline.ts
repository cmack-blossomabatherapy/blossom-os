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

export const masterPipelineSections: PipelineSectionDefinition[] = [];

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