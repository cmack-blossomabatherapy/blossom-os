import type { InspectionResult, ParsedFile } from "./types";
import { inverseMapping, suggestColumnMappings } from "./mapper";
import { ALL_CANONICAL_FIELDS } from "./types";

/**
 * Inspect a single parsed CSV: build suggested mapping, list detected
 * canonical fields, and surface missing ones.
 */
export function inspectFile(file: ParsedFile): InspectionResult {
  const mapping = suggestColumnMappings(file.headers);
  const detected = inverseMapping(mapping);
  const missing = ALL_CANONICAL_FIELDS.filter(f => !detected[f]);
  return {
    fileName: file.fileName,
    detected,
    missing,
    dateRange: file.dateRange ?? null,
    rowCount: file.rowCount,
    columnCount: file.headers.length,
    mapping,
  };
}