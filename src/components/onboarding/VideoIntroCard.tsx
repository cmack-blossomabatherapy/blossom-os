import { useEffect, useState } from "react";
import { Check, PlayCircle, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { acknowledge, hasAcknowledged } from "@/lib/onboarding/storage";

interface Props {
  moduleKey: string;
  title: string;
  description?: string;
  /** Optional video src — when missing we show a beautiful "coming soon" placeholder. */
  videoSrc?: string;
  posterSrc?: string;
  duration?: string;
  presenter?: string;
  done: boolean;
  onComplete: () => void;
}

const watchedKey = (k: string) => `${k}:video-watched`;

export function VideoIntroCard({ moduleKey, title, description, videoSrc, posterSrc, duration, presenter, done, onComplete }: Props) {
  const [, setTick] = useState(0);
  const watched = hasAcknowledged(watchedKey(moduleKey));

  useEffect(() => {
    const r = () => setTick((t) => t + 1);
    window.addEventListener("blossom:onboarding-change", r);
    return () => window.removeEventListener("blossom:onboarding-change", r);
  }, []);

  const markWatched = () => {
    if (!watched) acknowledge(watchedKey(moduleKey));
    if (!done) onComplete();
  };

  return (
    <div className="space-y-3 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary)/0.22),hsl(var(--accent)/0.18)_55%,hsl(var(--primary)/0.10))]">
        {videoSrc ? (
          <video
            src={videoSrc}
            poster={posterSrc}
            controls
            preload="metadata"
            className="h-full w-full bg-black object-cover"
            onEnded={markWatched}
            onPlay={(e) => {
              const v = e.currentTarget as HTMLVideoElement & {
                webkitEnterFullscreen?: () => void;
                webkitRequestFullscreen?: () => void;
              };
              if (document.fullscreenElement) return;
              try {
                if (typeof v.webkitEnterFullscreen === "function") v.webkitEnterFullscreen();
                else if (typeof v.requestFullscreen === "function") void v.requestFullscreen();
                else if (typeof v.webkitRequestFullscreen === "function") v.webkitRequestFullscreen();
              } catch { /* user gesture / browser may block — ignore */ }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.35),transparent_55%),radial-gradient(circle_at_75%_80%,hsl(var(--accent)/0.25),transparent_50%)]" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur">
                <PlayCircle className="h-9 w-9 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Your personal welcome video from Blossom! is being prepared. It will appear right here, ready to play.
              </p>
              <Badge variant="outline" className="mt-1 gap-1 text-[10px] backdrop-blur"><Sparkles className="h-3 w-3 text-primary" /> Coming soon</Badge>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {duration && <Badge variant="secondary" className="text-[10px]">{duration}</Badge>}
            {done && <Badge variant="secondary" className="text-[10px] text-emerald-600"><Check className="mr-0.5 h-3 w-3" /> Watched</Badge>}
          </div>
          {presenter && <p className="mt-0.5 text-[11px] text-muted-foreground">Presented by {presenter}</p>}
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <Button
          size="sm"
          variant={done ? "secondary" : "default"}
          onClick={markWatched}
          className={cn("gap-1.5", done && "text-emerald-600")}
          disabled={done}
        >
          {done ? <><Check className="h-3.5 w-3.5" /> Watched</> : <>I've watched this</>}
        </Button>
      </div>
    </div>
  );
}
