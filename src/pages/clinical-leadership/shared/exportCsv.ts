import type { ExceptionRow } from "./types";

export function exportRowsToCsv(filename: string, rows: ExceptionRow[]) {
  if (!rows.length) return;
  const headers = [
    "id", "title", "subtitle", "owner", "status", "severity",
    "due_date", "source", "source_date",
  ];
  const metaKeys = new Set<string>();
  rows.forEach((r) => Object.keys(r.meta || {}).forEach((k) => metaKeys.add(k)));
  const metaCols = Array.from(metaKeys);
  const all = [...headers, ...metaCols];
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [
    all.join(","),
    ...rows.map((r) => [
      r.id, r.title, r.subtitle ?? "", r.owner ?? "", r.status ?? "", r.severity ?? "",
      r.dueDate ?? "", r.sourceLabel ?? "", r.sourceDate ?? "",
      ...metaCols.map((k) => (r.meta ?? {})[k] ?? ""),
    ].map(escape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}