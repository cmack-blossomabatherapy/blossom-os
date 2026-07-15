import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BookOpen, User, Building2, GraduationCap, FileText, PlayCircle, ShieldAlert, Inbox, Users, ShieldCheck, CalendarClock,
} from "lucide-react";
import { useOSRole } from "@/contexts/OSRoleContext";

const TABS = [
  { to: "/resource-library",              label: "Home",        icon: BookOpen, end: true },
  { to: "/resource-library/role",         label: "My Role",     icon: User },
  { to: "/resource-library/department",   label: "Departments", icon: Building2 },
  { to: "/resource-library/intake",       label: "Intake",      icon: Inbox },
  { to: "/resource-library/recruiting",   label: "Recruiting",  icon: Users },
  { to: "/resource-library/authorizations", label: "Authorizations", icon: ShieldCheck },
  { to: "/resource-library/scheduling", label: "Scheduling", icon: CalendarClock },
  { to: "/resource-library/training",     label: "Training",    icon: GraduationCap },
  { to: "/resource-library/sops",         label: "SOPs & Forms",icon: FileText },
  { to: "/resource-library/videos",       label: "Videos",      icon: PlayCircle },
];

export function LibraryTabs() {
  const { role } = useOSRole();
  const isSuper = role === "super_admin";
  return (
    <nav className="flex flex-wrap gap-1.5 rounded-2xl border border-border/60 bg-card/70 p-1.5 backdrop-blur">
      {TABS.map((t) => {
        const Icon = t.icon;
        return (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <Icon className="h-3.5 w-3.5" /> {t.label}
          </NavLink>
        );
      })}
      {isSuper && (
        <NavLink
          to="/resource-library/admin/qa"
          className={({ isActive }) =>
            cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Import / QA
        </NavLink>
      )}
    </nav>
  );
}
