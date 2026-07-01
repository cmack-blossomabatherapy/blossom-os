import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Car, Download, Plus } from "lucide-react";

interface Trip {
  id: string;
  employee_name: string | null;
  trip_date: string;
  origin_address: string | null;
  destination_address: string | null;
  miles: number;
  purpose: string;
  status: string;
  source: string;
}

export default function MileageCenter() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(0.67);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("mileage_trips")
      .select("id,employee_name,trip_date,origin_address,destination_address,miles,purpose,status,source")
      .order("trip_date", { ascending: false })
      .limit(200);
    setTrips((data ?? []) as Trip[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const approved = trips.filter((t) => t.status === "approved");
    const miles = approved.reduce((s, t) => s + Number(t.miles || 0), 0);
    return { count: approved.length, miles, dollars: miles * rate };
  }, [trips, rate]);

  async function approve(id: string) {
    await supabase.from("mileage_trips").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
    load();
  }
  async function reject(id: string) {
    await supabase.from("mileage_trips").update({ status: "rejected" }).eq("id", id);
    load();
  }

  async function createExport() {
    const approved = trips.filter((t) => t.status === "approved");
    if (!approved.length) { toast({ title: "No approved trips", variant: "destructive" }); return; }
    const { data, error } = await supabase.from("mileage_reimbursement_exports").insert({
      period_start: approved[approved.length - 1].trip_date,
      period_end: approved[0].trip_date,
      trip_count: approved.length,
      total_miles: totals.miles,
      rate_per_mile: rate,
      total_amount: totals.dollars,
      status: "draft",
    }).select().single();
    if (error) { toast({ title: "Export failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Draft export created", description: `${approved.length} trips, ${totals.miles.toFixed(1)} mi.` });
    // Attach the trips to the export
    await supabase.from("mileage_trips").update({ reimbursement_export_id: data!.id }).in("id", approved.map((t) => t.id));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><Car className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-semibold">Mileage</h1>
          <p className="text-sm text-muted-foreground">BCBA / RBT trip capture (Mapsly) and payroll reimbursement.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Approved trips</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{totals.count}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Total miles</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{totals.miles.toFixed(1)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Reimbursement</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">${totals.dollars.toFixed(2)}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trips</CardTitle>
          <div className="flex items-end gap-3">
            <div>
              <Label htmlFor="rate" className="text-xs">Rate / mi</Label>
              <Input id="rate" type="number" step="0.01" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} className="w-24" />
            </div>
            <Button onClick={createExport}><Download className="mr-2 h-4 w-4" /> Create Payroll Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : trips.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No trips yet. Once BCBAs and RBTs start using Mapsly's mobile tracker, trips will appear here for approval.
              <div className="mt-3"><Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Log a manual trip (coming soon)</Button></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Date</th><th>Employee</th><th>From → To</th><th>Miles</th><th>Purpose</th><th>Source</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2">{t.trip_date}</td>
                      <td>{t.employee_name ?? "—"}</td>
                      <td className="max-w-[300px] truncate">{t.origin_address ?? "?"} → {t.destination_address ?? "?"}</td>
                      <td>{Number(t.miles).toFixed(1)}</td>
                      <td className="capitalize">{t.purpose}</td>
                      <td className="capitalize"><Badge variant="outline">{t.source}</Badge></td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="text-right">
                        {t.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => approve(t.id)}>Approve</Button>
                            <Button size="sm" variant="ghost" onClick={() => reject(t.id)}>Reject</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-500/15 text-emerald-700",
    reimbursed: "bg-blue-500/15 text-blue-700",
    pending: "bg-amber-500/15 text-amber-700",
    rejected: "bg-red-500/15 text-red-700",
  };
  return <Badge className={map[status] ?? ""}>{status}</Badge>;
}