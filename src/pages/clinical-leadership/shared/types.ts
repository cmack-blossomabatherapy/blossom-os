export type ClinicalFilters = {
  state: string | null;
  clinic: string | null;
  bcbaId: string | null;
};

export type ExceptionRow = {
  id: string;
  title: string;
  subtitle?: string;
  owner?: string | null;
  ownerId?: string | null;
  status?: string | null;
  severity?: "low" | "medium" | "high" | "critical" | null;
  dueDate?: string | null;
  sourceLabel?: string | null;
  sourceDate?: string | null;
  detailPath?: string | null;
  meta?: Record<string, string | number | null | undefined>;
};

export const CLINICAL_LEADERSHIP_ROLES = [
  "clinical_director",
  "operations_leadership",
  "executive",
  "coo",
  "doo",
  "director_of_clinical_services",
  "super_admin",
  "admin",
] as const;