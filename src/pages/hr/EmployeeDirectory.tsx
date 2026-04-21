import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IdCard, Search, Plus, Filter } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeStatusBadge } from "@/components/hr/HRStatusBadge";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { AddEmployeeDialog } from "@/components/hr/AddEmployeeDialog";
import { employeeFullName, HR_STATES, type Department, type Employee, type EmployeeStatus } from "@/lib/hr/types";
import { useAuth } from "@/contexts/AuthContext";

export default function EmployeeDirectory() {
  const { hasPerm } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openAdd, setOpenAdd] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [emp, dept] = await Promise.all([
      supabase.from("employees").select("*").order("last_name"),
      supabase.from("hr_departments").select("*").order("name"),
    ]);
    setEmployees((emp.data ?? []) as Employee[]);
    setDepartments(dept.data ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (stateFilter !== "all" && e.state !== stateFilter) return false;
      if (deptFilter !== "all" && e.department_id !== deptFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (q) {
        const hay = `${employeeFullName(e)} ${e.job_title} ${e.email ?? ""} ${e.employee_code ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, stateFilter, deptFilter, statusFilter]);

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? "—";

  return (
    <PageShell
      title="Employee Directory"
      description={`${filtered.length} of ${employees.length} employees`}
      icon={IdCard}
      actions={
        hasPerm("hr.employees.create") ? (
          <Button size="sm" onClick={() => setOpenAdd(true)}>
            <Plus className="h-4 w-4" /> Add employee
          </Button>
        ) : null
      }
    >
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, title, code, email…" className="pl-9 h-9" />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="h-9 w-[140px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {HR_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending_start">Pending Start</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No employees match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-3 py-2.5 font-medium">Title</th>
                  <th className="px-3 py-2.5 font-medium">Department</th>
                  <th className="px-3 py-2.5 font-medium">State / Clinic</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Start</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link to={`/hr/employees/${e.id}`} className="flex items-center gap-2.5 group">
                        <EmployeeAvatar employee={e} size="md" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary truncate">{employeeFullName(e)}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{e.email ?? e.employee_code ?? "—"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-foreground">{e.job_title}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{deptName(e.department_id)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{e.state}{e.clinic ? ` · ${e.clinic}` : ""}</td>
                    <td className="px-3 py-2.5 text-muted-foreground capitalize">{e.employment_type.replace("_", " ")} · {e.pay_type}</td>
                    <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{e.start_date ?? "—"}</td>
                    <td className="px-3 py-2.5"><EmployeeStatusBadge status={e.status as EmployeeStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddEmployeeDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        departments={departments}
        onCreated={() => { setOpenAdd(false); void load(); }}
      />
    </PageShell>
  );
}