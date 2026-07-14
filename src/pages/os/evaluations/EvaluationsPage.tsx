import { useMemo, useState } from "react";
import { OSShell } from "../OSShell";
import { useOSRole } from "@/contexts/OSRoleContext";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck, RefreshCw, Mail, Settings as SettingsIcon,
  LayoutGrid, Users as UsersIcon, CalendarDays, FileText, BarChart3, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEvaluationsData } from "./useEvaluationsData";
import StaffProfileDrawer from "./StaffProfileDrawer";
import OverviewTab from "./tabs/OverviewTab";
import StaffTab from "./tabs/StaffTab";
import ScheduleTab from "./tabs/ScheduleTab";
import FormsTab from "./tabs/FormsTab";
import EmailQueueTab from "./tabs/EmailQueueTab";
import ReportsTab from "./tabs/ReportsTab";
import SettingsTab from "./tabs/SettingsTab";
import LaunchChecklistTab from "./tabs/LaunchChecklistTab";
import AIInsightsTab from "./tabs/AIInsightsTab";
import GoalsCoachingTab from "./tabs/GoalsCoachingTab";
import ReviewerPerformanceTab from "./tabs/ReviewerPerformanceTab";
import { Rocket, Sparkles, Target, Users } from "lucide-react";
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
  const [staffView, setStaffView] = useState<import("./tabs/StaffTab").SavedView | undefined>(undefined);
  const [openStaffId, setOpenStaffId] = useState<string | null>(null);

  // Scope data by permissions
  const visibleStaff = useMemo(() => filterStaffByScope(data.staff, perms, activeState), [data.staff, perms, activeState]);
  const visibleEvals = useMemo(() => filterEvaluationsByScope(data.evaluations, visibleStaff), [data.evaluations, visibleStaff]);
  const scopedData = useMemo(() => ({ ...data, staff: visibleStaff, evaluations: visibleEvals }), [data, visibleStaff, visibleEvals]);

  const openStaff: EvalStaff | null = useMemo(
    () => visibleStaff.find((s) => s.id === openStaffId) ?? null,
    [visibleStaff, openStaffId],
  );

  // Tab definitions — split into primary (always visible) and overflow ("More")
  type TabDef = { value: string; label: string; icon: React.ComponentType<{ className?: string }>; show: boolean };
  const primaryTabs: TabDef[] = [
    { value: "overview", label: "Overview", icon: LayoutGrid, show: true },
    { value: "staff", label: "Staff", icon: UsersIcon, show: true },
    { value: "schedule", label: "Schedule", icon: CalendarDays, show: true },
    { value: "reports", label: "Reports", icon: BarChart3, show: perms.canViewReports },
    { value: "insights", label: "AI Insights", icon: Sparkles, show: perms.canViewReports },
  ].filter((t) => t.show);
  const moreTabs: TabDef[] = [
    { value: "forms", label: "Forms", icon: FileText, show: perms.canManageForms },
    { value: "emails", label: "Email Queue", icon: Mail, show: perms.canManageEmails },
    { value: "goals", label: "Goals & Coaching", icon: Target, show: perms.canManageStaff },
    { value: "reviewers", label: "Reviewers", icon: Users, show: perms.canViewReports },
    { value: "launch", label: "Launch", icon: Rocket, show: perms.canManageSettings },
    { value: "settings", label: "Settings", icon: SettingsIcon, show: true },
  ].filter((t) => t.show);
  const activeMore = moreTabs.find((t) => t.value === tab);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <ClipboardCheck className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] md:text-[26px] font-semibold tracking-tight leading-none">Evaluations</h1>
                <span className="hidden sm:inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                  {roleLabel(role, activeState)}
                </span>
              </div>
              <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-xl">
                Quarterly and annual evaluations for BCBA, RBT, and Office staff.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => data.refresh()}
              disabled={data.loading}
              className="h-9 rounded-full px-4 shadow-sm"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", data.loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          {/* Segmented pill nav — calm, hairline, scrollable on overflow */}
          <div className="mb-7 flex items-center gap-1.5 border-b border-border/60 pb-0">
            <div className="flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mb-px">
              {primaryTabs.map((t) => {
                const active = tab === t.value;
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={cn(
                      "group inline-flex items-center gap-1.5 whitespace-nowrap px-3 h-10 text-[13px] font-medium transition-colors relative",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground")} />
                    {t.label}
                    <span
                      className={cn(
                        "absolute left-2 right-2 -bottom-px h-[2px] rounded-full transition-opacity",
                        active ? "bg-primary opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                );
              })}
              {moreTabs.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "group inline-flex items-center gap-1.5 whitespace-nowrap px-3 h-10 text-[13px] font-medium transition-colors relative",
                        activeMore ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {activeMore ? (
                        <>
                          <activeMore.icon className="h-3.5 w-3.5 text-primary" />
                          {activeMore.label}
                        </>
                      ) : (
                        <>More</>
                      )}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                      <span
                        className={cn(
                          "absolute left-2 right-2 -bottom-px h-[2px] rounded-full transition-opacity",
                          activeMore ? "bg-primary opacity-100" : "opacity-0",
                        )}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {moreTabs.map((t) => {
                      const Icon = t.icon;
                      return (
                        <DropdownMenuItem key={t.value} onClick={() => setTab(t.value)} className={cn(tab === t.value && "bg-muted")}>
                          <Icon className="h-3.5 w-3.5 mr-2" />
                          {t.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <TabsContent value="overview">
            <OverviewTab
              data={scopedData}
              onDrill={(v) => { setStaffView(v); setTab("staff"); }}
              onGoToEmails={() => setTab("emails")}
            />
          </TabsContent>
          <TabsContent value="staff">
            <StaffTab data={scopedData} onOpenStaff={setOpenStaffId} initialView={staffView} />
          </TabsContent>
          <TabsContent value="schedule"><ScheduleTab data={scopedData} onOpenStaff={setOpenStaffId} /></TabsContent>
          {perms.canManageForms && <TabsContent value="forms"><FormsTab data={data} /></TabsContent>}
          {perms.canManageEmails && <TabsContent value="emails"><EmailQueueTab data={data} /></TabsContent>}
          {perms.canViewReports && <TabsContent value="reports"><ReportsTab data={scopedData} /></TabsContent>}
          {perms.canViewReports && <TabsContent value="insights"><AIInsightsTab data={data} /></TabsContent>}
          {perms.canManageStaff && <TabsContent value="goals"><GoalsCoachingTab data={scopedData} /></TabsContent>}
          {perms.canViewReports && <TabsContent value="reviewers"><ReviewerPerformanceTab data={scopedData} /></TabsContent>}
          {perms.canManageSettings && <TabsContent value="launch"><LaunchChecklistTab data={data} /></TabsContent>}
          <TabsContent value="settings"><SettingsTab data={data} canEdit={perms.canManageSettings} /></TabsContent>
        </Tabs>
      </div>
      <StaffProfileDrawer
        staff={openStaff}
        evaluations={data.evaluations}
        meetings={data.meetings}
        notes={data.notes}
        templates={data.templates}
        responses={data.responses}
        allStaff={data.staff}
        audit={data.audit}
        reviewers={data.reviewers}
        permissions={perms}
        onClose={() => setOpenStaffId(null)}
        onChanged={data.refresh}
      />
    </OSShell>
  );
}