import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertTriangle, Phone, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { submitTicket, useSupportCategories } from "./useSupport";
import { toast } from "sonner";

export default function SupportUrgent() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { categories } = useSupportCategories();
  const urgentOptions = (categories ?? []).filter(c => c.is_urgent_safety);
  const [ack, setAck] = useState(false);
  const [category, setCategory] = useState<string>("safety_concern");
  const [subcategory, setSubcategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  const selected = urgentOptions.find(c => c.key === category);

  const submit = async () => {
    if (!user || !ack || description.trim().length < 10) return;
    setSending(true);
    try {
      const t = await submitTicket({
        employeeId: user.id,
        category, subcategory: subcategory || undefined,
        subject: `URGENT: ${selected?.label ?? category}`,
        description, urgency: "urgent",
        is_urgent_safety: true, emergency_acknowledged: true,
      });
      toast.success(`Urgent request ${t.ticket_number} sent. Ops and safety leads notified.`);
      nav(`/rbt/app/support/${t.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not submit");
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-4 pb-8">
      <Link to="/rbt/app/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>

      <section className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-b from-red-500/10 to-red-500/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg font-semibold text-red-800 dark:text-red-200">Urgent clinical or safety support</h1>
            <p className="text-sm text-red-900/80 dark:text-red-100/80 mt-1">Use this only for urgent concerns that need same-day attention.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-500/40 bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-red-600" />
          <h2 className="text-base font-semibold">In an emergency, call 911</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Blossom OS <span className="font-semibold text-foreground">does not replace emergency services</span>.
          If someone is in immediate danger, injured, or a crime is in progress — call 911 first, then submit this form.
        </p>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> What counts as urgent</h2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Injury during a session (client, caregiver, or you)</li>
          <li>Elopement, aggression, or safety event that just occurred</li>
          <li>Suspected abuse, neglect, or mandatory reporter concern</li>
          <li>Unsafe environment at a home or clinic</li>
          <li>Clinical situation you need supervisor guidance on today</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">What happens next</h2>
        <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-5">
          <li>Your request is routed to the on-call Safety Lead and Operations immediately.</li>
          <li>Your assigned BCBA and State/Clinic contact are notified.</li>
          <li>You'll get a response within 30 minutes. If you don't, escalation is automatic.</li>
          <li>The request is fully audited — every action is recorded.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 space-y-4">
        <h2 className="text-base font-semibold">Send an urgent request</h2>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {urgentOptions.map(c => (
              <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                className={`rounded-xl border p-3 text-left text-sm transition ${category === c.key ? "border-red-500 bg-red-500/5" : "border-border/70 hover:bg-muted/50"}`}>
                <div className="font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
              </button>
            ))}
          </div>
        </div>

        {selected && selected.subcategories.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Subcategory</label>
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)}
              className="w-full h-11 mt-2 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="">Select…</option>
              {selected.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground">Describe what happened</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={5} maxLength={2000}
            placeholder="Stick to facts. Do not include full names of minors unless necessary."
            className="w-full mt-2 rounded-xl bg-muted/60 border border-border p-3 text-sm" />
          <p className="text-[11px] text-muted-foreground mt-1">Blossom AI does not provide individualized clinical treatment advice. A qualified teammate will respond.</p>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-1" />
          <span>I understand this is not for emergencies. If someone is in immediate danger I will call 911.</span>
        </label>

        <button onClick={submit} disabled={!ack || sending || description.trim().length < 10}
          className="w-full h-12 rounded-xl bg-red-600 text-white font-medium disabled:opacity-50 hover:bg-red-700 transition">
          {sending ? "Sending…" : "Send urgent request"}
        </button>
      </section>
    </div>
  );
}