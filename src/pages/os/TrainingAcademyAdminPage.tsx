import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  loadTrainingConfig,
  loadOwnerAssignments,
  loadPathways,
  loadStepsFor,
  upsertOwnerAssignment,
  upsertTrainingConfig,
  upsertTraineeAssignment,
  validateBands,
  classifyDevelopingScore,
  type OwnerAssignmentRow,
  type PathwaySummary,
  type StepSummary,
  type DevelopingBand,
  type TrainerKind,
} from "@/lib/os/academy/rbtTrainingAcademy";

const ADMIN_ROLES = new Set([
  "admin", "super_admin", "training_admin", "hr", "hr_admin", "operations_leadership",
]);

type UserRow = { id: string; email: string | null; full_name: string | null };

function useUsers() {
  const [rows, setRows] = useState<UserRow[]>([]);
  useEffect(() => {
    void supabase
      .from("employees")
      .select("auth_user_id,email,first_name,last_name")
      .not("auth_user_id", "is", null)
      .order("last_name")
      .then(({ data }) => {
        setRows(
          ((data as any[]) ?? []).map((r) => ({
            id: r.auth_user_id,
            email: r.email,
            full_name: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || r.email,
          })),
        );
      });
  }, []);
  return rows;
}

export default function TrainingAcademyAdminPage() {
  const { roles } = useAuth();
  const isAdmin = roles.some((r) => ADMIN_ROLES.has(r));

  const [owners, setOwners] = useState<OwnerAssignmentRow[]>([]);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [pathways, setPathways] = useState<PathwaySummary[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepSummary[] | null>(null);
  const [busy, setBusy] = useState(false);
  const users = useUsers();

  const refresh = async () => {
    setBusy(true);
    try {
      const [o, c, p] = await Promise.all([
        loadOwnerAssignments(),
        loadTrainingConfig(),
        loadPathways(),
      ]);
      setOwners(o);
      setConfig(c);
      setPathways(p);
      if (!selectedPathway && p.length) setSelectedPathway(p[0].id);
    } finally { setBusy(false); }
  };
  useEffect(() => { void refresh(); /* eslint-disable-line */ }, []);
  useEffect(() => {
    if (!selectedPathway) return;
    void loadStepsFor(selectedPathway).then(setSteps);
  }, [selectedPathway]);

  const unassignedOwners = useMemo(() => owners.filter((o) => !o.user_id), [owners]);
  const aliasPathways = useMemo(() => pathways.filter((p) => p.alias_of_key), [pathways]);

  if (!isAdmin) {
    return (
      <OSShell><div className="p-8 text-sm text-muted-foreground">
        Training Academy administration is restricted to Admin, Training Admin, HR, and Operations Leadership.
      </div></OSShell>
    );
  }

  return (
    <OSShell>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Training Academy — Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Owner resolution, thresholds, curriculum diagnostics, and trainee assignments for the RBT Training Academy.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        <DiagnosticsBanner
          unassignedOwners={unassignedOwners.length}
          aliasCount={aliasPathways.length}
        />

        <Tabs defaultValue="owners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="owners">Owners</TabsTrigger>
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="assignments">Trainee assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="owners">
            <OwnersTab owners={owners} users={users} onSaved={refresh} />
          </TabsContent>

          <TabsContent value="thresholds">
            <ThresholdsTab config={config} onSaved={refresh} />
          </TabsContent>

          <TabsContent value="curriculum">
            <CurriculumTab
              pathways={pathways}
              selected={selectedPathway}
              onSelect={setSelectedPathway}
              steps={steps}
              owners={owners}
            />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab users={users} pathways={pathways} onSaved={refresh} />
          </TabsContent>
        </Tabs>
      </div>
    </OSShell>
  );
}

function DiagnosticsBanner({ unassignedOwners, aliasCount }: { unassignedOwners: number; aliasCount: number }) {
  if (unassignedOwners === 0 && aliasCount === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        All named owners are resolved to a real user.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      {unassignedOwners > 0 && <span>{unassignedOwners} owner slot(s) unassigned.</span>}
      {aliasCount > 0 && <span className="ml-2">{aliasCount} pathway(s) exist as transparent aliases.</span>}
    </div>
  );
}

function OwnersTab({
  owners, users, onSaved,
}: {
  owners: OwnerAssignmentRow[]; users: UserRow[]; onSaved: () => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Named owners</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {owners.map((o) => (
          <div key={o.owner_key} className="rounded-xl border p-3 flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{o.label}</p>
              {o.description && <p className="text-xs text-muted-foreground mt-0.5">{o.description}</p>}
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-2">
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm min-w-[220px]"
                defaultValue={o.user_id ?? ""}
                onChange={async (e) => {
                  try {
                    await upsertOwnerAssignment(o.owner_key, e.target.value || null);
                    toast.success("Owner updated");
                    await onSaved();
                  } catch (err: any) { toast.error(err.message ?? "Save failed"); }
                }}
              >
                <option value="">— Unassigned —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} · {u.email}</option>
                ))}
              </select>
              {!o.user_id && <Badge variant="destructive">Unassigned</Badge>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ThresholdsTab({ config, onSaved }: { config: Record<string, unknown>; onSaved: () => Promise<void> }) {
  const initial = (config.developing_rbt_bands as DevelopingBand[]) ?? [];
  const [bands, setBands] = useState<DevelopingBand[]>(initial);
  useEffect(() => { setBands(initial); /* eslint-disable-next-line */ }, [JSON.stringify(initial)]);
  const check = validateBands(bands);
  const [testScore, setTestScore] = useState(45);
  const branch = classifyDevelopingScore(testScore, bands);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Competency score bands (0–60)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Bands must be contiguous and non-overlapping. Lower band wins on any conflict.
        </p>
        {bands.map((b, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">
            <Input type="number" value={b.min}
              onChange={(e) => setBands(bands.map((x, j) => j === i ? { ...x, min: Number(e.target.value) } : x))} />
            <Input type="number" value={b.max}
              onChange={(e) => setBands(bands.map((x, j) => j === i ? { ...x, max: Number(e.target.value) } : x))} />
            <select className="h-9 rounded-md border bg-background px-2 text-sm col-span-2"
              value={b.action}
              onChange={(e) => setBands(bands.map((x, j) => j === i ? { ...x, action: e.target.value as any } : x))}>
              <option value="repeat_lead_session">Repeat Lead session + re-evaluate</option>
              <option value="staff_case_lead_first_session">Staff case + Lead attends full first session</option>
              <option value="staff_case_bcba_first_session">Staff case + BCBA supervises first session</option>
            </select>
          </div>
        ))}
        {!check.ok && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            {check.error}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span>Test score:</span>
          <Input type="number" className="w-24" value={testScore} onChange={(e) => setTestScore(Number(e.target.value))} />
          <span className="text-muted-foreground">→</span>
          <Badge variant={branch ? "secondary" : "destructive"}>{branch?.action ?? "no band"}</Badge>
        </div>
        <Button disabled={!check.ok} onClick={async () => {
          try {
            await upsertTrainingConfig("developing_rbt_bands", bands);
            toast.success("Thresholds saved");
            await onSaved();
          } catch (e: any) { toast.error(e.message ?? "Save failed"); }
        }}>Save thresholds</Button>
      </CardContent>
    </Card>
  );
}

function CurriculumTab({
  pathways, selected, onSelect, steps, owners,
}: {
  pathways: PathwaySummary[]; selected: string | null;
  onSelect: (id: string) => void; steps: StepSummary[] | null;
  owners: OwnerAssignmentRow[];
}) {
  const ownerMap = new Map(owners.map((o) => [o.owner_key, o]));
  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-base">Pathways</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {pathways.map((p) => {
            const active = selected === p.id;
            return (
              <button key={p.id} onClick={() => onSelect(p.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.step_count} step{p.step_count === 1 ? "" : "s"}
                  {p.alias_of_key && <> · alias → {p.alias_of_key}</>}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Steps</CardTitle></CardHeader>
        <CardContent>
          {!steps ? <p className="text-sm text-muted-foreground">Loading…</p> : steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No steps defined. Aliases inherit no steps by design; users are routed to the aliased pathway.
            </p>
          ) : (
            <ol className="space-y-2">
              {steps.map((s) => {
                const owner = s.metadata?.owner_key ? ownerMap.get(s.metadata.owner_key as string) : null;
                return (
                  <li key={s.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.order_index}. {s.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.kind} · {s.delivery_mode ?? "—"} · ~{s.estimated_days ?? 0}d
                          {s.metadata?.event_kind ? ` · ${s.metadata.event_kind}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">{owner?.label ?? "no owner"}</p>
                        {owner && !owner.user_id && <Badge variant="destructive" className="text-[10px]">Unassigned</Badge>}
                        {s.required && <Badge variant="secondary" className="ml-1 text-[10px]">Required</Badge>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentsTab({
  users, pathways, onSaved,
}: { users: UserRow[]; pathways: PathwaySummary[]; onSaved: () => Promise<void> }) {
  const canonicalPathways = pathways.filter((p) => !p.alias_of_key);
  const [trainee, setTrainee] = useState(""); const [trainer, setTrainer] = useState("");
  const [kind, setKind] = useState<TrainerKind>("lead_rbt");
  const [pathway, setPathway] = useState("");
  const submit = async () => {
    if (!trainee || !trainer) return;
    try {
      await upsertTraineeAssignment({
        trainee_user_id: trainee, trainer_user_id: trainer, trainer_kind: kind,
        pathway_id: pathway || null,
      });
      toast.success("Assignment saved");
      await onSaved();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Assign a trainer / BCBA to a trainee</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Assignments are explicit. Trainer/BCBA scope is never inferred from CentralReach shared clients or billing rows.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={trainee} onChange={(e) => setTrainee(e.target.value)}>
            <option value="">— Trainee —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={trainer} onChange={(e) => setTrainer(e.target.value)}>
            <option value="">— Trainer / BCBA —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value as TrainerKind)}>
            <option value="lead_rbt">Lead RBT (evaluate; no BCBA signoff)</option>
            <option value="floater_lead_rbt">Floater/Traveling Lead RBT</option>
            <option value="assigned_bcba">Assigned BCBA (clinical signoff)</option>
          </select>
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={pathway} onChange={(e) => setPathway(e.target.value)}>
            <option value="">— Pathway (optional) —</option>
            {canonicalPathways.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Button onClick={submit} disabled={!trainee || !trainer}>Save assignment</Button>
      </CardContent>
    </Card>
  );
}