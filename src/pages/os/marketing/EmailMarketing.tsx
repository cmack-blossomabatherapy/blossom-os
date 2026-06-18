import { Mail, Send, Users, BarChart3, Plug } from "lucide-react";
import { MktgPage, MktgCard, EmptyRow } from "./_shared";

/**
 * Email Marketing / Mailchimp — integration-ready wireframe.
 * No live API connected yet. Shows operational structure for campaigns,
 * audiences, follow-up sequences, and attribution-to-leads.
 */
export default function EmailMarketing() {
  return (
    <MktgPage
      title="Email Marketing"
      subtitle="Mailchimp campaigns, audience lists, and follow-up sequences. Integration is ready to connect."
      actions={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Plug className="h-4 w-4" /> Connect Mailchimp
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MktgCard title="Integration" icon={<Plug className="h-4 w-4" />}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mailchimp</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              Not connected
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Connect Mailchimp to sync audiences, campaign performance, and influenced leads.
          </p>
        </MktgCard>
        <MktgCard title="Audience Lists" icon={<Users className="h-4 w-4" />}>
          <div className="text-2xl font-semibold tracking-tight">—</div>
          <p className="mt-1 text-xs text-muted-foreground">No audiences mapped yet.</p>
        </MktgCard>
        <MktgCard title="Influenced Leads" icon={<BarChart3 className="h-4 w-4" />}>
          <div className="text-2xl font-semibold tracking-tight">—</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Will populate once campaigns are mapped to lead sources.
          </p>
        </MktgCard>
      </div>

      <MktgCard title="Campaigns" icon={<Send className="h-4 w-4" />}>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Campaign</th>
                <th className="px-3 py-2">Audience</th>
                <th className="px-3 py-2">Sent</th>
                <th className="px-3 py-2">Open</th>
                <th className="px-3 py-2">Click</th>
                <th className="px-3 py-2">Leads</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="px-3 py-6">
                  <EmptyRow message="No campaigns yet. Connect Mailchimp or create a campaign placeholder." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </MktgCard>

      <MktgCard title="Follow-Up Sequences" icon={<Mail className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground">
          Sequences will live here once Mailchimp is connected and audiences are mapped to lead
          sources (CTM, LeadTrap, Facebook, Google, Website).
        </p>
      </MktgCard>
    </MktgPage>
  );
}