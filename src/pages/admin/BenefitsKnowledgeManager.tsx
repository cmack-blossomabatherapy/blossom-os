import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, Search, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GrowthPageShell } from "@/components/os/growth/GrowthPageShell";
import {
  fetchBenefitsKnowledge,
  mapCheatSheetStatusToTone,
  type BenefitsKnowledgeRow,
  type CheatSheetState,
  type CheatSheetCategory,
  type CheatSheetStatus,
} from "@/lib/intake/leadBenefitsCheatSheets";

const STATES: CheatSheetState[] = ["Georgia", "Tennessee", "Virginia", "North Carolina", "Maryland"];
const CATEGORIES: CheatSheetCategory[] = ["MCO", "INN Commercials", "OON Commercial", "Misc"];
const STATUSES: CheatSheetStatus[] = ["TAKE", "TAKE-CONDITIONAL", "CONDITIONAL", "DON'T TAKE"];

type Draft = Partial<BenefitsKnowledgeRow> & {
  state?: CheatSheetState;
  payer?: string;
  insuranceCategory?: CheatSheetCategory;
  intakeStatus?: CheatSheetStatus;
  notes?: string;
  isActive?: boolean;
};

function toDb(d: Draft) {
  return {
    state: d.state,
    payer: d.payer,
    insurance_category: d.insuranceCategory,
    intake_status: d.intakeStatus,
    notes: d.notes ?? "",
    is_active: d.isActive ?? true,
  };
}

export default function BenefitsKnowledgeManager() {
  const [rows, setRows] = useState<BenefitsKnowledgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Record<string, Draft>>({});
  const [adding, setAdding] = useState<Draft | null>(null);

  async function reload() {
    setLoading(true);
    const r = await fetchBenefitsKnowledge({ includeInactive: true });
    setRows(r);
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (statusFilter !== "all" && r.intakeStatus !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!(r.payer + " " + r.notes + " " + r.state).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, stateFilter, statusFilter, query]);

  async function save(row: BenefitsKnowledgeRow) {
    const draft = editing[row.id!];
    if (!draft) return;
    const merged = { ...row, ...draft };
    const { error } = await (supabase as any)
      .from("benefits_knowledge")
      .update(toDb(merged))
      .eq("id", row.id);
    if (error) return toast.error("Save failed: " + error.message);
    toast.success(`Saved ${merged.payer}`);
    setEditing((e) => { const n = { ...e }; delete n[row.id!]; return n; });
    reload();
  }

  async function toggleActive(row: BenefitsKnowledgeRow) {
    const { error } = await (supabase as any)
      .from("benefits_knowledge")
      .update({ is_active: !row.isActive })
      .eq("id", row.id);
    if (error) return toast.error("Update failed: " + error.message);
    toast.success(`${!row.isActive ? "Activated" : "Deactivated"} ${row.payer}`);
    reload();
  }

  async function remove(row: BenefitsKnowledgeRow) {
    if (!confirm(`Delete ${row.payer} (${row.state})?`)) return;
    const { error } = await (supabase as any)
      .from("benefits_knowledge")
      .delete()
      .eq("id", row.id);
    if (error) return toast.error("Delete failed: " + error.message);
    toast.success("Deleted");
    reload();
  }

  async function createRow() {
    if (!adding?.state || !adding?.payer || !adding?.insuranceCategory || !adding?.intakeStatus) {
      return toast.error("State, payer, category, and status are required");
    }
    const { error } = await (supabase as any)
      .from("benefits_knowledge")
      .insert(toDb({ isActive: true, ...adding }));
    if (error) return toast.error("Create failed: " + error.message);
    toast.success("Payer guidance added");
    setAdding(null);
    reload();
  }

  return (
    <GrowthPageShell
      eyebrow="Admin · Backend"
      title="Benefits Knowledge"
      description="Canonical payer guidance used by Blossom AI, the lead drawer, and the VOB Decision Center. Operators read active rows only."
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search payer, state, notes…" className="pl-8" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={reload}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
        <Button size="sm" onClick={() => setAdding({ isActive: true, notes: "" })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add payer
        </Button>
      </div>

      {adding && (
        <div className="mb-4 rounded-xl border border-border p-3 bg-secondary/30">
          <p className="text-xs font-semibold mb-2">New payer guidance</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <Select value={adding.state} onValueChange={(v) => setAdding({ ...adding, state: v as CheatSheetState })}>
              <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent>{STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
            <Input placeholder="Payer" value={adding.payer ?? ""} onChange={(e) => setAdding({ ...adding, payer: e.target.value })} />
            <Select value={adding.insuranceCategory} onValueChange={(v) => setAdding({ ...adding, insuranceCategory: v as CheatSheetCategory })}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={adding.intakeStatus} onValueChange={(v) => setAdding({ ...adding, intakeStatus: v as CheatSheetStatus })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
            <Input placeholder="Notes" value={adding.notes ?? ""} onChange={(e) => setAdding({ ...adding, notes: e.target.value })} />
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={createRow}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left p-2">State</th>
              <th className="text-left p-2">Payer</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Notes</th>
              <th className="text-left p-2">Active</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Loading…</td></tr>)}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No rows match your filters.</td></tr>
            )}
            {filtered.map((row) => {
              const draft = editing[row.id!];
              const isDirty = Boolean(draft);
              const tone = mapCheatSheetStatusToTone(row.intakeStatus);
              const patch = (p: Partial<Draft>) => setEditing((e) => ({ ...e, [row.id!]: { ...e[row.id!], ...p } }));
              return (
                <tr key={row.id} className="border-t border-border/50">
                  <td className="p-2">{row.state}</td>
                  <td className="p-2 font-medium">
                    <Input
                      value={draft?.payer ?? row.payer}
                      onChange={(e) => patch({ payer: e.target.value })}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Select value={draft?.insuranceCategory ?? row.insuranceCategory} onValueChange={(v) => patch({ insuranceCategory: v as CheatSheetCategory })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select value={draft?.intakeStatus ?? row.intakeStatus} onValueChange={(v) => patch({ intakeStatus: v as CheatSheetStatus })}>
                      <SelectTrigger className="h-8">
                        <Badge className={tone.className}>{draft?.intakeStatus ?? row.intakeStatus}</Badge>
                      </SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      value={draft?.notes ?? row.notes}
                      onChange={(e) => patch({ notes: e.target.value })}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Switch checked={row.isActive ?? true} onCheckedChange={() => toggleActive(row)} />
                  </td>
                  <td className="p-2 text-right whitespace-nowrap">
                    {isDirty && (
                      <Button size="sm" variant="outline" className="mr-1" onClick={() => save(row)}>
                        <Save className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(row)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GrowthPageShell>
  );
}