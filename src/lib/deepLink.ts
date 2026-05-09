import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export interface DeepLinkParams {
  focus?: string;     // record id or slug to open
  tab?: string;       // pre-selected tab on the destination
  action?: string;    // quick action to invoke once
  q?: string;         // pre-filled search/query
  sop?: string;       // SOP title (SOP Intelligence)
  run?: string;       // payroll run id
  queue?: string;     // queue key (auth dashboard)
  kpi?: string;       // active KPI tile (auth dashboard)
  alert?: string;     // alert id that originated the deep link
  task?: string;      // task id to scroll to / highlight
  flag?: string;      // compliance flag id to scroll to / highlight
  cycle?: string;     // reauth cycle id to scroll to / highlight
}

/** Read deep-link parameters from the current URL. Stable identity per change. */
export function useDeepLink(): DeepLinkParams {
  const [params] = useSearchParams();
  return useMemo(() => {
    const out: DeepLinkParams = {};
    for (const k of ["focus","tab","action","q","sop","run","queue","kpi","alert","task","flag","cycle"] as const) {
      const v = params.get(k);
      if (v) (out as Record<string, string>)[k] = v;
    }
    return out;
  }, [params]);
}

/**
 * Removes the listed keys from the current URL after they've been consumed,
 * so the deep-link doesn't keep firing on re-render or back-navigation.
 */
export function useConsumeDeepLink(keys: (keyof DeepLinkParams)[] = ["focus","tab","action","q","sop","run","queue","kpi","alert","task","flag","cycle"]) {
  const [params, setParams] = useSearchParams();
  const consumed = useRef(false);
  useEffect(() => {
    if (consumed.current) return;
    let touched = false;
    const next = new URLSearchParams(params);
    for (const k of keys) {
      if (next.has(k)) { next.delete(k); touched = true; }
    }
    if (touched) {
      consumed.current = true;
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Scrolls the element with `[data-deeplink-id="<id>"]` into view and briefly
 * flashes it. Pass the id you want to highlight; pass `null`/`undefined` to no-op.
 * Re-runs whenever `id` or `ready` changes (use `ready` to wait for data load).
 */
export function useDeepLinkHighlight(id: string | null | undefined, ready: boolean = true) {
  useEffect(() => {
    if (!id || !ready) return;
    // wait a tick so the destination tab/list has rendered
    const t = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-deeplink-id="${CSS.escape(id)}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("deeplink-flash");
      window.setTimeout(() => el.classList.remove("deeplink-flash"), 2200);
    }, 80);
    return () => window.clearTimeout(t);
  }, [id, ready]);
}