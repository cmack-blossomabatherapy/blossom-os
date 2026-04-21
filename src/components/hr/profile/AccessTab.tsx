import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/hr/types";

export function AccessTab({ employee }: { employee: Employee }) {
  const items = [
    { label: "Blossom OS account", on: !!employee.user_id, hint: employee.user_id ? "Linked" : "Not linked" },
    { label: "Employee resource hub", on: employee.resource_hub_access, hint: employee.resource_hub_access ? "Granted" : "Disabled" },
    { label: "Clinic kiosk clock-in", on: employee.kiosk_enabled, hint: employee.kiosk_enabled ? "PIN active" : "Disabled" },
    { label: "Viventium payroll", on: !!employee.viventium_employee_id, hint: employee.viventium_sync_status ?? "Not connected" },
    { label: "CentralReach", on: false, hint: "Manual setup required" },
  ];
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">System access</h3>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40">
            {it.on ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{it.label}</p>
              <p className={cn("text-[11px]", it.on ? "text-muted-foreground" : "text-muted-foreground/70")}>{it.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}