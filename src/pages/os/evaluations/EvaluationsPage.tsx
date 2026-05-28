import { useMemo, useState } from "react";
import { OSShell } from "../OSShell";
import { useOSRole } from "@/contexts/OSRoleContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus, CalendarPlus, Mail, Upload, Settings as SettingsIcon } from "lucide-react";
import { useEvaluationsData } from "./useEvaluationsData";
import AddStaffDialog from "./AddStaffDialog";
import CreateCycleDialog from "./CreateCycleDialog";
import StaffProfileDrawer from "./StaffProfileDrawer";
import OverviewTab from "./tabs/OverviewTab";
import StaffTab from "./tabs/StaffTab";
import CyclesTab from "./tabs/CyclesTab";
import FormsTab from "./tabs/FormsTab";
import EmailQueueTab from "./tabs/EmailQueueTab";
import ReportsTab from "./tabs/ReportsTab";
import SettingsTab from "./tabs/SettingsTab";
import ImportStaffDialog from "./ImportStaffDialog";
import { permissionsForRole, filterStaffByScope, filterEvaluationsByScope } from "./permissions";
import type { EvalStaff } from "./types";

function roleLabel(role: string, state: string) {
  switch (role) {
    case "super_admin": return "Super Admin View";
    case "executive_leadership": return "Executive View";
    case "hr_team": return "HR View";
    case "operations_leadership":
    case "qa_team":
    case "bcba":
      return "Clinical Leadership View";
    case "state_director": return `State View · ${state}`;
    default: return "Evaluations";
  }
}

export default function EvaluationsPage() {
  const { role, activeState } = useOSRole();
  const perms = useMemo(() => permissionsForRole(role), [role]);
  const data = useEvaluationsData();
  const [tab, setTab] = useState("overview");
  const [addOpen, setAddOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [openStaffId, setOpenStaffId] = useState<string | null>(null);

  // Scope data by permissions
  const visibleStaff = useMemo(() => filterStaffByScope(data.staff, perms, activeState), [data.staff, perms, activeState]);
  const visibleEvals = useMemo(() => filterEvaluationsByScope(data.evaluations, visibleStaff), [data.evaluations, visibleStaff]);
  const scopedData = useMemo(() => ({ ...data, staff: visibleStaff, evaluations: visibleEvals }), [data, visibleStaff, visibleEvals]);

  const supervisors = useMemo(() => data.staff.filter((s) => s.role === "BCBA"), [data.staff]);
  const openStaff: EvalStaff | null = useMemo(
    () => visibleStaff.find((s) => s.id === openStaffId) ?? null,
    [visibleStaff, openStaffId],
  );

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Evaluations</h1>
                <span className="inline-flex items-center rounded-full border border-border/70 bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {roleLabel(role, activeState)}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
                Track BCBA and RBT quarterly and annual evaluations, self-evaluations, leadership reviews, meetings, and completion status.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {perms.canManageCycles && (
              <Button variant="outline" size="sm" onClick={() => setCycleOpen(true)}>
                <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> New Cycle
              </Button>
            )}
            {perms.canImportStaff && (
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Import
              </Button>
            )}
            {perms.canManageStaff && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Staff Member
              </Button>
            )}
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            {perms.canManageCycles && <TabsTrigger value="cycles">Evaluation Cycles</TabsTrigger>}
            {perms.canManageForms && <TabsTrigger value="forms">Forms</TabsTrigger>}
            {perms.canManageEmails && <TabsTrigger value="emails"><Mail className="h-3.5 w-3.5 mr-1" />Email Queue</TabsTrigger>}
            {perms.canViewReports && <TabsTrigger value="reports">Reports</TabsTrigger>}
            <TabsTrigger value="settings"><SettingsIcon className="h-3.5 w-3.5 mr-1" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab data={scopedData} onGoToStaff={() => setTab("staff")} onGoToEmails={() => setTab("emails")} />
          </TabsContent>
          <TabsContent value="staff">
            <StaffTab data={scopedData} onOpenStaff={setOpenStaffId} onAddStaff={() => setAddOpen(true)} />
          </TabsContent>
          {perms.canManageCycles && <TabsContent value="cycles"><CyclesTab data={data} onNewCycle={() => setCycleOpen(true)} /></TabsContent>}
          {perms.canManageForms && <TabsContent value="forms"><FormsTab data={data} /></TabsContent>}
          {perms.canManageEmails && <TabsContent value="emails"><EmailQueueTab data={data} /></TabsContent>}
          {perms.canViewReports && <TabsContent value="reports"><ReportsTab data={scopedData} /></TabsContent>}
          <TabsContent value="settings"><SettingsTab data={data} canEdit={perms.canManageSettings} /></TabsContent>
        </Tabs>
      </div>

      <AddStaffDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        supervisors={supervisors}
        onCreated={data.refresh}
      />
      <CreateCycleDialog open={cycleOpen} onOpenChange={setCycleOpen} onCreated={data.refresh} />
      <ImportStaffDialog open={importOpen} onOpenChange={setImportOpen} existing={data.staff} onImported={data.refresh} />
      <StaffProfileDrawer
        staff={openStaff}
        evaluations={data.evaluations}
        cycles={data.cycles}
        meetings={data.meetings}
        notes={data.notes}
        templates={data.templates}
        responses={data.responses}
        allStaff={data.staff}
        audit={data.audit}
        permissions={perms}
        onClose={() => setOpenStaffId(null)}
        onChanged={data.refresh}
      />
    </OSShell>
  );
}