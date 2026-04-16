import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/authorizations" element={<Authorizations />} />
            <Route path="/authorizations/:id" element={<AuthDetail />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/staffing" element={<Staffing />} />
            <Route path="/staffing/:id" element={<RBTDetail />} />
            <Route path="/qa" element={<QA />} />
            <Route path="/qa/:id" element={<QADetail />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/phone-calls" element={<PhoneCalls />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
