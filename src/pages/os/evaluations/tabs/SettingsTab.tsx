import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Beaker, Trash2, ListChecks, Bell, Mail, Eye, FlaskConical, Plug, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EvaluationsData, EvalSettings } from "../useEvaluationsData";
import EvaluationRulesSection from "../EvaluationRulesSection";

function Section({ id, title, description, children }: { id?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 rounded-2xl border border-border/60 bg-card p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-16px_hsl(220_30%_20%/0.08)]">
      <div className="mb-5">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-background/40 px-3.5 py-2.5">
      <Label className="text-[12.5px] font-normal text-foreground/90 cursor-pointer">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">{children}</Label>;
}

export default function SettingsTab({ data, canEdit }: { data: EvaluationsData; canEdit: boolean }) {
  const [s, setS] = useState<EvalSettings | null>(data.settings);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [section, setSection] = useState<string>("rules");
  const testStaff = data.staff.filter((x) => (x.notes ?? "").startsWith("[TEST]"));
  const [vivSyncing, setVivSyncing] = useState(false);
  const [vivResult, setVivResult] = useState<{ ok: boolean; connected: boolean; updated?: number; matched?: number; received?: number; error?: string; at?: string } | null>(null);

  async function syncViventium() {
    setVivSyncing(true);
    setVivResult(null);
    const { data: out, error } = await supabase.functions.invoke("viventium-sync", { body: {} });
    setVivSyncing(false);
    if (error) {
      setVivResult({ ok: false, connected: false, error: error.message });
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
      return;
    }
    setVivResult(out as any);
    if (out?.ok) {
      toast({ title: "Viventium synced", description: `Updated ${out.updated} of ${out.matched} matched employees.` });
      data.refresh();
    } else {
      toast({ title: "Sync info", description: out?.error ?? "Not connected", variant: "destructive" });
    }
  }

  useEffect(() => { setS(data.settings); }, [data.settings]);

  if (!s) return <p className="text-sm text-muted-foreground">Loading settings…</p>;

  const set = <K extends keyof EvalSettings>(k: K, v: EvalSettings[K]) => setS({ ...s, [k]: v });

  async function save() {
    if (!canEdit || !s) return;
    setSaving(true);
    const { error } = await (supabase.from as any)("evaluation_settings").update(s).eq("id", 1);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Settings saved" });
    data.refresh();
  }

  async function createTestStaff() {
    setSeeding(true);
    const stamp = Date.now();
    const rows = [
      { first_name: "Test", last_name: "BCBA", email: `test.bcba+${stamp}@example.com`, role: "BCBA" as const, state: "GA", evaluation_frequency: "Quarterly" as const, active_status: true, notes: "[TEST] Seeded by Test Mode" },
      { first_name: "Test", last_name: "RBT",  email: `test.rbt+${stamp}@example.com`,  role: "RBT" as const,  state: "GA", evaluation_frequency: "Quarterly" as const, active_status: true, notes: "[TEST] Seeded by Test Mode" },
    ];
    const { error } = await supabase.from("evaluation_staff").insert(rows);
    setSeeding(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Test staff created", description: "Open the Staff tab and toggle 'Include test data' to view." });
    data.refresh();
  }

  async function deleteTestData() {
    const ids = testStaff.map((x) => x.id);
    if (ids.length === 0) { setDeleteOpen(false); return; }
    // Delete dependent rows then staff
    await supabase.from("evaluation_emails").delete().in("staff_id", ids);
    await supabase.from("evaluations").delete().in("staff_id", ids);
    const { error } = await supabase.from("evaluation_staff").delete().in("id", ids);
    setDeleteOpen(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `Deleted ${ids.length} test staff and related records` });
    data.refresh();
  }

  const NAV: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "rules", label: "Schedule Rules", icon: ListChecks },
    { id: "due", label: "Due Dates", icon: ListChecks },
    { id: "reminders", label: "Reminders", icon: Bell },
    { id: "email", label: "Email Sender", icon: Mail },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "visibility", label: "Visibility", icon: Eye },
    { id: "test", label: "Test Mode", icon: FlaskConical },
  ];

  function goTo(id: string) {
    setSection(id);
    const el = document.getElementById(`settings-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 pb-24">
      <aside className="lg:sticky lg:top-24 lg:self-start space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = section === n.id;
          return (
            <button
              key={n.id}
              onClick={() => goTo(n.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {n.label}
            </button>
          );
        })}
      </aside>

      <div className="space-y-6 min-w-0">
      {!canEdit && <p className="text-xs text-muted-foreground rounded-xl border border-border/60 bg-muted/60 px-4 py-2.5">Read-only view. HR or Super Admin can edit settings.</p>}

      <div id="settings-rules" className="scroll-mt-24">
        <EvaluationRulesSection data={data} canEdit={canEdit} />
      </div>

      <Section id="settings-due" title="Due Date Rules" description="Days from previous step completion within an evaluation cycle.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5"><FieldLabel>Self eval</FieldLabel><Input type="number" value={s.self_due_days} onChange={(e) => set("self_due_days", Number(e.target.value))} className="h-9 text-sm" /></div>
          <div className="space-y-1.5"><FieldLabel>Leadership</FieldLabel><Input type="number" value={s.leadership_due_days} onChange={(e) => set("leadership_due_days", Number(e.target.value))} className="h-9 text-sm" /></div>
          <div className="space-y-1.5"><FieldLabel>Meeting</FieldLabel><Input type="number" value={s.meeting_due_days} onChange={(e) => set("meeting_due_days", Number(e.target.value))} className="h-9 text-sm" /></div>
          <div className="space-y-1.5"><FieldLabel>Finalize</FieldLabel><Input type="number" value={s.finalize_due_days} onChange={(e) => set("finalize_due_days", Number(e.target.value))} className="h-9 text-sm" /></div>
        </div>
      </Section>

      <Section id="settings-reminders" title="Reminder Rules" description="When to nudge staff and reviewers about pending evaluations.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <Toggle label="7 days before due date" value={s.reminder_7_before} onChange={(v) => set("reminder_7_before", v)} />
          <Toggle label="3 days before due date" value={s.reminder_3_before} onChange={(v) => set("reminder_3_before", v)} />
          <Toggle label="On due date" value={s.reminder_on_due} onChange={(v) => set("reminder_on_due", v)} />
          <Toggle label="3 days overdue" value={s.reminder_3_overdue} onChange={(v) => set("reminder_3_overdue", v)} />
          <Toggle label="7 days overdue" value={s.reminder_7_overdue} onChange={(v) => set("reminder_7_overdue", v)} />
          <Toggle label="Weekly overdue reminders until complete" value={s.reminder_weekly_overdue} onChange={(v) => set("reminder_weekly_overdue", v)} />
        </div>
      </Section>

      <Section id="settings-email" title="Email Sender" description="Branding and integration for outbound evaluation emails.">
        {!s.email_connected && (
          <p className="text-xs rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 text-amber-900 dark:text-amber-200 px-4 py-2.5">
            Email integration required before live evaluation emails can be sent. Emails are queued until then.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><FieldLabel>Sender name</FieldLabel><Input value={s.sender_name ?? ""} onChange={(e) => set("sender_name", e.target.value)} className="h-9 text-sm" /></div>
          <div className="space-y-1.5"><FieldLabel>Sender email</FieldLabel><Input type="email" value={s.sender_email ?? ""} onChange={(e) => set("sender_email", e.target.value)} className="h-9 text-sm" placeholder="evaluations@blossomaba.com" /></div>
          <div className="space-y-1.5"><FieldLabel>Reply-to email</FieldLabel><Input type="email" value={s.reply_to_email ?? ""} onChange={(e) => set("reply_to_email", e.target.value)} className="h-9 text-sm" /></div>
          <div className="space-y-1.5"><FieldLabel>Integration status</FieldLabel><Toggle label="Email integration connected" value={s.email_connected} onChange={(v) => set("email_connected", v)} /></div>
        </div>
      </Section>

      <Section id="settings-visibility" title="Visibility & Access" description="Who can see past evaluations and across which states.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <Toggle label="Staff can view past completed evaluations" value={s.staff_can_view_past} onChange={(v) => set("staff_can_view_past", v)} />
          <Toggle label="Staff can download completed evaluation summaries" value={s.staff_can_download} onChange={(v) => set("staff_can_download", v)} />
          <Toggle label="Reviewers can see previous evaluations" value={s.reviewer_can_view_past} onChange={(v) => set("reviewer_can_view_past", v)} />
          <Toggle label="State Directors see only their assigned state" value={s.state_director_scope} onChange={(v) => set("state_director_scope", v)} />
          <Toggle label="HR sees all states" value={s.hr_sees_all_states} onChange={(v) => set("hr_sees_all_states", v)} />
        </div>
      </Section>

      <Section id="settings-integrations" title="Integrations" description="Connect external systems to keep evaluation data in sync.">
        <div className="rounded-xl border border-border/50 bg-background/40 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Viventium · Hire Dates</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                Pull hire dates from Viventium so evaluation schedules (30-Day, Quarterly, Annual) are generated from each employee's actual hire date. Run this after onboarding new staff.
              </p>
              {vivResult && (
                <p className={cn("text-xs mt-2", vivResult.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
                  {vivResult.ok
                    ? `Synced ${vivResult.updated} of ${vivResult.matched} matched (${vivResult.received} received).`
                    : vivResult.error ?? "Sync failed"}
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={syncViventium} disabled={vivSyncing || !canEdit}>
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", vivSyncing && "animate-spin")} />
              {vivSyncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Not connected yet? Add <code className="px-1 py-0.5 rounded bg-muted">VIVENTIUM_USERNAME</code>, <code className="px-1 py-0.5 rounded bg-muted">VIVENTIUM_PASSWORD</code>, <code className="px-1 py-0.5 rounded bg-muted">VIVENTIUM_COMPANY_CODE</code>, and <code className="px-1 py-0.5 rounded bg-muted">VIVENTIUM_DIVISION_CODE</code> in Lovable Cloud secrets. Once connected, hire dates will refresh on every sync.
          </p>
        </div>
      </Section>

      {canEdit && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl px-3 py-2 shadow-lg">
            <Button onClick={save} disabled={saving} size="sm">{saving ? "Saving…" : "Save Settings"}</Button>
          </div>
        </div>
      )}

      {canEdit && (
        <Section id="settings-test" title="Test Mode" description="Create safe test staff to walk through the evaluation workflow without affecting live data. Test records are excluded from reports unless 'Include Test Data' is enabled.">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={createTestStaff} disabled={seeding}>
              <Beaker className="h-3.5 w-3.5 mr-1.5" /> {seeding ? "Creating…" : "Create test staff"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} disabled={testStaff.length === 0}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete test data
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">{testStaff.length} test record(s) in the system</span>
          </div>
        </Section>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all test data?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete {testStaff.length} test staff member(s) and all of their evaluations, meetings, and queued emails. Live staff records will not be touched. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteTestData(); }}>Delete test data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}