import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, LifeBuoy, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  loadTraineeAssignmentsFor,
  loadRetentionCheckinsFor,
  completeRetentionCheckin,
  createRetentionCheckin,
  deriveCheckinStatus,
  type TraineeAssignmentRow,
  type RetentionCheckin,
} from "@/lib/os/academy/rbtTrainingAcademy";

// This page is intentionally shared between BCBA and Lead/Floater RBT trainers.
// Lead/Floater RBT users see the same page but the "BCBA sign-off" action is
// hidden — enforced client-side here and also by the DB trigger
// `rbt_check_progress_signoff` which rejects signoff_role='bcba' from a
// non-BCBA/clinical actor.

type TraineeCard = {
  userId: string;
  displayName: string;
  email: string | null;
  pathwayName: string | null;
  totalSteps: number;
  completeSteps: number;
  supportNeeded: boolean;
  nextStepTitle: string | null;
};

export default function BcbaMyTraineesPage() {
  const { user, roles } = useAuth();
  const isBcba = roles.some((r) =>
    ["bcba", "clinical_director", "clinical_lead", "admin", "super_admin"].includes(r),
  );
  const [search, setSearch] = useState("");
  const [assignments, setAssignments] = useState<TraineeAssignmentRow[]>([]);
  const [trainees, setTrainees] = useState<TraineeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TraineeCard | null>(null);
  const [params] = useSearchParams();

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await loadTraineeAssignmentsFor(user.id, "trainer");
      setAssignments(rows);
      const ids = Array.from(new Set(rows.map((r) => r.trainee_user_id)));
      if (ids.length === 0) { setTrainees([]); return; }

      const [{ data: emp }, { data: prog }] = await Promise.all([
        (supabase.from("employees") as any)
          .select("auth_user_id,email,first_name,last_name")
          .in("auth_user_id", ids),
        (supabase.from("rbt_pathway_progress" as any) as any)
          .select("employee_id,status,support_needed,pathway_step_id,rbt_pathway_steps(title,order_index,pathway_id)")
          .in("employee_id", ids),
      ]);

      const empMap = new Map<string, any>();
      for (const e of (emp as any[]) ?? []) empMap.set(e.auth_user_id, e);

      const byUser = new Map<string, any[]>();
      for (const p of (prog as any[]) ?? []) {
        const arr = byUser.get(p.employee_id) ?? [];
        arr.push(p);
        byUser.set(p.employee_id, arr);
      }

      const cards: TraineeCard[] = ids.map((uid) => {
        const e = empMap.get(uid);
        const rows = byUser.get(uid) ?? [];
        const complete = rows.filter((r) => r.status === "complete").length;
        const support = rows.some((r) => r.support_needed === true);
        const nextRow = rows
          .filter((r) => r.status !== "complete")
          .sort((a, b) => (a.rbt_pathway_steps?.order_index ?? 0) - (b.rbt_pathway_steps?.order_index ?? 0))[0];
        const pathwayName = rows[0]?.rbt_pathway_steps?.pathway_id ?? null;
        return {
          userId: uid,
          displayName: e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() || e.email : uid.slice(0, 8),
          email: e?.email ?? null,
          pathwayName,
          totalSteps: rows.length,
          completeSteps: complete,
          supportNeeded: support,
          nextStepTitle: nextRow?.rbt_pathway_steps?.title ?? null,
        };
      });
      setTrainees(cards);

      // Optional deep-link: ?traineeId=...
      const preselect = params.get("traineeId");
      if (preselect) {
        const t = cards.find((c) => c.userId === preselect);
        if (t) setSelected(t);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load trainees");
    } finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); /* eslint-disable-line */ }, [user?.id]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return trainees;
    return trainees.filter((t) =>
      [t.displayName, t.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [search, trainees]);

  const counts = useMemo(() => ({
    total: trainees.length,
    support: trainees.filter((t) => t.supportNeeded).length,
  }), [trainees]);

  const roleForActor: "trainer" | "bcba" = isBcba ? "bcba" : "trainer";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Trainees</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Only trainees explicitly assigned to you. Ownership is never inferred from
            CentralReach shared clients or billing rows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          <Button variant="outline" size="sm" onClick={() => void refresh()}>Refresh</Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <Card><CardContent className="pt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Trainees</div>
          <div className="text-2xl font-semibold">{counts.total}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Support needed</div>
          <div className="text-2xl font-semibold flex items-center gap-2">
            {counts.support}{counts.support > 0 && <LifeBuoy className="h-4 w-4 text-amber-600" />}
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Assignment kinds</div>
          <div className="text-sm">
            {["lead_rbt","floater_lead_rbt","assigned_bcba"].map((k) => {
              const n = assignments.filter((a) => a.trainer_kind === k).length;
              return n > 0 ? <span key={k} className="mr-2"><Badge variant="secondary">{k.replace(/_/g," ")}: {n}</Badge></span> : null;
            })}
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Assigned trainees</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
           filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No trainees assigned. Ask a Training Admin to assign you in the Training Academy Admin page.
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.userId}>
                  <button
                    onClick={() => setSelected(t)}
                    className="w-full text-left py-3 flex items-center gap-3 hover:bg-muted/50 rounded-lg px-2 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{t.displayName}</p>
                        {t.supportNeeded && <Badge variant="destructive" className="text-[10px]">Support needed</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.completeSteps}/{t.totalSteps} steps · {t.nextStepTitle ?? "no next step"}
                      </p>
                    </div>
                    <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{
                        width: t.totalSteps ? `${Math.round((t.completeSteps / t.totalSteps) * 100)}%` : "0%",
                      }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {selected && (
        <TraineeDrawer
          trainee={selected}
          actorId={user!.id}
          actorRole={roleForActor}
          onClose={() => setSelected(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function TraineeDrawer({
  trainee, actorId, actorRole, onClose, onChanged,
}: {
  trainee: TraineeCard; actorId: string; actorRole: "trainer" | "bcba";
  onClose: () => void; onChanged: () => Promise<void>;
}) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [checkins, setCheckins] = useState<RetentionCheckin[] | null>(null);

  const load = async () => {
    const [{ data: prog }, ci] = await Promise.all([
      supabase.from("rbt_pathway_progress" as any)
        .select("id,status,support_needed,notes,pathway_step_id,rbt_pathway_steps(title,order_index,metadata,required)")
        .eq("employee_id", trainee.userId)
        .order("pathway_step_id"),
      loadRetentionCheckinsFor(trainee.userId, "trainee"),
    ]);
    const sorted = (prog as any[] ?? []).slice().sort(
      (a, b) => (a.rbt_pathway_steps?.order_index ?? 0) - (b.rbt_pathway_steps?.order_index ?? 0),
    );
    setRows(sorted);
    setCheckins(ci);
  };
  useEffect(() => { void load(); /* eslint-disable-line */ }, [trainee.userId]);

  const scheduleCheckin = async () => {
    const due = new Date(); due.setDate(due.getDate() + 14);
    await createRetentionCheckin({
      trainee_user_id: trainee.userId,
      due_at: due.toISOString(),
      owner_user_id: actorId,
      first_session_at: new Date().toISOString(),
    });
    toast.success("Retention check-in scheduled for +14 days");
    void load();
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>{trainee.displayName}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Pathway progress</h3>
              <Badge variant="secondary">
                {trainee.completeSteps}/{trainee.totalSteps} complete
              </Badge>
            </div>
            {!rows ? <p className="text-xs text-muted-foreground">Loading…</p> : (
              <ul className="space-y-1.5">
                {rows.map((r) => {
                  const step = r.rbt_pathway_steps;
                  const requiresBcba = step?.metadata?.signoff_role === "bcba";
                  const canSign = requiresBcba ? actorRole === "bcba" : true;
                  const done = r.status === "complete";
                  return (
                    <li key={r.id} className="rounded-lg border p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {done ? <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-600 mr-1" /> :
                             r.support_needed ? <AlertTriangle className="inline h-3.5 w-3.5 text-amber-600 mr-1" /> :
                             <Clock className="inline h-3.5 w-3.5 text-muted-foreground mr-1" />}
                            {step?.title ?? "Step"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.status} {requiresBcba && "· BCBA signoff required"}
                          </p>
                        </div>
                        {!done && (
                          <Button size="sm" variant={canSign ? "default" : "outline"} disabled={!canSign}
                            onClick={async () => {
                              await supabase.from("rbt_pathway_progress" as any).update({
                                status: "complete",
                                signoff_by: actorId,
                                signoff_role: requiresBcba ? "bcba" : "lead_rbt",
                                signoff_at: new Date().toISOString(),
                                completed_at: new Date().toISOString(),
                                support_needed: false,
                              }).eq("id", r.id);
                              toast.success("Signed off");
                              await onChanged(); void load();
                            }}>
                            {canSign ? "Sign off" : "BCBA only"}
                          </Button>
                        )}
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.notes}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Two-week retention
              </h3>
              <Button size="sm" variant="outline" onClick={scheduleCheckin}>Schedule (+14d)</Button>
            </div>
            {!checkins ? <p className="text-xs text-muted-foreground">Loading…</p> :
             checkins.length === 0 ? <p className="text-xs text-muted-foreground">No retention check-ins yet.</p> : (
              <ul className="space-y-2">
                {checkins.map((c) => <RetentionRow key={c.id} row={c} onChanged={load} />)}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RetentionRow({ row, onChanged }: { row: RetentionCheckin; onChanged: () => Promise<void> }) {
  const status = deriveCheckinStatus(row);
  const [open, setOpen] = useState(false);
  const [feel, setFeel] = useState(row.overall_feeling ?? "");
  const [conf, setConf] = useState<number | "">(row.confidence_1_5 ?? "");
  const [supervised, setSupervised] = useState<boolean>(row.bcba_supervised ?? false);
  const [family, setFamily] = useState(row.family_barriers ?? "");
  const [bcba, setBcba] = useState(row.bcba_barriers ?? "");
  const [more, setMore] = useState(row.additional_support_needed);
  const [notes, setNotes] = useState(row.additional_support_notes ?? "");
  const save = async () => {
    await completeRetentionCheckin(row.id, {
      overall_feeling: feel || null,
      confidence_1_5: conf === "" ? null : Number(conf),
      bcba_supervised: supervised,
      family_barriers: family || null,
      bcba_barriers: bcba || null,
      additional_support_needed: more,
      additional_support_notes: notes || null,
    });
    toast.success(more ? "Escalated to support routing" : "Check-in completed");
    setOpen(false);
    await onChanged();
  };
  const done = status === "completed" || status === "escalated";
  return (
    <li className="rounded-lg border p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            Due {new Date(row.due_at).toLocaleDateString()}
            <Badge variant={status === "overdue" ? "destructive" : status === "escalated" ? "destructive" : "secondary"} className="ml-2">
              {status}
            </Badge>
          </p>
          {row.completed_at && <p className="text-xs text-muted-foreground">Completed {new Date(row.completed_at).toLocaleDateString()}</p>}
        </div>
        {!done && <Button size="sm" onClick={() => setOpen(true)}>Complete</Button>}
      </div>
      {open && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <Input placeholder="Overall feeling" value={feel} onChange={(e) => setFeel(e.target.value)} />
          <div className="flex gap-2 items-center">
            <span className="text-xs">Confidence (1-5)</span>
            <Input type="number" min={1} max={5} value={conf} onChange={(e) => setConf(e.target.value === "" ? "" : Number(e.target.value))} className="w-20" />
          </div>
          <label className="flex gap-2 items-center text-xs">
            <input type="checkbox" checked={supervised} onChange={(e) => setSupervised(e.target.checked)} />
            BCBA supervised first session
          </label>
          <Textarea rows={2} placeholder="Family barriers" value={family} onChange={(e) => setFamily(e.target.value)} />
          <Textarea rows={2} placeholder="BCBA barriers"   value={bcba}   onChange={(e) => setBcba(e.target.value)} />
          <label className="flex gap-2 items-center text-xs">
            <input type="checkbox" checked={more} onChange={(e) => setMore(e.target.checked)} />
            Additional support needed (will escalate)
          </label>
          {more && <Textarea rows={2} placeholder="Support notes" value={notes} onChange={(e) => setNotes(e.target.value)} />}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={save}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </li>
  );
}