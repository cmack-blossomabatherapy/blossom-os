import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Phone, MapPin, MessageSquare, UserPlus, Calendar, Edit, Save, X } from "lucide-react";
import { useReferralActivities, useReferralContacts } from "@/lib/os/referrals/hooks";
import { updateCompany } from "@/lib/os/referrals/api";
import type { ReferralCompany } from "@/lib/os/referrals/types";
import { COMPANY_TYPES, COMPANY_STAGES, COMPANY_STATUSES } from "@/lib/os/referrals/types";
import { fmtDate, fmtRelative } from "@/lib/os/referrals/utils";
import { LogActivityDialog } from "./LogActivityDialog";
import { AddReferralDialog } from "./AddReferralDialog";
import { ContactDetailDrawer } from "./ContactDetailDrawer";
import { toast } from "@/hooks/use-toast";
import { OwnerCombobox, ownersToText } from "./OwnerCombobox";

export function CompanyDetailDrawer({
  company,
  open,
  onOpenChange,
  onChanged,
}: { company: ReferralCompany | null; open: boolean; onOpenChange: (o: boolean) => void; onChanged?: () => void }) {
  const [logOpen, setLogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const { data: activities } = useReferralActivities({ companyId: company?.id });
  const { data: allContacts } = useReferralContacts();
  const contacts = useMemo(() => allContacts.filter((c) => c.company_id === company?.id), [allContacts, company]);
  const selectedContact = useMemo(() => allContacts.find((c) => c.id === selectedContactId) ?? null, [allContacts, selectedContactId]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<ReferralCompany>>({});

  useEffect(() => {
    if (!company) return;
    setDraft({
      company_name: company.company_name, company_type: company.company_type,
      website_url: company.website_url, domain: company.domain,
      main_phone: company.main_phone, main_email: company.main_email,
      state: company.state, city: company.city, full_address: company.full_address,
      relationship_stage: company.relationship_stage, status: company.status,
      relationship_owner: company.relationship_owner,
      next_follow_up_at: company.next_follow_up_at, notes: company.notes,
    });
    setEditing(false);
  }, [company?.id]);

  if (!company) return null;

  function setField<K extends keyof ReferralCompany>(key: K, value: ReferralCompany[K] | null | string) {
    setDraft((d) => ({ ...d, [key]: (value === "" ? null : value) as ReferralCompany[K] }));
  }

  async function handleSave() {
    if (!company) return;
    setSaving(true);
    try {
      const patch: Partial<ReferralCompany> = { ...draft };
      if (patch.next_follow_up_at && typeof patch.next_follow_up_at === "string" && patch.next_follow_up_at.length === 10) {
        patch.next_follow_up_at = new Date(patch.next_follow_up_at).toISOString();
      }
      await updateCompany(company.id, patch);
      toast({ title: "Company updated" });
      setEditing(false);
      onChanged?.();
    } catch (e) {
      toast({ title: "Failed to update", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle>{company.company_name}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap gap-2">
            {company.company_type && <Badge variant="secondary">{company.company_type}</Badge>}
            <Badge>{company.relationship_stage}</Badge>
            <Badge variant="outline">{company.status}</Badge>
          </div>

          {!editing ? (
            <section className="space-y-2 text-sm">
              {company.website_url && <div className="flex items-center gap-2"><Globe className="size-4 text-muted-foreground" />{company.website_url}</div>}
              {company.main_phone && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{company.main_phone}</div>}
              {(company.full_address || company.state) && (
                <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{[company.full_address, company.state].filter(Boolean).join(", ")}</div>
              )}
            </section>
          ) : (
            <section className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-3">
              <Field label="Company name" className="col-span-2"><Input value={draft.company_name ?? ""} onChange={(e) => setField("company_name", e.target.value)} /></Field>
              <Field label="Type">
                <Select value={draft.company_type ?? ""} onValueChange={(v) => setField("company_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{COMPANY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Owner">
                <OwnerCombobox
                  value={(draft.relationship_owner as string[] | null | undefined) ?? []}
                  onChange={(next) => setField("relationship_owner", (next.length ? next : null) as never)}
                />
              </Field>
              <Field label="Website"><Input value={draft.website_url ?? ""} onChange={(e) => setField("website_url", e.target.value)} /></Field>
              <Field label="Main email"><Input type="email" value={draft.main_email ?? ""} onChange={(e) => setField("main_email", e.target.value)} /></Field>
              <Field label="Main phone"><Input value={draft.main_phone ?? ""} onChange={(e) => setField("main_phone", e.target.value)} /></Field>
              <Field label="City"><Input value={draft.city ?? ""} onChange={(e) => setField("city", e.target.value)} /></Field>
              <Field label="State"><Input value={draft.state ?? ""} onChange={(e) => setField("state", e.target.value)} placeholder="e.g. NC" /></Field>
              <Field label="Stage">
                <Select value={draft.relationship_stage ?? ""} onValueChange={(v) => setField("relationship_stage", v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COMPANY_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={draft.status ?? ""} onValueChange={(v) => setField("status", v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COMPANY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Next follow-up">
                <Input type="date" value={draft.next_follow_up_at ? String(draft.next_follow_up_at).slice(0, 10) : ""} onChange={(e) => setField("next_follow_up_at", e.target.value)} />
              </Field>
              <Field label="Address" className="col-span-2"><Input value={draft.full_address ?? ""} onChange={(e) => setField("full_address", e.target.value)} /></Field>
              <Field label="Notes" className="col-span-2"><Textarea rows={3} value={draft.notes ?? ""} onChange={(e) => setField("notes", e.target.value)} /></Field>
            </section>
          )}

          <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Mini label="Contacts" value={contacts.length} />
            <Mini label="Referrals sent" value={company.referral_count ?? 0} />
            <Mini label="Last contacted" value={fmtRelative(company.last_contacted_at)} />
            <Mini label="Next follow-up" value={fmtDate(company.next_follow_up_at)} />
            <Mini label="Owner" value={ownersToText(company.relationship_owner as never)} />
            <Mini label="State" value={company.state ?? "—"} />
          </section>

          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <>
                <Button size="sm" onClick={() => setAddOpen(true)}><UserPlus className="size-4 mr-1.5" />Add contact</Button>
                <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}><MessageSquare className="size-4 mr-1.5" />Log activity</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="size-4 mr-1.5" />Edit</Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving}><Save className="size-4 mr-1.5" />{saving ? "Saving…" : "Save changes"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}><X className="size-4 mr-1.5" />Cancel</Button>
              </>
            )}
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-2">Contacts</h3>
            {!contacts.length ? (
              <p className="text-xs text-muted-foreground italic">No contacts linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.id} className="rounded-lg border p-3 text-sm flex items-center justify-between cursor-pointer hover:bg-muted/30" onClick={() => setSelectedContactId(c.id)}>
                    <div>
                      <p className="font-medium">{c.full_name ?? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()}</p>
                      <p className="text-xs text-muted-foreground">{c.role_type ?? c.title ?? "—"}{c.email ? ` · ${c.email}` : ""}</p>
                    </div>
                    <Badge variant="outline">{c.number_of_referrals_sent ?? 0} refs</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2">Activity Timeline</h3>
            {!activities.length ? (
              <p className="text-xs text-muted-foreground italic">No company-level activities logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((a) => (
                  <li key={a.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.activity_type}{a.subject ? ` · ${a.subject}` : ""}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{fmtRelative(a.activity_date)}</span>
                    </div>
                    {a.notes && <p className="text-sm mt-1 whitespace-pre-wrap">{a.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} companyId={company.id} onLogged={onChanged} />
      <AddReferralDialog open={addOpen} onOpenChange={setAddOpen} presetCompanyId={company.id} onCreated={onChanged} />
      <ContactDetailDrawer contact={selectedContact} open={Boolean(selectedContact)} onOpenChange={(o) => { if (!o) setSelectedContactId(null); }} onChanged={onChanged} />
    </Sheet>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}