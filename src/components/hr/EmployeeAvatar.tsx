import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { employeeFullName, employeeInitials, type Employee } from "@/lib/hr/types";

interface Props {
  employee: Pick<Employee, "first_name" | "last_name" | "preferred_name" | "avatar_url">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-20 w-20 text-lg",
};

export function EmployeeAvatar({ employee, size = "md", className }: Props) {
  return (
    <Avatar className={cn(SIZE_CLASS[size], "border border-border/40", className)}>
      {employee.avatar_url && <AvatarImage src={employee.avatar_url} alt={employeeFullName(employee)} />}
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {employeeInitials(employee)}
      </AvatarFallback>
    </Avatar>
  );
}