/**
 * Viventium data audit strip for the Live Org Chart — how much of the chart is
 * backed by live payroll/HR data vs. inferred placement.
 */
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Link2Off, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  auditViventiumCoverage,
  type OrgTree,
  type OrgViventiumAudit,
} from "@/lib/os/orgChart/tree";

interface EmployeeAuditRow {
  id: string;
  viventium_employee_id: string | null;
  viventium_sync_status: string | null;
  viventium_last_sync: string | null;
  manager_id: string | null;
  job_title: string | null;
  status: string | null;
}

export function OrgViventiumAuditPanel({
  tree,
  canEdit,
}: {
  tree: OrgTree;
  canEdit: boolean;
}) {
  const [audit, setAudit] = useState<OrgViventiumAudit | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(
          "id,viventium_employee_id,viventium_sync_status,viventium_last_sync,manager_id,job_title,status",
        )
        .in("status", ["active", "on_leave"]);
      if (cancelled) return;
      if (error || !data) {
        setBlocked(true);
        return;
      }
      setAudit(
        auditViventiumCoverage(
          (data as EmployeeAuditRow[]).map((r) => ({
            id: r.id,
            viventiumEmployeeId: r.viventium_employee_id,
            viventiumSyncStatus: r.viventium_sync_status,
            viventiumLastSync: r.viventium_last_sync,
            managerId: r.manager_id,
            jobTitle: r.job_title,
            status: r.status,
          })),
        ),
      );
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const inferred = Array.from(tree.nodes.values()).filter(
    (n) => !n.isRoot && n.parentSource === "inferred",
  ).length;
  const manual = Array.from(tree.nodes.values()).filter(
    (n) => !n.isRoot && n.parentSource === "override",
  ).length;
  const fromManager = Array.from(tree.nodes.values()).filter(
    (n) => !n.isRoot && n.parentSource === "manager",
  ).length;

  if (blocked || !audit) return null;

  const healthy = audit.coveragePct >= 80;

  return (
    <Collapsible>
      <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-2.5 shadow-sm">
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 text-left">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              {healthy ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="size-3.5 text-amber-500" />
              )}
              Viventium data {audit.coveragePct}% synced
            </span>
            <span className="text-muted-foreground">
              {fromManager} reporting lines from HR · {inferred} inferred · {manual} manual
            </span>
            {audit.lastSyncAt && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <RefreshCw className="size-3" />
                last sync {new Date(audit.lastSyncAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-4">
          <Stat label="Active teammates" value={audit.total} />
          <Stat
            label="Synced from Viventium"
            value={`${audit.synced} (${audit.coveragePct}%)`}
            tone={healthy ? "good" : "warn"}
          />
          <Stat
            label="Missing a manager in HR"
            value={audit.missingManager}
            tone={audit.missingManager > 0 ? "warn" : "good"}
            hint="Placed by department leader inference until HR sets a manager."
          />
          <Stat
            label="Not linked to Viventium"
            value={audit.notConnected}
            tone={audit.notConnected > 0 ? "warn" : "good"}
            icon={<Link2Off className="size-3" />}
          />
          {canEdit && (
            <p className="text-[11px] text-muted-foreground sm:col-span-4">
              Reporting lines come from HR/Viventium first. Manual changes you make
              here are saved as overrides and can be reset per person or for the
              whole chart.
            </p>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  tone?: "good" | "warn" | "neutral";
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums",
          tone === "good" && "text-emerald-600",
          tone === "warn" && "text-amber-600",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}