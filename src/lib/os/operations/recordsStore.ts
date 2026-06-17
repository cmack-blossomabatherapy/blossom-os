import { useEffect, useState, useCallback } from "react";

/**
 * Lightweight localStorage-backed record store for operational MVP
 * workspaces (Expiring Auths, Missing Docs, Payer Requirements,
 * Make-Up Sessions, RBT Match Queue). Future-safe shape: each record
 * is a flat object with string fields; future Supabase migration can
 * map directly onto these keys.
 */

export const OPS_STORE_KEYS = {
  expiringAuths: "blossom-os.ops.expiring-auths.v1",
  missingDocs: "blossom-os.ops.missing-docs.v1",
  payerRequirements: "blossom-os.ops.payer-requirements.v1",
  makeUpSessions: "blossom-os.ops.make-up-sessions.v1",
  rbtMatchQueue: "blossom-os.ops.rbt-match-queue.v1",
} as const;

export type OpsStoreKey = (typeof OPS_STORE_KEYS)[keyof typeof OPS_STORE_KEYS];

export type OpsRecord = Record<string, string> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

function read<T extends OpsRecord>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return seed;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : seed;
  } catch {
    return seed;
  }
}

function write<T extends OpsRecord>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    /* noop */
  }
}

export function useOpsRecords<T extends OpsRecord>(key: OpsStoreKey, seed: T[] = []) {
  const [rows, setRows] = useState<T[]>(() => read<T>(key, seed));

  useEffect(() => {
    // ensure seed lands once
    const existing = localStorage.getItem(key);
    if (!existing && seed.length) write(key, seed);
  }, [key, seed]);

  const persist = useCallback((next: T[]) => {
    setRows(next);
    write(key, next);
  }, [key]);

  const create = useCallback((row: Omit<T, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const created = {
      ...(row as object),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T;
    persist([created, ...rows]);
    return created;
  }, [rows, persist]);

  const update = useCallback((id: string, patch: Partial<T>) => {
    const next = rows.map((r) =>
      r.id === id ? ({ ...r, ...patch, updatedAt: new Date().toISOString() } as T) : r,
    );
    persist(next);
  }, [rows, persist]);

  const remove = useCallback((id: string) => {
    persist(rows.filter((r) => r.id !== id));
  }, [rows, persist]);

  return { rows, create, update, remove, replace: persist };
}

export function toCSV<T extends Record<string, unknown>>(rows: T[], columns: { key: keyof T; label: string }[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c.key])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}