import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CloudUpload, FileSpreadsheet, ShieldCheck, History, Gauge, Settings2,
  RefreshCw, CheckCircle2, AlertTriangle, Undo2, Download, X,
} from "lucide-react";
import {
  fileFingerprint, recognizeTemplate, buildPreview, uploadSourceFile,
  uploadErrorReport, fetchExistingIds, commitPreview, errorsToCsv,
  type CrSyncType, type CrTemplate, type CrPreview, type CrSyncTypeKey,
} from "@/lib/os/crSync/engine";

type Tab = "upload" | "history" | "freshness" | "templates" | "audit";

function fmtDate(iso: string | null | undefined) { return iso ? new Date(iso).toLocaleString() : "—"; }
function fmtBytes(n: number | null | undefined) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
function fmtAge(min: number | null) {
  if (min == null) return "—";
  if (min < 60) return `${Math.round(min)}m`;
  if (min < 1440) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 1440)}d`;
}

const LEVEL_STYLES: Record<string, string> = {
  current:  "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  aging:    "bg-amber-500/10 text-amber-700 border-amber-500/30",
  stale:    "bg-orange-500/10 text-orange-700 border-orange-500/30",
  critical: "bg-red-500/10 text-red-700 border-red-500/30",
  no_data:  "bg-muted text-muted-foreground border-border/70",
};

export default function CrSyncCenter() {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <CloudUpload className="h-6 w-6 text-primary" /> CentralReach Export Sync Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administrative import for CentralReach exports. RBTs and general employees do not access this page.
          Employee-facing screens show <em>“CentralReach data last updated…”</em> to avoid implying live sync.
        </p>
      </header>

      <nav className="flex gap-1 border-b border-border/70 overflow-x-auto">
        {([
          ["upload",    "Upload",    CloudUpload],
          ["history",   "History",   History],
          ["freshness", "Freshness", Gauge],
          ["templates", "Templates", FileSpreadsheet],
          ["audit",     "Audit",     ShieldCheck],
        ] as [Tab,string,any][]).map(([k,label,Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition ${tab === k ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      {tab === "upload"    && <UploadTab />}
      {tab === "history"   && <HistoryTab />}
      {tab === "freshness" && <FreshnessTab />}
      {tab === "templates" && <TemplatesTab />}
      {tab === "audit"     && <AuditTab />}
    </div>
  );
}

// ============================================================
// UPLOAD
// ============================================================
function UploadTab() {
  const [types, setTypes] = useState<CrSyncType[]>([]);
  const [templates, setTemplates] = useState<CrTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<CrSyncTypeKey>("employees");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CrPreview | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: tp }] = await Promise.all([
        supabase.from("cr_sync_types").select("*").order("label"),
        supabase.from("cr_sync_templates").select("*").eq("active", true).order("name"),
      ]);
      setTypes((t as unknown as CrSyncType[]) ?? []);
      setTemplates((tp as unknown as CrTemplate[]) ?? []);
    })();
  }, []);

  const currentType = types.find(t => t.key === selectedType);
  const typeTemplates = templates.filter(t => t.type_key === selectedType);
  const currentTemplate = typeTemplates.find(t => t.id === selectedTemplateId) ?? typeTemplates.find(t => t.is_default) ?? typeTemplates[0];

  const resetAll = () => { setFile(null); setPreview(null); setRunId(null); setProgress(null); if (inputRef.current) inputRef.current.value = ""; };

  const onFile = useCallback(async (f: File) => {
    if (!/\.(csv|xlsx|xls|xlsm)$/i.test(f.name)) { toast.error("Only CSV or XLSX files are allowed."); return; }
    setFile(f); setPreview(null); setRunId(null);

    // Auto-recognize template
    try {
      const { parseAnyFile } = await import("@/lib/os/dashboardEngine/excelParser");
      const parts = await parseAnyFile(f);
      const headers = parts[0]?.headers ?? [];
      const guess = recognizeTemplate(headers, typeTemplates);
      if (guess) { setSelectedTemplateId(guess.id); toast.success(`Recognized template: ${guess.name}`); }
    } catch {/* ignore */}
  }, [typeTemplates]);

  const runPreview = async () => {
    if (!file || !currentType || !currentTemplate) return;
    setBusy("Validating…");
    try {
      const existingIds = await fetchExistingIds(currentType.key);
      const p = await buildPreview(file, currentType, currentTemplate, existingIds);
      setPreview(p);
      toast.success(`Validated ${p.total_rows} rows`);
    } catch (e: any) { toast.error(e?.message ?? "Preview failed"); }
    finally { setBusy(null); }
  };

  const commit = async () => {
    if (!file || !preview || !currentType || !currentTemplate) return;
    setBusy("Uploading source…");
    try {
      // Idempotency check
      const sha = await fileFingerprint(file);
      const { data: dupe } = await supabase
        .from("cr_sync_runs").select("id,status,file_name,created_at")
        .eq("type_key", currentType.key).eq("file_sha256", sha)
        .in("status", ["committed","partial"])
        .maybeSingle();
      if (dupe) {
        toast.error("This exact file was already imported (idempotent) — no changes made.");
        setBusy(null); return;
      }

      const { data: user } = await supabase.auth.getUser();
      const uid = user?.user?.id;
      if (!uid) throw new Error("Not signed in.");

      // Create run row (uploaded)
      const { data: run, error: runErr } = await supabase.from("cr_sync_runs").insert({
        type_key: currentType.key,
        template_id: currentTemplate.id,
        status: "uploaded",
        file_name: file.name,
        file_size_bytes: file.size,
        file_sha256: sha,
        row_count_total: preview.total_rows,
        rows_added: 0, rows_updated: 0, rows_rejected: preview.rejected_rows, rows_unchanged: 0,
        detected_headers: preview.headers,
        preview: { sample: preview.sample, mapped_headers: preview.mapped_headers, error_summary: preview.errors.slice(0, 20) } as never,
        uploaded_by: uid,
      }).select("id").single();
      if (runErr) throw runErr;
      const rid = (run as { id: string }).id;
      setRunId(rid);

      // Upload source file
      const path = await uploadSourceFile(file, currentType.key, rid);
      await supabase.from("cr_sync_runs").update({ storage_path: path, status: "committing" }).eq("id", rid);

      // Save row errors (batch of 500)
      if (preview.errors.length) {
        const rows = preview.errors.map(e => ({
          run_id: rid, row_number: e.row_number, external_id: e.external_id,
          field: e.field, error_code: e.error_code, error_message: e.error_message,
          raw_row: e.raw_row as never,
        }));
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          await supabase.from("cr_sync_run_errors").insert(chunk);
        }
        const csv = errorsToCsv(preview.errors);
        const errPath = await uploadErrorReport(rid, csv);
        await supabase.from("cr_sync_runs").update({ error_report_path: errPath }).eq("id", rid);
      }

      // Commit valid rows via RPC
      setBusy("Committing rows…");
      setProgress({ done: 0, total: preview.mapped_rows.length });
      const r = await commitPreview(rid, currentType.key, preview.mapped_rows, (d, t) => setProgress({ done: d, total: t }));

      const finalStatus = (r.failed > 0 || preview.rejected_rows > 0) ? "partial" : "committed";
      await supabase.from("cr_sync_runs").update({
        status: finalStatus,
        rows_added: r.added, rows_updated: r.updated, rows_unchanged: r.unchanged,
        rows_rejected: preview.rejected_rows + r.failed,
        committed_at: new Date().toISOString(),
      }).eq("id", rid);

      await supabase.from("cr_sync_audit").insert({
        run_id: rid, actor_id: uid, action: "committed",
        detail: { added: r.added, updated: r.updated, unchanged: r.unchanged, failed: r.failed, rejected: preview.rejected_rows } as never,
      });

      toast.success(`Imported: +${r.added} added, ~${r.updated} updated, =${r.unchanged} unchanged, ${preview.rejected_rows + r.failed} rejected`);
      resetAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Commit failed");
      if (runId) await supabase.from("cr_sync_runs").update({ status: "failed", notes: e?.message ?? "commit failed" }).eq("id", runId);
    } finally {
      setBusy(null); setProgress(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Import type</label>
          <select value={selectedType} onChange={e => { setSelectedType(e.target.value as CrSyncTypeKey); setSelectedTemplateId(""); resetAll(); }}
            className="w-full text-sm rounded-lg border border-border/70 bg-card px-2 h-9">
            {types.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          {currentType && (
            <p className="text-xs text-muted-foreground">
              External key: <code className="text-[11px] bg-muted px-1 rounded">{currentType.external_id_field}</code>
              <br />Never matched by name.
            </p>
          )}

          <label className="text-xs font-medium text-muted-foreground pt-2 block">Mapping template</label>
          <select value={currentTemplate?.id ?? ""} onChange={e => setSelectedTemplateId(e.target.value)}
            className="w-full text-sm rounded-lg border border-border/70 bg-card px-2 h-9">
            {typeTemplates.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_default ? " (default)" : ""}</option>)}
          </select>
        </div>
      </aside>

      <section className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
          className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${dragOver ? "border-primary bg-primary/5" : "border-border/70 bg-card"}`}>
          <CloudUpload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Drop a CSV or XLSX file, or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">Files are stored privately and never exposed publicly.</p>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.xlsm" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          <button onClick={() => inputRef.current?.click()} className="mt-3 text-sm rounded-lg bg-primary text-primary-foreground px-4 h-9">Choose file</button>
          {file && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-1.5">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> {file.name} · {fmtBytes(file.size)}
              <button onClick={resetAll} className="ml-1 opacity-70 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button disabled={!file || !!busy} onClick={runPreview}
            className="text-sm rounded-lg border border-border/70 bg-card px-4 h-9 hover:bg-muted disabled:opacity-50 inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> {busy === "Validating…" ? "Validating…" : "Validate & preview"}
          </button>
          <button disabled={!preview || !!busy} onClick={commit}
            className="text-sm rounded-lg bg-primary text-primary-foreground px-4 h-9 disabled:opacity-50 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {busy ? busy : "Commit import"}
          </button>
        </div>

        {progress && (
          <div className="text-xs text-muted-foreground">
            Committing… {progress.done} / {progress.total}
          </div>
        )}

        {/* Preview summary */}
        {preview && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Metric label="Total rows" value={preview.total_rows} />
              <Metric label="Valid" value={preview.valid_rows} tone="emerald" />
              <Metric label="Add" value={preview.add_count} tone="emerald" />
              <Metric label="Update" value={preview.update_count} tone="sky" />
              <Metric label="Rejected" value={preview.rejected_rows} tone={preview.rejected_rows ? "amber" : "muted"} />
            </div>
            {preview.duplicate_rows > 0 && (
              <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {preview.duplicate_rows} in-file duplicates rejected.</p>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Mapped fields</p>
              <div className="flex flex-wrap gap-1">
                {preview.mapped_headers.map(h => <span key={h} className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5">{h}</span>)}
                {preview.headers.filter(h => !preview.mapped_headers.some(mh => mh)).slice(0, 0).map(h => <span key={h} className="text-[10px] rounded-full bg-muted px-2 py-0.5">{h}</span>)}
              </div>
            </div>
            {preview.errors.length > 0 && (
              <details className="rounded-lg border border-border/70">
                <summary className="cursor-pointer text-sm px-3 py-2">First {Math.min(preview.errors.length, 20)} of {preview.errors.length} errors</summary>
                <div className="max-h-64 overflow-auto text-xs p-2 space-y-1">
                  {preview.errors.slice(0, 20).map((e, i) => (
                    <div key={i} className="grid grid-cols-[3rem_5rem_1fr] gap-2">
                      <span className="tabular-nums text-muted-foreground">Row {e.row_number}</span>
                      <span className="text-red-600">{e.error_code}</span>
                      <span>{e.error_message}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "muted" }: { label: string; value: number | string; tone?: "muted"|"emerald"|"amber"|"sky" }) {
  const map = { muted:"text-foreground", emerald:"text-emerald-700", amber:"text-amber-700", sky:"text-sky-700" };
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${map[tone]}`}>{value}</p>
    </div>
  );
}

// ============================================================
// HISTORY
// ============================================================
function HistoryTab() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<CrSyncTypeKey | "all">("all");

  const load = async () => {
    let q = supabase.from("cr_sync_runs").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("type_key", filter);
    const { data } = await q;
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [filter]);

  const rollback = async (r: any) => {
    if (!confirm(`Rollback ${r.file_name}? This removes records first added by this run.`)) return;
    const { data, error } = await supabase.rpc("cr_rollback_run", { _run_id: r.id });
    if (error) return toast.error(error.message);
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("cr_sync_audit").insert({ run_id: r.id, actor_id: user?.user?.id ?? null, action: "rolled_back", detail: (data ?? {}) as never });
    toast.success("Rolled back"); load();
  };

  const downloadErrors = async (r: any) => {
    if (!r.error_report_path) return toast.info("No error report for this run.");
    const { data, error } = await supabase.storage.from("cr-sync-source").createSignedUrl(r.error_report_path, 300);
    if (error) return toast.error(error.message);
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("cr_sync_audit").insert({ run_id: r.id, actor_id: user?.user?.id ?? null, action: "downloaded", detail: { kind: "error_report" } as never });
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {(["all","employees","clients","schedule","timesheets","authorizations"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs rounded-full px-3 py-1 border transition ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/70 hover:bg-muted"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
        {rows === null && <div className="p-8 text-sm text-muted-foreground">Loading…</div>}
        {rows?.length === 0 && <div className="p-8 text-sm text-muted-foreground">No imports yet.</div>}
        {rows?.map(r => (
          <div key={r.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] rounded-full bg-muted px-2 py-0.5">{r.type_key}</span>
                  <StatusPill status={r.status} />
                  <span className="text-sm font-medium truncate">{r.file_name}</span>
                  <span className="text-xs text-muted-foreground">{fmtBytes(r.file_size_bytes)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {fmtDate(r.created_at)} · fingerprint <code className="text-[10px]">{String(r.file_sha256).slice(0,10)}…</code>
                </p>
                <p className="text-xs mt-1">
                  <span className="text-emerald-700">+{r.rows_added} added</span>
                  {" · "}<span className="text-sky-700">~{r.rows_updated} updated</span>
                  {" · "}<span className="text-muted-foreground">={r.rows_unchanged} unchanged</span>
                  {" · "}<span className="text-amber-700">{r.rows_rejected} rejected</span>
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {r.error_report_path && (
                  <button onClick={() => downloadErrors(r)} className="text-xs rounded-lg border border-border/70 px-2 py-1 hover:bg-muted inline-flex items-center gap-1"><Download className="h-3 w-3" /> Errors</button>
                )}
                {(r.status === "committed" || r.status === "partial") && !r.rolled_back_at && (
                  <button onClick={() => rollback(r)} className="text-xs rounded-lg border border-border/70 px-2 py-1 hover:bg-muted inline-flex items-center gap-1 text-destructive"><Undo2 className="h-3 w-3" /> Rollback</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string,string> = {
    uploaded:   "bg-muted text-muted-foreground",
    validating: "bg-sky-500/10 text-sky-700",
    previewed:  "bg-indigo-500/10 text-indigo-700",
    committing: "bg-amber-500/10 text-amber-700",
    committed:  "bg-emerald-500/10 text-emerald-700",
    partial:    "bg-amber-500/10 text-amber-700",
    rejected:   "bg-destructive/10 text-destructive",
    rolled_back:"bg-muted text-muted-foreground line-through",
    failed:     "bg-destructive/10 text-destructive",
  };
  return <span className={`text-[10px] rounded-full px-2 py-0.5 ${styles[status] ?? "bg-muted"}`}>{status}</span>;
}

// ============================================================
// FRESHNESS
// ============================================================
function FreshnessTab() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [cfg, setCfg] = useState<any[]>([]);
  const load = async () => {
    const [{ data: f }, { data: c }] = await Promise.all([
      supabase.rpc("cr_sync_freshness"),
      supabase.from("cr_freshness_config").select("*"),
    ]);
    setRows((f as any) ?? []);
    setCfg((c as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const updateCfg = async (typeKey: string, field: string, value: number) => {
    const { error } = await supabase.from("cr_freshness_config").update({ [field]: value } as never).eq("type_key", typeKey as CrSyncTypeKey);
    if (error) return toast.error(error.message);
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("cr_sync_audit").insert({ actor_id: user?.user?.id ?? null, action: "config_changed", detail: { type_key: typeKey, [field]: value } as never });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {rows?.map((r: any) => (
          <div key={r.type_key} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium capitalize">{r.type_key}</p>
              <span className={`text-[10px] rounded-full px-2 py-0.5 border ${LEVEL_STYLES[r.level] ?? LEVEL_STYLES.no_data}`}>{r.level.replace("_"," ")}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CentralReach data last updated {fmtDate(r.last_success)}<br />
              Data age {fmtAge(r.age_minutes)} · rows {r.last_row_count?.toLocaleString?.() ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Last attempt {fmtDate(r.last_attempt)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card">
        <div className="p-4 border-b border-border/70">
          <p className="text-sm font-medium">Stale-data thresholds (minutes)</p>
          <p className="text-xs text-muted-foreground">Configure when data is considered current, aging, stale, or critical.</p>
        </div>
        <div className="p-3 grid gap-2">
          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground px-2">
            <span>Type</span><span>Current ≤</span><span>Aging ≤</span><span>Stale ≤</span><span>Critical ≤</span>
          </div>
          {cfg.map((c: any) => (
            <div key={c.type_key} className="grid grid-cols-5 gap-2 items-center px-2">
              <span className="text-sm capitalize">{c.type_key}</span>
              {(["current_minutes","aging_minutes","stale_minutes","critical_minutes"] as const).map(f => (
                <input key={f} type="number" defaultValue={c[f]} onBlur={e => updateCfg(c.type_key, f, parseInt(e.target.value) || 0)}
                  className="text-sm rounded-lg border border-border/70 bg-card px-2 h-8 w-24" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TEMPLATES
// ============================================================
function TemplatesTab() {
  const [rows, setRows] = useState<CrTemplate[] | null>(null);
  const [editing, setEditing] = useState<CrTemplate | null>(null);

  const load = () => supabase.from("cr_sync_templates").select("*").order("type_key").order("name")
    .then(({ data }) => setRows((data as unknown as CrTemplate[]) ?? []));
  useEffect(() => { load(); }, []);

  const save = async (t: CrTemplate, patch: Partial<CrTemplate>) => {
    const { error } = await supabase.from("cr_sync_templates").update(patch as never).eq("id", t.id);
    if (error) return toast.error(error.message);
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("cr_sync_audit").insert({ actor_id: user?.user?.id ?? null, action: "template_saved", detail: { template_id: t.id, patch } as never });
    toast.success("Saved"); load(); setEditing(null);
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
      {rows?.map(t => (
        <div key={t.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t.name} <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 ml-1">{t.type_key}</span>{t.is_default && <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 ml-1">default</span>}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Required: {t.required_fields.join(", ") || "—"}</p>
              <p className="text-[11px] text-muted-foreground">Recognition: {t.recognition_headers.join(", ") || "—"}</p>
            </div>
            <button onClick={() => setEditing(t)} className="text-xs rounded-lg border border-border/70 px-2 py-1 hover:bg-muted inline-flex items-center gap-1"><Settings2 className="h-3 w-3" /> Edit</button>
          </div>
          {editing?.id === t.id && (
            <div className="mt-3 grid gap-2">
              <label className="text-xs text-muted-foreground">Column map (JSON: {`{"source header":"canonical_field"}`})</label>
              <textarea defaultValue={JSON.stringify(t.column_map, null, 2)}
                onBlur={e => {
                  try { save(t, { column_map: JSON.parse(e.target.value) }); }
                  catch { toast.error("Invalid JSON"); }
                }}
                className="text-xs font-mono rounded-lg border border-border/70 bg-background px-2 py-2 min-h-[140px]" />
              <label className="text-xs text-muted-foreground">Field types (JSON: {`{"field":"string|number|date|datetime|email"}`})</label>
              <textarea defaultValue={JSON.stringify(t.field_types, null, 2)}
                onBlur={e => { try { save(t, { field_types: JSON.parse(e.target.value) }); } catch { toast.error("Invalid JSON"); } }}
                className="text-xs font-mono rounded-lg border border-border/70 bg-background px-2 py-2 min-h-[100px]" />
              <label className="text-xs text-muted-foreground">Required fields (comma separated)</label>
              <input defaultValue={t.required_fields.join(", ")}
                onBlur={e => save(t, { required_fields: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                className="text-xs rounded-lg border border-border/70 bg-background px-2 h-9" />
              <label className="text-xs text-muted-foreground">Recognition headers (comma separated)</label>
              <input defaultValue={t.recognition_headers.join(", ")}
                onBlur={e => save(t, { recognition_headers: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                className="text-xs rounded-lg border border-border/70 bg-background px-2 h-9" />
              <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground self-end">Close</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// AUDIT
// ============================================================
function AuditTab() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    supabase.from("cr_sync_audit").select("*").order("created_at",{ascending:false}).limit(200)
      .then(({ data }) => setRows((data as any) ?? []));
  }, []);
  return (
    <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
      {rows?.length === 0 && <div className="p-8 text-sm text-muted-foreground">No audit entries yet.</div>}
      {rows?.map(a => (
        <div key={a.id} className="p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">{a.action}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{new Date(a.created_at).toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{JSON.stringify(a.detail)}</p>
        </div>
      ))}
    </div>
  );
}