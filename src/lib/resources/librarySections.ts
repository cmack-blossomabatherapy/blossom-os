import type { Resource } from "@/lib/resources/resourceData";

/** Section buckets used by the Resource Library home + list views. */
export type LibrarySectionId =
  | "required_sops"
  | "training"
  | "policies"
  | "forms"
  | "cheatsheets"
  | "videos"
  | "optional";

export interface LibrarySection {
  id: LibrarySectionId;
  title: string;
  subtitle: string;
}

export const LIBRARY_SECTIONS: LibrarySection[] = [
  { id: "required_sops", title: "Required SOPs",              subtitle: "Standard operating procedures you need to follow." },
  { id: "training",      title: "Training Resources",         subtitle: "Guides and materials linked to your training journey." },
  { id: "policies",      title: "Policies, Handbooks & Benefits", subtitle: "Company policies, handbooks, and benefits references." },
  { id: "forms",         title: "Forms, Templates & Worksheets",  subtitle: "Fillable forms, templates, and worksheets." },
  { id: "cheatsheets",   title: "Cheat Sheets & References",  subtitle: "Quick references to keep at hand." },
  { id: "videos",        title: "Videos",                     subtitle: "Recorded walkthroughs and screen captures." },
  { id: "optional",      title: "Optional Helpful Resources", subtitle: "Extras that support your work but aren't required." },
];

function hasTag(r: Resource, ...needles: string[]): boolean {
  const bag = [...(r.tags ?? []), ...(r.departments ?? []), r.title, r.description]
    .join(" ")
    .toLowerCase();
  return needles.some((n) => bag.includes(n));
}

export function isVideoResource(r: Resource): boolean {
  if (r.type === "Video") return true;
  if (r.resourceType === "video") return true;
  if (r.storageBucket === "resource-videos") return true;
  if ((r.mimeType ?? "").toLowerCase().startsWith("video/")) return true;
  const ext = (r.fileName || r.storagePath || "").toLowerCase();
  return /\.(mp4|webm|mov|m4v)$/i.test(ext);
}

export function isSopResource(r: Resource): boolean {
  if (r.sopRelated) return true;
  if (r.type === "SOP") return true;
  if (r.resourceType === "sop" || r.resourceType === "policy") return true;
  return hasTag(r, "sop", "policy", "procedure");
}

export function isTrainingResource(r: Resource): boolean {
  if (r.trainingRelated) return true;
  if (r.category === "training") return true;
  if (r.resourceType === "training" || r.resourceType === "guide") return true;
  return hasTag(r, "training", "academy", "journey");
}

export function isPolicyOrHandbook(r: Resource): boolean {
  if (r.resourceType === "handbook" || r.resourceType === "policy") return true;
  if (r.category === "hr") return true;
  return hasTag(r, "handbook", "benefits", "policy");
}

export function isFormOrTemplate(r: Resource): boolean {
  if (r.type === "Form" || r.type === "Template" || r.type === "Checklist") return true;
  if (r.resourceType === "template" || r.resourceType === "checklist") return true;
  if (r.category === "templates") return true;
  return hasTag(r, "template", "form", "worksheet");
}

export function isCheatSheet(r: Resource): boolean {
  if (r.resourceType === "reference") return true;
  return hasTag(r, "cheat_sheet", "cheatsheet", "reference", "quick_reference");
}

/** Assign a resource to a single library section (first matching wins). */
export function sectionForResource(r: Resource): LibrarySectionId {
  if (isSopResource(r))         return "required_sops";
  if (isVideoResource(r))       return "videos";
  if (isTrainingResource(r))    return "training";
  if (isPolicyOrHandbook(r))    return "policies";
  if (isFormOrTemplate(r))      return "forms";
  if (isCheatSheet(r))          return "cheatsheets";
  return "optional";
}

/** Group resources by library section, preserving input order. */
export function groupBySection(resources: Resource[]): Record<LibrarySectionId, Resource[]> {
  const out: Record<LibrarySectionId, Resource[]> = {
    required_sops: [], training: [], policies: [], forms: [],
    cheatsheets: [], videos: [], optional: [],
  };
  for (const r of resources) out[sectionForResource(r)].push(r);
  return out;
}

/** Canonical department buckets shown on the Department Resource View. */
export interface DepartmentBucket {
  id: string;
  name: string;
  match: (r: Resource) => boolean;
}

function matchByRoleOrDept(...needles: string[]): (r: Resource) => boolean {
  return (r) => {
    const bag = [
      ...(r.roles ?? []),
      ...(r.departments ?? []),
      ...(r.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return needles.some((n) => bag.includes(n.toLowerCase()));
  };
}

export const LIBRARY_DEPARTMENTS: DepartmentBucket[] = [
  { id: "company",       name: "Company Information",   match: matchByRoleOrDept("company", "all_staff", "handbook", "brand") },
  { id: "executive",     name: "Executive Leadership",  match: matchByRoleOrDept("executive", "ceo", "coo", "exec") },
  { id: "operations",    name: "Operations",            match: matchByRoleOrDept("operations", "ops_manager", "director_of_operations") },
  { id: "intake",        name: "Intake",                match: matchByRoleOrDept("intake") },
  { id: "authorizations",name: "Authorizations",        match: matchByRoleOrDept("authorization", "auth_team") },
  { id: "scheduling",    name: "Scheduling",            match: matchByRoleOrDept("scheduling") },
  { id: "clinical",      name: "Clinical Operations",   match: matchByRoleOrDept("clinical", "bcba", "rbt", "case_manager", "behavioral_support") },
  { id: "qa",            name: "Quality Assurance",     match: matchByRoleOrDept("qa", "quality") },
  { id: "state_ops",     name: "State Operations",      match: matchByRoleOrDept("state_director", "state_va", "state_operations") },
  { id: "clinics",       name: "Clinics",               match: matchByRoleOrDept("clinic", "clinic_growth") },
  { id: "recruiting_hr", name: "Recruiting & HR",       match: matchByRoleOrDept("recruiting", "hr", "credentialing", "onboarding") },
  { id: "finance",       name: "Finance & Payroll",     match: matchByRoleOrDept("finance", "payroll", "billing", "rcm") },
  { id: "marketing",     name: "Marketing",             match: matchByRoleOrDept("marketing", "business_development", "referral") },
  { id: "systems",       name: "Systems & Software",    match: matchByRoleOrDept("systems", "software", "platform") },
  { id: "it_security",   name: "IT & Security",         match: matchByRoleOrDept("it", "security", "device") },
  { id: "training_dept", name: "Training",              match: (r) => isTrainingResource(r) },
  { id: "forms_dept",    name: "Forms & Templates",     match: (r) => isFormOrTemplate(r) },
  { id: "guides",        name: "Software Guides",       match: matchByRoleOrDept("guide", "walkthrough", "tango") },
];

/** Best-effort friendly file type label from mime/extension. */
export function fileTypeLabel(r: Resource): string {
  const ext = (r.fileName || r.storagePath || "").split(".").pop()?.toLowerCase() ?? "";
  const mime = (r.mimeType || "").toLowerCase();
  if (mime.startsWith("video/") || /^(mp4|webm|mov|m4v)$/.test(ext)) return "Video";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "DOCX";
  if (["xls", "xlsx"].includes(ext)) return "XLSX";
  if (["csv"].includes(ext)) return "CSV";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "Image";
  if (["md", "txt"].includes(ext)) return "Text";
  if (r.type) return r.type;
  return ext ? ext.toUpperCase() : "File";
}

/** Signed-URL friendly check for browser preview. */
export function canPreviewInline(r: Resource): "pdf" | "video" | "image" | null {
  const t = fileTypeLabel(r);
  if (t === "PDF") return "pdf";
  if (t === "Video") return "video";
  if (t === "Image") return "image";
  return null;
}
