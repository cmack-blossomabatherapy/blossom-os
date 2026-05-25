import { MessageSquare } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHRMessages() {
  return (
    <HRShellPage
      title="Messages & Updates"
      subtitle="Conversations with employees, managers, and teams"
      icon={MessageSquare}
      intent="One thread for every employee touchpoint — onboarding nudges, orientation confirmations, training reminders, support follow-ups."
      kpis={[
        { label: "Unread", value: "—" },
        { label: "Awaiting reply", value: "—" },
        { label: "Sent (today)", value: "—" },
        { label: "Templates used", value: "—" },
        { label: "Avg reply", value: "—" },
      ]}
      sections={[
        { title: "Conversations", body: <p className="text-sm text-muted-foreground">Wires to hr_messages in Phase 2.</p> },
        { title: "Announcement drafts", body: <p className="text-sm text-muted-foreground">Pulls from /hr/announcements drafts.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">“Draft an orientation reminder for next Monday’s cohort.”</p>}
    />
  );
}