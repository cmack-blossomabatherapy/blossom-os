import { UserPlus } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHRNewHires() {
  return (
    <HRShellPage
      title="New Hires"
      subtitle="Onboarding visibility for every recent hire"
      icon={UserPlus}
      intent="Track every new hire from offer-accepted through fully ready to staff. Surface blockers early."
      kpis={[
        { label: "New hires (30d)", value: "—" },
        { label: "Onboarding active", value: "—" },
        { label: "Stalled > 3d", value: "—" },
        { label: "Ready to staff", value: "—" },
        { label: "Avg time to ready", value: "—" },
      ]}
      sections={[
        { title: "Active onboarding", description: "Connects to recruiting_candidates (Onboarding stage) + employees (pending_start).", body: <p className="text-sm text-muted-foreground">Live list ships in Phase 2.</p> },
        { title: "Blockers", description: "Missing forms, BG check pending, orientation not scheduled.", body: <p className="text-sm text-muted-foreground">Wires to onboarding_tasks + background_checks + orientation.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">“Which new hires haven’t completed Viventium?”</p>}
    />
  );
}