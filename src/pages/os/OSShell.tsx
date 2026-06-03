import { ReactNode, useEffect, useRef, useState } from "react";
import { OSNotificationsBell } from "@/components/os/OSNotificationsBell";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, Users, Heart, UserCog, CalendarDays, ClipboardList,
  FolderKanban, DollarSign, BarChart3, GraduationCap, Building2, Settings,
  Search, Bell, Sparkles, ChevronLeft, History, ChevronRight, ChevronDown,
  Menu, X, ShieldCheck, Home, Radio, BellRing, FileCheck2, Users2, BadgeCheck,
  Briefcase, ClipboardCheck, Wallet, TrendingUp, ShieldAlert, Activity, Target,
  Workflow, BookOpen, Megaphone, PieChart, LifeBuoy, Inbox, AlertTriangle,
  KanbanSquare, Bot, Brain, Zap, Wand2, MapPin, UserPlus, Headphones,
  HeartHandshake, Globe, Hash, Star,
  LineChart, PhoneCall, Gauge, Database, Moon,
  Plug, Network, MonitorSmartphone,
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
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { LogOut } from "lucide-react";
import type { OSModule } from "@/lib/os/permissions";
import { ROLE_HOME, ALL_ROLE_DASHBOARDS } from "@/lib/os/roleHome";
import blossomLogo from "@/assets/blossom-logo-color.png";
import blossomMark from "@/assets/blossom-flower-mark.png";

type NavEntry = { to: string; label: string; icon: typeof LayoutDashboard; module: OSModule; end?: boolean; disabled?: boolean };

const PHONE_SYSTEM_SECTION: NavSection = {
  id: "phone_system",
  label: "Phone System",
  items: [
    { to: "/phone", label: "Phone Dashboard", icon: PhoneCall, module: "phone_system", end: true },
    { to: "/phone/lookup", label: "Extension Lookup", icon: Search, module: "phone_system" },
    { to: "/phone/directory", label: "Routing Directory", icon: Headphones, module: "phone_system" },
    { to: "/phone/requests", label: "Change Requests", icon: ClipboardList, module: "phone_system" },
    { to: "/phone/ai-calls", label: "After-Hours AI Calls", icon: Moon, module: "phone_system" },
  ],
};
type NavSection = { id: string; label: string; items: NavEntry[] };

const HOME_EXTRAS: NavEntry[] = [
  { to: "/command-center", label: "Command Center", icon: Radio, module: "command_center" },
  { to: "/training", label: "Training Academy", icon: GraduationCap, module: "training" },
];

const INTAKE_WORKSPACE_ITEM: NavEntry = {
  to: "/intake", label: "Intake Workspace", icon: ClipboardList, module: "intake",
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "intake_clients", label: "Intake & Clients", items: [
      { to: "/leads", label: "Leads", icon: Users, module: "leads" },
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
      { to: "/sop", label: "Resource Library", icon: BookOpen, module: "sop" },
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
    id: "hr_operations",
    label: "HR Operations",
    items: [
      { to: "/user-management", label: "User Management", icon: Users2, module: "user_management" },
      { to: "/admin/device-inventory", label: "Device Inventory", icon: MonitorSmartphone, module: "user_management" },
      { to: "/hr", label: "HR Suite", icon: Building2, module: "hr" },
      { to: "/hr/training-center", label: "Training Management", icon: GraduationCap, module: "hr" },
    ],
  },
  {
    id: "phone_system", label: "Phone System", items: PHONE_SYSTEM_SECTION.items,
  },
  {
    id: "system", label: "System", items: [
      { to: "/state-management", label: "State Management", icon: MapPin, module: "state_management" },
      { to: "/settings", label: "Settings", icon: Settings, module: "settings" },
      { to: "/permissions", label: "Permissions", icon: ShieldCheck, module: "permissions" },
      { to: "/integrations", label: "Integrations", icon: Plug, module: "integrations" },
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
  const { user, signOut, avatarUrl, displayName } = useAuth();
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
  
  const showOldVersion = platform("accessOldVersion");

  // Global ⌘K / Ctrl+K search shortcut
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

  // Build the Home section dynamically based on the current role.
  const homeSection: NavSection = (() => {
    const items: NavEntry[] = [];
    if (role === "super_admin") {
      // Super admins see the generic dashboard plus quick access to every role dashboard.
      items.push({ to: "/", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true });
      ALL_ROLE_DASHBOARDS.forEach((d) => {
        items.push({ to: d.to, label: d.label, icon: Target, module: "dashboard" });
      });
    }
    // For non super_admin roles we intentionally omit a synthetic "Dashboard"
    // entry — their landing page already lives elsewhere in the sidebar (e.g.
    // Training Academy, Evaluations) and a duplicate route would cause two
    // items to highlight at once.
    // Intake Workspace lives in Home for everyone who can see intake.
    items.push(INTAKE_WORKSPACE_ITEM);
    HOME_EXTRAS.forEach((e) => {
      items.push(e);
    });
    return { id: "home", label: "Home", items };
  })();

  // Scheduling Team gets a curated, focused operational menu.
  const SCHEDULING_TEAM_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/scheduling-team", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true },
        { to: "/scheduling-workspace", label: "Scheduling Workspace", icon: Workflow, module: "scheduling" },
        { to: "/training", label: "Training Academy", icon: GraduationCap, module: "training" },
      ],
    },
    {
      id: "staffing_scheduling", label: "Staffing & Scheduling", items: [
        { to: "/staffing", label: "Staffing Queue", icon: UserPlus, module: "scheduling" },
        { to: "/scheduling", label: "Scheduling", icon: CalendarDays, module: "scheduling" },
        { to: "/clients", label: "Clients", icon: Heart, module: "clients" },
        { to: "/staff", label: "BCBA / RBT", icon: UserCog, module: "staff" },
        { to: "/authorizations", label: "Authorizations", icon: FileCheck2, module: "authorizations" },
      ],
    },
    {
      id: "resources", label: "Resources", items: [
        { to: "/scheduling/resources", label: "Resource Library", icon: BookOpen, module: "sop" },
      ],
    },
    {
      id: "performance", label: "Operations & Intelligence", items: [
        { to: "/kpi", label: "KPI Tracking", icon: Target, module: "dashboard" },
      ],
    },
    {
      id: "ai", label: "AI", items: [
        { to: "/ai/assistant", label: "Ask Blossom AI", icon: Bot, module: "ai_assistant" },
      ],
    },
  ];

  // BCBA gets a curated clinical menu focused on their caseload.
  const BCBA_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/bcba", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true },
        { to: "/bcba/workspace", label: "BCBA Workspace", icon: Workflow, module: "dashboard" },
        { to: "/bcba/training-academy", label: "Training Academy", icon: GraduationCap, module: "training" },
      ],
    },
    {
      id: "clients_clinical", label: "Clients & Clinical", items: [
        { to: "/bcba/clients", label: "Clients", icon: Heart, module: "clients" },
        { to: "/bcba/authorizations", label: "Authorizations", icon: FileCheck2, module: "authorizations" },
        { to: "/bcba/supervision", label: "Supervision", icon: ClipboardCheck, module: "evaluations" },
        { to: "/bcba/parent-training", label: "Parent Training", icon: HeartHandshake, module: "clients" },
        { to: "/bcba/scheduling", label: "Scheduling", icon: CalendarDays, module: "scheduling" },
      ],
    },
    {
      id: "resources", label: "Resources", items: [
        { to: "/bcba/resources", label: "Resource Library", icon: BookOpen, module: "sop" },
      ],
    },
    {
      id: "performance", label: "Operations & Intelligence", items: [
        { to: "/kpi", label: "KPI Tracking", icon: Target, module: "dashboard" },
      ],
    },
    {
      id: "ai", label: "AI", items: [
        { to: "/ai/assistant", label: "Ask Blossom AI", icon: Bot, module: "ai_assistant" },
      ],
    },
  ];

  // RBT gets a focused daily-support menu — assignment-scoped, mobile-first.
  const RBT_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/rbt", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true },
        { to: "/rbt/my-day", label: "My Day", icon: Radio, module: "dashboard" },
        { to: "/rbt/training-academy", label: "Training Academy", icon: GraduationCap, module: "training" },
      ],
    },
    {
      id: "clients_sessions", label: "Clients & Sessions", items: [
        { to: "/rbt/clients", label: "My Clients", icon: Heart, module: "clients" },
        { to: "/rbt/schedule", label: "My Schedule", icon: CalendarDays, module: "scheduling" },
        { to: "/rbt/session-support", label: "Session Support", icon: LifeBuoy, module: "sop" },
        { to: "/rbt/supervision", label: "Supervision", icon: ClipboardCheck, module: "evaluations" },
      ],
    },
    {
      id: "communication", label: "Communication", items: [
        { to: "/rbt/messages", label: "Messages & Updates", icon: BellRing, module: "dashboard" },
        { to: "/rbt/help", label: "Need Help / Escalations", icon: AlertTriangle, module: "dashboard" },
      ],
    },
    {
      id: "resources", label: "Resources", items: [
        { to: "/rbt/resources", label: "Resource Library", icon: BookOpen, module: "sop" },
      ],
    },
    {
      id: "performance", label: "Operations & Intelligence", items: [
        { to: "/kpi", label: "KPI Tracking", icon: Target, module: "dashboard" },
      ],
    },
    {
      id: "ai", label: "AI", items: [
        { to: "/ai/assistant", label: "Ask Blossom AI", icon: Bot, module: "ai_assistant" },
      ],
    },
  ];

  // Payroll Coordinator gets a focused payroll operations menu.
  const PAYROLL_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/payroll-coordinator", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true, disabled: true },
        { to: "/payroll/workspace", label: "Payroll Workspace", icon: Workflow, module: "payroll", disabled: true },
        { to: "/payroll/training-academy", label: "Training Academy", icon: GraduationCap, module: "training", disabled: true },
      ],
    },
    {
      id: "payroll_operations", label: "Payroll Operations", items: [
        { to: "/payroll/queue", label: "Payroll Queue", icon: KanbanSquare, module: "payroll", disabled: true },
        { to: "/payroll/adjustments", label: "Payroll Adjustments", icon: Wallet, module: "payroll", disabled: true },
        { to: "/payroll/time-attendance", label: "Time & Attendance", icon: CalendarDays, module: "payroll", disabled: true },
        { to: "/payroll/issues", label: "Payroll Issues", icon: AlertTriangle, module: "payroll", disabled: true },
      ],
    },
    {
      id: "employees", label: "Employees", items: [
        { to: "/payroll/profiles", label: "Employee Payroll Profiles", icon: Users, module: "payroll", disabled: true },
        { to: "/payroll/pto", label: "PTO & Time Off", icon: Heart, module: "payroll", disabled: true },
        { to: "/payroll/benefits", label: "Benefits & Deductions", icon: Briefcase, module: "payroll", disabled: true },
      ],
    },
    {
      id: "compliance", label: "Compliance", items: [
        { to: "/payroll/compliance", label: "Payroll Compliance", icon: ShieldCheck, module: "payroll", disabled: true },
        { to: "/payroll/tax-documents", label: "Tax Documents & Records", icon: FileCheck2, module: "payroll", disabled: true },
      ],
    },
    {
      id: "communication", label: "Communication", items: [
        { to: "/payroll/messages", label: "Payroll Messages & Updates", icon: BellRing, module: "payroll", disabled: true },
      ],
    },
    {
      id: "resources", label: "Resources", items: [
        { to: "/reports", label: "Reports", icon: BarChart3, module: "reports" },
        { to: "/payroll/resources", label: "Resource Library", icon: BookOpen, module: "sop", disabled: true },
      ],
    },
  ];

  // Operations Leadership gets a calm, executive-focused menu.
  const OPS_LEADERSHIP_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/operations", label: "Executive Dashboard", icon: LayoutDashboard, module: "dashboard", end: true },
        { to: "/operations/command-center", label: "Operations Command Center", icon: Radio, module: "dashboard" },
        { to: "/operations/briefing", label: "Leadership Briefing", icon: Sparkles, module: "dashboard" },
      ],
    },
    {
      id: "oversight", label: "Operations Oversight", items: [
        { to: "/operations/department-health", label: "Department Health", icon: Activity, module: "dashboard" },
        { to: "/operations/workflow-risks", label: "Workflow Risks", icon: ShieldAlert, module: "dashboard" },
        { to: "/operations/escalations", label: "Escalations & Blockers", icon: AlertTriangle, module: "dashboard" },
      ],
    },
    {
      id: "people", label: "People & Performance", items: [
        { to: "/operations/accountability", label: "Team Accountability", icon: ClipboardCheck, module: "dashboard" },
        { to: "/operations/staffing-capacity", label: "Staffing & Capacity", icon: Users2, module: "dashboard" },
        { to: "/operations/training-adoption", label: "Training & Adoption", icon: GraduationCap, module: "dashboard" },
      ],
    },
    {
      id: "communication", label: "Communication", items: [
        { to: "/operations/updates", label: "Leadership Updates", icon: BellRing, module: "dashboard" },
      ],
    },
    {
      id: "resources", label: "Resources", items: [
        { to: "/operations/resources", label: "Resource Library", icon: BookOpen, module: "dashboard" },
      ],
    },
    {
      id: "ai", label: "AI", items: [
        { to: "/ai/assistant", label: "Ask Blossom AI", icon: Bot, module: "ai_assistant" },
      ],
    },
  ];

  const EXEC_LEADERSHIP_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/executive", label: "Executive Overview", icon: LayoutDashboard, module: "dashboard", end: true },
        { to: "/executive/pulse", label: "Company Pulse", icon: Activity, module: "dashboard" },
        { to: "/executive/briefing", label: "Executive Briefing", icon: Sparkles, module: "dashboard" },
      ],
    },
    {
      id: "oversight", label: "Organizational Oversight", items: [
        { to: "/executive/organizational-health", label: "Organizational Health", icon: Activity, module: "dashboard" },
        { to: "/executive/strategic-risks", label: "Strategic Risks", icon: ShieldAlert, module: "dashboard" },
        { to: "/executive/growth-readiness", label: "Growth & Readiness", icon: TrendingUp, module: "dashboard" },
      ],
    },
    {
      id: "people", label: "People & Operations", items: [
        { to: "/executive/leadership-accountability", label: "Leadership Accountability", icon: ClipboardCheck, module: "dashboard" },
        { to: "/executive/staffing-expansion", label: "Staffing & Expansion", icon: Users2, module: "dashboard" },
        { to: "/executive/operational-consistency", label: "Operational Consistency", icon: Workflow, module: "dashboard" },
      ],
    },
    {
      id: "communication", label: "Communication", items: [
        { to: "/executive/updates", label: "Executive Updates", icon: BellRing, module: "dashboard" },
      ],
    },
    {
      id: "resources", label: "Resources", items: [
        { to: "/executive/resources", label: "Resource Library", icon: BookOpen, module: "dashboard" },
      ],
    },
    {
      id: "ai", label: "AI", items: [
        { to: "/ai/assistant", label: "Ask Blossom AI", icon: Bot, module: "ai_assistant" },
      ],
    },
  ];

  const MARKETING_TEAM_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/marketing", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true, disabled: true },
        { to: "/marketing/training", label: "Training Academy", icon: GraduationCap, module: "training" },
      ],
    },
    {
      id: "growth", label: "Growth & Marketing", items: [
        { to: "/marketing/campaigns", label: "Campaigns", icon: Megaphone, module: "dashboard", disabled: true },
        { to: "/marketing/lead-sources", label: "Lead Sources", icon: TrendingUp, module: "dashboard", disabled: true },
        { to: "/marketing/seo", label: "SEO & Content", icon: Globe, module: "dashboard", disabled: true },
        { to: "/marketing/web-analytics", label: "Web Analytics", icon: LineChart, module: "dashboard", disabled: true },
        { to: "/marketing/call-tracking", label: "Call Tracking", icon: PhoneCall, module: "dashboard", disabled: true },
      ],
    },
    {
      id: "relationships", label: "Relationships", items: [
        { to: "/marketing/referrals", label: "Referrals", icon: HeartHandshake, module: "dashboard", disabled: true },
        { to: "/marketing/recruiting", label: "Recruiting Marketing", icon: UserPlus, module: "dashboard", disabled: true },
        { to: "/marketing/outreach", label: "Community Outreach", icon: Users2, module: "dashboard", disabled: true },
        { to: "/marketing/reputation", label: "Reputation", icon: Star, module: "dashboard", disabled: true },
      ],
    },
    {
      id: "intelligence", label: "Intelligence & ROI", items: [
        { to: "/marketing/attribution", label: "Attribution & ROI", icon: Gauge, module: "dashboard", disabled: true },
        { to: "/marketing/state-growth", label: "State Growth", icon: MapPin, module: "dashboard", disabled: true },
      ],
    },
    {
      id: "ops_intelligence", label: "Operations & Intelligence", items: [
        { to: "/reports", label: "Reports", icon: BarChart3, module: "reports" },
        { to: "/kpi", label: "KPI Tracking", icon: Target, module: "dashboard", disabled: true },
      ],
    },
    PHONE_SYSTEM_SECTION,
  ];

  // Case Manager — warm, supportive, family-relationship oriented.
  const CASE_MANAGER_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/case-manager", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true },
        { to: "/case-manager/training", label: "Training Academy", icon: GraduationCap, module: "training" },
      ],
    },
    {
      id: "family_relationships", label: "Family Relationships", items: [
        { to: "/case-manager/families",      label: "Assigned Families",     icon: Users,          module: "clients" },
        { to: "/case-manager/communication", label: "Parent Communication",  icon: BellRing,       module: "clients" },
        { to: "/case-manager/family-support",label: "Family Support",        icon: HeartHandshake, module: "clients" },
        { to: "/case-manager/follow-ups",    label: "Progress & Follow-Ups", icon: Activity,       module: "clients" },
      ],
    },
    {
      id: "operations", label: "Operations", items: [
        { to: "/case-manager/scheduling",     label: "Scheduling Coordination",   icon: CalendarDays,  module: "scheduling" },
        { to: "/case-manager/authorizations", label: "Authorizations Visibility", icon: FileCheck2,    module: "authorizations" },
        { to: "/case-manager/staffing",       label: "Staffing Coordination",     icon: UserCog,       module: "staff" },
        { to: "/case-manager/service-issues", label: "Service Issues",            icon: AlertTriangle, module: "clients" },
        { to: "/case-manager/escalations",    label: "Escalations",               icon: ShieldAlert,   module: "clients" },
      ],
    },
    {
      id: "community_support", label: "Community & Support", items: [
        { to: "/case-manager/community", label: "Community Referrals", icon: Globe,    module: "sop" },
        { to: "/case-manager/resources", label: "Resource Library",    icon: BookOpen, module: "sop" },
      ],
    },
    {
      id: "ai", label: "AI & Automations", items: [
        { to: "/ai/assistant", label: "Ask Blossom AI", icon: Bot, module: "ai_assistant" },
      ],
    },
  ];

  // HR Team — focused workforce menu. Only Evaluations is active; everything
  // else is disabled and shown as Coming Soon.
  const HR_TEAM_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/hr", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true, disabled: true },
      ],
    },
    {
      id: "workforce", label: "Workforce", items: [
        { to: "/staff", label: "BCBA / RBT", icon: UserCog, module: "staff", disabled: true },
        { to: "/employee-ops", label: "Employee Ops", icon: Briefcase, module: "employee_ops", disabled: true },
        { to: "/evaluations", label: "Evaluations", icon: ClipboardCheck, module: "evaluations" },
      ],
    },
    {
      id: "resources", label: "Resources", items: [
        { to: "/hr/org-chart", label: "Org Chart", icon: Network, module: "hr", disabled: true },
        { to: "/reports", label: "Reports", icon: BarChart3, module: "reports" },
        { to: "/hr/training-academy", label: "Training Academy", icon: GraduationCap, module: "training" },
        { to: "/sop", label: "Resource Library", icon: BookOpen, module: "sop", disabled: true },
      ],
    },
    PHONE_SYSTEM_SECTION,
    {
      id: "hr_ops", label: "HR Operations", items: [
        { to: "/user-management", label: "User Management", icon: Users2, module: "user_management" },
        { to: "/admin/device-inventory", label: "Device Inventory", icon: MonitorSmartphone, module: "user_management" },
        { to: "/hr/org-chart/manage", label: "Org Chart Settings", icon: Network, module: "hr", disabled: true },
        { to: "/payroll", label: "Payroll", icon: Wallet, module: "payroll", disabled: true },
        { to: "/hr", label: "HR Suite", icon: Building2, module: "hr", disabled: true },
        { to: "/hr/training-center", label: "Training Management", icon: GraduationCap, module: "hr" },
      ],
    },
  ];

  // QA Team — only Evaluations and Reports are active. Everything else is
  // disabled and shown as Coming Soon.
  const QA_TEAM_SECTIONS: NavSection[] = [
    {
      id: "home", label: "Home", items: [
        { to: "/", label: "Dashboard", icon: LayoutDashboard, module: "dashboard", end: true, disabled: true },
      ],
    },
    {
      id: "quality", label: "Quality & Compliance", items: [
        { to: "/evaluations", label: "Evaluations", icon: ClipboardCheck, module: "evaluations" },
        { to: "/reports", label: "Reports", icon: BarChart3, module: "reports" },
      ],
    },
    {
      id: "records", label: "Records", items: [
        { to: "/clients", label: "Clients", icon: Heart, module: "clients", disabled: true },
        { to: "/cases", label: "Cases", icon: FolderKanban, module: "cases", disabled: true },
        { to: "/authorizations", label: "Authorizations", icon: FileCheck2, module: "authorizations", disabled: true },
        { to: "/staff", label: "BCBA / RBT", icon: UserCog, module: "staff", disabled: true },
      ],
    },
    {
      id: "resources", label: "Resources", items: [
        { to: "/sop", label: "Resource Library", icon: BookOpen, module: "sop", disabled: true },
        { to: "/kpi", label: "KPI Tracking", icon: Target, module: "kpi", disabled: true },
      ],
    },
  ];

  let sections: NavSection[] = role === "executive_leadership"
    ? EXEC_LEADERSHIP_SECTIONS
    : role === "marketing_team"
    ? MARKETING_TEAM_SECTIONS
    : role === "scheduling_team"
    ? SCHEDULING_TEAM_SECTIONS
    : role === "bcba"
    ? BCBA_SECTIONS
    : role === "rbt"
    ? RBT_SECTIONS
    : role === "payroll_coordinator"
    ? PAYROLL_SECTIONS
    : role === "operations_leadership"
    ? OPS_LEADERSHIP_SECTIONS
    : role === "case_manager"
    ? CASE_MANAGER_SECTIONS
    : role === "hr_team"
    ? HR_TEAM_SECTIONS
    : role === "qa_team"
    ? QA_TEAM_SECTIONS
    : role === "behavioral_support"
    ? [
        {
          id: "resources", label: "Resources", items: [
            { to: "/reports", label: "Reports", icon: BarChart3, module: "reports" },
            { to: "#", label: "Training (Coming Soon)", icon: GraduationCap, module: "training", disabled: true },
          ],
        },
      ]
    : [homeSection, ...NAV_SECTIONS]
        .map((s) => ({ ...s, items: s.items.filter((i) => canSee(i.module)) }))
        .filter((s) => s.items.length > 0);

  // State Director: gray out core operational items as Coming Soon, and
  // remove the AI & Automations section entirely.
  if (role === "state_director") {
    const COMING_SOON_PATHS = new Set<string>([
      "/state-director",       // Dashboard
      "/intake",                // Intake Workspace
      "/command-center",        // Command Center
      "/leads",
      "/vob-decision-center",
      "/clients",
      "/authorizations",
      "/scheduling",
      "/cases",                 // Case Management
      "/staff",                 // BCBA / RBT
      "/evaluations",
      "/kpi",                   // KPI Tracking
    ]);
    sections = sections
      .filter((s) => s.id !== "ai")
      .map((s) => ({
        ...s,
        items: s.items.map((i) => (COMING_SOON_PATHS.has(i.to) ? { ...i, disabled: true } : i)),
      }));
  }

  const mobileSections = (() => {
    const q = mobileSearch.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  })();

  // Persist user toggles in localStorage so collapsed groups stay collapsed.
  // Storage is scoped per role so each role remembers its own layout.
  const SECTIONS_KEY = `os.sidebar.openSections.${role}`;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  // Seed/merge defaults whenever role or section list changes. Stored values win.
  useEffect(() => {
    const defaults: Record<string, boolean> = {};
    sections.forEach((s, idx) => {
      const isActive = s.items.some((i) => i.end ? pathname === i.to : pathname.startsWith(i.to));
      defaults[s.id] = isActive || idx === 0;
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
    if (item.disabled) {
      const disabledNode = (
        <div
          key={item.to}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
            collapsed
              ? "h-10 w-10 justify-center bg-muted/70 px-0 text-muted-foreground ring-1 ring-border/70"
              : "text-muted-foreground/50",
            "cursor-not-allowed select-none",
          )}
        >
          <item.icon className={cn("h-[16px] w-[16px] shrink-0", collapsed ? "opacity-100" : "opacity-40")} />
          {!collapsed && (
            <>
              <span className="truncate">{item.label}</span>
              <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Soon
              </span>
            </>
          )}
        </div>
      );
      if (!collapsed) return disabledNode;
      return (
        <Tooltip key={item.to} delayDuration={120}>
          <TooltipTrigger asChild>{disabledNode}</TooltipTrigger>
          <TooltipContent side="right" className="text-[12px] font-medium">{item.label} — Coming Soon</TooltipContent>
        </Tooltip>
      );
    }

    const link = (
    <NavLink
      key={item.to}
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
                  <Search className="pointer-events-none absolute z-10 left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60" strokeWidth={2.25} />
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
              src={collapsed ? blossomMark : blossomLogo}
              alt={collapsed ? "Blossom" : "Blossom ABA Therapy"}
              className={cn(
                "object-contain transition-all duration-300",
                collapsed ? "h-9 w-9" : "h-11 w-auto",
              )}
            />
          </NavLink>

          <nav className={cn("os-sidebar-scroll flex-1 overflow-y-auto px-3 pb-3", collapsed ? "pt-4" : "pt-2")}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-1.5">{allItems.map((item) => renderNavItem(item))}</div>
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
              <button
                onClick={() => navigate("/ai/assistant")}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[hsl(265_50%_85%)] bg-white/70 px-2.5 py-1.5 text-[11.5px] font-semibold text-[hsl(265_70%_50%)] transition hover:bg-white"
              >
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
                        const hit = s.items.find((i) => i.label.toLowerCase().includes(q));
                        if (hit) { navigate(hit.to); setHeaderSearchOpen(false); setHeaderSearch(""); break; }
                      }
                    }
                  }}
                  placeholder="Search everything…"
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
                        No results for “{headerSearch.trim()}”.
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
                                onClick={() => {
                                  navigate(item.to);
                                  setHeaderSearchOpen(false);
                                  setHeaderSearch("");
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-foreground hover:bg-muted/60"
                              >
                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{item.label}</span>
                                <span className="ml-auto truncate text-[10.5px] text-muted-foreground">{item.to}</span>
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
                  onClick={() => navigate("/ai/assistant")}
                  aria-label="Ask Blossom AI"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_8px_20px_-8px_hsl(265_70%_50%/0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-8px_hsl(265_70%_50%/0.55)]"
                  style={{ background: "linear-gradient(135deg, hsl(265 85% 62%), hsl(285 85% 68%))" }}
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Ask Blossom AI</TooltipContent>
            </Tooltip>
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
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-xl object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-[11px] font-bold text-white">
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
                  <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
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

      {/* GLOBAL SEARCH PALETTE */}
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search pages, modules, dashboards…" />
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
                      onSelect={() => {
                        setPaletteOpen(false);
                        navigate(item.to);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto truncate text-[10.5px] text-muted-foreground">{item.to}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}