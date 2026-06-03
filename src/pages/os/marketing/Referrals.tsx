import { useEffect, useMemo, useState, Component, type ReactNode, type ErrorInfo } from "react";
import {
  Plus, Upload, Building2, Download, History, Search, Users, HandHeart, Calendar, TrendingUp, AlertCircle, Settings2,
} from "lucide-react";
import { MktgPage, MktgCard } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReferralCompanies, useReferralContacts, useReferralBatches } from "@/lib/os/referrals/hooks";
import type { ReferralCompany, ReferralContact, ReferralImportBatch } from "@/lib/os/referrals/types";
import { fmtDate, fmtRelative } from "@/lib/os/referrals/utils";
import { AddReferralDialog } from "@/components/marketing/referrals/AddReferralDialog";
import { AddCompanyDialog } from "@/components/marketing/referrals/AddCompanyDialog";
import { ImportReferralsDialog } from "@/components/marketing/referrals/ImportReferralsDialog";
import { ContactDetailDrawer } from "@/components/marketing/referrals/ContactDetailDrawer";
import { CompanyDetailDrawer } from "@/components/marketing/referrals/CompanyDetailDrawer";
import { toast } from "@/hooks/use-toast";

function StatTile({ label, value, icon: Icon, hint }: { label: string; value: React.ReactNode; icon: React.ElementType; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

type ExportDataset = "contacts" | "companies" | "followups" | "history";

type ExportColumn<T> = {
  key: string;
  label: string;
  value: (row: T) => unknown;
  defaultSelected?: boolean;
};

type ExportSource<T> = {
  label: string;
  description: string;
  fileName: string;
  rows: T[];
  columns: ExportColumn<T>[];
};

function exportCsv<T>(filename: string, rows: T[], columns: ExportColumn<T>[]) {
  const headers = columns.map((c) => c.label);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(","), ...rows.map((r) => columns.map((c) => esc(c.value(r))).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Referrals() {
  return (
    <ReferralsErrorBoundary>
      <ReferralsInner />
    </ReferralsErrorBoundary>
  );
}

function ReferralsInner() {
  const { data: contacts, loading: lc, refresh: refreshContacts } = useReferralContacts();
  const { data: companies, loading: lo, refresh: refreshCompanies } = useReferralCompanies();
  const { data: batches } = useReferralBatches();

  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [contactDrawer, setContactDrawer] = useState<ReferralContact | null>(null);
  const [companyDrawer, setCompanyDrawer] = useState<ReferralCompany | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const states = useMemo(() => {
    const s = new Set<string>();
    contacts.forEach((c) => c.state && s.add(c.state));
    companies.forEach((c) => c.state && s.add(c.state));
    return Array.from(s).sort();
  }, [contacts, companies]);

  const refreshAll = () => { refreshContacts(); refreshCompanies(); };

  const visibleContacts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return contacts.filter((c) => {
      if (c.status === "Archived") return false;
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (stageFilter !== "all" && c.relationship_stage !== stageFilter) return false;
      if (!q) return true;
      return [c.full_name, c.email, c.phone, c.title, c.role_type, c.contact_owner]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [contacts, search, stateFilter, stageFilter]);

  const visibleCompanies = useMemo(() => {
    const q = search.toLowerCase().trim();
    return companies.filter((c) => {
      if (c.status === "Archived") return false;
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (!q) return true;
      return [c.company_name, c.domain, c.website_url, c.relationship_owner].some((v) => v?.toLowerCase().includes(q));
    });
  }, [companies, search, stateFilter]);

  // Stats
  const activeContacts = contacts.filter((c) => c.status !== "Archived");
  const activeCompanies = companies.filter((c) => c.status !== "Archived");
  const needsFollowUp = activeContacts.filter((c) => c.relationship_stage === "Needs Follow-Up" || c.status === "Needs Follow-Up").length;
  const strongPartners = activeContacts.filter((c) => c.relationship_stage === "Strong Partner").length;
  const referralsSent = activeContacts.reduce((s, c) => s + (c.number_of_referrals_sent ?? 0), 0);
  const now = Date.now();
  const upcoming = activeContacts.filter((c) => c.next_follow_up_at && new Date(c.next_follow_up_at).getTime() >= now).length;
  const overdue = activeContacts.filter((c) => c.next_follow_up_at && new Date(c.next_follow_up_at).getTime() < now).length;

  // Follow-up groupings
  const followUps = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const overdueRows: ReferralContact[] = [];
    const todayRows: ReferralContact[] = [];
    const upcomingRows: ReferralContact[] = [];
    for (const c of activeContacts) {
      if (!c.next_follow_up_at) continue;
      const t = new Date(c.next_follow_up_at).getTime();
      if (t < today.getTime()) overdueRows.push(c);
      else if (t < tomorrow.getTime()) todayRows.push(c);
      else upcomingRows.push(c);
    }
    return { overdueRows, todayRows, upcomingRows };
  }, [activeContacts]);

  function companyName(id: string | null | undefined) {
    if (!id) return "—";
    return companies.find((c) => c.id === id)?.company_name ?? "—";
  }

  return (
    <MktgPage
      title="Referrals"
      subtitle="Manage referral relationships across pediatricians, schools, social workers, and community partners."
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="size-4 mr-1.5" />Import</Button>
          <Button size="sm" variant="outline" onClick={() => setAddCompanyOpen(true)}><Building2 className="size-4 mr-1.5" />Add Company</Button>
          <Button size="sm" onClick={() => setAddContactOpen(true)}><Plus className="size-4 mr-1.5" />Add Referral</Button>
        </>
      }
    >
      {/* Intelligence tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatTile label="Contacts" value={activeContacts.length} icon={Users} />
        <StatTile label="Companies" value={activeCompanies.length} icon={Building2} />
        <StatTile label="Strong Partners" value={strongPartners} icon={HandHeart} />
        <StatTile label="Referrals Sent" value={referralsSent} icon={TrendingUp} />
        <StatTile label="Needs Follow-Up" value={needsFollowUp} icon={AlertCircle} hint={overdue ? `${overdue} overdue` : undefined} />
        <StatTile label="Upcoming Follow-Ups" value={upcoming} icon={Calendar} />
      </div>

      {/* Filters */}
      <MktgCard>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search contacts, companies, emails…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {["New Contact", "First Outreach", "Connected", "Active Referral Source", "Strong Partner", "Needs Follow-Up", "Dormant"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => exportCsv("referrals.csv", visibleContacts as unknown as Record<string, unknown>[])}>
            <Download className="size-4 mr-1.5" />Export
          </Button>
        </div>
      </MktgCard>

      {/* Tabs */}
      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Contacts ({visibleContacts.length})</TabsTrigger>
          <TabsTrigger value="companies">Companies ({visibleCompanies.length})</TabsTrigger>
          <TabsTrigger value="followups">Follow-Ups ({followUps.overdueRows.length + followUps.todayRows.length + followUps.upcomingRows.length})</TabsTrigger>
          <TabsTrigger value="history">Import History ({batches.length})</TabsTrigger>
        </TabsList>

        {/* Contacts */}
        <TabsContent value="contacts">
          <MktgCard>
            {lc ? (
              <p className="text-sm text-muted-foreground italic p-4">Loading…</p>
            ) : !visibleContacts.length ? (
              <EmptyBox
                title="Your referral CRM is ready."
                body="Import your HubSpot list or add your first referral source to start building real referral relationships."
                actions={
                  <>
                    <Button size="sm" onClick={() => setImportOpen(true)}><Upload className="size-4 mr-1.5" />Import CSV</Button>
                    <Button size="sm" variant="outline" onClick={() => setAddContactOpen(true)}><Plus className="size-4 mr-1.5" />Add Referral</Button>
                  </>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b">
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Company</th>
                      <th className="text-left px-3 py-2">Role</th>
                      <th className="text-left px-3 py-2">Email</th>
                      <th className="text-left px-3 py-2">State</th>
                      <th className="text-left px-3 py-2">Stage</th>
                      <th className="text-right px-3 py-2">Refs</th>
                      <th className="text-left px-3 py-2">Last contacted</th>
                      <th className="text-left px-3 py-2">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleContacts.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setContactDrawer(c)}>
                        <td className="px-3 py-2 font-medium">{c.full_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{companyName(c.company_id)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.role_type ?? c.title ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.email ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.state ?? "—"}</td>
                        <td className="px-3 py-2"><Badge variant="outline">{c.relationship_stage}</Badge></td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.number_of_referrals_sent ?? 0}</td>
                        <td className="px-3 py-2 text-muted-foreground">{fmtRelative(c.last_contacted_at)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.contact_owner ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </MktgCard>
        </TabsContent>

        {/* Companies */}
        <TabsContent value="companies">
          <MktgCard>
            {lo ? (
              <p className="text-sm text-muted-foreground italic p-4">Loading…</p>
            ) : !visibleCompanies.length ? (
              <EmptyBox
                title="No companies yet."
                body="Companies are created automatically when you import contacts or add a referral source."
                actions={<Button size="sm" onClick={() => setAddCompanyOpen(true)}><Building2 className="size-4 mr-1.5" />Add Company</Button>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b">
                      <th className="text-left px-3 py-2">Company</th>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Website</th>
                      <th className="text-left px-3 py-2">State</th>
                      <th className="text-right px-3 py-2">Contacts</th>
                      <th className="text-right px-3 py-2">Referrals</th>
                      <th className="text-left px-3 py-2">Stage</th>
                      <th className="text-left px-3 py-2">Last contacted</th>
                      <th className="text-left px-3 py-2">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCompanies.map((c) => {
                      const contactCount = contacts.filter((k) => k.company_id === c.id).length;
                      return (
                        <tr key={c.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setCompanyDrawer(c)}>
                          <td className="px-3 py-2 font-medium">{c.company_name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.company_type ?? "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.domain ?? c.website_url ?? "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.state ?? "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{contactCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{c.referral_count ?? 0}</td>
                          <td className="px-3 py-2"><Badge variant="outline">{c.relationship_stage}</Badge></td>
                          <td className="px-3 py-2 text-muted-foreground">{fmtRelative(c.last_contacted_at)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.relationship_owner ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </MktgCard>
        </TabsContent>

        {/* Follow-ups */}
        <TabsContent value="followups">
          <div className="grid gap-4">
            <FollowUpGroup title="Overdue" tone="warn" rows={followUps.overdueRows} onOpen={setContactDrawer} companyName={companyName} />
            <FollowUpGroup title="Due today" tone="primary" rows={followUps.todayRows} onOpen={setContactDrawer} companyName={companyName} />
            <FollowUpGroup title="Upcoming" tone="default" rows={followUps.upcomingRows} onOpen={setContactDrawer} companyName={companyName} />
            {!followUps.overdueRows.length && !followUps.todayRows.length && !followUps.upcomingRows.length && (
              <MktgCard>
                <EmptyBox title="No follow-ups due." body="Add follow-up dates to keep referral relationships warm." />
              </MktgCard>
            )}
          </div>
        </TabsContent>

        {/* Import history */}
        <TabsContent value="history">
          <MktgCard>
            {!batches.length ? (
              <EmptyBox title="No imports yet." body="Use the Import button above to bring in your HubSpot referral list." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b">
                      <th className="text-left px-3 py-2">File</th>
                      <th className="text-left px-3 py-2">Uploaded</th>
                      <th className="text-right px-3 py-2">Total</th>
                      <th className="text-right px-3 py-2">Created</th>
                      <th className="text-right px-3 py-2">Duplicates</th>
                      <th className="text-right px-3 py-2">Failed</th>
                      <th className="text-left px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id} className="border-b">
                        <td className="px-3 py-2 font-medium flex items-center gap-2"><History className="size-3.5 text-muted-foreground" />{b.file_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{fmtDate(b.uploaded_at)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.total_rows}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.successful_rows}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.duplicate_contacts}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.failed_rows}</td>
                        <td className="px-3 py-2"><Badge variant={b.status === "Failed" ? "destructive" : "outline"}>{b.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </MktgCard>
        </TabsContent>
      </Tabs>

      {/* Lead attribution placeholder */}
      <MktgCard>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2"><TrendingUp className="size-4 text-primary" /></div>
          <div>
            <p className="text-sm font-semibold">Lead attribution ready</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Once incoming lead data is connected, Blossom OS will show which referral relationships are driving growth — by company, contact, and state.
            </p>
          </div>
        </div>
      </MktgCard>

      {/* Dialogs */}
      {addContactOpen && <AddReferralDialog open onOpenChange={setAddContactOpen} onCreated={refreshAll} />}
      {addCompanyOpen && <AddCompanyDialog open onOpenChange={setAddCompanyOpen} onCreated={refreshAll} />}
      {importOpen && <ImportReferralsDialog open onOpenChange={setImportOpen} onComplete={refreshAll} />}
      {contactDrawer && (
        <ContactDetailDrawer
          contact={contactDrawer}
          open
          onOpenChange={(o) => { if (!o) setContactDrawer(null); }}
          onChanged={refreshAll}
        />
      )}
      {companyDrawer && (
        <CompanyDetailDrawer
          company={companyDrawer}
          open
          onOpenChange={(o) => { if (!o) setCompanyDrawer(null); }}
          onChanged={refreshAll}
        />
      )}
    </MktgPage>
  );
}

class ReferralsErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[Referrals] render error", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <MktgPage title="Referrals" subtitle="Something went wrong loading this page.">
          <MktgCard>
            <div className="p-6 space-y-3">
              <p className="text-sm font-semibold text-destructive">The Referrals page hit an error.</p>
              <pre className="text-xs whitespace-pre-wrap bg-muted/40 rounded-md p-3 overflow-auto">
                {String(this.state.error?.message ?? this.state.error)}
              </pre>
              <Button size="sm" variant="outline" onClick={() => this.setState({ error: null })}>Try again</Button>
            </div>
          </MktgCard>
        </MktgPage>
      );
    }
    return this.props.children;
  }
}

function EmptyBox({ title, body, actions }: { title: string; body: string; actions?: React.ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{body}</p>
      {actions && <div className="mt-4 flex justify-center gap-2">{actions}</div>}
    </div>
  );
}

function FollowUpGroup({
  title, tone, rows, onOpen, companyName,
}: {
  title: string; tone: "warn" | "primary" | "default"; rows: ReferralContact[];
  onOpen: (c: ReferralContact) => void; companyName: (id: string | null | undefined) => string;
}) {
  const toneClass = tone === "warn" ? "text-amber-700" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <MktgCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${toneClass}`}>{title} <span className="text-muted-foreground font-normal">({rows.length})</span></h3>
      </div>
      {!rows.length ? (
        <p className="text-xs text-muted-foreground italic">Nothing here.</p>
      ) : (
        <ul className="divide-y">
          {rows.map((c) => (
            <li key={c.id} className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded" onClick={() => onOpen(c)}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.full_name ?? `${c.first_name ?? ""} ${c.last_name ?? ""}`}</p>
                <p className="text-xs text-muted-foreground truncate">{companyName(c.company_id)} · {c.role_type ?? "—"}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium">{fmtDate(c.next_follow_up_at)}</p>
                <p className="text-muted-foreground">{c.contact_owner ?? "—"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </MktgCard>
  );
}
