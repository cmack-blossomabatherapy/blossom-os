import type { OSRole } from "@/lib/os/permissions";

export interface AiAuditEntry {
  id: string;
  ts: string;
  userId?: string | null;
  role: OSRole;
  prompt: string;
  recordsAccessed: string[];
  kbHits: string[];
}

const KEY = "blossom.ai.audit";
const MAX = 200;

function read(): AiAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AiAuditEntry[]) : [];
  } catch { return []; }
}

function write(list: AiAuditEntry[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* ignore */ }
}

export function logAiQuery(entry: Omit<AiAuditEntry, "id" | "ts">): AiAuditEntry {
  const next: AiAuditEntry = {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
    ...entry,
  };
  write([next, ...read()]);
  // eslint-disable-next-line no-console
  console.debug("[ai-audit]", next);
  return next;
}

export function readAiAudit(limit = 50): AiAuditEntry[] {
  return read().slice(0, limit);
}
