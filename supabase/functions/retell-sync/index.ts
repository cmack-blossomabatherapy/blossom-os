// Manual sync of historical Retell calls using the Retell REST API.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY') ?? ''
const AGENT_ID = 'agent_fb8aaca447d2a6c6703d40d77a'

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

  if (!RETELL_API_KEY) {
    return new Response(JSON.stringify({ error: 'RETELL_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  let total = 0
  let inserted = 0
  let pagination_key: string | undefined

  try {
    for (let i = 0; i < 20; i++) {
      const body: any = {
        filter_criteria: { agent_id: [AGENT_ID] },
        limit: 100,
        sort_order: 'descending',
      }
      if (pagination_key) body.pagination_key = pagination_key

      const res = await fetch('https://api.retellai.com/v2/list-calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const txt = await res.text()
        console.error('[retell-sync] api error', res.status, txt)
        return new Response(JSON.stringify({ error: 'retell api error', status: res.status, body: txt }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const data = await res.json()
      const calls: any[] = Array.isArray(data) ? data : (data?.calls ?? data?.data ?? [])
      if (!calls.length) break

      const rows = calls.filter((c) => c?.call_id).map(callToRow)
      total += rows.length
      // Chunk upserts to avoid statement timeouts on large payloads.
      const CHUNK = 10
      for (let j = 0; j < rows.length; j += CHUNK) {
        const slice = rows.slice(j, j + CHUNK)
        const { error, count } = await supabase
          .from('phone_ai_calls')
          .upsert(slice, { onConflict: 'retell_call_id', count: 'exact' })
        if (error) {
          console.error('[retell-sync] upsert error', error)
          return new Response(JSON.stringify({ error: error.message, inserted, total }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        inserted += count ?? slice.length
      }

      pagination_key = data?.pagination_key
      if (!pagination_key || calls.length < 100) break
    }

    return new Response(JSON.stringify({ ok: true, total, inserted }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[retell-sync] error', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})