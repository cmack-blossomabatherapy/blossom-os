import { useState } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuFloating, setMobileMenuFloating] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background md:flex-row">
      <AppSidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} onOpenMobileMenu={() => setMobileMenuOpen(true)} mobileMenuFloating={mobileMenuFloating} />
        <main
          className="mobile-page flex-1 overflow-auto px-3 pb-6 pt-3 md:p-6"
          onScroll={(event) => setMobileMenuFloating(event.currentTarget.scrollTop > 48)}
        >
          <Outlet />
        </main>
      </div>
      <ForcePasswordChange />
    </div>
  );
}
