import { useEffect, useState } from "react";
import { Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "ios-install-hint-dismissed";

/**
 * iOS-only banner explaining "Add to Home Screen".
 * Required because Web Push on iOS only works for installed PWAs.
 */
export function IOSInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-border bg-card text-card-foreground shadow-lg p-4 sm:max-w-md sm:left-auto sm:right-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-sm">Enable push notifications</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            On iPhone &amp; iPad, push alerts only work after adding Blossom to your Home Screen.
          </p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
            <li className="flex items-center gap-1">
              Tap <Share className="inline h-3.5 w-3.5 mx-0.5" /> Share in Safari
            </li>
            <li className="flex items-center gap-1">
              Choose <Plus className="inline h-3.5 w-3.5 mx-0.5" /> Add to Home Screen
            </li>
            <li>Open Blossom from the new icon</li>
          </ol>
          <Button size="sm" variant="outline" onClick={dismiss} className="mt-1">
            Got it
          </Button>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
