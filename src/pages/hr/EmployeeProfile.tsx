import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmployeeStatusBadge } from "@/components/hr/HRStatusBadge";
import { employeeFullName, type Department, type Employee } from "@/lib/hr/types";
import { useAuth } from "@/contexts/AuthContext";
import { OverviewTab } from "@/components/hr/profile/OverviewTab";
import { EmploymentTab } from "@/components/hr/profile/EmploymentTab";
import { HierarchyTab } from "@/components/hr/profile/HierarchyTab";
import { TasksTab } from "@/components/hr/profile/TasksTab";
import { DocumentsTab } from "@/components/hr/profile/DocumentsTab";
import { NotesTab } from "@/components/hr/profile/NotesTab";
import { TimelineTab } from "@/components/hr/profile/TimelineTab";
import { AccessTab } from "@/components/hr/profile/AccessTab";
import { CasesTab } from "@/components/hr/profile/CasesTab";
import { PlaceholderTab } from "@/components/hr/profile/PlaceholderTab";
import { TimeClockTab } from "@/components/hr/profile/TimeClockTab";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const { hasPerm } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) void load(id); }, [id]);

  async function load(empId: string) {
    setLoading(true);
    const { data: emp } = await supabase.from("employees").select("*").eq("id", empId).maybeSingle();
    setEmployee(emp as Employee | null);
    if (emp?.department_id) {
      const { data: dept } = await supabase.from("hr_departments").select("*").eq("id", emp.department_id).maybeSingle();
      setDepartment(dept ?? null);
    } else {
      setDepartment(null);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!employee) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button asChild variant="outline" size="sm" className="mt-3"><Link to="/hr/directory">Back to directory</Link></Button>
      </div>
    );
  }

  const showPayroll = hasPerm("hr.payroll.view");
  const showNotes = hasPerm("hr.notes.view");
  const showCases = hasPerm("hr.cases.view");
  const showTimeClock = hasPerm("hr.timeclock.view");

  return (
    <div className="space-y-4 animate-fade-in">
      <Link to="/hr/directory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to directory
      </Link>

      <Card className="p-5">
        <div className="flex flex-col md:flex-row gap-5 md:items-start">
          <EmployeeAvatar employee={employee} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold text-foreground">{employeeFullName(employee)}</h1>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <p className="text-sm text-muted-foreground">{employee.job_title}{department ? ` · ${department.name}` : ""}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
              {employee.email && <Info icon={Mail}>{employee.email}</Info>}
              {employee.phone && <Info icon={Phone}>{employee.phone}</Info>}
              <Info icon={MapPin}>{employee.state}{employee.clinic ? ` · ${employee.clinic}` : ""}</Info>
              {employee.start_date && <Info icon={Calendar}>Started {employee.start_date}</Info>}
              {employee.employee_code && <Info icon={Building2}>{employee.employee_code}</Info>}
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/40 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          {showPayroll && <TabsTrigger value="payroll">Payroll</TabsTrigger>}
          {showTimeClock && <TabsTrigger value="timeclock">Time / Hours</TabsTrigger>}
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {showNotes && <TabsTrigger value="notes">Notes</TabsTrigger>}
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          {showCases && <TabsTrigger value="cases">Cases</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview"><OverviewTab employee={employee} department={department} /></TabsContent>
        <TabsContent value="employment"><EmploymentTab employee={employee} department={department} onChange={() => load(employee.id)} /></TabsContent>
        <TabsContent value="hierarchy"><HierarchyTab employee={employee} /></TabsContent>
        <TabsContent value="tasks"><TasksTab employee={employee} /></TabsContent>
        <TabsContent value="reviews"><PlaceholderTab title="Reviews + Performance" message="3-month, 6-month, BCBA support meetings, ratings, signatures, bonus triggers — coming in Phase 3." /></TabsContent>
        <TabsContent value="training"><PlaceholderTab title="Training + Compliance" message="Onboarding modules, role/state-specific training, recurring requirements, expiration alerts — coming in Phase 3." /></TabsContent>
        {showPayroll && <TabsContent value="payroll"><PlaceholderTab title="Payroll" message={`Pay rate: ${employee.pay_rate ? `$${employee.pay_rate}` : "not set"}. Viventium status: ${employee.viventium_sync_status ?? "not connected"}. Full workflows coming in Phase 3.`} /></TabsContent>}
        {showTimeClock && <TabsContent value="timeclock"><TimeClockTab employee={employee} /></TabsContent>}
        <TabsContent value="documents"><DocumentsTab employee={employee} /></TabsContent>
        {showNotes && <TabsContent value="notes"><NotesTab employee={employee} /></TabsContent>}
        <TabsContent value="communication"><PlaceholderTab title="Communication Timeline" message="Linked emails, calls, meetings, follow-ups arrive in Phase 4." /></TabsContent>
        <TabsContent value="timeline"><TimelineTab employee={employee} /></TabsContent>
        <TabsContent value="access"><AccessTab employee={employee} /></TabsContent>
        {showCases && <TabsContent value="cases"><CasesTab employee={employee} /></TabsContent>}
      </Tabs>
    </div>
  );
}

function Info({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{children}</span>;
}