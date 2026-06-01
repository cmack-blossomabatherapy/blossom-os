import { useEffect, useMemo, useState } from "react";
import { Filter, Bookmark, Check, Trash2, Plus, ChevronDown, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SdUrgency = "all" | "critical" | "high" | "medium" | "low";
export type SdRange = "1w" | "2w" | "4w" | "mtd" | "ytd" | "custom";

export interface SdFilters {
  state: string;          // "VA" | "NC" | ...
  region: string;         // "All" | region label
  range: SdRange;
  from?: string;          // ISO date when custom
  to?: string;            // ISO date when custom
  urgency: SdUrgency;
}

export interface SavedView {
  id: string;
  name: string;
  filters: SdFilters;
}

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"];
const REGIONS: Record<string, string[]> = {
  VA: ["All", "Richmond", "Arlington", "Norfolk", "Roanoke", "Charlottesville"],
  NC: ["All", "Charlotte", "Raleigh", "Greensboro"],
  GA: ["All", "Atlanta", "Savannah"],
  TN: ["All", "Nashville", "Memphis"],
  MD: ["All", "Baltimore", "Bethesda"],
};
const RANGE_LABEL: Record<SdRange, string> = {
  "1w": "1 week", "2w": "2 weeks", "4w": "4 weeks", mtd: "Month to date", ytd: "Year to date", custom: "Custom",
};
const URGENCY_LABEL: Record<SdUrgency, string> = {
  all: "All urgencies", critical: "Critical", high: "High", medium: "Medium", low: "Low",
};

export const DEFAULT_SD_FILTERS: SdFilters = { state: "VA", region: "All", range: "4w", urgency: "all" };

function storageKey(reportId: string) { return `sd-views::${reportId}`; }
function lastKey(reportId: string) { return `sd-filters::${reportId}`; }

export function loadSavedViews(reportId: string): SavedView[] {
  try { return JSON.parse(localStorage.getItem(storageKey(reportId)) || "[]"); } catch { return []; }
}
function persistViews(reportId: string, v: SavedView[]) {
  localStorage.setItem(storageKey(reportId), JSON.stringify(v));
}
export function loadLastFilters(reportId: string): SdFilters {
  try { return { ...DEFAULT_SD_FILTERS, ...(JSON.parse(localStorage.getItem(lastKey(reportId)) || "null") || {}) }; }
  catch { return DEFAULT_SD_FILTERS; }
}
function persistLast(reportId: string, f: SdFilters) {
  localStorage.setItem(lastKey(reportId), JSON.stringify(f));
}

interface Props {
  reportId: string;
  filters: SdFilters;
  onChange: (next: SdFilters) => void;
}

export function SdFilterBar({ reportId, filters, onChange }: Props) {
  const [views, setViews] = useState<SavedView[]>(() => loadSavedViews(reportId));
  const [newName, setNewName] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => { persistLast(reportId, filters); }, [reportId, filters]);
  useEffect(() => { setViews(loadSavedViews(reportId)); }, [reportId]);

  const regions = REGIONS[filters.state] || ["All"];

  const customLabel = filters.range === "custom" && filters.from && filters.to
    ? `${format(new Date(filters.from), "MMM d")} – ${format(new Date(filters.to), "MMM d")}`
    : undefined;

  function update<K extends keyof SdFilters>(k: K, v: SdFilters[K]) {
    onChange({ ...filters, [k]: v });
  }
  function saveView() {
    const name = newName.trim();
    if (!name) return;
    const next = [...views.filter(v => v.name !== name), { id: crypto.randomUUID(), name, filters }];
    setViews(next); persistViews(reportId, next); setNewName(""); setSaveOpen(false);
  }
  function applyView(v: SavedView) { onChange(v.filters); }
  function deleteView(id: string) {
    const next = views.filter(v => v.id !== id);
    setViews(next); persistViews(reportId, next);
  }
  function resetFilters() { onChange(DEFAULT_SD_FILTERS); }

  const hasCustom = JSON.stringify(filters) !== JSON.stringify(DEFAULT_SD_FILTERS);

  return (
    <section className="mt-4 space-y-2 rounded-2xl border border-border/60 bg-card px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Filters</span>

        <PillSelect label="State" value={filters.state} options={STATES.map(s => ({ value: s, label: s }))}
          onSelect={(v) => onChange({ ...filters, state: v, region: "All" })} />

        <PillSelect label="Region" value={filters.region}
          options={regions.map(r => ({ value: r, label: r }))} onSelect={(v) => update("region", v)} />

        <RangePill filters={filters} onChange={onChange} customLabel={customLabel} />

        <PillSelect label="Urgency" value={filters.urgency}
          options={(Object.keys(URGENCY_LABEL) as SdUrgency[]).map(u => ({ value: u, label: URGENCY_LABEL[u] }))}
          onSelect={(v) => update("urgency", v as SdUrgency)} />

        {hasCustom && (
          <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> Reset
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Popover open={saveOpen} onOpenChange={setSaveOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 rounded-full text-[11.5px]">
                <Plus className="mr-1 h-3 w-3" /> Save view
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <p className="text-[11.5px] font-semibold tracking-tight">Save current filters</p>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. VA · Critical · 1w"
                className="mt-2 h-8 text-[12.5px]" onKeyDown={(e) => e.key === "Enter" && saveView()} />
              <div className="mt-2 flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" className="h-7" onClick={() => setSaveOpen(false)}>Cancel</Button>
                <Button size="sm" className="h-7" onClick={saveView}>Save</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {views.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2">
          <Bookmark className="h-3 w-3 text-[hsl(265_70%_55%)]" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Saved views</span>
          {views.map(v => {
            const active = JSON.stringify(v.filters) === JSON.stringify(filters);
            return (
              <span key={v.id} className={cn(
                "group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition",
                active
                  ? "border-[hsl(265_70%_55%/0.4)] bg-[hsl(265_70%_55%/0.08)] text-[hsl(265_70%_45%)]"
                  : "border-border/60 bg-secondary/40 text-foreground hover:bg-secondary/60"
              )}>
                <button onClick={() => applyView(v)} className="inline-flex items-center gap-1">
                  {active && <Check className="h-3 w-3" />} {v.name}
                </button>
                <button onClick={() => deleteView(v.id)} className="opacity-0 transition group-hover:opacity-100" aria-label="Delete view">
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------- small pieces ---------- */

function PillSelect({ label, value, options, onSelect }: {
  label: string; value: string; options: { value: string; label: string }[]; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value)?.label ?? value;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-secondary/60">
          <span className="text-muted-foreground">{label}:</span> {current}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1">
        {options.map(o => (
          <button key={o.value} onClick={() => { onSelect(o.value); setOpen(false); }}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-secondary/60",
              o.value === value && "bg-secondary/50 font-semibold"
            )}>
            {o.label}
            {o.value === value && <Check className="h-3 w-3 text-[hsl(265_70%_55%)]" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function RangePill({ filters, onChange, customLabel }: {
  filters: SdFilters; onChange: (f: SdFilters) => void; customLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const presets: SdRange[] = ["1w", "2w", "4w", "mtd", "ytd"];
  const label = filters.range === "custom" && customLabel ? customLabel : RANGE_LABEL[filters.range];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-secondary/60">
          <span className="text-muted-foreground">Range:</span> {label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="flex flex-wrap gap-1">
          {presets.map(p => (
            <button key={p} onClick={() => { onChange({ ...filters, range: p, from: undefined, to: undefined }); setOpen(false); }}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11.5px] font-medium",
                filters.range === p ? "bg-[hsl(265_70%_55%)] text-white" : "bg-secondary/40 hover:bg-secondary/60"
              )}>{RANGE_LABEL[p]}</button>
          ))}
        </div>
        <div className="mt-2 border-t border-border/40 pt-2">
          <p className="px-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Custom range</p>
          <Calendar
            mode="range"
            selected={filters.from && filters.to ? { from: new Date(filters.from), to: new Date(filters.to) } : undefined}
            onSelect={(r) => {
              if (r?.from && r?.to) {
                onChange({ ...filters, range: "custom", from: r.from.toISOString(), to: r.to.toISOString() });
              }
            }}
            numberOfMonths={1}
            className={cn("p-2 pointer-events-auto")}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Render a compact summary of active filters (used for chips/exports). */
export function summarizeFilters(f: SdFilters): string {
  const parts = [f.state, f.region !== "All" ? f.region : null, RANGE_LABEL[f.range],
    f.urgency !== "all" ? URGENCY_LABEL[f.urgency] : null].filter(Boolean);
  return parts.join(" · ");
}