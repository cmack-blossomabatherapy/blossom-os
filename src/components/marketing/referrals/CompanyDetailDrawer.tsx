import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Phone, MapPin, MessageSquare, UserPlus, Calendar } from "lucide-react";
import { useReferralActivities, useReferralContacts } from "@/lib/os/referrals/hooks";
import type { ReferralCompany } from "@/lib/os/referrals/types";
import { fmtDate, fmtRelative } from "@/lib/os/referrals/utils";
import { LogActivityDialog } from "./LogActivityDialog";
import { AddReferralDialog } from "./AddReferralDialog";

export function CompanyDetailDrawer({
  company,
  open,
  onOpenChange,
  onChanged,
}: { company: ReferralCompany | null; open: boolean; onOpenChange: (o: boolean) => void; onChanged?: () => void }) {
  const [logOpen, setLogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { data: activities } = useReferralActivities({ companyId: company?.id });
  const { data: allContacts } = useReferralContacts();
  const contacts = useMemo(() => allContacts.filter((c) => c.company_id === company?.id), [allContacts, company]);

  if (!company) return null;

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

          <section className="space-y-2 text-sm">
            {company.website_url && <div className="flex items-center gap-2"><Globe className="size-4 text-muted-foreground" />{company.website_url}</div>}
            {company.main_phone && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{company.main_phone}</div>}
            {(company.full_address || company.state) && (
              <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{[company.full_address, company.state].filter(Boolean).join(", ")}</div>
            )}
          </section>

          <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Mini label="Contacts" value={contacts.length} />
            <Mini label="Referrals sent" value={company.referral_count ?? 0} />
            <Mini label="Last contacted" value={fmtRelative(company.last_contacted_at)} />
            <Mini label="Next follow-up" value={fmtDate(company.next_follow_up_at)} />
            <Mini label="Owner" value={company.relationship_owner ?? "—"} />
            <Mini label="State" value={company.state ?? "—"} />
          </section>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAddOpen(true)}><UserPlus className="size-4 mr-1.5" />Add contact</Button>
            <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}><MessageSquare className="size-4 mr-1.5" />Log activity</Button>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-2">Contacts</h3>
            {!contacts.length ? (
              <p className="text-xs text-muted-foreground italic">No contacts linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.id} className="rounded-lg border p-3 text-sm flex items-center justify-between">
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