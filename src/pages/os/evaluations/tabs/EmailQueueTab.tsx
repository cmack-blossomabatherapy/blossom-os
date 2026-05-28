import { AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { EvaluationsData } from "../useEvaluationsData";
import { EmailBadge, fmtDate } from "../statusBadges";

export default function EmailQueueTab({ data }: { data: EvaluationsData }) {
  async function markSent(id: string) {
    await supabase.from("evaluation_emails").update({ status: "Sent", sent_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Marked sent" });
    data.refresh();
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2 text-xs">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-amber-700 dark:text-amber-400">Email integration required</p>
          <p className="text-muted-foreground mt-0.5">Emails are being queued in the system. Connect the Blossom company email account to send them automatically. Until then, you can mark queued emails as sent manually.</p>
        </div>
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
                <th className="text-left font-medium px-3 py-3">Type</th>
                <th className="text-left font-medium px-3 py-3">Subject</th>
                <th className="text-left font-medium px-3 py-3">Status</th>
                <th className="text-left font-medium px-3 py-3">Created</th>
                <th className="text-left font-medium px-3 py-3">Sent</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {data.emails.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-xs">{e.recipient_email}</td>
                  <td className="px-3 py-2.5 text-xs">{e.email_type}</td>
                  <td className="px-3 py-2.5 text-xs">{e.subject}</td>
                  <td className="px-3 py-2.5"><EmailBadge s={e.status} /></td>
                  <td className="px-3 py-2.5 text-xs">{fmtDate(e.created_at)}</td>
                  <td className="px-3 py-2.5 text-xs">{fmtDate(e.sent_at)}</td>
                  <td className="px-3 py-2.5 text-right">
                    {e.status !== "Sent" && (
                      <Button size="sm" variant="ghost" onClick={() => markSent(e.id)}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Mark sent
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}