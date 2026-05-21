import { useEffect, useState } from "react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database, Upload, FileText, Trash2, Loader2, ShieldAlert, Play, CheckCircle2, AlertCircle } from "lucide-react";

const BOARD_MAP: Record<string, string> = {
  monday_leads: "leads",
  monday_clients: "clients",
  monday_no_oon_benefits: "no_oon",
  monday_authorizations: "authorizations",
  monday_auth_approvals: "auth_approvals",
  monday_denials: "denials",
  cred_va: "va_credentialing",
};

type UploadRow = {
  id: string;
  source_system: string;
  source_key: string;
  source_label: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  storage_path: string;
  uploaded_at: string;
};

type ImportRun = {
  id: string;
  board: string;
  storage_path: string;
  rows_inserted: number;
  rows_updated: number;
  subitems_inserted: number;
  updates_inserted: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
};

type SourceDef = { key: string; label: string };
type Section = { system: string; description: string; sources: SourceDef[] };

const SECTIONS: Section[] = [
  {
    system: "CentralReach",
    description: "Exports from CentralReach (sessions, billing, scheduling).",
    sources: [
      { key: "cr_bcba_sessions", label: "BCBA Billable Sessions" },
      { key: "cr_rbt_sessions", label: "RBT Billable Sessions" },
      { key: "cr_billing", label: "Billing / Claims" },
      { key: "cr_schedules", label: "Schedules" },
      { key: "cr_clients", label: "Client Roster" },
      { key: "cr_employees", label: "Employee Roster" },
    ],
  },
  {
    system: "Monday.com",
    description: "One slot per Monday board. Upload the CSV/XLSX export.",
    sources: [
      { key: "monday_leads", label: "Leads" },
      { key: "monday_clients", label: "Clients" },
      { key: "monday_no_oon_benefits", label: "No OON Benefits" },
      { key: "monday_authorizations", label: "Authorizations" },
      { key: "monday_auth_approvals", label: "Authorization Approvals" },
      { key: "monday_denials", label: "Denials" },
    ],
  },
  {
    system: "Credentialing",
    description: "Per-state credentialing tracker exports.",
    sources: [
      { key: "cred_nc", label: "North Carolina" },
      { key: "cred_sc", label: "South Carolina" },
      { key: "cred_ga", label: "Georgia" },
      { key: "cred_va", label: "Virginia" },
      { key: "cred_fl", label: "Florida" },
    ],
  },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function OSDataUploads() {
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [parsingId, setParsingId] = useState<string | null>(null);
  const [runs, setRuns] = useState<ImportRun[]>([]);

  async function load() {
    setFetching(true);
    const { data, error } = await supabase
      .from("data_uploads")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as UploadRow[]);
    const { data: runData } = await supabase
      .from("monday_import_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20);
    setRuns((runData ?? []) as ImportRun[]);
    setFetching(false);
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function handleUpload(section: Section, source: SourceDef, file: File) {
    if (!user) return;
    setUploadingKey(source.key);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${source.key}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("data-uploads")
        .upload(path, file, { contentType: file.type || undefined });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("data_uploads").insert({
        source_system: section.system,
        source_key: source.key,
        source_label: source.label,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
        storage_path: path,
        uploaded_by: user.id,
      });
      if (insErr) throw insErr;

      toast.success(`Uploaded ${file.name}`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleDelete(row: UploadRow) {
    if (!confirm(`Delete ${row.file_name}?`)) return;
    const { error: stErr } = await supabase.storage.from("data-uploads").remove([row.storage_path]);
    if (stErr) toast.error(stErr.message);
    const { error } = await supabase.from("data_uploads").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  }

  async function handleDownload(row: UploadRow) {
    const { data, error } = await supabase.storage
      .from("data-uploads")
      .createSignedUrl(row.storage_path, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Could not create download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleParse(row: UploadRow) {
    const board = BOARD_MAP[row.source_key];
    if (!board) {
      toast.error(`No parser configured for ${row.source_key}`);
      return;
    }
    setParsingId(row.id);
    try {
      const { data, error } = await supabase.functions.invoke("parse-monday-export", {
        body: { board, storage_path: row.storage_path, user_id: user?.id },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error || "Parse failed");
      toast.success(
        `Parsed: ${data.rows_inserted} new, ${data.rows_updated} updated` +
          (data.subitems_inserted ? `, ${data.subitems_inserted} subitems` : "") +
          (data.updates_inserted ? `, ${data.updates_inserted} comments` : "")
      );
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Parse failed");
    } finally {
      setParsingId(null);
    }
  }

  if (loading) {
    return (
      <OSShell>
        <div className="grid min-h-[40vh] place-items-center text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </OSShell>
    );
  }

  if (!isAdmin) {
    return (
      <OSShell>
        <div className="grid min-h-[40vh] place-items-center">
          <div className="max-w-md rounded-2xl border border-border/60 bg-card p-6 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
            <h1 className="mt-3 text-lg font-semibold">Super admin only</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This page is restricted to super admins.
            </p>
          </div>
        </div>
      </OSShell>
    );
  }

  return (
    <OSShell>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Data Uploads</h1>
            <p className="text-sm text-muted-foreground">
              Upload exports from CentralReach, Monday.com, and credentialing trackers. Files are
              stored privately and tracked here. We'll wire processing per source later.
            </p>
          </div>
        </div>

        {SECTIONS.map((section) => (
          <section key={section.system} className="rounded-2xl border border-border/60 bg-card">
            <header className="border-b border-border/60 p-4">
              <h2 className="text-base font-semibold">{section.system}</h2>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </header>
            <div className="divide-y divide-border/60">
              {section.sources.map((src) => {
                const sourceRows = rows.filter((r) => r.source_key === src.key);
                const busy = uploadingKey === src.key;
                return (
                  <div key={src.key} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{src.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {sourceRows.length} file{sourceRows.length === 1 ? "" : "s"} uploaded
                        </p>
                      </div>
                      <label className="inline-flex">
                        <input
                          type="file"
                          className="hidden"
                          accept=".csv,.xlsx,.xls,.tsv,.txt,.json"
                          disabled={busy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(section, src, f);
                            e.target.value = "";
                          }}
                        />
                        <Button asChild size="sm" variant="outline" disabled={busy}>
                          <span className="cursor-pointer">
                            {busy ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            {busy ? "Uploading…" : "Upload file"}
                          </span>
                        </Button>
                      </label>
                    </div>
                    {sourceRows.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {sourceRows.map((r) => (
                          <li
                            key={r.id}
                            className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-xs"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <button
                              onClick={() => handleDownload(r)}
                              className="flex-1 truncate text-left font-medium hover:underline"
                            >
                              {r.file_name}
                            </button>
                            <span className="text-muted-foreground">{formatBytes(r.file_size)}</span>
                            <span className="text-muted-foreground">
                              {new Date(r.uploaded_at).toLocaleDateString()}
                            </span>
                            {BOARD_MAP[r.source_key] && (
                              <button
                                onClick={() => handleParse(r)}
                                disabled={parsingId === r.id}
                                className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
                              >
                                {parsingId === r.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                                Parse
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(r)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {runs.length > 0 && (
          <section className="rounded-2xl border border-border/60 bg-card">
            <header className="border-b border-border/60 p-4">
              <h2 className="text-base font-semibold">Recent imports</h2>
              <p className="text-xs text-muted-foreground">Last 20 parser runs.</p>
            </header>
            <ul className="divide-y divide-border/60">
              {runs.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3 text-xs">
                  {r.error ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : r.finished_at ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <span className="font-medium">{r.board}</span>
                  <span className="flex-1 truncate text-muted-foreground">
                    {r.error
                      ? r.error
                      : `+${r.rows_inserted} new · ~${r.rows_updated} updated · ${r.subitems_inserted} subitems · ${r.updates_inserted} comments`}
                  </span>
                  <span className="text-muted-foreground">
                    {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : "…"}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(r.started_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {fetching && (
          <p className="text-xs text-muted-foreground">Loading uploads…</p>
        )}
      </div>
    </OSShell>
  );
}