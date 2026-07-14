/**
 * Single resolver for resources that should appear on academy learner pages.
 *
 * Merges:
 *  - Module-hardcoded resources from academyData Training records.
 *  - RBT seeded/admin resources attached by moduleId in rbtResources.
 *  - Admin attachments created in Training Management (resourceAttachments).
 *  - State Director SOPs (already surfaced inside the /training journey,
 *    not duplicated here to avoid double-rendering).
 *
 * De-duplicates by `resourceId` so the same resource never renders twice.
 */
import { STARTER_RBT_RESOURCES, getResourcesForModule as getRbtResourcesForModule, type RBTResource } from "@/lib/training/rbtResources";
import { listAttachmentsForScope, type TrainingResourceAttachment } from "./resourceAttachments";
import type { TrainingResource } from "@/lib/training/academyData";
import type { RBTPathId } from "@/lib/training/rbtAcademy";

export interface AcademyResolvedResource {
  id: string;             // attachment id or resource id, unique in the merged list
  resourceId: string;     // original library id
  title: string;
  type: string;
  url?: string;
  required?: boolean;
  source: "module" | "rbt" | "attachment";
  scope?: "journey" | "day" | "module";
  instructions?: string;
}

export interface AcademyResourceScope {
  journeySlug: string;
  dayId?: string;
  moduleId?: string;
  /** Original source-module id used for RBT seeded lookup (e.g. "nc-c2"). */
  sourceModuleId?: string;
  /** Origin curriculum kind. Used to gate RBT seeded resource lookups so a
   * BCBA/academyData module id is never matched against the RBT library. */
  sourceKind?: "rbt" | "bcba" | "academyData" | "intake" | "recruiting" | "authorizations" | "scheduling" | "staffing" | "hr" | "credentialing" | "qa" | "case-manager" | "behavioral-support" | "assistant-state-director";
  /** Active RBT track on the learner page. Used to filter RBT attachments so
   * a resource attached to one track never bleeds into another. */
  rbtTrackId?: RBTPathId;
  /** Optional module-hardcoded resources from a Training record. */
  moduleResources?: TrainingResource[];
}

function fromAttachment(a: TrainingResourceAttachment): AcademyResolvedResource {
  return {
    id: a.id,
    resourceId: a.resourceId,
    title: a.resourceTitle,
    type: a.resourceType ?? "Resource",
    url: a.resourceUrl,
    required: a.requiredness === "required",
    source: "attachment",
    scope: a.scope,
    instructions: a.instructions,
  };
}

function fromRbt(r: RBTResource): AcademyResolvedResource {
  return {
    id: `rbt:${r.id}`,
    resourceId: r.id,
    title: r.title,
    type: r.type,
    url: r.url,
    required: r.required,
    source: "rbt",
  };
}

function fromModule(r: TrainingResource): AcademyResolvedResource {
  return {
    id: `mod:${r.id}`,
    resourceId: r.id,
    title: r.title,
    type: r.type,
    url: r.url,
    source: "module",
  };
}

export function getAcademyResourcesForScope(scope: AcademyResourceScope): AcademyResolvedResource[] {
  const out: AcademyResolvedResource[] = [];
  const seen = new Set<string>();
  const push = (r: AcademyResolvedResource) => {
    if (seen.has(r.resourceId)) return;
    seen.add(r.resourceId);
    out.push(r);
  };

  // 1. Module-hardcoded resources.
  for (const r of scope.moduleResources ?? []) push(fromModule(r));

  // 2. RBT seeded resources matched by source module id —
  // only when the module actually comes from the RBT curriculum.
  const isRbtScope = scope.sourceKind === "rbt" || scope.journeySlug === "rbt";
  if (isRbtScope && scope.sourceModuleId) {
    for (const r of getRbtResourcesForModule(STARTER_RBT_RESOURCES, scope.sourceModuleId)) {
      push(fromRbt(r));
    }
  }

  // 3. Admin attachments at module / day / journey scope.
  for (const a of listAttachmentsForScope({
    journeySlug: scope.journeySlug,
    dayId: scope.dayId,
    moduleId: scope.moduleId,
    rbtTrackId: scope.rbtTrackId,
  })) {
    push(fromAttachment(a));
  }

  return out;
}