/**
 * Cursor-paginated, server-side searchable feed for
 * `system_tool_audit_logs`. Designed to stay fast when the table grows
 * to millions of rows: all coarse filters push down to Postgres via
 * PostgREST, and pages are fetched with a `(created_at, id)` keyset
 * cursor instead of `offset`.
 *
 * Filters supported server-side:
 *   - toolArea       -> `tool_area = $1`
 *   - action         -> `action = $1`
 *   - actorQuery     -> exact `actor_user_id` on UUID input, otherwise
 *                       `actor_email ilike %q%`
 *   - recordQuery    -> exact `entity_id` on UUID input, otherwise
 *                       `entity_table ilike %q% or entity_id ilike %q%`
 *   - freeText       -> `.or()` across actor_email/entity_table/
 *                       entity_id/action (text-only; JSON columns are
 *                       still greppable client-side on loaded rows).
 *
 * Reads are RLS-restricted to admins/super_admins.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  SystemToolArea,
  SystemToolAuditLog,
} from "@/hooks/useSystemTools";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyClient = supabase as any;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AuditLogSearchFilters {
  toolArea?: SystemToolArea | "all";
  action?: string | "all";
  /** Email substring or UUID. */
  actorQuery?: string;
  /** Entity id (UUID) or entity_table substring. */
  recordQuery?: string;
  /** Free-text across email/table/id/action. */
  freeText?: string;
  /** Page size for keyset pagination. */
  pageSize?: number;
  /** Debounce for text inputs, ms. */
  debounceMs?: number;
}

interface Cursor {
  created_at: string;
  id: string;
}

export interface UseAuditLogSearchResult {
  rows: SystemToolAuditLog[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

function escapeOrValue(v: string): string {
  // PostgREST `.or()` uses commas and parens as separators — strip them.
  return v.replace(/[(),*]/g, " ").trim();
}

/** Debounce a value with a stable ref, avoiding an extra re-render tick. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useAuditLogSearch(
  filters: AuditLogSearchFilters,
): UseAuditLogSearchResult {
  const pageSize = filters.pageSize ?? 100;
  const debounceMs = filters.debounceMs ?? 250;

  const dActor = useDebounced(filters.actorQuery ?? "", debounceMs);
  const dRecord = useDebounced(filters.recordQuery ?? "", debounceMs);
  const dFree = useDebounced(filters.freeText ?? "", debounceMs);

  const key = useMemo(
    () =>
      JSON.stringify({
        area: filters.toolArea ?? "all",
        action: filters.action ?? "all",
        actor: dActor.trim().toLowerCase(),
        record: dRecord.trim().toLowerCase(),
        free: dFree.trim().toLowerCase(),
        pageSize,
      }),
    [filters.toolArea, filters.action, dActor, dRecord, dFree, pageSize],
  );

  const [rows, setRows] = useState<SystemToolAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<Cursor | null>(null);
  const genRef = useRef(0);

  const buildQuery = useCallback(
    (cursor: Cursor | null) => {
      let q = anyClient
        .from("system_tool_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(pageSize);

      if (filters.toolArea && filters.toolArea !== "all") {
        q = q.eq("tool_area", filters.toolArea);
      }
      if (filters.action && filters.action !== "all") {
        q = q.eq("action", filters.action);
      }

      const actor = dActor.trim();
      if (actor) {
        if (UUID_RE.test(actor)) {
          q = q.eq("actor_user_id", actor);
        } else {
          q = q.ilike("actor_email", `%${actor}%`);
        }
      }

      const record = dRecord.trim();
      if (record) {
        if (UUID_RE.test(record)) {
          q = q.eq("entity_id", record);
        } else {
          const safe = escapeOrValue(record);
          if (safe) {
            q = q.or(
              `entity_table.ilike.%${safe}%,entity_id.ilike.%${safe}%`,
            );
          }
        }
      }

      const free = dFree.trim();
      if (free) {
        const safe = escapeOrValue(free);
        if (safe) {
          q = q.or(
            [
              `actor_email.ilike.%${safe}%`,
              `entity_table.ilike.%${safe}%`,
              `entity_id.ilike.%${safe}%`,
              `action.ilike.%${safe}%`,
            ].join(","),
          );
        }
      }

      if (cursor) {
        // Keyset: strictly older than the last row we returned.
        // `or(a,and(b,c))` = created_at < cursor.created_at
        //                  OR (created_at = cursor.created_at AND id < cursor.id)
        q = q.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
        );
      }

      return q;
    },
    [filters.toolArea, filters.action, dActor, dRecord, dFree, pageSize],
  );

  const loadFirst = useCallback(async () => {
    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    cursorRef.current = null;
    const { data, error: err } = await buildQuery(null);
    if (gen !== genRef.current) return; // stale
    if (err) {
      setError(err.message);
      setRows([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as SystemToolAuditLog[];
    setRows(list);
    setHasMore(list.length === pageSize);
    if (list.length > 0) {
      const last = list[list.length - 1];
      cursorRef.current = { created_at: last.created_at, id: last.id };
    }
    setLoading(false);
  }, [buildQuery, pageSize]);

  const loadMore = useCallback(async () => {
    if (!cursorRef.current || loadingMore || loading) return;
    setLoadingMore(true);
    const gen = genRef.current;
    const { data, error: err } = await buildQuery(cursorRef.current);
    if (gen !== genRef.current) return;
    if (err) {
      setError(err.message);
      setLoadingMore(false);
      return;
    }
    const list = (data ?? []) as SystemToolAuditLog[];
    setRows((prev) => [...prev, ...list]);
    setHasMore(list.length === pageSize);
    if (list.length > 0) {
      const last = list[list.length - 1];
      cursorRef.current = { created_at: last.created_at, id: last.id };
    }
    setLoadingMore(false);
  }, [buildQuery, loading, loadingMore, pageSize]);

  useEffect(() => {
    void loadFirst();
    // key encodes every filter that must reset pagination.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    rows,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh: loadFirst,
  };
}