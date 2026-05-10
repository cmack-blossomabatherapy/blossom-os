import { useEffect, useState } from "react";
import { Plane, Clock, Wallet, FileText, HeartHandshake, MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Card = { key: string; label: string; desc: string; icon: typeof Plane };

const CARDS: Card[] = [
  { key: "pto", label: "Time Off", desc: "Request and track PTO", icon: Plane },
  { key: "hours", label: "My Hours", desc: "Weekly hours snapshot", icon: Clock },
  { key: "payroll", label: "Payroll", desc: "Pay schedule & stubs", icon: Wallet },
  { key: "docs", label: "HR Documents", desc: "Handbook, policies", icon: FileText },
  { key: "benefits", label: "Benefits", desc: "Insurance & perks", icon: HeartHandshake },
  { key: "contact", label: "Contact HR", desc: "Reach the team", icon: MessageSquare },
];

export function HRSection({ userId, openPanel, setOpenPanel }: {
  userId: string;
  openPanel: string | null;
  setOpenPanel: (k: string | null) => void;
}) {
  return (
    <>
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">HR self-service</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CARDS.map((c) => (
            <button key={c.key} onClick={() => setOpenPanel(c.key)}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-background/40 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><c.icon className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <p className="text-[11px] text-muted-foreground">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <PTOPanel open={openPanel === "pto"} onClose={() => setOpenPanel(null)} userId={userId} />
      <SimplePanel open={openPanel === "hours"} onClose={() => setOpenPanel(null)} title="My Hours" desc="Hours pulled from your time system.">
        <div className="rounded-2xl border border-border/50 p-4 text-center">
          <p className="text-3xl font-semibold tabular-nums">32.5</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Hours this week</p>
        </div>
        <Button asChild className="w-full"><Link to="/hr/time-clock">Open Time System <ArrowRight className="h-4 w-4" /></Link></Button>
      </SimplePanel>
      <SimplePanel open={openPanel === "payroll"} onClose={() => setOpenPanel(null)} title="Payroll" desc="Pay schedule and quick links.">
        <div className="space-y-2 rounded-2xl border border-border/50 p-4 text-sm">
          <Row label="Pay frequency" value="Bi-weekly" />
          <Row label="Next pay date" value="Fri, May 15" />
          <Row label="Last pay date" value="Fri, May 1" />
        </div>
        <Button asChild variant="outline" className="w-full"><Link to="/hr/payroll">Open payroll <ArrowRight className="h-4 w-4" /></Link></Button>
        <p className="text-[11px] text-muted-foreground">Shown values are placeholders — connect your provider in Admin to wire real data.</p>
      </SimplePanel>
      <SimplePanel open={openPanel === "docs"} onClose={() => setOpenPanel(null)} title="HR Documents" desc="Handbook, policies, and forms.">
        <DocList userId={userId} />
      </SimplePanel>
      <SimplePanel open={openPanel === "benefits"} onClose={() => setOpenPanel(null)} title="Benefits" desc="Insurance, retirement, and perks.">
        <div className="space-y-2 text-sm">
          {["Medical & Dental", "Vision", "401(k)", "Wellness Stipend"].map((b) => (
            <div key={b} className="rounded-xl border border-border/50 p-3">{b}</div>
          ))}
        </div>
      </SimplePanel>
      <SimplePanel open={openPanel === "contact"} onClose={() => setOpenPanel(null)} title="Contact HR" desc="We're here to help.">
        <Button asChild className="w-full"><Link to="/hr/announcements">View announcements</Link></Button>
        <Button asChild variant="outline" className="w-full"><a href="mailto:hr@blossomaba.com">Email HR</a></Button>
      </SimplePanel>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium text-foreground">{value}</span></div>;
}

function SimplePanel({ open, onClose, title, desc, children }: { open: boolean; onClose: () => void; title: string; desc: string; children: React.ReactNode }) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left"><SheetTitle>{title}</SheetTitle><SheetDescription>{desc}</SheetDescription></SheetHeader>
        <div className="mt-4 space-y-3">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

function DocList({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["hr_documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hr_documents").select("*").eq("is_active", true).order("last_updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!data?.length) return <p className="text-xs text-muted-foreground">No documents published yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((d: any) => (
        <a key={d.id} href={d.external_url || d.file_url || "#"} target="_blank" rel="noreferrer"
          className="flex items-start justify-between gap-2 rounded-xl border border-border/50 p-3 hover:border-primary/40">
          <div>
            <p className="text-sm font-medium text-foreground">{d.title}</p>
            <p className="text-[11px] text-muted-foreground">{d.doc_type} · Updated {new Date(d.last_updated_at).toLocaleDateString()}</p>
          </div>
          {d.requires_acknowledgement && <Badge variant="outline" className="text-[10px]">Ack required</Badge>}
        </a>
      ))}
    </div>
  );
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline", submitted: "secondary", pending_review: "secondary",
  approved: "default", denied: "destructive", cancelled: "outline",
};

function PTOPanel({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [type, setType] = useState<"vacation" | "sick" | "personal" | "unpaid" | "other">("vacation");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [hours, setHours] = useState("8");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: requests } = useQuery({
    queryKey: ["pto_requests", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pto_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  async function submit() {
    if (!start || !end) return toast({ title: "Pick dates", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("pto_requests").insert({
      user_id: userId, pto_type: type, start_date: start, end_date: end,
      hours: parseFloat(hours) || 0, reason: reason || null, status: "submitted", submitted_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
    toast({ title: "Request submitted", description: "Your manager will review it shortly." });
    setStart(""); setEnd(""); setHours("8"); setReason("");
    qc.invalidateQueries({ queryKey: ["pto_requests", userId] });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left"><SheetTitle>Time Off</SheetTitle><SheetDescription>Request PTO and review your history.</SheetDescription></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-3 rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New request</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Start</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Hours</Label><Input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label>Reason (optional)</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <Button onClick={submit} disabled={busy} className="w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit request"}</Button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent requests</p>
            {!requests?.length && <p className="text-xs text-muted-foreground">No requests yet.</p>}
            <div className="space-y-2">
              {requests?.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3 text-sm">
                  <div>
                    <p className="font-medium capitalize text-foreground">{r.pto_type} · {r.hours}h</p>
                    <p className="text-[11px] text-muted-foreground">{r.start_date} → {r.end_date}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] || "outline"} className="text-[10px] capitalize">{String(r.status).replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}