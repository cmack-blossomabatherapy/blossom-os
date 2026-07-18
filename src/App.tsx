import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OPERATIONS_LEADERSHIP_ROUTE_ROLES, OPERATIONS_AND_STATE_ROUTE_ROLES } from "@/lib/os/operationsRoles";
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
import LeadIdRedirect from "./components/leads/LeadIdRedirect";
import MapslyHub from "./pages/os/mapsly/MapslyHub";
import OrgChartPage from "./pages/os/org/OrgChartPage";
import LiveOrgChart from "./pages/os/org/LiveOrgChart";
import CompanyHome from "./pages/os/home/CompanyHome";
import CompanyHomeManage from "./pages/os/home/CompanyHomeManage";
import GoalsPage from "./pages/os/goals/GoalsPage";
import MileageCenter from "./pages/os/mapsly/MileageCenter";
import BDTerritories from "./pages/os/mapsly/BDTerritories";
import RecruitingMap from "./pages/os/mapsly/RecruitingMap";
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
import Reports from "./pages/Reports";
import ReportsHome from "./pages/os/reports/ReportsHome";
import BusinessDevelopmentDashboard from "./pages/os/growth/BusinessDevelopmentDashboard";
import LeadTrap from "./pages/os/growth/LeadTrap";
import FacebookAds from "./pages/os/growth/FacebookAds";
import GoogleAds from "./pages/os/growth/GoogleAds";
import PatientLifetimeJourney from "./pages/os/growth/PatientLifetimeJourney";
import IntakeWorkspaceLanding from "./pages/os/intake/IntakeDashboard";
import IntakeTasks from "./pages/os/intake/IntakeTasks";
import TasksPage from "./pages/tasks/TasksPage";
import LeadBenefitsCheatSheets from "./pages/os/intake/LeadBenefitsCheatSheets";
import MissingInformation from "./pages/os/intake/MissingInformation";
import CentralReachPacketPrep from "./pages/os/intake/CentralReachPacketPrep";
import ParentCommunication from "./pages/os/intake/ParentCommunication";
import ReportDetail from "./pages/os/reports/ReportDetail";
import QaSupervisionPtDashboard from "./pages/os/reports/QaSupervisionPtDashboard";
import QaAuthUtilizationDashboard from "./pages/os/reports/QaAuthUtilizationDashboard";
import QaCancellationDashboard from "./pages/os/reports/QaCancellationDashboard";
import HrPayrollCommandCenter from "./pages/os/reports/HrPayrollCommandCenter";
import HrEmployeeComplianceDashboard from "./pages/os/reports/HrEmployeeComplianceDashboard";
import HrEmployeeOnboardingCommandCenter from "./pages/os/reports/HrEmployeeOnboardingCommandCenter";
import HrBcbaProductivityDashboard from "./pages/os/reports/HrBcbaProductivityDashboard";
import BcbaProductivityReport from "./pages/os/reports/BcbaProductivityReport";
import BcbaProductivityReportV3 from "./pages/os/reports/BcbaProductivityReportV3";
import CancellationCommandCenter from "./pages/os/reports/CancellationCommandCenter";
import { ReportRoleGuard } from "./components/reports/ReportRoleGuard";
import OSMvpPage from "./pages/os/mvp/OSMvpPage";
import ExpiringAuthorizations from "./pages/os/operations/ExpiringAuthorizations";
import MissingDocs from "./pages/os/operations/MissingDocs";
import PayerRequirements from "./pages/os/operations/PayerRequirements";
import MakeUpSessions from "./pages/os/operations/MakeUpSessions";
import RbtMatchQueue from "./pages/os/operations/RbtMatchQueue";
import AiDashboardNew from "./pages/os/dashboards/AiDashboardNew";
import AiDashboardView from "./pages/os/dashboards/AiDashboardView";

// Recruiting Pass 7 / Reports cleanup: /reports is the single visible Reports
// destination. Legacy /reports/ai/* aliases now redirect to /reports rather
// than routing users into AI dashboards.
function AiReportRedirect() {
  return <Navigate to="/reports" replace />;
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
import IntegrationIngestAdminPage from "./pages/admin/IntegrationIngest";
import JourneyHub from "./pages/hr/JourneyHub";
import JourneyDrive from "./pages/hr/JourneyDrive";
import LeadershipDashboard from "./pages/LeadershipDashboard";
// Legacy CEO/BCBA performance dashboard components are retired — the canonical report
// now lives at /reports/bcba-performance and legacy URLs redirect there.
import ClinicDashboard from "./pages/ClinicDashboard";
import OSAuthorizations from "./pages/os/OSAuthorizations";
import OperationsAcademy from "./pages/blossom/OperationsAcademy";
import TrainingAcademyHome from "./pages/academy/TrainingAcademyHome";
import TrainingPathDetail from "./pages/academy/TrainingPathDetail";
import TrainingPathDayDetail from "./pages/academy/TrainingPathDayDetail";
import TrainingModuleRuntime from "./pages/academy/TrainingModuleRuntime";
import TrainingLessonRuntime from "./pages/academy/TrainingLessonRuntime";
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
import RbtLifecycle from "./pages/admin/RbtLifecycle";
import BcbaLifecycle from "./pages/admin/BcbaLifecycle";
import RbtAdminHub from "./pages/admin/RbtAdminHub";
import RbtJourneyCommandCenter from "./pages/admin/RbtJourneyCommandCenter";
import RbtTrainerDashboard from "./pages/admin/RbtTrainerDashboard";
import RbtFirst90Dashboard from "./pages/admin/RbtFirst90Dashboard";
import RbtWorkforceDashboard from "./pages/admin/RbtWorkforceDashboard";
import RbtAppShell from "./pages/rbt/app/shell";
import { RbtHome, RbtSchedule, RbtLearn, RbtMe, RbtProgramPage, RbtPassportPage } from "./pages/rbt/app/pages";
import SupportHome from "./pages/rbt/app/support/SupportHome";
import SupportNew from "./pages/rbt/app/support/SupportNew";
import SupportUrgent from "./pages/rbt/app/support/SupportUrgent";
import SupportTeam from "./pages/rbt/app/support/SupportTeam";
import SupportTicketDetail from "./pages/rbt/app/support/SupportTicketDetail";
import RbtSupportConsole from "./pages/admin/RbtSupportConsole";
import RbtNotificationEngine from "./pages/admin/RbtNotificationEngine";
import NotificationInbox from "./pages/NotificationInbox";
import RbtNotificationPreferences from "./pages/rbt/app/settings/NotificationPreferences";
import BcbaNotificationEngine from "./pages/admin/BcbaNotificationEngine";
import BcbaNotificationPreferences from "./pages/bcba/settings/BcbaNotificationPreferences";
import RbtPreboarding from "./pages/rbt/app/preboarding/RbtPreboarding";
import RbtReadiness from "./pages/rbt/app/readiness/RbtReadiness";
import RbtStaffing from "./pages/rbt/app/readiness/RbtStaffing";
import RbtFirstCase from "./pages/rbt/app/firstcase/RbtFirstCase";
import FirstSessionCheckin from "./pages/rbt/app/firstcase/FirstSessionCheckin";
import RbtFirstCaseConsole from "./pages/training/RbtFirstCaseConsole";
import RbtJourney from "./pages/rbt/app/journey/RbtJourney";
import RbtJourneyCheckpoint from "./pages/rbt/app/journey/RbtJourneyCheckpoint";
import MyClients from "./pages/rbt/app/active/MyClients";
import RbtHours from "./pages/rbt/app/active/Hours";
import RbtSupervisionPage from "./pages/rbt/app/active/Supervision";
import RbtCredentialsPage from "./pages/rbt/app/active/Credentials";
import RbtPerformancePage from "./pages/rbt/app/active/Performance";
import RbtMyGrowth from "./pages/rbt/app/growth/RbtMyGrowth";
import RbtFellowshipExplorer from "./pages/rbt/app/growth/RbtFellowshipExplorer";
import BcbaShell from "./pages/bcba/BcbaShell";
import {
  BcbaHome, BcbaCaseload, BcbaMyRbts, BcbaClinicalWork,
  BcbaLearn, BcbaSupport, BcbaMe,
} from "./pages/bcba/pages";
import BcbaOnboardingPage from "./pages/bcba/onboarding/BcbaOnboardingPage";
import BcbaOnboardingConsole from "./pages/admin/BcbaOnboardingConsole";
import BcbaSupervisionCenter from "./pages/bcba/supervision/SupervisionCenterPage";
import BcbaAssessmentsPage from "./pages/bcba/assessments/AssessmentsPage";
import BcbaProgressReportsPage from "./pages/bcba/progress-reports/ProgressReportsPage";
import BcbaParentTrainingPage from "./pages/bcba/parent-training/ParentTrainingPage";
import BcbaProductivityPage from "./pages/bcba/productivity/ProductivityPage";
import BcbaSupportPageV2 from "./pages/bcba/support/SupportPage";
import BcbaAcademyPage from "./pages/bcba/academy/AcademyPage";
import BcbaFellowshipPage from "./pages/bcba/fellowship/FellowshipPage";
import BcbaCopilotPage from "./pages/bcba/copilot/BcbaCopilotPage";
import ClinicalLeadershipHome from "./pages/clinical-leadership/ClinicalLeadershipHome";
import BcbaWorkforcePage from "./pages/clinical-leadership/BcbaWorkforcePage";
import CaseloadRiskPage from "./pages/clinical-leadership/CaseloadRiskPage";
import ClinicalRbtSupervisionPage from "./pages/clinical-leadership/RbtSupervisionPage";
import AssessmentQaPage from "./pages/clinical-leadership/AssessmentQaPage";
import ProgressAuthPage from "./pages/clinical-leadership/ProgressAuthPage";
import ParentTrainingUtilizationPage from "./pages/clinical-leadership/ParentTrainingUtilizationPage";
import ClinicalCapacityPage from "./pages/clinical-leadership/CapacityPage";
import ClinicalSupportPage from "./pages/clinical-leadership/ClinicalSupportPage";
import FellowshipSupervisionPage from "./pages/clinical-leadership/FellowshipSupervisionPage";
import BcbaSupervisionConfigPage from "./pages/admin/BcbaSupervisionConfigPage";
import RbtGrowthConsole from "./pages/admin/RbtGrowthConsole";
import RbtJourneyConsole from "./pages/training/RbtJourneyConsole";
import RbtReadinessConsole from "./pages/admin/RbtReadinessConsole";
import RbtPreboardingConsole from "./pages/admin/RbtPreboardingConsole";
import RbtTrainingConsole from "./pages/admin/RbtTrainingConsole";
import RbtEvaluatorConsole from "./pages/training/RbtEvaluatorConsole";
import { JourneyOverridesProvider } from "@/hooks/useJourneyOverrides";
import OSDashboard from "./pages/os/OSDashboard";
import OSPlaceholder from "./pages/os/OSPlaceholder";
import { OSShell } from "./pages/os/OSShell";
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
import ClinicalDirectorDashboard from "./pages/os/clinical/ClinicalDirectorDashboard";
import BehavioralSupportDashboard from "./pages/os/behavioral-support/BehavioralSupportDashboard";
import BehavioralSupportCrisisSupport from "./pages/os/behavioral-support/BehavioralSupportCrisisSupport";
import BehavioralSupportEscalations from "./pages/os/behavioral-support/BehavioralSupportEscalations";
import BehavioralSupportPlans from "./pages/os/behavioral-support/BehavioralSupportPlans";
import BehavioralSupportFollowUps from "./pages/os/behavioral-support/BehavioralSupportFollowUps";
import BehavioralSupportSupervisionVisibility from "./pages/os/behavioral-support/BehavioralSupportSupervisionVisibility";
import BehavioralSupportEvaluations from "./pages/os/behavioral-support/BehavioralSupportEvaluations";
import OSBehavioralSupportResources from "./pages/os/OSBehavioralSupportResources";
import {
  CMAssignedFamilies, CMParentCommunication, CMFamilySupport,
  CMProgressFollowUps, CMSchedulingCoordination, CMAuthorizationsVisibility,
  CMStaffingCoordination, CMServiceIssues, CMEscalations, CMCommunityReferrals,
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
import OSStateDirectorResources from "./pages/os/OSStateDirectorResources";
import OSAssistantStateDirectorResources from "./pages/os/OSAssistantStateDirectorResources";
import OSCommandCenter from "./pages/os/OSCommandCenter";
import OSIntakeCoordinator from "./pages/os/OSIntakeCoordinator";
import OSAuthCoordinator from "./pages/os/OSAuthCoordinator";
import OSAuthWorkspace from "./pages/os/OSAuthWorkspace";
import OSAuthRiskCenter from "./pages/os/OSAuthRiskCenter";
import OSSupervisionTracking from "./pages/os/OSSupervisionTracking";
import OSParentTraining97156 from "./pages/os/OSParentTraining97156";
import OSSchedulingWorkspace from "./pages/os/OSSchedulingWorkspace";
import OSRecruitingTeam from "./pages/os/OSRecruitingTeam";
import OSRecruitingWorkspace from "./pages/os/OSRecruitingWorkspace";
import OSRecruitingTrainingAcademy from "./pages/os/OSRecruitingTrainingAcademy";
import OSRecruitingPipeline from "./pages/os/OSRecruitingPipeline";
import OSRecruitingInterviews from "./pages/os/OSRecruitingInterviews";
import { SafeBoundary } from "@/components/common/SafeBoundary";
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
import OSRBTReadinessBoard from "./pages/os/OSRBTReadinessBoard";
import OSRBTAcademyAdmin from "./pages/os/OSRBTAcademyAdmin";
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
import CTMCalls from "./pages/phone/CTMCalls";
import MarketingDashboard from "./pages/os/marketing/MarketingDashboard";
import MarketingTraining from "./pages/os/marketing/MarketingTraining";
import MarketingCampaigns from "./pages/os/marketing/Campaigns";
import MarketingLeadSources from "./pages/os/marketing/LeadSources";
import LeadSourceInbox from "./pages/os/growth/LeadSourceInbox";
import MarketingSEO from "./pages/os/marketing/SEOContent";
import MarketingWebAnalytics from "./pages/os/marketing/WebAnalytics";
import MarketingCallTracking from "./pages/os/marketing/CallTracking";
import ReferralCRM from "./pages/os/marketing/ReferralCRM";
import MarketingRecruiting from "./pages/os/marketing/RecruitingMarketing";
import MarketingOutreach from "./pages/os/marketing/CommunityOutreach";
import MarketingReputation from "./pages/os/marketing/Reputation";
import MarketingAttribution from "./pages/os/marketing/AttributionROI";
import MarketingStateGrowth from "./pages/os/marketing/StateGrowth";
import EmailMarketing from "./pages/os/marketing/EmailMarketing";
import OSReportBcbaPerformance from "./pages/os/OSReportBcbaPerformance";
import OSTraining from "./pages/os/OSTraining";
import OSTrainingDetail from "./pages/os/OSTrainingDetail";
import OSTrainingManage from "./pages/os/OSTrainingManage";
import UsersHome from "./pages/os/users/UsersHome";
import EmployeeProfilePage from "./pages/os/users/EmployeeProfile";
import IdentityDashboard from "./pages/admin/IdentityDashboard";
import AutomatedEmailsPage from "./pages/admin/AutomatedEmails";
import CTMAdmin from "./pages/admin/CTMAdmin";
import { AdminRoute } from "./components/auth/AdminRoute";
import { BlockIntakeRoute } from "./components/auth/BlockIntakeRoute";
import { PhoneSystemRoute } from "./components/auth/PhoneSystemRoute";
import { IntakeAiCallsRoute } from "./components/auth/IntakeAiCallsRoute";
import {
  RoleManagementPage, UserLoginsVaultPage,
  NFCBadgeManagementPage, DeviceRequestsPage,
} from "./pages/os/people/PeoplePages";
import {
  CredentialingDashboardPage, ProviderCredentialingPage, InsuranceCredentialingPage,
  BCBACredentialsPage, UncredentialedBCBAsPage, ExpiringCredentialsPage,
} from "./pages/os/credentialing/CredentialingPages";
import {
  StateOperationsPage, AuthorizationsPhase6Page, ApprovedAuthorizationsPage,
  DenialsPage, NoOONBenefitsPage,
  CaseManagementPhase6Page, QAPhase6OpsPage,
  StateEscalationsPage, OperationalTasksPage,
} from "./pages/os/operations-phase6/OperationsPages";
import OSStaffingWorkspace from "./pages/os/OSStaffingWorkspace";
import {
  CallLogsPage, PhoneRequestsTopPage, DirectoryTopPage,
  UserActivityLogPage, PatientActivityLogPage,
} from "./pages/os/communications/CommunicationsPages";
import ActivityCenterPage from "./pages/os/communications/ActivityCenter";
import WorkQueuePage from "./pages/os/work-queue/WorkQueuePage";
import EscalationCenterPage from "./pages/os/work-queue/EscalationCenter";
import {
  WorkflowInventoryPage, RequestIntakePage, IssueTrackerPage,
} from "./pages/os/system-tools/SystemToolsPages";
import CentralReachHub from "./pages/os/system/CentralReachHub";
import AuditLogPage from "./pages/os/system-tools/AuditLogPage";
import EmailCommandCenter from "./pages/os/system/EmailCommandCenter";
import BlossomOSHome from "./pages/os/home/BlossomOSHome";
import OSKpiScorecards from "./pages/os/OSKpiScorecards";
import OSAskBlossom from "./pages/os/OSAskBlossom";
import OSResourceLibrary from "./pages/os/OSResourceLibrary";
import ResourceLibraryRole from "./pages/resource-library/ResourceLibraryRole";
import ResourceLibraryDepartment from "./pages/resource-library/ResourceLibraryDepartment";
import ResourceLibraryTraining from "./pages/resource-library/ResourceLibraryTraining";
import ResourceLibrarySops from "./pages/resource-library/ResourceLibrarySops";
import ResourceLibraryVideos from "./pages/resource-library/ResourceLibraryVideos";
import ResourceLibraryDetail from "./pages/resource-library/ResourceLibraryDetail";
import ResourceLibraryAdminQA from "./pages/resource-library/ResourceLibraryAdminQA";
import ResourceLibraryIntake from "./pages/resource-library/ResourceLibraryIntake";
import ResourceLibraryRecruiting from "./pages/resource-library/ResourceLibraryRecruiting";
import ResourceLibraryAuthorizations from "./pages/resource-library/ResourceLibraryAuthorizations";
import ResourceLibraryScheduling from "./pages/resource-library/ResourceLibraryScheduling";
import ResourceLibraryStaffing from "./pages/resource-library/ResourceLibraryStaffing";
import ResourceLibraryCredentialing from "./pages/resource-library/ResourceLibraryCredentialing";
import OSBlossomAIManagement from "./pages/os/OSBlossomAIManagement";
import OSAuthorizationResources from "./pages/os/OSAuthorizationResources";
import OSAuthHandoff from "./pages/os/OSAuthHandoff";
import OSQAReviewBoard from "./pages/os/OSQAReviewBoard";
import OSBCBAResources from "./pages/os/OSBCBAResources";
import OSCaseManagerResources from "./pages/os/OSCaseManagerResources";
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
import OSSchedulingBoard from "./pages/os/OSSchedulingBoard";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Returning to the tab should NOT refetch every query. That used to
      // make Blossom OS feel like it was reloading on focus.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

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

// Wraps a page in the current Blossom OS shell. Used for generic pages (e.g.
// Training Academy) that don't bring their own shell but are reached from
// role menus that expect the OS sidebar/topbar to remain visible.
function OSShellPage({ children }: { children: React.ReactNode }) {
  return (
    <OSRoleProvider>
      <OSShell>{children}</OSShell>
    </OSRoleProvider>
  );
}

// Canonical Marketing access model. Every /marketing/* route below must be
// wrapped with PermissionRoute using one of these constants so the access
// model stays uniform across every Marketing workspace.
const MARKETING_ROLES = [
  "admin",
  "super_admin",
  "marketing",
  "marketing_team",
  "marketing_growth_lead",
] as const;
const MARKETING_ROLES_WITH_BD = [
  ...MARKETING_ROLES,
  "business_development",
] as const;
// Growth Snapshot is executive-visible: leadership roles need read
// access to /marketing/state-growth in addition to marketing.
const GROWTH_SNAPSHOT_ROLES = [
  ...MARKETING_ROLES,
  "systems_admin",
  "executive_leadership",
  "exec",
  "executive",
  "ceo",
  "coo",
  "operations_leadership",
  "ops_manager",
  "director_of_operations",
  "operations_manager",
  "marketing_director",
  "marketing_manager",
] as const;
// Canonical Business Development access model. `/business-development`
// must be reachable by BD as well as marketing_growth_lead (which has
// BD in its role menu and live-path set) and Admin / Super Admin.
const BUSINESS_DEVELOPMENT_ROLES = [
  "admin",
  "super_admin",
  "business_development",
  "marketing_growth_lead",
] as const;

import { LeadsProvider } from "@/contexts/LeadsContext";
import { LeadDrawerProvider } from "@/contexts/LeadDrawerContext";
import { ClientsProvider } from "@/contexts/ClientsContext";

function RoleDashboardRedirect() {
  const { user, loading, roles, isAdmin, hasPerm } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  const hasTrainingAdminAccess = roles.some((role) => TRAINING_ADMIN_ROLES.includes(role));
  const primaryRoleHome =
    isAdmin ? ROLE_HOME.super_admin
    : roles.includes("state_director") ? ROLE_HOME.state_director
    : roles.includes("exec") ? ROLE_HOME.executive_leadership
    : roles.includes("ops_manager") ? ROLE_HOME.operations_leadership
    : roles.includes("intake") ? ROLE_HOME.intake_coordinator
    : roles.includes("auth_team") ? ROLE_HOME.authorization_coordinator
    : roles.includes("scheduling") ? ROLE_HOME.scheduling_team
    : roles.includes("staffing_lead") ? ROLE_HOME.staffing_lead
    : roles.includes("staffing_coordinator") ? ROLE_HOME.staffing_coordinator
    : roles.includes("staffing") ? ROLE_HOME.staffing_team
    : (roles as string[]).includes("recruiting_team") ? ROLE_HOME.recruiting_team
    : roles.includes("recruiting_lead") ? ROLE_HOME.recruiting_lead
    : roles.includes("recruiting_coordinator") ? ROLE_HOME.recruiting_coordinator
    : roles.includes("recruiting_assistant") ? ROLE_HOME.recruiting_team
    : roles.includes("hr_lead") || roles.includes("hr_admin") || roles.includes("hr_manager") ? ROLE_HOME.hr_lead
    : roles.includes("hr") ? ROLE_HOME.hr_team
    : roles.includes("finance") ? ROLE_HOME.billing_finance
    : roles.includes("qa_director") ? ROLE_HOME.qa_director
    : roles.includes("qa_specialist") ? ROLE_HOME.qa_specialist
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

// Company Home is the universal landing page for every signed-in role.
// Role-specific dashboards remain reachable from the sidebar and via /dashboard.
function RootToCompanyHome() {
  const { user, loading, roles } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  // RBTs land directly in the mobile RBT app.
  const NON_RBT_ROLES = new Set([
    "admin","super_admin","exec","executive","coo","ops_manager",
    "director_of_operations","operations_manager","hr","hr_admin","hr_manager",
    "training_admin","state_director","assistant_state_director",
  ]);
  const hasRbt = roles.includes("rbt");
  const hasOtherPrimary = roles.some((r) => NON_RBT_ROLES.has(r));
  if (hasRbt && !hasOtherPrimary) return <Navigate to="/rbt/app/home" replace />;
  return <Navigate to="/home" replace />;
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
            <LeadDrawerProvider>
            <ClientsProvider>
              <JourneyOverridesProvider>
                <PhoneSystemProvider>
                <PushNavigationListener />
                <Routes>
                {PublicRoutes}
                <Route element={<ProtectedRoute><OSOutlet /></ProtectedRoute>}>
                  <Route path="/" element={<RootToCompanyHome />} />
                  <Route path="/blossom-os" element={<BlossomOSHome />} />
                  <Route path="/dashboard/legacy" element={<OSDashboard />} />
                  {/* Legacy /ws/:id routes are kept only for back-compat redirects
                      onto the live Blossom OS shell. Executive Leadership and
                      friends must never land in the old workspace shell. */}
                  <Route path="/ws/executive"  element={<Navigate to="/executive"                  replace />} />
                  <Route path="/ws/operations" element={<Navigate to="/operations/command-center"  replace />} />
                  <Route path="/ws/marketing"  element={<Navigate to="/marketing"                  replace />} />
                  <Route path="/ws/intake"     element={<Navigate to="/intake/dashboard"           replace />} />
                  <Route path="/ws/finance"    element={<Navigate to="/reports"                    replace />} />
                  {/* Old workspace shell is fully retired — any /ws/:id falls back to dashboard. */}
                  <Route path="/ws/:id"        element={<Navigate to="/dashboard" replace />} />
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
                  <Route path="/executive/resources" element={<Navigate to="/resource-library" replace />} />
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
                  <Route path="/operations/resources" element={<Navigate to="/resource-library" replace />} />
                  <Route path="/state-director" element={<OSStateDirector />} />
                  <Route path="/state-director/resources" element={<PermissionRoute allowedRoles={["admin", "state_director", "assistant_state_director", "regional_state_director", "state_va", "exec", "executive", "coo", "ops_manager", "director_of_operations", "operations_manager", "operations_leadership", "business_development", "intake_lead", "recruiting_lead", "scheduling_lead", "staffing_lead", "clinical_director", "bcba", "case_manager", "qa", "qa_director", "authorization_manager", "training_manager"]}><OSStateDirectorResources /></PermissionRoute>} />
                  <Route path="/assistant-state-director/resources" element={<PermissionRoute allowedRoles={["admin", "assistant_state_director", "state_director", "regional_state_director", "state_va", "exec", "executive", "coo", "ops_manager", "director_of_operations", "operations_manager", "operations_leadership", "intake_lead", "recruiting_lead", "scheduling_lead", "staffing_lead", "clinical_director", "case_manager", "qa", "qa_director", "authorization_manager", "training_manager"]}><OSAssistantStateDirectorResources /></PermissionRoute>} />
                  <Route path="/intake-coordinator" element={<OSIntakeCoordinator />} />
                  <Route path="/auth-coordinator" element={<OSAuthCoordinator />} />
                  <Route path="/auth-workspace" element={<OSAuthWorkspace />} />
                  <Route path="/auth-risk-center" element={<OSAuthRiskCenter />} />
                  <Route path="/supervision-tracking" element={<OSSupervisionTracking />} />
                  <Route path="/parent-training-97156" element={<OSParentTraining97156 />} />
                  {/* Pass 3 — /scheduling-team is no longer a distinct product surface.
                     The canonical Scheduling dashboard is /scheduling. */}
                  <Route path="/scheduling-team" element={<Navigate to="/scheduling" replace />} />
                  <Route path="/scheduling-workspace" element={<PermissionRoute allowedRoles={["admin", "scheduling", "scheduling_team", "scheduling_lead", "scheduling_coordinator", "state_director", "assistant_state_director", "exec", "executive", "coo", "ops_manager", "director_of_operations", "operations_manager", "operations_leadership"]}><OSSchedulingWorkspace /></PermissionRoute>} />
                  {/* Pass 2 — /staffing is no longer the source of truth.
                     Canonical staffing workspace is /ops/staffing. Redirect to
                     the Open Cases tab. */}
                  <Route path="/staffing" element={<Navigate to="/ops/staffing?tab=open-cases" replace />} />
                  <Route path="/recruiting-team" element={<OSRecruitingTeam />} />
                  <Route path="/recruiting/workspace"      element={<OSRecruitingWorkspace />} />
                  <Route path="/recruiting/academy"        element={<OSRecruitingTrainingAcademy />} />
                  <Route path="/recruiting/pipeline"       element={<OSRecruitingPipeline />} />
                  <Route path="/recruiting/interviews"     element={<SafeBoundary label="Interviews" fallbackTitle="Interviews could not load." showErrorDetails><OSRecruitingInterviews /></SafeBoundary>} />
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
                  <Route path="/recruiting/resources"      element={<Navigate to="/resource-library" replace />} />
                  <Route path="/hr-team" element={<OSHRTeam />} />
                  <Route path="/hr/workspace" element={<OSHRWorkspace />} />
                  {/* /hr/training-academy is the universal LMS learner home; redirect to /academy. */}
                  <Route path="/hr/training-academy" element={<Navigate to="/academy" replace />} />
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
                  <Route path="/hr/team-resources" element={<Navigate to="/resource-library" replace />} />
                  <Route path="/billing-finance" element={<OSBillingFinance />} />
                  <Route path="/qa-team" element={<PermissionRoute allowedRoles={["admin", "qa", "qa_team", "qa_director", "qa_specialist", "clinical_director", "state_director", "assistant_state_director", "exec", "executive", "coo", "ops_manager", "director_of_operations", "operations_manager", "operations_leadership"]}><OSQATeam /></PermissionRoute>} />
                  <Route path="/qa-workspace" element={<OSQAWorkspace />} />
                  <Route path="/qa-queue" element={<OSQAQueue />} />
                  <Route path="/qa/board" element={<OSQAReviewBoard />} />
                  <Route path="/qa-clients" element={<OSQAClients />} />
                  <Route path="/authorization-reviews" element={<OSQAAuthReviews />} />
                  {/* Progress Reports: canonical destination is the Reports hub. The
                      /progress-reports URL stays as a backward-compatible redirect and
                      the working page is deep-linked at /reports/progress-reports. */}
                  <Route path="/progress-reports" element={<Navigate to="/reports/progress-reports" replace />} />
                  <Route path="/treatment-plan-reviews" element={<OSQATreatmentPlans />} />
                  <Route path="/missing-information" element={<OSQAMissingInfo />} />
                  <Route path="/expiring-items" element={<OSQAExpiring />} />
                  <Route path="/assigned-bcbas" element={<PermissionRoute allowedRoles={["admin","super_admin","qa","qa_lead","clinical_director","operations_leadership","state_director"]}><OSQABCBAs /></PermissionRoute>} />
                  <Route path="/supervision-visibility" element={<PermissionRoute allowedRoles={["admin","super_admin","qa","qa_lead","clinical_director","operations_leadership","state_director"]}><OSQASupervision /></PermissionRoute>} />
                  <Route path="/qa-messages" element={<OSQAMessages />} />
                  <Route path="/escalations-followups" element={<PermissionRoute allowedRoles={["admin","super_admin","qa","qa_lead","clinical_director","operations_leadership","state_director"]}><OSQAEscalations /></PermissionRoute>} />
                  <Route path="/qa/resources" element={<Navigate to="/resource-library" replace />} />
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
                  <Route path="/payroll/resources" element={<Navigate to="/resource-library" replace />} />
                  {/* Case Manager role */}
                  <Route path="/case-manager" element={<OSCaseManager />} />
                  <Route path="/clinical-director" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership"]}><ClinicalDirectorDashboard /></PermissionRoute>} />
                  {/* Live Org Chart — HR + admins can edit; every authenticated
                      teammate can view. Edit gate is enforced inside OrgChartPage. */}
                  <Route path="/org-chart" element={<OSShellPage><LiveOrgChart /></OSShellPage>} />
                  <Route path="/org-chart/editor" element={<OSShellPage><OrgChartPage /></OSShellPage>} />
                  {/* Universal Tasks page — must sit OUTSIDE the AppLayout parent
                      group so we don't get AppLayout's sidebar/header AND the OS
                      shell rendering at the same time (the "2 menus / 2 headers"
                      bug). OSShellPage provides the single Blossom OS shell. */}
                  <Route path="/tasks" element={<OSShellPage><TasksPage /></OSShellPage>} />
                  {/* Company Home — universal landing for every signed-in user */}
                  <Route path="/home" element={<CompanyHome />} />
                  <Route path="/home/manage" element={<CompanyHomeManage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/behavioral-support" element={<BehavioralSupportDashboard />} />
                  <Route path="/behavioral-support/crisis-support" element={<BehavioralSupportCrisisSupport />} />
                  <Route path="/behavioral-support/escalations" element={<BehavioralSupportEscalations />} />
                  <Route path="/behavioral-support/support-plans" element={<BehavioralSupportPlans />} />
                  <Route path="/behavioral-support/follow-ups" element={<BehavioralSupportFollowUps />} />
                  <Route path="/behavioral-support/supervision-visibility" element={<BehavioralSupportSupervisionVisibility />} />
                  <Route path="/behavioral-support/evaluations" element={<BehavioralSupportEvaluations />} />
                  <Route path="/behavioral-support/resources" element={<OSBehavioralSupportResources />} />
                  {/* Case Manager training goes to the shared /academy destination
                      (matches TRAINING_AND_RESOURCES menu). CMTrainingAcademy remains
                      exported for legacy use but is no longer routed as a role page. */}
                  <Route path="/case-manager/training" element={<Navigate to="/academy" replace />} />
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
                  <Route path="/case-manager/resources" element={<OSCaseManagerResources />} />
                  {/* Legacy flat BCBA routes redirected into the new BcbaShell.
                      Nested routes are declared under /bcba below. */}
                  <Route path="/bcba/workspace"        element={<Navigate to="/bcba/home" replace />} />
                  <Route path="/bcba/clients"          element={<Navigate to="/bcba/caseload" replace />} />
                  <Route path="/bcba/authorizations"   element={<Navigate to="/bcba/progress-reports" replace />} />
                  <Route path="/bcba/scheduling"       element={<Navigate to="/bcba/home" replace />} />
                  <Route path="/bcba/resources"        element={<Navigate to="/resource-library" replace />} />
                  <Route path="/bcba/training-academy" element={<Navigate to="/bcba/academy" replace />} />
                  {/* RBT OS surfaces — role-gated. Employee views for RBTs/leads/trainers; admin views also allow oversight roles. */}
                  <Route path="/rbt" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director","training_admin","hr","hr_admin","operations_leadership","state_director","assistant_state_director"]}><OSRBT /></PermissionRoute>} />
                  <Route path="/rbt/my-day" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director","training_admin"]}><OSRBTMyDay /></PermissionRoute>} />
                  <Route path="/rbt/training-academy" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director","training_admin"]}><OSRBTTrainingAcademy /></PermissionRoute>} />
                  <Route path="/rbt/readiness" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","admin","super_admin","training_admin","bcba","clinical_director","hr","hr_admin"]}><OSRBTReadinessBoard /></PermissionRoute>} />
                  <Route path="/training/rbt-readiness" element={<PermissionRoute allowedRoles={["admin","super_admin","training_admin","bcba","clinical_director","hr","hr_admin","lead_rbt","trainer"]}><OSRBTReadinessBoard /></PermissionRoute>} />
                  <Route path="/training/rbt-admin" element={<PermissionRoute allowedRoles={["admin","super_admin","training_admin","hr","hr_admin","operations_leadership"]}><OSRBTAcademyAdmin /></PermissionRoute>} />
                  <Route path="/rbt/clients" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director"]}><OSRBTClients /></PermissionRoute>} />
                  <Route path="/rbt/schedule" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director","scheduling","scheduling_lead"]}><OSRBTSchedule /></PermissionRoute>} />
                  <Route path="/rbt/session-support" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director"]}><OSRBTSessionSupport /></PermissionRoute>} />
                  <Route path="/rbt/supervision" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director","qa","qa_lead"]}><OSRBTSupervision /></PermissionRoute>} />
                  <Route path="/rbt/messages" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director","hr","hr_admin"]}><OSRBTMessages /></PermissionRoute>} />
                  <Route path="/rbt/help" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director","hr","hr_admin","operations_leadership"]}><OSRBTHelp /></PermissionRoute>} />
                  <Route path="/rbt/resources" element={<PermissionRoute allowedRoles={["rbt","registered_behavior_technician","lead_rbt","trainer","trainer_rbt","floater_lead_rbt","admin","super_admin","bcba","clinical_director","training_admin","hr","hr_admin"]}><OSRBTResources /></PermissionRoute>} />
                  <Route path="/rbt/reports" element={<Navigate to="/reports?audience=rbt" replace />} />
                  <Route path="/command-center" element={<OSCommandCenter />} />
                  <Route path="/leads" element={<OSLeadsV2 />} />
                  <Route path="/leads/operations" element={<OSIntakeOperations />} />
                  <Route path="/leads/:id" element={<LeadIdRedirect />} />
                  <Route path="/intake" element={<OSIntakeWorkspace />} />
                  <Route path="/clients" element={<ClientsRouter />} />
                  <Route path="/intake/clients" element={<OSIntakeClients />} />
                  <Route path="/intake/leads" element={<Navigate to="/leads" replace />} />
                  <Route path="/intake/vob-decision" element={<Navigate to="/vob-decision-center" replace />} />
                  <Route path="/intake/authorizations" element={<OSIntakeAuthorizations />} />
                  <Route path="/authorizations" element={<PermissionRoute allowedRoles={["admin", "authorization_coordinator", "authorization_manager", "authorization_team", "authorizations", "state_director", "assistant_state_director", "exec", "executive", "coo", "ops_manager", "director_of_operations", "operations_manager", "operations_leadership", "qa", "qa_director", "qa_specialist", "bcba", "clinical_director"]}><AuthorizationsRouter /></PermissionRoute>} />
                  <Route path="/authorizations/handoff" element={<OSAuthHandoff />} />
                  <Route path="/scheduling" element={<OSScheduling />} />
                  <Route path="/scheduling/board" element={<OSSchedulingBoard />} />
                  <Route path="/scheduling/resources" element={<Navigate to="/resource-library" replace />} />
                  <Route path="/scheduling/rbts" element={<OSSchedulingRosterRBTs />} />
                  <Route path="/scheduling/bcbas" element={<OSSchedulingRosterBCBAs />} />
                  <Route path="/cases" element={<OSCaseManagement />} />
                  <Route path="/staff" element={<OSWorkforce />} />
                  <Route path="/recruiting" element={<Navigate to="/recruiting/workspace" replace />} />
                  {/* Canonical Credentialing route is defined further down (Super Admin / Credentialing Team). */}
                  <Route path="/employee-ops" element={<OSPlaceholder title="Employee Operations" description="Employee onboarding and operational workflows." icon={Briefcase} />} />
                  <Route path="/evaluations" element={<OSEvaluations />} />
                  <Route path="/training" element={<OSTraining />} />
                  {/* Canonical Welcome to Blossom route — renders inside the OS shell,
                      not the legacy AppLayout. */}
                  <Route path="/training/welcome" element={<OSWelcomeToBlossom />} />
                  <Route path="/training/manage" element={<Navigate to="/hr/training-center?nav=journeys" replace />} />
                  <Route path="/training/:id" element={<OSTrainingDetail />} />
                  <Route path="/billing" element={<Navigate to="/billing-finance" replace />} />
                  <Route path="/payroll" element={<Navigate to="/payroll/workspace" replace />} />
                  <Route path="/revenue" element={<Navigate to="/billing-finance" replace />} />
                  <Route path="/insurance" element={<Navigate to="/authorizations" replace />} />
                  {/* Canonical single Reports page (Authorizations Team + every role uses this). */}
                  <Route path="/reports" element={<ReportsHome />} />
                  <Route path="/reports/catalog" element={<Navigate to="/reports" replace />} />
                  <Route path="/reports/landing" element={<Navigate to="/reports" replace />} />
                  <Route path="/reports/bcba-performance" element={<ReportRoleGuard reportId="bcba-performance"><OSReportBcbaPerformance /></ReportRoleGuard>} />
                  {/* Legacy QA report routes redirect to the approved-six replacements. */}
                  <Route path="/reports/qa-supervision-pt" element={<Navigate to="/reports/bcba-supervision" replace />} />
                  <Route path="/reports/qa-auth-utilization" element={<Navigate to="/reports/authorization-utilization-hour-based" replace />} />
                  <Route path="/reports/qa-cancellation" element={<Navigate to="/reports/cancellation-command-center" replace />} />
                  <Route path="/reports/hr-payroll-command" element={<ReportRoleGuard reportId="hr-payroll-command"><HrPayrollCommandCenter /></ReportRoleGuard>} />
                  <Route path="/reports/hr-recruiting-pipeline" element={<Navigate to="/reports?report=hr-recruiting-pipeline" replace />} />
                  <Route path="/reports/hr-employee-compliance" element={<ReportRoleGuard reportId="hr-employee-compliance"><HrEmployeeComplianceDashboard /></ReportRoleGuard>} />
                  <Route path="/reports/hr-employee-onboarding" element={<ReportRoleGuard reportId="hr-employee-onboarding"><HrEmployeeOnboardingCommandCenter /></ReportRoleGuard>} />
                  <Route path="/reports/hr-bcba-productivity" element={<ReportRoleGuard reportId="hr-bcba-productivity"><HrBcbaProductivityDashboard /></ReportRoleGuard>} />
                 <Route path="/reports/bcba-productivity-report" element={<Navigate to="/reports/bcba-productivity-report-v3" replace />} />
                 <Route path="/reports/bcba-productivity-report-v3" element={<ReportRoleGuard reportId="bcba-productivity-report-v3"><BcbaProductivityReportV3 /></ReportRoleGuard>} />
                  <Route path="/reports/cancellation-command-center" element={<ReportRoleGuard reportId="cancellation-command-center"><CancellationCommandCenter /></ReportRoleGuard>} />
                  {/* Approved-Six aliases: Authorization Analysis + Hour-Based Utilization share the CR auth
                      utilization dashboard; Parent Training + BCBA Supervision share the QA supervision & PT dashboard. */}
                  <Route path="/reports/authorization-analysis" element={<ReportRoleGuard reportId="authorization-analysis"><QaAuthUtilizationDashboard /></ReportRoleGuard>} />
                  <Route path="/reports/authorization-utilization-hour-based" element={<ReportRoleGuard reportId="authorization-utilization-hour-based"><QaAuthUtilizationDashboard /></ReportRoleGuard>} />
                  <Route path="/reports/parent-training" element={<ReportRoleGuard reportId="parent-training"><QaSupervisionPtDashboard /></ReportRoleGuard>} />
                  <Route path="/reports/bcba-supervision" element={<ReportRoleGuard reportId="bcba-supervision"><QaSupervisionPtDashboard /></ReportRoleGuard>} />
                  {/* Legacy report routes → redirect to the approved replacements. */}
                  <Route path="/reports/intake-perf" element={<Navigate to="/reports" replace />} />
                  <Route path="/reports/intake-performance" element={<Navigate to="/reports" replace />} />
                  <Route path="/reports/progress-reports" element={<ReportRoleGuard reportId="progress-reports"><OSQAProgressReports /></ReportRoleGuard>} />
                  <Route path="/dashboards/ai/new" element={<AiDashboardNew />} />
                  <Route path="/dashboards/ai/:id" element={<AiDashboardView />} />
                  <Route path="/reports/ai/new" element={<Navigate to="/reports" replace />} />
                  <Route path="/reports/ai/:id" element={<AiReportRedirect />} />
                  <Route path="/reports/:reportId" element={<ReportDetail />} />
                  <Route path="/kpi" element={<OSKpiScorecards />} />
                  <Route path="/vob-decision-center" element={<OSVobDecisionCenter />} />
                  <Route path="/workflows" element={<OSPlaceholder title="Workflow Center" description="Operational automations and workflow management." icon={Workflow} />} />
                  <Route path="/sop" element={<Navigate to="/resource-library" replace />} />
                  <Route path="/resource-library" element={<OSResourceLibrary />} />
                  <Route path="/resource-library/role" element={<ResourceLibraryRole />} />
                  <Route path="/resource-library/department" element={<ResourceLibraryDepartment />} />
                  <Route path="/resource-library/training" element={<ResourceLibraryTraining />} />
                  <Route path="/resource-library/sops" element={<ResourceLibrarySops />} />
                  <Route path="/resource-library/videos" element={<ResourceLibraryVideos />} />
                  <Route path="/resource-library/intake" element={<ResourceLibraryIntake />} />
                  <Route path="/resources/intake" element={<Navigate to="/resource-library/intake" replace />} />
                  <Route path="/resource-library/recruiting" element={<ResourceLibraryRecruiting />} />
                  <Route path="/resources/recruiting" element={<Navigate to="/resource-library/recruiting" replace />} />
                  <Route path="/resource-library/authorizations" element={<ResourceLibraryAuthorizations />} />
                  <Route path="/resources/authorizations" element={<Navigate to="/resource-library/authorizations" replace />} />
                  <Route path="/resource-library/scheduling" element={<ResourceLibraryScheduling />} />
                  <Route path="/resources/scheduling" element={<Navigate to="/resource-library/scheduling" replace />} />
                  <Route path="/scheduling/resources" element={<Navigate to="/resource-library/scheduling" replace />} />
                  <Route path="/resource-library/staffing" element={<ResourceLibraryStaffing />} />
                  <Route path="/resources/staffing" element={<Navigate to="/resource-library/staffing" replace />} />
                  <Route path="/staffing/resources" element={<Navigate to="/resource-library/staffing" replace />} />
                  <Route path="/resource-library/credentialing" element={<ResourceLibraryCredentialing />} />
                  <Route path="/resources/credentialing" element={<Navigate to="/resource-library/credentialing" replace />} />
                  <Route path="/credentialing/resources" element={<Navigate to="/resource-library/credentialing" replace />} />
                  <Route path="/resource-library/resource/:id" element={<ResourceLibraryDetail />} />
                  <Route path="/resource-library/admin/qa" element={<ResourceLibraryAdminQA />} />
                  <Route path="/admin/blossom-ai" element={<OSBlossomAIManagement />} />
                  <Route path="/authorizations/resources" element={<Navigate to="/resource-library/authorizations" replace />} />
                  <Route path="/analytics" element={<Navigate to="/reports" replace />} />
                  <Route path="/tech-requests" element={<OSPlaceholder title="Tech Requests" description="Internal technology support requests." icon={LifeBuoy} />} />
                  <Route path="/internal-requests" element={<OSPlaceholder title="Internal Requests" description="Operational and internal forms and approvals." icon={Inbox} />} />
                  <Route path="/open-issues" element={<OSPlaceholder title="Open Issues" description="Operational blockers and issue tracking." icon={AlertTriangle} />} />
                  <Route path="/projects" element={<OSPlaceholder title="Project Tracking" description="Internal projects and initiatives." icon={KanbanSquare} />} />
                  <Route path="/ai/assistant" element={<OSAskBlossom />} />
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
                  <Route path="/user-management/admin" element={<Navigate to="/user-management" replace />} />
                  <Route path="/user-management/:employeeId" element={<EmployeeProfilePage />} />
                  <Route path="/admin/device-inventory" element={<AdminRoute><DeviceInventory /></AdminRoute>} />
                  {/* Phase 5 — People & Access */}
                  <Route path="/role-management" element={<AdminRoute><RoleManagementPage /></AdminRoute>} />
                  {/* Sprint 21 HR: Login Vault + NFC Badge live INSIDE User Management.
                      Standalone routes kept only as protected redirects for legacy links. */}
                  <Route path="/user-logins-vault" element={<Navigate to="/user-management" replace />} />
                  <Route path="/nfc-badges" element={<Navigate to="/user-management" replace />} />
                  <Route path="/device-inventory" element={<PermissionRoute allowedRoles={["admin", "hr", "hr_lead", "hr_admin", "hr_manager", "hr_team"]}><DeviceInventory /></PermissionRoute>} />
                  <Route path="/device-requests" element={<PermissionRoute allowedRoles={["admin", "hr", "hr_lead", "hr_admin", "hr_manager", "hr_team"]}><DeviceRequestsPage /></PermissionRoute>} />
                  {/* Phase 5 — HR */}
                  {/* Legacy HR admin routes — all redirect into the canonical OS HR surface. */}
                  <Route path="/hr/dashboard" element={<Navigate to="/hr-team" replace />} />
                  <Route path="/hr/employee-records" element={<Navigate to="/user-management" replace />} />
                  <Route path="/admin/hr/requests" element={<Navigate to="/hr/requests" replace />} />
                  <Route path="/hr/compliance-items" element={<Navigate to="/hr/compliance" replace />} />
                  <Route path="/hr/nfc-badge-support" element={<Navigate to="/user-management" replace />} />
                  {/* /hr/reports canonical PermissionRoute defined later; legacy admin variant retired. */}
                  <Route path="/admin/hr/reports" element={<Navigate to="/reports?category=hr" replace />} />
                  {/* Phase 5 — Credentialing */}
                  <Route path="/credentialing" element={<PermissionRoute allowedRoles={["admin", "credentialing_lead", "credentialing_team", "credentialing", "credentialing_coordinator"]}><CredentialingDashboardPage /></PermissionRoute>} />
                  <Route path="/credentialing/providers" element={<PermissionRoute allowedRoles={["admin", "credentialing_lead", "credentialing_team", "credentialing", "credentialing_coordinator"]}><ProviderCredentialingPage /></PermissionRoute>} />
                  <Route path="/credentialing/insurance" element={<PermissionRoute allowedRoles={["admin", "credentialing_lead", "credentialing_team", "credentialing", "credentialing_coordinator"]}><InsuranceCredentialingPage /></PermissionRoute>} />
                  <Route path="/credentialing/bcba" element={<PermissionRoute allowedRoles={["admin", "credentialing_lead", "credentialing_team", "credentialing", "credentialing_coordinator"]}><BCBACredentialsPage /></PermissionRoute>} />
                  <Route path="/credentialing/uncredentialed-bcbas" element={<PermissionRoute allowedRoles={["admin", "credentialing_lead", "credentialing_team", "credentialing", "credentialing_coordinator"]}><UncredentialedBCBAsPage /></PermissionRoute>} />
                  <Route path="/credentialing/expiring" element={<PermissionRoute allowedRoles={["admin", "credentialing_lead", "credentialing_team", "credentialing", "credentialing_coordinator"]}><ExpiringCredentialsPage /></PermissionRoute>} />
                  <Route path="/credentialing/reports" element={<Navigate to="/reports?category=credentialing" replace />} />
                  {/* Phase 6 — Core ABA Operations */}
                  <Route path="/state-operations" element={<PermissionRoute allowedRoles={[...OPERATIONS_AND_STATE_ROUTE_ROLES]}><StateOperationsPage /></PermissionRoute>} />
                  {/* Authorizations consolidation — these three were static phase-6 tables.
                      They now redirect into the live /authorizations workspace with the
                      appropriate stage pre-selected. */}
                  <Route path="/ops/authorizations" element={<Navigate to="/authorizations" replace />} />
                  <Route path="/ops/approved-authorizations" element={<Navigate to="/authorizations?stage=approved" replace />} />
                  <Route path="/ops/denials" element={<Navigate to="/authorizations?stage=denied" replace />} />
                 <Route path="/ops/scheduling" element={<Navigate to="/scheduling-workspace?bucket=coverage_risk" replace />} />
                  <Route path="/ops/staffing" element={<PermissionRoute allowedRoles={[...OPERATIONS_AND_STATE_ROUTE_ROLES, "staffing", "staffing_lead", "staffing_coordinator"]}><OSStaffingWorkspace /></PermissionRoute>} />
                  <Route path="/ops/no-oon-benefits" element={<AdminRoute><NoOONBenefitsPage /></AdminRoute>} />
                  <Route path="/ops/case-management" element={<AdminRoute><CaseManagementPhase6Page /></AdminRoute>} />
                  <Route path="/ops/qa" element={<PermissionRoute allowedRoles={["admin", "qa", "qa_director", "qa_specialist"]}><QAPhase6OpsPage /></PermissionRoute>} />
                  <Route path="/ops/family-staffing-preferences" element={<PermissionRoute allowedRoles={[...OPERATIONS_AND_STATE_ROUTE_ROLES, "staffing", "staffing_lead", "staffing_coordinator"]}><Navigate to="/ops/staffing?tab=preferences" replace /></PermissionRoute>} />
                  {/* Staffing reports always route through the unified Reports page */}
                  <Route path="/staffing/reports" element={<Navigate to="/reports" replace />} />
                  <Route path="/ops/staffing/reports" element={<Navigate to="/reports" replace />} />
                  <Route path="/ops/state-escalations" element={<PermissionRoute allowedRoles={[...OPERATIONS_AND_STATE_ROUTE_ROLES]}><StateEscalationsPage /></PermissionRoute>} />
                  <Route path="/ops/tasks" element={<PermissionRoute allowedRoles={[...OPERATIONS_AND_STATE_ROUTE_ROLES]}><OperationalTasksPage /></PermissionRoute>} />
                  {/* Phase 7 — Communications */}
                  <Route path="/communications/call-logs" element={<AdminRoute><CallLogsPage /></AdminRoute>} />
                  <Route path="/communications/phone-requests" element={<AdminRoute><PhoneRequestsTopPage /></AdminRoute>} />
                  <Route path="/communications/directory" element={<AdminRoute><DirectoryTopPage /></AdminRoute>} />
                  <Route path="/communications/user-activity" element={<AdminRoute><UserActivityLogPage /></AdminRoute>} />
                  <Route path="/communications/patient-activity" element={<AdminRoute><PatientActivityLogPage /></AdminRoute>} />
                  <Route path="/communications/activity-center" element={<AdminRoute><ActivityCenterPage /></AdminRoute>} />
                  <Route path="/work-queue" element={<PermissionRoute allowedRoles={[...OPERATIONS_LEADERSHIP_ROUTE_ROLES]}><WorkQueuePage /></PermissionRoute>} />
                  <Route path="/work-queue/escalations" element={<PermissionRoute allowedRoles={[...OPERATIONS_LEADERSHIP_ROUTE_ROLES]}><EscalationCenterPage /></PermissionRoute>} />
                  {/* Phase 7 — System Tools */}
                  <Route path="/system/workflow-inventory" element={<AdminRoute><WorkflowInventoryPage /></AdminRoute>} />
                  <Route path="/system/request-intake" element={<PermissionRoute allowedRoles={[...OPERATIONS_LEADERSHIP_ROUTE_ROLES]}><RequestIntakePage /></PermissionRoute>} />
                  <Route path="/system/issue-tracker" element={<AdminRoute><IssueTrackerPage /></AdminRoute>} />
                  {/* CentralReach Data Hub — unified entry point for every CentralReach import */}
                  <Route path="/system/centralreach" element={<AdminRoute><CentralReachHub /></AdminRoute>} />
                  <Route path="/system/centralreach-uploads" element={<Navigate to="/system/centralreach?tab=reporting" replace />} />
                  <Route path="/system/bcba-productivity-uploads" element={<Navigate to="/system/centralreach?tab=reporting" replace />} />
                  <Route path="/system/authorization-uploads" element={<Navigate to="/system/centralreach?tab=reporting" replace />} />
                  <Route path="/system/cancellation-uploads" element={<Navigate to="/system/centralreach?tab=reporting" replace />} />
                  {/* Legacy redirects for old QA report cards → canonical approved routes */}
                  <Route path="/reports/qa-supervision" element={<Navigate to="/reports/bcba-supervision" replace />} />
                  <Route path="/reports/qa-parent-training" element={<Navigate to="/reports/parent-training" replace />} />
                  <Route path="/reports/auth-utilization" element={<Navigate to="/reports/authorization-utilization-hour-based" replace />} />
                  <Route path="/system/integration-registry" element={<Navigate to="/admin/integrations" replace />} />
                  <Route path="/system/audit-log" element={<AdminRoute><AuditLogPage /></AdminRoute>} />
                  <Route path="/system/email-command-center" element={<AdminRoute><EmailCommandCenter /></AdminRoute>} />
                  <Route path="/notifications" element={<OSNotifications />} />
                  <Route path="/settings" element={<OSSettings />} />
                  <Route path="/state-management" element={<OSPlaceholder title="State Management" description="Multi-state operational setup and configuration." icon={MapPin} />} />
                  <Route path="/permissions" element={<AdminRoute><OSPermissions /></AdminRoute>} />
                  <Route path="/integrations" element={<Navigate to="/admin/integrations" replace />} />
                  <Route path="/phone" element={<PhoneSystemRoute><PhoneDashboard /></PhoneSystemRoute>} />
                  <Route path="/phone/lookup" element={<PhoneSystemRoute><PhoneLookup /></PhoneSystemRoute>} />
                  <Route path="/phone/calls" element={<PhoneSystemRoute><CTMCalls /></PhoneSystemRoute>} />
                  <Route path="/phone/shared" element={<PhoneSystemRoute><PhoneShared /></PhoneSystemRoute>} />
                  <Route path="/phone/directory" element={<PhoneSystemRoute><PhoneDirectory /></PhoneSystemRoute>} />
                  <Route path="/phone/requests" element={<PhoneSystemRoute><PhoneRequestList /></PhoneSystemRoute>} />
                  <Route path="/phone/requests/new" element={<PhoneSystemRoute><PhoneRequestNew /></PhoneSystemRoute>} />
                  <Route path="/phone/requests/:id" element={<PhoneSystemRoute><PhoneRequestDetail /></PhoneSystemRoute>} />
                  <Route path="/phone/admin" element={<PhoneSystemRoute><PhoneAdmin /></PhoneSystemRoute>} />
                  <Route path="/phone/ai-calls" element={<IntakeAiCallsRoute><PhoneAfterHoursAI /></IntakeAiCallsRoute>} />
                  <Route path="/phone/ai-calls/audit" element={<IntakeAiCallsRoute><PhoneAiCallAudit /></IntakeAiCallsRoute>} />
                  {/* Marketing Team — all /marketing/* routes wrap PermissionRoute with the shared MARKETING_ROLES model. */}
                  <Route path="/marketing-dashboard" element={<Navigate to="/marketing" replace />} />
                  <Route path="/marketing" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingDashboard /></PermissionRoute>} />
                  <Route path="/marketing/training" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingTraining /></PermissionRoute>} />
                  <Route path="/marketing/campaigns" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingCampaigns /></PermissionRoute>} />
                  <Route path="/marketing/lead-sources" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingLeadSources /></PermissionRoute>} />
                  <Route path="/marketing/lead-source-inbox" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><LeadSourceInbox /></PermissionRoute>} />
                  <Route path="/marketing/email-marketing" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><EmailMarketing /></PermissionRoute>} />
                  <Route path="/marketing/seo" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingSEO /></PermissionRoute>} />
                  <Route path="/marketing/web-analytics" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingWebAnalytics /></PermissionRoute>} />
                  <Route path="/marketing/call-tracking" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingCallTracking /></PermissionRoute>} />
                  {/* Relationships — Referral CRM is shared with Business Development. */}
                  <Route path="/marketing/referrals" element={<Navigate to="/marketing/referral-crm" replace />} />
                  <Route path="/marketing/referral-crm" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES_WITH_BD]}><ReferralCRM /></PermissionRoute>} />
                  <Route path="/marketing/recruiting" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingRecruiting /></PermissionRoute>} />
                  <Route path="/marketing/outreach" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingOutreach /></PermissionRoute>} />
                  <Route path="/marketing/reputation" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingReputation /></PermissionRoute>} />
                  <Route path="/marketing/attribution" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><MarketingAttribution /></PermissionRoute>} />
                  <Route path="/marketing/state-growth" element={<PermissionRoute allowedRoles={[...GROWTH_SNAPSHOT_ROLES]}><MarketingStateGrowth /></PermissionRoute>} />
                  {/* /marketing/reports is a redirect-only alias. The Marketing menu never links here — Reports lives at /reports. */}
                  <Route path="/marketing/reports" element={<Navigate to="/reports?category=marketing" replace />} />
                  {/* Phase 4 — Growth & Admissions */}
                  <Route path="/business-development" element={<PermissionRoute allowedRoles={[...BUSINESS_DEVELOPMENT_ROLES]}><BusinessDevelopmentDashboard /></PermissionRoute>} />
                  <Route path="/marketing/leadtrap" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><LeadTrap /></PermissionRoute>} />
                  <Route path="/marketing/facebook-ads" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><FacebookAds /></PermissionRoute>} />
                  <Route path="/marketing/google-ads" element={<PermissionRoute allowedRoles={[...MARKETING_ROLES]}><GoogleAds /></PermissionRoute>} />
                  <Route
                    path="/patient-journey"
                    element={
                      <PermissionRoute allowedRoles={[...GROWTH_SNAPSHOT_ROLES]}>
                        <PatientLifetimeJourney />
                      </PermissionRoute>
                    }
                  />
                  <Route path="/intake/dashboard" element={<PermissionRoute allowedRoles={["admin", "intake", "intake_coordinator", "intake_lead", "intake_team", "state_director", "assistant_state_director", "exec", "executive", "coo", "ops_manager", "director_of_operations", "operations_manager", "operations_leadership"]}><IntakeWorkspaceLanding /></PermissionRoute>} />
                  <Route path="/intake/lead-to-active" element={<Navigate to="/leads?view=pipeline" replace />} />
                  <Route path="/intake/referral-queue" element={<Navigate to="/intake/dashboard" replace />} />
                  <Route path="/intake/tasks" element={<IntakeTasks />} />
                  <Route path="/intake/benefits-cheat-sheets" element={<LeadBenefitsCheatSheets />} />
                  {/* --- Live MVP pages backing role menu items that don't have a
                       dedicated workspace yet. Real route, real shell, no
                       /coming-soon. Will be replaced with full workspaces in
                       future passes. --- */}
                  <Route path="/intake/missing-information"  element={<MissingInformation />} />
                  <Route path="/intake/parent-communication" element={<ParentCommunication />} />
                  <Route path="/intake/cr-packet-prep"       element={<PermissionRoute allowedRoles={["admin","super_admin","intake","intake_coordinator","intake_lead","intake_team","operations_leadership"]}><CentralReachPacketPrep /></PermissionRoute>} />
                  <Route path="/ops/expiring-authorizations" element={<OSShellPage><ExpiringAuthorizations /></OSShellPage>} />
                  <Route path="/ops/missing-docs"            element={<OSShellPage><MissingDocs /></OSShellPage>} />
                  <Route path="/ops/payer-requirements"      element={<OSShellPage><PayerRequirements /></OSShellPage>} />
                  <Route path="/ops/make-up-sessions"        element={<OSShellPage><MakeUpSessions /></OSShellPage>} />
                  {/* Pass 2 — legacy localStorage match queue retired.
                     Canonical match queue lives in the Staffing Workspace. */}
                  <Route path="/ops/rbt-match-queue"         element={<Navigate to="/ops/staffing?tab=match-queue" replace />} />
                  {/* Generic Training Academy routes — render inside the OS shell so
                      every non-admin role (including Intake Team) keeps the current
                      Blossom OS sidebar/topbar. State Director training stays at /training. */}
                  <Route path="/academy" element={<OSShellPage><TrainingAcademyHome /></OSShellPage>} />
                  <Route path="/academy/path/:slug" element={<OSShellPage><TrainingPathDetail /></OSShellPage>} />
                  <Route path="/academy/path/:slug/day/:dayId" element={<OSShellPage><TrainingPathDayDetail /></OSShellPage>} />
                  <Route path="/academy/path/:slug/module/:moduleId" element={<OSShellPage><TrainingModuleRuntime /></OSShellPage>} />
                  <Route path="/academy/path/:slug/module/:moduleId/lesson/:lessonId" element={<OSShellPage><TrainingLessonRuntime /></OSShellPage>} />
                  <Route path="/my-learning" element={<OSShellPage><MyLearning /></OSShellPage>} />
                  <Route path="/catalog" element={<OSShellPage><TrainingCatalog /></OSShellPage>} />
                  {/* Integrations pages render inside the OS shell only. They
                      used to live under AppLayout which produced a double
                      sidebar/header. Keep them here so the OS shell is the
                      single source of chrome. */}
                  <Route path="/admin/integrations" element={<PermissionRoute allowedRoles={["admin"]}><OSShellPage><Integrations /></OSShellPage></PermissionRoute>} />
                  <Route path="/admin/integration-ingest" element={<AdminRoute><OSShellPage><IntegrationIngestAdminPage /></OSShellPage></AdminRoute>} />
                </Route>
                {/* Legacy /os/* URLs redirect to root equivalents */}
                <Route path="/os" element={<Navigate to="/" replace />} />
                <Route path="/os/*" element={<OsPrefixRedirect />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/home-redirect" element={<Navigate to="/" replace />} />
                  <Route path="/welcome" element={<WelcomeHome />} />
                  <Route path="/academy/legacy" element={<OperationsAcademy />} />
                  <Route path="/announcements" element={<AnnouncementsFeed />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notification-preferences" element={<NotificationPreferences />} />
                  <Route path="/account/settings" element={<AccountSettings />} />
                  <Route path="/admin" element={<AdminRoute><AdminHub /></AdminRoute>} />
                  <Route path="/admin/access-requests" element={<AdminRoute><AccessRequests /></AdminRoute>} />
                  <Route path="/admin/login-vault" element={<Navigate to="/user-management" replace />} />
                  <Route path="/admin/onboarding-progress" element={<AdminRoute><AdminOnboardingProgress /></AdminRoute>} />
                  <Route path="/admin/journey-editor" element={<AdminRoute><JourneyEditor /></AdminRoute>} />
                  <Route path="/admin/identity" element={<AdminRoute><IdentityDashboard /></AdminRoute>} />
                  <Route path="/admin/automated-emails" element={<AdminRoute><AutomatedEmailsPage /></AdminRoute>} />
                  <Route path="/admin/ctm" element={<AdminRoute><CTMAdmin /></AdminRoute>} />
                  <Route path="/admin/rbt-lifecycle" element={<AdminRoute><RbtLifecycle /></AdminRoute>} />
                  <Route path="/admin/bcba-lifecycle" element={<AdminRoute><BcbaLifecycle /></AdminRoute>} />
                  <Route path="/admin/rbt" element={<AdminRoute><OSShellPage><RbtAdminHub /></OSShellPage></AdminRoute>} />
                  <Route path="/admin/rbt/journey" element={<AdminRoute><OSShellPage><RbtJourneyCommandCenter /></OSShellPage></AdminRoute>} />
                  <Route path="/admin/rbt/trainers" element={<AdminRoute><OSShellPage><RbtTrainerDashboard /></OSShellPage></AdminRoute>} />
                  <Route path="/admin/rbt/first-90" element={<AdminRoute><OSShellPage><RbtFirst90Dashboard /></OSShellPage></AdminRoute>} />
                  <Route path="/admin/rbt/workforce" element={<AdminRoute><OSShellPage><RbtWorkforceDashboard /></OSShellPage></AdminRoute>} />
                  <Route path="/admin/rbt-preboarding" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","hr","hr_admin","hr_lead","recruiting_lead","recruiting_coordinator","recruiting_assistant","training_admin"]}>
                      <RbtPreboardingConsole />
                    </PermissionRoute>
                  } />
                  <Route path="/admin/rbt-readiness" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","hr","hr_admin","hr_lead","recruiting_lead","recruiting_coordinator","recruiting_assistant","training_admin","scheduling_lead","scheduling_coordinator","operations_leadership","state_director"]}>
                      <RbtReadinessConsole />
                    </PermissionRoute>
                  } />
                  <Route path="/admin/rbt-training" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","training_admin","hr","hr_admin","hr_lead","operations_leadership"]}>
                      <OSShellPage><RbtTrainingConsole /></OSShellPage>
                    </PermissionRoute>
                  } />
                  <Route path="/admin/rbt-growth" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","training_admin","hr","hr_admin","hr_lead","operations_leadership","executive"]}>
                      <OSShellPage><RbtGrowthConsole /></OSShellPage>
                    </PermissionRoute>
                  } />
                  <Route path="/admin/rbt-support" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","hr","hr_admin","hr_lead","training_admin","operations_leadership"]}>
                      <OSShellPage><RbtSupportConsole /></OSShellPage>
                    </PermissionRoute>
                  } />
                  <Route path="/admin/centralreach-sync" element={<Navigate to="/system/centralreach?tab=workforce-clinical" replace />} />
                  <Route path="/admin/rbt/notifications" element={<AdminRoute><OSShellPage><RbtNotificationEngine /></OSShellPage></AdminRoute>} />
                  <Route path="/admin/bcba/notifications" element={<AdminRoute><OSShellPage><BcbaNotificationEngine /></OSShellPage></AdminRoute>} />
                  <Route path="/inbox" element={<OSShellPage><NotificationInbox /></OSShellPage>} />
                  <Route path="/rbt/app/settings/notifications" element={<RbtNotificationPreferences />} />
                  <Route path="/bcba/settings/notifications" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","bcba","clinical_director","operations_leadership","hr","hr_admin"]}>
                      <OSShellPage><BcbaNotificationPreferences /></OSShellPage>
                    </PermissionRoute>
                  } />
                  <Route path="/training/rbt/evaluate" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","training_admin","bcba","clinical_director","lead_rbt","trainer","hr","hr_admin","operations_leadership"]}>
                      <OSShellPage><RbtEvaluatorConsole /></OSShellPage>
                    </PermissionRoute>
                  } />
                  <Route path="/training/rbt/first-case" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","training_admin","bcba","clinical_director","lead_rbt","trainer","hr","hr_admin","operations_leadership"]}>
                      <OSShellPage><RbtFirstCaseConsole /></OSShellPage>
                    </PermissionRoute>
                  } />
                  <Route path="/training/rbt/journey" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","training_admin","bcba","clinical_director","lead_rbt","trainer","hr","hr_admin","operations_leadership"]}>
                      <OSShellPage><RbtJourneyConsole /></OSShellPage>
                    </PermissionRoute>
                  } />
                  {/* Mobile-first RBT app */}
                  <Route
                    path="/rbt/app"
                    element={
                      <PermissionRoute allowedRoles={["admin","hr","training_admin","rbt","registered_behavior_technician"]}>
                        <RbtAppShell />
                      </PermissionRoute>
                    }
                  >
                    <Route index element={<Navigate to="home" replace />} />
                    <Route path="home" element={<RbtHome />} />
                    <Route path="preboarding" element={<RbtPreboarding />} />
                    <Route path="readiness" element={<RbtReadiness />} />
                    <Route path="staffing" element={<RbtStaffing />} />
                    <Route path="schedule" element={<RbtSchedule />} />
                    <Route path="first-case" element={<RbtFirstCase />} />
                    <Route path="first-case/checkin" element={<FirstSessionCheckin />} />
                    <Route path="journey" element={<RbtJourney />} />
                    <Route path="journey/:instanceId" element={<RbtJourneyCheckpoint />} />
                    <Route path="learn" element={<RbtLearn />} />
                    <Route path="program" element={<RbtProgramPage />} />
                    <Route path="passport" element={<RbtPassportPage />} />
                    <Route path="support" element={<SupportHome />} />
                    <Route path="support/new" element={<SupportNew />} />
                    <Route path="support/urgent" element={<SupportUrgent />} />
                    <Route path="support/team" element={<SupportTeam />} />
                    <Route path="support/:ticketId" element={<SupportTicketDetail />} />
                    <Route path="me" element={<RbtMe />} />
                    <Route path="clients" element={<MyClients />} />
                    <Route path="hours" element={<RbtHours />} />
                    <Route path="supervision" element={<RbtSupervisionPage />} />
                    <Route path="credentials" element={<RbtCredentialsPage />} />
                    <Route path="performance" element={<RbtPerformancePage />} />
                    <Route path="growth" element={<RbtMyGrowth />} />
                    <Route path="growth/fellowship" element={<RbtFellowshipExplorer />} />
                  </Route>
                  {/* BCBA experience — responsive shell. Desktop uses OSShell
                      (bcba role menu, 7 items). Mobile uses a 5-tab bottom nav. */}
                  <Route
                    path="/bcba"
                    element={
                      <PermissionRoute allowedRoles={["admin","super_admin","bcba","clinical_director","operations_leadership","hr","hr_admin"]}>
                        <BcbaShell />
                      </PermissionRoute>
                    }
                  >
                    <Route index element={<Navigate to="home" replace />} />
                    <Route path="home"     element={<BcbaHome />} />
                    <Route path="caseload" element={<BcbaCaseload />} />
                    <Route path="rbts"     element={<BcbaMyRbts />} />
                    <Route path="clinical" element={<BcbaClinicalWork />} />
                    <Route path="learn"    element={<BcbaLearn />} />
                    <Route path="support"  element={<BcbaSupport />} />
                    <Route path="support-center" element={<BcbaSupportPageV2 />} />
                    <Route path="academy" element={<BcbaAcademyPage />} />
                    <Route path="me"       element={<BcbaMe />} />
                    <Route path="onboarding" element={<BcbaOnboardingPage />} />
                    <Route path="supervision" element={<BcbaSupervisionCenter />} />
                    <Route path="assessments" element={<BcbaAssessmentsPage />} />
                    <Route path="progress-reports" element={<BcbaProgressReportsPage />} />
                    <Route path="parent-training" element={<BcbaParentTrainingPage />} />
                    <Route path="productivity" element={<BcbaProductivityPage />} />
                    <Route path="fellowship" element={<BcbaFellowshipPage />} />
                    <Route path="copilot" element={<BcbaCopilotPage />} />
                  </Route>
                  <Route
                    path="/admin/bcba-onboarding"
                    element={
                      <PermissionRoute allowedRoles={["admin","super_admin","hr","hr_admin","clinical_director","operations_leadership"]}>
                        <OSShellPage><BcbaOnboardingConsole /></OSShellPage>
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/admin/bcba-supervision-config"
                    element={
                      <PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership"]}>
                        <OSShellPage><BcbaSupervisionConfigPage /></OSShellPage>
                      </PermissionRoute>
                    }
                  />
                  {/* Clinical Leadership Command Centers */}
                  <Route path="/clinical-leadership" element={
                    <PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}>
                      <OSShellPage><ClinicalLeadershipHome /></OSShellPage>
                    </PermissionRoute>
                  } />
                  <Route path="/clinical-leadership/workforce" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}><OSShellPage><BcbaWorkforcePage /></OSShellPage></PermissionRoute>} />
                  <Route path="/clinical-leadership/caseload-risk" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}><OSShellPage><CaseloadRiskPage /></OSShellPage></PermissionRoute>} />
                  <Route path="/clinical-leadership/rbt-supervision" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}><OSShellPage><ClinicalRbtSupervisionPage /></OSShellPage></PermissionRoute>} />
                  <Route path="/clinical-leadership/assessment-qa" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}><OSShellPage><AssessmentQaPage /></OSShellPage></PermissionRoute>} />
                  <Route path="/clinical-leadership/progress-auth" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}><OSShellPage><ProgressAuthPage /></OSShellPage></PermissionRoute>} />
                  <Route path="/clinical-leadership/parent-training" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}><OSShellPage><ParentTrainingUtilizationPage /></OSShellPage></PermissionRoute>} />
                  <Route path="/clinical-leadership/capacity" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}><OSShellPage><ClinicalCapacityPage /></OSShellPage></PermissionRoute>} />
                  <Route path="/clinical-leadership/support" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership","state_director","assistant_state_director"]}><OSShellPage><ClinicalSupportPage /></OSShellPage></PermissionRoute>} />
                  <Route path="/clinical-leadership/fellowship" element={<PermissionRoute allowedRoles={["admin","super_admin","clinical_director","operations_leadership","executive_leadership"]}><OSShellPage><FellowshipSupervisionPage /></OSShellPage></PermissionRoute>} />
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
                  {/* /coming-soon is removed from active navigation; bookmarks
                      and stale links fall back to the user's dashboard. */}
                  <Route path="/coming-soon" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/blossom/academy" element={<Navigate to="/academy" replace />} />
                  <Route path="/blossom/academy/:trackId" element={<TrackDetail />} />
                  <Route path="/blossom/departments" element={<Departments />} />
                  <Route path="/blossom/departments/:id" element={<DepartmentDetail />} />
                  <Route path="/blossom/locations" element={<BlossomLocations />} />
                  <Route path="/blossom/locations/:id" element={<LocationDetail />} />
                  <Route path="/blossom/users" element={<Navigate to="/user-management" replace />} />
                  <Route path="/blossom/reports" element={<Navigate to="/reports" replace />} />
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
                  <Route path="/intelligence/reports" element={<Navigate to="/reports" replace />} />
                  <Route path="/intelligence/assistant" element={<PermissionRoute allowedRoles={ANALYTICS_ROLES}><AssistantAnalytics /></PermissionRoute>} />
                  <Route path="/leadership-dashboard" element={<PermissionRoute permission="dashboard.view"><LeadershipDashboard /></PermissionRoute>} />
                  {/* Canonical BCBA performance report lives under /reports/bcba-performance. All legacy dashboard URLs redirect there. */}
                  <Route path="/bcba-performance-dashboard" element={<Navigate to="/reports/bcba-performance" replace />} />
                  <Route path="/bcba-performance-dashboard/logic" element={<Navigate to="/reports/bcba-performance?view=logic" replace />} />
                  <Route path="/bcba-performance-dashboard/insights" element={<Navigate to="/reports/bcba-performance?view=insights" replace />} />
                  <Route path="/bcba-performance-dashboard/revenue-leaks" element={<Navigate to="/reports/bcba-performance?view=revenue-leaks" replace />} />
                  <Route path="/ceo-dashboard-v2" element={<Navigate to="/reports/bcba-performance" replace />} />
                  <Route path="/ceo-dashboard-v2/logic" element={<Navigate to="/reports/bcba-performance?view=logic" replace />} />
                  <Route path="/ceo-dashboard-v2/insights" element={<Navigate to="/reports/bcba-performance?view=insights" replace />} />
                  <Route path="/ceo-dashboard-v2/revenue-leaks" element={<Navigate to="/reports/bcba-performance?view=revenue-leaks" replace />} />
                  {LegacyDashboardRedirects}
                  <Route path="/clinic-dashboard" element={<PermissionRoute permission="dashboard.view"><ClinicDashboard /></PermissionRoute>} />
                  <Route path="/leadership-dashboard/clinics/:clinicId" element={<PermissionRoute permission="dashboard.view"><LeadershipDashboard /></PermissionRoute>} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/staffing/:id" element={<RBTDetail />} />
                  <Route path="/ops/staffing/rbt/:id" element={<RBTDetail />} />
                  <Route path="/qa" element={<Navigate to="/qa-team" replace />} />
                  <Route path="/qa/:id" element={<QADetail />} />
                  <Route path="/documents" element={<Documents />} />
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
                  <Route path="/admin/mapsly" element={<PermissionRoute allowedRoles={["admin"]}><MapslyHub /></PermissionRoute>} />
                  <Route path="/mileage" element={<MileageCenter />} />
                  <Route path="/bd/territories" element={<BDTerritories />} />
                  <Route path="/recruiting/map" element={<RecruitingMap />} />
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
                  <Route path="/hr/directory" element={<Navigate to="/user-management" replace />} />
                  <Route path="/hr/employees/:id" element={<PermissionRoute permission="hr.employees.view"><EmployeeProfile /></PermissionRoute>} />
                  <Route path="/hr/org-chart" element={<PermissionRoute><OrgChart /></PermissionRoute>} />
                  <Route path="/hr/org-chart/manage" element={<PermissionRoute permission="hr.employees.edit"><OrgChartManage /></PermissionRoute>} />
                  {/* Blossom Identity System — canonical top-level /org-chart route
                      is mounted above with role-guarded <OrgChartPage />. The old
                      redirect to /hr/org-chart was removed so Executive Leadership
                      lands on the unified org chart. HR-specific paths remain at
                      /hr/org-chart and /hr/org-chart/manage. */}
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
                  {/* Legacy HR Assistant is not part of the HR workflow — redirect back to the HR workspace. */}
                  <Route path="/hr/assistant" element={<Navigate to="/hr/workspace" replace />} />
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
                 <Route path="/hr/reports" element={<Navigate to="/reports?category=hr" replace />} />
                  <Route path="/hr/settings" element={<PermissionRoute permission="hr.settings.manage"><HRSettings /></PermissionRoute>} />
                  <Route path="/hr/notifications" element={<PermissionRoute permission="hr.settings.manage"><NotificationSettings /></PermissionRoute>} />
                  <Route path="/enterprise/*" element={<NotFound />} />
                </Route>
                <Route path="*" element={<NotFound />} />
                </Routes>
                </PhoneSystemProvider>
              </JourneyOverridesProvider>
            </ClientsProvider>
            </LeadDrawerProvider>
          </LeadsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
