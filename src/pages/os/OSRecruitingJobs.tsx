import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, ExternalLink, Briefcase, Inbox, Info } from "lucide-react";
import { OSShell } from "./OSShell";
import { supabase } from "@/integrations/supabase/client";
import { ApploiSyncHealthBar } from "@/components/recruiting/ApploiSyncHealthBar";
import { OperatorDiagnosticsGate } from "@/components/os/intake/OperatorDiagnosticsGate";
import { cn } from "@/lib/utils";

/**
 * Recruiting → Job Postings (Apploi).
 *
 * Real, read-only view of the Apploi job postings synced into
 * `integration_normalized_records`. No demo rows, no write-back.
 */

interface JobRow {
  id: string;
  provider_record_id: string | null;
  display_title: string | null;
  record_status: string | null;
  external_url: string | null;
  occurred_at: string | null;
  metadata: Record<string, unknown>;
}

function raw(job: JobRow): Record<string, unknown> {
  const r = (job.metadata as { raw?: Record<string, unknown> })?.raw;
  return (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
}
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export default function OSRecruitingJobs() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [statusF, setStatusF] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from("integration_normalized_records")
        .select("id,provider_record_id,display_title,record_status,external_url,occurred_at,metadata")
        .eq("integration_id", "apploi")
        .eq("record_kind", "job")
        .order("display_title", { ascending: true });
      if (cancelled) return;
      if (err) { setError(true); setLoading(false); return; }
      setJobs((data ?? []) as unknown as JobRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const states = useMemo(
    () => Array.from(new Set(jobs.map((j) => str(raw(j).state)).filter(Boolean))).sort() as string[],
    [jobs],
  );
  const statuses = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.record_status).filter(Boolean))).sort() as string[],
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      const r = raw(j);
      if (stateF !== "all" && str(r.state) !== stateF) return false;
      if (statusF !== "all" && j.record_status !== statusF) return false;
      if (!q) return true;
      return [j.display_title, str(r.city), str(r.state), str(r.address), j.provider_record_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [jobs, search, stateF, statusF]);

  return (
    <OSShell>
      <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" aria-hidden /> Job Postings
          </h1>
          <p className="text-sm text-muted-foreground">
            Live Apploi job postings for Blossom. Read-only — postings are managed in Apploi.
          </p>
        </header>

        <ApploiSyncHealthBar />

        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground flex gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
          <span>
            Applicant records are not currently shared with Blossom by Apploi, so candidates must be
            entered in the Blossom pipelines. Job postings sync automatically.
          </span>
        </div>
        <OperatorDiagnosticsGate>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300">
            Admin diagnostic: the Apploi partner key is authorized for <code>/jobs/search</code> only.
            The <code>/applicants</code> endpoint returns zero records with no upstream error, which means
            the applicant read permission has not been granted to this team key. Ask Apploi to enable
            applicant access for the Blossom partner key — this is a provider permission gap, not a sync failure.
          </div>
        </OperatorDiagnosticsGate>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search job postings"
              placeholder="Search title, city, state, or job ID…"
              className="h-10 w-full pl-9 pr-3 rounded-xl bg-card border border-border/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={stateF}
            onChange={(e) => setStateF(e.target.value)}
            aria-label="Filter by state"
            className="h-10 px-3 rounded-xl bg-card border border-border/70 text-sm"
          >
            <option value="all">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            aria-label="Filter by status"
            className="h-10 px-3 rounded-xl bg-card border border-border/70 text-sm"
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <section className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/60 text-[11px] text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} of ${jobs.length} postings`}
          </div>
          {loading && (
            <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading job postings…
            </div>
          )}
          {!loading && error && (
            <div className="p-6 text-sm text-muted-foreground">
              Job postings could not be loaded. You may not have access to Apploi records.
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Inbox className="h-5 w-5 mx-auto mb-2" aria-hidden />
              No job postings match these filters.
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <ul className="divide-y divide-border/60">
              {filtered.map((j) => {
                const r = raw(j);
                return (
                  <li key={j.id} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{j.display_title ?? "Untitled posting"}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {str(r.city) ?? "—"}{str(r.state) ? `, ${str(r.state)}` : ""}
                        {j.provider_record_id ? ` · Job ${j.provider_record_id}` : ""}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border",
                      j.record_status === "published"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border/60",
                    )}>
                      {j.record_status ?? "unknown"}
                    </span>
                    {j.external_url && (
                      <a
                        href={j.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        View posting <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </OSShell>
  );
}
