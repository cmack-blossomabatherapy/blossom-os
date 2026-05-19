import { ReactNode, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Heart, UserCog, CalendarDays, ClipboardList,
  FolderKanban, DollarSign, BarChart3, GraduationCap, Building2, Settings,
  Search, Bell, MessageSquare, Sparkles, ChevronLeft, History, ChevronRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { to: "/os", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/os/leads", label: "Leads", icon: Users },
  { to: "/os/clients", label: "Clients", icon: Heart },
  { to: "/os/staff", label: "RBT / BCBA", icon: UserCog },
  { to: "/os/scheduling", label: "Scheduling", icon: CalendarDays },
  { to: "/os/intake", label: "Intake", icon: ClipboardList },
  { to: "/os/cases", label: "Case Management", icon: FolderKanban },
  { to: "/os/billing", label: "Billing", icon: DollarSign },
  { to: "/os/reports", label: "Reports", icon: BarChart3 },
  { to: "/os/training", label: "Training", icon: GraduationCap },
  { to: "/os/hr", label: "HR Suite", icon: Building2 },
  { to: "/os/settings", label: "Settings", icon: Settings },
];

export function OSShell({ children, rightRail }: { children: ReactNode; rightRail?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAdmin, roles } = useAuth();
  const navigate = useNavigate();
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";
  const role = roles[0] || "Member";

  return (
    <div className="min-h-screen w-full os-bg text-foreground">
      <div className="mx-auto flex max-w-[1680px] gap-4 p-3 md:p-5">
        {/* SIDEBAR */}
        <aside
          className={cn(
            "os-glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col md:flex transition-[width] duration-300",
            collapsed ? "w-[78px]" : "w-[244px]",
          )}
        >
          <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_72%)] text-white shadow-[0_8px_22px_-8px_hsl(265_85%_60%/0.55)]">
              <Sparkles className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-none tracking-tight">Blossom OS</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Operations System</p>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_10px_26px_-12px_hsl(265_85%_60%/0.6)]"
                          : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground",
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* AI Assistant Card */}
          {!collapsed && (
            <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-[hsl(265_100%_97%)] via-white to-[hsl(285_100%_97%)] p-4 shadow-[0_10px_30px_-18px_hsl(265_85%_60%/0.35)]">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <p className="text-[13px] font-semibold tracking-tight">Blossom OS AI</p>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Your intelligent operations assistant is ready.</p>
              <button className="mt-2.5 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[hsl(265_50%_85%)] bg-white/70 px-2.5 py-1.5 text-[11.5px] font-semibold text-[hsl(265_70%_50%)] transition hover:bg-white">
                Ask Blossom AI <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Old version */}
          {!collapsed && isAdmin && (
            <button
              onClick={() => navigate("/")}
              className="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[11.5px] font-medium text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" /> Old Version
            </button>
          )}

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11.5px] font-medium text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} /> {!collapsed && "Collapse"}
          </button>
        </aside>

        {/* MAIN COLUMN */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* TOPBAR */}
          <header className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search clients, leads, trainings, tasks…"
                className="os-glass-input h-11 w-full rounded-2xl pl-11 pr-16 text-[13.5px] placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border/70 bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
            </div>
            <button className="os-glass-icon relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(265_85%_65%)] px-1 text-[9px] font-bold text-white">3</span>
            </button>
            <button className="os-glass-icon relative">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(330_85%_60%)] px-1 text-[9px] font-bold text-white">7</span>
            </button>
            <button className="os-glass-panel flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 pr-3.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-[11px] font-bold text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-[12.5px] font-semibold leading-tight capitalize">{displayName}</p>
                <p className="text-[10.5px] capitalize text-muted-foreground leading-tight">{role.replace(/_/g, " ")}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </header>

          {/* CONTENT GRID */}
          <div className={cn("grid min-w-0 gap-5", rightRail ? "xl:grid-cols-[1fr_320px]" : "grid-cols-1")}>
            <div className="min-w-0 space-y-5">{children}</div>
            {rightRail && <div className="min-w-0 space-y-5">{rightRail}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}