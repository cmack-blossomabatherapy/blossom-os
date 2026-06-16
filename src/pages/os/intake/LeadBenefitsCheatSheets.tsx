import { useMemo, useState } from "react";
import { Search, ShieldCheck, AlertCircle, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { GrowthPageShell, Section } from "@/components/os/growth/GrowthPageShell";
import { cn } from "@/lib/utils";

type Status = "in_network" | "out_of_network" | "no_oon" | "needs_review";

interface CheatSheet {
  id: string;
  insurance: string;
  category: "Commercial" | "Medicaid" | "Tricare" | "Self-Pay";
  status: Status;
  notes: string;
  lastReviewed: string;
  owner: string;
}

const STATUS_LABEL: Record<Status, string> = {
  in_network: "In Network",
  out_of_network: "Out of Network",
  no_oon: "No OON Benefits",
  needs_review: "Needs Review",
};

const STATUS_TONE: Record<Status, string> = {
  in_network: "bg-emerald-50 text-emerald-700 border-emerald-200",
  out_of_network: "bg-amber-50 text-amber-800 border-amber-200",
  no_oon: "bg-rose-50 text-rose-700 border-rose-200",
  needs_review: "bg-sky-50 text-sky-700 border-sky-200",
};

const DATA: CheatSheet[] = [
  { id: "bcbs-nc", insurance: "BCBS NC", category: "Commercial", status: "in_network", notes: "ABA covered with prior auth. 20 hrs/wk typical approval.", lastReviewed: "Apr 1", owner: "Maria" },
  { id: "aetna", insurance: "Aetna", category: "Commercial", status: "in_network", notes: "Requires diagnostic eval within 12 months.", lastReviewed: "Mar 28", owner: "Sam" },
  { id: "united", insurance: "UnitedHealthcare", category: "Commercial", status: "out_of_network", notes: "OON benefits available; verify deductible.", lastReviewed: "Mar 22", owner: "Alex" },
  { id: "cigna", insurance: "Cigna", category: "Commercial", status: "no_oon", notes: "No OON benefits — recommend in-network alternative.", lastReviewed: "Mar 18", owner: "Maria" },
  { id: "medicaid-ga", insurance: "GA Medicaid", category: "Medicaid", status: "in_network", notes: "Requires Medicaid ID + recent diagnostic report.", lastReviewed: "Apr 3", owner: "Sam" },
  { id: "tricare-east", insurance: "Tricare East", category: "Tricare", status: "in_network", notes: "ECHO program — confirm sponsor enrollment.", lastReviewed: "Mar 30", owner: "Alex" },
  { id: "self-pay", insurance: "Self-Pay", category: "Self-Pay", status: "needs_review", notes: "Confirm rate sheet and payment plan options.", lastReviewed: "Feb 10", owner: "Maria" },
];

export default function LeadBenefitsCheatSheets() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => DATA.filter((d) => {
    if (cat !== "all" && d.category !== cat) return false;
    if (search && !(d.insurance + " " + d.notes).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, cat]);

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Lead Benefits Cheat Sheets"
      description="Quick payer and benefit guidance to support intake, eligibility review, and lead qualification."
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-2xl border border-border/60 bg-card/50">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payer or note…" className="pl-9 h-9 bg-transparent border-0 focus-visible:ring-0" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="Medicaid">Medicaid</SelectItem>
            <SelectItem value="Tricare">Tricare</SelectItem>
            <SelectItem value="Self-Pay">Self-Pay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Section title="Cheat sheets">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((d) => (
            <article key={d.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">{d.insurance}</h3>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{d.category}</div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0 border", STATUS_TONE[d.status])}>
                  {STATUS_LABEL[d.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{d.notes}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Owner · {d.owner}</span>
                <span>Reviewed {d.lastReviewed}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8"><AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Mark needs review</Button>
                {isAdmin && <Button size="sm" variant="ghost" className="h-8"><Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit</Button>}
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-xs text-muted-foreground p-3">No payer matches those filters.</div>
        )}
      </Section>
    </GrowthPageShell>
  );
}