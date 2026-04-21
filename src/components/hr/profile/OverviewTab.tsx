import { Card } from "@/components/ui/card";
import type { Department, Employee } from "@/lib/hr/types";

export function OverviewTab({ employee, department }: { employee: Employee; department: Department | null }) {
  const items: { label: string; value: string }[] = [
    { label: "Job title", value: employee.job_title },
    { label: "Department", value: department?.name ?? "—" },
    { label: "State", value: employee.state },
    { label: "Clinic", value: employee.clinic ?? "—" },
    { label: "Employment type", value: employee.employment_type.replace("_", " ") },
    { label: "Pay type", value: employee.pay_type },
    { label: "Work setting", value: employee.work_setting },
    { label: "Hire date", value: employee.hire_date ?? "—" },
    { label: "Start date", value: employee.start_date ?? "—" },
    { label: "Last review", value: employee.last_review_date ?? "—" },
    { label: "Next review", value: employee.next_review_date ?? "—" },
    { label: "Employee code", value: employee.employee_code ?? "—" },
  ];
  return (
    <Card className="p-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
        {items.map((it) => (
          <div key={it.label}>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{it.label}</p>
            <p className="text-sm text-foreground mt-0.5 capitalize">{it.value}</p>
          </div>
        ))}
      </div>
      {employee.notes && (
        <div className="mt-5 pt-5 border-t border-border/40">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Notes</p>
          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{employee.notes}</p>
        </div>
      )}
    </Card>
  );
}