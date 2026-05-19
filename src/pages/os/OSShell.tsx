import { ReactNode, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Heart, UserCog, CalendarDays, ClipboardList,
  FolderKanban, DollarSign, BarChart3, GraduationCap, Building2, Settings,
  Search, Bell, MessageSquare, Sparkles, ChevronLeft, History, ChevronRight, ChevronDown,
  Menu, X, ShieldCheck, Home, Radio, BellRing, FileCheck2, Users2, BadgeCheck,
  Briefcase, ClipboardCheck, Wallet, TrendingUp, ShieldAlert, Activity, Target,
  Workflow, BookOpen, Megaphone, PieChart, LifeBuoy, Inbox, AlertTriangle,
  KanbanSquare, Bot, Brain, Zap, Wand2, MapPin, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { RoleSwitcher } from "@/components/os/RoleSwitcher";
import type { OSModule } from "@/lib/os/permissions";

type NavEntry = { to: string; label: string; icon: typeof LayoutDashboard; module: OSModule; end?: boolean };
type NavSection = { id: string; label: string; items: NavEntry[] };

const NAV_SECTIONS: NavSection[] = [
  {
    id: "home", label: "Home", items: [
      { to: "/os", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true },
      { to: "/os/executive", label: "Executive", icon: Target, module: "dashboard" },
      { to: "/os/command-center", label: "Command Center", icon: Radio, module: "command_center" },
      { to: "/os/calendar", label: "Calendar", icon: CalendarDays, module: "calendar" },
      { to: "/os/training", label: "Training Academy", icon: GraduationCap, module: "training" },
      { to: "/os/notifications", label: "Notifications", icon: BellRing, module: "notifications" },
    ],
  },
  {
    id: "intake_clients", label: "Intake & Clients", items: [
      { to: "/os/leads", label: "Leads", icon: Users, module: "leads" },
      { to: "/os/intake", label: "Intake", icon: ClipboardList, module: "intake" },
      { to: "/os/clients", label: "Clients", icon: Heart, module: "clients" },
      { to: "/os/authorizations", label: "Authorizations", icon: FileCheck2, module: "authorizations" },
      { to: "/os/scheduling", label: "Scheduling", icon: CalendarDays, module: "scheduling" },
      { to: "/os/cases", label: "Case Management", icon: FolderKanban, module: "cases" },
    ],
  },
  {
    id: "staffing", label: "Staffing & Employees", items: [
      { to: "/os/staff", label: "RBT / BCBA", icon: UserCog, module: "staff" },
      { to: "/os/recruiting", label: "Recruiting", icon: UserPlus, module: "recruiting" },
      { to: "/os/credentialing", label: "Credentialing", icon: BadgeCheck, module: "credentialing" },
      { to: "/os/employee-ops", label: "Employee Ops", icon: Briefcase, module: "employee_ops" },
      { to: "/os/evaluations", label: "Evaluations", icon: ClipboardCheck, module: "evaluations" },
    ],
  },
  {
    id: "operations", label: "Operations & Intelligence", items: [
      { to: "/os/reports", label: "Reports", icon: BarChart3, module: "reports" },
      { to: "/os/kpi", label: "KPI Tracking", icon: Target, module: "kpi" },
      { to: "/os/workflows", label: "Workflow Center", icon: Workflow, module: "workflows" },
      { to: "/os/sop", label: "SOP Library", icon: BookOpen, module: "sop" },
      { to: "/os/marketing", label: "Marketing Ops", icon: Megaphone, module: "marketing" },
    ],
  },
  {
    id: "financial", label: "Financial Operations", items: [
      { to: "/os/billing", label: "Billing", icon: DollarSign, module: "billing" },
      { to: "/os/payroll", label: "Payroll", icon: Wallet, module: "payroll" },
      { to: "/os/revenue", label: "Revenue Analytics", icon: TrendingUp, module: "revenue" },
      { to: "/os/insurance", label: "Insurance Tracking", icon: ShieldAlert, module: "insurance" },
    ],
  },
  {
    id: "internal", label: "Internal Operations", items: [
      { to: "/os/tech-requests", label: "Tech Requests", icon: LifeBuoy, module: "tech_requests" },
      { to: "/os/internal-requests", label: "Internal Requests", icon: Inbox, module: "internal_requests" },
      { to: "/os/open-issues", label: "Open Issues", icon: AlertTriangle, module: "open_issues" },
    ],
  },
  {
    id: "ai", label: "AI & Automations", items: [
      { to: "/os/ai/assistant", label: "Ask Blossom AI", icon: Bot, module: "ai_assistant" },
      { to: "/os/ai/insights", label: "AI Insights", icon: Brain, module: "ai_insights" },
      { to: "/os/ai/automations", label: "Automation Center", icon: Zap, module: "automation_center" },
      { to: "/os/ai/predictive", label: "Predictive Alerts", icon: Activity, module: "predictive_alerts" },
      { to: "/os/ai/workflows", label: "AI Workflows", icon: Wand2, module: "ai_workflows" },
    ],
  },
  {
    id: "system", label: "System", items: [
      { to: "/os/hr", label: "HR Suite", icon: Building2, module: "hr" },
      { to: "/os/user-management", label: "User Management", icon: Users2, module: "user_management" },
      { to: "/os/state-management", label: "State Management", icon: MapPin, module: "state_management" },
      { to: "/os/settings", label: "Settings", icon: Settings, module: "settings" },
      { to: "/os/permissions", label: "Permissions", icon: ShieldCheck, module: "permissions" },
    ],
  },
];

export function OSShell({ children, rightRail }: { children: ReactNode; rightRail?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { canSee, role, platform } = useOSRole();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";
  const showOldVersion = platform("accessOldVersion");

  const sections = NAV_SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((i) => canSee(i.module)) }))
    .filter((s) => s.items.length > 0);

  // Default open: section that contains active route, plus first section.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    NAV_SECTIONS.forEach((s, idx) => {
      const isActive = s.items.some((i) => i.end ? pathname === i.to : pathname.startsWith(i.to));
      map[s.id] = isActive || idx === 0 || idx === 1;
    });
    return map;
  });
  const toggleSection = (id: string) => setOpenSections((m) => ({ ...m, [id]: !m[id] }));

  const allItems = sections.flatMap((s) => s.items);

  const bottomNavCandidates: NavEntry[] = [
    { to: "/os", label: "Home", icon: LayoutDashboard, module: "dashboard", end: true },
    { to: "/os/leads", label: "Leads", icon: Users, module: "leads" },
    { to: "/os/scheduling", label: "Schedule", icon: CalendarDays, module: "scheduling" },
    { to: "/os/clients", label: "Clients", icon: Heart, module: "clients" },
    { to: "/os/cases", label: "Cases", icon: FolderKanban, module: "cases" },
    { to: "/os/training", label: "Training", icon: GraduationCap, module: "training" },
  ];
  const bottomNav = [bottomNavCandidates[0], ...bottomNavCandidates.slice(1).filter((n) => canSee(n.module))].slice(0, 4);

  const renderNavItem = (item: NavEntry, onClick?: () => void) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
          isActive
            ? "bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_10px_26px_-12px_hsl(265_85%_60%/0.6)]"
            : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground",
        )
      }
    >
      <item.icon className="h-[16px] w-[16px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  return (
    <div className="min-h-screen w-full os-bg text-foreground md:h-screen md:overflow-hidden">
      <div className="mx-auto flex max-w-[1680px] gap-4 p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-5 md:pb-5 md:items-start">
        {/* MOBILE MENU SHEET */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog">
            <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="os-glass-panel absolute left-3 right-3 top-3 bottom-3 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_72%)] text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold leading-none tracking-tight">Blossom OS</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Operations System</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="os-glass-icon h-9 w-9 rounded-xl">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 pb-4">
                <div className="space-y-3">
                  {sections.map((section) => (
                    <div key={section.id}>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        <span>{section.label}</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform", !openSections[section.id] && "-rotate-90")} />
                      </button>
                      {openSections[section.id] && (
                        <div className="mt-1 space-y-0.5">
                          {section.items.map((item) => renderNavItem(item, () => setMobileOpen(false)))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {showOldVersion && (
                  <button
                    onClick={() => { setMobileOpen(false); navigate("/"); }}
                    className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-[13px] font-medium text-muted-foreground hover:bg-foreground/[0.04]"
                  >
                    <History className="h-4 w-4" /> Old Version
                  </button>
                )}
              </nav>
            </aside>
          </div>
        )}

        {/* SIDEBAR */}
        <aside
          className={cn(
            "os-glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col md:flex transition-[width] duration-300",
            collapsed ? "w-[78px]" : "w-[252px]",
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

          <nav className="os-sidebar-scroll flex-1 overflow-y-auto px-3 pb-3">
            {collapsed ? (
              <div className="space-y-1">{allItems.map((item) => renderNavItem(item))}</div>
            ) : (
              <div className="space-y-2">
                {sections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
                    >
                      <span>{section.label}</span>
                      <ChevronDown className={cn("h-3 w-3 transition-transform", !openSections[section.id] && "-rotate-90")} />
                    </button>
                    {openSections[section.id] && (
                      <div className="mt-0.5 space-y-0.5 border-l border-foreground/[0.06] pl-1.5">
                        {section.items.map((item) => renderNavItem(item))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
          {!collapsed && showOldVersion && (
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
        <div className="flex min-w-0 flex-1 flex-col gap-5 md:h-[calc(100vh-1.5rem)] md:overflow-y-auto">
          {/* TOPBAR */}
          <header className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="os-glass-icon h-11 w-11 shrink-0 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>
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
            <RoleSwitcher />
            <button className="os-glass-panel hidden items-center gap-2.5 rounded-2xl px-2.5 py-1.5 pr-3.5 sm:flex">
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

      {/* MOBILE BOTTOM NAV */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-3 mb-3 os-glass-panel grid grid-cols-5 gap-1 p-1.5">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition-all",
                  isActive
                    ? "bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_8px_20px_-10px_hsl(265_85%_60%/0.6)]"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-[18px] w-[18px]" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}