import { Sparkles, BookOpen, FileText, Wand2, History, BarChart3, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deriveGuidance, type VobReview } from "@/lib/vob/mockData";
import {
  findBenefitsCheatSheetForLead,
  mapCheatSheetStatusToTone,
  useBenefitsKnowledge,
} from "@/lib/intake/leadBenefitsCheatSheets";
import { useBlossomAI } from "@/components/ai/BlossomAIAssistant";

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
  const blossom = useBlossomAI();
  const { rows: knowledge, loading } = useBenefitsKnowledge();
  const match = findBenefitsCheatSheetForLead({ insurance: review.payor, state: review.state });
  const tone = match.sheet ? mapCheatSheetStatusToTone(match.sheet.intakeStatus) : null;

  function askBlossomBenefits() {
    const parts = [
      "Give me the payer guidance for this VOB review:",
      `- Family: ${review.parentName}`,
      `- Payer: ${review.payor}`,
      `- State: ${review.state}`,
      match.sheet
        ? `- Matched: ${match.sheet.payer} (${match.sheet.state}) · ${match.sheet.intakeStatus}`
        : "- Matched: none (no persisted guidance yet)",
      match.sheet?.notes ? `- Notes: ${match.sheet.notes}` : null,
      `- Confidence: ${match.confidence}${match.sameState ? "" : " · cross-state"}`,
      "",
      "Summarize the recommended VOB decision and cite the Benefits Knowledge row you used.",
    ].filter(Boolean).join("\n");
    blossom.open({
      surface: "page-help",
      title: "Ask Blossom AI · Benefits Knowledge",
      contextText: parts,
      initialPrompt: parts,
      suggestions: [
        "What decision does this payer suggest?",
        "Any cross-state warnings I should flag?",
        "Draft the family benefit summary.",
      ],
    });
  }

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

      {/* BENEFITS KNOWLEDGE — live persisted payer guidance for this review */}
      <div className="rounded-2xl border border-border/50 bg-card/80 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[hsl(265_85%_96%)] text-[hsl(265_70%_45%)]">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight">Benefits Knowledge</h3>
            <p className="text-[10.5px] text-muted-foreground">
              {loading ? "Loading persisted guidance…" : `${knowledge.length} active payer rows`}
            </p>
          </div>
        </div>

        {match.sheet && tone ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold truncate">
                  {match.sheet.payer} <span className="text-muted-foreground font-normal">· {match.sheet.state}</span>
                </p>
                <p className="text-[10.5px] text-muted-foreground">
                  {match.sheet.insuranceCategory} · confidence {match.confidence}
                </p>
              </div>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap", tone.className)}>
                {tone.label}
              </span>
            </div>
            {!match.sameState && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 text-amber-900 px-2 py-1.5 text-[11px] flex gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{match.reason}</span>
              </div>
            )}
            {match.sheet.notes && (
              <p className="text-[11.5px] text-foreground/90">{match.sheet.notes}</p>
            )}
            <div className="rounded-lg bg-muted/40 border border-border/60 px-2.5 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Recommended action</p>
              <p className="text-[11.5px] text-foreground/90">{tone.recommendation}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            No persisted guidance matched <span className="font-medium text-foreground">{review.payor}</span>
            {review.state ? <> in <span className="font-medium text-foreground">{review.state}</span></> : null}.
          </p>
        )}

        <Button
          size="sm"
          onClick={askBlossomBenefits}
          className="mt-3 h-7 w-full text-[11px] bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white hover:opacity-90"
        >
          <Sparkles className="mr-1 h-3 w-3" /> Ask Blossom AI
        </Button>
      </div>
    </div>
  );
}
