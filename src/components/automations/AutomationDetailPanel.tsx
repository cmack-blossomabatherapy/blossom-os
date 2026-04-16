import {
  X, Zap, Play, Pause, Copy, Trash2, AlertOctagon, CheckCircle2,
  ChevronRight, Filter as FilterIcon, Workflow, ShieldAlert, Clock, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type Automation,
  automationStatusVariant,
  workflowVariant,
  formatRelative,
} from "@/data/automations";

interface Props {
  automation: Automation | null;
  onClose: () => void;
}

export function AutomationDetailPanel({ automation, onClose }: Props) {
  if (!automation) {
    return (
      <div className="bg-card rounded-xl border border-border/60 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <Zap className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Select an automation to view & edit</p>
      </div>
    );
  }

  const a = automation;

  return (
    <div className="bg-card rounded-xl border border-border/60 flex flex-col max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
              a.status === "Error"
                ? "bg-destructive/10 text-destructive"
                : a.status === "Paused"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary",
            )}
          >
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground truncate">{a.name}</h3>
              {a.highImpact && <Star className="h-3 w-3 text-warning fill-warning shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground font-mono">{a.id}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <StatusBadge status={a.workflow} variant={workflowVariant(a.workflow)} />
              <StatusBadge status={a.status} variant={automationStatusVariant(a.status)} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Description + master toggle */}
        <div className="px-4 py-3 border-b border-border/40">
          <p className="text-xs text-muted-foreground mb-3">{a.description}</p>
          <div className="flex items-center justify-between bg-secondary/30 border border-border/40 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              {a.status === "Active" ? (
                <Play className="h-3.5 w-3.5 text-success" />
              ) : (
                <Pause className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-foreground">
                {a.status === "Active" ? "Running" : a.status === "Paused" ? "Paused" : "Error"}
              </span>
            </div>
            <Switch checked={a.status === "Active"} />
          </div>
        </div>

        {/* TRIGGER */}
        <BuilderSection title="Trigger" icon={Workflow} hint="What starts this?">
          <div className="rounded-lg border border-info/30 bg-info/5 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-info font-semibold">{a.triggerType}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{a.triggerLabel}</p>
          </div>
        </BuilderSection>

        {/* CONDITIONS */}
        <BuilderSection
          title={`Conditions${a.conditions.length > 0 ? ` · ${a.conditions.length}` : ""}`}
          icon={FilterIcon}
          hint="Optional logic"
        >
          {a.conditions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No conditions — runs on every trigger</p>
          ) : (
            <div className="space-y-1.5">
              {a.conditions.map((c, i) => (
                <div key={i} className="rounded-md border border-border/60 bg-secondary/30 px-2.5 py-1.5 text-xs">
                  <span className="font-mono text-foreground">{c.field}</span>{" "}
                  <span className="text-muted-foreground">{c.op.replace("_", " ")}</span>{" "}
                  {c.value && <span className="font-mono text-primary">{c.value}</span>}
                </div>
              ))}
            </div>
          )}
        </BuilderSection>

        {/* ACTIONS */}
        <BuilderSection title={`Actions · ${a.actions.length}`} icon={ChevronRight} hint="What happens next?">
          <div className="space-y-1.5">
            {a.actions.map((act, i) => (
              <div key={i} className="rounded-lg border border-success/30 bg-success/5 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-success font-semibold">{act.type}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{act.detail}</p>
              </div>
            ))}
          </div>
        </BuilderSection>

        {/* FAILSAFE */}
        <BuilderSection title="Failsafe / Escalation" icon={ShieldAlert} hint="If not completed in time">
          {a.failsafe.enabled ? (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-2.5">
              <p className="text-xs text-foreground">
                If not completed in <span className="font-bold tabular-nums">{a.failsafe.afterDays}d</span>:{" "}
                <span className="font-medium text-warning">{a.failsafe.action}</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No failsafe configured</p>
          )}
        </BuilderSection>

        {/* PERFORMANCE */}
        <BuilderSection title="Performance" icon={Clock}>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Last Run" value={formatRelative(a.lastRun)} />
            <Stat label="Total Runs" value={a.totalRuns.toLocaleString()} />
            <Stat
              label="Success"
              value={`${a.successRate}%`}
              tone={a.successRate >= 95 ? "success" : a.successRate >= 85 ? "warning" : "destructive"}
            />
          </div>
        </BuilderSection>

        {/* RECENT LOGS */}
        {a.recentLogs.length > 0 && (
          <BuilderSection title={`Recent Runs · ${a.recentLogs.length}`}>
            <div className="space-y-1.5">
              {a.recentLogs.map((l) => (
                <div
                  key={l.id}
                  className={cn(
                    "rounded-md border p-2.5",
                    l.status === "failure"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border/60 bg-secondary/30",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {l.status === "failure" ? (
                      <AlertOctagon className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{l.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {l.recordType} · {l.recordLabel} · {formatRelative(l.timestamp)}
                      </p>
                      {l.errorDetail && (
                        <p className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 rounded px-1.5 py-0.5 mt-1 font-mono">
                          {l.errorDetail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BuilderSection>
        )}

        {/* DANGER ZONE */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-1.5">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Copy className="h-3 w-3 mr-1.5" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3 mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuilderSection({
  title, icon: Icon, hint, children,
}: {
  title: string;
  icon?: typeof Zap;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-b border-border/40 last:border-b-0">
      <div className="mb-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
          {Icon && <Icon className="h-3 w-3" />}
          {title}
        </h4>
        {hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Stat({
  label, value, tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="bg-secondary/30 border border-border/40 rounded-md p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums mt-0.5", toneClass)}>{value}</p>
    </div>
  );
}
