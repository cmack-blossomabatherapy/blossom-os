import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * A premium responsive sheet that slides up from the bottom on mobile (with a
 * grab handle, rounded top corners, safe-area aware) and slides in from the
 * right on desktop (or whatever `desktopSide` is set to).
 *
 * Drop-in replacement for Sheet + SheetContent.
 */
interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Side to use on >= md screens. Default: "right". */
  desktopSide?: "right" | "left" | "top" | "bottom";
  /** Tailwind classes applied to the desktop sheet content. */
  desktopClassName?: string;
  /** Extra classes appended on mobile. */
  mobileClassName?: string;
  /** Whether to show the mobile drag handle. Default: true. */
  showHandle?: boolean;
}

export function ResponsiveSheet({
  open,
  onOpenChange,
  children,
  desktopSide = "right",
  desktopClassName,
  mobileClassName,
  showHandle = true,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile();
  const side = isMobile ? "bottom" : desktopSide;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          isMobile
            ? cn(
                "max-h-[92dvh] rounded-t-2xl border-x-0 border-b-0 p-0",
                "pb-[env(safe-area-inset-bottom)]",
                mobileClassName,
              )
            : cn("p-0", desktopClassName),
        )}
      >
        {isMobile && showHandle && (
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        )}
        {children}
      </SheetContent>
    </Sheet>
  );
}

export { SheetHeader, SheetTitle, SheetDescription, SheetFooter };