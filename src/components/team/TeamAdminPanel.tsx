import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_META, roleLabel, type AppRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Loader2, Search, UserCircle2, Mail, Save, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const TEAM_DEPARTMENTS = ["Exec", "Intake", "Auth", "QA", "Scheduling", "Staffing", "Clinics"];

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  job_title: string | null;
  responsibilities: string | null;
  welcome_sent_at: string | null;
  department: string | null;
  state: string | null;
  clinic: string | null;
  part_of_leadership: boolean | null;
  dashboard_access: string | null;
  active: boolean | null;
}
interface RoleRow {
  user_id: string;
  role: AppRole;
}
interface EmployeeLinkRow {
  id: string;
  user_id: string | null;
}
interface Member {
  user_id: string;
  employee_id: string | null;
  display_name: string;
  email: string;
  job_title: string;
  responsibilities: string;
  welcome_sent_at: string | null;
  roles: AppRole[];
  department: string;
  state: string;
  clinic: string;
  part_of_leadership: boolean;
  dashboard_access: string;
  active: boolean;
}

/** Live admin view of every team member — edit info, roles, and send welcome email. */
export function TeamAdminPanel() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, email, job_title, responsibilities, welcome_sent_at, department, state, clinic, part_of_leadership, dashboard_access, active"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("employees").select("id, user_id").not("user_id", "is", null),
    ]);
    const profiles = (profilesRes.data ?? []) as ProfileRow[];
    const roles = (rolesRes.data ?? []) as RoleRow[];
    const employeeLinks = ((arguments[0] as never) ?? []) as EmployeeLinkRow[];
    const byUser = new Map<string, AppRole[]>();
    roles.forEach((r) => {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r.role);
      byUser.set(r.user_id, list);
    });
    const combined: Member[] = profiles.map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name ?? "(no name)",
      email: p.email ?? "",
      job_title: p.job_title ?? "",
      responsibilities: p.responsibilities ?? "",
      welcome_sent_at: p.welcome_sent_at,
      roles: byUser.get(p.user_id) ?? [],
      department: p.department ?? "",
      state: p.state ?? "",
      clinic: p.clinic ?? "",
      part_of_leadership: !!p.part_of_leadership,
      dashboard_access: p.dashboard_access ?? "department",
      active: p.active ?? true,
    }));
    combined.sort((a, b) => a.display_name.localeCompare(b.display_name));
    setMembers(combined);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        m.display_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.job_title.toLowerCase().includes(q) ||
        m.responsibilities.toLowerCase().includes(q) ||
        m.roles.some((r) => roleLabel(r).toLowerCase().includes(q)),
    );
  }, [members, query]);

  const updateMember = (userId: string, patch: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, ...patch } : m)));
  };

  const toggleRole = async (member: Member, role: AppRole) => {
    if (member.user_id === currentUser?.id && role === "admin" && member.roles.includes("admin")) {
      const adminCount = members.filter((m) => m.roles.includes("admin")).length;
      if (adminCount <= 1) {
        toast.error("Can't remove the last admin");
        return;
      }
    }
    setSavingId(member.user_id);
    const has = member.roles.includes(role);
    if (has) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", member.user_id)
        .eq("role", role);
      if (error) {
        toast.error(error.message);
        setSavingId(null);
        return;
      }
      updateMember(member.user_id, { roles: member.roles.filter((r) => r !== role) });
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: member.user_id, role });
      if (error) {
        toast.error(error.message);
        setSavingId(null);
        return;
      }
      updateMember(member.user_id, { roles: [...member.roles, role] });
    }
    setSavingId(null);
  };

  const saveInfo = async (
    member: Member,
    next: { display_name: string; email: string; job_title: string; responsibilities: string; department: string; state: string; clinic: string; part_of_leadership: boolean; dashboard_access: string; active: boolean },
  ) => {
    setSavingId(member.user_id);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: next.display_name.trim() || null,
        email: next.email.trim() || null,
        job_title: next.job_title.trim() || null,
        responsibilities: next.responsibilities.trim() || null,
        department: next.department.trim() || null,
        state: next.state.trim() || null,
        clinic: next.clinic.trim() || null,
        part_of_leadership: next.part_of_leadership,
        dashboard_access: next.dashboard_access,
        active: next.active,
      })
      .eq("user_id", member.user_id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return false;
    }
    updateMember(member.user_id, {
      display_name: next.display_name.trim() || "(no name)",
      email: next.email.trim(),
      job_title: next.job_title.trim(),
      responsibilities: next.responsibilities.trim(),
      department: next.department.trim(),
      state: next.state.trim(),
      clinic: next.clinic.trim(),
      part_of_leadership: next.part_of_leadership,
      dashboard_access: next.dashboard_access,
      active: next.active,
    });
    toast.success("Saved");
    return true;
  };

  const sendWelcomeMail = async (member: Member) => {
    if (!member.email) {
      toast.error("No email on file for this member");
      return;
    }
    const loginUrl = `${window.location.origin}/auth`;
    const subject = `Welcome to Blossom — your account is ready`;
    const lines = [
      `Hi ${member.display_name.split(" ")[0] || "there"},`,
      ``,
      `Your Blossom account has been created. Sign in here:`,
      `${loginUrl}`,
      ``,
      `Email: ${member.email}`,
      `(You'll be asked to set a new password the first time you sign in.)`,
      ``,
      member.job_title ? `Role: ${member.job_title}` : "",
      member.responsibilities ? `What you'll be working on: ${member.responsibilities}` : "",
      ``,
      `Welcome aboard,`,
      `The Blossom team`,
    ].filter(Boolean);
    const body = lines.join("\n");
    const url = `mailto:${encodeURIComponent(member.email)}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;

    // Mark welcome as sent (informational only — admin still has to actually send from their mail client)
    const { error } = await supabase
      .from("profiles")
      .update({
        welcome_sent_at: new Date().toISOString(),
        welcome_sent_by: currentUser?.id ?? null,
      })
      .eq("user_id", member.user_id);
    if (!error) {
      updateMember(member.user_id, { welcome_sent_at: new Date().toISOString() });
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="p-3 border-b border-border/40 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, title, or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {members.length} member{members.length === 1 ? "" : "s"}
        </span>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="divide-y divide-border/40">
        {filtered.map((m) => (
          <MemberRow
            key={m.user_id}
            member={m}
            onToggleRole={(role) => toggleRole(m, role)}
            onSaveInfo={(next) => saveInfo(m, next)}
            onSendWelcome={() => sendWelcomeMail(m)}
            saving={savingId === m.user_id}
            isCurrentUser={m.user_id === currentUser?.id}
          />
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No members match.</div>
        )}
      </div>
    </div>
  );
}

function MemberRow({
  member,
  onToggleRole,
  onSaveInfo,
  onSendWelcome,
  saving,
  isCurrentUser,
}: {
  member: Member;
  onToggleRole: (role: AppRole) => void;
  onSaveInfo: (next: { display_name: string; email: string; job_title: string; responsibilities: string; department: string; state: string; clinic: string; part_of_leadership: boolean; dashboard_access: string; active: boolean }) => Promise<boolean>;
  onSendWelcome: () => void;
  saving: boolean;
  isCurrentUser: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(member.display_name === "(no name)" ? "" : member.display_name);
  const [draftEmail, setDraftEmail] = useState(member.email);
  const [draftTitle, setDraftTitle] = useState(member.job_title);
  const [draftResp, setDraftResp] = useState(member.responsibilities);
  const [draftDepartment, setDraftDepartment] = useState(member.department);
  const [draftState, setDraftState] = useState(member.state);
  const [draftClinic, setDraftClinic] = useState(member.clinic);
  const [draftLeadership, setDraftLeadership] = useState(member.part_of_leadership);
  const [draftDashboard, setDraftDashboard] = useState(member.dashboard_access);
  const [draftActive, setDraftActive] = useState(member.active);

  // Re-sync draft when member changes (e.g. after refresh)
  useEffect(() => {
    setDraftName(member.display_name === "(no name)" ? "" : member.display_name);
    setDraftEmail(member.email);
    setDraftTitle(member.job_title);
    setDraftResp(member.responsibilities);
    setDraftDepartment(member.department);
    setDraftState(member.state);
    setDraftClinic(member.clinic);
    setDraftLeadership(member.part_of_leadership);
    setDraftDashboard(member.dashboard_access);
    setDraftActive(member.active);
  }, [member.display_name, member.email, member.job_title, member.responsibilities, member.department, member.state, member.clinic, member.part_of_leadership, member.dashboard_access, member.active]);

  const handleSave = async () => {
    const ok = await onSaveInfo({
      display_name: draftName,
      email: draftEmail,
      job_title: draftTitle,
      responsibilities: draftResp,
      department: draftDepartment,
      state: draftState,
      clinic: draftClinic,
      part_of_leadership: draftLeadership,
      dashboard_access: draftDashboard,
      active: draftActive,
    });
    if (ok) setEditing(false);
  };

  const handleCancelEdit = () => {
    setDraftName(member.display_name === "(no name)" ? "" : member.display_name);
    setDraftEmail(member.email);
    setDraftTitle(member.job_title);
    setDraftResp(member.responsibilities);
    setDraftDepartment(member.department);
    setDraftState(member.state);
    setDraftClinic(member.clinic);
    setDraftLeadership(member.part_of_leadership);
    setDraftDashboard(member.dashboard_access);
    setDraftActive(member.active);
    setEditing(false);
  };

  const welcomeLabel = member.welcome_sent_at
    ? `Re-send welcome (sent ${new Date(member.welcome_sent_at).toLocaleDateString()})`
    : "Send welcome email";

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center gap-3"
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <UserCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{member.display_name}</span>
            {member.job_title && (
              <span className="text-[11px] text-muted-foreground">· {member.job_title}</span>
            )}
            {isCurrentUser && (
              <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                You
              </span>
            )}
            {!member.welcome_sent_at && (
              <span className="text-[10px] uppercase tracking-wider text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                No welcome sent
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {member.email && (
              <span className="text-[11px] text-muted-foreground">{member.email}</span>
            )}
            {member.roles.length === 0 && (
              <span className="text-[11px] text-muted-foreground italic">No roles assigned</span>
            )}
            {!member.department && (
              <span className="text-[10px] uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                Department needed
              </span>
            )}
            {member.roles.map((r) => (
              <span
                key={r}
                className="text-[10px] font-medium text-foreground bg-muted px-1.5 py-0.5 rounded"
              >
                {roleLabel(r)}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs text-primary">{open ? "Hide" : "Edit"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 bg-muted/20 border-t border-border/40 space-y-4">
          {/* Info section */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Member info
              </p>
              {!editing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Full name</Label>
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Sarah Martinez"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Email</Label>
                  <Input value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} placeholder="name@blossomaba.com" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Job title</Label>
                  <Input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Intake Coordinator"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Department</Label>
                  <Select value={draftDepartment || "none"} onValueChange={(value) => setDraftDepartment(value === "none" ? "" : value)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select department</SelectItem>
                      {TEAM_DEPARTMENTS.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">State</Label>
                  <Input value={draftState} onChange={(e) => setDraftState(e.target.value)} placeholder="GA" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Clinic</Label>
                  <Input value={draftClinic} onChange={(e) => setDraftClinic(e.target.value)} placeholder="Riverdale" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Dashboard Access</Label>
                  <Select value={draftDashboard} onValueChange={setDraftDashboard}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[["department", "Department-specific"], ["ceo", "CEO & Leadership"], ["intake", "Intake"], ["authorizations", "Authorizations"], ["scheduling", "Scheduling"], ["staffing", "Staffing"], ["clinic", "Clinic"], ["qa", "QA"], ["finance", "Finance"], ["hr", "HR"], ["recruiting", "Recruiting"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 rounded-md border border-border/40 bg-card px-3 py-2 text-xs text-foreground">
                  <Checkbox checked={draftLeadership} onCheckedChange={(checked) => setDraftLeadership(checked === true)} />
                  <span><strong>Part of Leadership</strong><br /><span className="text-muted-foreground">Leadership users can access the CEO & Leadership Dashboard.</span></span>
                </label>
                <label className="flex items-center gap-2 rounded-md border border-border/40 bg-card px-3 py-2 text-xs text-foreground">
                  <Checkbox checked={draftActive} onCheckedChange={(checked) => setDraftActive(checked === true)} />
                  <span><strong>Active</strong><br /><span className="text-muted-foreground">Inactive users remain visible for admin review.</span></span>
                </label>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Responsibilities
                  </Label>
                  <Textarea
                    value={draftResp}
                    onChange={(e) => setDraftResp(e.target.value)}
                    placeholder="What this person owns day-to-day…"
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <InfoLine label="Email" value={member.email || "—"} mono />
                <InfoLine label="Job title" value={member.job_title || "—"} />
                <InfoLine label="Department" value={member.department || "—"} />
                <InfoLine label="State" value={member.state || "—"} />
                <InfoLine label="Clinic" value={member.clinic || "—"} />
                <InfoLine label="Part of Leadership" value={member.part_of_leadership ? "Yes" : "No"} />
                <InfoLine label="Dashboard Access" value={member.dashboard_access || "Department-specific"} />
                <InfoLine label="Status" value={member.active ? "Active" : "Inactive"} />
                <div className="sm:col-span-2">
                  <InfoLine
                    label="Responsibilities"
                    value={member.responsibilities || "—"}
                    multiline
                  />
                </div>
              </dl>
            )}
          </div>

          {/* Roles section */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Assigned roles {saving && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ROLE_META.filter((r) => r.group !== "Legacy").map((r) => {
                const checked = member.roles.includes(r.key);
                return (
                  <label
                    key={r.key}
                    className={cn(
                      "flex items-start gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors",
                      checked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/40 bg-card hover:bg-muted/30",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleRole(r.key)}
                      disabled={saving}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground">{r.label}</span>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {r.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Welcome email — manual only */}
          <div className="rounded-md border border-border/40 bg-card/60 p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">Welcome email</p>
              <p className="text-[11px] text-muted-foreground">
                Opens a draft in your mail app — nothing is sent until you click Send there.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs shrink-0"
              onClick={onSendWelcome}
              disabled={!member.email}
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              {welcomeLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoLine({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-foreground",
          mono && "font-mono text-[12px]",
          multiline && "whitespace-pre-wrap",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
