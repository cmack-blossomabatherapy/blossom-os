/**
 * SOP indexer — splits raw SOP text into semantic sections and extracts
 * lightweight tags. Pure client-side; deterministic so re-indexing is safe.
 */

const STOP = new Set([
  "the","a","an","and","or","of","to","in","on","for","is","are","what","how",
  "do","does","with","by","at","from","my","our","their","this","that","i","we",
  "you","be","can","should","when","why","who","it","as","if","but","not","will",
  "have","has","had","was","were","than","then","into","also","may","must","each",
  "any","all","use","used","via","per","up","out","over","under","about","one",
  "two","three",
]);

export interface ParsedSection {
  section: string;
  body: string;
  tags: string[];
  position: number;
}

function cleanLine(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function isHeading(line: string): string | null {
  const t = line.trim();
  if (!t) return null;
  // Markdown headings
  const md = t.match(/^#{1,6}\s+(.+)$/);
  if (md) return cleanLine(md[1]);
  // Numbered headings: "1." / "1.2" / "Section 3:"
  const num = t.match(/^(?:section\s+)?(\d+(?:\.\d+)*)[\s.\-:)]+(.+)$/i);
  if (num && num[2].length < 120) return cleanLine(`${num[1]} ${num[2]}`);
  // Trailing colon style: "Resubmission SLA:"
  if (/^[A-Z][A-Za-z0-9 &/()\-]{2,80}:$/.test(t)) return cleanLine(t.replace(/:$/, ""));
  // ALL CAPS short heading
  if (t.length < 80 && /^[A-Z0-9][A-Z0-9 &/()\-]{2,}$/.test(t) && t.split(" ").length <= 10) {
    return cleanLine(t.replace(/_/g, " "));
  }
  return null;
}

/** Split raw text into sections. Falls back to a single section if no headings. */
export function splitSections(raw: string, fallbackTitle = "Overview"): ParsedSection[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const lines = text.split("\n");
  const buckets: { section: string; lines: string[] }[] = [];
  let current: { section: string; lines: string[] } | null = null;

  for (const line of lines) {
    const heading = isHeading(line);
    if (heading) {
      current = { section: heading, lines: [] };
      buckets.push(current);
      continue;
    }
    if (!current) {
      current = { section: fallbackTitle, lines: [] };
      buckets.push(current);
    }
    current.lines.push(line);
  }

  return buckets
    .map((b, i) => {
      const body = cleanLine(b.lines.join(" "));
      return { section: b.section, body, tags: extractTags(`${b.section} ${body}`), position: i };
    })
    .filter(b => b.body.length >= 20 || buckets.length === 1);
}

/** Top-frequency content tokens (excluding stopwords). */
export function extractTags(text: string, max = 8): string[] {
  const counts = new Map<string, number>();
  text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).forEach(tok => {
    if (!tok || tok.length < 3 || STOP.has(tok)) return;
    counts.set(tok, (counts.get(tok) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([t]) => t);
}

/** Friendly "x ago" relative time. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}