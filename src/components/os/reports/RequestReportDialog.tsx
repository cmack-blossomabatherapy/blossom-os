import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Sparkles, Upload, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveReportRequest } from "@/lib/os/reportsCatalog";
import { supabase } from "@/integrations/supabase/client";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";

const DEPARTMENTS = ["QA", "Authorizations", "Scheduling", "Recruiting", "HR", "Finance", "Leadership", "Clinical", "Other"];
const DATA_SOURCES = ["CentralReach", "Monday.com", "Viventium", "Scheduling Export", "BCBA Performance Report", "Authorization Export", "Manual Upload", "Other"];
const FREQUENCIES = ["One Time", "Weekly", "Monthly", "Real-Time Dashboard"];
const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const VISUALIZATIONS = ["Dashboard", "Table", "Charts", "KPI Summary", "Operational Alerts", "Executive Summary"];

const STEPS = ["Context", "Data", "Delivery"] as const;

export function RequestReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const { role } = useOSRole();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [purpose, setPurpose] = useState("");
  const [metrics, setMetrics] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [frequency, setFrequency] = useState("Weekly");
  const [priority, setPriority] = useState("Normal");
  const [viz, setViz] = useState("Dashboard");
  const [ai, setAi] = useState(true);

  function reset() {
    setStep(0); setTitle(""); setDepartment(""); setPurpose(""); setMetrics("");
    setSources([]); setAttachment(null); setFrequency("Weekly"); setPriority("Normal");
    setViz("Dashboard"); setAi(true);
  }

  function toggleSource(s: string) {
    setSources(cur => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);
  }

  const canNext =
    (step === 0 && title.trim() && department && purpose.trim()) ||
    (step === 1 && metrics.trim() && sources.length > 0) ||
    step === 2;

  async function submit() {
    // Canonical storage: system_issues in Supabase. localStorage is used
    // ONLY as an offline / unauthenticated fallback so a signed-out user
    // (or a network failure) doesn't lose their draft. On a normal
    // successful submission we do NOT write a local copy — that would
    // create duplicate rows for admins reviewing the queue.
    const record = {
      id: `req-${Date.now()}`,
      title: title.trim(),
      department,
      purpose: purpose.trim(),
      metrics: metrics.trim(),
      dataSources: sources,
      frequency,
      priority,
      visualization: viz,
      aiAssist: ai,
      attachmentName: attachment?.name,
      status: "New Request" as const,
      createdAt: new Date().toISOString(),
      requestedBy: role,
    };

    let submittedToServer = false;
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const reporterName =
        userRes.user?.user_metadata?.full_name ||
        userRes.user?.email ||
        role ||
        null;
      const dbPriority =
        priority === "Critical" ? "Critical" :
        priority === "High" ? "High" :
        priority === "Low" ? "Low" : "Medium";
      const notes = [
        `Report request: ${title.trim()}`,
        `Purpose: ${purpose.trim()}`,
        metrics.trim() ? `Metrics: ${metrics.trim()}` : "",
        sources.length ? `Data sources: ${sources.join(", ")}` : "",
        `Frequency: ${frequency}`,
        `Visualization: ${viz}`,
        `AI assist: ${ai ? "yes" : "no"}`,
        attachment?.name ? `Attachment: ${attachment.name}` : "",
        `Requested by role: ${role}`,
      ].filter(Boolean).join("\n");
      if (uid) {
        const { error } = await supabase.from("system_issues").insert({
          title: `Report request · ${title.trim()}`,
          area: `Reports · ${department || "Unspecified"}`,
          description: purpose.trim(),
          priority: dbPriority,
          status: "Open",
          notes,
          reported_by_id: uid,
          reported_by_name: reporterName,
        } as never);
        submittedToServer = !error;
      }
    } catch {
      submittedToServer = false;
    }

    // Only fall back to local storage when Supabase couldn't accept the
    // request (offline, unauthenticated, or insert error). This guarantees
    // one canonical row per submission for authenticated users.
    if (!submittedToServer) {
      saveReportRequest(record);
    }

    toast({
      title: submittedToServer ? "Report request submitted" : "Report request saved locally",
      description: submittedToServer
        ? "Systems & Software has been notified via System Requests."
        : "We saved it locally — sign in and reopen to sync it to System Requests.",
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="bg-gradient-to-br from-[hsl(265_100%_97%)] via-[hsl(285_100%_98%)] to-[hsl(225_100%_98%)] px-6 pb-5 pt-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-[hsl(265_70%_55%)] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">Request a New Report</Badge>
            </div>
            <DialogTitle className="text-[22px] font-semibold tracking-tight">Tell us what you need to see</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              We'll route this to the Systems &amp; Software team and AI-assist a draft layout for you.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
                  i < step ? "bg-[hsl(265_70%_55%)] text-white" : i === step ? "bg-[hsl(265_70%_55%)] text-white shadow-[0_0_0_4px_hsl(265_70%_55%/0.18)]" : "bg-white/70 text-muted-foreground",
                )}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn("text-[11.5px] font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border/60" />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Report title" hint="What should this report be called?">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. RBT Attendance by State" />
              </Field>
              <Field label="Department">
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Purpose" hint="What operational problem are you trying to solve?">
                <Textarea rows={4} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. We need to see which RBTs miss the most sessions so we can intervene early." />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Metrics needed" hint="What specific numbers or KPIs do you want to see?">
                <Textarea rows={3} value={metrics} onChange={(e) => setMetrics(e.target.value)} placeholder="e.g. cancellation rate, no-show rate, sessions per week, BCBA caseload" />
              </Field>
              <Field label="Data sources" hint="Where does the data live? Select all that apply.">
                <div className="flex flex-wrap gap-2">
                  {DATA_SOURCES.map(s => {
                    const active = sources.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSource(s)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                          active
                            ? "border-[hsl(265_70%_55%)] bg-[hsl(265_100%_97%)] text-[hsl(265_70%_45%)]"
                            : "border-border bg-card hover:border-[hsl(265_70%_55%/0.5)]",
                        )}
                      >{s}</button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Example export (optional)" hint="Attach a sample file to help us model the report.">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 text-[13px] text-muted-foreground transition hover:border-[hsl(265_70%_55%/0.5)] hover:bg-[hsl(265_100%_98%)]">
                  <Upload className="h-4 w-4" />
                  {attachment ? <span className="font-medium text-foreground">{attachment.name}</span> : <span>Drop a CSV / Excel / TXT or click to browse</span>}
                  <input type="file" className="hidden" accept=".csv,.txt,.xlsx,.xls" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                </label>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Frequency">
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Visualization preference">
                <div className="grid grid-cols-3 gap-2">
                  {VISUALIZATIONS.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setViz(v)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-[12px] font-medium transition",
                        viz === v
                          ? "border-[hsl(265_70%_55%)] bg-[hsl(265_100%_97%)] text-[hsl(265_70%_45%)] shadow-sm"
                          : "border-border bg-card hover:border-[hsl(265_70%_55%/0.5)]",
                      )}
                    >{v}</button>
                  ))}
                </div>
              </Field>
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-[hsl(265_100%_98%)] to-[hsl(225_100%_98%)] p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                    <p className="text-[13px] font-semibold">Use AI to suggest structure</p>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">Blossom AI will analyze your inputs and suggest KPIs, charts, and table layouts.</p>
                </div>
                <Switch checked={ai} onCheckedChange={setAi} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 border-t border-border/60 bg-secondary/30 px-6 py-3 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => step === 0 ? onOpenChange(false) : setStep(step - 1)}>
            {step === 0 ? "Cancel" : (<><ArrowLeft className="mr-1 h-3.5 w-3.5" />Back</>)}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" disabled={!canNext} onClick={() => setStep(step + 1)} className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
              Next<ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={submit} className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
              Submit request<Sparkles className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px] font-semibold">{label}</Label>
      {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}