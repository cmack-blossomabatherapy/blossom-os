import { useEffect, useMemo, useState } from "react";
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
  Copy,
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
import { IntegrationReadinessPanel } from "@/components/marketing/IntegrationReadinessPanel";
import { RecruitingIntegrationHealthPanel } from "@/components/recruiting/RecruitingIntegrationHealthPanel";
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
import {
  BLOSSOM_INTEGRATIONS,
} from "@/lib/os/integrations/integrationRegistry";
import type { BlossomIntegration } from "@/lib/os/integrations/types";
import {
  listIntegrationCatalog,
  listIntegrationConnections,
  listIntegrationSyncRuns,
  listIntegrationWebhookEvents,
  listUserOAuthConnections,
  testIntegrationConnection,
  runIntegrationSync,
  updateIntegrationConnectionEnabled,
  type IntegrationConnectionRow,
  type IntegrationSyncRunRow,
  type IntegrationWebhookEventRow,
  type OAuthConnectionRow,
} from "@/lib/os/integrations/backend";
import { deriveIntegrationStatus } from "@/lib/os/integrations/statusOverlay";
import { IntegrationCatalogSection } from "@/components/admin/IntegrationCatalogSection";
import { logSystemToolAction } from "@/hooks/useSystemTools";
import { toast } from "sonner";
import { IntakeCommunicationSetupPanel } from "@/components/settings/IntakeCommunicationSetupPanel";

/**
 * Admin > Integrations renders directly from the shared registry
 * (`BLOSSOM_INTEGRATIONS`) so a new integration added there appears here
 * automatically. UI-only concerns (icon, accent color) are layered on
 * via small overlay tables below.
 */

// -----------------------------------------------------------------------------
// Types & registry-backed catalog
// -----------------------------------------------------------------------------

type IntegrationStatus =
  | "connected"
  | "syncing"
  | "delayed"
  | "error"
  | "reauth"
  | "disconnected"
  | "credentials_required"
  | "probe_pending"
  | "configured"
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
  ownerDepartment?: string;
  criticality?: BlossomIntegration["criticality"];
  methods?: BlossomIntegration["methods"];
  inboundData?: string[];
  outboundData?: string[];
  dependentModules?: string[];
  sourceOfTruthFor?: string[];
  notes?: string;
};

const CATEGORIES: { id: IntegrationCategory; label: string; icon: typeof Plug }[] = [
  { id: "core", label: "Core Operations", icon: Layers },
  { id: "intake", label: "Intake & Insurance", icon: ShieldCheck },
  { id: "hr", label: "Recruiting & HR", icon: Users },
  { id: "marketing", label: "Marketing & Attribution", icon: TrendingUp },
  { id: "comms", label: "Communications", icon: MessageSquare },
  { id: "ai", label: "AI & Automation", icon: Sparkles },
];

// -- Visual overlay (icon + accent) by registry id --
const ICON_BY_ID: Record<string, typeof Plug> = {
  centralreach: HeartPulse,
  viventium: Workflow,
  apploi: Users,
  ms365: Cloud,
  jivetel: Phone,
  ctm: Phone,
  retell: Bot,
  leadtrap: Globe,
  mailchimp: Mail,
  "google-ads": TrendingUp,
  "meta-ads": TrendingUp,
  solum: ShieldCheck,
  eligipro: CheckCircle2,
  pandadoc: FileText,
  calendly: Calendar,
  fathom: Sparkles,
  bloomgrowth: Gauge,
};

const ACCENT_BY_ID: Record<string, string> = {
  centralreach: "text-rose-500",
  viventium: "text-teal-500",
  apploi: "text-indigo-500",
  ms365: "text-sky-500",
  jivetel: "text-indigo-500",
  ctm: "text-rose-500",
  retell: "text-violet-500",
  leadtrap: "text-sky-500",
  mailchimp: "text-amber-500",
  "google-ads": "text-amber-500",
  "meta-ads": "text-blue-500",
  solum: "text-violet-500",
  eligipro: "text-emerald-500",
  pandadoc: "text-amber-500",
  calendly: "text-emerald-500",
  fathom: "text-fuchsia-500",
  bloomgrowth: "text-teal-500",
};

function mapRegistryCategory(c: BlossomIntegration["category"]): IntegrationCategory {
  switch (c) {
    case "clinical_emr":
      return "core";
    case "hris":
    case "recruiting":
      return "hr";
    case "marketing":
    case "lead_capture":
      return "marketing";
    case "eligibility":
    case "documents":
      return "intake";
    case "communications":
      return "comms";
    case "meetings":
      return c === "meetings" ? "comms" : "comms";
    case "ai_voice":
      return "ai";
    default:
      return "core";
  }
}

function mapRegistryStatus(s: BlossomIntegration["status"]): IntegrationStatus {
  switch (s) {
    case "connected":
      return "connected";
    case "configured":
      // Static registry "configured" only means credentials are intended,
      // not that a live backend row exists. Show "Not connected" until a
      // real integration_connections row overlays this.
      return "disconnected";
    case "needs_attention":
      return "error";
    case "error":
      return "error";
    case "maybe":
    case "planned":
      return "coming_soon";
    case "disabled":
      return "disconnected";
    default:
      return "disconnected";
  }
}

function mapRegistryHealth(
  s: BlossomIntegration["status"],
  c: BlossomIntegration["criticality"],
): Integration["health"] {
  if (s === "error" || s === "needs_attention") return c === "critical" ? "critical" : "warning";
  if (s === "maybe" || s === "planned" || s === "disabled") return "idle";
  return "healthy";
}

function toIntegrationCard(reg: BlossomIntegration): Integration {
  const status = mapRegistryStatus(reg.status);
  const enabled = reg.status !== "disabled" && reg.status !== "planned" && reg.status !== "maybe";
  return {
    id: reg.id,
    name: reg.displayName,
    category: mapRegistryCategory(reg.category),
    description: reg.notes || reg.inboundData.slice(0, 3).join(" - "),
    purpose: reg.inboundData.slice(0, 4),
    status,
    account: reg.ownerDepartment,
    lastSync: enabled ? "Recently" : undefined,
    enabled,
    health: mapRegistryHealth(reg.status, reg.criticality),
    icon: ICON_BY_ID[reg.id] ?? Plug,
    accent: ACCENT_BY_ID[reg.id] ?? "text-muted-foreground",
    critical: reg.criticality === "critical",
    ownerDepartment: reg.ownerDepartment,
    criticality: reg.criticality,
    methods: reg.methods,
    inboundData: reg.inboundData,
    outboundData: reg.outboundData,
    dependentModules: reg.dependentModules,
    sourceOfTruthFor: reg.sourceOfTruthFor,
    notes: reg.notes,
  };
}

/** Source of truth: derived directly from `BLOSSOM_INTEGRATIONS`. */
const INTEGRATIONS: Integration[] = BLOSSOM_INTEGRATIONS
  .filter((i) => !i.internalOnly)
  .map(toIntegrationCard);

/** Internal-only / legacy integrations (Make.com etc.), shown in a
 *  collapsed section below so admins can still see them without
 *  presenting them as current desired integrations. */
const LEGACY_INTEGRATIONS: Integration[] = BLOSSOM_INTEGRATIONS
  .filter((i) => i.internalOnly)
  .map(toIntegrationCard);

/** Named source-of-truth systems that Blossom OS depends on.
 *  Order intentional — top-of-page overview for admins. */
const SOURCE_OF_TRUTH_IDS = [
  "centralreach",
  "viventium",
  "pandadoc",
  "retell",
  "ctm",
  "leadtrap",
  "apploi",
] as const;

// -----------------------------------------------------------------------------
// Small UI atoms
// -----------------------------------------------------------------------------

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
    credentials_required: {
      label: "Credentials required",
      dot: "bg-amber-500",
      cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    probe_pending: {
      label: "Probe pending",
      dot: "bg-sky-500",
      cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      pulse: true,
    },
    configured: {
      label: "Configured",
      dot: "bg-indigo-500",
      cls: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
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

// -----------------------------------------------------------------------------
// Integration card
// -----------------------------------------------------------------------------

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
  // Pass 5 truthfulness: only allow the toggle to flip when we have a real
  // backend state to persist to (connected/syncing). Otherwise the switch
  // would only mutate local UI state and mislead admins.
  const canToggle = !isComingSoon &&
    (integration.status === "connected" || integration.status === "syncing");
  const toggleTitle = canToggle
    ? `Toggle ${integration.name}`
    : "Connect/configure this integration before enabling.";

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
          <span className="text-xs text-muted-foreground">- {integration.account}</span>
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
              onCheckedChange={canToggle ? onToggle : undefined}
              disabled={!canToggle}
              title={toggleTitle}
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

// -----------------------------------------------------------------------------
// Detail drawer
// -----------------------------------------------------------------------------

function IntegrationDrawer({
  integration,
  open,
  onOpenChange,
  syncRuns,
  webhookEvents,
  connection,
  onRefresh,
}: {
  integration: Integration | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  syncRuns: IntegrationSyncRunRow[];
  webhookEvents: IntegrationWebhookEventRow[];
  connection: IntegrationConnectionRow | null;
  onRefresh: () => void;
}) {
  if (!integration) return null;
  const Icon = integration.icon;

  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [viventiumBusy, setViventiumBusy] = useState<null | "test" | "preview" | "sync">(null);
  const [viventiumResult, setViventiumResult] = useState<null | {
    ok: boolean; mode: string; received?: number; normalized?: number;
    matched?: number; created?: number; updated?: number; skipped?: number; linked?: number; nonActiveSkipped?: number;
    error?: string; samples?: unknown[];
  }>(null);

  const integrationSyncRuns = syncRuns.filter((r) => r.integration_id === integration.id);
  const integrationWebhookEvents = webhookEvents.filter((e) => e.integration_id === integration.id);

  async function handleTest() {
    setTesting(true);
    const { runWithSystemToolAudit } = await import("@/hooks/useSystemTools");
    const res = await runWithSystemToolAudit({
      mutation: () => testIntegrationConnection(integration.id),
      audit: (r) => ({
        tool_area: "integrations",
        action: "test_connection",
        entity_table: "integrations",
        entity_id: integration.id,
        new_value: { ok: r.ok, message: r.message },
        metadata: { integration_name: integration.name },
      }),
      onAuditFailure: (msg) =>
        toast.warning(`Action completed but audit log failed: ${msg}`),
    });
    setTesting(false);
    if (res.ok) toast.success(`${integration.name}: ${res.message}`);
    else toast.error(`${integration.name}: ${res.message}`);
    onRefresh();
  }
  async function handleSync() {
    setSyncing(true);
    const { runWithSystemToolAudit } = await import("@/hooks/useSystemTools");
    const res = await runWithSystemToolAudit({
      mutation: () => runIntegrationSync(integration.id),
      audit: (r) => ({
        tool_area: "integrations",
        action: "run_sync",
        entity_table: "integrations",
        entity_id: integration.id,
        new_value: { ok: r.ok, message: r.message ?? null },
        metadata: { integration_name: integration.name },
      }),
      onAuditFailure: (msg) =>
        toast.warning(`Action completed but audit log failed: ${msg}`),
    });
    setSyncing(false);
    if (res.ok) toast.success(`${integration.name}: sync queued`);
    else toast.error(`${integration.name}: ${res.message ?? "sync failed"}`);
    onRefresh();
  }

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const retellWebhookUrl = supabaseUrl
    ? `${supabaseUrl.replace(".supabase.co", ".functions.supabase.co")}/retell-webhook`
    : null;
  const genericWebhookUrl = supabaseUrl
    ? `${supabaseUrl.replace(".supabase.co", ".functions.supabase.co")}/integration-webhook?integration=${integration.id}`
    : null;

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
            <Button size="sm" className="h-9 gap-1.5 rounded-xl" onClick={handleSync} disabled={syncing}>
              {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" strokeWidth={2} />}
              Run sync
            </Button>
            <Button size="sm" variant="secondary" className="h-9 gap-1.5 rounded-xl" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
              Test connection
            </Button>
            {integration.id === "viventium" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 rounded-xl"
                  disabled={viventiumBusy !== null}
                  onClick={async () => {
                    setViventiumBusy("test");
                    try {
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { data, error } = await supabase.functions.invoke("viventium-sync", { body: { mode: "connection-test" } });
                      if (error) { setViventiumResult({ ok: false, mode: "connection-test", error: error.message }); toast.error(`Viventium: ${error.message}`); }
                      else { setViventiumResult(data as never); (data as { ok?: boolean })?.ok ? toast.success("Viventium: connection ok") : toast.error(`Viventium: ${(data as { error?: string })?.error ?? "failed"}`); }
                    } finally { setViventiumBusy(null); }
                  }}
                >
                  {viventiumBusy === "test" ? <Loader2 className="size-3.5 animate-spin" /> : <Plug className="size-3.5" />}
                  Test Viventium
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 rounded-xl"
                  disabled={viventiumBusy !== null}
                  onClick={async () => {
                    setViventiumBusy("preview");
                    try {
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { data, error } = await supabase.functions.invoke("viventium-sync", { body: { mode: "employees-dry-run" } });
                      if (error) { setViventiumResult({ ok: false, mode: "employees-dry-run", error: error.message }); toast.error(`Viventium: ${error.message}`); }
                      else { setViventiumResult(data as never); (data as { ok?: boolean })?.ok ? toast.success(`Viventium preview: ${(data as { received?: number }).received ?? 0} received`) : toast.error(`Viventium: ${(data as { error?: string })?.error ?? "failed"}`); }
                    } finally { setViventiumBusy(null); }
                  }}
                >
                  {viventiumBusy === "preview" ? <Loader2 className="size-3.5 animate-spin" /> : <Users className="size-3.5" />}
                  Preview employee sync
                </Button>
                <Button
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl"
                  disabled={viventiumBusy !== null}
                  onClick={async () => {
                    if (!confirm("Sync ACTIVE Viventium employees into the employees directory now? This will create/update records and link them to auth users by email.")) return;
                    setViventiumBusy("sync");
                    try {
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { data, error } = await supabase.functions.invoke("viventium-sync", { body: { mode: "employees-sync", dryRun: false } });
                      if (error) { setViventiumResult({ ok: false, mode: "employees-sync", error: error.message }); toast.error(`Viventium: ${error.message}`); }
                      else {
                        setViventiumResult(data as never);
                        const d = data as { ok?: boolean; created?: number; updated?: number; linked?: number; error?: string };
                        d?.ok
                          ? toast.success(`Viventium sync: ${d.created ?? 0} created, ${d.updated ?? 0} updated, ${d.linked ?? 0} linked`)
                          : toast.error(`Viventium: ${d?.error ?? "failed"}`);
                      }
                      onRefresh();
                    } finally { setViventiumBusy(null); }
                  }}
                >
                  {viventiumBusy === "sync" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  Sync active employees
                </Button>
              </>
            )}
          </div>
          {integration.id === "viventium" && viventiumResult && (
            <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs">
              <div className="mb-1 font-medium">
                Last {viventiumResult.mode === "connection-test" ? "connection test" : "preview"}: {viventiumResult.ok ? "OK" : "Failed"}
              </div>
              {viventiumResult.ok ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  <span>received: {viventiumResult.received ?? 0}</span>
                  <span>normalized: {viventiumResult.normalized ?? 0}</span>
                  <span>matched: {viventiumResult.matched ?? 0}</span>
                  <span>created: {viventiumResult.created ?? 0}</span>
                  <span>updated: {viventiumResult.updated ?? 0}</span>
                  <span>skipped: {viventiumResult.skipped ?? 0}</span>
                  {typeof viventiumResult.linked === "number" && <span>linked to users: {viventiumResult.linked}</span>}
                  {typeof viventiumResult.nonActiveSkipped === "number" && <span>inactive skipped: {viventiumResult.nonActiveSkipped}</span>}
                </div>
              ) : (
                <div className="text-destructive">{viventiumResult.error ?? "Unknown error"}</div>
              )}
            </div>
          )}
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
                <HealthStat icon={Gauge} label="Backend status" value={connection?.status ?? "no_connection_row"} />
                <HealthStat
                  icon={RefreshCw}
                  label="Last success"
                  value={connection?.last_success_at ? new Date(connection.last_success_at).toLocaleString() : "-"}
                />
                <HealthStat icon={Activity} label="Sync runs" value={`${integrationSyncRuns.length} recent`} />
                <HealthStat
                  icon={AlertTriangle}
                  label="Last error"
                  value={connection?.last_error ?? "None"}
                  tone={connection?.last_error ? "warning" : "healthy"}
                />
              </div>
              {connection && (
                <Card className="rounded-2xl border-border/60 p-4 space-y-2">
                  <div className="text-sm font-medium">Required secrets</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(connection.secret_names ?? []).map((s) => (
                      <Badge key={s} variant="secondary" className="rounded-full text-[10px] font-mono">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Names only - secret values are never shown in the browser.
                  </p>
                </Card>
              )}
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
                    {integration.sourceOfTruthFor?.[0] ?? integration.name}
                  </div>
                </div>
              </Card>

              {/* Registry-derived detail */}
              {(integration.ownerDepartment ||
                integration.criticality ||
                (integration.methods && integration.methods.length > 0)) && (
                <Card className="rounded-2xl border-border/60 p-4 space-y-3">
                  <div className="text-sm font-medium">Operational ownership</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {integration.ownerDepartment && (
                      <div>
                        <div className="uppercase tracking-wider text-muted-foreground">Owner</div>
                        <div className="mt-0.5 text-foreground">{integration.ownerDepartment}</div>
                      </div>
                    )}
                    {integration.criticality && (
                      <div>
                        <div className="uppercase tracking-wider text-muted-foreground">Criticality</div>
                        <div className="mt-0.5 text-foreground capitalize">{integration.criticality}</div>
                      </div>
                    )}
                    {integration.methods && integration.methods.length > 0 && (
                      <div className="col-span-2">
                        <div className="uppercase tracking-wider text-muted-foreground">Sync methods</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {integration.methods.map((m) => (
                            <Badge key={m} variant="secondary" className="rounded-full text-[10px]">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {integration.inboundData && integration.inboundData.length > 0 && (
                <Card className="rounded-2xl border-border/60 p-4">
                  <div className="text-sm font-medium">Inbound data</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {integration.inboundData.map((d) => (
                      <Badge key={d} variant="secondary" className="rounded-full text-[11px]">
                        {d}
                      </Badge>
                    ))}
                  </div>
                  {integration.outboundData && integration.outboundData.length > 0 && (
                    <>
                      <div className="mt-3 text-sm font-medium">Outbound data</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {integration.outboundData.map((d) => (
                          <Badge key={d} variant="outline" className="rounded-full text-[11px]">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              )}

              {integration.dependentModules && integration.dependentModules.length > 0 && (
                <Card className="rounded-2xl border-border/60 p-4">
                  <div className="text-sm font-medium">Dependent Blossom OS modules</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {integration.dependentModules.map((m) => (
                      <Badge key={m} variant="secondary" className="rounded-full text-[11px]">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {integration.notes && (
                <Card className="rounded-2xl border-border/60 bg-muted/20 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Notes</div>
                  <p className="mt-1 text-sm text-foreground">{integration.notes}</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <div className="space-y-2">
                {integrationSyncRuns.length === 0 ? (
                  <Card className="rounded-2xl border-dashed border-border/70 bg-muted/20 p-6 text-center">
                    <RefreshCw className="mx-auto mb-2 size-5 text-muted-foreground" />
                    <div className="text-sm font-medium">No sync runs yet</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click <strong>Run sync</strong> to record the first attempt.
                    </p>
                  </Card>
                ) : (
                  integrationSyncRuns.map((r) => {
                    const ok = r.status === "success" || r.status === "completed";
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : r.status === "error" || r.status === "failed" ? "bg-rose-500" : "bg-amber-500")} />
                          <div>
                            <div className="text-sm text-foreground">
                              {r.run_type} - {r.direction} - {r.status}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(r.started_at).toLocaleString()}
                            </div>
                            {r.error_message && (
                              <div className="mt-1 text-[11px] text-rose-500">
                                {r.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.records_received} in - {r.records_created + r.records_updated} written
                        </div>
                      </div>
                    );
                  })
                )}
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
              <div className="space-y-4">
                {integration.id === "retell" && (
                  <Card className="rounded-2xl border border-border/60 bg-card/60 p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
                        <Globe className="size-5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">Retell Webhook URL</div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Point your Retell agent(s) at either the dedicated
                          <span className="font-mono"> /retell-webhook </span>
                          function, or the generic
                          <span className="font-mono"> /integration-webhook?integration=retell </span>
                          receiver. Agent filtering is controlled by{" "}
                          <span className="font-mono">RETELL_AGENT_ID</span> only if configured.
                          Webhook event:{" "}
                          <span className="font-mono">call_analyzed</span>.
                        </p>
                        {retellWebhookUrl ? (
                          <>
                            <div className="mt-3 flex items-center gap-2">
                              <code className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-[11px] font-mono text-foreground break-all">
                                {retellWebhookUrl}
                              </code>
                              <Button size="sm" variant="secondary" className="h-8 gap-1.5 rounded-lg shrink-0"
                                onClick={() => { navigator.clipboard.writeText(retellWebhookUrl); toast.success("URL copied"); }}>
                                <Copy className="size-3.5" /> Copy
                              </Button>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <code className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-[11px] font-mono text-foreground break-all">
                                {genericWebhookUrl}
                              </code>
                              <Button size="sm" variant="ghost" className="h-8 gap-1.5 rounded-lg shrink-0"
                                onClick={() => { navigator.clipboard.writeText(genericWebhookUrl!); toast.success("URL copied"); }}>
                                <Copy className="size-3.5" /> Copy
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="mt-3 text-xs text-amber-600">
                            Use your Supabase Functions URL from project settings and
                            append <span className="font-mono">/retell-webhook</span> or{" "}
                            <span className="font-mono">/integration-webhook?integration=retell</span>.
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
                {integrationWebhookEvents.length > 0 ? (
                  <Card className="rounded-2xl border-border/60 p-4">
                    <div className="mb-2 text-sm font-medium">Recent webhook events</div>
                    <div className="space-y-1.5">
                      {integrationWebhookEvents.slice(0, 10).map((e) => (
                        <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
                          <div>
                            <div className="text-foreground">{e.event_type ?? "(no type)"}</div>
                            <div className="text-muted-foreground">{new Date(e.received_at).toLocaleString()}</div>
                          </div>
                          <Badge variant="secondary" className="rounded-full text-[10px]">
                            {e.verification_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
                    <Plug className="mx-auto mb-2 size-5 text-muted-foreground" />
                    <div className="text-sm font-medium">No webhook events received yet</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Once your provider sends an event to the URL above, it will appear here.
                    </p>
                  </Card>
                )}
              </div>
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

// -----------------------------------------------------------------------------
// Marketplace modal
// -----------------------------------------------------------------------------

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
              placeholder="Search integrations..."
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
                  Request a new connector - our team will scope it within 48 hours.
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

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

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

  // Backend data (real integration_* tables).
  const [connections, setConnections] = useState<IntegrationConnectionRow[]>([]);
  const [syncRuns, setSyncRuns] = useState<IntegrationSyncRunRow[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<IntegrationWebhookEventRow[]>([]);
  const [oauthConnections, setOauthConnections] = useState<OAuthConnectionRow[]>([]);
  const [backendLoading, setBackendLoading] = useState(true);
  const [backendReachable, setBackendReachable] = useState(true);

  async function loadBackend() {
    setBackendLoading(true);
    try {
      const [cat, conns, runs, events, oauth] = await Promise.all([
        listIntegrationCatalog(),
        listIntegrationConnections(),
        listIntegrationSyncRuns(undefined, 100),
        listIntegrationWebhookEvents(undefined, 100),
        listUserOAuthConnections(),
      ]);
      setConnections(conns);
      setSyncRuns(runs);
      setWebhookEvents(events);
      setOauthConnections(oauth);
      setBackendReachable(cat.length > 0 || conns.length > 0);
    } catch (e) {
      setBackendReachable(false);
    } finally {
      setBackendLoading(false);
    }
  }

  useEffect(() => {
    loadBackend();
  }, []);

  const list = useMemo(() => {
    // Overlay honest live status from integration_connections when present.
    // Falls back to the static registry status for integrations that don't
    // yet have a live connection row.
    const liveByIntegration = new Map<string, IntegrationConnectionRow>();
    for (const c of connections) {
      if (c.environment === "production" || !liveByIntegration.has(c.integration_id)) {
        liveByIntegration.set(c.integration_id, c);
      }
    }
    return INTEGRATIONS.map((i) => {
      const live = liveByIntegration.get(i.id);
      // Truthful overlay: the static registry can NEVER promote an integration
      // to "connected" — only a live integration_connections row can. See
      // deriveIntegrationStatus for full vocabulary + probe rules.
      const status: IntegrationStatus = deriveIntegrationStatus(
        live ?? null,
        i.status === "coming_soon" ? "coming_soon" : "disconnected",
      );
      const enabled = live ? live.enabled : (enabledMap[i.id] ?? i.enabled);
      const lastSync = live?.last_success_at
        ? new Date(live.last_success_at).toLocaleString()
        : undefined;
      return { ...i, enabled, status, lastSync };
    });
  }, [enabledMap, connections]);

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
          return (
            i.status === "disconnected" ||
            i.status === "coming_soon" ||
            i.status === "credentials_required" ||
            i.status === "probe_pending" ||
            i.status === "configured"
          );
        case "errors":
          return i.status === "error" || i.status === "reauth";
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

  const backendStats = useMemo(() => {
    const connected = connections.filter((c) => c.status === "connected").length;
    const needsAttention = connections.filter((c) =>
      ["needs_attention", "error", "not_configured"].includes(c.status),
    ).length;
    const recentFailures = syncRuns.filter((r) =>
      ["error", "failed"].includes(r.status),
    ).length;
    const lastEvent = [...webhookEvents]
      .sort((a, b) => +new Date(b.received_at) - +new Date(a.received_at))[0]
      ?.received_at;
    const ms365Users = oauthConnections.filter(
      (o) => o.integration_id === "ms365" && o.status === "connected",
    ).length;
    return {
      configured: connections.length,
      connected,
      needsAttention,
      recentFailures,
      webhookEvents: webhookEvents.length,
      ms365Users,
      lastEvent,
    };
  }, [connections, syncRuns, webhookEvents, oauthConnections]);

  const connectionByIntegration = useMemo(() => {
    const m = new Map<string, IntegrationConnectionRow>();
    for (const c of connections) {
      if (c.environment === "production" || !m.has(c.integration_id)) {
        m.set(c.integration_id, c);
      }
    }
    return m;
  }, [connections]);

  /**
   * Pass 6 — persist integration enable/disable to the backend when a
   * live connection exists. Falls back to local state only for
   * integrations without a live connection row (toggle is UI-disabled
   * for those anyway, so this branch is defensive).
   */
  async function handleToggleIntegration(integrationId: string, next: boolean) {
    const live = connectionByIntegration.get(integrationId);
    if (!live) {
      setEnabledMap((m) => ({ ...m, [integrationId]: next }));
      return;
    }
    // Optimistic update
    const previous = live.enabled;
    setConnections((prev) =>
      prev.map((c) => (c.id === live.id ? { ...c, enabled: next } : c)),
    );
    const res = await updateIntegrationConnectionEnabled(live.id, next);
    if (!res.ok) {
      // Revert
      setConnections((prev) =>
        prev.map((c) => (c.id === live.id ? { ...c, enabled: previous } : c)),
      );
      toast.error(res.error ?? "Could not save integration toggle");
      return;
    }
    // Refresh from backend so we're in sync.
    await loadBackend();
    const audit = await logSystemToolAction({
      tool_area: "integrations",
      action: next ? "integration_enabled" : "integration_disabled",
      entity_table: "integration_connections",
      entity_id: live.id,
      previous_value: { enabled: previous },
      new_value: { enabled: next, integration_id: integrationId },
      metadata: {
        integration_id: integrationId,
        connection_id: live.id,
        environment: live.environment,
        source: "admin.Integrations.handleToggleIntegration",
        route: typeof window !== "undefined" ? window.location.pathname : null,
      },
    });
    if (audit && !audit.auditOk) {
      toast.warning("Saved, but audit log could not be recorded.");
    }
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
              <Settings className="size-3.5" strokeWidth={1.75} />
              System - Integrations
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
              disabled={list.every((i) => i.status !== "connected" && i.status !== "syncing")}
              title={
                list.some((i) => i.status === "connected" || i.status === "syncing")
                  ? "Open the most recently synced integration's log view"
                  : "Connect an integration to view sync logs"
              }
              onClick={() => {
                const firstLive = list.find(
                  (i) => i.status === "connected" || i.status === "syncing",
                );
                if (firstLive) setSelected(firstLive);
              }}
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

        {/* System status bar - honest, derived from real backend tables only. */}
        <Card className="mt-8 rounded-2xl border-border/70 bg-card/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {backendLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Loading integration backend...</span>
                </>
              ) : !backendReachable ? (
                <>
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  <span className="text-sm font-medium">Integration backend tables not reachable yet</span>
                </>
              ) : backendStats.connected === 0 ? (
                <>
                  <span className="size-2 rounded-full bg-muted-foreground/40" />
                  <span className="text-sm font-medium">Integration backend ready - no live connections yet</span>
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">
                    {backendStats.connected} of {backendStats.configured} integrations connected
                  </span>
                </>
              )}
            </div>
            <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={loadBackend} disabled={backendLoading}>
              <RefreshCw className={cn("size-3.5", backendLoading && "animate-spin")} /> Refresh
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <HealthStat icon={Plug} label="Configured connections" value={`${backendStats.configured}`} />
            <HealthStat icon={CheckCircle2} label="Connected" value={`${backendStats.connected}`} tone="healthy" />
            <HealthStat
              icon={AlertTriangle}
              label="Needs attention"
              value={`${backendStats.needsAttention}`}
              tone={backendStats.needsAttention ? "warning" : "healthy"}
            />
            <HealthStat
              icon={Activity}
              label="Recent sync failures"
              value={`${backendStats.recentFailures}`}
              tone={backendStats.recentFailures ? "critical" : "healthy"}
            />
            <HealthStat icon={Workflow} label="Webhook events" value={`${backendStats.webhookEvents}`} tone="neutral" />
            <HealthStat icon={Users} label="Outlook users connected" value={`${backendStats.ms365Users}`} tone="neutral" />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {backendStats.lastEvent
              ? `Last backend event - ${new Date(backendStats.lastEvent).toLocaleString()}`
              : "No webhook events received yet — cards below reflect registered integrations and any live backend connections."}
          </p>
        </Card>

        {/* Intake Communication Setup - CTM / Jivetel / Mailchimp Email / Mailchimp SMS */}
        <div className="mt-8">
          <IntakeCommunicationSetupPanel />
        </div>

        {/* Marketing integration readiness — moved here from the Marketing pages
            so all integration configuration lives in one admin home. */}
        <div className="mt-8">
          <IntegrationReadinessPanel />
        </div>

        {/* Recruiting integration health — Apploi connection readiness,
            onboarding blockers, and recent import errors. */}
        <div className="mt-8">
          <RecruitingIntegrationHealthPanel />
        </div>

        {/* Source of Truth — which external system owns which operational
            domain. Blossom OS is the workflow layer, not the system of
            record for these. */}
        <Card className="mt-8 rounded-2xl border-border/70 bg-card/60 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Database className="size-4" strokeWidth={1.75} />
                </div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Source of truth
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xl">
                External systems that own operational data. Blossom OS reads from and
                coordinates around these — it is not the system of record for anything
                listed here.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCE_OF_TRUTH_IDS.map((id) => {
              const reg = BLOSSOM_INTEGRATIONS.find((r) => r.id === id);
              if (!reg) return null;
              const Icon = ICON_BY_ID[id] ?? Plug;
              const accent = ACCENT_BY_ID[id] ?? "text-muted-foreground";
              const live = list.find((i) => i.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => live && setSelected(live)}
                  className="group flex flex-col rounded-xl border border-border/60 bg-background/40 p-4 text-left transition-all hover:border-border hover:bg-background/60"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className={cn("grid size-8 place-items-center rounded-lg border border-border/60 bg-muted/40", accent)}>
                      <Icon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {reg.displayName}
                      </div>
                      {reg.ownerDepartment && (
                        <div className="truncate text-[11px] text-muted-foreground">
                          Owner · {reg.ownerDepartment}
                        </div>
                      )}
                    </div>
                    {live && <StatusPill status={live.status} />}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Owns
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(reg.sourceOfTruthFor.length > 0
                      ? reg.sourceOfTruthFor
                      : ["—"]
                    ).map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Search & filters */}
        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations..."
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
                        onToggle={(next) => handleToggleIntegration(i.id, next)}
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

          {LEGACY_INTEGRATIONS.length > 0 && (
            <section>
              <button
                onClick={() =>
                  setCollapsed((c) => ({ ...c, __legacy: !c.__legacy }))
                }
                className="group flex w-full items-center justify-between border-b border-border/60 pb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-muted/60 text-muted-foreground">
                    <Lock className="size-4" strokeWidth={1.75} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Legacy / Internal
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Internal automation bridges — not user-facing dependencies.
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    collapsed.__legacy !== false && "-rotate-90",
                  )}
                />
              </button>
              {collapsed.__legacy === false && (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {LEGACY_INTEGRATIONS.map((i) => (
                    <IntegrationCard
                      key={i.id}
                      integration={i}
                      onOpen={() => setSelected(i)}
                      onToggle={(next) => handleToggleIntegration(i.id, next)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <IntegrationCatalogSection />
        </div>
      </div>

      <IntegrationDrawer
        integration={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        syncRuns={syncRuns}
        webhookEvents={webhookEvents}
        connection={selected ? connectionByIntegration.get(selected.id) ?? null : null}
        onRefresh={loadBackend}
      />
      <MarketplaceDialog open={marketplaceOpen} onOpenChange={setMarketplaceOpen} />
    </div>
  );
}