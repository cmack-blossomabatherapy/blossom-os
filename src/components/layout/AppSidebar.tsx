import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown, X, Search, LogOut, Lock, Eye, ArrowLeft,
  Phone, Users as UsersIcon, LayoutDashboard, Workflow, GraduationCap,
  BookOpen, FileText, HeartHandshake, ShieldCheck, ClipboardCheck,
  Calendar, UserCheck, Megaphone, TrendingUp, Wallet, Settings as SettingsIcon,
  Plug, Briefcase, Building2, IdCard, KeyRound, Smartphone, Stethoscope,
  AlertTriangle, BarChart3, ClipboardList, ListTodo, MapPin, XCircle, CheckCircle2,
  PhoneCall, BookUser, Activity, Workflow as WorkflowIcon, Inbox, Bug,
  Mail, Sparkles, Home,
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
import { workspacesForRoles } from "@/lib/os/workspaces";
import { ROLE_MENUS, DEFAULT_ROLE_MENU, ROLE_PREVIEW_LIST } from "@/lib/os/roleMenus";
import { SUPER_ADMIN_MENU } from "@/lib/os/superAdminMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResumeOnboardingButton } from "@/components/onboarding/ResumeOnboardingButton";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  disabled?: boolean;
  comingSoon?: boolean;
  children?: { label: string; path: string }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
  /** When true, section is collapsed by default. */
  defaultCollapsed?: boolean;
}

/**
 * Standout "Ask Blossom AI" pinned card. Rendered at the very bottom of the
 * navigation for roles that have the AI enabled (currently Intake + admins
 * previewing Intake). Designed to feel premium and inviting — gradient,
 * sparkle iconography, and a clear "Here's how I help" sub-line.
 */
function AskBlossomCard({
  variant,
  onNavigate,
}: {
  variant: "desktop" | "mobile";
  onNavigate: () => void;
}) {
  const isMobile = variant === "mobile";
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "group relative block w-full overflow-hidden rounded-2xl p-[1.5px] text-left transition-all",
        "bg-[linear-gradient(135deg,hsl(265_90%_70%)_0%,hsl(290_85%_70%)_45%,hsl(320_85%_72%)_100%)]",
        "shadow-[0_14px_38px_-18px_hsl(280_85%_55%/0.65)] hover:shadow-[0_18px_44px_-16px_hsl(280_85%_55%/0.8)]",
        "hover:-translate-y-[1px] active:translate-y-0",
      )}
      aria-label="Open Ask Blossom AI"
    >
      <span
        className={cn(
          "relative block rounded-[14px] px-3.5 py-3",
          isMobile ? "bg-background" : "bg-sidebar",
        )}
      >
        {/* shimmer */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(120% 80% at 100% 0%, hsl(280 90% 80% / 0.25), transparent 60%), radial-gradient(120% 80% at 0% 100%, hsl(320 90% 80% / 0.22), transparent 60%)",
          }}
        />
        <span className="relative flex items-start gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,hsl(265_90%_65%),hsl(305_85%_68%))] text-white shadow-[0_8px_18px_-10px_hsl(280_85%_55%/0.7)] ring-1 ring-white/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "truncate text-[13px] font-semibold tracking-tight",
                  isMobile ? "text-foreground" : "text-sidebar-foreground",
                )}
              >
                Ask Blossom AI
              </span>
              <span className="rounded-full bg-[hsl(280_90%_60%/0.18)] px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wider text-[hsl(285_85%_75%)] ring-1 ring-[hsl(280_85%_70%/0.45)]">
                New
              </span>
            </span>
            <span
              className={cn(
                "mt-0.5 block text-[10.5px] leading-snug",
                isMobile ? "text-muted-foreground" : "text-sidebar-foreground/70",
              )}
            >
              Answers, scripts, benefits lookups, and next-best actions — for every lead.
            </span>
          </span>
        </span>
      </span>
    </button>
  );
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

function buildSections(args: {
  roles: string[];
  isAdmin: boolean;
  /** When super admin is impersonating an OS role, narrow visibility. */
  impersonatedRoles: string[] | null;
  /** OS role currently being previewed/used (null when admin not impersonating). */
  effectiveOSRole: OSRole | null;
}): NavSection[] {
  const { roles, isAdmin, impersonatedRoles, effectiveOSRole } = args;
  const effectiveRoles = impersonatedRoles ?? roles;
  const effectiveIsAdmin = impersonatedRoles ? false : isAdmin;

  // ---- Super Admin (not impersonating): full access ----
  if (effectiveIsAdmin) {
    // Canonical Super Admin sections — same source as OSShell so the sidebar
    // never disagrees with itself between pages. Edit `superAdminMenu.ts`, not here.
    return SUPER_ADMIN_MENU.map<NavSection>((s) => ({
      title: s.label,
      defaultCollapsed: s.defaultCollapsed,
      items: s.items.map<NavItem>((i) => ({
        label: i.label,
        path: i.to,
        icon: i.icon,
      })),
    }));
  }

  // ---- Non-admin (and impersonated views): role-scoped live menu ----
  const menu = (effectiveOSRole && ROLE_MENUS[effectiveOSRole]) ?? DEFAULT_ROLE_MENU;
  const sections: NavSection[] = menu.sections.map((s) => ({
    title: s.label,
    defaultCollapsed: s.defaultCollapsed,
    items: s.items.map<NavItem>((i) => ({
      label: i.label,
      icon: i.icon,
      path: i.path,
    })),
  }));
  void roles;
  void effectiveRoles;
  void workspacesForRoles;
  return sections;
}

/** Role preview list surfaced to Super Admins. Sourced from the canonical
 *  role menu module so dropdown + sidebar stay in sync. */
const ROLE_PREVIEW = ROLE_PREVIEW_LIST.filter((r) => r.role !== "super_admin");

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
    () => buildSections({ roles, isAdmin, impersonatedRoles, effectiveOSRole: osRole }),
    [roles, isAdmin, impersonatedRoles, osRole],
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
            section.title.toLowerCase().includes(trimmed) ||
            (item.children?.some((c) => c.label.toLowerCase().includes(trimmed)) ?? false),
        ),
      }))
      .filter((s) => s.items.length > 0);
  };

  const sections = useMemo(() => filterSectionsByQuery(navQuery), [baseSections, navQuery]);
  const mobileSections = useMemo(() => filterSectionsByQuery(mobileNavQuery), [baseSections, mobileNavQuery]);

  // Bare (query-stripped) paths for every registered menu item across all sections
  // and their children. Used so a prefix-based active match on a "hub" item (e.g.
  // `/marketing`) yields to a more-specific sibling (e.g. `/marketing/referral-crm`).
  const allItemPaths = useMemo(() => {
    const paths: string[] = [];
    for (const section of baseSections) {
      for (const item of section.items) {
        paths.push(item.path.split("?")[0]);
        if (item.children) {
          for (const child of item.children) paths.push(child.path.split("?")[0]);
        }
      }
    }
    return paths;
  }, [baseSections]);

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
    if (location.pathname === bare) return true;
    if (!location.pathname.startsWith(`${bare}/`)) return false;
    // Prefix match: only active if no other registered item is a longer prefix
    // of the current pathname. This prevents "hub" entries (e.g. /marketing)
    // from staying highlighted on their child routes (e.g. /marketing/campaigns).
    for (const other of allItemPaths) {
      if (other === bare) continue;
      if (other.length <= bare.length) continue;
      if (other === location.pathname || location.pathname.startsWith(`${other}/`)) {
        return false;
      }
    }
    return true;
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

  // Ask Blossom AI is currently launched for the Intake department only.
  // Admins (and admins previewing intake) also get it for QA + testing.
  const showAskBlossom =
    isAdmin ||
    osRole === "intake_coordinator" ||
    osRole === "intake_lead" ||
    roles.includes("intake") ||
    roles.includes("intake_lead");

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
                          if (item.comingSoon) {
                            return (
                              <NavLink key={item.path} to={item.path} onClick={() => onMobileOpenChange?.(false)} className="mobile-menu-item w-full opacity-80">
                                <span className="mobile-menu-icon"><Lock className="h-4 w-4" /></span>
                                <span className="min-w-0 flex-1"><span className="block truncate">{item.label}</span></span>
                                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Soon</span>
                              </NavLink>
                            );
                          }
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
            {showAskBlossom && (
              <div className="mt-4 px-1">
                <AskBlossomCard
                  variant="mobile"
                  onNavigate={() => {
                    onMobileOpenChange?.(false);
                    navigate("/ai/assistant");
                  }}
                />
              </div>
            )}
            {isAdmin && (
              <div className="mt-4 px-1">
                {impersonating ? (
                  <button
                    type="button"
                    onClick={() => { osCtx?.setRole("super_admin"); }}
                    className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2.5 text-sm font-medium text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Stop previewing
                  </button>
                ) : (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <Eye className="h-3 w-3" /> Preview as Role
                    </p>
                    <div className="space-y-0.5">
                      {ROLE_PREVIEW.map((r) => (
                        <button
                          key={r.role}
                          type="button"
                          onClick={() => {
                            osCtx?.setRole(r.role);
                            navigate(ROLE_HOME[r.role] ?? "/");
                            onMobileOpenChange?.(false);
                          }}
                          className="mobile-menu-item w-full text-left"
                        >
                          <span className="mobile-menu-icon"><Eye className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1"><span className="block truncate">{r.label}</span></span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                              {item.comingSoon ? (
                                <NavLink to={item.path} className={cn("nav-item w-full opacity-80 hover:opacity-100")}>
                                  <Lock className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                  <span className="ml-auto rounded-full bg-sidebar-accent/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                                    Soon
                                  </span>
                                </NavLink>
                              ) : (
                                <button type="button" onClick={(e) => e.preventDefault()} aria-disabled="true" className={cn("nav-item nav-item-disabled w-full")}>
                                  <Lock className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                </button>
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.comingSoon ? "Coming soon" : "Access restricted"}
                            </TooltipContent>
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

          {showAskBlossom && (
            <div className="pt-2">
              <AskBlossomCard
                variant="desktop"
                onNavigate={() => navigate("/ai/assistant")}
              />
            </div>
          )}

          {isAdmin && (
            <div className="pt-2">
              {impersonating ? (
                <button
                  type="button"
                  onClick={() => osCtx?.setRole("super_admin")}
                  className="flex w-full items-center gap-2 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-2 text-[12px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/60"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Stop previewing
                </button>
              ) : (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/80">
                    <Eye className="h-3 w-3" /> Preview as Role
                  </p>
                  <div className="space-y-0.5 md:pl-1">
                    {ROLE_PREVIEW.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => {
                          osCtx?.setRole(r.role);
                          navigate(ROLE_HOME[r.role] ?? "/");
                        }}
                        className="nav-item nav-item-inactive w-full text-left"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        <span className="truncate">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
