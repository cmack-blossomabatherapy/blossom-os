import type { OSRole } from "@/lib/os/permissions";
import type { KBCategory } from "./types";

/**
 * Role-aware AI scope. Frontend-only mock layer. Real enforcement will live
 * with RLS + server-side filtering when the live AI adapter is wired up.
 */
export interface AiScope {
  categories: KBCategory[];
  dataScope: "company" | "state" | "assigned";
  recordTypes: AiRecordType[];
  maskedFields: string[];
  label: string;
}

export type AiRecordType =
  | "client" | "lead" | "authorization" | "schedule" | "staff"
  | "candidate" | "report" | "kpi" | "sop" | "training"
  | "directory" | "finance" | "hr_record" | "audit";

const ALL_CATEGORIES: KBCategory[] = [
  "sop", "training", "insurance", "state", "workflow",
  "policy", "terminology", "role", "faq", "directory",
];

const ALWAYS_MASKED = [
  "ssn", "dob", "home_address", "personal_phone", "personal_email",
  "payroll_amount", "salary", "bank_account",
];

export function getAiScope(role: OSRole): AiScope {
  switch (role) {
    case "super_admin":
      return { categories: ALL_CATEGORIES, dataScope: "company",
        recordTypes: ["client","lead","authorization","schedule","staff","candidate","report","kpi","sop","training","directory","finance","hr_record","audit"],
        maskedFields: [], label: "All systems · company-wide" };
    case "executive_leadership":
      return { categories: ALL_CATEGORIES, dataScope: "company",
        recordTypes: ["client","lead","authorization","schedule","staff","candidate","report","kpi","sop","training","directory","finance"],
        maskedFields: ["ssn","dob","home_address","personal_phone","personal_email","bank_account"],
        label: "Leadership · company-wide" };
    case "operations_leadership":
      return { categories: ALL_CATEGORIES, dataScope: "company",
        recordTypes: ["client","lead","authorization","schedule","staff","candidate","report","kpi","sop","training","directory"],
        maskedFields: [...ALWAYS_MASKED, "hr_record"], label: "Operations · company-wide" };
    case "state_director":
      return { categories: ["sop","training","insurance","state","workflow","policy","terminology","role","faq","directory"],
        dataScope: "state",
        recordTypes: ["client","lead","authorization","schedule","staff","report","kpi","sop","training","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount"], label: "State Director" };
    case "intake_coordinator":
      return { categories: ["sop","insurance","workflow","faq","terminology","training","directory","state"],
        dataScope: "state",
        recordTypes: ["lead","client","authorization","sop","training","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount", "hr_record"], label: "Intake" };
    case "authorization_coordinator":
      return { categories: ["sop","insurance","workflow","faq","terminology","state","directory"],
        dataScope: "state",
        recordTypes: ["client","authorization","sop","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount", "hr_record"], label: "Authorizations" };
    case "scheduling_team":
      return { categories: ["sop","workflow","faq","terminology","directory","state"],
        dataScope: "state",
        recordTypes: ["schedule","client","staff","sop","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount", "hr_record", "finance"], label: "Scheduling" };
    case "recruiting_team":
      return { categories: ["sop","training","workflow","faq","role","directory"],
        dataScope: "company",
        recordTypes: ["candidate","staff","training","sop","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount", "finance"], label: "Recruiting" };
    case "hr_team":
      return { categories: ALL_CATEGORIES, dataScope: "company",
        recordTypes: ["staff","candidate","training","sop","directory","hr_record"],
        maskedFields: ["ssn","bank_account"], label: "HR" };
    case "billing_finance":
      return { categories: ["sop","insurance","workflow","faq","terminology","state","directory"],
        dataScope: "company",
        recordTypes: ["client","authorization","finance","report","kpi","sop","directory"],
        maskedFields: [...ALWAYS_MASKED, "hr_record"], label: "Billing & Finance" };
    case "qa_team":
      return { categories: ["sop","training","workflow","faq","terminology","state","directory"],
        dataScope: "company",
        recordTypes: ["client","authorization","staff","report","sop","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount", "hr_record"], label: "QA" };
    case "payroll_coordinator":
      return { categories: ["sop","workflow","faq","terminology","directory"],
        dataScope: "company",
        recordTypes: ["staff","finance","report","sop","directory"],
        maskedFields: ["ssn","bank_account","home_address","personal_phone"], label: "Payroll" };
    case "bcba":
      return { categories: ["sop","training","workflow","faq","terminology","directory"],
        dataScope: "assigned",
        recordTypes: ["client","schedule","sop","training","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount", "hr_record", "finance"],
        label: "BCBA · assigned caseload" };
    case "rbt":
      return { categories: ["sop","training","faq","terminology","directory"],
        dataScope: "assigned",
        recordTypes: ["client","schedule","sop","training","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount", "hr_record", "finance"],
        label: "RBT · assigned caseload" };
    case "marketing_team":
      return { categories: ["sop","workflow","faq","terminology","state","directory"],
        dataScope: "company",
        recordTypes: ["lead","report","sop","directory"],
        maskedFields: [...ALWAYS_MASKED, "salary", "payroll_amount", "hr_record", "finance"],
        label: "Marketing" };
  }
}

export function filterContextForRole<T extends Record<string, unknown>>(role: OSRole, payload: T): T {
  const scope = getAiScope(role);
  if (scope.maskedFields.length === 0) return payload;
  const clone: Record<string, unknown> = { ...payload };
  for (const key of Object.keys(clone)) {
    if (scope.maskedFields.some((m) => key.toLowerCase().includes(m))) {
      clone[key] = "[restricted]";
    }
  }
  return clone as T;
}

export function canAccessCategory(role: OSRole, category: KBCategory): boolean {
  return getAiScope(role).categories.includes(category);
}

export function canReferenceRecord(role: OSRole, recordType: AiRecordType): boolean {
  return getAiScope(role).recordTypes.includes(recordType);
}
