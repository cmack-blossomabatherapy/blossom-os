import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Sparkles, Save, Video, EyeOff, Eye, Check, Compass, RotateCcw, Home, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { ONBOARDING_PHASES } from "@/lib/onboarding/journey";
import { supabase } from "@/integrations/supabase/client";
import { useJourneyOverrides } from "@/hooks/useJourneyOverrides";
import { toast } from "@/hooks/use-toast";

type ModuleDraft = {
  title: string;
  blurb: string;
  video_url: string;
  video_duration: string;
  video_presenter: string;
  hidden: boolean;
};
type PhaseDraft = { title: string; objective: string };
type HomeDraft = { eyebrow: string; title: string; title_highlight: string; objective: string };

export default function JourneyEditor() {
  const { user, roles } = useAuth();
  const { phaseOverrides, moduleOverrides, refresh, loading } = useJourneyOverrides();
  const [activePhase, setActivePhase] = useState<string>(ONBOARDING_PHASES[0].id);
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, PhaseDraft>>({});
  const [modDrafts, setModDrafts] = useState<Record<string, ModuleDraft>>({});
  const [homeDraft, setHomeDraft] = useState<HomeDraft>({ eyebrow: "Your Blossom Journey", title: "Your First 4 Weeks at", title_highlight: "Blossom", objective: "A guided journey through who we are, how we work, and how you'll grow into ownership. Move at your own pace — the rest of the Academy unlocks at the finish line." });
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // Hydrate drafts from base + overrides
  useEffect(() => {
    if (loading) return;
    const ho = phaseOverrides["__home"];
    setHomeDraft({
      eyebrow: ho?.eyebrow ?? "Your Blossom Journey",
      title: ho?.title ?? "Your First 4 Weeks at",
      title_highlight: ho?.title_highlight ?? "Blossom",
      objective: ho?.objective ?? "A guided journey through who we are, how we work, and how you'll grow into ownership. Move at your own pace — the rest of the Academy unlocks at the finish line.",
    });
    const pd: Record<string, PhaseDraft> = {};
    const md: Record<string, ModuleDraft> = {};
    ONBOARDING_PHASES.forEach((p) => {
      const po = phaseOverrides[p.id];
      pd[p.id] = { title: po?.title ?? p.title, objective: po?.objective ?? p.objective };
      p.modules.forEach((m) => {
        const k = `${p.id}:${m.key}`;
        const mo = moduleOverrides[k];
        md[k] = {
          title: mo?.title ?? m.title,
          blurb: mo?.blurb ?? m.blurb,
          video_url: mo?.video_url ?? m.video?.url ?? "",
          video_duration: mo?.video_duration ?? m.video?.duration ?? "",
          video_presenter: mo?.video_presenter ?? m.video?.presenter ?? "",
          hidden: mo?.hidden ?? false,
        };
      });
    });
    setPhaseDrafts(pd);
    setModDrafts(md);
  }, [loading, phaseOverrides, moduleOverrides]);

  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  const phase = useMemo(() => ONBOARDING_PHASES.find((p) => p.id === activePhase)!, [activePhase]);

  const saveHome = async () => {
    setSaving("home");
    const { error } = await supabase
      .from("journey_phase_overrides")
      .upsert({
        phase_id: "__home",
        eyebrow: homeDraft.eyebrow,
        title: homeDraft.title,
        title_highlight: homeDraft.title_highlight,
        objective: homeDraft.objective,
        updated_by: user?.id,
      }, { onConflict: "phase_id" });
    setSaving(null);
    if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Journey home saved", description: "The /onboarding hero updated for everyone." });
    void refresh();
  };

  const savePhase = async () => {
    setSaving(`phase:${phase.id}`);
    const draft = phaseDrafts[phase.id];
    const { error } = await supabase
      .from("journey_phase_overrides")
      .upsert({
        phase_id: phase.id,
        title: draft.title,
        objective: draft.objective,
        updated_by: user?.id,
      }, { onConflict: "phase_id" });
    setSaving(null);
    if (error) { toast({ title: "Couldn't save phase", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Phase saved", description: `${phase.weekLabel} updated for everyone.` });
    void refresh();
  };

  const saveModule = async (moduleKey: string) => {
    const k = `${phase.id}:${moduleKey}`;
    const d = modDrafts[k];
    setSaving(k);
    const { error } = await supabase
      .from("journey_module_overrides")
      .upsert({
        phase_id: phase.id,
        module_key: moduleKey,
        title: d.title,
        blurb: d.blurb,
        video_url: d.video_url || null,
        video_duration: d.video_duration || null,
        video_presenter: d.video_presenter || null,
        hidden: d.hidden,
        updated_by: user?.id,
      }, { onConflict: "phase_id,module_key" });
    setSaving(null);
    if (error) { toast({ title: "Couldn't save module", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Module saved" });
    void refresh();
  };

  const resetModule = async (moduleKey: string) => {
    const { error } = await supabase
      .from("journey_module_overrides")
      .delete()
      .eq("phase_id", phase.id)
      .eq("module_key", moduleKey);
    if (error) { toast({ title: "Couldn't reset", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Module reset to default" });
    void refresh();
  };

  const uploadVideo = async (moduleKey: string, file: File) => {
    const k = `${phase.id}:${moduleKey}`;
    setUploading(k);
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${phase.id}/${moduleKey}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("journey-videos")
      .upload(path, file, { upsert: true, contentType: file.type || undefined, cacheControl: "3600" });
    if (upErr) {
      setUploading(null);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("journey-videos").getPublicUrl(path);
    setModDrafts((s) => ({ ...s, [k]: { ...s[k], video_url: data.publicUrl } }));
    setUploading(null);
    toast({ title: "Video uploaded", description: "Click Save module to apply." });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%)]" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Compass className="h-3.5 w-3.5" /> Welcome to Blossom Editor
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Edit the onboarding journey</h1>
          <p className="max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
            Update phase content, swap in your own welcome videos, and hide modules that aren't ready yet. Changes apply to every staff member instantly.
          </p>
        </div>
      </section>

      <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as typeof activePhase)}>
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="__home" className="gap-1.5 text-xs">
            <Home className="h-3.5 w-3.5" /> Journey home
          </TabsTrigger>
          {ONBOARDING_PHASES.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="gap-1.5 text-xs">
              <p.icon className="h-3.5 w-3.5" /> {p.weekLabel}: {p.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="__home" className="mt-5 space-y-5">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Onboarding landing page hero</h2>
              {phaseOverrides["__home"] && <Badge variant="secondary" className="text-[10px]">Edited</Badge>}
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              This is the hero shown on <span className="font-mono text-foreground">/onboarding</span> — the first thing staff see when they open their journey.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Eyebrow chip</label>
                <Input value={homeDraft.eyebrow} onChange={(e) => setHomeDraft((s) => ({ ...s, eyebrow: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Highlighted word</label>
                <Input value={homeDraft.title_highlight} onChange={(e) => setHomeDraft((s) => ({ ...s, title_highlight: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Title (the highlighted word follows this)</label>
                <Input value={homeDraft.title} onChange={(e) => setHomeDraft((s) => ({ ...s, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Subheading</label>
                <Textarea rows={3} value={homeDraft.objective} onChange={(e) => setHomeDraft((s) => ({ ...s, objective: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={saveHome} disabled={saving === "home"} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Save journey home
              </Button>
            </div>
          </div>
        </TabsContent>

        {ONBOARDING_PHASES.map((p) => {
          const pd = phaseDrafts[p.id];
          if (!pd) return null;
          return (
            <TabsContent key={p.id} value={p.id} className="mt-5 space-y-5">
              {/* Phase metadata */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">{p.weekLabel} — Phase header</h2>
                  {phaseOverrides[p.id] && <Badge variant="secondary" className="text-[10px]">Edited</Badge>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Title</label>
                    <Input value={pd.title} onChange={(e) => setPhaseDrafts((s) => ({ ...s, [p.id]: { ...s[p.id], title: e.target.value } }))} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Objective</label>
                    <Textarea rows={2} value={pd.objective} onChange={(e) => setPhaseDrafts((s) => ({ ...s, [p.id]: { ...s[p.id], objective: e.target.value } }))} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={savePhase} disabled={saving === `phase:${p.id}`} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Save phase
                  </Button>
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-3">
                {p.modules.map((m, i) => {
                  const k = `${p.id}:${m.key}`;
                  const d = modDrafts[k];
                  if (!d) return null;
                  const ModIcon = m.icon;
                  const edited = !!moduleOverrides[k];
                  return (
                    <div key={k} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <ModIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">Module {i + 1}: {m.title}</p>
                            <Badge variant="outline" className="text-[10px] capitalize">{m.kind}</Badge>
                            {edited && <Badge variant="secondary" className="text-[10px]">Edited</Badge>}
                            {d.hidden && <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 text-[10px]"><EyeOff className="mr-1 h-3 w-3" /> Hidden</Badge>}
                          </div>
                          <p className="text-[11px] text-muted-foreground">Key: {m.key}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Visible</span>
                          <Switch checked={!d.hidden} onCheckedChange={(v) => setModDrafts((s) => ({ ...s, [k]: { ...s[k], hidden: !v } }))} />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Title</label>
                          <Input value={d.title} onChange={(e) => setModDrafts((s) => ({ ...s, [k]: { ...s[k], title: e.target.value } }))} />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground">Blurb</label>
                          <Textarea rows={2} value={d.blurb} onChange={(e) => setModDrafts((s) => ({ ...s, [k]: { ...s[k], blurb: e.target.value } }))} />
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                          <Video className="h-3.5 w-3.5 text-primary" /> Video
                          <span className="text-muted-foreground font-normal">— upload a file or paste a URL (MP4, Loom, Vimeo direct)</span>
                        </div>
                        <div className="mb-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
                            {uploading === k ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-primary" />}
                            {uploading === k ? "Uploading…" : "Upload video file"}
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              disabled={uploading === k}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void uploadVideo(m.key, f);
                                e.currentTarget.value = "";
                              }}
                            />
                          </label>
                          {d.video_url && (
                            <span className="ml-3 text-[11px] text-muted-foreground">Current: <a href={d.video_url} target="_blank" rel="noreferrer" className="text-primary underline truncate">file set</a></span>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                          <Input placeholder="https://…" value={d.video_url} onChange={(e) => setModDrafts((s) => ({ ...s, [k]: { ...s[k], video_url: e.target.value } }))} />
                          <Input placeholder="Duration (e.g. ~3 min)" value={d.video_duration} onChange={(e) => setModDrafts((s) => ({ ...s, [k]: { ...s[k], video_duration: e.target.value } }))} />
                          <Input placeholder="Presenter (e.g. Elvis)" value={d.video_presenter} onChange={(e) => setModDrafts((s) => ({ ...s, [k]: { ...s[k], video_presenter: e.target.value } }))} />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        {edited && (
                          <Button size="sm" variant="ghost" onClick={() => resetModule(m.key)} className="gap-1.5 text-muted-foreground">
                            <RotateCcw className="h-3.5 w-3.5" /> Reset to default
                          </Button>
                        )}
                        <Button size="sm" onClick={() => saveModule(m.key)} disabled={saving === k} className="gap-1.5">
                          {saving === k ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />} Save module
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}