import { Sparkles, BookOpen, FileText, Wand2, History, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deriveGuidance, PAYOR_INTEL, type VobReview } from "@/lib/vob/mockData";

const TONE_BAR: Record<string, string> = {
  ok:   "border-l-emerald-400 bg-emerald-50/50",
  warn: "border-l-amber-400 bg-amber-50/50",
  crit: "border-l-rose-400 bg-rose-50/50",
};
const TONE_ICON: Record<string, string> = {
  ok: "text-emerald-600", warn: "text-amber-600", crit: "text-rose-600",
};

export function VobAiPanel({ review }: { review: VobReview }) {
  const insights = deriveGuidance(review);

  function quick(label: string) {
    toast.success("AI guidance ready", { description: `${label} prepared for ${review.parentName}.` });
  }

  return (
    <div className="space-y-4">
      {/* AI GUIDANCE */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-white via-[hsl(265_100%_99%)] to-[hsl(280_100%_98%)] p-4 shadow-[0_20px_50px_-30px_hsl(265_70%_55%/0.35)]">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight">AI VOB guidance</h3>
            <p className="text-[10.5px] text-muted-foreground">Rule-based suggestions · mock for now</p>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5">
          {insights.map((g, i) => (
            <li key={i} className={cn("rounded-lg border-l-2 px-2.5 py-2 text-[12px] leading-snug", TONE_BAR[g.tone])}>
              <span className={cn("mr-1 font-semibold", TONE_ICON[g.tone])}>•</span>{g.text}
            </li>
          ))}
        </ul>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => quick("Case summary")}>
            <FileText className="mr-1 h-3 w-3" /> Summarize
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => quick("Suggested decision")}>
            <Wand2 className="mr-1 h-3 w-3" /> Suggest decision
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => quick("Payor comparison")}>
            <History className="mr-1 h-3 w-3" /> Compare payors
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => quick("Family summary")}>
            <BarChart3 className="mr-1 h-3 w-3" /> Family summary
          </Button>
        </div>
      </div>

      {/* INSURANCE KNOWLEDGE BASE */}
      <div className="rounded-2xl border border-border/50 bg-card/80 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[hsl(265_85%_96%)] text-[hsl(265_70%_45%)]">
            <BookOpen className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight">Insurance guide</h3>
            <p className="text-[10.5px] text-muted-foreground">Payor knowledge base · replaces tribal spreadsheets</p>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 text-[12px]">
          {PAYOR_INTEL.slice(0, 6).map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/20 px-2.5 py-1.5">
              <span className="font-medium">
                {p.payor}{p.state !== "*" && <span className="text-muted-foreground"> · {p.state}</span>}
              </span>
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em]",
                p.category === "green"  && "bg-emerald-600 text-white",
                p.category === "yellow" && "bg-amber-500 text-white",
                p.category === "red"    && "bg-rose-600 text-white",
              )}>
                {p.category === "green" ? "Hard Yes" : p.category === "yellow" ? "Mid" : "Hard No"}
              </span>
            </li>
          ))}
        </ul>
        <Button size="sm" variant="ghost" className="mt-2 h-7 w-full text-[11px] text-[hsl(265_70%_45%)] hover:bg-[hsl(265_85%_96%)]">
          Open full insurance guide
        </Button>
      </div>
    </div>
  );
}
