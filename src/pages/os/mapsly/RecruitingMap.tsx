import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, ExternalLink, Search } from "lucide-react";

interface Candidate { id: string; name: string; role: string | null; city: string | null; state: string | null; status: string | null; }
interface Row { id: string; first_name: string; last_name: string; role: string | null; city: string | null; state: string | null; pipeline_stage: string | null; }

export default function RecruitingMap() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recruiting_candidates")
        .select("id,first_name,last_name,role,city,state,pipeline_stage")
        .limit(200);
      const mapped: Candidate[] = ((data ?? []) as Row[]).map((r) => ({
        id: r.id,
        name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
        role: r.role,
        city: r.city,
        state: r.state,
        status: r.pipeline_stage,
      }));
      setRows(mapped);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [r.name, r.city, r.state, r.role].some((v) => v?.toLowerCase().includes(s));
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><MapPin className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-semibold">Recruiting Map</h1>
          <p className="text-sm text-muted-foreground">Candidate proximity to clients — powered by Mapsly.</p>
        </div>
        <Button variant="outline" asChild className="ml-auto">
          <a href="https://app.mapsly.com" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open in Mapsly</a>
        </Button>
      </header>

      <Card>
        <CardHeader><CardTitle>Candidates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city, state, role" className="pl-8" />
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No candidates match.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Name</th><th>Role</th><th>City</th><th>State</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2">{r.name}</td>
                      <td>{r.role ?? "—"}</td>
                      <td>{r.city ?? "—"}</td>
                      <td>{r.state ?? "—"}</td>
                      <td>{r.status ? <Badge variant="outline">{r.status}</Badge> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            The live map with drive-time radius and pins renders once Mapsly's Maps SDK is embedded (Phase 4). Data on this page is already synced-ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}