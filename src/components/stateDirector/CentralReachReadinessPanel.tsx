import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  loadStateCentralReachOutbox,
  type CentralReachOutboxRow,
} from "@/lib/os/stateDirector/stateOperationsService";
import type { StateCode } from "@/lib/os/stateDirector/types";

/**
 * State Operations CentralReach readiness/outbox panel.
 *
 * This is a readiness layer only — the live CentralReach API is NOT
 * connected. Rows here document what state work is waiting for
 * CentralReach mapping / manual updates so a future integration has an
 * obvious hook.
 */
export function CentralReachReadinessPanel({
  stateFilter,
}: { stateFilter: StateCode | "all" }) {
  const [rows, setRows] = useState<CentralReachOutboxRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const data = await loadStateCentralReachOutbox(stateFilter === "all" ? undefined : stateFilter);
    setRows(data);
    setLoading(false);
  }

  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [stateFilter]);

  return (
    <Card className="p-5 rounded-2xl border-border/60">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-foreground">CentralReach Readiness</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Live CentralReach API is <b className="text-foreground">not connected</b> yet.
            This queue tracks state work waiting for mapping or manual updates.
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {["State", "Source", "Action", "Sync status", "CR object", "Created"].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border/60">
                <td className="px-4 py-2 font-medium">{r.stateCode}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.sourceType}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.actionType.replace(/_/g, " ")}</td>
                <td className="px-4 py-2">
                  <Badge variant="outline" className={
                    r.syncStatus === "synced" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    r.syncStatus === "pending" ? "bg-sky-50 text-sky-700 border-sky-200" :
                    r.syncStatus === "error" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-amber-50 text-amber-800 border-amber-200"
                  }>{r.syncStatus.replace(/_/g, " ")}</Badge>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {r.centralreachObjectType ?? "—"}
                  {r.centralreachExternalId ? ` · ${r.centralreachExternalId}` : ""}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {(() => { try { return new Date(r.createdAt).toLocaleDateString(); } catch { return r.createdAt; } })()}
                </td>
              </tr>
            ))}
            {rows && rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing waiting on CentralReach readiness.</td></tr>
            ) : null}
            {rows === null && !loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Could not load CentralReach readiness queue.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}