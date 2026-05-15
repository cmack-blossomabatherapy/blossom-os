import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Calculator, Users, Filter, AlertTriangle, Layers, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function CeoDashboardV2Logic() {
  const navigate = useNavigate();
  return (
    <div className="-mx-3 -mt-3 md:-mx-6 md:-mt-6 pb-12">
      <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/5 px-4 pt-5 pb-5 md:px-8 md:pt-8 md:pb-7">
        <Button variant="ghost" size="sm" onClick={() => navigate("/ceo-dashboard-v2")} className="mb-3 -ml-2 h-8 text-xs">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to CEO Dashboard V2
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <BookOpen className="h-3 w-3" /> Reference
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">How CEO Dashboard V2 works</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A plain-English explanation of every number, code grouping, and filter rule used to attribute billable hours to BCBAs.
        </p>
      </div>

      <div className="px-4 pt-5 md:px-8 md:pt-7 space-y-4 max-w-4xl">
        <Section icon={Layers} title="Billing-code grouping (the 5-3 / 5-5 rule)">
          <p>
            Clinic sessions use a separate procedure code than home/school sessions because the fee schedule pays
            less for clinic visits — but it is <strong>not the BCBA&apos;s fault</strong> when one of their clients
            happens to be a clinic client. They are doing the same work.
          </p>
          <p>For attribution purposes the dashboard <strong>lumps these variants together</strong>:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <CodeGroup
              label="5-3 · Direct (97153)"
              variants={["97153", "97153 RBT Clinic", "97153 BCBA Clinic"]}
              description="Adaptive Behavior Treatment by Protocol"
            />
            <CodeGroup
              label="5-5 · Protocol Mod (97155)"
              variants={["97155", "97155 VA", "97155 BCBA Clinic"]}
              description="Adaptive Behavior Treatment with Protocol Modification"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            All other codes (97151 assessment, 97156 family guidance, Client Admin, Non-Billable, etc.) are kept as-is.
          </p>
        </Section>

        <Section icon={Users} title="Who counts as a BCBA on a session">
          <p>
            Each session row in the BCBA Billable export carries a free-text <code className="rounded bg-muted px-1 py-0.5 text-[11px]">labels</code> field
            (Hubstaff project tags). The dashboard scans those labels for the current BCBA and uses that as the attribution.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>If a clear BCBA name is detected, the session counts toward that BCBA.</li>
            <li>If no BCBA can be detected, the session lands under <strong>&quot;Unassigned BCBA&quot;</strong>.</li>
            <li>Mid-period BCBA transitions are surfaced in the &quot;Multiple BCBAs per client&quot; alert.</li>
          </ul>
        </Section>

        <Section icon={Eye} title="Why &quot;Unassigned&quot; is hidden by default">
          <p>
            Unassigned hours mean the row is missing a BCBA label — usually a client whose project tag was never
            updated. Including them in the main BCBA leaderboard distorts the comparison, so they are <strong>filtered
            out of the main list by default</strong> and shown separately at the top of the page as an alert with the
            client list and best-guess names from the labels.
          </p>
          <p className="text-xs text-muted-foreground">
            Toggle <Badge variant="outline" className="font-normal">Show unassigned</Badge> in the filters to merge them back into the leaderboard.
          </p>
        </Section>

        <Section icon={Calculator} title="How each KPI is calculated">
          <KpiRow label="Billable hours" formula="Σ hours across all filtered sessions (after grouping 97153 / 97155 variants)." />
          <KpiRow label="BCBAs" formula="Distinct BCBAs in the filtered window. Excludes Unassigned unless toggled on." />
          <KpiRow label="Sessions" formula="Row count of the filtered session set." />
          <KpiRow label="Billing codes" formula="Distinct procedure codes after grouping (97153 variants count as one, 97155 variants count as one)." />
        </Section>

        <Section icon={Filter} title="Filters &amp; date window">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Range chips</strong> (30d, 90d, 6mo, 12mo, all) — applied at query time. Smaller windows load faster.</li>
            <li><strong>Date From / To</strong> — narrows the already-loaded window.</li>
            <li><strong>State / location</strong> — extracted from the &quot;… Location&quot; tag inside the labels field.</li>
            <li><strong>BCBA / Code / Search</strong> — client-side filters, applied after grouping.</li>
            <li>Filters are saved per-user and restored on next visit.</li>
          </ul>
        </Section>

        <Section icon={AlertTriangle} title="Alerts above the leaderboard">
          <p><strong>Unassigned hours</strong> — rows with no BCBA label. Click each to see candidate names suggested from the label string.</p>
          <p><strong>Multiple BCBAs per client</strong> — same client appearing under more than one BCBA in the window. Usually a mid-period handoff or a leftover stale tag.</p>
        </Section>

        <Section icon={BookOpen} title="Data source &amp; refresh">
          <p>
            Sessions come from the BCBA Billable CSV export uploaded on this page. Use <strong>Replace</strong> to swap
            in a new source file (recommended for the period-end reset) and <strong>Append</strong> to add an
            incremental file without losing existing data. Imports are cached in your browser for 10 minutes; click
            Refresh to force a re-pull.
          </p>
        </Section>

        <div className="pt-2">
          <Button onClick={() => navigate("/ceo-dashboard-v2")} className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 md:p-6 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="space-y-2.5 text-sm text-foreground/85 leading-relaxed">{children}</div>
    </Card>
  );
}

function CodeGroup({ label, variants, description }: { label: string; variants: string[]; description: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[11px] text-muted-foreground mb-2">{description}</div>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => (
          <Badge key={v} variant="secondary" className="font-mono text-[10px]">{v}</Badge>
        ))}
      </div>
    </div>
  );
}

function KpiRow({ label, formula }: { label: string; formula: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border/40 bg-card/50 px-3.5 py-2.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{formula}</div>
    </div>
  );
}
