/**
 * Deterministic State Director module → SOP map.
 *
 * Source of truth: SD_JOURNEY_STRUCTURE + SD_SOPS_BY_WEEK in academyData.ts.
 * Module ids match the real ids produced by `buildSdModule`
 * (`sd-w{week}d{day}-{slugify(title)}`), NOT the legacy `sd-wXdY-posN` slug
 * used by older manifest builds.
 */
import { SD_JOURNEY_STRUCTURE, SD_SOPS_BY_WEEK } from "@/lib/training/academyData";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export interface SdModuleSopLink {
  moduleId: string;
  week: number;
  day: number;
  position: number;
  moduleTitle: string;
  sopTitle: string | null;
}

function build(): SdModuleSopLink[] {
  const out: SdModuleSopLink[] = [];
  for (const w of SD_JOURNEY_STRUCTURE) {
    for (const d of w.days) {
      d.modules.forEach((moduleTitle, idx) => {
        const moduleId = `sd-w${w.week}d${d.day}-${slugify(moduleTitle)}`;
        const sopTitle = SD_SOPS_BY_WEEK[w.week]?.[d.day]?.[idx] ?? null;
        out.push({
          moduleId,
          week: w.week,
          day: d.day,
          position: idx,
          moduleTitle,
          sopTitle,
        });
      });
    }
  }
  return out;
}

export const SD_MODULE_SOP_LINKS: SdModuleSopLink[] = build();

const BY_MODULE: Record<string, SdModuleSopLink> = (() => {
  const m: Record<string, SdModuleSopLink> = {};
  for (const l of SD_MODULE_SOP_LINKS) m[l.moduleId] = l;
  return m;
})();

/** Real SOP title (with " SOP" suffix) for a given module id — null if module has no SOP. */
export function getSopTitleForModule(moduleId: string): string | null {
  return BY_MODULE[moduleId]?.sopTitle ?? null;
}

export function getSdModuleLink(moduleId: string): SdModuleSopLink | null {
  return BY_MODULE[moduleId] ?? null;
}