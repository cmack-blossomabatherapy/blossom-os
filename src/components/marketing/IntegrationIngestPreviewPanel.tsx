import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MARKETING_PAYLOAD_CONTRACTS,
  mapPayload,
  type NormalizedInsert,
} from "@/lib/marketing/integrationPayloadContracts";

/**
 * Marketing/Admin tool: paste a raw vendor payload, see how it will normalize
 * into Marketing operating tables. Does NOT insert data.
 */
export function IntegrationIngestPreviewPanel() {
  const [systemId, setSystemId] = useState<string>(MARKETING_PAYLOAD_CONTRACTS[0]?.id ?? "");
  const [raw, setRaw] = useState<string>("{}");
  const [result, setResult] = useState<NormalizedInsert[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const contract = useMemo(
    () => MARKETING_PAYLOAD_CONTRACTS.find((c) => c.id === systemId),
    [systemId],
  );

  const run = () => {
    setParseError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      setParseError((e as Error).message);
      setResult(null);
      return;
    }
    setResult(mapPayload(systemId, parsed));
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold">Integration ingest preview</div>
        <div className="text-[11.5px] text-muted-foreground">
          Paste a raw vendor payload to preview how it will normalize before wiring the real webhook. Nothing is inserted.
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Select value={systemId} onValueChange={setSystemId}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKETING_PAYLOAD_CONTRACTS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={run}>Preview</Button>
          </div>
          {contract && (
            <div className="text-[11px] text-muted-foreground">
              Target tables: {contract.targetTables.join(", ")}
            </div>
          )}
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="min-h-[200px] font-mono text-[11px]"
            placeholder='{"caller_number":"+14045551212","start_time":"2026-07-01T14:22:00Z"}'
          />
          {parseError && <div className="text-[11px] text-red-600">JSON error: {parseError}</div>}
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-medium">Normalized rows</div>
          {!result && (
            <div className="text-[11px] text-muted-foreground">
              Paste a payload and click Preview to see mapping output.
            </div>
          )}
          {result?.map((r, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-background p-2">
              <div className="mb-1 text-[11px]">
                Target: <code>{r.table}</code>
              </div>
              {r.warnings.length > 0 && (
                <div className="mb-1 text-[11px] text-amber-700">
                  {r.warnings.map((w, j) => <div key={j}>- {w}</div>)}
                </div>
              )}
              <pre className="max-h-56 overflow-auto rounded bg-muted/40 p-2 text-[11px]">
{JSON.stringify(r.row, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
