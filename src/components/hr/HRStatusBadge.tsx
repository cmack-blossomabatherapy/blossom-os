import { cn } from "@/lib/utils";
import { EMPLOYEE_STATUS_META, type EmployeeStatus } from "@/lib/hr/types";

export function EmployeeStatusBadge({ status, className }: { status: EmployeeStatus; className?: string }) {
  const meta = EMPLOYEE_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        meta.tone,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {meta.label}
    </span>
  );
}