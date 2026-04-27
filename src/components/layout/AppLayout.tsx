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
  "/hr/training-dashboard": "Training Dashboard",
  "/team": "Team",
  "/settings": "Settings",
};

export function AppLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Blossom ABA";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <ForcePasswordChange />
    </div>
  );
}
