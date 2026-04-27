import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Calendar,
  UserPlus, ClipboardCheck, Building2, Phone, FileText,
  CheckSquare, BarChart3, Zap, UsersRound, Settings, Workflow, Briefcase,
  HeartHandshake, IdCard, Network, GraduationCap, Clock, Timer, FileSpreadsheet,
  Star, Wallet, Megaphone, BookOpen, ChevronDown, X,
} from "lucide-react";
import logo from "@/assets/blossom-logo-full.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { type DashboardKey } from "@/data/leadershipDashboard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  perm: string;
  superAdminOnly?: boolean;
}

const dashboardIcons: Record<DashboardKey, typeof LayoutDashboard> = {
  ceo: BarChart3,
  intake: Users,
  authorizations: ShieldCheck,
  scheduling: Calendar,
  staffing: UserPlus,
  clinic: Building2,
  qa: ClipboardCheck,
  finance: Wallet,
  hr: HeartHandshake,
  recruiting: Briefcase,
};

const superAdminDashboardSection: { title: string; items: NavItem[] } = {
  title: "Dashboards",
  items: [
    { label: "CEO & Leadership", icon: BarChart3, path: "/leadership-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Intake Dashboard", icon: Users, path: "/intake-dashboard", perm: "leads.view", superAdminOnly: true },
    { label: "Authorizations Dashboard", icon: ShieldCheck, path: "/authorizations-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Scheduling Dashboard", icon: Calendar, path: "/scheduling-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Staffing Dashboard", icon: UserPlus, path: "/staffing-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Clinic Dashboard", icon: Building2, path: "/clinic-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "QA Dashboard", icon: ClipboardCheck, path: "/qa-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "Finance Dashboard", icon: Wallet, path: "/leadership-dashboard?dashboard=finance", perm: "dashboard.view", superAdminOnly: true },
    { label: "HR Dashboard", icon: HeartHandshake, path: "/leadership-dashboard?dashboard=hr", perm: "dashboard.view", superAdminOnly: true },
    { label: "Recruiting Dashboard", icon: Briefcase, path: "/leadership-dashboard?dashboard=recruiting", perm: "dashboard.view", superAdminOnly: true },
  ],
};

const navSections: { title?: string; items: NavItem[] }[] = [
  {
    title: "Operate",
    items: [
      { label: "Clients", icon: UserCheck, path: "/clients", perm: "clients.view" },
      { label: "Intake", icon: Users, path: "/leads?view=queue", perm: "leads.view" },
      { label: "Authorizations", icon: ShieldCheck, path: "/authorizations", perm: "auth.view" },
      { label: "Scheduling", icon: Calendar, path: "/scheduling", perm: "scheduling.view" },
      { label: "Staffing", icon: UserPlus, path: "/staffing", perm: "staffing.view" },
      { label: "QA & Compliance", icon: ClipboardCheck, path: "/qa", perm: "qa.view" },
      { label: "Recruiting", icon: Briefcase, path: "/recruiting", perm: "recruiting.view" },
      { label: "Clinics", icon: Building2, path: "/clinics", perm: "clinics.view" },
    ],
  },
  {
    title: "Pipeline",
    items: [
      { label: "Pipeline", icon: Workflow, path: "/pipeline", perm: "clients.view" },
    ],
  },
  {
    title: "Records",
    items: [
      { label: "Phone Calls", icon: Phone, path: "/phone-calls", perm: "phone.view" },
      { label: "Documents", icon: FileText, path: "/documents", perm: "documents.view" },
      { label: "Tasks", icon: CheckSquare, path: "/tasks", perm: "tasks.view" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Training", icon: GraduationCap, path: "/training", perm: "" },
      { label: "Resource Hub", icon: BookOpen, path: "/resources", perm: "" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Team", icon: UsersRound, path: "/team", perm: "team.view" },
      { label: "Training Dashboard", icon: GraduationCap, path: "/admin/training-dashboard", perm: "hr.training.view" },
      { label: "Reports", icon: BarChart3, path: "/reports", perm: "reports.view" },
      { label: "Automations", icon: Zap, path: "/automations", perm: "automations.view" },
      { label: "Settings", icon: Settings, path: "/settings", perm: "settings.view" },
    ],
  },
];

const hrSection: { title: string; items: NavItem[] } = {
  title: "HR Suite",
  items: [
    { label: "HR Dashboard", icon: HeartHandshake, path: "/hr", perm: "hr.view" },
    { label: "Employees",    icon: IdCard,         path: "/hr/directory", perm: "hr.employees.view" },
    { label: "Org Chart",    icon: Network,        path: "/hr/org-chart", perm: "hr.employees.view" },
    { label: "Onboarding",   icon: GraduationCap,  path: "/hr/onboarding", perm: "hr.onboarding.manage" },
    { label: "Reviews",      icon: Star,           path: "/hr/reviews",   perm: "hr.reviews.view" },
    { label: "Training Admin", icon: GraduationCap, path: "/hr/training", perm: "hr.training.view" },
    { label: "Time Clock",   icon: Timer,          path: "/hr/time-clock", perm: "hr.timeclock.view" },
    { label: "Hours",        icon: FileSpreadsheet,path: "/hr/hours",      perm: "hr.hours.view" },
    { label: "Payroll",      icon: Wallet,         path: "/hr/payroll",   perm: "hr.payroll.runs.view" },
    { label: "Announcements",icon: Megaphone,      path: "/hr/announcements", perm: "hr.announcements.view" },
    { label: "Resource Hub", icon: BookOpen,       path: "/hr/resources", perm: "hr.resources.view" },
    { label: "HR Reports",   icon: BarChart3,      path: "/hr/reports",   perm: "hr.reports.view" },
    { label: "HR Settings",  icon: Settings,       path: "/hr/settings",  perm: "hr.settings.manage" },
  ],
};

export function AppSidebar({ mobileOpen = false, onMobileOpenChange }: { mobileOpen?: boolean; onMobileOpenChange?: (open: boolean) => void }) {
  const location = useLocation();
  const { hasPerm, isAdmin } = useAuth();
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(["Dashboards", "Operate", "Pipeline", "Records", "Intelligence", "HR Suite", "Admin"]));
  const [mobileOpenSections, setMobileOpenSections] = useState<Set<string>>(new Set());

  const allSections = isAdmin ? [superAdminDashboardSection, ...navSections] : [...navSections];
  // Insert HR Suite before Admin so it sits with the operations modules
  const adminIndex = allSections.findIndex((s) => s.title === "Admin");
  if (adminIndex >= 0) allSections.splice(adminIndex, 0, hrSection);
  else allSections.push(hrSection);

  const sections = allSections
    .map((s) => ({
      ...s,
        items: s.items.filter((item) => (!item.superAdminOnly || isAdmin) && (!item.perm || hasPerm(item.perm))),
    }))
    .filter((s) => s.items.length > 0);

  const isItemActive = (path: string) => {
    if (path.startsWith("/leadership-dashboard?")) {
      const itemDashboard = new URLSearchParams(path.split("?")[1]).get("dashboard");
      const currentDashboard = new URLSearchParams(location.search).get("dashboard");
      return location.pathname === "/leadership-dashboard" && itemDashboard === currentDashboard;
    }
    if (path.startsWith("/leads?")) {
      return location.pathname === "/leads";
    }
    if (path.startsWith("/authorizations?")) {
      const itemType = new URLSearchParams(path.split("?")[1]).get("type");
      const currentType = new URLSearchParams(location.search).get("type") ?? "initial";
      return location.pathname.startsWith("/authorizations") && itemType === currentType;
    }
    if (path === "/assessments") {
      return location.pathname.startsWith("/assessments");
    }
    return location.pathname === path || `${location.pathname}${location.search}` === path;
  };
  const toggleSection = (title: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const activeSectionTitles = new Set(sections.filter((section) => section.title && section.items.some((item) => isItemActive(item.path))).map((section) => section.title!));
  const toggleMobileSection = (title: string) => setMobileOpenSections((current) => { const next = new Set(current); if (next.has(title)) next.delete(title); else next.add(title); return next; });

  useEffect(() => {
    if (mobileOpen) setMobileOpenSections(activeSectionTitles);
  }, [location.pathname, location.search, mobileOpen]);

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="right" className="mobile-menu-sheet w-[82vw] max-w-[320px] overflow-y-auto border-l border-border bg-background p-0 shadow-2xl md:hidden">
          <div className="sticky top-0 z-10 border-b border-sidebar-border bg-sidebar p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <img src={logo} alt="Blossom ABA Therapy" className="h-10 w-auto object-contain" />
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => onMobileOpenChange?.(false)} aria-label="Close navigation menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="mt-3 text-[11px] font-medium text-sidebar-foreground/80">Blossom OS navigation</p>
          </div>
          <nav className="px-4 py-3" aria-label="Mobile navigation">
            {sections.map((section, i) => {
              const title = section.title ?? `Section ${i + 1}`;
              const activeInSection = section.items.some((item) => isItemActive(item.path));
              const sectionOpen = mobileOpenSections.has(title);
              return (
              <div key={title} className="border-b border-border/70 py-3 last:border-b-0">
                <button type="button" onClick={() => toggleMobileSection(title)} className="flex min-h-10 w-full items-center justify-between rounded-lg px-2 text-left transition-colors hover:bg-secondary" aria-expanded={sectionOpen}>
                  <span className={cn("text-[11px] font-semibold uppercase tracking-wider", activeInSection ? "text-primary" : "text-muted-foreground")}>{section.title}</span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !sectionOpen && "-rotate-90")} />
                </button>
                {sectionOpen && <div className="space-y-0.5 pt-1">
                  {section.items.map((item) => {
                    const active = isItemActive(item.path);
                    return (
                      <NavLink key={item.path} to={item.path} end={item.path === "/"} onClick={() => onMobileOpenChange?.(false)} className={cn("mobile-menu-item", active && "mobile-menu-item-active")}>
                        <span className="mobile-menu-icon"><item.icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>}
              </div>
            );})}
          </nav>
        </SheetContent>
      </Sheet>
      <aside className="hidden shrink-0 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
      {/* Logo */}
      <div className="hidden h-20 items-center justify-center border-b border-sidebar-border bg-sidebar px-4 md:flex">
        <img src={logo} alt="Blossom ABA Therapy" className="max-h-14 w-full object-contain" />
      </div>


      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {sections.map((section, i) => {
          const activeInSection = section.items.some((item) => isItemActive(item.path));
          const sectionOpen = !section.title || activeInSection || openSections.has(section.title);
          return (
          <div key={section.title ?? i}>
            {section.title && (
              <button
                type="button"
                onClick={() => toggleSection(section.title!)}
                className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:mb-1.5 md:px-3 md:text-[11px]"
                aria-expanded={sectionOpen}
              >
                <span>{section.title}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", !sectionOpen && "-rotate-90")} />
              </button>
            )}
            {sectionOpen && <div className="grid grid-cols-3 gap-1 md:block md:space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) => {
                    const queryAwareActive = item.path.includes("?") ? isItemActive(item.path) : isActive || isItemActive(item.path);
                    return cn("nav-item", queryAwareActive ? "nav-item-active" : "nav-item-inactive");
                  }}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>}
          </div>
        );
        })}
      </nav>
      </aside>
    </>
  );
}
