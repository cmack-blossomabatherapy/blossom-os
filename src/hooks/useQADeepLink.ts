import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/**
 * QA Pass 5 — shared deep-link query-param handler.
 *
 * Honors the QA-wide URL conventions:
 *   ?id=AUTH_ID         → open the matching record's drawer / detail panel
 *   ?focus=AUTH_ID      → same as ?id=, but used by "focus / scroll-to" links
 *   ?bcba=BCBA_NAME     → filter the page to that BCBA
 *   ?client=CLIENT      → filter / search the page to that client (id or name)
 *
 * Each setter is optional; callers wire only what their page supports.
 * Resolution runs once per items-load. If a target id cannot be found, a
 * non-blocking toast is surfaced so users know the deep link missed.
 */
export interface QADeepLinkItem {
  id: string;
  clientName?: string | null;
  coordinator?: string | null;
}

export interface UseQADeepLinkOptions<T extends QADeepLinkItem> {
  items: T[];
  loading?: boolean;
  setOpenId?: (id: string | null) => void;
  setQuery?: (q: string) => void;
  setBcbaFilter?: (name: string) => void;
  setClientFilter?: (client: string) => void;
  /** Optional callback once an id-target has been opened (for scroll-into-view). */
  onFocus?: (id: string) => void;
  /**
   * Grouped-page resolvers (QA Pass 6).
   * When present, they translate the incoming deep-link param into the
   * openId that the current page's drawer actually uses (client id, BCBA id,
   * supervision row id, escalation id, etc.). Return `null` to indicate
   * "not found on this page". If a resolver is supplied it takes precedence
   * over the default direct-id match.
   */
  resolveOpenIdForAuth?: (authId: string) => string | null;
  resolveOpenIdForClient?: (clientParam: string) => string | null;
  resolveOpenIdForBcba?: (bcbaParam: string) => string | null;
}

export function useQADeepLink<T extends QADeepLinkItem>(
  opts: UseQADeepLinkOptions<T>,
) {
  const {
    items,
    loading,
    setOpenId,
    setQuery,
    setBcbaFilter,
    setClientFilter,
    onFocus,
    resolveOpenIdForAuth,
    resolveOpenIdForClient,
    resolveOpenIdForBcba,
  } = opts;
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    if (loading) return;
    if (!items || items.length === 0) return;

    const idParam = searchParams.get("id") ?? searchParams.get("focus");
    const bcbaParam = searchParams.get("bcba");
    const clientParam = searchParams.get("client");

    if (!idParam && !bcbaParam && !clientParam) {
      consumed.current = true;
      return;
    }

    let matchedId: string | null = null;
    let missed: string[] = [];

    if (idParam) {
      // Grouped pages: their drawer id is NOT the authorization id
      // (it's a client id, BCBA id, supervision row id, etc). Let the
      // caller translate the auth id to the correct openId.
      const resolved = resolveOpenIdForAuth ? resolveOpenIdForAuth(idParam) : null;
      const found = items.find((i) => i.id === idParam);
      const openTarget = resolved ?? (found ? found.id : null);
      if (openTarget) {
        matchedId = openTarget;
        setOpenId?.(openTarget);
        onFocus?.(openTarget);
      } else {
        missed.push(`record ${idParam}`);
      }
    }

    if (bcbaParam) {
      const exists = items.some(
        (i) => (i.coordinator ?? "").toLowerCase() === bcbaParam.toLowerCase(),
      );
      if (setBcbaFilter) setBcbaFilter(bcbaParam);
      else setQuery?.(bcbaParam);
      // Grouped-BCBA pages: also open the matching BCBA row drawer.
      const bcbaOpenId = resolveOpenIdForBcba ? resolveOpenIdForBcba(bcbaParam) : null;
      if (bcbaOpenId && !matchedId) {
        matchedId = bcbaOpenId;
        setOpenId?.(bcbaOpenId);
        onFocus?.(bcbaOpenId);
      }
      if (!exists) missed.push(`BCBA "${bcbaParam}"`);
    }

    if (clientParam) {
      const exact = items.find(
        (i) =>
          i.id === clientParam ||
          (i.clientName ?? "").toLowerCase() === clientParam.toLowerCase(),
      );
      if (setClientFilter) setClientFilter(clientParam);
      else setQuery?.(clientParam);
      // Grouped-client pages resolve to the client group's drawer id.
      const clientOpenId = resolveOpenIdForClient
        ? resolveOpenIdForClient(clientParam)
        : exact
        ? exact.id
        : null;
      if (clientOpenId && !matchedId) {
        matchedId = clientOpenId;
        setOpenId?.(clientOpenId);
        onFocus?.(clientOpenId);
      } else if (!clientOpenId && !exact) {
        missed.push(`client "${clientParam}"`);
      }
    }

    if (missed.length) {
      toast({
        title: "Deep link partially resolved",
        description: `Could not locate ${missed.join(", ")}.`,
      });
    }

    // Strip handled params so manual filter edits later don't get re-applied.
    const next = new URLSearchParams(searchParams);
    let changed = false;
    for (const key of ["id", "focus", "bcba", "client"]) {
      if (next.has(key)) {
        next.delete(key);
        changed = true;
      }
    }
    if (changed) setSearchParams(next, { replace: true });
    consumed.current = true;
  }, [items, loading, searchParams, setSearchParams, setOpenId, setQuery, setBcbaFilter, setClientFilter, onFocus, toast]);
}

export default useQADeepLink;