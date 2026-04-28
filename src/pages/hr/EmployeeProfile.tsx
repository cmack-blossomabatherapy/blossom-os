import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, Briefcase, Wallet } from "lucide-react";
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
import { ReviewsTab } from "@/components/hr/profile/ReviewsTab";
import { TrainingTab } from "@/components/hr/profile/TrainingTab";
import { PayrollTab } from "@/components/hr/profile/PayrollTab";
import { EmployeeInfoEditor } from "@/components/hr/profile/EmployeeInfoEditor";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const { hasPerm } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) void load(id); }, [id]);

  async function load(empId: string) {
    setLoading(true);
    const [{ data: emp }, { data: deptRows }] = await Promise.all([
      supabase.from("employees").select("*").eq("id", empId).maybeSingle(),
      supabase.from("hr_departments").select("*").order("name"),
    ]);
    const allDepartments = (deptRows ?? []) as Department[];
    setDepartments(allDepartments);
    setEmployee(emp as Employee | null);
    if (emp?.department_id) {
      setDepartment(allDepartments.find((dept) => dept.id === emp.department_id) ?? null);
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
  const showReviews = hasPerm("hr.reviews.view");
  const showTraining = hasPerm("hr.training.view");
  const showCompensation = hasPerm("hr.bonuses.view") || hasPerm("hr.paychanges.view") || hasPerm("hr.payroll.view");
  const canEditEmployee = hasPerm("hr.employees.edit");
  const canEditPayroll = hasPerm("hr.payroll.edit") || hasPerm("hr.paychanges.manage");

  return (
    <div className="space-y-4 animate-fade-in">
      <Link to="/hr/directory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to directory
      </Link>

      <Card className="overflow-hidden">
        <div className="border-b border-border/50 bg-secondary/25 px-5 py-3 flex items-center justify-between gap-3">
          <Link to="/hr/directory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Directory
          </Link>
          <EmployeeInfoEditor employee={employee} departments={departments} canEditEmployee={canEditEmployee} canEditPayroll={canEditPayroll} onSaved={() => load(employee.id)} />
        </div>
        <div className="p-5 flex flex-col gap-5 md:flex-row md:items-start">
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
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ProfileStat icon={Briefcase} label="Employment" value={`${employee.employment_type.replace("_", " ")} · ${employee.work_setting}`} />
              <ProfileStat icon={Wallet} label="Payroll" value={`${employee.pay_type}${employee.pay_rate ? ` · $${employee.pay_rate}` : ""}`} />
              <ProfileStat icon={Calendar} label="Next review" value={employee.next_review_date ?? "Not scheduled"} />
              <ProfileStat icon={Building2} label="Systems" value={employee.viventium_employee_id ? `Viventium ${employee.viventium_employee_id}` : "Not connected"} />
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
          {showCompensation && <TabsTrigger value="payroll">Payroll</TabsTrigger>}
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
        {showReviews && <TabsContent value="reviews"><ReviewsTab employee={employee} /></TabsContent>}
        {!showReviews && <TabsContent value="reviews"><PlaceholderTab title="Reviews" message="You don't have permission to view performance reviews." /></TabsContent>}
        {showTraining && <TabsContent value="training"><TrainingTab employee={employee} /></TabsContent>}
        {!showTraining && <TabsContent value="training"><PlaceholderTab title="Training" message="You don't have permission to view training assignments." /></TabsContent>}
        {showCompensation && <TabsContent value="payroll"><PayrollTab employee={employee} onChange={() => load(employee.id)} /></TabsContent>}
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

function ProfileStat({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/25 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}