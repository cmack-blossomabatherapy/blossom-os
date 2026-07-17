import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAFFING_META, type StaffingStatus } from "./types";
import { useStaffingStatus } from "./useReadiness";
import { AvailabilityEditor } from "./AvailabilityEditor";

const FLOW: StaffingStatus[] = [
  "ready_for_matching",
  "potential_case",
  "schedule_confirmation",
  "awaiting_family",
  "case_confirmed",
  "start_date_scheduled",
];

export default function RbtStaffing() {
  const { user } = useAuth();
  const { status, loading } = useStaffingStatus(user?.id);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  if (loading) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;

  const current: StaffingStatus = (status?.status ?? "not_ready") as StaffingStatus;
  const meta = STAFFING_META[current];

  if (current === "not_ready") {
    return (
      <div className="space-y-4">
        <section className="rounded-3xl border border-border/70 bg-card p-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="mt-2 text-lg font-semibold tracking-tight">Almost there</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Finish your readiness steps and our team will move you into matching.
          </p>
        </section>
        <Button variant="outline" className="w-full" onClick={() => setAvailabilityOpen(true)}>
          Set your availability
        </Button>
        <AvailabilityEditor open={availabilityOpen} onClose={() => setAvailabilityOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your staffing status</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{meta.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>

        <ol className="mt-5 space-y-3">
          {FLOW.map((step, i) => {
            const currentIdx = FLOW.indexOf(current);
            const state = currentIdx < 0 ? "future" : i < currentIdx ? "done" : i === currentIdx ? "current" : "future";
            return (
              <li key={step} className="flex items-center gap-3">
                <span className={
                  `h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium ` +
                  (state === "done" ? "bg-primary text-primary-foreground"
                    : state === "current" ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                    : "bg-muted text-muted-foreground")
                }>{i + 1}</span>
                <span className={`text-sm ${state === "future" ? "text-muted-foreground" : ""}`}>
                  {STAFFING_META[step].label}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {status?.potential_case_summary && current !== "ready_for_matching" && (
        <section className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">What we can share</p>
          <p className="mt-1 text-sm">{status.potential_case_summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Family details are shared only once your case is confirmed.
          </p>
        </section>
      )}

      {status?.case_start_date && (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Start date</p>
            <p className="text-sm font-medium">{new Date(status.case_start_date).toLocaleDateString()}</p>
          </div>
        </section>
      )}

      <Button variant="outline" className="w-full" onClick={() => setAvailabilityOpen(true)}>
        Update your availability
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Availability updates do not change CentralReach.
      </p>

      <AvailabilityEditor open={availabilityOpen} onClose={() => setAvailabilityOpen(false)} />
    </div>
  );
}