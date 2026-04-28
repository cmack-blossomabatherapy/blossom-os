import { useEffect, useRef, useState } from "react";
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
  "/finance-dashboard": "Finance Dashboard",
  "/recruiting-dashboard": "Recruiting Dashboard",
  "/hr": "HR Dashboard",
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
  const mainRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuFloating, setMobileMenuFloating] = useState(false);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
    setMobileMenuFloating(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background md:h-screen md:overflow-hidden md:flex-row">
      <AppSidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} />
      <div className="flex min-w-0 flex-1 flex-col md:min-h-0">
        <TopBar title={title} onOpenMobileMenu={() => setMobileMenuOpen(true)} mobileMenuFloating={mobileMenuFloating} />
        <main
          ref={mainRef}
          className="mobile-page flex-1 overflow-auto px-3 pb-6 pt-3 md:min-h-0 md:p-6"
          onScroll={(event) => setMobileMenuFloating(event.currentTarget.scrollTop > 48)}
        >
          <Outlet />
        </main>
      </div>
      <ForcePasswordChange />
    </div>
  );
}
