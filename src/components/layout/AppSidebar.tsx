import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Calendar,
  UserPlus, ClipboardCheck, Building2, Phone, FileText,
  CheckSquare, BarChart3, Zap, UsersRound, Settings
} from "lucide-react";
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

const navSections = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ],
  },
  {
    title: "Pipeline",
    items: [
      { label: "Leads", icon: Users, path: "/leads" },
      { label: "Clients", icon: UserCheck, path: "/clients" },
      { label: "Authorizations", icon: ShieldCheck, path: "/authorizations" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Scheduling", icon: Calendar, path: "/scheduling" },
      { label: "Staffing", icon: UserPlus, path: "/staffing" },
      { label: "QA", icon: ClipboardCheck, path: "/qa" },
      { label: "Clinics", icon: Building2, path: "/clinics" },
    ],
  },
  {
    title: "Records",
    items: [
      { label: "Phone Calls", icon: Phone, path: "/phone-calls" },
      { label: "Documents", icon: FileText, path: "/documents" },
      { label: "Tasks", icon: CheckSquare, path: "/tasks" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Reports", icon: BarChart3, path: "/reports" },
      { label: "Automations", icon: Zap, path: "/automations" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Team", icon: UsersRound, path: "/team" },
      { label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 h-screen sticky top-0 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <img src={logo} alt="Blossom ABA" className="h-6" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {navSections.map((section, i) => (
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
