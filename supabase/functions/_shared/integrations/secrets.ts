// Typed env helpers with optional aliases (e.g. SOLOM_API_KEY -> SOLUM_API_KEY).

const ALIASES: Record<string, string[]> = {
  SOLUM_API_KEY: ["SOLOM_API_KEY"],
};

export function getEnv(name: string): string | undefined {
  const direct = Deno.env.get(name);
  if (direct) return direct;
  for (const alt of ALIASES[name] ?? []) {
    const v = Deno.env.get(alt);
    if (v) return v;
  }
  return undefined;
}

export function hasAll(names: string[]): { ok: boolean; missing: string[] } {
  const missing = names.filter((n) => !getEnv(n));
  return { ok: missing.length === 0, missing };
}

export function mask(v: string | undefined | null): string | null {
  if (!v) return null;
  if (v.length <= 6) return "***";
  return `${v.slice(0, 3)}…${v.slice(-3)}`;
}