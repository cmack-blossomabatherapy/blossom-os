/**
 * Smart collections for the Resource Library.
 *
 * Each collection is a small, data-driven view over the already
 * role-scoped, learner-safe resource list (the output of `visibleResources`
 * / `isVisibleToRole`). Collections never re-introduce held / vault /
 * excluded / pending resources — they only narrow what learners can already
 * see.
 *
 * The list and order match the Resource Library smart redesign pass:
 *   1. State Director Launch  (leadership + super_admin only)
 *   2. Welcome to Blossom
 *   3. My Role Guides
 *   4. SOPs & Workflows
 *   5. Handbooks & Policies
 *   6. Systems Walkthroughs
 *   7. Templates & Checklists
 *   8. Leadership Library     (leadership + super_admin only)
 */
import {
  GraduationCap,
  Sparkles,
  Star,
  FileText,
  BookOpen,
  PlayCircle,
  ClipboardList,
  Crown,
  type LucideIcon,
} from "lucide-react";
import type { Resource } from "./resourceData";
import { isVisibleToRole } from "./resourceData";
import type { OSRole } from "@/lib/os/permissions";
import {
  SD_SOP_MANIFEST,
  isSdSopVisibleToRole,
} from "./stateDirectorSopManifest";
import { normalizeSopTitle } from "./sdSopCoverage";

export type SmartCollectionId =
  | "state-director-launch"
  | "welcome-to-blossom"
  | "my-role-guides"
  | "sops-workflows"
  | "handbooks-policies"
  | "systems-walkthroughs"
  | "templates-checklists"
  | "leadership-library";

export interface SmartCollection {
  id: SmartCollectionId;
  name: string;
  description: string;
  icon: LucideIcon;
  tone:
    | "purple"
    | "blue"
    | "teal"
    | "amber"
    | "rose"
    | "emerald"
    | "slate"
    | "indigo";
  /** Role gate. `null` means visible to everyone (still subject to per-resource role checks). */
  roleVisible: (role: OSRole) => boolean;
  /** Predicate applied to already learner-safe, role-scoped resources. */
  match: (r: Resource) => boolean;
}

/** Roles allowed into the Leadership Library collection. */
const LEADERSHIP_ROLES: OSRole[] = [
  "state_director",
  "operations_leadership",
  "executive_leadership",
  "super_admin",
];

/** Pre-computed manifest title set used by the SD launch matcher. */
const SD_MANIFEST_KEYS: Set<string> = new Set(
  SD_SOP_MANIFEST.map((e) => normalizeSopTitle(e.title)),
);

/** True when the resource has at least one openable surface. */
export function isResourceOpenable(r: Resource): boolean {
  return Boolean(r.url || r.fileUrl || (r as any).storagePath);
}

/** Welcome-to-Blossom heuristic: title/tag/description mentions the welcome path. */
function isWelcomeResource(r: Resource): boolean {
  const hay = [
    r.title,
    r.description ?? "",
    ...(r.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  if (/\bwelcome to blossom\b/.test(hay)) return true;
  if (/\bwelcome video\b/.test(hay)) return true;
  if (/\bblossom welcome\b/.test(hay)) return true;
  // Leadership "welcome letter" / day-one launch packet.
  if (/\bwelcome (letter|packet|guide)\b/.test(hay)) return true;
  return false;
}

function isHandbookOrPolicy(r: Resource): boolean {
  if (r.resourceType === "handbook" || r.resourceType === "policy") return true;
  if (r.category === "hr") return true;
  return r.tags.some((t) => /handbook|policy|policies/i.test(t));
}

function isSystemsWalkthrough(r: Resource): boolean {
  if (r.type === "Tango" || r.type === "Video") return true;
  if (r.category === "systems") return true;
  return r.tags.some((t) => /walkthrough|tango|screen.?share/i.test(t));
}

function isTemplateOrChecklist(r: Resource): boolean {
  if (r.type === "Template" || r.type === "Checklist") return true;
  if (r.resourceType === "template" || r.resourceType === "checklist") return true;
  return false;
}

function isSopOrWorkflow(r: Resource): boolean {
  if (r.type === "SOP" || r.type === "Workflow") return true;
  if (r.category === "sops" || r.category === "workflows") return true;
  if (r.resourceType === "sop" || r.resourceType === "workflow") return true;
  return false;
}

function isSdLaunchResource(r: Resource): boolean {
  if (!isResourceOpenable(r)) return false;
  return SD_MANIFEST_KEYS.has(normalizeSopTitle(r.title));
}

function isMyRoleGuide(role: OSRole, r: Resource): boolean {
  // Resources explicitly assigned to the user's role (not just "everyone").
  return Array.isArray(r.roles) && r.roles.length > 0 && r.roles.includes(role);
}

export const SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: "state-director-launch",
    name: "State Director Launch",
    description:
      "Published SOPs powering the 5-week State Director launch journey.",
    icon: GraduationCap,
    tone: "purple",
    roleVisible: (role) => isSdSopVisibleToRole(role),
    match: isSdLaunchResource,
  },
  {
    id: "welcome-to-blossom",
    name: "Welcome to Blossom",
    description: "Day-one welcome video, leadership letter, and launch packet.",
    icon: Sparkles,
    tone: "rose",
    roleVisible: () => true,
    match: isWelcomeResource,
  },
  {
    id: "my-role-guides",
    name: "My Role Guides",
    description: "Hand-picked resources assigned directly to your role.",
    icon: Star,
    tone: "teal",
    roleVisible: () => true,
    match: () => false, // role-aware: filled at runtime via collectSmartCollections
  },
  {
    id: "sops-workflows",
    name: "SOPs & Workflows",
    description: "Standard operating procedures and end-to-end workflows.",
    icon: FileText,
    tone: "blue",
    roleVisible: () => true,
    match: isSopOrWorkflow,
  },
  {
    id: "handbooks-policies",
    name: "Handbooks & Policies",
    description: "Company handbooks, HR policies, and reference documents.",
    icon: BookOpen,
    tone: "amber",
    roleVisible: () => true,
    match: isHandbookOrPolicy,
  },
  {
    id: "systems-walkthroughs",
    name: "Systems Walkthroughs",
    description: "Tango / video walkthroughs for the tools you use daily.",
    icon: PlayCircle,
    tone: "indigo",
    roleVisible: () => true,
    match: isSystemsWalkthrough,
  },
  {
    id: "templates-checklists",
    name: "Templates & Checklists",
    description: "Reusable templates and quick checklists for daily ops.",
    icon: ClipboardList,
    tone: "emerald",
    roleVisible: () => true,
    match: isTemplateOrChecklist,
  },
  {
    id: "leadership-library",
    name: "Leadership Library",
    description: "Playbooks, strategy memos, and leadership planning docs.",
    icon: Crown,
    tone: "slate",
    roleVisible: (role) => LEADERSHIP_ROLES.includes(role),
    match: (r) => r.category === "leadership",
  },
];

export interface SmartCollectionResult {
  collection: SmartCollection;
  items: Resource[];
}

/**
 * Build collection results from the live resource list.
 *
 * Steps:
 *   1. Filter the master list down to learner-safe, role/state-scoped items
 *      via `isVisibleToRole`. Held/vault/excluded/pending never appear.
 *   2. For each collection visible to the role, return matching openable
 *      resources. Non-openable rows are excluded (no "missing" placeholders).
 */
export function collectSmartCollections(
  resources: Resource[],
  role: OSRole,
  state?: string,
): SmartCollectionResult[] {
  const scope = resources.filter((r) => isVisibleToRole(r, role, state));
  const out: SmartCollectionResult[] = [];
  for (const c of SMART_COLLECTIONS) {
    if (!c.roleVisible(role)) continue;
    let items: Resource[];
    if (c.id === "my-role-guides") {
      items = scope.filter((r) => isMyRoleGuide(role, r) && isResourceOpenable(r));
    } else {
      items = scope.filter((r) => c.match(r) && isResourceOpenable(r));
    }
    out.push({ collection: c, items });
  }
  return out;
}

/**
 * Admin-only summary counters for the Resource Library "hidden" badge.
 * Counts non-public rows (held / pending / vault / excluded / privacy /
 * business review / needs conversion / not openable) regardless of role.
 */
export function countAdminHiddenResources(resources: Resource[]): number {
  return resources.filter((r) => {
    if (r.status === "Archived") return true;
    if (r.sensitivity === "excluded" || r.attachmentStatus === "excluded")
      return true;
    if (r.uploadStatus && r.uploadStatus !== "published") return true;
    if (r.attachmentStatus === "pending_upload") return true;
    return false;
  }).length;
}
