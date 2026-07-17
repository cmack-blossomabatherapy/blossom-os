// Manual sync of historical Retell calls using the Retell REST API.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { classifyAfterHoursCall } from '../_shared/classifyAfterHoursCall.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY') ?? ''
const DEFAULT_AGENT_ID = Deno.env.get('RETELL_AGENT_ID') ?? ''
// Safety cap so a single sync run can't run away. Well above expected volumes.
const MAX_CALLS_PER_SYNC = Number(Deno.env.get('RETELL_MAX_CALLS_PER_SYNC') ?? '5000')
const PAGE_SIZE = Number(Deno.env.get('RETELL_PAGE_SIZE') ?? '500')
const UPSERT_BATCH = 200
// Backfill floor — Retell rollout started 2026-06-18.
const DEFAULT_SINCE_ISO = '2026-06-18T00:00:00Z'

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function pickAnalysis(call: any) {
  const a = call?.call_analysis ?? {}
  const custom = a?.custom_analysis_data ?? {}
  return {
    summary: a?.call_summary ?? null,
    sentiment: a?.user_sentiment ?? null,
    outcome: a?.call_successful != null ? (a.call_successful ? 'successful' : 'unsuccessful') : null,
    custom,
  }
}

function callToRow(call: any) {
  const { summary, sentiment, outcome, custom } = pickAnalysis(call)
  const reason = custom?.reason_for_call ?? null
  const department = classifyAfterHoursCall(reason, { ...custom, call_summary: summary })
  return {
    retell_call_id: call?.call_id,
    agent_id: call?.agent_id ?? DEFAULT_AGENT_ID ?? null,
    call_status: call?.call_status ?? null,
    caller_name: custom?.caller_name ?? null,
    caller_type: custom?.caller_type ?? null,
    phone_number: call?.from_number ?? null,
    preferred_callback_time: custom?.preferred_callback_time ?? null,
    state: custom?.state ?? null,
    child_age: custom?.child_age ?? null,
    insurance_provider: custom?.insurance_provider ?? null,
    insurance_type: custom?.insurance_type ?? null,
    reason_for_call: reason,
    call_summary: summary,
    urgency_level: custom?.urgency_level ?? null,
    sentiment,
    caller_emotion: custom?.caller_emotion ?? null,
    call_outcome: outcome,
    needs_intake_follow_up: custom?.needs_intake_follow_up ?? true,
    emergency_flag: custom?.emergency_flag ?? false,
    department_to_notify: department,
    handling_instructions: custom?.handling_instructions ?? null,
    recording_url: call?.recording_url ?? null,
    transcript: call?.transcript ?? null,
    transcript_object: call?.transcript_object ?? null,
    custom_analysis_data: custom,
    raw_retell_payload: call,
    source: 'sync',
    verification_status: 'api',
    call_started_at: call?.start_timestamp ? new Date(call.start_timestamp).toISOString() : null,
    call_ended_at: call?.end_timestamp ? new Date(call.end_timestamp).toISOString() : null,
    duration_seconds: call?.duration_ms ? Math.round(call.duration_ms / 1000) : null,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!RETELL_API_KEY) {
    return json({ error: 'RETELL_API_KEY not configured' }, 500)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  // Parse optional body — allows callers to override agent filter, cap, or
  // backfill floor without redeploying.
  let bodyAgentId: string | undefined
  let bodyCap: number | undefined
  let bodySince: string | undefined
  try {
    const body = await req.clone().json().catch(() => null) as any
    if (body && typeof body === 'object') {
      if (typeof body.agent_id === 'string' && body.agent_id) bodyAgentId = body.agent_id
      if (typeof body.limit === 'number' && body.limit > 0) bodyCap = body.limit
      if (typeof body.since === 'string' && body.since) bodySince = body.since
    }
  } catch (_) {
    /* ignore */
  }
  const agentFilter = bodyAgentId ?? DEFAULT_AGENT_ID
  const cap = bodyCap ?? MAX_CALLS_PER_SYNC

  // Default `since` = most recent call already stored, else the backfill floor.
  let sinceIso = bodySince ?? DEFAULT_SINCE_ISO
  if (!bodySince) {
    const { data: latest } = await supabase
      .from('phone_ai_calls')
      .select('call_started_at')
      .not('call_started_at', 'is', null)
      .order('call_started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latest?.call_started_at) {
      // Re-fetch 24h of overlap so recently-updated calls get re-classified.
      const t = new Date(latest.call_started_at).getTime() - 24 * 3600 * 1000
      sinceIso = new Date(Math.max(t, Date.parse(DEFAULT_SINCE_ISO))).toISOString()
    }
  }
  const sinceMs = Date.parse(sinceIso)

  // Open a sync run for observability.
  const { data: runRow } = await supabase
    .from('integration_sync_runs')
    .insert({
      integration_id: 'retell',
      run_type: 'manual',
      direction: 'inbound',
      status: 'running',
      metadata: { agent_filter: agentFilter || null, cap, since: sinceIso },
    })
    .select('id')
    .single()
  const runId: string | null = runRow?.id ?? null

  const finishRun = async (
    status: 'success' | 'partial' | 'failed',
    counts: { received?: number; created?: number; updated?: number; failed?: number },
    error?: string,
  ) => {
    if (!runId) return
    await supabase
      .from('integration_sync_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        records_received: counts.received ?? 0,
        records_created: counts.created ?? 0,
        records_updated: counts.updated ?? 0,
        records_failed: counts.failed ?? 0,
        error_message: error ?? null,
      })
      .eq('id', runId)
  }

  try {
    const filter_criteria: Record<string, unknown> = {}
    if (agentFilter) filter_criteria.agent_id = [agentFilter]

    // ---- Paginate through Retell list-calls ----
    let paginationKey: string | undefined
    let fetched = 0
    let inserted = 0
    let updated = 0
    let failed = 0
    let pages = 0
    let oldest: string | null = null
    let newest: string | null = null
    let stop = false

    while (!stop && fetched < cap) {
      const remaining = cap - fetched
      const pageLimit = Math.min(PAGE_SIZE, remaining)
      const requestBody: Record<string, unknown> = {
        filter_criteria,
        limit: pageLimit,
        sort_order: 'descending',
      }
      if (paginationKey) requestBody.pagination_key = paginationKey

      const res = await fetch('https://api.retellai.com/v2/list-calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const txt = await res.text()
        console.error('[retell-sync] api error', res.status, txt)
        await finishRun('failed', { received: fetched, created: inserted, updated, failed }, `Retell API ${res.status}: ${txt.slice(0, 500)}`)
        return json({ error: `Retell API error ${res.status}` }, 502)
      }

      const data = await res.json()
      const calls: any[] = Array.isArray(data) ? data : (data?.calls ?? data?.data ?? [])
      pages += 1

      if (calls.length === 0) break

      // Filter to sinceMs and map to rows.
      const pageRows: ReturnType<typeof callToRow>[] = []
      for (const c of calls) {
        if (!c?.call_id) continue
        const startMs = c?.start_timestamp ? Number(c.start_timestamp) : NaN
        if (Number.isFinite(startMs)) {
          const iso = new Date(startMs).toISOString()
          if (!oldest || iso < oldest) oldest = iso
          if (!newest || iso > newest) newest = iso
          if (startMs < sinceMs) {
            // Sorted descending — once we're older than `since`, stop after this batch.
            stop = true
            continue
          }
        }
        pageRows.push(callToRow(c))
      }
      fetched += pageRows.length

      // Batch upsert
      for (let i = 0; i < pageRows.length; i += UPSERT_BATCH) {
        const batch = pageRows.slice(i, i + UPSERT_BATCH)
        const ids = batch.map((r) => r.retell_call_id)
        const { data: existing } = await supabase
          .from('phone_ai_calls')
          .select('retell_call_id')
          .in('retell_call_id', ids)
        const existingSet = new Set((existing ?? []).map((r: any) => r.retell_call_id))

        const { error } = await supabase
          .from('phone_ai_calls')
          .upsert(batch, { onConflict: 'retell_call_id' })
        if (error) {
          console.error('[retell-sync] upsert error', error)
          failed += batch.length
          continue
        }
        for (const r of batch) {
          if (existingSet.has(r.retell_call_id)) updated += 1
          else inserted += 1
        }
      }

      // Next page
      const nextKey =
        (data?.pagination_key as string | undefined) ??
        (data?.next_pagination_key as string | undefined) ??
        (data?.paginationKey as string | undefined)
      if (!nextKey || calls.length < pageLimit) {
        break
      }
      paginationKey = nextKey
    }

    const result = {
      ok: true,
      fetched,
      inserted,
      updated,
      failed,
      pages,
      oldest,
      newest,
      since: sinceIso,
      cap,
      runId,
    }
    await finishRun(failed > 0 ? 'partial' : 'success', {
      received: fetched,
      created: inserted,
      updated,
      failed,
    })
    console.log('[retell-sync] done', result)
    return json(result)
  } catch (e) {
    console.error('[retell-sync] error', e)
    await finishRun('failed', {}, e instanceof Error ? e.message : String(e))
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})