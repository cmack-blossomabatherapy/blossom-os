import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer";
import { cn } from "@/lib/utils";

type Ctx = { openLead: (id: string) => void; closeLead: () => void; openLeadId: string | null };
const LeadDrawerCtx = createContext<Ctx | null>(null);

export function LeadDrawerProvider({ children }: { children: ReactNode }) {
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const value = useMemo<Ctx>(
    () => ({
      openLead: (id: string) => setOpenLeadId(id),
      closeLead: () => setOpenLeadId(null),
      openLeadId,
    }),
    [openLeadId],
  );
  return (
    <LeadDrawerCtx.Provider value={value}>
      {children}
      <LeadDetailDrawer leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
    </LeadDrawerCtx.Provider>
  );
}

export function useLeadDrawer(): Ctx {
  const ctx = useContext(LeadDrawerCtx);
  // Safe fallback: navigate to the route if provider is missing (older surfaces).
  if (!ctx) {
    return {
      openLeadId: null,
      closeLead: () => {},
      openLead: (id: string) => {
        if (typeof window !== "undefined") window.location.assign(`/leads/${id}`);
      },
    };
  }
  return ctx;
}

/**
 * Drop-in replacement for `<Link to={`/leads/${id}`}>`. Opens the shared lead
 * drawer so the user keeps their place on the current page. Falls back to a
 * real link (right-click / cmd-click / new tab still work).
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
  const { openLead } = useLeadDrawer();
  return (
    <Link
      to={`/leads/${leadId}`}
      title={title}
      className={cn(className)}
      onClick={(e) => {
        // Honor modifier keys / middle-click → real navigation / new tab.
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as any).button === 1) return;
        e.preventDefault();
        openLead(leadId);
      }}
    >
      {children}
    </Link>
  );
}