import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, PhoneMissed, PhoneIncoming, PhoneOutgoing, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPhoneDisplay } from "@/lib/phone/format";
import { useCanonicalCtmCalls, type CanonicalCtmCallRow, type CtmQueryOptions } from "@/lib/intake/reviewDataLayer";

function fmtDuration(sec: number | null): string {
  if (sec == null || sec < 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function directionIcon(direction: string | null, status: string | null) {
  const missed = status?.toLowerCase().includes("miss") || status?.toLowerCase().includes("voicemail");
  if (missed) return <PhoneMissed className="h-4 w-4 text-destructive" />;
  if (direction?.toLowerCase().startsWith("out")) return <PhoneOutgoing className="h-4 w-4 text-primary" />;
  return <PhoneIncoming className="h-4 w-4 text-emerald-600" />;
}

function linkStatusBadge(s: CanonicalCtmCallRow["link_status"]) {
  if (s === "linked") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Linked</Badge>;
  if (s === "unmatched_no_tracking") return <Badge variant="outline" className="border-amber-300 text-amber-800">No tracking #</Badge>;
  if (s === "unmatched_short") return <Badge variant="outline" className="border-slate-300 text-muted-foreground">Short call</Badge>;
  return <Badge variant="outline">Unmatched</Badge>;
}

export default function CTMCalls() {
  const [q, setQ] = useState("");
  const [linkStatus, setLinkStatus] = useState<"all" | "linked" | "unmatched">("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const opts: CtmQueryOptions = useMemo(() => ({
    page, pageSize,
    linkStatus,
    search: q.trim() || undefined,
  }), [page, linkStatus, q]);
  const { data, isLoading, error } = useCanonicalCtmCalls(opts);
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const missedCount = useMemo(
    () => rows.filter((r) => r.status?.toLowerCase().includes("miss") || r.status?.toLowerCase().includes("voicemail")).length,
    [rows],
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Call History (CTM)</h1>
        <p className="text-sm text-muted-foreground">
          Read-only, PII-safe view over v_intake_ctm_calls_safe. Caller
          identity, transcript and recording are only available to
          admin-audit surfaces.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Tracking #, caller number, source or campaign…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "linked", "unmatched"] as const).map((v) => (
            <Button
              key={v}
              variant={linkStatus === v ? "default" : "outline"}
              size="sm"
              onClick={() => { setLinkStatus(v); setPage(1); }}
            >
              {v === "all" ? "All" : v === "linked" ? "Linked" : "Unmatched"}
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {isLoading
            ? "Loading…"
            : error
              ? `Error: ${(error as Error).message}`
              : `Page ${page} / ${totalPages} · ${total.toLocaleString()} calls · ${missedCount} missed on page`}
        </div>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Results</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-destructive">Failed to load CTM calls.</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No calls yet. When CTM webhooks fire or a backfill runs, entries appear here automatically.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const when = r.called_at ? new Date(r.called_at).toLocaleString() : "—";
                const otherNumber = r.from_number;
                const linkTo = r.matched_lead_id
                  ? `/leads/${r.matched_lead_id}`
                  : r.intake_lead_id
                    ? `/leads/${r.intake_lead_id}`
                    : null;
                return (
                  <div key={r.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {directionIcon(r.direction, r.status)}
                        <div className="min-w-0">
                          <div className="font-medium text-sm">
                            {formatPhoneDisplay(otherNumber) || "Unknown"}
                            {r.caller_city || r.caller_state ? (
                              <span className="text-xs text-muted-foreground ml-2">
                                {[r.caller_city, r.caller_state].filter(Boolean).join(", ")}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {when} · {r.status ?? r.direction ?? "call"} · {fmtDuration(r.duration_seconds)}
                            {r.source_name ? ` · ${r.source_name}` : ""}
                            {r.campaign_name ? ` · ${r.campaign_name}` : ""}
                            {r.tracking_number ? ` · ${r.tracking_number}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {linkStatusBadge(r.link_status)}
                        {linkTo ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link to={linkTo}><ExternalLink className="h-3 w-3 mr-1" /> Open</Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                </Button>
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
