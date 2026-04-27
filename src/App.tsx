import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
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
import LeadershipDashboard from "./pages/LeadershipDashboard";
import BenefitsFinancial from "./pages/BenefitsFinancial";
import ClientOnboarding from "./pages/ClientOnboarding";

const queryClient = new QueryClient();

import { LeadsProvider } from "@/contexts/LeadsContext";
import { ClientsProvider } from "@/contexts/ClientsContext";

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
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/leadership-dashboard" element={<PermissionRoute permission="dashboard.view"><LeadershipDashboard /></PermissionRoute>} />
                  <Route path="/leadership-dashboard/clinics/:clinicId" element={<PermissionRoute permission="dashboard.view"><LeadershipDashboard /></PermissionRoute>} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/benefits-financial" element={<BenefitsFinancial />} />
                  <Route path="/client-onboarding" element={<ClientOnboarding />} />
                  <Route path="/leads/:id" element={<LeadDetail />} />
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
                  <Route path="/team" element={<PermissionRoute permission="team.view"><Team /></PermissionRoute>} />
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
                  <Route path="/hr/training" element={<PermissionRoute permission="hr.training.view"><Training /></PermissionRoute>} />
                  <Route path="/hr/payroll" element={<PermissionRoute permission="hr.payroll.runs.view"><Payroll /></PermissionRoute>} />
                  <Route path="/hr/announcements" element={<PermissionRoute permission="hr.announcements.view"><Announcements /></PermissionRoute>} />
                  <Route path="/hr/resources" element={<PermissionRoute permission="hr.resources.view"><ResourceHub /></PermissionRoute>} />
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
