import { GraduationCap } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHRTrainingCerts() {
  return (
    <HRShellPage
      title="Training & Certifications"
      subtitle="Completion, expirations, and assignments"
      icon={GraduationCap}
      intent="Track who needs what, what’s overdue, and what’s expiring — without the LMS clutter."
      kpis={[
        { label: "Overdue trainings", value: "—" },
        { label: "Due in 14 days", value: "—" },
        { label: "Certifications expiring", value: "—" },
        { label: "Avg completion", value: "—" },
        { label: "Recently assigned", value: "—" },
      ]}
      sections={[
        { title: "Overdue", description: "Employees with trainings past their due date.", body: <p className="text-sm text-muted-foreground">Wires to training_assignments + completions in Phase 2.</p> },
        { title: "Expiring certifications", description: "BACB, HIPAA, CPR/First Aid, state-specific credentials.", body: <p className="text-sm text-muted-foreground">Pulls from employee_certifications in Phase 2.</p> },
        { title: "Recent assignments", description: "What HR has pushed out recently.", body: <p className="text-sm text-muted-foreground">Live feed in Phase 2.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">“Who hasn’t completed the New RBT Welcome track?”</p>}
    />
  );
}