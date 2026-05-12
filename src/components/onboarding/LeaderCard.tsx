import { useEffect, useRef, useState } from "react";
import { Check, MessageCircle, BookOpen, Mic, Square, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Letter {
  greeting: string;
  paragraphs: string[];
  signOff: string[];
}

interface Props {
  name: string;
  role: string;
  initials: string;
  message: string;
  letter?: Letter;
  done: boolean;
  onComplete: () => void;
}

type Speech = "idle" | "playing" | "paused";

export function LeaderCard({ name, role, initials, message, letter, done, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [speech, setSpeech] = useState<Speech>("idle");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech when dialog closes / unmounts
  useEffect(() => {
    if (!open && speech !== "idle") {
      window.speechSynthesis?.cancel();
      setSpeech("idle");
    }
  }, [open, speech]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const fullText = letter
    ? [letter.greeting, ...letter.paragraphs, ...letter.signOff].join(". ")
    : "";

  const startSpeech = () => {
    if (!letter || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(fullText);
    u.rate = 0.95;
    u.pitch = 1;
    // Prefer a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en-US/i.test(v.lang) && /natural|neural|google|samantha|aria/i.test(v.name)) ||
      voices.find((v) => /en-US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (preferred) u.voice = preferred;
    u.onend = () => setSpeech("idle");
    u.onerror = () => setSpeech("idle");
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setSpeech("playing");
  };

  const toggleSpeech = () => {
    if (speech === "idle") return startSpeech();
    if (speech === "playing") { window.speechSynthesis.pause(); setSpeech("paused"); return; }
    window.speechSynthesis.resume(); setSpeech("playing");
  };
  const stopSpeech = () => { window.speechSynthesis.cancel(); setSpeech("idle"); };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-4 sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{role}</p>
          </div>
          <p className="flex items-start gap-1.5 rounded-xl bg-background/70 p-2.5 text-xs italic leading-relaxed text-muted-foreground">
            <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>"{message}"</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {letter && (
              <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Read full letter
              </Button>
            )}
            <Button size="sm" variant={done ? "secondary" : "default"} onClick={onComplete} className={cn("gap-1.5", done && "pointer-events-none")}>
              {done ? <><Check className="h-3.5 w-3.5" /> Marked complete</> : "Mark complete"}
            </Button>
          </div>
        </div>
      </div>

      {letter && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl overflow-hidden p-0">
            {/* Letter */}
            <div className="relative bg-[#fdfaf3] p-0 text-[#2c241a] dark:bg-[#1f1a14] dark:text-[#e8e1d4]">
              {/* Subtle paper texture via gradient */}
              <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(transparent,transparent_27px,rgba(0,0,0,0.04)_28px)]" aria-hidden />
              <div className="relative max-h-[80vh] overflow-y-auto px-8 py-10 sm:px-12 sm:py-14" style={{ fontFamily: '"Georgia","Times New Roman",serif' }}>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-current/10 pb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] opacity-60">A letter from the desk of</p>
                    <p className="text-base font-semibold tracking-wide">Chad Kaufman · CEO / COO</p>
                  </div>
                  {/* Listen button */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={speech === "idle" ? "default" : "secondary"}
                      onClick={toggleSpeech}
                      className="gap-1.5"
                      title={speech === "idle" ? "Listen to this letter" : speech === "playing" ? "Pause" : "Resume"}
                    >
                      {speech === "idle" && <><Mic className="h-3.5 w-3.5" /> Listen</>}
                      {speech === "playing" && <><Pause className="h-3.5 w-3.5" /> Pause</>}
                      {speech === "paused" && <><Play className="h-3.5 w-3.5" /> Resume</>}
                    </Button>
                    {speech !== "idle" && (
                      <Button size="sm" variant="ghost" onClick={stopSpeech} title="Stop">
                        <Square className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <p className="text-lg font-semibold leading-relaxed">{letter.greeting}</p>
                <div className="mt-4 space-y-4 text-[15px] leading-7">
                  {letter.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <div className="mt-8 space-y-0.5 text-[15px] leading-6">
                  {letter.signOff.map((line, i) => (
                    <p key={i} className={cn(i === 0 ? "text-2xl italic" : "text-sm opacity-80", i === 0 && "mb-1")} style={i === 0 ? { fontFamily: '"Brush Script MT","Segoe Script","Lucida Handwriting",cursive' } : undefined}>
                      {line}
                    </p>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-10 flex flex-wrap justify-end gap-2 border-t border-current/10 pt-5">
                  <Button
                    size="sm"
                    onClick={() => { stopSpeech(); onComplete(); setOpen(false); }}
                    className="gap-1.5"
                  >
                    {done ? <><Check className="h-3.5 w-3.5" /> Marked complete</> : "Mark as read"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
