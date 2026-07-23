/**
 * CTM unknown-caller review queue — decide open reviews.
 *
 * Reads ctm_unknown_caller_reviews joined to ctm_call_events, and invokes
 * `ctm-review-action` for Attach / Create lead / Ignore. Every canonical
 * lead link opens `/leads?lead=<id>`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PhoneOff, RefreshCw, Search, UserPlus, Link2, Ban } from "lucide-react";

type Review = {
  id: string;
  ctm_call_event_id: string;
  ctm_call_id: string;
  reason: string;
  candidate_lead_ids: string[] | null;
  from_number: string | null;
  tracking_number: string | null;
  caller_name: string | null;
  resolved_state: string | null;
  status: string;
  created_at: string;
};

type LeadRow = { id: string; parent_name: string | null; phone: string | null; state: string | null };

export function CtmUnknownCallerReviewPanel() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "all">("open");
  const [active, setActive] = useState<Review | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("ctm_unknown_caller_reviews")
      .select("id,ctm_call_event_id,ctm_call_id,reason,candidate_lead_ids,from_number,tracking_number,caller_name,resolved_state,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (statusFilter === "open") q = q.eq("status", "open");
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data ?? []) as Review[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) =>
      [r.from_number, r.tracking_number, r.caller_name, r.reason, r.ctm_call_id]
        .some((v) => (v ?? "").toString().toLowerCase().includes(q)));
  }, [rows, filter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PhoneOff className="h-4 w-4" /> Unknown caller review queue
        </CardTitle>
        <div className="flex items-center gap-2">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="Search #, name, reason" className="h-8 w-56"
            aria-label="Search unknown callers"/>
          <Button size="sm" variant={statusFilter === "open" ? "default" : "outline"}
            onClick={() => setStatusFilter("open")}>Open</Button>
          <Button size="sm" variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}>All</Button>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`}/>Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2">Received</th><th className="p-2">From</th>
                <th className="p-2">Tracking</th><th className="p-2">Reason</th>
                <th className="p-2">Status</th><th className="p-2 w-56">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No {statusFilter === "open" ? "open" : ""} unknown-caller reviews.
                </td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2 font-mono">{r.from_number ?? "—"}<div className="text-xs text-muted-foreground">{r.caller_name ?? ""}</div></td>
                  <td className="p-2 font-mono">{r.tracking_number ?? "—"}</td>
                  <td className="p-2">
                    <Badge variant="outline">{r.reason}</Badge>
                    {r.candidate_lead_ids && r.candidate_lead_ids.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {r.candidate_lead_ids.length} candidate lead(s)
                      </div>
                    )}
                  </td>
                  <td className="p-2"><Badge variant={r.status === "open" ? "outline" : "secondary"}>{r.status}</Badge></td>
                  <td className="p-2">
                    {r.status === "open" ? (
                      <Button size="sm" variant="outline" onClick={() => setActive(r)}>Review</Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Decided</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {active && (
          <ReviewDecisionDialog
            review={active}
            onClose={() => setActive(null)}
            onDecided={() => { setActive(null); void load(); }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ReviewDecisionDialog({ review, onClose, onDecided }: {
  review: Review; onClose: () => void; onDecided: () => void;
}) {
  const [candidates, setCandidates] = useState<LeadRow[]>([]);
  const [search, setSearch] = useState(review.from_number ?? "");
  const [busy, setBusy] = useState(false);
  const [ignoreReason, setIgnoreReason] = useState("");
  const [createState, setCreateState] = useState(review.resolved_state ?? "");

  const runSearch = useCallback(async () => {
    const q = search.trim();
    if (!q) { setCandidates([]); return; }
    // Fetch by candidate ids first, then any phone/name text match.
    const results: Record<string, LeadRow> = {};
    if (review.candidate_lead_ids && review.candidate_lead_ids.length) {
      const { data } = await supabase.from("intake_leads")
        .select("id,parent_name,phone,state").in("id", review.candidate_lead_ids);
      for (const r of data ?? []) results[(r as LeadRow).id] = r as LeadRow;
    }
    const { data: matches } = await supabase.from("intake_leads")
      .select("id,parent_name,phone,state")
      .or(`phone.ilike.%${q}%,parent_name.ilike.%${q}%`)
      .limit(25);
    for (const r of matches ?? []) results[(r as LeadRow).id] = r as LeadRow;
    setCandidates(Object.values(results));
  }, [search, review.candidate_lead_ids]);

  useEffect(() => { void runSearch(); }, [runSearch]);

  async function decide(action: "attach" | "create" | "ignore", extra: Record<string, unknown> = {}) {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ctm-review-action", {
      body: { action, review_id: review.id, ...extra },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    const d = data as { error?: string; lead_id?: string };
    if (d?.error) return toast.error(d.error);
    toast.success(action === "ignore" ? "Ignored" : `Linked to lead ${d?.lead_id?.slice(0, 8)}…`);
    onDecided();
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review CTM caller</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-md border p-3 text-xs bg-muted/40">
            <div><span className="text-muted-foreground">Call:</span> <code>{review.ctm_call_id}</code></div>
            <div><span className="text-muted-foreground">From:</span> {review.from_number ?? "—"} · <span className="text-muted-foreground">Name:</span> {review.caller_name ?? "—"}</div>
            <div><span className="text-muted-foreground">Tracking:</span> {review.tracking_number ?? "—"} · <span className="text-muted-foreground">State:</span> {review.resolved_state ?? "—"}</div>
            <div><span className="text-muted-foreground">Reason:</span> {review.reason}</div>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Attach to existing lead</div>
            <div className="flex gap-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads (phone or name)"/>
              <Button variant="outline" size="sm" onClick={() => void runSearch()}><Search className="h-4 w-4"/></Button>
            </div>
            <div className="mt-2 max-h-56 overflow-auto rounded-md border">
              {candidates.length === 0 && <div className="p-3 text-xs text-muted-foreground">No candidates yet.</div>}
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-t p-2 first:border-t-0">
                  <div>
                    <div className="text-sm font-medium">{c.parent_name ?? "(no name)"}</div>
                    <div className="text-xs text-muted-foreground">{c.phone ?? "—"} · {c.state ?? "—"}</div>
                    <a className="text-xs text-primary hover:underline" href={`/leads?lead=${c.id}`} target="_blank" rel="noreferrer">Open lead ↗</a>
                  </div>
                  <Button size="sm" disabled={busy} onClick={() => decide("attach", { lead_id: c.id })}>
                    <Link2 className="h-3.5 w-3.5 mr-1"/> Attach
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Create new lead</div>
            <div className="flex gap-2">
              <Input placeholder="State (GA, NC…)" value={createState} onChange={(e) => setCreateState(e.target.value)}/>
              <Button variant="secondary" disabled={busy} onClick={() => decide("create", { state: createState.trim() || undefined })}>
                <UserPlus className="h-4 w-4 mr-1"/> Create Lead Captured
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Ignore</div>
            <div className="flex gap-2">
              <Input placeholder="Reason (required)" value={ignoreReason} onChange={(e) => setIgnoreReason(e.target.value)}/>
              <Button variant="destructive" disabled={busy || !ignoreReason.trim()} onClick={() => decide("ignore", { reason: ignoreReason.trim() })}>
                <Ban className="h-4 w-4 mr-1"/> Ignore
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}