/** CSV building + download used by every primary report and its drilldowns. */

function escapeCell(value: unknown): string {
  if (value == null) return "";
  const s = typeof value === "number" ? String(value) : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
): string {
  const head = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((r) =>
    columns.map((c) => escapeCell(r[c.key])).join(","),
  );
  return [head, ...body].join("\n");
}

export function downloadCsv(
  fileName: string,
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
): void {
  const csv = toCsv(rows, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}