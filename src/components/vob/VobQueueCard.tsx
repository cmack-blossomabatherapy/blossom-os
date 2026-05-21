import { cn } from "@/lib/utils";
import { Flame, AlertTriangle, CheckCircle2, MapPin, Clock } from "lucide-react";
import { STATUS_LABELS, STATUS_TONE, type VobReview } from "@/lib/vob/mockData";

const TONE_RING: Record<string, string> = {
  ok:   "ring-emerald-200/70",
  warn: "ring-amber-200/80",
  crit: "ring-rose-200/80",
};
const TONE_DOT: Record<string, string> = {
  ok:   "bg-emerald-500",
  warn: "bg-amber-500",
  crit: "bg-rose-500",
};
const STAFFING_LABEL: Record<VobReview["staffing"], string> = {
  easy: "Easy",
  moderate: "Moderate",
  difficult: "Difficult",
  high_risk: "High Risk",
};

export function VobQueueCard({
  review, active, onSelect,
}: { review: VobReview; active: boolean; onSelect: () => void }) {
  const statusTone = STATUS_TONE[review.status];
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full rounded-2xl border border-border/50 bg-card/80 px-3.5 py-3 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_hsl(265_70%_55%/0.35)] hover:border-[hsl(265_70%_55%/0.4)]",
        active && "ring-2 ring-[hsl(265_85%_65%/0.5)] shadow-[0_18px_36px_-22px_hsl(265_70%_55%/0.45)] border-transparent bg-gradient-to-br from-white to-[hsl(265_100%_98%)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13px] font-semibold tracking-tight">{review.parentName}</p>
            {review.urgency === "crit" && <Flame className="h-3 w-3 text-rose-500" />}
            {review.urgency === "warn" && <AlertTriangle className="h-3 w-3 text-amber-500" />}
            {review.urgency === "ok"   && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
          </div>
          <p className="truncate text-[11.5px] text-muted-foreground">
            {review.childName} ({review.childAge}) · {review.requestedHours} hrs/wk
          </p>
        </div>
        <span className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ring-1",
          TONE_RING[statusTone],
          statusTone === "ok"   && "bg-emerald-50 text-emerald-700",
          statusTone === "warn" && "bg-amber-50 text-amber-700",
          statusTone === "crit" && "bg-rose-50 text-rose-700",
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[statusTone])} />
          {STATUS_LABELS[review.status]}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-y-1.5 text-[11px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" /> {review.state}
        </div>
        <div className="text-right font-medium tabular-nums">
          {review.payor} · <span className="text-muted-foreground">{review.innOon}</span>
        </div>
        <div className="text-muted-foreground">Deductible</div>
        <div className="text-right font-medium tabular-nums">${review.deductible.toLocaleString()}</div>
        <div className="text-muted-foreground">Coinsurance</div>
        <div className="text-right font-medium tabular-nums">{review.coinsurance}%</div>
        <div className="text-muted-foreground">Staffing</div>
        <div className={cn(
          "text-right font-medium",
          review.staffing === "easy"      && "text-emerald-700",
          review.staffing === "moderate"  && "text-foreground",
          review.staffing === "difficult" && "text-amber-700",
          review.staffing === "high_risk" && "text-rose-700",
        )}>
          {STAFFING_LABEL[review.staffing]}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-[10.5px] text-muted-foreground">
        <span className="truncate">{review.assignedReviewer}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {review.updatedAt}</span>
      </div>
    </button>
  );
}
