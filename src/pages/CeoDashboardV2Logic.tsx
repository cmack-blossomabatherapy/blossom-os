import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Calculator, Users, Filter, AlertTriangle, Layers, Eye,
  CheckCircle2, XCircle, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const TOC = [
  { id: "code-grouping", label: "1. Code grouping", icon: Layers },
  { id: "attribution", label: "2. BCBA attribution", icon: Users },
  { id: "kpis", label: "3. KPIs", icon: Calculator },
  { id: "filters", label: "4. Filters & date range", icon: Filter },
  { id: "unassigned", label: "5. Unassigned alert", icon: AlertTriangle },
  { id: "mismatches", label: "6. Multiple-BCBA alert", icon: Eye },
  { id: "data", label: "7. Data source & refresh", icon: BookOpen },
];

export default function CeoDashboardV2Logic() {
  const navigate = useNavigate();
  return (
    <div className="-mx-3 -mt-3 md:-mx-6 md:-mt-6 pb-12">
      {/* HERO */}
      <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/5 px-4 pt-5 pb-5 md:px-8 md:pt-8 md:pb-7">
        <Button variant="ghost" size="sm" onClick={() => navigate("/bcba-performance-dashboard")} className="mb-3 -ml-2 h-8 text-xs">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to BCBA Performance
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <BookOpen className="h-3 w-3" /> Reference
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">How BCBA Performance works</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A complete walkthrough of every calculation. Each section answers one question: where does this number come from?
        </p>
      </div>

      <div className="grid gap-6 px-4 pt-5 md:grid-cols-[220px_minmax(0,1fr)] md:px-8 md:pt-7 max-w-6xl">
        {/* TOC */}
        <aside className="md:sticky md:top-4 md:self-start">
          <Card className="p-3">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">On this page</div>
            <nav className="flex flex-col">
              {TOC.map((t) => {
                const Icon = t.icon;
                return (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t.label}</span>
                  </a>
                );
              })}
            </nav>
          </Card>
        </aside>

        {/* CONTENT */}
        <div className="space-y-5 min-w-0">

          {/* 1. CODE GROUPING */}
          <Section id="code-grouping" icon={Layers} step={1} title="Code grouping (the 5-3 / 5-5 rule)">
            <Lede>
              The billing system uses different procedure codes for clinic vs. home/school sessions because the fee
              schedule pays less for clinic visits. The dashboard rolls those variants up so a BCBA isn&apos;t
              penalized for serving a clinic client — the work is the same.
            </Lede>

            <h3 className="text-sm font-semibold pt-1">Grouped codes</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <CodeGroup
                label="5-3 · Direct treatment"
                rolledUpAs="97153"
                variants={["97153", "97153 RBT Clinic", "97153 BCBA Clinic"]}
                description="Adaptive Behavior Treatment by Protocol"
              />
              <CodeGroup
                label="5-5 · Protocol modification"
                rolledUpAs="97155"
                variants={["97155", "97155 VA", "97155 BCBA Clinic"]}
                description="Adaptive Behavior Treatment with Protocol Modification"
              />
            </div>

            <h3 className="text-sm font-semibold pt-2">Codes left as-is</h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["97151", "Assessment"],
                ["97152", "Supporting assessment"],
                ["97156", "Family guidance"],
                ["Client Admin – *", "Various admin codes"],
                ["Clinic Non-Billable", "Non-billable"],
              ].map(([code, desc]) => (
                <Badge key={code} variant="outline" className="font-normal">
                  <span className="font-mono text-[10px] mr-1.5">{code}</span>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </Badge>
              ))}
            </div>

            <Example title="Worked example">
              A BCBA has these raw rows in the export:
              <CodeBlock>{`97153            → 12.0 h
97153 RBT Clinic →  4.5 h
97155            →  3.0 h
97155 BCBA Clinic→  1.0 h
97151            →  2.0 h`}</CodeBlock>
              The dashboard reports:
              <CodeBlock>{`97153 → 16.5 h    (12.0 + 4.5)
97155 →  4.0 h    ( 3.0 + 1.0)
97151 →  2.0 h
─────────────
Total → 22.5 h`}</CodeBlock>
            </Example>
          </Section>

          {/* 2. ATTRIBUTION */}
          <Section id="attribution" icon={Users} step={2} title="BCBA attribution — who gets credit for a session">
            <Lede>
              Each row in the BCBA Billable export carries a free-text <Code>labels</Code> field (Hubstaff project tags).
              The dashboard scans those labels for the BCBA&apos;s name and uses that as the attribution.
            </Lede>

            <h3 className="text-sm font-semibold pt-1">The two outcomes</h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <OutcomeCard
                tone="success"
                icon={CheckCircle2}
                title="BCBA detected"
                body="Session counts toward that BCBA. Hours feed every leaderboard, KPI, and detail view."
              />
              <OutcomeCard
                tone="warning"
                icon={XCircle}
                title="No BCBA detected"
                body="Session is bucketed under 'Unassigned BCBA'. Hidden from the main leaderboard by default — see section 5."
              />
            </div>

            <h3 className="text-sm font-semibold pt-2">Multi-BCBA clients</h3>
            <p>
              If the same client appears under more than one BCBA inside the selected window, the hours stay split
              by BCBA (each gets their portion) and the client is added to the <strong>Multiple BCBAs per client</strong>{" "}
              alert so the team can investigate the handoff.
            </p>
          </Section>

          {/* 3. KPIs */}
          <Section id="kpis" icon={Calculator} step={3} title="KPI tiles — exact formulas">
            <Lede>
              The four tiles at the top of the hero summarize the currently filtered set of sessions. Every formula
              below runs after code grouping (section 1) and after the active filters (section 4) are applied.
            </Lede>

            <KpiRow
              label="Billable hours"
              formula="Σ hours across all filtered sessions"
              detail="Includes every code in the filtered window, after 97153/97155 variants are rolled up."
            />
            <KpiRow
              label="BCBAs"
              formula="count(distinct bcba_name in filtered set)"
              detail="Excludes 'Unassigned BCBA' unless you toggle Show unassigned in the filters sheet."
            />
            <KpiRow
              label="Sessions"
              formula="row count of filtered sessions"
              detail="Each row in the CSV export is one session."
            />
            <KpiRow
              label="Billing codes"
              formula="count(distinct normalized procedure_code)"
              detail="97153 + 97153 RBT Clinic + 97153 BCBA Clinic count as 1 code, not 3. Same for 97155."
            />

            <h3 className="text-sm font-semibold pt-2">Per-BCBA card numbers</h3>
            <KpiRow label="Hours" formula="Σ hours where bcba_name = this BCBA" />
            <KpiRow label="Sessions" formula="count(rows where bcba_name = this BCBA)" />
            <KpiRow label="Patients" formula="count(distinct client_full where bcba_name = this BCBA)" />
            <KpiRow label="RBTs" formula="count(distinct provider_full where bcba_name = this BCBA)" />
            <KpiRow label="Hours bar" formula="this BCBA's hours ÷ max(hours across all BCBAs in view)" detail="The bar is normalized to the top performer in the current filter, not to total org hours." />
          </Section>

          {/* 4. FILTERS */}
          <Section id="filters" icon={Filter} step={4} title="Filters & date range — what narrows the data">
            <Lede>
              Filters apply in two layers. The <strong>range chips</strong> control how much data is fetched from the
              database; everything else narrows that fetched set in the browser.
            </Lede>

            <div className="space-y-2.5">
              <FilterRow
                stage="Server-side (re-fetch)"
                name="Range chip"
                values="30d / 90d / 6mo / 12mo / All"
                effect="Limits the SQL query by date_of_service. Smaller windows load faster."
              />
              <FilterRow
                stage="Client-side"
                name="Date From / To"
                values="Any date inside the loaded window"
                effect="Further narrows the already-loaded sessions."
              />
              <FilterRow
                stage="Client-side"
                name="Billing code"
                values="Any normalized code (97153, 97155, 97151, …)"
                effect="Compared against the rolled-up code, so picking 97153 includes its clinic variants."
              />
              <FilterRow
                stage="Client-side"
                name="State / location"
                values="Any state extracted from the labels field"
                effect={`Pulled from any label matching "<State> Location" in the labels string.`}
              />
              <FilterRow
                stage="Client-side"
                name="BCBA"
                values="Any BCBA detected in the data"
                effect="Filters down to a single BCBA before grouping."
              />
              <FilterRow
                stage="Client-side"
                name="Search"
                values="Free text"
                effect="Matches BCBA name, client name, RBT name, or any label substring (case-insensitive)."
              />
              <FilterRow
                stage="Client-side"
                name="Show unassigned"
                values="Off (default) / On"
                effect="Off keeps Unassigned BCBA out of the leaderboard. The Unassigned alert is shown either way."
              />
            </div>

            <p className="text-xs text-muted-foreground pt-1">
              All filter values are saved to your browser per user, so they persist across navigation and refresh.
            </p>
          </Section>

          {/* 5. UNASSIGNED */}
          <Section id="unassigned" icon={AlertTriangle} step={5} title="Unassigned alert — what it means and how it's built">
            <Lede>
              An &quot;Unassigned&quot; row is a session whose label string did not contain a recognizable BCBA name.
              These hours are real — they were worked and billed — but they can&apos;t be credited to anyone until a
              BCBA tag is added in the source system.
            </Lede>

            <h3 className="text-sm font-semibold pt-1">Why they&apos;re hidden by default</h3>
            <p>
              If &quot;Unassigned&quot; appeared in the leaderboard it would usually be the largest bar on the page,
              swamping the comparison between actual people. We surface them in a dedicated alert at the top of the
              page instead, with the client list and best-guess names from the labels.
            </p>

            <h3 className="text-sm font-semibold pt-2">How the alert numbers are calculated</h3>
            <KpiRow
              label="Total hours"
              formula="Σ hours where bcba_name IS NULL (in filtered set)"
            />
            <KpiRow
              label="Sessions"
              formula="count(rows where bcba_name IS NULL)"
            />
            <KpiRow
              label="Clients"
              formula="count(distinct client_full where bcba_name IS NULL)"
            />
            <KpiRow
              label="Candidate names"
              formula={`Label tokens matching "First Last" pattern (≥ 2 words, alpha only)`}
              detail="Suggested BCBA names extracted from the same row's labels — useful for re-tagging."
            />

            <Example title="Fixing unassigned hours">
              The fastest path: open the alert, copy the client name, find them in the source system (e.g. Hubstaff /
              CentralReach), add the BCBA project tag, then re-upload the CSV in <strong>Replace</strong> mode. Those
              hours will move from the alert into that BCBA&apos;s leaderboard card on the next refresh.
            </Example>
          </Section>

          {/* 6. MISMATCH */}
          <Section id="mismatches" icon={Eye} step={6} title="Multiple BCBAs per client alert">
            <Lede>
              Triggered when the same client shows hours under two or more BCBAs in the selected window. Usually a
              mid-period handoff, an outdated tag, or a typo. Hours are still attributed to each BCBA that touched
              the client — the alert is purely diagnostic.
            </Lede>
            <KpiRow label="Clients flagged" formula="count(client_full where distinct bcba_name ≥ 2)" />
            <KpiRow label="Per-row totals" formula="Σ hours per BCBA, sorted high → low" detail="Lets you see which BCBA owns the bulk of the client and which is the residual tag." />
          </Section>

          {/* 7. DATA */}
          <Section id="data" icon={BookOpen} step={7} title="Data source & refresh behavior">
            <Lede>
              Sessions come from the BCBA Billable CSV exported from the billing system and uploaded on this page.
            </Lede>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <OutcomeCard
                tone="primary"
                icon={ArrowRight}
                title="Append mode"
                body="Adds rows from the new file on top of what's already loaded. Use for incremental top-ups during the period."
              />
              <OutcomeCard
                tone="warning"
                icon={ArrowRight}
                title="Replace mode"
                body="Marks all prior imports inactive and uses only this file. Use for the period-end reset to avoid double counts."
              />
            </div>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The browser caches the loaded window for 10 minutes. Click <strong>Refresh</strong> to force a re-pull.</li>
              <li>Switching the range chip triggers a new fetch.</li>
              <li>Only imports flagged <Code>is_active = true</Code> contribute to the dashboard.</li>
            </ul>
          </Section>

          <div className="pt-2">
            <Button onClick={() => navigate("/bcba-performance-dashboard")} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- helpers -------------------------------- */

function Section({ id, icon: Icon, step, title, children }: { id: string; icon: React.ComponentType<{ className?: string }>; step: number; title: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="p-5 md:p-6 space-y-3 scroll-mt-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Section {step}</div>
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
        </div>
      </div>
      <div className="space-y-2.5 text-sm text-foreground/85 leading-relaxed">{children}</div>
    </Card>
  );
}

function Lede({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-2 border-primary/40 bg-primary/5 px-3 py-2 text-sm text-foreground/85">
      {children}
    </p>
  );
}

function CodeGroup({ label, variants, description, rolledUpAs }: { label: string; variants: string[]; description: string; rolledUpAs: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">{description}</div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {variants.map((v) => (
          <Badge key={v} variant="secondary" className="font-mono text-[10px]">{v}</Badge>
        ))}
        <ArrowRight className="h-3 w-3 text-muted-foreground mx-0.5" />
        <Badge className="font-mono text-[10px]">{rolledUpAs}</Badge>
      </div>
    </div>
  );
}

function KpiRow({ label, formula, detail }: { label: string; formula: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/50 px-3.5 py-2.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
      <code className="block rounded bg-muted/60 px-2 py-1 font-mono text-[11px] text-foreground/90">{formula}</code>
      {detail && <div className="text-[11px] text-muted-foreground pt-0.5">{detail}</div>}
    </div>
  );
}

function FilterRow({ stage, name, values, effect }: { stage: string; name: string; values: string; effect: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/50 px-3.5 py-2.5 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px]">{stage}</Badge>
        <span className="text-sm font-semibold">{name}</span>
      </div>
      <div className="text-[11px] text-muted-foreground">Values: {values}</div>
      <div className="text-xs">{effect}</div>
    </div>
  );
}

function OutcomeCard({ tone, icon: Icon, title, body }: { tone: "success" | "warning" | "primary"; icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  const toneClass =
    tone === "success" ? "bg-success/10 text-success border-success/20"
    : tone === "warning" ? "bg-warning/10 text-warning border-warning/20"
    : "bg-primary/10 text-primary border-primary/20";
  return (
    <div className={`rounded-xl border p-3.5 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <div className="text-sm font-semibold text-foreground">{title}</div>
      </div>
      <div className="mt-1.5 text-xs text-foreground/80">{body}</div>
    </div>
  );
}

function Example({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3.5 space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="text-xs space-y-2">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded bg-background/80 border border-border/40 p-2.5 font-mono text-[11px] leading-relaxed">{children}</pre>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{children}</code>;
}
