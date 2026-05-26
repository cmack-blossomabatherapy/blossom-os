import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { OpsPage, OpsCard } from "./_shared";

const LEADERSHIP_RESOURCES = [
  { title: "Escalation SOP", desc: "When and how to escalate operational issues to leadership." },
  { title: "Cross-department workflows", desc: "How intake, auth, scheduling, and QA hand off work." },
  { title: "Accountability standards", desc: "Expectations for follow-through across roles." },
  { title: "Staffing readiness standards", desc: "What 'ready to staff' means at each step." },
  { title: "Payroll readiness standards", desc: "Cycle close checklist and deadlines." },
  { title: "Operational reporting guide", desc: "Which reports leadership reviews and when." },
];

export default function OpsResourceLibrary() {
  return (
    <OpsPage title="Resource Library" subtitle="Executive SOPs, leadership workflows, and operational standards.">
      <div className="grid gap-3 md:grid-cols-2">
        {LEADERSHIP_RESOURCES.map((r) => (
          <OpsCard key={r.title} className="!p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-muted p-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-medium tracking-tight text-foreground">{r.title}</div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">{r.desc}</div>
              </div>
            </div>
          </OpsCard>
        ))}
      </div>

      <div className="text-[12px] text-muted-foreground">
        Looking for company-wide SOPs?{" "}
        <Link to="/sop" className="text-primary hover:opacity-80">Open the full Resource Library</Link>.
      </div>
    </OpsPage>
  );
}