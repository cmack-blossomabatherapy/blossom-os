import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Calendar,
  UserPlus, ClipboardCheck, Building2, Phone, FileText,
  CheckSquare, BarChart3, Zap, UsersRound, Settings, Workflow, Briefcase,
  HeartHandshake, IdCard, Network, GraduationCap, Clock, Timer, FileSpreadsheet,
  Star, Wallet, Megaphone, BookOpen, ChevronDown,
} from "lucide-react";
import logo from "@/assets/blossom-logo-full.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { type DashboardKey } from "@/data/leadershipDashboard";

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

export function AppSidebar() {
  const location = useLocation();
  const { hasPerm, isAdmin } = useAuth();
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(["Dashboards", "Operate", "Pipeline", "Records", "Intelligence", "HR Suite", "Admin"]));

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

  return (
    <aside className="w-60 h-screen sticky top-0 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center px-4 border-b border-sidebar-border bg-sidebar">
        <img src={logo} alt="Blossom ABA Therapy" className="max-h-14 w-full object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {sections.map((section, i) => {
          const activeInSection = section.items.some((item) => isItemActive(item.path));
          const sectionOpen = !section.title || activeInSection || openSections.has(section.title);
          return (
          <div key={section.title ?? i}>
            {section.title && (
              <button
                type="button"
                onClick={() => toggleSection(section.title!)}
                className="mb-1.5 flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                aria-expanded={sectionOpen}
              >
                <span>{section.title}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", !sectionOpen && "-rotate-90")} />
              </button>
            )}
            {sectionOpen && <div className="space-y-0.5">
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
  );
}
