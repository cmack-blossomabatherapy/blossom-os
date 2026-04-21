import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Calendar,
  UserPlus, ClipboardCheck, Building2, Phone, FileText,
  CheckSquare, BarChart3, Zap, UsersRound, Settings, Workflow, Briefcase,
  HeartHandshake, IdCard, Network, GraduationCap, Clock, Timer, FileSpreadsheet,
  Star, Wallet, Megaphone, BookOpen,
} from "lucide-react";
import logo from "@/assets/blossom-logo-white.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  perm: string;
}

const navSections: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/", perm: "dashboard.view" },
    ],
  },
  {
    title: "Pipeline",
    items: [
      { label: "Leads", icon: Users, path: "/leads", perm: "leads.view" },
      { label: "Clients", icon: UserCheck, path: "/clients", perm: "clients.view" },
      { label: "Authorizations", icon: ShieldCheck, path: "/authorizations", perm: "auth.view" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Operations", icon: Workflow, path: "/operations", perm: "operations.view" },
      { label: "Scheduling", icon: Calendar, path: "/scheduling", perm: "scheduling.view" },
      { label: "Recruiting", icon: Briefcase, path: "/recruiting", perm: "recruiting.view" },
      { label: "Staffing", icon: UserPlus, path: "/staffing", perm: "staffing.view" },
      { label: "QA", icon: ClipboardCheck, path: "/qa", perm: "qa.view" },
      { label: "Clinics", icon: Building2, path: "/clinics", perm: "clinics.view" },
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
      { label: "Reports", icon: BarChart3, path: "/reports", perm: "reports.view" },
      { label: "Automations", icon: Zap, path: "/automations", perm: "automations.view" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Team", icon: UsersRound, path: "/team", perm: "team.view" },
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
    { label: "Training",     icon: GraduationCap,  path: "/hr/training",  perm: "hr.training.view" },
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
  const { hasPerm } = useAuth();

  const allSections = [...navSections];
  // Insert HR Suite before Admin so it sits with the operations modules
  const adminIndex = allSections.findIndex((s) => s.title === "Admin");
  if (adminIndex >= 0) allSections.splice(adminIndex, 0, hrSection);
  else allSections.push(hrSection);

  const sections = allSections
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => hasPerm(item.perm)),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <aside className="w-60 h-screen sticky top-0 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center px-4 border-b border-sidebar-border bg-primary">
        <img src={logo} alt="Blossom ABA Therapy" className="h-9 w-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    cn("nav-item", isActive ? "nav-item-active" : "nav-item-inactive")
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
