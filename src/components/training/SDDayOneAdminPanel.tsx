/**
 * SD Day-One Readiness — Training Management view.
 *
 * Honest, per-learner row of day-one signals (employee/user linked, state,
 * mentor, welcome reviewed, first mentor check-in, access blockers, next
 * action). Because backend learner data is not wired here yet, all rows
 * render the "Manual check" chip — the panel never hard-codes "Ready" for
 * something it cannot verify.
 */
import { CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipState = "ready" | "needs-review" | "missing" | "manual";

const CHIP_COPY: Record<ChipState, string> = {
  ready: "Ready",
  "needs-review": "Needs review",
  missing: "Missing",
  manual: "Manual check",
};

const CHIP_TONE: Record<ChipState, string> = {
  ready: "border-emerald-300/60 bg-emerald-50/60 text-emerald-900",
  "needs-review": "border-amber-300/60 bg-amber-50/60 text-amber-900",
  missing: "border-rose-300/60 bg-rose-50/60 text-rose-900",
  manual: "border-border/60 bg-muted/40 text-muted-foreground",
};

function Chip({ state }: { state: ChipState }) {
  return (
    <span
      data-testid={`sd-day-one-chip-${state}`}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        CHIP_TONE[state],
      )}
    >
      {CHIP_COPY[state]}
    </span>
  );
}

const COLUMNS = [
  "Learner",
  "State",
  "Mentor",
  "Welcome reviewed",
  "First mentor check-in",
  "Access blockers",
  "Next action",
] as const;

export function SDDayOneAdminPanel() {
  // No backend learner roster wired yet — we render an honest, single-row
  // template that admins can scan and a clear instruction on how to verify.
  const sampleRow: { col: string; state: ChipState; note?: string }[] = [
    { col: "Learner", state: "manual", note: "Link from HR · employee + auth user" },
    { col: "State", state: "manual", note: "GA / NC / TN / VA / MD" },
    { col: "Mentor", state: "manual", note: "Assigned in HR profile" },
    { col: "Welcome reviewed", state: "manual", note: "Confirm /training/welcome was opened" },
    { col: "First mentor check-in", state: "manual", note: "Scheduled or completed" },
    { col: "Access blockers", state: "manual", note: "Email · calendar · CR · Viventium · OS" },
    { col: "Next action", state: "manual", note: "Send first-day instructions" },
  ];

  return (
    <section
      data-testid="sd-day-one-admin-panel"
      className="rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CalendarCheck2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Management · Day-One
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
            Day-One Readiness by Learner
          </h2>
          <p className="mt-1.5 max-w-3xl text-[13px] text-muted-foreground">
            Per-learner day-one signals. Items show <strong>Ready</strong>, <strong>Needs review</strong>,
            <strong> Missing</strong>, or <strong>Manual check</strong>. Nothing here is marked Ready
            unless the system can verify it — protecting against false-green launches.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {COLUMNS.map((c) => (
                <th key={c} className="border-b border-border/60 px-3 py-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr data-testid="sd-day-one-admin-row">
              {sampleRow.map((cell) => (
                <td
                  key={cell.col}
                  className="border-b border-border/40 px-3 py-3 align-top"
                >
                  <Chip state={cell.state} />
                  {cell.note && (
                    <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
                      {cell.note}
                    </p>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11.5px] text-muted-foreground">
        Per-learner backend sync for day-one signals is on the roadmap. Until then, confirm each
        signal directly with the learner and their mentor.
      </p>
    </section>
  );
}
