import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, ShieldCheck, Pencil, GraduationCap, ClipboardCheck, Smartphone,
  KeyRound, ScanLine, Mail, Phone, Building2, MapPin, CalendarDays, Briefcase,
  CheckCircle2, Clock, AlertTriangle, Download, ExternalLink, Plus, Lock,
  Sparkles, History, BadgeCheck, MonitorSmartphone, Wifi, Tablet, Laptop,
  RefreshCw, Copy, EyeOff, UserCircle2, Trash2,
} from "lucide-react";
import { OSShell } from "../OSShell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEmployeeDirectory, type DirectoryEmployee } from "@/hooks/useEmployeeDirectory";
import { IdentityTab } from "./IdentityTab";
import { usePhoneSystem } from "@/contexts/PhoneSystemContext";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { nfcBadgeUrl } from "@/lib/publicUrl";
import { variantFor, ACTION_META, type RoleKey, type NfcActionKind } from "@/pages/nfc/roleVariants";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================================
// SHARED PRIMITIVES
// ============================================================================

type TabId =
  | "overview" | "employment" | "training" | "evaluations" | "devices"
  | "logins" | "nfc" | "permissions" | "activity";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "training", label: "Training Academy", icon: GraduationCap },
  { id: "evaluations", label: "Evaluations", icon: ClipboardCheck },
  { id: "devices", label: "Devices", icon: MonitorSmartphone },
  { id: "logins", label: "Logins", icon: KeyRound },
  { id: "nfc", label: "Smart Badge", icon: ScanLine },
  { id: "permissions", label: "Permissions", icon: ShieldCheck },
  { id: "activity", label: "Activity", icon: History },
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card p-6",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.06)]",
      className,
    )}>{children}</div>
  );
}

function StatusBadge({ tone, children }: { tone: "ok" | "warn" | "crit" | "muted"; children: React.ReactNode }) {
  const cls = tone === "ok"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    : tone === "warn"
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
    : tone === "crit"
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : "bg-muted text-muted-foreground border-border/60";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cls)}>
      {children}
    </span>
  );
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{children}</h3>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

function Empty({ icon: Icon, title, hint, action }: { icon: React.ElementType; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-10 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

function fmtDate(iso?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, opts ?? { month: "short", day: "numeric", year: "numeric" });
}
function fmtRel(iso?: string | null) {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ============================================================================
// EMPLOYMENT
// ============================================================================

function EmploymentTab({ m }: { m: DirectoryEmployee }) {
  const { employees: phoneEmployees, saveEmployeeExtension } = usePhoneSystem();
  const [row, setRow] = useState<any | null>(null);
  const [manager, setManager] = useState<string | null>(null);
  const phoneRecord = useMemo(() => phoneEmployees.find((employee) =>
    (m.uuid && employee.userId === m.uuid) ||
    (m.email && employee.email?.toLowerCase() === m.email.toLowerCase()) ||
    employee.name?.toLowerCase() === m.name.toLowerCase(),
  ), [phoneEmployees, m.uuid, m.email, m.name]);
  useEffect(() => {
    if (!m.uuid) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("employee_code,hire_date,start_date,status,employment_type,pay_type,work_setting,manager_id,viventium_employee_id,viventium_sync_status,viventium_last_sync")
        .eq("id", m.uuid)
        .maybeSingle();
      if (cancelled) return;
      setRow(data);
      if (data?.manager_id) {
        const { data: mgr } = await supabase
          .from("employees")
          .select("first_name,last_name,preferred_name")
          .eq("id", data.manager_id)
          .maybeSingle();
        if (!cancelled && mgr) {
          setManager(`${mgr.preferred_name || mgr.first_name} ${mgr.last_name}`.trim());
        }
      }
    })();
    return () => { cancelled = true; };
  }, [m.uuid]);

  const connected = !!row?.viventium_employee_id && row?.viventium_sync_status !== "not_connected";
  const sourceBadge = (owned: boolean) => (
    <StatusBadge tone={owned && connected ? "ok" : "muted"}>
      {owned && connected ? "Viventium" : "Manual"}
    </StatusBadge>
  );
  const statusLabel = row?.status ? row.status.replace(/_/g, " ") : "Active";
  const statusTone: "ok" | "warn" | "crit" | "muted" =
    row?.status === "active" ? "ok"
    : row?.status === "on_leave" ? "warn"
    : row?.status === "terminated" ? "crit"
    : "muted";

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>Employment record</SectionTitle>
          {connected ? (
            <a href="https://viventium.com" target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              View in Viventium <ExternalLink className="size-3" />
            </a>
          ) : (
            <StatusBadge tone="muted">Manual entry</StatusBadge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
          <FieldWithSource label="Employee ID" value={row?.employee_code ?? m.uuid?.slice(0, 8).toUpperCase() ?? "—"} source={sourceBadge(false)} />
          <FieldWithSource label="Viventium ID" value={row?.viventium_employee_id ?? "Not linked"} source={sourceBadge(true)} />
          <FieldWithSource label="Hire Date" value={fmtDate(row?.hire_date ?? row?.start_date)} source={sourceBadge(true)} />
          <FieldWithSource label="Employment Status" value={<StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>} source={sourceBadge(true)} />
          <FieldWithSource label="Employment Type" value={row?.employment_type?.replace(/_/g, " ") ?? "—"} source={sourceBadge(true)} />
          <FieldWithSource label="Pay Type" value={row?.pay_type ?? "—"} source={sourceBadge(true)} />
          <FieldWithSource label="Department" value={m.departmentName ?? "Unassigned"} source={sourceBadge(false)} />
          <FieldWithSource label="Manager" value={manager ?? "—"} source={sourceBadge(false)} />
          <FieldWithSource label="State" value={m.states?.[0] ?? "—"} source={sourceBadge(false)} />
          <FieldWithSource label="Work Setting" value={row?.work_setting?.replace(/_/g, " ") ?? "—"} source={sourceBadge(false)} />
          <FieldWithSource label="Email" value={m.email ?? "—"} source={sourceBadge(false)} />
          <FieldWithSource label="Phone" value={m.phone ?? "—"} source={sourceBadge(false)} />
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone Extension</p>
              <StatusBadge tone={phoneRecord?.extension ? "ok" : "muted"}>Phone System</StatusBadge>
            </div>
            <input
              value={phoneRecord?.extension ?? ""}
              onChange={(event) => saveEmployeeExtension(phoneRecord?.extension ?? "", {
                extension: event.target.value,
                userId: m.uuid ?? m.id,
                email: m.email ?? undefined,
                name: m.name,
                department: m.departmentName ?? undefined,
                role: m.title,
                source: "directory",
              })}
              placeholder="Assign extension"
              className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Viventium sync</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {connected
                ? `Last sync — ${row?.viventium_last_sync ? new Date(row.viventium_last_sync).toLocaleString() : "—"}`
                : "Payroll details will populate automatically once Viventium is connected. Manual entries are preserved."}
            </p>
          </div>
          <StatusBadge tone={connected ? "ok" : "muted"}>
            <RefreshCw className="size-3" />{connected ? "Healthy" : "Not connected"}
          </StatusBadge>
        </div>
      </Card>
    </div>
  );
}

function FieldWithSource({ label, value, source }: { label: string; value: React.ReactNode; source: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {source}
      </div>
      <p className="mt-1 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

// ============================================================================
// TRAINING (real: employee_trainings × training_courses)
// ============================================================================

type TrainingRow = {
  id: string; status: string; assigned_at: string; due_date: string | null;
  completed_at: string | null; score: number | null; certificate_url: string | null;
  course: { id: string; title: string; category: string | null; duration_minutes: number | null } | null;
};

function TrainingTab({ m, openAssign, setOpenAssign }: { m: DirectoryEmployee; openAssign: boolean; setOpenAssign: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [pick, setPick] = useState<string>("");
  const [due, setDue] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!m.uuid) return;
    const { data } = await supabase
      .from("employee_trainings")
      .select("id,status,assigned_at,due_date,completed_at,score,certificate_url,course:training_courses(id,title,category,duration_minutes)")
      .eq("employee_id", m.uuid)
      .order("assigned_at", { ascending: false });
    setRows((data ?? []) as any);
  }, [m.uuid]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!openAssign) return;
    void supabase.from("training_courses").select("id,title").eq("status", "active").order("title")
      .then(({ data }) => setCourses((data ?? []) as any));
  }, [openAssign]);

  const total = rows.length;
  const completed = rows.filter((r) => r.status === "completed").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  async function assign() {
    if (!m.uuid || !pick) return;
    setBusy(true);
    const { error } = await supabase.from("employee_trainings").insert({
      employee_id: m.uuid, course_id: pick, due_date: due || null,
    });
    setBusy(false);
    if (error) return toast.error("Could not assign training", { description: error.message });
    toast.success("Training assigned");
    setOpenAssign(false); setPick(""); setDue(""); void load();
  }
  async function markComplete(id: string) {
    const { error } = await supabase.from("employee_trainings")
      .update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked complete"); void load();
  }

  return (
    <div className="space-y-6">
      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign training</DialogTitle>
            <DialogDescription>Pick a course and optional due date for {m.name}.</DialogDescription>
          </DialogHeader>
          {courses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              No active courses yet. Create one in <Link to="/hr/training-center" className="text-primary underline">Training Management</Link>.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Course</label>
                <Select value={pick} onValueChange={setPick}>
                  <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Due date (optional)</label>
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAssign(false)}>Cancel</Button>
            <Button onClick={assign} disabled={!pick || busy}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Assigned training</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{m.title} journey</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {total === 0 ? "No courses assigned yet." : `${completed} of ${total} complete`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tracking-tight">{pct}%</p>
            <p className="text-[11px] text-muted-foreground">Overall completion</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => setOpenAssign(true)}><Plus className="size-3.5" /> Assign training</Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/hr/training-center")}>Open Training Management</Button>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Empty icon={GraduationCap} title="No training assigned" hint="Pick from the active catalog to start this employee's journey."
               action={<Button size="sm" onClick={() => setOpenAssign(true)}><Plus className="size-3.5" /> Assign first course</Button>} />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border/60">
            {rows.map((r) => {
              const tone: "ok" | "warn" | "muted" = r.status === "completed" ? "ok"
                : r.status === "in_progress" ? "warn" : "muted";
              const label = r.status.replace(/_/g, " ");
              return (
                <li key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.course?.title ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Assigned {fmtDate(r.assigned_at)}
                      {r.due_date && ` · Due ${fmtDate(r.due_date)}`}
                      {r.completed_at && ` · Completed ${fmtDate(r.completed_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={tone}>{label}</StatusBadge>
                    {r.certificate_url && (
                      <a href={r.certificate_url} target="_blank" rel="noreferrer"
                         className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Download className="size-3.5" /> Cert
                      </a>
                    )}
                    {r.status !== "completed" && (
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => markComplete(r.id)}>
                        <CheckCircle2 className="size-3.5" /> Mark complete
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// EVALUATIONS (real: employee_reviews)
// ============================================================================

type ReviewRow = {
  id: string; review_type: string; status: string; overall_rating: string | null;
  period_start: string | null; period_end: string | null; due_date: string | null;
  scheduled_for: string | null; reviewer_name: string | null; created_at: string;
};

function EvaluationsTab({ m, openAssign, setOpenAssign }: { m: DirectoryEmployee; openAssign: boolean; setOpenAssign: (v: boolean) => void }) {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [type, setType] = useState<string>("annual");
  const [dueDate, setDueDate] = useState<string>("");
  const [reviewer, setReviewer] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!m.uuid) return;
    const { data } = await supabase.from("employee_reviews")
      .select("id,review_type,status,overall_rating,period_start,period_end,due_date,scheduled_for,reviewer_name,created_at")
      .eq("employee_id", m.uuid).order("created_at", { ascending: false });
    setRows((data ?? []) as any);
  }, [m.uuid]);
  useEffect(() => { void load(); }, [load]);

  async function create() {
    if (!m.uuid) return;
    setBusy(true);
    const { error } = await supabase.from("employee_reviews").insert({
      employee_id: m.uuid,
      review_type: type as any,
      status: "scheduled" as any,
      due_date: dueDate || null,
      reviewer_name: reviewer || null,
    });
    setBusy(false);
    if (error) return toast.error("Could not create review", { description: error.message });
    toast.success("Evaluation scheduled");
    setOpenAssign(false); setReviewer(""); setDueDate(""); void load();
  }

  const current = rows[0];
  const history = rows.slice(1);

  return (
    <div className="space-y-6">
      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule evaluation</DialogTitle>
            <DialogDescription>Start a review cycle for {m.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="performance_improvement">Performance improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Reviewer</label>
              <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Reviewer name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Due date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAssign(false)}>Cancel</Button>
            <Button onClick={create} disabled={busy}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current cycle</p>
          <p className="mt-1 text-lg font-semibold">{current?.review_type ? current.review_type.replace(/_/g, " ") : "None"}</p>
          {current ? <StatusBadge tone={current.status === "completed" ? "ok" : "warn"}>{current.status}</StatusBadge>
                   : <StatusBadge tone="muted">No active review</StatusBadge>}
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Reviewer</p>
          <p className="mt-1 text-lg font-semibold">{current?.reviewer_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{current?.due_date ? `Due ${fmtDate(current.due_date)}` : "Not scheduled"}</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last rating</p>
          <p className="mt-1 text-lg font-semibold">{rows.find((r) => r.overall_rating)?.overall_rating ?? "—"}</p>
          <Button size="sm" className="mt-2" onClick={() => setOpenAssign(true)}><Plus className="size-3.5" /> Schedule</Button>
        </Card>
      </div>

      {history.length === 0 && !current ? (
        <Empty icon={ClipboardCheck} title="No evaluations yet"
               hint="Schedule the first cycle to begin tracking ratings and goals."
               action={<Button size="sm" onClick={() => setOpenAssign(true)}><Plus className="size-3.5" /> Schedule evaluation</Button>} />
      ) : (
        <section>
          <SectionTitle>Evaluation history</SectionTitle>
          <Card className="p-0">
            <ul className="divide-y divide-border/60">
              {rows.map((r) => (
                <li key={r.id} className="grid grid-cols-5 items-center gap-3 px-6 py-4 text-sm">
                  <span className="font-medium capitalize">{r.review_type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">{r.reviewer_name ?? "—"}</span>
                  <span><StatusBadge tone={r.status === "completed" ? "ok" : r.status === "draft" ? "muted" : "warn"}>{r.status}</StatusBadge></span>
                  <span>{r.overall_rating ?? "—"}</span>
                  <span className="text-right text-xs text-muted-foreground">{fmtDate(r.due_date ?? r.created_at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// DEVICES (real: employee_devices)
// ============================================================================

type DeviceRow = {
  id: string; device_type: string; name: string; serial: string | null;
  status: string; assigned_at: string; returned_at: string | null; notes: string | null;
};

function deviceIcon(type: string) {
  if (type === "tablet") return Tablet;
  if (type === "hotspot") return Wifi;
  if (type === "laptop") return Laptop;
  if (type === "phone") return Smartphone;
  return MonitorSmartphone;
}

function DevicesTab({ m, openAssign, setOpenAssign }: { m: DirectoryEmployee; openAssign: boolean; setOpenAssign: (v: boolean) => void }) {
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [inventory, setInventory] = useState<Array<{ id: string; device_type: string; name: string; serial: string | null; status: string }>>([]);
  const [mode, setMode] = useState<"inventory" | "manual">("inventory");
  const [pickId, setPickId] = useState<string>("");
  const [type, setType] = useState("tablet");
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!m.uuid) return;
    const { data } = await supabase.from("employee_devices")
      .select("id,device_type,name,serial,status,assigned_at,returned_at,notes")
      .eq("employee_id", m.uuid).order("assigned_at", { ascending: false });
    setRows((data ?? []) as any);
  }, [m.uuid]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!openAssign) return;
    void supabase.from("device_inventory")
      .select("id,device_type,name,serial,status")
      .eq("status", "available")
      .order("device_type").order("name")
      .then(({ data }) => setInventory((data ?? []) as any));
  }, [openAssign]);

  async function assign() {
    if (!m.uuid) return;
    setBusy(true);
    let payload: any;
    if (mode === "inventory") {
      const item = inventory.find((i) => i.id === pickId);
      if (!item) { setBusy(false); return toast.error("Pick a device from inventory"); }
      payload = { employee_id: m.uuid, inventory_id: item.id, device_type: item.device_type, name: item.name, serial: item.serial };
    } else {
      if (!name.trim()) { setBusy(false); return toast.error("Device name required"); }
      payload = { employee_id: m.uuid, device_type: type, name: name.trim(), serial: serial.trim() || null };
    }
    const { error } = await supabase.from("employee_devices").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Device assigned");
    setOpenAssign(false); setName(""); setSerial(""); setPickId(""); void load();
  }
  async function markReturned(id: string) {
    const { error } = await supabase.from("employee_devices").update({
      status: "returned", returned_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked returned"); void load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("employee_devices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast("Device record removed"); void load();
  }

  return (
    <div className="space-y-6">
      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign device</DialogTitle>
            <DialogDescription>Track a tablet, hotspot, or other asset issued to {m.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/40 p-1 text-xs">
              <button onClick={() => setMode("inventory")}
                className={cn("flex-1 rounded-md py-1.5 font-medium transition", mode === "inventory" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
                From inventory ({inventory.length})
              </button>
              <button onClick={() => setMode("manual")}
                className={cn("flex-1 rounded-md py-1.5 font-medium transition", mode === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
                Manual entry
              </button>
            </div>
            {mode === "inventory" ? (
              inventory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                  No available devices in inventory. Add one in Admin → Device Inventory, or switch to manual entry.
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Available devices</label>
                  <Select value={pickId} onValueChange={setPickId}>
                    <SelectTrigger><SelectValue placeholder="Select a device" /></SelectTrigger>
                    <SelectContent>
                      {inventory.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}{i.serial ? ` · SN ${i.serial}` : ""} ({i.device_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="hotspot">Hotspot</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Device name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g. iPad Air 11"`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Serial number (optional)</label>
                  <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="e.g. FK2X9P3Q1A" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAssign(false)}>Cancel</Button>
            <Button onClick={assign} disabled={busy || (mode === "inventory" ? !pickId : !name.trim())}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "device" : "devices"} on file.</p>
        <Button size="sm" onClick={() => setOpenAssign(true)}><Plus className="size-3.5" /> Assign device</Button>
      </div>

      {rows.length === 0 ? (
        <Empty icon={MonitorSmartphone} title="No devices assigned" hint="Track tablets, hotspots, and laptops issued to this employee."
               action={<Button size="sm" onClick={() => setOpenAssign(true)}><Plus className="size-3.5" /> Assign first device</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((d) => {
            const Icon = deviceIcon(d.device_type);
            const tone: "ok" | "warn" | "muted" =
              d.status === "assigned" ? "ok" : d.status === "in_transit" ? "warn" : "muted";
            return (
              <Card key={d.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {d.device_type}{d.serial && ` · SN ${d.serial}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge tone={tone}>{d.status.replace(/_/g, " ")}</StatusBadge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Assigned {fmtDate(d.assigned_at)}
                  {d.returned_at && ` · Returned ${fmtDate(d.returned_at)}`}
                </p>
                <div className="mt-3 flex gap-2">
                  {d.status !== "returned" && (
                    <Button size="sm" variant="outline" onClick={() => markReturned(d.id)}>
                      <CheckCircle2 className="size-3.5" /> Mark returned
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(d.id)}>
                    <Trash2 className="size-3.5" /> Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LOGINS (real: employee_logins) — names + reset-required flag only; passwords never read
// ============================================================================

type LoginRow = {
  id: string; system_name: string; system_category: string | null; username: string | null;
  login_url: string | null; is_active: boolean; password_reset_required: boolean; last_updated_at: string;
};

function LoginsTab({ m }: { m: DirectoryEmployee }) {
  const [rows, setRows] = useState<LoginRow[]>([]);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!m.uuid) return;
    // user_id on employee_logins is auth user id, not employee id; employees table has user_id
    const { data: emp } = await supabase.from("employees").select("user_id").eq("id", m.uuid).maybeSingle();
    if (!emp?.user_id) { setRows([]); return; }
    const { data } = await supabase.from("employee_logins")
      .select("id,system_name,system_category,username,login_url,is_active,password_reset_required,last_updated_at")
      .eq("user_id", emp.user_id).order("system_name");
    setRows((data ?? []) as any);
  }, [m.uuid]);
  useEffect(() => { void load(); }, [load]);

  async function requestReset(id: string, name: string) {
    const { error } = await supabase.from("employee_logins")
      .update({ password_reset_required: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Reset flagged for ${name}`, { description: "User will be prompted on next login." });
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
        <Lock className="size-3.5" /> Passwords are never displayed. Manage credentials in the Login Vault.
      </div>
      {rows.length === 0 ? (
        <Empty icon={KeyRound} title="No system logins on file"
               hint="Add credentials in the Login Vault to centrally manage access."
               action={<Button size="sm" onClick={() => navigate("/admin/login-vault")}>Open Login Vault</Button>} />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border/60">
            {rows.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.system_name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {s.username ?? "—"} · updated {fmtRel(s.last_updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={!s.is_active ? "muted" : s.password_reset_required ? "warn" : "ok"}>
                    {!s.is_active ? "Inactive" : s.password_reset_required ? "Reset needed" : "Active"}
                  </StatusBadge>
                  {s.login_url && (
                    <a href={s.login_url} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      Open <ExternalLink className="size-3" />
                    </a>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => requestReset(s.id, s.system_name)}>
                    <RefreshCw className="size-3.5" /> Reset
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// NFC (real: employee_nfc_tags)
// ============================================================================

type NfcRow = { id: string; tag_code: string; is_active: boolean; assigned_at: string; last_test_at: string | null; revoked_at: string | null };

// Minimal Web NFC typings (Chrome on Android only — not in lib.dom)
type NDEFRecordInit = { recordType: string; data?: string | BufferSource; lang?: string; encoding?: string; mediaType?: string };
type NDEFWriteOptions = { overwrite?: boolean; signal?: AbortSignal };
declare global {
  interface Window { NDEFReader?: new () => { write: (msg: { records: NDEFRecordInit[] }, opts?: NDEFWriteOptions) => Promise<void> } }
}

/**
 * Client-side mirror of the role-key CASE in `get_nfc_badge()`. Keep these
 * regexes in the same order as the SQL so the OS preview matches what a
 * tapped card actually renders.
 */
function roleKeyFromTitle(title: string | null | undefined): RoleKey {
  const t = (title ?? "").toLowerCase();
  if (/rbt|registered behavior|behavior tech/.test(t)) return "rbt";
  if (/bcba|bcaba|behavior analyst/.test(t)) return "bcba";
  if (/state director/.test(t)) return "state_director";
  if (/intake/.test(t)) return "intake";
  if (/authoriz/.test(t)) return "authorizations";
  if (/schedul/.test(t)) return "scheduling";
  if (/recruit/.test(t)) return "recruiting";
  if (/hr|human resources|people/.test(t)) return "hr";
  if (/billing|rcm|revenue|finance|payroll/.test(t)) return "finance";
  if (/qa|quality/.test(t)) return "qa";
  if (/marketing|growth|content/.test(t)) return "marketing";
  if (/case manager|family/.test(t)) return "case_manager";
  if (/ceo|coo|cfo|chief|president|executive|vp /.test(t)) return "executive";
  if (/director/.test(t)) return "leadership";
  return "employee";
}

/**
 * Compact preview of what `/nfc/:code` actually renders for this employee.
 * Presentation-only — no fetches; mirrors the public shell at a small scale
 * so admins know exactly which template their team will see.
 */
function NfcCardPreview({ m, variant }: { m: DirectoryEmployee; variant: ReturnType<typeof variantFor> }) {
  const VariantIcon = variant.icon;
  const tags = (m as DirectoryEmployee & { expertise?: string[]; skills?: string[] });
  const chips = [...(tags.expertise ?? []), ...(tags.skills ?? [])].slice(0, 3);
  return (
    <div className="w-[260px] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_30px_-18px_oklch(0.2_0.02_260/0.18)]">
      <p className="bg-muted/40 px-3 py-1.5 text-center text-[9px] uppercase tracking-widest text-muted-foreground">
        What others see · {variant.eyebrow}
      </p>
      <div className="flex flex-col items-center gap-2 px-4 pt-4 pb-3">
        <div className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
          <VariantIcon className="size-2.5" /> {variant.eyebrow}
        </div>
        {m.photo ? (
          <img src={m.photo} alt="" className="size-14 rounded-full object-cover ring-2 ring-primary/30" />
        ) : (
          <div className="grid size-14 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-primary/30">
            {initials(m.name)}
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold leading-tight">
            {m.name}
            {m.credential ? <span className="ml-1 text-[10px] font-normal text-muted-foreground">{m.credential}</span> : null}
          </p>
          {m.title && <p className="text-[10px] text-muted-foreground">{m.title}</p>}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
          <BadgeCheck className="size-2.5" /> Verified
        </span>
        <p className="line-clamp-2 max-w-[220px] text-center text-[10px] leading-snug text-muted-foreground">
          {m.blurb || variant.tagline}
        </p>
      </div>
      <div className="border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><Building2 className="size-2.5" /> {m.departmentName ?? "Blossom ABA Therapy"}</div>
        <div className="mt-1 flex items-center gap-1.5"><MapPin className="size-2.5" /> {(m.states ?? []).join(", ") || "Multi-state"}</div>
        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {chips.map((c) => (
              <span key={c} className="rounded-full bg-muted px-1.5 py-0.5 text-[9px]">{c}</span>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/60">
        {variant.actions.slice(0, 4).map((kind: NfcActionKind) => {
          const meta = ACTION_META[kind];
          const Icon = meta.icon;
          return (
            <div
              key={kind}
              className={`flex items-center justify-center gap-1 bg-card px-2 py-2 text-[10px] font-medium ${
                meta.destructive ? "text-destructive" : meta.accent ? "text-primary" : "text-foreground"
              }`}
            >
              <Icon className="size-3" /> {meta.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NfcTab({ m, openAssign, setOpenAssign }: { m: DirectoryEmployee; openAssign: boolean; setOpenAssign: (v: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<NfcRow | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false);
  const [writeAbort, setWriteAbort] = useState<AbortController | null>(null);
  const nfcSupported = typeof window !== "undefined" && "NDEFReader" in window;

  // Prefer the short tag code for a friendlier, brand-safe URL on the phone's tap prompt.
  const nfcUrl = nfcBadgeUrl(active?.tag_code ?? m.uuid ?? m.id);
  const isProductionUrl = nfcUrl.startsWith("https://blossom.");

  // Role-aware preview — mirrors what /nfc/:code actually renders for this person.
  const roleKey = roleKeyFromTitle(m.title);
  const variant = variantFor(roleKey);
  const VariantIcon = variant.icon;
  const isParentSafety = variant.parentSafety;
  const tapBlurb = isParentSafety
    ? "When a parent taps this tag, they'll see a verified Blossom Smart Badge with photo, role, and a way to report a concern — never personal contact info."
    : "When someone taps this tag, they'll see a verified Blossom business card with role, department, and the contact actions you've enabled in the Identity tab.";

  const load = useCallback(async () => {
    if (!m.uuid) return;
    const { data } = await supabase.from("employee_nfc_tags")
      .select("id,tag_code,is_active,assigned_at,last_test_at,revoked_at")
      .eq("employee_id", m.uuid).eq("is_active", true)
      .order("assigned_at", { ascending: false }).limit(1).maybeSingle();
    setActive((data as NfcRow | null) ?? null);
  }, [m.uuid]);
  useEffect(() => { void load(); }, [load]);

  async function assign() {
    if (!m.uuid) return;
    const code = (tagInput.trim() || `NFC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    setBusy(true);
    // Deactivate prior active tag(s)
    await supabase.from("employee_nfc_tags").update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("employee_id", m.uuid).eq("is_active", true);
    const { error } = await supabase.from("employee_nfc_tags").insert({
      employee_id: m.uuid, tag_code: code, is_active: true,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("NFC tag assigned", { description: `Tag ${code} linked to ${m.name}` });
    setOpenAssign(false); setTagInput(""); void load();
  }
  async function testTap() {
    if (!active) return;
    await supabase.from("employee_nfc_tags").update({ last_test_at: new Date().toISOString() }).eq("id", active.id);
    window.open(nfcUrl, "_blank");
    toast.success("Test tap recorded"); void load();
  }
  async function revoke() {
    if (!active) return;
    await supabase.from("employee_nfc_tags").update({ is_active: false, revoked_at: new Date().toISOString() }).eq("id", active.id);
    toast("Tag revoked"); void load();
  }

  async function writeToTag() {
    if (!active) return;
    if (!nfcSupported || !window.NDEFReader) {
      toast.error("This device can't write NFC tags", {
        description: "Open this page in Chrome on an Android phone, or use NXP TagWriter / NFC Tools to program the URL above.",
      });
      return;
    }
    try {
      const ndef = new window.NDEFReader();
      const ctrl = new AbortController();
      setWriteAbort(ctrl);
      setWriting(true);
      await ndef.write({ records: [{ recordType: "url", data: nfcUrl }] }, { signal: ctrl.signal });
      toast.success("Tag written", { description: "Tap any phone to the tag to verify the Smart Badge opens." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/abort/i.test(msg)) toast("Write cancelled");
      else if (/permission|NotAllowed/i.test(msg)) toast.error("NFC permission denied", { description: "Allow NFC access in the browser prompt and try again." });
      else toast.error("Couldn't write to tag", { description: msg });
    } finally {
      setWriting(false);
      setWriteAbort(null);
    }
  }

  return (
    <div className="space-y-6">
      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign NFC tag</DialogTitle>
            <DialogDescription>Enter the printed tag ID or leave blank to auto-generate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tag code</label>
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. NFC-1A2B3C" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAssign(false)}>Cancel</Button>
            <Button onClick={assign} disabled={busy}><ScanLine className="size-3.5" /> Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={writing} onOpenChange={(o) => { if (!o) writeAbort?.abort(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hold an NFC tag to your phone</DialogTitle>
            <DialogDescription>
              Touch a blank NFC tag to the back of your phone. We'll program it with the Smart Badge URL.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative grid size-20 place-items-center rounded-full bg-primary/10">
              <Smartphone className="size-9 text-primary animate-pulse" />
              <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <p className="text-xs text-muted-foreground">Waiting for tag…</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => writeAbort?.abort()}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">NFC status</p>
          <p className="mt-1 text-lg font-semibold">{active ? "Active" : "Not assigned"}</p>
          <StatusBadge tone={active ? "ok" : "muted"}>{active ? "Live" : "Inactive"}</StatusBadge>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tag code</p>
          <p className="mt-1 text-lg font-semibold">{active?.tag_code ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{active?.assigned_at ? `Assigned ${fmtDate(active.assigned_at)}` : "Assign a tag to begin"}</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last test</p>
          <p className="mt-1 text-lg font-semibold">{active?.last_test_at ? fmtRel(active.last_test_at) : "Never"}</p>
          <p className="text-xs text-muted-foreground">Tap to verify after assignment</p>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <VariantIcon className="size-3" /> {variant.eyebrow}
            </div>
            <SectionTitle hint={isParentSafety ? "Branded, parent-safe view" : "Branded business-card view"}>Profile URL</SectionTitle>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs">
              <span className="truncate text-muted-foreground">{nfcUrl}</span>
              <Button variant="ghost" size="sm" className="ml-auto text-xs"
                onClick={() => {
                  void navigator.clipboard?.writeText(nfcUrl);
                  setCopied(true); toast.success("Profile URL copied");
                  setTimeout(() => setCopied(false), 1500);
                }}>
                <Copy className="size-3.5" /> {copied ? "Copied" : "Copy"}
              </Button>
              <a href={nfcUrl} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Preview <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!active ? (
                <Button size="sm" onClick={() => setOpenAssign(true)}><ScanLine className="size-3.5" /> Assign tag</Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={testTap}><Sparkles className="size-3.5" /> Test tap</Button>
                  <Button
                    size="sm"
                    onClick={writeToTag}
                    disabled={!nfcSupported || writing}
                    title={nfcSupported ? "Hold a blank NFC tag to the back of your phone" : "Web NFC works in Chrome on Android. On iPhone or desktop, use NXP TagWriter with the URL above."}
                  >
                    <Smartphone className="size-3.5" /> {writing ? "Writing…" : "Write to NFC tag"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpenAssign(true)}><RefreshCw className="size-3.5" /> Reassign</Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={revoke}>
                    <Trash2 className="size-3.5" /> Revoke
                  </Button>
                </>
              )}
            </div>
            {!nfcSupported && active && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                One-tap writing requires Chrome on Android. On other devices, copy the URL above into NXP TagWriter or NFC Tools.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {tapBlurb}
            </p>
            <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Write this URL to the physical tag</p>
              <p className="mt-1">
                Use any NFC writer app (NXP TagWriter, NFC Tools, etc.) and program the tag with the exact URL above. The phone tap prompt will show <span className="font-medium text-foreground">{new URL(nfcUrl).host}</span>, so the person tapping recognizes it as safe.
              </p>
              {active && (
                <p className="mt-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-foreground">
                  Already tapped a card and got "badge isn't recognized"? The physical tag is still programmed with the old URL. Tap <span className="font-medium">Write to NFC tag</span> above (or rewrite it from NXP TagWriter) so it points at the URL shown here.
                </p>
              )}
              {!isProductionUrl && (
                <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-amber-700 dark:text-amber-400">
                  Heads up: this URL points at the preview environment. Republish to the production domain before programming real cards, or parents will see a Lovable login screen.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <NfcCardPreview m={m} variant={variant} />
            <div className="grid place-items-center rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="rounded-lg bg-white p-2">
                <QRCodeSVG value={nfcUrl} size={96} level="M" includeMargin={false} />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">QR backup</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle hint={variant.tagline}>{isParentSafety ? "Parent tap experience" : "Tap experience"}</SectionTitle>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-600" /> Branded Blossom verification</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-600" /> Photo, name, role, department</li>
            {variant.actions.map((kind) => {
              const meta = ACTION_META[kind];
              const Icon = meta.icon;
              return (
                <li key={kind} className="flex items-center gap-2">
                  <Icon className={`size-3.5 ${meta.destructive ? "text-destructive" : meta.accent ? "text-primary" : "text-emerald-600"}`} />
                  {meta.label}
                </li>
              );
            })}
            {isParentSafety ? (
              <li className="flex items-center gap-2"><EyeOff className="size-3.5 text-muted-foreground" /> Personal contact info hidden</li>
            ) : (
              <li className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /> Save to Contacts adds to phone</li>
            )}
          </ul>
        </Card>
        <Card>
          <SectionTitle>Tag lifecycle</SectionTitle>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /> Assign once — tag follows employee</li>
            <li className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /> Revoke instantly on offboarding</li>
            <li className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /> Reassign printed tags between employees</li>
          </ul>
        </Card>
      </div>

      <SmartBadgeReadiness m={m} isParentSafety={isParentSafety} />
    </div>
  );
}

// ============================================================================
// SMART BADGE READINESS
// ----------------------------------------------------------------------------
// A checklist that mirrors the public Smart Badge surface. Tells the admin
// exactly which fields are missing so the printed NFC card / digital business
// card looks complete instead of "sparse".
// ============================================================================

type ReadinessRow = {
  bio: string | null;
  about_me: string | null;
  expertise: string[] | null;
  skills: string[] | null;
  languages: string[] | null;
  pronouns: string | null;
  credential: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
};

function SmartBadgeReadiness({ m, isParentSafety }: { m: DirectoryEmployee; isParentSafety: boolean }) {
  const navigate = useNavigate();
  const [row, setRow] = useState<ReadinessRow | null>(null);

  useEffect(() => {
    if (!m.uuid) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("bio,about_me,expertise,skills,languages,pronouns,credential,photo_url,email,phone")
        .eq("id", m.uuid!)
        .maybeSingle();
      if (!cancelled && data) setRow(data as ReadinessRow);
    })();
    return () => { cancelled = true; };
  }, [m.uuid]);

  const has = (v: unknown) =>
    Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : Boolean(v);

  // `m.photo` is the resolved display photo (uploaded or brochure fallback).
  // We still flag it as "Add a photo" until a real one is uploaded so the
  // public badge isn't relying on the generic brochure asset forever.
  const photoUploaded = has(row?.photo_url);
  const items: { label: string; ok: boolean; hint: string; onFix: () => void }[] = [
    {
      label: "Profile photo",
      ok: photoUploaded,
      hint: photoUploaded ? "Uploaded" : m.photo ? "Using brochure fallback — upload a real photo" : "Missing — initials only",
      onFix: () => {
        document.querySelector<HTMLElement>("main")?.scrollTo({ top: 0, behavior: "smooth" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast("Use the camera icon on the photo at the top to upload");
      },
    },
    { label: "Job title", ok: has(m.title), hint: m.title || "Missing", onFix: () => m.uuid && navigate(`/hr/directory/${m.uuid}`) },
    { label: "Department", ok: has(m.departmentName), hint: m.departmentName || "Unassigned", onFix: () => m.uuid && navigate(`/hr/directory/${m.uuid}`) },
    { label: "States served", ok: (m.states ?? []).length > 0, hint: (m.states ?? []).join(", ") || "Missing", onFix: () => m.uuid && navigate(`/hr/directory/${m.uuid}`) },
    { label: "Credential", ok: has(row?.credential), hint: row?.credential || "Optional — e.g. BCBA, RBT", onFix: () => m.uuid && navigate(`/hr/directory/${m.uuid}`) },
    { label: "Pronouns", ok: has(row?.pronouns), hint: row?.pronouns || "Optional", onFix: () => m.uuid && navigate(`/hr/directory/${m.uuid}`) },
    { label: "About me / bio", ok: has(row?.about_me) || has(row?.bio), hint: has(row?.about_me) || has(row?.bio) ? "Set" : "Missing — shown under the photo", onFix: () => toast("Open the Identity tab to edit About me") },
    { label: "Expertise tags", ok: (row?.expertise ?? []).length > 0, hint: (row?.expertise ?? []).slice(0, 3).join(", ") || "Missing — adds chips to the card", onFix: () => toast("Open the Identity tab to add expertise") },
    { label: "Skills", ok: (row?.skills ?? []).length > 0, hint: (row?.skills ?? []).slice(0, 3).join(", ") || "Optional", onFix: () => toast("Open the Identity tab to add skills") },
    { label: "Languages", ok: (row?.languages ?? []).length > 0, hint: (row?.languages ?? []).join(", ") || "Optional", onFix: () => toast("Open the Identity tab to add languages") },
  ];
  if (!isParentSafety) {
    items.push(
      { label: "Work email", ok: has(row?.email ?? m.email), hint: row?.email ?? m.email ?? "Required for Save to Contacts", onFix: () => m.uuid && navigate(`/hr/directory/${m.uuid}`) },
      { label: "Work phone", ok: has(row?.phone ?? m.phone), hint: row?.phone ?? m.phone ?? "Required for Call / Message buttons", onFix: () => m.uuid && navigate(`/hr/directory/${m.uuid}`) },
    );
  }

  const complete = items.filter((i) => i.ok).length;
  const total = items.length;
  const pct = Math.round((complete / total) * 100);
  const tone = pct >= 90 ? "ok" : pct >= 60 ? "warn" : "crit";

  return (
    <Card>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <SectionTitle hint={isParentSafety ? "Parent-safety variant" : "Business-card variant"}>Smart Badge readiness</SectionTitle>
          <p className="text-xs text-muted-foreground">
            {complete} of {total} fields complete — {pct >= 90 ? "ready to print" : pct >= 60 ? "almost there" : "needs more info"}
          </p>
        </div>
        <StatusBadge tone={tone}>{pct}%</StatusBadge>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-destructive",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((i) => (
          <li
            key={i.label}
            className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
          >
            <div className="flex items-start gap-2">
              {i.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 text-amber-500" />
              )}
              <div>
                <p className="text-xs font-medium text-foreground">{i.label}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{i.hint}</p>
              </div>
            </div>
            {!i.ok && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={i.onFix}>
                <Pencil className="size-3" /> Fix
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ============================================================================
// PERMISSIONS
// ============================================================================

function PermissionsTab({ m }: { m: DirectoryEmployee }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
          <Field label="Role" value={m.title} />
          <Field label="Leadership level" value={m.leadershipLevel ?? "individual"} />
          <Field label="Department" value={m.departmentName ?? "—"} />
          <Field label="State access" value={(m.states ?? []).join(", ") || "—"} />
          <Field label="Module access" value="Role-derived" />
          <Field label="Administrative access" value={m.leadershipLevel === "executive" ? "Yes" : "None"} />
        </div>
      </Card>
      <Empty icon={ShieldCheck} title="Open the Permissions module for granular controls"
             hint="Module + feature gates live in the dedicated Permissions screen."
             action={<Button size="sm" onClick={() => navigate("/admin/permissions")}>Open Permissions</Button>} />
    </div>
  );
}

// ============================================================================
// ACTIVITY (real: employee_timeline)
// ============================================================================

type TimelineRow = { id: string; event_type: string; description: string; created_at: string; created_by_name: string | null };

function timelineIcon(t: string) {
  if (t.includes("training")) return GraduationCap;
  if (t.includes("review") || t.includes("evaluation")) return ClipboardCheck;
  if (t.includes("login") || t.includes("signin")) return KeyRound;
  if (t.includes("device")) return MonitorSmartphone;
  if (t.includes("permission")) return ShieldCheck;
  if (t.includes("hired") || t.includes("created")) return UserCircle2;
  return Sparkles;
}

function ActivityTab({ m }: { m: DirectoryEmployee }) {
  const [rows, setRows] = useState<TimelineRow[]>([]);
  useEffect(() => {
    if (!m.uuid) return;
    void supabase.from("employee_timeline")
      .select("id,event_type,description,created_at,created_by_name")
      .eq("employee_id", m.uuid).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setRows((data ?? []) as any));
  }, [m.uuid]);

  if (rows.length === 0) {
    return <Empty icon={History} title="No activity yet" hint="Training, evaluation, and access changes will be recorded here automatically." />;
  }

  return (
    <Card className="p-0">
      <ol className="divide-y divide-border/60">
        {rows.map((e) => {
          const Icon = timelineIcon(e.event_type);
          return (
            <li key={e.id} className="flex items-center gap-4 px-6 py-4">
              <div className="grid size-9 place-items-center rounded-full bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-foreground">{e.description}</p>
                {e.created_by_name && <p className="text-[11px] text-muted-foreground">by {e.created_by_name}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{fmtRel(e.created_at)}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ============================================================================
// OVERVIEW (computed from real tabs)
// ============================================================================

function OverviewTab({ m, jump }: { m: DirectoryEmployee; jump: (t: TabId) => void }) {
  const [stats, setStats] = useState({
    trainingTotal: 0, trainingDone: 0, reviewCurrent: null as string | null,
    devices: 0, logins: 0, nfcActive: false, lastActivity: null as string | null,
  });
  useEffect(() => {
    if (!m.uuid) return;
    (async () => {
      const [{ data: emp }] = await Promise.all([
        supabase.from("employees").select("user_id").eq("id", m.uuid).maybeSingle(),
      ]);
      const [tr, rv, dv, nfc, tl] = await Promise.all([
        supabase.from("employee_trainings").select("status").eq("employee_id", m.uuid!),
        supabase.from("employee_reviews").select("status").eq("employee_id", m.uuid!).order("created_at", { ascending: false }).limit(1),
        supabase.from("employee_devices").select("id").eq("employee_id", m.uuid!).neq("status", "returned"),
        supabase.from("employee_nfc_tags").select("id").eq("employee_id", m.uuid!).eq("is_active", true).limit(1),
        supabase.from("employee_timeline").select("created_at").eq("employee_id", m.uuid!).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const loginsRes = emp?.user_id
        ? await supabase.from("employee_logins").select("id", { count: "exact", head: true }).eq("user_id", emp.user_id)
        : { count: 0 } as any;
      const tRows = (tr.data ?? []) as Array<{ status: string }>;
      setStats({
        trainingTotal: tRows.length,
        trainingDone: tRows.filter((r) => r.status === "completed").length,
        reviewCurrent: (rv.data?.[0] as any)?.status ?? null,
        devices: (dv.data ?? []).length,
        logins: (loginsRes as any).count ?? 0,
        nfcActive: ((nfc.data ?? []).length) > 0,
        lastActivity: (tl.data as any)?.created_at ?? null,
      });
    })();
  }, [m.uuid]);

  const pct = stats.trainingTotal ? Math.round((stats.trainingDone / stats.trainingTotal) * 100) : 0;

  type Tone = "ok" | "warn" | "muted";
  const snapshot: { icon: React.ElementType; label: string; value: string; sub: string; tone: Tone; tab: TabId }[] = [
    { icon: GraduationCap, label: "Training", value: stats.trainingTotal ? `${pct}%` : "—", sub: `${stats.trainingDone} of ${stats.trainingTotal}`, tone: stats.trainingTotal && pct === 100 ? "ok" : stats.trainingTotal ? "warn" : "muted", tab: "training" },
    { icon: ClipboardCheck, label: "Evaluation", value: stats.reviewCurrent ?? "None", sub: stats.reviewCurrent ? "Most recent" : "Not scheduled", tone: stats.reviewCurrent ? "ok" : "muted", tab: "evaluations" },
    { icon: MonitorSmartphone, label: "Devices", value: String(stats.devices), sub: stats.devices ? "Assigned" : "None on file", tone: stats.devices ? "ok" : "muted", tab: "devices" },
    { icon: KeyRound, label: "Logins", value: String(stats.logins), sub: stats.logins ? "Systems linked" : "Vault empty", tone: stats.logins ? "ok" : "muted", tab: "logins" },
    { icon: ScanLine, label: "NFC ID", value: stats.nfcActive ? "Active" : "Inactive", sub: stats.nfcActive ? "Tag live" : "Not assigned", tone: stats.nfcActive ? "ok" : "muted", tab: "nfc" },
    { icon: Clock, label: "Last activity", value: fmtRel(stats.lastActivity), sub: stats.lastActivity ? fmtDate(stats.lastActivity) : "—", tone: stats.lastActivity ? "ok" : "muted", tab: "activity" },
  ];

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle>Operational snapshot</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {snapshot.map((s) => (
            <button key={s.label} onClick={() => jump(s.tab)} className="text-left">
              <Card className="p-4 transition hover:border-border">
                <div className="mb-2 grid size-8 place-items-center rounded-full bg-muted">
                  <s.icon className="size-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-base font-semibold text-foreground">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</p>
              </Card>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { members, loading } = useEmployeeDirectory();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [openAssignNfc, setOpenAssignNfc] = useState(false);
  const [openAssignTraining, setOpenAssignTraining] = useState(false);
  const [openAssignEval, setOpenAssignEval] = useState(false);
  const [openAssignDevice, setOpenAssignDevice] = useState(false);

  const member = useMemo(
    () => members.find((m) => m.id === employeeId || m.uuid === employeeId) ?? null,
    [members, employeeId],
  );

  if (loading && !member) {
    return <OSShell><div className="mx-auto max-w-5xl p-10"><div className="h-40 animate-pulse rounded-2xl bg-muted/50" /></div></OSShell>;
  }
  if (!member) {
    return (
      <OSShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Employee not found.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/user-management")}>
            <ArrowLeft className="size-3.5" /> Back to users
          </Button>
        </div>
      </OSShell>
    );
  }

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-1 md:px-2">
        <Link to="/user-management" className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All users
        </Link>

        {/* Header */}
        <Card className="mb-8 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              {member.uuid && user?.id ? (
                <AvatarUploader
                  ownerUserId={user.id}
                  employeeId={member.uuid}
                  currentUrl={member.photo ?? null}
                  initials={initials(member.name)}
                  size="xl"
                  appearance="light"
                />
              ) : member.photo ? (
                <img src={member.photo} alt="" className="size-20 rounded-full object-cover ring-1 ring-border/60" />
              ) : (
                <div className="size-20 rounded-full bg-muted grid place-items-center text-lg font-semibold text-muted-foreground ring-1 ring-border/60">
                  {initials(member.name)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{member.name}</h1>
                  <BadgeCheck className="size-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{member.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{member.departmentName ?? "Unassigned"}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{(member.states ?? []).join(", ") || "—"}</span>
                  {member.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" />{member.email}</span>}
                  {member.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{member.phone}</span>}
                  <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />ID {member.uuid?.slice(0, 6).toUpperCase() ?? "—"}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="text-xs"
                onClick={() => member.uuid ? navigate(`/hr/directory/${member.uuid}`) : toast("No linked HR record")}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="text-xs"
                onClick={() => { setTab("training"); setOpenAssignTraining(true); }}>
                <GraduationCap className="size-3.5" /> Assign training
              </Button>
              <Button size="sm" variant="outline" className="text-xs"
                onClick={() => { setTab("evaluations"); setOpenAssignEval(true); }}>
                <ClipboardCheck className="size-3.5" /> Assign evaluation
              </Button>
              <Button size="sm" variant="outline" className="text-xs"
                onClick={() => { setTab("devices"); setOpenAssignDevice(true); }}>
                <Smartphone className="size-3.5" /> Assign device
              </Button>
              <Button size="sm" className="text-xs"
                onClick={() => { setTab("nfc"); setOpenAssignNfc(true); }}>
                <ScanLine className="size-3.5" /> Generate NFC
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <nav className="sticky top-0 z-10 mb-8 -mx-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/80 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <ul className="flex items-center gap-1">
            {TABS.map((t) => (
              <li key={t.id}>
                <button onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 h-9 text-xs font-medium transition",
                    tab === t.id ? "bg-primary text-primary-foreground shadow-sm"
                                 : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}>
                  <t.icon className="size-3.5" /> {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pb-16">
          {tab === "overview" && <OverviewTab m={member} jump={setTab} />}
          {tab === "employment" && <EmploymentTab m={member} />}
          {tab === "training" && <TrainingTab m={member} openAssign={openAssignTraining} setOpenAssign={setOpenAssignTraining} />}
          {tab === "evaluations" && <EvaluationsTab m={member} openAssign={openAssignEval} setOpenAssign={setOpenAssignEval} />}
          {tab === "devices" && <DevicesTab m={member} openAssign={openAssignDevice} setOpenAssign={setOpenAssignDevice} />}
          {tab === "logins" && <LoginsTab m={member} />}
          {tab === "nfc" && <NfcTab m={member} openAssign={openAssignNfc} setOpenAssign={setOpenAssignNfc} />}
          {tab === "permissions" && <PermissionsTab m={member} />}
          {tab === "activity" && <ActivityTab m={member} />}
        </div>
      </div>
    </OSShell>
  );
}