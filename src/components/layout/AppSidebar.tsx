import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Calendar,
  UserPlus, ClipboardCheck, Building2, Phone, FileText,
  CheckSquare, BarChart3, Zap, UsersRound, Settings, Workflow, Briefcase
} from "lucide-react";
import logo from "@/assets/logo.svg";
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

export function AppSidebar() {
  const location = useLocation();
  const { hasPerm } = useAuth();

  const sections = navSections
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => hasPerm(item.perm)),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <aside className="w-60 h-screen sticky top-0 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <img src={logo} alt="Blossom ABA" className="h-6" />
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
