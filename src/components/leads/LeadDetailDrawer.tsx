import { useEffect, useState } from "react";
import {
  X, Phone, Mail, MapPin, Calendar, FileText, Activity, Sparkles,
  CheckCircle2, AlertCircle, ChevronRight, ExternalLink, StickyNote,
  Send, ShieldCheck, Ban, UserX, ListChecks, Plus,
} from "lucide-react";
import type { Lead } from "@/data/leads";
import { useLeads } from "@/contexts/LeadsContext";
import { useLeadUpdates } from "@/hooks/useLeadUpdates";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "overview" | "insurance" | "documents" | "activity" | "actions";

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60 * 1000) return "just now";
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d ago`;
  return d.toLocaleDateString();
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon, label, onClick, tone = "default",
}: { icon: any; label: string; onClick: () => void; tone?: "default" | "danger" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 h-11 text-sm font-medium",
        "hover:bg-muted transition",
        tone === "danger" && "text-destructive hover:bg-destructive/5",
      )}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

export function LeadDetailDrawer({
  leadId, onClose,
}: { leadId: string | null; onClose: () => void }) {
  const { leads, updateLead } = useLeads();
  const lead = leads.find((l) => l.id === leadId) ?? null;
  const [tab, setTab] = useState<Tab>("overview");
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);
  const { updates, loading: updatesLoading } = useLeadUpdates(lead?.childName);

  // Fetch raw monday data blob for richer fields not on the Lead type.
  useEffect(() => {
    if (!lead) { setRaw(null); return; }
    setTab("overview");
    supabase
      .from("monday_leads_raw")
      .select("data")
      .eq("monday_item_id", lead.id)
      .maybeSingle()
      .then(({ data }) => setRaw((data?.data as Record<string, unknown>) ?? null));
  }, [lead?.id]);

  if (!lead) return null;

  const str = (k: string) => {
    const v = raw?.[k];
    if (v === null || v === undefined) return "";
    return String(v).trim();
  };
  const link = (k: string) => {
    const v = str(k);
    return v && /^https?:\/\//i.test(v) ? v : null;
  };

  const documents: { label: string; url: string | null }[] = [
    { label: "Insurance card (front)", url: link("Primary Insurance Card - Front") },
    { label: "Insurance card (back)", url: link("Primary Insurance Card - Back") },
    { label: "Secondary card (front)", url: link("Secondary Insurance Card - Front") },
    { label: "Secondary card (back)", url: link("Secondary Insurance Card - Back") },
    { label: "Intake packet", url: link("Intake Packet") },
    { label: "Consent form", url: link("Consent Form Link") },
    { label: "VOB", url: link("VOB") },
  ];

  const callPhone = lead.phone;
  const callTo = callPhone ? `tel:${callPhone.replace(/\D/g, "")}` : undefined;
  const mailTo = lead.email ? `mailto:${lead.email}` : undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-screen w-full max-w-[560px] flex flex-col",
          "glass border-l border-border/60 shadow-[0_0_60px_-20px_oklch(0.2_0.02_260/0.25)]",
          "animate-in slide-in-from-right duration-300",
        )}
      >
        {/* Header */}
        <header className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary font-medium">
              {lead.childName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold tracking-tight truncate">{lead.childName}</h2>
              <p className="text-xs text-muted-foreground truncate">
                {lead.parentName || "—"} · {lead.state || "—"} · {lead.owner || "Unassigned"}
              </p>
            </div>
            <button onClick={onClose} className="rounded-full size-9 grid place-items-center hover:bg-muted transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-foreground font-medium">
              {lead.status}
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
              Form: {lead.formStatus}
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
              VOB: {lead.vobStatus}
            </span>
            {lead.notQualifiedReason && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                Not qualified
              </span>
            )}
          </div>

          {/* Quick contact */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={callTo}
              className={cn(
                "flex items-center justify-center gap-2 h-10 rounded-xl border border-border/60 bg-card text-sm hover:bg-muted transition",
                !callTo && "opacity-50 pointer-events-none",
              )}
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={mailTo}
              className={cn(
                "flex items-center justify-center gap-2 h-10 rounded-xl border border-border/60 bg-card text-sm hover:bg-muted transition",
                !mailTo && "opacity-50 pointer-events-none",
              )}
            >
              <Mail className="h-4 w-4" /> Email
            </a>
          </div>
        </header>

        {/* Tabs */}
        <nav className="px-6 pt-3 border-b border-border/60 flex items-center gap-1 overflow-x-auto">
          {([
            ["overview", "Overview"],
            ["insurance", "Insurance / VOB"],
            ["documents", "Documents"],
            ["activity", "Activity"],
            ["actions", "Actions"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-3 py-2 text-[13px] font-medium rounded-lg transition whitespace-nowrap",
                tab === id ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {tab === "overview" && (
            <>
              <section className="grid grid-cols-2 gap-4">
                <Field label="Patient" value={lead.childName} />
                <Field label="DOB / Age" value={`${str("DOB") || "—"}${lead.childAge && lead.childAge !== "—" ? ` · ${lead.childAge}` : ""}`} />
                <Field label="Gender" value={str("Gender")} />
                <Field label="State" value={lead.state} />
                <Field label="Parent name" value={lead.parentName} />
                <Field label="Relationship" value={str("Relationship to Patient")} />
                <Field label="Cell phone" value={str("Parent Cell Phone") || lead.phone} />
                <Field label="Home phone" value={str("Home Phone")} />
                <Field label="Email" value={lead.email} />
                <Field label="Zip" value={str("Zip Code")} />
              </section>
              <Field label="Address" value={str("Address")} />

              <section className="rounded-2xl bg-muted/60 border border-border/60 p-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Intake</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Lead type" value={str("Lead Type")} />
                  <Field label="Source" value={str("How did you hear about us") || lead.source} />
                  <Field label="UTM source" value={str("UTM Source")} />
                  <Field label="Intake person" value={lead.owner} />
                  <Field label="Origination" value={str("Origination Date")} />
                  <Field label="Last contact" value={lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString() : "—"} />
                </div>
                <Field label="E/T Call Log" value={str("E/T Call Log")} />
                <Field label="Reg Call Log" value={str("Reg Call Log")} />
                <Field label="Next action" value={lead.nextAction} />
              </section>

              {str("Message/Comments") && (
                <section className="rounded-2xl border border-border/60 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{str("Message/Comments")}</p>
                </section>
              )}
            </>
          )}

          {tab === "insurance" && (
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary insurance" value={lead.primaryInsurance} />
                <Field label="Primary ID" value={str("Primary Insurance ID")} />
                <Field label="Insurance type" value={lead.insuranceType} />
                <Field label="Secondary insurance" value={lead.secondaryInsurance} />
                <Field label="Secondary ID" value={str("Secondary Insurance ID")} />
                <Field label="Policyholder" value={str("Name of Insured Policyholder")} />
              </div>
              <div className="rounded-2xl bg-muted/60 border border-border/60 p-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">VOB</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="VOB status" value={lead.vobStatus} />
                  <Field label="Payment plan" value={lead.paymentPlanNeeded ? "Required" : "Not required"} />
                  <Field label="Form status" value={lead.formStatus} />
                  <Field label="Form review" value={lead.formReviewStatus} />
                  <Field label="Consent" value={lead.consentStatus} />
                  <Field label="DX" value={str("DX")} />
                </div>
                {str("Missing Information") && (
                  <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-900 dark:text-amber-200 flex gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Missing:</span> {str("Missing Information")}</span>
                  </div>
                )}
                {lead.notQualifiedReason && (
                  <div className="mt-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex gap-2">
                    <Ban className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Not qualified:</span> {lead.notQualifiedReason}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "documents" && (
            <section className="space-y-2">
              {documents.every((d) => !d.url) ? (
                <p className="text-sm text-muted-foreground py-12 text-center">No documents on file.</p>
              ) : documents.filter((d) => d.url).map((d) => (
                <a
                  key={d.label}
                  href={d.url!}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 h-12 hover:bg-muted transition"
                >
                  <span className="flex items-center gap-2.5 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {d.label}
                  </span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </section>
          )}

          {tab === "activity" && (
            <section className="space-y-3">
              {updatesLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />)}
                </div>
              )}
              {!updatesLoading && updates.length === 0 && (
                <p className="text-sm text-muted-foreground py-12 text-center">No activity recorded.</p>
              )}
              {!updatesLoading && updates.map((u) => (
                <div key={u.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="text-sm font-medium">{u.author || "Unknown"}</span>
                    <span className="text-[11px] text-muted-foreground">{relTime(u.posted_at)}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">{u.body || ""}</p>
                </div>
              ))}
            </section>
          )}

          {tab === "actions" && (
            <section className="space-y-2">
              <ActionButton
                icon={StickyNote}
                label="Add Note"
                onClick={() => toast("Notes are read-only in this view (Monday source)")}
              />
              <ActionButton
                icon={Send}
                label="Send Intake Packet"
                onClick={() => { updateLead(lead.id, { formStatus: "Sent" }); toast.success("Marked intake packet sent"); }}
              />
              <ActionButton
                icon={ShieldCheck}
                label="Send Consent Forms"
                onClick={() => { updateLead(lead.id, { consentStatus: "Sent" }); toast.success("Consent forms marked sent"); }}
              />
              <ActionButton
                icon={AlertCircle}
                label="Request Missing Info"
                onClick={() => { updateLead(lead.id, { formReviewStatus: "Missing Information" }); toast("Lead moved to Missing Info"); }}
              />
              <ActionButton
                icon={CheckCircle2}
                label="Move to VOB"
                onClick={() => { updateLead(lead.id, { status: "Sent to VOB" }); toast.success("Moved to VOB"); }}
              />
              <ActionButton
                icon={UserX}
                label="Mark Cannot Reach"
                onClick={() => { updateLead(lead.id, { status: "Can't Reach" }); toast("Marked cannot reach"); }}
                tone="danger"
              />
              <ActionButton
                icon={Ban}
                label="Mark Non Qualified"
                onClick={() => { updateLead(lead.id, { status: "Non-Qualified" }); toast("Marked non-qualified"); }}
                tone="danger"
              />
              <ActionButton
                icon={ListChecks}
                label="Create Task"
                onClick={() => toast("Task creation coming next")}
              />
            </section>
          )}
        </div>
      </aside>
    </>
  );
}