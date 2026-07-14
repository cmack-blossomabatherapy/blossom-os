import { useEffect, useMemo, useState } from "react";
import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { useOSRole } from "@/contexts/OSRoleContext";
import { isVisibleToRole, type Resource } from "@/lib/resources/resourceData";
import { fileTypeLabel, isVideoResource } from "@/lib/resources/librarySections";
import { resolveResourceOpenUrl } from "@/lib/resources/resourceStorage";
import { Input } from "@/components/ui/input";
import { PlayCircle, Search, Video } from "lucide-react";
import { cleanResourceTitle, resourceDisplayDescription } from "@/lib/resources/resourceDisplay";
import { cn } from "@/lib/utils";

export default function ResourceLibraryVideos() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Resource | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const videos = useMemo(
    () => resources
      .filter((r) => isVisibleToRole(r, role, activeState))
      .filter(isVideoResource),
    [resources, role, activeState],
  );
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return videos;
    return videos.filter((r) => (r.title + " " + (r.description ?? "")).toLowerCase().includes(needle));
  }, [videos, q]);

  useEffect(() => {
    if (!selected) { setSignedUrl(null); return; }
    let cancelled = false;
    (async () => {
      const u = await resolveResourceOpenUrl(selected);
      if (!cancelled) setSignedUrl(u);
    })();
    return () => { cancelled = true; };
  }, [selected]);

  useEffect(() => {
    if (!selected && filtered[0]) setSelected(filtered[0]);
  }, [filtered, selected]);

  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Video walkthroughs</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
            Recorded walkthroughs and screen captures assigned to your role. Playback uses a secure session link.
          </p>
        </header>
        <LibraryTabs />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            {selected ? (
              <div className="space-y-3">
                {signedUrl ? (
                  <video
                    key={selected.id}
                    src={signedUrl}
                    controls
                    className="aspect-video w-full rounded-xl bg-black"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/40 text-sm text-muted-foreground">
                    {loading ? "Loading…" : "Preparing secure playback…"}
                  </div>
                )}
                <div>
                  <h2 className="text-[15px] font-semibold">{cleanResourceTitle(selected.title)}</h2>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{resourceDisplayDescription(selected)}</p>
                </div>
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 text-center text-sm text-muted-foreground">
                <Video className="h-8 w-8" />
                {loading ? "Loading videos…" : "No videos are assigned to this role yet."}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos…" className="h-10 rounded-xl pl-9" />
            </div>
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {filtered.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-xl border p-3 text-left transition",
                    selected?.id === v.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-card/70 hover:bg-muted",
                  )}
                >
                  <PlayCircle className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium">{cleanResourceTitle(v.title)}</div>
                    <div className="text-[11px] text-muted-foreground">{fileTypeLabel(v)}</div>
                  </div>
                </button>
              ))}
              {!loading && filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-[12px] text-muted-foreground">
                  No matching videos.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OSShell>
  );
}
