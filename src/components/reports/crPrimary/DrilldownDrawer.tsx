import { Download } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { fmtCount } from "@/lib/os/reports/crPrimary/format";
import type { DrilldownRequest } from "@/lib/os/reports/crPrimary/types";

/**
 * Deep drilldown drawer: shows the CentralReach source rows behind a KPI,
 * chart segment, or table row — including match context — and exports the
 * exact drilldown table to CSV.
 */
export function DrilldownDrawer({
  request,
  onClose,
}: {
  request: DrilldownRequest | null;
  onClose: () => void;
}) {
  const open = !!request;
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-3xl"
        data-testid="drilldown-drawer"
      >
        <SheetHeader>
          <SheetTitle className="text-base">{request?.title ?? "Drilldown"}</SheetTitle>
          <SheetDescription className="text-xs">
            {request?.subtitle ?? "Source CentralReach rows behind this metric."}
          </SheetDescription>
        </SheetHeader>

        {request && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {fmtCount(request.rows.length)} source row{request.rows.length === 1 ? "" : "s"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-7 gap-1.5 text-xs"
                data-testid="drilldown-export"
                onClick={() => downloadCsv(request.exportName, request.rows, request.columns)}
              >
                <Download className="h-3.5 w-3.5" /> Export drilldown CSV
              </Button>
            </div>

            <div className="mt-3 max-h-[65vh] overflow-auto rounded-xl border border-border/60">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                  <tr>
                    {request.columns.map((c) => (
                      <th key={c.key} className="whitespace-nowrap bg-card px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {request.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={request.columns.length}
                        className="px-3 py-6 text-center text-muted-foreground"
                      >
                        No source rows for this selection.
                      </td>
                    </tr>
                  ) : (
                    request.rows.slice(0, 500).map((r, i) => (
                      <tr key={i} className="border-t border-border/50 hover:bg-muted/30">
                        {request.columns.map((c) => (
                          <td key={c.key} className="whitespace-nowrap px-2.5 py-1.5 tabular-nums">
                            {r[c.key] == null || r[c.key] === "" ? "—" : String(r[c.key])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {request.rows.length > 500 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Showing the first 500 rows. Export the CSV for the full{" "}
                {fmtCount(request.rows.length)} rows.
              </p>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}