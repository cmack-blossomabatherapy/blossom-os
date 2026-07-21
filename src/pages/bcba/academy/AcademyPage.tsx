import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, Circle, PlayCircle, GraduationCap, Wrench, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { BCBA_ACADEMY_SECTIONS, SUPERVISOR_TOOLKIT } from "./config";
import { useMyAcademyProgress, useUpdateAcademyProgress } from "./useAcademy";
import { useBcbaIdentity } from "../useBcbaIdentity";
import { BcbaPreviewBanner } from "../BcbaPreviewBanner";

export default function AcademyPage() {
  const identity = useBcbaIdentity();
  const uid = identity.scopedAuthUserId;
  const readOnly = identity.readOnly;

  const progress = useMyAcademyProgress(uid);
  const upd = useUpdateAcademyProgress();

  const map = useMemo(() => {
    const m = new Map<string, any>();
    (progress.data ?? []).forEach((p: any) => m.set(p.section_key, p));
    return m;
  }, [progress.data]);

  const required = BCBA_ACADEMY_SECTIONS.filter((s) => s.required);
  const optional = BCBA_ACADEMY_SECTIONS.filter((s) => !s.required);

  const reqDone = required.filter((s) => map.get(s.key)?.status === "completed").length;
  const reqPct = required.length > 0 ? Math.round((reqDone / required.length) * 100) : 0;

  const setStatus = async (sectionKey: string, isRequired: boolean, status: "in_progress" | "completed") => {
    if (!uid) return;
    if (readOnly) { toast.info("Read-only in preview mode."); return; }
    try {
      await upd.mutateAsync({
        user_id: uid, section_key: sectionKey, is_required: isRequired,
        status, progress_pct: status === "completed" ? 100 : 50,
      });
      toast.success(status === "completed" ? "Marked complete" : "Marked in progress");
    } catch (e: any) { toast.error(e?.message ?? "Could not save."); }
  };

  const Card1 = ({ s, isRequired }: { s: typeof BCBA_ACADEMY_SECTIONS[number]; isRequired: boolean }) => {
    const p = map.get(s.key);
    const status = p?.status ?? "not_started";
    const Icon = s.icon;
    // Published-content gate: sections without a linked path cannot be "opened",
    // so we disable "Mark complete" until the owner ships the content link.
    const missingContent = !s.path;
    return (
      <Card className="hover:shadow-sm transition">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 text-primary p-2"><Icon className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium truncate">{s.title}</div>
                {isRequired ? (
                  <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5">Required</span>
                ) : (
                  <span className="text-[10px] rounded-full bg-muted text-muted-foreground px-1.5 py-0.5">Optional</span>
                )}
                {missingContent && (
                  <span className="text-[10px] rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.5" title="Owner: Training team">Content pending</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
              <div className="text-[11px] text-muted-foreground mt-1">~{s.estMinutes} min</div>
              <div className="mt-3 flex items-center gap-2">
                {status === "completed" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</span>
                ) : status === "in_progress" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-700"><PlayCircle className="h-3.5 w-3.5" /> In progress</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Circle className="h-3.5 w-3.5" /> Not started</span>
                )}
                <div className="ml-auto flex gap-1">
                  {status !== "completed" && (
                    <>
                      {status === "not_started" && (
                        <Button size="sm" variant="outline" disabled={readOnly} title={readOnly ? "Read-only in preview mode" : undefined} onClick={() => setStatus(s.key, isRequired, "in_progress")}>Start</Button>
                      )}
                      <Button
                        size="sm"
                        disabled={readOnly || missingContent}
                        title={missingContent ? "Owner (Training): publish content before this can be completed" : readOnly ? "Read-only in preview mode" : undefined}
                        onClick={() => setStatus(s.key, isRequired, "completed")}
                      >
                        Mark complete
                      </Button>
                    </>
                  )}
                  {s.path && (
                    <Link to={s.path} className="inline-flex items-center gap-1 text-xs text-primary hover:underline ml-2">
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <BcbaPreviewBanner />
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">BCBA Academy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your operational learning workspace. Required learning is marked distinctly from optional content.
        </p>
      </div>

      <Card className="mb-4 border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="font-medium">Required learning progress</span>
            </div>
            <span className="text-muted-foreground">{reqDone} of {required.length} · {reqPct}%</span>
          </div>
          <Progress value={reqPct} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <Tabs defaultValue="required">
        <TabsList>
          <TabsTrigger value="required">Required</TabsTrigger>
          <TabsTrigger value="optional">Optional</TabsTrigger>
          <TabsTrigger value="toolkit"><Wrench className="h-3.5 w-3.5 mr-1.5" /> Supervisor toolkit</TabsTrigger>
        </TabsList>

        <TabsContent value="required" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {required.map((s) => <Card1 key={s.key} s={s} isRequired />)}
          </div>
        </TabsContent>
        <TabsContent value="optional" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optional.map((s) => <Card1 key={s.key} s={s} isRequired={false} />)}
          </div>
        </TabsContent>
        <TabsContent value="toolkit" className="mt-4">
          <Card className="mb-3 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Supervisor toolkit</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Practical resources you can pull into any supervision or coaching moment.
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SUPERVISOR_TOOLKIT.map((t) => (
              <Card key={t.key} className="hover:shadow-sm transition">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                  {t.href && (
                    <Link to={t.href} className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}