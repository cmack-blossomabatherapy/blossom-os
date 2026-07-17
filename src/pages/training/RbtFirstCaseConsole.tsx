import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Row {
  id: string; employee_id: string; bcba_id: string | null; lead_rbt_id: string | null;
  start_date: string | null; status: string; client_display: string | null;
  cr_access_status: string;
  employee?: { first_name: string; last_name: string } | null;
  bcba?: { first_name: string; last_name: string } | null;
  lead?: { first_name: string; last_name: string } | null;
}
interface Outcome {
  id: string; first_case_id: string; title: string; details: string | null;
  category: string; severity: string; status: string; owner_role: string | null;
  resolution_note: string | null; created_at: string; due_date: string | null;
}

export default function RbtFirstCaseConsole() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: o }] = await Promise.all([
      supabase.from("rbt_first_case" as any).select(`
        *,
        employee:employees!rbt_first_case_employee_id_fkey(first_name,last_name),
        bcba:employees!rbt_first_case_bcba_id_fkey(first_name,last_name),
        lead:employees!rbt_first_case_lead_rbt_id_fkey(first_name,last_name)
      `).order("start_date", { ascending: true, nullsFirst: false }),
      supabase.from("rbt_first_session_outcomes" as any).select("*").neq("status", "resolved").order("created_at", { ascending: false }),
    ]);
    setRows(((r as any) ?? []) as Row[]);
    setOutcomes(((o as any) ?? []) as Outcome[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const outcomesByCase = useMemo(() => {
    const m = new Map<string, Outcome[]>();
    outcomes.forEach((o) => { const l = m.get(o.first_case_id) ?? []; l.push(o); m.set(o.first_case_id, l); });
    return m;
  }, [outcomes]);

  const resolve = async (o: Outcome) => {
    const note = notes[o.id]?.trim();
    if (!note) return toast.error("Please add a resolution note.");
    const { error } = await supabase.from("rbt_first_session_outcomes" as any)
      .update({ status: "resolved", resolution_note: note, resolved_by: user?.id }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Marked resolved");
    await load();
  };

  const sevTone = (s: string) => s === "urgent" ? "destructive" : s === "attention" ? "default" : "secondary";

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">First Case Oversight</h1>
        <p className="text-sm text-muted-foreground mt-1">Every follow-up is tracked until resolved with the RBT.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Open follow-ups ({outcomes.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {outcomes.length === 0 && <p className="text-sm text-muted-foreground">No open follow-ups. Nothing to resolve.</p>}
          {outcomes.map((o) => (
            <div key={o.id} className="rounded-xl border border-border/70 p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={sevTone(o.severity) as any}>{o.severity}</Badge>
                <Badge variant="outline">{o.category.replace(/_/g, " ")}</Badge>
                {o.owner_role && <Badge variant="secondary">Owner: {o.owner_role.replace(/_/g, " ")}</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">{new Date(o.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm font-medium">{o.title}</p>
              {o.details && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{o.details}</p>}
              <Textarea rows={2} placeholder="Resolution note (required)…"
                value={notes[o.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [o.id]: e.target.value }))} />
              <div className="flex justify-end"><Button size="sm" onClick={() => resolve(o)}>Mark resolved</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active first cases</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No active first cases.</p>}
          {rows.map((r) => {
            const os = outcomesByCase.get(r.id) ?? [];
            return (
              <div key={r.id} className="rounded-xl border border-border/70 p-4 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.employee?.first_name} {r.employee?.last_name} <span className="text-muted-foreground font-normal">· {r.client_display ?? "Client"}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {r.start_date ? new Date(r.start_date).toLocaleDateString() : "No start date"}
                    {r.bcba && ` · BCBA ${r.bcba.first_name} ${r.bcba.last_name}`}
                    {r.lead && ` · Lead ${r.lead.first_name} ${r.lead.last_name}`}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">{r.status.replace(/_/g, " ")}</Badge>
                <Badge variant={r.cr_access_status === "blocked" ? "destructive" : "secondary"} className="capitalize">CR {r.cr_access_status}</Badge>
                {os.length > 0 && <Badge variant="destructive">{os.length} open</Badge>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}