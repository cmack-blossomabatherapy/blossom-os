import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Users, ShieldCheck, IdCard, KeyRound, Smartphone, Box, Eye, EyeOff,
  Copy, Search, Plus, Lock, HeartHandshake, Briefcase,
  ClipboardList, CheckCircle2, BarChart3, type LucideIcon,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Shared layout                                                              */
/* -------------------------------------------------------------------------- */

interface HeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  actions?: ReactNode;
}

function PageHeader({ eyebrow, title, subtitle, icon: Icon, actions }: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          <Icon className="h-3.5 w-3.5" /> {eyebrow}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">{children}</div>
    </OSShell>
  );
}

function ActionPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-border/60 bg-muted/40 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function ActionRow({ actions }: { actions: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => <ActionPill key={a}>{a}</ActionPill>)}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <Card className="p-6 rounded-2xl border-border/60">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Role Management                                                         */
/* -------------------------------------------------------------------------- */

const ROLE_GROUPS = [
  {
    group: "Executive & Admin",
    roles: ["Super Admin", "Executive Leadership", "Operations Leadership"],
  },
  { group: "State Operations", roles: ["State Director", "Assistant State Director"] },
  { group: "Growth & Admissions", roles: ["Marketing Team", "Intake Team", "Business Development", "Recruiting Team"] },
  { group: "Clinical & Care Delivery", roles: ["Clinical Director", "BCBA", "Case Manager", "RBT", "Behavioral Support"] },
  { group: "Operations Execution", roles: ["Authorizations Team", "Scheduling Team", "Staffing Team", "QA Team"] },
  { group: "Business Office", roles: ["HR Team", "Credentialing Team"] },
];

export function RoleManagementPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="People & Access"
        title="Role Management"
        subtitle="Manage Blossom OS role access, menu visibility, and workspace permissions."
        icon={ShieldCheck}
        actions={<Button size="sm" variant="outline">Preview as role</Button>}
      />
      <ActionRow actions={["View role permissions", "Edit role access", "Preview as role", "Save permission changes"]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ROLE_GROUPS.map((g) => (
          <Card key={g.group} className="p-5 rounded-2xl border-border/60">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">{g.group}</div>
            <ul className="space-y-2">
              {g.roles.map((r) => (
                <li key={r} className="flex items-center justify-between text-sm">
                  <span>{r}</span>
                  <Badge variant="outline" className="text-xs">View</Badge>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Shell>
  );
}


/* -------------------------------------------------------------------------- */
/* 3. User Logins Vault — PIN gated                                            */
/* -------------------------------------------------------------------------- */

const MOCK_LOGINS = [
  { system: "CentralReach", url: "https://members.centralreach.com", username: "ops@blossomaba.com", password: "•••••••••••", owner: "Operations", dept: "Operations", notes: "Primary EMR", verified: "2 weeks ago", status: "Verified" },
  { system: "Viventium", url: "https://app.viventium.com", username: "payroll@blossomaba.com", password: "•••••••••••", owner: "Payroll", dept: "HR", notes: "Payroll & onboarding", verified: "1 month ago", status: "Verified" },
  { system: "Solum (VOB)", url: "https://app.solumhealth.com", username: "intake@blossomaba.com", password: "•••••••••••", owner: "Intake", dept: "Intake", notes: "VOB workflow", verified: "3 days ago", status: "Verified" },
  { system: "Bloom Growth", url: "https://app.bloomgrowth.com", username: "leadership@blossomaba.com", password: "•••••••••••", owner: "Leadership", dept: "Executive", notes: "L10 meetings", verified: "1 week ago", status: "Needs review" },
];

export function UserLoginsVaultPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const submitPin = () => {
    if (pin.length >= 4) { setUnlocked(true); setError(""); }
    else setError("Enter a valid PIN (4+ digits).");
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="People & Access"
        title="User Logins Vault"
        subtitle="Protected login reference for approved internal system access."
        icon={KeyRound}
        actions={unlocked ? (
          <Button size="sm" variant="outline" onClick={() => { setUnlocked(false); setRevealed({}); setPin(""); }}>
            <Lock className="h-4 w-4 mr-1.5" /> Lock vault
          </Button>
        ) : null}
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 text-amber-900 px-4 py-3 text-sm flex gap-3">
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          Access to this area is restricted and logged. Credentials are masked until you explicitly reveal them.
          Every reveal, copy, and edit action creates an audit trail.
        </div>
      </div>

      {!unlocked ? (
        <Card className="p-8 rounded-2xl border-border/60 max-w-md mx-auto text-center space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-muted grid place-items-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">PIN required</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your authorized PIN to view protected login records. Access to this area should be limited and logged.
            </p>
          </div>
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            className="text-center h-11"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={submitPin} className="w-full">Unlock Vault</Button>
        </Card>
      ) : (
        <>
          <ActionRow actions={["Search login", "Add login", "Edit login", "Copy username", "Copy password (after reveal)", "Mark verified", "Archive login"]} />
          <Card className="rounded-2xl border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {["System", "URL", "Username", "Password", "Owner", "Department", "Last verified", "Status", ""].map((h) => (
                      <th key={h} className="text-left font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LOGINS.map((l) => {
                    const open = revealed[l.system];
                    return (
                      <tr key={l.system} className="border-t border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{l.system}</td>
                        <td className="px-4 py-3 text-muted-foreground"><a href={l.url} target="_blank" rel="noreferrer" className="hover:underline">{l.url}</a></td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="inline-flex items-center gap-2">
                            <span>{l.username}</span>
                            <button className="text-muted-foreground/70 hover:text-foreground" title="Copy"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono">
                          <div className="inline-flex items-center gap-2">
                            <span>{open ? "Bl0ssom-Ops-Demo!" : l.password}</span>
                            <button onClick={() => setRevealed((r) => ({ ...r, [l.system]: !open }))} className="text-muted-foreground/70 hover:text-foreground">
                              {open ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{l.owner}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.dept}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.verified}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn(
                            l.status === "Verified" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            l.status === "Needs review" && "bg-amber-50 text-amber-800 border-amber-200",
                          )}>{l.status}</Badge>
                        </td>
                        <td className="px-4 py-3"><Button size="sm" variant="ghost">Edit</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. NFC Badge Management                                                    */
/* -------------------------------------------------------------------------- */

const MOCK_BADGES = [
  { employee: "Lauren Brewer", badgeId: "BLM-0001", status: "Active", assigned: "2024-06-12", lastUsed: "Today", replacement: "No", notes: "Primary admin badge" },
  { employee: "Briana Diaz", badgeId: "BLM-0002", status: "Active", assigned: "2024-08-04", lastUsed: "Yesterday", replacement: "No", notes: "" },
  { employee: "Maria Lopez", badgeId: "BLM-0014", status: "Pending", assigned: "2025-01-09", lastUsed: "—", replacement: "No", notes: "Awaiting activation" },
  { employee: "Jordan Park", badgeId: "BLM-0021", status: "Lost", assigned: "2024-11-22", lastUsed: "3 weeks ago", replacement: "Yes", notes: "Replacement requested" },
];

export function NFCBadgeManagementPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="People & Access"
        title="NFC Badge Management"
        subtitle="Manage employee NFC badges, activation status, replacement needs, and badge assignment history."
        icon={IdCard}
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Assign badge</Button>}
      />
      <ActionRow actions={["Assign badge", "Activate badge", "Deactivate badge", "Mark lost / replaced", "View badge history"]} />
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Employee", "Badge ID", "Status", "Assigned", "Last used", "Replacement", "Notes", ""].map((h) => (
                  <th key={h} className="text-left font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_BADGES.map((b) => (
                <tr key={b.badgeId} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{b.employee}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{b.badgeId}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn(
                      b.status === "Active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                      b.status === "Pending" && "bg-amber-50 text-amber-800 border-amber-200",
                      b.status === "Lost" && "bg-red-50 text-red-700 border-red-200",
                    )}>{b.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.assigned}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.lastUsed}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.replacement}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.notes}</td>
                  <td className="px-4 py-3"><Button size="sm" variant="ghost">History</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Device Requests                                                         */
/* -------------------------------------------------------------------------- */

const MOCK_DEVICE_REQUESTS = [
  { id: "DR-104", employee: "Ashley Tran", device: "iPad (Session)", status: "Pending Approval", submitted: "2 days ago" },
  { id: "DR-103", employee: "Devon Ross", device: "MacBook Air", status: "Approved", submitted: "5 days ago" },
  { id: "DR-101", employee: "Maria Lopez", device: "Headset + Webcam", status: "Shipped", submitted: "1 week ago" },
  { id: "DR-098", employee: "Jordan Park", device: "RBT iPad", status: "Returned", submitted: "3 weeks ago" },
];

export function DeviceRequestsPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="People & Access"
        title="Device Requests"
        subtitle="Track equipment requests, approvals, shipping, returns, and status updates."
        icon={Smartphone}
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Submit request</Button>}
      />
      <ActionRow actions={["Submit device request", "Approve request", "Deny request", "Assign device", "Update shipment status", "Mark returned"]} />
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{["Request", "Employee", "Device", "Status", "Submitted", ""].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-3">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {MOCK_DEVICE_REQUESTS.map((r) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.employee}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.device}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn(
                      r.status === "Pending Approval" && "bg-amber-50 text-amber-800 border-amber-200",
                      r.status === "Approved" && "bg-sky-50 text-sky-700 border-sky-200",
                      r.status === "Shipped" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                      r.status === "Returned" && "bg-muted text-muted-foreground",
                    )}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.submitted}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost">Open</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. HR Pages                                                                */
/* -------------------------------------------------------------------------- */

function HRPlaceholder({ title, icon }: { title: string; icon: LucideIcon }) {
  return (
    <Shell>
      <PageHeader
        eyebrow="HR"
        title={title}
        subtitle="HR workflows will centralize employee support, requests, compliance items, documentation, communication, devices, and badge support."
        icon={icon}
      />
      <Card className="p-10 rounded-2xl border-border/60 text-center">
        <div className="h-12 w-12 mx-auto rounded-full bg-muted grid place-items-center mb-4">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Ready for Blossom OS data</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Once this workflow is connected, this view will show live status, trends, ownership, and action items.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </Card>
    </Shell>
  );
}

export const HRDashboardPage = () => <HRPlaceholder title="HR Dashboard" icon={HeartHandshake} />;
export const HREmployeeRecordsPage = () => <HRPlaceholder title="Employee Records" icon={Users} />;
export const HRRequestsPage = () => <HRPlaceholder title="HR Requests" icon={ClipboardList} />;
export const HRComplianceItemsPage = () => <HRPlaceholder title="Compliance Items" icon={ShieldCheck} />;
export const HRNFCBadgeSupportPage = () => <HRPlaceholder title="NFC Badge Support" icon={IdCard} />;
export const HRReportsPage = () => <HRPlaceholder title="HR Reports" icon={BarChart3} />;

/* -------------------------------------------------------------------------- */
/* Credentialing pages                                                        */
/* -------------------------------------------------------------------------- */
// Canonical Credentialing pages now live in
// `src/pages/os/credentialing/CredentialingPages.tsx`. The stale placeholder
// exports that used to live here were removed in Credentialing Pass 2 to
// avoid accidental imports.
