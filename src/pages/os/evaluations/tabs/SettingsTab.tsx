import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Beaker, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EvaluationsData, EvalSettings } from "../useEvaluationsData";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs font-normal">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export default function SettingsTab({ data, canEdit }: { data: EvaluationsData; canEdit: boolean }) {
  const [s, setS] = useState<EvalSettings | null>(data.settings);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const testStaff = data.staff.filter((x) => (x.notes ?? "").startsWith("[TEST]"));

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

  return (
    <div className="space-y-4">
      {!canEdit && <p className="text-xs text-muted-foreground rounded-xl border bg-muted px-3 py-2">Read-only view. HR or Super Admin can edit settings.</p>}

      <Section title="Evaluation Frequencies">
        <Toggle label="Quarterly evaluations enabled" value={s.quarterly_enabled} onChange={(v) => set("quarterly_enabled", v)} />
        <Toggle label="Annual evaluations enabled" value={s.annual_enabled} onChange={(v) => set("annual_enabled", v)} />
        <Toggle label="Auto-create next evaluation after completion" value={s.auto_create_next} onChange={(v) => set("auto_create_next", v)} />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1"><Label className="text-xs">Default BCBA frequency</Label>
            <Select value={s.default_bcba_frequency} onValueChange={(v) => set("default_bcba_frequency", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="Annual">Annual</SelectItem><SelectItem value="Both">Both</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Default RBT frequency</Label>
            <Select value={s.default_rbt_frequency} onValueChange={(v) => set("default_rbt_frequency", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="Annual">Annual</SelectItem><SelectItem value="Both">Both</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Due Date Rules" description="Days from previous step completion.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label className="text-xs">Self eval due in</Label><Input type="number" value={s.self_due_days} onChange={(e) => set("self_due_days", Number(e.target.value))} className="h-9" /></div>
          <div><Label className="text-xs">Leadership due in</Label><Input type="number" value={s.leadership_due_days} onChange={(e) => set("leadership_due_days", Number(e.target.value))} className="h-9" /></div>
          <div><Label className="text-xs">Meeting due in</Label><Input type="number" value={s.meeting_due_days} onChange={(e) => set("meeting_due_days", Number(e.target.value))} className="h-9" /></div>
          <div><Label className="text-xs">Finalize due in</Label><Input type="number" value={s.finalize_due_days} onChange={(e) => set("finalize_due_days", Number(e.target.value))} className="h-9" /></div>
        </div>
      </Section>

      <Section title="Reminder Rules">
        <Toggle label="7 days before due date" value={s.reminder_7_before} onChange={(v) => set("reminder_7_before", v)} />
        <Toggle label="3 days before due date" value={s.reminder_3_before} onChange={(v) => set("reminder_3_before", v)} />
        <Toggle label="On due date" value={s.reminder_on_due} onChange={(v) => set("reminder_on_due", v)} />
        <Toggle label="3 days overdue" value={s.reminder_3_overdue} onChange={(v) => set("reminder_3_overdue", v)} />
        <Toggle label="7 days overdue" value={s.reminder_7_overdue} onChange={(v) => set("reminder_7_overdue", v)} />
        <Toggle label="Weekly overdue reminders until complete" value={s.reminder_weekly_overdue} onChange={(v) => set("reminder_weekly_overdue", v)} />
      </Section>

      <Section title="Email Sender Settings">
        {!s.email_connected && (
          <p className="text-xs rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 text-amber-900 dark:text-amber-200 px-3 py-2">
            Email integration required before live evaluation emails can be sent. Emails are queued until then.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Sender name</Label><Input value={s.sender_name ?? ""} onChange={(e) => set("sender_name", e.target.value)} className="h-9" /></div>
          <div><Label className="text-xs">Sender email</Label><Input type="email" value={s.sender_email ?? ""} onChange={(e) => set("sender_email", e.target.value)} className="h-9" placeholder="evaluations@blossomaba.com" /></div>
          <div><Label className="text-xs">Reply-to email</Label><Input type="email" value={s.reply_to_email ?? ""} onChange={(e) => set("reply_to_email", e.target.value)} className="h-9" /></div>
          <div className="flex items-end"><Toggle label="Email integration connected" value={s.email_connected} onChange={(v) => set("email_connected", v)} /></div>
        </div>
      </Section>

      <Section title="Visibility Settings">
        <Toggle label="BCBA/RBT can view past completed evaluations" value={s.staff_can_view_past} onChange={(v) => set("staff_can_view_past", v)} />
        <Toggle label="Staff can download completed evaluation summaries" value={s.staff_can_download} onChange={(v) => set("staff_can_download", v)} />
        <Toggle label="Reviewers can see previous evaluations" value={s.reviewer_can_view_past} onChange={(v) => set("reviewer_can_view_past", v)} />
        <Toggle label="State Directors see only their assigned state" value={s.state_director_scope} onChange={(v) => set("state_director_scope", v)} />
        <Toggle label="HR sees all states" value={s.hr_sees_all_states} onChange={(v) => set("hr_sees_all_states", v)} />
      </Section>

      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Settings"}</Button>
        </div>
      )}

      {canEdit && (
        <Section title="Test Mode" description="Create safe test staff to walk through the evaluation workflow without affecting live data. Test records are excluded from reports unless 'Include Test Data' is enabled.">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={createTestStaff} disabled={seeding}>
              <Beaker className="h-3.5 w-3.5 mr-1.5" /> {seeding ? "Creating…" : "Create test staff"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} disabled={testStaff.length === 0}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete test data
            </Button>
            <span className="text-xs text-muted-foreground ml-1">{testStaff.length} test record(s) in the system</span>
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
  );
}