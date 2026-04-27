import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useLocation } from "react-router-dom";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/leads": "Leads",
  "/intake-dashboard": "Intake Dashboard",
  "/authorizations-dashboard": "Authorizations Dashboard",
  "/scheduling-dashboard": "Scheduling Dashboard",
  "/staffing-dashboard": "Staffing Dashboard",
  "/clinic-dashboard": "Clinic Dashboard",
  "/qa-dashboard": "QA Dashboard",
  "/clients": "Clients",
  "/authorizations": "Authorizations",
  "/scheduling": "Scheduling",
  "/staffing": "Staffing",
  "/qa": "QA Reviews",
  "/clinics": "Clinics",
  "/phone-calls": "Phone Calls",
  "/documents": "Documents",
  "/tasks": "Tasks",
  "/reports": "Reports",
  "/automations": "Automations",
  "/training": "Training Hub",
  "/resources": "Resource Hub",
  "/admin/training-dashboard": "Training Dashboard",
  "/hr/training-dashboard": "Training Dashboard",
  "/team": "Team",
  "/settings": "Settings",
};

export function AppLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Blossom ABA";

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background md:flex-row">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} />
        <main className="mobile-page flex-1 overflow-auto px-3 pb-28 pt-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <ForcePasswordChange />
    </div>
  );
}
