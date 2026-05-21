import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, Users, Heart, UserCog, CalendarDays, ClipboardList,
  FolderKanban, DollarSign, BarChart3, GraduationCap, Building2, Settings,
  Search, Bell, MessageSquare, Sparkles, ChevronLeft, History, ChevronRight, ChevronDown,
  Menu, X, ShieldCheck, Home, Radio, BellRing, FileCheck2, Users2, BadgeCheck,
  Briefcase, ClipboardCheck, Wallet, TrendingUp, ShieldAlert, Activity, Target,
  Workflow, BookOpen, Megaphone, PieChart, LifeBuoy, Inbox, AlertTriangle,
  KanbanSquare, Bot, Brain, Zap, Wand2, MapPin, UserPlus, Headphones,
  HeartHandshake, Globe, Hash, Star,
  LineChart, PhoneCall, Gauge, Database,
} from "lucide-react";
import { PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { RoleSwitcher } from "@/components/os/RoleSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import type { OSModule } from "@/lib/os/permissions";
import { ROLE_HOME, ALL_ROLE_DASHBOARDS } from "@/lib/os/roleHome";
import blossomLogo from "@/assets/blossom-logo-color.png";
import blossomMark from "@/assets/blossom-flower-mark.png";

type NavEntry = { to: string; label: string; icon: typeof LayoutDashboard; module: OSModule; end?: boolean };
type NavSection = { id: string; label: string; items: NavEntry[] };

const HOME_EXTRAS: NavEntry[] = [
  { to: "/command-center", label: "Command Center", icon: Radio, module: "command_center" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, module: "calendar" },
  { to: "/training", label: "Training Academy", icon: GraduationCap, module: "training" },
];

const NAV_SECTIONS: NavSection[] = [
  {
    id: "intake_clients", label: "Intake & Clients", items: [
      { to: "/leads", label: "Leads", icon: Users, module: "leads" },
      { to: "/intake", label: "Intake", icon: ClipboardList, module: "intake" },
      { to: "/vob-decision-center", label: "VOB Decision Center", icon: ShieldCheck, module: "vob" },
      { to: "/clients", label: "Clients", icon: Heart, module: "clients" },
      { to: "/authorizations", label: "Authorizations", icon: FileCheck2, module: "authorizations" },
      { to: "/scheduling", label: "Scheduling", icon: CalendarDays, module: "scheduling" },
      { to: "/cases", label: "Case Management", icon: FolderKanban, module: "cases" },
    ],
  },
  {
    id: "staffing", label: "Clinical Staff", items: [
      { to: "/staff", label: "BCBA / RBT", icon: UserCog, module: "staff" },
      { to: "/recruiting", label: "Recruiting", icon: UserPlus, module: "recruiting" },
      { to: "/credentialing", label: "Credentialing", icon: BadgeCheck, module: "credentialing" },
      { to: "/employee-ops", label: "Employee Ops", icon: Briefcase, module: "employee_ops" },
      { to: "/evaluations", label: "Evaluations", icon: ClipboardCheck, module: "evaluations" },
    ],
  },
  {
    id: "operations", label: "Operations & Intelligence", items: [
      { to: "/reports", label: "Reports", icon: BarChart3, module: "reports" },
      { to: "/kpi", label: "KPI Tracking", icon: Target, module: "kpi" },
      { to: "/workflows", label: "Workflow Center", icon: Workflow, module: "workflows" },
      { to: "/sop", label: "SOP Library", icon: BookOpen, module: "sop" },
      { to: "/marketing", label: "Marketing Ops", icon: Megaphone, module: "marketing" },
    ],
  },
  {
    id: "growth", label: "Growth & Marketing", items: [
      { to: "/marketing/campaigns", label: "Campaigns", icon: Megaphone, module: "campaigns" },
      { to: "/marketing/lead-sources", label: "Lead Sources", icon: TrendingUp, module: "lead_sources" },
      { to: "/marketing/seo", label: "SEO & Content", icon: Globe, module: "seo_content" },
      { to: "/marketing/web-analytics", label: "Web Analytics", icon: LineChart, module: "web_analytics" },
      { to: "/marketing/call-tracking", label: "Call Tracking", icon: PhoneCall, module: "call_tracking" },
    ],
  },
  {
    id: "relationships", label: "Relationships", items: [
      { to: "/marketing/referrals", label: "Referrals", icon: HeartHandshake, module: "referrals" },
      { to: "/marketing/recruiting", label: "Recruiting Marketing", icon: UserPlus, module: "recruiting_marketing" },
      { to: "/marketing/outreach", label: "Community Outreach", icon: Users2, module: "community_outreach" },
      { to: "/marketing/reputation", label: "Reputation", icon: Star, module: "reputation" },
    ],
  },
  {
    id: "intelligence", label: "Intelligence & ROI", items: [
      { to: "/marketing/attribution", label: "Attribution & ROI", icon: Gauge, module: "attribution_roi" },
      { to: "/marketing/state-growth", label: "State Growth", icon: MapPin, module: "state_growth" },
      { to: "/marketing/reports", label: "Marketing Reports", icon: BarChart3, module: "marketing_reports" },
    ],
  },
  {
    id: "financial", label: "Financial Operations", items: [
      { to: "/billing", label: "Billing", icon: DollarSign, module: "billing" },
      { to: "/payroll", label: "Payroll", icon: Wallet, module: "payroll" },
      { to: "/revenue", label: "Revenue Analytics", icon: TrendingUp, module: "revenue" },
      { to: "/insurance", label: "Insurance Tracking", icon: ShieldAlert, module: "insurance" },
    ],
  },
  {
    id: "internal", label: "Internal Operations", items: [
      { to: "/tech-requests", label: "Tech Requests", icon: LifeBuoy, module: "tech_requests" },
      { to: "/internal-requests", label: "Internal Requests", icon: Inbox, module: "internal_requests" },
      { to: "/open-issues", label: "Open Issues", icon: AlertTriangle, module: "open_issues" },
    ],
  },
  {
    id: "ai", label: "AI & Automations", items: [
      { to: "/ai/assistant", label: "Ask Blossom AI", icon: Bot, module: "ai_assistant" },
      { to: "/ai/insights", label: "AI Insights", icon: Brain, module: "ai_insights" },
      { to: "/ai/automations", label: "Automation Center", icon: Zap, module: "automation_center" },
      { to: "/ai/predictive", label: "Predictive Alerts", icon: Activity, module: "predictive_alerts" },
      { to: "/ai/workflows", label: "AI Workflows", icon: Wand2, module: "ai_workflows" },
    ],
  },
  {
    id: "system", label: "System", items: [
      { to: "/hr", label: "HR Suite", icon: Building2, module: "hr" },
      { to: "/user-management", label: "User Management", icon: Users2, module: "user_management" },
      { to: "/state-management", label: "State Management", icon: MapPin, module: "state_management" },
      { to: "/settings", label: "Settings", icon: Settings, module: "settings" },
      { to: "/permissions", label: "Permissions", icon: ShieldCheck, module: "permissions" },
      { to: "/admin/data-uploads", label: "Data Uploads", icon: Database, module: "data_uploads" },
    ],
  },
];

export function OSShell({ children, rightRail }: { children: ReactNode; rightRail?: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("os.sidebar.collapsed") === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { window.localStorage.setItem("os.sidebar.collapsed", collapsed ? "1" : "0"); } catch { /* ignore */ }
  }, [collapsed]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const { user, signOut } = useAuth();
  const { canSee, role, platform } = useOSRole();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Right rail visibility — remembered per page. URL (?panel=hidden|open) overrides per-page memory.
  const [searchParams, setSearchParams] = useSearchParams();
  const PANEL_MAP_KEY = "os.rightRail.byPath";
  const readPanelMap = (): Record<string, boolean> => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(window.localStorage.getItem(PANEL_MAP_KEY) || "{}"); } catch { return {}; }
  };
  const urlPanel = searchParams.get("panel");
  const storedForPath = readPanelMap()[pathname];
  const rightRailHidden =
    urlPanel === "hidden" ? true : urlPanel === "open" ? false : storedForPath ?? false;
  const setRightRailHidden = (next: boolean | ((v: boolean) => boolean)) => {
    const value = typeof next === "function" ? (next as (v: boolean) => boolean)(rightRailHidden) : next;
    try {
      const map = readPanelMap();
      map[pathname] = value;
      window.localStorage.setItem(PANEL_MAP_KEY, JSON.stringify(map));
    } catch { /* ignore */ }
    const params = new URLSearchParams(searchParams);
    params.set("panel", value ? "hidden" : "open");
    setSearchParams(params, { replace: true });
  };
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";
  const showOldVersion = platform("accessOldVersion");

  // Build the Home section dynamically based on the current role.
  const homeSection: NavSection = (() => {
    const dashboardTo = ROLE_HOME[role];
    const items: NavEntry[] = [];
    if (role === "super_admin") {
      // Super admins see the generic dashboard plus quick access to every role dashboard.
      items.push({ to: "/", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true });
      ALL_ROLE_DASHBOARDS.forEach((d) => {
        items.push({ to: d.to, label: d.label, icon: Target, module: "dashboard" });
      });
    } else {
      items.push({ to: dashboardTo, label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true });
    }
    HOME_EXTRAS.forEach((e) => {
      // Calendar route is role-specific — rewrite "/calendar" to the viewer's role calendar.
      if (e.module === "calendar") {
        items.push({ ...e, to: `/calendar/${role.replace(/_/g, "-")}` });
      } else {
        items.push(e);
      }
    });
    return { id: "home", label: "Home", items };
  })();

  const sections = [homeSection, ...NAV_SECTIONS]
    .map((s) => ({ ...s, items: s.items.filter((i) => canSee(i.module)) }))
    .filter((s) => s.items.length > 0);

  const mobileSections = (() => {
    const q = mobileSearch.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  })();

  // Default open: section that contains active route, plus first section.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    map["home"] = true;
    NAV_SECTIONS.forEach((s, idx) => {
      const isActive = s.items.some((i) => i.end ? pathname === i.to : pathname.startsWith(i.to));
      map[s.id] = isActive || idx === 0;
    });
    return map;
  });
  const toggleSection = (id: string) => setOpenSections((m) => ({ ...m, [id]: !m[id] }));

  const allItems = sections.flatMap((s) => s.items);

  const bottomNavCandidates: NavEntry[] = [
    { to: ROLE_HOME[role], label: "Home", icon: LayoutDashboard, module: "dashboard", end: true },
    { to: "/leads", label: "Leads", icon: Users, module: "leads" },
    { to: "/scheduling", label: "Schedule", icon: CalendarDays, module: "scheduling" },
    { to: "/clients", label: "Clients", icon: Heart, module: "clients" },
    { to: "/cases", label: "Cases", icon: FolderKanban, module: "cases" },
    { to: "/training", label: "Training", icon: GraduationCap, module: "training" },
  ];
  const bottomNav = [bottomNavCandidates[0], ...bottomNavCandidates.slice(1).filter((n) => canSee(n.module))].slice(0, 4);

  const renderNavItem = (item: NavEntry, onClick?: () => void) => {
    const link = (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
          collapsed && "justify-center px-0",
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
    if (!collapsed) return link;
    return (
      <Tooltip key={item.to} delayDuration={120}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-[12px] font-medium">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="min-h-screen w-full os-bg text-foreground md:h-screen md:overflow-hidden">
      <div className="mx-auto flex max-w-[1680px] gap-4 p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-5 md:pb-5 md:items-start">
        {/* MOBILE MENU SHEET */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog">
            <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="os-glass-panel absolute left-3 right-3 top-3 bottom-3 flex flex-col overflow-hidden">
              <div className="px-4 pt-5 pb-3 border-b border-foreground/[0.06]">
                <div className="flex items-center justify-between">
                  <NavLink to="/" onClick={() => { setMobileOpen(false); setMobileSearch(""); }} className="flex items-center min-w-0">
                    <img src={blossomLogo} alt="Blossom ABA Therapy" className="h-10 w-auto object-contain" />
                  </NavLink>
                  <button onClick={() => { setMobileOpen(false); setMobileSearch(""); }} className="os-glass-icon h-9 w-9 rounded-xl">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60" strokeWidth={2.25} />
                  <input
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Search menu…"
                    aria-label="Search menu"
                    className="os-glass-input h-10 w-full rounded-2xl pl-10 pr-3 text-[13.5px] focus:outline-none"
                  />
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-3">
                  {mobileSections.map((section) => (
                    <div key={section.id}>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        <span>{section.label}</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform", !openSections[section.id] && "-rotate-90")} />
                      </button>
                      {(openSections[section.id] || mobileSearch.trim()) && (
                        <div className="mt-1 space-y-0.5">
                          {section.items.map((item) => renderNavItem(item, () => { setMobileOpen(false); setMobileSearch(""); }))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {mobileSearch.trim() && mobileSections.length === 0 && (
                  <p className="mt-6 rounded-xl border border-dashed border-foreground/10 bg-foreground/[0.02] p-4 text-center text-[12px] text-muted-foreground">
                    No menu matches for “{mobileSearch.trim()}”.
                  </p>
                )}
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
          <NavLink
            to="/"
            className={cn(
              "relative flex items-center px-4 pt-5 pb-4 border-b border-foreground/[0.06] overflow-hidden",
              collapsed ? "justify-center" : "justify-start",
            )}
          >
            <img
              key={collapsed ? "mark" : "full"}
              src={collapsed ? blossomMark : blossomLogo}
              alt={collapsed ? "Blossom" : "Blossom ABA Therapy"}
              className={cn(
                "object-contain animate-scale-in transition-all duration-300",
                collapsed ? "h-9 w-9" : "h-11 w-auto",
              )}
            />
          </NavLink>

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
            <div className="relative hidden flex-1 md:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-foreground/70" strokeWidth={2.25} />
              <input
                aria-label="Search"
                className="os-glass-input h-11 w-full rounded-2xl pl-11 pr-4 text-[13.5px] focus:outline-none"
              />
            </div>
            <div className="flex-1 md:hidden" />
            <button className="os-glass-icon relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(265_85%_65%)] px-1 text-[9px] font-bold text-white">3</span>
            </button>
          <RoleSwitcher />
            {rightRail && (
              <Tooltip delayDuration={120}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setRightRailHidden((v) => !v)}
                    className="os-glass-icon inline-flex"
                    aria-label={rightRailHidden ? "Show side panel" : "Hide side panel"}
                  >
                    <PanelRight className={cn("h-4 w-4 text-muted-foreground transition-transform", rightRailHidden && "rotate-180")} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[12px] font-medium">
                  {rightRailHidden ? "Show panel" : "Hide panel"}
                </TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-semibold capitalize">{displayName}</span>
                  <span className="text-xs font-normal capitalize text-muted-foreground">{role.replace(/_/g, " ")}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/notifications")}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                  <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate("/auth");
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* CONTENT GRID */}
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row">
            <div className="min-w-0 flex-1 space-y-5">{children}</div>
            {rightRail && (
              <aside
                aria-hidden={rightRailHidden}
                className={cn(
                  "min-w-0 shrink-0 space-y-5 overflow-hidden transition-all duration-300 ease-out",
                  rightRailHidden
                    ? "max-h-0 xl:max-h-none xl:w-0 -translate-x-2 opacity-0 pointer-events-none"
                    : "max-h-[4000px] w-full xl:w-[320px] translate-x-0 opacity-100",
                )}
              >
                {rightRail}
              </aside>
            )}
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