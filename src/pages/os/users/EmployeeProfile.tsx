import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, ShieldCheck, Pencil, GraduationCap, ClipboardCheck, Smartphone,
  KeyRound, ScanLine, Mail, Phone, Building2, MapPin, CalendarDays, Briefcase,
  CheckCircle2, Clock, AlertTriangle, Download, ExternalLink, Plus, Lock,
  Sparkles, History, BadgeCheck, MonitorSmartphone, Wifi, Tablet, Laptop,
  RefreshCw, ChevronRight, Eye, EyeOff, Copy, QrCode, UserCircle2, Trash2,
} from "lucide-react";
import { OSShell } from "../OSShell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEmployeeDirectory, type DirectoryEmployee } from "@/hooks/useEmployeeDirectory";
import { usePhoneSystem } from "@/contexts/PhoneSystemContext";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  { id: "nfc", label: "NFC ID", icon: ScanLine },
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

function Empty({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-10 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ============================================================================
// TABS
// ============================================================================

function OverviewTab({ m }: { m: DirectoryEmployee }) {
  const setup = [
    { label: "Employment", state: "ok" as const, hint: "Synced from Viventium" },
    { label: "Training Academy", state: "warn" as const, hint: "62% complete" },
    { label: "Evaluations", state: "ok" as const, hint: "Current cycle on track" },
    { label: "Devices", state: "warn" as const, hint: "No device assigned" },
    { label: "Logins", state: "ok" as const, hint: "5 systems linked" },
    { label: "Permissions", state: "ok" as const, hint: "Role-based" },
    { label: "NFC", state: "muted" as const, hint: "Not assigned" },
  ];
  const snapshot = [
    { icon: GraduationCap, label: "Training Progress", value: "62%", tone: "warn" as const, sub: "8 of 13 modules" },
    { icon: ClipboardCheck, label: "Evaluation Status", value: "Current", tone: "ok" as const, sub: "Next: Mar 14" },
    { icon: MonitorSmartphone, label: "Devices Assigned", value: "0", tone: "muted" as const, sub: "Request a device" },
    { icon: Clock, label: "Last Login", value: "2h ago", tone: "ok" as const, sub: "Blossom OS · Web" },
    { icon: ScanLine, label: "NFC Status", value: "Inactive", tone: "muted" as const, sub: "Not yet assigned" },
    { icon: ShieldCheck, label: "Permissions", value: "Standard", tone: "ok" as const, sub: m.leadershipLevel ?? "individual" },
  ];
  return (
    <div className="space-y-10">
      {/* Snapshot */}
      <section>
        <SectionTitle>Operational snapshot</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {snapshot.map((s) => (
            <Card key={s.label} className="p-4">
              <div className="mb-2 grid size-8 place-items-center rounded-full bg-muted">
                <s.icon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-base font-semibold text-foreground">{s.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Setup checklist */}
      <section>
        <SectionTitle hint="Each step represents a connected system">Employee setup</SectionTitle>
        <Card className="p-0">
          <ul className="divide-y divide-border/60">
            {setup.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                  {s.state === "ok"
                    ? <CheckCircle2 className="size-4 text-emerald-600" />
                    : s.state === "warn"
                    ? <AlertTriangle className="size-4 text-amber-600" />
                    : <Clock className="size-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.hint}</p>
                  </div>
                </div>
                <StatusBadge tone={s.state}>
                  {s.state === "ok" ? "Complete" : s.state === "warn" ? "In progress" : "Needs attention"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

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
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
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

function TrainingTab({ m }: { m: DirectoryEmployee }) {
  const journey = `${m.title?.split(" ")[0] ?? "Employee"} Journey`;
  const modules = [
    { name: "Welcome to Blossom", state: "ok" as const },
    { name: "Our Mission & Values", state: "ok" as const },
    { name: "HIPAA Foundations", state: "ok" as const },
    { name: "Role-specific Onboarding", state: "warn" as const },
    { name: "Field Readiness", state: "warn" as const },
    { name: "Graduation", state: "muted" as const },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Assigned journey</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{journey}</p>
            <p className="mt-1 text-xs text-muted-foreground">Started Feb 1 · Last activity Yesterday</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tracking-tight">62%</p>
            <p className="text-[11px] text-muted-foreground">8 of 13 modules</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: "62%" }} />
        </div>
      </Card>

      <section>
        <SectionTitle>Modules</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Card key={mod.name} className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{mod.name}</p>
                <StatusBadge tone={mod.state}>
                  {mod.state === "ok" ? "Complete" : mod.state === "warn" ? "In progress" : "Not started"}
                </StatusBadge>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full",
                    mod.state === "ok" ? "bg-emerald-500 w-full"
                    : mod.state === "warn" ? "bg-amber-500 w-1/2"
                    : "bg-muted-foreground/30 w-0")}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Certificates</SectionTitle>
        <Card className="p-0">
          <ul className="divide-y divide-border/60">
            {[{ name: "HIPAA Foundations", date: "Feb 12, 2026" }, { name: "Safety & Crisis", date: "Feb 18, 2026" }].map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">Completed {c.date}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs"><Download className="size-3.5" /> Download</Button>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function EvaluationsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current cycle</p>
          <p className="mt-1 text-lg font-semibold">Q1 2026</p>
          <StatusBadge tone="warn"><Clock className="size-3" />In progress</StatusBadge>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Self evaluation</p>
          <p className="mt-1 text-lg font-semibold">Submitted</p>
          <p className="text-xs text-muted-foreground">Feb 22, 2026</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Leadership evaluation</p>
          <p className="mt-1 text-lg font-semibold">Awaiting reviewer</p>
          <p className="text-xs text-muted-foreground">Due Mar 14, 2026</p>
        </Card>
      </div>

      <section>
        <SectionTitle>Evaluation history</SectionTitle>
        <Card className="p-0">
          <ul className="divide-y divide-border/60">
            {[
              { cycle: "Q4 2025", reviewer: "C. Kaufman", score: "4.6 / 5", date: "Dec 18, 2025" },
              { cycle: "Q3 2025", reviewer: "C. Kaufman", score: "4.4 / 5", date: "Sep 22, 2025" },
            ].map((e) => (
              <li key={e.cycle} className="grid grid-cols-4 items-center gap-3 px-6 py-4 text-sm">
                <span className="font-medium">{e.cycle}</span>
                <span className="text-muted-foreground">{e.reviewer}</span>
                <span>{e.score}</span>
                <span className="text-right text-xs text-muted-foreground">{e.date}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <SectionTitle>Coaching plans</SectionTitle>
        <Empty icon={Sparkles} title="No active coaching plans" hint="Assign one from the leadership evaluation review." />
      </section>
    </div>
  );
}

function DevicesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Devices assigned to this employee.</p>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.success("Device assignment request opened", { description: "IT will reach out to coordinate shipment." })}>
          <Plus className="size-3.5" /> Assign device
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[
          { icon: Tablet, type: "Tablet", name: "iPad Air 11\"", serial: "FK2X9P3Q1A", status: "ok" as const, statusLabel: "Assigned", date: "Jan 14, 2026" },
          { icon: Wifi, type: "Hotspot", name: "T-Mobile 5G", serial: "TMO-882-441", status: "warn" as const, statusLabel: "In transit", date: "Feb 26, 2026" },
        ].map((d) => (
          <Card key={d.serial}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-muted">
                  <d.icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">{d.type} · SN {d.serial}</p>
                </div>
              </div>
              <StatusBadge tone={d.status}>{d.statusLabel}</StatusBadge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Assigned {d.date}</p>
          </Card>
        ))}
      </div>
      <Empty icon={MonitorSmartphone} title="Device inventory module connects soon" hint="Full asset tracking, shipments, and returns will live here." />
    </div>
  );
}

function LoginsTab() {
  const systems = [
    { name: "Microsoft 365", user: "first.last@blossomaba.com", assigned: "Feb 1, 2026", status: "ok" as const },
    { name: "Blossom OS", user: "first.last@blossomaba.com", assigned: "Feb 1, 2026", status: "ok" as const },
    { name: "Viventium", user: "VIV-44821", assigned: "Feb 1, 2026", status: "ok" as const },
    { name: "CentralReach", user: "flast", assigned: "Feb 3, 2026", status: "ok" as const },
    { name: "Jivetel", user: "ext. 412", assigned: "Feb 6, 2026", status: "warn" as const },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
        <Lock className="size-3.5" /> Passwords are never displayed. Use the reset workflow to issue new credentials.
      </div>
      <Card className="p-0">
        <ul className="divide-y divide-border/60">
          {systems.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{s.user} · assigned {s.assigned}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={s.status}>{s.status === "ok" ? "Active" : "Pending"}</StatusBadge>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => toast.success(`Reset link sent for ${s.name}`, { description: `Sent to ${s.user}` })}>
                  <RefreshCw className="size-3.5" /> Reset
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

type NfcState = { tagId: string | null; assignedAt: string | null; lastTestAt: string | null };

function readNfcState(empId: string): NfcState {
  if (typeof window === "undefined") return { tagId: null, assignedAt: null, lastTestAt: null };
  try {
    const raw = localStorage.getItem(`nfc:${empId}`);
    if (!raw) return { tagId: null, assignedAt: null, lastTestAt: null };
    return JSON.parse(raw) as NfcState;
  } catch { return { tagId: null, assignedAt: null, lastTestAt: null }; }
}
function writeNfcState(empId: string, state: NfcState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`nfc:${empId}`, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("nfc:changed", { detail: { empId } }));
}

function NfcTab({ m, openAssign, setOpenAssign }: { m: DirectoryEmployee; openAssign: boolean; setOpenAssign: (v: boolean) => void }) {
  const nfcUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/nfc/${m.id}`;
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<NfcState>(() => readNfcState(m.id));
  const [tagInput, setTagInput] = useState("");
  useEffect(() => { setState(readNfcState(m.id)); }, [m.id]);

  const active = !!state.tagId;
  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleString() : "Never";

  function assign() {
    const id = tagInput.trim() || `NFC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const next: NfcState = { tagId: id, assignedAt: new Date().toISOString(), lastTestAt: state.lastTestAt };
    writeNfcState(m.id, next); setState(next); setTagInput(""); setOpenAssign(false);
    toast.success("NFC tag assigned", { description: `Tag ${id} linked to ${m.name}` });
  }
  function testTap() {
    const next: NfcState = { ...state, lastTestAt: new Date().toISOString() };
    writeNfcState(m.id, next); setState(next);
    window.open(`/nfc/${m.id}`, "_blank");
    toast.success("Test tap recorded");
  }
  function revoke() {
    writeNfcState(m.id, { tagId: null, assignedAt: null, lastTestAt: state.lastTestAt });
    setState(readNfcState(m.id));
    toast("NFC tag revoked", { description: "The tag will no longer resolve to this profile." });
  }

  return (
    <div className="space-y-6">
      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign NFC tag</DialogTitle>
            <DialogDescription>Enter the printed tag ID, or leave blank to auto-generate a code.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tag ID</label>
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. NFC-1A2B3C" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAssign(false)}>Cancel</Button>
            <Button onClick={assign}><ScanLine className="size-3.5" /> Assign</Button>
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
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tag ID</p>
          <p className="mt-1 text-lg font-semibold">{state.tagId ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{state.assignedAt ? `Assigned ${fmt(state.assignedAt)}` : "Assign a tag to begin"}</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last test</p>
          <p className="mt-1 text-lg font-semibold">{state.lastTestAt ? fmt(state.lastTestAt) : "Never"}</p>
          <p className="text-xs text-muted-foreground">Tap to verify after assignment</p>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <SectionTitle hint="Branded, parent-safe view">Profile URL</SectionTitle>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs">
              <span className="truncate text-muted-foreground">{nfcUrl}</span>
              <Button
                variant="ghost" size="sm" className="ml-auto text-xs"
                onClick={() => {
                  void navigator.clipboard?.writeText(nfcUrl);
                  setCopied(true);
                  toast.success("Profile URL copied");
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                <Copy className="size-3.5" /> {copied ? "Copied" : "Copy"}
              </Button>
              <a href={`/nfc/${m.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Preview <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!active ? (
                <Button size="sm" onClick={() => setOpenAssign(true)}><ScanLine className="size-3.5" /> Assign tag</Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={testTap}><Sparkles className="size-3.5" /> Test tap</Button>
                  <Button size="sm" variant="outline" onClick={() => setOpenAssign(true)}><RefreshCw className="size-3.5" /> Reassign tag</Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={revoke}><Trash2 className="size-3.5" /> Revoke</Button>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              When a parent taps the tag, they'll see a verified employee badge with photo, role, and a way to report a concern — never personal contact info.
            </p>
          </div>
          <div className="grid place-items-center rounded-2xl border border-border/70 bg-muted/30 p-6">
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG value={nfcUrl} size={128} level="M" includeMargin={false} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">QR backup</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle>Parent tap experience</SectionTitle>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-600" /> Branded Blossom verification</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-600" /> Photo, name, role, supervisor</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-600" /> Report concern · Emergency contact</li>
            <li className="flex items-center gap-2"><EyeOff className="size-3.5 text-muted-foreground" /> Personal contact info hidden</li>
          </ul>
        </Card>
        <Card>
          <SectionTitle>Employee tap experience</SectionTitle>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /> Quick links to My Profile, Training, Evaluations</li>
            <li className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /> My devices and schedule</li>
            <li className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /> CentralReach, Viventium, Phone System</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function PermissionsTab({ m }: { m: DirectoryEmployee }) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
          <Field label="Role" value={m.title} />
          <Field label="Permission group" value="Standard" />
          <Field label="Leadership level" value={m.leadershipLevel ?? "individual"} />
          <Field label="State access" value={(m.states ?? []).join(", ") || "—"} />
          <Field label="Module access" value="Role-derived" />
          <Field label="Administrative access" value="None" />
        </div>
      </Card>
      <Empty icon={ShieldCheck} title="Granular controls open in the Permissions module" hint="Use the dedicated Permissions screen to adjust module and feature access." />
    </div>
  );
}

function ActivityTab() {
  const events = [
    { icon: KeyRound, label: "Signed in to Blossom OS", when: "2h ago" },
    { icon: GraduationCap, label: "Completed module: Safety & Crisis", when: "Yesterday" },
    { icon: ClipboardCheck, label: "Submitted self-evaluation", when: "Feb 22" },
    { icon: ShieldCheck, label: "Permission group set to Standard", when: "Feb 14" },
    { icon: MonitorSmartphone, label: "iPad Air assigned", when: "Jan 14" },
    { icon: UserCircle2, label: "Profile created", when: "Feb 1" },
  ];
  return (
    <Card className="p-0">
      <ol className="divide-y divide-border/60">
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="grid size-9 place-items-center rounded-full bg-muted">
              <e.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="flex-1 text-sm text-foreground">{e.label}</p>
            <span className="text-xs text-muted-foreground">{e.when}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ============================================================================

export default function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { members, loading } = useEmployeeDirectory();
  const [tab, setTab] = useState<TabId>("overview");

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
        {/* Top breadcrumb */}
        <Link to="/user-management" className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All users
        </Link>

        {/* Profile header */}
        <Card className="mb-8 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              {member.photo ? (
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
              <Button size="sm" variant="outline" className="text-xs"><Pencil className="size-3.5" /> Edit</Button>
              <Button size="sm" variant="outline" className="text-xs"><GraduationCap className="size-3.5" /> Assign training</Button>
              <Button size="sm" variant="outline" className="text-xs"><ClipboardCheck className="size-3.5" /> Assign evaluation</Button>
              <Button size="sm" variant="outline" className="text-xs"><Smartphone className="size-3.5" /> Assign device</Button>
              <Button size="sm" className="text-xs"><ScanLine className="size-3.5" /> Generate NFC</Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <nav className="sticky top-0 z-10 mb-8 -mx-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/80 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <ul className="flex items-center gap-1">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 h-9 text-xs font-medium transition",
                    tab === t.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <t.icon className="size-3.5" /> {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Tab content */}
        <div className="pb-16">
          {tab === "overview" && <OverviewTab m={member} />}
          {tab === "employment" && <EmploymentTab m={member} />}
          {tab === "training" && <TrainingTab m={member} />}
          {tab === "evaluations" && <EvaluationsTab />}
          {tab === "devices" && <DevicesTab />}
          {tab === "logins" && <LoginsTab />}
          {tab === "nfc" && <NfcTab m={member} />}
          {tab === "permissions" && <PermissionsTab m={member} />}
          {tab === "activity" && <ActivityTab />}
        </div>
      </div>
    </OSShell>
  );
}