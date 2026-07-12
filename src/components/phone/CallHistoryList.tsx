import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhoneDisplay, toE164 } from "@/lib/phone/format";
import { Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing, Play, Download, FileText } from "lucide-react";

export type CallHistoryRow = {
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
};

type Props = {
  numbers: Array<string | null | undefined>;
  title?: string;
  emptyMessage?: string;
  limit?: number;
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

export function CallHistoryList({ numbers, title = "Call History", emptyMessage, limit = 50 }: Props) {
  const [rows, setRows] = useState<CallHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const targets = Array.from(
    new Set(
      numbers
        .map((n) => toE164(n))
        .filter((n): n is string => Boolean(n))
        .flatMap((n) => [n, n.replace(/^\+1/, ""), n.replace(/^\+/, "")]),
    ),
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      if (targets.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }
      const or = targets.flatMap((t) => [`from_number.eq.${t}`, `to_number.eq.${t}`]).join(",");
      const { data, error } = await supabase
        .from("ctm_call_events")
        .select(
          "id,called_at,direction,status,from_number,to_number,caller_name,duration_seconds,recording_url,transcript,tracking_number,source_name",
        )
        .or(or)
        .order("called_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (cancelled) return;
      if (error) {
        console.warn("CallHistoryList fetch failed", error);
        setRows([]);
      } else {
        setRows((data as CallHistoryRow[]) ?? []);
      }
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets.join("|"), limit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="h-4 w-4" /> {title}
          <Badge variant="secondary" className="ml-2">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading calls…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            {emptyMessage ?? "No calls yet for this record."}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const when = r.called_at ? new Date(r.called_at).toLocaleString() : "—";
              const otherNumber = r.direction?.toLowerCase().startsWith("out") ? r.to_number : r.from_number;
              return (
                <div key={r.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {directionIcon(r.direction, r.status)}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {r.caller_name || formatPhoneDisplay(otherNumber) || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {when} · {r.status ?? r.direction ?? "call"} · {fmtDuration(r.duration_seconds)}
                          {r.source_name ? ` · ${r.source_name}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.recording_url && (
                        <Button size="sm" variant="outline" onClick={() => setPlayingId(playingId === r.id ? null : r.id)}>
                          <Play className="h-3 w-3 mr-1" /> {playingId === r.id ? "Hide" : "Play"}
                        </Button>
                      )}
                      {r.recording_url && (
                        <Button asChild size="sm" variant="ghost" title="Download recording">
                          <a href={r.recording_url} download target="_blank" rel="noreferrer">
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {r.transcript && (
                        <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                          <FileText className="h-3 w-3 mr-1" /> {expandedId === r.id ? "Hide" : "Transcript"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {playingId === r.id && r.recording_url && (
                    <audio className="w-full mt-2" controls src={r.recording_url} autoPlay />
                  )}
                  {expandedId === r.id && r.transcript && (
                    <div className="mt-2 space-y-2">
                      <div className="text-xs whitespace-pre-wrap bg-muted p-2 rounded max-h-64 overflow-auto">{r.transcript}</div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const blob = new Blob([r.transcript ?? ""], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `transcript-${r.id}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" /> Download transcript
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CallHistoryList;
