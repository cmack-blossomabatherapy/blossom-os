import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { PushNavigationListener } from "@/components/push/PushNavigationListener";
import MobilePermissions from "./pages/MobilePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import { canAccessRouteForRoles, hasFullNavigationAccess, TRAINING_ADMIN_ROLES, ANALYTICS_ROLES, COURSE_AUTHOR_ROLES, AUTOMATIONS_ROLES } from "@/lib/navigationAccess";
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
import ResetPassword from "./pages/ResetPassword";
import HRDashboard from "./pages/hr/HRDashboard";
import TrainingHub from "./pages/TrainingHub";
import TrainingDepartment from "./pages/TrainingDepartment";
import TrainingCourse from "./pages/TrainingCourse";
import { AcademyGate } from "./components/auth/AcademyGate";
import AcademyHome from "./pages/hr/academy/AcademyHome";
import AcademyWeekDetail from "./pages/hr/academy/WeekDetail";
import AcademyLeadership from "./pages/hr/academy/LeadershipDashboard";
import AcademyEditor from "./pages/hr/academy/AcademyEditor";
import HRAdminAssistantDashboard from "./pages/training/HRAdminAssistantDashboard";
import TrackAnalytics from "./pages/hr/TrackAnalytics";
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
import NotificationSettings from "./pages/hr/NotificationSettings";
import HRAssistant from "./pages/hr/HRAssistant";
import Welcome from "./pages/hr/Welcome";
import Recognition from "./pages/hr/Recognition";
import AnnouncementsFeed from "./pages/hr/AnnouncementsFeed";
import SopIntelligence from "./pages/enterprise/SopIntelligence";
import CourseStudio from "./pages/enterprise/CourseStudio";
import Readiness from "./pages/enterprise/Readiness";
import Compliance from "./pages/enterprise/Compliance";
import Recommendations from "./pages/enterprise/Recommendations";
import Simulations from "./pages/enterprise/Simulations";
import SimulationDetail from "./pages/enterprise/SimulationDetail";
import EnterpriseAutomations from "./pages/enterprise/Automations";
import TrainingDashboard from "./pages/hr/TrainingDashboard";
import TrainingStatistics from "./pages/hr/TrainingStatistics";
import TrainingAssign from "./pages/hr/TrainingAssign";
import TrackAssign from "./pages/hr/TrackAssign";
import RoleAuditLog from "./pages/admin/RoleAuditLog";
import JourneyHub from "./pages/hr/JourneyHub";
import JourneyDrive from "./pages/hr/JourneyDrive";
import LeadershipDashboard from "./pages/LeadershipDashboard";
import CeoDashboardV2 from "./pages/CeoDashboardV2";
import CeoDashboardV2Logic from "./pages/CeoDashboardV2Logic";
import CeoDashboardV2Insights from "./pages/CeoDashboardV2Insights";
import CeoDashboardV2RevenueLeaks from "./pages/CeoDashboardV2RevenueLeaks";
import IntakeDashboard from "./pages/IntakeDashboard";
import AuthorizationsDashboard from "./pages/AuthorizationsDashboard";
import SchedulingDashboard from "./pages/SchedulingDashboard";
import StaffingDashboard from "./pages/StaffingDashboard";
import ClinicDashboard from "./pages/ClinicDashboard";
import QADashboard from "./pages/QADashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import RecruitingDashboard from "./pages/RecruitingDashboard";
import OperationsAcademy from "./pages/blossom/OperationsAcademy";
import TrackDetail from "./pages/blossom/TrackDetail";
import Departments from "./pages/blossom/Departments";
import DepartmentDetail from "./pages/blossom/DepartmentDetail";
import BlossomLocations from "./pages/blossom/Locations";
import LocationDetail from "./pages/blossom/LocationDetail";
import BlossomUsers from "./pages/blossom/Users";
import BlossomReports from "./pages/blossom/BlossomReports";
import Dashboard from "./pages/Dashboard";
import ExecutiveCommandCenter from "./pages/intelligence/ExecutiveCommandCenter";
import WorkforceIntelligence from "./pages/intelligence/WorkforceIntelligence";
import TrainingIntelligence from "./pages/intelligence/TrainingIntelligence";
import ComplianceIntelligence from "./pages/intelligence/ComplianceIntelligence";
import OnboardingIntelligence from "./pages/intelligence/OnboardingIntelligence";
import DepartmentAnalytics from "./pages/intelligence/DepartmentAnalytics";
import DepartmentAnalyticsDetail from "./pages/intelligence/DepartmentAnalyticsDetail";
import StateDashboards from "./pages/intelligence/StateDashboards";
import StateDashboardDetail from "./pages/intelligence/StateDashboardDetail";
import Scorecards from "./pages/intelligence/Scorecards";
import RiskInsights from "./pages/intelligence/RiskInsights";
import ReportBuilder from "./pages/intelligence/ReportBuilder";
import AssistantAnalytics from "./pages/intelligence/AssistantAnalytics";
import WelcomeHome from "./pages/WelcomeHome";
import MyLearning from "./pages/MyLearning";
import TrainingCatalog from "./pages/TrainingCatalog";
import Profile from "./pages/Profile";
import NotificationPreferences from "./pages/NotificationPreferences";
import AdminHub from "./pages/AdminHub";
import AccessRequests from "./pages/admin/AccessRequests";
import LoginVaultAdmin from "./pages/admin/LoginVaultAdmin";
import AdminOnboardingProgress from "./pages/admin/OnboardingProgress";
import OnboardingRoadmap from "./pages/onboarding/Roadmap";
import OnboardingWelcome from "./pages/onboarding/Welcome";
import OnboardingMission from "./pages/onboarding/Mission";
import OnboardingValues from "./pages/onboarding/Values";
import OnboardingTeam from "./pages/onboarding/Team";
import OnboardingOrgChart from "./pages/onboarding/OrgChart";
import OnboardingMeetTheTeam from "./pages/onboarding/MeetTheTeam";
import OnboardingAcademyPreview from "./pages/onboarding/AcademyPreview";
import OnboardingHowItWorks from "./pages/onboarding/HowItWorks";
import OnboardingRequiredRole from "./pages/onboarding/RequiredRole";
import OnboardingRequiredSystems from "./pages/onboarding/RequiredSystems";
import OnboardingPolicies from "./pages/onboarding/Policies";
import OnboardingFinalCheck from "./pages/onboarding/FinalCheck";
import OnboardingComplete from "./pages/onboarding/Complete";
import Journey from "./pages/onboarding/Journey";
import PhaseWelcome from "./pages/onboarding/PhaseWelcome";
import WeekOne from "./pages/onboarding/WeekOne";
import WeekTwo from "./pages/onboarding/WeekTwo";
import WeekThree from "./pages/onboarding/WeekThree";
import WeeksFourFive from "./pages/onboarding/WeeksFourFive";
import Graduation from "./pages/onboarding/Graduation";
import HelpPage from "./pages/Help";
import JourneyEditor from "./pages/admin/JourneyEditor";
import { JourneyOverridesProvider } from "@/hooks/useJourneyOverrides";
import OSDashboard from "./pages/os/OSDashboard";
import OSPlaceholder from "./pages/os/OSPlaceholder";
import OSLeads from "./pages/os/OSLeads";
import OSClients from "./pages/os/OSClients";
import OSPermissions from "./pages/os/OSPermissions";
import { OSRoleProvider } from "./contexts/OSRoleContext";
import {
  UserCog, CalendarDays as CIcon, ClipboardList, FolderKanban, DollarSign as DIcon,
  BarChart3, GraduationCap, Building2, Settings as SIcon,
  Radio, BellRing, FileCheck2, BadgeCheck, Briefcase, ClipboardCheck,
  Wallet, TrendingUp, ShieldAlert, Target, Workflow, BookOpen, Megaphone, PieChart,
  LifeBuoy, Inbox, AlertTriangle, KanbanSquare, Bot, Brain, Zap, Wand2, Activity,
  Users2, MapPin, UserPlus,
} from "lucide-react";

const queryClient = new QueryClient();

const OSOutlet = () => (
  <OSRoleProvider>
    <Outlet />
  </OSRoleProvider>
);

import { LeadsProvider } from "@/contexts/LeadsContext";
import { ClientsProvider } from "@/contexts/ClientsContext";

function RoleDashboardRedirect() {
  const { roles, isAdmin, hasPerm, partOfLeadership, dashboardAccess } = useAuth();
  const hasTrainingAdminAccess = roles.some((role) => TRAINING_ADMIN_ROLES.includes(role));
  const isExecOnly = roles.includes("exec") && !roles.includes("admin") && !roles.includes("ops_manager");
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
  const profileRoute = isExecOnly ? "/bcba-performance-dashboard" : dashboardAccess ? dashboardRoutes[dashboardAccess] : undefined;
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

function LegacyBcbaDashboardRedirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
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
              <JourneyOverridesProvider>
                <PushNavigationListener />
                <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/mobile/permissions" element={<ProtectedRoute><MobilePermissions /></ProtectedRoute>} />
                <Route element={<ProtectedRoute><OSOutlet /></ProtectedRoute>}>
                  <Route path="/os" element={<OSDashboard />} />
                  <Route path="/os/command-center" element={<OSPlaceholder title="Command Center" description="Global operational overview: alerts, escalations, AI insights, bottlenecks, urgent tasks." icon={Radio} />} />
                  <Route path="/os/calendar" element={<OSPlaceholder title="Calendar" description="Unified operational calendar: assessments, meetings, interviews, trainings, staffing." icon={CIcon} />} />
                  <Route path="/os/notifications" element={<OSPlaceholder title="Notifications" description="Operational notifications, approvals, and inbox." icon={BellRing} />} />
                  <Route path="/os/leads" element={<OSLeads />} />
                  <Route path="/os/intake" element={<OSPlaceholder title="Intake" description="Intake pipeline, forms, onboarding, VOB workflow." icon={ClipboardList} />} />
                  <Route path="/os/clients" element={<OSClients />} />
                  <Route path="/os/authorizations" element={<OSPlaceholder title="Authorizations" description="Auth lifecycle, expirations, units used, QA tracking." icon={FileCheck2} />} />
                  <Route path="/os/scheduling" element={<OSPlaceholder title="Scheduling" description="Modern calendar, drag/drop placeholders, staffing conflicts, open coverage." icon={CIcon} />} />
                  <Route path="/os/cases" element={<OSPlaceholder title="Case Management" description="Active cases, escalations, parent communication, staffing issues, risk indicators." icon={FolderKanban} />} />
                  <Route path="/os/staff" element={<OSPlaceholder title="RBT / BCBA" description="Staff directory, credentials, availability, assigned clients, hiring pipeline, risk indicators." icon={UserCog} />} />
                  <Route path="/os/recruiting" element={<OSPlaceholder title="Recruiting" description="Hiring pipeline, applicants, interviews, offers." icon={UserPlus} />} />
                  <Route path="/os/credentialing" element={<OSPlaceholder title="Credentialing" description="Insurance + provider credentialing status and renewals." icon={BadgeCheck} />} />
                  <Route path="/os/employee-ops" element={<OSPlaceholder title="Employee Operations" description="Employee onboarding and operational workflows." icon={Briefcase} />} />
                  <Route path="/os/evaluations" element={<OSPlaceholder title="Evaluations" description="Performance reviews, coaching plans, scorecards." icon={ClipboardCheck} />} />
                  <Route path="/os/training" element={<OSPlaceholder title="Training Academy" description="Operational onboarding and learning platform." icon={GraduationCap} />} />
                  <Route path="/os/billing" element={<OSPlaceholder title="Billing" description="Revenue overview, payment plan tracking, outstanding balances, auth/payment indicators." icon={DIcon} />} />
                  <Route path="/os/payroll" element={<OSPlaceholder title="Payroll" description="Payroll operations, runs, and adjustments." icon={Wallet} />} />
                  <Route path="/os/revenue" element={<OSPlaceholder title="Revenue Analytics" description="Financial performance and revenue trends." icon={TrendingUp} />} />
                  <Route path="/os/insurance" element={<OSPlaceholder title="Insurance Tracking" description="Insurance status, coverage visibility, payer mix." icon={ShieldAlert} />} />
                  <Route path="/os/reports" element={<OSPlaceholder title="Reports" description="Charts, export cards, KPI widgets, report builder placeholders." icon={BarChart3} />} />
                  <Route path="/os/kpi" element={<OSPlaceholder title="KPI Tracking" description="Company-wide KPI visibility and targets." icon={Target} />} />
                  <Route path="/os/workflows" element={<OSPlaceholder title="Workflow Center" description="Operational automations and workflow management." icon={Workflow} />} />
                  <Route path="/os/sop" element={<OSPlaceholder title="SOP Library" description="Central SOP database, search, and versioning." icon={BookOpen} />} />
                  <Route path="/os/marketing" element={<OSPlaceholder title="Marketing Ops" description="Lead generation, campaigns, attribution." icon={Megaphone} />} />
                  <Route path="/os/analytics" element={<OSPlaceholder title="Analytics Hub" description="Advanced operational analytics and dashboards." icon={PieChart} />} />
                  <Route path="/os/tech-requests" element={<OSPlaceholder title="Tech Requests" description="Internal technology support requests." icon={LifeBuoy} />} />
                  <Route path="/os/internal-requests" element={<OSPlaceholder title="Internal Requests" description="Operational and internal forms and approvals." icon={Inbox} />} />
                  <Route path="/os/open-issues" element={<OSPlaceholder title="Open Issues" description="Operational blockers and issue tracking." icon={AlertTriangle} />} />
                  <Route path="/os/projects" element={<OSPlaceholder title="Project Tracking" description="Internal projects and initiatives." icon={KanbanSquare} />} />
                  <Route path="/os/ai/assistant" element={<OSPlaceholder title="Ask Blossom AI" description="Global AI assistant for operational questions." icon={Bot} />} />
                  <Route path="/os/ai/insights" element={<OSPlaceholder title="AI Insights" description="AI-generated operational recommendations." icon={Brain} />} />
                  <Route path="/os/ai/automations" element={<OSPlaceholder title="Automation Center" description="Automation management and runs." icon={Zap} />} />
                  <Route path="/os/ai/predictive" element={<OSPlaceholder title="Predictive Alerts" description="Future bottleneck and risk detection." icon={Activity} />} />
                  <Route path="/os/ai/workflows" element={<OSPlaceholder title="AI Workflows" description="AI-assisted operational flows." icon={Wand2} />} />
                  <Route path="/os/hr" element={<OSPlaceholder title="HR Suite" description="Employee overview, onboarding progress, recruiting pipeline, evaluations, compliance tracking." icon={Building2} />} />
                  <Route path="/os/user-management" element={<OSPlaceholder title="User Management" description="Users, roles, and permission assignments." icon={Users2} />} />
                  <Route path="/os/state-management" element={<OSPlaceholder title="State Management" description="Multi-state operational setup and configuration." icon={MapPin} />} />
                  <Route path="/os/settings" element={<OSPlaceholder title="Settings" description="Workspace, branding, integrations, notifications, security, billing." icon={SIcon} />} />
                  <Route path="/os/permissions" element={<OSPermissions />} />
                </Route>
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<WelcomeHome />} />
                  <Route path="/home-redirect" element={<RoleDashboardRedirect />} />
                  <Route path="/academy" element={<OperationsAcademy />} />
                  <Route path="/my-learning" element={<MyLearning />} />
                  <Route path="/catalog" element={<TrainingCatalog />} />
                  <Route path="/announcements" element={<AnnouncementsFeed />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notification-preferences" element={<NotificationPreferences />} />
                  <Route path="/admin" element={<AdminHub />} />
                  <Route path="/admin/access-requests" element={<AccessRequests />} />
                  <Route path="/admin/login-vault" element={<LoginVaultAdmin />} />
                  <Route path="/admin/onboarding-progress" element={<AdminOnboardingProgress />} />
                  <Route path="/admin/journey-editor" element={<JourneyEditor />} />
                  <Route path="/index" element={<Navigate to="/" replace />} />
                  {/* Onboarding journey */}
                  <Route path="/onboarding" element={<Journey />} />
                  <Route path="/onboarding/roadmap" element={<OnboardingRoadmap />} />
                  <Route path="/onboarding/phase/welcome" element={<PhaseWelcome />} />
                  <Route path="/onboarding/week/1" element={<WeekOne />} />
                  <Route path="/onboarding/week/2" element={<WeekTwo />} />
                  <Route path="/onboarding/week/3" element={<WeekThree />} />
                  <Route path="/onboarding/week/4" element={<WeeksFourFive />} />
                  <Route path="/onboarding/week/4-5" element={<WeeksFourFive />} />
                  <Route path="/onboarding/graduation" element={<Graduation />} />
                  <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
                  <Route path="/onboarding/mission" element={<OnboardingMission />} />
                  <Route path="/onboarding/values" element={<OnboardingValues />} />
                  <Route path="/onboarding/team" element={<OnboardingTeam />} />
                  <Route path="/onboarding/org-chart" element={<OnboardingOrgChart />} />
                  <Route path="/onboarding/meet-the-team" element={<OnboardingMeetTheTeam />} />
                  <Route path="/onboarding/academy-preview" element={<OnboardingAcademyPreview />} />
                  <Route path="/onboarding/how-it-works" element={<OnboardingHowItWorks />} />
                  <Route path="/onboarding/required-role" element={<OnboardingRequiredRole />} />
                  <Route path="/onboarding/required-systems" element={<OnboardingRequiredSystems />} />
                  <Route path="/onboarding/policies" element={<OnboardingPolicies />} />
                  <Route path="/onboarding/final-check" element={<OnboardingFinalCheck />} />
                  <Route path="/onboarding/complete" element={<OnboardingComplete />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/blossom/academy" element={<OperationsAcademy />} />
                  <Route path="/blossom/academy/:trackId" element={<TrackDetail />} />
                  <Route path="/blossom/departments" element={<Departments />} />
                  <Route path="/blossom/departments/:id" element={<DepartmentDetail />} />
                  <Route path="/blossom/locations" element={<BlossomLocations />} />
                  <Route path="/blossom/locations/:id" element={<LocationDetail />} />
                  <Route path="/blossom/users" element={<BlossomUsers />} />
                  <Route path="/blossom/reports" element={<PermissionRoute permission="reports.view" allowedRoles={ANALYTICS_ROLES}><BlossomReports /></PermissionRoute>} />
                  <Route path="/intelligence" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><ExecutiveCommandCenter /></PermissionRoute>} />
                  <Route path="/intelligence/workforce" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><WorkforceIntelligence /></PermissionRoute>} />
                  <Route path="/intelligence/training" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><TrainingIntelligence /></PermissionRoute>} />
                  <Route path="/intelligence/compliance" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><ComplianceIntelligence /></PermissionRoute>} />
                  <Route path="/intelligence/onboarding" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><OnboardingIntelligence /></PermissionRoute>} />
                  <Route path="/intelligence/departments" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><DepartmentAnalytics /></PermissionRoute>} />
                  <Route path="/intelligence/departments/:id" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><DepartmentAnalyticsDetail /></PermissionRoute>} />
                  <Route path="/intelligence/states" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><StateDashboards /></PermissionRoute>} />
                  <Route path="/intelligence/states/:id" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><StateDashboardDetail /></PermissionRoute>} />
                  <Route path="/intelligence/scorecards" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><Scorecards /></PermissionRoute>} />
                  <Route path="/intelligence/risk" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><RiskInsights /></PermissionRoute>} />
                  <Route path="/intelligence/reports" element={<PermissionRoute permission="reports.view" allowedRoles={ANALYTICS_ROLES}><ReportBuilder /></PermissionRoute>} />
                  <Route path="/intelligence/assistant" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><AssistantAnalytics /></PermissionRoute>} />
                  <Route path="/leadership-dashboard" element={<PermissionRoute permission="dashboard.view"><LeadershipDashboard /></PermissionRoute>} />
                  <Route path="/bcba-performance-dashboard" element={<PermissionRoute allowedRoles={["admin", "exec"]}><CeoDashboardV2 /></PermissionRoute>} />
                  <Route path="/bcba-performance-dashboard/logic" element={<PermissionRoute allowedRoles={["admin", "exec"]}><CeoDashboardV2Logic /></PermissionRoute>} />
                  <Route path="/bcba-performance-dashboard/insights" element={<PermissionRoute allowedRoles={["admin", "exec"]}><CeoDashboardV2Insights /></PermissionRoute>} />
                  <Route path="/bcba-performance-dashboard/revenue-leaks" element={<PermissionRoute allowedRoles={["admin", "exec"]}><CeoDashboardV2RevenueLeaks /></PermissionRoute>} />
                  <Route path="/ceo-dashboard-v2" element={<LegacyBcbaDashboardRedirect to="/bcba-performance-dashboard" />} />
                  <Route path="/ceo-dashboard-v2/logic" element={<LegacyBcbaDashboardRedirect to="/bcba-performance-dashboard/logic" />} />
                  <Route path="/ceo-dashboard-v2/insights" element={<LegacyBcbaDashboardRedirect to="/bcba-performance-dashboard/insights" />} />
                  <Route path="/ceo-dashboard-v2/revenue-leaks" element={<LegacyBcbaDashboardRedirect to="/bcba-performance-dashboard/revenue-leaks" />} />
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
                  <Route path="/reports" element={<PermissionRoute permission="reports.view" allowedRoles={ANALYTICS_ROLES}><Reports /></PermissionRoute>} />
                  <Route path="/automations" element={<PermissionRoute permission="automations.view" allowedRoles={AUTOMATIONS_ROLES}><Automations /></PermissionRoute>} />
                  <Route path="/training" element={<AcademyGate><TrainingHub /></AcademyGate>} />
                  <Route path="/training/academy" element={<AcademyHome />} />
                  <Route path="/training/academy/week/:weekId" element={<AcademyWeekDetail />} />
                  <Route path="/training/academy/leadership" element={<PermissionRoute permission="hr.training.view"><AcademyLeadership /></PermissionRoute>} />
                  <Route path="/training/academy/editor" element={<PermissionRoute permission="hr.training.assign" allowedRoles={TRAINING_ADMIN_ROLES}><AcademyEditor /></PermissionRoute>} />
                  <Route path="/training/hr-admin-assistant" element={<HRAdminAssistantDashboard />} />
                  <Route path="/training/department/:slug" element={<TrainingDepartment />} />
                  <Route path="/training/course/:courseId" element={<TrainingCourse />} />
                  <Route path="/training/course/:courseId/lesson/:lessonId" element={<TrainingCourse />} />
                  <Route path="/resources" element={<ResourceHub readOnly />} />
                  <Route path="/team" element={<PermissionRoute><Team /></PermissionRoute>} />
                  <Route path="/admin/training-dashboard" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingDashboard /></PermissionRoute>} />
                  <Route path="/admin/training-statistics" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingStatistics /></PermissionRoute>} />
                  <Route path="/admin/training-assign" element={<PermissionRoute permission="hr.training.assign" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingAssign /></PermissionRoute>} />
                  <Route path="/admin/track-assign" element={<PermissionRoute permission="hr.training.assign" allowedRoles={TRAINING_ADMIN_ROLES}><TrackAssign /></PermissionRoute>} />
                  <Route path="/admin/role-audit" element={<PermissionRoute allowedRoles={["admin"]}><RoleAuditLog /></PermissionRoute>} />
                  <Route path="/settings" element={<PermissionRoute permission="settings.view"><SettingsPage /></PermissionRoute>} />
                  <Route path="/hr" element={<PermissionRoute permission="hr.view"><HRDashboard /></PermissionRoute>} />
                  <Route path="/hr/directory" element={<PermissionRoute permission="hr.employees.view"><EmployeeDirectory /></PermissionRoute>} />
                  <Route path="/hr/employees/:id" element={<PermissionRoute permission="hr.employees.view"><EmployeeProfile /></PermissionRoute>} />
                  <Route path="/hr/org-chart" element={<PermissionRoute><OrgChart /></PermissionRoute>} />
                  <Route path="/hr/onboarding" element={<PermissionRoute permission="hr.onboarding.manage"><OnboardingCenter /></PermissionRoute>} />
                  <Route path="/hr/time-clock" element={<PermissionRoute permission="hr.timeclock.view"><TimeClock /></PermissionRoute>} />
                  <Route path="/hr/hours" element={<PermissionRoute permission="hr.hours.view"><Hours /></PermissionRoute>} />
                  <Route path="/hr/kiosk" element={<PermissionRoute permission="hr.timeclock.kiosk"><TimeClockKiosk /></PermissionRoute>} />
                  <Route path="/hr/reviews" element={<PermissionRoute permission="hr.reviews.view"><Reviews /></PermissionRoute>} />
                  <Route path="/hr/training" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><Training /></PermissionRoute>} />
                  <Route path="/hr/training-dashboard" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingDashboard /></PermissionRoute>} />
                  <Route path="/hr/track-analytics" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrackAnalytics /></PermissionRoute>} />
                  <Route path="/admin/track-analytics" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrackAnalytics /></PermissionRoute>} />
                  <Route path="/hr/payroll" element={<PermissionRoute permission="hr.payroll.runs.view"><Payroll /></PermissionRoute>} />
                  <Route path="/hr/announcements" element={<PermissionRoute permission="hr.announcements.view"><Announcements /></PermissionRoute>} />
                  <Route path="/hr/resources" element={<PermissionRoute permission="hr.resources.view"><ResourceHub /></PermissionRoute>} />
                  <Route path="/hr/assistant" element={<HRAssistant />} />
                  <Route path="/hr/welcome" element={<Welcome />} />
                  <Route path="/hr/recognition" element={<Recognition />} />
                  <Route path="/hr/feed" element={<AnnouncementsFeed />} />
                  <Route path="/enterprise/sop-intelligence" element={<PermissionRoute allowedRoles={COURSE_AUTHOR_ROLES}><SopIntelligence /></PermissionRoute>} />
                  <Route path="/enterprise/course-studio" element={<PermissionRoute allowedRoles={COURSE_AUTHOR_ROLES}><CourseStudio /></PermissionRoute>} />
                  <Route path="/enterprise/readiness" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><Readiness /></PermissionRoute>} />
                  <Route path="/enterprise/compliance" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><Compliance /></PermissionRoute>} />
                  <Route path="/enterprise/recommendations" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><Recommendations /></PermissionRoute>} />
                  <Route path="/enterprise/simulations" element={<PermissionRoute allowedRoles={COURSE_AUTHOR_ROLES}><Simulations /></PermissionRoute>} />
                  <Route path="/enterprise/simulations/:id" element={<PermissionRoute allowedRoles={COURSE_AUTHOR_ROLES}><SimulationDetail /></PermissionRoute>} />
                  <Route path="/enterprise/automations" element={<PermissionRoute permission="automations.view" allowedRoles={AUTOMATIONS_ROLES}><EnterpriseAutomations /></PermissionRoute>} />
                  <Route path="/hr/journey" element={<PermissionRoute allowedRoles={["rbt", "bcba"]}><JourneyHub /></PermissionRoute>} />
                  <Route path="/hr/journey/drive" element={<PermissionRoute allowedRoles={["rbt", "bcba"]}><JourneyDrive /></PermissionRoute>} />
                  <Route path="/hr/reports" element={<PermissionRoute permission="hr.reports.view"><HRReports /></PermissionRoute>} />
                  <Route path="/hr/settings" element={<PermissionRoute permission="hr.settings.manage"><HRSettings /></PermissionRoute>} />
                  <Route path="/hr/notifications" element={<PermissionRoute permission="hr.settings.manage"><NotificationSettings /></PermissionRoute>} />
                  <Route path="/enterprise/*" element={<NotFound />} />
                </Route>
                <Route path="*" element={<NotFound />} />
                </Routes>
              </JourneyOverridesProvider>
            </ClientsProvider>
          </LeadsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
