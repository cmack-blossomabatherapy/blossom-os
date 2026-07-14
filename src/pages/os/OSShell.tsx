import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, Users, Heart, UserCog, CalendarDays, ClipboardList,
  FolderKanban, BarChart3, GraduationCap, Building2, Settings,
  Search, Bell, ChevronLeft, ChevronRight, ChevronDown,
  Menu, X, ShieldCheck, Radio, FileCheck2, Users2,
  Briefcase, ClipboardCheck, Wallet, TrendingUp, Workflow,
  BookOpen, Megaphone, Inbox, AlertTriangle,
  HeartHandshake, MapPin, UserPlus, Headphones, KeyRound, IdCard, Smartphone,
  Stethoscope, PhoneCall, BookUser, Activity, Bug, UserCheck,
  Plug, MonitorSmartphone, XCircle, CheckCircle2, ListTodo,
  Phone, FileText, LogOut,
  UploadCloud, Sparkles, Mail, Home,
  type LucideIcon,
} from "lucide-react";
import { PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { OSNotificationsBell } from "@/components/os/OSNotificationsBell";
import { RoleSwitcher } from "@/components/os/RoleSwitcher";
import { WorkingAsSelector } from "@/components/os/WorkingAsSelector";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { ROLE_MENUS, DEFAULT_ROLE_MENU } from "@/lib/os/roleMenus";
import { SUPER_ADMIN_MENU } from "@/lib/os/superAdminMenu";
import blossomLogo from "@/assets/blossom-logo-color.png";
import blossomMark from "@/assets/blossom-flower-mark.png";
import { FloatingEscalationChat } from "@/components/escalation/FloatingEscalationChat";
import { TrainingProgressCloudBridge } from "@/components/training/TrainingProgressCloudBridge";
import { BlossomAIProvider } from "@/components/ai/BlossomAIAssistant";

/* ------------------------------------------------------------------ */
/* Section / item types                                               */
/* ------------------------------------------------------------------ */

type NavEntry = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  disabled?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  items: NavEntry[];
  defaultCollapsed?: boolean;
};

/* ------------------------------------------------------------------ */
/* Super Admin - canonical grouped menu                               */
/*                                                                    */
/* This shell consumes the SAME canonical menu as AppSidebar so users */
/* never see two different Super Admin menus depending on which page  */
/* rendered the sidebar. Do NOT hand-edit here.                       */
/* ------------------------------------------------------------------ */

const SUPER_ADMIN_SECTIONS: NavSection[] = SUPER_ADMIN_MENU.map((s) => ({
  id: s.id,
  label: s.label,
  defaultCollapsed: s.defaultCollapsed,
  items: s.items.map<NavEntry>((i) => ({
    to: i.to,
    label: i.label,
    icon: i.icon,
    end: i.end,
  })),
}));

/* ------------------------------------------------------------------ */
/* Section builder                                                    */
/* ------------------------------------------------------------------ */

/**
 * Staged-menu live paths.
 *
 * For non–super-admin roles, every menu item in `ROLE_MENUS` is rendered
 * as visible-but-inert ("Soon") UNLESS its base path is in this set.
 * Super Admin is not subject to this gate.
 *
 * This is the intentional product behavior: users can see where Blossom OS
 * is going, but only the surfaces below are actually clickable today.
 */
export const STAGED_ROLE_LIVE_PATHS: ReadonlySet<string> = new Set([
  "/home",
  "/home/manage",
  "/org-chart",
  "/academy",
  "/training",
  "/resource-library",
  "/reports",
  "/ai/assistant",
  "/tasks",
]);

/**
 * Role-specific live paths. These are paths that are clickable for a
 * specific role even though they are not in the global staged set.
 *
 * IMPORTANT: Do NOT add intake paths to STAGED_ROLE_LIVE_PATHS — that would
 * make State Director / Assistant State Director / Marketing Intake snapshot
 * links live for those roles before their own role is ready.
 */
export const ROLE_SPECIFIC_LIVE_PATHS: Partial<Record<string, ReadonlySet<string>>> = {
  coo: new Set<string>([
    "/operations/command-center",
    "/command-center",
    "/operations/department-health",
    "/state-operations",
    "/work-queue",
    "/work-queue/escalations",
    "/authorizations/handoff",
    "/admin/integrations",
    "/role-management",
    "/system/request-intake",
    "/phone",
  ]),
  intake_coordinator: new Set<string>([
    "/intake/dashboard",
    "/intake/referral-queue",
    "/intake/lead-to-active",
    "/intake/missing-information",
    "/intake/parent-communication",
    "/intake/tasks",
    "/intake/benefits-cheat-sheets",
    "/phone/ai-calls",
    "/leads",
    "/ai/assistant",
  ]),
  authorization_coordinator: new Set<string>([
    "/authorizations",
    "/authorizations/handoff",
    "/auth-workspace",
    "/ops/expiring-authorizations",
    "/ops/missing-docs",
    "/ops/payer-requirements",
    "/intake/cr-packet-prep",
    "/ai/assistant",
  ]),
  authorization_manager: new Set<string>([
    "/authorizations",
    "/authorizations/handoff",
    "/auth-workspace",
    "/ops/expiring-authorizations",
    "/ops/missing-docs",
    "/ops/payer-requirements",
    "/intake/cr-packet-prep",
    "/ai/assistant",
  ]),
  scheduling_team: new Set<string>([
    "/scheduling",
    "/scheduling-workspace",
    "/scheduling/board",
    "/scheduling/rbts",
    "/scheduling/bcbas",
    "/scheduling/resources",
    "/hr/orientation-queue",
    "/reports",
    "/reports/cancellation-command-center",
    "/ops/make-up-sessions",
  ]),
  scheduling_lead: new Set<string>([
    "/scheduling",
    "/scheduling-workspace",
    "/scheduling/board",
    "/scheduling/rbts",
    "/scheduling/bcbas",
    "/scheduling/resources",
    "/hr/orientation-queue",
    "/reports",
    "/reports/cancellation-command-center",
    "/ops/make-up-sessions",
  ]),
  scheduling_coordinator: new Set<string>([
    "/scheduling",
    "/scheduling-workspace",
    "/scheduling/board",
    "/scheduling/rbts",
    "/scheduling/bcbas",
    "/scheduling/resources",
    "/hr/orientation-queue",
    "/reports",
    "/reports/cancellation-command-center",
    "/ops/make-up-sessions",
  ]),
  staffing_team: new Set<string>([
    "/ops/staffing",
    "/staffing",
    "/ops/rbt-match-queue",
    "/ops/family-staffing-preferences",
  ]),
  staffing_lead: new Set<string>([
    "/ops/staffing",
    "/staffing",
    "/ops/rbt-match-queue",
    "/ops/family-staffing-preferences",
  ]),
  staffing_coordinator: new Set<string>([
    "/ops/staffing",
    "/staffing",
    "/ops/rbt-match-queue",
    "/ops/family-staffing-preferences",
  ]),
  billing_finance: new Set<string>([
    "/billing-finance",
    "/vob-decision-center",
    "/ops/no-oon-benefits",
    "/intake/benefits-cheat-sheets",
    "/intake/cr-packet-prep",
    "/phone",
  ]),
  qa_team: new Set<string>([
    "/qa-team",
    "/qa-workspace",
    "/qa-queue",
    "/qa/board",
    "/qa-clients",
    "/authorization-reviews",
    "/progress-reports",
    "/treatment-plan-reviews",
    "/missing-information",
    "/expiring-items",
    "/assigned-bcbas",
    "/supervision-visibility",
    "/qa-messages",
    "/escalations-followups",
    "/qa/resources",
    "/ops/qa",
  ]),
  qa_director: new Set<string>([
    "/qa-team",
    "/qa-workspace",
    "/qa-queue",
    "/qa/board",
    "/qa-clients",
    "/authorization-reviews",
    "/progress-reports",
    "/treatment-plan-reviews",
    "/missing-information",
    "/expiring-items",
    "/assigned-bcbas",
    "/supervision-visibility",
    "/qa-messages",
    "/escalations-followups",
    "/qa/resources",
    "/ops/qa",
  ]),
  qa_specialist: new Set<string>([
    "/qa-team",
    "/qa-workspace",
    "/qa-queue",
    "/qa/board",
    "/qa-clients",
    "/authorization-reviews",
    "/progress-reports",
    "/treatment-plan-reviews",
    "/missing-information",
    "/expiring-items",
    "/assigned-bcbas",
    "/supervision-visibility",
    "/qa-messages",
    "/escalations-followups",
    "/qa/resources",
    "/ops/qa",
  ]),
  recruiting_team: new Set<string>([
    "/recruiting-team",
    "/recruiting/workspace",
    "/recruiting/academy",
    "/recruiting/pipeline",
    "/recruiting/interviews",
    "/recruiting/offers",
    "/recruiting/onboarding",
    "/recruiting/background",
    "/recruiting/orientation",
    "/recruiting/staffing-needs",
    "/recruiting/rbt",
    "/recruiting/bcba",
    "/recruiting/performance",
    "/recruiting/follow-ups",
    "/recruiting/messages",
    "/recruiting/escalations",
    "/recruiting/resources",
    "/reports",
  ]),
  recruiting_lead: new Set<string>([
    "/recruiting-team",
    "/recruiting/workspace",
    "/recruiting/academy",
    "/recruiting/pipeline",
    "/recruiting/interviews",
    "/recruiting/offers",
    "/recruiting/onboarding",
    "/recruiting/background",
    "/recruiting/orientation",
    "/recruiting/staffing-needs",
    "/recruiting/rbt",
    "/recruiting/bcba",
    "/recruiting/performance",
    "/recruiting/follow-ups",
    "/recruiting/messages",
    "/recruiting/escalations",
    "/recruiting/resources",
    "/reports",
  ]),
  recruiting_coordinator: new Set<string>([
    "/recruiting-team",
    "/recruiting/workspace",
    "/recruiting/academy",
    "/recruiting/pipeline",
    "/recruiting/interviews",
    "/recruiting/offers",
    "/recruiting/onboarding",
    "/recruiting/background",
    "/recruiting/orientation",
    "/recruiting/staffing-needs",
    "/recruiting/rbt",
    "/recruiting/bcba",
    "/recruiting/performance",
    "/recruiting/follow-ups",
    "/recruiting/messages",
    "/recruiting/escalations",
    "/recruiting/resources",
    "/reports",
  ]),
  hr_team: new Set<string>([
    "/hr-team",
    "/hr/workspace",
    "/hr/new-hires",
    "/hr/training-certifications",
    "/hr/compliance",
    "/hr/employee-support",
    "/user-management",
    "/admin/integrations",
    "/academy",
    "/resource-library",
    "/reports",
  ]),
  hr_lead: new Set<string>([
    "/hr-team",
    "/hr/workspace",
    "/hr/new-hires",
    "/hr/training-certifications",
    "/hr/compliance",
    "/hr/employee-support",
    "/user-management",
    "/admin/integrations",
    "/academy",
    "/resource-library",
    "/reports",
  ]),
  training_manager: new Set<string>([
    "/hr/training-center",
    "/admin/training-statistics",
    "/training",
    "/training/rbt-admin",
    "/rbt/training-academy",
    "/bcba/training-academy",
    "/academy",
    "/resource-library",
    "/reports",
  ]),
  office_manager: new Set<string>([
    "/work-queue",
    "/device-inventory",
    "/device-requests",
    "/user-management",
    "/system/request-intake",
    "/academy",
    "/resource-library",
  ]),
  clinic_growth: new Set<string>([
    "/executive/growth-readiness",
    "/leads",
    "/intake",
    "/marketing/state-growth",
    "/authorizations",
    "/recruiting",
    "/hr/new-hires",
    "/admin/training-statistics",
    "/staffing",
    "/reports",
    "/academy",
    "/resource-library",
  ]),
  credentialing_team: new Set<string>([
    "/credentialing",
    "/credentialing/providers",
    "/credentialing/insurance",
    "/credentialing/bcba",
    "/credentialing/uncredentialed-bcbas",
    "/credentialing/expiring",
    "/reports",
  ]),
  credentialing_lead: new Set<string>([
    "/credentialing",
    "/credentialing/providers",
    "/credentialing/insurance",
    "/credentialing/bcba",
    "/credentialing/uncredentialed-bcbas",
    "/credentialing/expiring",
    "/reports",
  ]),
  marketing_team: new Set<string>([
    "/marketing",
    "/marketing/lead-source-inbox",
    "/marketing/lead-sources",
    "/marketing/referral-crm",
    "/patient-journey",
    "/marketing/campaigns",
    "/marketing/call-tracking",
    "/marketing/leadtrap",
    "/marketing/facebook-ads",
    "/marketing/google-ads",
    "/marketing/email-marketing",
    "/marketing/seo",
    "/marketing/web-analytics",
    "/marketing/recruiting",
    "/marketing/outreach",
    "/marketing/reputation",
    "/marketing/attribution",
    "/marketing/state-growth",
    "/reports",
    "/phone",
  ]),
  marketing_growth_lead: new Set<string>([
    "/marketing",
    "/marketing/lead-source-inbox",
    "/marketing/lead-sources",
    "/marketing/referral-crm",
    "/patient-journey",
    "/business-development",
    "/marketing/campaigns",
    "/marketing/call-tracking",
    "/marketing/leadtrap",
    "/marketing/facebook-ads",
    "/marketing/google-ads",
    "/marketing/email-marketing",
    "/marketing/seo",
    "/marketing/web-analytics",
    "/marketing/recruiting",
    "/marketing/outreach",
    "/marketing/reputation",
    "/marketing/attribution",
    "/marketing/state-growth",
    "/reports",
    "/phone",
  ]),
  business_development: new Set<string>([
    "/business-development",
    "/marketing/referral-crm",
    "/reports",
    "/academy",
    "/resource-library",
  ]),
  clinical_director: new Set<string>([
    "/clinical-director",
    "/qa/board",
    "/evaluations",
    "/assigned-bcbas",
    "/supervision-visibility",
    "/escalations-followups",
    "/qa-team",
    "/reports",
    "/phone",
  ]),
  bcba: new Set<string>([
    "/bcba",
    "/bcba/clients",
    "/bcba/workspace",
    "/bcba/supervision",
    "/bcba/parent-training",
    "/bcba/scheduling",
    "/bcba/authorizations",
    "/evaluations",
    "/bcba/resources",
    "/bcba/training-academy",
    "/reports",
  ]),
  case_manager: new Set<string>([
    "/case-manager",
    "/case-manager/families",
    "/case-manager/communication",
    "/case-manager/family-support",
    "/case-manager/follow-ups",
    "/case-manager/scheduling",
    "/case-manager/authorizations",
    "/case-manager/staffing",
    "/case-manager/service-issues",
    "/case-manager/escalations",
    "/case-manager/community",
    "/evaluations",
    "/case-manager/resources",
    "/phone",
  ]),
  rbt: new Set<string>([
    "/rbt/my-day",
    "/rbt/clients",
    "/rbt/schedule",
    "/rbt/session-support",
    "/rbt/supervision",
    "/rbt/training-academy",
    "/rbt/readiness",
    "/rbt/messages",
    "/rbt/resources",
    "/rbt/help",
  ]),
  behavioral_support: new Set<string>([
    "/behavioral-support",
    "/behavioral-support/crisis-support",
    "/behavioral-support/escalations",
    "/behavioral-support/support-plans",
    "/behavioral-support/follow-ups",
    "/behavioral-support/supervision-visibility",
    "/behavioral-support/evaluations",
    "/evaluations",
    "/reports",
    "/phone",
  ]),
  executive_leadership: new Set<string>([
    "/executive",
    "/command-center",
    "/reports",
    "/state-operations",
    "/marketing/state-growth",
    "/operations/command-center",
    "/operations/department-health",
    "/operations/escalations",
    "/system/request-intake",
    "/org-chart",
    "/phone",
    "/academy",
    "/resource-library",
  ]),
  operations_leadership: new Set<string>([
    "/operations/command-center",
    "/command-center",
    "/operations/department-health",
    "/state-operations",
    "/operations/escalations",
    "/operations/workflow-risks",
    "/work-queue",
    "/work-queue/escalations",
    "/system/request-intake",
    "/reports",
    "/phone",
  ]),
  state_director: new Set<string>([
    "/state-operations",
    "/ops/state-escalations",
    "/ops/tasks",
    "/ops/staffing",
    "/intake/dashboard",
    "/authorizations",
    "/authorizations/handoff",
    "/intake/lead-to-active",
    "/marketing/state-growth",
    "/recruiting/staffing-needs",
    "/ops/scheduling",
    "/qa-team",
    "/phone",
    "/training",
    "/resource-library",
    "/reports",
    // Redirect targets used by menu items above must also be treated as live
    // so the shell never renders the "coming soon" banner after redirect.
    "/scheduling-workspace",
    "/ops/family-staffing-preferences",
  ]),
  assistant_state_director: new Set<string>([
    "/state-operations",
    "/intake/dashboard",
    "/ops/tasks",
    "/ops/state-escalations",
    "/ops/staffing",
    "/ops/scheduling",
    "/authorizations",
    "/intake/parent-communication",
    "/intake/missing-information",
    "/intake/lead-to-active",
    "/recruiting/pipeline",
    "/training",
    "/resource-library",
    "/reports",
    "/scheduling-workspace",
    "/ops/family-staffing-preferences",
    "/qa-team",
  ]),
  state_va: new Set<string>([
    "/state-operations",
    "/ops/tasks",
    "/intake/tasks",
    "/intake/missing-information",
    "/intake/parent-communication",
    "/intake/lead-to-active",
    "/recruiting/pipeline",
    "/training",
    "/resource-library",
    "/reports",
  ]),
  regional_state_director: new Set<string>([
    "/state-operations",
    "/ops/state-escalations",
    "/ops/tasks",
    "/intake/lead-to-active",
    "/marketing/state-growth",
    "/training",
    "/resource-library",
    "/reports",
  ]),
};

export function isPathLiveForRole(role: string, basePath: string): boolean {
  if (STAGED_ROLE_LIVE_PATHS.has(basePath)) return true;
  return ROLE_SPECIFIC_LIVE_PATHS[role]?.has(basePath) ?? false;
}

function buildSectionsForRole(role: string): NavSection[] {
  if (role === "super_admin") return SUPER_ADMIN_SECTIONS;

  const menu =
    (ROLE_MENUS as Record<string, typeof DEFAULT_ROLE_MENU>)[role] ??
    DEFAULT_ROLE_MENU;

  return menu.sections.map((s) => ({
    id: s.id,
    label: s.label,
    defaultCollapsed: s.defaultCollapsed,
    items: s.items.map((i) => {
      const basePath = i.path.split("?")[0];
      return {
        to: i.path,
        label: i.label,
        icon: i.icon,
        // Always exact-match. Menu items in this shell are leaves, so hub
        // paths like "/marketing" must not stay highlighted on siblings
        // such as "/marketing/lead-sources".
        end: true,
        disabled: !isPathLiveForRole(role, basePath),
      };
    }),
  }));
}

/* ------------------------------------------------------------------ */
/* OSShell                                                            */
/* ------------------------------------------------------------------ */

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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const headerSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!headerSearchRef.current) return;
      if (!headerSearchRef.current.contains(e.target as Node)) setHeaderSearchOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const { signOut, avatarUrl, displayName } = useAuth();
  const { role, platform } = useOSRole();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Right rail toggle persistence per page.
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

  // CmdK palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sections = useMemo(() => buildSectionsForRole(role), [role]);

  const mobileSections = (() => {
    const q = mobileSearch.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  })();

  // Persisted open/closed state, scoped per role.
  const SECTIONS_KEY = `os.sidebar.openSections.${role}`;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const defaults: Record<string, boolean> = {};
    sections.forEach((s, idx) => {
      const isActive = s.items.some((i) => i.end ? pathname === i.to : pathname.startsWith(i.to.split("?")[0]));
      defaults[s.id] = isActive || (!s.defaultCollapsed) || idx === 0;
    });
    let stored: Record<string, boolean> = {};
    try { stored = JSON.parse(window.localStorage.getItem(SECTIONS_KEY) || "{}"); } catch { /* ignore */ }
    setOpenSections({ ...defaults, ...stored });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);
  useEffect(() => {
    if (Object.keys(openSections).length === 0) return;
    try { window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(openSections)); } catch { /* ignore */ }
  }, [openSections, SECTIONS_KEY]);
  const toggleSection = (id: string) => setOpenSections((m) => ({ ...m, [id]: !m[id] }));

  const allItems = sections.flatMap((s) => s.items);

  const homeForRole = ROLE_HOME[role] ?? "/dashboard";
  const isStateTrainingRole =
    role === "state_director" || role === "assistant_state_director" || role === "state_va" || role === "regional_state_director";
  const trainingPath = isStateTrainingRole ? "/training" : "/academy";
  const bottomNav: NavEntry[] = [
    { to: "/home", label: "Home", icon: Home, end: true },
    { to: "/ai/assistant", label: "Blossom AI", icon: Sparkles },
    { to: "/tasks", label: "Tasks", icon: CheckSquare },
    { to: trainingPath, label: "Training", icon: GraduationCap },
    { to: "/resource-library", label: "Resources", icon: BookOpen },
    { to: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const renderNavItem = (item: NavEntry, onClick?: () => void) => {
    // Menu items are live when their base path is in the global staged set
    // (STAGED_ROLE_LIVE_PATHS — Training Academy, Resource Library, Reports)
    // OR in the role-specific live set (ROLE_SPECIFIC_LIVE_PATHS). Roles that
    // have fully launched (e.g. Executive Leadership, Operations Leadership,
    // State Director) have their full working menu clickable; everything else
    // still renders as an inert "Coming Soon" entry — visible but not
    // clickable — so users can preview where Blossom OS is going.
    if (item.disabled) {
      const inert = (
        <div
          key={`${item.to}-${item.label}-disabled`}
          aria-disabled="true"
          title="Coming soon"
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-foreground/45 cursor-not-allowed select-none",
            collapsed && "h-10 w-10 justify-center px-0 ring-1 ring-border/50 bg-card/60",
          )}
        >
          <item.icon className="h-[16px] w-[16px] shrink-0 text-current" strokeWidth={collapsed ? 2.35 : 2} />
          {!collapsed && (
            <>
              <span className="truncate">{item.label}</span>
              <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Soon
              </span>
            </>
          )}
        </div>
      );
      if (!collapsed) return inert;
      return (
        <Tooltip key={`${item.to}-${item.label}-disabled`} delayDuration={120}>
          <TooltipTrigger asChild>{inert}</TooltipTrigger>
          <TooltipContent side="right" className="text-[12px] font-medium">
            {item.label} · Coming soon
          </TooltipContent>
        </Tooltip>
      );
    }
    const link = (
      <NavLink
        key={`${item.to}-${item.label}`}
        to={item.to}
        end={item.end}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all text-foreground",
            collapsed && "h-10 w-10 justify-center px-0 ring-1",
            isActive
              ? collapsed
                ? "bg-primary/10 text-primary ring-primary/25 shadow-[0_10px_24px_-18px_hsl(var(--primary)/0.7)]"
                : "bg-primary text-primary-foreground shadow-[0_10px_26px_-12px_hsl(var(--primary)/0.6)]"
              : collapsed
              ? "bg-card/80 text-primary ring-border/70 hover:bg-primary/10 hover:text-primary hover:ring-primary/25"
              : "text-foreground/80 hover:bg-foreground/[0.04] hover:text-foreground",
          )
        }
      >
        <item.icon className="h-[16px] w-[16px] shrink-0 text-current" strokeWidth={collapsed ? 2.35 : 2} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
    if (!collapsed) return link;
    return (
      <Tooltip key={`${item.to}-${item.label}`} delayDuration={120}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-[12px] font-medium">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <BlossomAIProvider>
    <div className="min-h-screen w-full os-bg text-foreground md:h-screen md:overflow-hidden">
      <div className="mx-auto flex max-w-[1680px] gap-4 p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-5 md:pb-5 md:items-start">
        {/* MOBILE MENU */}
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
                  <Search className="pointer-events-none absolute z-10 left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60" strokeWidth={2.25} />
                  <input
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Search menu..."
                    aria-label="Search menu"
                    className="os-glass-input h-10 w-full rounded-2xl pl-10 pr-3 text-[13.5px] focus:outline-none"
                  />
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    {renderNavItem({ to: "/home", label: "Company Home", icon: Home, end: true }, () => { setMobileOpen(false); setMobileSearch(""); })}
                    {renderNavItem({ to: "/ai/assistant", label: "Blossom AI", icon: Sparkles }, () => { setMobileOpen(false); setMobileSearch(""); })}
                  </div>
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
                    No menu matches for "{mobileSearch.trim()}".
                  </p>
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
              src={collapsed ? blossomMark : blossomLogo}
              alt={collapsed ? "Blossom" : "Blossom ABA Therapy"}
              className={cn("object-contain transition-all duration-300", collapsed ? "h-9 w-9" : "h-11 w-auto")}
            />
          </NavLink>

          <nav className={cn("os-sidebar-scroll flex-1 overflow-y-auto px-3 pb-3", collapsed ? "pt-4" : "pt-2")}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-1.5">
                {renderNavItem({ to: "/home", label: "Company Home", icon: Home, end: true })}
                {renderNavItem({ to: "/ai/assistant", label: "Blossom AI", icon: Sparkles })}
                <div className="my-2 h-px w-8 bg-foreground/[0.08]" />
                {allItems.map((item) => renderNavItem(item))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mb-2 space-y-0.5">
                  {renderNavItem({ to: "/home", label: "Company Home", icon: Home, end: true })}
                  {renderNavItem({ to: "/ai/assistant", label: "Blossom AI", icon: Sparkles })}
                </div>
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
          <header className="flex items-center gap-3 py-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="os-glass-icon h-11 w-11 shrink-0 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>
            <div ref={headerSearchRef} className="relative hidden flex-1 md:block">
              <div className="os-glass-input flex h-11 w-full items-center gap-3 rounded-2xl pl-4 pr-2 text-[13.5px]">
                <Search className="h-[18px] w-[18px] shrink-0 text-foreground/70" strokeWidth={2.25} />
                <input
                  type="text"
                  value={headerSearch}
                  onChange={(e) => { setHeaderSearch(e.target.value); setHeaderSearchOpen(true); }}
                  onFocus={() => setHeaderSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setHeaderSearchOpen(false); (e.target as HTMLInputElement).blur(); }
                    if (e.key === "Enter") {
                      const q = headerSearch.trim().toLowerCase();
                      if (!q) return;
                      for (const s of sections) {
                        const hit = s.items.find((i) => !i.disabled && i.label.toLowerCase().includes(q));
                        if (hit) { navigate(hit.to); setHeaderSearchOpen(false); setHeaderSearch(""); break; }
                      }
                    }
                  }}
                  placeholder="Search everything..."
                  aria-label="Search Blossom OS"
                  className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                />
                {headerSearch && (
                  <button
                    type="button"
                    onClick={() => { setHeaderSearch(""); setHeaderSearchOpen(false); }}
                    className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>
              {headerSearchOpen && headerSearch.trim() && (() => {
                const q = headerSearch.trim().toLowerCase();
                const filtered = sections
                  .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)) }))
                  .filter((s) => s.items.length > 0);
                return (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[60vh] overflow-y-auto rounded-2xl border border-border/60 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                    {filtered.length === 0 ? (
                      <div className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                        No results for "{headerSearch.trim()}".
                      </div>
                    ) : (
                      filtered.map((section) => (
                        <div key={section.id} className="px-1 py-1">
                          <div className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                            {section.label}
                          </div>
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={`${section.id}-${item.to}-${item.label}`}
                                type="button"
                                disabled={item.disabled}
                                aria-disabled={item.disabled || undefined}
                                onClick={() => {
                                  if (item.disabled) return;
                                  navigate(item.to);
                                  setHeaderSearchOpen(false);
                                  setHeaderSearch("");
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-foreground hover:bg-muted/60",
                                  item.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{item.label}</span>
                                {item.disabled && (
                                  <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Soon</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex-1 md:hidden" />
            <OSNotificationsBell />
            <Tooltip delayDuration={120}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/home")}
                  className="os-glass-icon inline-flex"
                  aria-label="Company home"
                >
                  <Home className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[12px] font-medium">
                Company Home
              </TooltipContent>
            </Tooltip>
            <WorkingAsSelector />
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
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-xl object-cover ring-1 ring-border" />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[11px] font-bold text-primary-foreground">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
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
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate("/auth");
                  }}
                  className="text-destructive focus:bg-destructive focus:text-white"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* CONTENT */}
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
      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-3 mb-3 os-glass-panel grid grid-cols-5 gap-1 p-1.5">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition-all",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
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

      {/* COMMAND PALETTE */}
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search pages, modules, dashboards..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {sections.map((section, idx) => (
            <div key={section.id}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={section.label}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={`${section.id}-${item.to}-${item.label}`}
                      value={`${section.label} ${item.label} ${item.to}`}
                      disabled={item.disabled}
                      onSelect={() => {
                        if (item.disabled) return;
                        setPaletteOpen(false);
                        navigate(item.to);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{item.label}</span>
                      {item.disabled && (
                        <span className="ml-auto text-[10.5px] uppercase tracking-wider text-muted-foreground">Soon</span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
      <FloatingEscalationChat />
      <TrainingProgressCloudBridge />
    </div>
    </BlossomAIProvider>
  );
}

// Silence unused-import warnings while keeping the icon set stable across the
// shell variants we render in different modes (sidebar, mobile, palette).
void [
  Users, Heart, UserCog, FolderKanban, GraduationCap,
  Wallet, Briefcase, Building2, IdCard, KeyRound, Smartphone,
  Stethoscope, BookUser, Activity, Bug, MonitorSmartphone,
  XCircle, CheckCircle2, ListTodo, Inbox, Workflow, MapPin,
  Megaphone, TrendingUp, FileCheck2, Users2, ChevronRight,
  Radio, HeartHandshake, Headphones, UserPlus, Phone, FileText,
];