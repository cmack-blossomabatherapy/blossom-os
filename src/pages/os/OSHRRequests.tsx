import { Inbox } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHRRequests() {
  return (
    <HRShellPage
      title="HR Requests"
      subtitle="PTO, schedule changes, document requests, concerns"
      icon={Inbox}
      intent="A single, calm inbox for everything employees ask HR for — with clear owners and SLAs."
      kpis={[
        { label: "Open", value: "—" },
        { label: "Awaiting HR", value: "—" },
        { label: "Awaiting employee", value: "—" },
        { label: "Closed (30d)", value: "—" },
        { label: "Avg resolve", value: "—" },
      ]}
      sections={[
        { title: "Awaiting HR action", body: <p className="text-sm text-muted-foreground">Wires to hr_requests in Phase 2.</p> },
        { title: "In progress", body: <p className="text-sm text-muted-foreground">Requests under review or pending docs.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">“How many PTO requests are pending approval?”</p>}
    />
  );
}