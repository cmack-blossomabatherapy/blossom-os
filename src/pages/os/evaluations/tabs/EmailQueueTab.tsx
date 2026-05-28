import { useState } from "react";
import { AlertCircle, Send, Eye, X, RotateCcw, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { EvaluationsData } from "../useEvaluationsData";
import type { EvalEmail, EvalEmailTemplate } from "../types";
import { EmailBadge, fmtDate } from "../statusBadges";

export default function EmailQueueTab({ data }: { data: EvaluationsData }) {
  const [preview, setPreview] = useState<EvalEmail | null>(null);
  const [editTpl, setEditTpl] = useState<EvalEmailTemplate | null>(null);

  const staffById = Object.fromEntries(data.staff.map((s) => [s.id, s]));

  async function updateEmail(id: string, patch: Partial<EvalEmail>) {
    const { error } = await supabase.from("evaluation_emails").update(patch).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    data.refresh();
  }
  async function markSent(id: string) {
    await updateEmail(id, { status: "Sent", sent_at: new Date().toISOString() });
    toast({ title: "Marked sent" });
  }
  async function cancelEmail(id: string) {
    await updateEmail(id, { status: "Cancelled" });
    toast({ title: "Cancelled" });
  }
  async function resend(id: string) {
    await updateEmail(id, { status: "Queued", sent_at: null, failed_reason: null });
    toast({ title: "Re-queued" });
  }
  async function sendNow(id: string) {
    const { data: res, error } = await supabase.functions.invoke("send-evaluation-emails", { body: { id } });
    if (error) return toast({ title: "Send failed", description: error.message, variant: "destructive" });
    if ((res as any)?.failed > 0) toast({ title: "Send failed", description: "Check Error column for details.", variant: "destructive" });
    else toast({ title: "Sent", description: "Email delivered via Resend." });
    data.refresh();
  }
  async function sendAllQueued() {
    const { data: res, error } = await supabase.functions.invoke("send-evaluation-emails", { body: { limit: 100 } });
    if (error) return toast({ title: "Batch send failed", description: error.message, variant: "destructive" });
    const r = res as any;
    toast({ title: "Batch processed", description: `Sent ${r?.sent ?? 0}, failed ${r?.failed ?? 0}.` });
    data.refresh();
  }

  async function saveTemplate() {
    if (!editTpl) return;
    const { error } = await supabase.from("evaluation_email_templates").update({
      subject: editTpl.subject, body: editTpl.body, active: editTpl.active,
    }).eq("id", editTpl.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Template saved" });
    setEditTpl(null);
    data.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-start gap-2 text-xs">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-emerald-700 dark:text-emerald-400">Live email delivery enabled</p>
          <p className="text-muted-foreground mt-0.5">Queued evaluation emails send automatically every 5 minutes from <strong>evaluations@blossom.abacommandcenter.com</strong>. Use <em>Send all queued</em> to dispatch immediately.</p>
        </div>
      </div>

      {/* QUEUE */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Email Queue</h3>
          <Button size="sm" variant="outline" onClick={sendAllQueued} className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Send all queued now
          </Button>
        </div>
      {data.emails.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
          No emails queued yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Recipient</th>
                <th className="text-left font-medium px-3 py-3">Employee</th>
                <th className="text-left font-medium px-3 py-3">Type</th>
                <th className="text-left font-medium px-3 py-3">Subject</th>
                <th className="text-left font-medium px-3 py-3">Status</th>
                <th className="text-left font-medium px-3 py-3">Scheduled</th>
                <th className="text-left font-medium px-3 py-3">Sent</th>
                <th className="text-left font-medium px-3 py-3">Error</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {data.emails.map((e) => {
                const st = e.staff_id ? staffById[e.staff_id] : undefined;
                return (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-xs">{e.recipient_email}</td>
                  <td className="px-3 py-2.5 text-xs">{st ? `${st.first_name} ${st.last_name}` : "—"}</td>
                  <td className="px-3 py-2.5 text-xs">{e.email_type}</td>
                  <td className="px-3 py-2.5 text-xs max-w-xs truncate">{e.subject}</td>
                  <td className="px-3 py-2.5"><EmailBadge s={e.status} /></td>
                  <td className="px-3 py-2.5 text-xs">{fmtDate(e.scheduled_send_at ?? e.created_at)}</td>
                  <td className="px-3 py-2.5 text-xs">{fmtDate(e.sent_at)}</td>
                  <td className="px-3 py-2.5 text-xs text-destructive">{e.failed_reason ?? ""}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setPreview(e)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {(e.status === "Queued" || e.status === "Draft") && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => sendNow(e.id)} title="Send now">
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => cancelEmail(e.id)} title="Cancel">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {e.status === "Sent" && (
                      <Button size="sm" variant="ghost" onClick={() => resend(e.id)} title="Resend">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(e.status === "Failed" || e.status === "Cancelled") && (
                      <Button size="sm" variant="ghost" onClick={() => resend(e.id)} title="Re-queue">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {e.status !== "Sent" && (
                      <Button size="sm" variant="ghost" onClick={() => markSent(e.id)} title="Mark sent manually">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}
      </section>

      {/* TEMPLATES */}
      <section className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Email Templates</h3>
          <span className="text-[11px] text-muted-foreground">
            Variables: {"{{employee_first_name}} {{employee_full_name}} {{evaluation_type}} {{due_date}} {{form_link}} {{reviewer_name}} {{meeting_link}}"}
          </span>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-3 py-3">Type</th>
                <th className="text-left font-medium px-3 py-3">Subject</th>
                <th className="text-left font-medium px-3 py-3">Active</th>
                <th className="text-left font-medium px-3 py-3">Last edited</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {data.templates.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2.5 text-xs font-medium">{t.name}</td>
                  <td className="px-3 py-2.5 text-xs">{t.email_type}</td>
                  <td className="px-3 py-2.5 text-xs max-w-md truncate">{t.subject}</td>
                  <td className="px-3 py-2.5 text-xs">{t.active ? "Yes" : "No"}</td>
                  <td className="px-3 py-2.5 text-xs">{fmtDate(t.updated_at)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditTpl({ ...t })}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PREVIEW DIALOG */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{preview?.subject}</DialogTitle></DialogHeader>
          <div className="text-xs text-muted-foreground">To: {preview?.recipient_email}</div>
          <pre className="whitespace-pre-wrap text-sm border rounded-lg p-3 bg-muted/30 max-h-[60vh] overflow-y-auto">{preview?.body}</pre>
        </DialogContent>
      </Dialog>

      {/* EDIT TEMPLATE DIALOG */}
      <Dialog open={!!editTpl} onOpenChange={(o) => !o && setEditTpl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit {editTpl?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Subject</Label>
              <Input value={editTpl?.subject ?? ""} onChange={(e) => setEditTpl((t) => t && ({ ...t, subject: e.target.value }))} />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea rows={12} value={editTpl?.body ?? ""} onChange={(e) => setEditTpl((t) => t && ({ ...t, body: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editTpl?.active} onChange={(e) => setEditTpl((t) => t && ({ ...t, active: e.target.checked }))} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTpl(null)}>Cancel</Button>
            <Button onClick={saveTemplate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}