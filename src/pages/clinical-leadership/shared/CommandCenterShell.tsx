import { ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Download, Filter, Save, Star, RotateCcw, ChevronLeft, History } from "lucide-react";
import { useClinicalFilters } from "./useClinicalFilters";
import { useSavedViews } from "./useSavedViews";
import { exportRowsToCsv } from "./exportCsv";
import type { ExceptionRow } from "./types";

type FacetOption = { value: string; label: string };

type Kpi = { label: string; value: ReactNode; hint?: string; tone?: "default" | "warn" | "danger" | "good" };

export function CommandCenterShell({
  scopeKey, title, description, kpis, children, exceptions, facets, auditPath,
  freshness,
}: {
  scopeKey: string;
  title: string;
  description: string;
  kpis: Kpi[];
  children: ReactNode;
  exceptions?: ExceptionRow[];
  facets: { states: FacetOption[]; clinics: FacetOption[]; bcbas: FacetOption[] };
  auditPath?: string;
  freshness?: { source: string; lastSyncedAt?: string | null };
}) {
  const { filters, setFilter, reset, applyFilters } = useClinicalFilters();
  const { views, save, remove } = useSavedViews(scopeKey);
  const [newName, setNewName] = useState("");

  const activeFilters = useMemo(
    () => [filters.state, filters.clinic, filters.bcbaId].filter(Boolean).length,
    [filters],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/clinical-leadership" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="h-3 w-3" /> Clinical Leadership
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{title}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Filters
                {activeFilters > 0 && <Badge variant="secondary" className="ml-1">{activeFilters}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 space-y-3">
              <FacetSelect label="State" value={filters.state} options={facets.states} onChange={(v) => setFilter("state", v)} />
              <FacetSelect label="Clinic" value={filters.clinic} options={facets.clinics} onChange={(v) => setFilter("clinic", v)} />
              <FacetSelect label="BCBA" value={filters.bcbaId} options={facets.bcbas} onChange={(v) => setFilter("bcbaId", v)} />
              <Button size="sm" variant="ghost" className="w-full gap-2" onClick={reset}>
                <RotateCcw className="h-3 w-3" /> Reset filters
              </Button>
            </PopoverContent>
          </Popover>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Star className="h-4 w-4" /> Saved views
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <SheetHeader><SheetTitle>Saved views</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="View name" />
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={!newName.trim()}
                    onClick={async () => {
                      await save(newName.trim(), filters);
                      setNewName("");
                    }}
                  >
                    <Save className="h-3 w-3" /> Save
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Views save the current state, clinic, and BCBA filters.</div>
                <div className="mt-4 space-y-1">
                  {views.length === 0 && <div className="text-sm text-muted-foreground">No saved views yet.</div>}
                  {views.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                      <button className="text-left flex-1" onClick={() => applyFilters(v.filters)}>{v.name}</button>
                      <Button size="sm" variant="ghost" onClick={() => remove(v.id)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {exceptions && exceptions.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportRowsToCsv(scopeKey, exceptions)}>
              <Download className="h-4 w-4" /> Export
            </Button>
          )}
          {auditPath && (
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to={auditPath}><History className="h-4 w-4" /> Audit</Link>
            </Button>
          )}
        </div>
      </div>

      {(filters.state || filters.clinic || filters.bcbaId) && (
        <div className="flex flex-wrap gap-2">
          {filters.state && <Badge variant="secondary">State · {filters.state}</Badge>}
          {filters.clinic && <Badge variant="secondary">Clinic · {filters.clinic}</Badge>}
          {filters.bcbaId && (
            <Badge variant="secondary">
              BCBA · {facets.bcbas.find((b) => b.value === filters.bcbaId)?.label ?? filters.bcbaId}
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
              <div className={`mt-1 text-2xl font-semibold ${
                k.tone === "danger" ? "text-destructive" :
                k.tone === "warn" ? "text-amber-600" :
                k.tone === "good" ? "text-emerald-600" : ""}`}>
                {k.value}
              </div>
              {k.hint && <div className="text-[11px] text-muted-foreground mt-1">{k.hint}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {children}

      {freshness && (
        <div className="text-[11px] text-muted-foreground text-right">
          Source: {freshness.source}
          {freshness.lastSyncedAt ? ` · Refreshed ${new Date(freshness.lastSyncedAt).toLocaleString()}` : ""}
        </div>
      )}
    </div>
  );
}

function FacetSelect({ label, value, options, onChange }: {
  label: string; value: string | null; options: FacetOption[]; onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <Select value={value ?? "__all"} onValueChange={(v) => onChange(v === "__all" ? null : v)}>
        <SelectTrigger><SelectValue placeholder={`All ${label.toLowerCase()}s`} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ExceptionList({
  title, rows, emptyLabel, onAssign,
}: {
  title: string;
  rows: ExceptionRow[];
  emptyLabel?: string;
  onAssign?: (row: ExceptionRow) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{rows.length} item{rows.length === 1 ? "" : "s"}</div>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{emptyLabel || "You're all caught up."}</div>
        ) : (
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-start justify-between gap-4 hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{r.title}</span>
                    {r.severity && (
                      <Badge
                        variant="outline"
                        className={
                          r.severity === "critical" ? "border-red-300 text-red-700" :
                          r.severity === "high" ? "border-amber-300 text-amber-700" :
                          r.severity === "medium" ? "border-blue-300 text-blue-700" :
                          "border-muted text-muted-foreground"
                        }
                      >
                        {r.severity}
                      </Badge>
                    )}
                    {r.status && <Badge variant="secondary">{r.status}</Badge>}
                  </div>
                  {r.subtitle && <div className="text-xs text-muted-foreground mt-0.5">{r.subtitle}</div>}
                  <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {r.owner && <span>Owner: {r.owner}</span>}
                    {r.dueDate && <span>Due: {new Date(r.dueDate).toLocaleDateString()}</span>}
                    {r.sourceLabel && <span>Source: {r.sourceLabel}{r.sourceDate ? ` · ${new Date(r.sourceDate).toLocaleDateString()}` : ""}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.detailPath && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={r.detailPath}>Open</Link>
                    </Button>
                  )}
                  {onAssign && (
                    <Button size="sm" variant="outline" onClick={() => onAssign(r)}>Assign</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}