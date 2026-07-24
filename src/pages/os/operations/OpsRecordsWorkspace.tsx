import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Search, Filter, Download, ArrowLeft, X, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  useOpsRecords, toCSV, downloadCSV, type OpsStoreKey, type OpsRecord,
} from "@/lib/os/operations/recordsStore";
import { useSupabaseRecords } from "@/lib/os/operations/supabaseRecordsStore";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "date" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

export type ColumnDef = {
  key: string;
  label: string;
  render?: (row: OpsRecord) => ReactNode;
};

export type StatusOption = {
  value: string;
  tone?: "green" | "amber" | "rose" | "violet" | "slate" | "blue";
};

const TONE: Record<NonNullable<StatusOption["tone"]>, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
};

export interface OpsRecordsWorkspaceProps {
  storeKey: OpsStoreKey;
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  primaryActionLabel: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  filterField?: string;
  statusField?: string;
  statusOptions?: StatusOption[];
  seed?: OpsRecord[];
  rowActions?: (row: OpsRecord, ctx: {
    update: (id: string, patch: Partial<OpsRecord>) => Promise<void> | void;
    remove: (id: string) => Promise<void> | void;
  }) => ReactNode;
  buckets?: { label: string; predicate: (row: OpsRecord) => boolean }[];
  /**
   * Optional Supabase-backed data source. When provided, the workspace reads
   * and writes to this Postgres table instead of localStorage. The
   * `writableFields` list controls which column names create/update will
   * write — the workspace's `fields` keys must match those column names.
   */
  supabaseTable?: string;
  writableFields?: string[];
}

export default function OpsRecordsWorkspace(props: OpsRecordsWorkspaceProps) {
  const {
    storeKey, eyebrow, title, description, icon: Icon,
    primaryActionLabel, fields, columns,
    filterField, statusField, statusOptions = [], seed = [], rowActions, buckets,
  } = props;

  const local = useOpsRecords(storeKey, seed);
  const remote = useSupabaseRecords(
    props.supabaseTable ?? "_unused_table_",
    props.writableFields ?? [],
  );
  const useRemote = !!props.supabaseTable;
  const rows = useRemote ? remote.rows : local.rows;
  const create = useRemote
    ? (async (row: Omit<OpsRecord, "id" | "createdAt" | "updatedAt">) => {
        try { await remote.create(row); }
        catch (e) { toast.error("Couldn't save — please try again."); throw e; }
      })
    : (async (row: Omit<OpsRecord, "id" | "createdAt" | "updatedAt">) => { local.create(row); });
  const update = useRemote
    ? (async (id: string, patch: Partial<OpsRecord>) => {
        try { await remote.update(id, patch); }
        catch (e) { toast.error("Couldn't update — please try again."); throw e; }
      })
    : (async (id: string, patch: Partial<OpsRecord>) => { local.update(id, patch); });
  const remove = useRemote
    ? (async (id: string) => {
        try { await remote.remove(id); }
        catch (e) { toast.error("Couldn't remove — please try again."); throw e; }
      })
    : (async (id: string) => { local.remove(id); });
  const loading = useRemote && remote.loading;
  const loadError = useRemote && remote.error
    ? "Records couldn't load. Try again in a moment or contact your admin if this continues."
    : null;
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);

  const filterValues = useMemo(() => {
    if (!filterField) return [];
    const s = new Set<string>();
    rows.forEach((r) => { const v = r[filterField]; if (v) s.add(String(v)); });
    return Array.from(s).sort();
  }, [rows, filterField]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterField && filterValue !== "all" && String(r[filterField] ?? "") !== filterValue) return false;
      if (!q) return true;
      return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [rows, query, filterField, filterValue]);

  const handleExport = () => {
    if (!filtered.length) {
      toast.info("Nothing to export — no records match the current filters.");
      return;
    }
    const csv = toCSV(filtered, columns.map((c) => ({ key: c.key as keyof OpsRecord, label: c.label })));
    downloadCSV(`${storeKey.split(".").pop()}.csv`, csv);
    toast.success(`Exported ${filtered.length} record${filtered.length === 1 ? "" : "s"}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {Icon && <Icon className="h-3 w-3" />} {eyebrow}
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      </header>

      {buckets && buckets.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {buckets.map((b) => {
            const count = rows.filter(b.predicate).length;
            return (
              <div key={b.label} className="rounded-2xl border border-border/60 bg-white/80 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{b.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{count}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> {primaryActionLabel}
        </button>
        <button
          onClick={handleExport}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-white/80 px-3.5 text-sm font-medium text-foreground/80 hover:border-foreground/40"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <Link
          to="/reports"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-white/80 px-3.5 text-sm text-foreground/80 hover:border-foreground/40"
        >
          Reports
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-white/80 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          {filterField && filterValues.length > 0 && (
            <div className="flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-white/80 px-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="bg-transparent text-sm outline-none"
              >
                <option value="all">All</option>
                {filterValues.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/85">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">Loading records…</div>
        ) : loadError ? (
          <div className="px-6 py-16 text-center text-sm text-rose-600">{loadError}</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {rows.length === 0
                ? `No records yet — click "${primaryActionLabel}" to add the first one.`
                : "No records match the current filters."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {columns.map((c) => <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>)}
                {(rowActions || true) && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                  {columns.map((c) => {
                    const val = r[c.key] ?? "";
                    if (c.render) {
                      return <td key={c.key} className="px-4 py-3 text-foreground/85">{c.render(r)}</td>;
                    }
                    if (c.key === statusField && statusOptions.length) {
                      const opt = statusOptions.find((s) => s.value === val);
                      return (
                        <td key={c.key} className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE[opt?.tone ?? "slate"]}`}>
                            {val || "—"}
                          </span>
                        </td>
                      );
                    }
                    return <td key={c.key} className="px-4 py-3 text-foreground/85">{String(val) || "—"}</td>;
                  })}
                  <td className="px-4 py-3 text-right">
                    {rowActions ? (
                      <div className="flex items-center justify-end gap-2">
                        {rowActions(r, { update, remove })}
                      </div>
                    ) : (
                      <button
                        onClick={() => { remove(r.id); toast.success("Removed"); }}
                        className="text-xs text-muted-foreground hover:text-rose-600"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      {showAdd && (
        <AddRecordModal
          title={primaryActionLabel}
          fields={fields}
          onCancel={() => setShowAdd(false)}
          onSubmit={(values) => {
            create(values as Omit<OpsRecord, "id" | "createdAt" | "updatedAt">);
            setShowAdd(false);
            toast.success("Record added");
          }}
        />
      )}
    </div>
  );
}

function AddRecordModal({
  title, fields, onCancel, onSubmit,
}: {
  title: string;
  fields: FieldDef[];
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.type === "select" && f.options ? f.options[0] : ""])),
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onCancel} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[12px] font-medium text-muted-foreground">{f.label}{f.required && <span className="text-rose-500"> *</span>}</span>
              {f.type === "select" && f.options ? (
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-border/70 bg-white px-2 text-sm"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                >
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  className="mt-1 w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm"
                  rows={3}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  type={f.type === "date" ? "date" : "text"}
                  className="mt-1 h-9 w-full rounded-lg border border-border/70 bg-white px-3 text-sm"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="h-9 rounded-xl border border-border/70 px-3.5 text-sm">Cancel</button>
          <button
            onClick={() => {
              const missing = fields.find((f) => f.required && !(values[f.key] ?? "").trim());
              if (missing) { toast.error(`${missing.label} is required`); return; }
              onSubmit(values);
            }}
            className="h-9 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}