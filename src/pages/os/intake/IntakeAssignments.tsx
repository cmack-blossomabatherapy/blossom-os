import { useMemo, useState } from "react";
import { UserPlus, ShieldAlert, Users, Inbox } from "lucide-react";
import { GrowthPageShell } from "@/components/os/growth/GrowthPageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLeads } from "@/contexts/LeadsContext";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { isDirectorOfIntake } from "@/lib/intake/intakeRoles";
import { canonicalIntakeStage, INTAKE_STAGE_SLA_DAYS } from "@/lib/intake/intakeCanonicalStages";

/**
 * Director of Intake — Assignments & Exceptions.
 *
 * Real workload view: unassigned leads, coordinator workload, and SLA-risk
 * leads with working reassignment. Exceptions are recorded on the lead
 * timeline through the shared leads layer.
 */
export default function IntakeAssignments() {
  const { leads, loading, assignOwner } = useLeads();
  const ctx = useOSRoleSafe();
  const director = isDirectorOfIntake([ctx?.role ?? null]);
  const [owner, setOwner] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const unassigned = useMemo(
    () => leads.filter((l) => !l.owner?.trim() || l.owner === "Unassigned"),
    [leads],
  );

  const workload = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const key = l.owner?.trim() || "Unassigned";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const slaRisk = useMemo(
    () =>
      leads
        .filter((l) => {
          const stage = canonicalIntakeStage(l.status);
          return (l.daysInStage ?? 0) > INTAKE_STAGE_SLA_DAYS[stage];
        })
        .slice(0, 25),
    [leads],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const reassign = () => {
    if (!director) return;
    if (!owner.trim() || selected.length === 0) {
      toast.error("Pick at least one lead and type the coordinator's name.");
      return;
    }
    assignOwner(selected, owner.trim());
    toast.success(`Assigned ${selected.length} lead(s) to ${owner.trim()}.`);
    setSelected([]);
    setOwner("");
  };

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Assignments & Exceptions"
      description="Director-only workload balancing, reassignment, and SLA exception review."
      headerRight={<Badge variant="outline">Director of Intake</Badge>}
    >
      {!director && (
        <Card className="p-6 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium">Read-only</p>
              <p className="text-sm text-muted-foreground">
                Reassignment and exception approval are limited to the Director of Intake.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Unassigned leads ({unassigned.length})</h2>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading intake leads…</p>
        ) : unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every Intake lead has an owner. Nothing to assign.</p>
        ) : (
          <div className="space-y-2">
            {unassigned.slice(0, 40).map((l) => (
              <label key={l.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(l.id)}
                  onChange={() => toggle(l.id)}
                  disabled={!director}
                  aria-label={`Select ${l.childName || l.parentName}`}
                />
                <LeadNameLink lead={l} />
                <Badge variant="secondary" className="ml-auto">{canonicalIntakeStage(l.status)}</Badge>
              </label>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Assign to coordinator…"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            disabled={!director}
            className="sm:max-w-xs"
          />
          <Button onClick={reassign} disabled={!director || selected.length === 0}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign {selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Coordinator workload</h2>
          </div>
          {workload.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads loaded yet.</p>
          ) : (
            workload.slice(0, 12).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="truncate">{name}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">SLA risk ({slaRisk.length})</h2>
          </div>
          {slaRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads are past their stage SLA. You're all caught up.</p>
          ) : (
            slaRisk.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 text-sm">
                <LeadNameLink lead={l} />
                <span className="text-muted-foreground whitespace-nowrap">
                  {l.daysInStage}d in {canonicalIntakeStage(l.status)}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </GrowthPageShell>
  );
}
