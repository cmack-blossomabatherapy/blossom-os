import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { GripHorizontal } from "lucide-react";

/**
 * Draggable horizontal pan rail that scrolls a target container.
 * Click + drag anywhere on the rail to pan the pipeline horizontally.
 */
export function PipelinePanRail({
  targetRef,
  className,
}: {
  targetRef: RefObject<HTMLElement>;
  className?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });
  const [needsScroll, setNeedsScroll] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Sync thumb with target scroll
  useEffect(() => {
    const el = targetRef.current;
    const rail = railRef.current;
    if (!el || !rail) return;
    const update = () => {
      const railW = rail.clientWidth;
      const visible = el.clientWidth;
      const total = el.scrollWidth;
      if (total <= visible + 4) {
        setNeedsScroll(false);
        return;
      }
      setNeedsScroll(true);
      const ratio = visible / total;
      const width = Math.max(48, railW * ratio);
      const left = (el.scrollLeft / (total - visible)) * (railW - width);
      setThumb({ left, width });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(rail);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [targetRef]);

  // Drag-to-pan handler
  useEffect(() => {
    if (!dragging) return;
    const el = targetRef.current;
    const rail = railRef.current;
    if (!el || !rail) return;

    const railRect = rail.getBoundingClientRect();
    const visible = el.clientWidth;
    const total = el.scrollWidth;
    const railW = railRect.width;
    const thumbW = Math.max(48, railW * (visible / total));
    const maxScroll = total - visible;
    const maxThumbLeft = railW - thumbW;

    const onMove = (e: MouseEvent) => {
      // Center thumb under cursor
      const x = e.clientX - railRect.left - thumbW / 2;
      const clamped = Math.max(0, Math.min(maxThumbLeft, x));
      el.scrollLeft = (clamped / maxThumbLeft) * maxScroll;
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, targetRef]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = targetRef.current;
    const rail = railRef.current;
    if (!el || !rail) return;
    e.preventDefault();
    const railRect = rail.getBoundingClientRect();
    const visible = el.clientWidth;
    const total = el.scrollWidth;
    const railW = railRect.width;
    const thumbW = Math.max(48, railW * (visible / total));
    const maxScroll = total - visible;
    const maxThumbLeft = railW - thumbW;
    const x = e.clientX - railRect.left - thumbW / 2;
    const clamped = Math.max(0, Math.min(maxThumbLeft, x));
    el.scrollLeft = (clamped / maxThumbLeft) * maxScroll;
    setDragging(true);
  };

  if (!needsScroll) return null;

  return (
    <div
      className={cn(
        "mt-2 rounded-full border border-border/60 bg-muted/40 backdrop-blur-sm",
        "h-5 relative select-none cursor-grab active:cursor-grabbing",
        dragging && "ring-2 ring-primary/30",
        className,
      )}
      ref={railRef}
      onMouseDown={onMouseDown}
      title="Drag to pan the pipeline"
      role="scrollbar"
      aria-orientation="horizontal"
    >
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-primary/70 hover:bg-primary transition-colors",
          "flex items-center justify-center text-primary-foreground",
          dragging && "bg-primary",
        )}
        style={{ left: thumb.left, width: thumb.width }}
      >
        <GripHorizontal className="h-2.5 w-2.5 opacity-80" />
      </div>
    </div>
  );
}