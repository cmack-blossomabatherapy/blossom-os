import { ClipboardCheck } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHREvaluations() {
  return (
    <HRShellPage
      title="Evaluations & Growth"
      subtitle="Coaching, performance, and development"
      icon={ClipboardCheck}
      intent="Surface upcoming and overdue evaluations, plus growth conversations that move people forward."
      kpis={[
        { label: "Evaluations due", value: "—" },
        { label: "Overdue", value: "—" },
        { label: "Coaching plans", value: "—" },
        { label: "Promotions in flight", value: "—" },
        { label: "Avg score", value: "—" },
      ]}
      sections={[
        { title: "Upcoming evaluations", body: <p className="text-sm text-muted-foreground">Connects to employee_evaluations in Phase 2.</p> },
        { title: "Active coaching plans", body: <p className="text-sm text-muted-foreground">Live coaching data in Phase 2.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">“Which BCBAs have evaluations overdue?”</p>}
    />
  );
}