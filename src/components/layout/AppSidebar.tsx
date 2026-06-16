import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown, X, Search, LogOut, Lock,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import blossomMark from "@/assets/blossom-logo.png";
import logoWhite from "@/assets/blossom-logo-light.webp";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { type OSRole } from "@/lib/os/permissions";
import {
  WORKSPACES,
  LEGACY_GROUPS,
  workspacesForRoles,
  type Workspace,
} from "@/lib/os/workspaces";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResumeOnboardingButton } from "@/components/onboarding/ResumeOnboardingButton";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  disabled?: boolean;
  children?: { label: string; path: string }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
  /** When true, section is collapsed by default. */
  defaultCollapsed?: boolean;
}

const roleLabels: Record<string, string> = {
  admin: "Super Admin",
  super_admin: "Super Admin",
  systems_admin: "Systems Admin",
  exec: "Executive",
  executive: "Executive",
  coo: "COO",
  director_of_operations: "Director of Operations",
  operations_manager: "Operations Manager",
  ops_manager: "Operations Leadership",
  intake: "Intake Team",
  intake_lead: "Intake Lead",
  intake_coordinator: "Intake Coordinator",
  finance: "Finance / Benefits",
  finance_benefits_lead: "Finance / Benefits Lead",
  finance_benefits_team: "Finance / Benefits",
  auth_team: "Authorizations",
  authorization_manager: "Authorization Manager",
  authorization_coordinator: "Authorization Coordinator",
  qa: "QA / Compliance",
  qa_director: "QA Director",
  qa_specialist: "QA Specialist",
  clinical_lead: "Clinical Lead",
  staffing: "Staffing",
  staffing_lead: "Staffing Lead",
  staffing_coordinator: "Staffing Coordinator",
  scheduling: "Scheduling",
  scheduling_lead: "Scheduling Lead",
  scheduling_coordinator: "Scheduling Coordinator",
  clinic: "Clinic",
  payroll_admin: "Payroll",
  payroll_lead: "Payroll Lead",
  hr: "HR / People Ops",
  hr_lead: "HR Lead",
  hr_admin: "HR Admin",
  hr_manager: "HR Manager",
  recruiting_assistant: "Recruiting",
  recruiting_lead: "Recruiting Lead",
  recruiting_coordinator: "Recruiting Coordinator",
  state_director: "State Leadership",
  assistant_state_director: "Assistant State Director",
  marketing: "Marketing",
  marketing_team: "Marketing Team",
  marketing_growth_lead: "Marketing & Growth Lead",
  billing_lead: "Billing Lead",
  credentialing_lead: "Credentialing Lead",
  rcm_team: "RCM Team",
  bcba: "BCBA",
  rbt: "RBT",
  staff: "Staff",
  viewer: "Viewer",
};

// Generic icon for legacy entries — neutral so we don't overload the sidebar.
const PlainDot: LucideIcon = ((props) => (
  // simple visual marker
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...props}>
    <circle cx="12" cy="12" r="3" />
  </svg>
)) as LucideIcon;

function buildSections(args: {
  roles: string[];
  isAdmin: boolean;
  /** When super admin is impersonating an OS role, narrow visibility. */
  impersonatedRoles: string[] | null;
}): NavSection[] {
  const { roles, isAdmin, impersonatedRoles } = args;
  const effectiveRoles = impersonatedRoles ?? roles;
  const effectiveIsAdmin = impersonatedRoles ? false : isAdmin;

  const visible: Workspace[] = workspacesForRoles(effectiveRoles, effectiveIsAdmin);

  const groupFor = (g: Workspace["group"]) =>
    visible.filter((w) => w.group === g).map<NavItem>((w) => ({
      label: w.label,
      icon: w.icon,
      path: w.path,
      children: w.tabs,
    }));

  const sections: NavSection[] = [];

  const workspaces = groupFor("workspaces");
  if (workspaces.length) sections.push({ title: "Workspaces", items: workspaces });

  const knowledge = groupFor("knowledge");
  if (knowledge.length) sections.push({ title: "Knowledge", items: knowledge });

  const system = groupFor("system");
  if (system.length) sections.push({ title: "System", items: system });

  // Legacy group — super admin only, collapsed by default.
  if (effectiveIsAdmin) {
    const legacyItems: NavItem[] = LEGACY_GROUPS.flatMap((g) =>
      g.items.map((i) => ({ label: `${g.title.replace(/ \(Legacy\)| Tools| Dashboards/g, "")}: ${i.label}`, icon: PlainDot, path: i.path })),
    );
    // Keep label simpler — just flat list with a heading.
    const flat: NavItem[] = LEGACY_GROUPS.flatMap((g) =>
      g.items.map((i) => ({ label: i.label, icon: PlainDot, path: i.path })),
    );
    void legacyItems;
    sections.push({ title: "Legacy & Tools", items: flat, defaultCollapsed: true });
  }

  return sections;
}

export function AppSidebar({
  mobileOpen = false,
  onMobileOpenChange,
}: {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, user, roles, signOut } = useAuth();
  const osCtx = useOSRoleSafe();
  const osRole: OSRole | null = osCtx?.role ?? null;
  const impersonating = !!(isAdmin && osRole && osRole !== "super_admin");

  // Map an impersonated OSRole to the auth roles its sidebar should reflect.
  const impersonatedRoles: string[] | null = useMemo(() => {
    if (!impersonating || !osRole) return null;
    const map: Partial<Record<OSRole, string[]>> = {
      executive_leadership: ["exec"],
      operations_leadership: ["ops_manager"],
      state_director: ["state_director"],
      intake_coordinator: ["intake"],
      authorization_coordinator: ["auth_team"],
      scheduling_team: ["scheduling"],
      recruiting_team: ["recruiting_assistant"],
      hr_team: ["hr"],
      billing_finance: ["finance"],
      qa_team: ["qa"],
      payroll_coordinator: ["payroll_admin"],
      bcba: ["bcba"],
      rbt: ["rbt"],
      marketing_team: ["marketing"],
      case_manager: ["staff"],
      behavioral_support: ["behavioral_support"],
      // New canonical roles
      systems_admin: ["systems_admin"],
      executive: ["executive"],
      coo: ["coo"],
      director_of_operations: ["director_of_operations"],
      operations_manager: ["operations_manager"],
      marketing_growth_lead: ["marketing_growth_lead"],
      intake_lead: ["intake_lead"],
      finance_benefits_lead: ["finance_benefits_lead"],
      finance_benefits_team: ["finance_benefits_team"],
      authorization_manager: ["authorization_manager"],
      qa_director: ["qa_director"],
      qa_specialist: ["qa_specialist"],
      clinical_lead: ["clinical_lead"],
      scheduling_lead: ["scheduling_lead"],
      scheduling_coordinator: ["scheduling_coordinator"],
      staffing_lead: ["staffing_lead"],
      staffing_coordinator: ["staffing_coordinator"],
      recruiting_lead: ["recruiting_lead"],
      recruiting_coordinator: ["recruiting_coordinator"],
      hr_lead: ["hr_lead"],
      payroll_lead: ["payroll_lead"],
      billing_lead: ["billing_lead"],
      credentialing_lead: ["credentialing_lead"],
      rcm_team: ["rcm_team"],
      assistant_state_director: ["assistant_state_director"],
      viewer: ["viewer"],
    };
    return map[osRole] ?? [];
  }, [impersonating, osRole]);

  const baseSections = useMemo(
    () => buildSections({ roles, isAdmin, impersonatedRoles }),
    [roles, isAdmin, impersonatedRoles],
  );

  // Persisted collapse state.
  const SIDEBAR_SECTIONS_KEY = "sidebar-open-sections.v2";
  const defaultOpen = useMemo(
    () => new Set(baseSections.filter((s) => !s.defaultCollapsed).map((s) => s.title)),
    [baseSections],
  );
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return defaultOpen;
    try {
      const raw = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
      if (raw) return new Set<string>(JSON.parse(raw));
    } catch { /* ignore */ }
    return defaultOpen;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(Array.from(openSections)));
    } catch { /* ignore */ }
  }, [openSections]);
  useEffect(() => {
    const handler = () => {
      try { localStorage.removeItem(SIDEBAR_SECTIONS_KEY); } catch { /* ignore */ }
      setOpenSections(defaultOpen);
      setMobileOpenSections(new Set());
    };
    window.addEventListener("sidebar:reset-layout", handler);
    return () => window.removeEventListener("sidebar:reset-layout", handler);
  }, [defaultOpen]);

  const [mobileOpenSections, setMobileOpenSections] = useState<Set<string>>(new Set());
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const toggleItem = (path: string) => setOpenItems((cur) => {
    const next = new Set(cur);
    if (next.has(path)) next.delete(path); else next.add(path);
    return next;
  });
  const [navQuery, setNavQuery] = useState("");
  const [mobileNavQuery, setMobileNavQuery] = useState("");

  const filterSectionsByQuery = (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return baseSections;
    return baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(trimmed) ||
            section.title.toLowerCase().includes(trimmed),
        ),
      }))
      .filter((s) => s.items.length > 0);
  };

  const sections = useMemo(() => filterSectionsByQuery(navQuery), [baseSections, navQuery]);
  const mobileSections = useMemo(() => filterSectionsByQuery(mobileNavQuery), [baseSections, mobileNavQuery]);

  const submitNavSearch = (q: string, isMobile: boolean) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !q.trim()) return;
    const pool = isMobile ? mobileSections : sections;
    const firstHit = pool.flatMap((s) => s.items).find((i) => !i.disabled);
    if (firstHit) {
      navigate(firstHit.path);
      if (isMobile) { onMobileOpenChange?.(false); setMobileNavQuery(""); }
      else setNavQuery("");
    }
  };

  const isItemActive = (path: string) => {
    const [bare, query] = path.split("?");
    if (query) {
      // active when pathname matches AND every search param in `path` is present.
      if (location.pathname !== bare) return false;
      const target = new URLSearchParams(query);
      const current = new URLSearchParams(location.search);
      for (const [k, v] of target) if (current.get(k) !== v) return false;
      return true;
    }
    if (bare === "/") return location.pathname === "/";
    return location.pathname === bare || location.pathname.startsWith(`${bare}/`);
  };

  const toggleSection = (title: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };
  const toggleMobileSection = (title: string) => setMobileOpenSections((current) => {
    const next = new Set(current);
    if (next.has(title)) next.delete(title); else next.add(title);
    return next;
  });

  const activeSectionTitles = new Set(
    baseSections.filter((s) => s.items.some((i) =>
      isItemActive(i.path) || (i.children?.some((c) => isItemActive(c.path)) ?? false),
    )).map((s) => s.title),
  );
  // Auto-expand any workspace whose tab is the active route.
  useEffect(() => {
    setOpenItems((cur) => {
      const next = new Set(cur);
      for (const section of baseSections) {
        for (const item of section.items) {
          if (item.children?.some((c) => isItemActive(c.path))) next.add(item.path);
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, baseSections]);
  useEffect(() => {
    if (mobileOpen) setMobileOpenSections(activeSectionTitles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, mobileOpen]);
  useEffect(() => {
    if (mobileNavQuery.trim()) setMobileOpenSections(new Set(mobileSections.map((s) => s.title)));
  }, [mobileNavQuery, mobileSections]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0]?.replace(/[._-]/g, " ") || "Blossom User";
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "BU";
  const roleLabel = roles.map((r) => roleLabels[r]).find(Boolean) || "Team Member";
  void ROLE_HOME;

  return (
    <>
      {/* ---------- Mobile sheet ---------- */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="right" className="mobile-menu-sheet flex h-dvh w-[92vw] max-w-[380px] flex-col overflow-hidden border-0 bg-background p-0 md:hidden">
          <header className="relative shrink-0 overflow-hidden border-b border-border/60 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.08)_0%,hsl(var(--accent)/0.06)_60%,transparent_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_-10%_110%,hsl(var(--accent)/0.14),transparent_50%)]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            <div className="relative flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => { navigate("/"); onMobileOpenChange?.(false); }}
                className="group flex min-w-0 items-center gap-1 rounded-2xl px-1 py-1 -ml-1 transition active:scale-[0.98]"
                aria-label="Go to home"
              >
                <img src={blossomMark} alt="Blossom ABA Therapy" className="h-12 w-auto object-contain drop-shadow-[0_2px_10px_hsl(var(--primary)/0.18)]" />
              </button>
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-card/70 text-muted-foreground shadow-sm backdrop-blur-md ring-1 ring-border/60 hover:bg-card hover:text-foreground" onClick={() => onMobileOpenChange?.(false)} aria-label="Close navigation menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute z-10 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={mobileNavQuery}
                onChange={(e) => setMobileNavQuery(e.target.value)}
                onKeyDown={submitNavSearch(mobileNavQuery, true)}
                placeholder="Search menu…"
                className="h-10 rounded-xl border-border/50 bg-card/70 pl-9 text-[14px] shadow-sm backdrop-blur-md placeholder:text-muted-foreground/80 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>
          </header>
          <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile navigation">
            <div className="mb-3 px-1">
              <ResumeOnboardingButton variant="mobile" onNavigate={() => onMobileOpenChange?.(false)} />
            </div>
            {mobileSections.map((section, i) => {
              const sectionOpen = mobileOpenSections.has(section.title);
              const activeInSection = section.items.some((item) => isItemActive(item.path));
              return (
                <div key={section.title} className={cn("animate-fade-in", i !== 0 && "mt-1 pt-1")}>
                  <button
                    type="button"
                    onClick={() => toggleMobileSection(section.title)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/40"
                    aria-expanded={sectionOpen}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{section.title}</span>
                      {activeInSection && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
                    </span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", !sectionOpen && "-rotate-90")} />
                  </button>
                  {sectionOpen && (
                    <div className="mt-0.5 space-y-0.5 px-1 pb-1 animate-fade-in">
                      {section.items.map((item) => {
                        const active = isItemActive(item.path);
                        if (item.disabled) {
                          return (
                            <button key={item.path} type="button" aria-disabled="true" className="mobile-menu-item w-full cursor-not-allowed opacity-50">
                              <span className="mobile-menu-icon"><Lock className="h-4 w-4" /></span>
                              <span className="min-w-0 flex-1"><span className="block truncate">{item.label}</span></span>
                            </button>
                          );
                        }
                        return (
                          <div key={item.path}>
                            <NavLink
                              to={item.path}
                              end={item.path === "/"}
                              onClick={() => onMobileOpenChange?.(false)}
                              className={cn("mobile-menu-item", (active || item.children?.some((c) => isItemActive(c.path))) && "mobile-menu-item-active")}
                            >
                              <span className="mobile-menu-icon"><item.icon className="h-4 w-4" /></span>
                              <span className="min-w-0 flex-1"><span className="block truncate">{item.label}</span></span>
                              {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />}
                            </NavLink>
                            {item.children?.length ? (
                              <div className="ml-9 mt-0.5 mb-1 space-y-0.5 border-l border-border/50 pl-2">
                                {item.children.map((child) => {
                                  const cActive = isItemActive(child.path);
                                  return (
                                    <NavLink
                                      key={child.path}
                                      to={child.path}
                                      onClick={() => onMobileOpenChange?.(false)}
                                      className={cn(
                                        "block rounded-md px-2.5 py-1.5 text-[12.5px]",
                                        cActive ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                                      )}
                                    >
                                      {child.label}
                                    </NavLink>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {mobileNavQuery.trim() && mobileSections.length === 0 && (
              <p className="mt-4 rounded-xl border border-dashed border-border/60 bg-card/60 p-4 text-center text-xs text-muted-foreground">
                No menu matches.
              </p>
            )}
          </nav>
          <div className="shrink-0 border-t border-border/60 bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <button
                type="button"
                onClick={() => { onMobileOpenChange?.(false); navigate("/profile"); }}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:bg-secondary/50 active:scale-[0.99]"
                aria-label="Open profile"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">{initials}</div>
                <div className="min-w-0 flex-1 py-1">
                  <p className="truncate text-sm font-semibold capitalize leading-tight text-foreground">{displayName}</p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">{roleLabel}</p>
                </div>
              </button>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Sign out" onClick={async () => { onMobileOpenChange?.(false); await signOut(); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ---------- Desktop sidebar ---------- */}
      <aside className="sidebar-shell hidden shrink-0 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col">
        <div className="hidden h-20 items-center justify-center border-b border-sidebar-border/50 px-4 md:flex">
          <img src={logoWhite} alt="Blossom ABA Therapy" className="max-h-12 w-auto object-contain drop-shadow-[0_4px_12px_hsl(var(--sidebar-primary)/0.35)]" />
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pt-6 pb-4">
          <div className="px-1">
            <ResumeOnboardingButton variant="sidebar" />
          </div>
          <div className="relative px-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-sidebar-primary" strokeWidth={2.25} />
            <Input
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              onKeyDown={submitNavSearch(navQuery, false)}
              placeholder="Search menu — Enter to jump"
              className="h-9 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 pl-10 text-xs text-sidebar-foreground placeholder:text-sidebar-muted shadow-inner backdrop-blur-md focus-visible:ring-1 focus-visible:ring-sidebar-primary"
            />
          </div>
          {sections.map((section) => {
            const sectionOpen = openSections.has(section.title);
            return (
              <div key={section.title}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="mb-1.5 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground"
                  aria-expanded={sectionOpen}
                >
                  <span>{section.title}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-sidebar-foreground/80 transition-transform", !sectionOpen && "-rotate-90")} />
                </button>
                {sectionOpen && (
                  <div className="space-y-0.5 md:pl-1">
                    {section.items.map((item) => {
                      if (item.disabled) {
                        return (
                          <Tooltip key={item.path}>
                            <TooltipTrigger asChild>
                              <button type="button" onClick={(e) => e.preventDefault()} aria-disabled="true" className={cn("nav-item nav-item-disabled w-full")}>
                                <Lock className="h-4 w-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Access restricted</TooltipContent>
                          </Tooltip>
                        );
                      }
                      const hasChildren = !!item.children?.length;
                      const itemOpen = openItems.has(item.path);
                      const selfActive = isItemActive(item.path);
                      const childActive = item.children?.some((c) => isItemActive(c.path)) ?? false;
                      const anyActive = selfActive || childActive;
                      return (
                        <div key={item.path}>
                          <div className="flex items-stretch gap-0.5">
                            <NavLink
                              to={item.path}
                              end={item.path === "/"}
                              className={cn("nav-item flex-1", anyActive ? "nav-item-active" : "nav-item-inactive")}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); toggleItem(item.path); }}
                                aria-label={itemOpen ? "Collapse" : "Expand"}
                                aria-expanded={itemOpen}
                                className="grid w-6 place-items-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                              >
                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !itemOpen && "-rotate-90")} />
                              </button>
                            )}
                          </div>
                          {hasChildren && itemOpen && (
                            <div className="mt-0.5 ml-5 space-y-0.5 border-l border-sidebar-border/40 pl-2">
                              {item.children!.map((child) => {
                                const cActive = isItemActive(child.path);
                                return (
                                  <NavLink
                                    key={child.path}
                                    to={child.path}
                                    className={cn(
                                      "block rounded-md px-2.5 py-1 text-[12.5px] leading-tight transition-colors",
                                      cActive
                                        ? "bg-sidebar-accent/60 text-sidebar-accent-foreground font-medium"
                                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground",
                                    )}
                                  >
                                    {child.label}
                                  </NavLink>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {navQuery.trim() && sections.length === 0 && (
            <p className="rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-[11px] text-sidebar-muted">
              No menu matches.
            </p>
          )}
        </nav>
      </aside>
    </>
  );
}
