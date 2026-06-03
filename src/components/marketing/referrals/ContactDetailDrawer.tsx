import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Calendar, Archive, MessageSquare, Edit } from "lucide-react";
import { useReferralActivities, useReferralCompanies } from "@/lib/os/referrals/hooks";
import { archiveContact } from "@/lib/os/referrals/api";
import type { ReferralContact } from "@/lib/os/referrals/types";
import { fmtDate, fmtRelative } from "@/lib/os/referrals/utils";
import { LogActivityDialog } from "./LogActivityDialog";
import { toast } from "@/hooks/use-toast";

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

  if (!contact) return null;

  async function handleArchive() {
    try { await archiveContact(contact!.id); toast({ title: "Archived" }); onChanged?.(); onOpenChange(false); }
    catch (e) { toast({ title: "Failed", description: String(e), variant: "destructive" }); }
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

          {/* Contact info */}
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

          {/* Relationship intelligence */}
          <section className="grid grid-cols-2 gap-3">
            <Mini label="Referrals sent" value={contact.number_of_referrals_sent ?? 0} />
            <Mini label="Times contacted" value={contact.number_of_times_contacted ?? 0} />
            <Mini label="Last contacted" value={fmtRelative(contact.last_contacted_at)} />
            <Mini label="Next follow-up" value={fmtDate(contact.next_follow_up_at)} />
            <Mini label="Last meeting" value={fmtRelative(contact.last_meeting_booked_at)} />
            <Mini label="Owner" value={contact.contact_owner ?? "—"} />
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setLogOpen(true)}><MessageSquare className="size-4 mr-1.5" />Log activity</Button>
            <Button size="sm" variant="outline" disabled><Edit className="size-4 mr-1.5" />Edit</Button>
            <Button size="sm" variant="outline" onClick={handleArchive}><Archive className="size-4 mr-1.5" />Archive</Button>
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
                      <span className="font-medium">{a.activity_type}{a.subject ? ` · ${a.subject}` : ""}</span>
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