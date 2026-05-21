/**
 * PHI redaction helpers. Patient names/identifiers must NEVER be rendered to
 * the UI. Always pipe display strings through one of these helpers.
 */

function shortHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36).slice(0, 5).toUpperCase().padStart(5, "0");
}

export function redactClient(identifier: string | null | undefined): string {
  if (!identifier) return "Patient #—";
  return `Patient #${shortHash(identifier)}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}