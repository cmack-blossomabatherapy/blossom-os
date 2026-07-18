import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useLocation } from "react-router-dom";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { MobileBottomNav } from "./MobileBottomNav";
import { OnboardingGate } from "@/components/auth/OnboardingGate";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/academy": "Blossom Academy",
  "/my-learning": "My Learning",
  "/catalog": "Training Catalog",
  "/announcements": "Announcements",
  "/profile": "Profile",
  "/admin": "Admin Hub",
  "/leads": "Leads",
  "/clinic-dashboard": "Clinic Dashboard",
  "/qa-workspace": "QA Dashboard",
  "/billing-finance": "Finance Dashboard",
  "/recruiting/workspace": "Recruiting Dashboard",
  "/hr": "HR Dashboard",
  "/clients": "Clients",
  "/authorizations": "Authorizations",
  "/scheduling": "Scheduling",
  "/staffing": "Staffing",
  "/qa": "QA Reviews",
  "/clinics": "Clinics",
  "/phone": "Phone Calls",
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
  const title = pageTitles[location.pathname] || "";
  const mainRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuFloating, setMobileMenuFloating] = useState(false);
  const { user, loading } = useAuth();
  const osRole = useOSRoleSafe();

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
    setMobileMenuFloating(false);
  }, [location.pathname]);

  // RBTs live inside /rbt/app/* — never leave them stranded on the generic
  // home/root routes where they'd see the non-RBT menu and layout.
  const isRbtRoot =
    !loading &&
    user &&
    osRole?.role === "rbt" &&
    (location.pathname === "/" || location.pathname === "/home");
  if (isRbtRoot) return <Navigate to="/rbt/app/home" replace />;

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background md:h-screen md:overflow-hidden md:flex-row">
      <AppSidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} />
      <div className="flex min-w-0 flex-1 flex-col md:min-h-0">
        <TopBar title={title} onOpenMobileMenu={() => setMobileMenuOpen(true)} mobileMenuFloating={mobileMenuFloating} />
        <main
          ref={mainRef}
          className="mobile-page flex-1 overflow-auto px-3 pt-3 pb-[calc(10rem+env(safe-area-inset-bottom))] md:min-h-0 md:p-6 md:pb-10"
          onScroll={(event) => setMobileMenuFloating(event.currentTarget.scrollTop > 48)}
        >
          <OnboardingGate>
            <Outlet />
          </OnboardingGate>
        </main>
      </div>
      <ForcePasswordChange />
      <MobileBottomNav />
    </div>
  );
}
