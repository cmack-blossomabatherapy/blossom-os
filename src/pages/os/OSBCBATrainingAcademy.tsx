import { OSShell } from "./OSShell";
import BCBAJourney from "@/pages/training/BCBAJourney";

/**
 * BCBA Training Academy — wraps the BCBA Journey curriculum in the
 * BCBA OS shell so it matches the new BCBA design system (sidebar,
 * role-scoped chrome) while preserving the existing training content.
 */
export default function OSBCBATrainingAcademy() {
  return (
    <OSShell>
      <BCBAJourney />
    </OSShell>
  );
}