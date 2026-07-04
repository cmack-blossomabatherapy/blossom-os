import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck, Search, MapPin, Stethoscope, ShieldAlert, ChevronRight, Heart } from "lucide-react";
import { OSShell } from "./OSShell";
import { useRbtWorkflow, type RbtClientAssignment } from "@/hooks/useRbtWorkflow";
import { cn } from "@/lib/utils";

function CRPill({ status }: { status?: string | null }) {
  const label = status === "synced" ? "CentralReach synced"
    : status === "ready" ? "CentralReach import-ready"
    : status === "error" ? "CentralReach sync error"
    : "CentralReach pending connection";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px]",
      status === "synced" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : status === "error" ? "border-destructive/20 bg-destructive/10 text-destructive"
        : "border-border/70 bg-muted text-muted-foreground",
    )}>{label}</span>
  );
}

function ClientCard({ c, onOpen }: { c: RbtClientAssignment; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="text-left rounded-2xl border border-border/70 bg-card p-4 hover:border-border transition-colors w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold tracking-tight truncate">{c.client_name}</p>
          <p className="text-[11.5px] text-muted-foreground truncate mt-0.5 flex items-center gap-2">
            <MapPin className="h-3 w-3" />{c.state || "—"}{c.clinic ? ` · ${c.clinic}` : ""}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {c.authorized_service_codes?.slice(0, 3).map((code) => (
          <span key={code} className="text-[10.5px] rounded-full border border-border/70 bg-muted px-2 py-0.5 text-muted-foreground">{code}</span>
        ))}
        <CRPill status={c.centralreach_sync_status} />
      </div>
      {c.safety_notes && (
        <p className="mt-3 text-[11.5px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{c.safety_notes}</span>
        </p>
      )}
    </button>
  );
}

function DetailPanel({ c, supportLogs, onClose }: {
  c: RbtClientAssignment;
  supportLogs: { id: string; client_id: string | null; prep_notes: string | null; issue_type: string | null; issue_description: string | null; created_at: string }[];
  onClose: () => void;
}) {
  const clientLogs = supportLogs.filter((s) => s.client_id === c.client_id).slice(0, 8);
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg h-full bg-card border-l border-border/70 overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/70 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight truncate">{c.client_name}</p>
            <p className="text-[12px] text-muted-foreground">{c.state} · {c.clinic || "—"}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted">✕</button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Authorized services</p>
            <div className="flex flex-wrap gap-1.5">
              {(c.authorized_service_codes ?? []).length
                ? c.authorized_service_codes!.map((s) => <span key={s} className="text-[11px] rounded-full border border-border/70 bg-muted px-2 py-0.5">{s}</span>)
                : <p className="text-[12px] text-muted-foreground">Not specified yet.</p>}
            </div>
          </div>
          {c.schedule_summary && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Schedule</p>
              <p className="text-[12.5px]">{c.schedule_summary}</p>
            </div>
          )}
          {c.family_preferences && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Heart className="h-3 w-3" />Family preferences</p>
              <p className="text-[12.5px]">{c.family_preferences}</p>
            </div>
          )}
          {c.safety_notes && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><ShieldAlert className="h-3 w-3" />Safety notes</p>
              <p className="text-[12.5px] text-amber-700 dark:text-amber-400">{c.safety_notes}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">CentralReach</p>
            <CRPill status={c.centralreach_sync_status} />
            {c.centralreach_last_synced_at && (
              <p className="text-[11px] text-muted-foreground mt-1">Last synced {new Date(c.centralreach_last_synced_at).toLocaleString()}</p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Recent session notes</p>
            {clientLogs.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No session support notes for this client yet.</p>
            ) : (
              <div className="rounded-xl border border-border/70 divide-y divide-border/60">
                {clientLogs.map((l) => (
                  <div key={l.id} className="p-2.5">
                    <p className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</p>
                    {l.prep_notes && <p className="text-[12.5px] mt-0.5">{l.prep_notes}</p>}
                    {l.issue_type && <p className="text-[11.5px] text-amber-700 mt-0.5">{l.issue_type}: {l.issue_description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2 grid grid-cols-2 gap-2">
            <Link to={`/rbt/schedule?client=${c.client_id ?? ""}`} className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">Schedule</Link>
            <Link to={`/rbt/session-support?client=${c.client_id ?? ""}`} className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">Session support</Link>
            <Link to={`/rbt/help?client=${c.client_id ?? ""}`} className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">Request BCBA help</Link>
            <Link to="/rbt/resources" className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">Resources</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OSRBTClients() {
  const wf = useRbtWorkflow();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wf.clients.filter((c) => !q || c.client_name.toLowerCase().includes(q) || (c.state ?? "").toLowerCase().includes(q));
  }, [wf.clients, query]);

  const open = openId ? wf.clients.find((c) => c.id === openId) ?? null : null;

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <UserCheck className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">My Clients</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Only clients you're assigned to. Data comes from Blossom OS and is CentralReach import-ready.</p>
          </div>
        </header>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assigned clients…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border/70 text-[13px]" />
        </div>
        {wf.loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading assigned clients…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
            <Stethoscope className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No assigned clients yet.</p>
            <p className="text-[12px] text-muted-foreground mt-1">Your assigned client roster will appear here once scheduling connects you.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => <ClientCard key={c.id} c={c} onOpen={() => setOpenId(c.id)} />)}
          </div>
        )}
      </div>
      {open && <DetailPanel c={open} supportLogs={wf.supportLogs as any} onClose={() => setOpenId(null)} />}
    </OSShell>
  );
}
