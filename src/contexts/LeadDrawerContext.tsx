import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Full-page record migration — the popout Lead drawer has been retired.
 * Every lead click now navigates to the canonical `/leads/:id` record page.
 *
 * This module keeps the historical API surface (`LeadDrawerProvider`,
 * `useLeadDrawer`, `LeadNameLink`) so surviving call sites keep compiling,
 * but `openLead(id)` performs a normal route navigation instead of mounting
 * a Sheet, and no provider renders `LeadDetailDrawer` at runtime anywhere.
 */

type Ctx = { openLead: (id: string) => void; closeLead: () => void; openLeadId: null };

export function LeadDrawerProvider({ children }: { children: ReactNode }) {
  // No provider chrome — the drawer no longer exists. Kept as a passthrough
  // so existing tree wrappers don't need to be unwound.
  return <>{children}</>;
}

export function useLeadDrawer(): Ctx {
  // useNavigate is safe inside React components / hooks under BrowserRouter.
  // Any legacy caller that runs outside a Router falls back to a plain assign.
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try {
    navigate = useNavigate();
  } catch {
    navigate = null;
  }
  return {
    openLeadId: null,
    closeLead: () => {},
    openLead: (id: string) => {
      if (navigate) navigate(`/leads/${encodeURIComponent(id)}`);
      else if (typeof window !== "undefined") window.location.assign(`/leads/${id}`);
    },
  };
}

/**
 * Normal accessible anchor to a lead record. Modifier / middle click and
 * right-click "open in new tab" behave naturally — no `preventDefault`, no
 * drawer interception.
 */
export function LeadNameLink({
  leadId,
  className,
  children,
  title,
}: {
  leadId: string;
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Link to={`/leads/${leadId}`} title={title} className={cn(className)}>
      {children}
    </Link>
  );
}