import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Calendar,
  UserPlus, ClipboardCheck, Building2, Phone, FileText,
  CheckSquare, BarChart3, Zap, UsersRound, Settings, Workflow, Briefcase,
  HeartHandshake, IdCard, Network, GraduationCap, Clock, Timer, FileSpreadsheet,
  Star, Wallet, Megaphone, BookOpen, ChevronDown, X, ChevronRight, Bell, Sparkles,
  History as HistoryIcon, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import logo from "@/assets/blossom-logo-full.png";
import logoWhite from "@/assets/blossom-logo-light.webp";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { type DashboardKey } from "@/data/leadershipDashboard";
import { getRoleNavigationExceptions, hasFullNavigationAccess, navPathToRoutePrefix, TRAINING_ADMIN_ROLES } from "@/lib/navigationAccess";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  perm: string;
  superAdminOnly?: boolean;
  /** If set, the item is only visible when the user has at least one of these roles. */
  allowedRoles?: string[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
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
    { label: "Finance Dashboard", icon: Wallet, path: "/finance-dashboard", perm: "dashboard.view", superAdminOnly: true },
    { label: "HR Dashboard", icon: HeartHandshake, path: "/hr", perm: "dashboard.view", superAdminOnly: true },
    { label: "Recruiting Dashboard", icon: Briefcase, path: "/recruiting-dashboard", perm: "dashboard.view", superAdminOnly: true },
  ],
};

const navSections: NavSection[] = [
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
      { label: "Training Hub", icon: Sparkles, path: "/hr/journey", perm: "" },
      { label: "Training", icon: GraduationCap, path: "/training", perm: "" },
      { label: "Resource Hub", icon: BookOpen, path: "/resources", perm: "", allowedRoles: ["rbt", "bcba"] },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Team", icon: UsersRound, path: "/team", perm: "team.view" },
      { label: "Training Dashboard", icon: GraduationCap, path: "/admin/training-dashboard", perm: "hr.training.view", allowedRoles: TRAINING_ADMIN_ROLES },
      { label: "Training Statistics", icon: BarChart3, path: "/admin/training-statistics", perm: "hr.training.view", allowedRoles: TRAINING_ADMIN_ROLES },
      { label: "Assign Trainings", icon: ClipboardCheck, path: "/admin/training-assign", perm: "hr.training.assign", allowedRoles: TRAINING_ADMIN_ROLES },
      { label: "Role Audit Log", icon: HistoryIcon, path: "/admin/role-audit", perm: "", superAdminOnly: true },
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
    { label: "Training Admin", icon: GraduationCap, path: "/hr/training", perm: "hr.training.view", allowedRoles: TRAINING_ADMIN_ROLES },
    { label: "Time Clock",   icon: Timer,          path: "/hr/time-clock", perm: "hr.timeclock.view" },
    { label: "Hours",        icon: FileSpreadsheet,path: "/hr/hours",      perm: "hr.hours.view" },
    { label: "Payroll",      icon: Wallet,         path: "/hr/payroll",   perm: "hr.payroll.runs.view" },
    { label: "Announcements",icon: Megaphone,      path: "/hr/announcements", perm: "hr.announcements.view" },
    { label: "Resource Hub", icon: BookOpen,       path: "/hr/resources", perm: "hr.resources.view" },
    { label: "HR Reports",   icon: BarChart3,      path: "/hr/reports",   perm: "hr.reports.view" },
    { label: "HR Settings",  icon: Settings,       path: "/hr/settings",  perm: "hr.settings.manage" },
  ],
};

const limitedNavigationSections = (roles: string[]): NavSection[] => {
  const exceptions = getRoleNavigationExceptions(roles as never);
  const allowedSections = new Set(["Intelligence", ...exceptions.flatMap((exception) => exception.sectionTitles ?? [])]);
  const allowedPaths = new Set(exceptions.flatMap((exception) => exception.itemPaths ?? []));
  const intelligenceOverrides = exceptions
    .map((e) => e.intelligenceItemPaths)
    .filter((p): p is string[] => Array.isArray(p));
  const allowedIntelligencePaths = intelligenceOverrides.length > 0
    ? new Set(intelligenceOverrides.flat().map(navPathToRoutePrefix))
    : null;
  const sectionItemRestrictions: Record<string, Set<string>> = {};
  for (const exception of exceptions) {
    if (!exception.sectionItemPaths) continue;
    for (const [title, paths] of Object.entries(exception.sectionItemPaths)) {
      if (!sectionItemRestrictions[title]) sectionItemRestrictions[title] = new Set();
      paths.forEach((p) => sectionItemRestrictions[title].add(navPathToRoutePrefix(p)));
    }
  }

  return [...navSections, hrSection]
    .map((section) => ({
      ...section,
      items: (() => {
        const inAllowedSection = allowedSections.has(section.title ?? "");
        const baseItems = inAllowedSection
          ? section.items
          : section.items.filter((item) => allowedPaths.has(navPathToRoutePrefix(item.path)));
        let result = baseItems;
        if (section.title === "Intelligence" && allowedIntelligencePaths) {
          result = result.filter((item) => allowedIntelligencePaths.has(navPathToRoutePrefix(item.path)));
        }
        const restriction = sectionItemRestrictions[section.title ?? ""];
        if (restriction) {
          result = result.filter((item) => restriction.has(navPathToRoutePrefix(item.path)));
        }
        return result;
      })(),
    }))
    .filter((section) => section.items.length > 0);
};

const mobileSectionDescriptions: Record<string, string> = {
  Dashboards: "Real-time insights and performance",
  Operate: "Run and manage daily operations",
  Pipeline: "Track client journey end-to-end",
  Records: "Calls, documents, and tasks",
  Intelligence: "Learning and operational knowledge",
  "HR Suite": "People, payroll, and compliance",
  Admin: "System settings and access control",
};

const mobileItemDescriptions: Record<string, string> = {
  Training: "Courses and onboarding",
  "Resource Hub": "Guides and internal tools",
};

const roleLabels: Record<string, string> = {
  admin: "Super Admin / Systems",
  exec: "Executive",
  ops_manager: "Operations Leadership",
  intake: "Intake Team",
  finance: "Financial / Benefits",
  auth_team: "Authorization Team",
  qa: "QA Team",
  staffing: "Staffing Team",
  scheduling: "Scheduling Team",
  clinic: "Clinic Team",
  payroll_admin: "Finance / Payroll",
  hr: "HR / People Ops",
  hr_admin: "HR Admin",
  hr_manager: "HR Manager",
  recruiting_assistant: "Recruiting Team",
  state_director: "State Leadership",
  clinic_director: "Clinic Director",
  dept_manager: "Department Manager",
  training_admin: "Training Admin",
  rbt: "RBT (Registered Behavior Technician)",
  bcba: "BCBA (Board Certified Behavior Analyst)",
  staff: "Staff",
  viewer: "Viewer",
};

export function AppSidebar({ mobileOpen = false, onMobileOpenChange }: { mobileOpen?: boolean; onMobileOpenChange?: (open: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPerm, isAdmin, user, roles } = useAuth();
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(["Dashboards", "Operate", "Pipeline", "Records", "Intelligence", "HR Suite", "Admin"]));
  const [mobileOpenSections, setMobileOpenSections] = useState<Set<string>>(new Set());
  const [navQuery, setNavQuery] = useState("");
  const [mobileNavQuery, setMobileNavQuery] = useState("");
  const hasFullNavigation = hasFullNavigationAccess(roles);
  const limitedSections = limitedNavigationSections(roles);

  const allSections = hasFullNavigation ? (isAdmin ? [superAdminDashboardSection, ...navSections] : [...navSections]) : limitedSections;
  // Insert HR Suite before Admin so it sits with the operations modules
  if (hasFullNavigation) {
    const adminIndex = allSections.findIndex((s) => s.title === "Admin");
    if (adminIndex >= 0) allSections.splice(adminIndex, 0, hrSection);
    else allSections.push(hrSection);
  }

  const baseSections = allSections
    .map((s) => ({
      ...s,
        items: s.items.filter((item) =>
          (!item.superAdminOnly || isAdmin) &&
          (!item.perm || hasPerm(item.perm)) &&
          (!item.allowedRoles || item.allowedRoles.some((r) => roles.includes(r as never))),
        ),
    }))
    .filter((s) => s.items.length > 0);

  const filterSectionsByQuery = (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return baseSections;
    return baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.label.toLowerCase().includes(trimmed) ||
          (section.title ?? "").toLowerCase().includes(trimmed),
        ),
      }))
      .filter((s) => s.items.length > 0);
  };

  const sections = useMemo(() => filterSectionsByQuery(navQuery), [baseSections, navQuery]);
  const mobileSections = useMemo(() => filterSectionsByQuery(mobileNavQuery), [baseSections, mobileNavQuery]);

  const submitNavSearch = (q: string, isMobile: boolean) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !q.trim()) return;
    const target = `/hr/journey?q=${encodeURIComponent(q.trim())}`;
    navigate(target);
    if (isMobile) onMobileOpenChange?.(false);
  };

  const isItemActive = (path: string) => {
    if (path === "/hr") {
      return location.pathname === "/hr";
    }
    if (path === "/hr/directory") {
      return location.pathname === "/hr/directory" || location.pathname.startsWith("/hr/employees/");
    }
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

  const activeSectionTitles = new Set(baseSections.filter((section) => section.title && section.items.some((item) => isItemActive(item.path))).map((section) => section.title!));
  const toggleMobileSection = (title: string) => setMobileOpenSections((current) => { const next = new Set(current); if (next.has(title)) next.delete(title); else next.add(title); return next; });
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0]?.replace(/[._-]/g, " ") || "Blossom User";
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "BU";
  const roleLabel = roles.map((role) => roleLabels[role]).find(Boolean) || "Operations Director";

  useEffect(() => {
    if (mobileOpen) setMobileOpenSections(activeSectionTitles);
  }, [location.pathname, location.search, mobileOpen]);

  useEffect(() => {
    if (mobileNavQuery.trim()) setMobileOpenSections(new Set(mobileSections.map((s) => s.title ?? "")));
  }, [mobileNavQuery, mobileSections]);

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="right" className="mobile-menu-sheet flex h-dvh w-[92vw] max-w-[380px] flex-col overflow-hidden border-0 bg-background p-0 shadow-2xl md:hidden">
          <header className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(var(--sidebar-background)),hsl(var(--sidebar-accent))_50%,hsl(var(--primary)))] px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)] text-primary-foreground">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary-foreground)/0.22),transparent_32%),radial-gradient(circle_at_90%_25%,hsl(var(--primary-glow)/0.28),transparent_34%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex flex-1 flex-col items-center pt-2">
                <img src={logoWhite} alt="Blossom ABA Therapy" className="h-12 w-auto object-contain drop-shadow-sm" />
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/75">Operating System</p>
              </div>
              <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-10 w-10 rounded-full bg-primary-foreground/12 text-primary-foreground ring-1 ring-primary-foreground/20 backdrop-blur-md transition-all hover:scale-105 hover:bg-primary-foreground/20 hover:text-primary-foreground" onClick={() => onMobileOpenChange?.(false)} aria-label="Close navigation menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <nav className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,hsl(var(--secondary)/0.75),hsl(var(--background)))] px-4 py-4" aria-label="Mobile navigation">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={mobileNavQuery}
                onChange={(e) => setMobileNavQuery(e.target.value)}
                onKeyDown={submitNavSearch(mobileNavQuery, true)}
                placeholder="Search menu or trainings…"
                className="h-11 rounded-xl border-border/60 bg-card/80 pl-9 text-sm shadow-sm backdrop-blur-xl"
              />
            </div>
            {mobileSections.map((section, i) => {
              const title = section.title ?? `Section ${i + 1}`;
              const activeInSection = section.items.some((item) => isItemActive(item.path));
              const sectionOpen = mobileOpenSections.has(title);
              const SectionIcon = section.items[0]?.icon ?? LayoutDashboard;
              return (
              <div key={title} className="animate-fade-in">
                <button type="button" onClick={() => toggleMobileSection(title)} className={cn("group flex min-h-[76px] w-full items-center gap-3 rounded-2xl border bg-card/88 p-3 text-left shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.985]", activeInSection ? "border-primary/45 shadow-[0_16px_34px_-22px_hsl(var(--primary))] ring-1 ring-primary/20" : "border-border/65 hover:border-primary/25")} aria-expanded={sectionOpen}>
                  <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors", activeInSection ? "bg-primary text-primary-foreground" : "bg-secondary text-primary group-hover:bg-primary/10")}><SectionIcon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold uppercase text-foreground">{title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{mobileSectionDescriptions[title] ?? "Workspace tools and records"}</span>
                  </span>
                  <ChevronRight className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200", sectionOpen && "rotate-90 text-primary")} />
                </button>
                {sectionOpen && <div className="mt-2 space-y-1 rounded-2xl border border-border/60 bg-card/70 p-2 shadow-sm backdrop-blur-xl animate-fade-in">
                  {section.items.map((item) => {
                    const active = isItemActive(item.path);
                    return (
                      <NavLink key={item.path} to={item.path} end={item.path === "/"} onClick={() => onMobileOpenChange?.(false)} className={cn("mobile-menu-item", active && "mobile-menu-item-active")}>
                        <span className="mobile-menu-icon"><item.icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.label}</span>
                          {mobileItemDescriptions[item.label] && <span className="block truncate text-[11px] font-normal text-muted-foreground">{mobileItemDescriptions[item.label]}</span>}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>}
              </div>
            );})}
            {mobileNavQuery.trim() && mobileSections.length === 0 && (
              <p className="rounded-2xl border border-border/60 bg-card/80 p-4 text-center text-xs text-muted-foreground shadow-sm">
                No menu matches. Press Enter to search trainings for “{mobileNavQuery.trim()}”.
              </p>
            )}
          </nav>
          <div className="sticky bottom-0 border-t border-border/60 bg-card/92 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[0_-18px_34px_-28px_hsl(var(--foreground))] backdrop-blur-xl">
            <div className="flex items-center gap-3 rounded-2xl border border-border/65 bg-background/70 p-3 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-[0_10px_24px_-16px_hsl(var(--primary))]">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold capitalize text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label="Open notifications">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <aside className="hidden shrink-0 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
      {/* Logo */}
      <div className="hidden h-20 items-center justify-center border-b border-sidebar-border bg-sidebar px-4 md:flex">
        <img src={logo} alt="Blossom ABA Therapy" className="max-h-14 w-full object-contain" />
      </div>


      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        <div className="relative px-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-muted" />
          <Input
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            onKeyDown={submitNavSearch(navQuery, false)}
            placeholder="Search…"
            className="h-8 rounded-md border-sidebar-border bg-sidebar-accent/40 pl-8 text-xs text-sidebar-foreground placeholder:text-sidebar-muted focus-visible:ring-sidebar-primary"
          />
        </div>
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
                  end={item.path === "/" || item.path === "/hr"}
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
        {navQuery.trim() && sections.length === 0 && (
          <p className="rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-[11px] text-sidebar-muted">
            No menu matches. Press Enter to search trainings.
          </p>
        )}
      </nav>
      </aside>
    </>
  );
}
