import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Mail, Phone, MapPin, Calendar, Archive, MessageSquare, Edit, Save, X } from "lucide-react";
import { useReferralActivities, useReferralCompanies } from "@/lib/os/referrals/hooks";
import { archiveContact, updateContact } from "@/lib/os/referrals/api";
import type { ReferralContact } from "@/lib/os/referrals/types";
import { CONTACT_STAGES, CONTACT_STATUSES, CONTACT_ROLE_TYPES } from "@/lib/os/referrals/types";
import { fmtDate, fmtRelative } from "@/lib/os/referrals/utils";
import { LogActivityDialog } from "./LogActivityDialog";
import { toast } from "@/hooks/use-toast";
import { OwnerCombobox, ownersToText } from "./OwnerCombobox";

export function ContactDetailDrawer({
  contact,
  open,
  onOpenChange,
  onChanged,
}: { contact: ReferralContact | null; open: boolean; onOpenChange: (o: boolean) => void; onChanged?: () => void }) {
  const [logOpen, setLogOpen] = useState(false);
  const { data: activities } = useReferralActivities({ contactId: contact?.id });
  const { data: companies } = useReferralCompanies();
  const company = useMemo(() => companies.find((c) => c.id === contact?.company_id) ?? null, [companies, contact]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<ReferralContact>>({});

  useEffect(() => {
    if (!contact) return;
    setDraft({
      first_name: contact.first_name, last_name: contact.last_name,
      title: contact.title, role_type: contact.role_type,
      email: contact.email, phone: contact.phone, mobile_phone: contact.mobile_phone, direct_phone: contact.direct_phone,
      state: contact.state, city: contact.city, full_address: contact.full_address,
      relationship_stage: contact.relationship_stage, status: contact.status,
      contact_owner: contact.contact_owner, company_id: contact.company_id,
      next_follow_up_at: contact.next_follow_up_at, notes: contact.notes,
    });
    setEditing(false);
  }, [contact?.id]);

  if (!contact) return null;

  async function handleArchive() {
    try { await archiveContact(contact!.id); toast({ title: "Archived" }); onChanged?.(); onOpenChange(false); }
    catch (e) { toast({ title: "Failed", description: String(e), variant: "destructive" }); }
  }

  function setField<K extends keyof ReferralContact>(key: K, value: ReferralContact[K] | null | string) {
    setDraft((d) => ({ ...d, [key]: (value === "" ? null : value) as ReferralContact[K] }));
  }

  async function handleSave() {
    if (!contact) return;
    setSaving(true);
    try {
      const patch: Partial<ReferralContact> = { ...draft };
      if (patch.next_follow_up_at && typeof patch.next_follow_up_at === "string" && patch.next_follow_up_at.length === 10) {
        patch.next_follow_up_at = new Date(patch.next_follow_up_at).toISOString();
      }
      await updateContact(contact.id, patch);
      toast({ title: "Contact updated" });
      setEditing(false);
      onChanged?.();
    } catch (e) {
      toast({ title: "Failed to update", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contact.full_name || `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || "Contact"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5">
          {/* Header chips */}
          <div className="flex flex-wrap gap-2">
            {contact.role_type && <Badge variant="secondary">{contact.role_type}</Badge>}
            {contact.relationship_stage && <Badge>{contact.relationship_stage}</Badge>}
            {contact.status && <Badge variant="outline">{contact.status}</Badge>}
          </div>

          {!editing ? (
            <section className="space-y-2 text-sm">
              {contact.title && <p className="text-muted-foreground">{contact.title}</p>}
              {company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span>{company.company_name}</span>
                </div>
              )}
              {contact.email && <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{contact.email}</div>}
              {contact.phone && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{contact.phone}</div>}
              {(contact.full_address || contact.state) && (
                <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{[contact.full_address, contact.state].filter(Boolean).join(", ")}</div>
              )}
            </section>
          ) : (
            <section className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-3">
              <Field label="First name"><Input value={draft.first_name ?? ""} onChange={(e) => setField("first_name", e.target.value)} /></Field>
              <Field label="Last name"><Input value={draft.last_name ?? ""} onChange={(e) => setField("last_name", e.target.value)} /></Field>
              <Field label="Title"><Input value={draft.title ?? ""} onChange={(e) => setField("title", e.target.value)} /></Field>
              <Field label="Role">
                <Select value={draft.role_type ?? ""} onValueChange={(v) => setField("role_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{CONTACT_ROLE_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Company">
                <Select value={draft.company_id ?? "__none"} onValueChange={(v) => setField("company_id", v === "__none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="No company" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No company</SelectItem>
                    {companies.map((co) => <SelectItem key={co.id} value={co.id}>{co.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Owner" className="col-span-2">
                <OwnerCombobox
                  value={(draft.contact_owner as string[] | null | undefined) ?? []}
                  onChange={(next) => setField("contact_owner", (next.length ? next : null) as never)}
                />
              </Field>
              <Field label="Email"><Input type="email" value={draft.email ?? ""} onChange={(e) => setField("email", e.target.value)} /></Field>
              <Field label="Phone"><Input value={draft.phone ?? ""} onChange={(e) => setField("phone", e.target.value)} /></Field>
              <Field label="City"><Input value={draft.city ?? ""} onChange={(e) => setField("city", e.target.value)} /></Field>
              <Field label="State"><Input value={draft.state ?? ""} onChange={(e) => setField("state", e.target.value)} placeholder="e.g. NC" /></Field>
              <Field label="Stage">
                <Select value={draft.relationship_stage ?? ""} onValueChange={(v) => setField("relationship_stage", v as never)}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>{CONTACT_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={draft.status ?? ""} onValueChange={(v) => setField("status", v as never)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>{CONTACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Next follow-up">
                <Input type="date" value={draft.next_follow_up_at ? String(draft.next_follow_up_at).slice(0, 10) : ""} onChange={(e) => setField("next_follow_up_at", e.target.value)} />
              </Field>
              <Field label="Address" className="col-span-2"><Input value={draft.full_address ?? ""} onChange={(e) => setField("full_address", e.target.value)} /></Field>
              <Field label="Notes" className="col-span-2"><Textarea rows={3} value={draft.notes ?? ""} onChange={(e) => setField("notes", e.target.value)} /></Field>
            </section>
          )}

          {/* Relationship intelligence */}
          <section className="grid grid-cols-2 gap-3">
            <Mini label="Referrals sent" value={contact.number_of_referrals_sent ?? 0} />
            <Mini label="Times contacted" value={contact.number_of_times_contacted ?? 0} />
            <Mini label="Last contacted" value={fmtRelative(contact.last_contacted_at)} />
            <Mini label="Next follow-up" value={fmtDate(contact.next_follow_up_at)} />
            <Mini label="Last meeting" value={fmtRelative(contact.last_meeting_booked_at)} />
            <Mini label="Owner" value={ownersToText(contact.contact_owner as never)} />
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <>
                <Button size="sm" onClick={() => setLogOpen(true)}><MessageSquare className="size-4 mr-1.5" />Log activity</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="size-4 mr-1.5" />Edit</Button>
                <Button size="sm" variant="outline" onClick={handleArchive}><Archive className="size-4 mr-1.5" />Archive</Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving}><Save className="size-4 mr-1.5" />{saving ? "Saving..." : "Save changes"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}><X className="size-4 mr-1.5" />Cancel</Button>
              </>
            )}
          </div>

          {/* Timeline */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Activity Timeline</h3>
            {!activities.length ? (
              <p className="text-xs text-muted-foreground italic">No activity yet. Log a call, email, or note to start the relationship history.</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((a) => (
                  <li key={a.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.activity_type}{a.subject ? ` - ${a.subject}` : ""}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{fmtRelative(a.activity_date)}</span>
                    </div>
                    {a.outcome && <p className="text-xs text-muted-foreground mt-1">{a.outcome}</p>}
                    {a.notes && <p className="text-sm mt-1 whitespace-pre-wrap">{a.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} contactId={contact.id} companyId={contact.company_id} onLogged={onChanged} />
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