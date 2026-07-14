import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, User, Search, Loader2, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { searchReferralSources } from "@/hooks/useLeadReferralLink";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  onLink: (input: { companyId?: string | null; contactId?: string | null; notes?: string | null }) => Promise<void>;
}

export function LinkReferralDialog({ open, onOpenChange, onLink }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Awaited<ReturnType<typeof searchReferralSources>>["companies"]>([]);
  const [contacts, setContacts] = useState<Awaited<ReturnType<typeof searchReferralSources>>["contacts"]>([]);
  const [selCompany, setSelCompany] = useState<string | null>(null);
  const [selContact, setSelContact] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelCompany(null);
    setSelContact(null);
    setNotes("");
    setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      searchReferralSources(q)
        .then((r) => {
          if (cancelled) return;
          setCompanies(r.companies);
          setContacts(r.contacts);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, open]);

  const save = async () => {
    if (!selCompany && !selContact) {
      toast.error("Pick a referral company or contact");
      return;
    }
    setSaving(true);
    try {
      await onLink({ companyId: selCompany, contactId: selContact, notes: notes.trim() || null });
      toast.success("Referral source linked");
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to link referral";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Link referral source</DialogTitle>
          <DialogDescription>Connect this lead to a doctor's office, referral partner, or specific contact.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies and contacts…" className="pl-8" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[320px]">
            <div className="space-y-1 overflow-y-auto border border-border/60 rounded-lg p-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-1.5 py-1 flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Companies</p>
              {loading && <div className="p-2 text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>}
              {!loading && companies.length === 0 && <p className="p-2 text-xs text-muted-foreground">No matches</p>}
              {companies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelCompany((cur) => (cur === c.id ? null : c.id))}
                  className={`w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-muted transition ${selCompany === c.id ? "bg-primary/10 text-foreground" : ""}`}
                >
                  <div className="font-medium truncate">{c.company_name}</div>
                  <div className="text-[10.5px] text-muted-foreground truncate">
                    {[c.company_type, c.state].filter(Boolean).join(" · ") || "—"}
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-1 overflow-y-auto border border-border/60 rounded-lg p-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-1.5 py-1 flex items-center gap-1.5"><User className="h-3 w-3" /> Contacts</p>
              {loading && <div className="p-2 text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>}
              {!loading && contacts.length === 0 && <p className="p-2 text-xs text-muted-foreground">No matches</p>}
              {contacts.map((c) => {
                const name = c.full_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Unknown";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelContact((cur) => (cur === c.id ? null : c.id));
                      if (c.company_id && !selCompany) setSelCompany(c.company_id);
                    }}
                    className={`w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-muted transition ${selContact === c.id ? "bg-primary/10 text-foreground" : ""}`}
                  >
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-[10.5px] text-muted-foreground truncate">{c.title || c.email || "—"}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did this referral come in?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || (!selCompany && !selContact)}>
            <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Linking…" : "Link referral"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}