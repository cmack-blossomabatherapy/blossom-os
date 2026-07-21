import { Link } from "react-router-dom";
import { ArrowLeft, User, Calendar, GraduationCap, Building2, Stethoscope, Mail, Phone, MessageSquarePlus } from "lucide-react";
import { useSupportContacts, pickContactForRole, ROLE_FALLBACK_CATEGORY } from "./useSupport";

const ROLE_META: Record<string,{ label:string; icon: any; blurb:string }> = {
  bcba:         { label: "Assigned BCBA",       icon: Stethoscope,   blurb: "Clinical guidance & supervision" },
  rbt_support:  { label: "RBT Support Rep",     icon: User,          blurb: "Your day-to-day support contact" },
  scheduling:   { label: "Scheduling",          icon: Calendar,      blurb: "Session changes & coverage" },
  training:     { label: "Training",            icon: GraduationCap, blurb: "Coursework & Academy" },
  state_clinic: { label: "State / Clinic Lead", icon: Building2,     blurb: "Local operational leadership" },
};

export default function SupportTeam() {
  const { contacts, error, loading, reload } = useSupportContacts();
  const byRole = Object.keys(ROLE_META).map((roleKey) => ({
    roleKey,
    contact: pickContactForRole(contacts, roleKey),
  }));

  return (
    <div className="space-y-4 pb-8">
      <Link to="/rbt/app/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Support Team</h1>
        <p className="text-sm text-muted-foreground mt-1">The people who support you. You don't need to know our internal structure — we route your requests for you.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 text-destructive text-xs p-3 flex items-center justify-between gap-3">
          <span>We couldn't load your support team.</span>
          <button onClick={() => void reload()} className="underline underline-offset-4">Retry</button>
        </div>
      )}
      {loading && !error && (
        <div className="grid gap-3">
          {[0,1,2,3,4].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && !error && <div className="grid gap-3">
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
                        <Link
                          to={`/rbt/app/support/new?category=${ROLE_FALLBACK_CATEGORY[roleKey] ?? ""}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs hover:bg-primary/15"
                        >
                          <MessageSquarePlus className="h-3 w-3" /> Send a request
                        </Link>
                      </div>
                      {contact.notes && <p className="text-xs text-muted-foreground mt-2">{contact.notes}</p>}
                    </>
                  ) : (
                    <>
                      <p className="text-sm mt-0.5 font-medium">Owner not yet assigned</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {meta.blurb} · until this is set, requests route to the on-call team.
                      </p>
                      <Link
                        to={`/rbt/app/support/new?category=${ROLE_FALLBACK_CATEGORY[roleKey] ?? ""}`}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs"
                      >
                        <MessageSquarePlus className="h-3 w-3" /> Ask an owner
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>}

      <p className="text-xs text-muted-foreground text-center">
        Need someone not listed here? <Link to="/rbt/app/support/new" className="underline">Send a support request</Link> and we'll get it to the right person.
      </p>
    </div>
  );
}