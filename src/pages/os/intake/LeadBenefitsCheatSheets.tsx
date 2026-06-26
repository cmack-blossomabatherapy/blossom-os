import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, Copy, MapPin, Tag, List, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GrowthPageShell, Section } from "@/components/os/growth/GrowthPageShell";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  leadBenefitsCheatSheets,
  mapCheatSheetStatusToTone,
  type CheatSheetStatus,
} from "@/lib/intake/leadBenefitsCheatSheets";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";

type SortKey = "payer" | "state" | "status";
const STATUS_ORDER: Record<string, number> = {
  "TAKE": 0,
  "TAKE-CONDITIONAL": 1,
  "CONDITIONAL": 2,
  "DON'T TAKE": 3,
};

export default function LeadBenefitsCheatSheets() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");
  const { stateFilter: intakeState } = useIntakeStateFilter();
  const [stateFilter, setStateFilter] = useState<string>(intakeState === "ALL" ? "all" : intakeState);
  // Keep the local state dropdown in sync with the cross-page intake state filter.
  useEffect(() => {
    setStateFilter(intakeState === "ALL" ? "all" : intakeState);
  }, [intakeState]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("state");

  const filtered = useMemo(() => {
    const out = leadBenefitsCheatSheets.filter((d) => {
      if (cat !== "all" && d.insuranceCategory !== cat) return false;
      if (stateFilter !== "all" && d.state !== stateFilter) return false;
      if (statusFilter !== "all" && d.intakeStatus !== statusFilter) return false;
      if (search && !(d.payer + " " + d.notes + " " + d.state).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    out.sort((a, b) => {
      if (sort === "payer") return a.payer.localeCompare(b.payer);
      if (sort === "state") return a.state.localeCompare(b.state) || a.payer.localeCompare(b.payer);
      return (STATUS_ORDER[a.intakeStatus] ?? 9) - (STATUS_ORDER[b.intakeStatus] ?? 9) || a.payer.localeCompare(b.payer);
    });
    return out;
  }, [search, cat, stateFilter, statusFilter, sort]);

  const copyGuidance = async (payer: string, notes: string, status: CheatSheetStatus) => {
    const tone = mapCheatSheetStatusToTone(status);
    const text = `${payer} — ${status}\n${notes}\nRecommendation: ${tone.recommendation}`;
    try { await navigator.clipboard.writeText(text); toast.success(`Copied guidance for ${payer}`); }
    catch { toast.error("Could not copy"); }
  };

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Lead Benefits Cheat Sheets"
      description="Real payer-by-payer intake guidance synced from the Monday source board. Use to qualify leads quickly and route safely."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: List, to: "/leads" },
      ]}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-2xl border border-border/60 bg-card/50">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payer, note, or state…" className="pl-9 h-9 bg-transparent border-0 focus-visible:ring-0" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="MCO">MCO</SelectItem>
            <SelectItem value="INN Commercials">INN Commercials</SelectItem>
            <SelectItem value="OON Commercial">OON Commercial</SelectItem>
            <SelectItem value="Misc">Misc</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="North Carolina">North Carolina</SelectItem>
            <SelectItem value="Tennessee">Tennessee</SelectItem>
            <SelectItem value="Virginia">Virginia</SelectItem>
            <SelectItem value="Maryland">Maryland</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="TAKE">TAKE</SelectItem>
            <SelectItem value="TAKE-CONDITIONAL">TAKE-CONDITIONAL</SelectItem>
            <SelectItem value="CONDITIONAL">CONDITIONAL</SelectItem>
            <SelectItem value="DON'T TAKE">DON&apos;T TAKE</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="state">Sort: State</SelectItem>
            <SelectItem value="payer">Sort: Payer</SelectItem>
            <SelectItem value="status">Sort: Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Section title={`Cheat sheets (${filtered.length})`}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((d) => {
            const tone = mapCheatSheetStatusToTone(d.intakeStatus);
            return (
              <article key={`${d.state}-${d.payer}`} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground truncate">{d.payer}</h3>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.state}</span>
                      <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" /> {d.insuranceCategory}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] font-semibold px-1.5 py-0 border whitespace-nowrap", tone.className)}>
                    {tone.label}
                  </Badge>
                </div>
                {d.notes && (
                  <p className="text-xs text-foreground/90 mt-2">{d.notes}</p>
                )}
                <div className="mt-3 rounded-lg border border-border/60 bg-muted/40 p-2">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">Recommended action</div>
                  <p className="text-[11px] text-foreground/90 leading-relaxed">{tone.recommendation}</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Source: Monday board</span>
                  {d.mondayItemId && <span className="font-mono">#{d.mondayItemId}</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => copyGuidance(d.payer, d.notes, d.intakeStatus)}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy guidance
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-xs text-muted-foreground p-3">No payer matches those filters.</div>
        )}
      </Section>
    </GrowthPageShell>
  );
}