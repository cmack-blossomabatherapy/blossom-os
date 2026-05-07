import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import { canAccessRouteForRoles, hasFullNavigationAccess, TRAINING_ADMIN_ROLES } from "@/lib/navigationAccess";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Pipeline from "./pages/Pipeline";
import Authorizations from "./pages/Authorizations";
import AuthDetail from "./pages/AuthDetail";
import Scheduling from "./pages/Scheduling";
import Staffing from "./pages/Staffing";
import RBTDetail from "./pages/RBTDetail";
import Recruiting from "./pages/Recruiting";
import CandidateDetail from "./pages/CandidateDetail";
import QA from "./pages/QA";
import QADetail from "./pages/QADetail";
import Operations from "./pages/Operations";
import ClinicDetail from "./pages/ClinicDetail";
import Clinics from "./pages/Clinics";
import PhoneCalls from "./pages/PhoneCalls";
import Documents from "./pages/Documents";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Automations from "./pages/Automations";
import Team from "./pages/Team";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import HRDashboard from "./pages/hr/HRDashboard";
import TrainingHub from "./pages/TrainingHub";
import TrainingDepartment from "./pages/TrainingDepartment";
import TrainingCourse from "./pages/TrainingCourse";
import AcademyHome from "./pages/hr/academy/AcademyHome";
import AcademyWeekDetail from "./pages/hr/academy/WeekDetail";
import AcademyLeadership from "./pages/hr/academy/LeadershipDashboard";
import EmployeeDirectory from "./pages/hr/EmployeeDirectory";
import EmployeeProfile from "./pages/hr/EmployeeProfile";
import OrgChart from "./pages/hr/OrgChart";
import OnboardingCenter from "./pages/hr/OnboardingCenter";
import TimeClock from "./pages/hr/TimeClock";
import Hours from "./pages/hr/Hours";
import TimeClockKiosk from "./pages/hr/TimeClockKiosk";
import Reviews from "./pages/hr/Reviews";
import Training from "./pages/hr/Training";
import Payroll from "./pages/hr/Payroll";
import Announcements from "./pages/hr/Announcements";
import ResourceHub from "./pages/hr/ResourceHub";
import HRReports from "./pages/hr/HRReports";
import HRSettings from "./pages/hr/HRSettings";
import TrainingDashboard from "./pages/hr/TrainingDashboard";
import TrainingStatistics from "./pages/hr/TrainingStatistics";
import TrainingAssign from "./pages/hr/TrainingAssign";
import RoleAuditLog from "./pages/admin/RoleAuditLog";
import JourneyHub from "./pages/hr/JourneyHub";
import JourneyDrive from "./pages/hr/JourneyDrive";
import LeadershipDashboard from "./pages/LeadershipDashboard";
import IntakeDashboard from "./pages/IntakeDashboard";
import AuthorizationsDashboard from "./pages/AuthorizationsDashboard";
import SchedulingDashboard from "./pages/SchedulingDashboard";
import StaffingDashboard from "./pages/StaffingDashboard";
import ClinicDashboard from "./pages/ClinicDashboard";
import QADashboard from "./pages/QADashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import RecruitingDashboard from "./pages/RecruitingDashboard";

const queryClient = new QueryClient();

import { LeadsProvider } from "@/contexts/LeadsContext";
import { ClientsProvider } from "@/contexts/ClientsContext";

function RoleDashboardRedirect() {
  const { roles, isAdmin, hasPerm, partOfLeadership, dashboardAccess } = useAuth();
  const hasTrainingAdminAccess = roles.some((role) => TRAINING_ADMIN_ROLES.includes(role));
  const dashboardRoutes: Record<string, string> = {
    ceo: "/leadership-dashboard",
    intake: "/intake-dashboard",
    authorizations: "/authorizations-dashboard",
    scheduling: "/scheduling-dashboard",
    staffing: "/staffing-dashboard",
    clinic: "/clinic-dashboard",
    qa: "/qa-dashboard",
    finance: "/finance-dashboard",
    hr: "/hr",
    recruiting: "/recruiting-dashboard",
  };
  const roleRoutes: Array<[string, string]> = [
    ["intake", "/intake-dashboard"],
    ["auth_team", "/authorizations-dashboard"],
    ["scheduling", "/scheduling-dashboard"],
    ["staffing", "/staffing-dashboard"],
    ["clinic", "/clinic-dashboard"],
    ["clinic_director", "/clinic-dashboard"],
    ["qa", "/qa-dashboard"],
    ["finance", "/finance-dashboard"],
    ["hr", "/hr"],
    ["hr_admin", "/hr"],
    ["hr_manager", "/hr"],
    ["recruiting_assistant", "/recruiting-dashboard"],
    ["payroll_admin", "/hr/payroll"],
    ["phone_support", "/phone-calls"],
  ];
  const profileRoute = dashboardAccess ? dashboardRoutes[dashboardAccess] : undefined;
  const route = profileRoute ?? (isAdmin || partOfLeadership || roles.includes("exec") || roles.includes("ops_manager") || roles.includes("state_director")
    ? "/leadership-dashboard"
    : roleRoutes.find(([role]) => roles.includes(role as never))?.[1]);

  const intelligenceFallback = roles.includes("rbt") || roles.includes("bcba") || hasTrainingAdminAccess ? "/hr/journey" : "/training";
  const fallbackRoute = route ?? (hasPerm("clients.view") ? "/clients" : intelligenceFallback);
  const allowedRoute = hasFullNavigationAccess(roles) || canAccessRouteForRoles(fallbackRoute, roles)
    ? fallbackRoute
    : intelligenceFallback;

  return <Navigate to={allowedRoute} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LeadsProvider>
            <ClientsProvider>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<RoleDashboardRedirect />} />
                  <Route path="/index" element={<Navigate to="/" replace />} />
                  <Route path="/leadership-dashboard" element={<PermissionRoute permission="dashboard.view"><LeadershipDashboard /></PermissionRoute>} />
                  <Route path="/intake-dashboard" element={<PermissionRoute permission="leads.view"><IntakeDashboard /></PermissionRoute>} />
                  <Route path="/authorizations-dashboard" element={<PermissionRoute permission="dashboard.view"><AuthorizationsDashboard /></PermissionRoute>} />
                  <Route path="/scheduling-dashboard" element={<PermissionRoute permission="dashboard.view"><SchedulingDashboard /></PermissionRoute>} />
                  <Route path="/staffing-dashboard" element={<PermissionRoute permission="dashboard.view"><StaffingDashboard /></PermissionRoute>} />
                  <Route path="/clinic-dashboard" element={<PermissionRoute permission="dashboard.view"><ClinicDashboard /></PermissionRoute>} />
                  <Route path="/qa-dashboard" element={<PermissionRoute permission="dashboard.view"><QADashboard /></PermissionRoute>} />
                  <Route path="/finance-dashboard" element={<PermissionRoute permission="dashboard.view"><FinanceDashboard /></PermissionRoute>} />
                  <Route path="/recruiting-dashboard" element={<PermissionRoute permission="dashboard.view"><RecruitingDashboard /></PermissionRoute>} />
                  <Route path="/leadership-dashboard/clinics/:clinicId" element={<PermissionRoute permission="dashboard.view"><LeadershipDashboard /></PermissionRoute>} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/leads/:id" element={<LeadDetail />} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetail />} />
                  <Route path="/authorizations" element={<Authorizations />} />
                  <Route path="/authorizations/:id" element={<AuthDetail />} />
                  <Route path="/scheduling" element={<Scheduling />} />
                  <Route path="/staffing" element={<Staffing />} />
                  <Route path="/staffing/:id" element={<RBTDetail />} />
                  <Route path="/recruiting" element={<Recruiting />} />
                  <Route path="/recruiting/:id" element={<CandidateDetail />} />
                  <Route path="/qa" element={<QA />} />
                  <Route path="/qa/:id" element={<QADetail />} />
                  <Route path="/operations" element={<Operations />} />
                  <Route path="/operations/clinics/:id" element={<ClinicDetail />} />
                  <Route path="/clinics" element={<Clinics />} />
                  <Route path="/phone-calls" element={<PhoneCalls />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/automations" element={<Automations />} />
                  <Route path="/training" element={<TrainingHub />} />
                  <Route path="/training/academy" element={<AcademyHome />} />
                  <Route path="/training/academy/week/:weekId" element={<AcademyWeekDetail />} />
                  <Route path="/training/academy/leadership" element={<PermissionRoute permission="hr.training.view"><AcademyLeadership /></PermissionRoute>} />
                  <Route path="/training/department/:slug" element={<TrainingDepartment />} />
                  <Route path="/training/course/:courseId" element={<TrainingCourse />} />
                  <Route path="/training/course/:courseId/lesson/:lessonId" element={<TrainingCourse />} />
                  <Route path="/resources" element={<PermissionRoute allowedRoles={["rbt", "bcba", "hr", "hr_admin", "hr_manager"]}><ResourceHub readOnly /></PermissionRoute>} />
                  <Route path="/team" element={<PermissionRoute permission="team.view"><Team /></PermissionRoute>} />
                  <Route path="/admin/training-dashboard" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingDashboard /></PermissionRoute>} />
                  <Route path="/admin/training-statistics" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingStatistics /></PermissionRoute>} />
                  <Route path="/admin/training-assign" element={<PermissionRoute permission="hr.training.assign" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingAssign /></PermissionRoute>} />
                  <Route path="/admin/role-audit" element={<RoleAuditLog />} />
                  <Route path="/settings" element={<PermissionRoute permission="settings.view"><SettingsPage /></PermissionRoute>} />
                  <Route path="/hr" element={<PermissionRoute permission="hr.view"><HRDashboard /></PermissionRoute>} />
                  <Route path="/hr/directory" element={<PermissionRoute permission="hr.employees.view"><EmployeeDirectory /></PermissionRoute>} />
                  <Route path="/hr/employees/:id" element={<PermissionRoute permission="hr.employees.view"><EmployeeProfile /></PermissionRoute>} />
                  <Route path="/hr/org-chart" element={<PermissionRoute permission="hr.employees.view"><OrgChart /></PermissionRoute>} />
                  <Route path="/hr/onboarding" element={<PermissionRoute permission="hr.onboarding.manage"><OnboardingCenter /></PermissionRoute>} />
                  <Route path="/hr/time-clock" element={<PermissionRoute permission="hr.timeclock.view"><TimeClock /></PermissionRoute>} />
                  <Route path="/hr/hours" element={<PermissionRoute permission="hr.hours.view"><Hours /></PermissionRoute>} />
                  <Route path="/hr/kiosk" element={<PermissionRoute permission="hr.timeclock.kiosk"><TimeClockKiosk /></PermissionRoute>} />
                  <Route path="/hr/reviews" element={<PermissionRoute permission="hr.reviews.view"><Reviews /></PermissionRoute>} />
                  <Route path="/hr/training" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><Training /></PermissionRoute>} />
                  <Route path="/hr/training-dashboard" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingDashboard /></PermissionRoute>} />
                  <Route path="/hr/payroll" element={<PermissionRoute permission="hr.payroll.runs.view"><Payroll /></PermissionRoute>} />
                  <Route path="/hr/announcements" element={<PermissionRoute permission="hr.announcements.view"><Announcements /></PermissionRoute>} />
                  <Route path="/hr/resources" element={<PermissionRoute permission="hr.resources.view"><ResourceHub /></PermissionRoute>} />
                  <Route path="/hr/journey" element={<JourneyHub />} />
                  <Route path="/hr/journey/drive" element={<JourneyDrive />} />
                  <Route path="/hr/reports" element={<PermissionRoute permission="hr.reports.view"><HRReports /></PermissionRoute>} />
                  <Route path="/hr/settings" element={<PermissionRoute permission="hr.settings.manage"><HRSettings /></PermissionRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ClientsProvider>
          </LeadsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
