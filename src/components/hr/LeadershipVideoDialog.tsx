import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadershipVideo {
  key: string;
  name: string;
  role: string;
  title: string;
  src: string;
  poster?: string;
}

interface Props {
  video: LeadershipVideo | null;
  userId: string | undefined;
  initialPosition: number;
  onOpenChange: (open: boolean) => void;
  onProgress: (key: string, position: number, duration: number, completed: boolean) => void;
}

const SAVE_THROTTLE_MS = 4000;

export function LeadershipVideoDialog({ video, userId, initialPosition, onOpenChange, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef<number>(0);
  const [position, setPosition] = useState(initialPosition || 0);
  const [duration, setDuration] = useState(0);

  // Reset on open
  useEffect(() => {
    if (!video) return;
    setPosition(initialPosition || 0);
    setDuration(0);
    lastSavedRef.current = 0;
  }, [video, initialPosition]);

  // Restore playback position once metadata loads
  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (!el) return;
    setDuration(el.duration || 0);
    if (initialPosition && initialPosition < (el.duration || 0) - 2) {
      try { el.currentTime = initialPosition; } catch { /* noop */ }
    }
  };

  const persist = async (pos: number, dur: number, completed: boolean) => {
    if (!userId || !video) return;
    await supabase
      .from("leadership_video_progress")
      .upsert(
        {
          user_id: userId,
          video_key: video.key,
          position_seconds: Math.round(pos),
          duration_seconds: dur ? Math.round(dur) : null,
          completed,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,video_key" },
      );
    onProgress(video.key, pos, dur, completed);
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    const pos = el.currentTime;
    const dur = el.duration || duration;
    setPosition(pos);
    if (dur && !duration) setDuration(dur);
    const now = Date.now();
    if (now - lastSavedRef.current >= SAVE_THROTTLE_MS) {
      lastSavedRef.current = now;
      const completed = dur > 0 && pos / dur >= 0.95;
      void persist(pos, dur, completed);
    }
  };

  const handleEnded = () => {
    const el = videoRef.current;
    if (!el) return;
    void persist(el.duration || duration, el.duration || duration, true);
  };

  const handlePause = () => {
    const el = videoRef.current;
    if (!el || !video) return;
    const dur = el.duration || duration;
    void persist(el.currentTime, dur, dur > 0 && el.currentTime / dur >= 0.95);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      const el = videoRef.current;
      if (el && video) {
        const dur = el.duration || duration;
        void persist(el.currentTime, dur, dur > 0 && el.currentTime / dur >= 0.95);
      }
    }
    onOpenChange(open);
  };

  const pct = duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0;
  const completed = duration > 0 && position / duration >= 0.95;

  return (
    <Dialog open={!!video} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
        {video && (
          <>
            <DialogHeader className="space-y-1 px-5 pt-5">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                {video.title}
                {completed && (
                  <Badge variant="secondary" className="bg-success/15 text-success">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Watched
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {video.name} · {video.role}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-black">
              <video
                ref={videoRef}
                src={video.src}
                poster={video.poster}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="aspect-video w-full"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPause={handlePause}
              />
            </div>
            <div className="space-y-1.5 px-5 pb-5 pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="text-foreground">{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground">
                Saved automatically — pick up where you left off next time.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}