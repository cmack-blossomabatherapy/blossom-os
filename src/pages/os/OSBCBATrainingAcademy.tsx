import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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
      <div className="mx-auto w-full max-w-6xl px-6 pt-5 md:px-10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/bcba" className="hover:text-foreground transition-colors">BCBA</Link>
          <ChevronRight className="size-3" />
          <span>Training Academy</span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Link to="/academy" className="text-primary hover:underline">Training Academy home</Link>
            <ChevronRight className="size-3" />
            <Link to="/academy/path/bcba" className="text-primary hover:underline">Unified LMS view</Link>
          </span>
        </div>
      </div>
      <BCBAJourney />
    </OSShell>
  );
}