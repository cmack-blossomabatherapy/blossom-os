import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GraduationCap, Search } from "lucide-react";
import { useMyFellows, useFellowshipStages } from "./useFellowship";
import { STAGE_TONE } from "./config";
import FellowDetailDrawer from "./FellowDetailDrawer";

function fmt(d?: string | null) { if (!d) return "—"; try { return new Date(d).toLocaleDateString(); } catch { return "—"; } }

export default function FellowshipPage() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)); }, []);

  const fellows = useMyFellows(uid);
  const stages = useFellowshipStages();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const filtered = useMemo(() => {
    const list = fellows.data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((f: any) =>
      [f.full_name, f.email, f.stage_key, f.state, f.clinic].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(s))
    );
  }, [q, fellows.data]);

  const byStage = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of fellows.data ?? []) map.set(f.stage_key, (map.get(f.stage_key) ?? 0) + 1);
    return map;
  }, [fellows.data]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">My Fellows</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Fellowship supervision — separate from regular RBT supervision. Only fellows you are assigned to appear here.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fellows…" className="pl-8 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {(stages.data ?? []).map((s: any) => (
          <Card key={s.id} className="border">
            <CardContent className="pt-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-semibold">{byStage.get(s.key) ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Fellows</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {fellows.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {!fellows.isLoading && filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You are not currently assigned to any fellows. An administrator can assign fellowship roles from the admin panel.
            </p>
          ) : null}
          {filtered.map((f: any) => (
            <button
              key={f.id}
              onClick={() => setSelected(f)}
              className="w-full text-left rounded-lg border bg-card px-4 py-3 hover:bg-accent/40 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{f.full_name}</div>
                    <Badge variant="outline" className={STAGE_TONE[f.stage_key] ?? ""}>
                      {(f.stage_key ?? "").replace(/_/g, " ")}
                    </Badge>
                    {(f.my_roles ?? []).slice(0, 2).map((r: string) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">{r.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Next meeting {fmt(f.next_meeting_at)} · Coursework {f.coursework_status ?? "—"} · Fieldwork {f.fieldwork_status ?? "—"}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <div>Restricted {Number(f.restricted_hours ?? 0)}</div>
                  <div>Unrestricted {Number(f.unrestricted_hours ?? 0)}</div>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <FellowDetailDrawer fellow={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}