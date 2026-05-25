import { HeartHandshake } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHREmployeeSupport() {
  return (
    <HRShellPage
      title="Employee Support"
      subtitle="People operations — calm, supportive, organized"
      icon={HeartHandshake}
      intent="Help RBTs, BCBAs, and operations staff move through anything that’s blocking them. Stay close to the humans behind the numbers."
      kpis={[
        { label: "Open conversations", value: "—" },
        { label: "Awaiting HR", value: "—" },
        { label: "Coaching plans", value: "—" },
        { label: "Stay interviews", value: "—" },
        { label: "Retention risk", value: "—" },
      ]}
      sections={[
        { title: "Active support cases", description: "Employees who currently need HR follow-up.", body: <p className="text-sm text-muted-foreground">Wires to a future employee_support_cases table in Phase 2.</p> },
        { title: "Recently resolved", description: "Last 14 days — keep visibility short.", body: <p className="text-sm text-muted-foreground">Live history in Phase 2.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">“Summarize this week’s employee concerns.”</p>}
    />
  );
}