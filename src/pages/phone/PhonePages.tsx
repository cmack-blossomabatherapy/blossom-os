import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactNode, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, AlertTriangle, CalendarClock, Download, History,
  Layers, ListChecks, Mail, Moon, Phone, PhoneForwarded, Plus, RefreshCw,
  Search, Send, Share2, Siren, Trash2, Undo2, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  usePhoneSystem, downloadPhoneCsv, notifyPhoneWebhook,
} from "@/contexts/PhoneSystemContext";
import {
  ChangeRequest, CallQueue, Employee, ImpactRow, RequestRoutingScope,
  RequestStatus, SharedDeptCategory, SharedRouting, SHARED_CATEGORIES, STATUSES,
  STATE_DIRECTORY, appendAudit, buildRollbackItems, buildVendorEmail,
  computeImpacts, detectRequestConflicts,
} from "@/data/phoneSystem";

// ---------- shared chrome ----------

function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Draft: "bg-muted text-muted-foreground",
    Submitted: "bg-primary/15 text-primary",
    Approved: "bg-secondary text-secondary-foreground",
    "Sent to Telecom": "bg-accent text-accent-foreground",
    Updated: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    "Test Call Complete": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    Reverted: "bg-muted text-muted-foreground",
    Closed: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={`border-0 ${map[status] ?? ""}`}>{status}</Badge>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1400px] p-6 md:p-8">{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof PhoneForwarded }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-3xl font-semibold mt-1">{value}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
    >
      {label}
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

// ---------- /phone — Dashboard ----------

export function PhoneDashboard() {
  const { queues, requests, employees, shared } = usePhoneSystem();
  const active = requests.filter((r) => !["Closed", "Reverted", "Draft"].includes(r.status));
  const draft = requests.filter((r) => r.status === "Draft");
  const recent = [...requests].slice(0, 5);
  const sharedRequests = requests.filter((r) => r.routingScope === "Shared Department Routing" || r.routingScope === "Both");
  const afterHoursChanges = requests.filter((r) => r.affectedRouting.some((a) => a.routingType === "After Hours" && a.selected));
  const openRollbackTasks = requests
    .filter((r) => !["Reverted", "Closed"].includes(r.status))
    .reduce((sum, r) => sum + r.rollbackItems.filter((i) => !i.done).length, 0);
  const sharedImpactCount = requests.reduce(
    (sum, r) => sum + r.affectedRouting.filter((a) => a.selected && a.routingType !== "CQ").length, 0);

  return (
    <Shell>
      <PageHeader
        title="Phone System"
        description="Master telecom routing control for Blossom ABA Therapy."
        actions={
          <Button asChild>
            <Link to="/phone/requests/new">New Request <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Call Queues" value={queues.length} icon={PhoneForwarded} />
        <StatCard label="Shared Routes" value={shared.length} icon={Share2} />
        <StatCard label="Tracked Employees" value={employees.length} icon={Users} />
        <StatCard label="Active Requests" value={active.length} icon={CalendarClock} />
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-4">
        <StatCard label="Shared Routing Requests" value={sharedRequests.length} icon={Share2} />
        <StatCard label="After-Hours Changes" value={afterHoursChanges.length} icon={Moon} />
        <StatCard label="Open Rollback Tasks" value={openRollbackTasks} icon={ListChecks} />
        <StatCard label="Shared Routing Impacts" value={sharedImpactCount} icon={AlertTriangle} />
      </div>

      <div className="mt-2 text-xs text-muted-foreground">Drafts: {draft.length}</div>

      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent Requests</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No requests yet.{" "}
                <Link to="/phone/requests/new" className="text-primary underline">Create one</Link>.
              </div>
            ) : (
              <div className="divide-y">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    to={`/phone/requests/${r.id}`}
                    className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 rounded-md"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {r.employeeOut || "Untitled"} · ext {r.currentExtension} → {r.newExtension}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.startDate} {r.startTime} – {r.endDate} {r.endTime}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <QuickLink to="/phone/lookup" label="Extension Lookup" />
            <QuickLink to="/phone/shared" label="Shared Routing" />
            <QuickLink to="/phone/requests" label="Request Tracker" />
            <QuickLink to="/phone/directory" label="State Phone Directory" />
            <QuickLink to="/phone/admin" label="Admin Settings" />
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

// ---------- /phone/lookup ----------

export function PhoneLookup() {
  const { queues, employees, shared } = usePhoneSystem();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();

  const matchingQueues = useMemo(() => {
    if (!term) return [];
    return queues.filter((row) => {
      const empNames = row.agents.map((ext) => employees.find((e) => e.extension === ext)?.name ?? "").join(" ").toLowerCase();
      return [row.queue, row.state, row.timeframe, row.voicemail, row.routing, row.agents.join(" "), empNames].join(" ").toLowerCase().includes(term);
    });
  }, [queues, employees, term]);

  const matchingShared = useMemo(() => {
    if (!term) return [];
    return shared.filter((s) => {
      const empNames = s.agents.map((ext) => employees.find((e) => e.extension === ext)?.name ?? "").join(" ").toLowerCase();
      return [s.department, s.category, s.extension, s.businessHoursRouting, s.afterHoursRouting, s.backupPath ?? "", s.agents.join(" "), empNames].join(" ").toLowerCase().includes(term);
    });
  }, [shared, employees, term]);

  const matchingEmployees = useMemo(() => {
    if (!term) return [];
    return employees.filter((e) => [e.name, e.extension, e.department ?? ""].join(" ").toLowerCase().includes(term));
  }, [employees, term]);

  return (
    <Shell>
      <PageHeader title="Extension Lookup" description="Search call queues, shared routing, after-hours routing, and employees." />
      <div className="relative max-w-xl mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input autoFocus placeholder="e.g. 111, 146, HR, GA, Afternoon, VM9106..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
      {!term && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Start typing to search the routing database.
          </CardContent>
        </Card>
      )}
      {term && matchingEmployees.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Employees ({matchingEmployees.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {matchingEmployees.map((e) => (
                <div key={e.extension} className="border border-border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{e.name ?? e.role ?? e.department ?? `Ext ${e.extension}`}</div>
                    <div className="text-xs text-muted-foreground">{e.department || "—"}</div>
                  </div>
                  <Badge variant="secondary">ext {e.extension}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {term && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Matching Call Queues ({matchingQueues.length})</CardTitle></CardHeader>
          <CardContent>
            {matchingQueues.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No call queues found for "{q}".</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Queue</TableHead><TableHead>State</TableHead><TableHead>Timeframe</TableHead>
                    <TableHead>Agents</TableHead><TableHead>Voicemail</TableHead><TableHead>Routing</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {matchingQueues.map((row) => (
                      <TableRow key={row.queue}>
                        <TableCell className="font-medium">{row.queue}</TableCell>
                        <TableCell>{row.state}</TableCell>
                        <TableCell>{row.timeframe}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.agents.map((a) => {
                              const emp = employees.find((e) => e.extension === a);
                              const label = emp?.role ?? emp?.name?.split(" ")[0] ?? emp?.department;
                              return <Badge key={a} variant="outline" className="font-mono">{a}{label ? ` · ${label}` : ""}</Badge>;
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{row.voicemail}</TableCell>
                        <TableCell className="text-muted-foreground">{row.routing}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {term && (
        <Card>
          <CardHeader><CardTitle className="text-base">Matching Shared Routing ({matchingShared.length})</CardTitle></CardHeader>
          <CardContent>
            {matchingShared.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No shared routing found for "{q}".</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Dept</TableHead><TableHead>Category</TableHead><TableHead>Ext</TableHead>
                    <TableHead>Business Hours</TableHead><TableHead>After Hours</TableHead>
                    <TableHead>Agents</TableHead><TableHead>Backup</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {matchingShared.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.department}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{s.category}</Badge></TableCell>
                        <TableCell className="font-mono">{s.extension}</TableCell>
                        <TableCell>{s.businessHoursRouting}</TableCell>
                        <TableCell>{s.afterHoursRouting}</TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{s.agents.map((a) => <Badge key={a} variant="outline" className="font-mono">{a}</Badge>)}</div></TableCell>
                        <TableCell className="text-muted-foreground text-xs">{s.backupPath ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}

// ---------- /phone/shared ----------

const blankShared = (): SharedRouting => ({
  id: `SR-${Date.now().toString(36).toUpperCase()}`,
  department: "", category: "HR", extension: "",
  businessHoursRouting: "", afterHoursRouting: "", agents: [], priority: 1, backupPath: "",
});

export function PhoneShared() {
  const { shared, setShared, employees } = usePhoneSystem();
  const [draft, setDraft] = useState<SharedRouting>(blankShared());
  const [agentsInput, setAgentsInput] = useState("");

  const add = () => {
    if (!draft.department || !draft.extension) return toast.error("Department and extension required.");
    if (shared.some((s) => s.extension === draft.extension)) return toast.error("Extension already exists.");
    const agents = agentsInput.split(",").map((s) => s.trim()).filter(Boolean);
    setShared([...shared, { ...draft, agents }]);
    setDraft(blankShared());
    setAgentsInput("");
    toast.success("Shared route added.");
  };
  const remove = (id: string) => setShared(shared.filter((s) => s.id !== id));
  const update = (id: string, patch: Partial<SharedRouting>) =>
    setShared(shared.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const exportCsv = () =>
    downloadPhoneCsv("shared-routing.csv", shared.map((s) => ({
      department: s.department, category: s.category, extension: s.extension,
      business_hours_routing: s.businessHoursRouting, after_hours_routing: s.afterHoursRouting,
      agents: s.agents.join("; "), priority: s.priority, backup_path: s.backupPath ?? "",
    })));

  return (
    <Shell>
      <PageHeader
        title="Shared Department Routing"
        description="Manage HR, Scheduling, General Inquiries, Overflow, and after-hours routing."
        actions={<Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>}
      />
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add Shared Route</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Field label="Department"><Input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} placeholder="HR" /></Field>
          <Field label="Category">
            <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v as SharedDeptCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SHARED_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Extension"><Input value={draft.extension} onChange={(e) => setDraft({ ...draft, extension: e.target.value })} placeholder="602" /></Field>
          <Field label="Business Hours Routing"><Input value={draft.businessHoursRouting} onChange={(e) => setDraft({ ...draft, businessHoursRouting: e.target.value })} placeholder="146 or 9105" /></Field>
          <Field label="After Hours Routing"><Input value={draft.afterHoursRouting} onChange={(e) => setDraft({ ...draft, afterHoursRouting: e.target.value })} placeholder="732-612-0376 or N/A" /></Field>
          <Field label="Agents (comma-sep extensions)"><Input value={agentsInput} onChange={(e) => setAgentsInput(e.target.value)} placeholder="146, 111" /></Field>
          <Field label="Priority"><Input type="number" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) || 1 })} /></Field>
          <Field label="Backup Path"><Input value={draft.backupPath ?? ""} onChange={(e) => setDraft({ ...draft, backupPath: e.target.value })} placeholder="Voicemail VM602" /></Field>
          <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Shared Routes ({shared.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Dept</TableHead><TableHead>Category</TableHead><TableHead>Ext</TableHead>
                <TableHead>Business Hours</TableHead><TableHead>After Hours</TableHead>
                <TableHead>Agents</TableHead><TableHead>Priority</TableHead><TableHead>Backup</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {shared.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.department}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{s.category}</Badge></TableCell>
                    <TableCell className="font-mono">{s.extension}</TableCell>
                    <TableCell><Input value={s.businessHoursRouting} onChange={(e) => update(s.id, { businessHoursRouting: e.target.value })} className="h-8" /></TableCell>
                    <TableCell><Input value={s.afterHoursRouting} onChange={(e) => update(s.id, { afterHoursRouting: e.target.value })} className="h-8" /></TableCell>
                    <TableCell>
                      <Input value={s.agents.join(", ")} onChange={(e) => update(s.id, { agents: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className="h-8 font-mono text-xs w-32" />
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {s.agents.map((a) => {
                          const emp = employees.find((e) => e.extension === a);
                          return emp?.name ?? emp?.role ?? null;
                        }).filter(Boolean).join(", ")}
                      </div>
                    </TableCell>
                    <TableCell><Input type="number" value={s.priority} onChange={(e) => update(s.id, { priority: Number(e.target.value) || 1 })} className="h-8 w-16" /></TableCell>
                    <TableCell><Input value={s.backupPath ?? ""} onChange={(e) => update(s.id, { backupPath: e.target.value })} className="h-8" /></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}

// ---------- /phone/directory ----------

export function PhoneDirectory() {
  const { queues, shared } = usePhoneSystem();
  return (
    <Shell>
      <PageHeader title="Routing Directory" description="State phone numbers, main auto-attendants, and intake routing." />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>State</TableHead><TableHead>Direct Number</TableHead><TableHead>Main AA</TableHead><TableHead>Intake Routing</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {STATE_DIRECTORY.map((s) => (
                  <TableRow key={s.state}>
                    <TableCell className="font-medium">{s.state}</TableCell>
                    <TableCell className="font-mono">{s.direct}</TableCell>
                    <TableCell className="font-mono">{s.mainAA}</TableCell>
                    <TableCell className="font-mono">{s.intakeRouting}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PageHeader title="All Call Queues" />
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Queue</TableHead><TableHead>State</TableHead><TableHead>Timeframe</TableHead>
                <TableHead>Agents</TableHead><TableHead>Voicemail</TableHead><TableHead>Routing</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {queues.map((q) => (
                  <TableRow key={q.queue}>
                    <TableCell className="font-medium">{q.queue}</TableCell>
                    <TableCell>{q.state}</TableCell>
                    <TableCell>{q.timeframe}</TableCell>
                    <TableCell className="font-mono text-xs">{q.agents.join(", ")}</TableCell>
                    <TableCell>{q.voicemail}</TableCell>
                    <TableCell className="text-muted-foreground">{q.routing}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PageHeader title="Shared Department Routing" description="HR, Scheduling, General Inquiries, Overflow, and After-Hours paths." />
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Department</TableHead><TableHead>Category</TableHead><TableHead>Extension</TableHead>
                <TableHead>Business Hours</TableHead><TableHead>After Hours</TableHead>
                <TableHead>Agents</TableHead><TableHead>Priority</TableHead><TableHead>Backup</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {shared.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.department}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{s.category}</Badge></TableCell>
                    <TableCell className="font-mono">{s.extension}</TableCell>
                    <TableCell className="font-mono text-xs">{s.businessHoursRouting}</TableCell>
                    <TableCell className="font-mono text-xs">{s.afterHoursRouting}</TableCell>
                    <TableCell className="font-mono text-xs">{s.agents.join(", ")}</TableCell>
                    <TableCell>{s.priority}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.backupPath ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}

// ---------- /phone/requests ----------

export function PhoneRequestList() {
  const { requests } = usePhoneSystem();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return requests.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!term) return true;
      return [r.id, r.employeeOut, r.currentExtension, r.newExtension, r.submittedBy, r.notes].join(" ").toLowerCase().includes(term);
    });
  }, [requests, q, status]);

  const exportCsv = () =>
    downloadPhoneCsv("change-requests.csv", filtered.map((r) => ({
      id: r.id, employee_out: r.employeeOut, current_extension: r.currentExtension, new_extension: r.newExtension,
      backup_extension: r.backupExtension ?? "",
      start: `${r.startDate} ${r.startTime} ${r.timeZone}`,
      end: `${r.endDate} ${r.endTime} ${r.timeZone}`,
      affected_routing: r.affectedRouting.filter((a) => a.selected).map((a) => `${a.routingType}:${a.name}`).join("; "),
      status: r.status, urgency: r.urgency, reason: r.reason, submitted_by: r.submittedBy,
      date_submitted: r.dateSubmitted, notes: r.notes,
    })));

  return (
    <Shell>
      <PageHeader
        title="Request Tracker"
        description="All call queue extension change requests."
        actions={<>
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
          <Button asChild><Link to="/phone/requests/new"><Plus className="h-4 w-4 mr-2" /> New Request</Link></Button>
        </>}
      />
      <Card className="mb-4">
        <CardContent className="pt-6 flex flex-wrap gap-3">
          <Input placeholder="Search by employee, extension, ID..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              No requests found.{" "}
              <Link to="/phone/requests/new" className="text-primary underline">Create one</Link>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Request ID</TableHead><TableHead>Employee Out</TableHead><TableHead>Current</TableHead>
                  <TableHead>New</TableHead><TableHead>Window</TableHead><TableHead>Impacts</TableHead>
                  <TableHead>Status</TableHead><TableHead>By</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        <Link to={`/phone/requests/${r.id}`} className="text-primary hover:underline">{r.id}</Link>
                      </TableCell>
                      <TableCell className="font-medium">{r.employeeOut}</TableCell>
                      <TableCell className="font-mono">{r.currentExtension}</TableCell>
                      <TableCell className="font-mono">{r.newExtension}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.startDate} {r.startTime} – {r.endDate} {r.endTime}</TableCell>
                      <TableCell>{r.affectedRouting.filter((a) => a.selected).length}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-sm">{r.submittedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}

// ---------- /phone/requests/new ----------

function newReqId() { return `REQ-${Date.now().toString(36).toUpperCase()}`; }

export function PhoneRequestNew() {
  const navigate = useNavigate();
  const { queues, shared, employees, upsertRequest, requests, coverageTemplates } = usePhoneSystem();
  const today = new Date().toISOString().slice(0, 10);

  const [submittedBy, setSubmittedBy] = useState("");
  const [dateSubmitted] = useState(today);
  const [urgency, setUrgency] = useState<ChangeRequest["urgency"]>("Normal");
  const [reason, setReason] = useState<ChangeRequest["reason"]>("PTO");
  const [employeeOut, setEmployeeOut] = useState("");
  const [currentExtension, setCurrentExtension] = useState("");
  const [newExtension, setNewExtension] = useState("");
  const [backupExtension, setBackupExtension] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState("17:00");
  const [timeZone, setTimeZone] = useState("ET");
  const [notes, setNotes] = useState("");
  const [routingScope, setRoutingScope] = useState<RequestRoutingScope>("Both");
  const [sharedCategories, setSharedCategories] = useState<SharedDeptCategory[]>([...SHARED_CATEGORIES]);
  const [overrides, setOverrides] = useState<Record<string, { selected: boolean; newExt: string }>>({});

  const impacts: ImpactRow[] = useMemo(() => {
    const base = computeImpacts({ currentExtension, newExtension, queues, shared, scope: routingScope, sharedCategories });
    return base.map((r) => {
      const ov = overrides[r.sourceId];
      return { ...r, selected: ov?.selected ?? r.selected, newExtension: ov?.newExt ?? r.newExtension };
    });
  }, [queues, shared, currentExtension, newExtension, routingScope, sharedCategories, overrides]);

  const sharedImpactCount = impacts.filter((i) => i.routingType !== "CQ" && i.selected).length;
  const cqImpactCount = impacts.filter((i) => i.routingType === "CQ" && i.selected).length;

  const conflicts = useMemo(
    () => detectRequestConflicts({ id: "__draft__", currentExtension, newExtension, startDate, endDate }, requests),
    [currentExtension, newExtension, startDate, endDate, requests],
  );

  const employeeFromExt = (ext: string) => employees.find((e) => e.extension === ext)?.name;
  const toggleCategory = (c: SharedDeptCategory) =>
    setSharedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const applyCoverageTemplate = (id: string) => {
    const t = coverageTemplates.find((c) => c.id === id);
    if (!t) return;
    setBackupExtension(t.backupExtension);
    setRoutingScope(t.scope);
    if (t.sharedCategories.length) setSharedCategories(t.sharedCategories);
    toast.success(`Applied template: ${t.name}`);
  };

  const save = (status: ChangeRequest["status"]) => {
    if (!submittedBy || !employeeOut || !currentExtension || !newExtension) {
      toast.error("Please fill in required fields.");
      return;
    }
    const req: ChangeRequest = {
      id: newReqId(), submittedBy, dateSubmitted, urgency, reason, employeeOut,
      currentExtension, newExtension, backupExtension: backupExtension || undefined,
      startDate, startTime, endDate, endTime, timeZone, notes,
      routingScope, sharedCategories, affectedRouting: impacts, status,
      rollbackItems: buildRollbackItems(impacts), auditLog: [],
    };
    upsertRequest(appendAudit(req, {
      actor: submittedBy, action: `Request created as ${status}`,
      detail: `${currentExtension} → ${newExtension} · ${routingScope}`,
    }));
    toast.success(`Request ${req.id} saved as ${status}.`);
    navigate(`/phone/requests/${req.id}`);
  };

  return (
    <Shell>
      <PageHeader title="Extension Change Request" description="Submit a temporary routing change across call queues and shared department routing." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Request Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Request submitted by *"><Input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} placeholder="Your name" /></Field>
              <Field label="Date submitted"><Input value={dateSubmitted} disabled /></Field>
              <Field label="Urgency">
                <Select value={urgency} onValueChange={(v) => setUrgency(v as ChangeRequest["urgency"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Reason">
                <Select value={reason} onValueChange={(v) => setReason(v as ChangeRequest["reason"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["PTO","Sick","Coverage","Staffing","Other"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Employee out / unavailable *"><Input value={employeeOut} onChange={(e) => setEmployeeOut(e.target.value)} placeholder="Name of employee" /></Field>
              <Field label="Current extension being replaced *">
                <Input value={currentExtension} onChange={(e) => { setCurrentExtension(e.target.value); setOverrides({}); }} placeholder="e.g. 132" />
                {currentExtension && employeeFromExt(currentExtension) && (
                  <p className="text-xs text-muted-foreground mt-1">Owner: {employeeFromExt(currentExtension)}</p>
                )}
              </Field>
              <Field label="New extension to route to *"><Input value={newExtension} onChange={(e) => setNewExtension(e.target.value)} placeholder="e.g. 125" /></Field>
              <Field label="Backup extension (optional)"><Input value={backupExtension} onChange={(e) => setBackupExtension(e.target.value)} placeholder="e.g. 111" /></Field>
            </CardContent>
          </Card>

          {coverageTemplates.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" /> Coverage Templates</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {coverageTemplates.map((t) => (
                  <button key={t.id} type="button" onClick={() => applyCoverageTemplate(t.id)}
                    className="text-left rounded-md border border-border px-3 py-2 text-xs hover:bg-muted/50">
                    <div className="font-medium">{t.name}</div>
                    {t.description && <div className="text-muted-foreground mt-0.5">{t.description}</div>}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Routing Scope</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Routing Type">
                <Select value={routingScope} onValueChange={(v) => { setRoutingScope(v as RequestRoutingScope); setOverrides({}); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Call Queue">Call Queue</SelectItem>
                    <SelectItem value="Shared Department Routing">Shared Department Routing</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {(routingScope === "Shared Department Routing" || routingScope === "Both") && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Shared categories to include</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SHARED_CATEGORIES.map((c) => (
                      <label key={c} className="flex items-center gap-2 text-xs border border-border rounded-md px-2.5 py-1.5 cursor-pointer">
                        <Checkbox checked={sharedCategories.includes(c)} onCheckedChange={() => toggleCategory(c)} />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Schedule</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Start date"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
              <Field label="Start time"><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
              <Field label="Time zone">
                <Select value={timeZone} onValueChange={setTimeZone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["ET","CT","MT","PT"].map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="End date"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
              <Field label="End time"><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent><Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional context for telecom..." /></CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Affected Routing Impact <Badge variant="outline">{impacts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conflicts.length > 0 && (
                <div className="flex gap-2 items-start text-xs rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div><strong>Routing conflict:</strong> {conflicts.length} active request{conflicts.length > 1 ? "s" : ""} overlap this window ({conflicts.map((c) => c.request.id).join(", ")}).</div>
                </div>
              )}
              {sharedImpactCount > 0 && (
                <div className="flex gap-2 items-start text-xs rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    Extension {currentExtension} also exists in <strong>{sharedImpactCount}</strong> shared routing
                    {sharedImpactCount > 1 ? " locations" : " location"} and <strong>{cqImpactCount}</strong> call queue
                    {cqImpactCount === 1 ? "" : "s"}. Rollback will require restoration in {impacts.filter((i) => i.selected).length} locations.
                  </div>
                </div>
              )}
              {!currentExtension && (
                <p className="text-sm text-muted-foreground">Enter a current extension to auto-detect impacted routing.</p>
              )}
              {currentExtension && impacts.length === 0 && (
                <p className="text-sm text-muted-foreground">Extension {currentExtension} is not present in any selected routing scope.</p>
              )}
              {impacts.length > 0 && (
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="w-8"></TableHead><TableHead>Type</TableHead>
                      <TableHead>Name</TableHead><TableHead>New Ext</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {impacts.map((a) => (
                        <TableRow key={a.sourceId}>
                          <TableCell><Checkbox checked={a.selected} onCheckedChange={(v) => setOverrides((p) => ({ ...p, [a.sourceId]: { selected: !!v, newExt: a.newExtension } }))} /></TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{a.routingType}</Badge></TableCell>
                          <TableCell className="text-xs">{a.name}</TableCell>
                          <TableCell><Input value={a.newExtension} onChange={(e) => setOverrides((p) => ({ ...p, [a.sourceId]: { selected: a.selected, newExt: e.target.value } }))} className="h-8 w-20 font-mono text-xs" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex flex-col gap-2">
              <Button onClick={() => save("Submitted")}>Submit Request</Button>
              <Button variant="outline" onClick={() => save("Draft")}>Save as Draft</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

// ---------- /phone/requests/:id ----------

export function PhoneRequestDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { requests, upsertRequest, deleteRequest, settings } = usePhoneSystem();
  const req = requests.find((r) => r.id === id);

  if (!req) {
    return (
      <Shell>
        <PageHeader title="Request not found" />
        <Button asChild variant="outline"><Link to="/phone/requests">Back to tracker</Link></Button>
      </Shell>
    );
  }

  const update = (patch: Partial<typeof req>) => upsertRequest({ ...req, ...patch });
  const updateChecklist = (key: string, value: boolean) =>
    upsertRequest({ ...req, rollbackItems: req.rollbackItems.map((i) => i.key === key ? { ...i, done: value } : i) });
  const regenerateChecklist = () => {
    upsertRequest({ ...req, rollbackItems: buildRollbackItems(req.affectedRouting) });
    toast.success("Rollback checklist regenerated.");
  };

  const selected = req.affectedRouting.filter((a) => a.selected);
  const sharedCount = selected.filter((a) => a.routingType !== "CQ").length;
  const cqCount = selected.filter((a) => a.routingType === "CQ").length;

  const exportAffected = () =>
    downloadPhoneCsv(`${req.id}-affected-routing.csv`, selected.map((a) => ({
      routing_type: a.routingType, name: a.name, state: a.state ?? "", timeframe: a.timeframe ?? "",
      current_extension: a.currentExtension, new_extension: a.newExtension,
      priority: a.priority ?? "", rollback_required: a.rollbackRequired ? "yes" : "no",
    })));

  const openVendorEmail = (kind: "change" | "rollback") => {
    const { subject, body, to } = buildVendorEmail(req, kind, settings);
    const stamp = new Date().toISOString();
    upsertRequest(appendAudit(
      { ...req, ...(kind === "change" ? { vendorChangeEmailSentAt: stamp } : { vendorRollbackEmailSentAt: stamp }) },
      { actor: req.submittedBy || "ops", action: kind === "change" ? "Vendor change email opened" : "Vendor rollback email opened", detail: `to ${to}` },
    ));
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success(`Opening ${kind === "change" ? "change" : "rollback"} email to ${to}`);
  };

  const copyVendorEmail = async (kind: "change" | "rollback") => {
    const { subject, body, to } = buildVendorEmail(req, kind, settings);
    await navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`);
    toast.success("Vendor email copied to clipboard");
  };

  const emergencyReroute = () => {
    upsertRequest(appendAudit(
      { ...req, urgency: "Emergency", status: "Sent to Telecom" },
      { actor: req.submittedBy || "ops", action: "Emergency reroute triggered" },
    ));
    toast.warning("Marked as Emergency and sent to telecom.");
  };

  const sendTeamsAlert = async () => {
    const text = `[Telecom] ${req.id} (${req.urgency}) — ${req.employeeOut}: ext ${req.currentExtension} → ${req.newExtension} · ${req.status}`;
    const result = await notifyPhoneWebhook(settings.teamsWebhookUrl, text);
    toast.message(`Teams: ${result}`);
    upsertRequest(appendAudit(req, { actor: req.submittedBy || "ops", action: "Teams alert dispatched", detail: result }));
  };

  const onStatusChange = (v: string) => {
    upsertRequest(appendAudit({ ...req, status: v as RequestStatus }, { actor: req.submittedBy || "ops", action: `Status → ${v}` }));
    toast.success(`Status: ${v}`);
  };

  return (
    <Shell>
      <div className="flex items-center gap-2 mb-2">
        <Button asChild variant="ghost" size="sm"><Link to="/phone/requests"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
      </div>

      <PageHeader
        title={req.id}
        description={`${req.employeeOut} · ext ${req.currentExtension} → ${req.newExtension} · ${req.routingScope}`}
        actions={<>
          <StatusBadge status={req.status} />
          <Button variant="outline" size="sm" onClick={() => openVendorEmail("change")}><Mail className="h-4 w-4 mr-2" /> Email Vendor</Button>
          <Button variant="outline" size="sm" onClick={() => openVendorEmail("rollback")}><Undo2 className="h-4 w-4 mr-2" /> Email Rollback</Button>
          <Button variant="outline" size="sm" onClick={exportAffected}><Download className="h-4 w-4 mr-2" /> Impact CSV</Button>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this request?")) { deleteRequest(req.id); navigate("/phone/requests"); } }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>}
      />

      {sharedCount > 0 && (
        <div className="mb-6 flex gap-2 items-start text-sm rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Shared routing dependency detected. Extension {req.currentExtension} exists in <strong>{sharedCount}</strong> shared routing
            location{sharedCount > 1 ? "s" : ""} and <strong>{cqCount}</strong> call queue{cqCount === 1 ? "" : "s"}.
            Rollback will require restoration in {selected.length} location{selected.length === 1 ? "" : "s"}.
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <Info label="Submitted by" value={req.submittedBy} />
              <Info label="Date submitted" value={req.dateSubmitted} />
              <Info label="Urgency" value={req.urgency} />
              <Info label="Reason" value={req.reason} />
              <Info label="Employee out" value={req.employeeOut} />
              <Info label="Backup extension" value={req.backupExtension || "—"} />
              <Info label="Routing scope" value={req.routingScope} />
              <Info label="Shared categories" value={req.sharedCategories.join(", ") || "—"} />
              <Info label="Start" value={`${req.startDate} ${req.startTime} ${req.timeZone}`} />
              <Info label="End" value={`${req.endDate} ${req.endTime} ${req.timeZone}`} />
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">Notes</div>
                <div className="mt-1 whitespace-pre-wrap">{req.notes || "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Affected Routing Impact</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Routing Type</TableHead><TableHead>Name</TableHead><TableHead>State</TableHead>
                    <TableHead>Current</TableHead><TableHead>Temporary</TableHead><TableHead>Priority</TableHead>
                    <TableHead>Rollback</TableHead><TableHead>Selected</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {req.affectedRouting.map((a) => (
                      <TableRow key={a.sourceId} className={a.selected ? "" : "opacity-50"}>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{a.routingType}</Badge></TableCell>
                        <TableCell className="font-medium text-sm">{a.name}</TableCell>
                        <TableCell>{a.state ?? "—"}</TableCell>
                        <TableCell className="font-mono">{a.currentExtension}</TableCell>
                        <TableCell className="font-mono">{a.newExtension}</TableCell>
                        <TableCell>{a.priority ?? "—"}</TableCell>
                        <TableCell>{a.rollbackRequired ? "Yes" : "No"}</TableCell>
                        <TableCell>{a.selected ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Rollback / Revert
                <Button variant="ghost" size="sm" onClick={regenerateChecklist}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Info label="Original extension" value={req.currentExtension} />
                <Info label="Temporary extension" value={req.newExtension} />
                <Info label="Locations changed" value={selected.map((a) => a.name).join(", ") || "—"} />
                <Info label="Revert due" value={`${req.endDate} ${req.endTime} ${req.timeZone}`} />
                <Info label="Revert status" value={req.status === "Reverted" || req.status === "Closed" ? "Complete" : "Pending"} />
                <Info label="Reverted by" value={req.revertedBy || "—"} />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Smart Rollback Checklist</Label>
                <div className="mt-2 grid sm:grid-cols-2 gap-2">
                  {req.rollbackItems.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-sm border border-border rounded-md px-3 py-2">
                      <Checkbox checked={item.done} onCheckedChange={(v) => updateChecklist(item.key, !!v)} />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Reverted by</Label>
                  <Input value={req.revertedBy ?? ""} onChange={(e) => update({ revertedBy: e.target.value })} placeholder="Name" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Revert notes</Label>
                  <Input value={req.revertNotes ?? ""} onChange={(e) => update({ revertNotes: e.target.value })} placeholder="Details about the revert" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Audit History</CardTitle></CardHeader>
            <CardContent>
              {!req.auditLog || req.auditLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit events yet. Status changes and vendor emails are recorded here.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {[...req.auditLog].reverse().map((e, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 border-l-2 border-primary/40 pl-3 py-1">
                      <div>
                        <div className="font-medium">{e.action}</div>
                        {e.detail && <div className="text-xs text-muted-foreground">{e.detail}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.at).toLocaleString()} · {e.actor}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Telecom Vendor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Vendor: <span className="font-medium text-foreground">{settings.vendorName}</span><br />{settings.vendorEmail}
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Vendor Ticket #</Label>
                <Input value={req.vendorTicketNumber ?? ""} onChange={(e) => update({ vendorTicketNumber: e.target.value })} placeholder="e.g. TKT-12345" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={() => openVendorEmail("change")}><Mail className="h-4 w-4 mr-1" /> Email Change</Button>
                <Button size="sm" variant="outline" onClick={() => openVendorEmail("rollback")}><Undo2 className="h-4 w-4 mr-1" /> Email Rollback</Button>
                <Button size="sm" variant="ghost" onClick={() => copyVendorEmail("change")}>Copy change</Button>
                <Button size="sm" variant="ghost" onClick={() => copyVendorEmail("rollback")}>Copy rollback</Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t border-border">
                <div>Change email: {req.vendorChangeEmailSentAt ? new Date(req.vendorChangeEmailSentAt).toLocaleString() : "not sent"}</div>
                <div>Rollback email: {req.vendorRollbackEmailSentAt ? new Date(req.vendorRollbackEmailSentAt).toLocaleString() : "not sent"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={req.status} onValueChange={onStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((s) => (
                  <Button key={s} variant={req.status === s ? "default" : "outline"} size="sm" onClick={() => onStatusChange(s)} className="text-xs">{s}</Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="destructive" size="sm" className="w-full" onClick={emergencyReroute}>
                <Siren className="h-4 w-4 mr-2" /> Emergency Reroute
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={sendTeamsAlert}
                disabled={!settings.teamsWebhookUrl}
                title={settings.teamsWebhookUrl ? "" : "Configure webhook in Admin Settings"}>
                <Send className="h-4 w-4 mr-2" /> Send Teams Alert
              </Button>
              <div className="text-xs text-muted-foreground pt-1">
                Scheduled revert: {req.endDate} {req.endTime} {req.timeZone}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

// ---------- /phone/admin ----------

export function PhoneAdmin() {
  const { queues, setQueues, employees, setEmployees, requests, settings, setSettings, coverageTemplates, holidayProfiles } = usePhoneSystem();
  const [newEmp, setNewEmp] = useState<Employee>({ extension: "", name: "", department: "" });
  const [newQ, setNewQ] = useState<CallQueue>({ queue: "", state: "", timeframe: "", agents: [], voicemail: "", routing: "" });
  const [newQAgents, setNewQAgents] = useState("");

  const addEmployee = () => {
    if (!newEmp.extension) return toast.error("Extension required");
    if (employees.some((e) => e.extension === newEmp.extension)) return toast.error("Extension already exists");
    setEmployees([...employees, newEmp]);
    setNewEmp({ extension: "", name: "", department: "" });
    toast.success("Employee added");
  };
  const removeEmployee = (ext: string) => setEmployees(employees.filter((e) => e.extension !== ext));
  const updateEmployee = (ext: string, patch: Partial<Employee>) =>
    setEmployees(employees.map((e) => (e.extension === ext ? { ...e, ...patch } : e)));
  const addQueue = () => {
    if (!newQ.queue || !newQ.state) return toast.error("Queue and state required");
    if (queues.some((q) => q.queue === newQ.queue)) return toast.error("Queue already exists");
    const agents = newQAgents.split(",").map((s) => s.trim()).filter(Boolean);
    setQueues([...queues, { ...newQ, agents }]);
    setNewQ({ queue: "", state: "", timeframe: "", agents: [], voicemail: "", routing: "" });
    setNewQAgents("");
    toast.success("Queue added");
  };
  const removeQueue = (q: string) => setQueues(queues.filter((x) => x.queue !== q));
  const updateQueue = (q: string, patch: Partial<CallQueue>) =>
    setQueues(queues.map((x) => (x.queue === q ? { ...x, ...patch } : x)));

  const exportAllRequests = () =>
    downloadPhoneCsv("all-requests.csv", requests.map((r) => ({
      id: r.id, status: r.status, employee_out: r.employeeOut,
      current_extension: r.currentExtension, new_extension: r.newExtension,
      start: `${r.startDate} ${r.startTime} ${r.timeZone}`,
      end: `${r.endDate} ${r.endTime} ${r.timeZone}`,
      affected_routing: r.affectedRouting.filter((a) => a.selected).map((a) => `${a.routingType}:${a.name}`).join("; "),
      submitted_by: r.submittedBy, notes: r.notes,
    })));
  const exportQueues = () =>
    downloadPhoneCsv("call-queues.csv", queues.map((q) => ({ ...q, agents: q.agents.join("; ") })));

  return (
    <Shell>
      <PageHeader
        title="Phone System Admin"
        description="Manage queues, employee extensions, vendor configuration, and exports."
        actions={<>
          <Button variant="outline" onClick={exportQueues}><Download className="h-4 w-4 mr-2" /> Queues CSV</Button>
          <Button variant="outline" onClick={exportAllRequests}><Download className="h-4 w-4 mr-2" /> Requests CSV</Button>
        </>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Employees</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3"><Label className="text-xs">Extension</Label><Input value={newEmp.extension} onChange={(e) => setNewEmp({ ...newEmp, extension: e.target.value })} /></div>
              <div className="col-span-4"><Label className="text-xs">Name</Label><Input value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} /></div>
              <div className="col-span-3"><Label className="text-xs">Dept</Label><Input value={newEmp.department} onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })} /></div>
              <div className="col-span-2"><Button onClick={addEmployee} className="w-full"><Plus className="h-4 w-4" /></Button></div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Ext</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.extension}>
                      <TableCell className="font-mono">{e.extension}</TableCell>
                      <TableCell><Input value={e.name} onChange={(ev) => updateEmployee(e.extension, { name: ev.target.value })} className="h-8" /></TableCell>
                      <TableCell><Input value={e.department ?? ""} onChange={(ev) => updateEmployee(e.extension, { department: ev.target.value })} className="h-8" /></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => removeEmployee(e.extension)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Call Queues</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Queue #" value={newQ.queue} onChange={(e) => setNewQ({ ...newQ, queue: e.target.value })} />
              <Input placeholder="State" value={newQ.state} onChange={(e) => setNewQ({ ...newQ, state: e.target.value })} />
              <Input placeholder="Timeframe" value={newQ.timeframe} onChange={(e) => setNewQ({ ...newQ, timeframe: e.target.value })} />
              <Input placeholder="Voicemail" value={newQ.voicemail} onChange={(e) => setNewQ({ ...newQ, voicemail: e.target.value })} />
              <Input placeholder="Agents (comma-sep)" value={newQAgents} onChange={(e) => setNewQAgents(e.target.value)} />
              <Input placeholder="Routing group" value={newQ.routing} onChange={(e) => setNewQ({ ...newQ, routing: e.target.value })} />
              <Button onClick={addQueue} className="col-span-2"><Plus className="h-4 w-4 mr-2" /> Add Queue</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Queue</TableHead><TableHead>State</TableHead><TableHead>Timeframe</TableHead><TableHead>Agents</TableHead><TableHead>VM</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {queues.map((q) => (
                    <TableRow key={q.queue}>
                      <TableCell className="font-medium">{q.queue}</TableCell>
                      <TableCell>{q.state}</TableCell>
                      <TableCell className="text-xs">{q.timeframe}</TableCell>
                      <TableCell><Input value={q.agents.join(", ")} onChange={(e) => updateQueue(q.queue, { agents: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="h-8 font-mono text-xs w-40" /></TableCell>
                      <TableCell className="text-xs">{q.voicemail}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => removeQueue(q.queue)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Telecom Vendor & Alerts</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div><Label className="text-xs">Vendor name</Label><Input value={settings.vendorName} onChange={(e) => setSettings({ ...settings, vendorName: e.target.value })} /></div>
          <div><Label className="text-xs">Vendor email</Label><Input value={settings.vendorEmail} onChange={(e) => setSettings({ ...settings, vendorEmail: e.target.value })} /></div>
          <div><Label className="text-xs">Ops reply-to email</Label><Input value={settings.opsEmail} onChange={(e) => setSettings({ ...settings, opsEmail: e.target.value })} /></div>
          <div><Label className="text-xs">Teams webhook URL</Label><Input value={settings.teamsWebhookUrl} onChange={(e) => setSettings({ ...settings, teamsWebhookUrl: e.target.value })} placeholder="https://..." /></div>
          <div><Label className="text-xs">Slack webhook URL</Label><Input value={settings.slackWebhookUrl} onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })} placeholder="https://..." /></div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Coverage Templates ({coverageTemplates.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {coverageTemplates.map((t) => (
              <div key={t.id} className="border border-border rounded-md p-2">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">Backup: <span className="font-mono">{t.backupExtension}</span> · Scope: {t.scope}</div>
                {t.description && <div className="text-xs mt-1">{t.description}</div>}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Holiday Profiles ({holidayProfiles.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {holidayProfiles.map((h) => (
              <div key={h.id} className="border border-border rounded-md p-2">
                <div className="font-medium">{h.name} <span className="text-xs text-muted-foreground">· {h.date}</span></div>
                <div className="text-xs text-muted-foreground mt-0.5">Route all → <span className="font-mono">{h.routeAllTo}</span></div>
                <div className="text-xs mt-1">{h.afterHoursMessage}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

// Re-export icon for sidebar convenience.
export { Phone as PhoneIcon };