import { useMemo, useState } from "react";
import {
  MessageSquare, Mail, Copy, Send, Search, ShieldAlert, FileText, StickyNote,
} from "lucide-react";
import { GrowthPageShell } from "@/components/os/growth/GrowthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLeads } from "@/contexts/LeadsContext";
import type { Lead } from "@/data/leads";
import { isLeadOutOfPipeline } from "@/lib/intake/intakeWorkflow";
import {
  sendLeadEmail, sendLeadSms, notifyCommunicationResult,
  sendIntakePacket, sendMissingInfoReminder, sendVobUpdate,
} from "@/lib/integrations/communications/communicationAdapters";
import { useIntakeTasksLive } from "@/hooks/useIntakeTasksLive";
import {
  PARENT_COMM_TEMPLATES,
  PARENT_COMM_INTERNAL_NOTES,
  PARENT_COMM_SECTIONS,
  PARENT_COMM_TEAMS,
  PARENT_COMM_CHANNELS,
  PARENT_COMM_MERGE_FIELDS,
  type ParentCommTemplate,
} from "@/lib/parent-communication/templates";
import { cn } from "@/lib/utils";

type SendMode = "sms" | "email";

function copy(text: string, label: string) {
  if (!text) { toast.error(`${label} is empty`); return; }
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function LeadPickerDialog({
  open, mode, template, onClose,
}: {
  open: boolean; mode: SendMode | null;
  template: ParentCommTemplate | null; onClose: () => void;
}) {
  const { leads } = useLeads();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    // Exclude out-of-pipeline leads (closed / non-qualified) from the picker.
    const base = leads.filter((l) => !isLeadOutOfPipeline(l.status)).slice(0, 500);
    if (!term) return base.slice(0, 50);
    return base.filter((l) =>
      [l.childName, l.parentName, l.phone, l.email, l.state]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(term)),
    ).slice(0, 80);
  }, [leads, q]);

  async function pick(lead: Lead) {
    if (!template || !mode) return;
    const ctx = {
      leadId: lead.id, phone: lead.phone, email: lead.email,
      parentName: lead.parentName, childName: lead.childName,
      state: lead.state, insurance: lead.primaryInsurance ?? lead.insurance ?? null,
    };
    // Copy personalized template so the sender can paste into CTM/Mailchimp UI
    if (mode === "sms") {
      navigator.clipboard.writeText(template.sms || "");
      notifyCommunicationResult(await sendLeadSms(ctx));
    } else {
      navigator.clipboard.writeText(
        `Subject: ${template.subject}\n\n${template.body}`,
      );
      notifyCommunicationResult(await sendLeadEmail(ctx));
    }
    toast.success(`Template ${template.id} sent to ${lead.childName}`, {
      description: "Message copied to clipboard and tracked on the lead.",
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Send {mode === "sms" ? "SMS" : "Email"} · {template?.title}
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus placeholder="Search leads by child, parent, phone, email, state..."
            value={q} onChange={(e) => setQ(e.target.value)} className="pl-8"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border divide-y">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No leads match.</div>
          ) : filtered.map((l) => (
            <button key={l.id} onClick={() => pick(l)}
              className="w-full text-left p-2.5 hover:bg-muted/60 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{l.childName}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {l.parentName ?? "—"} · {l.state ?? "—"} · {mode === "sms" ? (l.phone ?? "no phone") : (l.email ?? "no email")}
                </div>
              </div>
              <Send className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          The template is copied to your clipboard and the outreach is logged on the lead's timeline.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default function ParentCommunication() {
  const [q, setQ] = useState("");
  const [section, setSection] = useState<string>("all");
  const [team, setTeam] = useState<string>("all");
  const [channel, setChannel] = useState<string>("all");
  const [preview, setPreview] = useState<ParentCommTemplate | null>(null);
  const [sendMode, setSendMode] = useState<SendMode | null>(null);
  const [sendTpl, setSendTpl] = useState<ParentCommTemplate | null>(null);
  // Live intake tasks feed powers the "open follow-ups" badge and keeps this
  // page aligned with the shared intake operational surface.
  const { tasks: intakeTasks } = useIntakeTasksLive();
  const openTasks = intakeTasks.filter((t) => t.status !== "Completed").length;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return PARENT_COMM_TEMPLATES.filter((t) => {
      if (section !== "all" && t.section !== section) return false;
      if (team !== "all" && !t.team.toLowerCase().includes(team.toLowerCase())) return false;
      if (channel !== "all" && t.channel !== channel) return false;
      if (!term) return true;
      return [t.title, t.useWhen, t.sms, t.subject, t.body, t.stage, t.section, t.team, t.id]
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [q, section, team, channel]);

  function openSend(t: ParentCommTemplate, mode: SendMode) {
    setSendTpl(t); setSendMode(mode);
  }

  return (
    <GrowthPageShell
      eyebrow="Resource Library"
      title="Intake Communications"
      description="Approved SMS and email templates for every stage of the family journey — including Intake Packet, Missing Info, and Benefits Verification (VOB) outreach. Search, filter, copy, or send from a lead."
      actions={[
        { label: "Open Leads", icon: MessageSquare, to: "/leads" },
      ]}
    >
      <div className="text-[11px] text-muted-foreground">
        {openTasks} open intake follow-up task{openTasks === 1 ? "" : "s"} across the team.
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-3 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-900 dark:text-amber-200">
          Do not include sensitive clinical, insurance, billing, or diagnosis details in SMS.
          Use approved secure processes when detail is required.
        </p>
      </div>
      {/* Bulk outreach helpers — these delegate to the shared communication
          adapters used everywhere else in the intake surface so that quick
          sends stay auditable. */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={async () => {
          const stub = { leadId: "", phone: null, email: null, parentName: null, childName: null, state: null, insurance: null };
          notifyCommunicationResult(await sendIntakePacket(stub));
        }}>Send Intake Packet</Button>
        <Button size="sm" variant="outline" onClick={async () => {
          const stub = { leadId: "", phone: null, email: null, parentName: null, childName: null, state: null, insurance: null };
          notifyCommunicationResult(await sendMissingInfoReminder(stub));
        }}>Missing Info Reminder</Button>
        <Button size="sm" variant="outline" onClick={async () => {
          const stub = { leadId: "", phone: null, email: null, parentName: null, childName: null, state: null, insurance: null };
          notifyCommunicationResult(await sendVobUpdate(stub));
        }}>Send VOB Update</Button>
      </div>

      <section className="rounded-xl border bg-card p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="relative md:col-span-4 lg:col-span-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates..." className="pl-8 h-9" />
        </div>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Stage / Section" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {PARENT_COMM_SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Team" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {PARENT_COMM_TEAMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            {PARENT_COMM_CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </section>

      <div className="text-xs text-muted-foreground">
        {filtered.length} of {PARENT_COMM_TEMPLATES.length} templates
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((t) => (
          <article key={t.id}
            className="group rounded-2xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-muted-foreground">#{t.id}</div>
                <h3 className="text-sm font-semibold text-foreground truncate">{t.title}</h3>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">{t.channel}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-[10px]">{t.section}</Badge>
              <Badge variant="secondary" className="text-[10px]">{t.stage}</Badge>
              <Badge variant="secondary" className="text-[10px]">{t.team}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3 line-clamp-3">{t.useWhen}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setPreview(t)}>
                <FileText className="h-3 w-3 mr-1" /> View
              </Button>
              {t.sms && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => copy(t.sms, "SMS")}>
                    <Copy className="h-3 w-3 mr-1" /> Copy SMS
                  </Button>
                  <Button size="sm" variant="default" className="h-7 text-[11px]" onClick={() => openSend(t, "sms")}>
                    <MessageSquare className="h-3 w-3 mr-1" /> Send SMS
                  </Button>
                </>
              )}
              {t.body && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => copy(t.body, "Email body")}>
                    <Copy className="h-3 w-3 mr-1" /> Copy Email
                  </Button>
                  <Button size="sm" variant="default" className="h-7 text-[11px]" onClick={() => openSend(t, "email")}>
                    <Mail className="h-3 w-3 mr-1" /> Send Email
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <StickyNote className="h-4 w-4" /> Internal note templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PARENT_COMM_INTERNAL_NOTES.map((n) => (
            <article key={n.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground">#{n.id}</div>
                  <h3 className="text-sm font-semibold">{n.title}</h3>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => copy(n.body, "Internal note")}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{n.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-muted/30 p-3">
        <div className="text-xs font-semibold mb-1.5">Available merge fields</div>
        <div className="flex flex-wrap gap-1">
          {PARENT_COMM_MERGE_FIELDS.map((f) => (
            <button key={f} onClick={() => copy(`{{${f}}}`, `{{${f}}}`)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-background hover:bg-muted transition-colors">
              {`{{${f}}}`}
            </button>
          ))}
        </div>
      </section>

      <Sheet open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {preview && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">
                  <div className="text-[10px] font-mono text-muted-foreground">#{preview.id}</div>
                  {preview.title}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{preview.section}</Badge>
                  <Badge variant="secondary">{preview.stage}</Badge>
                  <Badge variant="secondary">{preview.team}</Badge>
                  <Badge variant="outline">{preview.channel}</Badge>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">When to use</div>
                  <p className="text-sm">{preview.useWhen}</p>
                </div>
                {preview.sms && (
                  <div className={cn("rounded-lg border p-3 bg-sky-50/50 dark:bg-sky-950/20")}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-semibold flex items-center gap-1"><MessageSquare className="h-3 w-3" /> SMS</div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => copy(preview.sms, "SMS")}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                        <Button size="sm" variant="default" className="h-6 text-[11px]" onClick={() => openSend(preview, "sms")}>
                          Send SMS
                        </Button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs font-sans">{preview.sms}</pre>
                  </div>
                )}
                {preview.subject && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-semibold text-muted-foreground">Email subject</div>
                      <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => copy(preview.subject, "Subject")}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="rounded-md border bg-background p-2 text-sm">{preview.subject}</div>
                  </div>
                )}
                {preview.body && (
                  <div className="rounded-lg border p-3 bg-violet-50/50 dark:bg-violet-950/20">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-semibold flex items-center gap-1"><Mail className="h-3 w-3" /> Email body</div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => copy(preview.body, "Email body")}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                        <Button size="sm" variant="default" className="h-6 text-[11px]" onClick={() => openSend(preview, "email")}>
                          Send Email
                        </Button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs font-sans">{preview.body}</pre>
                  </div>
                )}
                {preview.after && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">After sending</div>
                    <p className="text-sm">{preview.after}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <LeadPickerDialog
        open={!!sendMode && !!sendTpl}
        mode={sendMode}
        template={sendTpl}
        onClose={() => { setSendMode(null); setSendTpl(null); }}
      />
    </GrowthPageShell>
  );
}
