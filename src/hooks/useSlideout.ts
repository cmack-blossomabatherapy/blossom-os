import { useEffect } from "react";

/**
 * Shared slideout/drawer behaviors used across QA pages:
 *   • close on Escape
 *   • lock body scroll while open
 *
 * Usage:
 *   useSlideout(true, onClose);
 */
export function useSlideout(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);
}