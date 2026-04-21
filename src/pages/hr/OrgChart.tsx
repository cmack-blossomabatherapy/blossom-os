import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Network } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmployeeStatusBadge } from "@/components/hr/HRStatusBadge";
import { employeeFullName, type Employee } from "@/lib/hr/types";

export default function OrgChart() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("employees").select("*").neq("status", "terminated").order("last_name");
      setEmployees((data ?? []) as Employee[]);
      setLoading(false);
    })();
  }, []);

  const byState = useMemo(() => {
    const map = new Map<string, Employee[]>();
    employees.forEach((e) => {
      const list = map.get(e.state) ?? [];
      list.push(e); map.set(e.state, list);
    });
    return Array.from(map.entries()).sort();
  }, [employees]);

  return (
    <PageShell title="Org Chart" description="Employees grouped by state and department." icon={Network}>
      {loading ? <Skeleton className="h-64" /> : (
        <div className="space-y-4">
          {byState.map(([state, emps]) => {
            const byDept = new Map<string, Employee[]>();
            emps.forEach((e) => {
              const key = e.job_title.includes("Director") || e.job_title.includes("Manager") ? "Leadership" : "Team";
              const list = byDept.get(key) ?? [];
              list.push(e); byDept.set(key, list);
            });
            return (
              <Card key={state} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold">{state}</h2>
                  <span className="text-xs text-muted-foreground">{emps.length} employees</span>
                </div>
                <div className="space-y-3">
                  {Array.from(byDept.entries()).map(([group, list]) => (
                    <div key={group}>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{group}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {list.map((e) => (
                          <Link key={e.id} to={`/hr/employees/${e.id}`} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:bg-muted/30">
                            <EmployeeAvatar employee={e} size="md" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{employeeFullName(e)}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{e.job_title}</p>
                            </div>
                            <EmployeeStatusBadge status={e.status} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}