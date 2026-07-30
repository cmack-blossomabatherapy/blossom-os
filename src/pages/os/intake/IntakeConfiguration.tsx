import { Settings2, Phone, FileText, ShieldAlert } from "lucide-react";
import { GrowthPageShell } from "@/components/os/growth/GrowthPageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { isDirectorOfIntake } from "@/lib/intake/intakeRoles";
import {
  INTAKE_CANONICAL_STAGES, INTAKE_STAGE_OWNERS,
  INTAKE_STAGE_SLA_DAYS, INTAKE_STAGE_NEXT_ACTIONS,
} from "@/lib/intake/intakeCanonicalStages";
import { CENTRALREACH_BOUNDARY_NOTE } from "@/lib/intake/admissionReadiness";

/**
 * Director of Intake — Templates & Configuration.
 *
 * Shows the canonical Intake stage configuration that every surface reads
 * from, plus the CTM qualification configuration source. Editing CTM
 * qualification config is backend-driven; the control is honestly disabled
 * with its dependency named rather than faking an edit.
 */
export default function IntakeConfiguration() {
  const ctx = useOSRoleSafe();
  const director = isDirectorOfIntake([ctx?.role ?? null]);

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Templates & Configuration"
      description="The canonical Intake stage model, SLAs, and call-qualification configuration."
      headerRight={<Badge variant="outline">Director of Intake</Badge>}
    >
      {!director && (
        <Card className="p-6 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <p className="text-sm">Configuration is read-only for Intake Coordinators.</p>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Canonical Intake stages</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Stage</th>
                <th className="py-2 pr-4 font-medium">Owner</th>
                <th className="py-2 pr-4 font-medium">SLA</th>
                <th className="py-2 font-medium">Next action</th>
              </tr>
            </thead>
            <tbody>
              {INTAKE_CANONICAL_STAGES.map((s, i) => (
                <tr key={s} className="border-t">
                  <td className="py-2 pr-4 font-medium whitespace-nowrap">{i + 1}. {s}</td>
                  <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{INTAKE_STAGE_OWNERS[s]}</td>
                  <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{INTAKE_STAGE_SLA_DAYS[s]}d</td>
                  <td className="py-2 text-muted-foreground">{INTAKE_STAGE_NEXT_ACTIONS[s]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{CENTRALREACH_BOUNDARY_NOTE}</p>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Call qualification</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Inbound calls are qualified against the configured Intake tracking numbers, campaigns,
          duration threshold, and internal/spam exclusion lists. These values live in the
          integration configuration and are applied identically to live calls, historical
          backfills, and manual review.
        </p>
        <Button variant="outline" disabled title="Editing requires integration configuration write access">
          Edit qualification rules — requires integration configuration access
        </Button>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Family message templates</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Packet, follow-up, and missing-information templates are used by the Communications
          workspace. Template authoring is pending the messaging provider connection.
        </p>
        <Button variant="outline" disabled title="Requires a connected messaging provider">
          Manage templates — requires a connected messaging provider
        </Button>
      </Card>
    </GrowthPageShell>
  );
}
