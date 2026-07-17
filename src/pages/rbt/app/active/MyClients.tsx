import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CardFrame } from "../CardFrame";
import { FreshnessPill, freshness } from "./freshness";
import { crClientUrl } from "./cr";
import { ExternalLink, AlertTriangle } from "lucide-react";

export default function MyClients() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [alerts, setAlerts] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("rbt_client_assignments" as any)
      .select("id,client_id,client_name,clinic,assigned_bcba_id,schedule_summary,centralreach_client_id,centralreach_last_synced_at,status")
      .eq("rbt_employee_id", user.id)
      .eq("status", "active")
      .order("client_name")
      .then(({ data }) => setRows((data as any[]) ?? []));

    // operational alerts scoped to this RBT's clients
    supabase.from("rbt_shift_discrepancies" as any)
      .select("id,shift_event_id,session_date,discrepancy_type,description,status")
      .eq("employee_id", user.id)
      .eq("status", "open")
      .then(({ data }) => {
        const grouped: Record<string, any[]> = {};
        (data ?? []).forEach((d: any) => {
          const k = d.session_date ?? "unknown";
          (grouped[k] ??= []).push(d);
        });
        setAlerts(grouped);
      });
  }, [user?.id]);

  const state = rows === null ? "loading" : rows.length === 0 ? "empty" : "success";

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground px-1">
        Showing only your active assigned clients. Full clinical information stays in CentralReach.
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
                    <dd className="text-sm truncate">{c.assigned_bcba_id ? "Assigned" : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Weekly schedule</dt>
                    <dd className="text-sm truncate">{c.schedule_summary ?? "See CentralReach"}</dd>
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