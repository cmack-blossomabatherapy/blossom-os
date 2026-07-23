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
  const navigate = useNavigate();
  return {
    openLeadId: null,
    closeLead: () => {},
    openLead: (id: string) => navigate(`/leads/${encodeURIComponent(id)}`),
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