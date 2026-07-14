import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  Stethoscope, Building2, IdCard, AlertTriangle, Calendar, Plus, Filter,
  Download, RefreshCw, ListChecks, FileSignature, ShieldCheck, Activity,
  Search, X, Trash2, Upload, FileText, ListTodo, BarChart3, Save, BookmarkPlus,
  type LucideIcon,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listCredViews, saveCredView, deleteCredView,
  type CredentialingSavedView,
} from "@/lib/os/credentialingSavedViews";
import {
  useCredentialingData, useCredentialingActivity,
  createCredProvider, updateCredProvider, createCredRecord, updateCredRecord,
  createCredTask, updateCredTask, addCredDocument, updateCredDocument,
  logCredActivity,
  uploadCredDocumentFile, getCredDocumentSignedUrl,
  fetchLegacyRaw, importLegacyRows, previewLegacyImport, type LegacyRawRow, type LegacyImportPreview,
  CRED_STATUSES, CRED_TYPES, CRED_PRIORITIES, CRED_PROVIDER_TYPES, CRED_STATES,
  ACTIVE_CRED_STATUSES, APPROVED_CRED_STATUSES,
  daysUntil,
  type CredentialingProvider, type CredentialingRecord, type CredentialingDocument,
  type CredStatus, type CredType, type CredPriority, type CredProviderType,
  type CrSyncStatus,
} from "@/hooks/useCredentialing";

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */
function Shell({ children }: { children: ReactNode }) {
  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1500px] mx-auto space-y-6">{children}</div>
    </OSShell>
  );
}

function PageHeader({
  eyebrow, title, subtitle, icon: Icon, actions,
}: { eyebrow: string; title: string; subtitle: string; icon: LucideIcon; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          <Icon className="h-3.5 w-3.5" /> {eyebrow}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

function SectionCard({ title, description, action, children }: {
  title: string; description?: string; action?: ReactNode; children: ReactNode;
}) {
  return (
    <Card className="p-6 rounded-2xl border-border/60">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function StatusBadge({ status }: { status: CredStatus | string }) {
  const tone =
    status === "Approved" || status === "Effective"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "Denied" || status === "Blocked"
      ? "bg-red-50 text-red-700 border-red-200"
    : status === "Expiring" || status === "Missing Info"
      ? "bg-amber-50 text-amber-800 border-amber-200"
    : status === "Submitted" || status === "Payer Follow-Up" || status === "Ready to Submit"
      ? "bg-sky-50 text-sky-700 border-sky-200"
    : status === "Renewal In Progress" || status === "Gathering Docs"
      ? "bg-violet-50 text-violet-700 border-violet-200"
    : "bg-muted/40 text-muted-foreground border-border/60";
  return <Badge variant="outline" className={cn("font-medium", tone)}>{status}</Badge>;
}

function KpiCard({ label, value, tone = "neutral", hint }: {
  label: string; value: ReactNode; tone?: "ok" | "warn" | "danger" | "neutral"; hint?: string;
}) {
  return (
    <Card className="p-5 rounded-2xl border-border/60">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn(
        "text-3xl font-semibold tracking-tight mt-2",
        tone === "ok" && "text-emerald-600",
        tone === "warn" && "text-amber-600",
        tone === "danger" && "text-red-600",
      )}>{value}</div>
      {hint ? <div className="text-xs text-muted-foreground mt-1">{hint}</div> : null}
    </Card>
  );
}

function LoadErr({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading credentialing data…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  return null;
}

function Empty({
  icon: Icon = FileSignature, title, description, action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-10">
      <div className="h-10 w-10 mx-auto rounded-full bg-muted grid place-items-center mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description ? (
        <div className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{description}</div>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* From-reports contextual banner                                             */
/* -------------------------------------------------------------------------- */
function FromReportsBanner() {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  if (params.get("from") !== "reports") return null;
  const report = params.get("report");
  const label = report ? `Opened from Reports · ${report}` : "Opened from Reports";
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-medium px-3 py-2 inline-flex items-center gap-2">
      <BarChart3 className="h-3.5 w-3.5" /> {label}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Saved views bar (built-ins + user custom views)                            */
/* -------------------------------------------------------------------------- */
interface BuiltInView { id: string; label: string }

function SavedViewsBar<T extends Record<string, unknown>>({
  pageKey, builtIns, activeId, onApplyBuiltIn, currentFilters,
  onApplyCustom, hasActiveFilters, onClear,
}: {
  pageKey: string;
  builtIns: BuiltInView[];
  activeId: string;
  onApplyBuiltIn: (id: string) => void;
  currentFilters: T;
  onApplyCustom: (filters: T) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  const [custom, setCustom] = useState<CredentialingSavedView<T>[]>(() => listCredViews<T>(pageKey));
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const refresh = () => setCustom(listCredViews<T>(pageKey));
    window.addEventListener("credentialing-saved-views-changed", refresh);
    return () => window.removeEventListener("credentialing-saved-views-changed", refresh);
  }, [pageKey]);

  function commitSave() {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Give this view a name"); return; }
    saveCredView<T>(pageKey, trimmed, currentFilters);
    toast.success(`Saved view · ${trimmed}`);
    setName("");
    setSaveOpen(false);
  }

  function removeCustom(id: string, label: string) {
    deleteCredView(pageKey, id);
    toast.message(`Removed view · ${label}`);
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {builtIns.map((v) => (
        <button
          key={v.id}
          onClick={() => onApplyBuiltIn(v.id)}
          className={cn(
            "px-2.5 h-7 text-xs font-medium rounded-md whitespace-nowrap transition-colors border",
            activeId === v.id
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-card text-muted-foreground hover:text-foreground border-border/60",
          )}
        >
          {v.label}
        </button>
      ))}
      {custom.length > 0 && <div className="h-5 w-px bg-border/60 mx-0.5" />}
      {custom.map((v) => (
        <div key={v.id} className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card text-xs font-medium overflow-hidden">
          <button className="px-2.5 h-7 text-muted-foreground hover:text-foreground" onClick={() => onApplyCustom(v.filters)}>
            {v.name}
          </button>
          <button
            className="h-7 px-1.5 text-muted-foreground hover:text-red-600 border-l border-border/60"
            title="Delete saved view"
            onClick={() => removeCustom(v.id, v.name)}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      {hasActiveFilters && (
        <button
          onClick={() => setSaveOpen(true)}
          className="ml-1 inline-flex items-center gap-1 px-2.5 h-7 text-xs font-medium rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
        >
          <BookmarkPlus className="h-3 w-3" /> Save current view
        </button>
      )}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="ml-1 px-2.5 h-7 text-xs font-medium rounded-md whitespace-nowrap text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Clear filters
        </button>
      )}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
            <DialogDescription>Name this filter combination so you can jump back to it later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>View name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GA blocked payers" onKeyDown={(e) => { if (e.key === "Enter") commitSave(); }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={commitSave}><Save className="h-3.5 w-3.5 mr-1" /> Save view</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CentralReach readiness helpers                                             */
/* -------------------------------------------------------------------------- */
/**
 * CentralReach readiness split into two buckets:
 *  - `required`: operational data we can't send without. These block "Ready To Sync".
 *  - `recommended`: nice-to-have identifiers (CentralReach IDs). They do NOT
 *    block Ready To Sync because we may not have the CR IDs yet — we only
 *    surface them so users know what's still missing for a clean handoff.
 * Uses the shared APPROVED_CRED_STATUSES list so we don't invent a new one.
 */
function readinessCheck(
  record: CredentialingRecord,
  provider: CredentialingProvider | null | undefined,
): { required: string[]; recommended: string[] } {
  const required: string[] = [];
  const recommended: string[] = [];
  if (!provider?.npi) required.push("Provider NPI");
  if (!provider?.license_state) required.push("Provider license state");
  if (!record.payer_name) required.push("Payer");
  if (!record.state) required.push("State");
  if (!APPROVED_CRED_STATUSES.includes(record.status)) {
    required.push(`Credentialing status must be one of: ${APPROVED_CRED_STATUSES.join(", ")}`);
  }
  if (!provider?.centralreach_provider_id) recommended.push("Provider CentralReach ID");
  if (!record.centralreach_external_id) recommended.push("Record CentralReach ID");
  return { required, recommended };
}

function readinessMissingFields(
  record: CredentialingRecord,
  provider: CredentialingProvider | null | undefined,
): string[] {
  // Backwards-compatible helper: only the hard-required fields block sync.
  return readinessCheck(record, provider).required;
}

/* -------------------------------------------------------------------------- */
/* Add Provider dialog                                                        */
/* -------------------------------------------------------------------------- */
function AddProviderDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void;
}) {
  const blankProvider = {
    provider_name: "", provider_type: "BCBA" as CredProviderType,
    email: "", phone: "", npi: "", caqh_id: "",
    license_number: "", license_state: "GA", license_expiration_date: "",
    centralreach_provider_id: "", active: true, notes: "",
  };
  const [form, setForm] = useState(blankProvider);
  const [saving, setSaving] = useState(false);

  // Always reset every field when the dialog opens or closes so a previous
  // create doesn't leave stale values around.
  useEffect(() => { if (open) setForm(blankProvider); }, [open]);

  async function submit() {
    if (!form.provider_name.trim()) { toast.error("Provider name is required"); return; }
    setSaving(true);
    try {
      await createCredProvider({
        provider_name: form.provider_name.trim(),
        provider_type: form.provider_type,
        email: form.email || null, phone: form.phone || null,
        npi: form.npi || null, caqh_id: form.caqh_id || null,
        license_number: form.license_number || null,
        license_state: form.license_state || null,
        license_expiration_date: form.license_expiration_date || null,
        centralreach_provider_id: form.centralreach_provider_id || null,
        active: form.active, notes: form.notes || null,
      });
      toast.success("Provider added");
      onCreated();
      setForm(blankProvider);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add provider");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add provider</DialogTitle>
          <DialogDescription>Create a credentialing provider record.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Provider name</Label>
            <Input value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.provider_type} onValueChange={(v) => setForm({ ...form, provider_type: v as CredProviderType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_PROVIDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>License state</Label>
            <Select value={form.license_state} onValueChange={(v) => setForm({ ...form, license_state: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>NPI</Label><Input value={form.npi} onChange={(e) => setForm({ ...form, npi: e.target.value })} /></div>
          <div><Label>CAQH ID</Label><Input value={form.caqh_id} onChange={(e) => setForm({ ...form, caqh_id: e.target.value })} /></div>
          <div><Label>License number</Label><Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
          <div><Label>License expiration</Label><Input type="date" value={form.license_expiration_date} onChange={(e) => setForm({ ...form, license_expiration_date: e.target.value })} /></div>
          <div><Label>CentralReach provider id</Label><Input value={form.centralreach_provider_id} onChange={(e) => setForm({ ...form, centralreach_provider_id: e.target.value })} /></div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label className="!mt-0">Active</Label>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Add provider"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Add / edit Credentialing Record dialog                                     */
/* -------------------------------------------------------------------------- */
function AddRecordDialog({
  open, onOpenChange, providers, defaultProviderId, defaultProviderType,
  defaultPayer, defaultState, defaultCredentialingType, onCreated,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  providers: CredentialingProvider[];
  defaultProviderId?: string;
  defaultProviderType?: CredProviderType;
  defaultPayer?: string;
  defaultState?: string;
  defaultCredentialingType?: CredType;
  onCreated: () => void;
}) {
  const buildBlank = () => ({
    provider_id: defaultProviderId ?? "",
    payer_name: defaultPayer ?? "",
    state: defaultState ?? "GA",
    plan_type: "",
    credentialing_type: (defaultCredentialingType ?? "Initial") as CredType,
    status: "Not Started" as CredStatus,
    priority: "Normal" as CredPriority,
    payer_reference_number: "",
    submitted_date: "", expiration_date: "", next_follow_up_date: "",
    blocker_reason: "", notes: "", owner_name: "",
  });
  const [form, setForm] = useState(buildBlank);
  const [saving, setSaving] = useState(false);

  // Always rebuild the form from defaults on each open so dates, notes,
  // payer, status, etc. from the previous create do not persist.
  useEffect(() => {
    if (open) setForm(buildBlank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultProviderId, defaultPayer, defaultState, defaultCredentialingType]);

  // Prefer BCBA-typed providers when the caller has signalled that intent
  // (e.g. "Add BCBA" flow). Used only to pick a sensible default in an
  // empty form.
  useEffect(() => {
    if (!open || form.provider_id) return;
    if (defaultProviderType) {
      const first = providers.find((p) => p.provider_type === defaultProviderType);
      if (first) setForm((f) => ({ ...f, provider_id: first.id }));
    }
  }, [open, defaultProviderType, providers, form.provider_id]);

  async function submit() {
    if (!form.provider_id) { toast.error("Select a provider"); return; }
    if (!form.payer_name.trim()) { toast.error("Payer name is required"); return; }
    setSaving(true);
    try {
      await createCredRecord({
        provider_id: form.provider_id,
        payer_name: form.payer_name.trim(),
        state: form.state || null,
        plan_type: form.plan_type || null,
        credentialing_type: form.credentialing_type,
        status: form.status,
        priority: form.priority,
        payer_reference_number: form.payer_reference_number || null,
        submitted_date: form.submitted_date || null,
        expiration_date: form.expiration_date || null,
        next_follow_up_date: form.next_follow_up_date || null,
        blocker_reason: form.blocker_reason || null,
        notes: form.notes || null,
        owner_name: form.owner_name || null,
        centralreach_sync_status: "Not Connected",
      });
      toast.success("Credentialing record created");
      onCreated();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create record");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add credentialing record</DialogTitle>
          <DialogDescription>Track a payer/state credentialing workflow.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Provider</Label>
            <Select value={form.provider_id} onValueChange={(v) => setForm({ ...form, provider_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
              <SelectContent>
                {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.provider_name} · {p.provider_type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Payer</Label><Input value={form.payer_name} onChange={(e) => setForm({ ...form, payer_name: e.target.value })} placeholder="Aetna, BCBS, United..." /></div>
          <div>
            <Label>State</Label>
            <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Plan type</Label><Input value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value })} placeholder="Commercial, Medicaid..." /></div>
          <div>
            <Label>Credentialing type</Label>
            <Select value={form.credentialing_type} onValueChange={(v) => setForm({ ...form, credentialing_type: v as CredType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CredStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as CredPriority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Payer reference #</Label><Input value={form.payer_reference_number} onChange={(e) => setForm({ ...form, payer_reference_number: e.target.value })} /></div>
          <div><Label>Submitted date</Label><Input type="date" value={form.submitted_date} onChange={(e) => setForm({ ...form, submitted_date: e.target.value })} /></div>
          <div><Label>Expiration date</Label><Input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} /></div>
          <div><Label>Next follow-up</Label><Input type="date" value={form.next_follow_up_date} onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })} /></div>
          <div><Label>Owner</Label><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Person responsible" /></div>
          <div className="col-span-2"><Label>Blocker reason</Label><Input value={form.blocker_reason} onChange={(e) => setForm({ ...form, blocker_reason: e.target.value })} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create record"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Add Task dialog (replaces window.prompt)                                   */
/* -------------------------------------------------------------------------- */
function AddTaskDialog({ open, onOpenChange, recordId, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  recordId: string; onCreated: () => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", owner_name: "", due_date: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setForm({ title: "", description: "", owner_name: "", due_date: "" }); }, [open]);
  async function submit() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await createCredTask({
        credentialing_record_id: recordId,
        title: form.title.trim(),
        description: form.description || null,
        owner_name: form.owner_name || null,
        due_date: form.due_date || null,
        status: "Open",
      });
      toast.success("Task created");
      onCreated();
      onOpenChange(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>Track follow-up work tied to this credentialing record.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Follow up with payer" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Owner</Label><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Assignee name" /></div>
            <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Add task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Add Document dialog (replaces window.prompt)                               */
/* -------------------------------------------------------------------------- */
const DOC_VERIFICATION_STATUSES = ["Needed","Received","Verified","Expired","Rejected"] as const;
type DocStatus = typeof DOC_VERIFICATION_STATUSES[number];

function AddDocumentDialog({ open, onOpenChange, recordId, providerId, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  recordId: string | null; providerId: string | null; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    document_type: "", file_name: "",
    verification_status: "Needed" as DocStatus,
    expiration_date: "", notes: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setForm({ document_type: "", file_name: "", verification_status: "Needed", expiration_date: "", notes: "" });
      setFile(null);
    }
  }, [open]);
  async function submit() {
    if (!form.document_type.trim()) { toast.error("Document type is required"); return; }
    if (!recordId && !providerId) { toast.error("Document must be attached to a provider or record"); return; }
    setSaving(true);
    try {
      if (file) {
        await uploadCredDocumentFile({
          file,
          document_type: form.document_type.trim(),
          provider_id: providerId,
          credentialing_record_id: recordId,
          verification_status: form.verification_status,
          expiration_date: form.expiration_date || null,
          notes: form.notes || null,
        });
        toast.success("Document uploaded");
      } else {
        await addCredDocument({
          credentialing_record_id: recordId,
          provider_id: providerId,
          document_type: form.document_type.trim(),
          file_name: form.file_name || null,
          verification_status: form.verification_status,
          expiration_date: form.expiration_date || null,
          notes: form.notes || null,
        });
        toast.success("Document tracked");
      }
      onCreated();
      onOpenChange(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add document</DialogTitle>
          <DialogDescription>
            Upload a file to secure credentialing storage, or track the document
            without a file if it lives elsewhere.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Document type</Label><Input value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })} placeholder="CAQH attestation, License, W9…" /></div>
          <div>
            <Label>File (optional)</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <div className="text-xs text-muted-foreground mt-1">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">No file selected — saves as metadata-only.</div>
            )}
          </div>
          {!file ? (
            <div><Label>File name reference</Label><Input value={form.file_name} onChange={(e) => setForm({ ...form, file_name: e.target.value })} placeholder="optional" /></div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Verification status</Label>
              <Select value={form.verification_status} onValueChange={(v) => setForm({ ...form, verification_status: v as DocStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_VERIFICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Expiration date</Label><Input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : file ? "Upload" : "Track document"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* CentralReach IDs dialog                                                    */
/* -------------------------------------------------------------------------- */
function CentralReachIdsDialog({ open, onOpenChange, record, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  record: CredentialingRecord; onSaved: () => void;
}) {
  const [externalId, setExternalId] = useState(record.centralreach_external_id ?? "");
  useEffect(() => { if (open) setExternalId(record.centralreach_external_id ?? ""); }, [open, record]);
  const [saving, setSaving] = useState(false);
  async function submit() {
    setSaving(true);
    try {
      const oldId = record.centralreach_external_id ?? "";
      const newId = externalId.trim();
      if (oldId === newId) {
        onOpenChange(false);
        return;
      }
      await updateCredRecord(
        record.id,
        { centralreach_external_id: newId || null },
        {
          type: "cr_id_change",
          message: `CentralReach record id: ${oldId || "(empty)"} → ${newId || "(cleared)"}`,
          old: oldId || null,
          new: newId || null,
        },
      );
      toast.success("CentralReach IDs updated");
      onSaved();
      onOpenChange(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit CentralReach IDs</DialogTitle>
          <DialogDescription>CentralReach is the EMR. Live API sync is not connected — these IDs prepare the record for the integration.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>CentralReach record id</Label><Input value={externalId} onChange={(e) => setExternalId(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Record detail sheet                                                        */
/* -------------------------------------------------------------------------- */
function RecordDetailSheet({
  recordId, records, providerById, tasks = [], documents = [], onClose, onChanged,
}: {
  recordId: string | null;
  records: CredentialingRecord[];
  providerById: Map<string, CredentialingProvider>;
  tasks?: ReturnType<typeof useCredentialingData>["tasks"];
  documents?: ReturnType<typeof useCredentialingData>["documents"];
  onClose: () => void;
  onChanged: () => void;
}) {
  const record = useMemo(() => records.find((r) => r.id === recordId) ?? null, [records, recordId]);
  const provider = record ? providerById.get(record.provider_id) ?? null : null;
  const { items: activity } = useCredentialingActivity(record?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [crIdsOpen, setCrIdsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [syncErrorOpen, setSyncErrorOpen] = useState(false);
  const [syncErrorNote, setSyncErrorNote] = useState("");
  const [newMissing, setNewMissing] = useState("");
  const [ownerDraft, setOwnerDraft] = useState("");
  const [followUpDraft, setFollowUpDraft] = useState("");

  useEffect(() => {
    setOwnerDraft(record?.owner_name ?? "");
    setFollowUpDraft(record?.next_follow_up_date ?? "");
  }, [record?.id, record?.owner_name, record?.next_follow_up_date]);

  const recordTasks = useMemo(
    () => (record ? tasks.filter((t) => t.credentialing_record_id === record.id) : []),
    [tasks, record],
  );
  const recordDocs = useMemo(
    () => (record ? documents.filter((d) => d.credentialing_record_id === record.id || d.provider_id === record.provider_id) : []),
    [documents, record],
  );

  async function moveStatus(s: CredStatus) {
    if (!record) return;
    setBusy(true);
    try {
      const patch: Partial<CredentialingRecord> = { status: s };
      const today = new Date().toISOString().slice(0, 10);
      if (s === "Submitted" && !record.submitted_date) patch.submitted_date = today;
      if ((s === "Approved" || s === "Effective") && !record.approved_date) patch.approved_date = today;
      await updateCredRecord(record.id, patch);
      toast.success(`Marked ${s}`);
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
    finally { setBusy(false); }
  }

  async function saveOwner() {
    if (!record) return;
    try {
      await updateCredRecord(record.id, { owner_name: ownerDraft || null }, `Owner set to ${ownerDraft || "(unassigned)"}`);
      toast.success("Owner updated");
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
  }

  async function saveFollowUp() {
    if (!record) return;
    try {
      await updateCredRecord(record.id, { next_follow_up_date: followUpDraft || null }, `Follow-up updated to ${followUpDraft || "(cleared)"}`);
      toast.success("Follow-up updated");
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
  }

  async function addMissing() {
    if (!record || !newMissing.trim()) return;
    const next = [...(record.missing_items ?? []), newMissing.trim()];
    try {
      await updateCredRecord(record.id, { missing_items: next }, `Missing item added: ${newMissing.trim()}`);
      setNewMissing("");
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
  }

  async function removeMissing(item: string) {
    if (!record) return;
    const next = (record.missing_items ?? []).filter((m) => m !== item);
    try {
      await updateCredRecord(record.id, { missing_items: next }, `Missing item resolved: ${item}`);
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
  }

  async function setCrSync(status: CrSyncStatus) {
    if (!record) return;
    const old = record.centralreach_sync_status;
    if (old === status) {
      toast.message(`CentralReach already ${status}`);
      return;
    }
    if (status === "Ready To Sync") {
      const missing = readinessMissingFields(record, provider);
      if (missing.length) {
        toast.error(
          `Not ready yet — please fill in ${missing.length === 1 ? "this field" : "these fields"}: ${missing.join(", ")}`,
        );
        return;
      }
    }
    try {
      await updateCredRecord(
        record.id,
        {
          centralreach_sync_status: status,
          centralreach_last_readiness_at: new Date().toISOString(),
          // Clear stale error message unless re-marking Sync Error
          ...(status === "Sync Error" ? {} : { centralreach_sync_error: null }),
        },
        {
          type: "cr_sync_status_change",
          message: `CentralReach sync: ${old} → ${status}`,
          old,
          new: status,
        },
      );
      toast.success(`CentralReach: ${status}`);
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
  }

  async function submitSyncError() {
    if (!record) return;
    const note = syncErrorNote.trim();
    if (!note) { toast.error("Add a short note explaining the sync error."); return; }
    try {
      await updateCredRecord(
        record.id,
        {
          centralreach_sync_status: "Sync Error",
          centralreach_sync_error: note,
          centralreach_last_readiness_at: new Date().toISOString(),
        },
        {
          type: "cr_sync_status_change",
          message: `CentralReach sync: ${record.centralreach_sync_status} → Sync Error — ${note}`,
          old: record.centralreach_sync_status,
          new: "Sync Error",
        },
      );
      toast.success("CentralReach marked Sync Error");
      setSyncErrorNote("");
      setSyncErrorOpen(false);
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
  }

  async function setTaskStatus(taskId: string, status: "Open" | "In Progress" | "Done" | "Blocked") {
    try {
      await updateCredTask(taskId, { status });
      toast.success(`Task ${status}`);
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function setDocStatus(docId: string, verification_status: DocStatus) {
    try {
      await updateCredDocument(docId, { verification_status });
      toast.success(`Document ${verification_status}`);
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <Sheet open={!!record} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {record && provider ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {provider.provider_name}
                <StatusBadge status={record.status} />
              </SheetTitle>
              <SheetDescription>
                {record.payer_name} · {record.state ?? "—"} · {record.credentialing_type}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>Edit record</Button>
              <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add task</Button>
              <Button size="sm" variant="outline" onClick={() => setAddDocOpen(true)}><FileText className="h-3.5 w-3.5 mr-1" />Add document</Button>
            </div>
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Documents</TabsTrigger>
                <TabsTrigger value="tasks"><ListTodo className="h-3.5 w-3.5 mr-1" />Tasks</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="cr">CentralReach</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Submitted" value={record.submitted_date} />
                  <Field label="Approved" value={record.approved_date} />
                  <Field label="Effective" value={record.effective_date} />
                  <Field label="Expiration" value={record.expiration_date} />
                  <Field label="Priority" value={record.priority} />
                  <Field label="Payer reference" value={record.payer_reference_number} />
                  <Field label="Plan type" value={record.plan_type} />
                  <Field label="Source" value={record.source_system} />
                </div>

                {/* Owner + follow-up inline edit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Owner</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={ownerDraft} onChange={(e) => setOwnerDraft(e.target.value)} placeholder="Person responsible" />
                      <Button size="sm" variant="outline" onClick={saveOwner}>Save</Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Next follow-up</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="date" value={followUpDraft} onChange={(e) => setFollowUpDraft(e.target.value)} />
                      <Button size="sm" variant="outline" onClick={saveFollowUp}>Save</Button>
                    </div>
                  </div>
                </div>

                {record.blocker_reason ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm p-3">
                    <div className="font-medium mb-1">Blocker</div>{record.blocker_reason}
                  </div>
                ) : null}

                {/* Missing items management */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 text-amber-900 text-sm p-3">
                  <div className="font-medium mb-2 flex items-center justify-between">
                    <span>Missing items{record.missing_items?.length ? ` (${record.missing_items.length})` : ""}</span>
                  </div>
                  {record.missing_items?.length ? (
                    <ul className="space-y-1">
                      {record.missing_items.map((m) => (
                        <li key={m} className="flex items-center justify-between gap-2">
                          <span>• {m}</span>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => removeMissing(m)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-amber-800/70">No missing items.</div>}
                  <div className="flex gap-2 mt-3">
                    <Input value={newMissing} onChange={(e) => setNewMissing(e.target.value)} placeholder="Add missing item (e.g. CAQH attestation)" />
                    <Button size="sm" variant="outline" onClick={addMissing}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                  </div>
                </div>

                {record.notes ? (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{record.notes}</div>
                ) : null}
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Move status</div>
                  <div className="flex flex-wrap gap-2">
                    {(["Gathering Docs","Ready to Submit","Submitted","Payer Follow-Up","Approved","Effective","Expiring","Renewal In Progress","Denied","Blocked"] as CredStatus[]).map((s) => (
                      <Button key={s} size="sm" variant="outline" disabled={busy || s === record.status} onClick={() => moveStatus(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add task</Button>
                  <Button size="sm" variant="outline" onClick={() => setAddDocOpen(true)}><FileSignature className="h-3.5 w-3.5 mr-1" />Track document</Button>
                </div>
              </TabsContent>

              {/* DOCUMENTS */}
              <TabsContent value="documents" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Upload real files to the private credentialing bucket, or keep metadata-only entries for items stored elsewhere.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setAddDocOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add document</Button>
                </div>
                {recordDocs.length === 0 ? (
                  <Empty icon={FileText} title="No documents tracked yet" action={
                    <Button size="sm" variant="outline" onClick={() => setAddDocOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add document</Button>
                  } />
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>{["Type","File","Status","Expires","Added",""].map((h) => (
                          <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {recordDocs.map((d) => (
                          <tr key={d.id} className="border-t border-border/60">
                            <td className="px-3 py-2 font-medium">{d.document_type}</td>
                            <td className="px-3 py-2 text-muted-foreground">{d.file_name ?? "—"}</td>
                            <td className="px-3 py-2">
                              <Select value={d.verification_status} onValueChange={(v) => setDocStatus(d.id, v as DocStatus)}>
                                <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>{DOC_VERIFICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{d.expiration_date ?? "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-right">
                              {d.storage_path ? (
                                <Button size="sm" variant="ghost" onClick={() => openCredDocument(d)}>View</Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">metadata-only</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* TASKS */}
              <TabsContent value="tasks" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Tasks tied to this credentialing record.</p>
                  <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add task</Button>
                </div>
                {recordTasks.length === 0 ? (
                  <Empty icon={ListTodo} title="No tasks yet" action={
                    <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add task</Button>
                  } />
                ) : (
                  <div className="space-y-2">
                    {recordTasks.map((t) => {
                      const overdue = t.due_date && t.due_date < todayIso && t.status !== "Done";
                      return (
                        <div key={t.id} className={cn("rounded-lg border p-3", overdue ? "border-red-300 bg-red-50/40" : "border-border/60")}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-sm">{t.title}</div>
                              {t.description ? <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div> : null}
                              <div className="text-xs text-muted-foreground mt-1">
                                {t.owner_name ? `Owner: ${t.owner_name}` : "Unassigned"}
                                {" · "}
                                {t.due_date ? `Due ${t.due_date}` : "No due date"}
                                {overdue ? <span className="ml-2 text-red-700 font-medium">Overdue</span> : null}
                              </div>
                            </div>
                            <Select value={t.status} onValueChange={(v) => setTaskStatus(t.id, v as "Open" | "In Progress" | "Done" | "Blocked")}>
                              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {(["Open","In Progress","Done","Blocked"] as const).map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ACTIVITY */}
              <TabsContent value="activity" className="mt-4 space-y-2">
                {activity.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No activity yet.</div>
                ) : activity.map((a) => (
                  <div key={a.id} className="text-sm border-l-2 border-border/60 pl-3 py-1">
                    <div className="font-medium">
                      {a.activity_type === "status_change"
                        ? `Status: ${a.old_status ?? "—"} → ${a.new_status ?? "—"}`
                        : a.activity_type === "cr_sync_status_change"
                        ? `CentralReach sync: ${a.old_status ?? "—"} → ${a.new_status ?? "—"}`
                        : a.activity_type === "cr_id_change"
                        ? `CentralReach record id: ${a.old_status ?? "(empty)"} → ${a.new_status ?? "(cleared)"}`
                        : a.message ?? a.activity_type}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </TabsContent>

              {/* CENTRALREACH */}
              <TabsContent value="cr" className="mt-4 space-y-3 text-sm">
                <div className="rounded-lg border border-sky-200 bg-sky-50 text-sky-900 text-xs p-3">
                  Readiness tracking only — no live CentralReach API sync is wired up.
                  Every status or ID change here is written to the activity log below.
                </div>
                <Field label="CentralReach provider id" value={provider.centralreach_provider_id} />
                <Field label="CentralReach record id" value={record.centralreach_external_id} />
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Sync status</span>
                  <StatusBadge status={record.centralreach_sync_status} />
                </div>
                <Field label="Last record update" value={record.updated_at ? new Date(record.updated_at).toLocaleString() : null} />
                <Field label="Last readiness update" value={record.centralreach_last_readiness_at ? new Date(record.centralreach_last_readiness_at).toLocaleString() : null} />
                {(() => {
                  const { required, recommended } = readinessCheck(record, provider);
                  return (
                    <div className="space-y-2">
                      {required.length === 0 ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs p-3">
                          Ready to sync — every required field is filled in.
                          {recommended.length > 0
                            ? " CentralReach IDs are optional but recommended for a cleaner handoff."
                            : ""}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 text-xs p-3">
                          <div className="font-medium mb-1">Not ready yet — fill in {required.length} required field{required.length === 1 ? "" : "s"}</div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {required.map((m) => <li key={m}>{m}</li>)}
                          </ul>
                        </div>
                      )}
                      {recommended.length > 0 && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs p-3">
                          <div className="font-medium mb-1">Recommended (won't block sync)</div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {recommended.map((m) => <li key={m}>{m}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {record.centralreach_sync_status === "Sync Error" && record.centralreach_sync_error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs p-3">
                    <div className="font-medium mb-0.5">Sync error</div>
                    {record.centralreach_sync_error}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={readinessMissingFields(record, provider).length > 0}
                    onClick={() => setCrSync("Ready To Sync")}
                  >
                    Mark Ready To Sync
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCrSync("Synced")}>Mark Synced</Button>
                  <Button size="sm" variant="outline" onClick={() => { setSyncErrorNote(record.centralreach_sync_error ?? ""); setSyncErrorOpen(true); }}>Mark Sync Error…</Button>
                  <Button size="sm" variant="outline" onClick={() => setCrIdsOpen(true)}>Edit CentralReach IDs</Button>
                </div>
              </TabsContent>
            </Tabs>

            <AddTaskDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} recordId={record.id} onCreated={onChanged} />
            <AddDocumentDialog open={addDocOpen} onOpenChange={setAddDocOpen} recordId={record.id} providerId={record.provider_id} onCreated={onChanged} />
            <CentralReachIdsDialog open={crIdsOpen} onOpenChange={setCrIdsOpen} record={record} onSaved={onChanged} />
            <EditRecordDialog open={editOpen} onOpenChange={setEditOpen} record={record} onSaved={onChanged} />
            <Dialog open={syncErrorOpen} onOpenChange={(o) => { setSyncErrorOpen(o); if (!o) setSyncErrorNote(""); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark CentralReach Sync Error</DialogTitle>
                  <DialogDescription>
                    Capture what went wrong so the next person picking this up knows the blocker.
                    Every change is logged to the activity timeline.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="cr-sync-error">Error reason / note</Label>
                  <Textarea
                    id="cr-sync-error"
                    value={syncErrorNote}
                    onChange={(e) => setSyncErrorNote(e.target.value)}
                    placeholder="e.g. CentralReach NPI mismatch — escalated to RCM."
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSyncErrorOpen(false)}>Cancel</Button>
                  <Button onClick={submitSyncError} disabled={!syncErrorNote.trim()}>Mark Sync Error</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{value && value.length ? value : "—"}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Edit Record dialog                                                         */
/* -------------------------------------------------------------------------- */
function EditRecordDialog({ open, onOpenChange, record, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  record: CredentialingRecord; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    payer_name: record.payer_name,
    state: record.state ?? "GA",
    plan_type: record.plan_type ?? "",
    credentialing_type: record.credentialing_type,
    priority: record.priority,
    payer_reference_number: record.payer_reference_number ?? "",
    submitted_date: record.submitted_date ?? "",
    approved_date: record.approved_date ?? "",
    effective_date: record.effective_date ?? "",
    expiration_date: record.expiration_date ?? "",
    next_follow_up_date: record.next_follow_up_date ?? "",
    owner_name: record.owner_name ?? "",
    blocker_reason: record.blocker_reason ?? "",
    notes: record.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setForm({
      payer_name: record.payer_name,
      state: record.state ?? "GA",
      plan_type: record.plan_type ?? "",
      credentialing_type: record.credentialing_type,
      priority: record.priority,
      payer_reference_number: record.payer_reference_number ?? "",
      submitted_date: record.submitted_date ?? "",
      approved_date: record.approved_date ?? "",
      effective_date: record.effective_date ?? "",
      expiration_date: record.expiration_date ?? "",
      next_follow_up_date: record.next_follow_up_date ?? "",
      owner_name: record.owner_name ?? "",
      blocker_reason: record.blocker_reason ?? "",
      notes: record.notes ?? "",
    });
  }, [open, record]);

  async function save() {
    setSaving(true);
    try {
      await updateCredRecord(
        record.id,
        {
          payer_name: form.payer_name.trim() || record.payer_name,
          state: form.state || null,
          plan_type: form.plan_type || null,
          credentialing_type: form.credentialing_type,
          priority: form.priority,
          payer_reference_number: form.payer_reference_number || null,
          submitted_date: form.submitted_date || null,
          approved_date: form.approved_date || null,
          effective_date: form.effective_date || null,
          expiration_date: form.expiration_date || null,
          next_follow_up_date: form.next_follow_up_date || null,
          owner_name: form.owner_name || null,
          blocker_reason: form.blocker_reason || null,
          notes: form.notes || null,
        },
        { type: "record_edit", message: "Record fields edited" },
      );
      toast.success("Record updated");
      onSaved();
      onOpenChange(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit credentialing record</DialogTitle>
          <DialogDescription>Update key fields. An activity entry is written for traceability.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Payer</Label><Input value={form.payer_name} onChange={(e) => setForm({ ...form, payer_name: e.target.value })} /></div>
          <div>
            <Label>State</Label>
            <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Plan type</Label><Input value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value })} /></div>
          <div>
            <Label>Credentialing type</Label>
            <Select value={form.credentialing_type} onValueChange={(v) => setForm({ ...form, credentialing_type: v as CredType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as CredPriority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Payer reference #</Label><Input value={form.payer_reference_number} onChange={(e) => setForm({ ...form, payer_reference_number: e.target.value })} /></div>
          <div><Label>Submitted</Label><Input type="date" value={form.submitted_date} onChange={(e) => setForm({ ...form, submitted_date: e.target.value })} /></div>
          <div><Label>Approved</Label><Input type="date" value={form.approved_date} onChange={(e) => setForm({ ...form, approved_date: e.target.value })} /></div>
          <div><Label>Effective</Label><Input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} /></div>
          <div><Label>Expiration</Label><Input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} /></div>
          <div><Label>Next follow-up</Label><Input type="date" value={form.next_follow_up_date} onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })} /></div>
          <div><Label>Owner</Label><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></div>
          <div className="col-span-2"><Label>Blocker reason</Label><Input value={form.blocker_reason} onChange={(e) => setForm({ ...form, blocker_reason: e.target.value })} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Edit Provider dialog                                                       */
/* -------------------------------------------------------------------------- */
function EditProviderDialog({ open, onOpenChange, provider, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  provider: CredentialingProvider; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    provider_name: provider.provider_name,
    provider_type: provider.provider_type,
    email: provider.email ?? "",
    phone: provider.phone ?? "",
    npi: provider.npi ?? "",
    caqh_id: provider.caqh_id ?? "",
    license_number: provider.license_number ?? "",
    license_state: provider.license_state ?? "GA",
    license_expiration_date: provider.license_expiration_date ?? "",
    centralreach_provider_id: provider.centralreach_provider_id ?? "",
    active: provider.active,
    notes: provider.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setForm({
      provider_name: provider.provider_name,
      provider_type: provider.provider_type,
      email: provider.email ?? "",
      phone: provider.phone ?? "",
      npi: provider.npi ?? "",
      caqh_id: provider.caqh_id ?? "",
      license_number: provider.license_number ?? "",
      license_state: provider.license_state ?? "GA",
      license_expiration_date: provider.license_expiration_date ?? "",
      centralreach_provider_id: provider.centralreach_provider_id ?? "",
      active: provider.active,
      notes: provider.notes ?? "",
    });
  }, [open, provider]);

  async function save() {
    if (!form.provider_name.trim()) { toast.error("Provider name is required"); return; }
    setSaving(true);
    try {
      await updateCredProvider(provider.id, {
        provider_name: form.provider_name.trim(),
        provider_type: form.provider_type,
        email: form.email || null, phone: form.phone || null,
        npi: form.npi || null, caqh_id: form.caqh_id || null,
        license_number: form.license_number || null,
        license_state: form.license_state || null,
        license_expiration_date: form.license_expiration_date || null,
        centralreach_provider_id: form.centralreach_provider_id || null,
        active: form.active, notes: form.notes || null,
      });
      toast.success("Provider updated");
      onSaved();
      onOpenChange(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit provider</DialogTitle>
          <DialogDescription>Update provider profile fields. Deactivate instead of deleting.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Provider name</Label><Input value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} /></div>
          <div>
            <Label>Type</Label>
            <Select value={form.provider_type} onValueChange={(v) => setForm({ ...form, provider_type: v as CredProviderType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_PROVIDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>License state</Label>
            <Select value={form.license_state} onValueChange={(v) => setForm({ ...form, license_state: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>NPI</Label><Input value={form.npi} onChange={(e) => setForm({ ...form, npi: e.target.value })} /></div>
          <div><Label>CAQH ID</Label><Input value={form.caqh_id} onChange={(e) => setForm({ ...form, caqh_id: e.target.value })} /></div>
          <div><Label>License number</Label><Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
          <div><Label>License expiration</Label><Input type="date" value={form.license_expiration_date} onChange={(e) => setForm({ ...form, license_expiration_date: e.target.value })} /></div>
          <div><Label>CentralReach provider id</Label><Input value={form.centralreach_provider_id} onChange={(e) => setForm({ ...form, centralreach_provider_id: e.target.value })} /></div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label className="!mt-0">Active</Label>
          </div>
          <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save provider"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Provider Detail Sheet (used by Providers page + BCBA page)                 */
/* -------------------------------------------------------------------------- */
function ProviderDetailSheet({
  providerId, providers, records, documents, tasks,
  onClose, onChanged, onOpenRecord, onStartCredentialing,
}: {
  providerId: string | null;
  providers: CredentialingProvider[];
  records: CredentialingRecord[];
  documents: CredentialingDocument[];
  tasks: ReturnType<typeof useCredentialingData>["tasks"];
  onClose: () => void;
  onChanged: () => void;
  onOpenRecord: (id: string) => void;
  onStartCredentialing: (providerId: string) => void;
}) {
  const provider = useMemo(() => providers.find((p) => p.id === providerId) ?? null, [providers, providerId]);
  const [editOpen, setEditOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const provRecords = useMemo(
    () => (provider ? records.filter((r) => r.provider_id === provider.id) : []),
    [records, provider],
  );
  const provDocs = useMemo(
    () => (provider ? documents.filter((d) => d.provider_id === provider.id) : []),
    [documents, provider],
  );
  const provRecordIds = useMemo(() => new Set(provRecords.map((r) => r.id)), [provRecords]);
  const provTasks = useMemo(
    () => tasks.filter((t) => t.status !== "Done" && t.credentialing_record_id && provRecordIds.has(t.credentialing_record_id)),
    [tasks, provRecordIds],
  );

  async function toggleActive() {
    if (!provider) return;
    try {
      const nowActive = !provider.active;
      await updateCredProvider(
        provider.id,
        { active: nowActive },
        {
          type: "provider_active_change",
          message: nowActive ? "Provider reactivated" : "Provider deactivated",
          old: provider.active ? "Active" : "Inactive",
          new: nowActive ? "Active" : "Inactive",
        },
      );
      toast.success(provider.active ? "Provider deactivated" : "Provider reactivated");
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <Sheet open={!!provider} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {provider ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {provider.provider_name}
                {!provider.active ? <Badge variant="outline">Inactive</Badge> : null}
              </SheetTitle>
              <SheetDescription>
                {provider.provider_type}{provider.license_state ? ` · ${provider.license_state}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>Edit provider</Button>
              <Button size="sm" onClick={() => onStartCredentialing(provider.id)}>
                <Plus className="h-3.5 w-3.5 mr-1" />Start credentialing
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDocOpen(true)}>
                <FileText className="h-3.5 w-3.5 mr-1" />Add document
              </Button>
              <Button size="sm" variant={provider.active ? "outline" : "default"} onClick={toggleActive}>
                {provider.active ? "Deactivate" : "Reactivate"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
              <Field label="Email" value={provider.email} />
              <Field label="Phone" value={provider.phone} />
              <Field label="NPI" value={provider.npi} />
              <Field label="CAQH ID" value={provider.caqh_id} />
              <Field label="License #" value={provider.license_number} />
              <Field label="License state" value={provider.license_state} />
              <Field label="License exp" value={provider.license_expiration_date} />
              <Field label="CentralReach provider id" value={provider.centralreach_provider_id} />
            </div>
            {provider.notes ? (
              <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{provider.notes}</div>
            ) : null}

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Credentialing records ({provRecords.length})
              </div>
              {provRecords.length === 0 ? (
                <div className="text-sm text-muted-foreground">No payer records yet.</div>
              ) : (
                <div className="divide-y rounded-lg border border-border/60 overflow-hidden">
                  {provRecords.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpenRecord(r.id)}
                      className="w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{r.payer_name} · {r.state ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.credentialing_type}
                          {r.expiration_date ? ` · exp ${r.expiration_date}` : ""}
                          {r.next_follow_up_date ? ` · follow-up ${r.next_follow_up_date}` : ""}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Documents ({provDocs.length})
              </div>
              {provDocs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No documents on file.</div>
              ) : (
                <ul className="text-sm space-y-1">
                  {provDocs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 border-b border-border/60 py-1.5">
                      <span className="truncate">{d.document_type}{d.file_name ? ` · ${d.file_name}` : ""}</span>
                      <Badge variant="outline" className="text-[10px]">{d.verification_status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Open tasks ({provTasks.length})
              </div>
              {provTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No open tasks.</div>
              ) : (
                <ul className="text-sm space-y-1">
                  {provTasks.map((t) => (
                    <li key={t.id} className="border-b border-border/60 py-1.5">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.owner_name ?? "Unassigned"}{t.due_date ? ` · due ${t.due_date}` : ""} · {t.status}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <EditProviderDialog open={editOpen} onOpenChange={setEditOpen} provider={provider} onSaved={onChanged} />
            <AddDocumentDialog
              open={docOpen} onOpenChange={setDocOpen}
              recordId={null} providerId={provider.id} onCreated={onChanged}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Payer / State Detail Sheet (Insurance page drilldown)                      */
/* -------------------------------------------------------------------------- */
function PayerStateDetailSheet({
  open, onClose, payer, state, records, providerById, onOpenRecord, onAddRecord,
}: {
  open: boolean; onClose: () => void;
  payer: string | null; state: string | null;
  records: CredentialingRecord[];
  providerById: Map<string, CredentialingProvider>;
  onOpenRecord: (id: string) => void;
  onAddRecord: (payer: string, state: string) => void;
}) {
  const rows = useMemo(() => {
    if (!payer) return [];
    return records.filter((r) => r.payer_name === payer && (r.state ?? "—") === (state ?? "—"));
  }, [records, payer, state]);
  const credentialed = rows.filter((r) => APPROVED_CRED_STATUSES.includes(r.status)).length;
  const blocked = rows.filter((r) => r.status === "Blocked" || r.status === "Denied").length;
  const pending = rows.filter((r) => ACTIVE_CRED_STATUSES.includes(r.status)).length;
  const expiring = rows.filter((r) => { const d = daysUntil(r.expiration_date); return d !== null && d >= 0 && d <= 90; }).length;

  function exportRows() {
    exportCsv(`${payer ?? "payer"}-${state ?? "state"}.csv`, rows.map((r) => ({
      provider: providerById.get(r.provider_id)?.provider_name ?? "",
      payer: r.payer_name,
      state: r.state ?? "",
      status: r.status,
      type: r.credentialing_type,
      owner: r.owner_name ?? "",
      submitted: r.submitted_date ?? "",
      approved: r.approved_date ?? "",
      expiration: r.expiration_date ?? "",
      next_follow_up: r.next_follow_up_date ?? "",
      blocker_reason: r.blocker_reason ?? "",
    })));
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {payer ? (
          <>
            <SheetHeader>
              <SheetTitle>{payer} · {state ?? "—"}</SheetTitle>
              <SheetDescription>All credentialing records for this payer/state.</SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-5 gap-2 mt-4">
              <KpiCard label="Total" value={rows.length} />
              <KpiCard label="Credentialed" value={credentialed} tone="ok" />
              <KpiCard label="Pending" value={pending} />
              <KpiCard label="Blocked" value={blocked} tone="danger" />
              <KpiCard label="Expiring" value={expiring} tone="warn" />
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => onAddRecord(payer, state ?? "")}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add credentialing record
              </Button>
              <Button size="sm" variant="outline" onClick={exportRows}>
                <Download className="h-3.5 w-3.5 mr-1" />Export CSV
              </Button>
            </div>

            <div className="mt-5 divide-y rounded-lg border border-border/60 overflow-hidden">
              {rows.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No records yet for this payer/state.</div>
              ) : rows.map((r) => {
                const p = providerById.get(r.provider_id);
                return (
                  <button
                    key={r.id} onClick={() => onOpenRecord(r.id)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p?.provider_name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.owner_name ? `Owner ${r.owner_name}` : "Unassigned"}
                        {r.next_follow_up_date ? ` · follow-up ${r.next_follow_up_date}` : ""}
                        {r.blocker_reason ? ` · ${r.blocker_reason}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Document download helper                                                   */
/* -------------------------------------------------------------------------- */
async function openCredDocument(doc: CredentialingDocument) {
  if (!doc.storage_path) {
    toast.message("No file attached — metadata only");
    return;
  }
  const url = await getCredDocumentSignedUrl(doc.storage_path, 300);
  if (!url) { toast.error("Could not generate download link"); return; }
  window.open(url, "_blank", "noopener");
}

/* -------------------------------------------------------------------------- */
/* CSV export helper                                                          */
/* -------------------------------------------------------------------------- */
function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) { toast.message("Nothing to export"); return; }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------- */
/* Legacy import dialog (va_credentialing_raw -> normalized records)          */
/* -------------------------------------------------------------------------- */
function LegacyImportDialog({ open, onOpenChange, onImported }: {
  open: boolean; onOpenChange: (v: boolean) => void; onImported: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LegacyRawRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LegacyImportPreview | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows([]); setError(null); setPreview(null); setLoading(true);
    fetchLegacyRaw(500)
      .then(async (data) => {
        setRows(data);
        try { setPreview(await previewLegacyImport(data)); } catch { /* ignore */ }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load legacy data"))
      .finally(() => setLoading(false));
  }, [open]);

  async function runImport() {
    setImporting(true);
    try {
      const result = await importLegacyRows(rows);
      toast.success(`Legacy import: ${result.providersCreated} providers, ${result.recordsCreated} records (${result.skipped} skipped)`);
      onImported();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally { setImporting(false); }
  }

  const sample = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import legacy credentialing data</DialogTitle>
          <DialogDescription>
            Reads from the raw legacy credentialing table and normalizes providers/payer records.
            Raw rows are preserved.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="text-sm text-muted-foreground py-6">Loading legacy rows…</div>
        ) : error ? (
          <div className="text-sm text-red-600 py-4">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">No legacy rows found.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm">
              <strong>{rows.length}</strong> legacy row{rows.length === 1 ? "" : "s"} available.
            </div>
            {preview ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="rounded-lg border border-border/60 p-2"><div className="text-muted-foreground">Total rows</div><div className="font-medium text-sm">{preview.totalRows}</div></div>
                <div className="rounded-lg border border-border/60 p-2"><div className="text-muted-foreground">Already imported</div><div className="font-medium text-sm">{preview.alreadyImported}</div></div>
                <div className="rounded-lg border border-border/60 p-2"><div className="text-muted-foreground">New providers</div><div className="font-medium text-sm">{preview.willCreateProviders}</div></div>
                <div className="rounded-lg border border-border/60 p-2"><div className="text-muted-foreground">New records</div><div className="font-medium text-sm">{preview.willCreateRecords}</div></div>
                <div className="rounded-lg border border-border/60 p-2"><div className="text-muted-foreground">Missing provider/payer</div><div className="font-medium text-sm">{preview.missingProviderOrPayer}</div></div>
              </div>
            ) : null}
            <div className="overflow-auto max-h-60 border rounded-lg text-xs">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr>{Object.keys(sample[0] ?? {}).slice(0, 6).map((k) => (
                    <th key={k} className="text-left px-2 py-1 font-medium">{k}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {sample.map((r, i) => (
                    <tr key={i} className="border-t border-border/60">
                      {Object.keys(sample[0] ?? {}).slice(0, 6).map((k) => (
                        <td key={k} className="px-2 py-1 text-muted-foreground truncate max-w-[14ch]">
                          {String((r as Record<string, unknown>)[k] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Rows already imported (matched on legacy id) are skipped automatically. Running this import multiple times is safe.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={runImport} disabled={importing || loading || rows.length === 0}>
            {importing ? "Importing…" : `Import ${rows.length} row${rows.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Page 1: Dashboard                                                          */
/* -------------------------------------------------------------------------- */
export function CredentialingDashboardPage() {
  const { providers, records, providerById, loading, error, reload, tasks, documents } = useCredentialingData();
  const [addProv, setAddProv] = useState(false);
  const [addRec, setAddRec] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [payerFilter, setPayerFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [providerTypeFilter, setProviderTypeFilter] = useState<string>("ALL");
  const [crSyncFilter, setCrSyncFilter] = useState<string>("ALL");
  const [savedView, setSavedView] = useState<string>("all");
  const [missingOnly, setMissingOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [crNotReady, setCrNotReady] = useState(false);
  const [readyToSync, setReadyToSync] = useState(false);

  // Saved view presets (operational filter shortcuts)
  const applyView = (id: string) => {
    setSavedView(id);
    // Reset secondary toggles before applying
    setMissingOnly(false); setOverdueOnly(false); setCrNotReady(false); setReadyToSync(false);
    setStatusFilter("ALL");
    switch (id) {
      case "missing-info": setStatusFilter("Missing Info"); setMissingOnly(true); break;
      case "blocked-denied": setStatusFilter("Denied"); break;
      case "overdue-followups": setOverdueOnly(true); break;
      case "expiring-30": /* handled in filter below via savedView */ break;
      case "cr-not-ready": setCrNotReady(true); break;
      case "ready-to-sync": setReadyToSync(true); break;
      case "my-open-work":
      case "uncredentialed-bcbas":
      case "all":
      default: break;
    }
  };

  const clearFilters = () => {
    setSavedView("all"); setStateFilter("ALL"); setStatusFilter("ALL"); setPayerFilter("");
    setTypeFilter("ALL"); setOwnerFilter(""); setProviderTypeFilter("ALL"); setCrSyncFilter("ALL");
    setMissingOnly(false); setOverdueOnly(false); setCrNotReady(false); setReadyToSync(false);
  };

  const filtered = useMemo(() => records.filter((r) => {
    const prov = providerById.get(r.provider_id);
    const q = payerFilter.toLowerCase();
    const matchesQ = !q || r.payer_name.toLowerCase().includes(q) || (prov?.provider_name.toLowerCase().includes(q) ?? false);
    return (
      matchesQ &&
      (stateFilter === "ALL" || r.state === stateFilter) &&
      (statusFilter === "ALL" || r.status === statusFilter) &&
      (typeFilter === "ALL" || r.credentialing_type === typeFilter) &&
      (!ownerFilter || (r.owner_name ?? "").toLowerCase().includes(ownerFilter.toLowerCase())) &&
      (providerTypeFilter === "ALL" || prov?.provider_type === providerTypeFilter) &&
      (crSyncFilter === "ALL" || r.centralreach_sync_status === crSyncFilter) &&
      (!missingOnly || r.status === "Missing Info" || (r.missing_items?.length ?? 0) > 0) &&
      (!overdueOnly || (() => { const d = daysUntil(r.next_follow_up_date); return d !== null && d < 0; })()) &&
      (!crNotReady || r.centralreach_sync_status !== "Synced") &&
      (!readyToSync || (r.centralreach_sync_status === "Ready To Sync" && APPROVED_CRED_STATUSES.includes(r.status))) &&
      (savedView !== "expiring-30" || (() => { const d = daysUntil(r.expiration_date); return d !== null && d >= 0 && d <= 30; })())
    );
  }), [records, providerById, stateFilter, statusFilter, payerFilter, typeFilter, ownerFilter, providerTypeFilter, crSyncFilter, missingOnly, overdueOnly, crNotReady, readyToSync, savedView]);

  const activeFilterCount = (
    (stateFilter !== "ALL" ? 1 : 0) +
    (statusFilter !== "ALL" ? 1 : 0) +
    (payerFilter ? 1 : 0) +
    (typeFilter !== "ALL" ? 1 : 0) +
    (ownerFilter ? 1 : 0) +
    (providerTypeFilter !== "ALL" ? 1 : 0) +
    (crSyncFilter !== "ALL" ? 1 : 0) +
    (missingOnly ? 1 : 0) +
    (overdueOnly ? 1 : 0) +
    (crNotReady ? 1 : 0) +
    (readyToSync ? 1 : 0) +
    (savedView !== "all" ? 1 : 0)
  );

  const kpis = useMemo(() => {
    const inProgress = records.filter((r) => ACTIVE_CRED_STATUSES.includes(r.status)).length;
    const submitted = records.filter((r) => r.status === "Submitted" || r.status === "Payer Follow-Up").length;
    const missing = records.filter((r) => r.status === "Missing Info").length;
    const exp30 = records.filter((r) => { const d = daysUntil(r.expiration_date); return d !== null && d >= 0 && d <= 30; }).length;
    const exp60 = records.filter((r) => { const d = daysUntil(r.expiration_date); return d !== null && d >= 0 && d <= 60; }).length;
    const exp90 = records.filter((r) => { const d = daysUntil(r.expiration_date); return d !== null && d >= 0 && d <= 90; }).length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const approvedMonth = records.filter((r) => r.approved_date && r.approved_date.startsWith(thisMonth)).length;
    const overdueFollowUps = records.filter((r) => {
      const d = daysUntil(r.next_follow_up_date); return d !== null && d < 0;
    }).length;
    const bcbaProviders = providers.filter((p) => p.provider_type === "BCBA" && p.active);
    const bcbaWithCoverage = new Set(records.filter((r) => APPROVED_CRED_STATUSES.includes(r.status)).map((r) => r.provider_id));
    const uncredentialedBcbas = bcbaProviders.filter((p) => !bcbaWithCoverage.has(p.id)).length;
    return {
      activeProviders: providers.filter((p) => p.active).length,
      inProgress, submitted, missing, exp30, exp60, exp90,
      approvedMonth, overdueFollowUps, uncredentialedBcbas,
    };
  }, [records, providers]);

  return (
    <Shell>
      <PageHeader
        eyebrow="Credentialing"
        title="Credentialing Dashboard"
        subtitle="Provider and payer credentialing readiness across every state."
        icon={Stethoscope}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={reload}><RefreshCw className="h-4 w-4 mr-1.5" />Refresh</Button>
            <Button size="sm" variant="outline" onClick={() => exportCsv("credentialing-records.csv", filtered as unknown as Record<string, unknown>[])}>
              <Download className="h-4 w-4 mr-1.5" />Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLegacyOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" />Import legacy data
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAddProv(true)}><Plus className="h-4 w-4 mr-1.5" />Add provider</Button>
            <Button size="sm" onClick={() => setAddRec(true)}><Plus className="h-4 w-4 mr-1.5" />Add credentialing record</Button>
          </>
        }
      />
      <LoadErr loading={loading} error={error} />

      <FromReportsBanner />

      <SavedViewsBar
        pageKey="dashboard"
        activeId={savedView}
        builtIns={[
          { id: "all", label: "All records" },
          { id: "my-open-work", label: "My open work" },
          { id: "missing-info", label: "Missing Info" },
          { id: "blocked-denied", label: "Blocked / Denied" },
          { id: "overdue-followups", label: "Overdue Follow-Ups" },
          { id: "expiring-30", label: "Expiring in 30 Days" },
          { id: "cr-not-ready", label: "CentralReach Not Ready" },
          { id: "ready-to-sync", label: "Ready To Sync" },
          { id: "uncredentialed-bcbas", label: "Uncredentialed BCBAs" },
        ]}
        onApplyBuiltIn={applyView}
        currentFilters={{
          stateFilter, statusFilter, payerFilter, typeFilter, ownerFilter,
          providerTypeFilter, crSyncFilter, missingOnly, overdueOnly, crNotReady, readyToSync, savedView,
        }}
        onApplyCustom={(f) => {
          setStateFilter(f.stateFilter ?? "ALL");
          setStatusFilter(f.statusFilter ?? "ALL");
          setPayerFilter(f.payerFilter ?? "");
          setTypeFilter(f.typeFilter ?? "ALL");
          setOwnerFilter(f.ownerFilter ?? "");
          setProviderTypeFilter(f.providerTypeFilter ?? "ALL");
          setCrSyncFilter(f.crSyncFilter ?? "ALL");
          setMissingOnly(!!f.missingOnly);
          setOverdueOnly(!!f.overdueOnly);
          setCrNotReady(!!f.crNotReady);
          setReadyToSync(!!f.readyToSync);
          setSavedView(f.savedView ?? "all");
        }}
        hasActiveFilters={activeFilterCount > 0}
        onClear={clearFilters}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active providers" value={kpis.activeProviders} tone="ok" />
        <KpiCard label="In progress" value={kpis.inProgress} tone="warn" />
        <KpiCard label="Submitted · awaiting payer" value={kpis.submitted} />
        <KpiCard label="Missing info" value={kpis.missing} tone="warn" />
        <KpiCard label="Uncredentialed BCBAs" value={kpis.uncredentialedBcbas} tone="danger" />
        <KpiCard label="Expiring < 30 days" value={kpis.exp30} tone="danger" />
        <KpiCard label="Expiring < 60 days" value={kpis.exp60} tone="warn" hint={`<90d: ${kpis.exp90}`} />
        <KpiCard label="Approved this month" value={kpis.approvedMonth} tone="ok" hint={`Overdue follow-ups: ${kpis.overdueFollowUps}`} />
      </div>

      <SectionCard
        title="Credentialing records"
        description="All payer/state credentialing work, filterable."
        action={
          <div className="flex flex-wrap gap-2 items-center justify-end">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input placeholder="Provider or payer…" className="h-9 pl-7 w-52" value={payerFilter} onChange={(e) => setPayerFilter(e.target.value)} />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="h-9 w-28"><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">All states</SelectItem>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">All statuses</SelectItem>{CRED_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">All types</SelectItem>{CRED_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={providerTypeFilter} onValueChange={setProviderTypeFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Provider type" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">All providers</SelectItem>{CRED_PROVIDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={crSyncFilter} onValueChange={setCrSyncFilter}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="CentralReach" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">CR: any status</SelectItem>
                {(["Not Connected","Ready To Sync","Synced","Sync Error"] as const).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Owner…" className="h-9 w-32" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} />
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
              <Switch checked={missingOnly} onCheckedChange={setMissingOnly} /> Missing items
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
              <Switch checked={overdueOnly} onCheckedChange={setOverdueOnly} /> Overdue
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
              <Switch checked={readyToSync} onCheckedChange={setReadyToSync} /> Ready to sync
            </label>
          </div>
        }
      >
        {filtered.length === 0 ? (
          activeFilterCount > 0 ? (
            <Empty
              title="No records match these filters"
              action={<Button size="sm" variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-1" />Clear filters</Button>}
            />
          ) : (
            <Empty title="No credentialing records yet" action={
              <Button size="sm" onClick={() => setAddRec(true)}><Plus className="h-4 w-4 mr-1" />Create credentialing record</Button>
            } />
          )
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Provider","Payer","State","Type","Status","Submitted","Expires","Next follow-up",""].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2.5">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const p = providerById.get(r.provider_id);
                  return (
                    <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30 cursor-pointer" onClick={() => setOpenRecord(r.id)}>
                      <td className="px-3 py-2.5 font-medium">{p?.provider_name ?? "Unknown"}</td>
                      <td className="px-3 py-2.5">{r.payer_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.state ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.credentialing_type}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.submitted_date ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.expiration_date ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.next_follow_up_date ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOpenRecord(r.id); }}>Open</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <AddProviderDialog open={addProv} onOpenChange={setAddProv} onCreated={reload} />
      <AddRecordDialog open={addRec} onOpenChange={setAddRec} providers={providers} onCreated={reload} />
      <LegacyImportDialog open={legacyOpen} onOpenChange={setLegacyOpen} onImported={reload} />
      <RecordDetailSheet
        recordId={openRecord} records={records} providerById={providerById}
        tasks={tasks} documents={documents}
        onClose={() => setOpenRecord(null)} onChanged={reload}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Page 2: Provider workspace                                                 */
/* -------------------------------------------------------------------------- */
export function ProviderCredentialingPage() {
  const { providers, records, loading, error, reload, providerById, tasks, documents } = useCredentialingData();
  const [addProv, setAddProv] = useState(false);
  const [addRec, setAddRec] = useState(false);
  const [defaultProv, setDefaultProv] = useState<string | undefined>();
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [openProvider, setOpenProvider] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [providerType, setProviderType] = useState<string>("ALL");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [expWindow, setExpWindow] = useState<"any" | "30" | "60" | "90">("any");
  const [missingCr, setMissingCr] = useState(false);
  const [missingDocs, setMissingDocs] = useState(false);

  const list = useMemo(() => providers.filter((p) => {
    const query = q.trim().toLowerCase();
    const matchesQ = !query
      || p.provider_name.toLowerCase().includes(query)
      || (p.npi ?? "").toLowerCase().includes(query)
      || (p.caqh_id ?? "").toLowerCase().includes(query)
      || (p.license_number ?? "").toLowerCase().includes(query);
    if (!matchesQ) return false;
    if (providerType !== "ALL" && p.provider_type !== providerType) return false;
    if (stateFilter !== "ALL" && p.license_state !== stateFilter) return false;
    if (active === "active" && !p.active) return false;
    if (active === "inactive" && p.active) return false;
    if (expWindow !== "any") {
      const d = daysUntil(p.license_expiration_date);
      const w = Number(expWindow);
      if (d === null || d < 0 || d > w) return false;
    }
    if (missingCr && p.centralreach_provider_id) return false;
    if (missingDocs) {
      const hasDocs = documents.some((d) => d.provider_id === p.id);
      if (hasDocs) return false;
    }
    return true;
  }), [providers, documents, q, providerType, stateFilter, active, expWindow, missingCr, missingDocs]);

  const hasFilters = !!q || providerType !== "ALL" || stateFilter !== "ALL" || active !== "all" || expWindow !== "any" || missingCr || missingDocs;
  const clearFilters = () => {
    setQ(""); setProviderType("ALL"); setStateFilter("ALL"); setActive("all");
    setExpWindow("any"); setMissingCr(false); setMissingDocs(false);
  };

  function startFor(providerId: string) { setDefaultProv(providerId); setAddRec(true); }

  return (
    <Shell>
      <PageHeader
        eyebrow="Credentialing"
        title="Provider Credentialing"
        subtitle="Provider directory with payer/state coverage, licensing, and CentralReach readiness."
        icon={Stethoscope}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => exportCsv("providers.csv", list as unknown as Record<string, unknown>[])}>
              <Download className="h-4 w-4 mr-1.5" />Export CSV
            </Button>
            <Button size="sm" onClick={() => setAddProv(true)}><Plus className="h-4 w-4 mr-1.5" />Add provider</Button>
          </>
        }
      />
      <LoadErr loading={loading} error={error} />
      <FromReportsBanner />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-sm w-full">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, NPI, CAQH, license…" className="pl-7 h-9" />
        </div>
        <Select value={providerType} onValueChange={setProviderType}>
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All types</SelectItem>{CRED_PROVIDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-9 w-28"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All states</SelectItem>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={active} onValueChange={(v) => setActive(v as "all" | "active" | "inactive")}>
          <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={expWindow} onValueChange={(v) => setExpWindow(v as "any" | "30" | "60" | "90")}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="License expiring" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">License: any</SelectItem>
            <SelectItem value="30">Expiring &lt; 30 days</SelectItem>
            <SelectItem value="60">Expiring &lt; 60 days</SelectItem>
            <SelectItem value="90">Expiring &lt; 90 days</SelectItem>
          </SelectContent>
        </Select>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={missingCr} onCheckedChange={setMissingCr} /> Missing CR ID
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={missingDocs} onCheckedChange={setMissingDocs} /> Missing docs
        </label>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Clear</Button>
        )}
      </div>
      <SectionCard title={`${list.length} provider${list.length === 1 ? "" : "s"}`} description="Each row shows credentialing posture across payers.">
        {list.length === 0 ? (
          hasFilters ? (
            <Empty
              title="No providers match these filters"
              description="Try clearing filters or widening your search."
              action={<Button size="sm" variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-1" />Clear filters</Button>}
            />
          ) : (
            <Empty
              title="No providers yet"
              description="Add clinicians and other credentialable staff so you can start tracking payer coverage, licensing, and CentralReach IDs."
              action={<Button size="sm" onClick={() => setAddProv(true)}><Plus className="h-4 w-4 mr-1" />Add provider</Button>}
            />
          )
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Provider","Type","State / license","NPI","CAQH","Active records","Missing items","Expiring","CentralReach",""].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2.5">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const provRecs = records.filter((r) => r.provider_id === p.id);
                  const active = provRecs.filter((r) => ACTIVE_CRED_STATUSES.includes(r.status)).length;
                  const missing = provRecs.reduce((n, r) => n + (r.missing_items?.length ?? 0), 0);
                  const expiring = provRecs.filter((r) => { const d = daysUntil(r.expiration_date); return d !== null && d >= 0 && d <= 90; }).length;
                  const cr = p.centralreach_provider_id ? "ID present" : "Not Connected";
                  return (
                    <tr key={p.id} className="border-t border-border/60 hover:bg-muted/30 cursor-pointer" onClick={() => setOpenProvider(p.id)}>
                      <td className="px-3 py-2.5 font-medium">{p.provider_name}{!p.active && <Badge variant="outline" className="ml-2 text-[10px]">Inactive</Badge>}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.provider_type}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.license_state ?? "—"} {p.license_number ? `· ${p.license_number}` : ""}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.npi ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.caqh_id ?? "—"}</td>
                      <td className="px-3 py-2.5">{active}</td>
                      <td className="px-3 py-2.5">{missing}</td>
                      <td className="px-3 py-2.5">{expiring}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={cr} /></td>
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => startFor(p.id)}>Start credentialing</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <AddProviderDialog open={addProv} onOpenChange={setAddProv} onCreated={reload} />
      <AddRecordDialog open={addRec} onOpenChange={setAddRec} providers={providers} defaultProviderId={defaultProv} onCreated={() => { setDefaultProv(undefined); reload(); }} />
      <RecordDetailSheet recordId={openRecord} records={records} providerById={providerById} tasks={tasks} documents={documents} onClose={() => setOpenRecord(null)} onChanged={reload} />
      <ProviderDetailSheet
        providerId={openProvider} providers={providers} records={records}
        documents={documents} tasks={tasks}
        onClose={() => setOpenProvider(null)} onChanged={reload}
        onOpenRecord={(id) => { setOpenProvider(null); setOpenRecord(id); }}
        onStartCredentialing={(pid) => { setOpenProvider(null); startFor(pid); }}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Page 3: Insurance / Payer matrix                                           */
/* -------------------------------------------------------------------------- */
export function InsuranceCredentialingPage() {
  const { providers, records, providerById, loading, error, reload, tasks, documents } = useCredentialingData();
  const [addRec, setAddRec] = useState(false);
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [matrixSel, setMatrixSel] = useState<{ payer: string; state: string } | null>(null);
  const [defaultPayer, setDefaultPayer] = useState<string | undefined>();
  const [defaultState, setDefaultState] = useState<string | undefined>();
  const [payerQ, setPayerQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [gapsOnly, setGapsOnly] = useState(false);

  const filteredRecords = useMemo(() => records.filter((r) => {
    const q = payerQ.trim().toLowerCase();
    if (q && !r.payer_name.toLowerCase().includes(q)) return false;
    if (stateFilter !== "ALL" && r.state !== stateFilter) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && r.credentialing_type !== typeFilter) return false;
    if (pendingOnly && !ACTIVE_CRED_STATUSES.includes(r.status)) return false;
    if (blockedOnly && !(r.status === "Blocked" || r.status === "Denied")) return false;
    if (expiringOnly) {
      const d = daysUntil(r.expiration_date);
      if (d === null || d < 0 || d > 90) return false;
    }
    return true;
  }), [records, payerQ, stateFilter, statusFilter, typeFilter, pendingOnly, blockedOnly, expiringOnly]);

  const hasFilters = !!payerQ || stateFilter !== "ALL" || statusFilter !== "ALL" || typeFilter !== "ALL" || pendingOnly || blockedOnly || expiringOnly || gapsOnly;
  const clearFilters = () => {
    setPayerQ(""); setStateFilter("ALL"); setStatusFilter("ALL"); setTypeFilter("ALL");
    setPendingOnly(false); setBlockedOnly(false); setExpiringOnly(false); setGapsOnly(false);
  };

  const matrix = useMemo(() => {
    const map = new Map<string, {
      payer: string; state: string; required: number; credentialed: number;
      pending: number; blocked: number; expiring: number; nextFollowUp: string | null;
    }>();
    filteredRecords.forEach((r) => {
      const key = `${r.payer_name}|${r.state ?? "—"}`;
      let row = map.get(key);
      if (!row) {
        row = { payer: r.payer_name, state: r.state ?? "—", required: 0, credentialed: 0, pending: 0, blocked: 0, expiring: 0, nextFollowUp: null };
        map.set(key, row);
      }
      row.required += 1;
      if (APPROVED_CRED_STATUSES.includes(r.status)) row.credentialed += 1;
      else if (r.status === "Blocked" || r.status === "Denied") row.blocked += 1;
      else if (ACTIVE_CRED_STATUSES.includes(r.status)) row.pending += 1;
      const d = daysUntil(r.expiration_date);
      if (d !== null && d >= 0 && d <= 90) row.expiring += 1;
      if (r.next_follow_up_date && (!row.nextFollowUp || r.next_follow_up_date < row.nextFollowUp)) {
        row.nextFollowUp = r.next_follow_up_date;
      }
    });
    let rows = Array.from(map.values());
    if (gapsOnly) rows = rows.filter((r) => r.credentialed < r.required);
    return rows.sort((a, b) => (b.blocked - a.blocked) || (b.pending - a.pending));
  }, [filteredRecords, gapsOnly]);

  return (
    <Shell>
      <PageHeader
        eyebrow="Credentialing" title="Insurance Credentialing"
        subtitle="Payer + state credentialing matrix. See which payers are blocking growth or authorizations."
        icon={Building2}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => exportCsv("payer-matrix.csv", matrix as unknown as Record<string, unknown>[])}>
              <Download className="h-4 w-4 mr-1.5" />Export CSV
            </Button>
            <Button size="sm" onClick={() => setAddRec(true)}><Plus className="h-4 w-4 mr-1.5" />Add payer credentialing record</Button>
          </>
        }
      />
      <LoadErr loading={loading} error={error} />
      <FromReportsBanner />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-xs w-full">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input value={payerQ} onChange={(e) => setPayerQ(e.target.value)} placeholder="Search payer…" className="pl-7 h-9" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-9 w-28"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All states</SelectItem>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All statuses</SelectItem>{CRED_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All types</SelectItem>{CRED_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={pendingOnly} onCheckedChange={setPendingOnly} /> Pending
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={blockedOnly} onCheckedChange={setBlockedOnly} /> Blocked/Denied
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={expiringOnly} onCheckedChange={setExpiringOnly} /> Expiring &lt; 90d
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={gapsOnly} onCheckedChange={setGapsOnly} /> Gaps only
        </label>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Clear</Button>
        )}
      </div>
      <SectionCard title="Payer / state posture" description={`${matrix.length} payer-state combinations.`}>
        {matrix.length === 0 ? (
          hasFilters || records.length > 0 ? (
            <Empty
              title="No records match these filters"
              description="Try clearing filters to see every payer / state combination."
              action={<Button size="sm" variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-1" />Clear filters</Button>}
            />
          ) : (
            <Empty
              title="No payer credentialing yet"
              description="Track which payers each provider is credentialed for so scheduling and billing know who can see which clients."
              action={<Button size="sm" onClick={() => setAddRec(true)}><Plus className="h-4 w-4 mr-1" />Add payer credentialing record</Button>}
            />
          )
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Payer","State","Required","Credentialed","Pending","Blocked","Expiring","Next follow-up"].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2.5">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {matrix.map((m) => (
                  <tr
                    key={`${m.payer}-${m.state}`}
                    className="border-t border-border/60 hover:bg-muted/30 cursor-pointer"
                    onClick={() => setMatrixSel({ payer: m.payer, state: m.state })}
                  >
                    <td className="px-3 py-2.5 font-medium">{m.payer}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{m.state}</td>
                    <td className="px-3 py-2.5">{m.required}</td>
                    <td className="px-3 py-2.5 text-emerald-700">{m.credentialed}</td>
                    <td className="px-3 py-2.5 text-sky-700">{m.pending}</td>
                    <td className="px-3 py-2.5 text-red-700">{m.blocked}</td>
                    <td className="px-3 py-2.5 text-amber-700">{m.expiring}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{m.nextFollowUp ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <AddRecordDialog
        open={addRec} onOpenChange={(o) => { setAddRec(o); if (!o) { setDefaultPayer(undefined); setDefaultState(undefined); } }}
        providers={providers}
        defaultPayer={defaultPayer} defaultState={defaultState}
        onCreated={() => { setDefaultPayer(undefined); setDefaultState(undefined); reload(); }}
      />
      <RecordDetailSheet recordId={openRecord} records={records} providerById={providerById} tasks={tasks} documents={documents} onClose={() => setOpenRecord(null)} onChanged={reload} />
      <PayerStateDetailSheet
        open={!!matrixSel}
        payer={matrixSel?.payer ?? null}
        state={matrixSel?.state === "—" ? null : matrixSel?.state ?? null}
        records={records}
        providerById={providerById}
        onClose={() => setMatrixSel(null)}
        onOpenRecord={(id) => { setMatrixSel(null); setOpenRecord(id); }}
        onAddRecord={(payer, state) => {
          setMatrixSel(null);
          setDefaultPayer(payer);
          setDefaultState(state || undefined);
          setAddRec(true);
        }}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Page 4: BCBA Credentials                                                   */
/* -------------------------------------------------------------------------- */
export function BCBACredentialsPage() {
  const { providers, records, providerById, loading, error, reload, tasks, documents } = useCredentialingData();
  const [addProv, setAddProv] = useState(false);
  const [addRec, setAddRec] = useState(false);
  const [defaultProv, setDefaultProv] = useState<string | undefined>();
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [openProvider, setOpenProvider] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [expWindow, setExpWindow] = useState<"any" | "30" | "60" | "90">("any");
  const [missingCr, setMissingCr] = useState(false);
  const [missingDocs, setMissingDocs] = useState(false);
  const [noCoverage, setNoCoverage] = useState(false);
  const [openTasksOnly, setOpenTasksOnly] = useState(false);

  const bcbaAll = useMemo(() => providers.filter((p) => p.provider_type === "BCBA"), [providers]);
  const bcbaProviders = useMemo(() => bcbaAll.filter((p) => {
    const query = q.trim().toLowerCase();
    if (query) {
      const match = p.provider_name.toLowerCase().includes(query)
        || (p.npi ?? "").toLowerCase().includes(query)
        || (p.caqh_id ?? "").toLowerCase().includes(query)
        || (p.license_number ?? "").toLowerCase().includes(query);
      if (!match) return false;
    }
    if (stateFilter !== "ALL" && p.license_state !== stateFilter) return false;
    if (expWindow !== "any") {
      const d = daysUntil(p.license_expiration_date);
      const w = Number(expWindow);
      if (d === null || d < 0 || d > w) return false;
    }
    if (missingCr && p.centralreach_provider_id) return false;
    if (missingDocs && documents.some((d) => d.provider_id === p.id)) return false;
    const provRecs = records.filter((r) => r.provider_id === p.id);
    if (noCoverage && provRecs.some((r) => APPROVED_CRED_STATUSES.includes(r.status))) return false;
    if (openTasksOnly && !tasks.some((t) => t.status !== "Done" && provRecs.some((r) => r.id === t.credentialing_record_id))) return false;
    return true;
  }), [bcbaAll, records, documents, tasks, q, stateFilter, expWindow, missingCr, missingDocs, noCoverage, openTasksOnly]);

  const hasFilters = !!q || stateFilter !== "ALL" || expWindow !== "any" || missingCr || missingDocs || noCoverage || openTasksOnly;
  const clearFilters = () => {
    setQ(""); setStateFilter("ALL"); setExpWindow("any"); setMissingCr(false);
    setMissingDocs(false); setNoCoverage(false); setOpenTasksOnly(false);
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Credentialing" title="BCBA Credentials"
        subtitle="Credentialing posture for every BCBA: licensing, CAQH, payer coverage, documents, CentralReach."
        icon={IdCard}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => exportCsv("bcbas.csv", bcbaProviders as unknown as Record<string, unknown>[])}>
              <Download className="h-4 w-4 mr-1.5" />Export CSV
            </Button>
            <Button size="sm" onClick={() => setAddProv(true)}><Plus className="h-4 w-4 mr-1.5" />Add BCBA</Button>
          </>
        }
      />
      <LoadErr loading={loading} error={error} />
      <FromReportsBanner />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm w-full">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, NPI, CAQH, license…" className="pl-7 h-9" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-9 w-28"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All states</SelectItem>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={expWindow} onValueChange={(v) => setExpWindow(v as "any" | "30" | "60" | "90")}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">License: any</SelectItem>
            <SelectItem value="30">Expiring &lt; 30 days</SelectItem>
            <SelectItem value="60">Expiring &lt; 60 days</SelectItem>
            <SelectItem value="90">Expiring &lt; 90 days</SelectItem>
          </SelectContent>
        </Select>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={missingCr} onCheckedChange={setMissingCr} /> Missing CR ID
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={missingDocs} onCheckedChange={setMissingDocs} /> Missing docs
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={noCoverage} onCheckedChange={setNoCoverage} /> No approved payer
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={openTasksOnly} onCheckedChange={setOpenTasksOnly} /> Open tasks
        </label>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Clear</Button>
        )}
      </div>
      <SectionCard title={`${bcbaProviders.length} BCBA${bcbaProviders.length === 1 ? "" : "s"}`}>
        {bcbaProviders.length === 0 ? (
          hasFilters || bcbaAll.length > 0 ? (
            <Empty
              title="No BCBAs match these filters"
              description="Try clearing filters or widening your search."
              action={<Button size="sm" variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-1" />Clear filters</Button>}
            />
          ) : (
            <Empty
              title="No BCBAs in the credentialing directory yet"
              description="Add BCBAs to start tracking payer coverage, license expirations, CAQH, and CentralReach readiness."
              action={<Button size="sm" onClick={() => setAddProv(true)}><Plus className="h-4 w-4 mr-1" />Add BCBA</Button>}
            />
          )
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["BCBA","License","License exp","Payers covered","Missing payers","Documents","Open tasks","CentralReach",""].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2.5">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {bcbaProviders.map((p) => {
                  const provRecs = records.filter((r) => r.provider_id === p.id);
                  const covered = provRecs.filter((r) => APPROVED_CRED_STATUSES.includes(r.status)).length;
                  const missing = provRecs.filter((r) => !APPROVED_CRED_STATUSES.includes(r.status)).length;
                  const docs = documents.filter((d) => d.provider_id === p.id).length;
                  const openTasks = tasks.filter((t) => t.status !== "Done" && provRecs.some((r) => r.id === t.credentialing_record_id)).length;
                  const cr = p.centralreach_provider_id ? "ID present" : "Not Connected";
                  return (
                    <tr key={p.id} className="border-t border-border/60 hover:bg-muted/30 cursor-pointer" onClick={() => setOpenProvider(p.id)}>
                      <td className="px-3 py-2.5 font-medium">{p.provider_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.license_state ?? "—"} {p.license_number ? `· ${p.license_number}` : ""}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.license_expiration_date ?? "—"}</td>
                      <td className="px-3 py-2.5 text-emerald-700">{covered}</td>
                      <td className="px-3 py-2.5 text-amber-700">{missing}</td>
                      <td className="px-3 py-2.5">{docs}</td>
                      <td className="px-3 py-2.5">{openTasks}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={cr} /></td>
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => { setDefaultProv(p.id); setAddRec(true); }}>
                          Start credentialing
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <AddProviderDialog open={addProv} onOpenChange={setAddProv} onCreated={reload} />
      <AddRecordDialog open={addRec} onOpenChange={setAddRec} providers={providers} defaultProviderId={defaultProv} defaultProviderType="BCBA" onCreated={() => { setDefaultProv(undefined); reload(); }} />
      <RecordDetailSheet recordId={openRecord} records={records} providerById={providerById} tasks={tasks} documents={documents} onClose={() => setOpenRecord(null)} onChanged={reload} />
      <ProviderDetailSheet
        providerId={openProvider} providers={providers} records={records}
        documents={documents} tasks={tasks}
        onClose={() => setOpenProvider(null)} onChanged={reload}
        onOpenRecord={(id) => { setOpenProvider(null); setOpenRecord(id); }}
        onStartCredentialing={(pid) => { setOpenProvider(null); setDefaultProv(pid); setAddRec(true); }}
      />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Page 5: Uncredentialed BCBAs                                               */
/* -------------------------------------------------------------------------- */
export function UncredentialedBCBAsPage() {
  const { providers, records, providerById, loading, error, reload, tasks, documents } = useCredentialingData();
  const [addRec, setAddRec] = useState(false);
  const [defaultProv, setDefaultProv] = useState<string | undefined>();
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [payerFilter, setPayerFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [missingInfoOnly, setMissingInfoOnly] = useState(false);
  const [noPayerRecsOnly, setNoPayerRecsOnly] = useState(false);

  const gap = useMemo(() => {
    const bcbaProviders = providers.filter((p) => p.provider_type === "BCBA");
    return bcbaProviders.map((p) => {
      const provRecs = records.filter((r) => r.provider_id === p.id);
      const blocked = provRecs.filter((r) => r.status === "Blocked" || r.status === "Denied");
      const missingPayerRecs = provRecs.filter((r) => !APPROVED_CRED_STATUSES.includes(r.status));
      // Most relevant existing record to open when the user clicks the row:
      // prefer blocked > missing-info > any non-approved.
      const blockedFirst = blocked[0];
      const missingInfo = provRecs.find((r) => r.status === "Missing Info");
      const activeFirst = provRecs.find((r) => !APPROVED_CRED_STATUSES.includes(r.status));
      const focus = blockedFirst ?? missingInfo ?? activeFirst ?? null;
      const missingItemsCount = provRecs.reduce((n, r) => n + (r.missing_items?.length ?? 0), 0);
      return {
        provider: p, state: p.license_state, blocked, missingPayerRecs, provRecs,
        focusRecordId: focus?.id ?? null,
        missingItemsCount,
        hasMissingInfo: !!missingInfo || missingItemsCount > 0,
        hasNoPayerRecs: provRecs.length === 0,
        hasGap: provRecs.length === 0 || missingPayerRecs.length > 0 || blocked.length > 0,
      };
    }).filter((g) => g.hasGap);
  }, [providers, records]);

  const filteredGap = useMemo(() => gap.filter((g) => {
    const query = q.trim().toLowerCase();
    if (query && !g.provider.provider_name.toLowerCase().includes(query)) return false;
    if (stateFilter !== "ALL" && g.state !== stateFilter) return false;
    if (payerFilter && !g.provRecs.some((r) => r.payer_name.toLowerCase().includes(payerFilter.toLowerCase()))) return false;
    if (ownerFilter) {
      const own = ownerFilter.toLowerCase();
      const anyOwner = g.provRecs.some((r) => (r.owner_name ?? "").toLowerCase().includes(own));
      if (!anyOwner) return false;
    }
    if (blockedOnly && g.blocked.length === 0) return false;
    if (missingInfoOnly && !g.hasMissingInfo) return false;
    if (noPayerRecsOnly && !g.hasNoPayerRecs) return false;
    return true;
  }), [gap, q, stateFilter, payerFilter, ownerFilter, blockedOnly, missingInfoOnly, noPayerRecsOnly]);

  const hasFilters = !!q || stateFilter !== "ALL" || !!payerFilter || !!ownerFilter || blockedOnly || missingInfoOnly || noPayerRecsOnly;
  const clearFilters = () => {
    setQ(""); setStateFilter("ALL"); setPayerFilter(""); setOwnerFilter("");
    setBlockedOnly(false); setMissingInfoOnly(false); setNoPayerRecsOnly(false);
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Credentialing" title="Uncredentialed BCBAs"
        subtitle="BCBAs missing payer/state credentialing, or with blockers preventing approval."
        icon={AlertTriangle}
        actions={
          <Button size="sm" variant="outline" onClick={() => exportCsv("uncredentialed-bcbas.csv", filteredGap.map((g) => ({
            provider: g.provider.provider_name, state: g.state ?? "",
            missing_payers: g.missingPayerRecs.map((r) => `${r.payer_name} (${r.status})`).join("; "),
            blocker: g.blocked[0]?.blocker_reason ?? "",
            owner: g.missingPayerRecs[0]?.owner_name ?? g.blocked[0]?.owner_name ?? "",
          })))}>
            <Download className="h-4 w-4 mr-1.5" />Export CSV
          </Button>
        }
      />
      <LoadErr loading={loading} error={error} />
      <FromReportsBanner />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs w-full">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search BCBA…" className="pl-7 h-9" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-9 w-28"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All states</SelectItem>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Payer…" className="h-9 w-32" value={payerFilter} onChange={(e) => setPayerFilter(e.target.value)} />
        <Input placeholder="Owner…" className="h-9 w-32" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} />
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={blockedOnly} onCheckedChange={setBlockedOnly} /> Blocked
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={missingInfoOnly} onCheckedChange={setMissingInfoOnly} /> Missing info
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 h-9">
          <Switch checked={noPayerRecsOnly} onCheckedChange={setNoPayerRecsOnly} /> No payer records
        </label>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Clear</Button>
        )}
      </div>
      <SectionCard title={`${filteredGap.length} BCBA${filteredGap.length === 1 ? "" : "s"} with gaps`}>
        {filteredGap.length === 0 ? (
          hasFilters ? (
            <Empty
              title="No BCBAs match these filters"
              description="Try clearing filters to see all BCBAs with gaps."
              action={<Button size="sm" variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-1" />Clear filters</Button>}
            />
          ) : (
            <Empty
              title="No uncredentialed BCBAs. Nice."
              description="Every BCBA in the directory has approved payer coverage and no active blockers."
            />
          )
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["BCBA","State","Missing payers","Blocker reason","Owner","Next action",""].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2.5">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filteredGap.map((g) => {
                  const missingList = g.missingPayerRecs.length
                    ? g.missingPayerRecs.map((r) => `${r.payer_name} (${r.status})`).join(", ")
                    : "No payer records yet";
                  const blocker = g.blocked[0]?.blocker_reason ?? "—";
                  const hasRecord = !!g.focusRecordId;
                  const nextAction = g.blocked.length
                    ? "Resolve blocker"
                    : hasRecord
                      ? "Open active record"
                      : "Create payer record";
                  return (
                    <tr
                      key={g.provider.id}
                      className="border-t border-border/60 hover:bg-muted/30 cursor-pointer"
                      onClick={() => {
                        if (g.focusRecordId) setOpenRecord(g.focusRecordId);
                        else { setDefaultProv(g.provider.id); setAddRec(true); }
                      }}
                    >
                      <td className="px-3 py-2.5 font-medium">{g.provider.provider_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{g.state ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        {missingList}
                        {g.missingItemsCount > 0 ? (
                          <span className="ml-2 text-xs text-amber-700">· {g.missingItemsCount} missing item{g.missingItemsCount === 1 ? "" : "s"}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-red-700">{blocker}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{g.missingPayerRecs[0]?.owner_name ?? g.blocked[0]?.owner_name ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{nextAction}</td>
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {hasRecord ? (
                          <Button size="sm" variant="outline" onClick={() => g.focusRecordId && setOpenRecord(g.focusRecordId)}>
                            Open active record
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { setDefaultProv(g.provider.id); setAddRec(true); }}>
                            <Plus className="h-3.5 w-3.5 mr-1" />Create payer record
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <AddRecordDialog open={addRec} onOpenChange={setAddRec} providers={providers} defaultProviderId={defaultProv} onCreated={() => { setDefaultProv(undefined); reload(); }} />
      <RecordDetailSheet recordId={openRecord} records={records} providerById={providerById} tasks={tasks} documents={documents} onClose={() => setOpenRecord(null)} onChanged={reload} />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Page 6: Expiring credentials                                               */
/* -------------------------------------------------------------------------- */
export function ExpiringCredentialsPage() {
  const { records, providerById, loading, error, reload, tasks, documents } = useCredentialingData();
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<30 | 60 | 90>(90);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [payerQ, setPayerQ] = useState("");
  const [providerTypeFilter, setProviderTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  async function startRenewal(r: CredentialingRecord) {
    try {
      const patch: Partial<CredentialingRecord> = { status: "Renewal In Progress" };
      if (r.credentialing_type !== "Recredentialing") patch.credentialing_type = "Renewal";
      await updateCredRecord(
        r.id,
        patch,
        {
          type: "renewal_started",
          message: `Renewal started · expires ${r.expiration_date ?? "—"}`,
          old: r.status,
          new: "Renewal In Progress",
        },
      );
      toast.success("Renewal started");
      reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function quickFollowUp(r: CredentialingRecord, date: string) {
    try {
      await updateCredRecord(r.id, { next_follow_up_date: date || null }, `Follow-up set to ${date || "(cleared)"}`);
      reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const grouped = useMemo(() => {
    const buckets = { d15: [] as CredentialingRecord[], d30: [] as CredentialingRecord[], d60: [] as CredentialingRecord[], d90: [] as CredentialingRecord[] };
    records.forEach((r) => {
      const d = daysUntil(r.expiration_date);
      if (d === null || d < 0 || d > 90) return;
      if (d <= 15) buckets.d15.push(r);
      else if (d <= 30) buckets.d30.push(r);
      else if (d <= 60) buckets.d60.push(r);
      else buckets.d90.push(r);
    });
    return buckets;
  }, [records]);

  const visible = useMemo(() => {
    const all = [...grouped.d15, ...grouped.d30, ...grouped.d60, ...grouped.d90];
    return all.filter((r) => {
      const d = daysUntil(r.expiration_date)!;
      if (d > windowDays) return false;
      if (ownerFilter && !(r.owner_name ?? "").toLowerCase().includes(ownerFilter.toLowerCase())) return false;
      if (stateFilter !== "ALL" && r.state !== stateFilter) return false;
      if (payerQ && !r.payer_name.toLowerCase().includes(payerQ.toLowerCase())) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (providerTypeFilter !== "ALL") {
        const prov = providerById.get(r.provider_id);
        if (prov?.provider_type !== providerTypeFilter) return false;
      }
      return true;
    })
      .sort((a, b) => (daysUntil(a.expiration_date)! - daysUntil(b.expiration_date)!));
  }, [grouped, windowDays, ownerFilter, stateFilter, payerQ, statusFilter, providerTypeFilter, providerById]);

  const hasExtraFilters = !!ownerFilter || stateFilter !== "ALL" || !!payerQ || statusFilter !== "ALL" || providerTypeFilter !== "ALL";
  const clearFilters = () => {
    setOwnerFilter(""); setStateFilter("ALL"); setPayerQ("");
    setStatusFilter("ALL"); setProviderTypeFilter("ALL");
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Credentialing" title="Expiring Credentials"
        subtitle="30 / 60 / 90 day renewal command center. Anything under 15 days is critical."
        icon={Calendar}
        actions={
          <Button size="sm" variant="outline" onClick={() => exportCsv("expiring-credentials.csv", visible as unknown as Record<string, unknown>[])}>
            <Download className="h-4 w-4 mr-1.5" />Export CSV
          </Button>
        }
      />
      <LoadErr loading={loading} error={error} />
      <FromReportsBanner />
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="< 15 days" value={grouped.d15.length} tone="danger" />
        <KpiCard label="< 30 days" value={grouped.d15.length + grouped.d30.length} tone="warn" />
        <KpiCard label="< 60 days" value={grouped.d15.length + grouped.d30.length + grouped.d60.length} />
        <KpiCard label="< 90 days" value={grouped.d15.length + grouped.d30.length + grouped.d60.length + grouped.d90.length} />
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {([30, 60, 90] as const).map((w) => (
          <Button key={w} size="sm" variant={windowDays === w ? "default" : "outline"} onClick={() => setWindowDays(w)}>
            {`< ${w} days`}
          </Button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        <Input placeholder="Payer…" className="h-9 w-32" value={payerQ} onChange={(e) => setPayerQ(e.target.value)} />
        <Input placeholder="Owner…" className="h-9 w-32" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} />
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-9 w-28"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All states</SelectItem>{CRED_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={providerTypeFilter} onValueChange={setProviderTypeFilter}>
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Provider type" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All providers</SelectItem>{CRED_PROVIDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All statuses</SelectItem>{CRED_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        {hasExtraFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Clear</Button>
        )}
      </div>
      <SectionCard title={`${visible.length} expiring credential${visible.length === 1 ? "" : "s"}`}>
        {visible.length === 0 ? (
          hasExtraFilters ? (
            <Empty
              title="No records match these filters"
              description="Try clearing filters or widening the expiration window."
              action={<Button size="sm" variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-1" />Clear filters</Button>}
            />
          ) : (
            <Empty
              title="Nothing expiring in this window"
              description="Try a wider window (60 or 90 days) to check upcoming renewals."
            />
          )
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>{["Provider","Payer","State","Expires","Days left","Status","Owner","Next follow-up",""].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2.5">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const d = daysUntil(r.expiration_date)!;
                  const p = providerById.get(r.provider_id);
                  return (
                    <tr key={r.id} className={cn("border-t border-border/60 hover:bg-muted/30 cursor-pointer", d <= 15 && "bg-red-50/30")} onClick={() => setOpenRecord(r.id)}>
                      <td className="px-3 py-2.5 font-medium">{p?.provider_name ?? "—"}</td>
                      <td className="px-3 py-2.5">{r.payer_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.state ?? "—"}</td>
                      <td className="px-3 py-2.5">{r.expiration_date}</td>
                      <td className={cn("px-3 py-2.5 font-medium", d <= 15 ? "text-red-700" : d <= 30 ? "text-amber-700" : "text-muted-foreground")}>{d}d</td>
                      <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.owner_name ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="date"
                          value={r.next_follow_up_date ?? ""}
                          onChange={(e) => quickFollowUp(r, e.target.value)}
                          className="h-8 w-36"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          {r.status !== "Renewal In Progress" ? (
                            <Button size="sm" variant="outline" onClick={() => startRenewal(r)}>Start Renewal</Button>
                          ) : null}
                          <Button size="sm" variant="ghost" onClick={() => setOpenRecord(r.id)}>Open</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <RecordDetailSheet recordId={openRecord} records={records} providerById={providerById} tasks={tasks} documents={documents} onClose={() => setOpenRecord(null)} onChanged={reload} />
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Reports redirect                                                           */
/* -------------------------------------------------------------------------- */
export function CredentialingReportsRedirect() {
  return <Navigate to="/reports" replace />;
}