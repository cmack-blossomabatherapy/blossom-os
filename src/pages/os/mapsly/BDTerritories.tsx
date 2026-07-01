import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { MapPin, Plus, ExternalLink } from "lucide-react";

interface Territory { id: string; name: string; state: string | null; region: string | null; owner_name: string | null; color: string | null; status: string; }
interface Pin { id: string; territory_id: string | null; name: string; kind: string; city: string | null; state: string | null; status: string; }

export default function BDTerritories() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [name, setName] = useState("");
  const [state, setState] = useState("");

  async function load() {
    const [{ data: ts }, { data: ps }] = await Promise.all([
      supabase.from("bd_territories").select("id,name,state,region,owner_name,color,status").order("name"),
      supabase.from("bd_territory_leads").select("id,territory_id,name,kind,city,state,status").order("name"),
    ]);
    setTerritories((ts ?? []) as Territory[]);
    setPins((ps ?? []) as Pin[]);
  }
  useEffect(() => { load(); }, []);

  async function createTerritory() {
    if (!name.trim()) return;
    const { error } = await supabase.from("bd_territories").insert({ name, state: state || null });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setName(""); setState("");
    load();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><MapPin className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-semibold">Business Development · Territories</h1>
          <p className="text-sm text-muted-foreground">Territory + lead mapping. Route planning opens Mapsly.</p>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle>New territory</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="North Atlanta" /></div>
          <div><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="GA" className="w-24" /></div>
          <Button onClick={createTerritory}><Plus className="mr-2 h-4 w-4" /> Add</Button>
          <Button variant="outline" asChild className="ml-auto"><a href="https://app.mapsly.com" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open Mapsly</a></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Territories</CardTitle></CardHeader>
        <CardContent>
          {territories.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No territories yet. Add one above.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {territories.map((t) => {
                const count = pins.filter((p) => p.territory_id === t.id).length;
                return (
                  <div key={t.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: t.color ?? "#2B7BD5" }} />
                      <div className="font-medium">{t.name}</div>
                      <Badge variant="outline" className="ml-auto">{t.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{[t.state, t.region].filter(Boolean).join(" · ") || "—"}</div>
                    <div className="mt-2 text-xs">{count} pin{count === 1 ? "" : "s"} · Owner: {t.owner_name ?? "unassigned"}</div>
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