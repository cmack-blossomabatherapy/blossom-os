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
import { CONTACT_STAGES, COMPANY_STAGES } from "@/lib/os/referrals/types";
import { updateContact, updateCompany } from "@/lib/os/referrals/api";
import { fmtDate, fmtRelative } from "@/lib/os/referrals/utils";
import { AddReferralDialog } from "@/components/marketing/referrals/AddReferralDialog";
import { AddCompanyDialog } from "@/components/marketing/referrals/AddCompanyDialog";
import { ImportReferralsDialog } from "@/components/marketing/referrals/ImportReferralsDialog";
import { ContactDetailDrawer } from "@/components/marketing/referrals/ContactDetailDrawer";
import { CompanyDetailDrawer } from "@/components/marketing/referrals/CompanyDetailDrawer";
import { OwnerCombobox, ownersToList, ownersToText } from "@/components/marketing/referrals/OwnerCombobox";
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

type ExportRow = ReferralContact | ReferralCompany | ReferralImportBatch;

type ExportColumn<T = ExportRow> = {
  key: string;
  label: string;
  value: (row: T) => unknown;
  defaultSelected?: boolean;
};

type ExportSource = {
  label: string;
  description: string;
  fileName: string;
  rows: ExportRow[];
  columns: ExportColumn[];
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
  const { data: contacts, loading: lc, error: contactsError, refresh: refreshContacts } = useReferralContacts();
  const { data: companies, loading: lo, error: companiesError, refresh: refreshCompanies } = useReferralCompanies();
  const { data: batches, error: batchesError } = useReferralBatches();

  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [contactDrawer, setContactDrawer] = useState<ReferralContact | null>(null);
  const [companyDrawer, setCompanyDrawer] = useState<ReferralCompany | null>(null);
  const [activeTab, setActiveTab] = useState<ExportDataset>("contacts");
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [bulkContactsOpen, setBulkContactsOpen] = useState(false);
  const [bulkCompaniesOpen, setBulkCompaniesOpen] = useState(false);

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
      return [c.full_name, c.email, c.phone, c.title, c.role_type, ownersToList(c.contact_owner).join(" ")]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [contacts, search, stateFilter, stageFilter]);

  const visibleCompanies = useMemo(() => {
    const q = search.toLowerCase().trim();
    return companies.filter((c) => {
      if (c.status === "Archived") return false;
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (!q) return true;
      return [c.company_name, c.domain, c.website_url, ownersToList(c.relationship_owner).join(" ")].some((v) => v?.toLowerCase().includes(q));
    });
  }, [companies, search, stateFilter]);

  // Stats
  const activeContacts = useMemo(() => contacts.filter((c) => c.status !== "Archived"), [contacts]);
  const activeCompanies = useMemo(() => companies.filter((c) => c.status !== "Archived"), [companies]);
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
    if (!id) return "-";
    return companies.find((c) => c.id === id)?.company_name ?? "-";
  }

  const dataError = contactsError ?? companiesError ?? batchesError;

  // Clear selections when filters trim them out
  useEffect(() => {
    setSelectedContactIds((ids) => ids.filter((id) => visibleContacts.some((c) => c.id === id)));
  }, [visibleContacts]);
  useEffect(() => {
    setSelectedCompanyIds((ids) => ids.filter((id) => visibleCompanies.some((c) => c.id === id)));
  }, [visibleCompanies]);

  const contactOwners = useMemo(() => Array.from(new Set(contacts.flatMap((c) => ownersToList(c.contact_owner)))).sort(), [contacts]);
  const companyOwners = useMemo(() => Array.from(new Set(companies.flatMap((c) => ownersToList(c.relationship_owner)))).sort(), [companies]);

  async function applyContactBulk(patch: Partial<ReferralContact>) {
    if (!selectedContactIds.length) return;
    try {
      await Promise.all(selectedContactIds.map((id) => updateContact(id, patch)));
      toast({ title: `Updated ${selectedContactIds.length} contacts` });
      setSelectedContactIds([]);
      setBulkContactsOpen(false);
      refreshContacts();
    } catch (e) {
      toast({ title: "Bulk update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  }
  async function applyCompanyBulk(patch: Partial<ReferralCompany>) {
    if (!selectedCompanyIds.length) return;
    try {
      await Promise.all(selectedCompanyIds.map((id) => updateCompany(id, patch)));
      toast({ title: `Updated ${selectedCompanyIds.length} companies` });
      setSelectedCompanyIds([]);
      setBulkCompaniesOpen(false);
      refreshCompanies();
    } catch (e) {
      toast({ title: "Bulk update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  }

  const allContactsChecked = visibleContacts.length > 0 && visibleContacts.every((c) => selectedContactIds.includes(c.id));
  const allCompaniesChecked = visibleCompanies.length > 0 && visibleCompanies.every((c) => selectedCompanyIds.includes(c.id));

  const exportSources = useMemo((): Record<ExportDataset, ExportSource> => {
    const contactColumns: ExportColumn<ReferralContact>[] = [
      { key: "full_name", label: "Name", value: (c) => c.full_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(), defaultSelected: true },
      { key: "company", label: "Company", value: (c) => companyName(c.company_id), defaultSelected: true },
      { key: "role", label: "Role", value: (c) => c.role_type ?? c.title, defaultSelected: true },
      { key: "email", label: "Email", value: (c) => c.email, defaultSelected: true },
      { key: "phone", label: "Phone", value: (c) => c.phone ?? c.mobile_phone ?? c.direct_phone, defaultSelected: true },
      { key: "state", label: "State", value: (c) => c.state, defaultSelected: true },
      { key: "stage", label: "Stage", value: (c) => c.relationship_stage, defaultSelected: true },
      { key: "status", label: "Status", value: (c) => c.status },
      { key: "referrals", label: "Referrals Sent", value: (c) => c.number_of_referrals_sent, defaultSelected: true },
      { key: "times_contacted", label: "Times Contacted", value: (c) => c.number_of_times_contacted },
      { key: "last_contacted", label: "Last Contacted", value: (c) => fmtDate(c.last_contacted_at), defaultSelected: true },
      { key: "next_follow_up", label: "Next Follow-Up", value: (c) => fmtDate(c.next_follow_up_at), defaultSelected: true },
      { key: "owner", label: "Owner", value: (c) => ownersToList(c.contact_owner).join(", "), defaultSelected: true },
      { key: "source", label: "Source", value: (c) => c.source },
      { key: "notes", label: "Notes", value: (c) => c.notes },
    ];

    const companyColumns: ExportColumn<ReferralCompany>[] = [
      { key: "company_name", label: "Company", value: (c) => c.company_name, defaultSelected: true },
      { key: "type", label: "Type", value: (c) => c.company_type, defaultSelected: true },
      { key: "website", label: "Website", value: (c) => c.website_url ?? c.domain, defaultSelected: true },
      { key: "phone", label: "Main Phone", value: (c) => c.main_phone },
      { key: "email", label: "Main Email", value: (c) => c.main_email },
      { key: "state", label: "State", value: (c) => c.state, defaultSelected: true },
      { key: "contact_count", label: "Contacts", value: (c) => contacts.filter((k) => k.company_id === c.id).length, defaultSelected: true },
      { key: "referrals", label: "Referrals Sent", value: (c) => c.referral_count, defaultSelected: true },
      { key: "stage", label: "Stage", value: (c) => c.relationship_stage, defaultSelected: true },
      { key: "status", label: "Status", value: (c) => c.status },
      { key: "last_contacted", label: "Last Contacted", value: (c) => fmtDate(c.last_contacted_at), defaultSelected: true },
      { key: "next_follow_up", label: "Next Follow-Up", value: (c) => fmtDate(c.next_follow_up_at) },
      { key: "owner", label: "Owner", value: (c) => ownersToList(c.relationship_owner).join(", "), defaultSelected: true },
      { key: "notes", label: "Notes", value: (c) => c.notes },
    ];

    const batchColumns: ExportColumn<ReferralImportBatch>[] = [
      { key: "file", label: "File", value: (b) => b.file_name, defaultSelected: true },
      { key: "uploaded", label: "Uploaded", value: (b) => fmtDate(b.uploaded_at), defaultSelected: true },
      { key: "total", label: "Total Rows", value: (b) => b.total_rows, defaultSelected: true },
      { key: "successful", label: "Successful Rows", value: (b) => b.successful_rows, defaultSelected: true },
      { key: "duplicates", label: "Duplicate Contacts", value: (b) => b.duplicate_contacts, defaultSelected: true },
      { key: "failed", label: "Failed Rows", value: (b) => b.failed_rows, defaultSelected: true },
      { key: "status", label: "Status", value: (b) => b.status, defaultSelected: true },
    ];

    return {
      contacts: { label: "Referral contacts", description: "Filtered contacts currently shown in the Contacts tab.", fileName: "referral-contacts.csv", rows: visibleContacts, columns: contactColumns as ExportColumn[] },
      companies: { label: "Referral companies", description: "Filtered organizations currently shown in the Companies tab.", fileName: "referral-companies.csv", rows: visibleCompanies, columns: companyColumns as ExportColumn[] },
      followups: { label: "Follow-up queue", description: "Overdue, due-today, and upcoming referral follow-ups.", fileName: "referral-follow-ups.csv", rows: [...followUps.overdueRows, ...followUps.todayRows, ...followUps.upcomingRows], columns: contactColumns as ExportColumn[] },
      history: { label: "Import history", description: "CSV import history and row outcomes.", fileName: "referral-import-history.csv", rows: batches, columns: batchColumns as ExportColumn[] },
    };
  }, [batches, companies, contacts, followUps.overdueRows, followUps.todayRows, followUps.upcomingRows, visibleCompanies, visibleContacts]);

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
      {dataError && (
        <MktgCard>
          <div className="flex flex-wrap items-center justify-between gap-3 p-1">
            <div>
              <p className="text-sm font-semibold text-destructive">Referral data could not finish loading.</p>
              <p className="mt-1 text-xs text-muted-foreground">{dataError.message}</p>
            </div>
            <Button size="sm" variant="outline" onClick={refreshAll}>Retry</Button>
          </div>
        </MktgCard>
      )}

      <MktgCard>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search contacts, companies, emails..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <Button size="sm" variant="outline" onClick={() => setExportOpen(true)}>
            <Settings2 className="size-4 mr-1.5" />Export Builder
          </Button>
        </div>
      </MktgCard>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ExportDataset)}>
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
              <p className="text-sm text-muted-foreground italic p-4">Loading...</p>
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
                      <th className="w-8 px-3 py-2">
                        <Checkbox
                          checked={allContactsChecked}
                          onCheckedChange={(checked) => setSelectedContactIds(checked === true ? visibleContacts.map((c) => c.id) : [])}
                        />
                      </th>
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
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedContactIds.includes(c.id)}
                            onCheckedChange={(checked) => setSelectedContactIds((ids) => checked === true ? [...ids, c.id] : ids.filter((i) => i !== c.id))}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{c.full_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{companyName(c.company_id)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.role_type ?? c.title ?? "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.email ?? "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.state ?? "-"}</td>
                        <td className="px-3 py-2"><Badge variant="outline">{c.relationship_stage}</Badge></td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.number_of_referrals_sent ?? 0}</td>
                        <td className="px-3 py-2 text-muted-foreground">{fmtRelative(c.last_contacted_at)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{ownersToText(c.contact_owner)}</td>
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
              <p className="text-sm text-muted-foreground italic p-4">Loading...</p>
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
                      <th className="w-8 px-3 py-2">
                        <Checkbox
                          checked={allCompaniesChecked}
                          onCheckedChange={(checked) => setSelectedCompanyIds(checked === true ? visibleCompanies.map((c) => c.id) : [])}
                        />
                      </th>
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
                          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedCompanyIds.includes(c.id)}
                              onCheckedChange={(checked) => setSelectedCompanyIds((ids) => checked === true ? [...ids, c.id] : ids.filter((i) => i !== c.id))}
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">{c.company_name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.company_type ?? "-"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.domain ?? c.website_url ?? "-"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.state ?? "-"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{contactCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{c.referral_count ?? 0}</td>
                          <td className="px-3 py-2"><Badge variant="outline">{c.relationship_stage}</Badge></td>
                          <td className="px-3 py-2 text-muted-foreground">{fmtRelative(c.last_contacted_at)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{ownersToText(c.relationship_owner)}</td>
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
              Once incoming lead data is connected, Blossom OS will show which referral relationships are driving growth - by company, contact, and state.
            </p>
          </div>
        </div>
      </MktgCard>

      {/* Dialogs */}
      {addContactOpen && <AddReferralDialog open onOpenChange={setAddContactOpen} onCreated={refreshAll} />}
      {addCompanyOpen && <AddCompanyDialog open onOpenChange={setAddCompanyOpen} onCreated={refreshAll} />}
      {importOpen && <ImportReferralsDialog open onOpenChange={setImportOpen} onComplete={refreshAll} />}
      <BulkEditBar
        count={selectedContactIds.length}
        label="contacts"
        visible={activeTab === "contacts"}
        onClear={() => setSelectedContactIds([])}
        onOpen={() => setBulkContactsOpen(true)}
      />
      <BulkEditBar
        count={selectedCompanyIds.length}
        label="companies"
        visible={activeTab === "companies"}
        onClear={() => setSelectedCompanyIds([])}
        onOpen={() => setBulkCompaniesOpen(true)}
      />
      <BulkEditDialog
        open={bulkContactsOpen}
        onOpenChange={setBulkContactsOpen}
        count={selectedContactIds.length}
        kind="contacts"
        stages={CONTACT_STAGES as readonly string[]}
        states={states}
        onApply={(patch) => applyContactBulk({
          ...(patch.state !== undefined ? { state: patch.state } : {}),
          ...(patch.stage !== undefined ? { relationship_stage: patch.stage as never } : {}),
          ...(patch.owner !== undefined ? { contact_owner: patch.owner } : {}),
        })}
      />
      <BulkEditDialog
        open={bulkCompaniesOpen}
        onOpenChange={setBulkCompaniesOpen}
        count={selectedCompanyIds.length}
        kind="companies"
        stages={COMPANY_STAGES as readonly string[]}
        states={states}
        onApply={(patch) => applyCompanyBulk({
          ...(patch.state !== undefined ? { state: patch.state } : {}),
          ...(patch.stage !== undefined ? { relationship_stage: patch.stage as never } : {}),
          ...(patch.owner !== undefined ? { relationship_owner: patch.owner } : {}),
        })}
      />
      <ReferralExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        sources={exportSources}
        initialDataset={activeTab}
      />
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

function ReferralExportDialog({
  open,
  onOpenChange,
  sources,
  initialDataset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Record<ExportDataset, ExportSource>;
  initialDataset: ExportDataset;
}) {
  const [dataset, setDataset] = useState<ExportDataset>(initialDataset);
  const [selected, setSelected] = useState<string[]>([]);
  const source = sources[dataset];

  useEffect(() => {
    if (!open) return;
    const nextSource = sources[initialDataset];
    setDataset(initialDataset);
    setSelected(nextSource.columns.filter((c) => c.defaultSelected).map((c) => c.key));
  }, [initialDataset, open, sources]);

  useEffect(() => {
    setSelected((current) => {
      const valid = current.filter((key) => source.columns.some((c) => c.key === key));
      return valid.length ? valid : source.columns.filter((c) => c.defaultSelected).map((c) => c.key);
    });
  }, [source]);

  const selectedColumns = source.columns.filter((c) => selected.includes(c.key));

  function chooseDataset(nextDataset: ExportDataset) {
    const nextSource = sources[nextDataset];
    setDataset(nextDataset);
    setSelected(nextSource.columns.filter((c) => c.defaultSelected).map((c) => c.key));
  }

  function toggleColumn(key: string, checked: boolean) {
    setSelected((current) => checked ? [...new Set([...current, key])] : current.filter((k) => k !== key));
  }

  function handleExport() {
    if (!source.rows.length) {
      toast({ title: "Nothing to export", description: "There are no rows in this referral view yet." });
      return;
    }
    if (!selectedColumns.length) {
      toast({ title: "Choose at least one column", variant: "destructive" });
      return;
    }
    exportCsv(source.fileName, source.rows, selectedColumns);
    toast({ title: "Export ready", description: `${source.rows.length} rows exported from ${source.label}.` });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Build referral export</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label>Data set</Label>
              <Select value={dataset} onValueChange={(value) => chooseDataset(value as ExportDataset)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="companies">Companies</SelectItem>
                  <SelectItem value="followups">Follow-ups</SelectItem>
                  <SelectItem value="history">Import history</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-sm font-medium">{source.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{source.description}</p>
              <p className="mt-2 text-xs font-medium tabular-nums">{source.rows.length} rows - {selectedColumns.length} columns</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setSelected(source.columns.map((c) => c.key))}>Select all</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(source.columns.filter((c) => c.defaultSelected).map((c) => c.key))}>Recommended</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
          </div>

          <div className="grid max-h-[42vh] gap-2 overflow-y-auto rounded-xl border p-3 sm:grid-cols-2">
            {source.columns.map((column) => (
              <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <Checkbox checked={selected.includes(column.key)} onCheckedChange={(checked) => toggleColumn(column.key, checked === true)} />
                <span className="text-sm">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport}><Download className="mr-1.5 size-4" />Export CSV</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function BulkEditBar({
  count, label, visible, onClear, onOpen,
}: { count: number; label: string; visible: boolean; onClear: () => void; onOpen: () => void }) {
  if (!visible || count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg animate-fade-in">
      <span className="text-sm font-medium">{count} {label} selected</span>
      <div className="h-4 w-px bg-background/20" />
      <Button size="sm" variant="ghost" className="h-7 text-xs text-background hover:bg-background/10" onClick={onOpen}>
        <Settings2 className="size-3.5 mr-1.5" /> Bulk edit
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs text-background hover:bg-background/10" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

function BulkEditDialog({
  open, onOpenChange, count, kind, stages, states, onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  count: number;
  kind: "contacts" | "companies";
  stages: readonly string[];
  states: string[];
  onApply: (patch: { state?: string | null; stage?: string; owner?: string[] | null }) => void;
}) {
  const KEEP = "__keep";
  const CLEAR = "__clear";
  const SET = "__set";
  const [stateVal, setStateVal] = useState<string>(KEEP);
  const [stateCustom, setStateCustom] = useState("");
  const [stageVal, setStageVal] = useState<string>(KEEP);
  const [ownerVal, setOwnerVal] = useState<string>(KEEP);
  const [ownerList, setOwnerList] = useState<string[]>([]);

  useEffect(() => {
    if (open) { setStateVal(KEEP); setStageVal(KEEP); setOwnerVal(KEEP); setStateCustom(""); setOwnerList([]); }
  }, [open]);

  function handleApply() {
    const patch: { state?: string | null; stage?: string; owner?: string[] | null } = {};
    if (stateVal !== KEEP) patch.state = stateVal === CLEAR ? null : stateVal === "__custom" ? stateCustom.trim() : stateVal;
    if (stageVal !== KEEP) patch.stage = stageVal;
    if (ownerVal !== KEEP) patch.owner = ownerVal === CLEAR ? null : ownerList.length ? ownerList : null;
    if (Object.keys(patch).length === 0) {
      toast({ title: "Nothing to update", description: "Pick at least one field to change." });
      return;
    }
    onApply(patch);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk edit {count} {kind}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">State</Label>
            <Select value={stateVal} onValueChange={setStateVal}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={KEEP}>Keep current</SelectItem>
                <SelectItem value={CLEAR}>Clear</SelectItem>
                <SelectItem value="__custom">Custom...</SelectItem>
                {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {stateVal === "__custom" && (
              <Input className="mt-2" value={stateCustom} onChange={(e) => setStateCustom(e.target.value)} placeholder="e.g. NC" />
            )}
          </div>
          <div>
            <Label className="text-xs">Stage</Label>
            <Select value={stageVal} onValueChange={setStageVal}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={KEEP}>Keep current</SelectItem>
                {stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Owner</Label>
            <Select value={ownerVal} onValueChange={setOwnerVal}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={KEEP}>Keep current</SelectItem>
                <SelectItem value={CLEAR}>Clear</SelectItem>
                <SelectItem value={SET}>Set owners...</SelectItem>
              </SelectContent>
            </Select>
            {ownerVal === SET && (
              <div className="mt-2"><OwnerCombobox value={ownerList} onChange={setOwnerList} /></div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply to {count}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
                <p className="text-xs text-muted-foreground truncate">{companyName(c.company_id)} - {c.role_type ?? "-"}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium">{fmtDate(c.next_follow_up_at)}</p>
                <p className="text-muted-foreground">{ownersToText(c.contact_owner)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </MktgCard>
  );
}
