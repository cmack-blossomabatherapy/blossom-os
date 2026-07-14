import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, PhoneMissed, PhoneIncoming, PhoneOutgoing, Play, ExternalLink } from "lucide-react";
import { formatPhoneDisplay, toE164 } from "@/lib/phone/format";

type Row = {
  id: string;
  called_at: string | null;
  direction: string | null;
  status: string | null;
  from_number: string | null;
  to_number: string | null;
  caller_name: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  transcript: string | null;
  tracking_number: string | null;
  source_name: string | null;
  matched_lead_id: string | null;
  matched_client_id: string | null;
};

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

export default function CTMCalls() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [unmatchedOnly, setUnmatchedOnly] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = q.trim();
  const e164 = toE164(query);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      let req = supabase
        .from("ctm_call_events")
        .select(
          "id,called_at,direction,status,from_number,to_number,caller_name,duration_seconds,recording_url,transcript,tracking_number,source_name,matched_lead_id,matched_client_id",
        )
        .order("called_at", { ascending: false, nullsFirst: false })
        .limit(200);

      if (query) {
        if (e164) {
          const bare = e164.replace(/^\+1/, "");
          const alts = [e164, bare, `+${bare}`];
          const or = alts.flatMap((v) => [`from_number.eq.${v}`, `to_number.eq.${v}`]).join(",");
          req = req.or(or);
        } else {
          req = req.or(
            `caller_name.ilike.%${query}%,transcript.ilike.%${query}%,source_name.ilike.%${query}%,tracking_number.ilike.%${query}%`,
          );
        }
      }
      if (unmatchedOnly) {
        req = req.is("matched_lead_id", null).is("matched_client_id", null);
      }
      const { data, error } = await req;
      if (cancelled) return;
      if (error) {
        console.warn("CTMCalls fetch failed", error);
        setRows([]);
      } else {
        setRows((data as Row[]) ?? []);
      }
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [query, e164, unmatchedOnly]);

  const missedCount = useMemo(
    () => rows.filter((r) => r.status?.toLowerCase().includes("miss") || r.status?.toLowerCase().includes("voicemail")).length,
    [rows],
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Call History (CTM)</h1>
        <p className="text-sm text-muted-foreground">
          Search every inbound and outbound call tracked by CallTrackingMetrics.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Phone number, name, source, tracking, or transcript keyword…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant={unmatchedOnly ? "default" : "outline"} size="sm" onClick={() => setUnmatchedOnly((v) => !v)}>
          Unlinked only
        </Button>
        <div className="text-xs text-muted-foreground">
          {loading ? "Loading…" : `${rows.length} calls · ${missedCount} missed`}
        </div>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Results</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No calls found.</div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const when = r.called_at ? new Date(r.called_at).toLocaleString() : "—";
                const otherNumber = r.direction?.toLowerCase().startsWith("out") ? r.to_number : r.from_number;
                const linkTo = r.matched_lead_id
                  ? `/leads?view=pipeline&lead=${r.matched_lead_id}`
                  : r.matched_client_id
                    ? `/clients?client=${r.matched_client_id}`
                    : null;
                return (
                  <div key={r.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {directionIcon(r.direction, r.status)}
                        <div className="min-w-0">
                          <div className="font-medium text-sm">
                            {r.caller_name || formatPhoneDisplay(otherNumber) || "Unknown"}
                            {r.caller_name && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {formatPhoneDisplay(otherNumber)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {when} · {r.status ?? r.direction ?? "call"} · {fmtDuration(r.duration_seconds)}
                            {r.source_name ? ` · ${r.source_name}` : ""}
                            {r.tracking_number ? ` · ${r.tracking_number}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {linkTo ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link to={linkTo}><ExternalLink className="h-3 w-3 mr-1" /> Open</Link>
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Unlinked</Badge>
                        )}
                        {r.recording_url && (
                          <Button size="sm" variant="outline" onClick={() => setPlayingId(playingId === r.id ? null : r.id)}>
                            <Play className="h-3 w-3 mr-1" /> {playingId === r.id ? "Hide" : "Play"}
                          </Button>
                        )}
                        {r.transcript && (
                          <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                            {expandedId === r.id ? "Hide" : "Transcript"}
                          </Button>
                        )}
                      </div>
                    </div>
                    {playingId === r.id && r.recording_url && (
                      <audio className="w-full mt-2" controls src={r.recording_url} autoPlay />
                    )}
                    {expandedId === r.id && r.transcript && (
                      <div className="text-xs mt-2 whitespace-pre-wrap bg-muted p-2 rounded">{r.transcript}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
