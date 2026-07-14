import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Search, Filter, Download, ExternalLink, Lock, ShieldAlert, User, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/resources/resourceData";
import {
  LIBRARY_SECTIONS, groupBySection, fileTypeLabel, LIBRARY_DEPARTMENTS,
  type LibrarySectionId,
} from "@/lib/resources/librarySections";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cleanResourceTitle } from "@/lib/resources/resourceDisplay";

export interface ResourceListViewProps {
  resources: Resource[];
  loading?: boolean;
  emptyMessage?: string;
  /** Restrict shown sections (default: all). */
  sections?: LibrarySectionId[];
  /** Hide the section grouping and render as a single flat grid. */
  flat?: boolean;
}

const FILE_TYPES = ["PDF", "DOCX", "XLSX", "CSV", "Video", "Image", "Text", "File"];

export function ResourceListView({
  resources, loading, emptyMessage = "No resources match your filters yet.",
  sections, flat,
}: ResourceListViewProps) {
  const { role } = useOSRole();
  const isSuper = role === "super_admin";

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [fileType, setFileType] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [owner, setOwner] = useState<string>("all");
  const [sopOnly, setSopOnly] = useState(false);
  const [trainingOnly, setTrainingOnly] = useState(false);
  const [sensitiveOnly, setSensitiveOnly] = useState(false);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => (r.tags ?? []).forEach((t) => t && set.add(t)));
    return Array.from(set).sort().slice(0, 200);
  }, [resources]);
  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => (r.states ?? []).forEach((s) => s && set.add(s)));
    return Array.from(set).sort();
  }, [resources]);
  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => { if (r.owner) set.add(r.owner); });
    return Array.from(set).sort();
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (q) {
        const hay = [
          r.title, r.description, r.owner, r.fileName,
          ...(r.tags ?? []), ...(r.departments ?? []), ...(r.roles ?? []),
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dept !== "all") {
        const bucket = LIBRARY_DEPARTMENTS.find((d) => d.id === dept);
        if (bucket && !bucket.match(r)) return false;
      }
      if (fileType !== "all" && fileTypeLabel(r) !== fileType) return false;
      if (tag !== "all" && !(r.tags ?? []).includes(tag)) return false;
      if (stateFilter !== "all" && !(r.states ?? []).includes(stateFilter)) return false;
      if (owner !== "all" && r.owner !== owner) return false;
      if (sopOnly && !(r.sopRelated || r.type === "SOP")) return false;
      if (trainingOnly && !(r.trainingRelated || r.category === "training")) return false;
      if (sensitiveOnly && !r.isSensitive) return false;
      return true;
    });
  }, [resources, query, dept, fileType, tag, stateFilter, owner, sopOnly, trainingOnly, sensitiveOnly]);

  const grouped = useMemo(() => groupBySection(filtered), [filtered]);
  const showSections = sections ?? LIBRARY_SECTIONS.map((s) => s.id);

  return (
    <div className="space-y-6">
      {/* Filter panel */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, description, tag, owner…"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            {filtered.length} of {resources.length} resources
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          <FilterSelect label="Department" value={dept} onChange={setDept}
            options={[{ v: "all", l: "All" }, ...LIBRARY_DEPARTMENTS.map((d) => ({ v: d.id, l: d.name }))]} />
          <FilterSelect label="File type" value={fileType} onChange={setFileType}
            options={[{ v: "all", l: "All" }, ...FILE_TYPES.map((f) => ({ v: f, l: f }))]} />
          <FilterSelect label="Topic tag" value={tag} onChange={setTag}
            options={[{ v: "all", l: "All" }, ...tagOptions.map((t) => ({ v: t, l: t }))]} />
          <FilterSelect label="State scope" value={stateFilter} onChange={setStateFilter}
            options={[{ v: "all", l: "All" }, ...stateOptions.map((s) => ({ v: s, l: s }))]} />
          <FilterSelect label="Owner" value={owner} onChange={setOwner}
            options={[{ v: "all", l: "All" }, ...ownerOptions.map((o) => ({ v: o, l: o }))]} />
          <div className="flex flex-col justify-between gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2">
            <div className="flex items-center justify-between text-[11.5px]">
              <Label htmlFor="sop-only" className="text-muted-foreground">SOP-related</Label>
              <Switch id="sop-only" checked={sopOnly} onCheckedChange={setSopOnly} />
            </div>
            <div className="flex items-center justify-between text-[11.5px]">
              <Label htmlFor="training-only" className="text-muted-foreground">Training-related</Label>
              <Switch id="training-only" checked={trainingOnly} onCheckedChange={setTrainingOnly} />
            </div>
            {isSuper && (
              <div className="flex items-center justify-between text-[11.5px]">
                <Label htmlFor="sensitive-only" className="text-muted-foreground">Sensitive only</Label>
                <Switch id="sensitive-only" checked={sensitiveOnly} onCheckedChange={setSensitiveOnly} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          Loading resources…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : flat ? (
        <ResourceGrid items={filtered} />
      ) : (
        <div className="space-y-8">
          {LIBRARY_SECTIONS.filter((s) => showSections.includes(s.id) && grouped[s.id].length > 0).map((s) => (
            <section key={s.id}>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">{s.title}</h2>
                  <p className="text-[12.5px] text-muted-foreground">{s.subtitle}</p>
                </div>
                <span className="text-[11.5px] text-muted-foreground">{grouped[s.id].length}</span>
              </div>
              <ResourceGrid items={grouped[s.id]} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 rounded-xl bg-card/70 text-[12.5px]"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v} className="text-[12.5px]">{o.l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ResourceGrid({ items }: { items: Resource[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((r) => (<ResourceCard key={r.id} r={r} />))}
    </div>
  );
}

function ResourceCard({ r }: { r: Resource }) {
  const ft = fileTypeLabel(r);
  return (
    <Link
      to={`/resource-library/resource/${r.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_10px_28px_-14px_hsl(220_15%_30%/0.1)]"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full text-[10.5px]">{ft}</Badge>
          {r.isSensitive && (
            <Badge className="rounded-full bg-amber-100 text-[10.5px] text-amber-800">
              <Lock className="mr-1 h-2.5 w-2.5" /> Sensitive
            </Badge>
          )}
          {r.requiresAcknowledgement && (
            <Badge className="rounded-full bg-blue-100 text-[10.5px] text-blue-800">Ack required</Badge>
          )}
        </div>
        <h3 className="text-[13.5px] font-semibold text-foreground group-hover:text-primary">
          {cleanResourceTitle(r.title)}
        </h3>
        {r.description && (
          <p className="line-clamp-2 text-[12px] text-muted-foreground">{r.description}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {r.owner && (
          <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{r.owner}</span>
        )}
        {r.lastReviewedDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Reviewed {new Date(r.lastReviewedDate).toLocaleDateString()}
          </span>
        )}
        {(r.departments ?? []).slice(0, 2).map((d) => (
          <span key={d} className="rounded-full bg-muted px-1.5 py-0.5">{d}</span>
        ))}
      </div>
    </Link>
  );
}

export { ShieldAlert, Download, ExternalLink };
