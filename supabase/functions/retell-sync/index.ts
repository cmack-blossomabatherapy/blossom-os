// Manual sync of historical Retell calls using the Retell REST API.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY') ?? ''
const AGENT_ID = 'agent_fb8aaca447d2a6c6703d40d77a'
const MAX_CALLS_PER_SYNC = 50

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
  return {
    retell_call_id: call?.call_id,
    agent_id: call?.agent_id ?? AGENT_ID,
    call_status: call?.call_status ?? null,
    caller_name: custom?.caller_name ?? null,
    caller_type: custom?.caller_type ?? null,
    phone_number: call?.from_number ?? null,
    preferred_callback_time: custom?.preferred_callback_time ?? null,
    state: custom?.state ?? null,
    child_age: custom?.child_age ?? null,
    insurance_provider: custom?.insurance_provider ?? null,
    insurance_type: custom?.insurance_type ?? null,
    reason_for_call: custom?.reason_for_call ?? null,
    call_summary: summary,
    urgency_level: custom?.urgency_level ?? null,
    sentiment,
    call_outcome: outcome,
    needs_intake_follow_up: custom?.needs_intake_follow_up ?? true,
    emergency_flag: custom?.emergency_flag ?? false,
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

  try {
    const res = await fetch('https://api.retellai.com/v2/list-calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter_criteria: { agent_id: [AGENT_ID] },
        limit: MAX_CALLS_PER_SYNC,
        sort_order: 'descending',
      }),
    })

    if (!res.ok) {
      const txt = await res.text()
      console.error('[retell-sync] api error', res.status, txt)
      return json({ error: `Retell API error ${res.status}` }, 502)
    }

    const data = await res.json()
    const calls: any[] = Array.isArray(data) ? data : (data?.calls ?? data?.data ?? [])
    const rows = calls.filter((c) => c?.call_id).map(callToRow)
    if (rows.length === 0) return json({ ok: true, fetched: 0, inserted: 0, skippedExisting: 0 })

    const ids = rows.map((row) => row.retell_call_id)
    const { data: existing, error: existingError } = await supabase
      .from('phone_ai_calls')
      .select('retell_call_id')
      .in('retell_call_id', ids)

    if (existingError) {
      console.error('[retell-sync] existing lookup error', existingError)
      return json({ error: existingError.message }, 500)
    }

    const existingIds = new Set((existing ?? []).map((row: any) => row.retell_call_id))
    const missingRows = rows.filter((row) => !existingIds.has(row.retell_call_id))
    let inserted = 0

    for (const row of missingRows) {
      const { error } = await supabase
        .from('phone_ai_calls')
        .upsert(row, { onConflict: 'retell_call_id', ignoreDuplicates: true })
      if (error) {
        console.error('[retell-sync] insert error', row.retell_call_id, error)
        continue
      }
      inserted += 1
    }

    const result = {
      ok: true,
      fetched: rows.length,
      inserted,
      skippedExisting: rows.length - missingRows.length,
    }
    console.log('[retell-sync] done', result)
    return json(result)
  } catch (e) {
    console.error('[retell-sync] error', e)
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})