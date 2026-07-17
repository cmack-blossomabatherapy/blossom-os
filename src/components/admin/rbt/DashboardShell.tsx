import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Kpi {
  label: string;
  value: string | number;
  tone?: "default" | "warn" | "danger" | "good";
  hint?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  freshness?: string;
  source?: string;
  kpis?: Kpi[];
  filters?: ReactNode;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  onExport?: () => void;
  onRefresh?: () => void;
  backTo?: string;
  children: ReactNode;
}

const toneClass: Record<NonNullable<Kpi["tone"]>, string> = {
  default: "text-foreground",
  warn: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  good: "text-emerald-600 dark:text-emerald-400",
};

export function DashboardShell({
  title, subtitle, freshness, source, kpis = [], filters, search, onExport, onRefresh, backTo = "/admin/rbt", children,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 pb-16 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={backTo} className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> RBT Admin
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
          {(source || freshness) && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {source && <span>Source: {source}</span>}
              {source && freshness && <span> · </span>}
              {freshness && <span>Updated {freshness}</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button size="sm" variant="ghost" onClick={onRefresh}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
          )}
          {onExport && (
            <Button size="sm" variant="outline" onClick={onExport}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
          )}
        </div>
      </div>

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${toneClass[k.tone ?? "default"]}`}>{k.value}</p>
              {k.hint && <p className="mt-1 text-[11px] text-muted-foreground">{k.hint}</p>}
            </div>
          ))}
        </div>
      )}

      {(search || filters) && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
          {search && (
            <Input
              className="h-9 max-w-xs"
              placeholder={search.placeholder ?? "Search..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
          )}
          {filters}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">{children}</div>

      <p className="text-center text-[11px] text-muted-foreground">
        Role-scoped view · Only exceptions relevant to your assigned states and departments appear.
      </p>
    </div>
  );
}

export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function riskTone(risk: string | null | undefined): Kpi["tone"] {
  const r = (risk || "").toLowerCase();
  if (r === "high" || r === "critical") return "danger";
  if (r === "medium" || r === "moderate") return "warn";
  if (r === "low" || r === "healthy") return "good";
  return "default";
}

export function RiskPill({ level }: { level: string | null | undefined }) {
  const tone = riskTone(level);
  const cls =
    tone === "danger" ? "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20"
    : tone === "warn" ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20"
    : tone === "good" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20"
    : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {level || "—"}
    </span>
  );
}