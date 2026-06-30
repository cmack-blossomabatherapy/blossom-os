/**
 * Lightweight localStorage saved views for the Credentialing module.
 *
 * Each Credentialing page can scope views by its own pageKey, so a saved
 * view on Provider Credentialing does not collide with one on Insurance
 * Credentialing. Values are arbitrary plain objects (filters) — pages own
 * the shape.
 */

const STORAGE_KEY = "blossom-os.credentialing.saved-views.v1";

export interface CredentialingSavedView<T = Record<string, unknown>> {
  id: string;
  pageKey: string;
  name: string;
  filters: T;
  savedAt: number;
}

type AllViews = Record<string, CredentialingSavedView[]>;

function readAll(): AllViews {
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as AllViews) : {};
  } catch {
    return {};
  }
}

function writeAll(views: AllViews) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    window.dispatchEvent(new CustomEvent("credentialing-saved-views-changed"));
  } catch {
    /* ignore */
  }
}

export function listCredViews<T = Record<string, unknown>>(pageKey: string): CredentialingSavedView<T>[] {
  const all = readAll();
  return (all[pageKey] ?? []) as CredentialingSavedView<T>[];
}

export function saveCredView<T = Record<string, unknown>>(
  pageKey: string,
  name: string,
  filters: T,
): CredentialingSavedView<T> {
  const all = readAll();
  const next: CredentialingSavedView<T> = {
    id: `${pageKey}-${Date.now()}`,
    pageKey,
    name: name.trim() || "Untitled view",
    filters,
    savedAt: Date.now(),
  };
  const list = (all[pageKey] ?? []) as CredentialingSavedView[];
  // Replace by name if it already exists
  const without = list.filter((v) => v.name.toLowerCase() !== next.name.toLowerCase());
  all[pageKey] = [...without, next as CredentialingSavedView];
  writeAll(all);
  return next;
}

export function deleteCredView(pageKey: string, id: string) {
  const all = readAll();
  all[pageKey] = (all[pageKey] ?? []).filter((v) => v.id !== id);
  writeAll(all);
}

export function getCredView<T = Record<string, unknown>>(
  pageKey: string,
  id: string,
): CredentialingSavedView<T> | null {
  return (listCredViews<T>(pageKey).find((v) => v.id === id) as CredentialingSavedView<T>) ?? null;
}
