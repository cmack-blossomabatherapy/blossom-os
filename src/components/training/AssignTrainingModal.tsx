import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_META, type AppRole } from "@/lib/roles";
import type { LaunchAsset, PendingSop } from "@/lib/academy/launchAssets";

type ScopeKind = "employee" | "department" | "state" | "role";

type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  state: string | null;
  user_id: string | null;
  department_id: string | null;
  status: string | null;
};
type DepartmentRow = { id: string; name: string };
type TrackRow = { id: string; name: string };
type UserRoleRow = { user_id: string; role: string };

/**
 * Assign Training modal — real, persisted assignment entry point.
 *
 * Scope: Employee · Department · State · Role.
 * Persists to `academy_enrollments` (unique on (employee_id, track_id)).
 * Only real employees can be targeted — no free-text trainee/mentor inputs.
 */
export function AssignTrainingModal({
  open,
  onClose,
  presetEmployeeId,
  presetTrackId,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  /** Optional preset — when assigning from the user-management sheet. */
  presetEmployeeId?: string | null;
  presetTrackId?: string | null;
  onAssigned?: () => void;
  // Legacy props kept for back-compat with TrainingControlRoom — unused.
  welcomeAssets?: LaunchAsset[];
  pendingSops?: PendingSop[];
}) {
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [scope, setScope] = useState<ScopeKind>("employee");
  const [trackId, setTrackId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [departmentId, setDepartmentId] = useState<string>("");
  const [stateCode, setStateCode] = useState<string>("");
  const [roleKey, setRoleKey] = useState<AppRole | "">("");
  const [mentorId, setMentorId] = useState<string>("");
  const [assignedState, setAssignedState] = useState<string>("");
  const [path, setPath] = useState<"new_state" | "existing_state">("new_state");
  const [startDate, setStartDate] = useState<string>("");

  // Load data when the dialog opens.
  useEffect(() => {
    if (!open) return;
    void (async () => {
      setLoading(true);
      const [t, e, d, ur] = await Promise.all([
        supabase
          .from("academy_tracks")
          .select("id,name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("employees")
          .select("id,first_name,last_name,job_title,state,user_id,department_id,status")
          .order("first_name"),
        supabase.from("hr_departments").select("id,name").order("name"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      setTracks((t.data as TrackRow[]) ?? []);
      setEmployees(((e.data as EmployeeRow[]) ?? []).filter((x) => x.status !== "terminated" && x.status !== "resigned"));
      setDepartments((d.data as DepartmentRow[]) ?? []);
      setUserRoles((ur.data as UserRoleRow[]) ?? []);
      setLoading(false);
    })();
  }, [open]);

  // Reset selection when dialog opens / preset changes.
  useEffect(() => {
    if (!open) return;
    setScope("employee");
    setSearch("");
    setDepartmentId("");
    setStateCode("");
    setRoleKey("");
    setMentorId("");
    setAssignedState("");
    setPath("new_state");
    setStartDate("");
    setTrackId(presetTrackId ?? "");
    setSelectedIds(new Set(presetEmployeeId ? [presetEmployeeId] : []));
  }, [open, presetEmployeeId, presetTrackId]);

  // Load existing enrollments for the chosen track to show "Already enrolled".
  useEffect(() => {
    if (!open || !trackId) {
      setEnrolledIds(new Set());
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("employee_id")
        .eq("track_id", trackId);
      setEnrolledIds(new Set(((data as { employee_id: string }[]) ?? []).map((r) => r.employee_id)));
    })();
  }, [open, trackId]);

  const employeesById = useMemo(() => {
    const m = new Map<string, EmployeeRow>();
    employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [employees]);

  const rolesByUserId = useMemo(() => {
    const m = new Map<string, Set<string>>();
    userRoles.forEach((r) => {
      if (!m.has(r.user_id)) m.set(r.user_id, new Set());
      m.get(r.user_id)!.add(r.role);
    });
    return m;
  }, [userRoles]);

  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employees
      .filter((e) => {
        if (!q) return true;
        return `${e.first_name} ${e.last_name} ${e.job_title ?? ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
  }, [employees, search]);

  const stateCodes = useMemo(() => {
    const s = new Set<string>();
    employees.forEach((e) => { if (e.state) s.add(e.state); });
    return Array.from(s).sort();
  }, [employees]);

  // Resolve scope into target employee ids (before filtering existing enrollments).
  const resolvedTargetIds = useMemo<string[]>(() => {
    if (scope === "employee") return Array.from(selectedIds);
    if (scope === "department") {
      if (!departmentId) return [];
      return employees.filter((e) => e.department_id === departmentId).map((e) => e.id);
    }
    if (scope === "state") {
      if (!stateCode) return [];
      return employees.filter((e) => e.state === stateCode).map((e) => e.id);
    }
    if (scope === "role") {
      if (!roleKey) return [];
      return employees
        .filter((e) => e.user_id && rolesByUserId.get(e.user_id)?.has(roleKey))
        .map((e) => e.id);
    }
    return [];
  }, [scope, selectedIds, departmentId, stateCode, roleKey, employees, rolesByUserId]);

  const freshTargetIds = useMemo(
    () => resolvedTargetIds.filter((id) => !enrolledIds.has(id)),
    [resolvedTargetIds, enrolledIds],
  );

  const unlinkedTargets = useMemo(
    () => freshTargetIds.map((id) => employeesById.get(id)).filter((e) => e && !e.user_id) as EmployeeRow[],
    [freshTargetIds, employeesById],
  );

  const canSubmit = !!trackId && freshTargetIds.length > 0 && !submitting;

  function toggleEmployee(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    if (!trackId || freshTargetIds.length === 0) return;
    setSubmitting(true);
    const rows = freshTargetIds.map((employee_id) => ({
      employee_id,
      track_id: trackId,
      path,
      assigned_state: assignedState || null,
      mentor_employee_id: mentorId || null,
      ...(startDate ? { start_date: startDate } : {}),
    }));
    const { error } = await supabase
      .from("academy_enrollments")
      .insert(rows as any);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const trackName = tracks.find((t) => t.id === trackId)?.name ?? "training";
    toast.success(`Assigned ${rows.length} ${rows.length === 1 ? "person" : "people"} to ${trackName}.`);
    onAssigned?.();
    onClose();
  }

  const scopeChips: { key: ScopeKind; label: string }[] = [
    { key: "employee", label: "Employee" },
    { key: "department", label: "Department" },
    { key: "state", label: "State" },
    { key: "role", label: "Role" },
  ];
  const { journeys } = useAcademy();
  const [trainee, setTrainee] = useState("");
  const [journeyId, setJourneyId] = useState<string>("");
  const [mentor, setMentor] = useState("");
  const [state, setState] = useState("");
  const [startDate, setStartDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const warnings = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (!trainee.trim())
      list.push({ key: "trainee", label: "Trainee not selected — employee/auth-user link missing." });
    if (!mentor.trim())
      list.push({ key: "mentor", label: "No mentor assigned — pair before week 1." });
    if (!state.trim())
      list.push({ key: "state", label: "No state assigned — required for State Director path." });
    const pendingWelcome = welcomeAssets.filter((a) => a.status !== "linked");
    if (pendingWelcome.length > 0)
      list.push({
        key: "welcome",
        label: `${pendingWelcome.length} welcome asset${pendingWelcome.length === 1 ? "" : "s"} pending — non-blocking, written guidance still works.`,
      });
    if (pendingSops.length > 0)
      list.push({
        key: "sops",
        label: `${pendingSops.length} SOP/resource link${pendingSops.length === 1 ? "" : "s"} pending — non-blocking admin action item.`,
      });
    return list;
  }, [trainee, mentor, state, welcomeAssets, pendingSops]);

  const canConfirm = !!journeyId;

  function reset() {
    setTrainee("");
    setJourneyId("");
    setMentor("");
    setState("");
    setStartDate("");
    setConfirmed(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl" data-testid="assign-training-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <UserPlus className="h-4 w-4" /> Assign training
          </DialogTitle>
          <DialogDescription>
            Enroll real employees into a training path. Scope by employee, department,
            state, or role. Only active employees can be assigned.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* Training path */}
          <div className="space-y-1.5">
            <Label className="text-xs">Training path</Label>
            <Select value={trackId} onValueChange={setTrackId}>
              <SelectTrigger data-testid="assign-track-select">
                <SelectValue placeholder={loading ? "Loading paths…" : "Select a path…"} />
              </SelectTrigger>
              <SelectContent>
                {tracks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scope chips */}
          <div className="space-y-1.5">
            <Label className="text-xs">Assign to</Label>
            <div className="flex flex-wrap gap-1.5" data-testid="assign-scope-chips">
              {scopeChips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setScope(c.key)}
                  data-testid={`assign-scope-${c.key}`}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] transition",
                    scope === c.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {scope === "employee" && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute z-10 left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees…"
                  className="pl-9 h-9"
                  data-testid="assign-employee-search"
                />
              </div>
              <div className="max-h-[28vh] overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40">
                {filteredEmployees.map((e) => {
                  const isEnrolled = !!trackId && enrolledIds.has(e.id);
                  const checked = selectedIds.has(e.id);
                  return (
                    <label
                      key={e.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30",
                        isEnrolled && "opacity-60",
                      )}
                      data-testid={`assign-employee-row-${e.id}`}
                    >
                      <Checkbox
                        checked={checked || isEnrolled}
                        disabled={isEnrolled}
                        onCheckedChange={() => toggleEmployee(e.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{e.first_name} {e.last_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {e.job_title ?? "—"}{e.state ? ` · ${e.state}` : ""}
                        </p>
                      </div>
                      {!e.user_id && (
                        <Badge variant="outline" className="text-[10px]">No login</Badge>
                      )}
                      {isEnrolled && (
                        <Badge variant="secondary" className="text-[10px]">Already enrolled</Badge>
                      )}
                    </label>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No employees match.</p>
                )}
              </div>
            </div>
          )}

          {scope === "department" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue placeholder="Select a department…" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === "state" && (
            <div className="space-y-1.5">
              <Label className="text-xs">State</Label>
              <Select value={stateCode} onValueChange={setStateCode}>
                <SelectTrigger><SelectValue placeholder="Select a state…" /></SelectTrigger>
                <SelectContent>
                  {stateCodes.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === "role" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={roleKey} onValueChange={(v) => setRoleKey(v as AppRole)}>
                <SelectTrigger><SelectValue placeholder="Select a role…" /></SelectTrigger>
                <SelectContent>
                  {ROLE_META.filter((r) => r.group !== "Legacy").map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Mentor (optional)</Label>
              <Select value={mentorId} onValueChange={setMentorId}>
                <SelectTrigger><SelectValue placeholder="Select a mentor…" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.first_name} {e.last_name}{e.job_title ? ` · ${e.job_title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assigned state (optional)</Label>
              <Select value={assignedState} onValueChange={setAssignedState}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {stateCodes.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Path</Label>
              <Select value={path} onValueChange={(v) => setPath(v as "new_state" | "existing_state")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_state">New state</SelectItem>
                  <SelectItem value="existing_state">Existing state</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Start date (optional)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>

          {/* Summary / warnings */}
          <div className="rounded-xl border border-border/70 bg-card p-3 text-[12.5px]" data-testid="assign-summary">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="font-medium">
                {freshTargetIds.length} {freshTargetIds.length === 1 ? "employee" : "employees"} ready to enroll
                {resolvedTargetIds.length !== freshTargetIds.length && (
                  <span className="text-muted-foreground"> · {resolvedTargetIds.length - freshTargetIds.length} already enrolled (skipped)</span>
                )}
              </p>
            </div>
            {unlinkedTargets.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-600" />
                <p className="text-[12px] text-muted-foreground">
                  {unlinkedTargets.length} of these {unlinkedTargets.length === 1 ? "person is" : "people are"} not linked to a Blossom login.
                  The assignment will save, but they won't see it until their employee record is linked to a user account.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canSubmit} data-testid="assign-confirm">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Assign to {freshTargetIds.length || 0}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignTrainingModal;