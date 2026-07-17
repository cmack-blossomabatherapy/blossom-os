import { useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { submitTicket, useSupportCategories, URGENCY_LABEL } from "./useSupport";
import { toast } from "sonner";

export default function SupportNew() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { categories } = useSupportCategories();
  const nonUrgent = useMemo(() => (categories ?? []).filter(c => !c.is_urgent_safety), [categories]);

  const [categoryKey, setCategoryKey] = useState<string>(params.get("category") ?? "");
  const [subcategory, setSubcategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [preferredContact, setPreferredContact] = useState("in_app");
  const [sending, setSending] = useState(false);

  const selected = nonUrgent.find(c => c.key === categoryKey);
  const canSubmit = !!selected && subject.trim().length >= 3 && description.trim().length >= 10;

  const submit = async () => {
    if (!user || !canSubmit || !selected) return;
    setSending(true);
    try {
      const t = await submitTicket({
        employeeId: user.id,
        category: selected.key,
        subcategory: subcategory || undefined,
        subject: subject.trim(),
        description: description.trim(),
        urgency,
        preferred_contact_method: preferredContact,
        is_urgent_safety: false,
      });
      toast.success(`Request ${t.ticket_number} sent.`);
      nav(`/rbt/app/support/${t.id}`);
    } catch (e: any) { toast.error(e.message ?? "Could not submit"); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-4 pb-8">
      <Link to="/rbt/app/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New support request</h1>
        <p className="text-sm text-muted-foreground mt-1">Pick a topic — we'll route it to the right person.</p>
      </div>

      {/* Urgent redirect */}
      <Link to="/rbt/app/support/urgent"
        className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/5 p-3 hover:bg-red-500/10 transition">
        <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-red-800 dark:text-red-200">Is this a safety or urgent clinical concern?</p>
          <p className="text-xs text-red-900/70 dark:text-red-100/70">Use the urgent path so on-call teammates are notified right away.</p>
        </div>
      </Link>

      {!categoryKey && (
        <section className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Choose a topic</p>
          <div className="grid gap-2">
            {nonUrgent.map(c => (
              <button key={c.key} type="button" onClick={() => { setCategoryKey(c.key); setUrgency(c.default_urgency); }}
                className="text-left rounded-xl border border-border/60 p-3 hover:bg-muted/50 transition">
                <div className="text-sm font-medium">{c.label}</div>
                {c.description && <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>}
              </button>
            ))}
          </div>
        </section>
      )}

      {selected && (
        <section className="rounded-2xl border border-border/70 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Topic</p>
              <p className="text-base font-semibold mt-0.5">{selected.label}</p>
            </div>
            <button className="text-xs text-muted-foreground underline" onClick={() => setCategoryKey("")}>Change</button>
          </div>

          {selected.subcategories.length > 0 && (
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
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={140}
              placeholder="One-line summary"
              className="w-full h-11 mt-2 rounded-xl bg-muted/60 border border-border px-3 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={5} maxLength={2000}
              placeholder="Share what's going on. Avoid full names of minors unless needed."
              className="w-full mt-2 rounded-xl bg-muted/60 border border-border p-3 text-sm" />
            {selected.ai_advice_restricted && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Blossom AI does not provide individualized clinical treatment advice. A qualified teammate will respond.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Urgency</label>
              <select value={urgency} onChange={e => setUrgency(e.target.value)}
                className="w-full h-11 mt-2 rounded-xl bg-muted/60 border border-border px-3 text-sm">
                {["low","normal","high"].map(u => <option key={u} value={u}>{URGENCY_LABEL[u]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Preferred contact</label>
              <select value={preferredContact} onChange={e => setPreferredContact(e.target.value)}
                className="w-full h-11 mt-2 rounded-xl bg-muted/60 border border-border px-3 text-sm">
                <option value="in_app">In Blossom OS</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text</option>
              </select>
            </div>
          </div>

          <button onClick={submit} disabled={!canSubmit || sending}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition">
            {sending ? "Sending…" : "Send request"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Every request has an owner. You'll see status updates here as they happen.
          </p>
        </section>
      )}
    </div>
  );
}