import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CardFrame } from "../CardFrame";
import { usePreboarding, type PreboardingRow } from "./usePreboarding";
import { STATUS_META, isDone } from "./types";
import PreboardingItemSheet from "./PreboardingItemSheet";
import { CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight } from "lucide-react";

export default function RbtPreboarding() {
  const { user } = useAuth();
  const { rows, stats, error, reload } = usePreboarding(user?.id);
  const [selected, setSelected] = useState<PreboardingRow | null>(null);

  if (error) return <CardFrame title="Your checklist" state="error" errorLabel="We could not load your checklist. Try again shortly." />;
  if (!rows) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;

  const yourItems = rows.filter((r) => r.requirement.owner_role === "rbt");
  const teamItems = rows.filter((r) => r.requirement.owner_role !== "rbt");

  return (
    <div className="space-y-4">
      <CardFrame title="Your preboarding" subtitle={`${stats.complete} of ${stats.total} required steps done`} state="success">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${stats.percent}%` }} />
        </div>
        {stats.overdue.length > 0 && (
          <p className="mt-3 text-sm flex items-center gap-1.5 text-destructive">
            <AlertTriangle className="h-4 w-4" /> {stats.overdue.length} step{stats.overdue.length === 1 ? "" : "s"} overdue
          </p>
        )}
      </CardFrame>

      <CardFrame title="Your steps" subtitle="Things only you can do" state={yourItems.length ? "success" : "empty"} emptyLabel="Nothing waiting on you.">
        <ItemList rows={yourItems} onSelect={setSelected} />
      </CardFrame>

      <CardFrame title="What our team is doing" subtitle="We handle these for you" state={teamItems.length ? "success" : "empty"}>
        <ItemList rows={teamItems} onSelect={setSelected} />
      </CardFrame>

      <PreboardingItemSheet
        row={selected}
        internal={false}
        onClose={() => setSelected(null)}
        onChanged={() => { void reload(); setSelected(null); }}
      />
    </div>
  );
}

function ItemList({ rows, onSelect }: { rows: PreboardingRow[]; onSelect: (r: PreboardingRow) => void }) {
  return (
    <ul className="divide-y divide-border/70 -mx-4">
      {rows.map((r) => {
        const done = isDone(r.item.status);
        const overdue = !done && r.item.due_at && new Date(r.item.due_at) < new Date();
        const Icon = done ? CheckCircle2 : overdue ? AlertTriangle : r.item.status === "in_progress" || r.item.status === "submitted" ? Clock : Circle;
        return (
          <li key={r.item.id}>
            <button onClick={() => onSelect(r)} className="w-full text-left flex items-center gap-3 px-4 py-3.5 min-h-[56px] hover:bg-muted/50 transition">
              <Icon className={`h-5 w-5 shrink-0 ${done ? "text-primary" : overdue ? "text-destructive" : "text-muted-foreground"}`} strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className={`text-[15px] font-medium tracking-tight truncate ${done ? "text-muted-foreground line-through" : ""}`}>{r.requirement.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  <span className={STATUS_META[r.item.status].tone}>{STATUS_META[r.item.status].label}</span>
                  {r.item.due_at && <> · Due {new Date(r.item.due_at).toLocaleDateString()}</>}
                  {!r.requirement.is_required && <> · Optional</>}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}