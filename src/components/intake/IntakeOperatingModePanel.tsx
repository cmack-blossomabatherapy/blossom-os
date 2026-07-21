import { useIntakeOperatingMode } from "@/lib/intake/operatingMode";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";

/**
 * Admin-only Intake readiness panel.
 *
 * Shows the current Intake operating mode and the operational blockers
 * that keep it in INGEST_ONLY. This pass intentionally does NOT provide
 * an activation toggle — mode changes are made directly to
 * public.intake_operating_mode by an admin.
 */
export function IntakeOperatingModePanel() {
  const { data, isLoading } = useIntakeOperatingMode();
  const mode = data?.mode ?? "INGEST_ONLY";
  const isFull = mode === "FULL";

  const blockers = [
    "No auto-owner assignment on new inbound leads.",
    "No automatic stage advancement beyond Lead Captured.",
    "No outbound call/SMS/email/intake packet delivery.",
    "No auto-seed of follow-up tasks or reminders.",
    "No CentralReach / Solum / Eligipro submissions.",
    "No calendar booking or outbound webhooks.",
  ];

  return (
    <Card className="rounded-2xl border-border/70 bg-card/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isFull ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            )}
            <h3 className="text-sm font-semibold">Intake Operating Mode</h3>
            <Badge variant={isFull ? "default" : "secondary"}>
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : mode}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            {isFull
              ? "Full Intake mode. Inbound ingestion and outbound actions are both enabled."
              : "Preview-only. Inbound webhooks/syncs stage and normalize leads, but no outbound actions run. Both UI and the database enforce this."}
          </p>
          {data?.note && (
            <p className="mt-2 text-[11.5px] italic text-muted-foreground/80">"{data.note}"</p>
          )}
        </div>
      </div>

      {!isFull && (
        <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            What is blocked
          </div>
          <ul className="mt-2 space-y-1 text-xs text-foreground/80">
            {blockers.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Activation is intentionally not exposed as a toggle in this pass. An
            admin can move to FULL mode by updating <code className="rounded bg-muted px-1 py-0.5 text-[10px]">public.intake_operating_mode</code> directly.
          </p>
        </div>
      )}
    </Card>
  );
}