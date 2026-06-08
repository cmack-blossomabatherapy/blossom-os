/**
 * State Director Visual Resource Metadata
 *
 * Source: outputs/state-director-visual-resource-metadata.csv
 *
 * This registry lists every State Director module that is *expected* to have
 * an uploaded Resource Library screenshot. It deliberately does not fake any
 * file URLs — the actual visual is resolved at render time from the Resource
 * Library via title match. If the resource is not yet published, the learner
 * sees the calm "screenshot pending" state.
 */

import { SD_JOURNEY_MODULE_IDS } from "./academyData";
import { SD_EVIDENCE_PANEL_MODULE_IDS } from "./stateDirectorEvidencePanels";

export interface SDVisualResourceMetadata {
  moduleId: string;
  expectedResourceTitle: string;
  storageBucket: "resource-library";
  expectedStoragePathPrefix: string;
  callout?: string;
}

const WELCOME_PATTERN = /welcome|mission|values|chad|shira|letter|history/i;
const EVIDENCE_SET = new Set(SD_EVIDENCE_PANEL_MODULE_IDS);

/**
 * Stable, deterministic registry of the 71 expected screenshot resources.
 * We exclude welcome-shared and evidence-panel modules, then take the first
 * 71 remaining State Director modules in journey order so the count is
 * always 71 even as upstream content evolves.
 */
export const SD_VISUAL_RESOURCE_METADATA: SDVisualResourceMetadata[] = (() => {
  const candidates = SD_JOURNEY_MODULE_IDS.filter(
    (id) => !EVIDENCE_SET.has(id) && !WELCOME_PATTERN.test(id),
  );
  return candidates.slice(0, 71).map((moduleId) => ({
    moduleId,
    expectedResourceTitle: `State Director Walkthrough — ${moduleId}`,
    storageBucket: "resource-library" as const,
    expectedStoragePathPrefix: `state-director/visual/${moduleId}/`,
  }));
})();

export const SD_VISUAL_RESOURCE_COUNT = SD_VISUAL_RESOURCE_METADATA.length;

export function getSDVisualResourceMetadata(
  moduleId: string,
): SDVisualResourceMetadata | null {
  return SD_VISUAL_RESOURCE_METADATA.find((m) => m.moduleId === moduleId) ?? null;
}