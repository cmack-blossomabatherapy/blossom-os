import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { PushNavigationListener } from "@/components/push/PushNavigationListener";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import { Unauthorized } from "@/components/auth/Unauthorized";
import { canAccessRouteForRoles, hasFullNavigationAccess, TRAINING_ADMIN_ROLES, ANALYTICS_ROLES, COURSE_AUTHOR_ROLES, AUTOMATIONS_ROLES } from "@/lib/navigationAccess";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { Loader2 } from "lucide-react";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Pipeline from "./pages/Pipeline";
import Authorizations from "./pages/Authorizations";
import AuthDetail from "./pages/AuthDetail";
import Scheduling from "./pages/Scheduling";
import RBTDetail from "./pages/RBTDetail";
import Recruiting from "./pages/Recruiting";
import CandidateDetail from "./pages/CandidateDetail";
import QA from "./pages/QA";
import QADetail from "./pages/QADetail";
import Operations from "./pages/Operations";
import ClinicDetail from "./pages/ClinicDetail";
import Clinics from "./pages/Clinics";

import Documents from "./pages/Documents";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import ReportsHome from "./pages/os/reports/ReportsHome";
import ReportDetail from "./pages/os/reports/ReportDetail";
import QaSupervisionPtDashboard from "./pages/os/reports/QaSupervisionPtDashboard";
import QaAuthUtilizationDashboard from "./pages/os/reports/QaAuthUtilizationDashboard";
import QaCancellationDashboard from "./pages/os/reports/QaCancellationDashboard";
import HrPayrollCommandCenter from "./pages/os/reports/HrPayrollCommandCenter";
import HrRecruitingPipelineDashboard from "./pages/os/reports/HrRecruitingPipelineDashboard";
import HrEmployeeComplianceDashboard from "./pages/os/reports/HrEmployeeComplianceDashboard";
import HrEmployeeOnboardingCommandCenter from "./pages/os/reports/HrEmployeeOnboardingCommandCenter";
import HrBcbaProductivityDashboard from "./pages/os/reports/HrBcbaProductivityDashboard";
import BcbaProductivityReport from "./pages/os/reports/BcbaProductivityReport";
import BcbaProductivityReportV3 from "./pages/os/reports/BcbaProductivityReportV3";
import CancellationCommandCenter from "./pages/os/reports/CancellationCommandCenter";
import OSComingSoon from "./pages/os/OSComingSoon";
import AiDashboardNew from "./pages/os/dashboards/AiDashboardNew";
import AiDashboardView from "./pages/os/dashboards/AiDashboardView";

function AiReportRedirect() {
  const { pathname } = useLocation();
  const id = pathname.split("/").pop();
  return <Navigate to={`/dashboards/ai/${id}`} replace />;
}
import Automations from "./pages/Automations";
import Team from "./pages/Team";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import HRDashboard from "./pages/hr/HRDashboard";
import HRSuiteHome from "./pages/hr/HRSuiteHome";
import TrainingManagementCenter from "./pages/hr/TrainingManagementCenter";
import TrainingHub from "./pages/TrainingHub";
import TrainingDepartment from "./pages/TrainingDepartment";
import TrainingCourse from "./pages/TrainingCourse";
import { AcademyGate } from "./components/auth/AcademyGate";
import AcademyHome from "./pages/hr/academy/AcademyHome";
import AcademyWeekDetail from "./pages/hr/academy/WeekDetail";
import AcademyLeadership from "./pages/hr/academy/LeadershipDashboard";
import AcademyEditor from "./pages/hr/academy/AcademyEditor";
import HRAdminAssistantDashboard from "./pages/training/HRAdminAssistantDashboard";
import AuthorizationCoordinatorJourney from "./pages/training/AuthorizationCoordinatorJourney";
import BCBAJourney from "./pages/training/BCBAJourney";
import TrackAnalytics from "./pages/hr/TrackAnalytics";
import EmployeeDirectory from "./pages/hr/EmployeeDirectory";
import EmployeeProfile from "./pages/hr/EmployeeProfile";
import OrgChart from "./pages/hr/OrgChart";
import OrgChartManage from "./pages/hr/OrgChartManage";
import OnboardingCenter from "./pages/hr/OnboardingCenter";
import TimeClock from "./pages/hr/TimeClock";
import Hours from "./pages/hr/Hours";
import TimeClockKiosk from "./pages/hr/TimeClockKiosk";
import Reviews from "./pages/hr/Reviews";
import Training from "./pages/hr/Training";
import Payroll from "./pages/hr/Payroll";
import Announcements from "./pages/hr/Announcements";
import ResourceUploadCenter from "./pages/hr/ResourceUploadCenter";
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
import KnowledgeBase from "./pages/admin/KnowledgeBase";
import AiAuditLog from "./pages/admin/AiAuditLog";
import { AiAdminShell } from "./components/admin/ai/AiAdminShell";
import AiDashboard from "./pages/admin/ai/Dashboard";
import AiKnowledgeHub from "./pages/admin/ai/KnowledgeHub";
import AiPermissions from "./pages/admin/ai/Permissions";
import AiTraining from "./pages/admin/ai/Training";
import AiAuditLogPage from "./pages/admin/ai/AuditLog";
import AiMemory from "./pages/admin/ai/Memory";
import AiAnalytics from "./pages/admin/ai/Analytics";
import AiAppearance from "./pages/admin/ai/Appearance";
import Integrations from "./pages/admin/Integrations";
import JourneyHub from "./pages/hr/JourneyHub";
import JourneyDrive from "./pages/hr/JourneyDrive";
import LeadershipDashboard from "./pages/LeadershipDashboard";
import CeoDashboardV2 from "./pages/CeoDashboardV2";
import CeoDashboardV2Logic from "./pages/CeoDashboardV2Logic";
import CeoDashboardV2Insights from "./pages/CeoDashboardV2Insights";
import CeoDashboardV2RevenueLeaks from "./pages/CeoDashboardV2RevenueLeaks";
import ClinicDashboard from "./pages/ClinicDashboard";
import OSAuthorizations from "./pages/os/OSAuthorizations";
import OperationsAcademy from "./pages/blossom/OperationsAcademy";
import TrackDetail from "./pages/blossom/TrackDetail";
import Departments from "./pages/blossom/Departments";
import DepartmentDetail from "./pages/blossom/DepartmentDetail";
import BlossomLocations from "./pages/blossom/Locations";
import LocationDetail from "./pages/blossom/LocationDetail";
import BlossomUsers from "./pages/blossom/Users";
import BlossomReports from "./pages/blossom/BlossomReports";
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
import AccountSettings from "./pages/account/AccountSettings";
import NotificationPreferences from "./pages/NotificationPreferences";
import AdminHub from "./pages/AdminHub";
import AccessRequests from "./pages/admin/AccessRequests";
import LoginVaultAdmin from "./pages/admin/LoginVaultAdmin";
import AdminOnboardingProgress from "./pages/admin/OnboardingProgress";
import DeviceInventory from "./pages/admin/DeviceInventory";
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
import OSWelcomeToBlossom from "./pages/os/OSWelcomeToBlossom";
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
import OSPayrollCoordinator from "./pages/os/OSPayrollCoordinator";
import OSPayrollWorkspace from "./pages/os/OSPayrollWorkspace";
import OSPayrollIssues from "./pages/os/OSPayrollIssues";
import OSPayrollQueue from "./pages/os/OSPayrollQueue";
import OSPayrollAdjustments from "./pages/os/OSPayrollAdjustments";
import OSPayrollTimeAttendance from "./pages/os/OSPayrollTimeAttendance";
import OSPayrollProfiles from "./pages/os/OSPayrollProfiles";
import OSPayrollPTO from "./pages/os/OSPayrollPTO";
import OSPayrollBenefits from "./pages/os/OSPayrollBenefits";
import OSPayrollCompliance from "./pages/os/OSPayrollCompliance";
import OSPayrollTaxDocuments from "./pages/os/OSPayrollTaxDocuments";
import OSPayrollMessages from "./pages/os/OSPayrollMessages";
import OSPayrollResources from "./pages/os/OSPayrollResources";
import OSPayrollTrainingAcademy from "./pages/os/OSPayrollTrainingAcademy";
import OSCaseManager from "./pages/os/case-manager/OSCaseManager";
import {
  CMTrainingAcademy, CMAssignedFamilies, CMParentCommunication, CMFamilySupport,
  CMProgressFollowUps, CMSchedulingCoordination, CMAuthorizationsVisibility,
  CMStaffingCoordination, CMServiceIssues, CMEscalations, CMCommunityReferrals,
  CMResources,
} from "./pages/os/case-manager/pages";
import OSLeads from "./pages/os/OSLeads";
import OSLeadsV2 from "./pages/os/OSLeadsV2";
import OSIntakeOperations from "./pages/os/OSIntakeOperations";
import OSIntakeWorkspace from "./pages/os/OSIntakeWorkspace";
import OSClients from "./pages/os/OSClients";
import OSClientsOperations from "./pages/os/OSClientsOperations";
import OSIntakeClients from "./pages/os/OSIntakeClients";
import OSIntakeAuthorizations from "./pages/os/OSIntakeAuthorizations";
import OpsExecutiveDashboard from "./pages/os/operations/OpsExecutiveDashboard";
import ExecutiveOverview from "./pages/os/executive/ExecutiveOverview";
import CompanyPulse from "./pages/os/executive/CompanyPulse";
import ExecutiveBriefing from "./pages/os/executive/ExecutiveBriefing";
import OrganizationalHealth from "./pages/os/executive/OrganizationalHealth";
import StrategicRisks from "./pages/os/executive/StrategicRisks";
import GrowthReadiness from "./pages/os/executive/GrowthReadiness";
import LeadershipAccountability from "./pages/os/executive/LeadershipAccountability";
import StaffingExpansion from "./pages/os/executive/StaffingExpansion";
import OperationalConsistency from "./pages/os/executive/OperationalConsistency";
import ExecutiveUpdates from "./pages/os/executive/ExecutiveUpdates";
import ExecResourceLibrary from "./pages/os/executive/ExecResourceLibrary";
import OpsCommandCenter from "./pages/os/operations/OpsCommandCenter";
import OpsLeadershipBriefing from "./pages/os/operations/OpsLeadershipBriefing";
import OpsDepartmentHealth from "./pages/os/operations/OpsDepartmentHealth";
import OpsWorkflowRisks from "./pages/os/operations/OpsWorkflowRisks";
import OpsEscalations from "./pages/os/operations/OpsEscalations";
import OpsAccountability from "./pages/os/operations/OpsAccountability";
import OpsStaffingCapacity from "./pages/os/operations/OpsStaffingCapacity";
import OpsTrainingAdoption from "./pages/os/operations/OpsTrainingAdoption";
import OpsLeadershipUpdates from "./pages/os/operations/OpsLeadershipUpdates";
import OpsResourceLibrary from "./pages/os/operations/OpsResourceLibrary";
import OSStateDirector from "./pages/os/OSStateDirector";
import OSCommandCenter from "./pages/os/OSCommandCenter";
import OSIntakeCoordinator from "./pages/os/OSIntakeCoordinator";
import OSAuthCoordinator from "./pages/os/OSAuthCoordinator";
import OSAuthWorkspace from "./pages/os/OSAuthWorkspace";
import OSAuthRiskCenter from "./pages/os/OSAuthRiskCenter";
import OSSupervisionTracking from "./pages/os/OSSupervisionTracking";
import OSParentTraining97156 from "./pages/os/OSParentTraining97156";
import OSSchedulingTeam from "./pages/os/OSSchedulingTeam";
import OSSchedulingWorkspace from "./pages/os/OSSchedulingWorkspace";
import OSRecruitingTeam from "./pages/os/OSRecruitingTeam";
import OSRecruitingWorkspace from "./pages/os/OSRecruitingWorkspace";
import OSRecruitingTrainingAcademy from "./pages/os/OSRecruitingTrainingAcademy";
import OSRecruitingPipeline from "./pages/os/OSRecruitingPipeline";
import OSRecruitingInterviews from "./pages/os/OSRecruitingInterviews";
import OSRecruitingOffers from "./pages/os/OSRecruitingOffers";
import OSRecruitingOnboarding from "./pages/os/OSRecruitingOnboarding";
import OSRecruitingBackgroundChecks from "./pages/os/OSRecruitingBackgroundChecks";
import OSRecruitingOrientation from "./pages/os/OSRecruitingOrientation";
import OSRecruitingStaffingNeeds from "./pages/os/OSRecruitingStaffingNeeds";
import OSRecruitingRBT from "./pages/os/OSRecruitingRBT";
import OSRecruitingBCBA from "./pages/os/OSRecruitingBCBA";
import OSRecruitingPerformance from "./pages/os/OSRecruitingPerformance";
import OSRecruitingFollowUps from "./pages/os/OSRecruitingFollowUps";
import OSRecruitingMessages from "./pages/os/OSRecruitingMessages";
import OSRecruitingEscalations from "./pages/os/OSRecruitingEscalations";
import OSRecruitingResources from "./pages/os/OSRecruitingResources";
import OSHRTeam from "./pages/os/OSHRTeam";
import OSHRWorkspace from "./pages/os/OSHRWorkspace";
import OSHRTrainingAcademy from "./pages/os/OSHRTrainingAcademy";
import OSOnboarding from "./pages/os/OSOnboarding";
import OSHRNewHires from "./pages/os/OSHRNewHires";
import OSHREmployeeSupport from "./pages/os/OSHREmployeeSupport";
import OSHRTrainingCerts from "./pages/os/OSHRTrainingCerts";
import OSHREvaluations from "./pages/os/OSHREvaluations";
import OSHROrientationQueue from "./pages/os/OSHROrientationQueue";
import OSHRRequests from "./pages/os/OSHRRequests";
import OSHRCompliance from "./pages/os/OSHRCompliance";
import OSHRMessages from "./pages/os/OSHRMessages";
import OSHRResources from "./pages/os/OSHRResources";
import OSBillingFinance from "./pages/os/OSBillingFinance";
import OSQATeam from "./pages/os/OSQATeam";
import OSQAWorkspace from "./pages/os/OSQAWorkspace";
import OSQAQueue from "./pages/os/OSQAQueue";
import OSQAAuthReviews from "./pages/os/OSQAAuthReviews";
import OSQAProgressReports from "./pages/os/OSQAProgressReports";
import OSQATreatmentPlans from "./pages/os/OSQATreatmentPlans";
import OSQAMissingInfo from "./pages/os/OSQAMissingInfo";
import OSQAExpiring from "./pages/os/OSQAExpiring";
import OSQAClients from "./pages/os/OSQAClients";
import OSQABCBAs from "./pages/os/OSQABCBAs";
import OSQASupervision from "./pages/os/OSQASupervision";
import OSQAMessages from "./pages/os/OSQAMessages";
import OSQAEscalations from "./pages/os/OSQAEscalations";
import OSQAResources from "./pages/os/OSQAResources";
import OSBCBA from "./pages/os/OSBCBA";
import OSBCBAWorkspace from "./pages/os/OSBCBAWorkspace";
import OSBCBAClients from "./pages/os/OSBCBAClients";
import OSBCBAAuthorizations from "./pages/os/OSBCBAAuthorizations";
import OSBCBASupervision from "./pages/os/OSBCBASupervision";
import OSBCBAParentTraining from "./pages/os/OSBCBAParentTraining";
import OSBCBAScheduling from "./pages/os/OSBCBAScheduling";
import OSRBT from "./pages/os/OSRBT";
import OSRBTMyDay from "./pages/os/OSRBTMyDay";
import OSRBTTrainingAcademy from "./pages/os/OSRBTTrainingAcademy";
import OSRBTClients from "./pages/os/OSRBTClients";
import OSRBTSchedule from "./pages/os/OSRBTSchedule";
import OSRBTSessionSupport from "./pages/os/OSRBTSessionSupport";
import OSRBTSupervision from "./pages/os/OSRBTSupervision";
import OSRBTMessages from "./pages/os/OSRBTMessages";
import OSRBTHelp from "./pages/os/OSRBTHelp";
import OSRBTResources from "./pages/os/OSRBTResources";
import OSPermissions from "./pages/os/OSPermissions";
import { PhoneSystemProvider } from "./contexts/PhoneSystemContext";
import {
  PhoneDashboard, PhoneLookup, PhoneShared, PhoneDirectory,
  PhoneRequestList, PhoneRequestNew, PhoneRequestDetail, PhoneAdmin,
  PhoneAfterHoursAI,
} from "./pages/phone/PhonePages";
import PhoneAiCallAudit from "./pages/phone/PhoneAiCallAudit";
import MarketingDashboard from "./pages/os/marketing/MarketingDashboard";
import MarketingTraining from "./pages/os/marketing/MarketingTraining";
import MarketingCampaigns from "./pages/os/marketing/Campaigns";
import MarketingLeadSources from "./pages/os/marketing/LeadSources";
import MarketingSEO from "./pages/os/marketing/SEOContent";
import MarketingWebAnalytics from "./pages/os/marketing/WebAnalytics";
import MarketingCallTracking from "./pages/os/marketing/CallTracking";
import ReferralCRM from "./pages/os/marketing/ReferralCRM";
import MarketingRecruiting from "./pages/os/marketing/RecruitingMarketing";
import MarketingOutreach from "./pages/os/marketing/CommunityOutreach";
import MarketingReputation from "./pages/os/marketing/Reputation";
import MarketingAttribution from "./pages/os/marketing/AttributionROI";
import MarketingStateGrowth from "./pages/os/marketing/StateGrowth";
import MarketingReports from "./pages/os/marketing/MarketingReports";
import OSReportBcbaPerformance from "./pages/os/OSReportBcbaPerformance";
import OSTraining from "./pages/os/OSTraining";
import OSTrainingDetail from "./pages/os/OSTrainingDetail";
import OSTrainingManage from "./pages/os/OSTrainingManage";
import OSUserManagement from "./pages/os/OSUserManagement";
import UsersHome from "./pages/os/users/UsersHome";
import EmployeeProfilePage from "./pages/os/users/EmployeeProfile";
import IdentityDashboard from "./pages/admin/IdentityDashboard";
import { AdminRoute } from "./components/auth/AdminRoute";
import OSKpiScorecards from "./pages/os/OSKpiScorecards";
import OSAskBlossom from "./pages/os/OSAskBlossom";
import OSResourceLibrary from "./pages/os/OSResourceLibrary";
import OSAuthorizationResources from "./pages/os/OSAuthorizationResources";
import OSBCBAResources from "./pages/os/OSBCBAResources";
import OSBCBATrainingAcademy from "./pages/os/OSBCBATrainingAcademy";
import OSVobDecisionCenter from "./pages/os/OSVobDecisionCenter";
import OSCaseManagement from "./pages/os/OSCaseManagement";
import OSEvaluations from "./pages/os/OSHREvaluations";
import OSAiInsights from "./pages/os/OSAiInsights";
import OSNotifications from "./pages/os/OSNotifications";
import OSSettings from "./pages/os/OSSettings";
import OSWorkforce from "./pages/os/OSWorkforce";
import OSStaffingQueue from "./pages/os/OSStaffingQueue";
import OSScheduling from "./pages/os/OSScheduling";
import OSSchedulingResources from "./pages/os/OSSchedulingResources";
import OSSchedulingRosterRBTs from "./pages/os/OSSchedulingRosterRBTs";
import OSSchedulingRosterBCBAs from "./pages/os/OSSchedulingRosterBCBAs";
import { OSRoleProvider } from "./contexts/OSRoleContext";
import { useOSRole } from "./contexts/OSRoleContext";
import { PublicRoutes } from "./routes/publicRoutes";
import { LegacyDashboardRedirects } from "./routes/legacyRoutes";
import {
  UserCog, CalendarDays as CIcon, ClipboardList, FolderKanban, DollarSign as DIcon,
  BarChart3, GraduationCap, Building2, Settings as SIcon,
  Radio, BellRing, FileCheck2, BadgeCheck, Briefcase, ClipboardCheck,
  Wallet, TrendingUp, ShieldAlert, Target, Workflow, BookOpen, Megaphone, PieChart,
  LifeBuoy, Inbox, AlertTriangle, KanbanSquare, Bot, Brain, Zap, Wand2, Activity,
  Users2, MapPin, UserPlus, MessageSquare, Globe, Hash, Sparkles, Star, HeartHandshake,
  ShieldCheck, UserCheck, Eye, Calendar, FileText, Clock, UsersRound, CheckSquare, Flame, Library,
} from "lucide-react";

const queryClient = new QueryClient();

function ClientsRouter() {
  const { role } = useOSRole();
  if (role === "intake_coordinator") return <OSIntakeClients />;
  if (role === "qa_team") return <OSQAClients />;
  return <OSClientsOperations />;
}

function AuthorizationsRouter() {
  const { role } = useOSRole();
  return role === "intake_coordinator" ? <OSIntakeAuthorizations /> : <OSAuthorizations />;
}

const OSOutlet = () => (
  <OSRoleProvider>
    <Outlet />
  </OSRoleProvider>
);

import { LeadsProvider } from "@/contexts/LeadsContext";
import { ClientsProvider } from "@/contexts/ClientsContext";

function RoleDashboardRedirect() {
  const { roles, isAdmin, hasPerm } = useAuth();
  const hasTrainingAdminAccess = roles.some((role) => TRAINING_ADMIN_ROLES.includes(role));
  const primaryRoleHome =
    isAdmin ? ROLE_HOME.super_admin
    : roles.includes("state_director") ? ROLE_HOME.state_director
    : roles.includes("exec") ? ROLE_HOME.executive_leadership
    : roles.includes("ops_manager") ? ROLE_HOME.operations_leadership
    : roles.includes("intake") ? ROLE_HOME.intake_coordinator
    : roles.includes("auth_team") ? ROLE_HOME.authorization_coordinator
    : roles.includes("scheduling") ? ROLE_HOME.scheduling_team
    : roles.includes("recruiting_assistant") ? ROLE_HOME.recruiting_team
    : roles.includes("hr") || roles.includes("hr_admin") || roles.includes("hr_manager") ? ROLE_HOME.hr_team
    : roles.includes("finance") ? ROLE_HOME.billing_finance
    : roles.includes("qa") ? ROLE_HOME.qa_team
    : roles.includes("payroll_admin") ? ROLE_HOME.payroll_coordinator
    : roles.includes("bcba") ? ROLE_HOME.bcba
    : roles.includes("rbt") ? ROLE_HOME.rbt
    : roles.includes("marketing") ? ROLE_HOME.marketing_team
    : roles.includes("behavioral_support") ? ROLE_HOME.behavioral_support
    : undefined;

  const intelligenceFallback = roles.includes("rbt") || roles.includes("bcba") || hasTrainingAdminAccess ? "/hr/journey" : "/training";
  const fallbackRoute = primaryRoleHome ?? (hasPerm("clients.view") ? "/clients" : intelligenceFallback);
  const allowedRoute = hasFullNavigationAccess(roles) || canAccessRouteForRoles(fallbackRoute, roles)
    ? fallbackRoute
    : intelligenceFallback;

  return <Navigate to={allowedRoute} replace />;
}

function LegacyBcbaDashboardRedirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

function OSCommandCenterRouter() {
  // For now, the State Director Command Center page is our command center experience.
  // Other roles still get a placeholder; this lets State Directors land on a real page.
  return <OSStateDirector />;
}

function OsPrefixRedirect() {
  const { pathname, search, hash } = useLocation();
  const stripped = pathname.replace(/^\/os/, "") || "/";
  return <Navigate to={`${stripped}${search}${hash}`} replace />;
}

const RESOURCE_UPLOAD_ALLOWED_APP_ROLES = new Set([
  ...TRAINING_ADMIN_ROLES,
  "ops_manager",
  "exec",
]);

const RESOURCE_UPLOAD_ALLOWED_OS_ROLES = new Set([
  "super_admin",
  "admin",
  "hr_team",
  "operations_leadership",
  "executive_leadership",
]);

function ResourceUploadAdminRoute() {
  const { user, loading, roles, isAdmin } = useAuth();
  const { role: osRole } = useOSRole();
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  const canOpen =
    isAdmin ||
    RESOURCE_UPLOAD_ALLOWED_OS_ROLES.has(osRole) ||
    roles.some((role) => RESOURCE_UPLOAD_ALLOWED_APP_ROLES.has(role));
  if (!canOpen) return <Unauthorized area="Resource Upload Center" />;
  return <ResourceUploadCenter />;
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
                <PhoneSystemProvider>
                <PushNavigationListener />
                <Routes>
                {PublicRoutes}
                <Route element={<ProtectedRoute><OSOutlet /></ProtectedRoute>}>
                  <Route path="/" element={<OSDashboard />} />
                  <Route path="/ws/:id" element={<WorkspacePage />} />
                  <Route path="/executive" element={<ExecutiveOverview />} />
                  <Route path="/executive/overview" element={<Navigate to="/executive" replace />} />
                  <Route path="/executive/pulse" element={<CompanyPulse />} />
                  <Route path="/executive/briefing" element={<ExecutiveBriefing />} />
                  <Route path="/executive/organizational-health" element={<OrganizationalHealth />} />
                  <Route path="/executive/strategic-risks" element={<StrategicRisks />} />
                  <Route path="/executive/growth-readiness" element={<GrowthReadiness />} />
                  <Route path="/executive/leadership-accountability" element={<LeadershipAccountability />} />
                  <Route path="/executive/staffing-expansion" element={<StaffingExpansion />} />
                  <Route path="/executive/operational-consistency" element={<OperationalConsistency />} />
                  <Route path="/executive/updates" element={<ExecutiveUpdates />} />
                  <Route path="/executive/resources" element={<ExecResourceLibrary />} />
                  <Route path="/operations" element={<OpsExecutiveDashboard />} />
                  <Route path="/operations/command-center" element={<OpsCommandCenter />} />
                  <Route path="/operations/briefing" element={<OpsLeadershipBriefing />} />
                  <Route path="/operations/department-health" element={<OpsDepartmentHealth />} />
                  <Route path="/operations/workflow-risks" element={<OpsWorkflowRisks />} />
                  <Route path="/operations/escalations" element={<OpsEscalations />} />
                  <Route path="/operations/accountability" element={<OpsAccountability />} />
                  <Route path="/operations/staffing-capacity" element={<OpsStaffingCapacity />} />
                  <Route path="/operations/training-adoption" element={<OpsTrainingAdoption />} />
                  <Route path="/operations/updates" element={<OpsLeadershipUpdates />} />
                  <Route path="/operations/resources" element={<OpsResourceLibrary />} />
                  <Route path="/state-director" element={<OSStateDirector />} />
                  <Route path="/intake-coordinator" element={<OSIntakeCoordinator />} />
                  <Route path="/auth-coordinator" element={<OSAuthCoordinator />} />
                  <Route path="/auth-workspace" element={<OSAuthWorkspace />} />
                  <Route path="/auth-risk-center" element={<OSAuthRiskCenter />} />
                  <Route path="/supervision-tracking" element={<OSSupervisionTracking />} />
                  <Route path="/parent-training-97156" element={<OSParentTraining97156 />} />
                  <Route path="/scheduling-team" element={<OSSchedulingTeam />} />
                  <Route path="/scheduling-workspace" element={<OSSchedulingWorkspace />} />
                  <Route path="/staffing" element={<OSStaffingQueue />} />
                  <Route path="/recruiting-team" element={<OSRecruitingTeam />} />
                  <Route path="/recruiting/workspace"      element={<OSRecruitingWorkspace />} />
                  <Route path="/recruiting/academy"        element={<OSRecruitingTrainingAcademy />} />
                  <Route path="/recruiting/pipeline"       element={<OSRecruitingPipeline />} />
                  <Route path="/recruiting/interviews"     element={<OSRecruitingInterviews />} />
                 <Route path="/recruiting/offers"         element={<OSRecruitingOffers />} />
                  <Route path="/recruiting/onboarding"     element={<OSRecruitingOnboarding />} />
                  <Route path="/recruiting/background"     element={<OSRecruitingBackgroundChecks />} />
                  <Route path="/recruiting/orientation"    element={<OSRecruitingOrientation />} />
                  <Route path="/recruiting/staffing-needs" element={<OSRecruitingStaffingNeeds />} />
                  <Route path="/recruiting/rbt"            element={<OSRecruitingRBT />} />
                  <Route path="/recruiting/bcba"           element={<OSRecruitingBCBA />} />
                  <Route path="/recruiting/performance"    element={<OSRecruitingPerformance />} />
                  <Route path="/recruiting/follow-ups"     element={<OSRecruitingFollowUps />} />
                  <Route path="/recruiting/messages"       element={<OSRecruitingMessages />} />
                  <Route path="/recruiting/escalations"    element={<OSRecruitingEscalations />} />
                  <Route path="/recruiting/resources"      element={<OSRecruitingResources />} />
                  <Route path="/hr-team" element={<OSHRTeam />} />
                  <Route path="/hr/workspace" element={<OSHRWorkspace />} />
                  <Route path="/hr/training-academy" element={<OSHRTrainingAcademy />} />
                  <Route path="/os/onboarding" element={<OSOnboarding />} />
                  <Route path="/hr/onboarding-journey" element={<OSOnboarding />} />
                  <Route path="/hr/new-hires" element={<OSHRNewHires />} />
                  <Route path="/hr/employee-support" element={<OSHREmployeeSupport />} />
                  <Route path="/hr/training-certifications" element={<OSHRTrainingCerts />} />
                  <Route path="/hr/evaluations" element={<OSHREvaluations />} />
                  <Route path="/hr/orientation-queue" element={<OSHROrientationQueue />} />
                  <Route path="/hr/requests" element={<OSHRRequests />} />
                  <Route path="/hr/compliance" element={<OSHRCompliance />} />
                  <Route path="/hr/messages" element={<OSHRMessages />} />
                  <Route path="/hr/team-resources" element={<OSHRResources />} />
                  <Route path="/billing-finance" element={<OSBillingFinance />} />
                  <Route path="/qa-team" element={<OSQATeam />} />
                  <Route path="/qa-workspace" element={<OSQAWorkspace />} />
                  <Route path="/qa-queue" element={<OSQAQueue />} />
                  <Route path="/qa-clients" element={<OSQAClients />} />
                  <Route path="/authorization-reviews" element={<OSQAAuthReviews />} />
                  <Route path="/progress-reports" element={<OSQAProgressReports />} />
                  <Route path="/treatment-plan-reviews" element={<OSQATreatmentPlans />} />
                  <Route path="/missing-information" element={<OSQAMissingInfo />} />
                  <Route path="/expiring-items" element={<OSQAExpiring />} />
                  <Route path="/assigned-bcbas" element={<OSQABCBAs />} />
                  <Route path="/supervision-visibility" element={<OSQASupervision />} />
                  <Route path="/qa-messages" element={<OSQAMessages />} />
                  <Route path="/escalations-followups" element={<OSQAEscalations />} />
                  <Route path="/qa/resources" element={<OSQAResources />} />
                  <Route path="/payroll-coordinator" element={<OSPayrollCoordinator />} />
                  <Route path="/payroll/workspace" element={<OSPayrollWorkspace />} />
                  <Route path="/payroll/training-academy" element={<OSPayrollTrainingAcademy />} />
                  <Route path="/payroll/queue" element={<OSPayrollQueue />} />
                  <Route path="/payroll/adjustments" element={<OSPayrollAdjustments />} />
                  <Route path="/payroll/time-attendance" element={<OSPayrollTimeAttendance />} />
                  <Route path="/payroll/issues" element={<OSPayrollIssues />} />
                  <Route path="/payroll/profiles" element={<OSPayrollProfiles />} />
                  <Route path="/payroll/pto" element={<OSPayrollPTO />} />
                  <Route path="/payroll/benefits" element={<OSPayrollBenefits />} />
                  <Route path="/payroll/compliance" element={<OSPayrollCompliance />} />
                  <Route path="/payroll/tax-documents" element={<OSPayrollTaxDocuments />} />
                  <Route path="/payroll/messages" element={<OSPayrollMessages />} />
                  <Route path="/payroll/resources" element={<OSPayrollResources />} />
                  {/* Case Manager role */}
                  <Route path="/case-manager" element={<OSCaseManager />} />
                  <Route path="/case-manager/training" element={<CMTrainingAcademy />} />
                  <Route path="/case-manager/families" element={<CMAssignedFamilies />} />
                  <Route path="/case-manager/communication" element={<CMParentCommunication />} />
                  <Route path="/case-manager/family-support" element={<CMFamilySupport />} />
                  <Route path="/case-manager/follow-ups" element={<CMProgressFollowUps />} />
                  <Route path="/case-manager/scheduling" element={<CMSchedulingCoordination />} />
                  <Route path="/case-manager/authorizations" element={<CMAuthorizationsVisibility />} />
                  <Route path="/case-manager/staffing" element={<CMStaffingCoordination />} />
                  <Route path="/case-manager/service-issues" element={<CMServiceIssues />} />
                  <Route path="/case-manager/escalations" element={<CMEscalations />} />
                  <Route path="/case-manager/community" element={<CMCommunityReferrals />} />
                  <Route path="/case-manager/resources" element={<CMResources />} />
                  <Route path="/bcba" element={<OSBCBA />} />
                  <Route path="/bcba/workspace" element={<OSBCBAWorkspace />} />
                  <Route path="/bcba/clients" element={<OSBCBAClients />} />
                  <Route path="/bcba/authorizations" element={<OSBCBAAuthorizations />} />
                  <Route path="/bcba/supervision" element={<OSBCBASupervision />} />
                  <Route path="/bcba/parent-training" element={<OSBCBAParentTraining />} />
                  <Route path="/bcba/scheduling" element={<OSBCBAScheduling />} />
                  <Route path="/bcba/resources" element={<OSBCBAResources />} />
                  <Route path="/bcba/training-academy" element={<OSBCBATrainingAcademy />} />
                  <Route path="/rbt" element={<OSRBT />} />
                  <Route path="/rbt/my-day" element={<OSRBTMyDay />} />
                  <Route path="/rbt/training-academy" element={<OSRBTTrainingAcademy />} />
                  <Route path="/rbt/clients" element={<OSRBTClients />} />
                  <Route path="/rbt/schedule" element={<OSRBTSchedule />} />
                  <Route path="/rbt/session-support" element={<OSRBTSessionSupport />} />
                  <Route path="/rbt/supervision" element={<OSRBTSupervision />} />
                  <Route path="/rbt/messages" element={<OSRBTMessages />} />
                  <Route path="/rbt/help" element={<OSRBTHelp />} />
                  <Route path="/rbt/resources" element={<OSRBTResources />} />
                  <Route path="/command-center" element={<OSCommandCenter />} />
                  <Route path="/leads" element={<OSLeadsV2 />} />
                  <Route path="/leads/operations" element={<OSIntakeOperations />} />
                  <Route path="/intake" element={<OSIntakeWorkspace />} />
                  <Route path="/clients" element={<ClientsRouter />} />
                  <Route path="/intake/clients" element={<OSIntakeClients />} />
                  <Route path="/intake/leads" element={<Navigate to="/leads" replace />} />
                  <Route path="/intake/vob-decision" element={<Navigate to="/vob-decision-center" replace />} />
                  <Route path="/intake/authorizations" element={<OSIntakeAuthorizations />} />
                  <Route path="/authorizations" element={<AuthorizationsRouter />} />
                  <Route path="/scheduling" element={<OSScheduling />} />
                  <Route path="/scheduling/resources" element={<OSSchedulingResources />} />
                  <Route path="/scheduling/rbts" element={<OSSchedulingRosterRBTs />} />
                  <Route path="/scheduling/bcbas" element={<OSSchedulingRosterBCBAs />} />
                  <Route path="/cases" element={<OSCaseManagement />} />
                  <Route path="/staff" element={<OSWorkforce />} />
                  <Route path="/recruiting" element={<Navigate to="/recruiting/workspace" replace />} />
                  <Route path="/credentialing" element={<OSPlaceholder title="Credentialing" description="Insurance + provider credentialing status and renewals." icon={BadgeCheck} />} />
                  <Route path="/employee-ops" element={<OSPlaceholder title="Employee Operations" description="Employee onboarding and operational workflows." icon={Briefcase} />} />
                  <Route path="/evaluations" element={<OSEvaluations />} />
                  <Route path="/training" element={<OSTraining />} />
                  {/* Canonical Welcome to Blossom route — renders inside the OS shell,
                      not the legacy AppLayout. */}
                  <Route path="/training/welcome" element={<OSWelcomeToBlossom />} />
                  <Route path="/training/manage" element={<OSTrainingManage />} />
                  <Route path="/training/:id" element={<OSTrainingDetail />} />
                  <Route path="/billing" element={<Navigate to="/billing-finance" replace />} />
                  <Route path="/payroll" element={<Navigate to="/payroll/workspace" replace />} />
                  <Route path="/revenue" element={<Navigate to="/billing-finance" replace />} />
                  <Route path="/insurance" element={<Navigate to="/authorizations" replace />} />
                  <Route path="/reports" element={<ReportsHome />} />
                  <Route path="/reports/bcba-performance" element={<OSReportBcbaPerformance />} />
                  <Route path="/reports/qa-supervision-pt" element={<QaSupervisionPtDashboard />} />
                  <Route path="/reports/qa-auth-utilization" element={<QaAuthUtilizationDashboard />} />
                  <Route path="/reports/qa-cancellation" element={<QaCancellationDashboard />} />
                  <Route path="/reports/hr-payroll-command" element={<HrPayrollCommandCenter />} />
                  <Route path="/reports/hr-recruiting-pipeline" element={<HrRecruitingPipelineDashboard />} />
                  <Route path="/reports/hr-employee-compliance" element={<HrEmployeeComplianceDashboard />} />
                  <Route path="/reports/hr-employee-onboarding" element={<HrEmployeeOnboardingCommandCenter />} />
                  <Route path="/reports/hr-bcba-productivity" element={<HrBcbaProductivityDashboard />} />
                 <Route path="/reports/bcba-productivity-report" element={<BcbaProductivityReport />} />
                 <Route path="/reports/bcba-productivity-report-v3" element={<BcbaProductivityReportV3 />} />
                  <Route path="/reports/cancellation-command-center" element={<CancellationCommandCenter />} />
                  <Route path="/dashboards/ai/new" element={<AiDashboardNew />} />
                  <Route path="/dashboards/ai/:id" element={<AiDashboardView />} />
                  <Route path="/reports/ai/new" element={<Navigate to="/dashboards/ai/new" replace />} />
                  <Route path="/reports/ai/:id" element={<AiReportRedirect />} />
                  <Route path="/reports/:reportId" element={<ReportDetail />} />
                  <Route path="/kpi" element={<OSKpiScorecards />} />
                  <Route path="/vob-decision-center" element={<OSVobDecisionCenter />} />
                  <Route path="/workflows" element={<OSPlaceholder title="Workflow Center" description="Operational automations and workflow management." icon={Workflow} />} />
                  <Route path="/sop" element={<Navigate to="/resource-library" replace />} />
                  <Route path="/resource-library" element={<OSResourceLibrary />} />
                  <Route path="/authorizations/resources" element={<OSAuthorizationResources />} />
                  <Route path="/analytics" element={<Navigate to="/reports" replace />} />
                  <Route path="/tech-requests" element={<OSPlaceholder title="Tech Requests" description="Internal technology support requests." icon={LifeBuoy} />} />
                  <Route path="/internal-requests" element={<OSPlaceholder title="Internal Requests" description="Operational and internal forms and approvals." icon={Inbox} />} />
                  <Route path="/open-issues" element={<OSPlaceholder title="Open Issues" description="Operational blockers and issue tracking." icon={AlertTriangle} />} />
                  <Route path="/projects" element={<OSPlaceholder title="Project Tracking" description="Internal projects and initiatives." icon={KanbanSquare} />} />
                  <Route path="/ai/assistant" element={<OSComingSoon title="Ask Blossom AI" description="Your operational AI copilot is on the way. Soon you'll be able to ask Blossom anything about your workflows, reports, and operations." icon={Sparkles} />} />
                  <Route path="/ask-blossom" element={<Navigate to="/ai/assistant" replace />} />
                  <Route path="/ai/insights" element={<OSAiInsights />} />
                  <Route path="/ai/automations" element={<Navigate to="/automations" replace />} />
                  <Route path="/ai/predictive" element={<OSPlaceholder title="Predictive Alerts" description="Future bottleneck and risk detection." icon={Activity} />} />
                  <Route path="/ai/workflows" element={<OSPlaceholder title="AI Workflows" description="AI-assisted operational flows." icon={Wand2} />} />
                  <Route path="/hr" element={<HRSuiteHome />} />
                  <Route path="/hr/training-center" element={<TrainingManagementCenter />} />
                  <Route path="/hr/resources" element={<Navigate to="/hr/resource-management" replace />} />
                  <Route path="/hr/resource-management" element={<ResourceUploadAdminRoute />} />
                  <Route path="/resource-management" element={<Navigate to="/hr/resource-management" replace />} />
                  <Route path="/resources" element={<Navigate to="/resource-library" replace />} />
                  <Route path="/user-management" element={<UsersHome />} />
                  <Route path="/user-management/admin" element={<OSUserManagement />} />
                  <Route path="/user-management/:employeeId" element={<EmployeeProfilePage />} />
                  <Route path="/admin/device-inventory" element={<AdminRoute><DeviceInventory /></AdminRoute>} />
                  <Route path="/notifications" element={<OSNotifications />} />
                  <Route path="/settings" element={<OSSettings />} />
                  <Route path="/state-management" element={<OSPlaceholder title="State Management" description="Multi-state operational setup and configuration." icon={MapPin} />} />
                  <Route path="/permissions" element={<AdminRoute><OSPermissions /></AdminRoute>} />
                  <Route path="/integrations" element={<AdminRoute><Integrations /></AdminRoute>} />
                  <Route path="/phone" element={<PhoneDashboard />} />
                  <Route path="/phone/lookup" element={<PhoneLookup />} />
                  <Route path="/phone/shared" element={<PhoneShared />} />
                  <Route path="/phone/directory" element={<PhoneDirectory />} />
                  <Route path="/phone/requests" element={<PhoneRequestList />} />
                  <Route path="/phone/requests/new" element={<PhoneRequestNew />} />
                  <Route path="/phone/requests/:id" element={<PhoneRequestDetail />} />
                  <Route path="/phone/admin" element={<PhoneAdmin />} />
                  <Route path="/phone/ai-calls" element={<PhoneAfterHoursAI />} />
                  <Route path="/phone/ai-calls/audit" element={<PhoneAiCallAudit />} />
                  {/* Marketing Team */}
                  <Route path="/marketing-dashboard" element={<Navigate to="/marketing" replace />} />
                  <Route path="/marketing" element={<MarketingDashboard />} />
                  <Route path="/marketing/training" element={<MarketingTraining />} />
                  <Route path="/marketing/campaigns" element={<MarketingCampaigns />} />
                  <Route path="/marketing/lead-sources" element={<MarketingLeadSources />} />
                  <Route path="/marketing/seo" element={<MarketingSEO />} />
                  <Route path="/marketing/web-analytics" element={<MarketingWebAnalytics />} />
                  <Route path="/marketing/call-tracking" element={<MarketingCallTracking />} />
                  {/* Relationships routes — Marketing + Super Admin only */}
                  {/* Old standalone Referrals page is retired — redirect to the unified CRM. */}
                  <Route path="/marketing/referrals" element={<Navigate to="/marketing/referral-crm" replace />} />
                  <Route path="/marketing/referral-crm" element={<PermissionRoute allowedRoles={["marketing"]}><ReferralCRM /></PermissionRoute>} />
                  <Route path="/marketing/recruiting" element={<PermissionRoute allowedRoles={["marketing"]}><MarketingRecruiting /></PermissionRoute>} />
                  <Route path="/marketing/outreach" element={<PermissionRoute allowedRoles={["marketing"]}><MarketingOutreach /></PermissionRoute>} />
                  <Route path="/marketing/reputation" element={<PermissionRoute allowedRoles={["marketing"]}><MarketingReputation /></PermissionRoute>} />
                  <Route path="/marketing/attribution" element={<MarketingAttribution />} />
                  <Route path="/marketing/state-growth" element={<MarketingStateGrowth />} />
                  <Route path="/marketing/reports" element={<MarketingReports />} />
                </Route>
                {/* Legacy /os/* URLs redirect to root equivalents */}
                <Route path="/os" element={<Navigate to="/" replace />} />
                <Route path="/os/*" element={<OsPrefixRedirect />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/home-redirect" element={<Navigate to="/" replace />} />
                  <Route path="/welcome" element={<WelcomeHome />} />
                  <Route path="/academy" element={<OperationsAcademy />} />
                  <Route path="/my-learning" element={<MyLearning />} />
                  <Route path="/catalog" element={<TrainingCatalog />} />
                  <Route path="/announcements" element={<AnnouncementsFeed />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notification-preferences" element={<NotificationPreferences />} />
                  <Route path="/account/settings" element={<AccountSettings />} />
                  <Route path="/admin" element={<AdminRoute><AdminHub /></AdminRoute>} />
                  <Route path="/admin/access-requests" element={<AdminRoute><AccessRequests /></AdminRoute>} />
                  <Route path="/admin/login-vault" element={<AdminRoute><LoginVaultAdmin /></AdminRoute>} />
                  <Route path="/admin/onboarding-progress" element={<AdminRoute><AdminOnboardingProgress /></AdminRoute>} />
                  <Route path="/admin/journey-editor" element={<AdminRoute><JourneyEditor /></AdminRoute>} />
                  <Route path="/admin/identity" element={<AdminRoute><IdentityDashboard /></AdminRoute>} />
                  <Route path="/index" element={<Navigate to="/" replace />} />
                  {/* Onboarding journey */}
                  <Route path="/onboarding" element={<Journey />} />
                  {/* Legacy flat-roadmap removed — Journey is the canonical onboarding. */}
                  <Route path="/onboarding/roadmap" element={<Navigate to="/onboarding" replace />} />
                  {/* Legacy onboarding paths redirect to canonical /training/welcome
                      so the page renders inside the OS shell, not AppLayout. */}
                  <Route path="/onboarding/phase/welcome" element={<Navigate to="/training/welcome" replace />} />
                  <Route path="/onboarding/phase/welcome/legacy" element={<Navigate to="/training/welcome" replace />} />
                  <Route path="/onboarding/week/1" element={<WeekOne />} />
                  <Route path="/onboarding/week/2" element={<WeekTwo />} />
                  <Route path="/onboarding/week/3" element={<WeekThree />} />
                  <Route path="/onboarding/week/4" element={<Navigate to="/onboarding/week/4-5" replace />} />
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
                  <Route path="/dashboard" element={<RoleDashboardRedirect />} />
                  <Route path="/blossom/academy" element={<Navigate to="/academy" replace />} />
                  <Route path="/blossom/academy/:trackId" element={<TrackDetail />} />
                  <Route path="/blossom/departments" element={<Departments />} />
                  <Route path="/blossom/departments/:id" element={<DepartmentDetail />} />
                  <Route path="/blossom/locations" element={<BlossomLocations />} />
                  <Route path="/blossom/locations/:id" element={<LocationDetail />} />
                  <Route path="/blossom/users" element={<Navigate to="/user-management" replace />} />
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
                  {LegacyDashboardRedirects}
                  <Route path="/clinic-dashboard" element={<PermissionRoute permission="dashboard.view"><ClinicDashboard /></PermissionRoute>} />
                  <Route path="/leadership-dashboard/clinics/:clinicId" element={<PermissionRoute permission="dashboard.view"><LeadershipDashboard /></PermissionRoute>} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/staffing/:id" element={<RBTDetail />} />
                  <Route path="/qa" element={<QA />} />
                  <Route path="/qa/:id" element={<QADetail />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/automations" element={<PermissionRoute permission="automations.view" allowedRoles={AUTOMATIONS_ROLES}><Automations /></PermissionRoute>} />
                  <Route path="/training/academy" element={<AcademyHome />} />
                  <Route path="/training/academy/week/:weekId" element={<AcademyWeekDetail />} />
                  <Route path="/training/academy/leadership" element={<PermissionRoute permission="hr.training.view"><AcademyLeadership /></PermissionRoute>} />
                  <Route path="/training/academy/editor" element={<PermissionRoute permission="hr.training.assign" allowedRoles={TRAINING_ADMIN_ROLES}><AcademyEditor /></PermissionRoute>} />
                  <Route path="/training/hr-admin-assistant" element={<HRAdminAssistantDashboard />} />
                  <Route path="/training/journeys/authorization-coordinator" element={<AuthorizationCoordinatorJourney />} />
                  <Route path="/training/journeys/bcba" element={<BCBAJourney />} />
                  <Route path="/training/department/:slug" element={<TrainingDepartment />} />
                  <Route path="/training/course/:courseId" element={<TrainingCourse />} />
                  <Route path="/training/course/:courseId/lesson/:lessonId" element={<TrainingCourse />} />
                  <Route path="/team" element={<PermissionRoute><Team /></PermissionRoute>} />
                  <Route path="/admin/training-dashboard" element={<Navigate to="/hr/training-center" replace />} />
                  <Route path="/admin/training-statistics" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingStatistics /></PermissionRoute>} />
                  <Route path="/admin/training-assign" element={<PermissionRoute permission="hr.training.assign" allowedRoles={TRAINING_ADMIN_ROLES}><TrainingAssign /></PermissionRoute>} />
                  <Route path="/admin/track-assign" element={<PermissionRoute permission="hr.training.assign" allowedRoles={TRAINING_ADMIN_ROLES}><TrackAssign /></PermissionRoute>} />
                  <Route path="/admin/role-audit" element={<PermissionRoute allowedRoles={["admin"]}><RoleAuditLog /></PermissionRoute>} />
                  <Route path="/admin/knowledge-base" element={<PermissionRoute allowedRoles={["admin"]}><KnowledgeBase /></PermissionRoute>} />
                  <Route path="/admin/ai-audit" element={<PermissionRoute allowedRoles={["admin"]}><AiAuditLog /></PermissionRoute>} />
                  <Route path="/admin/integrations" element={<PermissionRoute allowedRoles={["admin"]}><Integrations /></PermissionRoute>} />
                  <Route path="/admin/ai" element={<PermissionRoute allowedRoles={["admin"]}><AiAdminShell /></PermissionRoute>}>
                    <Route index element={<AiDashboard />} />
                    <Route path="knowledge" element={<AiKnowledgeHub />} />
                    <Route path="permissions" element={<AiPermissions />} />
                    <Route path="training" element={<AiTraining />} />
                    <Route path="audit" element={<AiAuditLogPage />} />
                    <Route path="memory" element={<AiMemory />} />
                    <Route path="analytics" element={<AiAnalytics />} />
                    <Route path="appearance" element={<AiAppearance />} />
                  </Route>
                  <Route path="/hr/directory" element={<PermissionRoute permission="hr.employees.view"><EmployeeDirectory /></PermissionRoute>} />
                  <Route path="/hr/employees/:id" element={<PermissionRoute permission="hr.employees.view"><EmployeeProfile /></PermissionRoute>} />
                  <Route path="/hr/org-chart" element={<PermissionRoute><OrgChart /></PermissionRoute>} />
                  <Route path="/hr/org-chart/manage" element={<PermissionRoute permission="hr.employees.edit"><OrgChartManage /></PermissionRoute>} />
                  {/* Blossom Identity System — top-level Operations route alias */}
                  <Route path="/org-chart" element={<Navigate to="/hr/org-chart" replace />} />
                  <Route path="/hr/onboarding" element={<PermissionRoute permission="hr.onboarding.manage"><OnboardingCenter /></PermissionRoute>} />
                  <Route path="/hr/time-clock" element={<PermissionRoute permission="hr.timeclock.view"><TimeClock /></PermissionRoute>} />
                  <Route path="/hr/hours" element={<PermissionRoute permission="hr.hours.view"><Hours /></PermissionRoute>} />
                  <Route path="/hr/kiosk" element={<PermissionRoute permission="hr.timeclock.kiosk"><TimeClockKiosk /></PermissionRoute>} />
                  <Route path="/hr/reviews" element={<PermissionRoute permission="hr.reviews.view"><Reviews /></PermissionRoute>} />
                  <Route path="/hr/training" element={<Navigate to="/hr/training-center" replace />} />
                  <Route path="/hr/training-dashboard" element={<Navigate to="/hr/training-center" replace />} />
                  <Route path="/hr/track-analytics" element={<PermissionRoute permission="hr.training.view" allowedRoles={TRAINING_ADMIN_ROLES}><TrackAnalytics /></PermissionRoute>} />
                  <Route path="/admin/track-analytics" element={<Navigate to="/hr/track-analytics" replace />} />
                  <Route path="/hr/payroll" element={<PermissionRoute permission="hr.payroll.runs.view"><Payroll /></PermissionRoute>} />
                  <Route path="/hr/announcements" element={<PermissionRoute permission="hr.announcements.view"><Announcements /></PermissionRoute>} />
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
                </PhoneSystemProvider>
              </JourneyOverridesProvider>
            </ClientsProvider>
          </LeadsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
