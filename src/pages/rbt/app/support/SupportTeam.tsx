import { Link } from "react-router-dom";
import { ArrowLeft, User, Calendar, GraduationCap, Building2, Stethoscope, Mail, Phone } from "lucide-react";
import { useSupportContacts, SupportContact } from "./useSupport";

const ROLE_META: Record<string,{ label:string; icon: any; blurb:string }> = {
  bcba:         { label: "Assigned BCBA",       icon: Stethoscope,   blurb: "Clinical guidance & supervision" },
  rbt_support:  { label: "RBT Support Rep",     icon: User,          blurb: "Your day-to-day support contact" },
  scheduling:   { label: "Scheduling",          icon: Calendar,      blurb: "Session changes & coverage" },
  training:     { label: "Training",            icon: GraduationCap, blurb: "Coursework & Academy" },
  state_clinic: { label: "State / Clinic Lead", icon: Building2,     blurb: "Local operational leadership" },
};

export default function SupportTeam() {
  const { contacts } = useSupportContacts();

  // Pick the most specific contact for each role: employee-scope > state-scope > default
  const byRole = Object.keys(ROLE_META).map(roleKey => {
    const pool = (contacts ?? []).filter(c => c.role_key === roleKey);
    const pick = pool.find(c => c.scope === "employee") ?? pool.find(c => c.scope === "state") ?? pool.find(c => c.scope === "default");
    return { roleKey, contact: pick };
  });

  return (
    <div className="space-y-4 pb-8">
      <Link to="/rbt/app/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Support Team</h1>
        <p className="text-sm text-muted-foreground mt-1">The people who support you. You don't need to know our internal structure — we route your requests for you.</p>
      </div>

      <div className="grid gap-3">
        {byRole.map(({ roleKey, contact }) => {
          const meta = ROLE_META[roleKey];
          const Icon = meta.icon;
          return (
            <section key={roleKey} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{meta.label}</p>
                  {contact ? (
                    <>
                      <p className="text-base font-semibold mt-0.5">{contact.contact_name ?? "Assigned teammate"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.blurb}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {contact.contact_email && (
                          <a href={`mailto:${contact.contact_email}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/70">
                            <Mail className="h-3 w-3" /> {contact.contact_email}
                          </a>
                        )}
                        {contact.contact_phone && (
                          <a href={`tel:${contact.contact_phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/70">
                            <Phone className="h-3 w-3" /> {contact.contact_phone}
                          </a>
                        )}
                      </div>
                      {contact.notes && <p className="text-xs text-muted-foreground mt-2">{contact.notes}</p>}
                    </>
                  ) : (
                    <>
                      <p className="text-sm mt-0.5">Not yet assigned</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.blurb} · you can still submit a request and we'll route it.</p>
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Need someone not listed here? <Link to="/rbt/app/support/new" className="underline">Send a support request</Link> and we'll get it to the right person.
      </p>
    </div>
  );
}