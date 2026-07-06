import { Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOSRole } from "@/contexts/OSRoleContext";
import { SendToStateSupportButton } from "./SendToStateSupportButton";
import type { Department } from "@/lib/os/stateDirector/types";

interface Props {
  ownerDepartment: Department;
  sourceModule?: string;
  topRisks?: string[];
  overdueCount?: number;
  openBlockers?: number;
  nextFollowUp?: string;
}

const STATE_ROLES = new Set<string>(["state_director", "assistant_state_director"]);

/**
 * Renders the "State Director Snapshot" banner on department pages
 * when a State Director / Assistant is viewing. Regular department
 * operators do NOT see this — they keep the normal workspace tools.
 */
export function StateDirectorSnapshotBanner({
  ownerDepartment,
  sourceModule,
  topRisks,
  overdueCount,
  openBlockers,
  nextFollowUp,
}: Props) {
  const { role, activeState } = useOSRole();
  if (!STATE_ROLES.has(String(role))) return null;

  return (
    <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.03] mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
            <MapPin className="h-3.5 w-3.5" /> State Director Snapshot
          </div>
          <p className="text-sm text-muted-foreground">
            {ownerDepartment} owns execution. State leadership monitors risk,
            removes blockers, and escalates when needed.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
            <span><b className="text-foreground">State:</b> {activeState ?? "—"}</span>
            <span><b className="text-foreground">Owner:</b> {ownerDepartment}</span>
            <span><b className="text-foreground">Overdue:</b> {overdueCount ?? "—"}</span>
            <span><b className="text-foreground">Open blockers:</b> {openBlockers ?? "—"}</span>
            {nextFollowUp ? (
              <span><b className="text-foreground">Next follow-up:</b> {nextFollowUp}</span>
            ) : null}
          </div>
          {topRisks && topRisks.length ? (
            <div className="text-xs text-muted-foreground pt-1">
              <b className="text-foreground">Top risks:</b> {topRisks.slice(0, 3).join(" · ")}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <SendToStateSupportButton
            fromDepartment={ownerDepartment}
            defaultKind="task"
            buttonLabel="Send to State Support"
            sourceModule={sourceModule ?? `state_snapshot_${ownerDepartment.toLowerCase()}`}
          />
          <SendToStateSupportButton
            fromDepartment={ownerDepartment}
            defaultKind="task"
            buttonLabel="Create State Task"
            variant="ghost"
            sourceModule={sourceModule ?? `state_snapshot_${ownerDepartment.toLowerCase()}`}
          />
          <SendToStateSupportButton
            fromDepartment={ownerDepartment}
            defaultKind="escalation"
            buttonLabel="Create Escalation"
            variant="ghost"
            sourceModule={sourceModule ?? `state_snapshot_${ownerDepartment.toLowerCase()}`}
          />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/state-operations">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to State Operations
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}