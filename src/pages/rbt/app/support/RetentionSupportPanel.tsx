import { useEffect, useState } from "react";
import { CardFrame } from "../CardFrame";
import { Badge } from "@/components/ui/badge";
import { useRbtIdentity } from "../useRbtIdentity";
import {
  loadRetentionCheckinsFor,
  deriveCheckinStatus,
  type RetentionCheckin,
} from "@/lib/os/academy/rbtTrainingAcademy";

/**
 * Shows the trainee their own retention check-ins and the current status.
 * Trainees cannot self-complete a retention check-in (only the assigned
 * trainer/BCBA can, enforced by RLS) so this surface is read-only.
 */
export function RetentionSupportPanel() {
  const { authUserId, loading } = useRbtIdentity();
  const [rows, setRows] = useState<RetentionCheckin[] | null>(null);
  useEffect(() => {
    if (loading || !authUserId) return;
    void loadRetentionCheckinsFor(authUserId, "trainee").then(setRows).catch(() => setRows([]));
  }, [authUserId, loading]);

  const state: "loading" | "empty" | "success" =
    rows === null ? "loading" : rows.length === 0 ? "empty" : "success";

  return (
    <CardFrame
      title="Retention check-ins"
      subtitle="Two-week follow-ups after your first session"
      state={state}
      emptyLabel="No retention check-ins scheduled yet."
    >
      {rows && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((c) => {
            const status = deriveCheckinStatus(c);
            return (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span>Due {new Date(c.due_at).toLocaleDateString()}</span>
                <Badge
                  variant={status === "overdue" || status === "escalated" ? "destructive" : "secondary"}
                >
                  {status}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </CardFrame>
  );
}