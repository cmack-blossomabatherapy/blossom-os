import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { ClinicalWorkItemPanel, type ClinicalWorkItemPanelProps } from "./ClinicalWorkItemPanel";

/**
 * Role-aware Clinical Director surface.
 *
 * Renders the reusable {@link ClinicalWorkItemPanel} ONLY when the current
 * OS role resolves to `clinical_director`. This lets shared QA-owned pages
 * (BCBA oversight, supervision, treatment plans, progress reports,
 * escalations) and the shared evaluations page pick up the durable Clinical
 * Director workflow layer without disturbing QA/HR behavior for other roles.
 */
export function ClinicalDirectorSection(props: ClinicalWorkItemPanelProps) {
  const ctx = useOSRoleSafe();
  if (!ctx || ctx.role !== "clinical_director") return null;
  return <ClinicalWorkItemPanel {...props} />;
}

export default ClinicalDirectorSection;