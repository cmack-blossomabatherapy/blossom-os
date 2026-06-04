import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Cloud,
  Database,
  FileText,
  Filter,
  Gauge,
  Globe,
  HeartPulse,
  Layers,
  LifeBuoy,
  LineChart,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Play,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Video,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types & mock data
// ─────────────────────────────────────────────────────────────────────────────

type IntegrationStatus =
  | "connected"
  | "syncing"
  | "delayed"
  | "error"
  | "reauth"
  | "disconnected"
  | "coming_soon";

type IntegrationCategory =
  | "core"
  | "intake"
  | "hr"
  | "marketing"
  | "comms"
  | "ai";

type Integration = {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  purpose: string[];
  status: IntegrationStatus;
  account?: string;
  lastSync?: string;
  enabled: boolean;
  health: "healthy" | "warning" | "critical" | "idle";
  icon: typeof Plug;
  accent: string; // tailwind text color class
  critical?: boolean;
};

const CATEGORIES: { id: IntegrationCategory; label: string; icon: typeof Plug }[] = [
  { id: "core", label: "Core Operations", icon: Layers },
  { id: "intake", label: "Intake & Insurance", icon: ShieldCheck },
  { id: "hr", label: "Recruiting & HR", icon: Users },
  { id: "marketing", label: "Marketing & Attribution", icon: TrendingUp },
  { id: "comms", label: "Communications", icon: MessageSquare },
  { id: "ai", label: "AI & Automation", icon: Sparkles },
];

const INTEGRATIONS: Integration[] = [
  // CORE
  {
    id: "centralreach",
    name: "CentralReach",
    category: "core",
    description: "Clients, scheduling, billing, SOAP notes, and authorizations.",
    purpose: ["Clients", "Scheduling", "Billing", "SOAP Notes", "Auths"],
    status: "connected",
    account: "blossomaba.centralreach.com",
    lastSync: "2 min ago",
    enabled: true,
    health: "healthy",
    icon: HeartPulse,
    accent: "text-rose-500",
    critical: true,
  },
  {
    id: "blossom-db",
    name: "Blossom Database",
    category: "core",
    description: "The operational brain — users, workflows, automations, audit logs.",
    purpose: ["Database", "Realtime", "Auth", "Storage"],
    status: "connected",
    account: "blossom-os.production",
    lastSync: "Live",
    enabled: true,
    health: "healthy",
    icon: Database,
    accent: "text-primary",
    critical: true,
  },
  {
    id: "ms365",
    name: "Microsoft 365",
    category: "core",
    description: "Teams, Outlook, SharePoint, and calendars.",
    purpose: ["Email", "Calendar", "Teams", "SSO"],
    status: "connected",
    account: "blossomaba.com",
    lastSync: "12 min ago",
    enabled: true,
    health: "healthy",
    icon: Cloud,
    accent: "text-sky-500",
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "core",
    description: "Gmail, Calendar, Drive, and Meet.",
    purpose: ["Mail", "Calendar", "Drive", "Meet"],
    status: "reauth",
    account: "ops@blossomaba.com",
    lastSync: "6 hrs ago",
    enabled: true,
    health: "warning",
    icon: Mail,
    accent: "text-emerald-500",
  },

  // INTAKE
  {
    id: "solum",
    name: "Solum",
    category: "intake",
    description: "Automated verification of benefits and eligibility.",
    purpose: ["VOBs", "Eligibility", "Attachments"],
    status: "syncing",
    account: "blossom-intake",
    lastSync: "Just now",
    enabled: true,
    health: "healthy",
    icon: ShieldCheck,
    accent: "text-violet-500",
  },
  {
    id: "eligipro",
    name: "Eligipro",
    category: "intake",
    description: "Real-time insurance eligibility validation.",
    purpose: ["Eligibility", "Plan details"],
    status: "connected",
    account: "blossom-aba",
    lastSync: "47 min ago",
    enabled: true,
    health: "healthy",
    icon: CheckCircle2,
    accent: "text-emerald-500",
  },
  {
    id: "pandadoc",
    name: "PandaDoc",
    category: "intake",
    description: "Intake forms, consents, and e-signatures.",
    purpose: ["Forms", "Signatures", "Templates"],
    status: "error",
    account: "intake@blossomaba.com",
    lastSync: "2 hrs ago",
    enabled: true,
    health: "critical",
    icon: FileText,
    accent: "text-amber-500",
  },
  {
    id: "availity",
    name: "Availity",
    category: "intake",
    description: "Clearinghouse for eligibility and claims.",
    purpose: ["Clearinghouse", "Claims"],
    status: "coming_soon",
    enabled: false,
    health: "idle",
    icon: Globe,
    accent: "text-muted-foreground",
  },

  // HR
  {
    id: "apploi",
    name: "Apploi",
    category: "hr",
    description: "Applicant tracking and recruiting.",
    purpose: ["ATS", "Interviews", "Offers"],
    status: "connected",
    account: "blossom-careers",
    lastSync: "21 min ago",
    enabled: true,
    health: "healthy",
    icon: Users,
    accent: "text-indigo-500",
  },
  {
    id: "viventium",
    name: "Viventium",
    category: "hr",
    description: "Payroll, HR onboarding, and tax forms.",
    purpose: ["Payroll", "Onboarding", "Tax forms"],
    status: "connected",
    account: "blossomaba",
    lastSync: "1 hr ago",
    enabled: true,
    health: "healthy",
    icon: Workflow,
    accent: "text-teal-500",
    critical: true,
  },
  {
    id: "checkr",
    name: "Checkr",
    category: "hr",
    description: "Background checks for new hires.",
    purpose: ["Background checks"],
    status: "connected",
    account: "blossom-checkr",
    lastSync: "3 hrs ago",
    enabled: true,
    health: "healthy",
    icon: ShieldCheck,
    accent: "text-emerald-500",
  },
  {
    id: "sterling",
    name: "Sterling",
    category: "hr",
    description: "Secondary background check provider.",
    purpose: ["Background checks"],
    status: "disconnected",
    enabled: false,
    health: "idle",
    icon: ShieldCheck,
    accent: "text-muted-foreground",
  },
  {
    id: "stellarcheck",
    name: "StellarCheck",
    category: "hr",
    description: "Clinical credential verification.",
    purpose: ["Credentials"],
    status: "connected",
    account: "blossom-stellar",
    lastSync: "Yesterday",
    enabled: true,
    health: "healthy",
    icon: ShieldCheck,
    accent: "text-emerald-500",
  },
  {
    id: "bacb",
    name: "BACB Verification",
    category: "hr",
    description: "License validation and expiration monitoring.",
    purpose: ["License sync", "Expirations"],
    status: "delayed",
    account: "Public API",
    lastSync: "8 hrs ago",
    enabled: true,
    health: "warning",
    icon: ShieldCheck,
    accent: "text-amber-500",
  },

  // MARKETING
  {
    id: "meta-ads",
    name: "Meta Ads",
    category: "marketing",
    description: "Facebook & Instagram ad attribution.",
    purpose: ["Lead attribution", "Campaign analytics"],
    status: "connected",
    account: "Blossom ABA Ads",
    lastSync: "35 min ago",
    enabled: true,
    health: "healthy",
    icon: TrendingUp,
    accent: "text-blue-500",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    category: "marketing",
    description: "PPC tracking and conversions.",
    purpose: ["PPC", "Conversions"],
    status: "connected",
    account: "blossom-aba-ads",
    lastSync: "1 hr ago",
    enabled: true,
    health: "healthy",
    icon: TrendingUp,
    accent: "text-amber-500",
  },
  {
    id: "ga4",
    name: "Google Analytics",
    category: "marketing",
    description: "Web behavior and funnel analytics.",
    purpose: ["Funnels", "Attribution"],
    status: "connected",
    account: "GA4 — Blossom",
    lastSync: "8 min ago",
    enabled: true,
    health: "healthy",
    icon: LineChart,
    accent: "text-rose-500",
  },
  {
    id: "gsc",
    name: "Google Search Console",
    category: "marketing",
    description: "SEO performance and indexing.",
    purpose: ["SEO", "Indexing"],
    status: "connected",
    account: "blossomaba.com",
    lastSync: "Today",
    enabled: true,
    health: "healthy",
    icon: Search,
    accent: "text-blue-400",
  },
  {
    id: "ctm",
    name: "CallTrackingMetrics",
    category: "marketing",
    description: "Call attribution, recordings, and AI summaries.",
    purpose: ["Calls", "Attribution"],
    status: "connected",
    account: "blossom-ctm",
    lastSync: "3 min ago",
    enabled: true,
    health: "healthy",
    icon: Phone,
    accent: "text-rose-500",
  },

  // COMMS
  {
    id: "twilio",
    name: "Twilio",
    category: "comms",
    description: "SMS and notification delivery.",
    purpose: ["SMS", "Notifications"],
    status: "connected",
    account: "blossom-msg",
    lastSync: "1 min ago",
    enabled: true,
    health: "healthy",
    icon: MessageSquare,
    accent: "text-red-500",
  },
  {
    id: "retell",
    name: "Retell AI",
    category: "comms",
    description: "AI voice agents for inbound and after-hours calls. Captures caller details and routes to the right department.",
    purpose: ["AI calls", "After-hours intake"],
    status: "connected",
    account: "blossom-retell",
    lastSync: "Live",
    enabled: true,
    health: "healthy",
    icon: Bot,
    accent: "text-violet-500",
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "comms",
    description: "Meetings and recordings.",
    purpose: ["Meetings", "Recordings"],
    status: "connected",
    account: "blossomaba.zoom.us",
    lastSync: "Today",
    enabled: true,
    health: "healthy",
    icon: Video,
    accent: "text-sky-500",
  },
  {
    id: "loom",
    name: "Loom",
    category: "comms",
    description: "Recorded training and walkthroughs.",
    purpose: ["Training videos"],
    status: "connected",
    account: "blossom-loom",
    lastSync: "Today",
    enabled: true,
    health: "healthy",
    icon: Video,
    accent: "text-violet-400",
  },

  // AI
  {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    description: "Powers Ask Blossom AI and operational copilots.",
    purpose: ["Chat", "Reasoning"],
    status: "connected",
    account: "blossom-prod",
    lastSync: "Live",
    enabled: true,
    health: "healthy",
    icon: Sparkles,
    accent: "text-emerald-500",
    critical: true,
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    category: "ai",
    description: "Long-form reasoning and document analysis.",
    purpose: ["Reasoning", "Long context"],
    status: "connected",
    account: "blossom-claude",
    lastSync: "Live",
    enabled: true,
    health: "healthy",
    icon: Brain,
    accent: "text-rose-500",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "ai",
    description: "AI voice synthesis for callbacks and outreach.",
    purpose: ["Voice"],
    status: "connected",
    account: "blossom-voice",
    lastSync: "Today",
    enabled: true,
    health: "healthy",
    icon: Activity,
    accent: "text-fuchsia-500",
  },
  {
    id: "assemblyai",
    name: "AssemblyAI",
    category: "ai",
    description: "Call transcription and intelligence.",
    purpose: ["Transcripts"],
    status: "connected",
    account: "blossom-transcribe",
    lastSync: "12 min ago",
    enabled: true,
    health: "healthy",
    icon: BookOpen,
    accent: "text-indigo-500",
  },
  {
    id: "blossom-engine",
    name: "Blossom Automation Engine",
    category: "ai",
    description:
      "Internal workflow engine — replaces Monday automations. Queues, triggers, retries, and webhooks.",
    purpose: ["Workflows", "Triggers", "Webhooks", "Queues"],
    status: "connected",
    account: "Internal",
    lastSync: "Live",
    enabled: true,
    health: "healthy",
    icon: Zap,
    accent: "text-primary",
    critical: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Small UI atoms
// ─────────────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: IntegrationStatus }) {
  const config: Record<
    IntegrationStatus,
    { label: string; dot: string; cls: string; pulse?: boolean }
  > = {
    connected: {
      label: "Connected",
      dot: "bg-emerald-500",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    syncing: {
      label: "Syncing",
      dot: "bg-sky-500",
      cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      pulse: true,
    },
    delayed: {
      label: "Delayed",
      dot: "bg-amber-500",
      cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    error: {
      label: "Error",
      dot: "bg-rose-500",
      cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    reauth: {
      label: "Reauth required",
      dot: "bg-amber-500",
      cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    disconnected: {
      label: "Not connected",
      dot: "bg-muted-foreground/40",
      cls: "bg-muted text-muted-foreground border-border/60",
    },
    coming_soon: {
      label: "Coming soon",
      dot: "bg-muted-foreground/40",
      cls: "bg-muted text-muted-foreground border-border/60",
    },
  };
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        c.cls,
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot, c.pulse && "animate-pulse")} />
      {c.label}
    </span>
  );
}

function HealthStat({
  icon: Icon,
  label,
  value,
  tone = "healthy",
}: {
  icon: typeof Plug;
  label: string;
  value: string;
  tone?: "healthy" | "warning" | "critical" | "neutral";
}) {
  const toneCls = {
    healthy: "text-emerald-500",
    warning: "text-amber-500",
    critical: "text-rose-500",
    neutral: "text-muted-foreground",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 min-w-[180px]">
      <div className={cn("rounded-xl bg-muted/60 p-2", toneCls)}>
        <Icon className="size-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration card
// ─────────────────────────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  onOpen,
  onToggle,
}: {
  integration: Integration;
  onOpen: () => void;
  onToggle: (next: boolean) => void;
}) {
  const Icon = integration.icon;
  const isComingSoon = integration.status === "coming_soon";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border-border/70 bg-card p-5 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_10px_30px_-12px_oklch(0.2_0.02_260/0.18)]",
        isComingSoon && "opacity-70",
      )}
    >
      {integration.critical && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
            <CircleDot className="size-2.5" /> Critical
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid size-11 place-items-center rounded-xl border border-border/60 bg-muted/40",
            integration.accent,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {integration.name}
            </h3>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {integration.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={integration.status} />
        {integration.account && !isComingSoon && (
          <span className="text-xs text-muted-foreground">· {integration.account}</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {integration.purpose.slice(0, 4).map((p) => (
          <Badge
            key={p}
            variant="secondary"
            className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-normal text-muted-foreground hover:bg-muted"
          >
            {p}
          </Badge>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {integration.lastSync ? (
            <>
              <RefreshCw
                className={cn(
                  "size-3.5",
                  integration.status === "syncing" && "animate-spin",
                )}
                strokeWidth={1.75}
              />
              <span>Synced {integration.lastSync}</span>
            </>
          ) : (
            <span>{isComingSoon ? "Available soon" : "Not connected"}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isComingSoon && (
            <Switch
              checked={integration.enabled}
              onCheckedChange={onToggle}
              aria-label={`Toggle ${integration.name}`}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpen}
            className="h-8 gap-1 rounded-xl px-3 text-xs"
          >
            {isComingSoon ? "Preview" : "Configure"}
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail drawer
// ─────────────────────────────────────────────────────────────────────────────

function IntegrationDrawer({
  integration,
  open,
  onOpenChange,
}: {
  integration: Integration | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!integration) return null;
  const Icon = integration.icon;

  const syncTimeline = [
    { time: "Just now", label: "Pull · clients", count: 312, ok: true },
    { time: "8 min ago", label: "Push · appointments", count: 47, ok: true },
    { time: "21 min ago", label: "Pull · authorizations", count: 96, ok: true },
    { time: "1 hr ago", label: "Push · session notes", count: 12, ok: false },
    { time: "3 hrs ago", label: "Pull · staff roster", count: 184, ok: true },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/60 bg-card/50 p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "grid size-12 place-items-center rounded-2xl border border-border/60 bg-muted/40",
                integration.accent,
              )}
            >
              <Icon className="size-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl font-semibold tracking-tight">
                {integration.name}
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm">
                {integration.description}
              </SheetDescription>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill status={integration.status} />
                {integration.account && (
                  <span className="text-xs text-muted-foreground">
                    {integration.account}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-9 gap-1.5 rounded-xl">
              <RefreshCw className="size-3.5" strokeWidth={2} /> Sync now
            </Button>
            <Button size="sm" variant="secondary" className="h-9 gap-1.5 rounded-xl">
              <Play className="size-3.5" /> Test connection
            </Button>
            <Button size="sm" variant="ghost" className="h-9 gap-1.5 rounded-xl">
              <FileText className="size-3.5" /> View logs
            </Button>
          </div>
        </SheetHeader>

        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-9 rounded-xl bg-muted/60 p-1">
              <TabsTrigger value="overview" className="rounded-lg text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg text-xs">
                Sync activity
              </TabsTrigger>
              <TabsTrigger value="mapping" className="rounded-lg text-xs">
                Field mapping
              </TabsTrigger>
              <TabsTrigger value="permissions" className="rounded-lg text-xs">
                Permissions
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="rounded-lg text-xs">
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-lg text-xs">
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <HealthStat icon={Gauge} label="Health" value="Healthy" />
                <HealthStat
                  icon={RefreshCw}
                  label="Last sync"
                  value={integration.lastSync ?? "—"}
                />
                <HealthStat icon={Activity} label="API usage" value="38% of monthly" />
                <HealthStat icon={AlertTriangle} label="Failures (24h)" value="0" />
              </div>
              <Card className="rounded-2xl border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Sync frequency</div>
                    <p className="text-xs text-muted-foreground">
                      How often Blossom OS pulls data from {integration.name}.
                    </p>
                  </div>
                  <div className="text-sm font-medium text-foreground">Every 5 min</div>
                </div>
              </Card>
              <Card className="rounded-2xl border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Data ownership</div>
                    <p className="text-xs text-muted-foreground">
                      Source of truth when conflicts occur.
                    </p>
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {integration.name}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <div className="space-y-2">
                {syncTimeline.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          t.ok ? "bg-emerald-500" : "bg-rose-500",
                        )}
                      />
                      <div>
                        <div className="text-sm text-foreground">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.time}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.count} records
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="mt-6">
              <Card className="rounded-2xl border-border/60 p-4">
                <p className="text-sm text-muted-foreground">
                  Map fields from {integration.name} to Blossom OS. Defaults are
                  pre-configured and recommended for most teams.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="mt-6 space-y-3">
              {[
                "Super Admin",
                "Executive Leadership",
                "Operations Leadership",
                "State Directors",
              ].map((r) => (
                <div
                  key={r}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3"
                >
                  <div className="text-sm">{r}</div>
                  <Switch defaultChecked={r === "Super Admin"} />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="webhooks" className="mt-6">
              <Card className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
                <Plug className="mx-auto mb-2 size-5 text-muted-foreground" />
                <div className="text-sm font-medium">No webhooks configured</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add a webhook to receive real-time events from {integration.name}.
                </p>
                <Button size="sm" className="mt-3 h-8 rounded-xl">
                  Add webhook
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="mt-6 space-y-3">
              <Card className="rounded-2xl border-border/60 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="size-4 text-muted-foreground" /> API credentials
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Credentials are encrypted at rest. Only Super Admins can view or rotate.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" className="h-8 rounded-xl">
                    Rotate key
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 rounded-xl">
                    View audit history
                  </Button>
                </div>
              </Card>
              <Card className="rounded-2xl border-rose-500/30 bg-rose-500/5 p-4">
                <div className="text-sm font-medium text-rose-600 dark:text-rose-400">
                  Disconnect integration
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Removes credentials and pauses all syncs. Historical data is preserved.
                </p>
                <Button size="sm" variant="destructive" className="mt-3 h-8 rounded-xl">
                  Disconnect
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Marketplace modal
// ─────────────────────────────────────────────────────────────────────────────

function MarketplaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const featured = [
    { name: "Salesforce", desc: "Enterprise CRM sync", icon: Cloud },
    { name: "Slack", desc: "Operational alerts and digests", icon: MessageSquare },
    { name: "Stripe", desc: "Payment & invoicing", icon: TrendingUp },
    { name: "Notion", desc: "Knowledge base sync", icon: BookOpen },
    { name: "Calendly", desc: "Scheduling embeds", icon: Calendar },
    { name: "Segment", desc: "Customer data pipelines", icon: Workflow },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl p-0">
        <DialogHeader className="border-b border-border/60 p-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Store className="size-5 text-primary" /> Integration Marketplace
          </DialogTitle>
          <DialogDescription>
            Browse and request new integrations for your Blossom OS workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search 200+ integrations..."
              className="h-10 rounded-xl bg-muted/40 pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.name}
                  className="flex items-center gap-3 rounded-2xl border-border/60 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-muted/60">
                    <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                  <Button size="sm" variant="secondary" className="h-8 rounded-xl">
                    Add
                  </Button>
                </Card>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <LifeBuoy className="size-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Need a custom integration?</div>
                <div className="text-xs text-muted-foreground">
                  Request a new connector — our team will scope it within 48 hours.
                </div>
              </div>
            </div>
            <Button size="sm" className="h-8 rounded-xl">
              Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type FilterKey =
  | "all"
  | "connected"
  | "disconnected"
  | "errors"
  | "syncing"
  | "critical"
  | IntegrationCategory;

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "connected", label: "Connected" },
  { id: "disconnected", label: "Not connected" },
  { id: "errors", label: "Errors" },
  { id: "syncing", label: "Syncing" },
  { id: "critical", label: "Critical" },
  { id: "core", label: "Clinical" },
  { id: "marketing", label: "Marketing" },
  { id: "hr", label: "HR" },
  { id: "comms", label: "Communication" },
  { id: "ai", label: "AI" },
];

export default function Integrations() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.enabled])),
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Integration | null>(null);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const list = useMemo(() => {
    return INTEGRATIONS.map((i) => ({ ...i, enabled: enabledMap[i.id] ?? i.enabled }));
  }, [enabledMap]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((i) => {
      if (q && !`${i.name} ${i.description} ${i.purpose.join(" ")}`.toLowerCase().includes(q)) {
        return false;
      }
      switch (filter) {
        case "all":
          return true;
        case "connected":
          return i.status === "connected" || i.status === "syncing";
        case "disconnected":
          return i.status === "disconnected" || i.status === "coming_soon";
        case "errors":
          return i.status === "error" || i.status === "reauth" || i.status === "delayed";
        case "syncing":
          return i.status === "syncing";
        case "critical":
          return !!i.critical;
        default:
          return i.category === filter;
      }
    });
  }, [list, query, filter]);

  const grouped = useMemo(() => {
    const map = new Map<IntegrationCategory, Integration[]>();
    for (const i of filtered) {
      const arr = map.get(i.category) ?? [];
      arr.push(i);
      map.set(i.category, arr);
    }
    return map;
  }, [filtered]);

  const totals = useMemo(() => {
    const connected = list.filter(
      (i) => i.status === "connected" || i.status === "syncing",
    ).length;
    const syncing = list.filter((i) => i.status === "syncing").length;
    const failed = list.filter((i) => i.status === "error").length;
    return { connected, syncing, failed };
  }, [list]);

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
              <Settings className="size-3.5" strokeWidth={1.75} />
              System · Integrations
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Integrations
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Connect Blossom OS to the systems that power your operations, clinical
              workflows, marketing, recruiting, payroll, communication, and automation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 rounded-xl"
              onClick={() => setSelected(list[0])}
            >
              <FileText className="size-4" strokeWidth={1.75} /> View logs
            </Button>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-xl">
              <BookOpen className="size-4" strokeWidth={1.75} /> API docs
              <ArrowUpRight className="size-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-9 gap-1.5 rounded-xl"
              onClick={() => setMarketplaceOpen(true)}
            >
              <Store className="size-4" strokeWidth={1.75} /> Marketplace
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-xl"
              onClick={() => setMarketplaceOpen(true)}
            >
              <Plus className="size-4" strokeWidth={2} /> Add integration
            </Button>
          </div>
        </div>

        {/* System status bar */}
        <Card className="mt-8 rounded-2xl border-border/70 bg-card/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-medium">All systems operational</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Last full sync · 4 min ago
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <HealthStat
              icon={Plug}
              label="Connected systems"
              value={`${totals.connected} of ${list.length}`}
            />
            <HealthStat
              icon={Loader2}
              label="Active syncs"
              value={`${totals.syncing} running`}
              tone="neutral"
            />
            <HealthStat
              icon={AlertTriangle}
              label="Failed syncs"
              value={`${totals.failed} today`}
              tone={totals.failed ? "critical" : "healthy"}
            />
            <HealthStat icon={Activity} label="API usage" value="42% / month" />
            <HealthStat icon={Zap} label="Queue health" value="Healthy" />
            <HealthStat icon={Brain} label="AI services" value="6 online" />
            <HealthStat icon={Workflow} label="Background jobs" value="118 running" />
            <HealthStat icon={Gauge} label="Webhook activity" value="2.3k / hr" />
            <HealthStat icon={ShieldCheck} label="Security" value="MFA enforced" />
            <HealthStat icon={RefreshCw} label="Last full sync" value="4 min ago" />
          </div>
        </Card>

        {/* Search & filters */}
        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations…"
              className="h-10 rounded-xl bg-muted/40 pl-9"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <div className="flex items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-all",
                    filter === f.id
                      ? "border-foreground/20 bg-foreground text-background"
                      : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-8 space-y-10">
          {CATEGORIES.map((cat) => {
            const items = grouped.get(cat.id) ?? [];
            if (items.length === 0) return null;
            const Icon = cat.icon;
            const isCollapsed = collapsed[cat.id];
            return (
              <section key={cat.id}>
                <button
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [cat.id]: !c[cat.id] }))
                  }
                  className="group flex w-full items-center justify-between border-b border-border/60 pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted/60 text-muted-foreground">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-base font-semibold tracking-tight text-foreground">
                        {cat.label}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {items.length} {items.length === 1 ? "integration" : "integrations"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      isCollapsed && "-rotate-90",
                    )}
                  />
                </button>
                {!isCollapsed && (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((i) => (
                      <IntegrationCard
                        key={i.id}
                        integration={i}
                        onOpen={() => setSelected(i)}
                        onToggle={(next) =>
                          setEnabledMap((m) => ({ ...m, [i.id]: next }))
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {filtered.length === 0 && (
            <Card className="rounded-2xl border-dashed border-border/70 bg-muted/20 py-16 text-center">
              <Search className="mx-auto mb-3 size-6 text-muted-foreground" />
              <div className="text-sm font-medium">No integrations match your filters</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Try clearing the search or selecting a different category.
              </p>
            </Card>
          )}
        </div>
      </div>

      <IntegrationDrawer
        integration={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
      <MarketplaceDialog open={marketplaceOpen} onOpenChange={setMarketplaceOpen} />
    </div>
  );
}