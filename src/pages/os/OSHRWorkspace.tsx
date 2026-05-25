import { Workflow, GraduationCap, ClipboardCheck, ShieldCheck, Inbox, MessageSquare } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHRWorkspace() {
  return (
    <HRShellPage
      title="HR Workspace"
      subtitle="Operational home base"
      icon={Workflow}
      intent="Your daily execution surface — orientation, onboarding, training completion, and employee support, all in one calm flow."
      kpis={[
        { label: "Onboarding open", value: "—", hint: "Connect data in Phase 2" },
        { label: "Orientation this week", value: "—" },
        { label: "Training overdue", value: "—" },
        { label: "Open requests", value: "—" },
        { label: "Evaluations due", value: "—" },
      ]}
      sections={[
        { title: "Today", description: "Items that need a recruiter or HR coordinator touch right now.", body: <p className="text-sm text-muted-foreground">Live queue wires in Phase 2 (employees + onboarding_tasks + hr_requests).</p> },
        { title: "Stalled", description: "Employees stuck in a stage for more than 3 days.", body: <p className="text-sm text-muted-foreground">Pulls from employees + orientation slots in Phase 2.</p> },
        { title: "Closing this week", description: "Orientation, certifications, and evaluations wrapping up.", body: <p className="text-sm text-muted-foreground">Connects to live calendar + training data.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">Ask “Who’s stalled in onboarding?” or “Show overdue trainings this week.”</p>}
    />
  );
}
void GraduationCap; void ClipboardCheck; void ShieldCheck; void Inbox; void MessageSquare;