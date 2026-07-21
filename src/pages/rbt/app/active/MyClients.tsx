import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardFrame } from "../CardFrame";
import { FreshnessPill, freshness } from "./freshness";
import { crClientUrl } from "./cr";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { useRbtIdentity } from "../useRbtIdentity";
import { deriveMyClientsFromCanonical } from "@/lib/os/reporting/canonicalRoleBridge";

export default function MyClients() {
  const { employeeId, loading: idLoading } = useRbtIdentity();
  const [rows, setRows] = useState<any[] | null>(null);
  const [alerts, setAlerts] = useState<Record<string, any[]>>({});
  const [derived, setDerived] = useState<boolean>(false);

  useEffect(() => {
    if (idLoading) return;
    if (!employeeId) { setRows([]); setAlerts({}); return; }
    supabase.from("rbt_client_assignments" as any)
      .select("id,client_id,client_name,clinic,assigned_bcba_id,schedule_summary,centralreach_client_id,centralreach_last_synced_at,status")
      .eq("rbt_employee_id", employeeId)
      .eq("status", "active")
      .order("client_name")
      .then(async ({ data }) => {
        const roleRows = (data as any[]) ?? [];
        if (roleRows.length > 0) {
          setRows(roleRows);
          setDerived(false);
          return;
        }
        // Fallback: derive distinct clients this RBT has served from
        // delivered service history so the page isn't empty for tenured
        // RBTs while their assignment table catches up.
        const canon = await deriveMyClientsFromCanonical({ employeeId });
        setRows(
          canon.map((c) => ({
            id: `canon:${c.crClientId}`,
            client_id: c.crClientId,
            client_name: c.clientName,
            clinic: null,
            assigned_bcba_id: null,
            schedule_summary: null,
            centralreach_client_id: c.crClientId,
            centralreach_last_synced_at: c.lastServiceDate,
            status: "active",
            __derived: true,
            __hours: c.totalHours,
            __rowCount: c.rowCount,
          })),
        );
        setDerived(canon.length > 0);
      });

    // operational alerts scoped to this RBT's clients
    supabase.from("rbt_shift_discrepancies" as any)
      .select("id,shift_event_id,session_date,discrepancy_type,description,status")
      .eq("employee_id", employeeId)
      .eq("status", "open")
      .then(({ data }) => {
        const grouped: Record<string, any[]> = {};
        (data ?? []).forEach((d: any) => {
          const k = d.session_date ?? "unknown";
          (grouped[k] ??= []).push(d);
        });
        setAlerts(grouped);
      });
  }, [employeeId, idLoading]);

  const state = rows === null ? "loading" : rows.length === 0 ? "empty" : "success";

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground px-1">
        Showing only your active assigned clients. Full clinical information stays in CentralReach.
        {derived && (
          <span className="ml-1 text-muted-foreground">
            Based on your recent service history — a couple of details may still be filling in.
          </span>
        )}
      </p>
      <CardFrame title="My clients" state={state} emptyLabel="You have no active client assignments right now.">
        <ul className="space-y-2">
          {rows?.map((c) => {
            const fresh = freshness(c.centralreach_last_synced_at, 48);
            const openIssues = Object.values(alerts).flat().length;
            return (
              <li key={c.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.client_name ?? "Client"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.clinic ?? "Location TBD"}
                    </p>
                  </div>
                  <FreshnessPill f={fresh} />
                </div>
                <dl className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">BCBA</dt>
                    <dd className="text-sm truncate">
                      {c.assigned_bcba_id ? "Assigned" : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {c.__derived ? "Delivered hours" : "Weekly schedule"}
                    </dt>
                    <dd className="text-sm truncate">
                      {c.__derived
                        ? `${(c.__hours ?? 0).toFixed(1)}h to date`
                        : (c.schedule_summary ?? "See CentralReach")}
                    </dd>
                  </div>
                </dl>
                {openIssues > 0 && (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> {openIssues} open discrepancy report{openIssues === 1 ? "" : "s"}
                  </p>
                )}
                <a href={crClientUrl(c.centralreach_client_id)} target="_blank" rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs rounded-full bg-muted px-3 py-1.5 hover:bg-muted/70">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in CentralReach
                </a>
              </li>
            );
          })}
        </ul>
      </CardFrame>
    </div>
  );
}