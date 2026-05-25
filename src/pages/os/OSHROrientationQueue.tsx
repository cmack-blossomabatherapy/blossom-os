import { CalendarClock } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHROrientationQueue() {
  return (
    <HRShellPage
      title="Orientation Queue"
      subtitle="Who’s scheduled, who attended, who missed"
      icon={CalendarClock}
      intent="Keep orientation on rails — confirm attendance, reschedule no-shows, hand off to onboarding cleanly."
      kpis={[
        { label: "This week", value: "—" },
        { label: "Confirmed", value: "—" },
        { label: "No-shows (30d)", value: "—" },
        { label: "Awaiting reschedule", value: "—" },
        { label: "Completed (30d)", value: "—" },
      ]}
      sections={[
        { title: "Upcoming sessions", body: <p className="text-sm text-muted-foreground">Already-built `orientation` table powers this in Phase 2.</p> },
        { title: "Needs reschedule", body: <p className="text-sm text-muted-foreground">No-shows + cancellations needing HR follow-up.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">“Show me orientation attendance trend.”</p>}
    />
  );
}